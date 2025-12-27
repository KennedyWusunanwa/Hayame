"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { carFormSchema } from "@/lib/validators";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { featureOptions, carTypes } from "@/lib/utils";

type FormValues = z.infer<typeof carFormSchema>;

type Props = {
  carId?: string;
  defaultValues?: Partial<FormValues>;
};

export function CarForm({ carId, defaultValues }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      title: "",
      description: "",
      daily_price: 300,
      city: "",
      region: "",
      car_type: "",
      seats: 4,
      transmission: "automatic",
      fuel: "Petrol",
      features: [],
      is_available: true,
      ...defaultValues,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const res = await fetch(carId ? `/api/cars/${carId}` : "/api/cars", {
        method: carId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(message);
      }
      router.push("/dashboard/cars");
    } catch (err: any) {
      setError(err.message ?? "Unable to save car");
    }
  };

  const selectedFeatures = watch("features") || [];

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Title</label>
          <Input placeholder="Toyota RAV4 2022" {...register("title")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Daily price (GHS)</label>
          <Input type="number" min={50} {...register("daily_price", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">City</label>
          <Input placeholder="Accra" {...register("city")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Region</label>
          <Input placeholder="Greater Accra" {...register("region")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Car type</label>
          <Select {...register("car_type")}>
            <option value="">Select type</option>
            {carTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Seats</label>
          <Input type="number" min={2} max={8} {...register("seats", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Transmission</label>
          <Select {...register("transmission")}>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Fuel</label>
          <Select {...register("fuel")}>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Hybrid">Hybrid</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Description</label>
        <Textarea rows={4} placeholder="Describe your car, pickup and rules" {...register("description")} />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">Features</label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {featureOptions.map((feature) => {
            const checked = selectedFeatures.includes(feature);
            return (
              <label key={feature} className="flex items-center gap-2 text-gray-700">
                <Checkbox
                  checked={checked}
                  onChange={() => {
                    const set = new Set(selectedFeatures);
                    if (checked) {
                      set.delete(feature);
                    } else {
                      set.add(feature);
                    }
                    setValue("features", Array.from(set));
                  }}
                />
                {feature}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Availability</p>
          <p className="text-xs text-gray-600">Toggle to disable bookings temporarily.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("is_available")} />
          Available
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save car"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/dashboard/cars")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
