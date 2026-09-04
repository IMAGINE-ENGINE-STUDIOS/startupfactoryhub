// Mirror of supabase/functions/send-mvp-payment-reminder/index.ts template (preview only).
// The real email replaces payUrl with a live Stripe Checkout session URL.

const LOGO_URL =
  "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

export const MVP_BROCHURE_URL = "https://startupfactoryhub.com/forstartups";
export const MVP_PROGRAM_FEE_CENTS = 500000;

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export function buildMvpReminderHtml(opts: {
  name: string;
  startup: string;
  cohort: string;
  payUrl: string;
  amount: string;
  deadline: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reminder: confirm your MVP Program seat</title></head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f19;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111827;border:1px solid rgba(245,158,11,0.24);border-radius:22px;overflow:hidden;">
  <tr><td style="height:4px;background:linear-gradient(90deg,#f59e0b 0%,#d946ef 50%,#06b6d4 100%);line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td align="center" style="background:#111827;padding:28px 32px 0;">
    <img src="${LOGO_URL}" alt="Startup Factory Hub" width="140" style="display:block;width:140px;max-width:60%;height:auto;border:0;outline:none;" />
  </td></tr>
  <tr><td style="background:#111827;padding:34px 32px 26px;">
    <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:10px;font-weight:700;letter-spacing:2.4px;color:#f59e0b;text-transform:uppercase;">Payment Pending &middot; ${esc(opts.cohort)}</div>
    <div style="margin:14px 0 0;color:#f3f4f6;font-size:24px;font-weight:800;line-height:1.25;">Your seat for ${esc(opts.startup)} is still on hold</div>
    <p style="margin:14px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">Hi ${esc(opts.name)}, you were accepted into the Startup Factory Hub MVP Development Program, but we haven't received your program payment yet.</p>
    <p style="margin:12px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">Seats are limited and confirmed in order of payment. Please complete your payment before <strong style="color:#f3f4f6;">${esc(opts.deadline)}</strong> so we can lock your place in the batch.</p>
  </td></tr>
  <tr><td style="padding:0 32px 26px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(245,158,11,0.14),rgba(217,70,239,0.08));border:1px solid rgba(245,158,11,0.24);border-radius:16px;">
      <tr><td style="padding:24px;text-align:center;">
        <div style="color:#94a3b8;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;">Program cost &middot; one-time payment</div>
        <div style="margin:6px 0 18px;color:#f3f4f6;font-size:34px;font-weight:900;">${esc(opts.amount)}</div>
        <a href="${opts.payUrl}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d946ef 55%,#06b6d4);color:#fff;font-size:15px;font-weight:800;text-decoration:none;padding:15px 38px;border-radius:999px;">Complete Payment Now &rarr;</a>
        <p style="margin:14px 0 0;color:#64748b;font-size:12px;word-break:break-all;">Or copy this link: <a href="${opts.payUrl}" style="color:#22d3ee;text-decoration:none;">${opts.payUrl}</a></p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 32px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05201a;border:1px solid rgba(34,211,238,0.16);border-radius:16px;">
      <tr><td style="padding:22px 24px;">
        <div style="font-family:'SFMono-Regular',Consolas,monospace;color:#22d3ee;font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:10px;">Program Brochure</div>
        <p style="margin:0 0 14px;color:#94a3b8;font-size:14px;line-height:1.7;">Need one more look before committing? Review the full 4-week agenda and deliverables.</p>
        <a href="${MVP_BROCHURE_URL}" style="display:inline-block;background:linear-gradient(135deg,#14b8a6 0%,#22d3ee 55%,#818cf8 100%);color:#05201a;font-size:14px;font-weight:800;text-decoration:none;padding:12px 28px;border-radius:999px;">Open MVP Program Brochure &rarr;</a>
        <p style="margin:12px 0 0;color:#64748b;font-size:12px;word-break:break-all;">${MVP_BROCHURE_URL}</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 32px 28px;">
    <div style="background:#0f172a;border:1px solid rgba(245,158,11,0.14);border-radius:16px;padding:22px 24px;">
      <div style="color:#f59e0b;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;margin-bottom:10px;">Questions or need more time?</div>
      <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">Reply to this email or write to <a href="mailto:info@startupfactoryhub.com" style="color:#22d3ee;text-decoration:none;">info@startupfactoryhub.com</a> and our team will help you with payment options or scheduling.</p>
      <p style="margin:18px 0 0;color:#f3f4f6;font-size:14px;font-weight:600;">Startup Factory Hub</p>
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export function generateMvpPaymentReminderHtml(opts: {
  name?: string;
  startupName?: string;
  cohortName?: string;
  amountCents?: number;
  deadline?: string;
  payUrl?: string;
} = {}) {
  return buildMvpReminderHtml({
    name: opts.name || "Founder",
    startup: opts.startupName || "Your startup",
    cohort: opts.cohortName || "MVP Program",
    deadline: opts.deadline || "September 29, 2026",
    amount: money(
      opts.amountCents && opts.amountCents > 0 ? opts.amountCents : MVP_PROGRAM_FEE_CENTS
    ),
    payUrl: opts.payUrl || "https://checkout.stripe.com/c/pay/preview-session",
  });
}
