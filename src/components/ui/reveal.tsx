"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra transition-delay in ms, useful for staggering siblings. */
  delay?: number;
};

type State = "hidden" | "quick" | "visible";

/**
 * Fades + lifts content in once it scrolls into view.
 *
 * Content that is already on screen when the component mounts (the top of a
 * page right after navigation, or on first load) gets a short fade that lands
 * together with the page's own entrance, instead of a second, slower slide-in
 * stacked on top of it. Below-the-fold content keeps the scroll reveal.
 * Server-rendered hidden by the `.reveal` CSS class, so there's no flash of
 * content before hydration — see the noscript fallback in the root layout.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("hidden");

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setState("visible");
      return;
    }

    const rect = node.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      // Already on screen: join the page entrance rather than animate separately.
      setState("quick");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setState("visible"));
          observer.unobserve(node);
        }
      },
      // threshold 0 so a tall section whose top sliver is in frame still reveals.
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "reveal",
        state === "visible" && "is-visible",
        state === "quick" && "is-visible is-quick",
        className,
      )}
      style={
        delay && state !== "quick"
          ? { transitionDelay: `${delay}ms` }
          : undefined
      }
    >
      {children}
    </div>
  );
}
