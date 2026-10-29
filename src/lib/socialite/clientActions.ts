/**
 * clientActions — one place for every "send something to a client" action in
 * SOCIALITE (email, SMS, WhatsApp, quote, invoice, promotion, referral invite).
 * All sends go through the existing edge functions; each successful send is
 * written to communication_logs so the client's history shows it.
 */
import { supabase } from "@/integrations/supabase/client";

export interface SClient { id: string; first_name: string; last_name: string; email: string; phone: string | null; status?: string | null; address_city?: string | null; email_unsubscribed?: boolean }
export type Channel = "email" | "sms" | "whatsapp";

export const SITE = "https://startupfactoryhub.com";
export const REFERRAL_URL = `${SITE}/referral`;
export const CALENDLY = "https://calendly.com/startupfactoryhub/30min";
export const SIGN_TXT = "— Khalia · Startup Factory Hub";

export const fill = (t: string, c: Partial<SClient>) =>
  t.replace(/\{first_name\}/g, c.first_name || "there").replace(/\{last_name\}/g, c.last_name || "");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Plain text → simple elegant HTML email body (send-bulk-email adds signature + unsubscribe). */
export const textToHtml = (text: string) =>
  `<div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#1f2937;font-size:16px;line-height:1.7;padding:24px;">${esc(text)
    .split(/\n{2,}/).map(p => `<p style="margin:0 0 16px;">${p.replace(/\n/g, "<br/>")}</p>`).join("")}</div>`;

async function log(clientId: string, channel: "email" | "sms" | "whatsapp", recipient: string, content: string, ok: boolean, subject?: string) {
  try {
    await supabase.from("communication_logs").insert({
      client_id: clientId, channel, recipient, message_content: content.slice(0, 4000), subject: subject ?? null,
      status: ok ? "sent" : "failed", sent_at: ok ? new Date().toISOString() : null, direction: "outbound",
    } as any);
  } catch { /* history is best-effort */ }
}

/** Email one or many clients (tokens {{first_name}} are filled server-side). */
export async function emailClients(clientIds: string[], subject: string, html: string) {
  const { data, error } = await supabase.functions.invoke("send-bulk-email", { body: { client_ids: clientIds, custom_subject: subject, custom_html: html } });
  if (error) throw error;
  return data as { successful?: number; failed?: number };
}

export async function sendText(c: SClient, channel: "sms" | "whatsapp", text: string) {
  if (!c.phone) throw new Error("No phone number");
  const { error } = await supabase.functions.invoke(channel === "sms" ? "send-sms" : "send-whatsapp", {
    body: { to: c.phone, message: text, recipientType: "client", recipientName: `${c.first_name} ${c.last_name}`.trim() },
  });
  await log(c.id, channel, c.phone, text, !error);
  if (error) throw error;
}

/** Send a message to one client on the chosen channel. */
export async function sendToClient(c: SClient, channel: Channel, text: string, subject = "A note from Startup Factory Hub") {
  const body = fill(text, c);
  if (channel === "email") {
    if (c.email_unsubscribed) throw new Error("Client unsubscribed from email");
    await emailClients([c.id], subject, textToHtml(text.replace(/\{first_name\}/g, "{{first_name}}")));
    await log(c.id, "email", c.email, body, true, subject);
  } else await sendText(c, channel, body);
}

export async function emailQuote(q: any, clientId?: string) {
  const opts = Array.isArray(q.selected_options) ? q.selected_options : (q.selected_options?.options || []);
  const { error } = await supabase.functions.invoke("send-quote-email", {
    body: { customerEmail: q.email, customerName: q.name, poolModel: q.pool_model || "Custom project", totalAmount: Number(q.total_quote_amount) || 0, selectedOptions: opts, extras: q.selected_options?.customItems || {} },
  });
  if (clientId) await log(clientId, "email", q.email, `Quote ${q.pool_model || ""} $${Math.round(q.total_quote_amount || 0)}`, !error, "Your Startup Factory Hub quote");
  if (error) throw error;
}

export async function emailInvoice(inv: any, clientId?: string) {
  const { error } = await supabase.functions.invoke("send-invoice-email", { body: { invoiceId: inv.id, customerEmail: inv.customer_email, customerName: inv.customer_name } });
  if (clientId) await log(clientId, "email", inv.customer_email, `Invoice ${inv.invoice_number}`, !error, `Invoice ${inv.invoice_number}`);
  if (error) throw error;
}

export async function emailPromotion(promo: any, clientIds: string[] | "all") {
  const body: any = { promotion: promo };
  if (clientIds === "all") body.send_to_all = true; else body.client_ids = clientIds;
  const { data, error } = await supabase.functions.invoke("send-bulk-email", { body });
  if (error) throw error;
  return data as { successful?: number; failed?: number };
}

/** Load all clients once per session (fast repeat opens). */
let cache: SClient[] | null = null;
export async function loadClients(force = false): Promise<SClient[]> {
  if (cache && !force) return cache;
  const { data } = await supabase.from("clients")
    .select("id, first_name, last_name, email, phone, status, address_city, email_unsubscribed")
    .order("updated_at", { ascending: false }).limit(1000);
  cache = (data as SClient[]) || [];
  return cache;
}

/** Run sends 4 at a time; returns ok/fail counts. */
export async function runPool<T>(items: T[], fn: (x: T) => Promise<void>, onTick?: (done: number, ok: number) => void) {
  let i = 0, ok = 0, done = 0;
  const worker = async () => { while (i < items.length) { const x = items[i++]; try { await fn(x); ok++; } catch { /* counted */ } done++; onTick?.(done, ok); } };
  await Promise.all(Array.from({ length: Math.min(4, items.length) }, worker));
  return { ok, failed: items.length - ok };
}

export const FOLLOW_UPS: { label: string; subject: string; text: string }[] = [
  { label: "Check-in", subject: "Checking in on your backyard project", text: "Hi {first_name}, it's Khalia from Startup Factory Hub. How is your backyard project coming along? I'd love to help with the next step — book a time here: " + CALENDLY },
  { label: "Quote follow-up", subject: "Your Startup Factory Hub quote", text: "Hi {first_name}, just following up on your quote. Any questions I can answer? Happy to walk you through it: " + CALENDLY },
  { label: "Invoice reminder", subject: "A friendly invoice reminder", text: "Hi {first_name}, a friendly reminder that your Startup Factory Hub invoice is ready. Reply here or call me if you'd like to go over it." },
  { label: "Referral invite", subject: "Know someone who'd love a new backyard?", text: "Hi {first_name}, thank you for trusting Startup Factory Hub. If a friend or neighbor is dreaming of a new pool or patio, refer them here and earn a reward: " + REFERRAL_URL },
  { label: "Book a visit", subject: "Let's design your backyard", text: "Hi {first_name}, would you like a free design visit? Pick any time that suits you: " + CALENDLY },
];
