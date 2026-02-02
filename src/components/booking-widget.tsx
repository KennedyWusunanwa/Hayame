"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency, calculateNights } from "@/lib/utils";

type Props = {
  carId: string;
  dailyPrice: number;
};

export function BookingWidget({ carId, dailyPrice }: Props) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const publicKey = useMemo(() => process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, []);

  const nights = calculateNights(startDate, endDate);
  const billableNights = Math.max(nights, 1);
  const total = billableNights * dailyPrice;

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const start = new Date();
        const end = addDays(start, 180);
        const res = await fetch(
          `/api/availability?carId=${carId}&startDate=${format(start, "yyyy-MM-dd")}&endDate=${format(
            end,
            "yyyy-MM-dd",
          )}`,
        );
        if (!res.ok) return;
        const payload = (await res.json()) as { blockedDates?: string[] };
        setBlockedDates(payload.blockedDates ?? []);
      } catch {
        setBlockedDates([]);
      }
    };
    loadAvailability();
  }, [carId]);

  const submit = async () => {
    if (!startDate || !endDate) return;
    if (!publicKey) {
      alert("Paystack is not configured yet.");
      return;
    }
    try {
      setLoading(true);
      setMessage(null);

      const availabilityRes = await fetch(
        `/api/availability?carId=${carId}&startDate=${startDate}&endDate=${endDate}`,
      );
      if (availabilityRes.ok) {
        const payload = (await availabilityRes.json()) as { available?: boolean };
        if (payload.available === false) {
          setMessage("Those dates are no longer available. Please pick new dates.");
          setLoading(false);
          return;
        }
      }

      await loadPaystackScript();
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const amountInMinorUnit = Math.round(total * 100);
      const reference = `car-${carId}-${Date.now()}`;
      const PaystackPop = (window as any).PaystackPop;
      if (!PaystackPop?.setup) {
        throw new Error("Paystack failed to load");
      }

      const handleSuccess = async (tran: any) => {
        try {
          const res = await fetch("/api/bookings/paystack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              carId,
              startDate,
              endDate,
              reference: tran?.reference ?? reference,
              amount: amountInMinorUnit,
            }),
          });
          if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message ?? "Payment verified but booking failed");
          }
          router.push("/dashboard/bookings");
        } catch (err: any) {
          alert(err.message ?? "Booking failed after payment. Please contact support.");
        } finally {
          setLoading(false);
        }
      };

      const handler = PaystackPop.setup({
        key: publicKey,
        email: user.email ?? `${user.id}@guest.local`,
        amount: amountInMinorUnit,
        currency: "GHS",
        ref: reference,
        callback: (tran: any) => {
          void handleSuccess(tran);
        },
        onClose: () => {
          setLoading(false);
        },
      });
      handler.openIframe();
    } catch (error) {
      console.error(error);
      alert((error as Error).message ?? "Please sign in and try again.");
    } finally {
      // loading is cleared in onClose/callback, keep for safety on immediate errors
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
          <div className="text-sm text-gray-600">
            Pay now with Paystack; host approval required before pickup.
          </div>
        </div>
        <div className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          Refunded if host rejects
        </div>
      </div>
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        disabledDates={blockedDates}
        onChange={({ startDate: start, endDate: end }) => {
          setMessage(null);
          setStartDate(start);
          setEndDate(end);
        }}
        onInvalidRange={(msg) => setMessage(msg)}
      />
      {message ? <p className="text-xs text-amber-700">{message}</p> : null}
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

let paystackScriptPromise: Promise<void> | null = null;
async function loadPaystackScript() {
  if (typeof window === "undefined") return;
  if ((window as any).PaystackPop) return;
  if (!paystackScriptPromise) {
    paystackScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Paystack"));
      document.body.appendChild(script);
    });
  }
  return paystackScriptPromise;
}
