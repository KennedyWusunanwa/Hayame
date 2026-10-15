"use client";

import { useActionState } from "react";
import { changeOwnPasswordAction, type PasswordState } from "@/app/admin/account/actions";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { inputClass, primaryButtonClass } from "@/components/admin/admin-ui";

export function PasswordForm({ forced }: { forced: boolean }) {
  const [state, action] = useActionState<PasswordState, FormData>(changeOwnPasswordAction, null);
  return (
    <form action={action} className="max-w-md space-y-4">
      <div>
        <label className="text-sm font-semibold" htmlFor="pw-current">{forced ? "Temporary password" : "Current password"}</label>
        <input id="pw-current" name="current" type="password" autoComplete="current-password" required className={`${inputClass} mt-1.5`} />
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="pw-next">New password</label>
        <input id="pw-next" name="next" type="password" autoComplete="new-password" required minLength={10} className={`${inputClass} mt-1.5`} />
        <p className="mt-1 text-xs text-gray-500">At least 10 characters with letters and numbers.</p>
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="pw-confirm">Confirm new password</label>
        <input id="pw-confirm" name="confirm" type="password" autoComplete="new-password" required className={`${inputClass} mt-1.5`} />
      </div>
      {state?.error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{state.error}</p>
      ) : null}
      <PendingSubmitButton pendingLabel="Saving…" className={primaryButtonClass}>Save new password</PendingSubmitButton>
    </form>
  );
}
