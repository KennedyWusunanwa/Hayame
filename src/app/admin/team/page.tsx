import { Check, Minus } from "lucide-react";
import { AdminNotice } from "@/components/admin/admin-notice";
import {
  Panel,
  PageHeader,
  RoleBadge,
  dangerButtonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/admin/admin-ui";
import { CreateAdminForm, ResetPasswordForm } from "@/components/admin/team-forms";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { isAdminAuthConfigured, requireAdmin } from "@/lib/admin-auth";
import {
  ADMIN_ROLES,
  PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_META,
  can,
  isAdminRole,
} from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { changeAdminRoleAction, setAdminActiveAction } from "./actions";

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  role: "Role updated. Every admin has been emailed.",
  deactivated: "Admin deactivated. They're signed out on their next click.",
  reactivated: "Admin reactivated.",
};

function isFuture(value: string | null) {
  return Boolean(value) && Date.parse(value as string) > Date.now();
}

function formatWhen(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " GMT";
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const me = await requireAdmin("team.manage");
  const params = await searchParams;

  const db = createSupabaseAdminClient() as any;
  const { data, error } = await db
    .from("admin_users")
    .select("id,email,full_name,role,active,last_login_at,last_login_ip,locked_until,created_by,created_at")
    .order("created_at", { ascending: true });
  const missingTable = Boolean(error && /admin_users/.test(error.message ?? ""));
  const team: any[] = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Team & roles"
        description="Give each person their own sign-in and the least access they need. Every important change here emails all admins."
      />

      {params.notice && NOTICES[params.notice] ? <AdminNotice tone="success" title={NOTICES[params.notice]} /> : null}
      {params.error ? <AdminNotice tone="error" title="That didn't work" description={params.error} /> : null}
      {missingTable ? (
        <AdminNotice
          tone="error"
          title="Team accounts aren't set up yet"
          description="Run db/admin_roles_audit.sql in the Supabase SQL editor, then reload this page."
        />
      ) : null}

      <Panel title="Add an admin" description="They get a welcome email. You get a temporary password to pass on privately.">
        <CreateAdminForm />
      </Panel>

      <Panel title={`People with access (${team.length + (isAdminAuthConfigured() ? 1 : 0)})`}>
        <div className="divide-y divide-border/70">
          {isAdminAuthConfigured() ? (
            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="text-sm font-semibold text-[#0A2B54]">Root admin <span className="font-normal text-gray-500">(set in hosting env)</span></p>
                <p className="text-xs text-gray-500">Always works as a safety net. Change its password in your environment variables.</p>
              </div>
              <RoleBadge role="super_admin" />
            </div>
          ) : null}
          {team.map((person) => {
            const self = person.id === me.id;
            const locked = isFuture(person.locked_until);
            return (
              <div key={person.id} className="space-y-3 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0A2B54]">
                      {person.full_name}
                      {self ? <span className="ml-2 text-xs font-medium text-gray-500">(you)</span> : null}
                      {!person.active ? <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-bold text-gray-700">Deactivated</span> : null}
                      {locked ? <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">Locked</span> : null}
                    </p>
                    <p className="text-xs text-gray-600">{person.email}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Last sign-in {formatWhen(person.last_login_at)}
                      {person.last_login_ip ? ` from ${person.last_login_ip}` : ""} · added by {person.created_by ?? "unknown"}
                    </p>
                  </div>
                  {isAdminRole(person.role) ? <RoleBadge role={person.role} /> : null}
                </div>
                {!self ? (
                  <div className="flex flex-wrap items-start gap-3">
                    <form action={changeAdminRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={person.id} />
                      <select name="role" defaultValue={person.role} className={`${inputClass} !w-44`} aria-label={`Role for ${person.full_name}`}>
                        {ADMIN_ROLES.map((role) => (
                          <option key={role} value={role}>{ROLE_META[role].label}</option>
                        ))}
                      </select>
                      <PendingSubmitButton pendingLabel="Saving…" className={secondaryButtonClass}>Change role</PendingSubmitButton>
                    </form>
                    <ResetPasswordForm id={person.id} />
                    <form action={setAdminActiveAction}>
                      <input type="hidden" name="id" value={person.id} />
                      <input type="hidden" name="active" value={person.active ? "false" : "true"} />
                      <PendingSubmitButton pendingLabel="Saving…" className={person.active ? dangerButtonClass : secondaryButtonClass}>
                        {person.active ? "Deactivate" : "Reactivate"}
                      </PendingSubmitButton>
                    </form>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="What each role can do">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4 font-semibold">Permission</th>
                {ADMIN_ROLES.map((role) => (
                  <th key={role} className="px-3 py-2 text-center font-semibold">{ROLE_META[role].label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((permission) => (
                <tr key={permission} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-4 text-gray-800">{PERMISSION_LABELS[permission]}</td>
                  {ADMIN_ROLES.map((role) => (
                    <td key={role} className="px-3 py-2 text-center">
                      {can(role, permission) ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Allowed" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-gray-300" aria-label="Not allowed" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
