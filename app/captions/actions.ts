"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const MAX_INPUT_LENGTH = 300;

export type GenerateState =
  | { ok: true; caption: string; id: number }
  | { ok: false; error: string }
  | null;

export async function generateCaption(
  _prev: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  const raw = formData.get("situation") as string | null;
  const situation = (raw ?? "").trim();

  if (!situation) {
    return { ok: false, error: "Please describe a situation." };
  }
  if (situation.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      error: `Situation must be ${MAX_INPUT_LENGTH} characters or fewer.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to generate captions." };
  }

  const generationPrompt =
    `You are a witty caption writer for NYC college students. ` +
    `Write ONE short, funny internet-style caption (one or two sentences max) for this situation: "${situation}". ` +
    `Output only the caption itself — no explanation, no hashtags, no quotation marks around it.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[captions] GEMINI_API_KEY is not set");
    return { ok: false, error: "Server configuration error: GEMINI_API_KEY is missing." };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

  let generatedText: string;
  try {
    const result = await model.generateContent(generationPrompt);
    generatedText = result.response.text().trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[captions] Gemini error:", message);
    return { ok: false, error: `Gemini error: ${message}` };
  }

  const { data, error } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      user_prompt: situation,
      generation_prompt: generationPrompt,
      generated_text: generatedText,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[captions] insert failed:", error.code, error.message);
    return { ok: false, error: `Save failed: ${error.message}` };
  }

  return { ok: true, caption: generatedText, id: data.id };
}
