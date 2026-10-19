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

  // Icons have no visible text, so status is announced through a hidden live region.
  const announcement =
    copyStatus === "copied" || shareStatus === "copied"
      ? "Caption copied to clipboard"
      : copyStatus === "failed"
        ? "Couldn't copy caption"
        : shareStatus === "failed"
          ? "Couldn't share caption"
          : "";

  return (
    <div className="caption-actions">
      <button
        type="button"
        className="btn-secondary btn-icon"
        onClick={copy}
        aria-label="Copy caption"
        title={copyStatus === "copied" ? "Copied" : "Copy caption"}
        data-status={copyStatus}
      >
        <StatusIcon status={copyStatus} idle={<CopyIcon />} />
      </button>
      <button
        type="button"
        className="btn-secondary btn-icon"
        onClick={share}
        aria-label="Share caption"
        title={shareStatus === "copied" ? "Copied" : "Share caption"}
        data-status={shareStatus}
      >
        <StatusIcon status={shareStatus} idle={<ShareIcon />} />
      </button>
      <span className="sr-only" aria-live="polite">{announcement}</span>
    </div>
  );
}

function StatusIcon({ status, idle }: { status: Status; idle: React.ReactNode }) {
  if (status === "copied") return <CheckIcon />;
  if (status === "failed") return <FailIcon />;
  return <>{idle}</>;
}

// Inline SVGs (Lucide-style paths); stroke follows the button's text color.
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function CopyIcon() {
  return (
    <Icon>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Icon>
  );
}

function ShareIcon() {
  return (
    <Icon>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </Icon>
  );
}

function CheckIcon() {
  return (
    <Icon>
      <polyline points="20 6 9 17 4 12" />
    </Icon>
  );
}

function FailIcon() {
  return (
    <Icon>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Icon>
  );
}
