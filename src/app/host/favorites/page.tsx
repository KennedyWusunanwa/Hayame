export const dynamic = "force-dynamic";

import { Heart, MapPin } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadOwnerCarsWithFavorites } from "@/lib/owner-cars";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export default async function FavoritesDashboardPage() {
  const { cars, favoriteCounts } = await loadOwnerCarsWithFavorites();
  const userFavorites = await loadUserFavorites();
  const totalFavorites = Object.values(favoriteCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Favorites</p>
        <h1 className="text-2xl font-semibold text-foreground">Guest saves</h1>
        <p className="text-sm text-gray-600">See which cars guests are bookmarking most.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-5">
            <div>
              <p className="text-sm text-gray-600">Total favorites</p>
              <p className="text-2xl font-semibold text-foreground">{totalFavorites}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
              <Heart className="h-5 w-5 text-brand" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-5">
            <div>
              <p className="text-sm text-gray-600">Cars with saves</p>
              <p className="text-2xl font-semibold text-foreground">
                {cars.filter((car) => (favoriteCounts[car.id] ?? 0) > 0).length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <span className="text-sm font-semibold text-emerald-700">Live</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your favorites</CardTitle>
        </CardHeader>
        <CardContent>
          {userFavorites.length === 0 ? (
            <p className="text-sm text-gray-600">No favorites yet. Tap the heart on a car to save it.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {userFavorites.map((fav) => (
                <div key={fav.id} className="flex gap-3 rounded-xl border border-border bg-white p-3">
                  <div className="relative h-20 w-28 overflow-hidden rounded-lg">
                    <Image
                      src={fav.image}
                      alt={fav.title}
                      fill
                      className="object-cover"
                      sizes="180px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{fav.title}</p>
                      <span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">
                        {fav.type || "Car"}
                      </span>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="h-3 w-3 text-brand" />
                      {fav.city}, {fav.region}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(fav.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Favorites by car</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Favorites</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="font-semibold">{car.title}</TableCell>
                  <TableCell className="font-semibold">{favoriteCounts[car.id] ?? 0}</TableCell>
                  <TableCell className="flex items-center gap-1 text-sm text-gray-700">
                    <MapPin className="h-4 w-4 text-brand" />
                    {car.city ?? "—"}, {car.region ?? "—"}
                  </TableCell>
                  <TableCell>{car.car_type ?? "—"}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(car.daily_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

type FavoriteRow = {
  car: {
    id: string;
    title: string;
    city: string | null;
    region: string | null;
    daily_price: number | null;
    car_type: string | null;
    car_photos?: { url: string }[] | null;
  } | null;
};

async function loadUserFavorites() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("favorites")
      .select("car:cars(id,title,city,region,daily_price,car_type,car_photos(url))")
      .eq("user_id", user.id);

    return (data as FavoriteRow[] | null)?.map((row) => row.car).filter(Boolean).map((car) => ({
      id: car!.id,
      title: car!.title,
      city: car!.city ?? "-",
      region: car!.region ?? "-",
      price: Number(car!.daily_price ?? 0),
      type: car!.car_type ?? "",
      image: car!.car_photos?.[0]?.url ?? "/car-placeholder.jpg",
    })) ?? [];
  } catch {
    return [];
  }
}
