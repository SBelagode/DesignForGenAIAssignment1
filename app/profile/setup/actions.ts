"use server";

import { createClient } from "@/lib/supabase/server";

export type ProfileActionState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

export async function saveProfile(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const firstName = ((formData.get("first_name") as string) ?? "").trim();
  const lastName = ((formData.get("last_name") as string) ?? "").trim();

  if (!firstName || !lastName) {
    return { ok: false, error: "Both fields are required." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Session expired. Please sign in again." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", user.id);

  if (error) {
    console.error("[profile/setup] update failed:", error.code, error.message);
    return { ok: false, error: `Save failed: ${error.message}` };
  }

  return { ok: true };
}
