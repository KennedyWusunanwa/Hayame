"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Lock, Mail, User } from "lucide-react";
import { useLocations } from "@/lib/use-locations";
import { gradePassword } from "@/lib/password";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  AuthAlert,
  AuthField,
  AuthPasswordField,
  AuthSubmitButton,
  PasswordStrengthMeter,
} from "@/components/auth/auth-fields";

const SELECT_CLASS =
  "h-12 w-full rounded-xl border border-border bg-white px-3.5 text-sm text-foreground transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

export default function SignupPage() {
  const { regions, citiesByRegion } = useLocations();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => gradePassword(password), [password]);
  const mismatch =
    confirmPassword.length > 0 && confirmPassword !== password
      ? "Those passwords don't match."
      : null;

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);

      if (!strength.meetsPolicy) {
        setError("Please choose a stronger password — see the checklist below.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Those passwords don't match.");
        return;
      }

      setSubmitting(true);
      try {
        // Same endpoint the iOS app uses, so there is one signup code path:
        // one place that creates the account, sends the branded verification
        // email, and writes the profile row.
        const res = await fetch("/api/mobile/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            city,
            region,
          }),
        });
        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(
            payload.message ?? "We couldn't create your account. Please try again.",
          );
          return;
        }
        setDone(true);
      } catch {
        setError("We couldn't create your account. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      city,
      confirmPassword,
      email,
      firstName,
      lastName,
      password,
      region,
      strength.meetsPolicy,
    ],
  );

  if (done) {
    return (
      <AuthShell active="signup">
        <div className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl text-green-700">
            ✓
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Check your email
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            We&apos;ve sent a verification link to{" "}
            <strong className="text-foreground">{email}</strong>. Click it to
            activate your account, then sign in.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Nothing yet? Check your spam folder — it can take a minute to
            arrive.
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brandHover"
          >
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell active="signup">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h2>
        <p className="mt-1.5 text-sm text-gray-600">
          Start renting in minutes.
        </p>

        <form className="mt-6 space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              label="First name"
              icon={User}
              placeholder="Ama"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <AuthField
              label="Last name"
              placeholder="Owusu"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <AuthField
            label="Email address"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Region
              </label>
              <select
                className={SELECT_CLASS}
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setCity("");
                }}
                required
              >
                <option value="">Select region</option>
                {regions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                City
              </label>
              <select
                className={SELECT_CLASS}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!region}
                required
              >
                <option value="">Select city</option>
                {(citiesByRegion[region] ?? []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <AuthPasswordField
              label="Password"
              icon={Lock}
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <PasswordStrengthMeter value={password} />
          </div>

          <AuthPasswordField
            label="Confirm password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={mismatch}
            required
          />

          <AuthAlert tone="error">{error}</AuthAlert>

          <AuthSubmitButton loading={submitting}>
            {submitting ? "Creating account…" : "Create Account"}
          </AuthSubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already registered?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-brand hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
