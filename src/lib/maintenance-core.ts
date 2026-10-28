// Pure maintenance-mode logic. No server-only imports, so the proxy, the admin
// designer (client) and tests can all share it.

export type MaintenanceMode = "indefinite" | "timed";
export type MaintenanceTheme = "navy" | "blue" | "light";
export type DurationUnit = "hours" | "days" | "weeks" | "months";
export type MaintenanceIntent = "save" | "publish" | "disable";

export type MaintenanceSettings = {
  enabled: boolean;
  mode: MaintenanceMode;
  /** ISO string. Only meaningful when mode is "timed". */
  endsAt: string | null;
  showCountdown: boolean;
  badge: string;
  /** *asterisks* highlight a phrase in the accent colour. */
  headline: string;
  message: string;
  theme: MaintenanceTheme;
  /** "none", "accra" or an https image URL. */
  background: string;
  contactEmail: string;
};

export const DEFAULT_MAINTENANCE: MaintenanceSettings = {
  enabled: false,
  mode: "indefinite",
  endsAt: null,
  showCountdown: true,
  badge: "Under construction",
  headline: "We're building something *better.*",
  message:
    "Hayame is getting an upgrade. We'll be back shortly. Thanks for your patience.",
  theme: "navy",
  background: "accra",
  contactEmail: "",
};

export const DURATION_UNITS: DurationUnit[] = [
  "hours",
  "days",
  "weeks",
  "months",
];
export const THEMES: MaintenanceTheme[] = ["navy", "blue", "light"];
export const ACCRA_BACKGROUND_PATH = "/maintenance/accra-skyline.jpg";

const LIMITS = { badge: 40, headline: 90, message: 500 };
const MAX_DURATION_MS = 2 * 366 * 24 * 60 * 60 * 1000;

export function addDuration(from: Date, value: number, unit: DurationUnit) {
  const next = new Date(from.getTime());
  if (unit === "months") {
    next.setUTCMonth(next.getUTCMonth() + value);
  } else {
    const hours = unit === "hours" ? 1 : unit === "days" ? 24 : 24 * 7;
    next.setTime(next.getTime() + value * hours * 60 * 60 * 1000);
  }
  return next;
}

/** Maintenance is live while enabled, and (for timed mode) until endsAt passes. */
export function isMaintenanceActive(
  settings: MaintenanceSettings | null | undefined,
  now: number = Date.now(),
) {
  if (!settings?.enabled) return false;
  if (settings.mode === "timed") {
    const end = settings.endsAt ? Date.parse(settings.endsAt) : NaN;
    if (!Number.isFinite(end)) return false;
    return end > now;
  }
  return true;
}

export function resolveBackgroundUrl(background: string) {
  if (background === "accra") return ACCRA_BACKGROUND_PATH;
  if (background.startsWith("https://")) return background;
  return null;
}

export function splitHeadline(headline: string) {
  // "Plain *accent* plain" -> [{text, accent}]
  const parts: { text: string; accent: boolean }[] = [];
  headline.split(/(\*[^*]+\*)/g).forEach((chunk) => {
    if (!chunk) return;
    if (chunk.length > 2 && chunk.startsWith("*") && chunk.endsWith("*")) {
      parts.push({ text: chunk.slice(1, -1), accent: true });
    } else {
      parts.push({ text: chunk.replace(/\*/g, ""), accent: false });
    }
  });
  return parts;
}

type MaintenanceRow = {
  enabled?: boolean | null;
  mode?: string | null;
  ends_at?: string | null;
  show_countdown?: boolean | null;
  badge?: string | null;
  headline?: string | null;
  message?: string | null;
  theme?: string | null;
  background?: string | null;
  contact_email?: string | null;
};

export function rowToSettings(
  row: MaintenanceRow | null | undefined,
): MaintenanceSettings {
  const d = DEFAULT_MAINTENANCE;
  if (!row) return { ...d };
  return {
    enabled: row.enabled === true,
    mode: row.mode === "timed" ? "timed" : "indefinite",
    endsAt: row.ends_at ?? null,
    showCountdown: row.show_countdown !== false,
    badge: row.badge ?? d.badge,
    headline: row.headline || d.headline,
    message: row.message ?? d.message,
    theme: THEMES.includes(row.theme as MaintenanceTheme)
      ? (row.theme as MaintenanceTheme)
      : d.theme,
    background: row.background || d.background,
    contactEmail: row.contact_email ?? "",
  };
}

export function settingsToRow(s: MaintenanceSettings) {
  return {
    enabled: s.enabled,
    mode: s.mode,
    ends_at: s.mode === "timed" ? s.endsAt : null,
    show_countdown: s.showCountdown,
    badge: s.badge,
    headline: s.headline,
    message: s.message,
    theme: s.theme,
    background: s.background,
    contact_email: s.contactEmail,
  };
}

type FormLike = { get(name: string): unknown };
function text(form: FormLike, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export type ParsedMaintenance =
  | { ok: true; intent: MaintenanceIntent; settings: MaintenanceSettings }
  | { ok: false; error: string };

/**
 * Turns the admin form into settings. Times typed as a date are read as GMT,
 * which is Ghana time all year. "disable" only flips the switch and never fails.
 */
export function parseMaintenanceForm(
  form: FormLike,
  current: MaintenanceSettings,
  now: Date = new Date(),
): ParsedMaintenance {
  const rawIntent = text(form, "intent");
  const intent: MaintenanceIntent =
    rawIntent === "publish" || rawIntent === "disable" ? rawIntent : "save";

  if (intent === "disable") {
    return { ok: true, intent, settings: { ...current, enabled: false } };
  }

  const badge = text(form, "badge").slice(0, LIMITS.badge);
  const headline = text(form, "headline");
  const message = text(form, "message");
  if (!headline) return { ok: false, error: "Add a headline." };
  if (headline.length > LIMITS.headline)
    return { ok: false, error: `Headline is over ${LIMITS.headline} characters.` };
  if (message.length > LIMITS.message)
    return { ok: false, error: `Message is over ${LIMITS.message} characters.` };

  const themeRaw = text(form, "theme");
  const theme = THEMES.includes(themeRaw as MaintenanceTheme)
    ? (themeRaw as MaintenanceTheme)
    : "navy";

  const bgChoice = text(form, "background");
  let background = "none";
  if (bgChoice === "accra") background = "accra";
  else if (bgChoice === "custom") {
    const url = text(form, "background_url");
    if (!/^https:\/\/[^\s]+$/i.test(url))
      return { ok: false, error: "Background image must be an https:// link." };
    background = url;
  }

  const contactEmail = text(form, "contact_email");
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
    return { ok: false, error: "Contact email doesn't look right." };

  const kind = text(form, "duration_kind");
  let mode: MaintenanceMode = "indefinite";
  let endsAt: string | null = null;
  if (kind === "duration") {
    const value = Number.parseInt(text(form, "duration_value"), 10);
    const unit = text(form, "duration_unit") as DurationUnit;
    if (!Number.isFinite(value) || value < 1)
      return { ok: false, error: "Duration must be at least 1." };
    if (!DURATION_UNITS.includes(unit))
      return { ok: false, error: "Pick hours, days, weeks or months." };
    const end = addDuration(now, value, unit);
    mode = "timed";
    endsAt = end.toISOString();
  } else if (kind === "date") {
    const raw = text(form, "end_date");
    const end = new Date(/Z$|[+-]\d\d:?\d\d$/.test(raw) ? raw : `${raw}:00Z`);
    if (!raw || Number.isNaN(end.getTime()))
      return { ok: false, error: "Pick an end date and time." };
    mode = "timed";
    endsAt = end.toISOString();
  }

  if (mode === "timed" && endsAt) {
    const delta = Date.parse(endsAt) - now.getTime();
    if (delta <= 0)
      return { ok: false, error: "The end time must be in the future." };
    if (delta > MAX_DURATION_MS)
      return { ok: false, error: "Maintenance can't run longer than 2 years." };
  }

  return {
    ok: true,
    intent,
    settings: {
      enabled: intent === "publish" ? true : current.enabled,
      mode,
      endsAt,
      showCountdown: mode === "timed" && form.get("show_countdown") === "on",
      badge,
      headline,
      message,
      theme,
      background,
      contactEmail,
    },
  };
}
