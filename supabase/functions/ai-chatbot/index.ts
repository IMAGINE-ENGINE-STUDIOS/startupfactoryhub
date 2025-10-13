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
    let systemPrompt = "You are an AI assistant for a startup ecosystem platform with powerful capabilities. ";
    
    if (userRole === 'startup') {
      systemPrompt += "You help startups with business advice, fundraising guidance, product development, and connecting with mentors and investors. ";
    } else if (userRole === 'mentor') {
      systemPrompt += "You help mentors manage their mentees, track progress, and provide effective mentorship strategies. ";
    } else if (userRole === 'investor') {
      systemPrompt += "You help investors evaluate startups, analyze deal flow, and make investment decisions. ";
    } else if (userRole === 'student') {
      systemPrompt += "You help students with career guidance, learning paths, course selection, and internship opportunities. ";
    }
    
    systemPrompt += "\n\nYou have access to these tools when users explicitly request them:\n";
    systemPrompt += "- Text Summarization: Use when asked to summarize long content\n";
    systemPrompt += "- Sentiment Analysis: Use when asked to analyze sentiment or tone\n";
    systemPrompt += "- Translation: Use when asked to translate text to another language\n\n";
    systemPrompt += "Only use tools when specifically requested. For general questions and conversation, respond directly without using tools.";

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    // Define AI tools for selective use
    const tools = [
      {
        type: "function",
        function: {
          name: "summarize_text",
          description: "Summarize long text content into concise key points. Use ONLY when user explicitly asks to summarize something.",
          parameters: {
            type: "object",
            properties: {
              text: { type: "string", description: "The text to summarize" }
            },
            required: ["text"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_sentiment",
          description: "Analyze sentiment (positive, negative, neutral) of text. Use ONLY when user asks for sentiment analysis.",
          parameters: {
            type: "object",
            properties: {
              text: { type: "string", description: "The text to analyze" }
            },
            required: ["text"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "translate_text",
          description: "Translate text to another language. Use ONLY when user explicitly asks for translation.",
          parameters: {
            type: "object",
            properties: {
              text: { type: "string", description: "The text to translate" },
              target_language: { type: "string", description: "Target language code (es, fr, de, etc.)" }
            },
            required: ["text", "target_language"]
          }
        }
      }
    ];

    // Call Lovable AI with tools
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
        tools,
        tool_choice: 'auto', // Let AI decide when to use tools
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
    const choice = data.choices[0];
    let assistantMessage = '';
    
    // Check if AI wants to use a tool
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      console.log(`AI requested tool: ${functionName}`);
      
      // Execute the tool
      try {
        if (functionName === 'summarize_text') {
          const { data: summaryData, error: summaryError } = await supabaseClient.functions.invoke('ai-text-summarizer', {
            body: { text: functionArgs.text }
          });
          
          if (summaryError) throw summaryError;
          assistantMessage = `Here's the summary:\n\n${summaryData?.summary || 'Unable to generate summary'}`;
          
        } else if (functionName === 'analyze_sentiment') {
          const { data: sentimentData, error: sentimentError } = await supabaseClient.functions.invoke('ai-sentiment-analyzer', {
            body: { text: functionArgs.text }
          });
          
          if (sentimentError) throw sentimentError;
          const sentiment = sentimentData?.sentiment || 'neutral';
          const score = sentimentData?.score || 0;
          assistantMessage = `Sentiment Analysis:\n- Overall Sentiment: ${sentiment}\n- Confidence Score: ${(score * 100).toFixed(1)}%`;
          
        } else if (functionName === 'translate_text') {
          const { data: translationData, error: translationError } = await supabaseClient.functions.invoke('ai-translator', {
            body: { 
              text: functionArgs.text,
              source_language: 'auto',
              target_language: functionArgs.target_language
            }
          });
          
          if (translationError) throw translationError;
          assistantMessage = `Translation to ${functionArgs.target_language}:\n\n${translationData?.translated_text || 'Unable to translate'}`;
        }
      } catch (toolError) {
        console.error('Tool execution error:', toolError);
        assistantMessage = choice.message.content || 'I encountered an error using that feature. Please try again.';
      }
    } else {
      // No tool call, use direct response
      assistantMessage = choice.message.content;
    }

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
