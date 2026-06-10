"use client";

import Image from "next/image";
import Link from "next/link";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TripStatusTracker } from "@/components/trip-status-tracker";
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
  trip_use_region?: string | null;
  trip_use_city?: string | null;
  trip_use_address?: string | null;
  delivery_address?: string | null;
  delivery_time?: string | null;
  contact_phone?: string | null;
  delivery_notes?: string | null;
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
    load();
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
      if (!isOwnerView && conversationId) {
        await sendTripSummaryIfMissing(
          conversationId,
          buildTripMessageSummary(booking),
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
        <Card>
          <CardHeader>
            <CardTitle>Your bookings</CardTitle>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </CardHeader>
          <CardContent>
            <BookingsList
              rows={renterRows}
              isOwnerView={false}
              loading={loading}
              updatingId={updatingId}
              disputingId={disputingId}
              messagingId={messagingId}
              onAction={handleAction}
              onDispute={openDispute}
              onMessage={startConversation}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bookings on your cars</CardTitle>
          <p className="text-sm text-gray-600">
            Approve or reject requests quickly, then message guests if needed.
          </p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardHeader>
        <CardContent>
          <BookingsList
            rows={ownerRows}
            isOwnerView={true}
            loading={loading}
            updatingId={updatingId}
            disputingId={disputingId}
            messagingId={messagingId}
            onAction={handleAction}
            onDispute={openDispute}
            onMessage={startConversation}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingsList
            rows={renterRows}
            isOwnerView={false}
            loading={loading}
            updatingId={updatingId}
            disputingId={disputingId}
            messagingId={messagingId}
            onAction={handleAction}
            onDispute={openDispute}
            onMessage={startConversation}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function BookingsList({
  rows,
  isOwnerView,
  loading,
  updatingId,
  disputingId,
  messagingId,
  onAction,
  onDispute,
  onMessage,
}: {
  rows: BookingRow[];
  isOwnerView: boolean;
  loading: boolean;
  updatingId: string | null;
  disputingId: string | null;
  messagingId: string | null;
  onAction: (id: string, action: "approve" | "reject") => void;
  onDispute: (id: string) => void;
  onMessage: (booking: BookingRow, isOwnerView: boolean) => void;
}) {
  if (rows.length === 0 && !loading) {
    return (
      <p className="text-center text-sm text-gray-600">
        {isOwnerView ? "No bookings on your cars yet." : "No trips booked yet."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 md:hidden">
        {rows.map((booking) => {
          const awaiting = booking.status === "awaiting_host";
          const canAct =
            isOwnerView && awaiting && booking.payment_status === "paid";
          const personName = isOwnerView
            ? (booking.renter?.full_name ?? "Guest")
            : (booking.cars?.owner?.full_name ?? "Host");
          const personLabel = isOwnerView ? "Booked by" : "Host";
          const location = [booking.cars?.city, booking.cars?.region]
            .filter(Boolean)
            .join(", ");
          const image =
            booking.cars?.car_photos?.[0]?.url ??
            booking.cars?.owner?.avatar_url ??
            null;
          const durationNights = getDurationNights(booking);
          const tripMode =
            hasDeliveryLocation(booking) || Number(booking.delivery_fee ?? 0) > 0
              ? "Delivery"
              : "Pickup";
          const tripUseLocation = formatTripUseLocation(booking);
          const deliveryLocation = formatDeliveryLocation(booking);

          return (
            <details
              key={booking.id}
              className="overflow-hidden rounded-xl border border-border bg-white"
            >
              <summary className="list-none cursor-pointer p-3">
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-gray-100">
                    {image ? (
                      <Image
                        src={image}
                        alt={booking.cars?.title ?? "Listing"}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
                        {getInitials(booking.cars?.title ?? "Car")}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {booking.cars?.title ?? booking.car_id}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-600">
                      {location || "Location not set"}
                    </p>
                    <p className="mt-1 text-xs text-gray-700">
                      {personLabel}:{" "}
                      <span className="font-semibold">{personName}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(booking.status)}>
                        {statusLabel(booking.status)}
                      </Badge>
                      <Badge variant={paymentVariant(booking.payment_status)}>
                        {paymentLabel(booking.payment_status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-gray-700">
                      {formatDateLabel(booking.start_date)} to{" "}
                      {formatDateLabel(booking.end_date)} | {durationNights}{" "}
                      night(s)
                    </p>
                    <p className="text-xs text-gray-600">
                      Use: {tripUseLocation}
                      {booking.trip_outside_listing_region
                        ? " (Outside listing region)"
                        : booking.trip_outside_accra
                          ? " (Outside Accra)"
                          : ""}
                    </p>
                    <p className="text-xs text-gray-600">
                      Booked: {formatDateLabel(booking.created_at)}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(booking.total_price)}
                    </p>
                  </div>
                </div>
              </summary>

              <div className="border-t border-border px-3 pb-3 pt-2">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={() => onMessage(booking, isOwnerView)}
                    disabled={messagingId === booking.id}
                  >
                    {messagingId === booking.id ? "Opening..." : "Message"}
                  </Button>
                  {!isOwnerView && booking.payment_status === "paid" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      disabled={disputingId === booking.id}
                      onClick={() => onDispute(booking.id)}
                    >
                      {disputingId === booking.id
                        ? "Opening..."
                        : "Open dispute"}
                    </Button>
                  ) : null}
                </div>

                {canAct ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 px-3 text-xs"
                      onClick={() => onAction(booking.id, "reject")}
                      disabled={updatingId === booking.id}
                    >
                      Reject & refund
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => onAction(booking.id, "approve")}
                      disabled={updatingId === booking.id}
                    >
                      Approve
                    </Button>
                  </div>
                ) : null}

                <TripStatusTracker
                  status={booking.status}
                  startDate={booking.start_date}
                  endDate={booking.end_date}
                />

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <Detail label="Trip mode" value={tripMode} />
                  <Detail
                    label="Duration"
                    value={`${durationNights} night(s)`}
                  />
                  <Detail
                    label="Start"
                    value={formatDateLabel(booking.start_date)}
                  />
                  <Detail
                    label="End"
                    value={formatDateLabel(booking.end_date)}
                  />
                  <Detail label="Use location" value={tripUseLocation} />
                  {tripMode === "Delivery" ? (
                    <Detail
                      label="Delivery location"
                      value={deliveryLocation}
                    />
                  ) : null}
                  <Detail
                    label="Daily rate"
                    value={formatCurrency(Number(booking.daily_rate ?? 0))}
                  />
                  <Detail
                    label="Subtotal"
                    value={formatCurrency(Number(booking.subtotal ?? 0))}
                  />
                  <Detail
                    label="Platform fee"
                    value={formatCurrency(Number(booking.platform_fee ?? 0))}
                  />
                  <Detail
                    label="Insurance fee"
                    value={formatCurrency(Number(booking.insurance_fee ?? 0))}
                  />
                  <Detail
                    label="Delivery fee"
                    value={formatCurrency(Number(booking.delivery_fee ?? 0))}
                  />
                  <Detail
                    label="Outside listing region fee"
                    value={formatCurrency(
                      Number(booking.outside_accra_surcharge ?? 0),
                    )}
                  />
                  <Detail
                    label="Deposit"
                    value={formatCurrency(Number(booking.deposit_amount ?? 0))}
                  />
                  <Detail
                    label="Total"
                    value={formatCurrency(Number(booking.total_price ?? 0))}
                  />
                  <Detail
                    label="Payment ref"
                    value={booking.payment_reference ?? "N/A"}
                  />
                </div>

                {booking.rejection_reason ? (
                  <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
                    Rejection reason: {booking.rejection_reason}
                  </p>
                ) : null}

                <div className="mt-3 text-[11px] text-gray-600">
                  {booking.cars?.cancellation_policy ? (
                    <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold capitalize text-gray-700">
                      {booking.cars.cancellation_policy} cancellation
                    </span>
                  ) : (
                    <Link
                      href="/cancellation"
                      className="font-semibold text-brand"
                    >
                      View cancellation policy
                    </Link>
                  )}
                </div>
              </div>
            </details>
          );
        })}
      </div>

      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="w-[23%]">Listing</TableHead>
                <TableHead className="w-[12%]">
                  {isOwnerView ? "Booked by" : "Host"}
                </TableHead>
                <TableHead className="w-[13%]">Dates</TableHead>
                <TableHead className="w-[17%]">Status</TableHead>
                <TableHead className="w-[10%]">Payment</TableHead>
                <TableHead className="w-[12%] min-w-[116px] text-right">
                  Total
                </TableHead>
                <TableHead className="w-[13%] min-w-[124px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((booking) => {
                const awaiting = booking.status === "awaiting_host";
                const canAct =
                  isOwnerView && awaiting && booking.payment_status === "paid";
                const personName = isOwnerView
                  ? (booking.renter?.full_name ?? "Guest")
                  : (booking.cars?.owner?.full_name ?? "Host");
                const image =
                  booking.cars?.car_photos?.[0]?.url ??
                  booking.cars?.owner?.avatar_url ??
                  null;
                const location = [booking.cars?.city, booking.cars?.region]
                  .filter(Boolean)
                  .join(", ");
                const durationNights = getDurationNights(booking);
                const tripUseLocation = formatTripUseLocation(booking);
                const tripMode =
                  hasDeliveryLocation(booking) ||
                  Number(booking.delivery_fee ?? 0) > 0
                    ? "Delivery"
                    : "Pickup";
                const deliveryLocation = formatDeliveryLocation(booking);

                return (
                  <TableRow key={booking.id}>
                    <TableCell className="align-top">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-gray-100">
                          {image ? (
                            <Image
                              src={image}
                              alt={booking.cars?.title ?? "Listing"}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
                              {getInitials(booking.cars?.title ?? "Car")}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="break-words text-base font-semibold leading-tight">
                            {booking.cars?.title ?? booking.car_id}
                          </div>
                          <div className="mt-1 break-words text-sm text-gray-600">
                            {location || "Location not set"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="break-words text-base font-semibold leading-tight">
                        {personName}
                      </div>
                      <div className="mt-1 break-words text-sm text-gray-600">
                        {booking.renter?.phone ??
                          booking.cars?.owner?.phone ??
                          "No phone"}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-base leading-tight">
                        {formatDateLabel(booking.start_date)} -{" "}
                        {formatDateLabel(booking.end_date)}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {durationNights} night(s)
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        Use: {tripUseLocation}
                        {booking.trip_outside_listing_region
                          ? " (Outside listing region)"
                          : booking.trip_outside_accra
                            ? " (Outside Accra)"
                            : ""}
                      </div>
                      {tripMode === "Delivery" ? (
                        <div className="mt-1 text-xs text-gray-600">
                          Delivery: {deliveryLocation}
                        </div>
                      ) : null}
                      <div className="mt-1 text-sm text-gray-600">
                        Booked: {formatDateLabel(booking.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="max-w-[230px] space-y-2 overflow-hidden">
                        <Badge variant={statusVariant(booking.status)}>
                          {statusLabel(booking.status)}
                        </Badge>
                        <p className="text-xs text-gray-600">
                          {statusSummaryLabel(booking.status)}
                        </p>
                        {booking.cars?.cancellation_policy ? (
                          <div className="text-xs text-gray-600">
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 font-semibold capitalize text-gray-700">
                              {booking.cars.cancellation_policy} cancellation
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant={paymentVariant(booking.payment_status)}>
                        {paymentLabel(booking.payment_status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top pr-2 text-right text-base font-semibold tabular-nums whitespace-nowrap">
                      {formatCurrency(booking.total_price)}
                    </TableCell>
                    <TableCell className="relative z-10 align-top">
                      <div className="ml-auto flex w-full max-w-[136px] flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-full justify-center rounded-lg border-2 px-2 text-xs font-semibold"
                          onClick={() => onMessage(booking, isOwnerView)}
                          disabled={messagingId === booking.id}
                        >
                          {messagingId === booking.id
                            ? "Opening..."
                            : "Message"}
                        </Button>
                        {canAct ? (
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-9 w-full rounded-lg px-1 text-xs font-semibold"
                              onClick={() => onAction(booking.id, "reject")}
                              disabled={updatingId === booking.id}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="h-9 w-full rounded-lg px-1 text-xs font-semibold"
                              onClick={() => onAction(booking.id, "approve")}
                              disabled={updatingId === booking.id}
                            >
                              Approve
                            </Button>
                          </div>
                        ) : null}
                        {!isOwnerView && booking.payment_status === "paid" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-full rounded-lg px-2 text-xs font-semibold"
                            disabled={disputingId === booking.id}
                            onClick={() => onDispute(booking.id)}
                          >
                            {disputingId === booking.id
                              ? "Opening..."
                              : "Open dispute"}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-gray-50 px-2 py-1">
      <p className="text-[10px] uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="truncate font-semibold text-foreground">{value}</p>
    </div>
  );
}

function getDurationNights(booking: BookingRow) {
  if (typeof booking.nights === "number" && booking.nights > 0)
    return booking.nights;
  try {
    return Math.max(
      differenceInCalendarDays(
        parseISO(booking.end_date),
        parseISO(booking.start_date),
      ),
      1,
    );
  } catch {
    return 1;
  }
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

function statusLabel(status?: string) {
  switch (status) {
    case "pending":
      return "Pending hold";
    case "awaiting_host":
      return "Awaiting host";
    case "confirmed":
      return "Confirmed";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    case "refunded":
      return "Refunded";
    default:
      return "Pending";
  }
}

function statusVariant(
  status?: string,
): "default" | "secondary" | "outline" | "muted" {
  switch (status) {
    case "pending":
      return "muted";
    case "awaiting_host":
      return "secondary";
    case "confirmed":
      return "default";
    case "completed":
      return "default";
    case "rejected":
    case "cancelled":
      return "outline";
    case "refunded":
      return "outline";
    default:
      return "muted";
  }
}

function paymentLabel(status?: string | null) {
  switch (status) {
    case "paid":
      return "Paid";
    case "refunded":
      return "Refunded";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
}

function paymentVariant(
  status?: string | null,
): "default" | "secondary" | "outline" | "muted" {
  switch (status) {
    case "paid":
      return "default";
    case "refunded":
      return "outline";
    case "failed":
      return "outline";
    default:
      return "muted";
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
      .join(", ") || "N/A"
  );
}

function hasDeliveryLocation(
  booking: Pick<BookingRow, "delivery_address">,
) {
  return Boolean(booking.delivery_address?.trim());
}

function formatDeliveryLocation(
  booking: Pick<
    BookingRow,
    | "delivery_address"
    | "trip_use_address"
    | "trip_use_city"
    | "trip_use_region"
  >,
) {
  return booking.delivery_address?.trim() || formatTripUseLocation(booking);
}

function buildTripMessageSummary(booking: BookingRow) {
  const tripUseLocation = formatTripUseLocation(booking);
  const deliveryLocation = formatDeliveryLocation(booking);
  const isDelivery =
    hasDeliveryLocation(booking) || Number(booking.delivery_fee ?? 0) > 0;
  const mode = isDelivery ? "Delivery" : "Pickup";
  const duration = getDurationNights(booking);
  const lines = [
    "Trip details",
    `Car: ${booking.cars?.title ?? booking.car_id}`,
    `Guest: ${booking.renter?.full_name ?? "Guest"}`,
    `Dates: ${formatDateLabel(booking.start_date)} - ${formatDateLabel(
      booking.end_date,
    )}`,
    `Duration: ${duration} day${duration === 1 ? "" : "s"}`,
    `Time: ${booking.delivery_time?.trim() || "Not set"}`,
    `${mode} location: ${isDelivery ? deliveryLocation : tripUseLocation}`,
    `Trip use area: ${tripUseLocation}`,
    `Price: ${formatCurrency(Number(booking.total_price ?? 0))}`,
    `Daily rate: ${formatCurrency(Number(booking.daily_rate ?? 0))}`,
    `Subtotal: ${formatCurrency(Number(booking.subtotal ?? 0))}`,
    `Insurance: ${formatCurrency(Number(booking.insurance_fee ?? 0))}`,
    `Delivery fee: ${formatCurrency(Number(booking.delivery_fee ?? 0))}`,
    `Outside region fee: ${formatCurrency(
      Number(booking.outside_accra_surcharge ?? 0),
    )}`,
    `Deposit: ${formatCurrency(Number(booking.deposit_amount ?? 0))}`,
    `Payment ref: ${booking.payment_reference?.trim() || "N/A"}`,
    `Booking ID: ${booking.id}`,
  ];
  if (booking.contact_phone?.trim()) {
    lines.push(`Contact phone: ${booking.contact_phone.trim()}`);
  }
  if (booking.delivery_notes?.trim()) {
    lines.push(`Notes: ${booking.delivery_notes.trim()}`);
  }
  return lines.join("\n");
}

async function sendTripSummaryIfMissing(conversationId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return;

  const params = new URLSearchParams({
    conversationId,
    markRead: "false",
    limit: "500",
  });
  const messagesRes = await fetch(`/api/messages?${params.toString()}`);
  if (messagesRes.ok) {
    const payload = (await messagesRes.json().catch(() => ({}))) as {
      data?: Array<{ body?: string | null }>;
    };
    const alreadySent = (payload.data ?? []).some(
      (message) => message.body?.trim() === trimmed,
    );
    if (alreadySent) return;
  }

  const sendRes = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, body: trimmed }),
  });
  if (!sendRes.ok) {
    const payload = (await sendRes.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(payload.message ?? "Unable to send trip details.");
  }
}

function statusSummaryLabel(status?: string) {
  switch (status) {
    case "awaiting_host":
      return "Host response required";
    case "confirmed":
      return "Confirmed and ready for trip";
    case "completed":
      return "Trip completed";
    case "rejected":
      return "Rejected by host";
    case "cancelled":
      return "Booking cancelled";
    case "refunded":
      return "Payment refunded";
    case "pending":
      return "Pending payment hold";
    default:
      return "Status update pending";
  }
}
