// SOCIALITE Shield endpoint.
//   preview  (any user)   → dry-run check, nothing logged: { ok, blocks, warnings, text }
//   mine     (any user)   → own status + last 30 days of warnings/blocks + rule set
//   flags    (main admin) → open/decided flags with user email
//   decide   (main admin) → dismiss | warn | restrict | suspend | restore
//   rules    (main admin) → save config overrides
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, requireUser } from "../_shared/socialiteVault.ts";
import { check, loadConfig } from "../_shared/socialiteShield.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("preview"), kind: z.enum(["post", "email", "sms", "whatsapp"]), text: z.string().max(63000).optional(), subject: z.string().max(300).optional(), platforms: z.array(z.string().max(20)).max(10).optional(), recipients: z.number().int().min(0).max(100000).optional(), timezone: z.string().max(64).optional(), scheduled: z.boolean().optional() }),
  z.object({ action: z.literal("mine") }),
  z.object({ action: z.literal("flags") }),
  z.object({ action: z.literal("decide"), flag_id: z.string().uuid().optional(), owner_id: z.string().uuid(), decision: z.enum(["dismiss", "warn", "restrict", "suspend", "restore"]), note: z.string().max(500).optional() }),
  z.object({ action: z.literal("rules"), config: z.record(z.unknown()) }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if ("error" in auth) return json({ error: auth.error }, auth.status);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const b = parsed.data;
    const db = admin();

    if (b.action === "preview") {
      return json(await check(auth.userId, auth.isAdmin, b.kind, b));
    }
    if (b.action === "mine") {
      const [{ data: st }, { data: ev }, config] = await Promise.all([
        db.from("socialite_shield_status").select("status, note").eq("owner_id", auth.userId).maybeSingle(),
        db.from("socialite_shield_events").select("action, level, rule, message, created_at").eq("owner_id", auth.userId).neq("level", "sent").gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString()).order("created_at", { ascending: false }).limit(200),
        loadConfig(),
      ]);
      return json({ status: st?.status ?? "normal", note: st?.note ?? null, events: ev ?? [], config });
    }
    if (!auth.isAdmin) return json({ error: "Admins only" }, 403);

    if (b.action === "flags") {
      const { data: flags } = await db.from("socialite_shield_flags").select("*").order("created_at", { ascending: false }).limit(200);
      const ids = [...new Set((flags ?? []).map((f: any) => f.owner_id))];
      const [{ data: profs }, { data: sts }, { data: ev }] = await Promise.all([
        ids.length ? db.from("profiles").select("id, email, first_name, last_name").in("id", ids) : Promise.resolve({ data: [] as any[] }),
        ids.length ? db.from("socialite_shield_status").select("owner_id, status").in("owner_id", ids) : Promise.resolve({ data: [] as any[] }),
        ids.length ? db.from("socialite_shield_events").select("owner_id, action, rule, message, created_at").in("owner_id", ids).eq("level", "block").order("created_at", { ascending: false }).limit(500) : Promise.resolve({ data: [] as any[] }),
      ]);
      const P = new Map((profs ?? []).map((p: any) => [p.id, p]));
      const S = new Map((sts ?? []).map((s: any) => [s.owner_id, s.status]));
      return json({
        flags: (flags ?? []).map((f: any) => ({ ...f, user: P.get(f.owner_id) ?? null, user_status: S.get(f.owner_id) ?? "normal", recent: (ev ?? []).filter((e: any) => e.owner_id === f.owner_id).slice(0, 8) })),
        config: await loadConfig(),
      });
    }
    if (b.action === "decide") {
      const map: Record<string, string | null> = { dismiss: null, warn: null, restrict: "restricted", suspend: "suspended", restore: "normal" };
      const st = map[b.decision];
      if (st) await db.from("socialite_shield_status").upsert({ owner_id: b.owner_id, status: st, note: b.note ?? null });
      if (b.decision === "warn") await db.from("socialite_shield_events").insert({ owner_id: b.owner_id, action: "post", level: "notice", rule: "admin_warning", message: b.note || "The SOCIALITE team reviewed your recent activity. Please follow the platform rules to keep sending.", details: { by: auth.userId } });
      if (b.flag_id) await db.from("socialite_shield_flags").update({ status: b.decision === "restore" ? "resolved" : "decided", decision: b.decision, decided_by: auth.userId, decided_at: new Date().toISOString() }).eq("id", b.flag_id);
      return json({ ok: true });
    }
    if (b.action === "rules") {
      await db.from("socialite_shield_rules").upsert({ id: 1, config: b.config, updated_at: new Date().toISOString() });
      return json({ ok: true, config: await loadConfig() });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
