import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mock workspace data for demo mode
// Will be replaced with LiquidSpace API when credentials are available
const MOCK_WORKSPACES = [
  // San Francisco
  {
    id: "ws-sf-wework-1",
    name: "WeWork Embarcadero Center",
    address: "Four Embarcadero Center, Suite 1100",
    city: "San Francisco",
    country: "United States",
    latitude: 37.7954,
    longitude: -122.3990,
    workspace_types: ["coworking", "private_office", "meeting_room"],
    amenities: ["wifi", "coffee", "printing", "phone_booths", "parking", "24_hour_access"],
    hourly_rate_min: 15,
    hourly_rate_max: 45,
    daily_rate_min: 60,
    daily_rate_max: 180,
    rating: 4.7,
    image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
      "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800"
    ],
    videos: [
      "https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4"
    ],
    provider: "mock",
    external_venue_id: "liquidspace-sf-1"
  },
  {
    id: "ws-sf-regus-1",
    name: "Regus One Market Plaza",
    address: "1 Market Street, Steuart Tower",
    city: "San Francisco",
    country: "United States",
    latitude: 37.7936,
    longitude: -122.3943,
    workspace_types: ["private_office", "meeting_room"],
    amenities: ["wifi", "coffee", "receptionist", "mail_handling", "conference_rooms"],
    hourly_rate_min: 20,
    hourly_rate_max: 60,
    daily_rate_min: 80,
    daily_rate_max: 250,
    rating: 4.5,
    image_url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
    images: [
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
      "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800",
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800"
    ],
    provider: "mock",
    external_venue_id: "liquidspace-sf-2"
  },
  // New York
  {
    id: "ws-nyc-wework-1",
    name: "WeWork Bryant Park",
    address: "54 W 40th Street",
    city: "New York",
    country: "United States",
    latitude: 40.7527,
    longitude: -73.9830,
    workspace_types: ["coworking", "hot_desk", "private_office"],
    amenities: ["wifi", "coffee", "beer_on_tap", "rooftop", "events", "wellness_room"],
    hourly_rate_min: 18,
    hourly_rate_max: 55,
    daily_rate_min: 75,
    daily_rate_max: 220,
    rating: 4.8,
    image_url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800",
    images: [
      "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
      "https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800",
      "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800"
    ],
    videos: [
      "https://videos.pexels.com/video-files/3052296/3052296-hd_1920_1080_30fps.mp4"
    ],
    provider: "mock",
    external_venue_id: "liquidspace-nyc-1"
  },
  {
    id: "ws-nyc-industrious-1",
    name: "Industrious Financial District",
    address: "120 Broadway, 11th Floor",
    city: "New York",
    country: "United States",
    latitude: 40.7086,
    longitude: -74.0106,
    workspace_types: ["private_office", "meeting_room", "coworking"],
    amenities: ["wifi", "coffee", "printing", "wellness_room", "mother_room", "bike_storage"],
    hourly_rate_min: 25,
    hourly_rate_max: 70,
    daily_rate_min: 100,
    daily_rate_max: 300,
    rating: 4.9,
    image_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
    images: [
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
      "https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800"
    ],
    provider: "mock",
    external_venue_id: "liquidspace-nyc-2"
  },
  // London
  {
    id: "ws-london-wework-1",
    name: "WeWork Moorgate",
    address: "1 Finsbury Avenue",
    city: "London",
    country: "United Kingdom",
    latitude: 51.5204,
    longitude: -0.0867,
    workspace_types: ["coworking", "hot_desk", "private_office"],
    amenities: ["wifi", "coffee", "tea", "events", "phone_booths", "shower"],
    hourly_rate_min: 12,
    hourly_rate_max: 40,
    daily_rate_min: 50,
    daily_rate_max: 160,
    rating: 4.6,
    image_url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
    images: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
      "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800",
      "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800",
      "https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800"
    ],
    videos: [
      "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_30fps.mp4"
    ],
    provider: "mock",
    external_venue_id: "liquidspace-london-1"
  },
  {
    id: "ws-london-spaces-1",
    name: "Spaces Oxford Circus",
    address: "240 Regent Street",
    city: "London",
    country: "United Kingdom",
    latitude: 51.5167,
    longitude: -0.1428,
    workspace_types: ["coworking", "meeting_room", "event_space"],
    amenities: ["wifi", "coffee", "bar", "rooftop", "events", "gym_access"],
    hourly_rate_min: 15,
    hourly_rate_max: 50,
    daily_rate_min: 65,
    daily_rate_max: 200,
    rating: 4.7,
    image_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
    images: [
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
      "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800"
    ],
    provider: "mock",
    external_venue_id: "liquidspace-london-2"
  },
  // Tokyo
  {
    id: "ws-tokyo-wework-1",
    name: "WeWork Ginza Six",
    address: "6-10-1 Ginza, Chuo-ku",
    city: "Tokyo",
    country: "Japan",
    latitude: 35.6693,
    longitude: 139.7630,
    workspace_types: ["coworking", "private_office", "meeting_room"],
    amenities: ["wifi", "green_tea", "coffee", "phone_booths", "nap_room", "shower"],
    hourly_rate_min: 20,
    hourly_rate_max: 60,
    daily_rate_min: 80,
    daily_rate_max: 240,
    rating: 4.8,
    image_url: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
    images: [
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
      "https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
      "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800"
    ],
    videos: [
      "https://videos.pexels.com/video-files/2795168/2795168-hd_1920_1080_30fps.mp4"
    ],
    provider: "mock",
    external_venue_id: "liquidspace-tokyo-1"
  },
  {
    id: "ws-tokyo-regus-1",
    name: "Regus Shibuya Mark City",
    address: "1-12-1 Dogenzaka, Shibuya-ku",
    city: "Tokyo",
    country: "Japan",
    latitude: 35.6580,
    longitude: 139.6982,
    workspace_types: ["private_office", "hot_desk"],
    amenities: ["wifi", "coffee", "receptionist", "mail_handling", "locker"],
    hourly_rate_min: 18,
    hourly_rate_max: 50,
    daily_rate_min: 70,
    daily_rate_max: 200,
    rating: 4.5,
    image_url: "https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800",
    images: [
      "https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800"
    ],
    provider: "mock",
    external_venue_id: "liquidspace-tokyo-2"
  },
  // Singapore
  {
    id: "ws-singapore-wework-1",
    name: "WeWork CapitaGreen",
    address: "138 Market Street",
    city: "Singapore",
    country: "Singapore",
    latitude: 1.2833,
    longitude: 103.8504,
    workspace_types: ["coworking", "private_office", "meeting_room"],
    amenities: ["wifi", "coffee", "sky_garden", "bike_storage", "shower", "events"],
    hourly_rate_min: 15,
    hourly_rate_max: 45,
    daily_rate_min: 60,
    daily_rate_max: 180,
    rating: 4.7,
    image_url: "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800",
    images: [
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800",
      "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800",
      "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800",
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800"
    ],
    videos: [
      "https://videos.pexels.com/video-files/3130284/3130284-hd_1920_1080_30fps.mp4"
    ],
    provider: "mock",
    external_venue_id: "liquidspace-singapore-1"
  },
  {
    id: "ws-singapore-justco-1",
    name: "JustCo Marina Square",
    address: "6 Raffles Boulevard",
    city: "Singapore",
    country: "Singapore",
    latitude: 1.2918,
    longitude: 103.8566,
    workspace_types: ["hot_desk", "coworking", "meeting_room"],
    amenities: ["wifi", "coffee", "pool_table", "nap_pods", "events", "community"],
    hourly_rate_min: 12,
    hourly_rate_max: 35,
    daily_rate_min: 50,
    daily_rate_max: 140,
    rating: 4.6,
    image_url: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800",
    images: [
      "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800",
      "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800",
      "https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800"
    ],
    provider: "mock",
    external_venue_id: "liquidspace-singapore-2"
  },
  // Dubai
  {
    id: "ws-dubai-regus-1",
    name: "Regus Burj Khalifa",
    address: "1 Sheikh Mohammed bin Rashid Blvd",
    city: "Dubai",
    country: "United Arab Emirates",
    latitude: 25.1972,
    longitude: 55.2744,
    workspace_types: ["private_office", "meeting_room", "coworking"],
    amenities: ["wifi", "coffee", "panoramic_views", "receptionist", "valet_parking", "lounge"],
    hourly_rate_min: 30,
    hourly_rate_max: 100,
    daily_rate_min: 120,
    daily_rate_max: 400,
    rating: 4.9,
    image_url: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800",
    images: [
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800"
    ],
    videos: [
      "https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4"
    ],
    provider: "mock",
    external_venue_id: "liquidspace-dubai-1"
  },
  {
    id: "ws-dubai-wework-1",
    name: "WeWork Hub71",
    address: "Al Khatem Tower, ADGM Square",
    city: "Dubai",
    country: "United Arab Emirates",
    latitude: 25.2048,
    longitude: 55.2708,
    workspace_types: ["coworking", "hot_desk", "event_space"],
    amenities: ["wifi", "coffee", "startup_community", "mentorship", "events", "24_hour_access"],
    hourly_rate_min: 20,
    hourly_rate_max: 60,
    daily_rate_min: 80,
    daily_rate_max: 240,
    rating: 4.8,
    image_url: "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800",
    images: [
      "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800",
      "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
      "https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800"
    ],
    provider: "mock",
    external_venue_id: "liquidspace-dubai-2"
  },
];

// Hotel exclusion keywords - will filter any venues with these in name/address
const HOTEL_KEYWORDS = [
  'hotel', 'hilton', 'marriott', 'hyatt', 'sheraton', 'westin', 
  'ritz', 'radisson', 'holiday inn', 'best western', 'doubletree',
  'courtyard', 'fairfield', 'hampton', 'embassy suites', 'crowne plaza',
  'intercontinental', 'four seasons', 'w hotel', 'boutique hotel', 'motel',
  'resort', 'lodge', 'inn', 'suites'
];

interface SearchFilters {
  city?: string;
  country?: string;
  workspaceType?: string[];
  amenities?: string[];
  minCapacity?: number;
  maxBudget?: number;
  search?: string;
}

function isHotelVenue(name: string, address: string): boolean {
  const searchText = `${name} ${address}`.toLowerCase();
  return HOTEL_KEYWORDS.some(keyword => searchText.includes(keyword));
}

function filterWorkspaces(workspaces: typeof MOCK_WORKSPACES, filters: SearchFilters) {
  return workspaces.filter(ws => {
    // Exclude hotels
    if (isHotelVenue(ws.name, ws.address)) return false;

    // City filter
    if (filters.city && !ws.city.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }

    // Country filter
    if (filters.country && !ws.country.toLowerCase().includes(filters.country.toLowerCase())) {
      return false;
    }

    // Workspace type filter
    if (filters.workspaceType && filters.workspaceType.length > 0) {
      const hasMatchingType = ws.workspace_types.some(type => 
        filters.workspaceType!.includes(type)
      );
      if (!hasMatchingType) return false;
    }

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      const hasAllAmenities = filters.amenities.every(amenity =>
        ws.amenities.includes(amenity)
      );
      if (!hasAllAmenities) return false;
    }

    // Budget filter (check hourly rate)
    if (filters.maxBudget && ws.hourly_rate_min && ws.hourly_rate_min > filters.maxBudget) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        ws.name.toLowerCase().includes(searchLower) ||
        ws.city.toLowerCase().includes(searchLower) ||
        ws.address.toLowerCase().includes(searchLower) ||
        ws.country.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    return true;
  });
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
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse filters from request
    const { filters = {} } = await req.json().catch(() => ({}));

    // Check if LiquidSpace credentials are available
    const liquidspaceClientId = Deno.env.get("LIQUIDSPACE_CLIENT_ID");
    const liquidspaceClientSecret = Deno.env.get("LIQUIDSPACE_CLIENT_SECRET");
    const liquidspaceSubscriptionKey = Deno.env.get("LIQUIDSPACE_SUBSCRIPTION_KEY");

    let workspaces;

    if (liquidspaceClientId && liquidspaceClientSecret && liquidspaceSubscriptionKey) {
      // TODO: Implement real LiquidSpace API integration
      // 1. Get OAuth token
      // 2. Call marketplace search API
      // 3. Filter and normalize results
      console.log("LiquidSpace credentials found - API integration ready");
      
      // For now, still use mock data until API is fully integrated
      workspaces = filterWorkspaces(MOCK_WORKSPACES, filters);
    } else {
      // Use mock data
      console.log("Using mock workspace data (no LiquidSpace credentials)");
      workspaces = filterWorkspaces(MOCK_WORKSPACES, filters);
    }

    // Optionally cache results to database for performance
    // This would be done asynchronously in production

    return new Response(
      JSON.stringify({ 
        workspaces,
        source: liquidspaceClientId ? "liquidspace" : "mock",
        count: workspaces.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in hub-search-workspaces:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
