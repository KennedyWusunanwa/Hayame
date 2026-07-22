"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  AuthAlert,
  AuthField,
  AuthPasswordField,
  AuthSubmitButton,
} from "@/components/auth/auth-fields";

type LoginResponse = {
  access_token?: string | null;
  refresh_token?: string | null;
  code?: string;
  message?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      setInfo(null);
      setErrorCode(null);
      setSubmitting(true);

      try {
        // Goes through our API rather than calling Supabase directly: the route
        // is what distinguishes "no account" from "wrong password" from
        // "unverified", and it rate-limits those answers.
        const res = await fetch("/api/mobile/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const payload = (await res.json().catch(() => ({}))) as LoginResponse;

        if (!res.ok || !payload.access_token || !payload.refresh_token) {
          setErrorCode(payload.code ?? null);
          setError(payload.message ?? "We couldn't log you in. Please try again.");
          return;
        }

        // Hand the tokens to the browser client so client components and the
        // auth cookie agree on who is signed in.
        const supabase = createSupabaseBrowserClient();
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
        });
        if (sessionError) throw sessionError;

        router.push("/");
        router.refresh();
      } catch {
        setError("We couldn't log you in. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, router],
  );

  const resendVerification = useCallback(async () => {
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/mobile/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await res.json().catch(() => ({}))) as LoginResponse;
      if (res.ok) {
        setErrorCode(null);
        setInfo(payload.message ?? "Verification email sent.");
      } else {
        setError(payload.message ?? "We couldn't resend that email.");
      }
    } catch {
      setError("We couldn't resend that email. Please try again.");
    } finally {
      setResending(false);
    }
  }, [email]);

  const requestReset = useCallback(async () => {
    if (!email.trim()) {
      setError("Enter your email address first, then tap Forgot password.");
      return;
    }
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/mobile/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await res.json().catch(() => ({}))) as LoginResponse;
      if (res.ok) setInfo(payload.message ?? "Password reset email sent.");
      else setError(payload.message ?? "We couldn't send that email.");
    } catch {
      setError("We couldn't send that email. Please try again.");
    }
  }, [email]);

  return (
    <AuthShell active="login">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Sign in to your account
        </h2>
        <p className="mt-1.5 text-sm text-gray-600">
          Welcome back to Hayame.
        </p>

        <form className="mt-6 space-y-5" onSubmit={onSubmit}>
          <AuthField
            label="Email address"
            icon={Mail}
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <AuthPasswordField
              label="Password"
              icon={Lock}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={requestReset}
                className="text-sm font-semibold text-brand hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <AuthAlert tone="error">{error}</AuthAlert>
          <AuthAlert tone="success">{info}</AuthAlert>

          {errorCode === "email_not_confirmed" ? (
            <button
              type="button"
              onClick={resendVerification}
              disabled={resending}
              className="w-full rounded-xl border border-brand bg-white px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-60"
            >
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          ) : null}

          <AuthSubmitButton loading={submitting}>
            {submitting ? "Signing in…" : "Sign In"}
          </AuthSubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          No account?{" "}
          <Link
            href="/auth/signup"
            className="font-semibold text-brand hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
