"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type Props = {
  defaultPlatformFeePercent: number;
  isPlaceholderFee?: boolean;
};

export function EarningsCalculator({
  defaultPlatformFeePercent,
  isPlaceholderFee = false,
}: Props) {
  const [pricePerDay, setPricePerDay] = useState("300");
  const [daysRentedPerMonth, setDaysRentedPerMonth] = useState("15");
  const [platformFeePercent, setPlatformFeePercent] = useState(
    String(defaultPlatformFeePercent),
  );

  const values = useMemo(() => {
    const price = parseFieldValue(pricePerDay, { min: 0 });
    const days = parseFieldValue(daysRentedPerMonth, { min: 0, max: 31 });
    const feePercent = parseFieldValue(platformFeePercent, {
      min: 0,
      max: 100,
    });
    const gross = price * days;
    const feeAmount = gross * (feePercent / 100);
    const net = gross - feeAmount;
    return { gross, feeAmount, net };
  }, [daysRentedPerMonth, platformFeePercent, pricePerDay]);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Earnings calculator
        </p>
        <p className="text-xs text-gray-600">
          Estimates only. Actual earnings vary.
        </p>
        {isPlaceholderFee ? (
          <p className="text-xs text-amber-700">
            Platform fee defaults to 10% until config is set.
          </p>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field
          label="Price per day (GHS)"
          value={pricePerDay}
          onChange={setPricePerDay}
          onBlur={setPricePerDay}
          min={0}
        />
        <Field
          label="Days rented / month"
          value={daysRentedPerMonth}
          onChange={setDaysRentedPerMonth}
          onBlur={setDaysRentedPerMonth}
          min={0}
          max={31}
        />
        <Field
          label="Platform fee (%)"
          value={platformFeePercent}
          onChange={setPlatformFeePercent}
          onBlur={setPlatformFeePercent}
          min={0}
          max={100}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Estimated gross" value={formatCurrency(values.gross)} />
        <Metric
          label="Platform fee amount"
          value={formatCurrency(values.feeAmount)}
        />
        <Metric label="Estimated net" value={formatCurrency(values.net)} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(sanitizeNumericInput(e.target.value))}
        onBlur={(e) =>
          onBlur(normalizeFieldValue(e.target.value, { min, max }))
        }
      />
    </div>
  );
}

function sanitizeNumericInput(value: string) {
  return value.replace(/[^\d.]/g, "");
}

function parseFieldValue(
  value: string,
  { min, max }: { min?: number; max?: number } = {},
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min ?? 0;
  if (typeof min === "number" && parsed < min) return min;
  if (typeof max === "number" && parsed > max) return max;
  return parsed;
}

function normalizeFieldValue(
  value: string,
  { min, max }: { min?: number; max?: number } = {},
) {
  const trimmed = value.trim();
  if (!trimmed) {
    return typeof min === "number" ? String(min) : "0";
  }
  return String(parseFieldValue(trimmed, { min, max }));
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
