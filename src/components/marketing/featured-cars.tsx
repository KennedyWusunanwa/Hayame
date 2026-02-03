import { CarCard } from "@/components/car-card";
import type { Database } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockCars } from "@/lib/mock-data";

type FeaturedRow = Database["public"]["Tables"]["cars"]["Row"] & {
  car_photos?: { url: string }[];
  owner?: { full_name: string | null; avatar_url: string | null } | null;
};

export async function FeaturedCars() {
  let featured = mockCars.slice(0, 12).map((car) => ({
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

    const { data } = await supabase
      .from("cars")
      .select(
        "id,title,city,region,daily_price,car_type,description,car_photos(url), owner:profiles!cars_owner_id_fkey(full_name,avatar_url)",
      )
      .limit(12);
    if (data && data.length > 0) {
      featured = (data as FeaturedRow[]).map((car) => ({
        id: car.id,
        title: car.title,
        city: car.city ?? "",
        region: car.region ?? "",
        daily_price: Number(car.daily_price ?? 0),
        rating: 4.8,
        reviews: 0,
        car_type: car.car_type ?? "",
        description: car.description ?? "",
        image_url: car.car_photos?.[0]?.url ?? "/car-placeholder.jpg",
        host_name: car.owner?.full_name ?? "Host",
        host_avatar: car.owner?.avatar_url ?? "/car-placeholder.jpg",
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
          <h2 className="text-2xl font-semibold text-foreground">Featured cars across Ghana</h2>
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
            }}
            isFavorite={car.isFavorite}
          />
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <a
          href="/explore"
          className="rounded-full border border-brand bg-brand px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-white hover:text-brand"
        >
          View All Cars
        </a>
      </div>
    </section>
  );
}
