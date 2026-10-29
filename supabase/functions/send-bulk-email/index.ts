import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkEmailRequest {
  template_name?: string;
  client_ids?: string[];
  send_to_all?: boolean;
  custom_subject?: string;
  custom_html?: string;
  promotion?: {
    id?: string | null;
    name: string;
    description?: string | null;
    bundle_price?: number | null;
    original_price?: number | null;
    highlight_text?: string | null;
    image_url?: string | null;
    included_items?: Array<{ name: string; value?: string }>;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { template_name, client_ids, send_to_all, custom_subject, custom_html, promotion }: BulkEmailRequest = await req.json();

    console.log(`Starting bulk email. template=${template_name} promotion=${promotion?.name} clients=${client_ids?.length ?? 'all'}`);

    // Build template (from message_templates, custom payload, or promotion data)
    let template: { name: string; subject: string | null; html_content: string | null; body: string | null; id: string | null } | null = null;

    if (template_name) {
      const { data } = await supabase
        .from("message_templates")
        .select("*")
        .eq("name", template_name)
        .maybeSingle();
      if (data) template = data as any;
    }

    if (!template && promotion) {
      const SITE = "https://startupfactoryhub.com";
      // Use {{offer_url}} placeholder so each client gets a per-client tracked link
      const offerUrl = "{{offer_url}}";

      // Absolutize image URL — relative paths and blob/data URIs don't render in email
      let imgSrc = promotion.image_url || '';
      if (imgSrc.startsWith('blob:') || imgSrc.startsWith('data:')) {
        imgSrc = '';
      } else if (imgSrc.startsWith('/')) {
        imgSrc = SITE + imgSrc;
      }

      const items = (promotion.included_items || [])
        .map(i => `<li style="margin:6px 0;color:#374151;">${i.name}${i.value ? ` — <strong>${i.value}</strong>` : ''}</li>`)
        .join('');
      const priceBlock = promotion.bundle_price
        ? `<p style="font-size:28px;font-weight:700;color:#0891b2;margin:18px 0 4px;">$${Number(promotion.bundle_price).toLocaleString()}${
            promotion.original_price ? ` <span style="font-size:16px;color:#9ca3af;text-decoration:line-through;font-weight:400;">$${Number(promotion.original_price).toLocaleString()}</span>` : ''
          }</p>`
        : '';
      template = {
        id: null,
        name: promotion.name,
        subject: `Exclusive Offer: ${promotion.name}`,
        html_content: `
          <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#ffffff;padding:24px;">
            <h1 style="color:#0891b2;font-size:26px;margin:0 0 8px;">Hi {{first_name}},</h1>
            ${promotion.highlight_text ? `<p style="display:inline-block;background:#f97066;color:#fff;padding:6px 12px;border-radius:4px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin:8px 0;">${promotion.highlight_text}</p>` : ''}
            <h2 style="color:#111827;font-size:22px;margin:12px 0;">${promotion.name}</h2>
            ${imgSrc ? `<a href="${offerUrl}" style="display:block;"><img src="${imgSrc}" alt="${promotion.name}" style="width:100%;border-radius:8px;margin:12px 0;display:block;" /></a>` : ''}
            ${promotion.description ? `<p style="color:#4b5563;line-height:1.6;font-size:15px;">${promotion.description}</p>` : ''}
            ${priceBlock}
            ${items ? `<ul style="padding-left:20px;margin:16px 0;">${items}</ul>` : ''}
            <a href="${offerUrl}" style="display:inline-block;background:#0891b2;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">View Full Offer</a>
            <a href="https://wa.me/12392570637" style="display:inline-block;background:#25d366;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:12px;">Message us on WhatsApp</a>
            <p style="color:#6b7280;font-size:13px;margin-top:24px;">Reach out anytime — we're here to help. <br/>Or schedule a free consultation: <a href="https://calendly.com/startupfactoryhub/30min" style="color:#0891b2;">calendly.com/startupfactoryhub/30min</a></p>
          </div>
        `,
        body: promotion.description || promotion.name,
      };
    }

    if (!template && custom_html) {
      template = {
        id: null,
        name: template_name || 'Custom',
        subject: custom_subject || 'A message from Startup Factory Hub',
        html_content: custom_html,
        body: custom_html,
      };
    }

    if (!template) {
      throw new Error(`No template, promotion, or custom_html provided. template_name='${template_name}'`);
    }

    console.log(`Template ready: ${template.name}`);


    // Fetch clients with their assigned sales reps
    let clientsQuery = supabase
      .from("clients")
      .select(`
        id, first_name, last_name, email, phone, address_city, address_state,
        assigned_sales_rep_id, unsubscribe_token,
        sales_rep:profiles!clients_assigned_sales_rep_id_fkey(
          first_name, last_name, email
        )
      `)
      .eq("email_unsubscribed", false); // never email clients who unsubscribed

    if (client_ids && client_ids.length > 0) {
      clientsQuery = clientsQuery.in("id", client_ids);
    }

    const { data: clients, error: clientsError } = await clientsQuery;

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    if (!clients || clients.length === 0) {
      throw new Error("No clients found");
    }

    console.log(`Found ${clients.length} clients to email`);

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send email to each client
    for (const client of clients) {
      try {
        if (!client.email) {
          console.log(`Skipping client ${client.first_name} - no email`);
          results.failed++;
          results.errors.push(`${client.first_name}: No email address`);
          continue;
        }

        // Seller identity is fixed for every email: Ricardo, +1 (239) 257-0637,
        // info@startupfactoryhub.com (fills {{sales_rep_name}} / {{sales_rep_email}}).
        const salesRepName = 'Ricardo';
        const salesRepEmail = 'info@startupfactoryhub.com';

        // Replace variables in template
        let subject = template.subject || "Special Offer from Startup Factory Hub";
        let htmlContent = template.html_content || template.body;

        const SITE_URL = "https://startupfactoryhub.com";
        const offerUrlForClient = promotion?.id
          ? `${SITE_URL}/offer/${promotion.id}?c=${client.id}`
          : SITE_URL;

        const variables: Record<string, string> = {
          first_name: client.first_name || "Valued Customer",
          last_name: client.last_name || "",
          email: client.email || "",
          phone: client.phone || "",
          address_city: client.address_city || "",
          address_state: client.address_state || "",
          sales_rep_name: salesRepName,
          sales_rep_email: salesRepEmail,
          offer_url: offerUrlForClient,
        };

        // Replace all {{variable}} patterns
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          subject = subject.replace(regex, value);
          htmlContent = htmlContent.replace(regex, value);
        });

        // Add sales rep signature to email
        const signature = `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-weight: 600; color: #1f2937;">${salesRepName}</p>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Startup Factory Hub</p>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${salesRepEmail}</p>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">+1 (239) 257-0637</p>
          </div>
        `;
        
        // Insert signature before closing body tag if exists, otherwise append
        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', `${signature}</body>`);
        } else {
          htmlContent = htmlContent + signature;
        }

        // Unsubscribe footer — one-click link per client (see unsubscribe function)
        const unsubUrl = `https://startupfactoryhub.com/unsubscribe?t=${client.unsubscribe_token}`;
        const oneClickUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/unsubscribe?t=${client.unsubscribe_token}`;
        const footer = `<div style="text-align:center;padding:18px;font:12px/1.6 Arial,sans-serif;color:#9ca3af;">You receive these emails as a Startup Factory Hub contact. <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a></div>`;
        htmlContent = htmlContent.includes('</body>')
          ? htmlContent.replace('</body>', `${footer}</body>`)
          : htmlContent + footer;

        console.log(`Sending to ${client.email} (${client.first_name}) from ${salesRepName}...`);

        const emailResponse = await resend.emails.send({
          from: `Startup Factory Hub <info@startupfactoryhub.com>`,
          reply_to: salesRepEmail,
          to: [client.email],
          subject: subject,
          html: htmlContent,
          headers: {
            "List-Unsubscribe": `<${oneClickUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        if (emailResponse.error) {
          console.error(`Failed to send to ${client.email}:`, emailResponse.error);
          results.failed++;
          results.errors.push(`${client.email}: ${emailResponse.error.message}`);
        } else {
          console.log(`✅ Sent to ${client.email} - ID: ${emailResponse.data?.id}`);
          results.successful++;

          // Log communication
          await supabase.from("communication_logs").insert({
            client_id: client.id,
            channel: "email",
            recipient: client.email,
            subject: subject,
            message_content: htmlContent,
            template_id: template.id,
            status: "sent",
            sent_at: new Date().toISOString(),
            external_id: emailResponse.data?.id,
          });
        }

        // Delay to avoid rate limiting (Resend allows 2 requests/second)
        await new Promise(resolve => setTimeout(resolve, 600));

      } catch (clientError: any) {
        console.error(`Error sending to ${client.email}:`, clientError);
        results.failed++;
        results.errors.push(`${client.email}: ${clientError.message}`);
      }
    }

    console.log(`Bulk email complete: ${results.successful} sent, ${results.failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Bulk email complete: ${results.successful} sent, ${results.failed} failed`,
        total_clients: clients.length,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors.slice(0, 10), // Only return first 10 errors
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in bulk email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
