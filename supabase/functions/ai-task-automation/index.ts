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

    const { automationType, config } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let systemPrompt = "You are an AI task automation assistant. ";
    let userPrompt = "";

    if (automationType === 'schedule_messages') {
      systemPrompt += "Help users schedule and automate messages based on triggers.";
      userPrompt = `Create an automation plan for: ${JSON.stringify(config)}`;
    } else if (automationType === 'auto_respond') {
      systemPrompt += "Generate smart auto-responses based on message content.";
      userPrompt = `Generate an appropriate auto-response for: ${config.messageContent}`;
    } else if (automationType === 'workflow') {
      systemPrompt += "Design workflow automations with multiple steps.";
      userPrompt = `Design a workflow for: ${JSON.stringify(config)}`;
    } else if (automationType === 'task_suggestions') {
      systemPrompt += "Suggest automated tasks based on user activity and goals.";
      userPrompt = `Suggest task automations for user with profile: ${JSON.stringify(config.userProfile)}`;
    }

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI API error ${response.status}:`, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: `AI API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const automationPlan = data.choices[0].message.content;

    // Save automation to database
    const { data: savedAutomation, error: saveError } = await supabaseClient
      .from('ai_task_automations')
      .insert({
        user_id: user.id,
        name: config.name || 'Automation',
        trigger_type: automationType,
        trigger_config: config,
        action_type: automationType,
        action_config: { plan: automationPlan },
        is_active: true
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving automation:', saveError);
      throw saveError;
    }

    return new Response(
      JSON.stringify({
        automation: savedAutomation,
        plan: automationPlan
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-task-automation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
