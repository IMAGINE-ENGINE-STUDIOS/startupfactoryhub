import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { complianceFetch } from "../_shared/email-compliance.ts";
import { generateNotionPartnershipHtml } from "./html.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');
    if (!SUPABASE_URL || !KEY) throw new Error('Supabase credentials not configured');

    const body = req.headers.get('content-type')?.includes('application/json') ? await req.json() : {};
    const targetEmails = body?.targetEmails;
    const supabase = createClient(SUPABASE_URL, KEY);

    let recipients: { email: string; full_name: string | null }[] = [];
    if (Array.isArray(targetEmails) && targetEmails.length > 0) {
      recipients = targetEmails.map((email: string) => ({ email, full_name: null }));
    } else {
      // Startup members only
      const { data: roles, error: rErr } = await supabase.from('user_roles').select('user_id').eq('role', 'startup');
      if (rErr) throw rErr;
      const ids = [...new Set((roles || []).map((r: any) => r.user_id))];
      for (let i = 0; i < ids.length; i += 200) {
        const { data } = await supabase.from('profiles').select('email, full_name').in('id', ids.slice(i, i + 200)).not('email', 'is', null);
        recipients.push(...((data || []) as any[]));
      }
    }

    let sent = 0, errors = 0;
    for (const user of recipients) {
      if (!user.email) continue;
      try {
        const res = await complianceFetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Startup Factory Hub <info@startupfactoryhub.com>',
            to: [user.email],
            subject: 'New Partnership: 6 Months Free of Notion Business + Notion AI',
            html: generateNotionPartnershipHtml(user.full_name || 'Founder'),
          }),
        });
        if (res.ok) sent++; else { errors++; console.error(`Failed ${res.status}:`, await res.text()); }
        await new Promise(r => setTimeout(r, 80));
      } catch (err) { errors++; console.error('Send error:', err); }
    }
    console.log(`Notion partnership: ${sent} sent, ${errors} errors`);
    return new Response(JSON.stringify({ success: true, sent, errors }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Notion partnership error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
