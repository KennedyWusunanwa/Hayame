"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { CarCard } from "@/components/car-card";
import { FiltersSidebar, type Filters } from "@/components/filters-sidebar";
import { MapPanel } from "@/components/map/map-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockCars, type MockCar } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

function ExploreContent() {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const [filters, setFilters] = useState<Filters>({
    query: "",
    region: "",
    city: "",
    carType: "",
    brand: "",
    model: "",
    fuelType: "",
    minPrice: undefined,
    maxPrice: undefined,
    features: [],
  });
  const [cars, setCars] = useState<MockCar[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDraft, setSearchDraft] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    const q = params.get("q") || "";
    const carType = params.get("carType") || "";
    const brand = params.get("brand") || "";
    const model = params.get("model") || "";
    const fuelType = params.get("fuelType") || "";
    const region = params.get("region") || "";
    const city = params.get("city") || "";
    setFilters((prev) => ({
      ...prev,
      query: q,
      region,
      city,
      carType,
      brand,
      model,
      fuelType,
    }));
  }, [searchKey]);

  useEffect(() => {
    setSearchDraft(filters.query ?? "");
  }, [filters.query]);

  useEffect(() => {
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((res) => {
        if (Array.isArray(res.data)) {
          setFavoriteIds(res.data.map((f: { car_id: string }) => f.car_id));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch("/api/cars")
      .then((res) => res.json())
      .then((res) => {
        if (Array.isArray(res.data)) {
          const mapped = res.data.map((car: any) => ({
            id: car.id,
            name: car.title,
            city: car.city ?? "Accra",
            region: car.region ?? "Greater Accra",
            daily_price: Number(car.daily_price ?? 0),
            rating: 4.8,
            reviews: 0,
            car_type: car.car_type ?? "SUV",
            brand: car.brand ?? "",
            model: car.model ?? "",
            fuel_type: car.fuel_type ?? car.fuel ?? "",
            seats: car.seats ?? 5,
            transmission: car.transmission ?? "automatic",
            fuel: car.fuel ?? "Petrol",
            features: car.features ?? [],
            description: car.description ?? "",
            host: {
              name: "Host",
              avatar:
                "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
            },
            image: car.car_photos?.[0]?.url ?? "/car-placeholder.jpg",
          }));
          setCars(mapped);
        } else {
          setCars([]);
        }
      })
      .catch(() => {
        setCars([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleFavorite = (carId: string, nextValue: boolean) => {
    setFavoriteIds((prev) =>
      nextValue ? Array.from(new Set([...prev, carId])) : prev.filter((id) => id !== carId),
    );
  };

  const applySearch = () => {
    const nextQuery = searchDraft.trim();
    setFilters((prev) => ({
      ...prev,
      query: nextQuery,
    }));
  };

  const filtered = useMemo(() => {
    return cars.filter((car) => {
      const matchesQuery =
        !filters.query ||
        car.name.toLowerCase().includes(filters.query.toLowerCase()) ||
        car.city.toLowerCase().includes(filters.query.toLowerCase()) ||
        (car.brand ?? "").toLowerCase().includes(filters.query.toLowerCase()) ||
        (car.model ?? "").toLowerCase().includes(filters.query.toLowerCase());
      const matchesRegion = !filters.region || car.region === filters.region;
      const matchesCity = !filters.city || car.city === filters.city;
      const matchesType = !filters.carType || car.car_type === filters.carType;
      const matchesBrand = !filters.brand || car.brand === filters.brand;
      const matchesModel = !filters.model || car.model === filters.model;
      const matchesFuel = !filters.fuelType || car.fuel_type === filters.fuelType;
      const matchesMin = !filters.minPrice || car.daily_price >= filters.minPrice;
      const matchesMax = !filters.maxPrice || car.daily_price <= filters.maxPrice;
      const matchesFeatures =
        !filters.features || filters.features.length === 0
          ? true
          : filters.features.every((f) => car.features.includes(f));
      return (
        matchesQuery &&
        matchesRegion &&
        matchesCity &&
        matchesType &&
        matchesBrand &&
        matchesModel &&
        matchesFuel &&
        matchesMin &&
        matchesMax &&
        matchesFeatures
      );
    });
  }, [filters, cars]);

  const markers = filtered.map((car) => ({
    id: car.id,
    label: `${car.city} - ${car.name}`,
    price: formatCurrency(car.daily_price),
  }));
  const hasActiveFilters = Boolean(
    filters.query ||
      filters.region ||
      filters.city ||
      filters.carType ||
      filters.brand ||
      filters.model ||
      filters.fuelType ||
      filters.minPrice ||
      filters.maxPrice ||
      (filters.features && filters.features.length > 0),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand">Explore</p>
          <h1 className="text-3xl font-semibold text-foreground">Find your next ride</h1>
          <p className="text-gray-700">Search by city, car type, budget, or features.</p>
        </div>
        <div className="w-full md:hidden">
          <form
            className="flex h-12 items-center gap-2 rounded-full border border-border bg-white px-3 shadow-soft"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch();
            }}
          >
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search cars or cities"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="h-8 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              size="sm"
              className="h-8 rounded-full px-4"
              type="submit"
            >
              Search
            </Button>
          </form>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <FiltersSidebar filters={filters} onChange={setFilters} />
        <div className="grid gap-5">
          <form
            className="hidden h-14 items-center gap-3 rounded-2xl border border-border bg-white px-4 shadow-soft md:flex"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch();
            }}
          >
            <Search className="h-5 w-5 text-gray-500" />
            <Input
              placeholder="Search cars or cities"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="h-10 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button type="submit" className="h-10 rounded-full px-5">
              Search
            </Button>
          </form>
          {!hasActiveFilters ? (
            <div className="h-44 w-full overflow-hidden rounded-2xl border border-border bg-white shadow-soft sm:h-56 lg:h-64">
              <MapPanel markers={markers} className="h-full" />
            </div>
          ) : null}
          <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full rounded-2xl border border-border bg-white p-6 text-center text-sm text-gray-600">
                Loading cars...
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-border bg-white p-6 text-center text-sm text-gray-600">
                No cars found. Try adjusting your filters.
              </div>
            ) : (
              filtered.map((car) => (
                <CarCard
                  key={car.id}
                  car={{
                    id: car.id,
                    title: car.name,
                    city: car.city,
                    region: car.region,
                    daily_price: car.daily_price,
                    rating: car.rating,
                    car_type: car.car_type,
                    description: car.description,
                    image_url: car.image,
                  }}
                  isFavorite={favoriteIds.includes(car.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 sm:px-6 lg:px-8">Loading...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
