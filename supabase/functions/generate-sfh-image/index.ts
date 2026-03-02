import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREE_LIMIT = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");
    const user = userData.user;

    const { prompt, stylePreset } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      throw new Error("Prompt is required");
    }

    // Check usage count
    const { count, error: countError } = await supabaseAdmin
      .from("image_generation_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) throw new Error("Failed to check usage: " + countError.message);
    const usageCount = count ?? 0;

    // If over free limit, check membership
    if (usageCount >= FREE_LIMIT) {
      // Platform owner bypass
      const PLATFORM_OWNER_EMAILS = ["ceo@imagineengine.space"];
      const isOwner = PLATFORM_OWNER_EMAILS.includes(user.email?.toLowerCase() ?? "");

      if (!isOwner) {
        // Check membership via internal call
        const membershipResp = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/check-membership`,
          {
            method: "POST",
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/json",
              apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            },
          }
        );
        const membershipData = await membershipResp.json();
        if (!membershipData.subscribed) {
          return new Response(
            JSON.stringify({
              error: "limit_reached",
              message: "Free image limit reached. Subscribe to continue generating images.",
              usageCount,
              limit: FREE_LIMIT,
            }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Build the full prompt with style
    let fullPrompt = prompt.trim();
    if (stylePreset && stylePreset !== "none") {
      const styleMap: Record<string, string> = {
        photorealistic: "Photorealistic, ultra high resolution, detailed photography style",
        digital_art: "Digital art style, vibrant colors, detailed illustration",
        watercolor: "Watercolor painting style, soft edges, artistic brush strokes",
        oil_painting: "Oil painting style, rich textures, classical fine art",
        anime: "Anime style, Japanese animation aesthetic, detailed character art",
        "3d_render": "3D rendered, cinematic lighting, high quality CGI",
        sketch: "Pencil sketch style, detailed line drawing, artistic",
        pop_art: "Pop art style, bold colors, comic book aesthetic",
      };
      const styleDesc = styleMap[stylePreset] || "";
      if (styleDesc) {
        fullPrompt = `${styleDesc}. ${fullPrompt}`;
      }
    }

    // Call Lovable AI gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limited", message: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "credits_exhausted", message: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData || !imageData.startsWith("data:image")) {
      throw new Error("No image was generated. Try a different prompt.");
    }

    // Extract base64 and upload to storage
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) throw new Error("Invalid image data format");

    const imageExt = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const base64Content = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Content), (c) => c.charCodeAt(0));

    const fileName = `${user.id}/${Date.now()}.${imageExt}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("ai-generated-images")
      .upload(fileName, binaryData, {
        contentType: `image/${base64Match[1]}`,
        upsert: false,
      });

    if (uploadError) throw new Error("Failed to save image: " + uploadError.message);

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("ai-generated-images")
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    // Insert usage record
    await supabaseAdmin.from("image_generation_usage").insert({
      user_id: user.id,
      prompt: prompt.trim(),
      style_preset: stylePreset || null,
      image_url: imageUrl,
    });

    // Log to api_usage_logs
    await supabaseAdmin.from("api_usage_logs").insert({
      user_id: user.id,
      service_name: "sfh-image-creator",
      endpoint: "generate-sfh-image",
      request_count: 1,
      metadata: { prompt: prompt.trim().substring(0, 200), style: stylePreset },
    });

    return new Response(
      JSON.stringify({
        imageUrl,
        usageCount: usageCount + 1,
        limit: FREE_LIMIT,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-sfh-image error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Image generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
