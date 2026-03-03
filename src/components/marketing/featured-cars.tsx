import { CarCard } from "@/components/car-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { deriveHostBadgeType } from "@/lib/host-badges";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockCars } from "@/lib/mock-data";

type FeaturedRow = Database["public"]["Tables"]["cars"]["Row"] & {
  image_url?: string | null;
  avg_rating?: number | null;
  reviews_count?: number | null;
  host_name?: string | null;
  host_avatar?: string | null;
  host_type?: string | null;
  host_level?: string | null;
  is_host?: boolean | null;
  id_verified?: boolean | null;
  phone_verified?: boolean | null;
  email_verified?: boolean | null;
};

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

export async function FeaturedCars() {
  let featured: FeaturedCar[] = mockCars.slice(0, 12).map((car) => ({
    id: car.id,
    title: car.name,
    city: car.city,
    region: car.region,
    daily_price: car.daily_price,
    rating: car.rating,
    reviews: car.reviews,
    car_type: car.car_type,
    description: car.description,
    image_url: car.image,
    host_name: car.host.name,
    host_avatar: car.host.avatar,
    host_type: "",
    isFavorite: false,
  }));

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const favoriteIds = new Set<string>();
    if (user) {
      const { data: favorites } = await supabase.from("favorites").select("car_id").eq("user_id", user.id);
      favorites?.forEach((fav: { car_id: string }) => favoriteIds.add(fav.car_id));
    }

    const { data } = await (supabase as any)
      .from("car_search_view")
      .select("*")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false })
      .limit(12);
    if (data && data.length > 0) {
      featured = (data as FeaturedRow[]).map((car) => ({
        id: car.id,
        title: car.title,
        city: car.city ?? "",
        region: car.region ?? "",
        daily_price: Number(car.daily_price ?? 0),
        rating: typeof car.avg_rating === "number" ? Number(car.avg_rating) : undefined,
        reviews: Number(car.reviews_count ?? 0),
        car_type: car.car_type ?? "",
        description: car.description ?? "",
        image_url: car.image_url ?? "/car-placeholder.jpg",
        host_name: car.host_name ?? "Host",
        host_avatar: car.host_avatar ?? "/car-placeholder.jpg",
        host_type: deriveHostBadgeType({
          hostType: car.host_type,
          hostLevel: car.host_level,
          isHost: car.is_host,
          idVerified: car.id_verified,
          phoneVerified: car.phone_verified,
          emailVerified: car.email_verified,
        }),
        isFavorite: favoriteIds.has(car.id),
      }));
    }
  } catch {
    // fall back to mock data
  }

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
