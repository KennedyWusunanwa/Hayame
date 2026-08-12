"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { ProtectedVehicleImage } from "@/components/protected-vehicle-image";
import { VehicleImageWatermark } from "@/components/vehicle-image-watermark";
import { Badge } from "@/components/ui/badge";
import { resolveCarImage } from "@/lib/car-images";
import { deriveHostBadgeType, hostBadgeLabel } from "@/lib/host-badges";
import { formatCurrency } from "@/lib/utils";
import type { Car } from "@/lib/types";

type Props = {
  car: Car;
  isFavorite?: boolean;
  onToggleFavorite?: (
    carId: string,
    nextValue: boolean,
  ) => void | Promise<void>;
};

export function CarCard({ car, isFavorite = false, onToggleFavorite }: Props) {
  const handleFavorite = (next: boolean) => {
    onToggleFavorite?.(car.id, next);
  };

  const hostType = deriveHostBadgeType({ hostType: car.host_type });
  const hostLabel = hostBadgeLabel(hostType);
  const yearMatch = car.title.match(/\b(?:19|20)\d{2}\b/);
  const year = yearMatch?.[0];
  const displayTitle = year
    ? car.title.replace(year, "").replace(/\s+/g, " ").trim()
    : car.title;
  const location = [car.city, car.region].filter(Boolean).join(", ");
  const priceText = formatCurrency(car.daily_price);
  const imageSrc = resolveCarImage(car.image_url, {
    id: car.id,
    title: car.title,
    city: car.city,
    region: car.region,
    carType: car.car_type,
  });

  return (
    <Link
      href={`/cars/${car.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
      aria-label={`View ${car.title}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100">
        <ProtectedVehicleImage
          src={imageSrc}
          alt={car.title}
          fill
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 280px"
        />
        <VehicleImageWatermark size="card" />
        <div
          className="absolute right-3 top-3 z-10"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <FavoriteButton
            carId={car.id}
            initialIsFavorited={isFavorite}
            onToggle={handleFavorite}
            size="md"
            className="h-10 w-10 border border-slate-200 bg-white/90 text-slate-700 shadow-md backdrop-blur hover:text-slate-900"
          />
        </div>
      </div>

      <div className="pt-3.5 space-y-1.5">
        <h3 className="line-clamp-1 text-lg font-semibold leading-tight text-foreground">
          {displayTitle}
        </h3>

        <p className="line-clamp-1 text-sm font-normal leading-tight text-gray-600">
          {year ? `${year} - ` : ""}
          {location}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {hostLabel ? (
            <Badge className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-900">
              <BadgeCheck className="h-3.5 w-3.5" />
              {hostLabel}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3 pt-1">
          <p className="min-w-0 flex-1 text-sm text-gray-600 line-clamp-2">
            {car.description}
          </p>
          <div className="shrink-0 text-right text-base font-semibold text-foreground">
            {priceText} <span className="text-sm text-[#0e86d4]">/ day</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
