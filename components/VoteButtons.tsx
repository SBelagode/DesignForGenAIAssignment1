"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { castVote, type VoteState } from "@/app/feed/actions";

interface Props {
  generationId: number;
  score: number;
  userVote: number | null;
}

export default function VoteButtons({ generationId, score, userVote }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<VoteState, FormData>(
    castVote,
    null
  );

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="vote-controls">
      <form action={formAction} style={{ display: "contents" }}>
        <input type="hidden" name="generation_id" value={generationId} />
        <input type="hidden" name="vote_value" value="1" />
        <button
          type="submit"
          disabled={pending}
          aria-label="Upvote"
          className={`vote-btn${userVote === 1 ? " active" : ""}`}
        >
          ▲
        </button>
      </form>

      <span className="vote-score">{score}</span>

      <form action={formAction} style={{ display: "contents" }}>
        <input type="hidden" name="generation_id" value={generationId} />
        <input type="hidden" name="vote_value" value="-1" />
        <button
          type="submit"
          disabled={pending}
          aria-label="Downvote"
          className={`vote-btn${userVote === -1 ? " active" : ""}`}
        >
          ▼
        </button>
      </form>

      {state && !state.ok && (
        <span className="msg-error" style={{ fontSize: "0.8rem" }}>{state.error}</span>
      )}
    </div>
  );
}
