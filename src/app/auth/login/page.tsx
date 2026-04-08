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

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) throw error;
      router.push("/");
    } catch (err: any) {
      setError(err.message ?? "Unable to sign in");
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md border border-border shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">
            Log in
          </CardTitle>
          <p className="text-sm text-gray-600">Welcome back to Hayame.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Log in"}
            </Button>
            <p className="text-sm text-gray-600">
              No account?{" "}
              <Link href="/auth/signup" className="font-semibold text-primary">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
