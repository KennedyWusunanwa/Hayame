"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  carId: string;
};

const MAX_PHOTOS = 7;

export function PhotoUploader({ carId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "car-photos";

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;
    setError(null);
    const room = Math.max(MAX_PHOTOS - photos.length, 0);
    if (room <= 0) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }
    const files = selectedFiles.slice(0, room);
    if (selectedFiles.length > room) {
      setError(`Only ${MAX_PHOTOS} photos are allowed. Extra files were ignored.`);
    }

    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const supa = supabase as any;
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError ?? new Error("Please sign in");

      const uploaded: string[] = [];
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

        const { error: insertError } = await supa.from("car_photos").insert({ car_id: carId, url: publicUrl });
        if (insertError) throw insertError;

        uploaded.push(publicUrl);
      }

      setPhotos((prev) => [...prev, ...uploaded]);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Load existing photos
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const supa = supabase as any;
        const { data } = await supa.from("car_photos").select("url").eq("car_id", carId);
        if (data) {
          setPhotos(data.map((p: { url: string }) => p.url));
        }
      } catch (error) {
        // ignore missing env in preview mode
      }
    };
    loadPhotos();
  }, [carId]);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Photos</p>
          <p className="text-xs text-gray-600">Upload up to {MAX_PHOTOS} photos to the car-photos bucket.</p>
        </div>
        <label className="text-sm font-semibold text-primary">
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
          <span className="cursor-pointer rounded-md border border-border px-3 py-2">
            {uploading ? "Uploading..." : "Add photo"}
          </span>
        </label>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-xs text-gray-600">
        {photos.length} / {MAX_PHOTOS} photos uploaded
      </p>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url) => (
          <div key={url} className="relative h-24 overflow-hidden rounded-md border border-border">
            <Image src={url} alt="Car photo" fill className="object-cover" sizes="120px" />
          </div>
        ))}
        {!photos.length ? <p className="text-xs text-gray-600">No photos yet.</p> : null}
      </div>
    </div>
  );
}
