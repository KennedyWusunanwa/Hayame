import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HostApplicationForm } from "@/components/host-application-form";
import { HostDashboardLink } from "@/components/host-dashboard-link";
import type { Database } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type HostApplicationRow = Database["public"]["Tables"]["host_applications"]["Row"];

export default async function BecomeHostPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/become-host");

  const { data: application } = await supabase
    .from("host_applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<HostApplicationRow>();

  const status = application?.status ?? null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-primary">Become a Host</p>
        <h1 className="text-3xl font-semibold text-foreground">Apply to list your cars</h1>
        <p className="text-sm text-gray-600">
          We verify every host to keep the marketplace safe. Applications are typically reviewed within 1-2 business
          days.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Host application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "approved" ? (
            <div className="space-y-3 text-sm text-gray-700">
              <p>Your host application is approved.</p>
              <HostDashboardLink />
            </div>
          ) : (
            <HostApplicationForm
              disabled={status === "pending"}
              initialStatus={status}
              initialReason={application?.rejection_reason ?? null}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
