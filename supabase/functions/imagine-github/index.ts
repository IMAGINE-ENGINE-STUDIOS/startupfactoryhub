// Imagine Engine GitHub proxy: admins push/pull projects with the server-held GITHUB_TOKEN.
// The token never reaches the browser; only repository endpoints the sync uses are allowed.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ALLOWED = [
  /^\/user$/,
  /^\/user\/repos$/,
  /^\/orgs\/[A-Za-z0-9_.-]+\/repos$/,
  /^\/repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\/(contents|git|branches)(\/[^?#]*)?)?(\?[^#]*)?$/,
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const token = Deno.env.get("GITHUB_TOKEN");
    if (!token) return json({ error: "GitHub token is not configured" }, 500);
    const auth = req.headers.get("Authorization") || "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "Sign in first" }, 401);
    const { data: isAdmin } = await sb.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (isAdmin !== true) return json({ error: "Only admins can use the server GitHub connection" }, 403);

    const body = await req.json().catch(() => ({}));
    if (body.status) return json({ ok: true });
    const path = String(body.path || "");
    const method = String(body.method || "GET").toUpperCase();
    if (!["GET", "PUT", "POST", "PATCH"].includes(method)) return json({ error: "Method not allowed" }, 400);
    if (path.length > 600 || path.includes("..") || !ALLOWED.some((r) => r.test(path))) return json({ error: "Path not allowed" }, 400);

    const r = await fetch("https://api.github.com" + path, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "imagine-engine" },
      body: body.body && method !== "GET" ? JSON.stringify(body.body) : undefined,
    });
    const text = await r.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
    if (!r.ok) console.error(`GitHub ${method} ${path} [${r.status}]: ${text.slice(0, 300)}`);
    return json({ status: r.status, data });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
