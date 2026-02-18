"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/date-range-picker";
import { VerificationBadges } from "@/components/verification-badges";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency, calculateNights } from "@/lib/utils";

type Props = {
  carId: string;
  dailyPrice: number;
  instantBook?: boolean | null;
  deliveryFee?: number | null;
  insuranceFee?: number | null;
  depositAmount?: number | null;
  cancellationPolicy?: string | null;
  hostVerification?: {
    idVerified?: boolean | null;
    phoneVerified?: boolean | null;
    emailVerified?: boolean | null;
  };
};

export function BookingWidget({
  carId,
  dailyPrice,
  instantBook,
  deliveryFee,
  insuranceFee,
  depositAmount,
  cancellationPolicy,
  hostVerification,
}: Props) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [hold, setHold] = useState<{ id: string; expiresAt: string } | null>(null);
  const [holdRemaining, setHoldRemaining] = useState<string | null>(null);
  const router = useRouter();
  const publicKey = useMemo(() => process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, []);

  const nights = calculateNights(startDate, endDate);
  const billableNights = Math.max(nights, 1);
  const baseTotal = billableNights * dailyPrice;
  const platformFeeAmount = 0;
  const total = baseTotal;

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

  useEffect(() => {
    setHold(null);
    setHoldRemaining(null);
  }, [carId, startDate, endDate]);

  useEffect(() => {
    if (!hold) {
      setHoldRemaining(null);
      return;
    }
    const updateRemaining = () => {
      const diff = new Date(hold.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setHold(null);
        setHoldRemaining(null);
        setMessage("Reservation expired. Please select dates again.");
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setHoldRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [hold]);

  const submit = async () => {
    if (!startDate || !endDate) return;
    if (nights <= 0) {
      setMessage("End date must be after start date.");
      return;
    }
    if (!publicKey) {
      alert("Paystack is not configured yet.");
      return;
    }
    try {
      setLoading(true);
      setMessage(null);
      const now = new Date();
      let bookingId = hold?.id ?? null;
      let holdExpiresAt = hold?.expiresAt ?? null;
      if (!hold || !holdExpiresAt || new Date(holdExpiresAt) <= now) {
        const holdRes = await fetch("/api/bookings/hold", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ carId, startDate, endDate }),
        });
        if (!holdRes.ok) {
          const error = await holdRes.json().catch(() => ({}));
          throw new Error(error.message ?? "Unable to reserve dates");
        }
        const payload = (await holdRes.json()) as { bookingId?: string; hold_expires_at?: string };
        if (!payload.bookingId || !payload.hold_expires_at) {
          throw new Error("Unable to reserve dates");
        }
        bookingId = payload.bookingId;
        holdExpiresAt = payload.hold_expires_at;
        setHold({ id: bookingId, expiresAt: holdExpiresAt });
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
              bookingId,
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
          setHold(null);
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
            {instantBook
              ? "Pay now with Paystack. Instant Book confirms the trip right away."
              : "Pay now with Paystack; host approval required before pickup."}
          </div>
        </div>
        {instantBook ? (
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Instant Book
          </div>
        ) : (
          <div className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            Refunded if host rejects
          </div>
        )}
      </div>
      <div className="space-y-2 rounded-xl border border-border bg-gray-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Host verification</p>
        <VerificationBadges
          idVerified={hostVerification?.idVerified}
          phoneVerified={hostVerification?.phoneVerified}
          emailVerified={hostVerification?.emailVerified}
        />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border bg-gray-50 px-3 py-2 text-xs">
        <span className="font-semibold text-gray-700">Cancellation</span>
        {cancellationPolicy ? (
          <Badge variant="secondary" className="capitalize">
            {cancellationPolicy}
          </Badge>
        ) : (
          <Link href="/cancellation" className="font-semibold text-brand">
            Policy coming soon
          </Link>
        )}
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
      {holdRemaining ? (
        <p className="text-xs text-emerald-700">Reserved for {holdRemaining}. Complete payment to confirm.</p>
      ) : null}
      {message ? <p className="text-xs text-amber-700">{message}</p> : null}
      <div className="space-y-2 rounded-xl border border-border bg-white p-3 text-sm">
        <PriceRow label={`Daily rate x ${billableNights} day(s)`} value={formatCurrency(baseTotal)} />
        <PriceRow
          label="Platform fee"
          value={platformFeeAmount > 0 ? formatCurrency(platformFeeAmount) : "Coming soon (not charged)"}
          muted={platformFeeAmount === 0}
        />
        <PriceRow
          label="Insurance fee"
          value={
            typeof insuranceFee === "number"
              ? `${formatCurrency(insuranceFee)} (not charged)`
              : "Coming soon"
          }
          muted={typeof insuranceFee !== "number"}
        />
        <PriceRow
          label="Delivery fee"
          value={
            typeof deliveryFee === "number"
              ? `${formatCurrency(deliveryFee)} (not charged)`
              : "Coming soon"
          }
          muted={typeof deliveryFee !== "number"}
        />
        <PriceRow
          label="Deposit"
          value={typeof depositAmount === "number" ? formatCurrency(depositAmount) : "Shown at checkout"}
          muted={typeof depositAmount !== "number"}
        />
        <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold text-foreground">
          <span>Total charged now</span>
          <span className="text-base">{formatCurrency(total)}</span>
        </div>
        <p className="text-xs text-gray-500">Fees marked as coming soon are not included in the total above.</p>
      </div>
      <Link href="/protection" className="block text-xs font-semibold text-brand">
        View protection details
      </Link>
      <Button className="w-full shadow-soft" onClick={submit} disabled={loading || !startDate || !endDate}>
        {loading ? "Processing..." : instantBook ? "Instant Book" : "Book Now"}
      </Button>
    </div>
  );
}

function PriceRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-gray-700">{label}</span>
      <span className={muted ? "text-xs font-medium text-gray-500" : "font-semibold text-foreground"}>
        {value}
      </span>
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
