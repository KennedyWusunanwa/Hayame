// @ts-nocheck
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { mockCars } from "../src/lib/mock-data";
import type { Database } from "../src/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
}

const supabase = createClient<Database>(supabaseUrl, serviceKey);

async function ensureUser(email: string, password: string, fullName: string) {
  const existing = await supabase.auth.admin.listUsers();
  const found = existing.data.users.find((u) => u.email === email);
  if (found) return found.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) throw error ?? new Error("Could not create user");
  return data.user.id;
}

async function seed() {
  console.log("Seeding sample data...");

  const hosts = [
    { email: "host1@hayame.com", password: "Password123", name: "Ama Owusu" },
    { email: "host2@hayame.com", password: "Password123", name: "Kwesi Lamptey" },
    { email: "host3@hayame.com", password: "Password123", name: "Akua Agyeman" },
  ];
  const renter = { email: "guest@hayame.com", password: "Password123", name: "Nana Guest" };

  const hostIds = [];
  for (const host of hosts) {
    const id = await ensureUser(host.email, host.password, host.name);
    hostIds.push({ id, ...host });
    await supabase.from("profiles").upsert({
      id,
      full_name: host.name,
      city: "Accra",
    });
  }
  const renterId = await ensureUser(renter.email, renter.password, renter.name);
  await supabase.from("profiles").upsert({ id: renterId, full_name: renter.name, city: "Accra" });

  // locations
  const locations = Array.from(new Set(mockCars.map((car) => `${car.city}-${car.region}`))).map((key, index) => {
    const [city, region] = key.split("-");
    return { id: index + 1, city, region, lat: 5.56 + index * 0.02, lng: -0.2 - index * 0.02 };
  });
  await supabase.from("locations").upsert(locations);

  // cars
  for (const [idx, car] of mockCars.entries()) {
    const owner = hostIds[idx % hostIds.length];
    const { data, error } = await supabase
      .from("cars")
      .upsert({
        owner_id: owner.id,
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
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from("car_photos").upsert({
      car_id: data.id,
      url: car.image,
    });
  }

  // sample bookings
  const sampleCar = await supabase.from("cars").select("id,daily_price").limit(1).single();
  if (sampleCar.data) {
    await supabase.from("bookings").upsert({
      car_id: sampleCar.data.id,
      renter_id: renterId,
      start_date: "2026-01-10",
      end_date: "2026-01-12",
      status: "completed",
      total_price: sampleCar.data.daily_price * 2,
    });
  }

  console.log("Seed completed");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
