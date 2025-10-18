import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, title, message, type }: NotificationEmailRequest = await req.json();

    console.log(`Sending notification email to ${to}: ${title}`);

    const emailResponse = await resend.emails.send({
      from: "Platform <onboarding@resend.dev>",
      to: [to],
      subject: `[Notification] ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px 24px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { padding: 32px 24px; }
              .notification-type { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
              .type-info { background-color: #dbeafe; color: #1e40af; }
              .type-success { background-color: #d1fae5; color: #065f46; }
              .type-warning { background-color: #fef3c7; color: #92400e; }
              .type-error { background-color: #fee2e2; color: #991b1b; }
              .type-message { background-color: #e0e7ff; color: #3730a3; }
              .type-connection { background-color: #ddd6fe; color: #5b21b6; }
              .type-event { background-color: #fbcfe8; color: #831843; }
              .message { color: #374151; font-size: 16px; line-height: 1.6; margin: 16px 0; }
              .footer { background-color: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
              .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔔 New Notification</h1>
              </div>
              <div class="content">
                <span class="notification-type type-${type}">${type}</span>
                <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px;">${title}</h2>
                <div class="message">${message}</div>
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://zqiihhmdsdgwdcwmryym.supabase.co', 'https://lovable.app')}/dashboard" class="button">
                  View on Platform
                </a>
              </div>
              <div class="footer">
                <p>This is an automated notification from your platform.</p>
                <p style="margin-top: 8px; font-size: 12px;">© 2025 Your Platform. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
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
