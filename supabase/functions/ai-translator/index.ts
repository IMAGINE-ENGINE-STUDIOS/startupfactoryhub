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

    const { text, targetLanguage, sourceLanguage = 'auto' } = await req.json();

    // Check cache first
    const { data: cachedTranslation } = await supabaseClient
      .from('ai_translations')
      .select('*')
      .eq('original_text', text)
      .eq('target_language', targetLanguage)
      .maybeSingle();

    if (cachedTranslation) {
      return new Response(
        JSON.stringify(cachedTranslation),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const prompt = sourceLanguage === 'auto' 
      ? `Translate the following text to ${targetLanguage}:\n\n${text}`
      : `Translate the following text from ${sourceLanguage} to ${targetLanguage}:\n\n${text}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: "system", 
            content: "You are a professional translator. Provide accurate, natural-sounding translations. Return only the translated text, nothing else."
          },
          { role: "user", content: prompt }
        ],
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
    const translatedText = data.choices[0].message.content;

    // Cache translation
    const { data: savedTranslation, error: saveError } = await supabaseClient
      .from('ai_translations')
      .insert({
        original_text: text,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        translated_text: translatedText,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving translation:', saveError);
      // Return translation even if caching fails
      return new Response(
        JSON.stringify({
          original_text: text,
          translated_text: translatedText,
          target_language: targetLanguage,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(savedTranslation),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-translator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
