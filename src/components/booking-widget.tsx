"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Phone,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/date-range-picker";
import { VerificationBadges } from "@/components/verification-badges";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  normalizeBookingDelivery,
  validateBookingDelivery,
} from "@/lib/booking-delivery";
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

const steps = [
  {
    id: "trip-details",
    label: "Trip Details",
    description: "Choose your dates and lock in the trip length.",
  },
  {
    id: "delivery-details",
    label: "Location + Delivery",
    description: "Tell the host where the car will be used and where to meet.",
  },
  {
    id: "review-pricing",
    label: "Review & Pricing",
    description: "Confirm the trip summary and final charges before payment.",
  },
  {
    id: "payment",
    label: "Payment",
    description: "Complete payment securely with Paystack.",
  },
] as const;

export function BookingWidget({
  carId,
  dailyPrice,
  platformFeePercent = 10,
  instantBook,
  deliveryFee,
  insuranceFee,
  depositAmount,
  outsideAccraFee,
  listingCity,
  listingRegion,
  cancellationPolicy,
  hostVerification,
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
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
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [deliveryTime, setDeliveryTime] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");
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
  const deliveryFeeAmount = Math.max(Number(deliveryFee ?? 0), 0);
  const depositAmountValue = Math.max(Number(depositAmount ?? 0), 0);
  const outsideAccraFeeValue = Math.max(Number(outsideAccraFee ?? 0), 0);
  const deliveryRequired = deliveryFeeAmount > 0;
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
  const deliveryDetails = normalizeBookingDelivery({
    deliveryAddress,
    deliveryTime,
    contactPhone,
    deliveryNotes,
  });

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
    tripUseRegion,
    tripUseCity,
    tripUseAddress,
    deliveryAddress,
    deliveryTime,
    contactPhone,
    deliveryNotes,
  ]);

  useEffect(() => {
    setCurrentStep(0);
    setTripUseRegion(listingRegion ?? "");
    setTripUseCity(listingCity ?? "");
    setTripUseAddress("");
    setDeliveryAddress("");
    setDeliveryTime("");
    setContactPhone("");
    setDeliveryNotes("");
    setMessage(null);
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
        setMessage("Reservation expired. Review your trip and continue again.");
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

  const handleNext = async () => {
    setMessage(null);

    if (currentStep === 0) {
      const error = validateTripStep();
      if (error) {
        setMessage(error);
        return;
      }
      setCurrentStep(1);
      return;
    }

    if (currentStep === 1) {
      const error = validateLocationStep();
      if (error) {
        setMessage(error);
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      const error = validateAllSteps();
      if (error) {
        setMessage(error);
        return;
      }
      try {
        setLoading(true);
        await ensureHold();
        setCurrentStep(3);
      } catch (error) {
        setMessage((error as Error).message ?? "Unable to reserve dates.");
      } finally {
        setLoading(false);
      }
      return;
    }

    await submit();
  };

  const handleBack = () => {
    setMessage(null);
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const submit = async () => {
    const validationError = validateAllSteps();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setLoading(true);
      const user = await requireUser();
      if (!user) {
        setLoading(false);
        return;
      }
      if (!publicKey) {
        setMessage("Payments are not configured yet.");
        setLoading(false);
        return;
      }

      const reserved = await ensureHold();
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
              bookingId: reserved.id,
              carId,
              startDate,
              endDate,
              tripUseRegion,
              tripUseCity,
              tripUseAddress: tripUseAddress.trim(),
              tripOutsideAccra,
              deliveryAddress: deliveryDetails.deliveryAddress,
              deliveryTime: deliveryDetails.deliveryTime,
              contactPhone: deliveryDetails.contactPhone,
              deliveryNotes: deliveryDetails.deliveryNotes,
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
        } catch (error: any) {
          alert(
            error.message ??
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
      setMessage((error as Error).message ?? "Please sign in and try again.");
      setLoading(false);
    }
  };

  const footerLabel =
    currentStep === steps.length - 1 ? "Make payment" : "Next";
  const step = steps[currentStep];

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-card">
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-3xl font-semibold text-brand">
              {formatCurrency(dailyPrice)}{" "}
              <span className="text-base text-gray-500">/ day</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {instantBook
                ? "Instant Book confirms right after payment."
                : "Pay now to request the trip. Refunds apply if the host declines."}
            </p>
          </div>
          <Badge
            className={
              instantBook
                ? "bg-emerald-50 text-emerald-700"
                : "bg-brand/10 text-brand"
            }
            variant="secondary"
          >
            {instantBook ? "Instant Book" : "Host approval required"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {steps.map((item, index) => {
            const state =
              index === currentStep
                ? "current"
                : index < currentStep
                  ? "complete"
                  : "upcoming";
            return (
              <div
                key={item.id}
                className={
                  state === "current"
                    ? "rounded-2xl border border-brand bg-brand/5 px-3 py-3"
                    : state === "complete"
                      ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3"
                      : "rounded-2xl border border-border bg-gray-50 px-3 py-3"
                }
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {holdRemaining ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Reservation held for {holdRemaining}. Complete payment before it
            expires.
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </div>
        ) : null}

        <div
          key={step.id}
          className="min-h-[420px] animate-[pageSectionFade_280ms_ease] space-y-5"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Step {currentStep + 1}
            </p>
            <h3 className="text-2xl font-semibold text-foreground">
              {step.label}
            </h3>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>

          {currentStep === 0 ? (
            <section className="space-y-4">
              <div className="rounded-3xl border border-border bg-gray-50 p-4">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  disabledDates={blockedDates}
                  onChange={({ startDate: start, endDate: end }) => {
                    setMessage(null);
                    setStartDate(start);
                    setEndDate(end);
                  }}
                  onInvalidRange={(nextMessage) => setMessage(nextMessage)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <CompactInfoCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  title="Trip length"
                  value={
                    nights > 0
                      ? `${billableNights} night${billableNights > 1 ? "s" : ""}`
                      : "Pick dates to continue"
                  }
                  tone="neutral"
                />
                <CompactInfoCard
                  icon={<WalletCards className="h-4 w-4" />}
                  title="Starting total"
                  value={formatCurrency(baseTotal)}
                  tone="neutral"
                />
              </div>
            </section>
          ) : null}

          {currentStep === 1 ? (
            <section className="space-y-4">
              <div className="rounded-3xl border border-border bg-gray-50 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-foreground">
                      Trip use location
                    </h4>
                    <p className="text-sm text-gray-600">
                      This helps price the trip correctly and tells the host
                      where the car will be used.
                    </p>
                  </div>
                  {listingRegion ? (
                    <Badge variant="outline" className="border-border text-xs">
                      Listing region: {listingRegion}
                    </Badge>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Region">
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
                  </Field>

                  <Field label="City / district">
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
                  </Field>
                </div>

                <Field label="Exact use location">
                  <Input
                    value={tripUseAddress}
                    onChange={(e) => {
                      setMessage(null);
                      setTripUseAddress(e.target.value);
                    }}
                    placeholder="e.g. East Legon, Airport Residential, Adum"
                  />
                </Field>

                <div className="space-y-1 text-xs">
                  <p
                    className={
                      tripOutsideListingRegion
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }
                  >
                    {tripOutsideListingRegion
                      ? `Outside listing region${outsideAccraFeeValue > 0 ? ` (+${formatCurrency(outsideAccraFeeValue)})` : ""}`
                      : "Within listing region"}
                  </p>
                  {tripOutsideAccra ? (
                    <p className="text-gray-600">
                      This trip is also outside Accra.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-white p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-foreground">
                      Delivery details
                    </h4>
                    <p className="text-sm text-gray-600">
                      {deliveryRequired
                        ? "Required because this booking includes delivery."
                        : "Optional, but useful if you want the host to coordinate arrival before pickup."}
                    </p>
                  </div>
                  {tripUseAddress ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-brand"
                      onClick={() => {
                        setMessage(null);
                        setDeliveryAddress(
                          [tripUseAddress, tripUseCity, tripUseRegion]
                            .filter(Boolean)
                            .join(", "),
                        );
                      }}
                    >
                      Use trip address
                    </button>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <Field label="Delivery address">
                    <Input
                      value={deliveryAddress}
                      onChange={(e) => {
                        setMessage(null);
                        setDeliveryAddress(e.target.value);
                      }}
                      placeholder="House number, street, landmark, neighbourhood"
                    />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Delivery time">
                      <Input
                        type="time"
                        value={deliveryTime}
                        onChange={(e) => {
                          setMessage(null);
                          setDeliveryTime(e.target.value);
                        }}
                      />
                    </Field>

                    <Field label="Contact phone number">
                      <Input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => {
                          setMessage(null);
                          setContactPhone(e.target.value);
                        }}
                        placeholder="+233 20 000 0000"
                      />
                    </Field>
                  </div>

                  <Field label="Notes for the host">
                    <Textarea
                      value={deliveryNotes}
                      onChange={(e) => {
                        setMessage(null);
                        setDeliveryNotes(e.target.value);
                      }}
                      className="min-h-[96px] rounded-xl"
                      placeholder="Gate code, landmark, preferred handoff instructions, or anything else helpful."
                    />
                  </Field>
                </div>
              </div>
            </section>
          ) : null}

          {currentStep === 2 ? (
            <section className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <SummaryCard title="Trip details">
                    <SummaryRow
                      icon={<CalendarDays className="h-4 w-4" />}
                      label="Dates"
                      value={
                        startDate && endDate
                          ? `${formatDate(startDate)} to ${formatDate(endDate)}`
                          : "Not selected"
                      }
                    />
                    <SummaryRow
                      icon={<MapPin className="h-4 w-4" />}
                      label="Use location"
                      value={
                        [tripUseAddress, tripUseCity, tripUseRegion]
                          .filter(Boolean)
                          .join(", ") || "Not provided"
                      }
                    />
                    <SummaryRow
                      icon={<ShieldCheck className="h-4 w-4" />}
                      label="Host verification"
                      value="ID, phone, and email verification shown below"
                    />
                  </SummaryCard>

                  <SummaryCard title="Delivery details">
                    <SummaryRow
                      icon={<MapPin className="h-4 w-4" />}
                      label="Address"
                      value={deliveryDetails.deliveryAddress || "Not provided"}
                    />
                    <SummaryRow
                      icon={<Clock3 className="h-4 w-4" />}
                      label="Time"
                      value={deliveryDetails.deliveryTime || "Not provided"}
                    />
                    <SummaryRow
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone"
                      value={deliveryDetails.contactPhone || "Not provided"}
                    />
                    {deliveryDetails.deliveryNotes ? (
                      <SummaryRow
                        icon={<MapPin className="h-4 w-4" />}
                        label="Notes"
                        value={deliveryDetails.deliveryNotes}
                      />
                    ) : null}
                  </SummaryCard>

                  <div className="rounded-3xl border border-border bg-gray-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        Host verification
                      </p>
                      {cancellationPolicy ? (
                        <Badge variant="secondary" className="capitalize">
                          {cancellationPolicy} cancellation
                        </Badge>
                      ) : null}
                    </div>
                    <VerificationBadges
                      idVerified={hostVerification?.idVerified}
                      phoneVerified={hostVerification?.phoneVerified}
                      emailVerified={hostVerification?.emailVerified}
                    />
                    {!cancellationPolicy ? (
                      <Link
                        href="/cancellation"
                        className="mt-3 inline-block text-sm font-semibold text-brand"
                      >
                        View cancellation policy
                      </Link>
                    ) : null}
                  </div>
                </div>

                <SummaryCard title="Price summary">
                  <div className="space-y-3">
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
                            : "Outside listing region surcharge"
                        }
                        value={formatCurrency(outsideAccraSurchargeAmount)}
                        muted={!tripOutsideListingRegion}
                      />
                    ) : null}
                    <PriceRow
                      label="Deposit"
                      value={formatCurrency(depositAmountValue)}
                    />
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center justify-between text-base font-semibold text-foreground">
                        <span>Total charged now</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                      <Link
                        href="/protection"
                        className="mt-2 inline-block text-sm font-semibold text-brand"
                      >
                        View protection details
                      </Link>
                    </div>
                  </div>
                </SummaryCard>
              </div>
            </section>
          ) : null}

          {currentStep === 3 ? (
            <section className="space-y-4">
              <div className="rounded-3xl border border-border bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-brand/10 p-3 text-brand">
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-foreground">
                      Secure payment
                    </h4>
                    <p className="text-sm text-gray-600">
                      Pay with Paystack to lock the booking and open your trip
                      conversation.
                    </p>
                    <p className="text-sm text-gray-600">
                      {instantBook
                        ? "This listing confirms instantly after payment."
                        : "The host will review the request after payment."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <CompactInfoCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  title="Trip"
                  value={
                    startDate && endDate
                      ? `${formatDate(startDate)} to ${formatDate(endDate)}`
                      : "Dates not selected"
                  }
                  tone="neutral"
                />
                <CompactInfoCard
                  icon={<WalletCards className="h-4 w-4" />}
                  title="Charge now"
                  value={formatCurrency(total)}
                  tone="highlight"
                />
              </div>

              <SummaryCard title="Before you pay">
                <SummaryRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Delivery address"
                  value={deliveryDetails.deliveryAddress || "Not provided"}
                />
                <SummaryRow
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Delivery time"
                  value={deliveryDetails.deliveryTime || "Not provided"}
                />
                <SummaryRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Contact phone"
                  value={deliveryDetails.contactPhone || "Not provided"}
                />
              </SummaryCard>
            </section>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-border bg-white/95 px-5 pb-5 pt-4 backdrop-blur sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              {currentStep === steps.length - 1
                ? "Ready to pay"
                : "Up next"}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {currentStep === 0
                ? "Choose your dates to continue."
                : currentStep === 1
                  ? deliveryRequired
                    ? "Delivery details are required for this booking."
                    : "Add delivery details if you want the host to coordinate arrival."
                  : `Total charged now: ${formatCurrency(total)}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Current total</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(total)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {currentStep > 0 ? (
            <Button
              variant="secondary"
              className="shrink-0"
              onClick={handleBack}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : null}
          <Button
            className="flex-1 shadow-soft"
            onClick={() => void handleNext()}
            disabled={loading}
          >
            {loading ? "Processing..." : footerLabel}
            {!loading ? <ArrowRight className="h-4 w-4" /> : null}
          </Button>
        </div>
      </div>
    </div>
  );

  function validateTripStep() {
    if (!startDate || !endDate) return "Select your trip dates to continue.";
    if (nights <= 0) return "End date must be after start date.";
    return null;
  }

  function validateLocationStep() {
    if (!tripUseRegion || !tripUseCity || tripUseAddress.trim().length < 3) {
      return "Enter the exact trip-use location (region, city, and area).";
    }
    return validateBookingDelivery(deliveryDetails, {
      required: deliveryRequired,
    });
  }

  function validateAllSteps() {
    return validateTripStep() ?? validateLocationStep();
  }

  async function requireUser() {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("You need to sign in before you can continue.");
      router.push("/auth/login");
      return null;
    }
    return user;
  }

  async function ensureHold() {
    const user = await requireUser();
    if (!user) {
      throw new Error("You need to sign in before you can continue.");
    }

    const now = new Date();
    if (hold?.id && hold.expiresAt && new Date(hold.expiresAt) > now) {
      return hold;
    }

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
        tripOutsideAccra,
        deliveryAddress: deliveryDetails.deliveryAddress,
        deliveryTime: deliveryDetails.deliveryTime,
        contactPhone: deliveryDetails.contactPhone,
        deliveryNotes: deliveryDetails.deliveryNotes,
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
    const nextHold = {
      id: payload.bookingId,
      expiresAt: payload.hold_expires_at,
    };
    setHold(nextHold);
    return nextHold;
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function SummaryCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-white p-4">
      <h4 className="mb-3 text-base font-semibold text-foreground">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-gray-100 p-2 text-gray-600">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
          {label}
        </p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

function CompactInfoCard({
  icon,
  title,
  value,
  tone,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  tone: "neutral" | "highlight";
}) {
  return (
    <div
      className={
        tone === "highlight"
          ? "rounded-3xl border border-brand/20 bg-brand/5 p-4"
          : "rounded-3xl border border-border bg-white p-4"
      }
    >
      <div className="flex items-center gap-2 text-gray-500">{icon}</div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
        {title}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
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

function formatDate(value: string) {
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return value;
  }
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
