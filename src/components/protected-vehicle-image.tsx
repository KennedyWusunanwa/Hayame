"use client";

import Image, { type ImageProps } from "next/image";
import type { SyntheticEvent } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "draggable">;

function preventImageDownload(event: SyntheticEvent<HTMLElement>) {
  event.preventDefault();
}

/**
 * Deters common browser image-saving gestures while preserving normal card,
 * gallery, keyboard, and swipe interactions.
 */
export function ProtectedVehicleImage({
  alt,
  className,
  style,
  ...props
}: Props) {
  return (
    <Image
      {...props}
      alt={alt}
      draggable={false}
      className={cn(
        "select-none [-webkit-touch-callout:none] [-webkit-user-drag:none]",
        className,
      )}
      style={{ userSelect: "none", ...style }}
      onContextMenu={preventImageDownload}
      onDragStart={preventImageDownload}
      onCopy={preventImageDownload}
    />
  );
}
