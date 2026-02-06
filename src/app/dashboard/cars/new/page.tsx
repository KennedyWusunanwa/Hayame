import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHostStatus } from "@/lib/host-status";

export const dynamic = "force-dynamic";

export default async function DashboardCarsNewRedirect() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { isHost } = await getHostStatus(supabase as any, user.id);
  if (isHost) {
    redirect("/host/cars/new");
  }

  redirect("/become-host");
}
