import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type HostApplicationStatus = "pending" | "approved" | "rejected" | null;

export async function getHostStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ isHost: boolean; status: HostApplicationStatus }> {
  const { data, error } = await supabase
    .from("host_applications")
    .select("status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { isHost: false, status: null };
  }

  const status = (data as { status?: HostApplicationStatus } | null)?.status ?? null;
  return { isHost: status === "approved", status };
}
