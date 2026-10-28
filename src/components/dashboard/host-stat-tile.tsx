import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "blue" | "green" | "amber" | "rose" | "navy";

const TONES: Record<Tone, string> = {
  blue: "bg-sky-50 text-brand",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  navy: "bg-slate-100 text-[#06223a]",
};

/**
 * Stat tile in the marketing site's card language: soft sky border, airy
 * shadow, tinted icon chip, big number. Wraps in a link when `href` is set.
 */
export function HostStatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
  href,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          TONES[tone],
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 break-words text-xl font-bold tracking-tight !text-[#06223a] sm:text-2xl">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider !text-slate-500 sm:text-xs">
        {label}
      </p>
      {hint ? <p className="mt-1 text-xs !text-slate-500">{hint}</p> : null}
    </>
  );

  const shell = cn(
    "block min-w-0 rounded-[1.5rem] border border-sky-100 bg-white p-4 shadow-[0_18px_50px_rgba(14,134,212,0.06)] sm:p-5",
    href && "card-hover",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={shell}>
        {body}
      </Link>
    );
  }
  return <div className={shell}>{body}</div>;
}
