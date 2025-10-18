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

    const baseUrl = req.headers.get('origin') || 'https://ea8832c0-5f30-4d47-a611-9a3021cb2360.lovableproject.com';
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
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📄 PDF Signature Request</h1>
          </div>
          <div class="content">
            <p><strong>${senderName}</strong> ${description}</p>
            <p><strong>Document:</strong> ${documentTitle}</p>
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
            <p>Click the button below to ${actionText.toLowerCase()}:</p>
            <div style="text-align: center;">
              <a href="${shareUrl}" class="button">${actionText}</a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Or copy this link: <br>
              <a href="${shareUrl}" style="word-break: break-all;">${shareUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated email from LightPaper PDF Editor</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'LightPaper <onboarding@resend.dev>',
      to: [to],
      subject: `${senderName} invited you to ${actionText.toLowerCase()}: ${documentTitle}`,
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