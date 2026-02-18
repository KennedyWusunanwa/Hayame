import type { Database } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OwnerCar = {
  id: string;
  title: string;
  city: string | null;
  region: string | null;
  car_type: string | null;
  daily_price: number;
  is_available: boolean | null;
  approval_status: string | null;
  image_url: string | null;
};

type OwnerCarRow = Database["public"]["Tables"]["cars"]["Row"];

export async function loadOwnerCarsWithFavorites(): Promise<{
  cars: OwnerCar[];
  favoriteCounts: Record<string, number>;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { cars: [], favoriteCounts: {} };
    }

    const { data: carData } = await supabase
      .from("cars")
      .select("id,title,city,region,car_type,daily_price,is_available,approval_status,car_photos(url)")
      .eq("owner_id", user.id);

    const cars: OwnerCar[] =
      (carData as OwnerCarRow[] | null)?.map((car) => ({
        id: car.id,
        title: car.title,
        city: car.city,
        region: car.region,
        car_type: car.car_type,
        daily_price: Number(car.daily_price ?? 0),
        is_available: car.is_available,
        approval_status: (car as any).approval_status ?? null,
        image_url: (car as any).car_photos?.[0]?.url ?? null,
      })) ?? [];

    const favoriteCounts: Record<string, number> = {};
    if (cars.length > 0) {
      const { data: favorites } = await supabase
        .from("favorites")
        .select("car_id")
        .in(
          "car_id",
          cars.map((car) => car.id),
        );
      favorites?.forEach((fav: { car_id: string }) => {
        favoriteCounts[fav.car_id] = (favoriteCounts[fav.car_id] ?? 0) + 1;
      });
    }

    return { cars, favoriteCounts };
  } catch {
    return { cars: [], favoriteCounts: {} };
  }
}
