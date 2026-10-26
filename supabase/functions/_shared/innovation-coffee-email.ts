// Innovation Coffee Table invitation email.
// © Imagine Engine Studios Corp. — built for Startup Factory Hub.

export const IC_BANNER_GIF_URL = "https://startupfactoryhub.com/email/innovation-coffee-banner.gif";
export const IC_VENUE = "Foxtail Coffee Co. — Belle Isle";
export const IC_ADDRESS_LINES = ["7813 S Orange Ave, Suite 132", "Orlando, FL 32809"];
export const IC_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=7813+S+Orange+Ave+Suite+132+Orlando+FL+32809";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildInnovationCoffeeHtml(opts: { name?: string; when?: string } = {}) {
  const greeting = opts.name ? `Hi ${esc(opts.name)},` : "Hi there,";
  const when = esc(opts.when || "Today");
  const label = "font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#2ee6a6;font-weight:700;";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Innovation Coffee Table</title></head>
<body style="margin:0;padding:0;background:#05080a;font-family:'Helvetica Neue',Arial,sans-serif;color:#e6f2ee;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05080a;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0b1114;border:1px solid #143028;border-radius:14px;overflow:hidden;">
<tr><td><a href="https://startupfactoryhub.com/equity-program"><img src="${IC_BANNER_GIF_URL}" width="600" alt="Startup Factory Hub Equity Program — From idea to investable company, 1–10% equity" style="display:block;width:100%;height:auto;border:0;"></a></td></tr>
<tr><td style="padding:32px 32px 8px;">
<p style="margin:0 0 8px;${label}">Happening today</p>
<h1 style="margin:0 0 16px;font-size:30px;line-height:1.15;font-weight:900;color:#ffffff;">Innovation Coffee Table</h1>
<p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#b8c9c3;">${greeting}</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#b8c9c3;">Join founders, mentors and investors from the Startup Factory Hub community for coffee and real conversations about building, funding and scaling ventures. Come with a question, an idea or a project — and leave with new connections.</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#b8c9c3;">Members: show your member card at the counter — two coffees are included.</p>
</td></tr>
<tr><td style="padding:0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1a17;border:1px solid #1d4a3b;border-radius:10px;"><tr><td style="padding:20px;">
<p style="margin:0 0 6px;${label}">Where</p>
<p style="margin:0;font-size:17px;line-height:1.5;color:#ffffff;font-weight:700;">${IC_VENUE}</p>
<p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#b8c9c3;">${IC_ADDRESS_LINES.join("<br>")}</p>
<p style="margin:0 0 6px;${label}">When</p>
<p style="margin:0;font-size:15px;color:#ffffff;">${when}</p>
</td></tr></table></td></tr>
<tr><td align="center" style="padding:28px 32px 32px;"><a href="${IC_MAPS_URL}" style="display:inline-block;background:#2ee6a6;color:#05080a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;">Get directions</a></td></tr>
</table></td></tr></table></body></html>`;
}
