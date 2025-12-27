import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarForm } from "@/components/car-form";
import { PhotoUploader } from "@/components/photo-uploader";
import { AvailabilityForm } from "@/components/availability-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type CarRow = Database["public"]["Tables"]["cars"]["Row"];

type PageProps = {
  params: { id: string };
};

export default async function EditCarPage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: car, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !car) return notFound();
  const typedCar = car as CarRow;
  if (typedCar.owner_id !== user.id) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Edit car</p>
        <h1 className="text-2xl font-semibold text-foreground">{typedCar.title}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Update listing</CardTitle>
        </CardHeader>
        <CardContent>
          <CarForm
            carId={typedCar.id}
            defaultValues={{
              title: typedCar.title ?? "",
              description: typedCar.description ?? "",
              daily_price: Number(typedCar.daily_price ?? 0),
              city: typedCar.city ?? "",
              region: typedCar.region ?? "",
              car_type: typedCar.car_type ?? "",
              seats: typedCar.seats ?? 4,
              transmission: typedCar.transmission ?? "automatic",
              fuel: typedCar.fuel ?? "Petrol",
              features: typedCar.features ?? [],
              is_available: typedCar.is_available ?? true,
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUploader carId={typedCar.id} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityForm carId={typedCar.id} />
        </CardContent>
      </Card>
    </div>
  );
}
