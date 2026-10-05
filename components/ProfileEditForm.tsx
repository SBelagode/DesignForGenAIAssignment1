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

  // Ref to the hidden input — populated after upload, read by the Server Action on Save.
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
    // Unique path per upload: the URL changes every time, so browsers and CDNs
    // never serve a cached copy of the previous avatar.
    const ext = file.name.includes(".")
      ? file.name.split(".").pop()!.toLowerCase()
      : "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type });

    if (error) {
      // Surface the exact Storage error so the user can configure bucket permissions.
      setUploadError(`Upload failed: ${error.message}`);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    // Write the unique URL to the hidden input for the Server Action.
    if (avatarUrlInputRef.current) {
      avatarUrlInputRef.current.value = publicUrl;
    }
    // URL is already unique — no cache-buster suffix needed.
    setPreviewUrl(publicUrl);
    setUploading(false);
  }

  return (
    <form action={formAction}>
      {state?.ok && <p style={{ color: "green" }}>Profile saved.</p>}
      {state && !state.ok && <p style={{ color: "red" }}>{state.error}</p>}

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Profile photo"
          width={96}
          height={96}
          style={{ objectFit: "cover", borderRadius: "50%" }}
        />
      )}

      <div>
        <label htmlFor="avatar_file">Profile photo</label>
        <input
          id="avatar_file"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {uploading && <span> Uploading…</span>}
        {uploadError && <p style={{ color: "red" }}>{uploadError}</p>}
      </div>

      {/* Populated by ref after a successful upload; empty string means no new upload. */}
      <input type="hidden" name="avatar_url" ref={avatarUrlInputRef} />

      <div>
        <label htmlFor="first_name">First name</label>
        <input
          id="first_name"
          name="first_name"
          type="text"
          required
          defaultValue={firstName}
        />
      </div>
      <div>
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
  );
}
