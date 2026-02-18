"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TripStatusTracker } from "@/components/trip-status-tracker";
import { formatCurrency } from "@/lib/utils";

type BookingRow = {
  id: string;
  car_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_status?: string | null;
  payment_reference?: string | null;
  total_price: number;
  role?: string;
  cars?: { title?: string; city?: string; region?: string };
};

export function BookingsTable({ mode = "host" }: { mode?: "host" | "renter" }) {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const handleAction = async (bookingId: string, action: "approve" | "reject") => {
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
      setRows((prev) => prev.map((row) => (row.id === bookingId ? { ...row, ...payload.data } : row)));
    } catch (err: any) {
      alert(err.message ?? "Unable to update booking");
    } finally {
      setUpdatingId(null);
    }
  };

  const rowsSorted = useMemo(
    () => [...rows].sort((a, b) => (a.start_date < b.start_date ? 1 : -1)),
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
          <CardContent>{renderTable(renterRows, false, updatingId, handleAction, loading)}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your bookings</CardTitle>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardHeader>
        <CardContent>{renderTable(renterRows, false, updatingId, handleAction, loading)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bookings on your cars</CardTitle>
          <p className="text-sm text-gray-600">Approve or reject guest requests after payment.</p>
        </CardHeader>
        <CardContent>{renderTable(ownerRows, true, updatingId, handleAction, loading)}</CardContent>
      </Card>
    </div>
  );
}

function renderTable(
  rows: BookingRow[],
  isOwnerView: boolean,
  updatingId: string | null,
  handleAction: (id: string, action: "approve" | "reject") => void,
  loading: boolean,
) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Car</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead className="text-right">Total</TableHead>
          {isOwnerView ? <TableHead className="text-right">Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((booking) => {
          const awaiting = booking.status === "awaiting_host";
          const canAct = isOwnerView && awaiting && booking.payment_status === "paid";
          return (
            <TableRow key={booking.id}>
              <TableCell>
                <div className="font-semibold">{booking.cars?.title ?? booking.car_id}</div>
                <div className="text-xs text-gray-600">
                  {[booking.cars?.city, booking.cars?.region].filter(Boolean).join(", ")}
                </div>
              </TableCell>
              <TableCell>
                {booking.start_date} - {booking.end_date}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(booking.status)}>{statusLabel(booking.status)}</Badge>
                <TripStatusTracker
                  status={booking.status}
                  startDate={booking.start_date}
                  endDate={booking.end_date}
                />
                <div className="mt-1 text-[11px] text-gray-600">
                  <Link href="/cancellation" className="font-semibold text-brand">
                    Cancellation policy coming soon
                  </Link>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={paymentVariant(booking.payment_status)}>
                  {paymentLabel(booking.payment_status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(booking.total_price)}</TableCell>
              {isOwnerView ? (
                <TableCell className="text-right">
                  {canAct ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAction(booking.id, "reject")}
                        disabled={updatingId === booking.id}
                      >
                        Reject &amp; refund
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(booking.id, "approve")}
                        disabled={updatingId === booking.id}
                      >
                        Approve
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600">
                      {awaiting ? "Awaiting your decision" : "No action needed"}
                    </span>
                  )}
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
        {rows.length === 0 && !loading ? (
          <TableRow>
            <TableCell colSpan={isOwnerView ? 6 : 5} className="text-center text-sm text-gray-600">
              {isOwnerView ? "No bookings on your cars yet." : "No trips booked yet."}
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
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

function statusVariant(status?: string): "default" | "secondary" | "outline" | "muted" {
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

function paymentVariant(status?: string | null): "default" | "secondary" | "outline" | "muted" {
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
