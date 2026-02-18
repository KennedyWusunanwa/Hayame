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
        <Button asChild className="shrink-0">
          <Link href="/host/cars/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            List Your Car &amp; Earn
          </Link>
        </Button>
      </div>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>Cars</span>
            <span className="text-xs font-normal text-gray-600 sm:text-sm">
              Manage your listings; swipe to scroll on mobile.
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="hidden overflow-x-auto sm:block">
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
          </div>

          <div className="space-y-3 sm:hidden">
            {cars.map((car) => (
              <div key={car.id} className="rounded-lg border border-border bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{car.title}</p>
                    <p className="text-sm text-gray-600">
                      {car.city}, {car.region}
                    </p>
                    <p className="text-sm text-gray-700">{formatCurrency(car.daily_price)} / day</p>
                  </div>
                  <CarActions carId={car.id} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className="rounded-full bg-gray-100 px-2 py-1">Favorites {favoriteCounts[car.id] ?? 0}</span>
                  {car.car_type ? <span className="rounded-full bg-gray-100 px-2 py-1">{car.car_type}</span> : null}
                  <span
                    className={
                      car.is_available
                        ? "rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700"
                        : "rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700"
                    }
                  >
                    {car.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
