import { CarCard } from "@/components/car-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { deriveHostBadgeType } from "@/lib/host-badges";
import { createSupabasePublicClient } from "@/lib/supabase/public";

type FeaturedRow = Database["public"]["Views"]["car_search_view"]["Row"];

type FeaturedCar = {
  id: string;
  title: string;
  city: string;
  region: string;
  daily_price: number;
  rating?: number;
  reviews: number;
  car_type: string;
  description: string;
  image_url: string;
  host_name: string;
  host_avatar: string;
  host_type?: string;
  isFavorite: boolean;
};

const FEATURED_SELECT = [
  "id",
  "title",
  "city",
  "region",
  "daily_price",
  "avg_rating",
  "reviews_count",
  "car_type",
  "description",
  "image_url",
  "host_name",
  "host_avatar",
  "host_type",
  "host_level",
  "id_verified",
  "phone_verified",
  "email_verified",
].join(",");
const FEATURED_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedFeatured: { expiresAt: number; cars: FeaturedCar[] } | null = null;

async function loadFeaturedCars() {
  if (cachedFeatured && cachedFeatured.expiresAt > Date.now()) {
    return cachedFeatured.cars;
  }

  // Starts empty and only ever holds real listings. It previously started as
  // eight mock cars and was replaced only when the query returned rows — so an
  // empty database (data = [], error = null) left the mocks in place and the
  // homepage advertised cars that do not exist. Renters clicked them.
  let featured: FeaturedCar[] = [];
  let loadedLiveCars = false;
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await (supabase as any)
      .from("car_search_view")
      .select(FEATURED_SELECT)
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    if (data && data.length > 0) {
      featured = (data as FeaturedRow[])
        .filter((car) => car.id)
        .map((car) => ({
          id: car.id ?? "",
          title: car.title ?? "Car listing",
          city: car.city ?? "",
          region: car.region ?? "",
          daily_price: Number(car.daily_price ?? 0),
          rating:
            typeof car.avg_rating === "number"
              ? Number(car.avg_rating)
              : undefined,
          reviews: Number(car.reviews_count ?? 0),
          car_type: car.car_type ?? "",
          description: car.description ?? "",
          image_url: car.image_url ?? "",
          host_name: car.host_name ?? "Host",
          host_avatar: car.host_avatar ?? "",
          host_type: deriveHostBadgeType({
            hostType: car.host_type,
            hostLevel: car.host_level,
            idVerified: car.id_verified,
            phoneVerified: car.phone_verified,
            emailVerified: car.email_verified,
          }),
          isFavorite: false,
        }));
      loadedLiveCars = featured.length > 0;
    }
  } catch {
    // Showing nothing is the honest failure mode. Inventing listings to fill
    // the grid is not — a renter cannot tell a placeholder from a real car.
    featured = [];
  }

  if (loadedLiveCars) {
    cachedFeatured = {
      expiresAt: Date.now() + FEATURED_CACHE_TTL_MS,
      cars: featured,
    };
  }
  return featured;
}

export async function FeaturedCars() {
  const featured = await loadFeaturedCars();

  // No listings yet: render nothing at all rather than a "Featured cars across
  // Ghana" heading above an empty grid. The homepage still has its hero, search,
  // live counts, and trust sections, so it reads as a new marketplace rather
  // than a broken page.
  if (featured.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 pt-14 pb-14 sm:pt-16 lg:pt-18">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand">Featured Vehicles</p>
          <h2 className="text-2xl font-semibold text-foreground">
            Featured cars across Ghana
          </h2>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            aria-label="Previous featured cars"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300/80 bg-white text-slate-600 shadow-sm transition hover:text-slate-900"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next featured cars"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300/80 bg-white text-slate-600 shadow-sm transition hover:text-slate-900"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {featured.map((car) => (
          <CarCard
            key={car.id}
            car={{
              id: car.id,
              title: car.title,
              city: car.city,
              region: car.region,
              daily_price: car.daily_price,
              rating: car.rating,
              reviews: car.reviews,
              car_type: car.car_type,
              description: car.description,
              image_url: car.image_url,
              host_name: car.host_name,
              host_avatar: car.host_avatar,
              host_type: car.host_type,
            }}
            isFavorite={car.isFavorite}
          />
        ))}
      </div>
    </section>
  );
}
