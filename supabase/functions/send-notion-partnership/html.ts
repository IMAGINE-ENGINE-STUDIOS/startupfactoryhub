export const NOTION_REFERRAL_URL =
  "https://www.notion.com/startups?utm_medium=partner&utm_source=startup_partner&utm_campaign=startup-program-partner-startupfactoryhub&partner=STARTUP%20FACTORY%20HUB%20&partnerKey=STARTUP4110P85657";

export function generateNotionPartnershipHtml(recipientName: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:20px;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#0f1419;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
  <div style="padding:28px 32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
    <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="Startup Factory Hub" width="56" height="56" style="border-radius:12px;object-fit:contain;" />
    <p style="color:#9ca3af;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;margin:10px 0 0;">Partnership Announcement &middot; Startup Members</p>
  </div>
  <div style="padding:32px;text-align:center;background:linear-gradient(135deg,#1a1f35,#0f1419);">
    <div style="display:inline-block;background:#ffffff;border-radius:12px;padding:10px 18px;">
      <img src="https://startupfactoryhub.com/partners/notion-logo.png" alt="Notion" width="180" style="display:block;" />
    </div>
    <h1 style="color:#f3f4f6;font-size:24px;font-weight:800;margin:20px 0 10px;">Startup Factory Hub &times; Notion for Startups</h1>
    <p style="color:#d1d5db;font-size:15px;line-height:1.7;margin:0;"><strong style="color:#fff;">6 months free on the Business plan with Notion AI included</strong></p>
  </div>
  <div style="padding:28px 32px;">
    <p style="color:#d1d5db;font-size:14px;line-height:1.8;margin:0 0 16px;">Hi <strong style="color:#f3f4f6;">${recipientName}</strong>,</p>
    <p style="color:#d1d5db;font-size:14px;line-height:1.8;margin:0 0 16px;">We&rsquo;re excited to partner with Notion to offer <strong style="color:#f3f4f6;">6 months free on the Business plan with Notion AI included</strong> to startups in our ecosystem.</p>
    <p style="color:#d1d5db;font-size:14px;line-height:1.8;margin:0 0 22px;">If you don&rsquo;t know Notion, thousands of startups use Notion to run a wiki, manage projects, share documents, and more.</p>

    <div style="background:#1a1f35;border-radius:12px;padding:20px 22px;border:1px solid rgba(255,255,255,0.08);margin-bottom:16px;">
      <p style="color:#f3f4f6;font-size:15px;font-weight:700;margin:0 0 10px;">Eligibility requirements</p>
      <ul style="color:#d1d5db;font-size:14px;line-height:1.9;margin:0;padding-left:18px;">
        <li>Must be a non-paying Notion customer</li>
        <li>Must have not received any previous Notion promo</li>
        <li>Must have a valid work email and company website</li>
        <li>Under 100 employees</li>
      </ul>
    </div>

    <div style="background:#1a1f35;border-radius:12px;padding:20px 22px;border:1px solid rgba(255,255,255,0.08);margin-bottom:22px;">
      <p style="color:#f3f4f6;font-size:15px;font-weight:700;font-style:italic;margin:0 0 10px;">Redemption Instructions</p>
      <p style="color:#d1d5db;font-size:14px;line-height:1.8;margin:0 0 10px;">To redeem the Notion for Startups offer, submit an application through our custom link below.</p>
      <p style="color:#d1d5db;font-size:14px;line-height:1.8;margin:0;">The Notion Startup Team will review your application and apply your offer within 2&ndash;3 business days, then send you a confirmation email. If you have any questions, please email <a href="mailto:startups-help@makenotion.com" style="color:#e5e7eb;">startups-help@makenotion.com</a>.</p>
    </div>

    <div style="text-align:center;padding:4px 0 8px;">
      <a href="${NOTION_REFERRAL_URL}" style="display:inline-block;background:#ffffff;color:#111111;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;">Apply for Notion for Startups</a>
    </div>
  </div>
  <div style="padding:22px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:0;">This offer is exclusive to Startup Factory Hub startup members.</p>
    <p style="color:#6b7280;font-size:12px;margin:8px 0 0;">&copy; 2026 <a href="https://startupfactoryhub.com" style="color:#9ca3af;text-decoration:none;">Startup Factory Hub</a></p>
  </div>
</div>
</body></html>`;
}
