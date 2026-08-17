"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Drop-in replacement for next/image that fades the image in once it has
 * actually finished loading, instead of letting the browser pop it in the
 * instant the bytes arrive. Only meant for below-the-fold, non-priority
 * images — priority/LCP images should stay a plain <Image>.
 */
export function FadeImage({ className, onLoad, alt, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  const checkAlreadyLoaded = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <Image
      {...props}
      alt={alt}
      ref={checkAlreadyLoaded}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      className={cn(
        "transition-opacity duration-500 ease-out",
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
