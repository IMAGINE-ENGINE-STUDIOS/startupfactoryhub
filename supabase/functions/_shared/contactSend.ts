// Sends email / SMS / WhatsApp to a SOCIALITE user's own contacts (owner-checked).
// Used by socialite-send (now) and socialite-scheduler (kind=contact, later).
import { admin } from "./socialiteVault.ts";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function sendToContacts(ownerId: string, replyTo: string, channel: "email" | "sms" | "whatsapp" | "call", contact_ids: string[], subject: string, message: string, customHtml?: string) {
    const db = admin();
    const { data: contacts } = await db.from("socialite_contacts").select("id, name, email, phone").in("id", contact_ids).eq("owner_id", ownerId);
    const list = (contacts ?? []).filter((c) => (channel === "email" ? c.email : c.phone));
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let ok = 0;
    const sentIds: string[] = [];
    const queue = [...list];
    const worker = async () => {
      for (let c = queue.shift(); c; c = queue.shift()) {
        const first = (c.name || "").split(" ")[0] || "there";
        const text = message.replace(/\{first_name\}/g, first);
        try {
          if (channel === "email") {
            if (!resendKey) throw new Error("Email not configured");
            const html = customHtml ? customHtml.replace(/\{\{\s*first_name\s*\}\}|\{first_name\}/g, esc(first)) : `<div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#1f2937;font-size:16px;line-height:1.7;padding:24px;">${esc(text).split(/\n{2,}/).map((p) => `<p style="margin:0 0 16px;">${p.replace(/\n/g, "<br/>")}</p>`).join("")}</div>`;
            const r = await fetch("https://api.resend.com/emails", {
              method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ from: "SOCIALITE <info@startupfactoryhub.com>", to: [c.email], subject, html, reply_to: replyTo || undefined }),
            });
            if (!r.ok) throw new Error(await r.text());
          } else {
            const { data, error } = await db.functions.invoke(channel === "sms" ? "send-sms" : channel === "call" ? "make-voice-call" : "send-whatsapp", { body: { to: c.phone, message: text, recipientType: "contact", recipientName: c.name } });
            if (error || data?.success === false) throw new Error("send failed");
          }
          ok++; sentIds.push(c.id);
        } catch { /* counted as failed */ }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, list.length) }, worker));
    if (sentIds.length) await db.from("socialite_contacts").update({ last_sent_at: new Date().toISOString(), last_channel: channel }).in("id", sentIds);
  return { successful: ok, failed: contact_ids.length - ok };
}
