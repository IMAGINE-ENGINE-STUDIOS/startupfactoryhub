import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from 'npm:resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);

function buildEmailHtml(fullName: string | null, actionLink: string) {
  const name = fullName?.split(' ')[0] || 'there';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#ecfdf5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(16,185,129,0.15);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#10b981 0%,#14b8a6 100%);padding:40px 32px;text-align:center;">
      <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="Startup Factory Hub" width="64" height="64" style="display:block;margin:0 auto 16px;border-radius:12px;background:#ffffff;padding:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);"/>
      <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0;text-shadow:0 2px 4px rgba(0,0,0,0.1);">Startup Factory Hub</h1>
      <p style="color:rgba(255,255,255,0.95);font-size:14px;font-weight:500;margin:8px 0 0;">AI-Powered Startup Accelerator Platform</p>
    </div>

    <!-- Hero -->
    <div style="padding:32px;text-align:center;background:linear-gradient(180deg,#ecfdf5 0%,#ffffff 100%);">
      <h2 style="color:#064e3b;font-size:22px;font-weight:700;margin:0;">Welcome back, ${name}</h2>
      <p style="color:#047857;font-size:14px;margin:8px 0 0;">Your account has moved to our new platform</p>
    </div>

    <!-- Body -->
    <div style="padding:0 32px 32px;">
      <div style="background:#ffffff;border-radius:12px;padding:24px;border:2px solid #ecfdf5;box-shadow:0 2px 8px rgba(16,185,129,0.08);">
        <p style="color:#1f2937;font-size:16px;line-height:1.7;margin:0 0 16px;">
          We've migrated your profile from our previous platform to the new <strong>Startup Factory Hub</strong>. Everything you had is already here — you just need to set a new password to sign in.
        </p>
        <p style="color:#92400e;font-size:14px;background:#fef3c7;padding:12px 16px;border-radius:8px;margin:0 0 24px;border:1px solid #fde68a;">
          This secure link will expire in <strong>1 hour</strong> for your protection.
        </p>

        <a href="${actionLink}" target="_blank" style="background:linear-gradient(135deg,#10b981 0%,#14b8a6 100%);border-radius:10px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;text-align:center;display:block;padding:14px 32px;box-shadow:0 4px 16px rgba(16,185,129,0.3);">
          Set Your Password
        </a>

        <p style="color:#6b7280;font-size:12px;margin:16px 0 4px;text-align:center;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="color:#10b981;font-size:11px;word-break:break-all;margin:0 0 16px;text-align:center;">
          ${actionLink}
        </p>

        <div style="margin-top:24px;padding:20px;background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%);border-radius:12px;border:2px solid #93c5fd;">
          <p style="color:#1e40af;font-size:14px;font-weight:700;margin:0 0 12px;">What's new for you</p>
          <p style="color:#1e3a8a;font-size:14px;line-height:1.8;margin:0;">
            • All your previous data and connections are preserved<br/>
            • Access to AI-powered tools and accelerator programs<br/>
            • New community districts, mentorship, and events<br/>
            • Same email — just a new password to set
          </p>
        </div>

        <div style="margin-top:24px;padding:20px;background:linear-gradient(135deg,#fee2e2 0%,#fecaca 100%);border-radius:12px;border:2px solid #fca5a5;">
          <p style="color:#991b1b;font-size:14px;font-weight:700;margin:0 0 8px;">Didn't expect this email?</p>
          <p style="color:#7f1d1d;font-size:14px;line-height:1.6;margin:0;">
            If you weren't expecting an account migration, you can safely ignore this email. Reach our team at <a href="mailto:support@startupfactoryhub.com" style="color:#991b1b;text-decoration:underline;font-weight:600;">support@startupfactoryhub.com</a>.
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:linear-gradient(135deg,#064e3b 0%,#065f46 100%);padding:32px 24px;text-align:center;">
      <p style="color:#d1fae5;font-size:14px;margin:0 0 12px;">Questions? Our team is here to help</p>
      <div style="margin:16px 0;">
        <a href="https://startupfactoryhub.com/help" style="color:#a7f3d0;font-size:13px;text-decoration:none;margin:0 8px;">Help Center</a>
        <span style="color:#6ee7b7;margin:0 4px;">•</span>
        <a href="https://startupfactoryhub.com/security" style="color:#a7f3d0;font-size:13px;text-decoration:none;margin:0 8px;">Security</a>
        <span style="color:#6ee7b7;margin:0 4px;">•</span>
        <a href="https://startupfactoryhub.com/privacy" style="color:#a7f3d0;font-size:13px;text-decoration:none;margin:0 8px;">Privacy</a>
      </div>
      <p style="color:#6ee7b7;font-size:12px;margin:16px 0 0;line-height:1.6;">
        © 2026 Startup Factory Hub. All rights reserved.<br/>
        Empowering startups with AI-driven innovation
      </p>
    </div>

  </div>
</body>
</html>`;
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
