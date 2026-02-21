import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  documentTitle: string;
  shareToken: string;
  senderName: string;
  message?: string;
  accessLevel: 'view' | 'sign' | 'edit';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, documentTitle, shareToken, senderName, message, accessLevel }: EmailRequest = await req.json();

    const baseUrl = req.headers.get('origin') || 'https://startupfactoryhub.com';
    const shareUrl = `${baseUrl}/pdf-view/${shareToken}`;

    let actionText = 'View PDF';
    let description = 'You have been invited to view a PDF document.';

    if (accessLevel === 'sign') {
      actionText = 'Sign PDF';
      description = 'You have been invited to sign a PDF document.';
    } else if (accessLevel === 'edit') {
      actionText = 'Edit PDF';
      description = 'You have been invited to edit a PDF document.';
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #0a0f1e; padding: 20px; }
            .wrapper { max-width: 600px; margin: 0 auto; }
            .container { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(16,185,129,0.15); }
            .header { background: linear-gradient(135deg,#0ea270 0%,#059669 100%); padding: 36px 32px; text-align: center; }
            .header img { width: 70px; height: 70px; border-radius: 14px; margin-bottom: 12px; object-fit: contain; }
            .header h1 { color: #fff; font-size: 22px; font-weight: 700; }
            .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px; }
            .hero { background: linear-gradient(180deg,#1a1f35 0%,#0f1419 100%); padding: 32px; text-align: center; }
            .hero-icon { font-size: 56px; margin-bottom: 16px; }
            .hero h2 { color: #f3f4f6; font-size: 24px; font-weight: 700; margin-bottom: 8px; }
            .hero p { color: #9ca3af; font-size: 14px; line-height: 1.6; }
            .content { padding: 28px 32px; background: #0f1419; }
            .card { background: #1a1f35; border-radius: 12px; padding: 24px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 20px; }
            .card-label { color: #0ea270; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
            .card p { color: #d1d5db; font-size: 14px; line-height: 1.7; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #9ca3af; font-size: 14px; }
            .detail-value { color: #f3f4f6; font-size: 14px; font-weight: 600; }
            .cta-section { text-align: center; padding: 16px 0 8px; }
            .cta-btn { display: inline-block; background: linear-gradient(135deg,#0ea270,#059669); color: #fff; text-decoration: none; padding: 15px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 6px 24px rgba(14,162,112,0.4); }
            .url-fallback { margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; word-break: break-all; font-size: 12px; color: #6b7280; }
            .url-fallback a { color: #0ea270; }
            .footer { background: #0a0f1e; padding: 28px 32px; text-align: center; border-top: 1px solid rgba(14,162,112,0.1); }
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
                <p>Document ${actionText} Request</p>
              </div>
              <div class="hero">
                <div class="hero-icon">📄</div>
                <h2>${actionText} Request</h2>
                <p><strong>${senderName}</strong> ${description}</p>
              </div>
              <div class="content">
                <div class="card">
                  <div class="card-label">📋 Document Details</div>
                  <div class="detail-row"><span class="detail-label">Document</span><span class="detail-value">${documentTitle}</span></div>
                  <div class="detail-row"><span class="detail-label">From</span><span class="detail-value">${senderName}</span></div>
                  <div class="detail-row"><span class="detail-label">Action</span><span class="detail-value" style="color:#0ea270">${actionText}</span></div>
                  ${message ? `<div class="detail-row"><span class="detail-label">Message</span><span class="detail-value">${message}</span></div>` : ''}
                </div>
                <div class="cta-section">
                  <a href="${shareUrl}" class="cta-btn">🚀 ${actionText}</a>
                </div>
                <div class="url-fallback">
                  If the button doesn't work, copy and paste this link:<br><a href="${shareUrl}">${shareUrl}</a>
                </div>
              </div>
              <div class="footer">
                <p>This is an automated email from Startup Factory Hub.</p>
                <p style="margin-top:8px">© 2025 <a href="https://startupfactoryhub.com">Startup Factory Hub</a> · <a href="https://www.linkedin.com/company/startup-factory-hub">LinkedIn</a> · All rights reserved</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Startup Factory Hub <info@startupfactoryhub.com>',
      to: [to],
      subject: `📄 ${senderName} invited you to ${actionText.toLowerCase()}: ${documentTitle}`,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-pdf-signature-request function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});