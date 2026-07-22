"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { friendlyError } from "@/lib/client-errors";

/**
 * Landing page for the "Choose a new password" button in a Hayame reset email.
 *
 * The link carries a `token_hash` that we redeem here with `verifyOtp`, which
 * establishes a short-lived session; `updateUser` then sets the new password.
 * Redeeming on our own domain means Supabase's Site URL / redirect allow-list
 * never enters the picture.
 */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");

  const [status, setStatus] = useState<
    "verifying" | "ready" | "invalid" | "done"
  >("verifying");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!tokenHash) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        if (cancelled) return;
        setStatus(verifyError ? "invalid" : "ready");
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tokenHash]);

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);

      if (password.length < 6) {
        setError("Your password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Those passwords don't match.");
        return;
      }

      setSaving(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) throw updateError;
        setStatus("done");
      } catch (err) {
        setError(friendlyError(err, "We couldn't update your password."));
      } finally {
        setSaving(false);
      }
    },
    [password, confirmPassword],
  );

  if (status === "verifying") {
    return <p className="text-sm text-gray-600">Checking your link…</p>;
  }

  if (status === "invalid") {
    return (
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          This reset link has expired or has already been used. Reset links are
          valid for one hour and work only once — request a new one from the log
          in screen.
        </p>
        <Button asChild className="w-full">
          <Link href="/auth/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          Your password has been updated. You can log in with it now.
        </p>
        <Button className="w-full" onClick={() => router.push("/auth/login")}>
          Go to log in
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">
          New password
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">
          Confirm new password
        </label>
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md border border-border shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">
            Choose a new password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={<p className="text-sm text-gray-600">Loading…</p>}
          >
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
