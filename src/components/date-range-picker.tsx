"use client";

import { useMemo } from "react";
import { addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateNights } from "@/lib/utils";

type Props = {
  startDate?: string;
  endDate?: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
};

export function DateRangePicker({ startDate, endDate, onChange }: Props) {
  const nights = useMemo(
    () => calculateNights(startDate, endDate),
    [startDate, endDate],
  );

  const quickSelect = (days: number) => {
    const start = new Date();
    const end = addDays(start, days);
    onChange({
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    });
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
              onChange({
                startDate: e.target.value,
                endDate: endDate ?? e.target.value,
              })
            }
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">End date</label>
          <Input
            type="date"
            value={endDate ?? ""}
            min={startDate ?? undefined}
            onChange={(e) =>
              onChange({
                startDate: startDate ?? e.target.value,
                endDate: e.target.value,
              })
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
