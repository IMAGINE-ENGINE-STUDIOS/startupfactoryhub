import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, applicationId } = await req.json();

    console.log('Sending invitation to:', email);

    // In a real implementation, you would use an email service like Resend
    // For now, we'll just log the invitation details
    const invitationUrl = `${req.headers.get('origin')}/accept-invitation?token=${token}`;
    
    console.log('Invitation URL:', invitationUrl);
    console.log('Application ID:', applicationId);

    // Here you would integrate with your email service
    // Example with Resend:
    // const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${RESEND_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: 'Your Company <noreply@yourcompany.com>',
    //     to: [email],
    //     subject: 'Complete Your Application',
    //     html: `
    //       <h1>Congratulations!</h1>
    //       <p>Your application has been accepted!</p>
    //       <p>Please click the link below to create your account and access your tasks:</p>
    //       <a href="${invitationUrl}">Accept Invitation</a>
    //       <p>This link will expire in 48 hours.</p>
    //     `
    //   })
    // });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invitation email sent',
        invitationUrl // Return URL for testing
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
