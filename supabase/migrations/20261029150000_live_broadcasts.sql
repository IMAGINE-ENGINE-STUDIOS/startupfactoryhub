-- Live Video x Socialite broadcast sessions.
-- One row per platform per broadcast start; written by the live-broadcast
-- edge function (service role), readable by the broadcast owner.
create table if not exists public.live_broadcasts (
  id uuid primary key default gen_random_uuid(),
  room text not null,
  owner_id uuid not null,
  platform text not null,
  egress_id text,
  platform_live_id text,
  live_url text,
  status text not null default 'live',
  created_at timestamptz not null default now(),
  stopped_at timestamptz
);
create index if not exists live_broadcasts_room_status_idx
  on public.live_broadcasts (room, status);
alter table public.live_broadcasts enable row level security;
drop policy if exists live_broadcasts_owner_read on public.live_broadcasts;
create policy live_broadcasts_owner_read on public.live_broadcasts
  for select to authenticated
  using (owner_id = auth.uid());
