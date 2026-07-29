export const generateMoonshotNXHtml = (recipientName: string = "Founder") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #0a0f1e; padding: 20px; }
    .wrapper { max-width: 600px; margin: 0 auto; }
    .container { background: #0f1419; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(16,185,129,0.15); }
    .header { background: linear-gradient(135deg,#0ea270 0%,#059669 100%); padding: 32px; text-align: center; }
    .header img { width: 64px; height: 64px; border-radius: 14px; object-fit: contain; margin-bottom: 10px; }
    .header h1 { color: #fff; font-size: 20px; font-weight: 800; }
    .header p { color: rgba(255,255,255,0.85); font-size: 12px; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .banner { background: linear-gradient(135deg,#1a1f35,#0f1419); padding: 34px 32px; text-align: center; }
    .badge { display: inline-block; background: rgba(14,162,112,0.15); border: 1px solid rgba(14,162,112,0.4); color: #0ea270; padding: 6px 18px; border-radius: 50px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .banner h2 { color: #f3f4f6; font-size: 24px; font-weight: 800; margin: 18px 0 10px; }
    .banner p { color: #9ca3af; font-size: 14px; line-height: 1.7; }
    .content { padding: 26px 32px; }
    .intro { color: #d1d5db; font-size: 14px; line-height: 1.8; margin-bottom: 20px; }
    .section-title { color: #0ea270; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 26px 0 14px; }
    .card { background: #1a1f35; border-radius: 12px; padding: 22px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 16px; }
    .card h3 { color: #f3f4f6; font-size: 17px; font-weight: 700; margin-bottom: 8px; }
    .card p { color: #d1d5db; font-size: 14px; line-height: 1.7; }
    .card ul { list-style: none; margin-top: 12px; }
    .card ul li { color: #d1d5db; font-size: 14px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .card ul li:last-child { border-bottom: none; }
    .card a.link { display: inline-block; margin-top: 14px; color: #0ea270; text-decoration: none; font-weight: 600; font-size: 14px; }
    .cta-section { text-align: center; padding: 14px 0 4px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg,#0ea270,#059669); color: #fff; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 6px 24px rgba(14,162,112,0.4); }
    .closing { color: #9ca3af; font-size: 13px; line-height: 1.8; margin-top: 24px; }
    .footer { background: #0a0f1e; padding: 26px 32px; text-align: center; border-top: 1px solid rgba(14,162,112,0.1); }
    .footer p { color: #6b7280; font-size: 12px; line-height: 1.6; }
    .footer a { color: #0ea270; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" />
        <h1>Startup Factory Hub</h1>
        <p>Partnership Announcement</p>
      </div>

      <div class="banner">
        <div class="badge">New Partnership</div>
        <h2>Startup Factory Hub &times; MoonshotNX</h2>
        <p>Expanding the resources and funding opportunities available to founders in the Startup Factory Hub ecosystem.</p>
      </div>

      <div class="content">
        <p class="intro">
          Hi <strong style="color:#f3f4f6">${recipientName}</strong>, we are excited to announce our new partnership with
          <strong style="color:#f3f4f6">MoonshotNX</strong>. Through this collaboration, our members now have access to additional
          non-dilutive funding opportunities and specialized fundraising support designed to help early-stage startups accelerate their growth.
        </p>

        <div class="section-title">New Opportunities Available</div>

        <div class="card">
          <h3>M1 Innovation Grant</h3>
          <p>An independent non-dilutive funding opportunity available to eligible Pre-Seed and Seed-stage startups, providing founders with additional capital opportunities alongside fundraising support.</p>
          <a class="link" href="https://www.moonshotnx.com/innovation-grant">Explore the M1 Innovation Grant &rarr;</a>
        </div>

        <div class="card">
          <h3>3-Month Fundraising Sprint</h3>
          <p>A structured fundraising acceleration program designed to help founders:</p>
          <ul>
            <li>Improve investor readiness</li>
            <li>Prepare fundraising materials</li>
            <li>Build a fundraising strategy</li>
            <li>Accelerate capital raising over a focused three-month program</li>
          </ul>
          <a class="link" href="https://www.moonshotnx.com/raise-capital-for-your-startup">Join the Fundraising Sprint &rarr;</a>
        </div>

        <div class="cta-section">
          <a class="cta-btn" href="https://www.moonshotnx.com/innovation-grant">Explore the Opportunities</a>
        </div>

        <p class="closing">
          At Startup Factory Hub, we remain committed to connecting our founders with world-class partners, investors, grants,
          and commercialization resources that help transform innovative ideas into successful companies.
          We look forward to seeing many of our founders benefit from this exciting new partnership with MoonshotNX.
        </p>
      </div>

      <div class="footer">
        <p>You're receiving this as a valued member of Startup Factory Hub.</p>
        <p style="margin-top:8px">&copy; 2026 <a href="https://startupfactoryhub.com">Startup Factory Hub</a> &middot; All rights reserved</p>
      </div>
    </div>
  </div>
</body>
</html>`;
