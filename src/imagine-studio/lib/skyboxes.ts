// @ts-nocheck -- Imagine Studio v2
/**
 * Photo skyboxes (founder directive 2026-10-25): a real-life city photo
 * wrapped around a level, seen through the windows instead of built
 * geometry. The choice lives ON the scene (`scene.skybox`) so it saves
 * with the level, publishes with it, and can differ per floor. Admins
 * swap cities from edit mode (StudioIntegrations "Skybox" panel).
 * Photos are served same-origin from public/skyboxes in the repo.
 */
export type SkyboxChoice = { city: string; url: string };
export type SkyboxCity = { id: string; label: string; url: string };

export const SKYBOX_CITIES: SkyboxCity[] = [
  { id: "nyc", label: "New York City", url: "/skyboxes/nyc.jpg" },
  { id: "san-francisco", label: "San Francisco", url: "/skyboxes/san-francisco.jpg" },
  { id: "tokyo", label: "Tokyo", url: "/skyboxes/tokyo.jpg" },
  { id: "orlando", label: "Orlando", url: "/skyboxes/orlando.jpg" },
];

/**
 * 360° environments (founder directive 2026-10-25): true equirectangular
 * photos that wrap all the way around and overhead, shown in the Skybox
 * panel BELOW the cities. All are openly licensed (CC BY / CC BY-SA,
 * Wikimedia Commons), 8000×4000. Sketchfab skyboxes are NOT listed here:
 * they are searched live in the panel's "From Sketchfab" section through
 * the sketchfab-proxy integration (SKETCHFAB_API_TOKEN, Supabase secret)
 * and applied per level — see extractSkyboxImage below.
 */
export const SKYBOX_ENVIRONMENTS: SkyboxCity[] = [
  { id: "env-alpine-lake", label: "Alpine Lake", url: "/skyboxes/env-alpine-lake.jpg" },
  { id: "env-starry-night", label: "Starry Night", url: "/skyboxes/env-starry-night.jpg" },
  { id: "env-desert-sunrise", label: "Desert Sunrise", url: "/skyboxes/env-desert-sunrise.jpg" },
  { id: "env-pacific-coast", label: "Pacific Coast", url: "/skyboxes/env-pacific-coast.jpg" },
  { id: "env-redwood-forest", label: "Forest Valley", url: "/skyboxes/env-redwood-forest.jpg" },
  { id: "env-london-park", label: "London Park", url: "/skyboxes/env-london-park.jpg" },
];

export const ALL_SKYBOXES: SkyboxCity[] = [...SKYBOX_CITIES, ...SKYBOX_ENVIRONMENTS];

export const DEFAULT_SKYBOX: SkyboxChoice = { city: "nyc", url: "/skyboxes/nyc.jpg" };

export const skyboxCityLabel = (id?: string | null): string =>
  ALL_SKYBOXES.find((c) => c.id === id)?.label ?? "Custom photo";

/* ------------------------------------------------------------------ */
/* Sketchfab skyboxes: a Sketchfab "skybox" model is a textured dome/  */
/* sphere — the panorama lives inside the GLB as its largest image.    */
/* These helpers pull that image out in the browser (GLB container or  */
/* glTF zip) so it can be hosted and used as a level skybox.           */
/* ------------------------------------------------------------------ */

import { unzipSync } from "fflate";

const u32 = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

function imagesFromGltf(json: any, bin: Uint8Array | null, resolveUri: (uri: string) => Uint8Array | null): { blob: Blob; bytes: number } | null {
  let best: { blob: Blob; bytes: number } | null = null;
  for (const img of json.images || []) {
    let bytes: Uint8Array | null = null;
    let mime = img.mimeType || "image/png";
    if (typeof img.bufferView === "number" && bin) {
      const bv = json.bufferViews?.[img.bufferView];
      if (bv) bytes = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
    } else if (typeof img.uri === "string" && img.uri.startsWith("data:")) {
      const m = img.uri.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
      if (m) {
        mime = m[1] || mime;
        const raw = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
        bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      }
    } else if (typeof img.uri === "string") {
      bytes = resolveUri(img.uri);
      if (/\.jpe?g$/i.test(img.uri)) mime = "image/jpeg";
      else if (/\.webp$/i.test(img.uri)) mime = "image/webp";
    }
    if (bytes && (!best || bytes.length > best.bytes)) {
      best = { blob: new Blob([bytes.slice().buffer as ArrayBuffer], { type: mime }), bytes: bytes.length };
    }
  }
  return best;
}

function imageFromGlb(buf: ArrayBuffer): { blob: Blob; bytes: number } | null {
  const b = new Uint8Array(buf);
  if (b.length < 20 || new TextDecoder().decode(b.subarray(0, 4)) !== "glTF") return null;
  let off = 12;
  let json: any = null;
  let bin: Uint8Array | null = null;
  while (off + 8 <= b.length) {
    const len = u32(b, off);
    const type = new TextDecoder().decode(b.subarray(off + 4, off + 8));
    const chunk = b.subarray(off + 8, off + 8 + len);
    if (type === "JSON") { try { json = JSON.parse(new TextDecoder().decode(chunk)); } catch { /* keep null */ } }
    else if (type === "BIN\u0000") bin = chunk;
    off += 8 + len;
  }
  if (!json) return null;
  return imagesFromGltf(json, bin, () => null);
}

/** Extract the panorama texture (largest embedded image) from a Sketchfab download (GLB blob or glTF zip blob). Null when the model carries no usable image. */
export async function extractSkyboxImage(blob: Blob): Promise<Blob | null> {
  const buf = await blob.arrayBuffer();
  const head = new Uint8Array(buf.slice(0, 2));
  // GLB
  const direct = imageFromGlb(buf);
  if (direct) return direct.blob;
  // ZIP (glTF + separate texture files, or a zipped GLB)
  if (head[0] === 0x50 && head[1] === 0x4b) {
    try {
      const files = unzipSync(new Uint8Array(buf));
      const names = Object.keys(files).filter((n) => !n.startsWith("__MACOSX") && !n.endsWith("/"));
      const glbName = names.find((n) => /\.glb$/i.test(n));
      if (glbName) {
        const inner = imageFromGlb(files[glbName].buffer as ArrayBuffer);
        if (inner) return inner.blob;
      }
      const gltfName = names.filter((n) => /\.gltf$/i.test(n)).sort((a, b) => a.split("/").length - b.split("/").length)[0];
      if (gltfName) {
        const json = JSON.parse(new TextDecoder().decode(files[gltfName]));
        const dir = gltfName.includes("/") ? gltfName.slice(0, gltfName.lastIndexOf("/") + 1) : "";
        const byBase = new Map(names.map((n) => [n.split("/").pop()!.toLowerCase(), n]));
        const resolveUri = (uri: string) => {
          const clean = decodeURIComponent(uri.replace(/^\.\//, ""));
          return files[dir + clean] || files[clean] || files[byBase.get(clean.split("/").pop()!.toLowerCase()) || ""] || null;
        };
        // .bin for bufferView images
        let bin: Uint8Array | null = null;
        const binUri = json.buffers?.[0]?.uri;
        if (typeof binUri === "string" && !binUri.startsWith("data:")) bin = resolveUri(binUri);
        const found = imagesFromGltf(json, bin, resolveUri);
        if (found) return found.blob;
      }
    } catch { /* fall through to null */ }
  }
  return null;
}

/** Cap a skybox image at maxW px wide and re-encode as JPEG so hosting stays light. Returns the original blob when decoding fails. */
export async function downscaleSkyboxImage(blob: Blob, maxW = 4096): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(blob);
    if (bmp.width <= maxW) { bmp.close(); return blob; }
    const scale = maxW / bmp.width;
    const canvas = document.createElement("canvas");
    canvas.width = maxW;
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) { bmp.close(); return blob; }
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    return out || blob;
  } catch { return blob; }
}
