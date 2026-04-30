import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Build redirect target — users land on auth page in "set password" mode
    const origin = req.headers.get('origin') || 'https://startupfactoryhub.com';
    const redirectTo = `${origin}/auth?mode=set-password&migrated=1`;

    // Fetch records
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
        // Check if email already has an auth user
        const { data: existingProfile } = await admin
          .from('profiles')
          .select('user_id')
          .ilike('email', rec.email)
          .maybeSingle();

        let userId = existingProfile?.user_id as string | undefined;

        if (!userId) {
          // Create the auth user (no password yet, email confirmed so they can use recovery link directly)
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
            // If already exists in auth (but not in profiles yet) — try to fetch
            if (createErr.message?.toLowerCase().includes('already')) {
              const { data: list } = await admin.auth.admin.listUsers();
              userId = list?.users?.find((u) => u.email?.toLowerCase() === rec.email.toLowerCase())?.id;
            } else {
              throw createErr;
            }
          } else {
            userId = created.user?.id;
          }

          // Assign mapped role
          if (userId) {
            await admin.from('user_roles').insert({ user_id: userId, role: rec.mapped_role }).then(() => null).catch(() => null);
            await admin.from('profiles').update({ full_name: rec.full_name }).eq('user_id', userId);
          }
        }

        // Generate a recovery link → user clicks → lands on /auth?mode=set-password to create password
        const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
          type: 'recovery',
          email: rec.email,
          options: { redirectTo },
        });

        if (linkErr) throw linkErr;

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
        results.details.push({ email: rec.email, status: 'invited', action_link: linkData?.properties?.action_link });
      } catch (e: any) {
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
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
