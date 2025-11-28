import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to generate short unique ID (8 chars)
function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Helper function to sanitize room name prefix for Whereby API
function sanitizeRoomNamePrefix(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')  // Replace non-alphanumeric with dashes
    .replace(/-+/g, '-')           // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '')         // Remove leading/trailing dashes
    .substring(0, 30);             // Limit to 30 chars
}

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

    // Sanitize room name for Whereby API (only alphanumeric and dashes allowed)
    const shortRoomName = roomName ? sanitizeRoomNamePrefix(roomName) : generateShortId();

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
        roomNamePrefix: shortRoomName,
        roomMode: "normal",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Whereby API error:", JSON.stringify(error, null, 2));
      throw new Error(`Whereby API error: ${error.message || error.error || response.status}`);
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
