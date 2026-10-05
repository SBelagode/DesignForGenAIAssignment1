"use client";

import { useActionState, useState } from "react";
import { generateCaption, type GenerateState } from "@/app/captions/actions";

const EXAMPLES = [
  "Waited 25 min for the 1 train, then three pulled in at once",
  "Someone sat directly next to me on an entirely empty subway car",
  "Wandered into the wrong Columbia building for 10 minutes before realizing",
  "Asked for directions and got a 3-minute philosophy lecture instead",
  "Butler was at capacity so I tried to study in Lerner and lasted 8 minutes",
  "Ordered Koronet's after midnight and felt completely at peace with my life choices",
];

export default function GenerateForm() {
  const [state, formAction, pending] = useActionState<GenerateState, FormData>(
    generateCaption,
    null
  );
  const [situation, setSituation] = useState("");

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

        <p className="muted">
          Need a nudge?{" "}
          {EXAMPLES.map((ex, i) => (
            <span key={i}>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: "0.8rem" }}
                onClick={() => setSituation(ex)}
              >
                {ex}
              </button>
              {i < EXAMPLES.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>

        <button type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate Caption"}
        </button>

        {state && !state.ok && (
          <p className="msg-error">{state.error}</p>
        )}

        {state?.ok && (
          <div className="caption-result">
            <h2>Your caption</h2>
            <p>{state.caption}</p>
            <p className="muted">
              It&apos;s on the feed.{" "}
              <a href="/feed">See how it does →</a>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
