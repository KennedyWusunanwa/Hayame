import Link from "next/link";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Page the form submits to, e.g. "/admin/platform". */
  action: string;
  placeholder: string;
  query?: string;
  /** Other query-string values to keep while searching (tab, filters). */
  keep?: Record<string, string | undefined>;
  className?: string;
};

/**
 * Plain GET search box for admin lists. Submits `q` plus the kept params, so
 * it works without client JavaScript and the URL stays shareable.
 */
export function AdminSearchForm({
  action,
  placeholder,
  query = "",
  keep = {},
  className,
}: Props) {
  const kept = Object.entries(keep).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );
  const clearParams = new URLSearchParams(kept);
  const clearHref = clearParams.toString()
    ? `${action}?${clearParams.toString()}`
    : action;

  return (
    <form
      action={action}
      method="get"
      role="search"
      className={cn(
        "flex min-w-0 items-center gap-1 rounded-xl border border-border bg-white px-3 py-2 shadow-sm sm:w-80",
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
      {kept.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input
        type="search"
        name="q"
        defaultValue={query}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent px-2 text-sm text-gray-800 outline-none placeholder:text-gray-500 [&::-webkit-search-cancel-button]:hidden"
      />
      {query ? (
        <Link
          href={clearHref}
          aria-label="Clear search"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        >
          <X className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </form>
  );
}
