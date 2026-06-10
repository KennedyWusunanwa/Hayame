import "server-only";
import { connect } from "node:http2";
import { createSign } from "node:crypto";
import {
  type NotificationPreferenceKey,
  getUsersAllowedForPreference,
} from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PushDataValue = string | number | boolean | null | undefined;

type PushConfig = {
  teamId: string;
  keyId: string;
  privateKey: string;
  topic: string;
  useSandbox: boolean;
};

type FcmConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

type ApnsSendResult = {
  ok: boolean;
  statusCode: number;
  reason: string | null;
};

type FcmSendResult = {
  ok: boolean;
  statusCode: number;
  reason: string | null;
};

type PushSendInput = {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, PushDataValue>;
  adminClient?: any;
  collapseId?: string;
  preferenceKey?: NotificationPreferenceKey | null;
  notificationCategory?: string | null;
};

type CachedJwt = {
  token: string;
  expiresAt: number;
  cacheKey: string;
};

type PushSendResult = {
  attempted: number;
  delivered: number;
  cleanedUpTokens: number;
  skipped: boolean;
  reason?: string;
};

type BroadcastPushInput = Omit<PushSendInput, "userIds">;

const APNS_PRODUCTION_HOST = "api.push.apple.com";
const APNS_SANDBOX_HOST = "api.sandbox.push.apple.com";
const INVALID_TOKEN_REASONS = new Set([
  "BadDeviceToken",
  "DeviceTokenNotForTopic",
  "Unregistered",
]);
// FCM HTTP v1 error status codes that indicate a stale/invalid token
const INVALID_FCM_TOKEN_REASONS = new Set([
  "UNREGISTERED",
  "INVALID_ARGUMENT",
]);
const MESSAGE_FALLBACK = "You have a new notification.";

let cachedJwt: CachedJwt | null = null;
let cachedFcmToken: { token: string; expiresAt: number } | null = null;

function normalizeEnvValue(value: string | undefined | null) {
  return value?.trim() ?? "";
}

function isPlaceholderValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "your_apple_team_id" || normalized === "your_apns_key_id")
    return true;
  if (normalized.includes("your_apns_p8_key")) return true;
  if (normalized.includes("replace_me") || normalized.includes("placeholder"))
    return true;
  return false;
}

function hasConfiguredValue(value: string | undefined | null) {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return false;
  return !isPlaceholderValue(normalized);
}

function resolvePushConfig(): PushConfig | null {
  const teamId = normalizeEnvValue(process.env.APNS_TEAM_ID);
  const keyId = normalizeEnvValue(process.env.APNS_KEY_ID);
  const privateKeyRaw = normalizeEnvValue(process.env.APNS_PRIVATE_KEY);
  const topic =
    normalizeEnvValue(process.env.APNS_TOPIC) ||
    normalizeEnvValue(process.env.IOS_BUNDLE_IDENTIFIER) ||
    "com.hayame.app";
  const useSandbox = ["1", "true", "yes", "on"].includes(
    normalizeEnvValue(process.env.APNS_USE_SANDBOX).toLowerCase(),
  );

  if (!topic) {
    return null;
  }

  if (
    !hasConfiguredValue(teamId) ||
    !hasConfiguredValue(keyId) ||
    !hasConfiguredValue(privateKeyRaw)
  ) {
    return null;
  }

  return {
    teamId,
    keyId,
    topic,
    useSandbox,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
  };
}

function resolveFcmConfig(): FcmConfig | null {
  const saJson = normalizeEnvValue(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!hasConfiguredValue(saJson)) return null;
  try {
    const decoded = Buffer.from(saJson, "base64").toString("utf8");
    const sa = JSON.parse(decoded);
    if (sa.project_id && sa.client_email && sa.private_key) {
      return {
        projectId: sa.project_id,
        clientEmail: sa.client_email,
        privateKey: sa.private_key.replace(/\\n/g, "\n"),
      };
    }
  } catch {}
  return null;
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildApnsJwt(config: PushConfig) {
  const now = Math.floor(Date.now() / 1000);
  const cacheKey = `${config.teamId}:${config.keyId}:${config.topic}:${config.useSandbox ? "sandbox" : "prod"}`;
  if (
    cachedJwt &&
    cachedJwt.cacheKey === cacheKey &&
    cachedJwt.expiresAt > now + 60
  ) {
    return cachedJwt.token;
  }

  const header = base64Url(JSON.stringify({ alg: "ES256", kid: config.keyId }));
  const payload = base64Url(JSON.stringify({ iss: config.teamId, iat: now }));
  const tokenBody = `${header}.${payload}`;

  const signer = createSign("SHA256");
  signer.update(tokenBody);
  signer.end();
  const signature = signer.sign({
    key: config.privateKey,
    dsaEncoding: "ieee-p1363",
  });
  const jwt = `${tokenBody}.${base64Url(signature)}`;
  cachedJwt = {
    token: jwt,
    cacheKey,
    expiresAt: now + 50 * 60,
  };
  return jwt;
}

function sanitizeData(data: Record<string, PushDataValue> | undefined) {
  if (!data) return undefined;
  const clean: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      clean[key] = value;
    } else {
      clean[key] = String(value);
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

function trimMessage(value: string, fallback: string) {
  const normalized = value.trim();
  return normalized || fallback;
}

async function sendToApnsHost(params: {
  host: string;
  deviceToken: string;
  jwt: string;
  config: PushConfig;
  title: string;
  body: string;
  data?: Record<string, string | number | boolean | null>;
  collapseId?: string;
}): Promise<ApnsSendResult> {
  return new Promise((resolve) => {
    const client = connect(`https://${params.host}`);
    let settled = false;
    let statusCode = 0;
    let responseBuffer = "";

    const finish = (result: ApnsSendResult) => {
      if (settled) return;
      settled = true;
      try {
        client.close();
      } catch {}
      resolve(result);
    };

    client.on("error", (error) => {
      finish({
        ok: false,
        statusCode: 0,
        reason: error?.message ?? "apns_connection_error",
      });
    });

    const headers: Record<string, string> = {
      ":method": "POST",
      ":path": `/3/device/${params.deviceToken}`,
      authorization: `bearer ${params.jwt}`,
      "apns-topic": params.config.topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    };
    if (params.collapseId) {
      headers["apns-collapse-id"] = params.collapseId;
    }

    const request = client.request(headers);
    request.setEncoding("utf8");
    request.setTimeout(12_000, () => {
      request.close();
      finish({
        ok: false,
        statusCode: 0,
        reason: "apns_timeout",
      });
    });
    request.on("response", (headers) => {
      const rawStatus = headers[":status"];
      statusCode =
        typeof rawStatus === "number" ? rawStatus : Number(rawStatus ?? 0);
    });
    request.on("data", (chunk: string) => {
      responseBuffer += chunk;
    });
    request.on("error", (error) => {
      finish({
        ok: false,
        statusCode,
        reason: error?.message ?? "apns_request_error",
      });
    });
    request.on("end", () => {
      let reason: string | null = null;
      if (responseBuffer) {
        try {
          const parsed = JSON.parse(responseBuffer) as { reason?: string };
          reason = parsed?.reason ?? null;
        } catch {
          reason = null;
        }
      }
      finish({
        ok: statusCode >= 200 && statusCode < 300,
        statusCode,
        reason,
      });
    });

    const payload: Record<string, unknown> = {
      aps: {
        alert: {
          title: trimMessage(params.title, "Hayame"),
          body: trimMessage(params.body, MESSAGE_FALLBACK),
        },
        sound: "default",
      },
    };
    if (params.data && Object.keys(params.data).length > 0) {
      payload.data = params.data;
    }

    request.end(JSON.stringify(payload));
  });
}

async function sendApnsPush(params: {
  config: PushConfig;
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, string | number | boolean | null>;
  collapseId?: string;
}) {
  let jwt: string;
  try {
    jwt = buildApnsJwt(params.config);
  } catch {
    return {
      ok: false,
      statusCode: 0,
      reason: "jwt_build_failed",
    } as ApnsSendResult;
  }
  const primaryHost = params.config.useSandbox
    ? APNS_SANDBOX_HOST
    : APNS_PRODUCTION_HOST;
  const fallbackHost = params.config.useSandbox
    ? APNS_PRODUCTION_HOST
    : APNS_SANDBOX_HOST;

  const first = await sendToApnsHost({
    host: primaryHost,
    deviceToken: params.deviceToken,
    jwt,
    config: params.config,
    title: params.title,
    body: params.body,
    data: params.data,
    collapseId: params.collapseId,
  });
  if (first.ok) return first;

  if (
    first.reason === "BadDeviceToken" ||
    first.reason === "DeviceTokenNotForTopic"
  ) {
    return await sendToApnsHost({
      host: fallbackHost,
      deviceToken: params.deviceToken,
      jwt,
      config: params.config,
      title: params.title,
      body: params.body,
      data: params.data,
      collapseId: params.collapseId,
    });
  }

  return first;
}

async function getFcmAccessToken(config: FcmConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedFcmToken && cachedFcmToken.expiresAt > now + 60) {
    return cachedFcmToken.token;
  }

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: config.clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const tokenBody = `${header}.${claims}`;
  const signer = createSign("SHA256");
  signer.update(tokenBody);
  signer.end();
  const sig = signer.sign({ key: config.privateKey });
  const jwt = `${tokenBody}.${base64Url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  const token = json.access_token;
  if (!token) throw new Error("fcm_oauth_failed");
  cachedFcmToken = { token, expiresAt: now + (json.expires_in ?? 3600) - 120 };
  return token;
}

async function sendFcmPush(params: {
  config: FcmConfig;
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, string | number | boolean | null>;
  collapseId?: string;
}): Promise<FcmSendResult> {
  try {
    const accessToken = await getFcmAccessToken(params.config);

    const message: Record<string, unknown> = {
      token: params.deviceToken,
      notification: {
        title: trimMessage(params.title, "Hayame"),
        body: trimMessage(params.body, MESSAGE_FALLBACK),
      },
      android: {
        priority: "high",
        notification: { channel_id: "hayame_updates", sound: "default" },
        ...(params.collapseId ? { collapse_key: params.collapseId } : {}),
      },
    };
    if (params.data && Object.keys(params.data).length > 0) {
      message.data = Object.fromEntries(
        Object.entries(params.data).map(([k, v]) => [k, String(v ?? "")]),
      );
    }

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${params.config.projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      },
    );

    const raw = await response.text();
    let reason: string | null = null;
    try {
      const parsed = JSON.parse(raw) as { error?: { status?: string; message?: string } };
      reason = parsed?.error?.status ?? parsed?.error?.message ?? null;
    } catch {}

    return { ok: response.ok && !reason, statusCode: response.status, reason };
  } catch (error: any) {
    return { ok: false, statusCode: 0, reason: error?.message ?? "fcm_request_error" };
  }
}

export async function sendPushNotificationsToUsers({
  userIds,
  title,
  body,
  data,
  adminClient,
  collapseId,
  preferenceKey,
  notificationCategory,
}: PushSendInput): Promise<PushSendResult> {
  const requestedUserIds = Array.from(
    new Set(userIds.map((value) => value.trim()).filter(Boolean)),
  );
  if (requestedUserIds.length === 0) {
    return {
      attempted: 0,
      delivered: 0,
      cleanedUpTokens: 0,
      skipped: true,
      reason: "no-users",
    };
  }

  const admin =
    adminClient ??
    (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
  if (!admin) {
    return {
      attempted: 0,
      delivered: 0,
      cleanedUpTokens: 0,
      skipped: true,
      reason: "admin-client-missing",
    };
  }

  const uniqueUserIds = await getUsersAllowedForPreference({
    admin,
    userIds: requestedUserIds,
    preferenceKey,
  }).catch(() => requestedUserIds);
  if (uniqueUserIds.length === 0) {
    return {
      attempted: 0,
      delivered: 0,
      cleanedUpTokens: 0,
      skipped: true,
      reason: "preference-blocked",
    };
  }

  const apnsConfig = resolvePushConfig();
  const fcmConfig = resolveFcmConfig();
  if (!apnsConfig && !fcmConfig) {
    return {
      attempted: 0,
      delivered: 0,
      cleanedUpTokens: 0,
      skipped: true,
      reason: "push-not-configured",
    };
  }

  const { data: tokenRows, error } = await admin
    .from("mobile_push_tokens")
    .select("id,user_id,device_token,platform")
    .in("user_id", uniqueUserIds);
  if (error) {
    return {
      attempted: 0,
      delivered: 0,
      cleanedUpTokens: 0,
      skipped: true,
      reason: error.message,
    };
  }

  const rows = (tokenRows ?? []).filter((row: any) => {
    const token = String(row?.device_token ?? "").trim();
    return token.length > 0;
  });
  const iosRows = rows.filter(
    (row: any) => String(row?.platform ?? "").toLowerCase() === "ios",
  );
  const androidRows = rows.filter(
    (row: any) => String(row?.platform ?? "").toLowerCase() === "android",
  );

  const attemptedIosRows = apnsConfig ? iosRows : [];
  const attemptedAndroidRows = fcmConfig ? androidRows : [];
  const attemptedRows = [...attemptedIosRows, ...attemptedAndroidRows];

  if (attemptedRows.length === 0) {
    return {
      attempted: 0,
      delivered: 0,
      cleanedUpTokens: 0,
      skipped: true,
      reason: "no-device-tokens",
    };
  }

  const cleanData = sanitizeData({
    ...data,
    notificationCategory:
      notificationCategory ??
      preferenceKey ??
      (typeof data?.notificationCategory === "string"
        ? data.notificationCategory
        : undefined),
  });
  let delivered = 0;
  const invalidTokenIds: string[] = [];

  for (const row of attemptedIosRows) {
    const deviceToken = String((row as any).device_token ?? "").trim();
    if (!deviceToken) continue;

    const result = await sendApnsPush({
      config: apnsConfig!,
      deviceToken,
      title,
      body,
      data: cleanData,
      collapseId,
    });
    if (result.ok) {
      delivered += 1;
      continue;
    }

    const tokenId = String((row as any).id ?? "");
    if (tokenId && result.reason && INVALID_TOKEN_REASONS.has(result.reason)) {
      invalidTokenIds.push(tokenId);
    }
  }

  for (const row of attemptedAndroidRows) {
    const deviceToken = String((row as any).device_token ?? "").trim();
    if (!deviceToken) continue;

    const result = await sendFcmPush({
      config: fcmConfig!,
      deviceToken,
      title,
      body,
      data: cleanData,
      collapseId,
    });
    if (result.ok) {
      delivered += 1;
      continue;
    }

    const tokenId = String((row as any).id ?? "");
    if (
      tokenId &&
      result.reason &&
      INVALID_FCM_TOKEN_REASONS.has(result.reason)
    ) {
      invalidTokenIds.push(tokenId);
    }
  }

  let cleanedUpTokens = 0;
  if (invalidTokenIds.length > 0) {
    const uniqueInvalid = Array.from(new Set(invalidTokenIds));
    const { error: deleteError, count } = await admin
      .from("mobile_push_tokens")
      .delete({ count: "exact" })
      .in("id", uniqueInvalid);
    if (!deleteError) {
      cleanedUpTokens = count ?? uniqueInvalid.length;
    }
  }

  return {
    attempted: attemptedRows.length,
    delivered,
    cleanedUpTokens,
    skipped: false,
  };
}

export async function sendBroadcastPushNotifications({
  title,
  body,
  data,
  adminClient,
  collapseId,
  preferenceKey,
  notificationCategory,
}: BroadcastPushInput): Promise<PushSendResult> {
  const admin =
    adminClient ??
    (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
  if (!admin) {
    return {
      attempted: 0,
      delivered: 0,
      cleanedUpTokens: 0,
      skipped: true,
      reason: "admin-client-missing",
    };
  }

  const { data: tokenRows, error } = await admin
    .from("mobile_push_tokens")
    .select("user_id");
  if (error) {
    return {
      attempted: 0,
      delivered: 0,
      cleanedUpTokens: 0,
      skipped: true,
      reason: error.message,
    };
  }

  const mappedUserIds: string[] = (tokenRows ?? []).map((row: any): string =>
    String(row?.user_id ?? "").trim(),
  );
  const userIds: string[] = Array.from(
    new Set(mappedUserIds.filter((userId) => userId.length > 0)),
  );

  return sendPushNotificationsToUsers({
    userIds,
    title,
    body,
    data,
    adminClient: admin,
    collapseId,
    preferenceKey,
    notificationCategory,
  });
}
