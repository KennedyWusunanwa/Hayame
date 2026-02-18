import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EarningsCalculator } from "@/components/host/earnings-calculator";
import { VerificationBadges } from "@/components/verification-badges";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

const EARNING_STATUSES = new Set(["awaiting_host", "confirmed", "completed"]);

export default async function DashboardHome() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hostId = user?.id ?? "";
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, city, id_verified, phone_verified, email_verified, host_level")
    .eq("id", hostId)
    .maybeSingle();
  const hostName = (profile as any)?.full_name ?? "Host";
  const hostCity = (profile as any)?.city ?? "Ghana";
  const idVerified = Boolean((profile as any)?.id_verified);
  const phoneVerified = Boolean((profile as any)?.phone_verified);
  const emailVerified = Boolean((profile as any)?.email_verified);
  const explicitHostLevel = String((profile as any)?.host_level ?? "");

  const { data: cars } = await (supabase as any)
    .from("cars")
    .select("id,title")
    .eq("owner_id", hostId);
  const carIds = (cars ?? []).map((car: any) => car.id);

  const { data: bookings } =
    carIds.length > 0
      ? await (supabase as any)
          .from("bookings")
          .select("id,car_id,start_date,end_date,status,payment_status,total_price,created_at,cars(title)")
          .in("car_id", carIds)
          .order("start_date", { ascending: false })
      : { data: [] as any[] };

  const { data: reviews } =
    carIds.length > 0
      ? await (supabase as any)
          .from("reviews")
          .select("id,rating")
          .eq("is_hidden", false)
          .in("car_id", carIds)
      : { data: [] as any[] };

  const { data: views } =
    carIds.length > 0
      ? await (supabase as any)
          .from("listing_views")
          .select("id")
          .in("car_id", carIds)
      : { data: [] as any[] };

  const bookingRows = (bookings ?? []) as any[];
  const paidBookings = bookingRows.filter((booking) => EARNING_STATUSES.has(booking.status));
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalEarnings = paidBookings.reduce(
    (sum, booking) => sum + Number(booking.total_price ?? 0),
    0,
  );
  const monthlyEarnings = paidBookings.reduce((sum, booking) => {
    const start = booking.start_date ? new Date(booking.start_date) : null;
    if (!start || Number.isNaN(start.getTime())) return sum;
    if (start.getMonth() !== currentMonth || start.getFullYear() !== currentYear) return sum;
    return sum + Number(booking.total_price ?? 0);
  }, 0);

  const bookingRate = carIds.length > 0 ? Math.round((paidBookings.length / carIds.length) * 100) : 0;
  const totalReviews = (reviews ?? []).length;
  const averageRating =
    totalReviews > 0
      ? Number(
          (
            (reviews ?? []).reduce((sum: number, row: any) => sum + Number(row.rating ?? 0), 0) /
            totalReviews
          ).toFixed(1),
        )
      : 0;
  const totalViews = (views ?? []).length;
  const conversionRate = totalViews > 0 ? Number(((paidBookings.length / totalViews) * 100).toFixed(1)) : 0;

  const { data: platformSettings } = await (supabase as any)
    .from("platform_settings")
    .select("platform_fee_percent")
    .eq("id", 1)
    .maybeSingle();
  const envFee = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT ?? process.env.PLATFORM_FEE_PERCENT);
  const fallbackFee = Number.isFinite(envFee) ? envFee : 10;
  const platformFeePercent = Number(platformSettings?.platform_fee_percent ?? fallbackFee);
  const isPlaceholderFee = !platformSettings?.platform_fee_percent && !Number.isFinite(envFee);
  const hostLevel = computeHostLevel({
    explicitLevel: explicitHostLevel,
    idVerified,
    phoneVerified,
    emailVerified,
    trips: paidBookings.length,
    rating: averageRating,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Dashboard</p>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
          <p className="text-sm text-gray-600">Track bookings, performance, and projected payouts in one place.</p>
        </div>
        <Button asChild>
          <Link href="/host/cars/new">Start Earning Today</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-wrap items-center gap-2">
            Host profile
            <Badge variant="outline">{hostLevel}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-700">{hostName} - {hostCity}</p>
          <VerificationBadges idVerified={idVerified} phoneVerified={phoneVerified} emailVerified={emailVerified} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total earnings" value={formatCurrency(totalEarnings)} />
        <StatCard title="Monthly earnings" value={formatCurrency(monthlyEarnings)} />
        <StatCard title="Booking rate" value={`${bookingRate}%`} />
        <StatCard title="Reviews" value={`${totalReviews} (${averageRating || 0}/5)`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Host performance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PerformanceItem label="Total earnings" value={formatCurrency(totalEarnings)} />
          <PerformanceItem label="Monthly earnings" value={formatCurrency(monthlyEarnings)} />
          <PerformanceItem label="Booking rate" value={`${bookingRate}%`} />
          <PerformanceItem label="Reviews" value={String(totalReviews)} />
          <PerformanceItem label="Views" value={String(totalViews)} />
          <PerformanceItem label="Conversion rate" value={`${conversionRate}%`} />
        </CardContent>
      </Card>

      <EarningsCalculator
        defaultPlatformFeePercent={platformFeePercent}
        isPlaceholderFee={isPlaceholderFee}
      />

      <Card>
        <CardHeader>
          <CardTitle>Trip history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Car</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingRows.slice(0, 8).map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.cars?.title ?? "Car"}</TableCell>
                    <TableCell>{booking.start_date} - {booking.end_date}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        {booking.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(booking.total_price ?? 0))}
                    </TableCell>
                  </TableRow>
                ))}
                {bookingRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-gray-600">
                      No trip history yet. Create your first listing to start earning.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-2 md:hidden">
            {bookingRows.slice(0, 8).map((booking) => (
              <div key={booking.id} className="rounded-lg border border-border bg-white p-3">
                <p className="text-sm font-semibold text-foreground">{booking.cars?.title ?? "Car"}</p>
                <p className="text-xs text-gray-600">
                  {booking.start_date} - {booking.end_date}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                    {booking.status}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(Number(booking.total_price ?? 0))}
                  </span>
                </div>
              </div>
            ))}
            {bookingRows.length === 0 ? (
              <p className="rounded-lg border border-border bg-gray-50 p-3 text-center text-sm text-gray-600">
                No trip history yet. Create your first listing to start earning.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceItem({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      {note ? <p className="text-xs text-amber-700">{note}</p> : null}
    </div>
  );
}

function computeHostLevel({
  explicitLevel,
  idVerified,
  phoneVerified,
  emailVerified,
  trips,
  rating,
}: {
  explicitLevel?: string;
  idVerified: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  trips: number;
  rating: number;
}) {
  const normalized = String(explicitLevel ?? "").toLowerCase();
  if (normalized === "super_host") return "Super Host";
  if (normalized === "top_host") return "Top Host";
  if (normalized === "verified_host") return "Verified Host";
  const verified = idVerified && phoneVerified && emailVerified;
  if (verified && trips >= 50 && rating >= 4.8) return "Super Host";
  if (verified && trips >= 20 && rating >= 4.6) return "Top Host";
  if (verified) return "Verified Host";
  return "New Host";
}
