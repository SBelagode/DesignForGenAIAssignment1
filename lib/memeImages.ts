// Shared by the /generate form (client) and the caption action (server).

export const MEME_BUCKET = "meme-images";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGE_LABEL = "5 MB";

// Formats both browsers can preview and Gemini accepts as inline image data.
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

// Stored in generations.user_prompt for image-based posts, which have no typed situation.
export const IMAGE_USER_PROMPT = "Uploaded image for Columbia meme generation";

export function isAllowedImageType(type: string): type is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}
