import type { ReactNode } from "react";
import { ROLE_META, type AdminRole } from "@/lib/admin-permissions";
import type { AdminSeverity } from "@/lib/admin-actions-catalog";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
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
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0A2B54] sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border/80 bg-white p-5 shadow-[0_1px_2px_rgba(10,43,84,0.04)] sm:p-6", className)}>
      {title || actions ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-base font-bold text-[#0A2B54]">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const SEVERITY_STYLES: Record<AdminSeverity, string> = {
  info: "bg-gray-100 text-gray-700",
  important: "bg-amber-100 text-amber-900",
  critical: "bg-red-100 text-red-800",
};

export function SeverityPill({ severity }: { severity: AdminSeverity }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", SEVERITY_STYLES[severity])}>
      {severity}
    </span>
  );
}

const ROLE_STYLES: Record<AdminRole, string> = {
  super_admin: "bg-[#0A2B54] text-white",
  admin: "bg-brand/10 text-brand",
  support: "bg-emerald-100 text-emerald-800",
  finance: "bg-violet-100 text-violet-800",
};

export function RoleBadge({ role, className }: { role: AdminRole; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold", ROLE_STYLES[role], className)}>
      {ROLE_META[role].label}
    </span>
  );
}

export const inputClass =
  "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";
export const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60";
export const dangerButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60";
