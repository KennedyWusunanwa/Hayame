"use client";

import { useMemo, useState } from "react";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { MaintenanceView } from "@/components/maintenance/maintenance-view";
import {
  addDuration,
  DURATION_UNITS,
  type DurationUnit,
  type MaintenanceSettings,
  type MaintenanceTheme,
} from "@/lib/maintenance-core";
import { cn } from "@/lib/utils";

type Kind = "indefinite" | "duration" | "date";

const THEME_OPTIONS: { id: MaintenanceTheme; label: string; swatch: string }[] = [
  { id: "navy", label: "Navy", swatch: "linear-gradient(160deg,#06182E,#0E4C8C)" },
  { id: "blue", label: "Blue", swatch: "linear-gradient(155deg,#0E66B8,#2E9BEA)" },
  { id: "light", label: "Light", swatch: "#EDF7FF" },
];

const fieldClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";
const labelClass = "text-sm font-semibold text-foreground";
const hintClass = "mt-1 text-xs text-gray-500";

/** ISO -> value for <input type="datetime-local"> in GMT (Ghana time). */
function toLocalInput(iso: string | null) {
  return iso ? new Date(iso).toISOString().slice(0, 16) : "";
}

export function MaintenanceDesigner({
  initial,
  action,
}: {
  initial: MaintenanceSettings;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [stillRunning] = useState(
    () => initial.mode === "timed" && Boolean(initial.endsAt) && Date.parse(initial.endsAt!) > Date.now(),
  );
  const [kind, setKind] = useState<Kind>(stillRunning ? "date" : "indefinite");
  const [durationValue, setDurationValue] = useState("3");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("days");
  const [endDate, setEndDate] = useState(stillRunning ? toLocalInput(initial.endsAt) : "");
  const [showCountdown, setShowCountdown] = useState(initial.showCountdown);
  const [badge, setBadge] = useState(initial.badge);
  const [headline, setHeadline] = useState(initial.headline);
  const [message, setMessage] = useState(initial.message);
  const [theme, setTheme] = useState<MaintenanceTheme>(initial.theme);
  const initialBg =
    initial.background === "none" || initial.background === "accra" ? initial.background : "custom";
  const [bgChoice, setBgChoice] = useState(initialBg);
  const [bgUrl, setBgUrl] = useState(initialBg === "custom" ? initial.background : "");
  const [contactEmail, setContactEmail] = useState(initial.contactEmail);
  const [previewAt] = useState(() => new Date());

  const previewEnd = useMemo(() => {
    if (kind === "duration") {
      const n = Number.parseInt(durationValue, 10);
      return Number.isFinite(n) && n > 0 ? addDuration(previewAt, n, durationUnit).toISOString() : null;
    }
    if (kind === "date" && endDate) {
      const d = new Date(`${endDate}:00Z`);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    return null;
  }, [kind, durationValue, durationUnit, endDate, previewAt]);

  const draft: MaintenanceSettings = {
    enabled: true,
    mode: previewEnd ? "timed" : "indefinite",
    endsAt: previewEnd,
    showCountdown: showCountdown && Boolean(previewEnd),
    badge,
    headline: headline || "Your headline.",
    message,
    theme,
    background: bgChoice === "custom" ? (bgUrl.startsWith("https://") ? bgUrl : "none") : bgChoice,
    contactEmail,
  };

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <fieldset className="space-y-3">
          <legend className={labelClass}>How long?</legend>
          {(
            [
              ["indefinite", "Until I switch it off", "Stays up as a plain under-construction page."],
              ["duration", "For a set time", "Starts counting from the moment you press Turn on."],
              ["date", "Until a date and time", "Opens by itself at that moment (GMT, same as Ghana)."],
            ] as [Kind, string, string][]
          ).map(([id, title, hint]) => (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
                kind === id ? "border-brand bg-brand/5" : "border-border bg-white hover:bg-gray-50",
              )}
            >
              <input
                type="radio"
                name="duration_kind"
                value={id}
                checked={kind === id}
                onChange={() => setKind(id)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-semibold text-foreground">{title}</span>
                <span className="block text-xs text-gray-500">{hint}</span>
              </span>
            </label>
          ))}

          {kind === "duration" ? (
            <div className="flex gap-2">
              <input
                name="duration_value"
                type="number"
                min={1}
                max={999}
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                className={cn(fieldClass, "w-24")}
                aria-label="Duration amount"
              />
              <select
                name="duration_unit"
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                className={cn(fieldClass, "w-36")}
                aria-label="Duration unit"
              >
                {DURATION_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {kind === "date" ? (
            <input
              name="end_date"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={fieldClass}
              aria-label="End date and time (GMT)"
            />
          ) : null}
          {kind !== "indefinite" ? (
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                name="show_countdown"
                checked={showCountdown}
                onChange={(e) => setShowCountdown(e.target.checked)}
              />
              Show a live countdown on the page
            </label>
          ) : null}
        </fieldset>

        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="mt-badge">Badge</label>
            <input id="mt-badge" name="badge" maxLength={40} value={badge} onChange={(e) => setBadge(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="mt-headline">Headline</label>
            <input id="mt-headline" name="headline" maxLength={90} value={headline} onChange={(e) => setHeadline(e.target.value)} className={fieldClass} />
            <p className={hintClass}>Wrap a phrase in *stars* to highlight it. Keep it short and end with a full stop.</p>
          </div>
          <div>
            <label className={labelClass} htmlFor="mt-message">Message</label>
            <textarea id="mt-message" name="message" rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="mt-contact">Contact email (optional)</label>
            <input id="mt-contact" name="contact_email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={fieldClass} placeholder="support@hayamegh.com" />
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className={labelClass}>Look</legend>
          <div className="flex gap-2">
            {THEME_OPTIONS.map((t) => (
              <label
                key={t.id}
                className={cn(
                  "flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-xl border p-2 text-xs font-semibold",
                  theme === t.id ? "border-brand bg-brand/5" : "border-border bg-white",
                )}
              >
                <input type="radio" name="theme" value={t.id} checked={theme === t.id} onChange={() => setTheme(t.id)} className="sr-only" />
                <span className="h-10 w-full rounded-lg border border-black/10" style={{ background: t.swatch }} />
                {t.label}
              </label>
            ))}
          </div>
          <select
            name="background"
            value={bgChoice}
            onChange={(e) => setBgChoice(e.target.value)}
            className={fieldClass}
            aria-label="Background"
          >
            <option value="accra">Photo: Accra skyline</option>
            <option value="none">Plain colour (no photo)</option>
            <option value="custom">Photo: my own image link</option>
          </select>
          {bgChoice === "custom" ? (
            <input name="background_url" type="url" value={bgUrl} onChange={(e) => setBgUrl(e.target.value)} placeholder="https://…" className={fieldClass} />
          ) : null}
          <p className={hintClass}>With a photo, text is always white on a navy overlay so it stays readable.</p>
        </fieldset>

        <div className="flex flex-wrap gap-3 border-t border-border pt-5">
          <PendingSubmitButton name="intent" value="publish" pendingLabel="Turning on…" className="min-h-10 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90">
            {initial.enabled ? "Update & keep live" : "Turn on maintenance"}
          </PendingSubmitButton>
          <PendingSubmitButton name="intent" value="save" pendingLabel="Saving…" className="min-h-10 rounded-xl border border-border bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
            Save without changing status
          </PendingSubmitButton>
          {initial.enabled ? (
            <PendingSubmitButton name="intent" value="disable" formNoValidate pendingLabel="Turning off…" className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-800 hover:bg-red-100">
              Turn off, open the site
            </PendingSubmitButton>
          ) : null}
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Live preview</p>
        <div className="h-[640px] overflow-hidden rounded-2xl border border-border shadow-sm">
          <MaintenanceView settings={draft} embedded />
        </div>
      </div>
    </form>
  );
}
