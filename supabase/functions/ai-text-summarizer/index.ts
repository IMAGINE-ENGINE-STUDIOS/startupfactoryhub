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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { text, sourceType, sourceId, keyPointsCount = 3 } = await req.json();

    // Check if summary already exists
    const { data: existingSummary } = await supabaseClient
      .from('ai_summaries')
      .select('*')
      .eq('source_id', sourceId)
      .eq('source_type', sourceType)
      .maybeSingle();

    if (existingSummary) {
      return new Response(
        JSON.stringify(existingSummary),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call AI to generate summary
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const systemPrompt = `You are a text summarization expert. Provide concise, clear summaries that capture the key information.
Return a JSON object with:
- summary: A 2-3 sentence summary
- keyPoints: An array of ${keyPointsCount} key takeaways`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Summarize this text:\n\n${text}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_summary",
            description: "Generate a summary with key points",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string" },
                keyPoints: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["summary", "keyPoints"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_summary" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls[0];
    const result = JSON.parse(toolCall.function.arguments);

    // Save summary to database
    const { data: savedSummary, error: saveError } = await supabaseClient
      .from('ai_summaries')
      .insert({
        user_id: user.id,
        source_type: sourceType,
        source_id: sourceId,
        original_text: text,
        summary_text: result.summary,
        key_points: result.keyPoints,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify(savedSummary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-text-summarizer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
