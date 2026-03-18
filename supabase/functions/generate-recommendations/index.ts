import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

function buildMentorAdvisorPrompt(role: string, profile: any, mentorProfile: any, mentees: any[], sessions: any[], connections: any[]) {
  const roleLabel = role === 'advisor' ? 'Advisor' : 'Mentor';
  const totalSessions = sessions?.length || 0;
  const activeMentees = mentees?.filter(m => m.status === 'active')?.length || 0;
  const completedSessions = sessions?.filter(s => s.status === 'completed')?.length || 0;

  return `You are an expert recommendation engine for a startup ecosystem platform. You are advising a **${roleLabel}** — NOT a startup founder.

THIS USER IS A ${roleLabel.toUpperCase()}. Their needs are completely different from startups. Focus on:
- How to be a better ${roleLabel.toLowerCase()}
- How to grow their impact and mentee network
- Professional development and thought leadership
- Platform engagement and community building

${roleLabel.toUpperCase()} PROFILE:
- Name: ${profile?.full_name || 'Not specified'}
- Bio: ${profile?.bio || 'Not specified'}
- Location: ${profile?.location || 'Not specified'}
- Expertise: ${mentorProfile?.expertise?.join(', ') || mentorProfile?.specialization || 'Not specified'}
- Industries: ${mentorProfile?.industries?.join(', ') || 'Not specified'}
- Total Sessions: ${totalSessions}
- Completed Sessions: ${completedSessions}
- Active Mentees: ${activeMentees}
- Rating: ${mentorProfile?.average_rating || 'No ratings yet'}
- Connected People: ${connections?.length || 0}

Generate 5-6 DIVERSE recommendations tailored for a ${roleLabel}:

1. **MENTORING TIPS** (type: "strategy") - How to improve as a ${roleLabel.toLowerCase()}:
   - Session preparation techniques
   - Frameworks for giving better feedback
   - How to structure mentoring relationships
   - When to challenge vs. support mentees

2. **GROWTH & IMPACT** (type: "tip") - Growing their ${roleLabel.toLowerCase()} practice:
   - Building their reputation on the platform
   - Strategies to attract quality mentees
   - How to leverage their expertise areas
   - Networking with other ${roleLabel.toLowerCase()}s

3. **ENGAGEMENT ACTIONS** (type: "action") - Specific things to do THIS WEEK:
   ${activeMentees === 0 ? '- Encourage them to browse startups and offer mentorship' : '- Follow up actions with existing mentees'}
   - Post insights or content to build visibility
   - Connect with other professionals in their field
   ${completedSessions < 3 ? '- Complete their first few sessions to build momentum' : '- Review past session outcomes and track mentee progress'}

4. **SKILL DEVELOPMENT** (type: "course") - Courses to enhance their advisory skills:
   - Leadership and coaching methodologies
   - Industry-specific deep dives
   - Communication and feedback techniques

5. **CONNECTIONS** (type: "connection") - People to connect with:
   - Other ${roleLabel.toLowerCase()}s for peer learning
   - Startups in their areas of expertise
   - Investors who complement their network

Each recommendation MUST:
- Be specifically relevant to a ${roleLabel} (NOT startup advice)
- Reference their actual data (mentee count, sessions, expertise)
- Provide 1-2 concrete action items
- Be concise (2-3 sentences max)`;
}

function buildStartupPrompt(profile: any, company: any, studentProfile: any, availableConnections: any[], investors: any[], courses: any[], relevantResources: any[]) {
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

  return `You are an expert startup advisor and AI recommendation engine for a startup ecosystem platform. 
Your task is to provide personalized, actionable recommendations INCLUDING strategic tips, growth strategies, and resources.

ANALYZE THE FOLLOWING STARTUP DATA CAREFULLY:
- Location: "${company?.location || profile?.location || 'Not specified'}"
- Stage: "${company?.stage || 'Not specified'}"
- Team Size: ${company?.team_size || 'Not specified'} employees
- Funding Amount: $${company?.funding_amount || 0} raised
- Industry: "${company?.industry || 'Not specified'}"
- Looking For: ${JSON.stringify(company?.looking_for || [])}
- Founded Year: ${company?.founded_year || 'Not specified'}

User Context: ${JSON.stringify(userContext)}

AVAILABLE DATA TO RECOMMEND FROM:
- Potential Connections: ${JSON.stringify(availableConnections?.slice(0, 10))}
- Investors: ${JSON.stringify(investors?.slice(0, 5))}
- Courses: ${JSON.stringify(courses?.slice(0, 5))}
- Platform Resources: ${JSON.stringify(relevantResources?.slice(0, 10))}

Generate 5-6 DIVERSE recommendations that include a MIX of:

1. **STRATEGIC TIPS** (type: "strategy") - Actionable business advice based on their stage
2. **GROWTH TACTICS** (type: "tip") - Specific actionable tips
3. **RESOURCE RECOMMENDATIONS** (type: "resource") - Platform resources
4. **CONNECTIONS & COURSES** (type: "connection", "investor", "course")
5. **ACTIONABLE NEXT STEPS** (type: "action") - Concrete actions for THIS WEEK

Each recommendation MUST:
- Have a clear, SPECIFIC title (not generic)
- Include WHY this is relevant to THEIR specific situation
- Provide 1-2 concrete action items
- Be tailored to their industry, location, stage, and team size
- Be concise (2-3 sentences max)`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = roleData?.role || 'startup';

    // Fetch profile (always needed)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let systemPrompt: string;

    if (userRole === 'mentor' || userRole === 'advisor') {
      // Fetch mentor/advisor-specific data in parallel
      const [mentorRes, menteesRes, sessionsRes, connectionsRes] = await Promise.all([
        supabaseClient.from('mentor_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabaseClient.from('mentorship_relationships').select('*, mentee:mentee_id(full_name, avatar_url), companies:mentee_id(name, industry, stage)').eq('mentor_id', user.id),
        supabaseClient.from('mentoring_sessions').select('id, status, scheduled_at, topic').eq('mentor_id', user.id).order('scheduled_at', { ascending: false }).limit(20),
        supabaseClient.from('connections').select('requester_id, addressee_id, status').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq('status', 'accepted'),
      ]);

      systemPrompt = buildMentorAdvisorPrompt(
        userRole,
        profile,
        mentorRes.data,
        menteesRes.data || [],
        sessionsRes.data || [],
        connectionsRes.data || []
      );
    } else {
      // Startup / student / other roles - original flow
      const [companyRes, studentRes, connectionsRes, investorsRes, coursesRes, resourcesRes] = await Promise.all([
        supabaseClient.from('companies').select('*').eq('user_id', user.id).maybeSingle(),
        supabaseClient.from('student_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabaseClient.from('connections').select('requester_id, addressee_id').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
        supabaseClient.from('investor_profiles').select('*, profiles:user_id(full_name, bio, location)').limit(10),
        supabaseClient.from('courses').select('id, title, description, category, difficulty').eq('is_published', true).limit(10),
        supabaseClient.from('resources').select('id, title, description, resource_type, city, country, journey_steps, is_official_partner, location_type').eq('is_verified', true).limit(25),
      ]);

      const company = companyRes.data;
      const connectedIds = new Set(
        connectionsRes.data?.flatMap(c => [c.requester_id, c.addressee_id].filter(id => id !== user.id)) || []
      );

      const { data: potentialConnections } = await supabaseClient
        .from('profiles')
        .select('user_id, full_name, role, bio, location')
        .neq('user_id', user.id)
        .limit(20);

      const availableConnections = potentialConnections?.filter(p => !connectedIds.has(p.user_id));

      const userLocation = company?.location?.toLowerCase() || profile?.location?.toLowerCase() || '';
      const userStage = company?.stage || '';
      const resources = resourcesRes.data;
      const relevantResources = resources?.filter(r => {
        const matchesLocation = userLocation && (
          r.city?.toLowerCase().includes(userLocation) || r.country?.toLowerCase().includes(userLocation) ||
          userLocation.includes(r.city?.toLowerCase() || '') || userLocation.includes(r.country?.toLowerCase() || '')
        );
        const matchesStage = r.journey_steps?.includes(userStage) || r.journey_steps?.includes('all') || !r.journey_steps?.length;
        return matchesLocation || matchesStage || r.is_official_partner;
      }) || resources;

      systemPrompt = buildStartupPrompt(profile, company, studentRes.data, availableConnections || [], investorsRes.data || [], coursesRes.data || [], relevantResources || []);
    }

    console.log(`Generating recommendations for role: ${userRole}`);

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
          { role: 'user', content: `Generate personalized recommendations for this ${userRole} based on their profile and activity.` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_recommendations',
            description: 'Generate personalized recommendations',
            parameters: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['connection', 'investor', 'course', 'resource', 'strategy', 'tip', 'action', 'general'] },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      action: { type: 'string' },
                      reference_id: { type: 'string' }
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
        }],
        tool_choice: { type: 'function', function: { name: 'generate_recommendations' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const tokensUsed = aiData.usage?.total_tokens || 1000;
    await logApiUsage(supabaseClient, 'gemini', 'generate-recommendations', tokensUsed, tokensUsed * 0.0001);

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call in AI response');

    const recommendations = JSON.parse(toolCall.function.arguments).recommendations;

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
