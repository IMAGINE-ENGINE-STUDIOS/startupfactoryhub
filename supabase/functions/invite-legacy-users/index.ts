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

    // Verify caller is admin
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

    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch pending records (optionally filtered by ids)
    let query = admin
      .from('legacy_imported_users')
      .select('*')
      .eq('import_status', 'pending');
    if (ids && ids.length > 0) {
      query = admin.from('legacy_imported_users').select('*').in('id', ids);
    }
    const { data: records, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    const results = { invited: 0, skipped_duplicate: 0, failed: 0, details: [] as any[] };

    for (const rec of records || []) {
      try {
        // Check if email already exists in profiles
        const { data: existingProfile } = await admin
          .from('profiles')
          .select('user_id')
          .ilike('email', rec.email)
          .maybeSingle();

        if (existingProfile?.user_id) {
          await admin
            .from('legacy_imported_users')
            .update({
              import_status: 'skipped_duplicate',
              linked_user_id: existingProfile.user_id,
              import_error: 'Email already exists in platform',
            })
            .eq('id', rec.id);
          results.skipped_duplicate++;
          results.details.push({ email: rec.email, status: 'skipped_duplicate' });
          continue;
        }

        // Invite via auth admin
        const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
          rec.email,
          {
            data: {
              full_name: rec.full_name,
              role: rec.mapped_role,
              legacy_account_id: rec.legacy_account_id,
              company_name: rec.company_name,
            },
          }
        );

        if (inviteErr) {
          // If already registered
          if (inviteErr.message?.toLowerCase().includes('already')) {
            await admin
              .from('legacy_imported_users')
              .update({ import_status: 'skipped_duplicate', import_error: inviteErr.message })
              .eq('id', rec.id);
            results.skipped_duplicate++;
            results.details.push({ email: rec.email, status: 'skipped_duplicate', error: inviteErr.message });
            continue;
          }
          throw inviteErr;
        }

        const newUserId = invited.user?.id;

        // Ensure mapped role exists in user_roles (handle_new_user trigger may have created it as 'startup' default)
        if (newUserId) {
          await admin
            .from('user_roles')
            .insert({ user_id: newUserId, role: rec.mapped_role })
            .select()
            .then(() => null)
            .catch(() => null);

          // Update profile with company info if available
          if (rec.company_name || rec.full_name) {
            await admin
              .from('profiles')
              .update({
                full_name: rec.full_name,
              })
              .eq('user_id', newUserId);
          }
        }

        await admin
          .from('legacy_imported_users')
          .update({
            import_status: 'invited',
            invited_at: new Date().toISOString(),
            linked_user_id: newUserId,
            import_error: null,
          })
          .eq('id', rec.id);

        results.invited++;
        results.details.push({ email: rec.email, status: 'invited' });
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
