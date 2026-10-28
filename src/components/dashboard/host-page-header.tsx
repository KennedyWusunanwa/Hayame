import type { ReactNode } from "react";

/**
 * Shared header for host dashboard pages: eyebrow, title, one-line
 * description and optional actions. Stacks on phones, sits side by side from
 * `sm` up.
 */
export function HostPageHeader({
  eyebrow = "Host dashboard",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] !text-brand">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight !text-[#06223a] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-xl text-sm !text-slate-600">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
