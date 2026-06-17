import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, password, full_name } = await req.json();
    if (!token || !password || password.length < 8) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate invitation
    const { data: inv, error: invErr } = await admin
      .from("intern_invitations")
      .select("id, email, status, expires_at")
      .eq("invite_token", token)
      .maybeSingle();

    if (invErr || !inv) {
      return new Response(JSON.stringify({ error: "Invalid activation link" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (inv.status === "activated") {
      return new Response(JSON.stringify({ error: "This profile is already activated. Please sign in." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(inv.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This activation link has expired." }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create or get user (email auto-confirmed)
    let userId: string | null = null;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: inv.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || null, role: "intern" },
    });

    if (createErr) {
      // If already exists, update the password instead
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email?.toLowerCase() === inv.email.toLowerCase());
      if (!existing) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = existing.id;
      await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { ...(existing.user_metadata || {}), full_name: full_name || existing.user_metadata?.full_name || null, role: "intern" },
      });
    } else {
      userId = created.user?.id ?? null;
    }

    // Assign intern role (idempotent)
    if (userId) {
      await admin.from("user_roles").upsert(
        { user_id: userId, role: "intern" },
        { onConflict: "user_id,role" },
      );
    }

    // Mark invitation activated
    await admin
      .from("intern_invitations")
      .update({ status: "activated", activated_at: new Date().toISOString() })
      .eq("id", inv.id);

    return new Response(JSON.stringify({ ok: true, email: inv.email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
