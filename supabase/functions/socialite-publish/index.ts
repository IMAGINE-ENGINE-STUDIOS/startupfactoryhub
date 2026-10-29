// SOCIALITE "Post now" — any signed-in user, with their own keys. Platform logic lives in _shared/socialitePublish.ts.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireUser } from "../_shared/socialiteVault.ts";
import { publishAll } from "../_shared/socialitePublish.ts";
import { meter } from "../_shared/socialiteBilling.ts";
import { guard, record } from "../_shared/socialiteShield.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const OK = ["facebook", "instagram", "threads", "x", "tiktok", "youtube"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if ("error" in auth) return json({ success: false, error: auth.error }, auth.status);
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.slice(0, 63000) : "";
    const platforms = (Array.isArray(body?.platforms) ? body.platforms : []).filter((p: unknown) => OK.includes(p as string));
    const media = (Array.isArray(body?.media) ? body.media : []).filter((m: unknown) => typeof m === "string" && /^https:\/\//.test(m as string));
    if (!text && !media.length) return json({ success: false, error: "Nothing to post" }, 400);
    const shield = await guard(auth.userId, auth.isAdmin, "post", { text, platforms });
    if (!shield.ok) return json({ success: false, shield, error: shield.blocks.map((b) => b.message).join(" · ") }, 422);
    // Commercial metering: one post per platform; refused before anything is published.
    const check = await meter(auth.userId, auth.isAdmin, "posts", Math.max(1, platforms.length), {}, true);
    if (!check.ok) return json({ success: false, error: check.reason, billing: true }, 402);
    const result = await publishAll(text, platforms, media, auth.userId, typeof body?.format === "string" ? body.format : undefined);
    await record(auth.userId, "post", { text, platforms });
    await meter(auth.userId, auth.isAdmin, "posts", Math.max(1, platforms.length), { platforms });
    return json({ ...result, shield });
  } catch (e) {
    return json({ success: false, error: (e as Error).message }, 500);
  }
});
