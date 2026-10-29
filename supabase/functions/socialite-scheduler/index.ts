// SOCIALITE scheduler — runs every 5 minutes (pg_cron). Sends every
// socialite_scheduled row whose send_at has passed:
//   kind=post     payload {text, platforms[], media[], format?} → publishAll (format: photo|carousel|reel|story)
//   kind=email    payload = send-bulk-email body            → send-bulk-email
//   kind=call     payload {messages:[{to,message,recipientName}]} → make-voice-call
//   kind=contact  payload {channel, contact_ids, subject, message} → user's own contacts
//   kind=sms|whatsapp payload {messages:[{to,message,recipientName}]} → send-sms / send-whatsapp
// Rows are claimed (pending→sending) before work so a row is never sent twice.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { admin } from "../_shared/socialiteVault.ts";
import { publishAll } from "../_shared/socialitePublish.ts";
import { sendToContacts } from "../_shared/contactSend.ts";
import { meter } from "../_shared/socialiteBilling.ts";
import { guard, record, failSpike } from "../_shared/socialiteShield.ts";
import { topUpAutopilots } from "../_shared/socialiteAutopilot.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const URL_ = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const call = async (fn: string, body: unknown) => {
  const r = await fetch(`${URL_}/functions/v1/${fn}`, { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({ ok: r.ok }));
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const db = admin();
  // Autopilot: keep every active owner's next ~36h of posts filled. It only
  // enqueues normal scheduled rows — sending stays on the path below.
  try { await topUpAutopilots(db); } catch { /* top-up must never block due sends */ }
  const { data: due } = await db.from("socialite_scheduled").select("*").eq("status", "pending").lte("send_at", new Date().toISOString()).order("send_at").limit(25);
  const done: string[] = [];
  for (const row of due ?? []) {
    const { data: claimed } = await db.from("socialite_scheduled").update({ status: "sending" }).eq("id", row.id).eq("status", "pending").select("id");
    if (!claimed?.length) continue;
    let result: any;
    try {
      const p = row.payload ?? {};
      // Metered kinds (user posts / own-contact sends) are charged at actual send time.
      const mKind = row.kind === "post" ? "posts" : row.kind === "contact" ? p.channel : null;
      const mUnits = row.kind === "post" ? (p.platforms ?? []).length : (p.contact_ids ?? []).length;
      let isAdm = false;
      if (mKind && row.created_by) {
        const { data: pr } = await db.from("user_roles").select("role").eq("user_id", row.created_by).eq("role", "admin").maybeSingle();
        isAdm = !!pr;
        const pre = await meter(row.created_by, isAdm, mKind, mUnits, {}, true);
        if (!pre.ok) throw new Error(pre.reason);
        // Shield re-check at send time (caps/duplicates/content).
        const sh = await guard(row.created_by, isAdm, row.kind === "post" ? "post" : (p.channel === "call" ? "sms" : p.channel), { text: p.text ?? p.message, subject: p.subject, platforms: p.platforms, recipients: mUnits, timezone: row.timezone }, "schedule");
        if (!sh.ok) throw new Error("Shield: " + sh.blocks.map((b) => b.message).join(" · "));
        if (row.kind === "contact") p.message = sh.text;
      }
      if (row.kind === "post") {
        result = await publishAll(String(p.text ?? ""), p.platforms ?? [], p.media ?? [], row.created_by, typeof p.format === "string" ? p.format : undefined);
        const resultsList: any[] = Array.isArray(result?.results) ? result.results : Object.values(result?.results ?? {});
        const n = resultsList.filter((x: any) => x && !x.error && (x.id ?? x.success)).length;
        await record(row.created_by, "post", { text: p.text, platforms: p.platforms });
        if (n) await meter(row.created_by, isAdm, "posts", n, { via: "schedule" });
      }
      else if (row.kind === "email") result = await call("send-bulk-email", p);
      else if (row.kind === "sms" || row.kind === "whatsapp") {
        const fn = row.kind === "sms" ? "send-sms" : "send-whatsapp";
        let sent = 0, failed = 0;
        for (const m of p.messages ?? []) {
          const r = await call(fn, { ...m, recipientType: "client" });
          r?.success === false || r?.error ? failed++ : sent++;
        }
        result = { success: failed === 0, sent, failed };
      } else if (row.kind === "call") {
        let sent = 0, failed = 0;
        for (const m of p.messages ?? []) {
          const r = await call("make-voice-call", { ...m, recipientType: "client" });
          r?.success === false || r?.error ? failed++ : sent++;
        }
        result = { success: failed === 0, sent, failed };
      } else if (row.kind === "contact") {
        const r = await sendToContacts(row.created_by, "", p.channel, (p.contact_ids ?? []).slice(0, 200), String(p.subject ?? ""), String(p.message ?? ""));
        await record(row.created_by, p.channel === "call" ? "sms" : p.channel, { text: p.message, recipients: r.successful });
        await failSpike(row.created_by, p.channel === "call" ? "sms" : p.channel, r.successful, r.failed);
        if (r.successful) await meter(row.created_by, isAdm, p.channel, r.successful, { via: "schedule" });
        result = { success: r.failed === 0, ...r };
      } else result = { success: false, error: "Unknown kind" };
    } catch (e) { result = { success: false, error: (e as Error).message }; }
    const ok = result?.success !== false && !result?.error;
    await db.from("socialite_scheduled").update({ status: ok ? "sent" : "failed", result }).eq("id", row.id);
    done.push(row.id);
  }
  return json({ processed: done.length });
});
