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
      "demo-investor@startupfactoryhub.com",
      "demo-mentor@startupfactoryhub.com",
    ];

    const results: any[] = [];

    const { data: allUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

    for (const email of emailsToDelete) {
      const user = allUsers?.users?.find((u) => u.email === email);
      if (!user) {
        results.push({ email, status: "not_found" });
        continue;
      }

      const userId = user.id;
      
      // Clean ALL related tables comprehensively
      const cleanupOps = [
        // Investor-related
        { table: "investments", column: "investor_id" },
        { table: "investment_interests", column: "investor_id" },
        { table: "investor_availability", column: "investor_id" },
        { table: "pitch_meetings", column: "investor_id" },
        { table: "portfolio_companies", column: "investor_id" },
        // Mentor-related
        { table: "session_feedback", subquery: "mentoring_sessions" },
        { table: "mentoring_sessions", column: "mentor_id" },
        { table: "mentoring_sessions", column: "mentee_id" },
        { table: "endorsements", column: "mentor_id" },
        { table: "endorsements", column: "endorser_id" },
        { table: "mentorship_relationships", column: "mentor_id" },
        { table: "mentorship_relationships", column: "mentee_id" },
        { table: "mentor_availability", column: "mentor_id" },
        { table: "startup_mentor_assignments", column: "mentor_id" },
        // General user tables
        { table: "notifications", column: "user_id" },
        { table: "connections", column: "requester_id" },
        { table: "connections", column: "addressee_id" },
        { table: "follows", column: "follower_id" },
        { table: "follows", column: "following_id" },
        { table: "feed_posts", column: "user_id" },
        { table: "messages", column: "sender_id" },
        { table: "messages", column: "receiver_id" },
        { table: "conversations", column: "user1_id" },
        { table: "conversations", column: "user2_id" },
        // Profile tables
        { table: "investor_profiles", column: "user_id" },
        { table: "mentor_profiles", column: "user_id" },
        { table: "user_roles", column: "user_id" },
        { table: "profiles", column: "user_id" },
      ];

      for (const op of cleanupOps) {
        try {
          if (op.subquery === "mentoring_sessions") {
            const { data: sessions } = await supabase
              .from("mentoring_sessions")
              .select("id")
              .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`);
            if (sessions && sessions.length > 0) {
              await supabase.from("session_feedback").delete().in("session_id", sessions.map((s: any) => s.id));
            }
          } else if (op.column) {
            await supabase.from(op.table).delete().eq(op.column, userId);
          }
        } catch (e) {
          console.warn(`Failed to clean ${op.table} (${op.column}):`, e);
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
