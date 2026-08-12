import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "card" | "gallery";
};

export function VehicleImageWatermark({
  className,
  size = "gallery",
}: Props) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-[1] flex items-center justify-center",
        className,
      )}
    >
      <Image
        src="/logo-white.png"
        alt=""
        width={1808}
        height={944}
        className={cn(
          "h-auto object-contain opacity-[0.16] drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)]",
          size === "card" ? "w-[34%] max-w-28" : "w-36 sm:w-[150px]",
        )}
        sizes={size === "card" ? "112px" : "150px"}
      />
    </span>
  );
}
