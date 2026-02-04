"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { featureOptions, carTypes, fuelTypes } from "@/lib/utils";
import { useLocations } from "@/lib/use-locations";
import { useCarCatalog } from "@/lib/use-car-catalog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type Filters = {
  query?: string;
  region?: string;
  city?: string;
  carType?: string;
  brand?: string;
  model?: string;
  fuelType?: string;
  minPrice?: number;
  maxPrice?: number;
  features?: string[];
};

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export function FiltersSidebar({ filters, onChange }: Props) {
  const { regions, citiesByRegion } = useLocations();
  const { makes } = useCarCatalog();
  const cities = useMemo(
    () => (filters.region ? citiesByRegion[filters.region] ?? [] : []),
    [filters.region, citiesByRegion],
  );
  const models = useMemo(() => {
    if (!filters.brand) return [];
    return makes.find((make) => make.name === filters.brand)?.models ?? [];
  }, [filters.brand, makes]);

  const content = (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-800">Search</label>
        <Input
          placeholder="Search by car or city"
          value={filters.query ?? ""}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-800">Region</label>
        <Select
          value={filters.region ?? ""}
          onChange={(e) => onChange({ ...filters, region: e.target.value, city: "" })}
        >
          <option value="">Any</option>
          {regions.map((region) => (
            <option value={region} key={region}>
              {region}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-800">City</label>
        <Select
          value={filters.city ?? ""}
          onChange={(e) => onChange({ ...filters, city: e.target.value })}
          disabled={!filters.region}
        >
          <option value="">Any</option>
          {cities.map((city) => (
            <option value={city} key={city}>
              {city}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-800">Car type</label>
        <Select
          value={filters.carType ?? ""}
          onChange={(e) => onChange({ ...filters, carType: e.target.value })}
        >
          <option value="">Any</option>
          {carTypes.map((type) => (
            <option value={type} key={type}>
              {type}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-800">Brand</label>
        <Select
          value={filters.brand ?? ""}
          onChange={(e) => onChange({ ...filters, brand: e.target.value, model: "" })}
        >
          <option value="">Any</option>
          {makes.map((make) => (
            <option key={make.id} value={make.name}>
              {make.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-800">Model</label>
        <Select
          value={filters.model ?? ""}
          onChange={(e) => onChange({ ...filters, model: e.target.value })}
          disabled={!filters.brand}
        >
          <option value="">Any</option>
          {models.map((model) => (
            <option key={model.id} value={model.name}>
              {model.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-800">Fuel</label>
        <Select
          value={filters.fuelType ?? ""}
          onChange={(e) => onChange({ ...filters, fuelType: e.target.value })}
        >
          <option value="">Any</option>
          {fuelTypes.map((fuel) => (
            <option key={fuel} value={fuel}>
              {fuel.charAt(0).toUpperCase() + fuel.slice(1)}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-800">Min price</label>
          <Input
            type="number"
            placeholder="200"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-800">Max price</label>
          <Input
            type="number"
            placeholder="1500"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-gray-800">Features</label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {featureOptions.map((feature) => {
            const checked = filters.features?.includes(feature) ?? false;
            return (
              <label key={feature} className="flex items-center gap-2 text-gray-700">
                <Checkbox
                  checked={checked}
                  onChange={() => {
                    const current = new Set(filters.features ?? []);
                    if (checked) {
                      current.delete(feature);
                    } else {
                      current.add(feature);
                    }
                    onChange({ ...filters, features: Array.from(current) });
                  }}
                />
                <span>{feature}</span>
              </label>
            );
          })}
        </div>
      </div>
      <Button
        variant="outline"
        onClick={() =>
          onChange({
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
          })
        }
      >
        Reset filters
      </Button>
    </div>
  );

  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden h-fit w-72 rounded-2xl border border-border bg-white p-5 shadow-card lg:block">
        {content}
      </div>
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex-1 overflow-y-auto">{content}</div>
            <SheetClose asChild>
              <Button className="mt-4 w-full">Apply</Button>
            </SheetClose>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
