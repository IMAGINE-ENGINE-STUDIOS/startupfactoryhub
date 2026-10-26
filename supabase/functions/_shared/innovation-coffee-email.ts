// Innovation Coffee Table invitation email.
// © Imagine Engine Studios Corp. — built for Startup Factory Hub.

export const IC_BANNER_URL = "https://startupfactoryhub.com/email/members-club-banner.png";
/** @deprecated kept for older imports */
export const IC_BANNER_GIF_URL = IC_BANNER_URL;
export const IC_VENUE = "Foxtail Coffee Co. — Belle Isle";
export const IC_ADDRESS_LINES = ["7813 S Orange Ave, Suite 132", "Orlando, FL 32809"];
export const IC_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=7813+S+Orange+Ave+Suite+132+Orlando+FL+32809";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildInnovationCoffeeHtml(opts: { name?: string; when?: string } = {}) {
  const greeting = opts.name ? `Hi ${esc(opts.name)},` : "Hi there,";
  const when = esc(opts.when || "Today");
  const font = "'Helvetica Neue',Helvetica,Arial,sans-serif";
  const label = `font-family:${font};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#4fe3d8;font-weight:700;`;
  const body = `font-family:${font};font-size:16px;line-height:1.7;color:#a9bfc9;`;
  const chip = (t: string) =>
    `<td style="padding:0 6px 8px 0;"><span style="display:inline-block;font-family:${font};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#bfeff0;border:1px solid #1f5a63;background:#0c2229;border-radius:6px;padding:7px 10px;">${t}</span></td>`;
  const row = (k: string, v: string, sub = "") =>
    `<tr><td valign="top" width="88" style="padding:14px 0;border-bottom:1px solid #12313a;${label}">${k}</td><td style="padding:14px 0;border-bottom:1px solid #12313a;font-family:${font};font-size:16px;line-height:1.5;color:#ffffff;font-weight:600;">${v}${sub ? `<div style="font-size:14px;font-weight:400;color:#a9bfc9;margin-top:2px;">${sub}</div>` : ""}</td></tr>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">
<title>Innovation Coffee Table — Startup Factory Hub</title></head>
<body style="margin:0;padding:0;background:#030a10;">
<div style="display:none;max-height:0;overflow:hidden;">Join us today at the Members Club — ${esc(IC_ADDRESS_LINES.join(", "))}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#030a10;background-image:radial-gradient(circle at 50% 0%,#0b2a35 0%,#030a10 60%);"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="padding:0 4px 16px;font-family:${font};font-size:11px;letter-spacing:4px;color:#5b7f8a;text-transform:uppercase;">Startup Factory Hub &middot; Members Club</td></tr>
<tr><td style="background:#071219;border:1px solid #143a44;border-radius:18px;overflow:hidden;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td><a href="https://startupfactoryhub.com/members-club"><img src="${IC_BANNER_URL}" width="600" alt="Startup Factory Hub Members Club — 7813 S Orange Ave, Suite 132, Orlando, FL 32809" style="display:block;width:100%;height:auto;border:0;border-radius:18px 18px 0 0;"></a></td></tr>
<tr><td style="height:3px;line-height:3px;font-size:0;background:#2fd6c8;background-image:linear-gradient(90deg,#2fe0b0,#3aa8f0);">&nbsp;</td></tr>
<tr><td style="padding:40px 40px 8px;">
<p style="margin:0 0 14px;"><span style="display:inline-block;${label}background:#0c2a30;border:1px solid #1f5a63;border-radius:999px;padding:6px 12px;">&#9679;&nbsp; Happening ${when.toLowerCase() === "today" ? "today" : when}</span></p>
<h1 style="margin:0 0 6px;font-family:${font};font-size:36px;line-height:1.1;font-weight:900;letter-spacing:-0.5px;color:#ffffff;">Innovation Coffee Table</h1>
<p style="margin:0 0 26px;font-family:${font};font-size:17px;line-height:1.5;color:#4fe3d8;font-weight:500;">Coffee, founders and real conversations.</p>
<p style="margin:0 0 14px;${body}">${greeting}</p>
<p style="margin:0 0 14px;${body}">Join founders, mentors and investors from the Startup Factory Hub community for coffee and real conversations about building, funding and scaling ventures.</p>
<p style="margin:0 0 24px;${body}">Bring a question, an idea or a project &mdash; and leave with new connections.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>${chip("Founders")}${chip("Mentors")}${chip("Investors")}${chip("Coffee for paying members")}</tr></table>
</td></tr>
<tr><td style="padding:20px 40px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a1b22;border:1px solid #17414b;border-radius:14px;"><tr><td style="padding:6px 22px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row("Where", esc(IC_VENUE), IC_ADDRESS_LINES.map(esc).join("<br>"))}
${row("When", when)}
<tr><td valign="top" width="88" style="padding:14px 0;${label}">Members</td><td style="padding:14px 0;font-family:${font};font-size:15px;line-height:1.5;color:#a9bfc9;">Two coffees are included only for paying members (Venture Network &#36;50/mo or higher). Show your active member card at the counter. Guests are welcome to order from the menu.</td></tr>
</table></td></tr></table>
</td></tr>
<tr><td align="center" style="padding:32px 40px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding:0 6px 8px;"><a href="${IC_MAPS_URL}" style="display:inline-block;background:#2fd6c8;background-image:linear-gradient(90deg,#2fe0b0,#3aa8f0);color:#03121a;text-decoration:none;font-family:${font};font-weight:800;font-size:15px;letter-spacing:0.5px;padding:15px 30px;border-radius:999px;">Get directions &rarr;</a></td>
<td style="padding:0 6px 8px;"><a href="https://startupfactoryhub.com/members-club" style="display:inline-block;border:1px solid #2a6b74;color:#bfeff0;text-decoration:none;font-family:${font};font-weight:700;font-size:15px;padding:14px 26px;border-radius:999px;">Members Club</a></td>
</tr></table>
</td></tr>
</table></td></tr>
<tr><td align="center" style="padding:24px 12px 0;font-family:${font};font-size:12px;line-height:1.6;color:#5b7f8a;">Startup Factory Hub &middot; <a href="https://startupfactoryhub.com" style="color:#4fe3d8;text-decoration:none;">startupfactoryhub.com</a><br>${esc(IC_ADDRESS_LINES.join(", "))}</td></tr>
</table></td></tr></table></body></html>`;
}
