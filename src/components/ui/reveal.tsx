"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra transition-delay in ms, useful for staggering siblings. */
  delay?: number;
};

/**
 * Fades + slides content in once it actually scrolls into view, instead of
 * animating on page load (which finishes long before a user scrolls to
 * below-the-fold sections and leaves images popping in on their own).
 * Server-rendered hidden by the `.reveal` CSS class itself, so there's no
 * flash-of-hidden-content before hydration — see the noscript fallback in
 * the root layout for when JS never runs at all.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Defer a frame so the browser has actually painted the hidden
          // state at least once first — otherwise an element that's already
          // in view the moment it's observed (e.g. right after a page
          // transition) jumps straight to visible instead of transitioning.
          requestAnimationFrame(() => setVisible(true));
          observer.unobserve(node);
        }
      },
      // threshold: 0 fires as soon as any part of the target enters the
      // viewport. A higher threshold (e.g. 0.15 of the target's own area)
      // breaks down for tall composite sections — on a short mobile
      // viewport, a large wrapped block can sit with only its top sliver in
      // frame at load, never crossing 15% of its own height until the user
      // scrolls further, so it stays invisible even though it's on screen.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
