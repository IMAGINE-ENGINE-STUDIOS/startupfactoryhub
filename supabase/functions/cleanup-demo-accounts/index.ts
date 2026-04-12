import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const emailsToDelete = [
      "demo-startup@startupfactoryhub.com",
      "demo-investor@startupfactoryhub.com",
      "demo-mentor@startupfactoryhub.com",
      "demo-advisor@startupfactoryhub.com",
      "demo-student@startupfactoryhub.com",
      "demo-accelerator@startupfactoryhub.com",
    ];

    const results: any[] = [];

    const { data: allUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

    for (const email of emailsToDelete) {
      const user = allUsers?.users?.find((u) => u.email === email);
      if (!user) {
        results.push({ email, status: "not_found" });
        continue;
      }

      // Clean related data
      const userId = user.id;
      const tables = [
        { table: "user_roles", column: "user_id" },
        { table: "profiles", column: "user_id" },
        { table: "investor_profiles", column: "user_id" },
        { table: "mentor_profiles", column: "user_id" },
        { table: "accelerator_profiles", column: "user_id" },
        { table: "companies", column: "user_id" },
      ];

      for (const t of tables) {
        try {
          await supabase.from(t.table).delete().eq(t.column, userId);
        } catch (e) {
          console.warn(`Failed to clean ${t.table}:`, e);
        }
      }

      const { error } = await supabase.auth.admin.deleteUser(userId);
      results.push({ email, status: error ? "error" : "deleted", error: error?.message });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
