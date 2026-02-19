// Smoke test checklist:
// - Open /cars/<uuid> in prod, must render details
// - Open /api/cars/<uuid>, must return 200 JSON
// - If invalid uuid, must show Car not found

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Shield, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { AvailabilityPreview } from "@/components/availability-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/favorite-button";
import { BookingWidget } from "@/components/booking-widget";
import { ImageGallery } from "@/components/image-gallery";
import { ListingViewTracker } from "@/components/listing-view-tracker";
import { ReviewForm, type ReviewableBooking } from "@/components/review-form";
import { HostMessageCard } from "@/components/messages/host-message-card";
import { VerifiedHostIndicator } from "@/components/verified-host-indicator";
import { VerificationBadges } from "@/components/verification-badges";
import { detailIcons, getFeatureIcon } from "@/lib/feature-icons";
import { deriveHostBadgeType } from "@/lib/host-badges";
import type { Database } from "@/lib/database.types";
import { mockCars, type MockCar } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageParams = { id: string };
type PageProps = {
  params: PageParams | Promise<PageParams>;
};

type Owner = {
  id?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  id_verified?: boolean | null;
  phone_verified?: boolean | null;
  email_verified?: boolean | null;
  is_host?: boolean | null;
  host_level?: string | null;
};

type CarDetail = {
  id: string;
  title: string;
  description?: string | null;
  daily_price: number;
  city?: string | null;
  region?: string | null;
  car_type?: string | null;
  brand?: string | null;
  model?: string | null;
  fuel_type?: string | null;
  seats?: number | null;
  transmission?: string | null;
  fuel?: string | null;
  features?: string[] | null;
  is_available?: boolean | null;
  instant_book?: boolean | null;
  delivery_fee?: number | null;
  insurance_fee?: number | null;
  deposit_amount?: number | null;
  cancellation_policy?: string | null;
  approval_status?: string | null;
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

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  user_id: string;
  profiles?: { full_name?: string | null; avatar_url?: string | null } | null;
};

type ExistingBooking = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at?: string | null;
};

type SupabaseCar = Database["public"]["Tables"]["cars"]["Row"] & {
  car_photos?: { url: string }[];
  owner?: Owner | null;
};

export default async function CarDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  console.log("[car-detail] start", resolvedParams);
  const { car, availability, isFavorite, reviews, userId, reviewableBookings, platformFeePercent, existingBooking } =
    await loadCar(resolvedParams.id);

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
    addedDate && !isNaN(addedDate.getTime()) ? format(addedDate, "MMM d, yyyy") : null;
  const featureItems = (car.features ?? []).map((feature) => ({
    label: feature,
    Icon: getFeatureIcon(feature),
  }));

  const details = [
    {
      label: "Location",
      value: [car.city, car.region].filter(Boolean).join(", ") || "—",
      icon: detailIcons.location,
    },
    {
      label: "Brand",
      value: car.brand ?? "—",
      icon: detailIcons.carType,
    },
    {
      label: "Model",
      value: car.model ?? "—",
      icon: detailIcons.carType,
    },
    {
      label: "Car type",
      value: car.car_type ?? "—",
      icon: detailIcons.carType,
    },
    {
      label: "Seats",
      value: car.seats ? `${car.seats} seats` : "—",
      icon: detailIcons.seats,
    },
    {
      label: "Transmission",
      value: car.transmission ?? "—",
      icon: detailIcons.transmission,
    },
    {
      label: "Fuel",
      value: car.fuel_type ?? car.fuel ?? "—",
      icon: detailIcons.fuel,
    },
    {
      label: "Region",
      value: car.region ?? car.city ?? "—",
      icon: detailIcons.location,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <ListingViewTracker carId={car.id} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-brand">Car in {car.city ?? "—"}</p>
            {car.car_type ? <Badge variant="muted">{car.car_type}</Badge> : null}
            {addedLabel ? <Badge variant="outline">Added {addedLabel}</Badge> : null}
          </div>
          <div className="flex items-start gap-3">
            <h1 className="text-3xl font-semibold text-foreground">{car.title}</h1>
            <FavoriteButton carId={car.id} initialIsFavorited={isFavorite} className="mt-1" />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-brand" />
              {[car.city, car.region].filter(Boolean).join(", ") || "—"}
            </span>
            {car.rating ? (
              <span className="flex items-center gap-1 text-amber-600">
                <Star className="h-4 w-4" /> {car.rating}{" "}
                {car.reviews ? <span className="text-gray-600">({car.reviews} reviews)</span> : null}
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-xs uppercase text-gray-500">Daily rate</p>
          <p className="text-2xl font-semibold text-foreground">{formatCurrency(car.daily_price)}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-x-8 gap-y-6 lg:grid-cols-[1fr,360px]">
        {existingBooking ? <BookedNotice booking={existingBooking} /> : null}
        <div className="contents lg:block lg:space-y-6">
          <div className="order-1 lg:order-none">
            <ImageGallery images={galleryImages} />
          </div>

          <Card className="order-3 lg:order-none">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {details.map((detail) => (
                <DetailRow key={detail.label} label={detail.label} value={detail.value} Icon={detail.icon} />
              ))}
            </CardContent>
          </Card>

          <Card className="order-5 lg:order-none">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700">
              {car.description ?? "No description provided for this car yet."}
            </CardContent>
          </Card>

          <Card className="order-6 lg:order-none">
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

          <Card className="order-7 lg:order-none">
            <CardHeader>
              <CardTitle>Latest reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    name={review.profiles?.full_name ?? "Guest"}
                    avatarUrl={review.profiles?.avatar_url ?? null}
                    text={review.comment ?? "No comment provided."}
                    rating={review.rating}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-600">No reviews yet. Be the first to share your experience.</p>
              )}
            </CardContent>
          </Card>

          <Card className="order-8 lg:order-none">
            <CardHeader>
              <CardTitle>Leave a review</CardTitle>
            </CardHeader>
            <CardContent>
              {!userId ? (
                <p className="text-sm text-gray-600">
                  <Link className="font-semibold text-brand" href="/auth/login">
                    Sign in
                  </Link>{" "}
                  to leave a review.
                </p>
              ) : null}
              <ReviewForm
                carId={car.id}
                bookings={reviewableBookings}
                disabled={!userId || reviewableBookings.length === 0}
                disabledMessage={
                  !userId
                    ? "Sign in to leave a review."
                    : "Only guests with completed trips can review this listing."
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="contents lg:sticky lg:top-6 lg:block lg:space-y-4">
          <div className="order-2 lg:order-none">
            <AvailabilitySummary availability={availability} isAvailable={car.is_available} />
          </div>
          <div className="order-3 lg:order-none">
            <AvailabilityPreview carId={car.id} />
          </div>
          <div className="order-4 lg:order-none">
            <div id="booking-widget">
              <BookingWidget
                carId={car.id}
                dailyPrice={car.daily_price}
                platformFeePercent={platformFeePercent}
                instantBook={car.instant_book}
                deliveryFee={car.delivery_fee}
                insuranceFee={car.insurance_fee}
                depositAmount={car.deposit_amount}
                cancellationPolicy={car.cancellation_policy}
                hostVerification={{
                  idVerified: car.owner?.id_verified,
                  phoneVerified: car.owner?.phone_verified,
                  emailVerified: car.owner?.email_verified,
                }}
              />
            </div>
          </div>
          <div className="order-9 lg:order-none">
            <HostCard owner={car.owner} rating={car.rating} reviews={car.reviews} />
          </div>
          <div className="order-10 lg:order-none">
            <HostMessageCard hostId={car.owner?.id} hostName={car.owner?.full_name} carId={car.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

async function getCarFromInternalApi(id: string): Promise<SupabaseCar | null> {
  let lastError: unknown;

  // Try relative fetch first (server-side)
  try {
    const res = await fetch(`/api/cars/${id}`, { cache: "no-store" });
    if (res.ok) {
      const { data } = (await res.json()) as { data?: SupabaseCar };
      return data ?? null;
    }
    if (res.status === 404) return null;
    lastError = new Error(`status ${res.status}`);
    throw lastError;
  } catch (error) {
    lastError = error ?? lastError;
    console.error("[car-detail] relative fetch failed", { id, error: lastError });
  }

  // Absolute fallback
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  if (process.env.NODE_ENV !== "production") {
    console.log("[car-detail] using origin", origin);
  }
  try {
    const res = await fetch(`${origin}/api/cars/${id}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`status ${res.status}`);
    const { data } = (await res.json()) as { data?: SupabaseCar };
    return data ?? null;
  } catch (error) {
    console.error("[car-detail] fetch failed", { id, error, origin, lastError });
    throw error;
  }
}

async function loadCar(id: string): Promise<{
  car: CarDetail | null;
  availability: AvailabilityWindow[];
  isFavorite: boolean;
  reviews: ReviewRow[];
  userId: string | null;
  reviewableBookings: ReviewableBooking[];
  platformFeePercent: number;
  existingBooking: ExistingBooking | null;
}> {
  const mock = mockCars.find((c) => c.id === id);
  if (mock) {
    console.log("[car-detail] using mock", id);
    return {
      car: mapMockCar(mock),
      availability: [],
      isFavorite: false,
      reviews: [],
      userId: null,
      reviewableBookings: [],
      platformFeePercent: 10,
      existingBooking: null,
    };
  }

  if (!isUUID(id)) {
    console.log("[car-detail] not uuid", id);
    notFound();
  }

  // Fetch directly from Supabase REST first (anon key works in prod)
  const restCar = await getCarFromSupabaseRest(id);
  console.log("[car-detail] rest car", { id, found: Boolean(restCar) });
  let car = restCar ? mapCar(restCar) : null;

  // Fallback: call our internal API
  if (!car) {
    const apiCar = await getCarFromInternalApi(id);
    console.log("[car-detail] api car", { id, found: Boolean(apiCar) });
    car = apiCar ? mapCar(apiCar) : null;
  }

  let availability: AvailabilityWindow[] = [];
  let isFavorite = false;
  let reviews: ReviewRow[] = [];
  let userId: string | null = null;
  let reviewableBookings: ReviewableBooking[] = [];
  let platformFeePercent = 10;
  let existingBooking: ExistingBooking | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    if (!car) {
      const { data: carData } = await supabase
        .from("cars")
        .select(
          "*, car_photos(url), owner:profiles!cars_owner_id_fkey(id, full_name, avatar_url, city, is_host, id_verified, phone_verified, email_verified, host_level)",
        )
        .eq("id", id)
        .maybeSingle();
      if (carData) {
        console.log("[car-detail] supabase client car", { id, found: true });
        car = mapCar(carData as SupabaseCar);
      }
    }

    if (!car && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const params = new URLSearchParams({
        id: `eq.${id}`,
        select:
          "*, car_photos(url), owner:profiles!cars_owner_id_fkey(id,full_name,avatar_url,city,is_host,id_verified,phone_verified,email_verified,host_level)",
      });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/cars?${params.toString()}`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          cache: "no-store",
        },
      );
      const data = (await res.json()) as SupabaseCar[] | { message?: string };
      const row = Array.isArray(data) ? data[0] : null;
      if (row) {
        car = mapCar(row);
      }
    }

    const { data: availabilityData } = await supabase
      .from("car_availability")
      .select("start_date,end_date,available")
      .eq("car_id", id);
    availability = availabilityData ?? [];

    const { data: reviewData } = await (supabase as any)
      .from("reviews")
      .select("id,rating,comment,created_at,user_id, profiles:profiles!reviews_user_id_fkey(full_name,avatar_url)")
      .eq("car_id", id)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });
    reviews = (reviewData as ReviewRow[] | null) ?? [];

    if (reviews.length > 0 && car) {
      const total = reviews.reduce((sum, review) => sum + Number(review.rating ?? 0), 0);
      car.rating = Number((total / reviews.length).toFixed(1));
      car.reviews = reviews.length;
    }

    const { data: feeSettings } = await (supabase as any)
      .from("platform_settings")
      .select("platform_fee_percent")
      .eq("id", 1)
      .maybeSingle();
    const envPlatformFee = Number(
      process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT ?? process.env.PLATFORM_FEE_PERCENT ?? "10",
    );
    const fallback = Number.isFinite(envPlatformFee) ? envPlatformFee : 10;
    platformFeePercent = Number(feeSettings?.platform_fee_percent ?? fallback);

    if (user) {
      const { data: favoriteRow } = await supabase
        .from("favorites")
        .select("car_id")
        .eq("car_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      isFavorite = Boolean(favoriteRow);

      const { data: existingBookingRow } = await (supabase as any)
        .from("bookings")
        .select("id,start_date,end_date,status,created_at")
        .eq("car_id", id)
        .eq("renter_id", user.id)
        .in("status", ["awaiting_host", "confirmed", "completed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      existingBooking = (existingBookingRow as ExistingBooking | null) ?? null;

      const { data: completedBookings } = await (supabase as any)
        .from("bookings")
        .select("id,start_date,end_date")
        .eq("car_id", id)
        .eq("renter_id", user.id)
        .eq("status", "completed");
      const bookingRows = (completedBookings as { id: string; start_date: string; end_date: string }[] | null) ?? [];
      const bookingIds = bookingRows.map((booking) => booking.id);

      if (bookingIds.length > 0) {
        const { data: reviewedRows } = await (supabase as any)
          .from("reviews")
          .select("booking_id")
          .eq("user_id", user.id)
          .in("booking_id", bookingIds);
        const reviewedIds = new Set(
          ((reviewedRows as { booking_id: string }[] | null) ?? []).map((row) => row.booking_id),
        );

        reviewableBookings = bookingRows
          .filter((booking) => !reviewedIds.has(booking.id))
          .map((booking) => {
            const start = booking.start_date ? new Date(booking.start_date) : null;
            const end = booking.end_date ? new Date(booking.end_date) : null;
            const label =
              start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
                ? `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`
                : "Trip dates";
            return { id: booking.id, label };
          });
      }
    }
  } catch (error) {
    console.error("[car-detail] supabase SSR failed", { id, error });
  }

  if (!car) {
    console.warn("[car-detail] no car after fallbacks", { id });
    notFound();
  }

  if (car.approval_status && car.approval_status !== "approved" && car.owner?.id !== userId) {
    notFound();
  }

  return { car, availability, isFavorite, reviews, userId, reviewableBookings, platformFeePercent, existingBooking };
}

async function getCarFromSupabaseRest(id: string): Promise<SupabaseCar | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const params = new URLSearchParams({
    id: `eq.${id}`,
    select:
      "*, car_photos(url), owner:profiles!cars_owner_id_fkey(id,full_name,avatar_url,city,is_host,id_verified,phone_verified,email_verified,host_level)",
  });

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/cars?${params.toString()}`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[car-detail] supabase REST failed", { id, status: res.status });
      return null;
    }
    const data = (await res.json()) as SupabaseCar[] | { message?: string };
    return Array.isArray(data) ? data[0] ?? null : null;
  } catch (error) {
    console.error("[car-detail] supabase REST error", { id, error });
    return null;
  }
}

function mapCar(data: SupabaseCar): CarDetail {
  const avgRating = typeof (data as any).avg_rating === "number" ? Number((data as any).avg_rating) : undefined;
  const reviewCount =
    typeof (data as any).reviews_count === "number" ? Number((data as any).reviews_count) : undefined;
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    daily_price: Number(data.daily_price ?? 0),
    city: data.city,
    region: data.region,
    car_type: data.car_type,
    brand: (data as any).brand ?? null,
    model: (data as any).model ?? null,
    fuel_type: (data as any).fuel_type ?? null,
    seats: data.seats,
    transmission: data.transmission,
    fuel: data.fuel,
    features: data.features,
    is_available: data.is_available,
    instant_book: data.instant_book,
    delivery_fee: typeof (data as any).delivery_fee === "number" ? Number((data as any).delivery_fee) : null,
    insurance_fee: typeof (data as any).insurance_fee === "number" ? Number((data as any).insurance_fee) : null,
    deposit_amount: typeof (data as any).deposit_amount === "number" ? Number((data as any).deposit_amount) : null,
    cancellation_policy: (data as any).cancellation_policy ?? null,
    approval_status: (data as any).approval_status ?? "approved",
    photos: data.car_photos ?? [],
    owner: data.owner ?? null,
    rating: avgRating,
    reviews: reviewCount ?? 0,
    created_at: data.created_at,
  };
}

function mapMockCar(mock: MockCar): CarDetail {
  return {
    id: mock.id,
    title: mock.name,
    description: mock.description,
    daily_price: mock.daily_price,
    city: mock.city,
    region: mock.region,
    car_type: mock.car_type,
    brand: null,
    model: null,
    fuel_type: null,
    seats: mock.seats,
    transmission: mock.transmission,
    fuel: mock.fuel,
    features: mock.features,
    is_available: true,
    instant_book: false,
    delivery_fee: null,
    insurance_fee: null,
    deposit_amount: null,
    cancellation_policy: null,
    approval_status: "approved",
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

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
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
                  const start = slot.start_date ? new Date(slot.start_date) : null;
                  const end = slot.end_date ? new Date(slot.end_date) : null;
                  const validRange =
                    start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime());
                  const label = validRange
                    ? `${format(start, "MMM d")} - ${format(end, "MMM d")}`
                    : "Dates TBD";
                  return (
                    <div>
                      <p className="text-xs uppercase text-gray-500">Window</p>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                    </div>
                  );
                })()}
                <Badge variant={slot.available === false ? "outline" : "secondary"}>
                  {slot.available === false ? "Unavailable" : "Open"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No availability windows posted yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function HostCard({ owner, rating, reviews }: { owner?: Owner | null; rating?: number; reviews?: number }) {
  const avatar = owner?.avatar_url;
  const initials = getInitials(owner?.full_name ?? "Host");
  const score = typeof rating === "number" ? rating : null;
  const hostBadgeType = deriveHostBadgeType({
    hostLevel: owner?.host_level,
    isHost: owner?.is_host,
    idVerified: owner?.id_verified,
    phoneVerified: owner?.phone_verified,
    emailVerified: owner?.email_verified,
  });
  const hostLevel =
    hostBadgeType === "top_host"
      ? "Top Host"
      : hostBadgeType === "verified"
        ? "Verified Host"
        : formatHostLevel(owner?.host_level);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Host</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {avatar ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border">
                <Image src={avatar} alt={owner?.full_name ?? "Host"} fill className="object-cover" sizes="60px" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-primary/10 text-sm font-semibold text-primary">
                {initials || "H"}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{owner?.full_name ?? "Host"}</p>
                <VerifiedHostIndicator show={hostBadgeType !== "new"} />
              </div>
              <p className="flex items-center gap-2 text-xs text-gray-600">
                {score !== null ? (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {score.toFixed(1)}
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-primary" /> {owner?.city ?? "Location TBD"}
                </span>
                {typeof reviews === "number" && reviews > 0 ? <span>({reviews} trips)</span> : null}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {hostLevel}
          </Badge>
        </div>
        <VerificationBadges
          idVerified={owner?.id_verified}
          phoneVerified={owner?.phone_verified}
          emailVerified={owner?.email_verified}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-600">Host level updates as verification and trip performance grow.</p>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href={owner?.id ? `/hosts/${owner.id}` : "#"}>View host</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewCard({
  name,
  avatarUrl,
  text,
  rating,
}: {
  name: string;
  avatarUrl: string | null;
  text: string;
  rating: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-border">
              <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="36px" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(name) || "G"}
            </div>
          )}
          <p className="font-semibold text-foreground">{name}</p>
        </div>
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

function formatHostLevel(level?: string | null) {
  const normalized = String(level ?? "").toLowerCase();
  if (normalized === "super_host") return "Super Host";
  if (normalized === "top_host") return "Top Host";
  if (normalized === "verified_host") return "Verified Host";
  return "New Host";
}

function BookedNotice({ booking }: { booking: ExistingBooking }) {
  const start = booking.start_date ? new Date(booking.start_date) : null;
  const end = booking.end_date ? new Date(booking.end_date) : null;
  const hasValidDates = start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime());
  const dateLabel = hasValidDates
    ? `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`
    : `${booking.start_date} - ${booking.end_date}`;

  const statusLabel =
    booking.status === "awaiting_host"
      ? "Awaiting host approval"
      : booking.status === "confirmed"
        ? "Confirmed"
        : booking.status === "completed"
          ? "Completed"
          : "Booked";

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-800">You already booked this car</p>
          <p className="text-sm text-emerald-700">
            {dateLabel} • {statusLabel}
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="border-emerald-600 text-emerald-700">
          <Link href="/dashboard/bookings">Take me to my dashboard bookings</Link>
        </Button>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Card className="border-dashed">
        <CardContent className="space-y-4 py-10 text-center">
          <p className="text-sm font-semibold text-primary">Car not found</p>
          <p className="text-lg text-foreground">We could not find that car. Try exploring the catalog.</p>
          <Button asChild>
            <Link href="/explore">Back to explore</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


