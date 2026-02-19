import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminMessagesConsole } from "@/components/admin/admin-messages-console";

const COOKIE_NAME = "admin_auth";

function adminToken() {
  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username || !password) return null;
  return Buffer.from(`${username}:${password}`).toString("base64");
}

async function requireAdmin() {
  const token = adminToken();
  if (!token) redirect("/admin?error=missing");
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  if (cookie !== token) redirect("/admin");
}

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: { user?: string };
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Admin portal</p>
          <h1 className="text-2xl font-semibold text-foreground">Hayame office messaging</h1>
          <p className="text-sm text-gray-600">Dedicated admin conversations with users.</p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-brand">
          Back to admin
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Office inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminMessagesConsole initialUserId={searchParams?.user ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
