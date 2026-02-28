import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EVENTBRITE_API_URL = 'https://www.eventbriteapi.com/v3';

// Categories to tag imported events
function categorizeEvent(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();
  if (text.match(/space|aerospace|satellite|rocket|orbit|nasa|launch/)) return 'space';
  if (text.match(/ai|artificial intelligence|machine learning|deep learning|quantum|biotech|robotics|nanotech|deep tech/)) return 'deep_tech';
  return 'business';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EVENTBRITE_API_KEY = Deno.env.get('EVENTBRITE_API_KEY');
    if (!EVENTBRITE_API_KEY) {
      throw new Error('EVENTBRITE_API_KEY is not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Get organization ID
    const orgResponse = await fetch(`${EVENTBRITE_API_URL}/users/me/organizations/`, {
      headers: { 'Authorization': `Bearer ${EVENTBRITE_API_KEY}` },
    });

    if (!orgResponse.ok) {
      const errText = await orgResponse.text();
      throw new Error(`Failed to fetch organizations [${orgResponse.status}]: ${errText}`);
    }

    const orgData = await orgResponse.json();
    const organizations = orgData.organizations || [];

    if (organizations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No organizations found', imported: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get a system user ID for organizer_id
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    const systemOrganizerId = adminRole?.user_id;
    if (!systemOrganizerId) {
      throw new Error('No admin user found to use as system organizer');
    }

    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Step 2: For each organization, fetch all live events
    for (const org of organizations) {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const eventsUrl = `${EVENTBRITE_API_URL}/organizations/${org.id}/events/?status=live,started,completed&order_by=start_desc&page=${page}&expand=venue`;
        
        const eventsResponse = await fetch(eventsUrl, {
          headers: { 'Authorization': `Bearer ${EVENTBRITE_API_KEY}` },
        });

        if (!eventsResponse.ok) {
          const errText = await eventsResponse.text();
          console.error(`Failed to fetch events for org ${org.id} [${eventsResponse.status}]: ${errText}`);
          break;
        }

        const eventsData = await eventsResponse.json();
        const events = eventsData.events || [];
        
        console.log(`Org ${org.name}: page ${page}, ${events.length} events`);

        for (const event of events) {
          // Check if already imported
          const { data: existing } = await supabase
            .from('events')
            .select('id')
            .eq('external_source', 'eventbrite')
            .eq('external_id', event.id)
            .maybeSingle();

          if (existing) {
            totalSkipped++;
            continue;
          }

          const venue = event.venue;
          const category = categorizeEvent(
            event.name?.text || '',
            event.description?.text || ''
          );

          const description = event.description?.text
            ? event.description.text.substring(0, 2000)
            : event.name?.text || 'No description';

          const eventData = {
            title: event.name?.text || 'Untitled Event',
            description,
            start_date: event.start?.utc,
            end_date: event.end?.utc,
            location: venue?.address?.localized_address_display || (event.online_event ? 'Online' : 'TBD'),
            city: venue?.address?.city || null,
            country: venue?.address?.country || null,
            latitude: venue?.address?.latitude ? parseFloat(venue.address.latitude) : null,
            longitude: venue?.address?.longitude ? parseFloat(venue.address.longitude) : null,
            banner_url: event.logo?.url || null,
            is_virtual: event.online_event || false,
            is_public: true,
            is_paid: !event.is_free,
            max_attendees: event.capacity || null,
            organizer_id: systemOrganizerId,
            external_source: 'eventbrite',
            external_id: String(event.id),
            external_url: event.url,
            external_registration_url: event.url,
            category,
          };

          const { error: insertError } = await supabase
            .from('events')
            .insert(eventData);

          if (insertError) {
            console.error(`Failed to insert event ${event.id}:`, insertError.message);
            totalErrors++;
          } else {
            totalImported++;
          }
        }

        // Pagination
        hasMore = eventsData.pagination?.has_more_items || false;
        page++;

        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Log API usage
    await supabase.from('api_usage_logs').insert({
      service_name: 'eventbrite',
      endpoint: '/organizations/events',
      request_count: 1,
      metadata: { imported: totalImported, skipped: totalSkipped, errors: totalErrors, orgs: organizations.length },
    });

    console.log(`Eventbrite sync complete: ${totalImported} imported, ${totalSkipped} skipped, ${totalErrors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: totalImported,
        skipped: totalSkipped,
        errors: totalErrors,
        organizations: organizations.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Eventbrite fetch error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
