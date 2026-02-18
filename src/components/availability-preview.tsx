"use client";

import { useState } from "react";
import { addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  carId: string;
};

type AvailabilityResult = {
  available?: boolean;
  blockedDates?: string[];
};

export function AvailabilityPreview({ carId }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/availability?carId=${carId}&startDate=${startDate}&endDate=${endDate}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message ?? "Unable to check availability");
      }
      const payload = (await res.json()) as AvailabilityResult;
      setResult(payload);
    } catch (err: any) {
      setResult(null);
      setError(err.message ?? "Availability checking coming soon.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Availability preview</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-gray-700">Start</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">End</label>
          <Input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={check} disabled={loading}>
        {loading ? "Checking..." : "Check availability"}
      </Button>
      {result ? (
        <p
          className={
            result.available
              ? "text-xs font-semibold text-emerald-700"
              : "text-xs font-semibold text-amber-700"
          }
        >
          {result.available ? "Available for those dates." : "Unavailable for those dates."}
        </p>
      ) : null}
      {error ? <p className="text-xs text-amber-700">{error}</p> : null}
    </div>
  );
}
