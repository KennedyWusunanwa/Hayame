import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CarCard } from "@/components/car-card";
import { VerifiedHostIndicator } from "@/components/verified-host-indicator";
import { VerificationBadges } from "@/components/verification-badges";
import { deriveHostBadgeType } from "@/lib/host-badges";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";
import type { Car } from "@/lib/types";

type PageProps = {
  params: { id: string } | Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function HostProfilePage({ params }: PageProps) {
  const resolved = await params;
  const supabase = await createSupabaseServerClient();

  const supa = supabase as any;
  const { data: profile } = await supa
    .from("profiles")
    .select("id, full_name, avatar_url, city, is_host, id_verified, phone_verified, email_verified, host_level")
    .eq("id", resolved.id)
    .maybeSingle();

  if (!profile) {
    return notFound();
  }

  const { data: cars } = await supa
    .from("cars")
    .select("id, title, city, region, daily_price, description, car_type, car_photos(url)")
    .eq("owner_id", resolved.id)
    .order("created_at", { ascending: false });

  const hostBadgeType = deriveHostBadgeType({
    hostLevel: profile.host_level,
    isHost: profile.is_host,
    idVerified: profile.id_verified,
    phoneVerified: profile.phone_verified,
    emailVerified: profile.email_verified,
  });

  const mappedCars: Car[] = (cars ?? []).map((car: any) => ({
    id: car.id,
    title: car.title,
    city: car.city ?? "Accra",
    region: car.region ?? "Greater Accra",
    daily_price: Number(car.daily_price ?? 0),
    description: car.description ?? "",
    car_type: car.car_type ?? "",
    image_url: car.car_photos?.[0]?.url ?? "",
    host_type: hostBadgeType,
  }));

  const initials = getInitials(profile.full_name ?? "Host");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border">
              <Image src={profile.avatar_url} alt={profile.full_name ?? "Host"} fill className="object-cover" sizes="64px" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-primary/10 text-lg font-semibold text-primary">
              {initials || "H"}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-brand">Host profile</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{profile.full_name ?? "Host"}</h1>
              <VerifiedHostIndicator show={hostBadgeType !== "new"} className="text-sm" />
              <Badge variant="outline">{computeHostLevel(profile)}</Badge>
            </div>
            <p className="text-sm text-gray-600">{profile.city ?? "Location TBD"}</p>
            <VerificationBadges
              className="mt-2"
              idVerified={(profile as any).id_verified}
              phoneVerified={(profile as any).phone_verified}
              emailVerified={(profile as any).email_verified}
            />
          </div>
        </div>
        <Link className="text-sm font-semibold text-brand" href="/explore">
          Back to explore
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Listings by this host</CardTitle>
        </CardHeader>
        <CardContent>
          {mappedCars.length === 0 ? (
            <p className="text-sm text-gray-600">No cars listed yet.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {mappedCars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function computeHostLevel(profile: any) {
  const hostBadgeType = deriveHostBadgeType({
    hostLevel: profile?.host_level,
    isHost: profile?.is_host,
    idVerified: profile?.id_verified,
    phoneVerified: profile?.phone_verified,
    emailVerified: profile?.email_verified,
  });
  if (hostBadgeType === "top_host") return "Top Host";
  if (hostBadgeType === "verified") return "Verified Host";
  return "New Host";
}
