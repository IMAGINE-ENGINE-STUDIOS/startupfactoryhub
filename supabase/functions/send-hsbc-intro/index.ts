import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    // Get user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, email, location, bio")
      .eq("user_id", user.id)
      .single();

    // Get user company
    const { data: company } = await supabaseClient
      .from("companies")
      .select("name, industry, stage, website, description, team_size, location")
      .eq("user_id", user.id)
      .single();

    const userName = profile?.full_name || profile?.email || user.email;
    const companyName = company?.name || "their startup";
    const companyIndustry = company?.industry || "Technology";
    const companyStage = company?.stage?.replace("_", " ") || "Early stage";
    const companyWebsite = company?.website || "";
    const companyDescription = company?.description || "";
    const companyLocation = company?.location || profile?.location || "";
    const teamSize = company?.team_size ? `${company.team_size} people` : "";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border-bottom: 3px solid #DB0011; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; color: #333;">Introduction — Startup Factory Hub Member</h2>
  </div>

  <p>Hi Safi,</p>

  <p>Hope you're doing well! I wanted to introduce <strong>${userName}</strong>, a member of the Startup Factory Hub community, who's interested in opening an HSBC Innovation Banking account.</p>

  <p>Here's a quick overview:</p>

  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 12px; font-weight: bold; color: #555; width: 140px;">Name</td>
      <td style="padding: 8px 12px;">${userName}</td>
    </tr>
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 12px; font-weight: bold; color: #555;">Company</td>
      <td style="padding: 8px 12px;">${companyName}</td>
    </tr>
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 12px; font-weight: bold; color: #555;">Industry</td>
      <td style="padding: 8px 12px;">${companyIndustry}</td>
    </tr>
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 12px; font-weight: bold; color: #555;">Stage</td>
      <td style="padding: 8px 12px;">${companyStage}</td>
    </tr>
    ${companyLocation ? `<tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 12px; font-weight: bold; color: #555;">Location</td>
      <td style="padding: 8px 12px;">${companyLocation}</td>
    </tr>` : ""}
    ${teamSize ? `<tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 12px; font-weight: bold; color: #555;">Team Size</td>
      <td style="padding: 8px 12px;">${teamSize}</td>
    </tr>` : ""}
    ${companyWebsite ? `<tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 12px; font-weight: bold; color: #555;">Website</td>
      <td style="padding: 8px 12px;"><a href="${companyWebsite}" style="color: #DB0011;">${companyWebsite}</a></td>
    </tr>` : ""}
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 12px; font-weight: bold; color: #555;">Email</td>
      <td style="padding: 8px 12px;"><a href="mailto:${user.email}" style="color: #DB0011;">${user.email}</a></td>
    </tr>
  </table>

  ${companyDescription ? `<p><strong>About the company:</strong> ${companyDescription}</p>` : ""}

  <p>They're part of our global startup community and would love to explore what HSBC Innovation Banking can offer. I'll let you two take it from here!</p>

  <p>Best regards,<br/>
  <strong>Startup Factory Hub</strong><br/>
  <a href="https://startupfactoryhub.com" style="color: #DB0011;">startupfactoryhub.com</a></p>

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
    This is an automated introduction sent on behalf of a Startup Factory Hub member.
  </div>
</body>
</html>`;

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Startup Factory Hub <info@startupfactoryhub.com>",
        to: ["safi.keshvargar@us.hsbc.com"],
        cc: [user.email!],
        subject: `HSBC Innovation Banking — Introduction: ${userName} (${companyName})`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend error:", errText);
      throw new Error("Failed to send introduction email");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
