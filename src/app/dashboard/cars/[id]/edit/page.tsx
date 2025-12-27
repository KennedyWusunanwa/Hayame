import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarForm } from "@/components/car-form";
import type { Database } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: { id: string };
};

export default async function EditCarPage({ params }: PageProps) {
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
    .eq("id", params.id)
    .eq("owner_id", user!.id)
    .maybeSingle<Database["public"]["Tables"]["cars"]["Row"]>();

  if (error) {
    console.error(error);
  }

  if (!car) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Edit car</p>
        <h1 className="text-2xl font-semibold text-foreground">{car.title}</h1>
        <p className="text-sm text-gray-600">Update details and save to publish changes.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Car details</CardTitle>
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
              seats: car.seats ?? undefined,
              transmission: car.transmission ?? undefined,
              fuel: car.fuel ?? undefined,
              features: car.features ?? [],
              is_available: car.is_available ?? true,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
