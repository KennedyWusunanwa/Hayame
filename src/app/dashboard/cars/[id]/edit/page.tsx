import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarForm } from "@/components/car-form";
import { PhotoUploader } from "@/components/photo-uploader";
import { AvailabilityForm } from "@/components/availability-form";
import { mockCars } from "@/lib/mock-data";

type PageProps = {
  params: { id: string };
};

export default function EditCarPage({ params }: PageProps) {
  const car = mockCars.find((c) => c.id === params.id);
  if (!car) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Edit car</p>
        <h1 className="text-2xl font-semibold text-foreground">{car.name}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Update listing</CardTitle>
        </CardHeader>
        <CardContent>
          <CarForm
            carId={car.id}
            defaultValues={{
              title: car.name,
              description: car.description,
              daily_price: car.daily_price,
              city: car.city,
              region: car.region,
              car_type: car.car_type,
              seats: car.seats,
              transmission: car.transmission,
              fuel: car.fuel,
              features: car.features,
              is_available: true,
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
