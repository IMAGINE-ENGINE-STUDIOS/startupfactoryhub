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
  if (dataUrl.includes("[truncated]")) return null;
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  const mime = match[1];
  // Pasted/imported documents frequently contain wrapped, URL-safe, or
  // unpadded base64. Normalize it before decoding so one malformed image can
  // never abort the entire document save.
  let encoded = match[2].replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const remainder = encoded.length % 4;
  if (remainder) encoded += "=".repeat(4 - remainder);
  let binary: string;
  try {
    binary = atob(encoded);
  } catch (error) {
    console.warn("Skipping malformed inline LightPaper image during save", error);
    return null;
  }
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
  // Never lose a page: if the inline image cannot be decoded, keep the
  // original inline copy in the payload instead of dropping it.
  if (!converted) return dataUrl;

  let blob = converted.blob;
  let ext = converted.ext;
  if (!ALLOWED_MIME.has(blob.type)) {
    try {
      blob = await toPngBlob(blob);
      ext = "png";
    } catch (error) {
      console.warn("Keeping inline LightPaper image (conversion failed)", error);
      return dataUrl;
    }
  }

  // `feed-media` ownership policies require the authenticated user id to be
  // the FIRST path segment. The former lightpaper/{userId}/... path was
  // rejected by Storage RLS, which then caused every image-heavy save to fail.
  const path = `${userId}/lightpaper/${hashString(dataUrl)}-${dataUrl.length}.${ext}`;
  let uploadError: { message: string } | null = null;
  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { upsert: true, contentType: blob.type });
    uploadError = error;
  } catch (error: any) {
    uploadError = { message: error?.message || "upload failed" };
  }

  // "already exists" is fine — we key the path by content hash.
  if (uploadError && !/exists/i.test(uploadError.message)) {
    console.warn("Keeping inline LightPaper image (upload failed)", uploadError);
    return dataUrl;
  }


  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = data.publicUrl;
  uploadCache.set(dataUrl, url);
  return url;
}

/** Matches every inline base64 image embedded in an HTML string. */
const INLINE_DATA_URL = /data:image\/[a-z0-9.+-]+;base64,[^"'\s)<>]+/gi;

/**
 * Inline base64 images inside `content.html` / `content.pages` were never
 * offloaded, so a single pasted screenshot could push the JSONB row into the
 * multi-megabyte range — big enough to break the search-index trigger and make
 * the save fail. We now hoist those to Storage as well.
 */
async function offloadHtmlImages(html: string, userId: string): Promise<string> {
  if (typeof html !== "string" || !html.includes("data:image/")) return html;
  const matches = Array.from(new Set(html.match(INLINE_DATA_URL) || []));
  if (matches.length === 0) return html;

  let out = html;
  for (const dataUrl of matches) {
    try {
      const url = await uploadDataUrl(dataUrl, userId);
      out = out.split(dataUrl).join(url);
    } catch {
      // Keep the inline copy rather than losing the image; the row may still
      // save because the trigger now tolerates oversized content.
    }
  }
  return out;
}

/**
 * Replaces base64 page images inside a LightPaper save payload with Storage
 * URLs so the JSONB row stays small (a few KB instead of hundreds of MB).
 * Covers uploaded page renders (`viewModeImages`) AND inline images embedded in
 * the rich-text HTML (`html`, `pages`).
 */
export async function offloadHeavyContent(content: any, userId: string): Promise<any> {
  if (!content || typeof content !== "object") return content;

  const next: any = { ...content };

  const images: string[] | undefined = content.viewModeImages;
  if (Array.isArray(images) && images.some((img) => typeof img === "string" && img.startsWith("data:"))) {
    const uploaded: string[] = [];
    // Upload in small batches to avoid saturating the network on 100+ page files.
    const BATCH = 4;
    for (let i = 0; i < images.length; i += BATCH) {
      const slice = images.slice(i, i + BATCH);
      const results = await Promise.all(
        slice.map(async (img) => {
          if (typeof img !== "string" || !img.startsWith("data:")) return img;
          try {
            const url = await uploadDataUrl(img, userId);
            // Never drop a page — fall back to the inline copy.
            return url || img;
          } catch (error) {
            console.warn("Keeping inline LightPaper page image", error);
            return img;
          }
        })
      );
      uploaded.push(...results);
    }
    next.viewModeImages = uploaded;
  }

  if (typeof next.html === "string") {
    next.html = await offloadHtmlImages(next.html, userId);
  }

  if (Array.isArray(next.pages)) {
    const pages: string[] = [];
    for (const page of next.pages) {
      pages.push(typeof page === "string" ? await offloadHtmlImages(page, userId) : page);
    }
    next.pages = pages;
  }

  return next;
}
