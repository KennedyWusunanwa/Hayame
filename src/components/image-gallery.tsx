"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { resolveCarImages, type CarImageFallbackInput } from "@/lib/car-images";

type Props = {
  images: string[];
  fallbackContext?: CarImageFallbackInput;
};

export function ImageGallery({ images, fallbackContext }: Props) {
  const safeImages = useMemo(
    () => resolveCarImages(images, fallbackContext),
    [fallbackContext, images],
  );

  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const canNavigate = safeImages.length > 1;
  const main = safeImages[active] ?? safeImages[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  const openAt = (idx: number) => {
    setActive(idx);
    setOpen(true);
  };

  const goNext = useCallback(() => {
    if (!canNavigate) return;
    setActive((prev) => (prev + 1) % safeImages.length);
  }, [canNavigate, safeImages.length]);

  const goPrev = useCallback(() => {
    if (!canNavigate) return;
    setActive((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  }, [canNavigate, safeImages.length]);

  useEffect(() => {
    if (active >= safeImages.length) {
      setActive(0);
    }
  }, [active, safeImages.length]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key === "ArrowRight") {
        goNext();
      }
      if (event.key === "ArrowLeft") {
        goPrev();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, goNext, goPrev]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!canNavigate) return;
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!canNavigate || touchStartX.current === null) return;
    touchDeltaX.current =
      (event.touches[0]?.clientX ?? 0) - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (!canNavigate || touchStartX.current === null) return;
    const delta = touchDeltaX.current;
    if (Math.abs(delta) > 60) {
      if (delta < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] h-screen w-screen bg-black/90"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Full screen image viewer"
    >
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fixed right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[10000] flex items-center gap-2 sm:top-6 sm:right-6">
          <button
            type="button"
            className="rounded-full border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={() => setOpen(false)}
            aria-label="Close full screen viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative flex w-full max-w-6xl flex-col items-center">
          <div
            className="relative h-[75vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-black sm:h-[80vh]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={main}
              alt="Car photo full screen"
              fill
              className="h-full w-full object-contain"
              sizes="100vw"
              priority
            />
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute right-6 top-6 rounded-full border border-white/30 bg-black/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                Hayame
              </div>
              <div className="absolute bottom-8 left-6 text-[10px] font-semibold uppercase tracking-[0.5em] text-white/30">
                Hayame
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={goPrev}
            disabled={!canNavigate}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-30"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canNavigate}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-30"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {canNavigate ? (
            <div className="mt-4 flex w-full max-w-6xl items-center justify-between text-xs text-white/70">
              <span>
                {active + 1} / {safeImages.length}
              </span>
              <span>Swipe to view more</span>
            </div>
          ) : null}
          {canNavigate ? (
            <div className="mt-4 flex w-full max-w-6xl gap-2 overflow-x-auto pb-2">
              {safeImages.map((img, idx) => (
                <button
                  key={`fullscreen-${img}-${idx}`}
                  type="button"
                  onClick={() => setActive(idx)}
                  className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border ${
                    idx === active ? "border-white" : "border-white/20"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="relative h-[22rem] w-full overflow-hidden rounded-xl border border-border bg-black/5 sm:h-[28rem] lg:h-[34rem]"
        onClick={() => openAt(active)}
        aria-label="Open full screen image viewer"
      >
        <Image
          src={main}
          alt="Car photo"
          fill
          className="h-full w-full object-contain"
          sizes="(max-width:768px) 100vw, (max-width:1200px) 70vw, 900px"
        />
      </button>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {safeImages.map((img, idx) => (
          <button
            key={`${img}-${idx}`}
            onClick={() => setActive(idx)}
            className={`relative h-20 overflow-hidden rounded-lg border ${
              idx === active ? "border-primary" : "border-border"
            }`}
            aria-label={`View image ${idx + 1}`}
          >
            <Image
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              fill
              className="h-full w-full object-cover"
              sizes="120px"
            />
          </button>
        ))}
      </div>
      {open && mounted ? createPortal(modal, document.body) : null}
    </div>
  );
}
