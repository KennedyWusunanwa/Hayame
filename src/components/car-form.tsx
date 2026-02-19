"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { carFormSchema } from "@/lib/validators";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { featureOptions, carTypes, fuelTypes } from "@/lib/utils";
import { buildListingTitle, buildListingTitlePreview } from "@/lib/listing-title";
import { useLocations } from "@/lib/use-locations";
import { useCarCatalog } from "@/lib/use-car-catalog";

type FormValues = z.infer<typeof carFormSchema>;
type ExistingPhoto = {
  id: string;
  url: string;
};

type Props = {
  carId?: string;
  defaultValues?: Partial<FormValues>;
  redirectTo?: string;
  existingPhotos?: ExistingPhoto[];
};

const qualityChecklist = [
  "Exterior photos",
  "Interior photos",
  "Dashboard photo",
  "Tires photo",
  "Plate visibility note",
];

const priorityFeatures = [
  "Bluetooth",
  "Reverse Camera",
  "Leather Seats",
  "Sunroof",
  "GPS",
  "Apple CarPlay",
  "Android Auto",
];

const MIN_PHOTOS = 5;
const MAX_PHOTOS = 7;

export function CarForm({ carId, defaultValues, redirectTo, existingPhotos = [] }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [existingPhotosState, setExistingPhotosState] = useState<ExistingPhoto[]>(existingPhotos);
  const [removedExistingPhotos, setRemovedExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const redirectPath = redirectTo ?? "/host/cars";
  const { regions, citiesByRegion } = useLocations();
  const { makes } = useCarCatalog();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      title: "",
      description: "",
      daily_price: 300,
      city: "",
      region: "",
      car_type: "",
      brand: "",
      model: "",
      car_year: new Date().getFullYear(),
      seats: 4,
      transmission: "automatic",
      fuel_type: "petrol",
      features: [],
      is_available: true,
      instant_book: false,
      delivery_available: false,
      air_conditioning: false,
      delivery_fee: 0,
      insurance_fee: 0,
      deposit_amount: 0,
      cancellation_policy: "moderate",
      ...defaultValues,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const computedTitle = buildListingTitle(values.brand, values.model, values.car_year);
    if (!computedTitle) {
      setError("Brand, model and year are required to generate the listing title.");
      return;
    }

    const totalPhotos = existingPhotosState.length + files.length;
    if (totalPhotos < MIN_PHOTOS) {
      setError(
        `At least ${MIN_PHOTOS} photos are required before submission. Current total: ${totalPhotos}.`,
      );
      return;
    }
    if (totalPhotos > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed. Current total: ${totalPhotos}.`);
      return;
    }
    try {
      const res = await fetch(carId ? `/api/cars/${carId}` : "/api/cars", {
        method: carId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          title: computedTitle,
        }),
      });
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(message);
      }
      const payload = (await res.json().catch(() => ({}))) as { data?: { id?: string } };
      const newCarId = carId ?? payload?.data?.id;

      if (newCarId && removedExistingPhotos.length > 0) {
        setUploading(true);
        await removeExistingPhotos(newCarId, removedExistingPhotos);
      }

      if (newCarId && files.length > 0) {
        setUploading(true);
        await uploadPhotos(newCarId, files, existingPhotosState.length);
      }

      router.push(redirectPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save car");
    } finally {
      setUploading(false);
    }
  };

  const selectedFeatures = watch("features") || [];
  const brandValue = watch("brand");
  const modelValue = watch("model");
  const yearValue = watch("car_year");
  const totalPhotos = existingPhotosState.length + files.length;
  const remainingSlots = Math.max(MAX_PHOTOS - existingPhotosState.length - files.length, 0);
  const autoTitlePreview = buildListingTitlePreview(brandValue, modelValue, yearValue);
  const filePreviews = useMemo(
    () =>
      files.map((file, index) => ({
        key: `${file.name}-${file.lastModified}-${file.size}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [filePreviews]);

  const handleFileSelection = (selected: File[]) => {
    if (selected.length === 0) return;
    const room = Math.max(MAX_PHOTOS - existingPhotosState.length - files.length, 0);
    if (room <= 0) {
      setError(`You already have ${MAX_PHOTOS} photos. Remove one before adding another.`);
      return;
    }

    const deduped = selected.filter(
      (file) =>
        !files.some(
          (current) =>
            current.name === file.name &&
            current.size === file.size &&
            current.lastModified === file.lastModified,
        ),
    );

    const nextFiles = [...files, ...deduped.slice(0, room)];
    setFiles(nextFiles);
    if (deduped.length > room) {
      setError(`Only ${MAX_PHOTOS} photos are allowed. Extra files were ignored.`);
    } else {
      setError(null);
    }
  };

  const removeSelectedFile = (index: number) => {
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const removeExistingPhoto = (photoId: string) => {
    const photo = existingPhotosState.find((item) => item.id === photoId);
    if (!photo) return;

    setExistingPhotosState((prev) => prev.filter((item) => item.id !== photoId));
    setRemovedExistingPhotos((prev) =>
      prev.some((item) => item.id === photo.id) ? prev : [...prev, photo],
    );
    setError(null);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Listing title (auto)</label>
          <div className="rounded-md border border-border bg-gray-50 px-3 py-2 text-sm font-semibold text-foreground">
            {autoTitlePreview}
          </div>
          <p className="text-xs text-gray-600">Generated automatically from brand, model and year.</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Daily price (GHS)</label>
          <Input type="number" min={50} {...register("daily_price", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Region</label>
          <Select
            value={watch("region") ?? ""}
            onChange={(e) => {
              setValue("region", e.target.value);
              setValue("city", "");
            }}
          >
            <option value="">Select region</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">City</label>
          <Select
            value={watch("city") ?? ""}
            onChange={(e) => setValue("city", e.target.value)}
            disabled={!watch("region")}
          >
            <option value="">Select city</option>
            {(citiesByRegion[watch("region") ?? ""] ?? []).map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
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
          <label className="text-sm font-semibold text-gray-700">Brand *</label>
          <Select
            value={watch("brand") ?? ""}
            onChange={(e) => {
              setValue("brand", e.target.value, { shouldValidate: true });
              setValue("model", "", { shouldValidate: true });
            }}
          >
            <option value="">Select brand</option>
            {makes.map((make) => (
              <option key={make.id} value={make.name}>
                {make.name}
              </option>
            ))}
          </Select>
          {errors.brand?.message ? <p className="text-xs text-red-600">{errors.brand.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Model *</label>
          <Select
            value={watch("model") ?? ""}
            onChange={(e) => setValue("model", e.target.value, { shouldValidate: true })}
            disabled={!watch("brand")}
          >
            <option value="">Select model</option>
            {(makes.find((make) => make.name === watch("brand"))?.models ?? []).map((model) => (
              <option key={model.id} value={model.name}>
                {model.name}
              </option>
            ))}
          </Select>
          {errors.model?.message ? <p className="text-xs text-red-600">{errors.model.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Seats</label>
          <Input type="number" min={2} max={8} {...register("seats", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Car year *</label>
          <Input
            type="number"
            min={2000}
            max={new Date().getFullYear() + 1}
            required
            {...register("car_year", { valueAsNumber: true })}
          />
          {errors.car_year?.message ? <p className="text-xs text-red-600">{errors.car_year.message}</p> : null}
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
          <Select {...register("fuel_type")}>
            <option value="">Select fuel</option>
            {fuelTypes.map((fuel) => (
              <option key={fuel} value={fuel}>
                {fuel.charAt(0).toUpperCase() + fuel.slice(1)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Cancellation policy</label>
          <Select {...register("cancellation_policy")}>
            <option value="flexible">Flexible</option>
            <option value="moderate">Moderate</option>
            <option value="strict">Strict</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Delivery fee (GHS)</label>
          <Input type="number" min={0} {...register("delivery_fee", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Insurance fee (GHS)</label>
          <Input type="number" min={0} {...register("insurance_fee", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Deposit amount (GHS)</label>
          <Input type="number" min={0} {...register("deposit_amount", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Description</label>
        <Textarea rows={4} placeholder="Describe your car, pickup and rules" {...register("description")} />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">Features</label>
        <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-gray-50 p-3 text-sm sm:grid-cols-2">
          {priorityFeatures.map((feature) => {
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

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Photos</label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            handleFileSelection(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <p className="text-xs text-gray-600">
          Upload between {MIN_PHOTOS} and {MAX_PHOTOS} photos. Add clear exterior/interior photos
          before saving.
        </p>
        <div className="rounded-lg border border-border bg-gray-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Listing quality checklist</p>
          <div className="mt-2 space-y-1 text-xs text-gray-700">
            {qualityChecklist.map((item, idx) => {
              const done = idx === 4 ? true : totalPhotos > idx;
              return (
                <p key={item} className={done ? "text-emerald-700" : "text-gray-600"}>
                  {done ? "Done" : "Pending"} - {item}
                </p>
              );
            })}
            <p className="text-amber-700">Plate blur automatically: Coming soon.</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-gray-700">
          Photos total: {totalPhotos} / {MIN_PHOTOS} minimum / {MAX_PHOTOS} max
        </p>
        {remainingSlots > 0 ? (
          <p className="text-xs text-gray-600">You can add {remainingSlots} more photo(s).</p>
        ) : (
          <p className="text-xs text-amber-700">Photo limit reached.</p>
        )}
        {existingPhotosState.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-gray-700">{existingPhotosState.length} current photo(s)</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {existingPhotosState.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded border border-border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="Current car photo" className="h-24 w-full object-cover" loading="lazy" />
                  <div className="flex items-center justify-between gap-2 px-2 py-1 text-xs text-gray-700">
                    <span className="truncate">Current photo</span>
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(photo.id)}
                      className="shrink-0 font-semibold text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {filePreviews.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-gray-700">{filePreviews.length} new file(s) selected</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filePreviews.map((preview, index) => (
                <div key={preview.key} className="overflow-hidden rounded border border-border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="h-24 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="flex items-center justify-between gap-2 px-2 py-1 text-xs text-gray-700">
                    <span className="truncate">{preview.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="shrink-0 font-semibold text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
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

      <div className="flex items-center justify-between rounded-lg border border-border bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Instant Book</p>
          <p className="text-xs text-gray-600">Enable to auto-confirm bookings after payment.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("instant_book")} />
          Instant Book
        </label>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Delivery available</p>
          <p className="text-xs text-gray-600">Allow guests to request delivery for this car.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("delivery_available")} />
          Delivery
        </label>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Air conditioning</p>
          <p className="text-xs text-gray-600">Flag this listing as air-conditioned.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("air_conditioning")} />
          AC
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting || uploading ? "Saving..." : "Save car"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push(redirectPath)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

async function uploadPhotos(carId: string, files: File[], existingPhotoCount = 0) {
  if (existingPhotoCount + files.length > MAX_PHOTOS) {
    throw new Error(`Maximum ${MAX_PHOTOS} photos allowed per listing.`);
  }
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to upload photos");
  const bucket = getPhotoBucketName();

  for (const file of files) {
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${carId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    const { error: insertError } = await supabase.from("car_photos").insert({ car_id: carId, url: publicUrl });
    if (insertError) throw insertError;
  }
}

async function removeExistingPhotos(carId: string, photosToRemove: ExistingPhoto[]) {
  if (photosToRemove.length === 0) return;

  const supabase = createSupabaseBrowserClient();
  const photoIds = photosToRemove.map((photo) => photo.id);
  const { error: rowDeleteError } = await supabase
    .from("car_photos")
    .delete()
    .eq("car_id", carId)
    .in("id", photoIds);

  if (rowDeleteError) {
    throw rowDeleteError;
  }

  const bucket = getPhotoBucketName();
  const paths = photosToRemove
    .map((photo) => getStoragePathFromPublicUrl(photo.url, bucket))
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    await supabase.storage.from(bucket).remove(paths);
  }
}

function getPhotoBucketName() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET ||
    "car-photos"
  );
}

function getStoragePathFromPublicUrl(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    const prefix = `/storage/v1/object/public/${bucket}/`;
    const start = url.pathname.indexOf(prefix);
    if (start === -1) return null;
    return decodeURIComponent(url.pathname.slice(start + prefix.length));
  } catch {
    return null;
  }
}
