"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type AdminLoadingLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    indicator?: "inline" | "overlay";
    pendingLabel?: ReactNode;
  };

export function AdminLoadingLink({
  children,
  className,
  href,
  indicator = "inline",
  onClick,
  pendingLabel = "Loading...",
  ...props
}: AdminLoadingLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname, searchParams]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    setPending(true);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-busy={pending}
      className={cn(
        "relative transition-opacity",
        pending ? "opacity-80" : "opacity-100",
        className,
      )}
      {...props}
    >
      {children}
      {pending ? (
        indicator === "overlay" ? (
          <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-brand shadow-sm">
            <Spinner size={12} />
            {pendingLabel}
          </span>
        ) : (
          <span className="ml-2 inline-flex items-center gap-2 text-[11px] font-semibold text-brand">
            <Spinner size={12} />
            {pendingLabel}
          </span>
        )
      ) : null}
    </Link>
  );
}
