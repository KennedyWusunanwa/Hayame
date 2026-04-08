export const dynamic = "force-dynamic";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CarActions } from "@/components/dashboard/car-actions";
import { resolveCarImage } from "@/lib/car-images";
import { loadOwnerCarsWithFavorites } from "@/lib/owner-cars";
import { formatCurrency } from "@/lib/utils";

type PageProps = {
  searchParams?: { notice?: string } | Promise<{ notice?: string }>;
};

export default async function DashboardCarsPage({ searchParams }: PageProps) {
  const resolvedSearch = (await searchParams) ?? {};
  const notice =
    resolvedSearch.notice === "submitted" || resolvedSearch.notice === "updated"
      ? resolvedSearch.notice
      : undefined;
  const { cars, favoriteCounts } = await loadOwnerCarsWithFavorites();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Inventory</p>
          <h1 className="text-2xl font-semibold text-foreground">My cars</h1>
        </div>
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link href="/host/cars/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            List Your Car &amp; Earn
          </Link>
        </Button>
      </div>
      {notice ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {notice === "submitted"
            ? "Your car ad has been uploaded successfully and is now under review. It will appear publicly after approval."
            : "Your car changes were saved and the listing is now under review until approval."}
        </div>
      ) : null}
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
                  <TableHead>Approval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cars.map((car) => {
                  const imageSrc = resolveCarImage(car.image_url, {
                    id: car.id,
                    title: car.title,
                    city: car.city,
                    region: car.region,
                    carType: car.car_type,
                  });

                  return (
                    <TableRow key={car.id}>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 overflow-hidden rounded-md border border-border bg-gray-100">
                            <img
                              src={imageSrc}
                              alt={car.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <span className="line-clamp-2">{car.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {car.city}, {car.region}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {favoriteCounts[car.id] ?? 0}
                      </TableCell>
                      <TableCell>{car.car_type}</TableCell>
                      <TableCell>{formatCurrency(car.daily_price)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            car.approval_status === "approved"
                              ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                              : car.approval_status === "rejected"
                                ? "rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"
                                : "rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"
                          }
                        >
                          {car.approval_status ?? "pending"}
                        </span>
                      </TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 sm:hidden">
            {cars.map((car) => {
              const imageSrc = resolveCarImage(car.image_url, {
                id: car.id,
                title: car.title,
                city: car.city,
                region: car.region,
                carType: car.car_type,
              });

              return (
                <div
                  key={car.id}
                  className="rounded-lg border border-border bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md border border-border bg-gray-100">
                      <img
                        src={imageSrc}
                        alt={car.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-foreground line-clamp-2">
                        {car.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {car.city}, {car.region}
                      </p>
                      <p className="text-sm text-gray-700">
                        {formatCurrency(car.daily_price)} / day
                      </p>
                    </div>
                    <div className="shrink-0">
                      <CarActions carId={car.id} />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className="rounded-full bg-gray-100 px-2 py-1">
                      Favorites {favoriteCounts[car.id] ?? 0}
                    </span>
                    {car.car_type ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        {car.car_type}
                      </span>
                    ) : null}
                    <span
                      className={
                        car.is_available
                          ? "rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700"
                          : "rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700"
                      }
                    >
                      {car.is_available ? "Available" : "Unavailable"}
                    </span>
                    <span
                      className={
                        car.approval_status === "approved"
                          ? "rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700"
                          : car.approval_status === "rejected"
                            ? "rounded-full bg-red-50 px-2 py-1 font-semibold text-red-700"
                            : "rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700"
                      }
                    >
                      {car.approval_status ?? "pending"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
