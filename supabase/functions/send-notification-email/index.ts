import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to: string;
  title: string;
  message: string;
  type: string;
  recipientName?: string;
  actorName?: string;
  actorAvatarUrl?: string;
  actorRole?: string;
}

// Helper function to log API usage
async function logApiUsage(serviceName: string, endpoint: string, success: boolean) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from('api_usage_logs').insert({
        service_name: serviceName,
        endpoint: endpoint,
        request_count: 1,
        estimated_cost: 0.001,
        metadata: { 
          timestamp: new Date().toISOString(),
          success: success
        }
      });
    }
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function buildActorCardHtml(actorName?: string, actorAvatarUrl?: string, actorRole?: string): string {
  if (!actorName) return '';
  
  const initials = getInitials(actorName);
  const avatarHtml = actorAvatarUrl
    ? `<img src="${actorAvatarUrl}" alt="${actorName}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid rgba(14,162,112,0.4);" />`
    : `<div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#0ea270,#059669);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:700;border:2px solid rgba(14,162,112,0.4);">${initials}</div>`;
  
  const roleBadge = actorRole
    ? `<span style="display:inline-block;background:rgba(14,162,112,0.15);color:#0ea270;padding:2px 10px;border-radius:50px;font-size:11px;font-weight:600;text-transform:capitalize;margin-left:8px;">${actorRole}</span>`
    : '';

  return `
    <div style="display:flex;align-items:center;gap:14px;padding:16px 20px;margin-bottom:16px;background:rgba(14,162,112,0.06);border-radius:12px;border:1px solid rgba(14,162,112,0.15);">
      <div style="flex-shrink:0;">
        ${avatarHtml}
      </div>
      <div>
        <div style="color:#f3f4f6;font-size:15px;font-weight:700;">${actorName}${roleBadge}</div>
        <div style="color:#9ca3af;font-size:12px;margin-top:2px;">triggered this notification</div>
      </div>
    </div>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, title, message, type, recipientName, actorName, actorAvatarUrl, actorRole }: NotificationEmailRequest = await req.json();

    console.log(`Sending notification email to ${to}: ${title}`);

    const actorCardHtml = buildActorCardHtml(actorName, actorAvatarUrl, actorRole);

    const emailResponse = await resend.emails.send({
      from: "Startup Factory Hub <info@startupfactoryhub.com>",
      to: [to],
      subject: `[Startup Factory Hub] ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                background-color: #0a0f1e;
                margin: 0; 
                padding: 20px;
                line-height: 1.6;
              }
              .email-wrapper { max-width: 600px; margin: 0 auto; }
              .container { 
                background-color: #ffffff; 
                border-radius: 16px; 
                overflow: hidden; 
                box-shadow: 0 10px 40px rgba(16, 185, 129, 0.15);
              }
              .header { 
                background: linear-gradient(135deg, #0ea270 0%, #0ea270 100%); 
                color: white; 
                padding: 40px 32px; 
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              .header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                animation: shimmer 3s infinite;
              }
              @keyframes shimmer {
                0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
              }
              .logo-container {
                margin-bottom: 20px;
                position: relative;
                z-index: 1;
              }
              .logo {
                width: 80px;
                height: 80px;
                background: transparent;
                border-radius: 16px;
                display: inline-block;
              }
              .logo img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
              }
              .header h1 { 
                margin: 0; 
                font-size: 28px; 
                font-weight: 700;
                position: relative;
                z-index: 1;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .tagline {
                margin-top: 8px;
                font-size: 14px;
                opacity: 0.95;
                font-weight: 500;
                position: relative;
                z-index: 1;
              }
              .hero-section {
                padding: 32px;
                text-align: center;
                background: linear-gradient(180deg, #1a1f35 0%, #0f1419 100%);
              }
              .hero-icon {
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                background: linear-gradient(135deg, #0ea270 0%, #0ea270 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                box-shadow: 0 8px 24px rgba(14, 162, 112, 0.4);
              }
              .content { padding: 0 32px 32px; }
              .notification-card {
                background: #1a1f35;
                border-radius: 12px;
                padding: 24px;
                border: 2px solid rgba(14, 162, 112, 0.2);
                box-shadow: 0 2px 8px rgba(14, 162, 112, 0.15);
              }
              .notification-type { 
                display: inline-block; 
                padding: 8px 16px; 
                border-radius: 8px; 
                font-size: 11px; 
                font-weight: 700; 
                text-transform: uppercase; 
                letter-spacing: 0.5px;
                margin-bottom: 16px;
              }
              .type-info { background-color: #dbeafe; color: #1e40af; }
              .type-success { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #065f46; }
              .type-warning { background-color: #fef3c7; color: #92400e; }
              .type-error { background-color: #fee2e2; color: #991b1b; }
              .type-message { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); color: #3730a3; }
              .type-connection { background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%); color: #5b21b6; }
              .type-event { background: linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%); color: #831843; }
              .title {
                margin: 0 0 16px 0; 
                color: #0ea270; 
                font-size: 22px;
                font-weight: 700;
                line-height: 1.3;
              }
              .message { 
                color: #e5e7eb; 
                font-size: 16px; 
                line-height: 1.7; 
                margin: 16px 0;
              }
              .button { 
                display: inline-block; 
                padding: 14px 32px; 
                background: #0ea270;
                color: white; 
                text-decoration: none; 
                border-radius: 10px; 
                font-weight: 600;
                font-size: 15px;
                margin-top: 24px;
                box-shadow: 0 4px 16px rgba(14, 162, 112, 0.5);
                transition: all 0.3s ease;
              }
              .button:hover {
                box-shadow: 0 6px 24px rgba(16, 185, 129, 0.4);
                transform: translateY(-2px);
              }
              .tips-section {
                margin-top: 32px;
                padding: 20px;
                background: rgba(14, 162, 112, 0.1);
                border-radius: 12px;
                border-left: 4px solid #0ea270;
              }
              .tips-title {
                color: #0ea270;
                font-size: 14px;
                font-weight: 700;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .tips-text {
                color: #d1d5db;
                font-size: 14px;
                line-height: 1.6;
              }
              .footer { 
                background: #0a0f1e;
                padding: 32px 24px; 
                text-align: center; 
                color: #9ca3af;
                border-top: 1px solid rgba(14, 162, 112, 0.2);
              }
              .social-links {
                margin: 20px 0;
                display: flex;
                justify-content: center;
                gap: 16px;
              }
              .social-link {
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                text-decoration: none;
                transition: all 0.3s ease;
              }
              .social-link:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
              }
              .footer-text {
                font-size: 14px;
                color: #a7f3d0;
                margin: 8px 0;
              }
              .footer-links {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
              }
              .footer-link {
                color: #a7f3d0;
                text-decoration: none;
                font-size: 13px;
                margin: 0 12px;
              }
              .footer-link:hover {
                color: #ffffff;
              }
              .copyright {
                margin-top: 16px;
                font-size: 12px;
                color: #6ee7b7;
              }
              @media only screen and (max-width: 600px) {
                body { padding: 10px; }
                .header { padding: 32px 20px; }
                .header h1 { font-size: 24px; }
                .hero-section { padding: 24px 20px; }
                .content { padding: 0 20px 24px; }
                .notification-card { padding: 20px; }
                .title { font-size: 20px; }
                .button { padding: 12px 24px; font-size: 14px; }
                .footer { padding: 24px 20px; }
                .social-links { gap: 12px; }
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo-container">
                    <div class="logo">
                      <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="Startup Factory Hub" />
                    </div>
                  </div>
                  <h1>Startup Factory Hub</h1>
                  <div class="tagline">AI-Powered Startup Accelerator Platform</div>
                </div>
                
                <div class="hero-section">
                  <div class="hero-icon">${type === 'connection' ? '🤝' : type === 'message' ? '💬' : type === 'event' ? '📅' : type === 'success' ? '✨' : type === 'error' ? '⚠️' : '🔔'}</div>
                </div>

                <div class="content">
                  <div class="notification-card">
                    <span class="notification-type type-${type}">${type}</span>
                    
                    ${actorCardHtml}
                    
                    <h2 class="title">${title}</h2>
                    ${recipientName ? `<div class="message" style="color:#e5e7eb;font-size:16px;margin-bottom:8px;">Hi <strong>${recipientName}</strong>,</div>` : ''}
                    <div class="message">${message}</div>
                    <a href="https://startupfactoryhub.com" class="button">
                      🚀 View on Platform
                    </a>
                  </div>

                  <div class="tips-section">
                    <div class="tips-title">💡 Pro Tip</div>
                    <div class="tips-text">
                      ${type === 'connection' ? 'Building your network is key to startup success. Connect with mentors, investors, and fellow entrepreneurs!' :
                        type === 'message' ? 'Quick responses help build stronger professional relationships. Check your messages regularly!' :
                        type === 'event' ? 'Events are great opportunities to learn, network, and grow. Don\'t miss out!' :
                        'Stay active on the platform to maximize your opportunities and connections!'}
                    </div>
                  </div>
                </div>

                <div class="footer">
                  <div class="footer-text">Connect with us on social media</div>
                   <div class="social-links">
                     <a href="https://www.linkedin.com/company/startup-factory-hub" class="social-link">in</a>
                     <a href="mailto:info@startupfactoryhub.com" class="social-link">📧</a>
                   </div>
                   <div class="footer-links">
                     <a href="https://startupfactoryhub.com/help" class="footer-link">Help Center</a>
                     <a href="https://startupfactoryhub.com/privacy" class="footer-link">Privacy Policy</a>
                     <a href="https://startupfactoryhub.com/settings" class="footer-link">Unsubscribe</a>
                   </div>
                  <div class="copyright">
                    © 2025 Startup Factory Hub. All rights reserved.<br>
                    Empowering startups with AI-driven innovation
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log successful email send
    await logApiUsage('resend', '/emails', true);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    
    // Log failed email attempt
    await logApiUsage('resend', '/emails', false);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
