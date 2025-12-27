export const dynamic = "force-dynamic";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CarActions } from "@/components/dashboard/car-actions";
import { loadOwnerCarsWithFavorites } from "@/lib/owner-cars";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardCarsPage() {
  const { cars, favoriteCounts } = await loadOwnerCarsWithFavorites();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Inventory</p>
          <h1 className="text-2xl font-semibold text-foreground">My cars</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/cars/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add car
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cars</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Favorites</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="font-semibold">{car.title}</TableCell>
                  <TableCell>
                    {car.city}, {car.region}
                  </TableCell>
                  <TableCell className="font-semibold">{favoriteCounts[car.id] ?? 0}</TableCell>
                  <TableCell>{car.car_type}</TableCell>
                  <TableCell>{formatCurrency(car.daily_price)}</TableCell>
                  <TableCell>
                    {car.is_available ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Available
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                        Unavailable
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <CarActions carId={car.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
