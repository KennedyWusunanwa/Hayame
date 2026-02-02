"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLocations } from "@/lib/use-locations";

type HostApplicationFormProps = {
  disabled?: boolean;
  initialStatus?: "pending" | "approved" | "rejected" | null;
  initialReason?: string | null;
};

export function HostApplicationForm({
  disabled = false,
  initialStatus = null,
  initialReason = null,
}: HostApplicationFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [fleetSize, setFleetSize] = useState("");
  const [note, setNote] = useState("");
  const [idFrontPath, setIdFrontPath] = useState("");
  const [idBackPath, setIdBackPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { regions, citiesByRegion, loading: locationsLoading, error: locationsError } = useLocations({
    strict: true,
  });
  const cities = useMemo(() => citiesByRegion[region] ?? [], [citiesByRegion, region]);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone, city")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.full_name) setFullName(profile.full_name);
        if (profile?.phone) setPhone(profile.phone);
        if (profile?.city) setCity(profile.city);
      } catch {
        // ignore
      }
    };
    hydrate();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    setError(null);
    setSuccess(false);

    try {
      setLoading(true);
      const res = await fetch("/api/host-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          region,
          city,
          id_type: idType,
          id_number: idNumber,
          id_front_path: idFrontPath,
          id_back_path: idBackPath,
          note: note || undefined,
          experience,
          fleet_size: fleetSize ? Number(fleetSize) : undefined,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message ?? "Unable to submit application.");
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Unable to submit application.");
    } finally {
      setLoading(false);
    }
  };

  const isLocked = disabled || loading || uploading;
  const canSubmit =
    !disabled &&
    fullName &&
    phone &&
    region &&
    city &&
    idType &&
    idNumber &&
    idFrontPath &&
    idBackPath &&
    experience.length >= 10;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {initialStatus === "rejected" && initialReason ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Previous application rejected: {initialReason}
        </p>
      ) : null}
      {initialStatus === "pending" ? (
        <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Your application is under review. We will notify you once it is approved.
        </p>
      ) : null}

      <div>
        <label className="text-sm font-semibold text-foreground">Full name</label>
        <input
          className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={isLocked}
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-foreground">Phone</label>
          <input
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={isLocked}
            required
          />
        </div>
      <div>
        <label className="text-sm font-semibold text-foreground">Region</label>
        <select
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            value={region}
            onChange={(event) => {
              setRegion(event.target.value);
              setCity("");
            }}
          disabled={isLocked || locationsLoading || Boolean(locationsError)}
          required
        >
          <option value="">Select region</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {locationsError ? <p className="mt-1 text-xs text-red-600">{locationsError}</p> : null}
      </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">City</label>
        <select
          className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          disabled={isLocked || !region}
          required
        >
          <option value="">Select city</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-foreground">ID type</label>
          <select
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            value={idType}
            onChange={(event) => setIdType(event.target.value)}
            disabled={isLocked}
            required
          >
            <option value="">Select ID type</option>
            <option value="Ghana Card">Ghana Card</option>
            <option value="NHIS">NHIS</option>
            <option value="Voters ID">Voters ID</option>
            <option value="Driving Licence">Driving Licence</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">ID number</label>
          <input
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            value={idNumber}
            onChange={(event) => setIdNumber(event.target.value)}
            disabled={isLocked}
            required
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-foreground">ID front image</label>
          <input
            type="file"
            accept="image/*"
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm"
            onChange={(event) => handleIdUpload(event.target.files?.[0] ?? null, "front", setIdFrontPath, setError, setUploading)}
            disabled={isLocked}
            required
          />
          {idFrontPath ? <p className="mt-1 text-xs text-gray-600">Uploaded</p> : null}
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">ID back image</label>
          <input
            type="file"
            accept="image/*"
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm"
            onChange={(event) => handleIdUpload(event.target.files?.[0] ?? null, "back", setIdBackPath, setError, setUploading)}
            disabled={isLocked}
            required
          />
          {idBackPath ? <p className="mt-1 text-xs text-gray-600">Uploaded</p> : null}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">Hosting experience</label>
        <Textarea
          className="mt-2"
          rows={4}
          value={experience}
          onChange={(event) => setExperience(event.target.value)}
          placeholder="Tell us about your driving/hosting experience and the kind of cars you want to list."
          disabled={isLocked}
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-foreground">Fleet size</label>
          <input
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            value={fleetSize}
            onChange={(event) => setFleetSize(event.target.value)}
            disabled={isLocked}
            type="number"
            min={0}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Notes</label>
          <input
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={isLocked}
            placeholder="Anything else to share?"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">Application submitted successfully.</p> : null}

      <Button type="submit" disabled={!canSubmit || isLocked}>
        {loading ? "Submitting..." : uploading ? "Uploading..." : "Submit application"}
      </Button>
    </form>
  );
}

async function handleIdUpload(
  file: File | null,
  side: "front" | "back",
  setPath: (path: string) => void,
  setError: (msg: string | null) => void,
  setUploading: (value: boolean) => void,
) {
  if (!file) return;
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024;
  if (!allowed.includes(file.type)) {
    setError("Only JPG, PNG, or WebP images are allowed.");
    return;
  }
  if (file.size > maxSize) {
    setError("File too large. Max size is 5MB.");
    return;
  }

  try {
    setUploading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Please sign in to upload files.");

    const bucket = process.env.NEXT_PUBLIC_SUPABASE_HOST_ID_BUCKET || "host-ids";
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}-${side}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (uploadError) throw uploadError;
    setPath(path);
  } catch (err: any) {
    setError(err.message ?? "Upload failed.");
  } finally {
    setUploading(false);
  }
}
