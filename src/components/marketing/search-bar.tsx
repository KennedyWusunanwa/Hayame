"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CarFront, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { carTypes } from "@/lib/utils";
import { useLocations } from "@/lib/use-locations";
import { useCarCatalog } from "@/lib/use-car-catalog";

export function HeroSearchBar() {
  const pillBg =
    "relative z-10 flex items-center gap-3 rounded-full bg-transparent px-4 h-12 border border-white/20 ring-2 ring-white/15 focus-within:bg-[#12263a]";
  const fieldBase =
    "h-12 w-full min-w-0 text-sm border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0 dark-select";

  const router = useRouter();
  const { regions, citiesByRegion } = useLocations();
  const { makes } = useCarCatalog();

  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [carType, setCarType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [query, setQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const locationOptions = useMemo(() => {
    if (!region) return [];
    return (citiesByRegion[region] ?? []).map((c) => ({ value: c, label: c }));
  }, [citiesByRegion, region]);

  const modelOptions = useMemo(() => {
    if (!brand) return [];
    return makes.find((make) => make.name === brand)?.models ?? [];
  }, [brand, makes]);

  const onSearch = () => {
    const params = new URLSearchParams();
    const trimmedQuery = query.trim();

    if (trimmedQuery) params.set("q", trimmedQuery);
    if (city) {
      params.set("city", city);
      if (!trimmedQuery) params.set("q", city);
    }
    if (region) params.set("region", region);
    if (brand) params.set("brand", brand);
    if (model) params.set("model", model);
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    if (carType) params.set("carType", carType);

    router.push(`/explore?${params.toString()}`);

    setRegion("");
    setCity("");
    setStartDate("");
    setEndDate("");
    setCarType("");
    setBrand("");
    setModel("");
    setQuery("");
  };

  return (
    <div className="-mt-4 w-full sm:-mt-6 lg:-mt-8">
      <div className="mx-auto max-w-5xl overflow-visible rounded-3xl border border-white/10 bg-[#0a2137] px-3 py-3 text-white shadow-xl sm:px-4 sm:py-4">
        <div className="lg:hidden">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch();
            }}
          >
            <div className="flex h-12 flex-1 items-center gap-2 rounded-full border border-white/20 bg-[#12263a] px-4 ring-1 ring-white/10">
              <Search className="h-4 w-4 text-white/70" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cars or cities"
                className="h-8 border-0 bg-transparent px-0 text-sm text-white placeholder:text-white/50 focus-visible:ring-0"
              />
            </div>

            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-12 rounded-full border-white/20 bg-[#12263a] px-0 text-white hover:bg-[#163049] hover:text-white"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[92vw] max-w-sm p-4">
                <SheetHeader>
                  <SheetTitle>Search filters</SheetTitle>
                </SheetHeader>

                <div className="mt-4 flex max-h-[calc(100vh-12rem)] flex-col gap-3 overflow-y-auto pr-1">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Region</label>
                    <Select
                      value={region}
                      onChange={(event) => {
                        setRegion(event.target.value);
                        setCity("");
                      }}
                    >
                      <option value="">Choose region</option>
                      {regions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">City</label>
                    <Select
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      disabled={!region}
                    >
                      <option value="">City</option>
                      {locationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Car type</label>
                    <Select value={carType} onChange={(event) => setCarType(event.target.value)}>
                      <option value="">Car Type</option>
                      {carTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Brand</label>
                    <Select
                      value={brand}
                      onChange={(event) => {
                        setBrand(event.target.value);
                        setModel("");
                      }}
                    >
                      <option value="">Brand</option>
                      {makes.map((make) => (
                        <option key={make.id} value={make.name}>
                          {make.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-800">Model</label>
                    <Select
                      value={model}
                      onChange={(event) => setModel(event.target.value)}
                      disabled={!brand}
                    >
                      <option value="">Model</option>
                      {modelOptions.map((option) => (
                        <option key={option.id} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-800">Start date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-800">End date</label>
                      <Input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(event) => setEndDate(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <SheetClose asChild>
                    <Button type="button" variant="outline">
                      Close
                    </Button>
                  </SheetClose>
                  <Button
                    type="button"
                    onClick={() => {
                      setMobileFiltersOpen(false);
                      onSearch();
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              type="submit"
              className="h-12 rounded-full border border-brand bg-brand px-4 text-sm font-semibold text-white shadow-soft hover:bg-white hover:text-brand"
            >
              Search
            </Button>
          </form>
        </div>

        <div className="hidden flex-col gap-3 lg:flex">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            <div className={`${pillBg} w-full`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <MapPin className="h-5 w-5 text-brand" />
              </div>
              <Select
                value={region}
                onChange={(event) => {
                  setRegion(event.target.value);
                  setCity("");
                }}
                className={fieldBase}
              >
                <option value="">Choose region</option>
                {regions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>

            <div className={`${pillBg} w-full`}>
              <Select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className={fieldBase}
                disabled={!region}
              >
                <option value="">City</option>
                {locationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className={`${pillBg} w-full`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <CarFront className="h-5 w-5 text-brand" />
              </div>
              <Select
                value={carType}
                onChange={(event) => setCarType(event.target.value)}
                className={fieldBase}
              >
                <option value="">Car Type</option>
                {carTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </Select>
            </div>

            <div className={`${pillBg} w-full`}>
              <Select
                value={brand}
                onChange={(event) => {
                  setBrand(event.target.value);
                  setModel("");
                }}
                className={fieldBase}
              >
                <option value="">Brand</option>
                {makes.map((make) => (
                  <option key={make.id} value={make.name}>
                    {make.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className={`${pillBg} w-full`}>
              <Select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className={fieldBase}
                disabled={!brand}
              >
                <option value="">Model</option>
                {modelOptions.map((option) => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-center">
            <div className={`${pillBg} w-full lg:col-span-2`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="flex w-full items-center gap-2">
                <Input
                  type="text"
                  value={startDate}
                  placeholder="dd/mm/yy"
                  inputMode="numeric"
                  onFocus={(event) => (event.currentTarget.type = "date")}
                  onBlur={(event) => {
                    if (!event.currentTarget.value) event.currentTarget.type = "text";
                  }}
                  onChange={(event) => setStartDate(event.target.value)}
                  className={`${fieldBase} min-w-0 flex-1`}
                />
                <div className="h-6 w-px bg-white/10" />
                <Input
                  type="text"
                  value={endDate}
                  min={startDate || undefined}
                  placeholder="dd/mm/yy"
                  inputMode="numeric"
                  onFocus={(event) => (event.currentTarget.type = "date")}
                  onBlur={(event) => {
                    if (!event.currentTarget.value) event.currentTarget.type = "text";
                  }}
                  onChange={(event) => setEndDate(event.target.value)}
                  className={`${fieldBase} min-w-0 flex-1`}
                />
              </div>
            </div>

            <Button
              className="h-12 w-full rounded-full border border-brand bg-brand px-6 font-semibold text-white shadow-soft hover:bg-white hover:text-brand lg:col-span-1"
              onClick={onSearch}
            >
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
