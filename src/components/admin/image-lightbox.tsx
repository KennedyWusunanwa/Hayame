"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ExternalLink, X, ZoomIn, ZoomOut } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type PreviewItem = { label: string; src: string };

function Lightbox({ items, start, onClose }: { items: PreviewItem[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [zoomed, setZoomed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const item = items[index];
  const many = items.length > 1;

  const go = useCallback(
    (step: number) => {
      setIndex((i) => (i + step + items.length) % items.length);
      setStatus("loading");
      setZoomed(false);
    },
    [items.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight" && many) go(1);
      else if (event.key === "ArrowLeft" && many) go(-1);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [go, many, onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.label}
      className="admin-fade-in fixed inset-0 z-[100] flex flex-col bg-[#030b16]/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <p className="min-w-0 truncate text-sm font-semibold">
          {item.label}
          {many ? <span className="ml-2 font-normal text-white/60">{index + 1} / {items.length}</span> : null}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white/85 hover:bg-white/10"
          >
            {zoomed ? <ZoomOut className="h-4 w-4" aria-hidden="true" /> : <ZoomIn className="h-4 w-4" aria-hidden="true" />}
            {zoomed ? "Fit" : "Zoom"}
          </button>
          <a
            href={item.src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white/85 hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Original
          </a>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
        {many ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </>
        ) : null}

        {status === "loading" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
            <Spinner size={28} />
            <span className="text-sm">Loading image…</span>
          </div>
        ) : null}
        {status === "error" ? (
          <p className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
            Couldn&apos;t load this image. Try &quot;Original&quot;, or check the file was uploaded.
          </p>
        ) : null}

        <div
          className={cn("max-h-full max-w-full", zoomed ? "overflow-auto" : "flex items-center justify-center")}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            key={item.src}
            src={item.src}
            alt={item.label}
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
            onClick={() => setZoomed((z) => !z)}
            className={cn(
              "select-none rounded-lg shadow-2xl transition-opacity duration-200",
              status === "ready" ? "opacity-100" : "opacity-0",
              zoomed ? "max-w-none cursor-zoom-out" : "max-h-[calc(100vh-7rem)] max-w-full cursor-zoom-in object-contain",
            )}
            style={zoomed ? { width: "min(220vw, 2200px)" } : undefined}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** A text link or button that previews images in a pop-up instead of leaving the page. */
export function PreviewLink({
  items,
  index = 0,
  className,
  children,
}: {
  items: PreviewItem[];
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open ? <Lightbox items={items} start={index} onClose={close} /> : null}
    </>
  );
}

/** Face photo and ID images as thumbnails; click one to open it large, with arrows to flip between them. */
export function EvidenceGallery({ items }: { items: { label: string; src: string | null; empty: string }[] }) {
  const available = items.filter((i): i is { label: string; src: string; empty: string } => Boolean(i.src));
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => {
          const at = available.findIndex((a) => a.label === item.label);
          return (
            <div key={item.label} className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold text-gray-500">{item.label}</p>
              {item.src ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpen(at)}
                    aria-label={`Preview ${item.label}`}
                    className="group relative mt-2 block w-full overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <img src={item.src} alt={item.label} className="h-40 w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100">
                      Click to enlarge
                    </span>
                  </button>
                  <button type="button" onClick={() => setOpen(at)} className="mt-2 inline-flex text-xs font-semibold text-brand">
                    Preview
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-600">{item.empty}</p>
              )}
            </div>
          );
        })}
      </div>
      {open !== null && available.length > 0 ? <Lightbox items={available} start={open} onClose={close} /> : null}
    </>
  );
}
