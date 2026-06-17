import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InternRow {
  email: string;
  full_name?: string;
  program?: string;
  company?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const rows: InternRow[] = Array.isArray(body?.rows) ? body.rows : [];

    let created = 0;
    let skipped = 0;
    const errors: { email: string; reason: string }[] = [];

    for (const raw of rows) {
      const email = String(raw.email || "").trim().toLowerCase();
      if (!email || !emailRegex.test(email)) {
        errors.push({ email: raw.email || "(empty)", reason: "Invalid email" });
        continue;
      }

      // Skip if invitation already exists
      const { data: existing } = await admin
        .from("intern_invitations")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (existing) {
        skipped++;
        continue;
      }

      const { error: insErr } = await admin.from("intern_invitations").insert({
        email,
        full_name: raw.full_name?.trim() || null,
        program: raw.program?.trim() || null,
        company: raw.company?.trim() || null,
        invited_by: user.id,
      });

      if (insErr) {
        errors.push({ email, reason: insErr.message });
      } else {
        created++;
      }
    }

    return new Response(
      JSON.stringify({ created, skipped, errors, total: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
