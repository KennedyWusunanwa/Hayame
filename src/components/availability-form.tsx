"use client";

import { useState } from "react";
import { addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  carId: string;
};

const weekdays = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

export function AvailabilityForm({ carId }: Props) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [available, setAvailable] = useState(true);
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [horizonDays, setHorizonDays] = useState(90);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submitRange = async () => {
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

  const submitRecurring = async () => {
    if (repeatDays.length === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const start = new Date();
      const end = addDays(start, horizonDays);
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId,
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
          available: false,
          repeatDays,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save recurring blocks");
      }
      setMessage("Saved recurring block days.");
    } catch (error: any) {
      setMessage(error.message ?? "Unable to save recurring availability");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-white p-4">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Block specific dates</p>
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
        <Button type="button" onClick={submitRange} disabled={saving || !startDate || !endDate}>
          {saving ? "Saving..." : "Save date window"}
        </Button>
      </div>

      <div className="space-y-3 border-t border-border/60 pt-3">
        <p className="text-sm font-semibold text-foreground">Weekly blocks (never available)</p>
        <div className="flex flex-wrap gap-2">
          {weekdays.map((day) => {
            const active = repeatDays.includes(day.key);
            return (
              <button
                key={day.key}
                type="button"
                className={`rounded-full border px-3 py-1 text-sm ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-gray-700"}`}
                onClick={() => {
                  setRepeatDays((prev) =>
                    prev.includes(day.key) ? prev.filter((d) => d !== day.key) : [...prev, day.key],
                  );
                }}
              >
                {day.label}
              </button>
            );
          })}
        </div>
        <label className="text-xs text-gray-600">
          Horizon: block these weekdays for{" "}
          <select
            className="rounded border border-border bg-white px-2 py-1 text-xs"
            value={horizonDays}
            onChange={(e) => setHorizonDays(Number(e.target.value))}
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
          </select>
        </label>
        <Button type="button" variant="secondary" onClick={submitRecurring} disabled={saving || repeatDays.length === 0}>
          {saving ? "Saving..." : "Save weekly blocks"}
        </Button>
      </div>

      {message ? <p className="text-xs text-gray-700">{message}</p> : null}
    </div>
  );
}
