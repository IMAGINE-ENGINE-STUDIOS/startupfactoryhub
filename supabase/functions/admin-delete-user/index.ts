import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the calling user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: callerError } = await userClient.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if caller is admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get target user ID from request body
    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "targetUserId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent admin from deleting themselves
    if (targetUserId === callerUser.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account from admin panel" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Admin ${callerUser.id} deleting user ${targetUserId}`);

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
      { table: "job_applications", column: "user_id" },
      { table: "internship_applications", column: "user_id" },
      { table: "cohort_applications", column: "applicant_user_id" },
      { table: "workspace_bookings", column: "user_id" },
      { table: "companies", column: "user_id" },
      { table: "accelerator_profiles", column: "user_id" },
      { table: "user_roles", column: "user_id" },
      { table: "profiles", column: "user_id" },
    ];

    for (const item of tablesToClean) {
      try {
        if (item.subquery && item.via === "conversation_id") {
          const { data: convos } = await adminClient
            .from("ai_conversations")
            .select("id")
            .eq("user_id", targetUserId);
          if (convos && convos.length > 0) {
            const ids = convos.map((c: any) => c.id);
            await adminClient.from("ai_messages").delete().in("conversation_id", ids);
          }
        } else if (item.subquery && item.via === "session_id") {
          const { data: sessions } = await adminClient
            .from("mentoring_sessions")
            .select("id")
            .or(`mentor_id.eq.${targetUserId},mentee_id.eq.${targetUserId}`);
          if (sessions && sessions.length > 0) {
            const ids = sessions.map((s: any) => s.id);
            await adminClient.from("session_feedback").delete().in("session_id", ids);
          }
        } else if (item.column) {
          await adminClient.from(item.table).delete().eq(item.column, targetUserId);
        }
      } catch (e) {
        console.warn(`Non-critical: failed to clean ${item.table}:`, e);
      }
    }

    // Finally, delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user: " + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${targetUserId} permanently deleted by admin ${callerUser.id}`);

    return new Response(
      JSON.stringify({ success: true, message: "User permanently deleted" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin delete user error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
