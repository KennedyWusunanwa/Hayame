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
type CarPhotoRow = Database["public"]["Tables"]["car_photos"]["Row"];

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
      .select(
        "id,title,city,region,car_type,daily_price,is_available,approval_status,created_at",
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    const carRows = (carData as OwnerCarRow[] | null) ?? [];
    const carIds = carRows.map((car) => car.id);
    const firstPhotoByCarId: Record<string, string> = {};

    if (carIds.length > 0) {
      const { data: photoData } = await supabase
        .from("car_photos")
        .select("car_id,url,created_at")
        .in("car_id", carIds)
        .order("created_at", { ascending: true });

      (photoData as CarPhotoRow[] | null)?.forEach((photo) => {
        if (photo.car_id && !firstPhotoByCarId[photo.car_id]) {
          firstPhotoByCarId[photo.car_id] = photo.url;
        }
      });
    }

    const cars: OwnerCar[] = carRows.map((car) => ({
      id: car.id,
      title: car.title,
      city: car.city,
      region: car.region,
      car_type: car.car_type,
      daily_price: Number(car.daily_price ?? 0),
      is_available: car.is_available,
      approval_status: car.approval_status,
      image_url: firstPhotoByCarId[car.id] ?? null,
    }));

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
