import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIQuery {
  query: string;
  context?: {
    currentCity?: string;
    preferredAmenities?: string[];
  };
}

interface ParsedFilters {
  city?: string;
  country?: string;
  workspaceType?: string[];
  amenities?: string[];
  maxBudget?: number;
  search?: string;
}

// NLP patterns for extracting filters
const CITY_PATTERNS = [
  /(?:in|at|near|around)\s+([A-Za-z\s]+?)(?:\s+for|\s+with|\s+under|$)/i,
  /([A-Za-z]+)\s+(?:coworking|office|workspace|meeting)/i,
];

const WORKSPACE_TYPE_KEYWORDS: Record<string, string[]> = {
  'coworking': ['coworking', 'cowork', 'shared space', 'open desk'],
  'private_office': ['private office', 'private room', 'dedicated', 'own office'],
  'hot_desk': ['hot desk', 'hotdesk', 'drop-in', 'daily desk'],
  'meeting_room': ['meeting room', 'conference', 'boardroom', 'meeting space'],
  'event_space': ['event space', 'event venue', 'party room', 'workshop space'],
};

const AMENITY_KEYWORDS: Record<string, string[]> = {
  'wifi': ['wifi', 'wi-fi', 'internet', 'connected'],
  'coffee': ['coffee', 'cafe', 'espresso', 'beverages'],
  'parking': ['parking', 'car park', 'vehicle'],
  'shower': ['shower', 'gym', 'fitness'],
  '24_hour_access': ['24 hour', '24/7', 'all night', 'round the clock'],
  'phone_booths': ['phone booth', 'call room', 'private call'],
  'printing': ['printer', 'printing', 'scanner', 'copy'],
  'events': ['events', 'networking', 'community', 'social'],
};

const BUDGET_PATTERNS = [
  /under\s+\$?(\d+)/i,
  /less than\s+\$?(\d+)/i,
  /max(?:imum)?\s+\$?(\d+)/i,
  /budget\s+(?:of\s+)?\$?(\d+)/i,
  /\$(\d+)\s+(?:per hour|\/h|hourly)/i,
];

const KNOWN_CITIES = [
  'San Francisco', 'New York', 'London', 'Tokyo', 'Singapore', 'Dubai',
  'Los Angeles', 'Chicago', 'Boston', 'Austin', 'Seattle', 'Denver',
  'Paris', 'Berlin', 'Amsterdam', 'Sydney', 'Melbourne', 'Toronto',
  'Miami', 'Atlanta', 'Portland', 'Barcelona', 'Hong Kong', 'Mumbai'
];

function parseNaturalLanguageQuery(query: string): ParsedFilters {
  const filters: ParsedFilters = {};
  const queryLower = query.toLowerCase();

  // Extract city
  for (const city of KNOWN_CITIES) {
    if (queryLower.includes(city.toLowerCase())) {
      filters.city = city;
      break;
    }
  }

  // Try patterns if no known city found
  if (!filters.city) {
    for (const pattern of CITY_PATTERNS) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const potentialCity = match[1].trim();
        // Verify it's not a workspace type keyword
        const isWorkspaceType = Object.values(WORKSPACE_TYPE_KEYWORDS)
          .flat()
          .some(kw => potentialCity.toLowerCase().includes(kw));
        if (!isWorkspaceType && potentialCity.length > 2) {
          filters.city = potentialCity;
          break;
        }
      }
    }
  }

  // Extract workspace types
  const workspaceTypes: string[] = [];
  for (const [type, keywords] of Object.entries(WORKSPACE_TYPE_KEYWORDS)) {
    if (keywords.some(kw => queryLower.includes(kw))) {
      workspaceTypes.push(type);
    }
  }
  if (workspaceTypes.length > 0) {
    filters.workspaceType = workspaceTypes;
  }

  // Extract amenities
  const amenities: string[] = [];
  for (const [amenity, keywords] of Object.entries(AMENITY_KEYWORDS)) {
    if (keywords.some(kw => queryLower.includes(kw))) {
      amenities.push(amenity);
    }
  }
  if (amenities.length > 0) {
    filters.amenities = amenities;
  }

  // Extract budget
  for (const pattern of BUDGET_PATTERNS) {
    const match = query.match(pattern);
    if (match && match[1]) {
      filters.maxBudget = parseInt(match[1], 10);
      break;
    }
  }

  // Use remaining query as search term
  if (Object.keys(filters).length === 0) {
    filters.search = query;
  }

  return filters;
}

function generateAIResponse(
  query: string, 
  filters: ParsedFilters, 
  workspaceCount: number
): string {
  const parts: string[] = [];

  if (workspaceCount === 0) {
    parts.push("I couldn't find any workspaces matching your criteria.");
    
    if (filters.city) {
      parts.push(`Try broadening your search beyond ${filters.city}.`);
    }
    if (filters.maxBudget) {
      parts.push("You might also try increasing your budget limit.");
    }
    
    return parts.join(" ");
  }

  // Opening
  if (workspaceCount === 1) {
    parts.push("I found 1 workspace");
  } else {
    parts.push(`I found ${workspaceCount} workspaces`);
  }

  // Location context
  if (filters.city) {
    parts.push(`in ${filters.city}`);
  }

  // Type context
  if (filters.workspaceType && filters.workspaceType.length > 0) {
    const typeNames = filters.workspaceType.map(t => t.replace('_', ' '));
    parts.push(`offering ${typeNames.join(' and ')} options`);
  }

  // Budget context
  if (filters.maxBudget) {
    parts.push(`under $${filters.maxBudget}/hour`);
  }

  // Amenities context
  if (filters.amenities && filters.amenities.length > 0) {
    parts.push(`with ${filters.amenities.join(', ')}`);
  }

  return parts.join(" ") + ". Here are my top recommendations:";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { query, context }: AIQuery = await req.json();

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse natural language query
    const filters = parseNaturalLanguageQuery(query);

    // Merge with context if provided
    if (context?.currentCity && !filters.city) {
      filters.city = context.currentCity;
    }
    if (context?.preferredAmenities && !filters.amenities) {
      filters.amenities = context.preferredAmenities;
    }

    // Call search function to get workspaces
    const searchResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/hub-search-workspaces`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({ filters }),
      }
    );

    const searchResult = await searchResponse.json();
    const workspaces = searchResult.workspaces || [];

    // Generate AI response
    const response = generateAIResponse(query, filters, workspaces.length);

    // Rank workspaces (in production, could use AI for better ranking)
    const rankedWorkspaces = workspaces
      .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5); // Top 5 recommendations

    return new Response(
      JSON.stringify({
        response,
        filters,
        recommendations: rankedWorkspaces,
        totalResults: workspaces.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in hub-ai-assistant:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
