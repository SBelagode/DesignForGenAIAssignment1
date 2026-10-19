"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { generateCaption, type GenerateState } from "@/app/captions/actions";
import CaptionActions from "@/components/CaptionActions";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_LABEL,
  isAllowedImageType,
} from "@/lib/memeImages";

export default function GenerateForm() {
  // Drops submits that arrive before `pending` re-renders (e.g. fast double-clicks).
  const inFlightRef = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Image shown in the result card while a caption is being generated.
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<GenerateState, FormData>(
    async (prev, formData) => {
      if (inFlightRef.current) return prev;
      inFlightRef.current = true;
      try {
        const result = await generateCaption(prev, formData);
        // A fresh upload now lives in the result card; clear the picker for the next image.
        if (result?.ok && !formData.has("regenerate_from")) setFile(null);
        return result;
      } finally {
        inFlightRef.current = false;
      }
    },
    null
  );

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(next: File | undefined) {
    if (!next) return;
    if (!isAllowedImageType(next.type)) {
      setFileError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (next.size > MAX_IMAGE_BYTES) {
      setFileError(`Images must be ${MAX_IMAGE_LABEL} or smaller.`);
      return;
    }
    setFileError(null);
    setFile(next);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !file) return;
    const formData = new FormData();
    formData.set("image", file);
    setPendingImage(previewUrl);
    startTransition(() => formAction(formData));
  }

  function regenerate() {
    if (pending || !state?.ok) return;
    const formData = new FormData();
    formData.set("regenerate_from", String(state.id));
    setPendingImage(state.imageUrl);
    startTransition(() => formAction(formData));
  }

  const resultImage = pending ? pendingImage : state?.ok ? state.imageUrl : null;

  return (
    <div className="card">
      <form onSubmit={submit}>
        <div className="form-field">
          <label htmlFor="meme-image">Your image</label>
          <label
            className={`dropzone${dragging ? " dropzone-active" : ""}${pending ? " dropzone-disabled" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!pending) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!pending) selectFile(e.dataTransfer.files[0]);
            }}
          >
            <input
              id="meme-image"
              type="file"
              className="sr-only"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              disabled={pending}
              onChange={(e) => {
                selectFile(e.target.files?.[0]);
                // Allow re-selecting the same file after it was cleared.
                e.target.value = "";
              }}
            />
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Selected image preview" className="meme-img" />
                <span className="dropzone-change">Change image</span>
              </>
            ) : (
              <span className="dropzone-prompt">
                <strong>Choose a photo or meme</strong>
                <span className="muted">or drag it here · JPEG, PNG, or WebP up to {MAX_IMAGE_LABEL}</span>
              </span>
            )}
          </label>
          {fileError && <p className="msg-error">{fileError}</p>}
        </div>

        <button type="submit" disabled={pending || !file}>
          {pending ? "Generating…" : "Generate Caption"}
        </button>

        {state && !state.ok && <p className="msg-error">{state.error}</p>}

        <div className="caption-result">
          <div className="caption-result-header">
            <h2>Your meme</h2>
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
            className={`result-card${!resultImage ? " result-card-empty" : ""}`}
            aria-live="polite"
            aria-busy={pending}
          >
            <div className={`meme-frame${pending ? " meme-frame-pending" : ""}`}>
              {resultImage ? (
                <img
                  src={resultImage}
                  alt={state?.ok && !pending ? `Meme: ${state.caption}` : "Image being captioned"}
                  className="meme-img"
                />
              ) : (
                <p className="result-placeholder">Your AI meme will appear here.</p>
              )}
            </div>
            <div className="result-body">
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
              ) : null}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
