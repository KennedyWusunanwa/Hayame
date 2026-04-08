export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@hayame.com";
export const SUPPORT_PHONE =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "+233 (0) 55 555 5555";
export const SUPPORT_ADDRESS =
  process.env.NEXT_PUBLIC_SUPPORT_ADDRESS?.trim() ||
  "Accra Digital Centre, Ring Road West";
export const IOS_APP_STORE_URL =
  process.env.NEXT_PUBLIC_IOS_APP_STORE_URL?.trim() || "";
export const ANDROID_PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_ANDROID_PLAY_STORE_URL?.trim() || "";

export function getSupportPhoneHref(value = SUPPORT_PHONE) {
  const digits = value.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

export function getSupportEmailHref(value = SUPPORT_EMAIL) {
  return value ? `mailto:${value}` : "";
}

export function buildWebFallbackUrl(currentUrl: URL) {
  const fallbackUrl = new URL(currentUrl.toString());
  fallbackUrl.searchParams.set("web", "1");
  return fallbackUrl.toString();
}

export function getAppStoreFallback(
  platform: "ios" | "android",
  currentUrl: URL,
) {
  if (platform === "ios" && IOS_APP_STORE_URL) return IOS_APP_STORE_URL;
  if (platform === "android" && ANDROID_PLAY_STORE_URL)
    return ANDROID_PLAY_STORE_URL;
  return buildWebFallbackUrl(currentUrl);
}
