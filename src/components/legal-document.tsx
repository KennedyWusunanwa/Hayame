"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, X } from "lucide-react";
import type { LegalDocument } from "@/lib/legal-docs";

const RELATED: { slug: string; href: string; label: string }[] = [
  { slug: "terms", href: "/terms", label: "Terms of Service" },
  { slug: "protection", href: "/protection", label: "Protection" },
  { slug: "cancellation", href: "/cancellation", label: "Cancellation Policy" },
  { slug: "privacy", href: "/privacy", label: "Privacy" },
];

function groupId(index: number) {
  return `section-${index + 1}`;
}

/**
 * A policy document laid out as a guide: summary, key facts, an optional
 * refund table, then grouped questions that open in place, with search and a
 * contents list.
 */
export function LegalDocumentView({
  document: doc,
  embedded = false,
}: {
  document: LegalDocument;
  /** Shown inside another page (no page title, no related links). */
  embedded?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const term = query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      doc.groups
        .map((group, index) => ({
          ...group,
          id: groupId(index),
          questions: group.questions.filter(
            (item) =>
              !term ||
              item.q.toLowerCase().includes(term) ||
              item.a.some((paragraph) => paragraph.toLowerCase().includes(term)),
          ),
        }))
        .filter((group) => group.questions.length > 0),
    [doc.groups, term],
  );
  const total = doc.groups.reduce((sum, group) => sum + group.questions.length, 0);
  const shown = groups.reduce((sum, group) => sum + group.questions.length, 0);
  const allKeys = groups.flatMap((group) => group.questions.map((item) => item.q));
  const allOpen = allKeys.length > 0 && allKeys.every((key) => open.has(key));

  const toggle = (key: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const Heading = embedded ? "h2" : "h1";

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-3xl bg-[linear-gradient(160deg,#06182E_0%,#0A2B54_55%,#0E4C8C_100%)] px-6 py-8 text-white sm:px-10 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
          {doc.eyebrow}
        </p>
        <Heading className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {doc.title}
        </Heading>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
          {doc.summary}
        </p>
        <p className="mt-4 text-xs text-white/60">
          Last updated on {doc.lastUpdated} · {total} questions answered
        </p>
      </header>

      <section aria-label="Key points" className="grid gap-3 sm:grid-cols-2">
        {doc.highlights.map((item, index) => (
          <div
            key={item.title}
            className="flex gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
              {index + 1}
            </span>
            <div>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">{item.body}</p>
            </div>
          </div>
        ))}
      </section>

      {doc.table ? (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">{doc.table.title}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">{doc.table.caption}</p>
          <div className="mt-4 hidden overflow-hidden rounded-xl border border-border sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {doc.table.columns.map((column) => (
                    <th key={column} scope="col" className="px-4 py-3 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {doc.table.rows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) =>
                      index === 0 ? (
                        <th key={index} scope="row" className="px-4 py-3.5 font-semibold text-foreground">
                          {cell}
                        </th>
                      ) : (
                        <td key={index} className="px-4 py-3.5 text-gray-700">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-3 sm:hidden">
            {doc.table.rows.map((row) => (
              <div key={row[0]} className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">{row[0]}</p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  {row.slice(1).map((cell, index) => (
                    <div key={index} className="flex justify-between gap-4">
                      <dt className="text-gray-500">{doc.table!.columns[index + 1]}</dt>
                      <dd className="text-right text-gray-800">{cell}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              On this page
            </p>
            {doc.groups.map((group, index) => (
              <a
                key={group.title}
                href={`#${groupId(index)}`}
                className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 hover:text-foreground"
              >
                {group.title}
              </a>
            ))}
          </div>
        </nav>

        <div className="min-w-0 space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-brand">
              <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              <span className="sr-only">Search the questions</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the questions"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="rounded p-0.5 text-gray-400 hover:text-gray-700">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </label>
            <button
              type="button"
              onClick={() => setOpen(allOpen ? new Set() : new Set(allKeys))}
              className="shrink-0 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              {allOpen ? "Close all" : "Open all answers"}
            </button>
          </div>

          {term ? (
            <p className="text-sm text-gray-600" role="status">
              {shown === 0
                ? "No questions match that search. Try a different word."
                : `${shown} of ${total} questions match.`}
            </p>
          ) : null}

          {groups.map((group) => (
            <section key={group.title} id={group.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {group.title}
              </h2>
              <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                {group.questions.map((item) => {
                  const expanded = open.has(item.q) || Boolean(term);
                  const panelId = `answer-${group.id}-${item.q.length}-${item.q.charCodeAt(0)}-${item.q.charCodeAt(item.q.length - 2)}`;
                  return (
                    <div key={item.q}>
                      <h3>
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-controls={panelId}
                          onClick={() => toggle(item.q)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-foreground transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                            aria-hidden="true"
                          />
                        </button>
                      </h3>
                      <div id={panelId} hidden={!expanded} className="space-y-3 px-5 pb-5 text-sm leading-7 text-gray-700">
                        {item.a.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <section className="rounded-2xl border border-brand/25 bg-brand/5 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">Still have a question?</h2>
            <p className="mt-1 text-sm leading-6 text-gray-700">{doc.contact}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/contact" className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:brightness-110">
                Contact support
              </Link>
              {embedded
                ? null
                : RELATED.filter((item) => item.slug !== doc.slug).map((item) => (
                    <Link
                      key={item.slug}
                      href={item.href}
                      className="inline-flex h-10 items-center rounded-full border border-border bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      {item.label}
                    </Link>
                  ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
