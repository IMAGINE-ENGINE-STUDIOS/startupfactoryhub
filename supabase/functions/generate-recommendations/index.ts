import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user profile and company info
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: company } = await supabaseClient
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: studentProfile } = await supabaseClient
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fetch available connections (users not yet connected)
    const { data: existingConnections } = await supabaseClient
      .from('connections')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    const connectedIds = new Set(
      existingConnections?.flatMap(c => 
        [c.requester_id, c.addressee_id].filter(id => id !== user.id)
      ) || []
    );

    const { data: potentialConnections } = await supabaseClient
      .from('profiles')
      .select('user_id, full_name, role, bio')
      .neq('user_id', user.id)
      .limit(20);

    const availableConnections = potentialConnections?.filter(
      p => !connectedIds.has(p.user_id)
    );

    // Fetch investors
    const { data: investors } = await supabaseClient
      .from('investor_profiles')
      .select(`
        *,
        profiles:user_id (
          full_name,
          bio
        )
      `)
      .limit(10);

    // Fetch courses
    const { data: courses } = await supabaseClient
      .from('courses')
      .select('id, title, description, category, difficulty')
      .eq('is_published', true)
      .limit(10);

    // Build context for AI
    const userContext = {
      role: profile?.role,
      bio: profile?.bio,
      company: company ? {
        name: company.name,
        industry: company.industry,
        stage: company.stage,
        looking_for: company.looking_for,
        description: company.description,
      } : null,
      student: studentProfile ? {
        major: studentProfile.major,
        skills: studentProfile.skills,
        interests: studentProfile.interests,
      } : null,
    };

    const systemPrompt = `You are an AI recommendation engine for a startup ecosystem platform. 
Your task is to provide personalized, actionable recommendations based on the user's profile.

User Context: ${JSON.stringify(userContext)}

Available Data:
- Potential Connections: ${JSON.stringify(availableConnections?.slice(0, 10))}
- Investors: ${JSON.stringify(investors?.slice(0, 5))}
- Courses: ${JSON.stringify(courses?.slice(0, 5))}

Generate 3-4 specific, personalized recommendations. Each recommendation should:
1. Be actionable (connect with X, explore investment from Y, take course Z)
2. Explain WHY this is relevant to the user
3. Include specific names/titles from the available data
4. Be concise (2-3 sentences max)

Focus on recommendations that match the user's role, industry, and goals.`;

    console.log('Calling Lovable AI for recommendations...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate personalized recommendations for this user.' }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_recommendations',
              description: 'Generate personalized recommendations for the user',
              parameters: {
                type: 'object',
                properties: {
                  recommendations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                          enum: ['connection', 'investor', 'course', 'general'],
                          description: 'Type of recommendation'
                        },
                        title: {
                          type: 'string',
                          description: 'Short title for the recommendation'
                        },
                        description: {
                          type: 'string',
                          description: 'Detailed explanation of why this is recommended'
                        },
                        action: {
                          type: 'string',
                          description: 'Call to action text'
                        },
                        reference_id: {
                          type: 'string',
                          description: 'ID of the related entity (user_id, course_id, etc.)'
                        }
                      },
                      required: ['type', 'title', 'description', 'action'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['recommendations'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_recommendations' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const recommendations = JSON.parse(toolCall.function.arguments).recommendations;

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
