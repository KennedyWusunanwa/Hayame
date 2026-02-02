import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const { data: profileData } = await supabase
    .from("profiles")
    .select("is_host")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as { is_host?: boolean } | null;
  if (profile?.is_host) {
    redirect(`/host/cars/${resolvedParams.id}/edit`);
  }

  redirect("/become-host");
}
