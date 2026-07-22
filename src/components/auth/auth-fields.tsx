"use client";

import { useId, useState } from "react";
import { Check, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { PASSWORD_RULES, gradePassword } from "@/lib/password";

const FIELD_BASE =
  "h-12 w-full rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-gray-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:cursor-not-allowed disabled:bg-gray-50";

export function AuthField({
  label,
  icon: Icon,
  error,
  className,
  ...props
}: {
  label: string;
  icon?: LucideIcon;
  error?: string | null;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-gray-700"
      >
        {label}
      </label>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        ) : null}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          className={`${FIELD_BASE} ${Icon ? "pl-10" : "pl-3.5"} pr-3.5 ${
            error ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""
          }`}
          {...props}
        />
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function AuthPasswordField({
  label,
  icon: Icon,
  error,
  className,
  ...props
}: {
  label: string;
  icon?: LucideIcon;
  error?: string | null;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-gray-700"
      >
        {label}
      </label>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        ) : null}
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          className={`${FIELD_BASE} ${Icon ? "pl-10" : "pl-3.5"} pr-11 ${
            error ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

const METER_COLORS = [
  "bg-gray-200",
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-600",
];

const LABEL_COLORS = [
  "text-gray-400",
  "text-red-600",
  "text-orange-600",
  "text-yellow-700",
  "text-green-700",
];

/**
 * Live strength readout for the signup password.
 *
 * Rules come from src/lib/password.ts, which the API validates against too, so
 * the meter can never green-light something the server will reject.
 */
export function PasswordStrengthMeter({ value }: { value: string }) {
  const { score, label } = gradePassword(value);
  if (!value) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                score >= step ? METER_COLORS[score] : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <span
          className={`text-xs font-semibold ${LABEL_COLORS[score]}`}
          role="status"
        >
          {label}
        </span>
      </div>

      <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(value);
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-1.5 text-xs ${
                met ? "text-green-700" : "text-gray-500"
              }`}
            >
              <span
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
                  met ? "bg-green-600 text-white" : "bg-gray-200"
                }`}
              >
                {met ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AuthSubmitButton({
  children,
  loading,
  ...props
}: { loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      className="h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brandHover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthAlert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-800"
      }`}
    >
      {children}
    </div>
  );
}
