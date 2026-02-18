import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarForm } from "@/components/car-form";
import { AvailabilityForm } from "@/components/availability-form";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

export const dynamic = "force-dynamic";

export default async function AdminEditCarPage({ params }: PageProps) {
  await requireAdmin();
  const resolvedParams = await params;
  const admin = createSupabaseAdminClient() as any;
  const { data: car } = await admin
    .from("cars")
    .select("*")
    .eq("id", resolvedParams.id)
    .maybeSingle();
  const { count: existingPhotoCount } = await admin
    .from("car_photos")
    .select("id", { count: "exact", head: true })
    .eq("car_id", resolvedParams.id);

  if (!car) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Admin edit</p>
          <h1 className="text-2xl font-semibold text-foreground">{car.title}</h1>
          <p className="text-sm text-gray-600">Update details and save to publish changes.</p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-brand">
          Back to admin
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Car details</CardTitle>
        </CardHeader>
        <CardContent>
          <CarForm
            carId={car.id}
            redirectTo="/admin"
            existingPhotoCount={existingPhotoCount ?? 0}
            defaultValues={{
              title: car.title ?? "",
              description: car.description ?? "",
              daily_price: Number(car.daily_price ?? 0),
              city: car.city ?? "",
              region: car.region ?? "",
              car_type: car.car_type ?? "",
              brand: (car as any).brand ?? "",
              model: (car as any).model ?? "",
              fuel_type: (car as any).fuel_type ?? undefined,
              car_year: (car as any).car_year ?? undefined,
              seats: car.seats ?? undefined,
              transmission: car.transmission ?? undefined,
              features: car.features ?? [],
              is_available: car.is_available ?? true,
              instant_book: (car as any).instant_book ?? false,
              delivery_available: (car as any).delivery_available ?? false,
              air_conditioning: (car as any).air_conditioning ?? false,
              delivery_fee: Number((car as any).delivery_fee ?? 0),
              insurance_fee: Number((car as any).insurance_fee ?? 0),
              deposit_amount: Number((car as any).deposit_amount ?? 0),
              cancellation_policy: (car as any).cancellation_policy ?? "moderate",
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityForm carId={car.id} />
        </CardContent>
      </Card>
    </div>
  );
}
