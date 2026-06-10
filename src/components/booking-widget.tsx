"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DateRangePicker } from "@/components/date-range-picker";
import { VerificationBadges } from "@/components/verification-badges";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLocations } from "@/lib/use-locations";
import {
  calculateNights,
  formatCurrency,
  isLocationOutsideAccra,
  isOutsideListingRegion,
} from "@/lib/utils";

type Props = {
  carId: string;
  dailyPrice: number;
  platformFeePercent?: number;
  instantBook?: boolean | null;
  deliveryAvailable?: boolean | null;
  deliveryFee?: number | null;
  insuranceFee?: number | null;
  depositAmount?: number | null;
  outsideAccraFee?: number | null;
  listingCity?: string | null;
  listingRegion?: string | null;
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
  platformFeePercent = 10,
  instantBook,
  deliveryAvailable,
  deliveryFee,
  insuranceFee,
  depositAmount,
  outsideAccraFee,
  listingCity,
  listingRegion,
  cancellationPolicy,
  hostVerification,
}: Props) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [hold, setHold] = useState<{ id: string; expiresAt: string } | null>(
    null,
  );
  const [holdRemaining, setHoldRemaining] = useState<string | null>(null);
  const [tripUseRegion, setTripUseRegion] = useState<string>(
    listingRegion ?? "",
  );
  const [tripUseCity, setTripUseCity] = useState<string>(listingCity ?? "");
  const [tripUseAddress, setTripUseAddress] = useState<string>("");
  const [tripMode, setTripMode] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const router = useRouter();
  const { regions, citiesByRegion } = useLocations();
  const publicKey = useMemo(
    () => process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    [],
  );

  const nights = calculateNights(startDate, endDate);
  const billableNights = Math.max(nights, 1);
  const baseTotal = billableNights * dailyPrice;
  const platformFeeAmount = baseTotal * (Math.max(platformFeePercent, 0) / 100);
  const insuranceFeeAmount = Math.max(Number(insuranceFee ?? 0), 0);
  const canDeliver = Boolean(deliveryAvailable);
  const selectedDelivery = canDeliver && tripMode === "delivery";
  const deliveryFeeAmount = selectedDelivery
    ? Math.max(Number(deliveryFee ?? 0), 0)
    : 0;
  const depositAmountValue = Math.max(Number(depositAmount ?? 0), 0);
  const outsideAccraFeeValue = Math.max(Number(outsideAccraFee ?? 0), 0);
  const tripOutsideAccra = isLocationOutsideAccra({
    region: tripUseRegion,
    city: tripUseCity,
  });
  const tripOutsideListingRegion = isOutsideListingRegion({
    tripRegion: tripUseRegion,
    listingRegion,
  });
  const outsideAccraSurchargeAmount = tripOutsideListingRegion
    ? outsideAccraFeeValue
    : 0;
  const total =
    baseTotal +
    platformFeeAmount +
    insuranceFeeAmount +
    deliveryFeeAmount +
    outsideAccraSurchargeAmount +
    depositAmountValue;

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
  }, [
    carId,
    startDate,
    endDate,
    tripMode,
    tripUseRegion,
    tripUseCity,
    tripUseAddress,
    deliveryAddress,
  ]);

  useEffect(() => {
    setTripUseRegion(listingRegion ?? "");
    setTripUseCity(listingCity ?? "");
    setTripUseAddress("");
    setTripMode("pickup");
    setDeliveryAddress("");
  }, [carId, listingCity, listingRegion]);

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
    if (!tripUseRegion || !tripUseCity || tripUseAddress.trim().length < 3) {
      setMessage(
        "Please enter the exact trip-use location (region, city and area).",
      );
      return;
    }
    if (selectedDelivery && deliveryAddress.trim().length < 3) {
      setMessage("Please enter the exact delivery point.");
      return;
    }
    try {
      setLoading(true);
      setMessage(null);
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("You need to sign in before you can book.");
        router.push("/auth/login");
        return;
      }
      if (!publicKey) {
        alert("Paystack is not configured yet.");
        return;
      }

      const now = new Date();
      let bookingId = hold?.id ?? null;
      let holdExpiresAt = hold?.expiresAt ?? null;
      if (!hold || !holdExpiresAt || new Date(holdExpiresAt) <= now) {
        const holdRes = await fetch("/api/bookings/hold", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            carId,
            startDate,
            endDate,
            tripUseRegion,
            tripUseCity,
            tripUseAddress: tripUseAddress.trim(),
            tripMode,
            deliveryAddress: selectedDelivery
              ? deliveryAddress.trim()
              : undefined,
            tripOutsideAccra,
          }),
        });
        if (!holdRes.ok) {
          const error = await holdRes.json().catch(() => ({}));
          throw new Error(error.message ?? "Unable to reserve dates");
        }
        const payload = (await holdRes.json()) as {
          bookingId?: string;
          hold_expires_at?: string;
        };
        if (!payload.bookingId || !payload.hold_expires_at) {
          throw new Error("Unable to reserve dates");
        }
        bookingId = payload.bookingId;
        holdExpiresAt = payload.hold_expires_at;
        setHold({ id: bookingId, expiresAt: holdExpiresAt });
      }

      await loadPaystackScript();

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
              tripUseRegion,
              tripUseCity,
              tripUseAddress: tripUseAddress.trim(),
              tripMode,
              deliveryAddress: selectedDelivery
                ? deliveryAddress.trim()
                : undefined,
              tripOutsideAccra,
              reference: tran?.reference ?? reference,
              amount: amountInMinorUnit,
            }),
          });
          const payload = (await res.json().catch(() => ({}))) as {
            data?: { id?: string };
            conversationId?: string | null;
            message?: string;
          };
          if (!res.ok) {
            throw new Error(
              payload.message ?? "Payment verified but booking failed",
            );
          }
          setHold(null);
          if (payload.conversationId) {
            router.push(`/messages?conversation=${payload.conversationId}`);
          } else {
            router.push("/messages");
          }
        } catch (err: any) {
          alert(
            err.message ??
              "Booking failed after payment. Please contact support.",
          );
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
            {formatCurrency(dailyPrice)}{" "}
            <span className="text-base text-gray-500">/ day</span>
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
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Host verification
        </p>
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
            View policy details
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
      <div className="space-y-3 rounded-xl border border-border bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Trip use location
          </p>
          {listingRegion ? (
            <span className="text-[11px] font-medium text-gray-600">
              Listing region: {listingRegion}
            </span>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">
              Region
            </label>
            <Select
              value={tripUseRegion}
              onChange={(e) => {
                setMessage(null);
                setTripUseRegion(e.target.value);
                setTripUseCity("");
              }}
            >
              <option value="">Select region</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">
              City / district
            </label>
            <Select
              value={tripUseCity}
              onChange={(e) => {
                setMessage(null);
                setTripUseCity(e.target.value);
              }}
              disabled={!tripUseRegion}
            >
              <option value="">Select city / district</option>
              {(citiesByRegion[tripUseRegion] ?? []).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">
            Exact area / destination
          </label>
          <Input
            value={tripUseAddress}
            onChange={(e) => {
              setMessage(null);
              setTripUseAddress(e.target.value);
            }}
            placeholder="e.g. East Legon, Airport Residential, Adum, Cape Coast central"
          />
        </div>
        <div className="space-y-1 text-xs">
          <p
            className={
              tripOutsideListingRegion ? "text-amber-700" : "text-emerald-700"
            }
          >
            {tripOutsideListingRegion
              ? `Outside listing region trip${outsideAccraFeeValue > 0 ? ` (+${formatCurrency(outsideAccraFeeValue)})` : ""}`
              : "Within listing region (no outside-region surcharge)"}
          </p>
          {tripOutsideListingRegion && listingRegion ? (
            <p className="text-gray-600">
              Trip use region differs from the listing region ({listingRegion}).
            </p>
          ) : null}
          {tripOutsideAccra ? (
            <p className="text-gray-600">
              Trip use location is also outside Accra.
            </p>
          ) : null}
        </div>
      </div>
      {canDeliver ? (
        <div className="space-y-3 rounded-xl border border-border bg-gray-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Pickup or delivery
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className={`rounded-lg border px-3 py-2 text-left text-sm ${
                tripMode === "pickup"
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-white text-gray-700"
              }`}
              onClick={() => {
                setMessage(null);
                setTripMode("pickup");
              }}
            >
              <span className="block font-semibold">Pickup</span>
              <span className="block text-xs text-gray-600">
                Meet at the listing area
              </span>
            </button>
            <button
              type="button"
              className={`rounded-lg border px-3 py-2 text-left text-sm ${
                tripMode === "delivery"
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-white text-gray-700"
              }`}
              onClick={() => {
                setMessage(null);
                setTripMode("delivery");
              }}
            >
              <span className="block font-semibold">Delivery</span>
              <span className="block text-xs text-gray-600">
                {Math.max(Number(deliveryFee ?? 0), 0) > 0
                  ? `${formatCurrency(Math.max(Number(deliveryFee ?? 0), 0))} fee`
                  : "Free delivery"}
              </span>
            </button>
          </div>
          {selectedDelivery ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                Exact delivery point
              </label>
              <Input
                value={deliveryAddress}
                onChange={(e) => {
                  setMessage(null);
                  setDeliveryAddress(e.target.value);
                }}
                placeholder="e.g. A&C Mall, East Legon"
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {holdRemaining ? (
        <p className="text-xs text-emerald-700">
          Reserved for {holdRemaining}. Complete payment to confirm.
        </p>
      ) : null}
      {message ? <p className="text-xs text-amber-700">{message}</p> : null}
      <div className="space-y-2 rounded-xl border border-border bg-white p-3 text-sm">
        <PriceRow
          label={`Daily rate x ${billableNights} day(s)`}
          value={formatCurrency(baseTotal)}
        />
        <PriceRow
          label={`Platform fee (${platformFeePercent}%)`}
          value={formatCurrency(platformFeeAmount)}
        />
        <PriceRow
          label="Insurance fee"
          value={formatCurrency(insuranceFeeAmount)}
        />
        <PriceRow
          label="Delivery fee"
          value={formatCurrency(deliveryFeeAmount)}
        />
        {outsideAccraFeeValue > 0 || tripOutsideListingRegion ? (
          <PriceRow
            label={
              tripOutsideListingRegion
                ? "Outside listing region surcharge"
                : "Outside listing region surcharge (not applied)"
            }
            value={formatCurrency(outsideAccraSurchargeAmount)}
            muted={!tripOutsideListingRegion}
          />
        ) : null}
        <PriceRow label="Deposit" value={formatCurrency(depositAmountValue)} />
        <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold text-foreground">
          <span>Total charged now</span>
          <span className="text-base">{formatCurrency(total)}</span>
        </div>
      </div>
      <Link
        href="/protection"
        className="block text-xs font-semibold text-brand"
      >
        View protection details
      </Link>
      <Button
        className="w-full shadow-soft"
        onClick={submit}
        disabled={loading || !startDate || !endDate}
      >
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
      <span
        className={
          muted
            ? "text-xs font-medium text-gray-500"
            : "font-semibold text-foreground"
        }
      >
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
