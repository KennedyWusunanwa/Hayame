import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarForm } from "@/components/car-form";
import { AvailabilityForm } from "@/components/availability-form";
import type { Database } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: { id: string } | Promise<{ id: string }>;
};

export default async function EditCarPage({ params }: PageProps) {
  const resolvedParams = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: car, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", resolvedParams.id)
    .eq("owner_id", user!.id)
    .maybeSingle<Database["public"]["Tables"]["cars"]["Row"]>();

  const hydratedCar = car ?? (await fetchCarFallback(resolvedParams.id, user.id));
  if (!hydratedCar) return notFound();

  const { data: existingPhotoRows } = await (supabase as any)
    .from("car_photos")
    .select("id,url")
    .eq("car_id", hydratedCar.id);

  const existingPhotos =
    ((existingPhotoRows ?? []) as { id: string; url: string }[]).filter(
      (photo) => Boolean(photo.id && photo.url),
    ) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Edit car</p>
        <h1 className="text-2xl font-semibold text-foreground">{hydratedCar.title}</h1>
        <p className="text-sm text-gray-600">Update details and save to publish changes.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Car details</CardTitle>
        </CardHeader>
        <CardContent>
          <CarForm
            carId={hydratedCar.id}
            existingPhotos={existingPhotos}
            defaultValues={{
              title: hydratedCar.title ?? "",
              description: hydratedCar.description ?? "",
              daily_price: Number(hydratedCar.daily_price ?? 0),
              city: hydratedCar.city ?? "",
              region: hydratedCar.region ?? "",
              car_type: hydratedCar.car_type ?? "",
              brand: (hydratedCar as any).brand ?? "",
              model: (hydratedCar as any).model ?? "",
              fuel_type: (hydratedCar as any).fuel_type ?? undefined,
              car_year: (hydratedCar as any).car_year ?? undefined,
              seats: hydratedCar.seats ?? undefined,
              transmission: hydratedCar.transmission ?? undefined,
              features: hydratedCar.features ?? [],
              is_available: hydratedCar.is_available ?? true,
              instant_book: (hydratedCar as any).instant_book ?? false,
              delivery_available: (hydratedCar as any).delivery_available ?? false,
              air_conditioning: (hydratedCar as any).air_conditioning ?? false,
              delivery_fee: Number((hydratedCar as any).delivery_fee ?? 0),
              insurance_fee: Number((hydratedCar as any).insurance_fee ?? 0),
              deposit_amount: Number((hydratedCar as any).deposit_amount ?? 0),
              cancellation_policy: (hydratedCar as any).cancellation_policy ?? "moderate",
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityForm carId={hydratedCar.id} />
        </CardContent>
      </Card>
    </div>
  );
}

async function fetchCarFallback(id: string, userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const params = new URLSearchParams({
      select: "*",
      id: `eq.${id}`,
    });
    const res = await fetch(`${supabaseUrl}/rest/v1/cars?${params.toString()}`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: "no-store",
    });
    const data = (await res.json()) as Database["public"]["Tables"]["cars"]["Row"][];
    const car = data?.[0];
    if (car && car.owner_id === userId) {
      return car;
    }
    return null;
  } catch {
    return null;
  }
}
