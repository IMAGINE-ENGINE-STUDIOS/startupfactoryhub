import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY)
      throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are **Genius AI**, a powerful writing assistant built into the LightPaper workspace. Your capabilities include:

1. **Document Writing**: Write professional documents, reports, essays, articles, entire book chapters, business plans, and any written content. Structure them with clear headings, paragraphs, and formatting using Markdown.

2. **Grammar & Proofreading**: Check and correct grammar, spelling, punctuation, sentence structure, and style. Explain what was wrong and why you changed it.

3. **Translation**: Translate text between any languages accurately while preserving tone and context.

4. **Writing Improvement**: Enhance clarity, tone, flow, and readability of any text. Offer suggestions for better word choices.

5. **Summarization**: Condense long texts into clear, concise summaries while preserving key information.

6. **Format Conversion**: Help convert content between formats (e.g., bullet points to paragraphs, informal to formal, email to letter, etc.).

7. **Research & Help**: Answer questions, explain concepts, brainstorm ideas, create outlines, and help users figure out any topic.

Always respond in well-formatted Markdown. Use headings, bullet points, code blocks, and emphasis where appropriate. Be thorough but concise. When writing documents, produce complete, ready-to-use content.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("lightpaper-genius error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
