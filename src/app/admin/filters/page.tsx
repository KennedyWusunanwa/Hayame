import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterManager } from "@/components/admin/filter-manager";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminFiltersPage() {
  await requireAdminPage();
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Admin</p>
          <h1 className="text-2xl font-semibold text-foreground">
            Filters catalog
          </h1>
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
