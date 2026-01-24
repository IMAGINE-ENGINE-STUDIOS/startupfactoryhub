

# Integrate LiquidSpace API for Real Workspace Data

## Current State

The `/hubs` page infrastructure is ready, but:
- The Edge Functions (`hub-search-workspaces`, `hub-book-workspace`, `hub-ai-assistant`) are configured but **not implemented yet**
- There's **no LiquidSpace API credentials** stored (checked secrets - no `LIQUIDSPACE_API_KEY`, `LIQUIDSPACE_CLIENT_ID`, or `LIQUIDSPACE_CLIENT_SECRET`)
- The frontend currently queries an empty `hub_venues_cache` table

## What's Needed from LiquidSpace

LiquidSpace uses **OAuth 2.0 Client Credentials** authentication. You'll need to:

1. **Register at their Developer Portal**: https://developer.liquidspace.com/
2. **Request API access** - Contact LiquidSpace support to obtain:
   - `subscriptionKey`
   - `clientId` 
   - `clientSecret`

## Implementation Plan

Once you have the LiquidSpace credentials, here's how we'll integrate:

### Phase 1: Store API Credentials as Secrets

Add these secrets to Supabase:
- `LIQUIDSPACE_CLIENT_ID`
- `LIQUIDSPACE_CLIENT_SECRET`
- `LIQUIDSPACE_SUBSCRIPTION_KEY`

### Phase 2: Create the Edge Functions

**`hub-search-workspaces/index.ts`**:
- Authenticate with LiquidSpace OAuth endpoint
- Call their Marketplace Search API (`POST /api/marketplace/search`)
- Apply hotel exclusion filters
- Normalize and return professional workspaces only
- Cache results in `hub_venues_cache` for performance

**`hub-book-workspace/index.ts`**:
- Handle booking requests
- Call LiquidSpace Reservation API
- Process payments via Stripe
- Store booking in `hub_bookings` table

**`hub-ai-assistant/index.ts`**:
- Parse natural language queries
- Convert to structured search filters
- Call `hub-search-workspaces`
- Rank and explain recommendations

### Phase 3: Update Frontend Hook

Modify `useHubsSearch.ts` to:
- Call the Edge Function instead of directly querying the database
- Fall back to cached data when API is unavailable

## LiquidSpace API Flow

```text
User searches → Frontend → Edge Function → OAuth Token → LiquidSpace API
                                              ↓
                              Filter (no hotels, professional only)
                                              ↓
                              Normalize response → Return to frontend
                                              ↓
                              Cache in hub_venues_cache (optional)
```

## Hotel Exclusion Logic (Built into Edge Function)

```typescript
// Inside hub-search-workspaces
const HOTEL_KEYWORDS = ['hotel', 'hilton', 'marriott', 'hyatt', ...];

function filterResults(venues) {
  return venues.filter(venue => {
    // Check venue type
    const isProfessional = ['coworking', 'private_office', 'meeting_room']
      .includes(venue.workspaceType);
    
    // Check for hotel keywords in name/address
    const isHotel = HOTEL_KEYWORDS.some(kw => 
      venue.name.toLowerCase().includes(kw)
    );
    
    return isProfessional && !isHotel;
  });
}
```

## Next Step Required

**You need to obtain LiquidSpace API credentials first.** 

Please:
1. Visit https://developer.liquidspace.com/
2. Sign up for API access
3. Once you have the `clientId`, `clientSecret`, and `subscriptionKey`, let me know

I'll then create the Edge Functions with proper OAuth authentication and integrate real workspace data into your `/hubs` page.

## Alternative: Demo Mode While Waiting

If you'd like the page to show something while awaiting LiquidSpace credentials, I can:
- Create the Edge Function with a mock data fallback
- Populate the cache with sample professional workspaces from known coworking brands
- The real API integration can be switched on once credentials are available

Would you like me to proceed with the implementation using mock/sample data for now, or wait until you have the LiquidSpace API credentials?

