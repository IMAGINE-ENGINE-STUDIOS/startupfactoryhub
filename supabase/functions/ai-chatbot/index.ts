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

    const { message, conversationId, userRole } = await req.json();

    // Get conversation history if conversationId provided
    let conversationHistory: any[] = [];
    let conversation: any = null;

    if (conversationId) {
      const { data: conv } = await supabaseClient
        .from('ai_conversations')
        .select('*, ai_messages(*)')
        .eq('id', conversationId)
        .single();
      
      conversation = conv;
      conversationHistory = conv?.ai_messages || [];
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await supabaseClient
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          conversation_type: 'assistant',
          title: message.substring(0, 50) + '...',
        })
        .select()
        .single();

      if (convError) throw convError;
      conversation = newConv;
    }

    // Build system prompt based on user role
    let systemPrompt = "You are an AI assistant for a startup ecosystem platform. ";
    
    if (userRole === 'startup') {
      systemPrompt += "You help startups with business advice, fundraising guidance, product development, and connecting with mentors and investors.";
    } else if (userRole === 'mentor') {
      systemPrompt += "You help mentors manage their mentees, track progress, and provide effective mentorship strategies.";
    } else if (userRole === 'investor') {
      systemPrompt += "You help investors evaluate startups, analyze deal flow, and make investment decisions.";
    } else if (userRole === 'student') {
      systemPrompt += "You help students with career guidance, learning paths, course selection, and internship opportunities.";
    }
    
    systemPrompt += " Be helpful, concise, and actionable in your responses.";

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Save user message
    await supabaseClient
      .from('ai_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message,
      });

    // Save assistant message
    await supabaseClient
      .from('ai_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: assistantMessage,
      });

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        conversationId: conversation.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-chatbot:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
