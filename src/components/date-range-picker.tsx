"use client";

import { useMemo } from "react";
import { addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateNights } from "@/lib/utils";

type Props = {
  startDate?: string;
  endDate?: string;
  disabledDates?: string[];
  onChange: (range: { startDate: string; endDate: string }) => void;
  onInvalidRange?: (message: string) => void;
};

export function DateRangePicker({
  startDate,
  endDate,
  disabledDates = [],
  onChange,
  onInvalidRange,
}: Props) {
  const nights = useMemo(
    () => calculateNights(startDate, endDate),
    [startDate, endDate],
  );
  const blocked = useMemo(() => new Set(disabledDates), [disabledDates]);

  const quickSelect = (days: number) => {
    const start = new Date();
    const end = addDays(start, days);
    const nextStart = format(start, "yyyy-MM-dd");
    const nextEnd = format(end, "yyyy-MM-dd");
    if (rangeHasBlockedDates(nextStart, nextEnd, blocked)) {
      onInvalidRange?.("Those dates include unavailable days.");
      return;
    }
    onChange({ startDate: nextStart, endDate: nextEnd });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-700">Start date</label>
          <Input
            type="date"
            value={startDate ?? ""}
            onChange={(e) =>
              (() => {
                const nextStart = e.target.value;
                const endCandidate =
                  endDate && new Date(endDate) > new Date(nextStart)
                    ? endDate
                    : format(addDays(new Date(nextStart), 1), "yyyy-MM-dd");
                const nextEnd = endCandidate;
                if (rangeHasBlockedDates(nextStart, nextEnd, blocked)) {
                  onInvalidRange?.("Start date falls on an unavailable day.");
                  return;
                }
                onChange({
                  startDate: nextStart,
                  endDate: nextEnd,
                });
              })()
            }
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">End date</label>
          <Input
            type="date"
            value={endDate ?? ""}
            min={
              startDate
                ? format(addDays(new Date(startDate), 1), "yyyy-MM-dd")
                : undefined
            }
            onChange={(e) =>
              (() => {
                const nextStart = startDate ?? e.target.value;
                const nextEnd = e.target.value;
                if (rangeHasBlockedDates(nextStart, nextEnd, blocked)) {
                  onInvalidRange?.("End date range includes unavailable days.");
                  return;
                }
                onChange({
                  startDate: nextStart,
                  endDate: nextEnd,
                });
              })()
            }
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
        <span>Quick select:</span>
        {[2, 5, 7].map((days) => (
          <Button
            key={days}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => quickSelect(days)}
          >
            {days} days
          </Button>
        ))}
      </div>
      <div className="text-sm text-gray-700">
        {nights > 0 ? `${nights} night stay` : "Pick your dates"}
      </div>
    </div>
  );
}

function rangeHasBlockedDates(startDate: string, endDate: string, blocked: Set<string>) {
  if (!startDate || !endDate || blocked.size === 0) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  for (let dt = new Date(start); dt < end; dt = addDays(dt, 1)) {
    const key = format(dt, "yyyy-MM-dd");
    if (blocked.has(key)) return true;
  }
  return false;
}
