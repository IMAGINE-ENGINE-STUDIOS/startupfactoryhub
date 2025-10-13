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
    let systemPrompt = "You are an AI assistant for a startup ecosystem platform with access to multiple AI-powered tools. ";
    systemPrompt += "You can help users by:\n";
    systemPrompt += "- Summarizing long texts or documents\n";
    systemPrompt += "- Analyzing sentiment in communications\n";
    systemPrompt += "- Translating text between languages\n";
    systemPrompt += "- Analyzing documents and images\n";
    systemPrompt += "- Automating repetitive tasks\n\n";
    
    if (userRole === 'startup') {
      systemPrompt += "You help startups with business advice, fundraising guidance, product development, and connecting with mentors and investors.";
    } else if (userRole === 'mentor') {
      systemPrompt += "You help mentors manage their mentees, track progress, and provide effective mentorship strategies.";
    } else if (userRole === 'investor') {
      systemPrompt += "You help investors evaluate startups, analyze deal flow, and make investment decisions.";
    } else if (userRole === 'student') {
      systemPrompt += "You help students with career guidance, learning paths, course selection, and internship opportunities.";
    }
    
    systemPrompt += "\n\nWhen users ask for summaries, sentiment analysis, translations, or document analysis, use your available tools to provide these features directly in the conversation.";

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    // Define AI tools for function calling
    const tools = [
      {
        type: "function",
        function: {
          name: "summarize_text",
          description: "Summarize a long text into key points",
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
          description: "Analyze the sentiment of text (positive, negative, or neutral)",
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
          description: "Translate text to a target language",
          parameters: {
            type: "object",
            properties: {
              text: { type: "string", description: "The text to translate" },
              target_language: { type: "string", description: "Target language code (e.g., 'es', 'fr', 'de')" }
            },
            required: ["text", "target_language"]
          }
        }
      }
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
        tools,
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
    let assistantMessage = choice.message.content;
    
    // Handle tool calls if present
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      // Execute the appropriate tool
      let toolResult = '';
      
      if (functionName === 'summarize_text') {
        const { data: summaryData } = await supabaseClient.functions.invoke('ai-text-summarizer', {
          body: { text: functionArgs.text }
        });
        toolResult = summaryData?.summary || 'Unable to generate summary';
      } else if (functionName === 'analyze_sentiment') {
        const { data: sentimentData } = await supabaseClient.functions.invoke('ai-sentiment-analyzer', {
          body: { text: functionArgs.text }
        });
        toolResult = `Sentiment: ${sentimentData?.sentiment || 'neutral'} (Score: ${sentimentData?.score || 0})`;
      } else if (functionName === 'translate_text') {
        const { data: translationData } = await supabaseClient.functions.invoke('ai-translator', {
          body: { 
            text: functionArgs.text,
            source_language: 'auto',
            target_language: functionArgs.target_language
          }
        });
        toolResult = translationData?.translated_text || 'Unable to translate';
      }
      
      // Include tool result in the message
      assistantMessage = `${assistantMessage}\n\n${toolResult}`;
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
