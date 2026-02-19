import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackTransaction } from "@/lib/paystack";
import {
  buildBookingInvoiceEmail,
  buildBookingPaidEmail,
  buildHostBookingNoticeEmail,
  sendEmailSafe,
} from "@/lib/email";

type Body = {
  carId?: string;
  startDate?: string;
  endDate?: string;
  reference?: string;
  amount?: number;
  bookingId?: string;
};

const BLOCKING_STATUSES = ["pending", "awaiting_host", "confirmed"];
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.EMAIL_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

function extractAuthEmail(result: any): string | null {
  return result?.data?.user?.email ?? result?.user?.email ?? result?.email ?? null;
}

async function ensureBookingConversation(params: {
  primaryClient: any;
  fallbackClient?: any;
  hostId: string;
  userId: string;
  carId: string;
  bookingId: string;
}) {
  const upsertOn = async (client: any) => {
    const { data: existing } = await client
      .from("conversations")
      .select("id,booking_id")
      .eq("host_id", params.hostId)
      .eq("user_id", params.userId)
      .eq("car_id", params.carId)
      .maybeSingle();

    if (existing?.id) {
      if ((existing as any).booking_id !== params.bookingId) {
        await client.from("conversations").update({ booking_id: params.bookingId }).eq("id", existing.id);
      }
      return existing.id as string;
    }

    const { data, error } = await client
      .from("conversations")
      .insert({
        host_id: params.hostId,
        user_id: params.userId,
        car_id: params.carId,
        booking_id: params.bookingId,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data?.id as string;
  };

  try {
    return await upsertOn(params.primaryClient);
  } catch {
    if (params.fallbackClient) {
      try {
        return await upsertOn(params.fallbackClient);
      } catch {
        return null;
      }
    }
    return null;
  }
}

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
      .select(
        "id,title,daily_price,owner_id,instant_book,is_available,delivery_fee,insurance_fee,deposit_amount",
      )
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
    const subtotal = Number(car.daily_price ?? 0) * nights;

    const { data: settings } = await supa
      .from("platform_settings")
      .select("platform_fee_percent")
      .eq("id", 1)
      .maybeSingle();
    const envPlatformFee = Number(
      process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT ?? process.env.PLATFORM_FEE_PERCENT ?? "10",
    );
    const platformFeePercent = Number(
      settings?.platform_fee_percent ?? (Number.isFinite(envPlatformFee) ? envPlatformFee : 10),
    );
    const platformFee = subtotal * (Math.max(platformFeePercent, 0) / 100);
    const insuranceFee = Math.max(Number(car.insurance_fee ?? 0), 0);
    const deliveryFee = Math.max(Number(car.delivery_fee ?? 0), 0);
    const depositAmount = Math.max(Number(car.deposit_amount ?? 0), 0);
    const total = subtotal + platformFee + insuranceFee + deliveryFee + depositAmount;
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

    const sendBookingEmails = async (booking: any, conversationId: string | null) => {
      if (!maybeAdmin) return;
      try {
        const renterId = booking.renter_id;
        const hostId = car.owner_id;
        const [renterAuthResult, hostAuthResult, renterProfileResult, hostProfileResult] = await Promise.all([
          maybeAdmin.auth.admin.getUserById(renterId).catch(() => null),
          maybeAdmin.auth.admin.getUserById(hostId).catch(() => null),
          maybeAdmin.from("profiles").select("full_name,phone").eq("id", renterId).maybeSingle(),
          maybeAdmin.from("profiles").select("full_name,phone").eq("id", hostId).maybeSingle(),
        ]);

        const renterEmail = extractAuthEmail(renterAuthResult);
        const hostEmail = extractAuthEmail(hostAuthResult);
        const renterProfile = (renterProfileResult as any)?.data ?? null;
        const hostProfile = (hostProfileResult as any)?.data ?? null;
        const renterName = renterProfile?.full_name ?? "Guest";
        const hostName = hostProfile?.full_name ?? "Host";
        const renterPhone = renterProfile?.phone ?? null;
        const conversationUrl = conversationId ? `${SITE_URL}/messages?conversation=${conversationId}` : `${SITE_URL}/messages`;

        if (renterEmail) {
          const email = buildBookingPaidEmail({
            instantBook: car.instant_book,
            carTitle: car.title ?? null,
            startDate,
            endDate,
            totalPrice: total,
            bookingId: booking.id,
            paymentReference: reference,
            bookedAt: booking.paid_at ?? new Date().toISOString(),
            conversationUrl,
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
            renterPhone,
            carTitle: car.title ?? null,
            startDate,
            endDate,
            totalPrice: total,
            bookingId: booking.id,
            paymentReference: reference,
            bookedAt: booking.paid_at ?? new Date().toISOString(),
            conversationUrl,
          });
          await sendEmailSafe({
            to: hostEmail,
            ...email,
            idempotencyKey: `booking:${booking.id}:host-notice`,
          });
        }

        if (renterEmail) {
          const invoice = buildBookingInvoiceEmail({
            recipientRole: "renter",
            recipientName: renterName,
            counterpartName: hostName,
            carTitle: car.title ?? null,
            bookingId: booking.id,
            paymentReference: reference,
            bookedAt: booking.paid_at ?? new Date().toISOString(),
            startDate,
            endDate,
            nights,
            dailyRate: Number(car.daily_price ?? 0),
            subtotal,
            platformFee,
            insuranceFee,
            deliveryFee,
            depositAmount,
            totalPrice: total,
            status: finalStatus,
            conversationUrl,
          });
          await sendEmailSafe({
            to: renterEmail,
            ...invoice,
            idempotencyKey: `booking:${booking.id}:invoice:renter`,
          });
        }

        if (hostEmail) {
          const invoice = buildBookingInvoiceEmail({
            recipientRole: "host",
            recipientName: hostName,
            counterpartName: renterName,
            carTitle: car.title ?? null,
            bookingId: booking.id,
            paymentReference: reference,
            bookedAt: booking.paid_at ?? new Date().toISOString(),
            startDate,
            endDate,
            nights,
            dailyRate: Number(car.daily_price ?? 0),
            subtotal,
            platformFee,
            insuranceFee,
            deliveryFee,
            depositAmount,
            totalPrice: total,
            status: finalStatus,
            conversationUrl,
          });
          await sendEmailSafe({
            to: hostEmail,
            ...invoice,
            idempotencyKey: `booking:${booking.id}:invoice:host`,
          });
        }
      } catch (emailError) {
        console.error("[bookings/paystack] email notifications failed", emailError);
      }
    };

    if (bookingId) {
      const { data, error } = await supa
        .from("bookings")
        .update({
          status: finalStatus,
          total_price: total,
          subtotal,
          nights,
          daily_rate: Number(car.daily_price ?? 0),
          platform_fee: platformFee,
          insurance_fee: insuranceFee,
          delivery_fee: deliveryFee,
          deposit_amount: depositAmount,
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
      const conversationId = await ensureBookingConversation({
        primaryClient: supa,
        fallbackClient: maybeAdmin,
        hostId: car.owner_id,
        userId: data.renter_id,
        carId,
        bookingId: data.id,
      });
      await sendBookingEmails(data, conversationId);
      return NextResponse.json({ data, conversationId });
    }

    // Avoid duplicate inserts on refresh (legacy flow)
    const { data: existing } = await supa
      .from("bookings")
      .select("id,status")
      .eq("payment_reference", reference)
      .maybeSingle();
    if (existing?.id) {
      const conversationId = await ensureBookingConversation({
        primaryClient: supa,
        fallbackClient: maybeAdmin,
        hostId: car.owner_id,
        userId: user.id,
        carId,
        bookingId: existing.id,
      });
      return NextResponse.json({ data: existing, conversationId });
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
        subtotal,
        nights,
        daily_rate: Number(car.daily_price ?? 0),
        platform_fee: platformFee,
        insurance_fee: insuranceFee,
        delivery_fee: deliveryFee,
        deposit_amount: depositAmount,
        payment_status: "paid",
        payment_reference: reference,
        payment_provider: "paystack",
        paid_at: new Date().toISOString(),
        approved_at: approvedAt,
      })
      .select()
      .single();

    if (error) throw error;
    const conversationId = await ensureBookingConversation({
      primaryClient: supa,
      fallbackClient: maybeAdmin,
      hostId: car.owner_id,
      userId: data.renter_id,
      carId,
      bookingId: data.id,
    });
    await sendBookingEmails(data, conversationId);
    return NextResponse.json({ data, conversationId });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to create booking" }, { status: 400 });
  }
}
