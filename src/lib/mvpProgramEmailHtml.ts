// Mirror of supabase/functions/send-mvp-program/index.ts template (preview only)

export const MVP_APPLY_URL = "https://startupfactoryhub.com/mvp-program";

export const MVP_BENEFITS = [
  {
    tag: "BUILD",
    title: "Build your MVP",
    body: "Move from concept to shipped product in weeks with dedicated engineering, design and product support embedded in your batch.",
  },
  {
    tag: "MENTORSHIP",
    title: "Mentorship & Advisory",
    body: "Weekly 1:1 sessions with founders and operators who have built, scaled and exited companies in your vertical.",
  },
  {
    tag: "VALIDATION",
    title: "Market Validation",
    body: "Run structured experiments, interview real customers and collect telemetry that proves product-market fit before demo day.",
  },
  {
    tag: "NETWORK",
    title: "Global Network",
    body: "Plug into a worldwide mesh of partners, offices, enterprise clients and distribution channels across three continents.",
  },
  {
    tag: "CAPITAL",
    title: "Funding Access",
    body: "Get introduced to active seed and pre-seed investors, plus optional capital from the program and its alumni syndicate.",
  },
  {
    tag: "DEMO DAY",
    title: "Pitch on a curated stage",
    body: "Present to investors, corporates and press with a polished narrative and a live product demo.",
  },
  {
    tag: "READINESS",
    title: "Investor Readiness",
    body: "Leave with a data room, financial model, cap table, pitch deck and the storytelling skills to close a round.",
  },
  {
    tag: "TECH & AI",
    title: "Technology & AI Stack",
    body: "Full access to the Startup Factory Hub platform: AI tools, business intelligence engine, 200+ open-source technologies and cloud credits.",
  },
];

export function generateMvpProgramHtml(opts: {
  name?: string;
  deadline?: string;
  startupsPerBatch?: number;
  applyUrl?: string;
} = {}) {
  const name = opts.name || "Founder";
  const deadline = opts.deadline || "September 30, 2026";
  const seats = opts.startupsPerBatch ?? 20;
  const applyUrl = opts.applyUrl || MVP_APPLY_URL;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MVP Development Program — Startup Factory Hub</title>
</head>
<body style="margin:0;padding:0;background:#060b16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Build your MVP in 4 weeks. ${seats} seats per batch. Applications close ${deadline}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#060b16;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0b1220;border:1px solid rgba(16,185,129,0.18);border-radius:20px;overflow:hidden;">

  <tr><td style="background:linear-gradient(135deg,#0ea270 0%,#065f46 100%);padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.14);color:#ffffff;font-size:11px;font-weight:700;letter-spacing:2px;padding:6px 16px;border-radius:999px;">4-WEEK INTENSIVE &middot; BATCH OPEN</div>
    <h1 style="margin:18px 0 6px;color:#ffffff;font-size:28px;font-weight:800;line-height:1.2;">MVP Development Program</h1>
    <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;">From idea to shipped product, with mentorship, capital access and demo day</p>
  </td></tr>

  <tr><td style="padding:32px 32px 4px;">
    <p style="margin:0 0 8px;color:#e5e7eb;font-size:16px;line-height:1.6;">Hi ${name},</p>
    <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.7;">Applications are open for the next batch of the Startup Factory Hub MVP Development Program. Only <strong style="color:#10b981;">${seats} startups</strong> are accepted per batch, and applications close on <strong style="color:#10b981;">${deadline}</strong>.</p>
  </td></tr>

  <tr><td style="padding:20px 32px 4px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111a2c;border:1px solid rgba(16,185,129,0.16);border-radius:14px;">
      <tr>
        <td style="padding:16px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
          <div style="color:#10b981;font-size:18px;font-weight:800;">4 weeks</div>
          <div style="color:#6b7280;font-size:11px;letter-spacing:1px;">DURATION</div>
        </td>
        <td style="padding:16px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
          <div style="color:#10b981;font-size:18px;font-weight:800;">${seats}</div>
          <div style="color:#6b7280;font-size:11px;letter-spacing:1px;">SEATS</div>
        </td>
        <td style="padding:16px;text-align:center;">
          <div style="color:#10b981;font-size:18px;font-weight:800;">${deadline}</div>
          <div style="color:#6b7280;font-size:11px;letter-spacing:1px;">DEADLINE</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:22px 32px 6px;">
    <div style="color:#f3f4f6;font-size:15px;font-weight:800;letter-spacing:0.5px;">What you get</div>
  </td></tr>

  ${MVP_BENEFITS.map((f) => `
  <tr><td style="padding:8px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111a2c;border:1px solid rgba(16,185,129,0.16);border-radius:14px;">
      <tr><td style="padding:18px 20px;">
        <div style="color:#10b981;font-size:10px;font-weight:800;letter-spacing:1.4px;margin-bottom:6px;">${f.tag}</div>
        <div style="color:#f3f4f6;font-size:16px;font-weight:700;margin-bottom:6px;">${f.title}</div>
        <div style="color:#9ca3af;font-size:13.5px;line-height:1.7;">${f.body}</div>
      </td></tr>
    </table>
  </td></tr>`).join('')}

  <tr><td style="padding:28px 32px 36px;text-align:center;">
    <a href="${applyUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 38px;border-radius:999px;">Apply to the MVP Program</a>
    <p style="margin:14px 0 0;color:#6b7280;font-size:12px;">Or copy this link: <a href="${applyUrl}" style="color:#10b981;text-decoration:none;">${applyUrl}</a></p>
  </td></tr>

  <tr><td style="background:#070d18;padding:26px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0 0 6px;color:#6b7280;font-size:12px;">Startup Factory Hub &middot; Building the global startup ecosystem</p>
    <p style="margin:0;color:#4b5563;font-size:11px;">You receive this email because you have an active Startup Factory Hub account.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
