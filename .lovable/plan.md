
# Create /hubs Page - Global Office Space Marketplace

## Overview

Build a new `/hubs` page that provides access to professional office spaces globally (coworking, private offices, meeting rooms) synced with the Resources tab. This will later be integrated as a dashboard tab. The page includes LiquidSpace API integration for real-time booking and an AI assistant for workspace recommendations.

## Architecture

```text
┌────────────────────────────────────────────────────────────────────┐
│                         /hubs Page                                  │
├────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌──────────────────┐   ┌──────────────────────┐ │
│  │ Left Panel  │   │   Map View       │   │   AI Assistant       │ │
│  │ - Filters   │   │   (Mapbox Globe) │   │   (Floating Panel)   │ │
│  │ - Location  │   │   - Markers      │   │   - NLP → Filters    │ │
│  │ - Capacity  │   │   - Clusters     │   │   - Recommendations  │ │
│  │ - Type      │   │                  │   │                      │ │
│  │ - Amenities │   │                  │   │                      │ │
│  │ - Budget    │   │                  │   │                      │ │
│  └─────────────┘   └──────────────────┘   └──────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                     Edge Functions (Supabase)                       │
├────────────────────────────────────────────────────────────────────┤
│  hub-search-workspaces    │  hub-book-workspace   │  hub-ai-assistant│
│  - LiquidSpace API proxy  │  - Booking flow       │  - NLP processing│
│  - Hotel exclusion filter │  - Payment handling   │  - Recommendations│
│  - Professional-only      │  - Confirmation       │                  │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                      Database Tables                                │
├────────────────────────────────────────────────────────────────────┤
│  hub_bookings             │  hub_venues_cache     │  resources      │
│  - user_id                │  - venue_id           │  - (existing)   │
│  - provider               │  - location           │  - coworking    │
│  - venue_id               │  - workspace_type     │  - office       │
│  - booking_date           │  - amenities          │                 │
│  - status                 │  - cached_at          │                 │
└────────────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Database Schema

Create new tables for hub functionality:

**Table: `hub_bookings`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| provider | text | 'liquidspace' or 'internal' |
| provider_booking_id | text | External booking reference |
| venue_id | text | Venue identifier |
| venue_name | text | Cached venue name |
| workspace_type | text | coworking, private_office, meeting_room |
| from_datetime | timestamptz | Booking start |
| to_datetime | timestamptz | Booking end |
| price | numeric | Total price |
| currency | text | USD, EUR, etc. |
| status | text | pending, confirmed, cancelled, completed |
| payment_intent_id | text | Stripe payment reference |
| notes | text | User notes |
| created_at | timestamptz | Timestamp |

**Table: `hub_venues_cache`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| external_venue_id | text | LiquidSpace venue ID |
| name | text | Venue name |
| address | text | Full address |
| city | text | City |
| country | text | Country |
| latitude | numeric | Coordinates |
| longitude | numeric | Coordinates |
| workspace_types | text[] | Available types |
| amenities | text[] | WiFi, coffee, etc. |
| hourly_rate_min | numeric | Min price |
| hourly_rate_max | numeric | Max price |
| rating | numeric | User rating |
| image_url | text | Primary image |
| is_hotel | boolean | Hotel exclusion flag |
| is_professional | boolean | Professional workspace flag |
| cached_at | timestamptz | Last sync time |

### Phase 2: Edge Functions

#### 2.1 `hub-search-workspaces`
- Proxy for LiquidSpace Search API
- Input: location, lat/lng, dates, capacity, workspace type, amenities, budget
- Implements hotel exclusion logic:
  - Check venue category for "hotel" keywords
  - Check operator type
  - Keyword matching (Hilton, Marriott, Hotel, Inn, etc.)
- Returns normalized results with `is_hotel=false` only
- Falls back to internal resources (coworking/office type) if API unavailable

#### 2.2 `hub-book-workspace`
- Handles booking workflow
- Integrates with LiquidSpace Booking API
- Creates Stripe payment intent for payment processing
- Saves booking record to `hub_bookings`
- Sends confirmation notification

#### 2.3 `hub-ai-assistant`
- Processes natural language queries
- Extracts structured filters (location, date, capacity, budget)
- Calls hub-search-workspaces
- Ranks results based on user preferences
- Returns recommendations with explanations

### Phase 3: Frontend Page (`/hubs`)

**File: `src/pages/Hubs.tsx`**

Key components:
1. **Location Selector**: Dropdown populated from `resources` table (where type = 'coworking' or 'office' or 'venue')
2. **Filters Panel**: Workspace type, capacity, date/time, budget, amenities
3. **Map View**: Mapbox globe (reuse pattern from GlobalResourcesMap)
4. **Results List**: Card grid with workspace details
5. **Booking Modal**: Date/time selector, confirmation flow
6. **AI Assistant Panel**: Floating chat for NLP search

**File: `src/hooks/useHubsSearch.ts`**
- React Query hook for workspace search
- Manages filter state
- Handles caching

**File: `src/hooks/useHubBooking.ts`**
- Booking mutation hook
- Payment flow integration
- Status management

**File: `src/components/hubs/HubsSearchFilters.tsx`**
- Filter controls component

**File: `src/components/hubs/HubsWorkspaceCard.tsx`**
- Individual workspace result card

**File: `src/components/hubs/HubsBookingModal.tsx`**
- Booking confirmation dialog

**File: `src/components/hubs/HubsAIAssistant.tsx`**
- AI-powered search assistant

### Phase 4: Routing & Auth

**Updates to `src/App.tsx`:**
- Add lazy-loaded route for `/hubs`
- Protected route (logged-in users only)

```typescript
const Hubs = lazy(() => import("./pages/Hubs"));
// ...
<Route path="/hubs" element={<Hubs />} />
```

### Phase 5: Resource Sync

The `/hubs` page syncs with existing resources by:
1. Fetching locations from `resources` where `resource_type` IN ('coworking', 'office', 'venue')
2. Using these as the source of truth for enabled locations
3. Location picker only shows verified resources with coordinates

### Phase 6: LiquidSpace Integration

**Note**: LiquidSpace API access requires partnership signup. Until API keys are obtained:
- The system will use internal resources as the primary data source
- A placeholder integration layer allows easy swap to LiquidSpace when ready
- The `LIQUIDSPACE_API_KEY` secret will need to be added via Supabase secrets

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Hubs.tsx` | Main page component |
| `src/hooks/useHubsSearch.ts` | Search hook |
| `src/hooks/useHubBooking.ts` | Booking hook |
| `src/components/hubs/HubsSearchFilters.tsx` | Filter controls |
| `src/components/hubs/HubsWorkspaceCard.tsx` | Result cards |
| `src/components/hubs/HubsBookingModal.tsx` | Booking dialog |
| `src/components/hubs/HubsAIAssistant.tsx` | AI search panel |
| `src/components/hubs/HubsMapView.tsx` | Map component |
| `supabase/functions/hub-search-workspaces/index.ts` | Search API proxy |
| `supabase/functions/hub-book-workspace/index.ts` | Booking API |
| `supabase/functions/hub-ai-assistant/index.ts` | AI processing |
| Database migration | Create hub_bookings, hub_venues_cache tables |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add /hubs route |
| `supabase/config.toml` | Add edge function configs |
| `src/hooks/useResources.ts` | Add workspace location filter |

## UI Design

The Hubs page will follow the existing design language:
- **Tech-card glassmorphism** style matching GlobalResourcesMap
- **Dark theme** with gradient accents
- **Mapbox globe** view for immersive location exploration
- **Floating panels** for search and AI assistant
- **Responsive** mobile-first design

## Security Considerations

1. **API Key Protection**: LiquidSpace API key stored as Supabase secret, never exposed to frontend
2. **Payment Security**: Stripe integration handles payment, no card data stored
3. **Auth Required**: All booking operations require authenticated user
4. **RLS Policies**: Users can only view/manage their own bookings

## Future Dashboard Integration

When ready to add as dashboard tab:
1. Import `GlobalHubsMap` or `HubsWidget` into Dashboard.tsx
2. Add tab trigger with Building2 icon
3. The page is already designed to work as both standalone and embedded

## Stripe Integration Note

The Stripe key provided (`pk_live_51SbXOXF...`) is a **publishable** key, which is safe to use client-side for payment element rendering. The **secret** key is already configured in Supabase secrets as `STRIPE_SECRET_KEY`.
