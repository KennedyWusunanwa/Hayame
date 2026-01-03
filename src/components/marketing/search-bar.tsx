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
        <div className="grid items-center gap-4 md:grid-cols-[1.2fr,1fr,1fr,auto]">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-3">
            <MapPin className="h-5 w-5 text-brand" />
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
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-3">
            <Calendar className="h-5 w-5 text-brand" />
            <div className="flex w-full gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 border-0 bg-transparent text-white placeholder:text-white/70 focus-visible:ring-0"
              />
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 border-0 bg-transparent text-white placeholder:text-white/70 focus-visible:ring-0"
              />
            </div>
          </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-3">
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
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-3">
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
          <Button
            className="h-12 rounded-full border border-brand bg-brand px-6 text-white hover:bg-white hover:text-brand"
            onClick={onSearch}
          >
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}
