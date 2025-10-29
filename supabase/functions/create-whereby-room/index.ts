import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomName, startDate, endDate } = await req.json();
    const WHEREBY_API_KEY = Deno.env.get("WHEREBY_API_KEY");

    if (!WHEREBY_API_KEY) {
      throw new Error("Whereby API key not configured");
    }

    // Create a Whereby room using their API
    const response = await fetch("https://api.whereby.dev/v1/meetings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHEREBY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endDate: endDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default 24 hours
        fields: ["hostRoomUrl"],
        roomNamePrefix: roomName ? `/${roomName}` : undefined,
        roomMode: "normal",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Whereby API error:", error);
      throw new Error(`Failed to create Whereby room: ${response.status}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        roomUrl: data.roomUrl,
        hostRoomUrl: data.hostRoomUrl,
        meetingId: data.meetingId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating Whereby room:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
