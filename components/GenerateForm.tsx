"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { generateCaption, type GenerateState } from "@/app/captions/actions";
import CaptionActions from "@/components/CaptionActions";

const EXAMPLES = [
  "Waited 25 min for the 1 train, then three pulled in at once",
  "Someone sat directly next to me on an entirely empty subway car",
  "Wandered into the wrong Columbia building for 10 minutes before realizing",
  "Asked for directions and got a 3-minute philosophy lecture instead",
  "Butler was at capacity so I tried to study in Lerner and lasted 8 minutes",
  "Ordered Koronet's after midnight and felt completely at peace with my life choices",
];

export default function GenerateForm() {
  // Prompt behind the current result, so Regenerate reuses it even if the textarea changes.
  const lastPromptRef = useRef("");
  // Drops submits that arrive before `pending` re-renders (e.g. fast double-clicks).
  const inFlightRef = useRef(false);

  const [state, formAction, pending] = useActionState<GenerateState, FormData>(
    async (prev, formData) => {
      if (inFlightRef.current) return prev;
      inFlightRef.current = true;
      try {
        lastPromptRef.current = (formData.get("situation") as string | null) ?? "";
        return await generateCaption(prev, formData);
      } finally {
        inFlightRef.current = false;
      }
    },
    null
  );
  const [situation, setSituation] = useState("");

  function regenerate() {
    if (pending || !lastPromptRef.current) return;
    const formData = new FormData();
    formData.set("situation", lastPromptRef.current);
    startTransition(() => formAction(formData));
  }

  return (
    <div className="card">
      <form action={formAction}>
        <div className="form-field">
          <label htmlFor="situation">What happened?</label>
          <textarea
            id="situation"
            name="situation"
            rows={4}
            maxLength={300}
            placeholder="e.g. Waited 25 min for the 1 train, then three pulled in at once"
            required
            disabled={pending}
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
          />
        </div>

        <div className="nudge">
          <p className="muted nudge-label">Need a nudge? Try clicking one of these prompts.</p>
          <div className="chips">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                className="chip"
                onClick={() => setSituation(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate Caption"}
        </button>

        {state && !state.ok && (
          <p className="msg-error">{state.error}</p>
        )}

        <div className="caption-result">
          <div className="caption-result-header">
            <h2>Your caption</h2>
            {state?.ok && (
              <button
                type="button"
                className="btn-secondary"
                onClick={regenerate}
                disabled={pending}
              >
                {pending ? "Regenerating…" : "↻ Regenerate"}
              </button>
            )}
          </div>
          <div
            className={`result-card${pending || !state?.ok ? " result-card-empty" : ""}`}
            aria-live="polite"
            aria-busy={pending}
          >
            {pending ? (
              <p className="result-placeholder">Generating your caption…</p>
            ) : state?.ok ? (
              <>
                <p className="result-caption">{state.caption}</p>
                <div className="result-footer">
                  <p className="muted">
                    It&apos;s on the feed.{" "}
                    <a href="/feed">See how it does →</a>
                  </p>
                  <CaptionActions text={state.caption} />
                </div>
              </>
            ) : (
              <p className="result-placeholder">Your AI caption will appear here.</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
