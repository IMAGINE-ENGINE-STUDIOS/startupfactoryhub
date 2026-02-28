import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { MagicLinkEmail } from "./_templates/magic-link.tsx";
import { EmailVerificationEmail } from "./_templates/email-verification.tsx";
import { PasswordResetEmail } from "./_templates/password-reset.tsx";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_AUTH_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    console.log("Raw payload received:", payload);
    
    // Parse the payload directly - Supabase auth hooks don't use standardwebhooks format
    const emailData = JSON.parse(payload);

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = emailData;

    console.log("Parsed email data:", JSON.stringify({
      email_action_type,
      user_email: user?.email,
      token: token ?? "UNDEFINED",
      token_hash: token_hash ?? "UNDEFINED",
      redirect_to: redirect_to ?? "UNDEFINED",
    }));

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const appUrl = "https://startupfactoryhub.com";

    let html: string;
    let subject: string;

    // Determine which template to use based on email_action_type
    switch (email_action_type) {
      case "magiclink":
        html = await renderAsync(
          React.createElement(MagicLinkEmail, {
            supabase_url: supabaseUrl,
            app_url: appUrl,
            token,
            token_hash,
            redirect_to,
            email_action_type,
          })
        );
        subject = "🔐 Your Magic Link to Startup Factory Hub";
        break;

      case "signup":
      case "invite":
        html = await renderAsync(
          React.createElement(EmailVerificationEmail, {
            supabase_url: supabaseUrl,
            app_url: appUrl,
            token,
            token_hash,
            redirect_to,
            email_action_type,
          })
        );
        subject = "✨ Verify Your Email - Welcome to Startup Factory Hub!";
        break;

      case "recovery":
        html = await renderAsync(
          React.createElement(PasswordResetEmail, {
            supabase_url: supabaseUrl,
            app_url: appUrl,
            token,
            token_hash,
            redirect_to,
            email_action_type,
          })
        );
        subject = "🔑 Reset Your Password - Startup Factory Hub";
        break;

      case "email_change":
        html = await renderAsync(
          React.createElement(EmailVerificationEmail, {
            supabase_url: supabaseUrl,
            app_url: appUrl,
            token,
            token_hash,
            redirect_to,
            email_action_type,
          })
        );
        subject = "✉️ Confirm Email Change - Startup Factory Hub";
        break;

      default:
        html = await renderAsync(
          React.createElement(WelcomeEmail, {
            app_url: appUrl,
            user_email: user.email,
          })
        );
        subject = "🚀 Welcome to Startup Factory Hub!";
    }

    // Log the confirmation URL that will be in the email
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || 'https://startupfactoryhub.com/reset-password')}`;
    console.log("Generated confirmation URL:", confirmationUrl);
    console.log(`Sending email from: Startup Factory Hub <info@startupfactoryhub.com> to: ${user.email}`);

    const resendResponse = await resend.emails.send({
      from: "Startup Factory Hub <info@startupfactoryhub.com>",
      to: [user.email],
      subject: subject,
      html: html,
    });

    console.log("Resend full response:", JSON.stringify(resendResponse));

    if (resendResponse.error) {
      console.error("Resend error:", JSON.stringify(resendResponse.error));
      throw resendResponse.error;
    }

    console.log(`Auth email sent successfully to ${user.email}: ${email_action_type}, id: ${resendResponse.data?.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message,
        },
      }),
      {
        status: error.code || 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
