import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  to: string;
  message: string;
  recipientType?: 'client' | 'sales_rep' | 'contractor' | 'admin';
  recipientName?: string;
  mediaUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, recipientType, recipientName, mediaUrl }: WhatsAppRequest = await req.json();

    if (!to || !message) {
      throw new Error("Phone number and message are required");
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const whatsappNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!accountSid || !authToken || !whatsappNumber) {
      throw new Error("Twilio WhatsApp credentials not configured");
    }

    // Format phone number for WhatsApp (needs whatsapp: prefix)
    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const formattedFrom = whatsappNumber.startsWith("whatsapp:") ? whatsappNumber : `whatsapp:${whatsappNumber}`;

    console.log(`Sending WhatsApp to ${formattedTo} (${recipientType || 'unknown'}: ${recipientName || 'N/A'})`);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Status callback URL for delivery/read tracking
    const statusCallbackUrl = `https://bwngxlbnavnhbtahyzbf.supabase.co/functions/v1/twilio-status-webhook`;
    
    const formData = new URLSearchParams();
    formData.append("To", formattedTo);
    formData.append("From", formattedFrom);
    formData.append("Body", message);
    formData.append("StatusCallback", statusCallbackUrl);
    
    if (mediaUrl) {
      formData.append("MediaUrl", mediaUrl);
    }

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio WhatsApp error:", result);
      throw new Error(result.message || "Failed to send WhatsApp message");
    }

    console.log("WhatsApp message sent successfully:", result.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageSid: result.sid,
        status: result.status 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending WhatsApp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
