"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  carId: string;
};

export function AvailabilityForm({ carId }: Props) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [available, setAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    if (!startDate || !endDate) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId, startDate, endDate, available }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save availability");
      }
      setMessage("Saved availability window.");
    } catch (error: any) {
      setMessage(error.message ?? "Unable to save availability");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-white p-4">
      <p className="text-sm font-semibold text-foreground">Availability window</p>
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onChange={({ startDate, endDate }) => {
          setStartDate(startDate);
          setEndDate(endDate);
        }}
      />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <Checkbox checked={available} onChange={() => setAvailable((v) => !v)} />
        Mark as available (uncheck to block these dates)
      </label>
      {message ? <p className="text-xs text-gray-600">{message}</p> : null}
      <Button type="button" onClick={submit} disabled={saving || !startDate || !endDate}>
        {saving ? "Saving..." : "Save availability"}
      </Button>
    </div>
  );
}
