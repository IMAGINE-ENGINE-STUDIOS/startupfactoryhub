import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create a client with the user's JWT to verify identity
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Delete user data from all related tables (order matters for FK constraints)
    const tablesToClean = [
      { table: "ai_messages", via: "conversation_id", subquery: true },
      { table: "ai_conversations", column: "user_id" },
      { table: "ai_summaries", column: "user_id" },
      { table: "ai_insights", column: "user_id" },
      { table: "ai_documents", column: "user_id" },
      { table: "ai_task_automations", column: "user_id" },
      { table: "session_feedback", via: "session_id", subquery: true },
      { table: "mentoring_sessions", column: "mentor_id" },
      { table: "mentoring_sessions", column: "mentee_id" },
      { table: "endorsements", column: "mentor_id" },
      { table: "endorsements", column: "endorser_id" },
      { table: "mentorship_relationships", column: "mentor_id" },
      { table: "mentorship_relationships", column: "mentee_id" },
      { table: "mentor_profiles", column: "user_id" },
      { table: "investments", column: "investor_id" },
      { table: "investment_interests", column: "investor_id" },
      { table: "investor_profiles", column: "user_id" },
      { table: "post_bookmarks", column: "user_id" },
      { table: "comment_likes", column: "user_id" },
      { table: "post_comments", column: "user_id" },
      { table: "post_likes", column: "user_id" },
      { table: "feed_posts", column: "user_id" },
      { table: "messages", column: "sender_id" },
      { table: "messages", column: "receiver_id" },
      { table: "conversations", column: "user1_id" },
      { table: "conversations", column: "user2_id" },
      { table: "event_attendees", column: "user_id" },
      { table: "notifications", column: "user_id" },
      { table: "connections", column: "requester_id" },
      { table: "connections", column: "addressee_id" },
      { table: "follows", column: "follower_id" },
      { table: "follows", column: "following_id" },
      { table: "course_enrollments", column: "student_id" },
      { table: "course_completions", column: "user_id" },
      { table: "certificates", column: "student_id" },
      { table: "leaderboard_entries", column: "user_id" },
      { table: "achievements", column: "user_id" },
      { table: "study_group_members", column: "user_id" },
      { table: "advisor_skills", column: "user_id" },
      { table: "advisor_experiences", column: "user_id" },
      { table: "advisor_education", column: "user_id" },
      { table: "advisor_achievements", column: "user_id" },
      { table: "companies", column: "user_id" },
      { table: "user_roles", column: "user_id" },
      { table: "profiles", column: "user_id" },
    ];

    for (const item of tablesToClean) {
      try {
        if (item.subquery && item.via === "conversation_id") {
          // Delete ai_messages via conversation
          await adminClient.rpc("execute_sql", {} as any).then(() => {});
          // Use direct delete with filter
          const { data: convos } = await adminClient
            .from("ai_conversations")
            .select("id")
            .eq("user_id", userId);
          if (convos && convos.length > 0) {
            const ids = convos.map((c: any) => c.id);
            await adminClient.from("ai_messages").delete().in("conversation_id", ids);
          }
        } else if (item.subquery && item.via === "session_id") {
          // Delete session_feedback via mentoring_sessions
          const { data: sessions } = await adminClient
            .from("mentoring_sessions")
            .select("id")
            .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`);
          if (sessions && sessions.length > 0) {
            const ids = sessions.map((s: any) => s.id);
            await adminClient.from("session_feedback").delete().in("session_id", ids);
          }
        } else if (item.column) {
          await adminClient.from(item.table).delete().eq(item.column, userId);
        }
      } catch (e) {
        console.warn(`Non-critical: failed to clean ${item.table}:`, e);
      }
    }

    // Finally, delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account: " + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
