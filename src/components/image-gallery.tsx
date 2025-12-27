"use client";
import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
};

export function ImageGallery({ images }: Props) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative h-72 w-full overflow-hidden rounded-xl border border-border">
        <Image
          src={main}
          alt="Car photo"
          fill
          className="h-full w-full object-cover"
          sizes="(max-width:768px) 100vw, 640px"
        />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {images.map((img, idx) => (
          <button
            key={img}
            onClick={() => setActive(idx)}
            className={`relative h-20 overflow-hidden rounded-lg border ${idx === active ? "border-primary" : "border-border"}`}
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
    </div>
  );
}
