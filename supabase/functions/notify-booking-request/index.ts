import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id } = await req.json();
    if (!booking_id || typeof booking_id !== "string") {
      return new Response(JSON.stringify({ error: "booking_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: booking, error } = await admin
      .from("calendar_bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (error || !booking) throw new Error("Booking not found");

    // Resolve host email + name
    const { data: hostUser } = await admin.auth.admin.getUserById(booking.host_id);
    const hostEmail = hostUser?.user?.email;
    const hostName =
      (hostUser?.user?.user_metadata as any)?.full_name || hostUser?.user?.email?.split("@")[0] || "Host";

    if (!hostEmail) {
      return new Response(JSON.stringify({ notified: false, reason: "host_email_missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scheduled = new Date(booking.scheduled_at);
    const date = scheduled.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
    const time = scheduled.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    });

    const { error: emailErr } = await admin.functions.invoke("send-booking-email", {
      body: {
        to: hostEmail,
        bookerName: booking.booker_name,
        bookerEmail: booking.booker_email,
        hostName,
        date,
        time,
        duration: booking.duration_minutes,
        meetingType: booking.meeting_type,
        meetingLink: booking.meeting_link || undefined,
        location: booking.location || undefined,
        topic: booking.topic || undefined,
        type: "host_new_request",
      },
    });

    if (emailErr) console.error("send-booking-email error:", emailErr);

    return new Response(JSON.stringify({ notified: true, emailed: !emailErr }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-booking-request error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
