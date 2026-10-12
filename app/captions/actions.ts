"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const MAX_INPUT_LENGTH = 300;

// User-facing messages. Never include provider/database details here.
const RETRY_MESSAGE = "Please try again in a few moments.";
const GENERIC_MESSAGE = "Something went wrong while generating your caption. Please try again.";
const SAVE_FAILED_MESSAGE = "Your caption couldn't be saved. Please try again.";

const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const TRANSIENT_PATTERN =
  /overload|unavailable|capacity|resource[_ ]?exhausted|rate.?limit|try again|timed? ?out|deadline|fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND/i;

export type GenerateState =
  | { ok: true; caption: string; id: number }
  | { ok: false; error: string }
  | null;

function isTransientProviderError(err: unknown): boolean {
  const status = (err as { status?: unknown } | null)?.status;
  if (typeof status === "number" && TRANSIENT_STATUSES.has(status)) return true;
  const message = err instanceof Error ? err.message : String(err);
  return TRANSIENT_PATTERN.test(message);
}

// Server-only log line: status + message, with the API key scrubbed and length capped.
function describeError(err: unknown): string {
  const status = (err as { status?: unknown } | null)?.status;
  let message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) message = message.split(apiKey).join("[REDACTED]");
  if (message.length > 500) message = message.slice(0, 500) + "…";
  return typeof status === "number" ? `status=${status} ${message}` : message;
}

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

  try {
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
      return { ok: false, error: GENERIC_MESSAGE };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    let generatedText: string;
    try {
      const result = await model.generateContent(generationPrompt);
      generatedText = result.response.text().trim();
    } catch (err) {
      const transient = isTransientProviderError(err);
      console.error(
        `[captions] Gemini error (${transient ? "transient" : "non-transient"}):`,
        describeError(err)
      );
      return { ok: false, error: transient ? RETRY_MESSAGE : GENERIC_MESSAGE };
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
      return { ok: false, error: SAVE_FAILED_MESSAGE };
    }

    return { ok: true, caption: generatedText, id: data.id };
  } catch (err) {
    console.error("[captions] unexpected error:", describeError(err));
    return { ok: false, error: GENERIC_MESSAGE };
  }
}
