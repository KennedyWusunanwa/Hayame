"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { carTypes } from "@/lib/utils";
import { useLocations } from "@/lib/use-locations";

export function HeroSearchBar() {
  const pillBg =
    "flex items-center gap-2 rounded-full bg-white/10 px-4 py-3";
  const fieldBase =
    "h-12 w-full border-0 bg-transparent text-white placeholder:text-white/70 focus-visible:ring-0";
  const router = useRouter();
  const { regions, citiesByRegion } = useLocations();
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [carType, setCarType] = useState("");
  const locationOptions = useMemo(() => {
    if (!region) return [];
    return (citiesByRegion[region] ?? []).map((c) => ({ value: c, label: c }));
  }, [citiesByRegion, region]);

  const onSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set("q", `${city}, ${region || ""}`.trim());
    if (!city && region) params.set("q", region);
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    if (carType) params.set("carType", carType);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="-mt-10 w-full">
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#0a2137] p-5 text-white shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-nowrap items-center gap-3 overflow-x-auto sm:flex-1 sm:overflow-visible">
            <div className={`${pillBg} min-w-[220px]`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
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
            <div className={`${pillBg} min-w-[180px]`}>
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
            <div className={`${pillBg} min-w-[260px]`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="flex w-full gap-2">
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
                  className={`${fieldBase} h-12`}
                />
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
                  className={`${fieldBase} h-12`}
                />
              </div>
            </div>
            <div className={`${pillBg} min-w-[180px]`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
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
          </div>
          <Button
            className="h-12 w-full rounded-full border border-brand bg-brand px-6 text-white hover:bg-white hover:text-brand sm:w-auto"
            onClick={onSearch}
          >
            Search
          </Button>
        </div>
            <Select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setCity("");
              }}
              className="h-10 border-0 bg-[#0a2137] text-white focus-visible:ring-0"
            >
              <option value="">Choose region</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div className="order-2 flex items-center gap-2 rounded-full bg-white/10 px-4 py-3">
            <Select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-10 border-0 bg-[#0a2137] text-white focus-visible:ring-0"
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
          <div className="order-3 flex items-center gap-2 rounded-full bg-white/10 px-4 py-3">
            <Calendar className="h-5 w-5 text-white" />
            <div className="flex w-full gap-2">
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
                className="h-10 border-0 bg-transparent text-white placeholder:text-white/70 focus-visible:ring-0"
              />
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
                className="h-10 border-0 bg-transparent text-white placeholder:text-white/70 focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="order-4 flex items-center gap-2 rounded-full bg-white/10 px-4 py-3">
            <CarFront className="h-5 w-5 text-brand" />
            <Select
              value={carType}
              onChange={(e) => setCarType(e.target.value)}
              className="h-10 border-0 bg-[#0a2137] text-white placeholder:text-white/70 focus-visible:ring-0"
            >
              <option value="">Car Type</option>
              {carTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </Select>
          </div>
          <Button
            className="order-5 h-12 rounded-full border border-brand bg-brand px-6 text-white hover:bg-white hover:text-brand"
            onClick={onSearch}
          >
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}
