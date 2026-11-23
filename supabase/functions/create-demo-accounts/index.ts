// REMOVED 2026-11-23 (security fix): this function previously created demo
// accounts — including admin accounts — with hardcoded passwords and no
// authentication check, and reset existing users' passwords on every call.
// It has been permanently disabled. Demo accounts must never be created by
// an unauthenticated endpoint.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return new Response(
    JSON.stringify({ success: false, error: "This endpoint has been permanently disabled." }),
    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
