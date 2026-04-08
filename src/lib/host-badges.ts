export type HostBadgeType = "new" | "verified" | "top_host";

function normalize(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function normalizeHostBadgeType(value?: string | null): HostBadgeType {
  const normalized = normalize(value);
  if (normalized === "top_host" || normalized === "super_host")
    return "top_host";
  if (normalized === "verified" || normalized === "verified_host")
    return "verified";
  return "new";
}

export function deriveHostBadgeType({
  hostType,
  hostLevel,
  isHost,
  idVerified,
  phoneVerified,
  emailVerified,
}: {
  hostType?: string | null;
  hostLevel?: string | null;
  isHost?: boolean | null;
  idVerified?: boolean | null;
  phoneVerified?: boolean | null;
  emailVerified?: boolean | null;
}): HostBadgeType {
  const explicitType = normalizeHostBadgeType(hostType);
  if (explicitType !== "new") return explicitType;

  const explicitLevel = normalizeHostBadgeType(hostLevel);
  if (explicitLevel !== "new") return explicitLevel;

  if (Boolean(isHost)) return "verified";
  if (Boolean(idVerified && phoneVerified && emailVerified)) return "verified";
  return "new";
}

export function hostBadgeLabel(type: HostBadgeType): string | null {
  if (type === "verified") return "Verified Host";
  if (type === "top_host") return "Top Host";
  return null;
}

export function isVerifiedHost(type: HostBadgeType) {
  return type === "verified" || type === "top_host";
}
