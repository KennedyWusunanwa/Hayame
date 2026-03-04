"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { type FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
import { carFormSchema } from "@/lib/validators";
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
// Vercel/Serverless request limits commonly fail on larger mobile photos before our API can respond.
const MAX_PHOTO_FILE_BYTES = 4 * 1024 * 1024;
const PHOTO_UPLOAD_TIMEOUT_MS = 30_000;

export function CarForm({ carId, defaultValues, redirectTo, existingPhotos = [] }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [photoWarning, setPhotoWarning] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [existingPhotosState, setExistingPhotosState] = useState<ExistingPhoto[]>(existingPhotos);
  const [draftCarId, setDraftCarId] = useState<string | null>(carId ?? null);
  const [photoMutatingId, setPhotoMutatingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const createMode = !carId;
  const redirectPath = redirectTo ?? "/host/cars";
  const postSubmitBasePath = redirectTo ?? "/host";
  const { regions, citiesByRegion } = useLocations();
  const { makes, error: carCatalogError } = useCarCatalog();
  const optionalNumberField = {
    setValueAs: parseOptionalNumberInput,
  } as const;
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
      seats: 5,
      transmission: "automatic",
      fuel_type: "petrol",
      features: [],
      is_available: true,
      instant_book: false,
      delivery_available: false,
      air_conditioning: false,
      cancellation_policy: "moderate",
      ...defaultValues,
      delivery_fee: normalizeOptionalFeeDefault(defaultValues?.delivery_fee),
      insurance_fee: normalizeOptionalFeeDefault(defaultValues?.insurance_fee),
      deposit_amount: normalizeOptionalFeeDefault(defaultValues?.deposit_amount),
      outside_accra_fee: normalizeOptionalFeeDefault(defaultValues?.outside_accra_fee),
    },
  });

  // Custom-controlled fields still need registration so validation/submission is consistent.
  useEffect(() => {
    register("region");
    register("city");
    register("brand");
    register("model");
    register("features");
  }, [register]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setPhotoWarning(null);
    const computedTitle = buildListingTitle(values.brand, values.model, values.car_year);
    if (!computedTitle) {
      setError("Brand, model and year are required to generate the listing title.");
      return;
    }
    const payloadValues = {
      ...values,
      // Only send delivery_fee when delivery is enabled.
      delivery_fee: values.delivery_available ? values.delivery_fee : undefined,
    };

    const totalPhotos = existingPhotosState.length + files.length;
    const nonBlockingWarnings: string[] = [];
    if (totalPhotos < MIN_PHOTOS) {
      nonBlockingWarnings.push(
        `Submitted with ${totalPhotos} photo(s). Listings usually pass approval faster with at least ${MIN_PHOTOS} clear photos.`,
      );
    }
    if (totalPhotos > MAX_PHOTOS) {
      nonBlockingWarnings.push(
        `Only ${MAX_PHOTOS} photos can be kept per listing. Extra files will be skipped during upload.`,
      );
    }
    try {
      const targetCarId = carId ?? draftCarId;
      const res = await fetch(targetCarId ? `/api/cars/${targetCarId}` : "/api/cars", {
        method: targetCarId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payloadValues,
          title: computedTitle,
        }),
      });
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(message);
      }
      const payload = (await res.json().catch(() => ({}))) as { data?: { id?: string } };
      const newCarId = targetCarId ?? payload?.data?.id;
      if (!carId && newCarId) {
        setDraftCarId(newCarId);
      }

      if (newCarId && files.length > 0) {
        setUploading(true);
        const uploadResult = await uploadPhotos(newCarId, files, existingPhotosState.length, ({ uploadedPhoto, file }) => {
          setExistingPhotosState((prev) => [...prev, uploadedPhoto]);
          setFiles((prev) => prev.filter((candidate) => candidate !== file));
        });
        if (uploadResult.warning) {
          nonBlockingWarnings.push(uploadResult.warning);
        }
      }

      if (nonBlockingWarnings.length > 0) {
        setPhotoWarning(nonBlockingWarnings.join(" "));
      }

      const postSubmitRedirectPath = buildPostSubmitRedirectPath(
        postSubmitBasePath,
        createMode ? "submitted" : "updated",
      );
      navigateAfterSubmit(router, postSubmitRedirectPath);
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
  const deliveryAvailable = watch("delivery_available") ?? false;
  const totalPhotos = existingPhotosState.length + files.length;
  const remainingSlots = Math.max(MAX_PHOTOS - existingPhotosState.length - files.length, 0);
  const autoTitlePreview = buildListingTitlePreview(brandValue, modelValue, yearValue);
  const submitButtonLabel = uploading
    ? "Uploading photos..."
    : isSubmitting
      ? createMode
        ? "Submitting listing..."
        : "Saving..."
      : createMode
        ? "Submit car"
        : "Save car";
  const submitProgressMessage = uploading
    ? createMode
      ? "Uploading photos and finalizing your listing. You will be redirected to your dashboard when it is submitted."
      : "Uploading photos and finalizing your changes."
    : isSubmitting
      ? createMode
        ? "Submitting your car ad..."
        : "Saving your changes..."
      : null;
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

  useEffect(() => {
    if (!deliveryAvailable) {
      setValue("delivery_fee", undefined, { shouldDirty: true });
    }
  }, [deliveryAvailable, setValue]);

  const handleFileSelection = (selected: File[]) => {
    if (selected.length === 0) return;
    const room = Math.max(MAX_PHOTOS - existingPhotosState.length - files.length, 0);
    if (room <= 0) {
      setPhotoWarning(`You already have ${MAX_PHOTOS} photos. Remove one before adding another.`);
      return;
    }

    const oversized = selected.filter((file) => file.size > MAX_PHOTO_FILE_BYTES);
    const allowedBySize = selected.filter((file) => file.size <= MAX_PHOTO_FILE_BYTES);
    const deduped = allowedBySize.filter(
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
    if (oversized.length > 0) {
      const largestMb = Math.max(...oversized.map((file) => file.size)) / (1024 * 1024);
      setPhotoWarning(
        `Some photos are too large to upload. Please use images under 4MB each (largest selected: ${largestMb.toFixed(1)}MB).`,
      );
    } else if (deduped.length > room) {
      setPhotoWarning(`Only ${MAX_PHOTOS} photos are allowed. Extra files were ignored.`);
    } else {
      setPhotoWarning(null);
    }
  };

  const removeSelectedFile = (index: number) => {
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const onInvalidSubmit = (formErrors: FieldErrors<FormValues>) => {
    setError(getFirstFormValidationMessage(formErrors));
  };

  const removeExistingPhoto = async (photoId: string) => {
    const photo = existingPhotosState.find((item) => item.id === photoId);
    if (!photo) return;
    const managedCarId = carId ?? draftCarId;

    if (!managedCarId) {
      setExistingPhotosState((prev) => prev.filter((item) => item.id !== photoId));
      setError(null);
      return;
    }

    setPhotoMutatingId(photoId);
    setError(null);
    try {
      const res = await fetch(`/api/cars/${managedCarId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "Unable to delete photo");
      }
      setExistingPhotosState((prev) => prev.filter((item) => item.id !== photoId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to delete photo");
    } finally {
      setPhotoMutatingId((current) => (current === photoId ? null : current));
    }
  };

  const replaceExistingPhoto = async (photoId: string, file: File) => {
    const managedCarId = carId ?? draftCarId;
    if (!managedCarId) return;
    if (file.size > MAX_PHOTO_FILE_BYTES) {
      setPhotoWarning("Photo is too large to upload. Please use an image under 4MB.");
      return;
    }
    setPhotoMutatingId(photoId);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("replacePhotoId", photoId);

      const res = await fetch(`/api/cars/${managedCarId}/photos`, {
        method: "POST",
        body: formData,
      });
      const payload = (await parseApiResponsePayload(res)) as { message?: string; data?: ExistingPhoto };
      if (!res.ok) {
        throw new Error(payload.message ?? mapUploadErrorMessage(res.status, "Unable to replace photo"));
      }
      if (!payload.data?.url) {
        throw new Error("Photo replacement failed");
      }

      setExistingPhotosState((prev) =>
        prev.map((photo) => (photo.id === photoId ? { id: photo.id, url: payload.data!.url } : photo)),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to replace photo");
    } finally {
      setPhotoMutatingId((current) => (current === photoId ? null : current));
    }
  };

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}>
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
          {errors.daily_price?.message ? (
            <p className="text-xs text-red-600">{errors.daily_price.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Region</label>
          <Select
            value={watch("region") ?? ""}
            onChange={(e) => {
              setValue("region", e.target.value, { shouldDirty: true, shouldValidate: true });
              setValue("city", "", { shouldDirty: true, shouldValidate: true });
            }}
          >
            <option value="">Select region</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </Select>
          {errors.region?.message ? <p className="text-xs text-red-600">{errors.region.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">City</label>
          <Select
            value={watch("city") ?? ""}
            onChange={(e) => setValue("city", e.target.value, { shouldDirty: true, shouldValidate: true })}
            disabled={!watch("region")}
          >
            <option value="">Select city</option>
            {(citiesByRegion[watch("region") ?? ""] ?? []).map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
          {errors.city?.message ? <p className="text-xs text-red-600">{errors.city.message}</p> : null}
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
              setValue("brand", e.target.value, { shouldDirty: true, shouldValidate: true });
              setValue("model", "", { shouldDirty: true, shouldValidate: true });
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
          {carCatalogError ? (
            <p className="text-xs text-red-600">Car catalog failed to load. Refresh and try again.</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Model *</label>
          <Select
            value={watch("model") ?? ""}
            onChange={(e) => setValue("model", e.target.value, { shouldDirty: true, shouldValidate: true })}
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
          <label className="text-sm font-semibold text-gray-700">Delivery available</label>
          <div className="flex items-center justify-between rounded-md border border-border bg-white px-3 py-2">
            <p className="text-xs text-gray-600">Enable this first to set a delivery charge.</p>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" {...register("delivery_available")} />
              Delivery
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Delivery fee (GHS)</label>
          <Input
            type="number"
            min={0}
            placeholder={deliveryAvailable ? "Enter delivery fee" : "Enable delivery to set fee"}
            disabled={!deliveryAvailable}
            {...register("delivery_fee", optionalNumberField)}
          />
          {!deliveryAvailable ? <p className="text-xs text-gray-500">Leave blank when delivery is off.</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Insurance fee (GHS)</label>
          <Input type="number" min={0} placeholder="0" {...register("insurance_fee", optionalNumberField)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Deposit amount (GHS)</label>
          <Input type="number" min={0} placeholder="0" {...register("deposit_amount", optionalNumberField)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Outside Accra surcharge (GHS)</label>
          <Input type="number" min={0} placeholder="0" {...register("outside_accra_fee", optionalNumberField)} />
          <p className="text-xs text-gray-500">
            Added automatically when the renter selects a trip use location outside Greater Accra.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Description</label>
        <Textarea rows={4} placeholder="Describe your car, pickup and rules" {...register("description")} />
        {errors.description?.message ? <p className="text-xs text-red-600">{errors.description.message}</p> : null}
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
                    setValue("features", Array.from(set), { shouldDirty: true });
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
                    setValue("features", Array.from(set), { shouldDirty: true });
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
          Recommended: upload {MIN_PHOTOS} to {MAX_PHOTOS} photos with clear exterior/interior coverage
          for faster approval.
        </p>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Photos are not auto-rejected during upload. Listings with low-quality photos (for example blurry shots,
          poor lighting, wrong framing/centering, or too few angles) may fail approval.
        </p>
        <p className="text-xs text-gray-600">
          If upload fails on mobile, use photos under 4MB each (phone images are sometimes too large).
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
          Photos total: {totalPhotos} / {MIN_PHOTOS} recommended minimum / {MAX_PHOTOS} max
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
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer font-semibold text-brand">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={photoMutatingId === photo.id}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void replaceExistingPhoto(photo.id, file);
                            }
                            event.currentTarget.value = "";
                          }}
                        />
                        {photoMutatingId === photo.id ? "Updating..." : "Replace"}
                      </label>
                      <button
                        type="button"
                        disabled={photoMutatingId === photo.id}
                        onClick={() => void removeExistingPhoto(photo.id)}
                        className="shrink-0 font-semibold text-red-600 disabled:opacity-60"
                      >
                        {photoMutatingId === photo.id ? "Working..." : "Remove"}
                      </button>
                    </div>
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {photoWarning ? <p className="text-sm text-amber-700">{photoWarning}</p> : null}
      {submitProgressMessage ? <p className="text-sm text-gray-600">{submitProgressMessage}</p> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting || uploading}>
          {submitButtonLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push(redirectPath)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

async function uploadPhotos(
  carId: string,
  files: File[],
  existingPhotoCount = 0,
  onUploaded?: (params: { uploadedPhoto: ExistingPhoto; file: File }) => void,
) {
  const sizeSkipped: string[] = [];
  const failedUploads: string[] = [];
  let skippedForLimit = 0;
  let currentPhotoCount = existingPhotoCount;

  for (const file of files) {
    if (currentPhotoCount >= MAX_PHOTOS) {
      skippedForLimit += 1;
      continue;
    }
    if (file.size > MAX_PHOTO_FILE_BYTES) {
      sizeSkipped.push(file.name);
      continue;
    }

    const formData = new FormData();
    formData.append("file", file);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PHOTO_UPLOAD_TIMEOUT_MS);
    try {
      const res = await fetch(`/api/cars/${carId}/photos`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const payload = (await parseApiResponsePayload(res)) as { message?: string; data?: ExistingPhoto };
      if (!res.ok) {
        throw new Error(payload.message ?? mapUploadErrorMessage(res.status, `Unable to upload "${file.name}"`));
      }
      if (!payload.data?.id || !payload.data?.url) {
        throw new Error(`Upload completed but no photo record was returned for "${file.name}".`);
      }
      currentPhotoCount += 1;
      onUploaded?.({ uploadedPhoto: payload.data, file });
    } catch {
      failedUploads.push(file.name);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const warningParts: string[] = [];
  if (sizeSkipped.length > 0) {
    warningParts.push(
      `${sizeSkipped.length} photo(s) were skipped because they exceed 4MB.`,
    );
  }
  if (skippedForLimit > 0) {
    warningParts.push(
      `${skippedForLimit} photo(s) were skipped because the listing already reached ${MAX_PHOTOS} photos.`,
    );
  }
  if (failedUploads.length > 0) {
    warningParts.push(
      `${failedUploads.length} photo(s) could not be uploaded. You can update the listing later to retry.`,
    );
  }

  return {
    warning: warningParts.join(" "),
  };
}

async function parseApiResponsePayload(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json().catch(() => ({}));
  }

  const text = await res.text().catch(() => "");
  return text ? { message: text.slice(0, 200) } : {};
}

function mapUploadErrorMessage(status: number, fallback: string) {
  if (status === 413) {
    return "Photo upload failed because the image file is too large. Please use a photo under 4MB.";
  }
  if (status === 401) return "Your session expired. Please refresh the page and try again.";
  if (status === 403) return "You do not have permission to upload photos for this car.";
  return fallback;
}

function getFirstFormValidationMessage(errors: FieldErrors<FormValues>) {
  const orderedFields: Array<{ key: keyof FormValues; label: string }> = [
    { key: "region", label: "Region" },
    { key: "city", label: "City" },
    { key: "brand", label: "Brand" },
    { key: "model", label: "Model" },
    { key: "car_year", label: "Car year" },
    { key: "daily_price", label: "Daily price" },
    { key: "description", label: "Description" },
    { key: "seats", label: "Seats" },
  ];

  for (const field of orderedFields) {
    const entry = errors[field.key];
    const message = entry && typeof entry === "object" && "message" in entry ? entry.message : undefined;
    if (typeof message === "string" && message.trim()) {
      return `${field.label}: ${message}`;
    }
  }

  return "Please complete the required fields and fix any errors, then try again.";
}

function parseOptionalNumberInput(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeOptionalFeeDefault(value: unknown) {
  const parsed = parseOptionalNumberInput(value);
  if (parsed === undefined) return undefined;
  return parsed === 0 ? undefined : parsed;
}

function buildPostSubmitRedirectPath(basePath: string, notice: "submitted" | "updated") {
  if (!basePath.startsWith("/host/cars")) return basePath;

  const [pathWithQuery, hash = ""] = basePath.split("#");
  const [pathname, query = ""] = pathWithQuery.split("?");
  const search = new URLSearchParams(query);
  search.set("notice", notice);
  const nextQuery = search.toString();

  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}

function navigateAfterSubmit(router: ReturnType<typeof useRouter>, targetPath: string) {
  router.replace(targetPath);
  router.refresh();

  if (typeof window === "undefined") return;
  const targetUrl = new URL(targetPath, window.location.origin);
  window.setTimeout(() => {
    if (
      window.location.pathname !== targetUrl.pathname ||
      window.location.search !== targetUrl.search ||
      window.location.hash !== targetUrl.hash
    ) {
      window.location.assign(targetUrl.toString());
    }
  }, 900);
}
