import { supabase } from "@/integrations/supabase/client";

/**
 * LightPaper save payloads used to embed every uploaded PDF page as a base64
 * data URL inside the `content` JSONB column. A 100-page document is easily
 * 80-200MB of base64 — far above what PostgREST accepts — so EVERY save
 * failed, which is why the editor looked like it "obsessively" failed to save.
 *
 * We now offload heavy data URLs to Storage once and persist only the URL.
 */

const BUCKET = "feed-media";

// data-url -> public url (per session), so re-saves never re-upload.
const uploadCache = new Map<string, string>();

function hashString(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

export function stableHash(value: unknown): string {
  try {
    const s = typeof value === "string" ? value : JSON.stringify(value);
    return `${s.length}:${hashString(s)}`;
  } catch {
    return `${Date.now()}`;
  }
}

/**
 * The `feed-media` bucket only accepts this MIME whitelist. Anything else
 * (svg, avif, bmp, pdf page renders...) is rejected by Storage with an
 * "mime type not supported" error, which used to surface as a generic
 * "failed to save" in the editor. Unsupported images are re-encoded to PNG.
 */
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } | null {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ext = mime.split("/")[1]?.split("+")[0] || "png";
  return { blob: new Blob([bytes], { type: mime }), ext };
}

/** Re-encodes any image blob to PNG so Storage accepts it. */
async function toPngBlob(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable for image conversion");
  ctx.drawImage(bitmap, 0, 0);
  const png = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!png) throw new Error("Could not convert image for upload");
  return png;
}

async function uploadDataUrl(dataUrl: string, userId: string): Promise<string> {
  const cached = uploadCache.get(dataUrl);
  if (cached) return cached;

  const converted = dataUrlToBlob(dataUrl);
  if (!converted) return dataUrl;

  let blob = converted.blob;
  let ext = converted.ext;
  if (!ALLOWED_MIME.has(blob.type)) {
    blob = await toPngBlob(blob);
    ext = "png";
  }

  // `feed-media` ownership policies require the authenticated user id to be
  // the FIRST path segment. The former lightpaper/{userId}/... path was
  // rejected by Storage RLS, which then caused every image-heavy save to fail.
  const path = `${userId}/lightpaper/${hashString(dataUrl)}-${dataUrl.length}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: blob.type });


  // "already exists" is fine — we key the path by content hash.
  if (error && !/exists/i.test(error.message)) {
    throw error;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = data.publicUrl;
  uploadCache.set(dataUrl, url);
  return url;
}

/**
 * Replaces base64 page images inside a LightPaper save payload with Storage
 * URLs so the JSONB row stays small (a few KB instead of hundreds of MB).
 * Throws if any upload fails. Saving the original base64 payload would exceed
 * PostgREST limits and can create rows that reopen blank, so failure must stay
 * explicit and lossless.
 */
export async function offloadHeavyContent(content: any, userId: string): Promise<any> {
  if (!content || typeof content !== "object") return content;

  const images: string[] | undefined = content.viewModeImages;
  if (!Array.isArray(images) || images.length === 0) return content;
  if (!images.some((img) => typeof img === "string" && img.startsWith("data:"))) return content;

  const uploaded: string[] = [];
  // Upload in small batches to avoid saturating the network on 100+ page files.
  const BATCH = 4;
  for (let i = 0; i < images.length; i += BATCH) {
    const slice = images.slice(i, i + BATCH);
    const results = await Promise.all(
      slice.map(async (img) => {
        if (typeof img !== "string" || !img.startsWith("data:")) return img;
        return uploadDataUrl(img, userId);
      })
    );
    uploaded.push(...results);
  }

  return { ...content, viewModeImages: uploaded };
}
