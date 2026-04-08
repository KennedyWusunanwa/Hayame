"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useLocations } from "@/lib/use-locations";

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  region: z.string().min(2),
  city: z.string().min(2),
});

type FormValues = z.infer<typeof schema>;
const EMAIL_CONFIRMATION_REDIRECT_URL =
  process.env.NEXT_PUBLIC_AUTH_CONFIRMATION_REDIRECT_URL ??
  "https://www.hayamegh.com";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { regions, citiesByRegion } = useLocations();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      region: "",
      city: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setInfo(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const fullName = `${values.firstName} ${values.lastName}`.trim();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT_URL,
          data: {
            full_name: fullName,
            first_name: values.firstName,
            last_name: values.lastName,
            city: values.city,
            region: values.region,
          },
        },
      });
      if (error) throw error;
      const userId = data.user?.id;
      const session = data.session;
      let avatarUrl: string | undefined;
      const bucket =
        process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET ||
        process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
        "avatars";

      if (userId && session && avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${userId}/avatar-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, avatarFile, {
            cacheControl: "3600",
            upsert: true,
          });
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);
        avatarUrl = publicUrl;
      }

      if (userId && session) {
        const res = await fetch("/api/profiles/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: userId,
            first_name: values.firstName,
            last_name: values.lastName,
            full_name: fullName,
            city: values.city,
            avatar_url: avatarUrl ?? null,
          }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.message || "Unable to create profile");
        }
      }

      setInfo(
        "Check your email to verify your account. Verification link sent.",
      );
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message ?? "Unable to sign up");
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md border border-border shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">
            Create account
          </CardTitle>
          <p className="text-sm text-gray-600">
            Join Ghana&apos;s trusted car sharing network.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                First name
              </label>
              <Input placeholder="Ama" {...register("firstName")} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Last name
              </label>
              <Input placeholder="Owusu" {...register("lastName")} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Region
              </label>
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
              <label className="text-sm font-semibold text-gray-700">
                City / Location
              </label>
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
              <label className="text-sm font-semibold text-gray-700">
                Profile photo (optional)
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Add a clear headshot; you can change this later.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-3 text-xs font-semibold text-gray-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {info ? <p className="text-sm text-green-700">{info}</p> : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Sign up"}
            </Button>
            <p className="text-sm text-gray-600">
              Already registered?{" "}
              <Link href="/auth/login" className="font-semibold text-primary">
                Log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
