export type CarImageFallbackInput = {
  id?: string | null;
  title?: string | null;
  city?: string | null;
  region?: string | null;
  carType?: string | null;
};

const FALLBACK_PALETTES = [
  { background: "#f4f8ff", accent: "#0e86d4", accentSoft: "#bfe3f8", text: "#10324b" },
  { background: "#f9f4ec", accent: "#b7742a", accentSoft: "#ecd3b3", text: "#4f3414" },
  { background: "#eef8f2", accent: "#2a8b57", accentSoft: "#bfe4cc", text: "#123923" },
  { background: "#f7f2fb", accent: "#7b4db5", accentSoft: "#d7c5ee", text: "#3d2459" },
];

function cleanValue(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildSeed(input: CarImageFallbackInput) {
  return [
    cleanValue(input.id),
    cleanValue(input.title),
    cleanValue(input.city),
    cleanValue(input.region),
    cleanValue(input.carType),
  ]
    .filter(Boolean)
    .join("|");
}

function locationLabel(input: CarImageFallbackInput) {
  const city = cleanValue(input.city);
  const region = cleanValue(input.region);
  return [city, region].filter(Boolean).join(", ") || "Hayame";
}

export function isCarPlaceholderImage(src?: string | null) {
  const value = cleanValue(src).toLowerCase();
  return value === "/car-placeholder.jpg" || value.endsWith("/car-placeholder.jpg");
}

export function createCarFallbackImage(input: CarImageFallbackInput = {}) {
  const seed = buildSeed(input) || "hayame";
  const palette = FALLBACK_PALETTES[hashString(seed) % FALLBACK_PALETTES.length];
  const title = cleanValue(input.title) || "Photo coming soon";
  const carType = cleanValue(input.carType) || "Vehicle listing";
  const location = locationLabel(input);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="${escapeXml(title)}">
      <rect width="1200" height="900" fill="${palette.background}" />
      <circle cx="1010" cy="160" r="180" fill="${palette.accentSoft}" opacity="0.9" />
      <circle cx="180" cy="760" r="220" fill="${palette.accentSoft}" opacity="0.65" />
      <rect x="88" y="88" width="220" height="44" rx="22" fill="${palette.accent}" opacity="0.12" />
      <text x="120" y="118" font-size="22" font-weight="700" font-family="Arial, sans-serif" fill="${palette.accent}">
        Hayame
      </text>
      <path
        d="M256 560c18-70 82-128 157-141l140-24c44-8 90 4 124 33l92 78h94c37 0 67 30 67 67v75H225v-40c0-26 21-48 47-48h6c4-1 8-1 12 0l20-80Z"
        fill="${palette.accent}"
      />
      <path
        d="M399 454h278c22 0 43 8 60 23l62 54H321l18-38c12-24 35-39 60-39Z"
        fill="white"
        opacity="0.86"
      />
      <circle cx="398" cy="648" r="58" fill="${palette.text}" />
      <circle cx="398" cy="648" r="28" fill="white" opacity="0.92" />
      <circle cx="818" cy="648" r="58" fill="${palette.text}" />
      <circle cx="818" cy="648" r="28" fill="white" opacity="0.92" />
      <text x="120" y="738" font-size="54" font-weight="700" font-family="Arial, sans-serif" fill="${palette.text}">
        ${escapeXml(title)}
      </text>
      <text x="120" y="790" font-size="28" font-family="Arial, sans-serif" fill="${palette.text}" opacity="0.82">
        ${escapeXml(carType)} • ${escapeXml(location)}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function resolveCarImage(primaryImage: string | null | undefined, input: CarImageFallbackInput = {}) {
  const image = cleanValue(primaryImage);
  if (image && !isCarPlaceholderImage(image)) {
    return image;
  }
  return createCarFallbackImage(input);
}

export function resolveCarImages(images: Array<string | null | undefined>, input: CarImageFallbackInput = {}) {
  const cleaned = Array.from(
    new Set(
      (images ?? [])
        .map((image) => cleanValue(image))
        .filter((image) => image && !isCarPlaceholderImage(image)),
    ),
  );

  return cleaned.length > 0 ? cleaned : [createCarFallbackImage(input)];
}
