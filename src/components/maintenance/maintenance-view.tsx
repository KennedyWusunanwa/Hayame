"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  resolveBackgroundUrl,
  splitHeadline,
  type MaintenanceSettings,
  type MaintenanceTheme,
} from "@/lib/maintenance-core";
import { cn } from "@/lib/utils";

const THEME_STYLES: Record<
  MaintenanceTheme,
  { background: string; text: string; accent: string; chip: string; tile: string }
> = {
  navy: {
    background: "linear-gradient(160deg,#06182E 0%,#0A2B54 55%,#0E4C8C 100%)",
    text: "#FFFFFF",
    accent: "#7CCBFF",
    chip: "rgba(255,255,255,0.14)",
    tile: "rgba(255,255,255,0.12)",
  },
  blue: {
    background: "linear-gradient(155deg,#0E66B8 0%,#1484D9 55%,#2E9BEA 100%)",
    text: "#FFFFFF",
    accent: "#0A2B54",
    chip: "rgba(255,255,255,0.2)",
    tile: "rgba(255,255,255,0.18)",
  },
  light: {
    background: "#EDF7FF",
    text: "#0A2B54",
    accent: "#1484D9",
    chip: "rgba(20,132,217,0.12)",
    tile: "#FFFFFF",
  },
};

function remainingParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function Countdown({
  endsAt,
  reloadWhenDone,
  tile,
  accent,
}: {
  endsAt: string;
  reloadWhenDone: boolean;
  tile: string;
  accent: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  const end = Date.parse(endsAt);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = now === null ? null : end - now;
  const done = remaining !== null && remaining <= 0;

  useEffect(() => {
    if (!done || !reloadWhenDone) return;
    // The site lifts itself at the end time. Retry until the proxy lets us through.
    const retry = window.setInterval(() => window.location.reload(), 8000);
    const first = window.setTimeout(() => window.location.reload(), 2000);
    return () => {
      window.clearInterval(retry);
      window.clearTimeout(first);
    };
  }, [done, reloadWhenDone]);

  if (done) {
    return (
      <p className="mt-10 text-lg font-semibold" style={{ color: accent }}>
        Opening now…
      </p>
    );
  }

  const parts = remainingParts(remaining ?? 0);
  const cells: [string, number][] = [
    ["Days", parts.days],
    ["Hours", parts.hours],
    ["Minutes", parts.minutes],
    ["Seconds", parts.seconds],
  ];
  return (
    <div
      className="mt-10 grid w-full max-w-md grid-cols-4 gap-2.5 sm:gap-3"
      role="timer"
      aria-label="Time until we are back"
    >
      {cells.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl px-1 py-3 text-center backdrop-blur-sm sm:py-4"
          style={{ background: tile }}
        >
          <div
            className="text-3xl font-black tabular-nums tracking-tight sm:text-4xl"
            style={{ letterSpacing: "-0.04em" }}
          >
            {remaining === null ? "--" : String(value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-75">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MaintenanceView({
  settings,
  embedded = false,
}: {
  settings: MaintenanceSettings;
  /** Embedded = contained preview in the admin designer. */
  embedded?: boolean;
}) {
  const bgUrl = resolveBackgroundUrl(settings.background);
  const darkText = settings.theme === "light" && !bgUrl;
  const theme = THEME_STYLES[bgUrl ? (settings.theme === "light" ? "navy" : settings.theme) : settings.theme];
  const showTimer =
    settings.mode === "timed" && settings.showCountdown && Boolean(settings.endsAt);

  return (
    <div
      className={cn(
        "relative isolate flex w-full flex-col overflow-hidden",
        embedded ? "h-full min-h-[560px]" : "fixed inset-0 z-[100] overflow-y-auto",
      )}
      style={{
        background: theme.background,
        color: darkText ? THEME_STYLES.light.text : theme.text,
      }}
    >
      {bgUrl ? (
        <>
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-cover bg-center"
            style={{ backgroundImage: `url("${bgUrl}")` }}
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(180deg,rgba(6,24,46,.72) 0%,rgba(6,24,46,.5) 45%,rgba(6,24,46,.85) 100%)",
            }}
          />
        </>
      ) : null}

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <Image
          src={darkText ? "/logo.png" : "/logo-white.png"}
          alt="Hayame"
          width={220}
          height={80}
          unoptimized
          priority
          className="h-14 w-auto sm:h-16"
        />

        {settings.badge ? (
          <span
            className="mt-10 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] backdrop-blur-sm"
            style={{ background: theme.chip }}
          >
            {settings.badge}
          </span>
        ) : null}

        <h1
          className="mt-6 text-4xl font-black leading-[1.02] text-inherit sm:text-6xl"
          style={{ letterSpacing: "-0.04em" }}
        >
          {splitHeadline(settings.headline).map((part, i) => (
            <span key={i} style={part.accent ? { color: theme.accent } : undefined}>
              {part.text}
            </span>
          ))}
        </h1>

        {settings.message ? (
          <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-inherit opacity-90 sm:text-lg">
            {settings.message}
          </p>
        ) : null}

        {showTimer && settings.endsAt ? (
          <Countdown
            endsAt={settings.endsAt}
            reloadWhenDone={!embedded}
            tile={theme.tile}
            accent={theme.accent}
          />
        ) : null}

        {settings.contactEmail ? (
          <p className="mt-10 text-sm font-medium text-inherit opacity-80">
            Need us?{" "}
            <a
              href={`mailto:${settings.contactEmail}`}
              className="font-bold underline underline-offset-4"
            >
              {settings.contactEmail}
            </a>
          </p>
        ) : null}
      </div>

      <p className="pb-8 text-center text-sm font-bold text-inherit opacity-80">www.hayamegh.com</p>
    </div>
  );
}
