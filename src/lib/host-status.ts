import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type HostApplicationStatus = "pending" | "approved" | "rejected" | null;

export async function getHostStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ isHost: boolean; status: HostApplicationStatus }> {
  const [applicationResult, profileResult] = await Promise.all([
    supabase
      .from("host_applications")
      .select("status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("is_host").eq("id", userId).maybeSingle(),
  ]);

  const profileIsHost = Boolean((profileResult.data as { is_host?: boolean } | null)?.is_host);
  const status = (applicationResult.data as { status?: HostApplicationStatus } | null)?.status ?? null;

  // If profiles.is_host is already true, keep host access even if the latest application row is stale/pending.
  if (profileIsHost) {
    return { isHost: true, status: status ?? "approved" };
  }

  if (applicationResult.error) {
    return { isHost: false, status: null };
  }

  if (status) {
    return { isHost: status === "approved", status };
  }

  return { isHost: false, status: null };
}
