// Mirror of supabase/functions/_shared/af-emails.ts (preview only).
// Shared email templates for the Accelerated Fundraising program (aerospace hardware scale-up).
// Amber / cyan aerospace styling to match the /accelerated-fundraising page.

export const AF_LOGO_URL =
  "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

export const AF_COHORT_ID = "21bbf578-1347-43f8-bc56-d31fbd4af03d";
export const AF_APPLY_URL = `https://startupfactoryhub.com/cohorts/${AF_COHORT_ID}/apply`;
export const AF_PROGRAM_URL = "https://startupfactoryhub.com/accelerated-fundraising";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const shell = (opts: { title: string; kicker: string; heading: string; body: string }) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#080b12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080b12;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0f1520;border:1px solid rgba(245,158,11,0.22);border-radius:22px;overflow:hidden;">
  <tr><td style="height:4px;background:linear-gradient(90deg,#f59e0b 0%,#fbbf24 45%,#22d3ee 100%);line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td align="center" style="padding:28px 32px 0;">
    <img src="${AF_LOGO_URL}" alt="Startup Factory Hub" width="140" style="display:block;width:140px;max-width:60%;height:auto;border:0;outline:none;" />
  </td></tr>
  <tr><td style="padding:32px 32px 8px;">
    <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:10px;font-weight:700;letter-spacing:2.4px;color:#fbbf24;text-transform:uppercase;">${esc(opts.kicker)}</div>
    <div style="margin:14px 0 0;color:#f8fafc;font-size:24px;font-weight:800;line-height:1.25;">${esc(opts.heading)}</div>
  </td></tr>
  ${opts.body}
  <tr><td style="padding:0 32px 30px;">
    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.7;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
      Accelerated Fundraising &middot; Aerospace Hardware Batch &middot; Startup Factory Hub<br/>
      Questions? Reply to this email or write to
      <a href="mailto:info@startupfactoryhub.com" style="color:#fbbf24;text-decoration:none;">info@startupfactoryhub.com</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

const paragraph = (html: string) =>
  `<tr><td style="padding:12px 32px 0;"><p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">${html}</p></td></tr>`;

const cta = (label: string, url: string, sub?: string) => `
  <tr><td style="padding:24px 32px 6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(245,158,11,0.14),rgba(34,211,238,0.06));border:1px solid rgba(245,158,11,0.28);border-radius:16px;">
      <tr><td style="padding:24px;text-align:center;">
        ${sub ? `<div style="color:#94a3b8;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:10px;">${esc(sub)}</div>` : ""}
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#fbbf24 55%,#fde68a);color:#1a1200;font-size:15px;font-weight:800;text-decoration:none;padding:15px 38px;border-radius:999px;">${esc(label)} &rarr;</a>
        <p style="margin:14px 0 0;color:#64748b;font-size:12px;word-break:break-all;">Or copy this link: <a href="${url}" style="color:#fbbf24;text-decoration:none;">${url}</a></p>
      </td></tr>
    </table>
  </td></tr>`;

const stats = () => `
  <tr><td style="padding:20px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;border:1px solid rgba(245,158,11,0.16);border-radius:16px;">
      <tr>
        <td style="padding:18px 10px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
          <div style="color:#fbbf24;font-size:16px;font-weight:800;">Scale-Up</div>
          <div style="color:#64748b;font-size:10px;letter-spacing:1.4px;font-family:'SFMono-Regular',Consolas,monospace;">SPRINT</div>
        </td>
        <td style="padding:18px 10px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
          <div style="color:#22d3ee;font-size:16px;font-weight:800;">Free</div>
          <div style="color:#64748b;font-size:10px;letter-spacing:1.4px;font-family:'SFMono-Regular',Consolas,monospace;">PROGRAM COST</div>
        </td>
        <td style="padding:18px 10px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
          <div style="color:#f8fafc;font-size:16px;font-weight:800;">Aerospace</div>
          <div style="color:#64748b;font-size:10px;letter-spacing:1.4px;font-family:'SFMono-Regular',Consolas,monospace;">FOCUS</div>
        </td>
        <td style="padding:18px 10px;text-align:center;">
          <div style="color:#f8fafc;font-size:16px;font-weight:800;">Investor</div>
          <div style="color:#64748b;font-size:10px;letter-spacing:1.4px;font-family:'SFMono-Regular',Consolas,monospace;">MATCHING</div>
        </td>
      </tr>
    </table>
  </td></tr>`;

const requirements = () => `
  <tr><td style="padding:20px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;border:1px solid rgba(245,158,11,0.16);border-radius:16px;">
      <tr><td style="padding:22px 24px;">
        <div style="font-family:'SFMono-Regular',Consolas,monospace;color:#fbbf24;font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:12px;">Minimum Requirements</div>
        <p style="margin:0 0 6px;color:#94a3b8;font-size:14px;line-height:1.7;">01 &middot; Legally incorporated company</p>
        <p style="margin:0 0 6px;color:#94a3b8;font-size:14px;line-height:1.7;">02 &middot; Working prototype or MVP hardware</p>
        <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">03 &middot; Revenue optional — pre-revenue teams welcome</p>
      </td></tr>
    </table>
  </td></tr>`;

/** Sent right after signup when the founder says they're joining Accelerated Fundraising. */
export function buildAfWelcomeHtml(opts: { name?: string; applyUrl?: string } = {}) {
  const applyUrl = opts.applyUrl || AF_APPLY_URL;
  return shell({
    title: "Thank you for your interest in Accelerated Fundraising",
    kicker: "Accelerated Fundraising · Aerospace Hardware",
    heading: `Thank you for your interest, ${opts.name || "Founder"}`,
    body: `
      ${paragraph("Thank you for your interest in the <strong style=\"color:#f8fafc;\">Accelerated Fundraising</strong> program — our scale-up sprint for aerospace, defense and space hardware startups that already have a working prototype or MVP.")}
      ${paragraph("We match you with deep-tech investors, run technical diligence, open regulatory pathways and curate a Demo Day for your next round.")}
      ${stats()}
      ${cta("Apply to Accelerated Fundraising", applyUrl, "Next step")}
      ${requirements()}
      ${paragraph(`Want the full program overview first? <a href="${AF_PROGRAM_URL}" style="color:#fbbf24;text-decoration:none;">Open the program page</a>.`)}
    `,
  });
}

/** Sent when an application is accepted into the batch. */
export function buildAfAcceptanceHtml(opts: {
  name?: string;
  startup?: string;
  cohort?: string;
  interviewDate?: string;
  nextStepUrl?: string;
} = {}) {
  const url = opts.nextStepUrl || AF_PROGRAM_URL;
  return shell({
    title: "You're accepted — Accelerated Fundraising",
    kicker: `Accepted · ${opts.cohort || "Accelerated Fundraising"}`,
    heading: `Congratulations, ${opts.name || "Founder"} — you're in`,
    body: `
      ${paragraph(`<strong style="color:#f8fafc;">${esc(opts.startup || "Your startup")}</strong> has been accepted into ${esc(opts.cohort || "the Accelerated Fundraising batch")}. Your hardware, traction and readiness to raise stood out.`)}
      ${opts.interviewDate ? paragraph(`Your onboarding session is scheduled for <strong style="color:#f8fafc;">${esc(opts.interviewDate)}</strong>.`) : ""}
      ${paragraph("The program is free for selected startups. Next: complete your onboarding profile so we can start matching you with deep-tech investors.")}
      ${stats()}
      ${cta("Start onboarding", url, "Confirm your seat")}
    `,
  });
}

/** Follow-up for accepted startups that haven't completed onboarding. */
export function buildAfFollowUpHtml(opts: {
  name?: string;
  startup?: string;
  cohort?: string;
  deadline?: string;
  nextStepUrl?: string;
} = {}) {
  const url = opts.nextStepUrl || AF_PROGRAM_URL;
  return shell({
    title: "Quick follow-up — Accelerated Fundraising",
    kicker: `Follow-up · ${opts.cohort || "Accelerated Fundraising"}`,
    heading: `We're still holding your seat, ${opts.name || "Founder"}`,
    body: `
      ${paragraph(`We haven't received the onboarding details for <strong style="color:#f8fafc;">${esc(opts.startup || "your startup")}</strong> yet. Seats in this batch are limited and we'd hate for you to lose yours.`)}
      ${opts.deadline ? paragraph(`Please confirm before <strong style="color:#f8fafc;">${esc(opts.deadline)}</strong>.`) : ""}
      ${cta("Complete onboarding", url, "One step left")}
      ${paragraph("If your timing has changed, just reply to this email and we'll move you to the next batch.")}
    `,
  });
}

/** "Sorry we missed you" for founders that no-showed their interview. */
export function buildAfNoShowHtml(opts: {
  name?: string;
  startup?: string;
  cohort?: string;
  interviewDate?: string;
  rescheduleUrl?: string;
} = {}) {
  const url = opts.rescheduleUrl || `${AF_PROGRAM_URL}?reschedule=1`;
  return shell({
    title: "Sorry we missed you",
    kicker: `Missed interview · ${opts.cohort || "Accelerated Fundraising"}`,
    heading: `Sorry we missed you, ${opts.name || "Founder"}`,
    body: `
      ${paragraph(`We were looking forward to meeting the ${esc(opts.startup || "your startup")} team for your Accelerated Fundraising interview${opts.interviewDate ? ` on <strong style="color:#f8fafc;">${esc(opts.interviewDate)}</strong>` : ""}, but you weren't able to join.`)}
      ${paragraph("No problem — things come up. Your application is still open and we'd love to reschedule so your startup can be considered for this batch.")}
      ${cta("Reschedule your interview", url, "Pick a new time")}
    `,
  });
}
