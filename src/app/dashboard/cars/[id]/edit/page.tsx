import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHostStatus } from "@/lib/host-status";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string } | Promise<{ id: string }>;
};

export default async function DashboardCarsEditRedirect({ params }: PageProps) {
  const resolvedParams = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { isHost } = await getHostStatus(supabase as any, user.id);
  if (isHost) {
    redirect(`/host/cars/${resolvedParams.id}/edit`);
  }

  redirect("/become-host");
}
