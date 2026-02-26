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
    // Backward-compatible fallback for older records that may only set profiles.is_host.
    const { data: profile } = await supabase.from("profiles").select("is_host").eq("id", userId).maybeSingle();
    const isHost = Boolean((profile as { is_host?: boolean } | null)?.is_host);
    return { isHost, status: isHost ? "approved" : null };
  }

  const status = (data as { status?: HostApplicationStatus } | null)?.status ?? null;
  if (status) {
    return { isHost: status === "approved", status };
  }

  const { data: profile } = await supabase.from("profiles").select("is_host").eq("id", userId).maybeSingle();
  const isHost = Boolean((profile as { is_host?: boolean } | null)?.is_host);
  return { isHost, status: isHost ? "approved" : null };
}
