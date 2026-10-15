"use client";

import { useActionState, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  createAdminAccountAction,
  resetAdminPasswordAction,
  type TeamActionState,
} from "@/app/admin/team/actions";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import {
  dangerButtonClass,
  inputClass,
  primaryButtonClass,
} from "@/components/admin/admin-ui";
import { ADMIN_ROLES, ROLE_META } from "@/lib/admin-permissions";

function TempPassword({ state }: { state: NonNullable<TeamActionState> }) {
  const [copied, setCopied] = useState(false);
  if (!state.ok || !state.tempPassword) return null;
  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-emerald-900">
        Temporary password for {state.email}. Shown once. Send it privately (not by email).
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="rounded-lg bg-white px-3 py-2 font-mono text-sm font-bold tracking-wide text-[#0A2B54]">
          {state.tempPassword}
        </code>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(state.tempPassword ?? "");
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-900"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-2 text-xs text-emerald-900/80">
        They must choose their own password the first time they sign in.
      </p>
    </div>
  );
}

export function CreateAdminForm() {
  const [state, action] = useActionState<TeamActionState, FormData>(createAdminAccountAction, null);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold" htmlFor="ta-name">Full name</label>
          <input id="ta-name" name="name" required className={`${inputClass} mt-1.5`} placeholder="Ama Owusu" />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="ta-email">Work email</label>
          <input id="ta-email" name="email" type="email" required className={`${inputClass} mt-1.5`} placeholder="ama@hayamegh.com" />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="ta-role">Role</label>
        <select id="ta-role" name="role" defaultValue="support" className={`${inputClass} mt-1.5`}>
          {ADMIN_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_META[role].label}: {ROLE_META[role].description}
            </option>
          ))}
        </select>
      </div>
      {state?.error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {state.error}
        </p>
      ) : null}
      <PendingSubmitButton pendingLabel="Creating…" className={primaryButtonClass}>
        Create admin account
      </PendingSubmitButton>
      {state ? <TempPassword state={state} /> : null}
    </form>
  );
}

export function ResetPasswordForm({ id }: { id: string }) {
  const [state, action] = useActionState<TeamActionState, FormData>(resetAdminPasswordAction, null);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <PendingSubmitButton pendingLabel="Resetting…" className={dangerButtonClass}>
        Reset password
      </PendingSubmitButton>
      {state?.error ? <p className="mt-2 text-xs font-medium text-red-700">{state.error}</p> : null}
      {state ? <TempPassword state={state} /> : null}
    </form>
  );
}
