import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to log API usage
async function logApiUsage(supabaseClient: any, serviceName: string, endpoint: string, tokensUsed?: number, estimatedCost?: number) {
  try {
    await supabaseClient.from('api_usage_logs').insert({
      service_name: serviceName,
      endpoint: endpoint,
      request_count: 1,
      tokens_used: tokensUsed || null,
      estimated_cost: estimatedCost || 0.001,
      metadata: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    console.error('Failed to log API usage:', err);
  }
}

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
      .select('user_id, full_name, role, bio, location')
      .neq('user_id', user.id)
      .limit(20);

    const availableConnections = potentialConnections?.filter(
      p => !connectedIds.has(p.user_id)
    );

    // Fetch investors with more details
    const { data: investors } = await supabaseClient
      .from('investor_profiles')
      .select(`
        *,
        profiles:user_id (
          full_name,
          bio,
          location
        )
      `)
      .limit(10);

    // Fetch courses
    const { data: courses } = await supabaseClient
      .from('courses')
      .select('id, title, description, category, difficulty')
      .eq('is_published', true)
      .limit(10);

    // Fetch platform resources (coworking, grants, accelerators, labs, etc.)
    const { data: resources } = await supabaseClient
      .from('resources')
      .select('id, title, description, resource_type, city, country, journey_steps, is_official_partner, location_type')
      .eq('is_verified', true)
      .limit(25);

    // Filter resources by user's location or stage for relevance
    const userLocation = company?.location?.toLowerCase() || profile?.location?.toLowerCase() || '';
    const userStage = company?.stage || '';
    
    const relevantResources = resources?.filter(r => {
      const matchesLocation = userLocation && (
        r.city?.toLowerCase().includes(userLocation) || 
        r.country?.toLowerCase().includes(userLocation) ||
        userLocation.includes(r.city?.toLowerCase() || '') ||
        userLocation.includes(r.country?.toLowerCase() || '')
      );
      const matchesStage = r.journey_steps?.includes(userStage) || 
                          r.journey_steps?.includes('all') ||
                          !r.journey_steps?.length;
      const isPartner = r.is_official_partner;
      return matchesLocation || matchesStage || isPartner;
    }) || resources;

    // Build comprehensive context for AI
    const userContext = {
      role: profile?.role,
      bio: profile?.bio,
      location: profile?.location,
      company: company ? {
        name: company.name,
        industry: company.industry,
        stage: company.stage,
        looking_for: company.looking_for,
        description: company.description,
        // Enhanced startup data
        location: company.location,
        team_size: company.team_size,
        funding_amount: company.funding_amount,
        founded_year: company.founded_year,
        website: company.website,
      } : null,
      student: studentProfile ? {
        major: studentProfile.major,
        skills: studentProfile.skills,
        interests: studentProfile.interests,
      } : null,
    };

    const systemPrompt = `You are an expert startup advisor and AI recommendation engine for a startup ecosystem platform. 
Your task is to provide personalized, actionable recommendations INCLUDING strategic tips, growth strategies, and resources.

ANALYZE THE FOLLOWING STARTUP DATA CAREFULLY:
- Location: "${company?.location || profile?.location || 'Not specified'}" - Recommend LOCAL resources, investors, events, coworking spaces
- Stage: "${company?.stage || 'Not specified'}" - Match resources appropriate for their current journey step
- Team Size: ${company?.team_size || 'Not specified'} employees - Suggest hiring resources, team-building tools
- Funding Amount: $${company?.funding_amount || 0} raised - Recommend appropriate next funding steps
- Industry: "${company?.industry || 'Not specified'}" - Match industry-specific mentors, investors, courses
- Looking For: ${JSON.stringify(company?.looking_for || [])} - Prioritize recommendations matching these needs
- Founded Year: ${company?.founded_year || 'Not specified'}

User Context: ${JSON.stringify(userContext)}

AVAILABLE DATA TO RECOMMEND FROM:
- Potential Connections: ${JSON.stringify(availableConnections?.slice(0, 10))}
- Investors: ${JSON.stringify(investors?.slice(0, 5))}
- Courses: ${JSON.stringify(courses?.slice(0, 5))}
- Platform Resources: ${JSON.stringify(relevantResources?.slice(0, 10))}

Generate 5-6 DIVERSE recommendations that include a MIX of:

1. **STRATEGIC TIPS** (type: "strategy") - Actionable business advice based on their stage:
   - For idea/pre-seed: Customer discovery tactics, MVP validation, lean startup methods
   - For seed: Go-to-market strategies, product-market fit indicators, early traction tips
   - For series A+: Scaling strategies, team growth tactics, market expansion

2. **GROWTH TACTICS** (type: "tip") - Specific actionable tips:
   - Marketing strategies relevant to their industry
   - Sales tactics for B2B/B2C based on their product
   - Networking approaches for their location
   - Competitive positioning advice
   - Fundraising preparation tips based on their stage

3. **RESOURCE RECOMMENDATIONS** (type: "resource") - Platform resources:
   - Coworking spaces, grants, accelerators matching location/stage
   - Government programs and entrepreneur centers
   - Labs and technology transfer offices if relevant

4. **CONNECTIONS & COURSES** (type: "connection", "investor", "course"):
   - Mentors/investors matching their industry and stage
   - Courses for skill gaps based on team size and needs

5. **ACTIONABLE NEXT STEPS** (type: "action") - Concrete actions for THIS WEEK:
   - Specific people to reach out to
   - Documents to prepare (pitch deck, financial model)
   - Metrics to track based on their stage

Each recommendation MUST:
- Have a clear, SPECIFIC title (not generic like "Network more")
- Include WHY this is relevant to THEIR specific situation
- Provide 1-2 concrete action items they can do immediately
- Be tailored to their industry, location, stage, and team size
- Be concise (2-3 sentences max)`;

    console.log('Calling Lovable AI for recommendations with enhanced context...');
    console.log('User location:', company?.location || profile?.location);
    console.log('Company stage:', company?.stage);
    console.log('Resources found:', relevantResources?.length);

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
          { role: 'user', content: 'Generate personalized recommendations for this user based on their startup profile, location, stage, and available platform resources.' }
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
                          enum: ['connection', 'investor', 'course', 'resource', 'strategy', 'tip', 'action', 'general'],
                          description: 'Type: strategy (business advice), tip (growth tactics), action (next steps), resource (coworking/grants), connection, investor, course, general'
                        },
                        title: {
                          type: 'string',
                          description: 'Short title for the recommendation'
                        },
                        description: {
                          type: 'string',
                          description: 'Detailed explanation of why this is recommended based on user location, stage, team size, or goals'
                        },
                        action: {
                          type: 'string',
                          description: 'Call to action text'
                        },
                        reference_id: {
                          type: 'string',
                          description: 'ID of the related entity (user_id, course_id, resource_id, etc.)'
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
    console.log('AI response received');

    // Estimate tokens and log usage
    const tokensUsed = aiData.usage?.total_tokens || 1000;
    const estimatedCost = tokensUsed * 0.0001;
    await logApiUsage(supabaseClient, 'gemini', 'generate-recommendations', tokensUsed, estimatedCost);

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
