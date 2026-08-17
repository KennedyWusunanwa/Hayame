export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@hayamegh.com";
export const SUPPORT_ADDRESS =
  process.env.NEXT_PUBLIC_SUPPORT_ADDRESS?.trim() ||
  "Accra Digital Centre, Ring Road West";
export const IOS_APP_STORE_URL =
  process.env.NEXT_PUBLIC_IOS_APP_STORE_URL?.trim() ||
  "https://apps.apple.com/gh/app/hayame/id6760410961";
export const ANDROID_PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_ANDROID_PLAY_STORE_URL?.trim() || "";
export const ANDROID_APK_URL =
  process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim() ||
  "/downloads/hayame-android.apk";

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
