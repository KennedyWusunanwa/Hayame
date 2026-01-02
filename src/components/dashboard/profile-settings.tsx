"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { Loader2, Upload, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";

type Props = {
  userId: string;
  email: string;
  initialName: string;
  initialFirstName?: string;
  initialLastName?: string;
  initialAvatar?: string;
  initialCity?: string;
};

export function ProfileSettings({
  userId,
  email,
  initialName,
  initialFirstName,
  initialLastName,
  initialAvatar,
  initialCity,
}: Props) {
  const [firstName, setFirstName] = useState(initialFirstName ?? initialName.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(initialLastName ?? initialName.split(" ").slice(1).join(" "));
  const [city, setCity] = useState(initialCity ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const bucket =
    process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET ||
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
    "avatars";

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus(null);
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || auth.user.id !== userId) {
        throw new Error("Please sign in again to upload a photo.");
      }

      const ext = file.name.split(".").pop();
      const path = `${auth.user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);

      const supa = supabase as any;
      const { error: profileError } = await supa
        .from("profiles")
        .upsert(
          {
            id: auth.user.id,
            avatar_url: publicUrl,
            first_name: firstName || null,
            last_name: lastName || null,
            full_name: `${firstName} ${lastName}`.trim() || initialName,
            city: city || null,
          },
          { onConflict: "id" },
        );
      if (profileError) throw profileError;

      setAvatarUrl(publicUrl);
      setStatus("Photo updated");
    } catch (error: any) {
      setStatus(error.message ?? "Upload failed");
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const supa = supabase as any;
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || auth.user.id !== userId) {
        throw new Error("Please sign in again to save.");
      }
      const { error } = await supa
        .from("profiles")
        .upsert(
          {
            id: auth.user.id,
            first_name: firstName || null,
            last_name: lastName || null,
            full_name: `${firstName} ${lastName}`.trim() || initialName,
            avatar_url: avatarUrl || null,
            city: city || null,
          },
          { onConflict: "id" },
        );
      if (error) throw error;
      setStatus("Profile saved");
    } catch (error: any) {
      setStatus(error.message ?? "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={saveProfile}>
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-border bg-gray-50">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={initialName} fill className="object-cover" sizes="80px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(`${firstName} ${lastName}`) || <UserRound className="h-6 w-6" />}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Profile photo</p>
          <p className="text-xs text-gray-600">We recommend a clear headshot. JPG or PNG up to 2MB.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {saving ? "Uploading..." : "Upload photo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={saving}
            />
            {avatarUrl ? (
              <a href={avatarUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                View current
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">First name</label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ama" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Last name</label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Owusu" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Email</label>
          <Input value={email} disabled />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-gray-700">City (optional)</label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Accra, Greater Accra" />
        </div>
      </div>

      {status ? <p className="text-sm text-gray-700">{status}</p> : null}

      <Button type="submit" disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save profile"
        )}
      </Button>
    </form>
  );
}
