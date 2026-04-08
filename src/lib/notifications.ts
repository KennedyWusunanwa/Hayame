import "server-only";

export const NOTIFICATION_PREFERENCE_KEYS = [
  "booking_updates",
  "messages",
  "account_security",
  "news_announcements",
] as const;

export type NotificationPreferenceKey =
  (typeof NOTIFICATION_PREFERENCE_KEYS)[number];

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  booking_updates: true,
  messages: true,
  account_security: true,
  news_announcements: false,
};

export const ANNOUNCEMENT_CATEGORIES = ["system", "news"] as const;
export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];

export const ANNOUNCEMENT_DELIVERIES = ["in_app", "push", "both"] as const;
export type AnnouncementDelivery = (typeof ANNOUNCEMENT_DELIVERIES)[number];

export const ANNOUNCEMENT_AUDIENCES = ["all", "authenticated"] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

export type AppAnnouncement = {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  delivery: AnnouncementDelivery;
  audience: AnnouncementAudience;
  show_once: boolean;
  cta_label: string | null;
  cta_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  published_at: string | null;
  seen: boolean;
};

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(lowered)) return true;
    if (["0", "false", "no", "off"].includes(lowered)) return false;
  }
  return fallback;
}

export function parseNotificationPreferences(
  input: Record<string, unknown> | null | undefined,
): NotificationPreferences {
  return {
    booking_updates: normalizeBoolean(
      input?.booking_updates,
      DEFAULT_NOTIFICATION_PREFERENCES.booking_updates,
    ),
    messages: normalizeBoolean(
      input?.messages,
      DEFAULT_NOTIFICATION_PREFERENCES.messages,
    ),
    account_security: normalizeBoolean(
      input?.account_security,
      DEFAULT_NOTIFICATION_PREFERENCES.account_security,
    ),
    news_announcements: normalizeBoolean(
      input?.news_announcements,
      DEFAULT_NOTIFICATION_PREFERENCES.news_announcements,
    ),
  };
}

export function isMissingNotificationStorageError(error: unknown) {
  const message = String((error as { message?: string } | null)?.message ?? "")
    .trim()
    .toLowerCase();
  if (!message) return false;
  return (
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  );
}

export async function getUserNotificationPreferences(params: {
  admin: any;
  userId: string;
}): Promise<NotificationPreferences> {
  const { data, error } = await params.admin
    .from("user_notification_preferences")
    .select(
      "booking_updates,messages,account_security,news_announcements",
    )
    .eq("user_id", params.userId)
    .maybeSingle();

  if (error) {
    if (isMissingNotificationStorageError(error)) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }
    throw error;
  }

  return parseNotificationPreferences(data ?? undefined);
}

export async function getUsersAllowedForPreference(params: {
  admin: any;
  userIds: string[];
  preferenceKey?: NotificationPreferenceKey | null;
}): Promise<string[]> {
  const uniqueUserIds = Array.from(
    new Set(params.userIds.map((value) => value.trim()).filter(Boolean)),
  );
  if (!params.preferenceKey || uniqueUserIds.length === 0) {
    return uniqueUserIds;
  }

  const fallback =
    DEFAULT_NOTIFICATION_PREFERENCES[params.preferenceKey] ?? true;
  const { data, error } = await params.admin
    .from("user_notification_preferences")
    .select(
      "user_id,booking_updates,messages,account_security,news_announcements",
    )
    .in("user_id", uniqueUserIds);

  if (error) {
    if (isMissingNotificationStorageError(error)) {
      return fallback ? uniqueUserIds : [];
    }
    throw error;
  }

  const preferencesByUser = new Map<string, NotificationPreferences>();
  for (const row of data ?? []) {
    const userId = String((row as { user_id?: string } | null)?.user_id ?? "");
    if (!userId) continue;
    preferencesByUser.set(
      userId,
      parseNotificationPreferences(row as Record<string, unknown>),
    );
  }

  return uniqueUserIds.filter((userId) => {
    const prefs = preferencesByUser.get(userId);
    if (!prefs) return fallback;
    return prefs[params.preferenceKey!] ?? fallback;
  });
}

function normalizeAnnouncementCategory(value: unknown): AnnouncementCategory {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return normalized === "news" ? "news" : "system";
}

function normalizeAnnouncementDelivery(value: unknown): AnnouncementDelivery {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "push" || normalized === "both") return normalized;
  return "in_app";
}

function normalizeAnnouncementAudience(value: unknown): AnnouncementAudience {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return normalized === "authenticated" ? "authenticated" : "all";
}

export function isAnnouncementActive(
  row: Record<string, unknown> | null | undefined,
  now = new Date(),
) {
  const publishedAt = String(row?.published_at ?? "").trim();
  if (!publishedAt) return false;

  const startsAt = String(row?.starts_at ?? "").trim();
  if (startsAt) {
    const startsOn = new Date(startsAt);
    if (!Number.isNaN(startsOn.valueOf()) && startsOn > now) {
      return false;
    }
  }

  const endsAt = String(row?.ends_at ?? "").trim();
  if (endsAt) {
    const endsOn = new Date(endsAt);
    if (!Number.isNaN(endsOn.valueOf()) && endsOn < now) {
      return false;
    }
  }

  return true;
}

export function sanitizeAnnouncementUrl(raw: unknown) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    const protocol = parsed.protocol.toLowerCase();
    if (
      protocol === "https:" ||
      protocol === "http:" ||
      protocol === "hayame:" ||
      protocol === "hayameios:" ||
      protocol === "hayameandroid:"
    ) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeAnnouncement(
  row: Record<string, unknown>,
  seen = false,
): AppAnnouncement {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? "").trim(),
    body: String(row.body ?? "").trim(),
    category: normalizeAnnouncementCategory(row.category),
    delivery: normalizeAnnouncementDelivery(row.delivery),
    audience: normalizeAnnouncementAudience(row.audience),
    show_once: normalizeBoolean(row.show_once, true),
    cta_label: String(row.cta_label ?? "").trim() || null,
    cta_url: sanitizeAnnouncementUrl(row.cta_url),
    starts_at: String(row.starts_at ?? "").trim() || null,
    ends_at: String(row.ends_at ?? "").trim() || null,
    published_at: String(row.published_at ?? "").trim() || null,
    seen,
  };
}

export async function fetchActiveAnnouncements(params: {
  admin: any;
  userId?: string | null;
  includePushOnly?: boolean;
  limit?: number;
}): Promise<AppAnnouncement[]> {
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 25);
  const { data, error } = await params.admin
    .from("app_announcements")
    .select(
      "id,title,body,category,delivery,audience,show_once,cta_label,cta_url,starts_at,ends_at,published_at",
    )
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingNotificationStorageError(error)) {
      return [];
    }
    throw error;
  }

  const activeRows = (data ?? []).filter((row: any) => {
    if (!isAnnouncementActive(row)) return false;
    const audience = normalizeAnnouncementAudience(row?.audience);
    if (audience === "authenticated" && !params.userId) return false;
    const delivery = normalizeAnnouncementDelivery(row?.delivery);
    if (!params.includePushOnly && delivery === "push") return false;
    return true;
  });

  let seenIds = new Set<string>();
  if (params.userId && activeRows.length > 0) {
    const announcementIds = activeRows.map((row: any) => row.id).filter(Boolean);
    const { data: receiptRows, error: receiptError } = await params.admin
      .from("user_announcement_receipts")
      .select("announcement_id")
      .eq("user_id", params.userId)
      .in("announcement_id", announcementIds);

    if (!receiptError) {
      seenIds = new Set(
        (receiptRows ?? [])
          .map((row: any) => String(row?.announcement_id ?? "").trim())
          .filter(Boolean),
      );
    }
  }

  return activeRows.map((row: any) =>
    normalizeAnnouncement(row, seenIds.has(String(row?.id ?? ""))),
  );
}

export async function markAnnouncementSeen(params: {
  admin: any;
  userId: string;
  announcementId: string;
}) {
  const { error } = await params.admin.from("user_announcement_receipts").upsert(
    {
      user_id: params.userId,
      announcement_id: params.announcementId,
      seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,announcement_id" },
  );

  if (error && !isMissingNotificationStorageError(error)) {
    throw error;
  }
}
