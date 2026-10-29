// SOCIALITE "My contacts" sender — any signed-in user can email / text / WhatsApp
// the contacts THEY uploaded (socialite_contacts, owner-checked here).
// Email via Resend; SMS/WhatsApp reuse send-sms / send-whatsapp. Max 200 per request.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { requireUser } from "../_shared/socialiteVault.ts";
import { sendToContacts } from "../_shared/contactSend.ts";
import { meter } from "../_shared/socialiteBilling.ts";
import { guard, record, failSpike } from "../_shared/socialiteShield.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const Body = z.object({
  channel: z.enum(["email", "sms", "whatsapp", "call"]),
  html: z.string().max(400_000).optional(),
  contact_ids: z.array(z.string().uuid()).min(1).max(200),
  subject: z.string().trim().max(200).optional().default("A message for you"),
  message: z.string().trim().min(1).max(5000),
  timezone: z.string().max(64).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if ("error" in auth) return json({ error: auth.error }, auth.status);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }, 400);
    const { channel, contact_ids, subject, timezone } = parsed.data;
    const shield = await guard(auth.userId, auth.isAdmin, channel === "call" ? "sms" : channel, { text: parsed.data.message, subject, recipients: contact_ids.length, timezone });
    if (!shield.ok) return json({ error: shield.blocks.map((b) => b.message).join(" · "), shield }, 422);
    // Calls are spoken aloud: never add the SMS "Reply STOP" line to them.
    const message = channel === "call" ? parsed.data.message : shield.text;
    // Commercial metering: one unit per recipient, checked before sending.
    const check = await meter(auth.userId, auth.isAdmin, channel, contact_ids.length, {}, true);
    if (!check.ok) return json({ error: check.reason, billing: true }, 402);
    const result: any = await sendToContacts(auth.userId, auth.email, channel, contact_ids, subject, message, channel === "email" ? parsed.data.html : undefined);
    const sent = Number(result?.successful ?? 0) || 0;
    await record(auth.userId, channel === "call" ? "sms" : channel, { text: parsed.data.message, recipients: sent });
    await failSpike(auth.userId, channel === "call" ? "sms" : channel, sent, Number(result?.failed ?? 0) || 0);
    if (sent > 0) await meter(auth.userId, auth.isAdmin, channel, sent, { requested: contact_ids.length });
    return json({ ...result, shield });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
