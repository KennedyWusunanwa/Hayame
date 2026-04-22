"use client";

import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPinned,
  Phone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildMapsSearchUrl,
  buildTelephoneUrl,
  formatDeliveryTimeLabel,
} from "@/lib/booking-delivery";
import {
  type DisplayStatus,
  getBookingHelperText,
  getDisplayStatus,
  getStatusClasses,
  getStatusLabel,
  shouldShowCompletedPaidBadge,
} from "@/lib/booking-status";
import { formatCurrency, getInitials } from "@/lib/utils";

type BookingPerson = {
  id?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
};

type BookingRow = {
  id: string;
  car_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  status: string;
  delivery_address?: string | null;
  delivery_time?: string | null;
  contact_phone?: string | null;
  delivery_notes?: string | null;
  trip_use_region?: string | null;
  trip_use_city?: string | null;
  trip_use_address?: string | null;
  trip_outside_accra?: boolean | null;
  trip_outside_listing_region?: boolean | null;
  outside_accra_surcharge?: number | null;
  nights?: number | null;
  daily_rate?: number | null;
  subtotal?: number | null;
  platform_fee?: number | null;
  insurance_fee?: number | null;
  delivery_fee?: number | null;
  deposit_amount?: number | null;
  payment_status?: string | null;
  payment_reference?: string | null;
  rejection_reason?: string | null;
  total_price: number;
  role?: string;
  conversation_id?: string | null;
  created_at?: string | null;
  cars?: {
    id?: string | null;
    owner_id?: string | null;
    title?: string;
    city?: string;
    region?: string;
    cancellation_policy?: "flexible" | "moderate" | "strict" | string | null;
    car_photos?: Array<{ url?: string | null }> | null;
    owner?: BookingPerson | null;
  };
  renter?: BookingPerson | null;
};

export function BookingsTable({ mode = "host" }: { mode?: "host" | "renter" }) {
  const router = useRouter();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message ?? "Failed to load bookings");
      }
      const payload = (await res.json()) as { data?: BookingRow[] };
      setRows(payload.data ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAction = async (
    bookingId: string,
    action: "approve" | "reject",
  ) => {
    try {
      setUpdatingId(bookingId);
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message ?? "Unable to update booking");
      }
      const payload = (await res.json()) as { data: BookingRow };
      setRows((prev) =>
        prev.map((row) =>
          row.id === bookingId ? { ...row, ...payload.data } : row,
        ),
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bookings:updated"));
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message ?? "Unable to update booking");
    } finally {
      setUpdatingId(null);
    }
  };

  const openDispute = async (bookingId: string) => {
    const reason = window.prompt(
      "Describe the dispute (minimum 5 characters):",
    );
    if (!reason || reason.trim().length < 5) return;
    try {
      setDisputingId(bookingId);
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason: reason.trim() }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message ?? "Unable to open dispute");
      }
      alert("Dispute opened. Admin will review it.");
    } catch (err: any) {
      alert(err.message ?? "Unable to open dispute");
    } finally {
      setDisputingId(null);
    }
  };

  const startConversation = async (
    booking: BookingRow,
    isOwnerView: boolean,
  ) => {
    try {
      setMessagingId(booking.id);
      let conversationId = booking.conversation_id ?? null;
      if (!conversationId) {
        const hostId =
          booking.cars?.owner?.id ?? booking.cars?.owner_id ?? null;
        if (!hostId) throw new Error("Host details not available for chat.");
        const participantId = isOwnerView
          ? (booking.renter?.id ?? booking.renter_id)
          : undefined;

        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostId,
            participantId,
            carId: booking.car_id,
          }),
        });
        const payload = (await res.json().catch(() => ({}))) as {
          id?: string;
          message?: string;
        };
        if (!res.ok || !payload.id) {
          throw new Error(payload.message ?? "Unable to open chat.");
        }
        conversationId = payload.id;
        setRows((prev) =>
          prev.map((row) =>
            row.id === booking.id
              ? { ...row, conversation_id: conversationId }
              : row,
          ),
        );
      }
      router.push(`/messages?conversation=${conversationId}`);
    } catch (err: any) {
      alert(err.message ?? "Unable to open chat.");
    } finally {
      setMessagingId(null);
    }
  };

  const rowsSorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) => bookingSortTimestamp(b) - bookingSortTimestamp(a),
      ),
    [rows],
  );
  const renterRows = useMemo(
    () => rowsSorted.filter((row) => row.role?.includes("renter")),
    [rowsSorted],
  );
  const ownerRows = useMemo(
    () => rowsSorted.filter((row) => row.role?.includes("owner")),
    [rowsSorted],
  );

  if (mode === "renter") {
    return (
      <div className="space-y-6">
        <BookingsSection
          title="Your trips"
          description="See what is happening now and the next action for each trip."
          rows={renterRows}
          isOwnerView={false}
          loading={loading}
          error={error}
          updatingId={updatingId}
          disputingId={disputingId}
          messagingId={messagingId}
          onAction={handleAction}
          onDispute={openDispute}
          onMessage={startConversation}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BookingsSection
        title="Guest bookings"
        description="Review incoming requests, confirm live trips, and work from delivery details."
        rows={ownerRows}
        isOwnerView={true}
        loading={loading}
        error={error}
        updatingId={updatingId}
        disputingId={disputingId}
        messagingId={messagingId}
        onAction={handleAction}
        onDispute={openDispute}
        onMessage={startConversation}
      />

      <BookingsSection
        title="Your trips"
        description="Trips you booked yourself."
        rows={renterRows}
        isOwnerView={false}
        loading={loading}
        error={null}
        updatingId={updatingId}
        disputingId={disputingId}
        messagingId={messagingId}
        onAction={handleAction}
        onDispute={openDispute}
        onMessage={startConversation}
      />
    </div>
  );
}

function BookingsSection({
  title,
  description,
  rows,
  isOwnerView,
  loading,
  error,
  updatingId,
  disputingId,
  messagingId,
  onAction,
  onDispute,
  onMessage,
}: {
  title: string;
  description?: string;
  rows: BookingRow[];
  isOwnerView: boolean;
  loading: boolean;
  error: string | null;
  updatingId: string | null;
  disputingId: string | null;
  messagingId: string | null;
  onAction: (id: string, action: "approve" | "reject") => void;
  onDispute: (id: string) => void;
  onMessage: (booking: BookingRow, isOwnerView: boolean) => void;
}) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? (
          <p className="text-sm text-gray-600">{description}</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardHeader>
      <CardContent>
        {loading && rows.length === 0 ? (
          <p className="text-center text-sm text-gray-600">
            Loading bookings...
          </p>
        ) : rows.length === 0 ? (
          <p className="text-center text-sm text-gray-600">
            {isOwnerView ? "No bookings on your cars yet." : "No trips booked yet."}
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map((booking) =>
              isOwnerView ? (
                <HostBookingCard
                  key={booking.id}
                  booking={booking}
                  updatingId={updatingId}
                  messagingId={messagingId}
                  onAction={onAction}
                  onMessage={onMessage}
                />
              ) : (
                <RenterBookingCard
                  key={booking.id}
                  booking={booking}
                  disputingId={disputingId}
                  messagingId={messagingId}
                  onDispute={onDispute}
                  onMessage={onMessage}
                />
              ),
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RenterBookingCard({
  booking,
  disputingId,
  messagingId,
  onDispute,
  onMessage,
}: {
  booking: BookingRow;
  disputingId: string | null;
  messagingId: string | null;
  onDispute: (id: string) => void;
  onMessage: (booking: BookingRow, isOwnerView: boolean) => void;
}) {
  const displayStatus = getDisplayStatus(booking);
  const showPaidBadge = shouldShowCompletedPaidBadge(booking, displayStatus);
  const image = booking.cars?.car_photos?.[0]?.url ?? null;
  const location = [booking.cars?.city, booking.cars?.region]
    .filter(Boolean)
    .join(", ");
  const hostName = booking.cars?.owner?.full_name ?? "Host";
  const showDeliveryCard = displayStatus === "confirmed";

  return (
    <article className="rounded-3xl border border-border bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <ListingThumb image={image} title={booking.cars?.title ?? "Listing"} />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {booking.cars?.title ?? booking.car_id}
              </h3>
              <p className="text-sm text-gray-600">
                {getBookingHelperText(
                  displayStatus,
                  "guest",
                  booking.payment_status,
                )}
              </p>
              <p className="flex items-center gap-2 text-sm text-gray-700">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                <span>
                  {formatDateLabel(booking.start_date)} to{" "}
                  {formatDateLabel(booking.end_date)}
                </span>
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="flex flex-wrap gap-2">
                <StatusPill status={displayStatus} />
                {showPaidBadge ? <PaymentPill /> : null}
              </div>

              <div className="text-left md:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Total
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(Number(booking.total_price ?? 0))}
                </p>
                {location ? <p className="text-sm text-gray-600">{location}</p> : null}
              </div>
            </div>
          </div>

          {showDeliveryCard ? (
            <DeliveryDetailsCard
              address={booking.delivery_address}
              time={booking.delivery_time}
              phone={booking.contact_phone}
              notes={booking.delivery_notes}
              phoneLabel="Contact"
            />
          ) : null}

          <div className="flex flex-wrap gap-2">
            {displayStatus === "confirmed" ? (
              <Button
                size="sm"
                className="rounded-xl"
                onClick={() => onMessage(booking, false)}
                disabled={messagingId === booking.id}
              >
                {messagingId === booking.id ? "Opening..." : "Contact host"}
              </Button>
            ) : null}

            {displayStatus === "ongoing" ? (
              <>
                <Button
                  size="sm"
                  className="rounded-xl"
                  onClick={() => onMessage(booking, false)}
                  disabled={messagingId === booking.id}
                >
                  {messagingId === booking.id ? "Opening..." : "Message host"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => onDispute(booking.id)}
                  disabled={disputingId === booking.id}
                >
                  {disputingId === booking.id ? "Opening..." : "Open dispute"}
                </Button>
              </>
            ) : null}

            {displayStatus === "completed" ? (
              <Button size="sm" asChild className="rounded-xl">
                <Link href={`/cars/${booking.car_id}#reviews`}>
                  Leave review
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span>Host: {hostName}</span>
            {booking.rejection_reason && displayStatus === "rejected" ? (
              <span>Reason: {booking.rejection_reason}</span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function HostBookingCard({
  booking,
  updatingId,
  messagingId,
  onAction,
  onMessage,
}: {
  booking: BookingRow;
  updatingId: string | null;
  messagingId: string | null;
  onAction: (id: string, action: "approve" | "reject") => void;
  onMessage: (booking: BookingRow, isOwnerView: boolean) => void;
}) {
  const displayStatus = getDisplayStatus(booking);
  const showPaidBadge = shouldShowCompletedPaidBadge(booking, displayStatus);
  const canAct =
    booking.status === "awaiting_host" && booking.payment_status === "paid";
  const image = booking.cars?.car_photos?.[0]?.url ?? null;
  const renterName = booking.renter?.full_name ?? "Guest";
  const deliveryPhone = booking.contact_phone ?? booking.renter?.phone ?? null;
  const tripUseLocation = formatTripUseLocation(booking);
  const mapsUrl =
    buildMapsSearchUrl(booking.delivery_address) ??
    (tripUseLocation !== "Not provided"
      ? buildMapsSearchUrl(tripUseLocation)
      : null);
  const phoneUrl = buildTelephoneUrl(deliveryPhone);

  return (
    <article className="rounded-3xl border border-border bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <ListingThumb image={image} title={booking.cars?.title ?? "Listing"} />

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {booking.cars?.title ?? booking.car_id}
              </h3>
              <p className="text-sm text-gray-600">
                {getBookingHelperText(
                  displayStatus,
                  "host",
                  booking.payment_status,
                )}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                <span>{formatDateLabel(booking.start_date)} to {formatDateLabel(booking.end_date)}</span>
                <span>Renter: {renterName}</span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="flex flex-wrap gap-2">
                <StatusPill status={displayStatus} />
                {showPaidBadge ? <PaymentPill /> : null}
              </div>

              <div className="text-left lg:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Booking total
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(Number(booking.total_price ?? 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-border bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  Delivery Details
                </h4>
                <div className="flex flex-wrap gap-2">
                  {phoneUrl ? (
                    <Button size="sm" variant="outline" asChild className="rounded-xl">
                      <a href={phoneUrl}>
                        Call renter
                      </a>
                    </Button>
                  ) : null}
                  {mapsUrl ? (
                    <Button size="sm" variant="outline" asChild className="rounded-xl">
                      <a href={mapsUrl} target="_blank" rel="noreferrer">
                        Open in Maps
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailTile
                  label="Address"
                  value={booking.delivery_address ?? "Not provided"}
                />
                <DetailTile
                  label="Time"
                  value={formatDeliveryTimeLabel(booking.delivery_time)}
                />
                <DetailTile
                  label="Phone"
                  value={deliveryPhone ?? "Not provided"}
                  href={phoneUrl}
                />
                <DetailTile
                  label="Notes"
                  value={booking.delivery_notes ?? "No delivery notes"}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-4">
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Trip plan
              </h4>
              <div className="space-y-3">
                <InfoRow
                  icon={<MapPinned className="h-4 w-4" />}
                  label="Use location"
                  value={tripUseLocation}
                />
                <InfoRow
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Booked"
                  value={formatDateLabel(booking.created_at)}
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Renter phone"
                  value={booking.renter?.phone ?? "Not provided"}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => onMessage(booking, true)}
              disabled={messagingId === booking.id}
            >
              {messagingId === booking.id ? "Opening..." : "Message renter"}
            </Button>

            {canAct ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => onAction(booking.id, "reject")}
                  disabled={updatingId === booking.id}
                >
                  Reject & refund
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl"
                  onClick={() => onAction(booking.id, "approve")}
                  disabled={updatingId === booking.id}
                >
                  Approve booking
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function ListingThumb({
  image,
  title,
}: {
  image: string | null;
  title: string;
}) {
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-gray-100">
      {image ? (
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="64px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
          {getInitials(title || "Car")}
        </div>
      )}
    </div>
  );
}

function DeliveryDetailsCard({
  address,
  time,
  phone,
  notes,
  phoneLabel,
}: {
  address?: string | null;
  time?: string | null;
  phone?: string | null;
  notes?: string | null;
  phoneLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-gray-50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-foreground">
        Delivery details
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailTile label="Address" value={address ?? "Not provided"} />
        <DetailTile label="Time" value={formatDeliveryTimeLabel(time)} />
        <DetailTile label={phoneLabel} value={phone ?? "Not provided"} />
        {notes ? <DetailTile label="Notes" value={notes} /> : null}
      </div>
    </div>
  );
}

function DetailTile({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>
      {href ? (
        <a href={href} className="mt-1 inline-block text-sm font-semibold text-brand">
          {value}
        </a>
      ) : (
        <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
      )}
    </div>
  );
}

function InfoRow({
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          {label}
        </p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: DisplayStatus }) {
  return (
    <span className={getStatusClasses(status)}>
      {getStatusLabel(status)}
    </span>
  );
}

function PaymentPill() {
  return (
    <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
      Paid
    </span>
  );
}

function bookingSortTimestamp(booking: BookingRow) {
  const primary = Date.parse(booking.created_at ?? "");
  if (!Number.isNaN(primary)) return primary;
  const fallback = Date.parse(booking.start_date ?? "");
  if (!Number.isNaN(fallback)) return fallback;
  return 0;
}

function formatDateLabel(value?: string | null) {
  if (!value) return "N/A";
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

function formatTripUseLocation(
  booking: Pick<
    BookingRow,
    "trip_use_address" | "trip_use_city" | "trip_use_region"
  >,
) {
  return (
    [booking.trip_use_address, booking.trip_use_city, booking.trip_use_region]
      .filter(Boolean)
      .join(", ") || "Not provided"
  );
}
