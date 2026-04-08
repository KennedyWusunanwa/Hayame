import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminMessagesConsole } from "@/components/admin/admin-messages-console";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: { user?: string };
}) {
  await requireAdminPage();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Admin portal</p>
          <h1 className="text-2xl font-semibold text-foreground">
            Hayame office messaging
          </h1>
          <p className="text-sm text-gray-600">
            Dedicated admin conversations with users.
          </p>
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
