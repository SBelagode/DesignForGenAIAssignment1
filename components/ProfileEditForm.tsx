"use client";

import { useActionState, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile, type ProfileUpdateState } from "@/app/profile/actions";

interface Props {
  userId: string;
  firstName: string;
  lastName: string;
  currentAvatarUrl: string | null;
}

export default function ProfileEditForm({
  userId,
  firstName,
  lastName,
  currentAvatarUrl,
}: Props) {
  const [state, formAction, pending] = useActionState<ProfileUpdateState, FormData>(
    updateProfile,
    null
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const avatarUrlInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const supabase = createClient();
    const ext = file.name.includes(".")
      ? file.name.split(".").pop()!.toLowerCase()
      : "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type });

    if (error) {
      setUploadError(`Upload failed: ${error.message}`);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    if (avatarUrlInputRef.current) {
      avatarUrlInputRef.current.value = publicUrl;
    }
    setPreviewUrl(publicUrl);
    setUploading(false);
  }

  return (
    <div className="card">
      <form action={formAction}>
        {state?.ok && <p className="msg-success">Profile saved.</p>}
        {state && !state.ok && <p className="msg-error">{state.error}</p>}

        <div className="form-field">
          <label>Profile photo</label>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Profile photo"
              className="avatar-preview"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {uploading && <p className="muted">Uploading…</p>}
          {uploadError && <p className="msg-error">{uploadError}</p>}
        </div>

        <input type="hidden" name="avatar_url" ref={avatarUrlInputRef} />

        <div className="form-field">
          <label htmlFor="first_name">First name</label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            defaultValue={firstName}
          />
        </div>
        <div className="form-field">
          <label htmlFor="last_name">Last name</label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            required
            defaultValue={lastName}
          />
        </div>

        <button type="submit" disabled={pending || uploading}>
          {pending ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
