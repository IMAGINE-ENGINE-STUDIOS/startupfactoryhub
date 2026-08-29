import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  billing: "one_time" | "monthly" | "yearly";
}

interface Recipient {
  email: string;
  name?: string;
}

interface Body {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  currency: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  notes?: string;
  paymentLinkUrl?: string;
  recipients: Recipient[];
  senderName?: string;
}

const billingLabel: Record<string, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  yearly: "Yearly",
};

const fmt = (n: number, cur: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: (cur || "usd").toUpperCase() }).format(n || 0);

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(b: Body, r: Recipient): string {
  const cell = "padding:10px 8px;border-bottom:1px solid #eee;font-size:13px;vertical-align:top;word-break:break-word;";
  const rows = b.items
    .filter((i) => i.description?.trim())
    .map(
      (i) => `<tr>
        <td style="${cell}color:#111;">${escapeHtml(i.description).replace(/\n/g, "<br/>")}</td>
        <td style="${cell}color:#555;">${billingLabel[i.billing] || ""}</td>
        <td style="${cell}color:#111;text-align:right;">${i.quantity}</td>
        <td style="${cell}color:#111;text-align:right;white-space:nowrap;">${fmt(i.unit_price, b.currency)}</td>
        <td style="${cell}color:#111;text-align:right;font-weight:600;white-space:nowrap;">${fmt(i.quantity * i.unit_price, b.currency)}</td>
      </tr>`
    )
    .join("");

  const totals = [
    `<tr><td style="padding:6px 8px;color:#555;">Subtotal</td><td style="padding:6px 8px;text-align:right;color:#111;">${fmt(b.subtotal, b.currency)}</td></tr>`,
    (b.discount || 0) > 0
      ? `<tr><td style="padding:6px 8px;color:#555;">Discount</td><td style="padding:6px 8px;text-align:right;color:#111;">-${fmt(b.discount || 0, b.currency)}</td></tr>`
      : "",
    (b.taxAmount || 0) > 0
      ? `<tr><td style="padding:6px 8px;color:#555;">Tax (${b.taxRate || 0}%)</td><td style="padding:6px 8px;text-align:right;color:#111;">${fmt(b.taxAmount || 0, b.currency)}</td></tr>`
      : "",
    `<tr><td style="padding:10px 8px;color:#111;font-weight:700;border-top:1px solid #e3e7ee;">Amount due</td><td style="padding:10px 8px;text-align:right;font-weight:700;color:#0ea270;font-size:16px;border-top:1px solid #e3e7ee;">${fmt(b.total, b.currency)}</td></tr>`,
  ].join("");

  const payButton = b.paymentLinkUrl
    ? `<div style="margin:28px 0;text-align:center;">
        <a href="${b.paymentLinkUrl}" style="background:#0ea270;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">Pay invoice securely</a>
        <div style="margin-top:10px;font-size:12px;color:#777;word-break:break-all;">Or copy this link: <a href="${b.paymentLinkUrl}" style="color:#0ea270;word-break:break-all;">${b.paymentLinkUrl}</a></div>
       </div>`
    : "";

  const notes = b.notes?.trim()
    ? `<div style="background:#f7f9fc;border-left:3px solid #0ea270;padding:14px 16px;margin:0 0 24px;border-radius:6px;color:#333;font-size:14px;white-space:pre-wrap;">${escapeHtml(b.notes)}</div>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;padding:24px;box-sizing:border-box;">
    <div style="border-bottom:2px solid #0ea270;padding-bottom:16px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:22px;color:#111;">Invoice ${escapeHtml(b.invoiceNumber)}</h1>
      <div style="color:#666;font-size:13px;margin-top:4px;">Startup Factory Hub${b.senderName ? ` — ${escapeHtml(b.senderName)}` : ""}</div>
      <div style="color:#666;font-size:13px;margin-top:2px;">Issued ${escapeHtml(b.issueDate)}${b.dueDate ? ` · Due ${escapeHtml(b.dueDate)}` : ""}</div>
    </div>

    <p style="color:#333;font-size:14px;margin:0 0 18px;">${r.name ? `Hi ${escapeHtml(r.name)},` : "Hello,"}</p>
    <p style="color:#333;font-size:14px;margin:0 0 20px;">Here is your invoice from Startup Factory Hub.${b.paymentLinkUrl ? " You can pay securely using the button below." : ""}</p>

    ${notes}

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;table-layout:fixed;">
      <colgroup><col style="width:42%"/><col style="width:14%"/><col style="width:10%"/><col style="width:16%"/><col style="width:18%"/></colgroup>
      <thead><tr style="background:#f7f9fc;">
        <th style="padding:10px 8px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;">Description</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;">Billing</th>
        <th style="padding:10px 8px;text-align:right;font-size:11px;color:#666;text-transform:uppercase;">Qty</th>
        <th style="padding:10px 8px;text-align:right;font-size:11px;color:#666;text-transform:uppercase;">Unit</th>
        <th style="padding:10px 8px;text-align:right;font-size:11px;color:#666;text-transform:uppercase;">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <table style="width:100%;border-collapse:collapse;background:#f7f9fc;border-radius:8px;overflow:hidden;">${totals}</table>

    ${payButton}

    <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
    <p style="color:#888;font-size:12px;margin:0;">Startup Factory Hub · info@startupfactoryhub.com</p>
  </div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Unauthorized: admin role required");

    const body = (await req.json()) as Body;
    if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { email: string; ok: boolean; error?: string }[] = [];

    for (const r of body.recipients) {
      try {
        const { error } = await resend.emails.send({
          from: "Startup Factory Hub <info@startupfactoryhub.com>",
          to: [r.email],
          subject: `Invoice ${body.invoiceNumber} from Startup Factory Hub`,
          html: buildHtml(body, r),
        });
        if (error) throw error;
        results.push({ email: r.email, ok: true });
      } catch (e) {
        console.error("invoice send failed", r.email, e);
        results.push({ email: r.email, ok: false, error: (e as Error)?.message || "Failed" });
      }
    }

    const sent = results.filter((r) => r.ok).length;
    return new Response(JSON.stringify({ success: true, sent, failed: results.length - sent, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-invoice-email error", e);
    return new Response(JSON.stringify({ error: (e as Error)?.message || "Failed to send" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
