import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();

    // 1. Auto-stop timed sessions that have exceeded their scheduled_stop_at
    const { data: expiredSessions } = await supabase
      .from('recording_sessions')
      .select('id')
      .eq('status', 'recording')
      .not('scheduled_stop_at', 'is', null)
      .lte('scheduled_stop_at', now.toISOString());

    if (expiredSessions && expiredSessions.length > 0) {
      const expiredIds = expiredSessions.map((s: any) => s.id);
      await supabase
        .from('recording_sessions')
        .update({ status: 'stopped', stopped_at: now.toISOString() })
        .in('id', expiredIds);
      console.log(`[scheduler] Auto-stopped ${expiredIds.length} expired sessions`);
    }

    // 2. Get all active recording sessions
    const { data: activeSessions, error } = await supabase
      .from('recording_sessions')
      .select('id, camera_id, image_url, user_id, refresh_rate, last_capture_at')
      .eq('status', 'recording');

    if (error) {
      console.error('[scheduler] Query error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!activeSessions || activeSessions.length === 0) {
      return new Response(JSON.stringify({ message: 'No active sessions', captured: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let captured = 0;
    const capturePromises: Promise<void>[] = [];

    for (const session of activeSessions) {
      const refreshRate = session.refresh_rate || 30;
      const lastCapture = session.last_capture_at ? new Date(session.last_capture_at).getTime() : 0;
      const elapsed = (now.getTime() - lastCapture) / 1000;

      // Only capture if enough time has passed
      if (elapsed < refreshRate - 2) continue; // 2s tolerance

      if (!session.image_url) {
        console.warn(`[scheduler] Session ${session.id} has no image_url, skipping`);
        continue;
      }

      const promise = (async () => {
        try {
          const resp = await fetch(`${supabaseUrl}/functions/v1/record-camera`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              camera_id: session.camera_id,
              image_url: session.image_url,
              user_id: session.user_id,
              session_id: session.id,
            }),
            signal: AbortSignal.timeout(20000),
          });

          if (resp.ok) {
            captured++;
          } else {
            const errText = await resp.text();
            console.error(`[scheduler] record-camera failed for session ${session.id}: ${errText}`);
          }
        } catch (err) {
          console.error(`[scheduler] Capture error for session ${session.id}:`, err);
        }
      })();

      capturePromises.push(promise);
    }

    await Promise.allSettled(capturePromises);

    console.log(`[scheduler] Processed ${activeSessions.length} sessions, captured ${captured} frames`);

    return new Response(JSON.stringify({
      message: `Processed ${activeSessions.length} sessions`,
      captured,
      total_active: activeSessions.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[scheduler] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
