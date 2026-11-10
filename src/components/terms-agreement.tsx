"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { friendlyError } from "@/lib/client-errors";
import type { TermsSection } from "@/lib/terms";

type Props = {
  version: string;
  title: string;
  lastUpdated: string;
  sections: TermsSection[];
  signedIn: boolean;
  accepted: boolean;
  acceptedAt: string | null;
  /** Where to go after accepting (a same-site path). */
  next: string | null;
};

const outlinePill =
  "inline-flex h-11 items-center justify-center rounded-full border-2 border-foreground bg-white px-6 text-sm font-semibold text-foreground shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function TermsAgreement({
  version,
  title,
  lastUpdated,
  sections,
  signedIn,
  accepted: initiallyAccepted,
  acceptedAt: initialAcceptedAt,
  next,
}: Props) {
  const router = useRouter();
  const scroller = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);
  const [accepted, setAccepted] = useState(initiallyAccepted);
  const [acceptedAt, setAcceptedAt] = useState(initialAcceptedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const update = () =>
      setAtBottom(
        element.scrollTop + element.clientHeight >= element.scrollHeight - 24,
      );
    update();
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollTo = (top: number) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.current?.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  };

  const accept = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/terms/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, platform: "web" }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        data?: { acceptedAt?: string | null };
        message?: string;
        code?: string;
      };
      if (!res.ok) {
        if (payload.code === "terms_outdated") {
          // A newer version was published while this page was open.
          router.refresh();
        }
        throw new Error(payload.message ?? "Unable to save your acceptance.");
      }
      setAccepted(true);
      setAcceptedAt(payload.data?.acceptedAt ?? new Date().toISOString());
      if (next) router.push(next);
      else router.refresh();
    } catch (err) {
      setError(friendlyError(err, "Unable to save your acceptance."));
    } finally {
      setSaving(false);
    }
  };

  const acceptedOn = acceptedAt
    ? new Date(acceptedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <section
      aria-labelledby="terms-title"
      className="relative flex h-[min(78vh,760px)] min-h-[420px] flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-soft"
    >
      <header className="shrink-0 border-b border-border px-6 pb-5 pt-6 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
          Agreement
        </p>
        <h1 id="terms-title" className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Last updated on {lastUpdated}</p>
      </header>

      <div
        ref={scroller}
        tabIndex={0}
        role="region"
        aria-label={`${title} text`}
        className="min-h-0 flex-1 overflow-y-auto px-6 py-6 focus-visible:outline-none sm:px-8"
      >
        {sections.map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={index} className="mt-3 text-sm leading-7 text-gray-600">
                {paragraph}
              </p>
            ))}
          </div>
        ))}

        <div className="flex flex-col items-center gap-4 pb-4 pt-2">
          {accepted ? (
            <p className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
              You accepted these terms{acceptedOn ? ` on ${acceptedOn}` : ""}.
            </p>
          ) : signedIn ? (
            <>
              <button
                type="button"
                onClick={accept}
                disabled={saving}
                className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-8 text-base font-semibold text-white shadow-soft transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Accept & Continue"}
              </button>
              {error ? (
                <p role="alert" className="text-center text-sm text-red-700">
                  {error}
                </p>
              ) : null}
            </>
          ) : (
            <Link
              href={`/auth/login?next=${encodeURIComponent(next ? `/terms?next=${next}` : "/terms")}`}
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-8 text-base font-semibold text-white shadow-soft transition hover:brightness-110"
            >
              Sign in to accept
            </Link>
          )}
          {accepted && next ? (
            <Link href={next} className="text-sm font-semibold text-brand">
              Back to where you were
            </Link>
          ) : null}
          <button type="button" onClick={() => scrollTo(0)} className={outlinePill}>
            Scroll to Top
          </button>
        </div>
      </div>

      {!atBottom ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-white via-white/85 to-transparent pb-5 pt-16">
          <button
            type="button"
            onClick={() => scrollTo(scroller.current?.scrollHeight ?? 0)}
            className={`${outlinePill} pointer-events-auto`}
          >
            Scroll to Bottom
          </button>
        </div>
      ) : null}
    </section>
  );
}
