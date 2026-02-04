"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
    if (city) {
      params.set("city", city);
      params.set("q", city);
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
  };

  return (
    <div className="-mt-4 w-full sm:-mt-6 lg:-mt-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#0a2137] px-3 py-3 text-white shadow-xl sm:px-4 sm:py-4 overflow-visible">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            <div className={`${pillBg} w-full`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <MapPin className="h-5 w-5 text-brand" />
              </div>
              <Select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setCity("");
                }}
                className={fieldBase}
              >
                <option value="">Choose region</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
            <div className={`${pillBg} w-full`}>
              <Select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={fieldBase}
                disabled={!region}
              >
                <option value="">City</option>
                {locationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
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
                onChange={(e) => setCarType(e.target.value)}
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
                onChange={(e) => {
                  setBrand(e.target.value);
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
                onChange={(e) => setModel(e.target.value)}
                className={fieldBase}
                disabled={!brand}
              >
                <option value="">Model</option>
                {modelOptions.map((opt) => (
                  <option key={opt.id} value={opt.name}>
                    {opt.name}
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
                  onFocus={(e) => (e.currentTarget.type = "date")}
                  onBlur={(e) => {
                    if (!e.currentTarget.value) e.currentTarget.type = "text";
                  }}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`${fieldBase} min-w-0 flex-1`}
                />
                <div className="h-6 w-px bg-white/10" />
                <Input
                  type="text"
                  value={endDate}
                  min={startDate || undefined}
                  placeholder="dd/mm/yy"
                  inputMode="numeric"
                  onFocus={(e) => (e.currentTarget.type = "date")}
                  onBlur={(e) => {
                    if (!e.currentTarget.value) e.currentTarget.type = "text";
                  }}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`${fieldBase} min-w-0 flex-1`}
                />
              </div>
            </div>
            <Button
              className="h-12 w-full rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand/90 lg:col-span-1"
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
