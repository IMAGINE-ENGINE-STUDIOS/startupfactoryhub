import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from 'npm:resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);

function buildEmailHtml(fullName: string | null, actionLink: string) {
  const name = fullName?.split(' ')[0] || 'there';
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <h1 style="font-size:24px;margin:0 0 16px;">Welcome to Startup Factory Hub, ${name}</h1>
    <p style="font-size:16px;line-height:1.6;color:#334155;">
      We're migrating your account from our previous platform to the new <strong>Startup Factory Hub</strong>.
      Your profile already exists — you just need to create a password to access it.
    </p>
    <p style="font-size:16px;line-height:1.6;color:#334155;">
      Click the button below to set your password and sign in. The link is valid for 24 hours.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${actionLink}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">
        Set Your Password
      </a>
    </div>
    <p style="font-size:14px;color:#64748b;line-height:1.6;">
      Or copy this link into your browser:<br/>
      <span style="word-break:break-all;color:#0f172a;">${actionLink}</span>
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;"/>
    <p style="font-size:12px;color:#94a3b8;">
      If you didn't expect this email, you can safely ignore it.<br/>
      Startup Factory Hub · startupfactoryhub.com
    </p>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: isAdmin } = await userClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;
    const testEmail: string | undefined = body.test_email;

    const admin = createClient(supabaseUrl, serviceKey);

    const origin = req.headers.get('origin') || 'https://startupfactoryhub.com';
    const redirectTo = `${origin}/auth?mode=set-password&migrated=1`;

    let query = admin.from('legacy_imported_users').select('*');
    if (testEmail) {
      query = query.ilike('email', testEmail);
    } else if (ids && ids.length > 0) {
      query = query.in('id', ids);
    } else {
      query = query.eq('import_status', 'pending');
    }
    const { data: records, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    const results = { invited: 0, skipped_duplicate: 0, failed: 0, details: [] as any[] };

    for (const rec of records || []) {
      try {
        // Check if email already has an auth user via profiles
        const { data: existingProfile } = await admin
          .from('profiles')
          .select('user_id')
          .ilike('email', rec.email)
          .maybeSingle();

        let userId = existingProfile?.user_id as string | undefined;

        if (!userId) {
          const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email: rec.email,
            email_confirm: true,
            user_metadata: {
              full_name: rec.full_name,
              role: rec.mapped_role,
              legacy_account_id: rec.legacy_account_id,
              company_name: rec.company_name,
              migrated_from_legacy: true,
            },
          });

          if (createErr) {
            if (createErr.message?.toLowerCase().includes('already')) {
              const { data: list } = await admin.auth.admin.listUsers();
              userId = list?.users?.find((u) => u.email?.toLowerCase() === rec.email.toLowerCase())?.id;
            } else {
              throw createErr;
            }
          } else {
            userId = created.user?.id;
          }

          if (userId) {
            await admin.from('user_roles').insert({ user_id: userId, role: rec.mapped_role }).then(() => null).catch(() => null);
            await admin.from('profiles').update({ full_name: rec.full_name }).eq('user_id', userId);
          }
        }

        // Generate the recovery action link (this only generates — does NOT send)
        const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
          type: 'recovery',
          email: rec.email,
          options: { redirectTo },
        });

        if (linkErr) throw linkErr;

        const actionLink = linkData?.properties?.action_link;
        if (!actionLink) throw new Error('No action_link returned from generateLink');

        // Actually deliver the email via Resend
        const sendResult = await resend.emails.send({
          from: 'Startup Factory Hub <info@startupfactoryhub.com>',
          to: [rec.email],
          subject: 'Set your password — Welcome back to Startup Factory Hub',
          html: buildEmailHtml(rec.full_name, actionLink),
        });

        if (sendResult.error) {
          throw new Error(`Resend error: ${sendResult.error.message || JSON.stringify(sendResult.error)}`);
        }

        console.log(`Email sent to ${rec.email}, resend id: ${sendResult.data?.id}`);

        await admin
          .from('legacy_imported_users')
          .update({
            import_status: 'invited',
            invited_at: new Date().toISOString(),
            linked_user_id: userId,
            import_error: null,
          })
          .eq('id', rec.id);

        results.invited++;
        results.details.push({ email: rec.email, status: 'invited', resend_id: sendResult.data?.id });
      } catch (e: any) {
        console.error(`Failed for ${rec.email}:`, e.message);
        await admin
          .from('legacy_imported_users')
          .update({ import_status: 'failed', import_error: e.message || String(e) })
          .eq('id', rec.id);
        results.failed++;
        results.details.push({ email: rec.email, status: 'failed', error: e.message });
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Function error:', err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
