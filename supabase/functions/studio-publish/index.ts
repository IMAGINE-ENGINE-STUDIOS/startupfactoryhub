// Publishes a 3D Studio level as public JSON. The Plaza District slot is admin-only;
// any signed-in user can publish their own levels under levels/<uid>/<levelId>.json.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "studio-published";
const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const auth = req.headers.get("Authorization") || "";
    const { data: u } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    const user = u?.user;
    if (!user) return json({ error: "Sign in to publish" }, 401);

    const body = await req.json().catch(() => ({}));
    const ensureBucket = async () => {
      const { data: buckets } = await admin.storage.listBuckets();
      if (!buckets?.some((b) => b.name === BUCKET)) await admin.storage.createBucket(BUCKET, { public: true });
    };

    // Model files are uploaded straight from the browser with a signed URL so
    // the scene JSON stays small (embedded models made publishing fail).
    if (body.action === "asset") {
      const ext = String(body.ext || "glb").replace(/[^a-z0-9]/gi, "").slice(0, 8) || "glb";
      const path = `assets/${user.id}/${crypto.randomUUID()}.${ext}`;
      await ensureBucket();
      const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, path, token: data.token, publicUrl: admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl });
    }

    const target = String(body.target || "level");
    const scene = body.scene;
    if (!scene || typeof scene !== "object" || !Array.isArray(scene.objects)) return json({ error: "Invalid scene" }, 400);
    const raw = JSON.stringify({ name: String(body.name || "Level").slice(0, 120), scene, publishedAt: new Date().toISOString(), by: user.id });
    if (raw.length > 20_000_000) return json({ error: "Scene too large to publish (20 MB max)" }, 413);

    let path: string;
    if (target === "plaza") {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "Only admins can publish the Plaza District" }, 403);
      path = "plaza-district.json";
    } else if (target === "office") {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "Only admins can publish the NYC Office" }, 403);
      path = "office-world.json";
    } else if (target === "office99") {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "Only admins can publish Floor 99" }, 403);
      path = "floor99-world.json";
    } else if (target === "level") {
      const id = String(body.levelId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
      if (!id) return json({ error: "Missing level id" }, 400);
      path = `levels/${user.id}/${id}.json`;
    } else {
      // Never let an unknown target silently fall through to a generic path:
      // the publisher would report success while the live world never changes.
      return json({ error: `Unknown publish target "${target}" — the studio-publish function needs the matching target.` }, 400);
    }

    await ensureBucket();
    const { error } = await admin.storage.from(BUCKET).upload(path, new Blob([raw], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "30" });
    if (error) return json({ error: error.message }, 500);
    const pub = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    return json({ ok: true, url: pub, path });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Publish failed" }, 500);
  }
});
