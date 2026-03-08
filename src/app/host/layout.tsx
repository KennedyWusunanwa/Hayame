import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardMobileNav } from "@/components/dashboard/mobile-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHostStatus } from "@/lib/host-status";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function HostLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const supa = supabase as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle<Pick<Database["public"]["Tables"]["profiles"]["Row"], "full_name" | "avatar_url">>();

  const { isHost } = await getHostStatus(supabase as any, user.id);
  if (!isHost) {
    redirect("/become-host");
  }

  const { data: ownedCars } = await supa.from("cars").select("id").eq("owner_id", user.id);
  const ownerCarIds = ((ownedCars as Array<{ id: string }> | null) ?? []).map((car) => car.id);
  let pendingBookingCount = 0;
  if (ownerCarIds.length > 0) {
    const { count } = await supa
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("car_id", ownerCarIds)
      .eq("status", "awaiting_host")
      .eq("payment_status", "paid");
    pendingBookingCount = count ?? 0;
  }

  const host = {
    name: profile?.full_name ?? (user.user_metadata as any)?.full_name ?? user.email ?? "Host",
    avatar: profile?.avatar_url?.trim() ?? "",
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-0 px-4 pb-4 lg:flex-row lg:px-0">
      <DashboardSidebar host={host} pendingBookingCount={pendingBookingCount} />
      <div className="flex-1 bg-gray-50/60 px-0 py-4 sm:px-4 lg:border-l lg:border-border lg:px-8">
        <div className="mb-4 lg:hidden">
          <DashboardMobileNav pendingBookingCount={pendingBookingCount} />
        </div>
        {children}
      </div>
    </div>
  );
}
