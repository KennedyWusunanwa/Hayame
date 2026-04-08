import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Shield, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BookingWidget } from "@/components/booking-widget";
import { FavoriteButton } from "@/components/favorite-button";
import { ImageGallery } from "@/components/image-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { detailIcons, getFeatureIcon } from "@/lib/feature-icons";
import type { Database } from "@/lib/database.types";
import { mockCars } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

type Owner = {
  id?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  city?: string | null;
};

type CarDetail = {
  id: string;
  title: string;
  description?: string | null;
  daily_price: number;
  city?: string | null;
  region?: string | null;
  car_type?: string | null;
  seats?: number | null;
  transmission?: string | null;
  fuel?: string | null;
  features?: string[] | null;
  is_available?: boolean | null;
  photos: { url: string }[];
  owner?: Owner | null;
  rating?: number;
  reviews?: number;
  created_at?: string | null;
};

type AvailabilityWindow = {
  start_date: string;
  end_date: string;
  available: boolean | null;
};

type LoadedCar = {
  car: CarDetail | null;
  availability: AvailabilityWindow[];
  isFavorite: boolean;
};

type SupabaseCar = Database["public"]["Tables"]["cars"]["Row"] & {
  car_photos?: { url: string }[];
  owner?: Owner | null;
};

export default async function CarDetailPage({ params }: PageProps) {
  const { car, availability, isFavorite } = await loadCar(params.id);

  if (!car) {
    return <NotFoundState />;
  }

  const galleryImages = Array.from(
    new Set([
      ...(car.photos?.map((p) => p.url).filter(Boolean) as string[]),
      "/car-placeholder.jpg",
    ]),
  );
  const addedDate = car.created_at ? new Date(car.created_at) : null;
  const addedLabel =
    addedDate && !isNaN(addedDate.getTime())
      ? format(addedDate, "MMM d, yyyy")
      : null;
  const featureItems = (car.features ?? []).map((feature) => ({
    label: feature,
    Icon: getFeatureIcon(feature),
  }));

  const details = [
    {
      label: "Location",
      value: [car.city, car.region].filter(Boolean).join(", ") || "ΓÇö",
      icon: detailIcons.location,
    },
    {
      label: "Car type",
      value: car.car_type ?? "ΓÇö",
      icon: detailIcons.carType,
    },
    {
      label: "Seats",
      value: car.seats ? `${car.seats} seats` : "ΓÇö",
      icon: detailIcons.seats,
    },
    {
      label: "Transmission",
      value: car.transmission ?? "ΓÇö",
      icon: detailIcons.transmission,
    },
    {
      label: "Fuel",
      value: car.fuel ?? "ΓÇö",
      icon: detailIcons.fuel,
    },
    {
      label: "Region",
      value: car.region ?? car.city ?? "ΓÇö",
      icon: detailIcons.location,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-brand">
              Car in {car.city ?? "ΓÇö"}
            </p>
            {car.car_type ? (
              <Badge variant="muted">{car.car_type}</Badge>
            ) : null}
            {addedLabel ? (
              <Badge variant="outline">Added {addedLabel}</Badge>
            ) : null}
          </div>
          <div className="flex items-start gap-3">
            <h1 className="text-3xl font-semibold text-foreground">
              {car.title}
            </h1>
            <FavoriteButton
              carId={car.id}
              initialIsFavorited={isFavorite}
              className="mt-1"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-brand" />
              {[car.city, car.region].filter(Boolean).join(", ") || "ΓÇö"}
            </span>
            {car.rating ? (
              <span className="flex items-center gap-1 text-amber-600">
                <Star className="h-4 w-4" /> {car.rating}{" "}
                {car.reviews ? (
                  <span className="text-gray-600">({car.reviews} reviews)</span>
                ) : null}
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-xs uppercase text-gray-500">Daily rate</p>
          <p className="text-2xl font-semibold text-foreground">
            {formatCurrency(car.daily_price)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,360px]">
        <div className="space-y-6">
          <ImageGallery images={galleryImages} />

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {details.map((detail) => (
                <DetailRow
                  key={detail.label}
                  label={detail.label}
                  value={detail.value}
                  Icon={detail.icon}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700">
              {car.description ?? "No description provided for this car yet."}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {featureItems.length === 0 ? (
                <p className="text-sm text-gray-600">No features listed.</p>
              ) : (
                featureItems.map(({ label, Icon }) => (
                  <FeatureChip key={label} label={label} Icon={Icon} />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <ReviewCard
                name="Adwoa"
                text="Smooth pickup, clean car, AC was perfect for Accra traffic."
                rating={5}
              />
              <ReviewCard
                name="Nana"
                text="Great communication and flexible return time."
                rating={4}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6">
          <AvailabilitySummary
            availability={availability}
            isAvailable={car.is_available}
          />
          <BookingWidget carId={car.id} dailyPrice={car.daily_price} />
          <HostCard owner={car.owner} />
        </div>
      </div>
    </div>
  );
}

async function loadCar(id: string): Promise<LoadedCar> {
  let car: CarDetail | null = null;
  let availability: AvailabilityWindow[] = [];
  let isFavorite = false;

  // Fetch car via our own API (relative URL to avoid host/env issues)
  try {
    const res = await fetch(`/api/cars/${id}`, { cache: "no-store" });
    if (res.ok) {
      const { data } = (await res.json()) as { data?: SupabaseCar };
      if (data) {
        car = {
          id: data.id,
          title: data.title,
          description: data.description,
          daily_price: Number(data.daily_price ?? 0),
          city: data.city,
          region: data.region,
          car_type: data.car_type,
          seats: data.seats,
          transmission: data.transmission,
          fuel: data.fuel,
          features: data.features,
          is_available: data.is_available,
          photos: data.car_photos ?? [],
          owner: null,
          rating: 4.8,
          reviews: 0,
          created_at: data.created_at,
        };
      }
    }
  } catch (error) {
    console.warn("API car fetch failed", error);
  }

  // Try server client for availability + favorites
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!car) {
      const { data: carData } = await supabase
        .from("cars")
        .select(
          "*, car_photos(url), owner:profiles!cars_owner_id_fkey(id, full_name, avatar_url, city)",
        )
        .eq("id", id)
        .maybeSingle();
      const supabaseCar = carData as SupabaseCar | null;
      if (supabaseCar) {
        car = {
          id: supabaseCar.id,
          title: supabaseCar.title,
          description: supabaseCar.description,
          daily_price: Number(supabaseCar.daily_price ?? 0),
          city: supabaseCar.city,
          region: supabaseCar.region,
          car_type: supabaseCar.car_type,
          seats: supabaseCar.seats,
          transmission: supabaseCar.transmission,
          fuel: supabaseCar.fuel,
          features: supabaseCar.features,
          is_available: supabaseCar.is_available,
          photos: supabaseCar.car_photos ?? [],
          owner: supabaseCar.owner ?? null,
          rating: 4.8,
          reviews: 0,
          created_at: supabaseCar.created_at,
        };
      }
    }

    const { data: availabilityData } = await supabase
      .from("car_availability")
      .select("start_date,end_date,available")
      .eq("car_id", id);
    availability = availabilityData ?? [];

    if (user) {
      const { data: favoriteRow } = await supabase
        .from("favorites")
        .select("car_id")
        .eq("car_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      isFavorite = Boolean(favoriteRow);
    }
  } catch (error) {
    console.warn("Supabase client fetch failed", error);
  }

  if (!car) {
    const mock = mockCars.find((c) => c.id === id);
    if (mock) {
      car = {
        id: mock.id,
        title: mock.name,
        description: mock.description,
        daily_price: mock.daily_price,
        city: mock.city,
        region: mock.region,
        car_type: mock.car_type,
        seats: mock.seats,
        transmission: mock.transmission,
        fuel: mock.fuel,
        features: mock.features,
        is_available: true,
        photos: [{ url: mock.image }],
        owner: {
          id: "mock-owner",
          full_name: mock.host.name,
          avatar_url: mock.host.avatar,
          city: mock.city,
        },
        rating: mock.rating,
        reviews: mock.reviews,
      };
    }
  }

  return { car, availability, isFavorite };
}

function DetailRow({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon: typeof MapPin;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-white px-3 py-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10">
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FeatureChip({ label, Icon }: { label: string; Icon: LucideIcon }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-gray-50 px-3 py-2 text-sm font-medium text-foreground">
      <Icon className="h-4 w-4 text-brand" />
      {label}
    </span>
  );
}

function AvailabilitySummary({
  availability,
  isAvailable,
}: {
  availability: AvailabilityWindow[];
  isAvailable?: boolean | null;
}) {
  const statusLabel = isAvailable === false ? "Unavailable" : "Available";
  const statusTone =
    isAvailable === false
      ? "rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"
      : "rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700";

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">Status</p>
          <span className={statusTone}>{statusLabel}</span>
        </div>
        {availability.length > 0 ? (
          <div className="space-y-2">
            {availability.slice(0, 3).map((slot) => (
              <div
                key={`${slot.start_date}-${slot.end_date}`}
                className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
              >
                {(() => {
                  const start = slot.start_date
                    ? new Date(slot.start_date)
                    : null;
                  const end = slot.end_date ? new Date(slot.end_date) : null;
                  const validRange =
                    start &&
                    end &&
                    !Number.isNaN(start.getTime()) &&
                    !Number.isNaN(end.getTime());
                  const label = validRange
                    ? `${format(start, "MMM d")} - ${format(end, "MMM d")}`
                    : "Dates TBD";
                  return (
                    <div>
                      <p className="text-xs uppercase text-gray-500">Window</p>
                      <p className="text-sm font-semibold text-foreground">
                        {label}
                      </p>
                    </div>
                  );
                })()}
                <Badge
                  variant={slot.available === false ? "outline" : "secondary"}
                >
                  {slot.available === false ? "Unavailable" : "Open"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            No availability windows posted yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function HostCard({ owner }: { owner?: Owner | null }) {
  const avatar = owner?.avatar_url ?? "/car-placeholder.jpg";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Host</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border">
            <Image
              src={avatar}
              alt={owner?.full_name ?? "Host"}
              fill
              className="object-cover"
              sizes="60px"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {owner?.full_name ?? "Host"}
            </p>
            <p className="flex items-center gap-1 text-xs text-gray-600">
              <Shield className="h-3 w-3 text-primary" />{" "}
              {owner?.city ?? "Location TBD"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="#" onClick={(e) => e.preventDefault()}>
            View host
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ReviewCard({
  name,
  text,
  rating,
}: {
  name: string;
  text: string;
  rating: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground">{name}</p>
        <div className="flex items-center gap-1 text-amber-500">
          {[...Array(rating)].map((_, idx) => (
            <Star key={idx} className="h-4 w-4 fill-amber-500" />
          ))}
        </div>
      </div>
      <p className="text-gray-700">{text}</p>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Card className="border-dashed">
        <CardContent className="space-y-4 py-10 text-center">
          <p className="text-sm font-semibold text-primary">Car not found</p>
          <p className="text-lg text-foreground">
            We could not find that car. Try exploring the catalog.
          </p>
          <Button asChild>
            <Link href="/explore">Back to explore</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
