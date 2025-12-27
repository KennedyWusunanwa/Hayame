import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

export async function requireUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");
    return user;
  } catch (error) {
    console.warn("Auth unavailable, redirecting to login", error);
    redirect("/auth/login");
  }
}

export async function getUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.warn("Unable to get user", error);
    return null;
  }
}
