export const dynamic = "force-dynamic";

import { Heart, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadOwnerCarsWithFavorites } from "@/lib/owner-cars";
import { formatCurrency } from "@/lib/utils";

export default async function FavoritesDashboardPage() {
  const { cars, favoriteCounts } = await loadOwnerCarsWithFavorites();
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
