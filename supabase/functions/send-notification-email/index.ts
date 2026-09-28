import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { complianceFetch } from "../_shared/email-compliance.ts";
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

const TYPE_LABELS: Record<string, string> = {
  info: 'Update',
  success: 'Success',
  warning: 'Reminder',
  error: 'Alert',
  message: 'New Message',
  connection: 'Connection',
  event: 'Event Invitation',
};

function buildActorCardHtml(actorName?: string, actorAvatarUrl?: string, actorRole?: string): string {
  if (!actorName) return '';

  const initials = getInitials(actorName);
  const avatarHtml = actorAvatarUrl
    ? `<img src="${actorAvatarUrl}" alt="${actorName}" width="44" height="44" style="width:44px;height:44px;border-radius:50%;object-fit:cover;display:block;" />`
    : `<div style="width:44px;height:44px;border-radius:50%;background:#10b981;color:#04120c;font-size:15px;font-weight:700;line-height:44px;text-align:center;">${initials}</div>`;

  const roleBadge = actorRole
    ? `<span style="display:inline-block;background:rgba(16,185,129,0.12);color:#34d399;padding:2px 10px;border-radius:50px;font-size:11px;font-weight:600;text-transform:capitalize;margin-left:8px;">${actorRole}</span>`
    : '';

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 20px 0;">
      <tr>
        <td style="width:44px;vertical-align:middle;">${avatarHtml}</td>
        <td style="padding-left:12px;vertical-align:middle;">
          <div style="color:#f9fafb;font-size:14px;font-weight:600;">${actorName}${roleBadge}</div>
          <div style="color:#6b7280;font-size:12px;margin-top:2px;">sent you this notification</div>
        </td>
      </tr>
    </table>`;
}

// Routes through the shared compliance layer (footer, mailing address,
// one-click unsubscribe headers, opt-out suppression).
async function sendViaResend(payload: { from: string; to: string[]; subject: string; html: string }) {
  const res = await complianceFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}

const handler = async (req: Request): Promise<Response> => {

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, title, message, type, recipientName, actorName, actorAvatarUrl, actorRole }: NotificationEmailRequest = await req.json();

    console.log(`Sending notification email to ${to}: ${title}`);

    const actorCardHtml = buildActorCardHtml(actorName, actorAvatarUrl, actorRole);
    const typeLabel = TYPE_LABELS[type] || 'Notification';

    const emailResponse = await sendViaResend({
      from: "Startup Factory Hub <info@startupfactoryhub.com>",
      to: [to],
      subject: `[Startup Factory Hub] ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0;padding:0;background-color:#090d16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;">
            <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

              <!-- Header -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="Startup Factory Hub" width="36" height="36" style="width:36px;height:36px;display:block;border-radius:8px;" />
                  </td>
                  <td style="vertical-align:middle;padding-left:10px;">
                    <span style="color:#f9fafb;font-size:15px;font-weight:700;letter-spacing:0.2px;">Startup Factory Hub</span>
                  </td>
                  <td style="vertical-align:middle;text-align:right;">
                    <span style="display:inline-block;background:rgba(16,185,129,0.12);color:#34d399;padding:4px 12px;border-radius:50px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;">${typeLabel}</span>
                  </td>
                </tr>
              </table>

              <!-- Card -->
              <div style="background:#101623;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:32px;">
                ${actorCardHtml}
                <h1 style="margin:0 0 16px 0;color:#f9fafb;font-size:22px;font-weight:700;line-height:1.3;">${title}</h1>
                ${recipientName ? `<p style="margin:0 0 12px 0;color:#d1d5db;font-size:15px;">Hi <strong style="color:#f9fafb;">${recipientName}</strong>,</p>` : ''}
                <div style="color:#d1d5db;font-size:15px;line-height:1.7;">${message}</div>
                <div style="margin-top:28px;">
                  <a href="https://startupfactoryhub.com" style="display:inline-block;background:#10b981;color:#04120c;text-decoration:none;font-weight:700;font-size:14px;padding:13px 28px;border-radius:10px;">View on Startup Factory Hub</a>
                </div>
              </div>

              <!-- Footer -->
              <div style="text-align:center;padding:28px 16px 8px;">
                <div style="margin-bottom:12px;">
                  <a href="https://www.linkedin.com/company/startup-factory-hub" style="color:#6b7280;text-decoration:none;font-size:12px;margin:0 10px;">LinkedIn</a>
                  <a href="https://startupfactoryhub.com/help" style="color:#6b7280;text-decoration:none;font-size:12px;margin:0 10px;">Help Center</a>
                  <a href="https://startupfactoryhub.com/privacy" style="color:#6b7280;text-decoration:none;font-size:12px;margin:0 10px;">Privacy</a>
                  <a href="https://startupfactoryhub.com/settings" style="color:#6b7280;text-decoration:none;font-size:12px;margin:0 10px;">Unsubscribe</a>
                </div>
                <p style="margin:0;color:#4b5563;font-size:12px;">© 2026 Startup Factory Hub. All rights reserved.</p>
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
