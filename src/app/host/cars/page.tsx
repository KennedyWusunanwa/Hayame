export const dynamic = "force-dynamic";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { cars } = await loadOwnerCarsWithFavorites();

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

      <Card className="overflow-hidden border-border">
        <CardHeader>
          <CardTitle>Cars</CardTitle>
          <p className="text-sm text-gray-600">
            Scan inventory quickly, confirm listing status, and jump straight
            into edits.
          </p>
        </CardHeader>
        <CardContent>
          {cars.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-gray-50 px-4 py-10 text-center text-sm text-gray-600">
              No cars listed yet.
            </div>
          ) : (
            <div className="divide-y divide-border rounded-3xl border border-border bg-white">
              {cars.map((car) => {
                const imageSrc = resolveCarImage(car.image_url, {
                  id: car.id,
                  title: car.title,
                  city: car.city,
                  region: car.region,
                  carType: car.car_type,
                });
                const status = getListingStatus(car);

                return (
                  <div
                    key={car.id}
                    className="flex items-center gap-3 px-4 py-3 sm:gap-4"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-gray-100 sm:h-[72px] sm:w-[72px]">
                      <img
                        src={imageSrc}
                        alt={car.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-foreground">
                        {car.title}
                      </p>
                      <p className="truncate text-sm text-gray-600">
                        {[car.city, car.region].filter(Boolean).join(", ") ||
                          "Location not set"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={status.className}>{status.label}</span>
                        {car.car_type ? (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {car.car_type}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground sm:text-base">
                        {formatCurrency(car.daily_price)}
                      </p>
                      <p className="text-xs text-gray-500 sm:text-sm">/ day</p>
                    </div>

                    <div className="shrink-0">
                      <CarActions carId={car.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getListingStatus(car: {
  approval_status: string | null;
  is_available: boolean | null;
}) {
  if (car.approval_status === "rejected") {
    return {
      label: "Rejected",
      className:
        "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700",
    };
  }
  if (car.approval_status !== "approved") {
    return {
      label: "Under review",
      className:
        "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700",
    };
  }
  if (car.is_available) {
    return {
      label: "Live",
      className:
        "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700",
    };
  }
  return {
    label: "Paused",
    className:
      "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700",
  };
}
