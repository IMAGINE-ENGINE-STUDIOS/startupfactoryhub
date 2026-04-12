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

    const userId = "e689f5cb-6970-471b-b21e-e9d172862a15";

    // Every FK reference to auth.users found in the schema
    const ops: { table: string; column: string }[] = [
      // Profile views
      { table: "profile_views", column: "viewer_id" },
      { table: "profile_views", column: "viewed_profile_id" },
      // Event related
      { table: "event_attendees", column: "user_id" },
      { table: "event_payments", column: "user_id" },
      // All user_id tables
      { table: "achievements", column: "user_id" },
      { table: "advisor_achievements", column: "user_id" },
      { table: "advisor_education", column: "user_id" },
      { table: "advisor_experiences", column: "user_id" },
      { table: "advisor_skills", column: "user_id" },
      { table: "advisor_job_tasks", column: "advisor_id" },
      { table: "ai_conversations", column: "user_id" },
      { table: "ai_documents", column: "user_id" },
      { table: "ai_insights", column: "user_id" },
      { table: "ai_summaries", column: "user_id" },
      { table: "ai_task_automations", column: "user_id" },
      { table: "api_usage_logs", column: "user_id" },
      { table: "application_invitations", column: "linked_user_id" },
      { table: "artemis_visitor_log", column: "user_id" },
      { table: "artemis_watch_party_messages", column: "user_id" },
      { table: "blog_comments", column: "user_id" },
      { table: "blog_likes", column: "user_id" },
      { table: "blog_posts", column: "user_id" },
      { table: "calendar_blocked_times", column: "user_id" },
      { table: "calendar_booking_settings", column: "user_id" },
      { table: "calendar_bookings", column: "host_id" },
      { table: "calendar_bookings", column: "booker_id" },
      { table: "camera_snapshots", column: "user_id" },
      { table: "certificates", column: "student_id" },
      { table: "comment_likes", column: "user_id" },
      { table: "companies", column: "user_id" },
      { table: "company_valuations", column: "created_by" },
      { table: "connections", column: "requester_id" },
      { table: "connections", column: "addressee_id" },
      { table: "conversations", column: "user1_id" },
      { table: "conversations", column: "user2_id" },
      { table: "course_completions", column: "user_id" },
      { table: "course_enrollments", column: "student_id" },
      { table: "crm_cards", column: "user_id" },
      { table: "crm_pipelines", column: "user_id" },
      { table: "dj_recordings", column: "user_id" },
      { table: "document_comments", column: "user_id" },
      { table: "document_cursors", column: "user_id" },
      { table: "document_versions", column: "user_id" },
      { table: "endorsements", column: "mentor_id" },
      { table: "endorsements", column: "endorser_id" },
      { table: "feed_posts", column: "user_id" },
      { table: "flight_pass_requests", column: "user_id" },
      { table: "follows", column: "follower_id" },
      { table: "follows", column: "following_id" },
      { table: "genius_ai_chat_logs", column: "user_id" },
      { table: "genius_ai_memory", column: "user_id" },
      { table: "hot_deals_invited_startups", column: "user_id" },
      { table: "hub_bookings", column: "user_id" },
      { table: "image_generation_usage", column: "user_id" },
      { table: "internship_applications", column: "user_id" },
      { table: "investment_interests", column: "investor_id" },
      { table: "investments", column: "investor_id" },
      { table: "investor_availability", column: "investor_id" },
      { table: "investor_profiles", column: "user_id" },
      { table: "job_applications", column: "user_id" },
      { table: "leaderboard_entries", column: "user_id" },
      { table: "lightpaper_activity", column: "user_id" },
      { table: "lightpaper_projects", column: "user_id" },
      { table: "linkedin_tokens", column: "user_id" },
      { table: "live_room_participants", column: "user_id" },
      { table: "map_search_history", column: "user_id" },
      { table: "mentor_profiles", column: "user_id" },
      { table: "mentoring_sessions", column: "mentor_id" },
      { table: "mentoring_sessions", column: "mentee_id" },
      { table: "mentorship_relationships", column: "mentor_id" },
      { table: "mentorship_relationships", column: "mentee_id" },
      { table: "messages", column: "sender_id" },
      { table: "messages", column: "receiver_id" },
      { table: "notifications", column: "user_id" },
      { table: "official_mentor_status", column: "user_id" },
      { table: "payout_accounts", column: "user_id" },
      { table: "payout_requests", column: "user_id" },
      { table: "pdf_comment_replies", column: "user_id" },
      { table: "pdf_comments", column: "user_id" },
      { table: "pitch_meetings", column: "investor_id" },
      { table: "pitch_meetings", column: "startup_id" },
      { table: "portfolio_companies", column: "investor_id" },
      { table: "post_bookmarks", column: "user_id" },
      { table: "post_comments", column: "user_id" },
      { table: "post_likes", column: "user_id" },
      { table: "project_favorites", column: "user_id" },
      { table: "recording_sessions", column: "user_id" },
      { table: "referral_accounts", column: "user_id" },
      { table: "resource_bookmarks", column: "user_id" },
      { table: "resources", column: "author_id" },
      { table: "roadmap_progress", column: "user_id" },
      { table: "route_history", column: "user_id" },
      { table: "saved_locations", column: "user_id" },
      { table: "security_logs", column: "user_id" },
      { table: "soft_landing_requests", column: "user_id" },
      { table: "storage_overages", column: "user_id" },
      { table: "student_profiles", column: "user_id" },
      { table: "study_group_files", column: "user_id" },
      { table: "study_group_members", column: "user_id" },
      { table: "study_group_messages", column: "user_id" },
      { table: "study_groups", column: "created_by" },
      { table: "user_goals", column: "user_id" },
      { table: "user_roles", column: "user_id" },
      { table: "user_storage_usage", column: "user_id" },
      { table: "user_subscriptions", column: "user_id" },
      { table: "vc_introduction_requests", column: "user_id" },
      { table: "village_member_payments", column: "user_id" },
      { table: "village_purchases", column: "user_id" },
      { table: "village_staff", column: "user_id" },
      // Keep profiles and accelerator_profiles last
      { table: "accelerator_profiles", column: "user_id" },
      { table: "profiles", column: "user_id" },
    ];

    const errors: string[] = [];

    for (const { table, column } of ops) {
      try {
        const { error } = await supabase.from(table).delete().eq(column, userId);
        if (error) errors.push(`${table}.${column}: ${error.message}`);
      } catch (e) {
        errors.push(`${table}.${column}: ${e}`);
      }
    }

    // Delete auth user
    const { error } = await supabase.auth.admin.deleteUser(userId);

    return new Response(JSON.stringify({ 
      success: !error, 
      authError: error?.message,
      cleanupErrors: errors.length > 0 ? errors : undefined,
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
