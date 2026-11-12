// Brochure publishing. Admins publish anything; signed-in owners publish
// their own Studio brochures (b-* slugs, ownership recorded in the doc).
// Credits: Imagine Engine Studios Corp.
// action "asset": signed upload URL for an image; default: write brochures/<slug>.json (public).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "studio-published";
const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await admin.auth.getUser(token);
    const user = u?.user;
    if (!user) return json({ error: "Sign in first" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });

    const body = await req.json().catch(() => ({}));

    if (!isAdmin) {
      // Owners may publish only their own Studio brochures (slugs b-*):
      // a published doc records its owner in `by`, and only that owner
      // (or an admin) may overwrite it or add assets under it.
      const action = String(body.action || "");
      const slugRaw = String(body.slug || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 60);
      if (action === "list" || action === "models" || !/^b-[a-z0-9_-]+$/.test(slugRaw)) {
        return json({ error: "Only admins can edit brochures" }, 403);
      }
      const { data: existing } = await admin.storage.from(BUCKET).download(`brochures/${slugRaw}.json`);
      if (existing) {
        try {
          const prev = JSON.parse(await existing.text());
          if (prev?.by && prev.by !== user.id) return json({ error: "That brochure belongs to another account" }, 403);
        } catch { /* unreadable doc: treat as unowned */ }
      }
    }

    // Every published brochure in the studio bucket (admin picker feed for
    // the live rooms). Runs before the slug check: listing needs no slug.
    if (body.action === "list") {
      const { data, error } = await admin.storage.from(BUCKET)
        .list("brochures", { limit: 500, sortBy: { column: "created_at", order: "desc" } });
      if (error) return json({ error: error.message }, 500);
      const brochures = (data || [])
        .filter((f) => f.name.endsWith(".json"))
        .map((f) => ({ slug: f.name.replace(/\.json$/, ""), updatedAt: f.updated_at || f.created_at || null }));
      return json({ ok: true, brochures });
    }

    const slug = String(body.slug || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 60);
    if (!slug) return json({ error: "Missing brochure" }, 400);

    if (body.action === "asset") {
      const ext = String(body.ext || "png").replace(/[^a-z0-9]/gi, "").slice(0, 6) || "png";
      const path = `brochures/assets/${slug}/${crypto.randomUUID()}.${ext}`;
      const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error) return json({ error: error.message }, 500);
      return json({ path, token: data.token, publicUrl: admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl });
    }

    // Shared 3D model library (admin-managed list, public to read).
    if (body.action === "models") {
      const list = Array.isArray(body.models) ? body.models.slice(0, 500).map((m: Record<string, unknown>) => ({
        id: String(m.id || crypto.randomUUID()).slice(0, 64),
        name: String(m.name || "Model").slice(0, 80),
        category: String(m.category || "General").slice(0, 40),
        src: String(m.src || "").slice(0, 600),
        iosSrc: m.iosSrc ? String(m.iosSrc).slice(0, 600) : undefined,
        addedAt: String(m.addedAt || new Date().toISOString()),
      })).filter((m: { src: string }) => /^https:\/\//.test(m.src)) : null;
      if (!list) return json({ error: "Invalid library" }, 400);
      const { error } = await admin.storage.from(BUCKET).upload("brochures/library/models.json",
        new Blob([JSON.stringify({ models: list, updatedAt: new Date().toISOString() })], { type: "application/json" }),
        { upsert: true, contentType: "application/json", cacheControl: "10" });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, models: list });
    }

    const doc = body.doc;
    if (!doc || typeof doc !== "object") return json({ error: "Invalid edits" }, 400);
    const raw = JSON.stringify({ ...doc, publishedAt: new Date().toISOString(), by: user.id });
    if (raw.length > 2_000_000) return json({ error: "Too large" }, 413);
    const { error } = await admin.storage.from(BUCKET)
      .upload(`brochures/${slug}.json`, new Blob([raw], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "10" });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
