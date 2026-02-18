"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Car } from "@/lib/types";

type Props = {
  car: Car;
  isFavorite?: boolean;
  onToggleFavorite?: (carId: string, nextValue: boolean) => void | Promise<void>;
};

export function CarCard({ car, isFavorite = false, onToggleFavorite }: Props) {
  const handleFavorite = (next: boolean) => {
    onToggleFavorite?.(car.id, next);
  };

  return (
    <Link
      href={`/cars/${car.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
      aria-label={`View ${car.title}`}
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={car.image_url ?? "/car-placeholder.jpg"}
          alt={car.title}
          fill
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 400px"
        />
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
            size="sm"
            className="bg-white/95"
          />
        </div>
        {car.car_type ? (
          <Badge variant="muted" className="absolute left-3 top-3">
            {car.car_type}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{car.title}</h3>
            <p className="flex items-center text-sm text-gray-600">
              <MapPin className="mr-1 h-4 w-4 text-brand" />
              {car.city}, {car.region}
            </p>
          </div>
          {car.rating ? (
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Star className="h-4 w-4 text-amber-500" />
              {car.rating}
            </div>
          ) : null}
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{car.description}</p>
        <div className="mt-auto flex items-center justify-between">
          <div className="text-base font-semibold text-foreground">
            {formatCurrency(car.daily_price)} <span className="text-sm text-gray-500">/ day</span>
          </div>
          <Button asChild size="sm" className="shadow-soft">
            <span>Book Now</span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
