import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { UserDashboardSidebar } from "@/components/user-dashboard/sidebar";
import { UserDashboardMobileNav } from "@/components/user-dashboard/mobile-nav";
import type { Database } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UserDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle<Database["public"]["Tables"]["profiles"]["Row"]>();

  const userProfile = {
    name:
      profile?.full_name ??
      (user.user_metadata as any)?.full_name ??
      user.email ??
      "User",
    avatar: profile?.avatar_url?.trim() ?? "",
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-0 px-4 pb-4 lg:flex-row lg:px-0">
      <UserDashboardSidebar user={userProfile} />
      <div className="flex-1 bg-gray-50/60 px-0 py-4 sm:px-4 lg:border-l lg:border-border lg:px-8">
        <div className="mb-4 lg:hidden">
          <UserDashboardMobileNav />
        </div>
        {children}
      </div>
    </div>
  );
}
