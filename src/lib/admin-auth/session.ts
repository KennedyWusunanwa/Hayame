import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const SESSION_VERSION = 1;
const SCRYPT_PREFIX = "scrypt";
const SCRYPT_KEY_LENGTH = 64;

type SessionPayload = {
  v: number;
  u: string;
  iat: number;
  exp: number;
};

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signValue(value: string, sessionSecret: string) {
  return toBase64Url(
    createHmac("sha256", sessionSecret).update(value).digest(),
  );
}

export function createAdminPasswordHash(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return `${SCRYPT_PREFIX}:${salt.toString("hex")}:${Buffer.from(hash).toString("hex")}`;
}

export function verifyAdminPassword(password: string, passwordHash: string) {
  const [prefix, saltHex, hashHex] = passwordHash.split(":");
  if (prefix !== SCRYPT_PREFIX || !saltHex || !hashHex) return false;

  try {
    const salt = Buffer.from(saltHex, "hex");
    const expectedHash = Buffer.from(hashHex, "hex");
    const derivedHash = Buffer.from(
      scryptSync(password, salt, expectedHash.length),
    );
    if (derivedHash.length !== expectedHash.length) return false;
    return timingSafeEqual(derivedHash, expectedHash);
  } catch {
    return false;
  }
}

export function verifyAdminCredentials(params: {
  inputUsername: string;
  inputPassword: string;
  configuredUsername: string;
  configuredPassword?: string | null;
  configuredPasswordHash?: string | null;
}) {
  const usernameOk = safeCompare(
    params.inputUsername,
    params.configuredUsername,
  );
  if (!usernameOk) return false;

  if (params.configuredPasswordHash) {
    return verifyAdminPassword(
      params.inputPassword,
      params.configuredPasswordHash,
    );
  }

  if (!params.configuredPassword) return false;
  return safeCompare(params.inputPassword, params.configuredPassword);
}

export function createAdminSessionToken(params: {
  username: string;
  sessionSecret: string;
  now?: number;
  ttlSeconds?: number;
}) {
  const issuedAt = Math.floor((params.now ?? Date.now()) / 1000);
  const expiresAt = issuedAt + (params.ttlSeconds ?? 60 * 60 * 12);
  const payload: SessionPayload = {
    v: SESSION_VERSION,
    u: params.username,
    iat: issuedAt,
    exp: expiresAt,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload, params.sessionSecret);
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(params: {
  token: string;
  sessionSecret: string;
  expectedUsername: string;
  now?: number;
}) {
  const [encodedPayload, signature] = params.token.split(".");
  if (!encodedPayload || !signature) return false;
  if (!safeCompare(signValue(encodedPayload, params.sessionSecret), signature))
    return false;

  try {
    const payload = JSON.parse(
      fromBase64Url(encodedPayload).toString("utf8"),
    ) as SessionPayload;
    if (payload.v !== SESSION_VERSION) return false;
    if (!safeCompare(payload.u, params.expectedUsername)) return false;
    const now = Math.floor((params.now ?? Date.now()) / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}
