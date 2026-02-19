import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, CarFront, Gauge, MapPin } from "lucide-react";
import { ImageGallery } from "@/components/image-gallery";
import { VerificationBadges } from "@/components/verification-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deriveHostBadgeType, hostBadgeLabel } from "@/lib/host-badges";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, getInitials } from "@/lib/utils";

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

type PageProps = {
  params: { id: string } | Promise<{ id: string }>;
};

type AdminPreviewOwner = {
  id?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  id_verified?: boolean | null;
  phone_verified?: boolean | null;
  email_verified?: boolean | null;
  is_host?: boolean | null;
  host_level?: string | null;
};

type AdminPreviewCar = {
  id: string;
  title: string;
  description?: string | null;
  city?: string | null;
  region?: string | null;
  daily_price?: number | null;
  car_type?: string | null;
  brand?: string | null;
  model?: string | null;
  car_year?: number | null;
  seats?: number | null;
  transmission?: string | null;
  fuel_type?: string | null;
  features?: string[] | null;
  is_available?: boolean | null;
  approval_status?: string | null;
  delivery_fee?: number | null;
  insurance_fee?: number | null;
  deposit_amount?: number | null;
  cancellation_policy?: string | null;
  owner?: AdminPreviewOwner | null;
};

export const dynamic = "force-dynamic";

export default async function AdminListingPreviewPage({ params }: PageProps) {
  await requireAdmin();
  const resolvedParams = await params;
  const admin = createSupabaseAdminClient();

  const carResult = await admin
    .from("cars")
    .select(
      "id,title,description,city,region,daily_price,car_type,brand,model,car_year,seats,transmission,fuel_type,features,is_available,approval_status,delivery_fee,insurance_fee,deposit_amount,cancellation_policy,owner:profiles!cars_owner_id_fkey(id,full_name,avatar_url,city,id_verified,phone_verified,email_verified,is_host,host_level)",
    )
    .eq("id", resolvedParams.id)
    .maybeSingle();
  const car = carResult.data as AdminPreviewCar | null;

  if (!car) return notFound();

  const { data: photoRows } = await admin.from("car_photos").select("url").eq("car_id", car.id);
  const photos = Array.from(
    new Set([...(photoRows ?? []).map((row: { url?: string | null }) => row.url).filter(Boolean), "/car-placeholder.jpg"]),
  ) as string[];

  const hostType = deriveHostBadgeType({
    hostLevel: car.owner?.host_level,
    isHost: car.owner?.is_host,
    idVerified: car.owner?.id_verified,
    phoneVerified: car.owner?.phone_verified,
    emailVerified: car.owner?.email_verified,
  });
  const hostLabel = hostBadgeLabel(hostType);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Admin demo preview</p>
          <h1 className="text-2xl font-semibold text-foreground">{car.title}</h1>
          <p className="text-xs text-gray-600">This preview helps approve or reject the listing with real listing context.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/cars/${car.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Open live page
          </Link>
          <Link
            href={`/admin/cars/${car.id}/edit`}
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Edit listing
          </Link>
          <Link href="/admin/platform" className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white">
            Back to approvals
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <ImageGallery images={photos} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listing details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem
                  icon={MapPin}
                  label="Location"
                  value={[car.city, car.region].filter(Boolean).join(", ") || "-"}
                />
                <DetailItem icon={CarFront} label="Type" value={car.car_type ?? "-"} />
                <DetailItem icon={CarFront} label="Brand / model" value={`${car.brand ?? "-"} ${car.model ?? ""}`.trim()} />
                <DetailItem icon={Gauge} label="Year / seats" value={`${car.car_year ?? "-"} | ${car.seats ?? "-"} seats`} />
              </div>
              <p className="text-sm text-gray-700">{car.description ?? "No description provided."}</p>
              <div className="flex flex-wrap gap-2">
                {(car.features ?? []).map((feature: string) => (
                  <Badge key={feature} variant="outline">
                    {feature}
                  </Badge>
                ))}
                {(car.features ?? []).length === 0 ? <p className="text-xs text-gray-600">No features selected.</p> : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant={car.approval_status === "pending" ? "secondary" : "outline"}>
                  {car.approval_status ?? "pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Daily price</span>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(Number(car.daily_price ?? 0))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Delivery fee</span>
                <span className="text-sm text-foreground">{formatCurrency(Number(car.delivery_fee ?? 0))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Insurance fee</span>
                <span className="text-sm text-foreground">{formatCurrency(Number(car.insurance_fee ?? 0))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Deposit</span>
                <span className="text-sm text-foreground">{formatCurrency(Number(car.deposit_amount ?? 0))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cancellation</span>
                <span className="text-sm text-foreground capitalize">{car.cancellation_policy ?? "moderate"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Host profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <ProfileAvatar src={car.owner?.avatar_url} name={car.owner?.full_name ?? "Host"} className="h-12 w-12" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{car.owner?.full_name ?? "Host"}</p>
                  <p className="text-xs text-gray-600">{car.owner?.city ?? "No city set"}</p>
                  {hostLabel ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                      <BadgeCheck className="h-3 w-3" />
                      {hostLabel}
                    </p>
                  ) : null}
                </div>
              </div>
              <VerificationBadges
                idVerified={car.owner?.id_verified}
                phoneVerified={car.owner?.phone_verified}
                emailVerified={car.owner?.email_verified}
              />
              <p className="text-xs text-gray-600">
                Use this host summary to confirm trust signals before approving the listing.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileAvatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name?: string | null;
  className: string;
}) {
  const initials = getInitials(name ?? "User") || "U";
  if (src) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-full border border-border ${className}`}>
        <Image src={src} alt={name ?? "User"} fill className="object-cover" sizes="48px" />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-xs font-semibold text-primary ${className}`}
    >
      {initials}
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
