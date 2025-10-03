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

    const { text, contentType, contentId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const systemPrompt = `You are a sentiment analysis expert. Analyze the sentiment and tone of text.
Return a JSON object with:
- sentiment: "positive", "negative", or "neutral"
- score: A number from -1 (very negative) to 1 (very positive)
- emotions: Array of detected emotions (e.g., ["happy", "excited"] or ["frustrated", "concerned"])
- urgency: "low", "medium", or "high"
- category: Main topic category`;

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
          { role: "user", content: `Analyze the sentiment of this text:\n\n${text}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_sentiment",
            description: "Analyze sentiment and emotions in text",
            parameters: {
              type: "object",
              properties: {
                sentiment: { 
                  type: "string",
                  enum: ["positive", "negative", "neutral"]
                },
                score: { type: "number" },
                emotions: {
                  type: "array",
                  items: { type: "string" }
                },
                urgency: {
                  type: "string",
                  enum: ["low", "medium", "high"]
                },
                category: { type: "string" }
              },
              required: ["sentiment", "score", "emotions", "urgency", "category"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_sentiment" } }
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

    // Save insight to database
    const { data: savedInsight, error: saveError } = await supabaseClient
      .from('ai_insights')
      .insert({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        insight_type: 'sentiment',
        insight_data: result,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify(savedInsight),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-sentiment-analyzer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
