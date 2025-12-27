import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarForm } from "@/components/car-form";
import { PhotoUploader } from "@/components/photo-uploader";
import { AvailabilityForm } from "@/components/availability-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    .eq("owner_id", user.id)
    .single();

  if (error || !car) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Edit car</p>
        <h1 className="text-2xl font-semibold text-foreground">{car.title}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Update listing</CardTitle>
        </CardHeader>
        <CardContent>
          <CarForm
            carId={car.id}
            defaultValues={{
              title: car.title ?? "",
              description: car.description ?? "",
              daily_price: Number(car.daily_price ?? 0),
              city: car.city ?? "",
              region: car.region ?? "",
              car_type: car.car_type ?? "",
              seats: car.seats ?? 4,
              transmission: car.transmission ?? "automatic",
              fuel: car.fuel ?? "Petrol",
              features: (car.features as string[] | null) ?? [],
              is_available: car.is_available ?? true,
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUploader carId={car.id} />
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
