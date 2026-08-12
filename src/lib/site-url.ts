export function resolveSiteUrl() {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitSiteUrl?.startsWith("https://")) {
    return explicitSiteUrl;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://www.hayamegh.com";
}

export function carShareUrl(carId: string) {
  return `${resolveSiteUrl()}/cars/${carId}`;
}
