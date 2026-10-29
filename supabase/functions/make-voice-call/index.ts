import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VoiceCallRequest {
  to: string;
  message?: string;
  twimlUrl?: string;
  recipientType?: 'client' | 'sales_rep' | 'contractor' | 'admin';
  recipientName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, twimlUrl, recipientType, recipientName }: VoiceCallRequest = await req.json();

    if (!to) {
      throw new Error("Phone number is required");
    }

    if (!message && !twimlUrl) {
      throw new Error("Either message or twimlUrl is required");
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio credentials not configured");
    }

    console.log(`Initiating voice call to ${to} (${recipientType || 'unknown'}: ${recipientName || 'N/A'})`);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    
    const formData = new URLSearchParams();
    formData.append("To", to);
    formData.append("From", fromNumber);
    
    if (twimlUrl) {
      formData.append("Url", twimlUrl);
    } else if (message) {
      // Use TwiML Bin or inline TwiML for text-to-speech
      const safe = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").slice(0, 3000);
      const twiml = `<Response><Say voice="alice">${safe}</Say></Response>`;
      formData.append("Twiml", twiml);
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
      console.error("Twilio voice error:", result);
      throw new Error(result.message || "Failed to initiate call");
    }

    console.log("Voice call initiated successfully:", result.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: result.sid,
        status: result.status 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error initiating voice call:", error);
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
