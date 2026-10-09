// Sketchfab library proxy: search downloadable models and resolve download URLs.
// Token stays server-side (SKETCHFAB_API_TOKEN in Supabase secrets).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const API = "https://api.sketchfab.com/v3";
const token = () => Deno.env.get("SKETCHFAB_API_TOKEN") || Deno.env.get("SKETCHFAB_TOKEN") || "";
const cache = new Map<string, { at: number; data: unknown }>();
const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sf(path: string, auth = false) {
  const headers: Record<string, string> = {};
  if (auth || token()) headers.Authorization = `Token ${token()}`;
  const r = await fetch(`${API}${path}`, { headers });
  const text = await r.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = { detail: text.slice(0, 200) }; }
  return { ok: r.ok, status: r.status, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "search");

    if (action === "search") {
      const q = String(body.q || "").slice(0, 120);
      const p = new URLSearchParams({ type: "models", downloadable: "true", count: "24", sort_by: q ? "" : "-likeCount" });
      if (!q) p.delete("sort_by");
      if (q) p.set("q", q); else p.set("sort_by", "-likeCount");
      if (body.category) p.set("categories", String(body.category).slice(0, 60));
      const maxFaces = Number(body.maxFaces) || 0;
      if (maxFaces > 0) p.set("max_face_count", String(maxFaces));
      if (body.license) p.set("license", String(body.license));
      if (body.cursor) p.set("cursor", String(body.cursor));
      const key = p.toString();
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < 5 * 60_000) return json(hit.data);
      const r = await sf(`/search?${key}`);
      if (!r.ok) return json({ error: r.data?.detail || `Sketchfab error ${r.status}` }, r.status);
      const results = (r.data.results || []).map((m: any) => {
        const imgs = (m.thumbnails?.images || []).sort((a: any, b: any) => a.width - b.width);
        const thumb = imgs.find((i: any) => i.width >= 256) || imgs[imgs.length - 1];
        return {
          uid: m.uid, name: m.name, author: m.user?.displayName || m.user?.username || "",
          authorUrl: m.user?.profileUrl || "", url: m.viewerUrl, thumbnail: thumb?.url || "",
          faces: m.faceCount || 0, vertices: m.vertexCount || 0,
          license: m.license?.label || m.license?.slug || "", animated: !!m.animationCount,
        };
      });
      const out = { results, next: r.data.cursors?.next || null };
      cache.set(key, { at: Date.now(), data: out });
      if (cache.size > 200) cache.delete(cache.keys().next().value!);
      return json(out);
    }

    if (action === "categories") {
      const hit = cache.get("cats");
      if (hit) return json(hit.data);
      const r = await sf("/categories");
      if (!r.ok) return json({ error: "Could not load categories" }, r.status);
      const out = { categories: (r.data.results || []).map((c: any) => ({ slug: c.slug, name: c.name })) };
      cache.set("cats", { at: Date.now(), data: out });
      return json(out);
    }

    if (action === "download") {
      const uid = String(body.uid || "");
      if (!/^[a-f0-9]{32}$/i.test(uid)) return json({ error: "Invalid model id" }, 400);
      if (!token()) return json({ error: "Sketchfab token is not configured" }, 503);
      const r = await sf(`/models/${uid}/download`, true);
      if (!r.ok) return json({ error: r.data?.detail || `Download not available (${r.status})` }, r.status);
      const glb = r.data.glb?.url;
      const gltf = r.data.gltf?.url;
      if (!glb && !gltf) return json({ error: "This model has no glTF download" }, 404);
      return json({ url: glb || gltf, format: glb ? "glb" : "gltf-zip" });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Proxy failed" }, 500);
  }
});
