import Image from "next/image";
import { redirect } from "next/navigation";
import { PageHeader, Panel, RoleBadge } from "@/components/admin/admin-ui";
import { PasswordForm } from "@/components/admin/password-form";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { PERMISSION_LABELS, ROLE_META, permissionsFor } from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ force?: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin");
  const { force } = await searchParams;
  const forced = admin.mustChangePassword || force === "1";

  const content = (
    <div className="space-y-6">
      <PageHeader
        eyebrow={forced ? "One more step" : "Admin"}
        title={forced ? "Choose your own password" : "My account"}
        description={
          forced
            ? "Your password was set by a super admin. Pick one only you know before you continue."
            : `${admin.name} · ${admin.email}`
        }
      />
      <Panel title="Change password">
        {admin.source === "root" ? (
          <p className="text-sm text-gray-600">
            You&apos;re signed in as the root admin. Its password lives in your hosting environment variables
            (ADMIN_PASSWORD or ADMIN_PASSWORD_HASH), so change it there.
          </p>
        ) : (
          <PasswordForm forced={forced} />
        )}
      </Panel>
      {!forced ? (
        <Panel title="Your access" description={ROLE_META[admin.role].description}>
          <div className="mb-3"><RoleBadge role={admin.role} /></div>
          <ul className="grid gap-1.5 text-sm text-gray-700 sm:grid-cols-2">
            {permissionsFor(admin.role).map((permission) => (
              <li key={permission} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {PERMISSION_LABELS[permission]}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );

  if (!forced) return content;
  // Forced change: no sidebar, centred card, like the sign-in screen.
  return (
    <div className="min-h-screen bg-[#F4F8FD] px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Image src="/logo.png" alt="Hayame" width={120} height={44} className="mb-6 h-9 w-auto" unoptimized />
        {content}
      </div>
    </div>
  );
}
