"use client";

import { useEffect, useRef, useState } from "react";

const RESET_MS = 1500;
const SHARE_TITLE = "NYC Caption Feed";

type Status = "idle" | "copied" | "failed";

// Button label that flashes a status, then resets to idle.
function useFlashStatus() {
  const [status, setStatus] = useState<Status>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function flash(next: Status) {
    setStatus(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setStatus("idle"), RESET_MS);
  }

  return [status, flash] as const;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function CaptionActions({ text }: { text: string }) {
  const [copyStatus, flashCopy] = useFlashStatus();
  const [shareStatus, flashShare] = useFlashStatus();

  async function copy() {
    flashCopy((await copyText(text)) ? "copied" : "failed");
  }

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: SHARE_TITLE, text });
        return;
      } catch (err) {
        // User closed the share sheet — not an error.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Otherwise (e.g. not permitted), fall through to copying.
      }
    }
    flashShare((await copyText(text)) ? "copied" : "failed");
  }

  return (
    <div className="caption-actions">
      <button type="button" className="btn-secondary btn-copy" onClick={copy} aria-live="polite">
        {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Couldn't copy" : "Copy"}
      </button>
      <button type="button" className="btn-secondary btn-copy" onClick={share} aria-live="polite">
        {shareStatus === "copied" ? "Copied" : shareStatus === "failed" ? "Couldn't share" : "Share"}
      </button>
    </div>
  );
}
