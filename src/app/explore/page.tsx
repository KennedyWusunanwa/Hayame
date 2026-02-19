"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownAZ, Search } from "lucide-react";
import { CarCard } from "@/components/car-card";
import {
  FiltersSidebar,
  type FilterCapabilities,
  type Filters,
  type SortBy,
} from "@/components/filters-sidebar";
import { MapPanel } from "@/components/map/map-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { deriveHostBadgeType } from "@/lib/host-badges";
import { mockCars, type MockCar } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

type ExploreCar = Omit<MockCar, "rating"> & {
  rating?: number;
  instant_book?: boolean;
  delivery_available?: boolean;
  air_conditioning?: boolean;
  year?: number;
  bookings_count?: number;
  trips_count?: number;
  avg_rating?: number;
  host_type?: string;
  host_level?: string;
  is_host?: boolean;
  id_verified?: boolean;
  phone_verified?: boolean;
  email_verified?: boolean;
  created_at?: string | null;
};

const SORT_OPTIONS: Array<{
  value: SortBy;
  label: string;
  requires?: keyof SortCapabilities;
}> = [
  { value: "price_low", label: "Price (Low -> High)" },
  { value: "price_high", label: "Price (High -> Low)" },
  { value: "most_booked", label: "Most booked", requires: "mostBooked" },
  { value: "top_rated", label: "Top rated", requires: "topRated" },
  { value: "new_listings", label: "New listings", requires: "newListings" },
];

type SortCapabilities = {
  mostBooked: boolean;
  topRated: boolean;
  newListings: boolean;
};

type CarsResponseMeta = {
  capabilities?: Partial<FilterCapabilities> & {
    sorts?: Partial<Record<SortBy, boolean>>;
  };
};

function parseBoolean(value: string | null) {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return undefined;
}

function parseNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseFilters(searchParams: URLSearchParams): Filters {
  const sort = searchParams.get("sort");
  return {
    query: searchParams.get("q") ?? "",
    region: searchParams.get("region") ?? "",
    city: searchParams.get("city") ?? "",
    carType: searchParams.get("carType") ?? "",
    brand: searchParams.get("brand") ?? "",
    model: searchParams.get("model") ?? "",
    fuelType: searchParams.get("fuelType") ?? "",
    minPrice: parseNumber(searchParams.get("minPrice")),
    maxPrice: parseNumber(searchParams.get("maxPrice")),
    features: searchParams.getAll("feature"),
    instantBook: parseBoolean(searchParams.get("instantBook")),
    deliveryAvailable: parseBoolean(searchParams.get("deliveryAvailable")),
    transmission: (searchParams.get("transmission") as Filters["transmission"]) ?? "",
    seatsCapacity: (searchParams.get("seats") as Filters["seatsCapacity"]) ?? "",
    minYear: parseNumber(searchParams.get("minYear")),
    maxYear: parseNumber(searchParams.get("maxYear")),
    airConditioning: parseBoolean(searchParams.get("airConditioning")),
    minRating: parseNumber(searchParams.get("minRating")),
    hostType: (searchParams.get("hostType") as Filters["hostType"]) ?? "",
    sort: (sort as SortBy | null) ?? "",
  };
}

function writeFiltersToParams(existing: URLSearchParams, filters: Filters) {
  const params = new URLSearchParams(existing.toString());
  const setString = (key: string, value?: string) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };
  const setNumber = (key: string, value?: number) => {
    if (typeof value === "number" && Number.isFinite(value)) params.set(key, String(value));
    else params.delete(key);
  };
  const setBoolean = (key: string, value?: boolean) => {
    if (value === true) params.set(key, "1");
    else params.delete(key);
  };

  setString("q", filters.query?.trim());
  setString("region", filters.region);
  setString("city", filters.city);
  setString("carType", filters.carType);
  setString("brand", filters.brand);
  setString("model", filters.model);
  setString("fuelType", filters.fuelType);
  setNumber("minPrice", filters.minPrice);
  setNumber("maxPrice", filters.maxPrice);
  setBoolean("instantBook", filters.instantBook);
  setBoolean("deliveryAvailable", filters.deliveryAvailable);
  setString("transmission", filters.transmission ?? "");
  setString("seats", filters.seatsCapacity ?? "");
  setNumber("minYear", filters.minYear);
  setNumber("maxYear", filters.maxYear);
  setBoolean("airConditioning", filters.airConditioning);
  setNumber("minRating", filters.minRating);
  setString("hostType", filters.hostType ?? "");
  setString("sort", filters.sort ?? "");

  params.delete("feature");
  for (const feature of filters.features ?? []) {
    params.append("feature", feature);
  }

  return params;
}

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function matchesSeats(seats: number | undefined, capacity: Filters["seatsCapacity"]) {
  if (!capacity) return true;
  if (typeof seats !== "number") return false;
  if (capacity === "8+") return seats >= 8;
  return seats === Number(capacity);
}

function getComparableRating(car: ExploreCar) {
  const rating = typeof car.avg_rating === "number" ? car.avg_rating : car.rating;
  return typeof rating === "number" ? rating : null;
}

function mapApiCars(rows: any[]): ExploreCar[] {
  return rows.map((car: any) => {
    const airConditioningFromFeatures = Array.isArray(car.features)
      ? car.features.some((feature: string) => normalize(feature) === "air conditioning")
      : false;
    const yearCandidate = Number(car.year ?? car.car_year);
    return {
      id: car.id,
      name: car.title,
      city: car.city ?? "Accra",
      region: car.region ?? "Greater Accra",
      daily_price: Number(car.daily_price ?? 0),
      rating: typeof car.avg_rating === "number" ? Number(car.avg_rating) : undefined,
      reviews: Number(car.reviews_count ?? 0),
      car_type: car.car_type ?? "SUV",
      brand: car.brand ?? "",
      model: car.model ?? "",
      fuel_type: normalize(car.fuel_type ?? car.fuel),
      seats: car.seats ?? 5,
      transmission: normalize(car.transmission) === "manual" ? "manual" : "automatic",
      fuel: car.fuel ?? "Petrol",
      features: Array.isArray(car.features) ? car.features : [],
      description: car.description ?? "",
      host: {
        name: car.host_name ?? "Host",
        avatar:
          car.host_avatar ??
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
      },
      image: car.image_url ?? car.car_photos?.[0]?.url ?? "/car-placeholder.jpg",
      instant_book: typeof car.instant_book === "boolean" ? car.instant_book : undefined,
      delivery_available:
        typeof car.delivery_available === "boolean" ? car.delivery_available : undefined,
      air_conditioning:
        typeof car.air_conditioning === "boolean" ? car.air_conditioning : airConditioningFromFeatures,
      year: Number.isFinite(yearCandidate) ? yearCandidate : undefined,
      bookings_count:
        typeof car.bookings_count === "number" ? Number(car.bookings_count) : undefined,
      trips_count: typeof car.trips_count === "number" ? Number(car.trips_count) : undefined,
      avg_rating: typeof car.avg_rating === "number" ? Number(car.avg_rating) : undefined,
      host_type: deriveHostBadgeType({
        hostType: car.host_type,
        hostLevel: car.host_level,
        isHost: car.is_host,
        idVerified: car.id_verified,
        phoneVerified: car.phone_verified,
        emailVerified: car.email_verified,
      }),
      host_level: car.host_level ?? null,
      is_host: car.is_host ?? false,
      id_verified: car.id_verified ?? false,
      phone_verified: car.phone_verified ?? false,
      email_verified: car.email_verified ?? false,
      created_at: car.created_at ?? null,
    };
  });
}

function fallbackCars() {
  return mockCars.map((car) => ({
    ...car,
    instant_book: false,
    delivery_available: undefined,
    air_conditioning: car.features.some((feature) => normalize(feature) === "air conditioning"),
    bookings_count: undefined,
    trips_count: undefined,
    avg_rating: car.rating,
    host_type: "",
    created_at: null,
  }));
}

function ExploreContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchKey)), [searchKey]);

  const [cars, setCars] = useState<ExploreCar[]>([]);
  const [meta, setMeta] = useState<CarsResponseMeta>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDraft, setSearchDraft] = useState("");

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
    fetch(searchKey ? `/api/cars?${searchKey}` : "/api/cars")
      .then((res) => res.json())
      .then((res) => {
        setMeta(res.meta ?? {});
        if (Array.isArray(res.data)) {
          setCars(mapApiCars(res.data));
        } else {
          setCars(fallbackCars());
        }
      })
      .catch(() => {
        setCars(fallbackCars());
        setMeta({});
      })
      .finally(() => setLoading(false));
  }, [searchKey]);

  const capabilities = useMemo<FilterCapabilities>(() => {
    const hasAirConditioningFlag = cars.some((car) => typeof car.air_conditioning === "boolean");
    const inferred: FilterCapabilities = {
      instantBook: cars.some((car) => typeof car.instant_book === "boolean"),
      deliveryAvailable: cars.some((car) => typeof car.delivery_available === "boolean"),
      transmission: cars.some((car) => Boolean(car.transmission)),
      fuelType: cars.some((car) => Boolean(car.fuel_type)),
      seats: cars.some((car) => typeof car.seats === "number"),
      year: cars.some((car) => typeof car.year === "number"),
      airConditioning:
        hasAirConditioningFlag ||
        cars.some((car) =>
          car.features.some((feature) => normalize(feature) === "air conditioning"),
        ),
      rating: cars.some((car) => typeof getComparableRating(car) === "number"),
      hostType: cars.some((car) => Boolean(car.host_type)),
    };
    return { ...inferred, ...(meta.capabilities ?? {}) };
  }, [cars, meta.capabilities]);

  const sortCapabilities = useMemo<SortCapabilities>(
    () => ({
      mostBooked:
        meta.capabilities?.sorts?.most_booked ??
        cars.some(
        (car) => typeof car.bookings_count === "number" || typeof car.trips_count === "number",
      ),
      topRated: meta.capabilities?.sorts?.top_rated ?? capabilities.rating,
      newListings:
        meta.capabilities?.sorts?.new_listings ?? cars.some((car) => Boolean(car.created_at)),
    }),
    [cars, capabilities.rating, meta.capabilities?.sorts],
  );

  const updateFilters = (nextFilters: Filters) => {
    const nextParams = writeFiltersToParams(new URLSearchParams(searchKey), nextFilters);
    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const toggleFavorite = (carId: string, nextValue: boolean) => {
    setFavoriteIds((prev) =>
      nextValue ? Array.from(new Set([...prev, carId])) : prev.filter((id) => id !== carId),
    );
  };

  const applySearch = () => {
    updateFilters({
      ...filters,
      query: searchDraft.trim(),
    });
  };

  const filtered = useMemo(() => {
    const query = normalize(filters.query);
    return cars.filter((car) => {
      const features = car.features ?? [];
      const fuel = normalize(car.fuel_type ?? car.fuel);
      const transmission = normalize(car.transmission);
      const rating = getComparableRating(car);
      const bookings = car.bookings_count ?? car.trips_count ?? null;
      const hostType = normalize(car.host_type);
      const hasAirConditioning =
        car.air_conditioning === true ||
        features.some((feature) => normalize(feature) === "air conditioning");

      const matchesQuery =
        !query ||
        normalize(car.name).includes(query) ||
        normalize(car.city).includes(query) ||
        normalize(car.brand).includes(query) ||
        normalize(car.model).includes(query);
      const matchesRegion = !filters.region || car.region === filters.region;
      const matchesCity = !filters.city || car.city === filters.city;
      const matchesType = !filters.carType || car.car_type === filters.carType;
      const matchesBrand = !filters.brand || car.brand === filters.brand;
      const matchesModel = !filters.model || car.model === filters.model;
      const matchesFuel = !filters.fuelType || fuel === normalize(filters.fuelType);
      const matchesTransmission = !filters.transmission || transmission === filters.transmission;
      const matchesMin = !filters.minPrice || car.daily_price >= filters.minPrice;
      const matchesMax = !filters.maxPrice || car.daily_price <= filters.maxPrice;
      const matchesInstantBook = !filters.instantBook || car.instant_book === true;
      const matchesDelivery = !filters.deliveryAvailable || car.delivery_available === true;
      const matchesSeatsCapacity = matchesSeats(car.seats, filters.seatsCapacity);
      const matchesMinYear =
        !filters.minYear || (typeof car.year === "number" && car.year >= filters.minYear);
      const matchesMaxYear =
        !filters.maxYear || (typeof car.year === "number" && car.year <= filters.maxYear);
      const matchesAirConditioning = !filters.airConditioning || hasAirConditioning;
      const matchesRating = !filters.minRating || (rating !== null && rating >= filters.minRating);
      const matchesHostType = !filters.hostType || hostType === normalize(filters.hostType);
      const matchesFeatures =
        !filters.features || filters.features.length === 0
          ? true
          : filters.features.every((feature) =>
              features.some((item) => normalize(item) === normalize(feature)),
            );

      if (!matchesQuery) return false;
      if (!matchesRegion) return false;
      if (!matchesCity) return false;
      if (!matchesType) return false;
      if (!matchesBrand) return false;
      if (!matchesModel) return false;
      if (!matchesFuel) return false;
      if (!matchesTransmission) return false;
      if (!matchesMin || !matchesMax) return false;
      if (!matchesInstantBook || !matchesDelivery) return false;
      if (!matchesSeatsCapacity || !matchesMinYear || !matchesMaxYear) return false;
      if (!matchesAirConditioning || !matchesRating) return false;
      if (!matchesHostType || !matchesFeatures) return false;

      if (filters.sort === "most_booked" && typeof bookings !== "number") return false;
      if (filters.sort === "top_rated" && rating === null) return false;
      if (filters.sort === "new_listings" && !car.created_at) return false;

      return true;
    });
  }, [cars, filters]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const compareNumbers = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);

    switch (filters.sort) {
      case "price_low":
        return list.sort((a, b) => compareNumbers(a.daily_price, b.daily_price));
      case "price_high":
        return list.sort((a, b) => compareNumbers(b.daily_price, a.daily_price));
      case "most_booked":
        return list.sort((a, b) =>
          compareNumbers(b.bookings_count ?? b.trips_count ?? 0, a.bookings_count ?? a.trips_count ?? 0),
        );
      case "top_rated":
        return list.sort((a, b) => compareNumbers(getComparableRating(b) ?? 0, getComparableRating(a) ?? 0));
      case "new_listings":
        return list.sort((a, b) =>
          compareNumbers(
            new Date(b.created_at ?? 0).getTime(),
            new Date(a.created_at ?? 0).getTime(),
          ),
        );
      default:
        return list;
    }
  }, [filtered, filters.sort]);

  const markers = sorted.map((car) => ({
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
      filters.instantBook ||
      filters.deliveryAvailable ||
      filters.transmission ||
      filters.seatsCapacity ||
      filters.minYear ||
      filters.maxYear ||
      filters.airConditioning ||
      filters.minRating ||
      filters.hostType ||
      (filters.features && filters.features.length > 0),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand">Explore</p>
          <h1 className="text-3xl font-semibold text-foreground">Find your next ride</h1>
          <p className="text-gray-700">Search by city, car type, budget, and booking style.</p>
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
            <Button size="sm" className="h-8 rounded-full px-4" type="submit">
              Search
            </Button>
          </form>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2">
            <ArrowDownAZ className="h-4 w-4 text-gray-500" />
            <Select
              value={filters.sort ?? ""}
              onChange={(e) => updateFilters({ ...filters, sort: e.target.value as SortBy })}
              className="h-8 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Sort listings"
            >
              <option value="">Sort by</option>
              {SORT_OPTIONS.map((option) => {
                const isDisabled = option.requires ? !sortCapabilities[option.requires] : false;
                return (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={isDisabled}
                    title={isDisabled ? "Coming soon" : undefined}
                  >
                    {isDisabled ? `${option.label} (Coming soon)` : option.label}
                  </option>
                );
              })}
            </Select>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <FiltersSidebar filters={filters} onChange={updateFilters} capabilities={capabilities} />
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
            <div className="flex h-10 items-center gap-2 rounded-full border border-border bg-white px-3">
              <ArrowDownAZ className="h-4 w-4 text-gray-500" />
              <Select
                value={filters.sort ?? ""}
                onChange={(e) => updateFilters({ ...filters, sort: e.target.value as SortBy })}
                className="h-8 border-0 bg-transparent pr-6 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Sort listings"
              >
                <option value="">Sort by</option>
                {SORT_OPTIONS.map((option) => {
                  const isDisabled = option.requires ? !sortCapabilities[option.requires] : false;
                  return (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={isDisabled}
                      title={isDisabled ? "Coming soon" : undefined}
                    >
                      {isDisabled ? `${option.label} (Coming soon)` : option.label}
                    </option>
                  );
                })}
              </Select>
            </div>
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
            ) : sorted.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-border bg-white p-6 text-center text-sm text-gray-600">
                No cars found. Try adjusting your filters.
              </div>
            ) : (
              sorted.map((car) => (
                <CarCard
                  key={car.id}
                  car={{
                    id: car.id,
                    title: car.name,
                    city: car.city,
                    region: car.region,
                    daily_price: car.daily_price,
                    rating: getComparableRating(car) ?? undefined,
                    car_type: car.car_type,
                    description: car.description,
                    image_url: car.image,
                    host_type: car.host_type,
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
