import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSettings } from "@/components/dashboard/profile-settings";
import { HostPageHeader } from "@/components/dashboard/host-page-header";
import type { Database } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, first_name, last_name, avatar_url, city, phone")
    .eq("id", user.id)
    .maybeSingle<Database["public"]["Tables"]["profiles"]["Row"]>();

  const username =
    String((user.user_metadata as any)?.username ?? "").trim() ||
    (user.email?.split("@")[0] ?? "");
  const firstName =
    profile?.first_name ??
    (user.user_metadata as any)?.first_name ??
    (profile?.full_name ?? "").split(" ")[0] ??
    "";
  const lastName =
    profile?.last_name ??
    (user.user_metadata as any)?.last_name ??
    (profile?.full_name ?? "").split(" ").slice(1).join(" ") ??
    "";
  const name =
    `${firstName} ${lastName}`.trim() ||
    (user.user_metadata as any)?.full_name ||
    user.email ||
    "Host";

  return (
    <div className="space-y-6">
      <HostPageHeader
        eyebrow="Profile"
        title="Your host profile"
        description="Update your photo and name. Guests will see this on your listings."
      />
      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileSettings
            userId={user.id}
            email={user.email ?? ""}
            initialName={name}
            initialUsername={username}
            initialFirstName={firstName}
            initialLastName={lastName}
            initialPhone={
              profile?.phone ??
              (user as any)?.phone ??
              (user.user_metadata as any)?.phone ??
              ""
            }
            initialAvatar={profile?.avatar_url ?? ""}
            initialCity={profile?.city ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
