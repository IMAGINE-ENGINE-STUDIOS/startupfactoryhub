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
<body style="margin:0;padding:0;background:#04140f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">4-week remote intensive. Open to founders worldwide. ${seats} seats per batch. Applications close ${deadline}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#04140f;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#05201a;border:1px solid rgba(34,211,238,0.18);border-radius:22px;overflow:hidden;">

  <tr><td style="height:3px;background:linear-gradient(90deg,#14b8a6 0%,#22d3ee 50%,#818cf8 100%);line-height:3px;font-size:0;">&nbsp;</td></tr>

  <tr><td style="background:#062a21;padding:40px 32px 34px;">
    <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:10px;font-weight:700;letter-spacing:2.4px;color:#22d3ee;text-transform:uppercase;">4-Week Remote Intensive &middot; Worldwide &middot; Batch Open</div>
    <div style="margin:16px 0 0;color:rgba(255,255,255,0.78);font-size:15px;font-weight:300;letter-spacing:4px;text-transform:uppercase;">Launch your</div>
    <div style="margin:2px 0 0;color:#22d3ee;font-size:56px;font-weight:900;letter-spacing:-1px;line-height:1;">MVP</div>
    <div style="margin:10px 0 0;color:#f3f4f6;font-size:19px;font-weight:700;">Development Program</div>
    <p style="margin:12px 0 0;color:#94a3b8;font-size:13.5px;line-height:1.7;">From idea to shipped product in 4 weeks — mentorship, advisory, investor readiness and Demo Day. Fully remote, open to founders in any country.</p>
  </td></tr>

  <tr><td style="padding:28px 32px 4px;">
    <p style="margin:0 0 8px;color:#e5e7eb;font-size:16px;line-height:1.6;">Hi ${name},</p>
    <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">Applications are open for the next batch of the Startup Factory Hub MVP Development Program. The program runs 100% online, so you can join from anywhere in the world. Only <strong style="color:#22d3ee;">${seats} startups</strong> are accepted per batch, and applications close on <strong style="color:#22d3ee;">${deadline}</strong>.</p>
  </td></tr>

  <tr><td style="padding:22px 32px 4px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#083026;border:1px solid rgba(34,211,238,0.16);border-radius:16px;">
      <tr>
        <td style="padding:16px 10px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
          <div style="color:#14b8a6;font-size:17px;font-weight:800;">4 weeks</div>
          <div style="color:#64748b;font-size:10px;letter-spacing:1.4px;font-family:'SFMono-Regular',Consolas,monospace;">DURATION</div>
        </td>
        <td style="padding:16px 10px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
          <div style="color:#22d3ee;font-size:17px;font-weight:800;">${seats}</div>
          <div style="color:#64748b;font-size:10px;letter-spacing:1.4px;font-family:'SFMono-Regular',Consolas,monospace;">SEATS</div>
        </td>
        <td style="padding:16px 10px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
          <div style="color:#818cf8;font-size:17px;font-weight:800;">Worldwide</div>
          <div style="color:#64748b;font-size:10px;letter-spacing:1.4px;font-family:'SFMono-Regular',Consolas,monospace;">FORMAT</div>
        </td>
        <td style="padding:16px 10px;text-align:center;">
          <div style="color:#f3f4f6;font-size:14px;font-weight:800;">${deadline}</div>
          <div style="color:#64748b;font-size:10px;letter-spacing:1.4px;font-family:'SFMono-Regular',Consolas,monospace;">DEADLINE</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:26px 32px 8px;">
    <div style="font-family:'SFMono-Regular',Consolas,monospace;color:#22d3ee;font-size:10px;letter-spacing:2.2px;">// WHAT YOU GET</div>
  </td></tr>

  ${MVP_BENEFITS.map((f) => `
  <tr><td style="padding:7px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#083026;border:1px solid rgba(34,211,238,0.14);border-radius:16px;">
      <tr><td style="padding:18px 20px;">
        <div style="font-family:'SFMono-Regular',Consolas,monospace;color:#14b8a6;font-size:10px;font-weight:700;letter-spacing:1.8px;margin-bottom:6px;">${f.tag}</div>
        <div style="color:#f3f4f6;font-size:16px;font-weight:700;margin-bottom:6px;">${f.title}</div>
        <div style="color:#94a3b8;font-size:13.5px;line-height:1.7;">${f.body}</div>
      </td></tr>
    </table>
  </td></tr>`).join('')}

  <tr><td style="padding:28px 32px 36px;text-align:center;">
    <a href="${applyUrl}" style="display:inline-block;background:#0f766e;background-image:linear-gradient(135deg,#14b8a6,#22d3ee 55%,#818cf8);color:#05201a;font-size:15px;font-weight:800;text-decoration:none;padding:15px 38px;border-radius:999px;letter-spacing:0.4px;">Apply to the MVP Program</a>
    <p style="margin:14px 0 0;color:#64748b;font-size:12px;">Or copy this link: <a href="${applyUrl}" style="color:#22d3ee;text-decoration:none;">${applyUrl}</a></p>
  </td></tr>

  <tr><td style="background:#031a14;padding:26px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0 0 6px;color:#64748b;font-size:12px;">Startup Factory Hub &middot; A global, remote-first startup ecosystem</p>
    <p style="margin:0;color:#475569;font-size:11px;">You receive this email because you have an active Startup Factory Hub account.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
