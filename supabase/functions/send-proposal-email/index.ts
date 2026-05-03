import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProposalItem {
  description: string;
  billing: "one_time" | "monthly" | "yearly";
  quantity: number;
  unit_price: number;
}

interface Body {
  recipients: string[];
  proposalNumber: string;
  clientName?: string;
  currency: string;
  items: ProposalItem[];
  oneTimeTotal: number;
  monthlyTotal: number;
  yearlyTotal: number;
  paymentLinkUrl?: string;
  pdfBase64?: string;
  message?: string;
  senderName?: string;
}

const fmt = (n: number, cur: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(n || 0);

const billingLabel: Record<string, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  yearly: "Yearly",
};

function buildHtml(b: Body): string {
  const cellBase = "padding:10px 8px;border-bottom:1px solid #eee;font-size:13px;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;white-space:normal;";
  const itemsRows = b.items
    .filter((i) => i.description?.trim())
    .map(
      (i) => `
      <tr>
        <td style="${cellBase}color:#111;">${escapeHtml(i.description).replace(/\n/g, "<br/>")}</td>
        <td style="${cellBase}color:#555;">${billingLabel[i.billing] || ""}</td>
        <td style="${cellBase}color:#111;text-align:right;">${i.quantity}</td>
        <td style="${cellBase}color:#111;text-align:right;white-space:nowrap;">${fmt(i.unit_price, b.currency)}</td>
        <td style="${cellBase}color:#111;text-align:right;font-weight:600;white-space:nowrap;">${fmt(i.quantity * i.unit_price, b.currency)}</td>
      </tr>`
    )
    .join("");

  const totalsRows = [
    b.oneTimeTotal > 0 ? `<tr><td style="padding:6px 8px;color:#555;">One-time total</td><td style="padding:6px 8px;text-align:right;font-weight:600;color:#111;">${fmt(b.oneTimeTotal, b.currency)}</td></tr>` : "",
    b.monthlyTotal > 0 ? `<tr><td style="padding:6px 8px;color:#555;">Monthly recurring</td><td style="padding:6px 8px;text-align:right;font-weight:600;color:#111;">${fmt(b.monthlyTotal, b.currency)}/mo</td></tr>` : "",
    b.yearlyTotal > 0 ? `<tr><td style="padding:6px 8px;color:#555;">Yearly recurring</td><td style="padding:6px 8px;text-align:right;font-weight:600;color:#111;">${fmt(b.yearlyTotal, b.currency)}/yr</td></tr>` : "",
  ].join("");

  const payButton = b.paymentLinkUrl
    ? `<div style="margin:28px 0;text-align:center;">
        <a href="${b.paymentLinkUrl}" style="background:#0ea270;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">Pay securely with Stripe</a>
        <div style="margin-top:10px;font-size:12px;color:#777;word-break:break-all;overflow-wrap:anywhere;">Or copy this link: <a href="${b.paymentLinkUrl}" style="color:#0ea270;word-break:break-all;overflow-wrap:anywhere;">${b.paymentLinkUrl}</a></div>
       </div>`
    : "";

  const customMessage = b.message?.trim()
    ? `<div style="background:#f7f9fc;border-left:3px solid #0ea270;padding:14px 16px;margin:0 0 24px;border-radius:6px;color:#333;font-size:14px;white-space:pre-wrap;">${escapeHtml(b.message)}</div>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;padding:32px;">
    <div style="border-bottom:2px solid #0ea270;padding-bottom:16px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:22px;color:#111;">Proposal ${escapeHtml(b.proposalNumber)}</h1>
      <div style="color:#666;font-size:13px;margin-top:4px;">From Startup Factory Hub${b.senderName ? ` — ${escapeHtml(b.senderName)}` : ""}</div>
    </div>

    <p style="color:#333;font-size:14px;margin:0 0 18px;">${b.clientName ? `Hi ${escapeHtml(b.clientName)},` : "Hello,"}</p>
    <p style="color:#333;font-size:14px;margin:0 0 20px;">Please find your proposal details below. ${b.paymentLinkUrl ? "You can pay securely using the button at the bottom of this email." : ""}</p>

    ${customMessage}

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="background:#f7f9fc;">
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Description</th>
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Billing</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Unit</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <table style="width:100%;border-collapse:collapse;background:#f7f9fc;border-radius:8px;overflow:hidden;">
      ${totalsRows}
    </table>

    ${payButton}

    <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
    <p style="color:#888;font-size:12px;margin:0;">Sent by Startup Factory Hub · info@startupfactoryhub.com</p>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;

    if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildHtml(body);
    const subject = `Proposal ${body.proposalNumber}${body.clientName ? ` for ${body.clientName}` : ""}`;

    const attachments = body.pdfBase64
      ? [{ filename: `${body.proposalNumber}.pdf`, content: body.pdfBase64 }]
      : undefined;

    const { data, error } = await resend.emails.send({
      from: "Startup Factory Hub <info@startupfactoryhub.com>",
      to: body.recipients,
      subject,
      html,
      attachments: attachments as any,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, id: (data as any)?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-proposal-email error", e);
    return new Response(JSON.stringify({ error: e?.message || "Failed to send" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
