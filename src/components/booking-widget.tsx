"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { formatCurrency, calculateNights } from "@/lib/utils";

type Props = {
  carId: string;
  dailyPrice: number;
};

export function BookingWidget({ carId, dailyPrice }: Props) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const nights = calculateNights(startDate, endDate);
  const billableNights = Math.max(nights, 1);
  const total = billableNights * dailyPrice;

  const submit = async () => {
    if (!startDate || !endDate) return;
    try {
      setLoading(true);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId, startDate, endDate }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message ?? "Could not create booking");
      }
      router.push("/dashboard/bookings");
    } catch (error) {
      console.error(error);
      alert("Please sign in and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-card">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold text-brand">
            {formatCurrency(dailyPrice)} <span className="text-base text-gray-500">/ day</span>
          </div>
          <div className="text-sm text-gray-600">Pay later · Paystack coming soon</div>
        </div>
        <div className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          Free cancellation within 24h
        </div>
      </div>
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onChange={({ startDate: start, endDate: end }) => {
          setStartDate(start);
          setEndDate(end);
        }}
      />
      <div className="flex items-center justify-between text-sm text-gray-700">
        <span>{billableNights} day total</span>
        <span className="text-base font-semibold text-foreground">{formatCurrency(total)}</span>
      </div>
      <Button className="w-full shadow-soft" onClick={submit} disabled={loading || !startDate || !endDate}>
        {loading ? "Processing..." : "Book now"}
      </Button>
    </div>
  );
}
