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

    const userId = "e689f5cb-6970-471b-b21e-e9d172862a15"; // demo-investor

    // Delete from EVERY table that has user_id column
    const userIdTables = [
      "achievements","advisor_achievements","advisor_education","advisor_experiences",
      "advisor_skills","ai_conversations","ai_documents","ai_insights","ai_summaries",
      "ai_task_automations","api_usage_logs","artemis_visitor_log","artemis_watch_party_messages",
      "blog_comments","blog_likes","blog_posts","calendar_blocked_times","calendar_booking_settings",
      "camera_snapshots","comment_likes","course_completions","crm_cards","crm_pipelines",
      "dj_recordings","document_comments","document_cursors","document_versions",
      "event_attendees","event_payments","feed_posts","flight_pass_requests",
      "genius_ai_chat_logs","genius_ai_memory","hot_deals_invited_startups","hub_bookings",
      "image_generation_usage","internship_applications","job_applications",
      "leaderboard_entries","lightpaper_activity","lightpaper_projects","linkedin_tokens",
      "live_room_participants","map_search_history","notifications",
      "official_mentor_status","payout_accounts","payout_requests","pdf_comment_replies",
      "pdf_comments","post_bookmarks","post_comments","post_likes","project_favorites",
      "recording_sessions","referral_accounts","resource_bookmarks","roadmap_progress",
      "route_history","saved_locations","security_logs","soft_landing_requests",
      "storage_overages","student_profiles","study_group_files","study_group_members",
      "study_group_messages","user_goals","user_storage_usage","user_subscriptions",
      "vc_introduction_requests","village_member_payments","village_purchases","village_staff",
      // These last - profile/role tables
      "investments","investment_interests","investor_availability","pitch_meetings","portfolio_companies",
      "companies","investor_profiles","mentor_profiles","accelerator_profiles",
      "user_roles","profiles",
    ];

    // Also clean tables with other column names
    const otherColumns = [
      { table: "connections", column: "requester_id" },
      { table: "connections", column: "addressee_id" },
      { table: "follows", column: "follower_id" },
      { table: "follows", column: "following_id" },
      { table: "messages", column: "sender_id" },
      { table: "messages", column: "receiver_id" },
      { table: "conversations", column: "user1_id" },
      { table: "conversations", column: "user2_id" },
      { table: "endorsements", column: "mentor_id" },
      { table: "endorsements", column: "endorser_id" },
      { table: "mentoring_sessions", column: "mentor_id" },
      { table: "mentoring_sessions", column: "mentee_id" },
      { table: "mentorship_relationships", column: "mentor_id" },
      { table: "mentorship_relationships", column: "mentee_id" },
      { table: "calendar_bookings", column: "host_id" },
      { table: "calendar_bookings", column: "booker_id" },
      { table: "course_enrollments", column: "student_id" },
      { table: "certificates", column: "student_id" },
    ];

    const errors: string[] = [];

    for (const table of userIdTables) {
      try {
        await supabase.from(table).delete().eq("user_id", userId);
      } catch (e) {
        errors.push(`${table}: ${e}`);
      }
    }

    for (const { table, column } of otherColumns) {
      try {
        await supabase.from(table).delete().eq(column, userId);
      } catch (e) {
        errors.push(`${table}.${column}: ${e}`);
      }
    }

    // Now delete auth user
    const { error } = await supabase.auth.admin.deleteUser(userId);

    return new Response(JSON.stringify({ 
      success: !error, 
      deleted: !error,
      authError: error?.message,
      cleanupErrors: errors 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
