import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Shield, Star } from "lucide-react";
import { BookingWidget } from "@/components/booking-widget";
import { ImageGallery } from "@/components/image-gallery";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCars } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: { id: string };
};

export default async function CarDetailPage({ params }: PageProps) {
  const { id } = params;
  let supabaseCar: any | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("cars")
      .select("*, car_photos(url)")
      .eq("id", id)
      .single();
    supabaseCar = data;
  } catch (error) {
    // fall back to mock data if Supabase is not configured
  }

  const car =
    supabaseCar !== null
      ? {
          id: supabaseCar.id,
          name: supabaseCar.title,
          city: supabaseCar.city ?? "Accra",
          region: supabaseCar.region ?? "Greater Accra",
          daily_price: Number(supabaseCar.daily_price ?? 0),
          rating: 4.8,
          reviews: 20,
          car_type: supabaseCar.car_type ?? "SUV",
          seats: supabaseCar.seats ?? 5,
          transmission: supabaseCar.transmission ?? "automatic",
          fuel: supabaseCar.fuel ?? "Petrol",
          features: supabaseCar.features ?? [],
          description: supabaseCar.description ?? "Reliable ride.",
          image:
            supabaseCar.car_photos?.[0]?.url ??
            "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
          host: {
            name: "Host",
            avatar:
              "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
          },
        }
      : mockCars.find((c) => c.id === id);

  if (!car) {
    return notFound();
  }

  const images = [car.image, "/car-placeholder.jpg", "/hero.jpg"].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand">Car in {car.city}</p>
          <h1 className="text-3xl font-semibold text-foreground">{car.name}</h1>
          <p className="flex items-center gap-2 text-gray-700">
            <MapPin className="h-4 w-4 text-brand" />
            {car.city}, {car.region}
            <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
              <Star className="h-4 w-4" /> {car.rating} ({car.reviews} reviews)
            </span>
          </p>
        </div>
        <Badge variant="muted">{car.car_type}</Badge>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-6">
          <ImageGallery images={images} />

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Detail label="Transmission" value={car.transmission} />
              <Detail label="Fuel" value={car.fuel} />
              <Detail label="Seats" value={`${car.seats} seats`} />
              <Detail label="Daily price" value={formatCurrency(car.daily_price)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700">{car.description}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {car.features?.map((feature: string) => (
                <Badge key={feature} variant="secondary">
                  {feature}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <BookingWidget carId={car.id} dailyPrice={car.daily_price} />

          <Card>
            <CardHeader>
              <CardTitle>Host</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border">
                <Image
                  src={car.host.avatar}
                  alt={car.host.name}
                  fill
                  className="object-cover"
                  sizes="60px"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{car.host.name}</p>
                <p className="flex items-center gap-1 text-xs text-gray-600">
                  <Shield className="h-3 w-3 text-primary" /> Verified host
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <ReviewCard
                name="Adwoa"
                text="Smooth pickup, clean car, AC was perfect for Accra traffic."
                rating={5}
              />
              <ReviewCard
                name="Nana"
                text="Great communication and flexible return time."
                rating={4}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ReviewCard({ name, text, rating }: { name: string; text: string; rating: number }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground">{name}</p>
        <div className="flex items-center gap-1 text-amber-500">
          {[...Array(rating)].map((_, idx) => (
            <Star key={idx} className="h-4 w-4 fill-amber-500" />
          ))}
        </div>
      </div>
      <p className="text-gray-700">{text}</p>
    </div>
  );
}
