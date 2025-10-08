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

    const { query, types = ['users', 'startups', 'events', 'resources'] } = await req.json();

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    const results: any = {
      users: [],
      startups: [],
      events: [],
      resources: [],
    };

    // Search users/profiles
    if (types.includes('users')) {
      const { data } = await supabaseClient
        .from('profiles')
        .select('user_id, full_name, bio, role, avatar_url')
        .or(`full_name.ilike.${searchTerm},bio.ilike.${searchTerm}`)
        .limit(10);
      
      results.users = data || [];
    }

    // Search companies/startups
    if (types.includes('startups')) {
      const { data } = await supabaseClient
        .from('companies')
        .select('id, name, description, industry, stage, logo_url')
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},industry.ilike.${searchTerm}`)
        .limit(10);
      
      results.startups = data || [];
    }

    // Search events
    if (types.includes('events')) {
      const { data } = await supabaseClient
        .from('events')
        .select('id, title, description, start_date, location, banner_url')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq('is_public', true)
        .gte('end_date', new Date().toISOString())
        .limit(10);
      
      results.events = data || [];
    }

    // Search courses/resources
    if (types.includes('resources')) {
      const { data } = await supabaseClient
        .from('courses')
        .select('id, title, description, category, instructor_name, thumbnail_url')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)
        .eq('is_published', true)
        .limit(10);
      
      results.resources = data || [];
    }

    return new Response(
      JSON.stringify({ results, query }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
