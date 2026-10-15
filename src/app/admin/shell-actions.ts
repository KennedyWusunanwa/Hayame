"use server";

import { redirect } from "next/navigation";
import { signOutAdmin } from "@/lib/admin-auth";

export async function signOutAction() {
  await signOutAdmin();
  redirect("/admin?notice=signed-out");
}
