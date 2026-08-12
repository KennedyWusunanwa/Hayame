"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  url: string;
  title: string;
  text?: string;
  className?: string;
  size?: "sm" | "md";
};

export function ShareCarButton({ url, title, text, className, size = "md" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        // A user-cancelled share throws AbortError — nothing to do.
        if ((error as DOMException)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy share link", error);
    }
  };

  const sizeClasses = size === "sm" ? "h-10 w-10" : "h-11 w-11";

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "group relative flex items-center justify-center rounded-full border border-border bg-white text-gray-700 shadow-sm transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        sizeClasses,
        className,
      )}
    >
      {copied ? (
        <Check className="h-5 w-5 text-emerald-600" />
      ) : (
        <Share2 className="h-5 w-5" />
      )}
      <span className="sr-only">{copied ? "Link copied" : "Share this car"}</span>
      {copied ? (
        <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-white">
          Link copied
        </span>
      ) : null}
    </button>
  );
}
