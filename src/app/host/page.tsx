import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  BellRing,
  Car,
  ChartBar,
  CheckCircle2,
  Eye,
  Heart,
  MapPin,
  PlusCircle,
  Settings,
  ShieldCheck,
  Star,
  TrendingUp,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { HostStatTile } from "@/components/dashboard/host-stat-tile";
import { EarningsCalculator } from "@/components/host/earnings-calculator";
import { VerificationBadges } from "@/components/verification-badges";
import { Reveal } from "@/components/ui/reveal";
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
    .select(
      "full_name, city, id_verified, phone_verified, email_verified, host_level",
    )
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
          .select(
            "id,car_id,start_date,end_date,status,payment_status,total_price,created_at,cars(title)",
          )
          .in("car_id", carIds)
          .order("created_at", { ascending: false })
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
  const urgentBookings = bookingRows.filter(
    (booking) =>
      booking.status === "awaiting_host" && booking.payment_status === "paid",
  );
  const urgentBookingCount = urgentBookings.length;
  const activeBookingsCount = bookingRows.filter(
    (booking) =>
      booking.status === "awaiting_host" || booking.status === "confirmed",
  ).length;
  const unattendedBookingValue = urgentBookings.reduce(
    (sum, booking) => sum + Number(booking.total_price ?? 0),
    0,
  );
  const paidBookings = bookingRows.filter((booking) =>
    EARNING_STATUSES.has(booking.status),
  );
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
    if (
      start.getMonth() !== currentMonth ||
      start.getFullYear() !== currentYear
    )
      return sum;
    return sum + Number(booking.total_price ?? 0);
  }, 0);

  const bookingRate =
    carIds.length > 0
      ? Math.round((paidBookings.length / carIds.length) * 100)
      : 0;
  const totalReviews = (reviews ?? []).length;
  const averageRating =
    totalReviews > 0
      ? Number(
          (
            (reviews ?? []).reduce(
              (sum: number, row: any) => sum + Number(row.rating ?? 0),
              0,
            ) / totalReviews
          ).toFixed(1),
        )
      : 0;
  const totalViews = (views ?? []).length;
  const conversionRate =
    totalViews > 0
      ? Number(((paidBookings.length / totalViews) * 100).toFixed(1))
      : 0;

  const { data: platformSettings } = await (supabase as any)
    .from("platform_settings")
    .select("platform_fee_percent")
    .eq("id", 1)
    .maybeSingle();
  const envFee = Number(
    process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT ??
      process.env.PLATFORM_FEE_PERCENT,
  );
  const fallbackFee = Number.isFinite(envFee) ? envFee : 10;
  const platformFeePercent = Number(
    platformSettings?.platform_fee_percent ?? fallbackFee,
  );
  const isPlaceholderFee =
    !platformSettings?.platform_fee_percent && !Number.isFinite(envFee);
  const hostLevel = computeHostLevel({
    explicitLevel: explicitHostLevel,
    idVerified,
    phoneVerified,
    emailVerified,
    trips: paidBookings.length,
    rating: averageRating,
  });

  const firstName = String(hostName).trim().split(" ")[0] || "there";
  const recentBookings = bookingRows.slice(0, 6);
  const monthName = format(now, "MMMM");

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Hero: the one place a host looks first. Brand surface like the rest
          of the site, with the month's number front and centre. */}
      <Reveal>
        <section className="brand-panel relative isolate overflow-hidden rounded-[1.75rem] shadow-[0_24px_80px_rgba(6,34,58,0.18)] sm:rounded-[2rem]">
          <div
            aria-hidden
            className="brand-dots pointer-events-none absolute inset-0 -z-10"
          />
          <div
            aria-hidden
            className="brand-streaks pointer-events-none absolute inset-0 -z-10 opacity-60"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-brand/30 blur-3xl"
          />

          <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:p-9">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] !text-white/60 sm:text-xs">
                {greeting()}
              </p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight !text-white sm:text-3xl lg:text-4xl">
                {firstName}
              </h1>

              <div className="mt-3 flex flex-wrap gap-2">
                <HeroChip icon={ShieldCheck}>{hostLevel}</HeroChip>
                <HeroChip icon={MapPin}>{hostCity}</HeroChip>
                <HeroChip icon={Car}>
                  {carIds.length} {carIds.length === 1 ? "listing" : "listings"}
                </HeroChip>
              </div>

              <div className="mt-6 grid max-w-md grid-cols-2 gap-4 sm:gap-6">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] !text-white/60">
                    {monthName}
                  </p>
                  <p className="mt-1 truncate text-2xl font-bold tracking-tight !text-white sm:text-3xl">
                    {formatCurrency(monthlyEarnings)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] !text-white/60">
                    Total earned
                  </p>
                  <p className="mt-1 truncate text-2xl font-bold tracking-tight !text-white sm:text-3xl">
                    {formatCurrency(totalEarnings)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:flex-col">
              <Link
                href="/host/cars/new"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold !text-[#06223a] shadow-lg transition-transform hover:-translate-y-0.5"
              >
                <PlusCircle className="h-4 w-4" />
                New listing
              </Link>
              <Link
                href="/host/bookings"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/30 px-5 text-sm font-semibold !text-white transition-colors hover:bg-white/10"
              >
                {urgentBookingCount > 0
                  ? `Review ${urgentBookingCount} ${urgentBookingCount === 1 ? "request" : "requests"}`
                  : "View bookings"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      {urgentBookingCount > 0 ? (
        <Reveal delay={40}>
          <Link
            href="/host/bookings"
            className="flex flex-col gap-4 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:p-5"
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-500 !text-white">
              <span
                aria-hidden
                className="absolute inset-0 animate-ping rounded-full bg-rose-400/60"
              />
              <BellRing className="relative h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold !text-rose-900 sm:text-base">
                {urgentBookingCount} paid{" "}
                {urgentBookingCount === 1 ? "request needs" : "requests need"}{" "}
                your answer
              </p>
              <p className="mt-0.5 text-sm !text-rose-700">
                Guests have paid and are waiting for approval. Pending value:{" "}
                <span className="font-semibold">
                  {formatCurrency(unattendedBookingValue)}
                </span>
              </p>
            </div>
            <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold !text-white">
              Review now
            </span>
          </Link>
        </Reveal>
      ) : null}

      <Reveal delay={60}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <HostStatTile
            label="Total earned"
            value={formatCurrency(totalEarnings)}
            icon={WalletCards}
            tone="green"
            href="/host/earnings"
          />
          <HostStatTile
            label="This month"
            value={formatCurrency(monthlyEarnings)}
            icon={TrendingUp}
            tone="blue"
            href="/host/earnings"
          />
          <HostStatTile
            label="Booking rate"
            value={`${bookingRate}%`}
            hint={`${paidBookings.length} paid ${paidBookings.length === 1 ? "booking" : "bookings"}`}
            icon={ChartBar}
            tone="amber"
            href="/host/bookings"
          />
          <HostStatTile
            label="Rating"
            value={totalReviews > 0 ? `${averageRating}/5` : "New"}
            hint={`${totalReviews} ${totalReviews === 1 ? "review" : "reviews"}`}
            icon={Star}
            tone="rose"
            href="/host/reviews"
          />
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <section className="rounded-[1.5rem] border border-sky-100 bg-white p-5 shadow-[0_18px_50px_rgba(14,134,212,0.06)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold !text-[#06223a] sm:text-lg">
                  Performance
                </h2>
                <p className="mt-0.5 text-sm !text-slate-600">
                  How your listings are doing across the marketplace.
                </p>
              </div>
              <span className="hidden rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold !text-brand sm:inline-flex">
                Live
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MiniStat
                label="Views"
                value={String(totalViews)}
                icon={Eye}
              />
              <MiniStat
                label="Conversion"
                value={`${conversionRate}%`}
                icon={TrendingUp}
              />
              <MiniStat
                label="Active bookings"
                value={String(activeBookingsCount)}
                icon={WalletCards}
              />
              <MiniStat
                label="Needs approval"
                value={String(urgentBookingCount)}
                icon={BellRing}
                highlight={urgentBookingCount > 0}
              />
              <MiniStat
                label="Reviews"
                value={String(totalReviews)}
                icon={Star}
              />
              <MiniStat
                label="Listings"
                value={String(carIds.length)}
                icon={Car}
              />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="!text-slate-500">Views that became bookings</span>
                <span className="!text-brand">{conversionRate}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-sky-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-sky-400"
                  style={{ width: `${Math.min(100, Math.max(2, conversionRate))}%` }}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-sky-100 pt-4">
              <VerificationBadges
                idVerified={idVerified}
                phoneVerified={phoneVerified}
                emailVerified={emailVerified}
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-sky-100 bg-white p-5 shadow-[0_18px_50px_rgba(14,134,212,0.06)] sm:p-6">
            <h2 className="text-base font-bold !text-[#06223a] sm:text-lg">
              Quick actions
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <QuickLink href="/host/cars" icon={Car} label="Vehicles" hint="Manage listings" tone="blue" />
              <QuickLink href="/host/bookings" icon={WalletCards} label="Bookings" hint="Requests & trips" tone="amber" badge={urgentBookingCount} />
              <QuickLink href="/host/earnings" icon={ChartBar} label="Earnings" hint="Payouts & trends" tone="green" />
              <QuickLink href="/host/reviews" icon={Star} label="Reviews" hint="Guest feedback" tone="rose" />
              <QuickLink href="/host/favorites" icon={Heart} label="Guest saves" hint="Most-saved cars" tone="rose" />
              <QuickLink href="/host/profile" icon={Settings} label="Settings" hint="Profile & payouts" tone="navy" />
            </div>
          </section>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <section className="rounded-[1.5rem] border border-sky-100 bg-white shadow-[0_18px_50px_rgba(14,134,212,0.06)]">
          <div className="flex items-center justify-between gap-3 p-5 pb-3 sm:p-6 sm:pb-4">
            <div>
              <h2 className="text-base font-bold !text-[#06223a] sm:text-lg">
                Recent trips
              </h2>
              <p className="mt-0.5 text-sm !text-slate-600">
                Latest bookings across your cars.
              </p>
            </div>
            {bookingRows.length > 0 ? (
              <Link
                href="/host/bookings"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold !text-brand hover:!text-[#06223a]"
              >
                All bookings
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          {recentBookings.length === 0 ? (
            <div className="px-5 pb-6 sm:px-6">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 p-6 text-center sm:flex-row sm:text-left">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white !text-brand shadow-sm">
                  <Car className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold !text-[#06223a]">
                    No trips yet
                  </p>
                  <p className="text-sm !text-slate-600">
                    Bookings show up here the moment a guest books one of your cars.
                  </p>
                </div>
                <Link
                  href="/host/cars/new"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold !text-white"
                >
                  List a car
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Table from md up */}
              <div className="hidden overflow-x-auto px-2 pb-2 md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider !text-slate-500">
                      <th className="px-4 py-2 font-semibold">Car</th>
                      <th className="px-4 py-2 font-semibold">Dates</th>
                      <th className="px-4 py-2 font-semibold">Booked</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                      <th className="px-4 py-2 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-t border-sky-100 transition-colors hover:bg-sky-50/60"
                      >
                        <td className="max-w-[220px] truncate px-4 py-3 font-semibold !text-[#06223a]">
                          {booking.cars?.title ?? "Car"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 !text-slate-600">
                          {formatDateLabel(booking.start_date)} –{" "}
                          {formatDateLabel(booking.end_date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 !text-slate-600">
                          {formatDateLabel(booking.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={booking.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold !text-[#06223a]">
                          {formatCurrency(Number(booking.total_price ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Stacked cards below md */}
              <ul className="space-y-2 px-4 pb-4 md:hidden">
                {recentBookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="rounded-2xl border border-sky-100 bg-[#f6f9fc] p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-bold !text-[#06223a]">
                        {booking.cars?.title ?? "Car"}
                      </p>
                      <StatusPill status={booking.status} />
                    </div>
                    <p className="mt-1 text-xs !text-slate-600">
                      {formatDateLabel(booking.start_date)} –{" "}
                      {formatDateLabel(booking.end_date)}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-xs !text-slate-500">
                        Booked {formatDateLabel(booking.created_at)}
                      </span>
                      <span className="text-sm font-bold !text-[#06223a]">
                        {formatCurrency(Number(booking.total_price ?? 0))}
                      </span>
                    </div>
                    {booking.status === "awaiting_host" ? (
                      <Link
                        href="/host/bookings"
                        className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-brand text-xs font-semibold !text-white"
                      >
                        Open booking request
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </Reveal>

      <Reveal delay={120}>
        <EarningsCalculator
          defaultPlatformFeePercent={platformFeePercent}
          isPlaceholderFee={isPlaceholderFee}
        />
      </Reveal>
    </div>
  );
}

function greeting() {
  // Ghana is UTC+0, so UTC hours line up with local time for most hosts.
  const hour = new Date().getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDateLabel(value?: string | null) {
  if (!value) return "N/A";
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

function HeroChip({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold !text-white ring-1 ring-inset ring-white/15">
      <Icon className="h-3.5 w-3.5 !text-sky-200" />
      {children}
    </span>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl border border-rose-200 bg-rose-50 p-3"
          : "rounded-2xl border border-sky-100 bg-[#f6f9fc] p-3"
      }
    >
      <div className="flex items-center gap-2">
        <Icon
          className={
            highlight ? "h-4 w-4 !text-rose-600" : "h-4 w-4 !text-brand"
          }
        />
        <p className="truncate text-[11px] font-semibold uppercase tracking-wider !text-slate-500">
          {label}
        </p>
      </div>
      <p
        className={
          highlight
            ? "mt-1.5 text-lg font-bold !text-rose-700"
            : "mt-1.5 text-lg font-bold !text-[#06223a]"
        }
      >
        {value}
      </p>
    </div>
  );
}

const QUICK_TONES = {
  blue: "bg-sky-50 !text-brand",
  green: "bg-emerald-50 !text-emerald-600",
  amber: "bg-amber-50 !text-amber-600",
  rose: "bg-rose-50 !text-rose-600",
  navy: "bg-slate-100 !text-[#06223a]",
} as const;

function QuickLink({
  href,
  icon: Icon,
  label,
  hint,
  tone,
  badge = 0,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint: string;
  tone: keyof typeof QUICK_TONES;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="card-hover group relative flex min-w-0 flex-col gap-2 rounded-2xl border border-sky-100 bg-[#f6f9fc] p-3.5 hover:border-brand/30 hover:bg-white"
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${QUICK_TONES[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      {badge > 0 ? (
        <span className="absolute right-3 top-3 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold !text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold !text-[#06223a]">
          {label}
        </span>
        <span className="block truncate text-xs !text-slate-500">{hint}</span>
      </span>
    </Link>
  );
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  awaiting_host: { label: "Needs approval", className: "bg-amber-100 !text-amber-800" },
  pending: { label: "Pending", className: "bg-slate-100 !text-slate-700" },
  confirmed: { label: "Confirmed", className: "bg-sky-100 !text-brand" },
  completed: { label: "Completed", className: "bg-emerald-100 !text-emerald-700" },
  cancelled: { label: "Cancelled", className: "bg-rose-100 !text-rose-700" },
  rejected: { label: "Declined", className: "bg-rose-100 !text-rose-700" },
  refunded: { label: "Refunded", className: "bg-rose-100 !text-rose-700" },
};

function StatusPill({ status }: { status?: string | null }) {
  const key = String(status ?? "").toLowerCase();
  const style = STATUS_STYLES[key] ?? {
    label: key ? key.replace(/_/g, " ") : "Unknown",
    className: "bg-slate-100 !text-slate-700",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${style.className}`}
    >
      {key === "completed" ? <CheckCircle2 className="h-3 w-3" /> : null}
      {style.label}
    </span>
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
