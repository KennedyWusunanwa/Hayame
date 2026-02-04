import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterManager } from "@/components/admin/filter-manager";

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

export default async function AdminFiltersPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Admin</p>
          <h1 className="text-2xl font-semibold text-foreground">Filters catalog</h1>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-brand">
          Back to admin
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Manage car makes & models</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterManager />
        </CardContent>
      </Card>
    </div>
  );
}
