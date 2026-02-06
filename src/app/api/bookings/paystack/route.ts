import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { buildBookingPaidEmail, buildHostBookingNoticeEmail, sendEmailSafe } from "@/lib/email";

type Body = {
  carId?: string;
  startDate?: string;
  endDate?: string;
  reference?: string;
  amount?: number;
  bookingId?: string;
};

const BLOCKING_STATUSES = ["pending", "awaiting_host", "confirmed"];

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Ensure profile exists for renter_id FK
    await supa.from("profiles").upsert(
      {
        id: user.id,
        full_name: (user.user_metadata as any)?.full_name ?? user.email ?? null,
        first_name: (user.user_metadata as any)?.first_name ?? null,
        last_name: (user.user_metadata as any)?.last_name ?? null,
        city: (user.user_metadata as any)?.city ?? null,
        avatar_url: (user.user_metadata as any)?.avatar_url ?? null,
      },
      { onConflict: "id" },
    );

    const body = (await req.json()) as Body;
    const { reference, amount, bookingId } = body;
    let { carId, startDate, endDate } = body;
    if (!reference || !amount) {
      return NextResponse.json({ message: "Missing booking or payment details" }, { status: 400 });
    }

    if (bookingId) {
      const { data: booking, error: bookingError } = await supa
        .from("bookings")
        .select("id,car_id,renter_id,start_date,end_date,status,hold_expires_at")
        .eq("id", bookingId)
        .single();
      if (bookingError || !booking) {
        return NextResponse.json({ message: "Booking hold not found" }, { status: 404 });
      }
      if (booking.renter_id !== user.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      if (booking.status !== "pending") {
        return NextResponse.json({ message: "Booking hold is no longer valid" }, { status: 400 });
      }
      if (booking.hold_expires_at && new Date(booking.hold_expires_at) <= new Date()) {
        await supa
          .from("bookings")
          .update({ status: "cancelled", payment_status: "failed", hold_expires_at: null })
          .eq("id", bookingId);
        return NextResponse.json({ message: "Booking hold expired" }, { status: 409 });
      }
      carId = booking.car_id;
      startDate = booking.start_date;
      endDate = booking.end_date;
    }

    if (!carId || !startDate || !endDate) {
      return NextResponse.json({ message: "Missing booking or payment details" }, { status: 400 });
    }

    const { data: carData, error: carError } = await supa
      .from("cars")
      .select("id,title,daily_price,owner_id,instant_book,is_available")
      .eq("id", carId)
      .single();
    const car = carData as any;
    if (carError || !car) throw carError ?? new Error("Car not found");
    if (car.is_available === false) {
      if (bookingId) {
        await supa
          .from("bookings")
          .update({ status: "cancelled", payment_status: "failed", hold_expires_at: null })
          .eq("id", bookingId);
      }
      return NextResponse.json({ message: "Car is unavailable" }, { status: 409 });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ message: "End date must be after start date" }, { status: 400 });
    }

    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
    const conflictClient = admin ?? supa;
    if (admin) {
      const nowIso = new Date().toISOString();
      await admin
        .from("bookings")
        .update({ status: "cancelled", payment_status: "failed", hold_expires_at: null })
        .eq("status", "pending")
        .lt("hold_expires_at", nowIso);
    }

    const conflictsQuery = conflictClient
      .from("bookings")
      .select("id,status,hold_expires_at")
      .eq("car_id", carId)
      .in("status", BLOCKING_STATUSES)
      .lt("start_date", endDate)
      .gt("end_date", startDate);
    const { data: conflicts } = bookingId ? await conflictsQuery.neq("id", bookingId) : await conflictsQuery;

    const activeConflicts = (conflicts ?? []).filter(
      (row: any) => row.status !== "pending" || !row.hold_expires_at || new Date(row.hold_expires_at) > new Date(),
    );
    if (activeConflicts.length > 0) {
      if (bookingId) {
        await supa
          .from("bookings")
          .update({ status: "cancelled", payment_status: "failed", hold_expires_at: null })
          .eq("id", bookingId);
      }
      return NextResponse.json({ message: "Dates not available" }, { status: 409 });
    }

    const { data: blocked } = await conflictClient
      .from("car_availability")
      .select("id")
      .eq("car_id", carId)
      .eq("available", false)
      .lt("start_date", endDate)
      .gt("end_date", startDate);
    if (blocked && blocked.length > 0) {
      if (bookingId) {
        await supa
          .from("bookings")
          .update({ status: "cancelled", payment_status: "failed", hold_expires_at: null })
          .eq("id", bookingId);
      }
      return NextResponse.json({ message: "Dates not available" }, { status: 409 });
    }

    const nights = Math.max(
      differenceInCalendarDays(new Date(endDate), new Date(startDate)),
      1,
    );
    const total = Number(car.daily_price ?? 0) * nights;
    const expectedAmount = Math.round(total * 100);

    const tx = await verifyPaystackTransaction(reference);
    if (tx.amount !== expectedAmount) {
      if (bookingId) {
        await supa
          .from("bookings")
          .update({ status: "cancelled", payment_status: "failed", hold_expires_at: null })
          .eq("id", bookingId);
      }
      return NextResponse.json(
        { message: "Payment amount mismatch. Please contact support." },
        { status: 400 },
      );
    }
    if (tx.status !== "success") {
      if (bookingId) {
        await supa
          .from("bookings")
          .update({ status: "cancelled", payment_status: "failed", hold_expires_at: null })
          .eq("id", bookingId);
      }
      return NextResponse.json({ message: "Payment not successful" }, { status: 400 });
    }

    const finalStatus = car.instant_book ? "confirmed" : "awaiting_host";
    const approvedAt = car.instant_book ? new Date().toISOString() : null;
    const maybeAdmin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();

    const sendBookingEmails = async (booking: any) => {
      if (!maybeAdmin) return;
      const renterId = booking.renter_id;
      const hostId = car.owner_id;
      const [renterAuth, hostAuth, renterProfile, hostProfile] = await Promise.all([
        maybeAdmin.auth.admin.getUserById(renterId),
        maybeAdmin.auth.admin.getUserById(hostId),
        maybeAdmin.from("profiles").select("full_name").eq("id", renterId).maybeSingle(),
        maybeAdmin.from("profiles").select("full_name").eq("id", hostId).maybeSingle(),
      ]);

      const renterEmail = renterAuth?.user?.email ?? null;
      const hostEmail = hostAuth?.user?.email ?? null;
      const renterName = (renterProfile as any)?.full_name ?? "Guest";
      const hostName = (hostProfile as any)?.full_name ?? "Host";

      if (renterEmail) {
        const email = buildBookingPaidEmail({
          instantBook: car.instant_book,
          carTitle: car.title ?? null,
          startDate,
          endDate,
          totalPrice: total,
        });
        await sendEmailSafe({
          to: renterEmail,
          ...email,
          idempotencyKey: `booking:${booking.id}:renter-paid`,
        });
      }

      if (hostEmail) {
        const email = buildHostBookingNoticeEmail({
          instantBook: car.instant_book,
          renterName,
          carTitle: car.title ?? null,
          startDate,
          endDate,
        });
        await sendEmailSafe({
          to: hostEmail,
          ...email,
          idempotencyKey: `booking:${booking.id}:host-notice`,
        });
      }
    };

    if (bookingId) {
      const { data, error } = await supa
        .from("bookings")
        .update({
          status: finalStatus,
          total_price: total,
          payment_status: "paid",
          payment_reference: reference,
          payment_provider: "paystack",
          paid_at: new Date().toISOString(),
          approved_at: approvedAt,
          hold_expires_at: null,
        })
        .eq("id", bookingId)
        .select()
        .single();
      if (error) throw error;
      await sendBookingEmails(data);
      return NextResponse.json({ data });
    }

    // Avoid duplicate inserts on refresh (legacy flow)
    const { data: existing } = await supa
      .from("bookings")
      .select("id,status")
      .eq("payment_reference", reference)
      .maybeSingle();
    if (existing?.id) {
      return NextResponse.json({ data: existing });
    }

    const { data, error } = await supa
      .from("bookings")
      .insert({
        car_id: carId,
        renter_id: user.id,
        start_date: startDate,
        end_date: endDate,
        status: finalStatus,
        total_price: total,
        payment_status: "paid",
        payment_reference: reference,
        payment_provider: "paystack",
        paid_at: new Date().toISOString(),
        approved_at: approvedAt,
      })
      .select()
      .single();

    if (error) throw error;
    await sendBookingEmails(data);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to create booking" }, { status: 400 });
  }
}
