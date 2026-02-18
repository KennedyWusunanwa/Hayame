import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { refundPaystack } from "@/lib/paystack";

const COOKIE_NAME = "admin_auth";

function adminToken() {
  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username || !password) return null;
  return Buffer.from(`${username}:${password}`).toString("base64");
}

async function requireAdmin() {
  const token = adminToken();
  if (!token) redirect("/admin?error=missing");
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  if (cookie !== token) redirect("/admin");
}

async function listingReviewAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const admin = createSupabaseAdminClient() as any;
  const carId = String(formData.get("carId") ?? "");
  const action = String(formData.get("action") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!carId || !["approve", "reject"].includes(action)) {
    redirect("/admin/platform");
  }

  await admin
    .from("cars")
    .update({
      approval_status: action === "approve" ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: process.env.ADMIN_USERNAME ?? "admin",
      rejection_reason: action === "reject" ? reason || "Rejected by admin" : null,
    })
    .eq("id", carId);

  await admin.from("admin_actions").insert({
    action: action === "approve" ? "listing_approved" : "listing_rejected",
    target_id: carId,
    target_type: "car",
    performed_by: process.env.ADMIN_USERNAME ?? "admin",
    metadata: action === "reject" ? { reason } : null,
  });

  redirect("/admin/platform");
}

async function refundAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const admin = createSupabaseAdminClient() as any;
  const bookingId = String(formData.get("bookingId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "Refunded by admin";
  if (!bookingId) redirect("/admin/platform");

  const { data: booking } = await admin
    .from("bookings")
    .select("id,payment_provider,payment_reference,payment_status")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking || booking.payment_status !== "paid") {
    redirect("/admin/platform");
  }

  if (booking.payment_provider === "paystack" && booking.payment_reference) {
    await refundPaystack(booking.payment_reference);
  }

  await admin
    .from("bookings")
    .update({
      status: "refunded",
      payment_status: "refunded",
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", bookingId);

  await admin.from("admin_actions").insert({
    action: "booking_refunded",
    target_id: bookingId,
    target_type: "booking",
    performed_by: process.env.ADMIN_USERNAME ?? "admin",
    metadata: { reason },
  });

  redirect("/admin/platform");
}

async function reviewModerationAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const admin = createSupabaseAdminClient() as any;
  const reviewId = String(formData.get("reviewId") ?? "");
  const action = String(formData.get("action") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reviewId || !["hide", "show"].includes(action)) {
    redirect("/admin/platform");
  }

  await admin
    .from("reviews")
    .update({
      is_hidden: action === "hide",
      moderated_at: new Date().toISOString(),
      moderated_by: process.env.ADMIN_USERNAME ?? "admin",
      moderation_reason: action === "hide" ? reason || "Hidden by admin" : null,
    })
    .eq("id", reviewId);

  await admin.from("admin_actions").insert({
    action: action === "hide" ? "review_hidden" : "review_restored",
    target_id: reviewId,
    target_type: "review",
    performed_by: process.env.ADMIN_USERNAME ?? "admin",
    metadata: action === "hide" ? { reason } : null,
  });

  redirect("/admin/platform");
}

async function disputeAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const admin = createSupabaseAdminClient() as any;
  const disputeId = String(formData.get("disputeId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!disputeId || !["open", "under_review", "resolved", "closed"].includes(status)) {
    redirect("/admin/platform");
  }

  await admin
    .from("disputes")
    .update({
      status,
      resolution_note: note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", disputeId);

  await admin.from("admin_actions").insert({
    action: "dispute_status_updated",
    target_id: disputeId,
    target_type: "dispute",
    performed_by: process.env.ADMIN_USERNAME ?? "admin",
    metadata: { status, note },
  });

  redirect("/admin/platform");
}

export default async function AdminPlatformPage() {
  await requireAdmin();
  const admin = createSupabaseAdminClient() as any;

  const [pendingListings, refundableBookings, reviews, disputes] = await Promise.all([
    admin
      .from("cars")
      .select(
        "id,title,city,daily_price,approval_status,rejection_reason,owner:profiles!cars_owner_id_fkey(full_name,phone)",
      )
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("bookings")
      .select("id,start_date,end_date,total_price,payment_status,payment_reference,payment_provider,cars(title)")
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("reviews")
      .select(
        "id,rating,comment,is_hidden,moderation_reason,created_at,cars(title),profiles:profiles!reviews_user_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("disputes")
      .select("id,booking_id,status,reason,resolution_note,created_at,cars(title)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Admin platform controls</p>
          <h1 className="text-2xl font-semibold text-foreground">Moderation & controls</h1>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-brand">
          Back to admin
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listing approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pendingListings.data ?? []).map((car: any) => (
                <TableRow key={car.id}>
                  <TableCell>
                    <p className="font-semibold">{car.title}</p>
                    <p className="text-xs text-gray-600">{car.city ?? "Ghana"}</p>
                  </TableCell>
                  <TableCell>{car.owner?.full_name ?? "Host"}</TableCell>
                  <TableCell>GHS {Number(car.daily_price ?? 0).toFixed(0)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <form action={listingReviewAction}>
                        <input type="hidden" name="carId" value={car.id} />
                        <input type="hidden" name="action" value="approve" />
                        <button className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                          Approve
                        </button>
                      </form>
                      <form action={listingReviewAction} className="flex items-center gap-2">
                        <input type="hidden" name="carId" value={car.id} />
                        <input type="hidden" name="action" value="reject" />
                        <input
                          name="reason"
                          placeholder="Reason"
                          className="hidden rounded-md border border-border px-2 py-1 text-xs sm:block"
                        />
                        <button className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                          Reject
                        </button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(pendingListings.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-gray-600">
                    No pending listings.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Refund control</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Refund</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(refundableBookings.data ?? []).map((booking: any) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <p className="font-mono text-xs">{booking.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-600">
                      {booking.start_date} - {booking.end_date}
                    </p>
                  </TableCell>
                  <TableCell>{booking.cars?.title ?? "Car"}</TableCell>
                  <TableCell>GHS {Number(booking.total_price ?? 0).toFixed(0)}</TableCell>
                  <TableCell className="text-right">
                    <form action={refundAction} className="flex items-center justify-end gap-2">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input
                        name="reason"
                        placeholder="Reason"
                        className="hidden rounded-md border border-border px-2 py-1 text-xs sm:block"
                      />
                      <button className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                        Refund
                      </button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {(refundableBookings.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-gray-600">
                    No paid bookings available for refund.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review moderation</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Review</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(reviews.data ?? []).map((review: any) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <p className="font-semibold">{review.profiles?.full_name ?? "Guest"} · {review.rating}/5</p>
                    <p className="text-xs text-gray-600">{review.comment ?? "No comment"}</p>
                  </TableCell>
                  <TableCell>{review.cars?.title ?? "Car"}</TableCell>
                  <TableCell>{review.is_hidden ? "Hidden" : "Visible"}</TableCell>
                  <TableCell className="text-right">
                    <form action={reviewModerationAction} className="flex items-center justify-end gap-2">
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input
                        type="hidden"
                        name="action"
                        value={review.is_hidden ? "show" : "hide"}
                      />
                      {!review.is_hidden ? (
                        <input
                          name="reason"
                          placeholder="Reason"
                          className="hidden rounded-md border border-border px-2 py-1 text-xs sm:block"
                        />
                      ) : null}
                      <button className="rounded-md border border-border px-3 py-1 text-xs font-semibold">
                        {review.is_hidden ? "Unhide" : "Hide"}
                      </button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {(reviews.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-gray-600">
                    No reviews yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(disputes.data ?? []).map((dispute: any) => (
                <TableRow key={dispute.id}>
                  <TableCell className="font-mono text-xs">{dispute.booking_id.slice(0, 8)}</TableCell>
                  <TableCell>{dispute.cars?.title ?? "Car"}</TableCell>
                  <TableCell className="text-xs">{dispute.reason}</TableCell>
                  <TableCell>{dispute.status}</TableCell>
                  <TableCell className="text-right">
                    <form action={disputeAction} className="flex items-center justify-end gap-2">
                      <input type="hidden" name="disputeId" value={dispute.id} />
                      <select
                        name="status"
                        defaultValue={dispute.status}
                        className="rounded-md border border-border px-2 py-1 text-xs"
                      >
                        <option value="open">open</option>
                        <option value="under_review">under_review</option>
                        <option value="resolved">resolved</option>
                        <option value="closed">closed</option>
                      </select>
                      <input
                        name="note"
                        defaultValue={dispute.resolution_note ?? ""}
                        placeholder="Resolution note"
                        className="hidden rounded-md border border-border px-2 py-1 text-xs sm:block"
                      />
                      <button className="rounded-md border border-border px-3 py-1 text-xs font-semibold">
                        Save
                      </button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {(disputes.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-gray-600">
                    No disputes opened yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
