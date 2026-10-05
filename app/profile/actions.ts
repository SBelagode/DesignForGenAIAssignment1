"use server";

import { createClient } from "@/lib/supabase/server";

export type ProfileUpdateState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

export async function updateProfile(
  _prev: ProfileUpdateState,
  formData: FormData
): Promise<ProfileUpdateState> {
  const firstName = ((formData.get("first_name") as string) ?? "").trim();
  const lastName = ((formData.get("last_name") as string) ?? "").trim();
  const avatarUrl = ((formData.get("avatar_url") as string) ?? "").trim();

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

  const updateData: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  } = { first_name: firstName, last_name: lastName };

  // Only write avatar_url when a new file was uploaded this session.
  if (avatarUrl) updateData.avatar_url = avatarUrl;

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    console.error("[profile] update failed:", error.code, error.message);
    return { ok: false, error: `Save failed: ${error.message}` };
  }

  return { ok: true };
}
