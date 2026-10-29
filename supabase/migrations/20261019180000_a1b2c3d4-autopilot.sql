-- SOCIALITE Autopilot — evergreen auto-posting.
-- One config row per owner: which platforms, which local times, caption
-- templates + hashtag sets, and a jsonb state bag (media pool + shuffle bag).
-- Media lives in the public `socialite-autopost` bucket under <uid>/<Project>/<file>.
-- The socialite-scheduler edge function tops up the owner's scheduled posts
-- from this config on every run; sending itself is unchanged (socialite_scheduled).

create table if not exists public.socialite_autopilot (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique,
  active boolean not null default false,
  platforms text[] not null default '{facebook,instagram}',
  times text[] not null default '{09:00,13:00,18:30}',
  timezone text not null default 'America/New_York',
  templates text[] not null default '{}',
  hashtag_sets text[] not null default '{}',
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.socialite_autopilot enable row level security;

drop policy if exists "autopilot owner all" on public.socialite_autopilot;
create policy "autopilot owner all" on public.socialite_autopilot
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('socialite-autopost', 'socialite-autopost', true)
on conflict (id) do nothing;

drop policy if exists "autopost public read" on storage.objects;
create policy "autopost public read" on storage.objects
  for select using (bucket_id = 'socialite-autopost');

drop policy if exists "autopost owner insert" on storage.objects;
create policy "autopost owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'socialite-autopost' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "autopost owner update" on storage.objects;
create policy "autopost owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'socialite-autopost' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "autopost owner delete" on storage.objects;
create policy "autopost owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'socialite-autopost' and (storage.foldername(name))[1] = auth.uid()::text);
