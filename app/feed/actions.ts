"use server";

import { createClient } from "@/lib/supabase/server";

export type VoteState = { ok: true } | { ok: false; error: string } | null;

export async function castVote(
  _prev: VoteState,
  formData: FormData
): Promise<VoteState> {
  const generationId = Number(formData.get("generation_id"));
  const voteValue = Number(formData.get("vote_value"));

  if (!Number.isInteger(generationId) || generationId <= 0) {
    return { ok: false, error: "Invalid generation." };
  }
  if (voteValue !== 1 && voteValue !== -1) {
    return { ok: false, error: "Invalid vote value." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated." };

  // Check for an existing vote from this user on this generation.
  const { data: existing } = await supabase
    .from("votes")
    .select("id, vote_value")
    .eq("user_id", user.id)
    .eq("generation_id", generationId)
    .maybeSingle();

  if (!existing) {
    // No prior vote — insert.
    const { error } = await supabase.from("votes").insert({
      user_id: user.id,
      generation_id: generationId,
      vote_value: voteValue,
    });
    if (error) {
      console.error("[votes] insert failed:", error.code, error.message);
      return { ok: false, error: `Vote failed: ${error.message}` };
    }
  } else if (existing.vote_value === voteValue) {
    // Clicking the active vote again — remove it.
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("id", existing.id);
    if (error) {
      console.error("[votes] delete failed:", error.code, error.message);
      return { ok: false, error: `Vote failed: ${error.message}` };
    }
  } else {
    // Switching direction — update the existing row.
    const { error } = await supabase
      .from("votes")
      .update({ vote_value: voteValue })
      .eq("id", existing.id);
    if (error) {
      console.error("[votes] update failed:", error.code, error.message);
      return { ok: false, error: `Vote failed: ${error.message}` };
    }
  }

  return { ok: true };
}
