"use server";

import { signOutAdmin } from "@/lib/admin-auth";

/** Clears the session. The client then does a full page load so the shell resets. */
export async function signOutAction() {
  await signOutAdmin();
}
