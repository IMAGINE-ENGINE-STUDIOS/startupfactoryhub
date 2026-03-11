

## Plan: Persistent Recording Storage with Per-User Billing

### Overview

Currently, recording sessions are stored in-memory only (Zustand store) and lost on page refresh. This plan adds:
1. A persistent `recording_sessions` table so users always see their past recordings
2. A `user_storage_usage` table tracking per-user storage consumption
3. Storage billing tiers modeled after Google One (+20% markup) plus a metered $2.50/GB overage model
4. Stripe metered billing integration for automatic overage charges

### Storage Plans (Google One +20%)

| Plan | Google Price | SFH Price (+20%) | Storage |
|------|-------------|-------------------|---------|
| Free | $0 | $0 | 1 GB included |
| Basic | $1.99/mo | $2.39/mo | 100 GB |
| Standard | $2.99/mo | $3.59/mo | 200 GB |
| Premium | $9.99/mo | $11.99/mo | 2 TB |

**Overage**: $2.50 per additional GB consumed beyond the plan limit, charged automatically to the user's card via Stripe metered billing.

### Database Changes

**1. `recording_sessions` table** — persists every session per user:
```sql
CREATE TABLE public.recording_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camera_id text NOT NULL,
  camera_name text NOT NULL,
  started_at timestamptz NOT NULL,
  stopped_at timestamptz,
  snapshot_count int DEFAULT 0,
  total_size_bytes bigint DEFAULT 0,
  storage_path text, -- prefix in camera-snapshots bucket
  thumbnail_path text,
  status text DEFAULT 'recording' CHECK (status IN ('recording','stopped','archived')),
  created_at timestamptz DEFAULT now()
);
-- RLS: users see only their own sessions
```

**2. `user_storage_usage` table** — tracks cumulative storage per user:
```sql
CREATE TABLE public.user_storage_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_bytes_used bigint DEFAULT 0,
  storage_plan text DEFAULT 'free', -- free, basic, standard, premium
  plan_limit_bytes bigint DEFAULT 1073741824, -- 1 GB default
  last_calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**3. `storage_overages` table** — log each GB overage charge:
```sql
CREATE TABLE public.storage_overages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gb_charged int NOT NULL,
  amount_cents int NOT NULL, -- 250 per GB
  stripe_invoice_id text,
  created_at timestamptz DEFAULT now()
);
```

### Storage Plan Config

New file `src/lib/storage-plans.ts`:
```typescript
export const STORAGE_PLANS = {
  free:     { name: 'Free',     price: 0,    limit_gb: 1,    limit_bytes: 1_073_741_824 },
  basic:    { name: 'Basic',    price: 239,  limit_gb: 100,  limit_bytes: 107_374_182_400 },
  standard: { name: 'Standard', price: 359,  limit_gb: 200,  limit_bytes: 214_748_364_800 },
  premium:  { name: 'Premium',  price: 1199, limit_gb: 2048, limit_bytes: 2_199_023_255_552 },
};
export const OVERAGE_COST_PER_GB_CENTS = 250; // $2.50
```

### Code Changes

**1. Modify `useRecordingSessions` store** — on `startSession`, persist to DB; on `stopSession`, finalize the record; on mount, load user's sessions from DB so they always appear in Studio.

**2. Modify `useCameraTimeline`** — when persisting snapshots to Supabase Storage, also update `recording_sessions.total_size_bytes` and `user_storage_usage.total_bytes_used`.

**3. New hook `useStorageUsage`** — queries `user_storage_usage` for the current user, returns usage stats, plan info, percentage used, and overage status.

**4. Update `MapCommandCenter.tsx` Studio tab**:
- Load sessions from DB instead of only in-memory store
- Show a storage usage bar at the top (e.g., "2.4 GB / 100 GB used")
- Show all historical recordings with thumbnails, duration, size
- Add "Upgrade Storage" button when near limit

**5. New edge function `charge-storage-overage`** — triggered when a user crosses a new GB threshold. Creates a Stripe invoice item on their existing subscription for $2.50 per new GB consumed.

**6. Update `camera_snapshots` table** — add `user_id` column and update RLS so users only see their own snapshots. Remove the 24-hour auto-cleanup for paid users (keep for free tier).

### Files to Create/Modify

1. **Create** `src/lib/storage-plans.ts`
2. **Create** `src/hooks/useStorageUsage.ts`
3. **Migration** — `recording_sessions`, `user_storage_usage`, `storage_overages` tables + add `user_id` to `camera_snapshots`
4. **Modify** `src/stores/useRecordingSessions.ts` — persist sessions to DB, load on init
5. **Modify** `src/hooks/useCameraTimeline.ts` — track size in `user_storage_usage`
6. **Modify** `src/components/earth/MapCommandCenter.tsx` — show storage bar, load from DB, upgrade CTA
7. **Create** `supabase/functions/charge-storage-overage/index.ts` — Stripe metered billing for overages

