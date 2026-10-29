-- SOCIALITE Autopilot format upgrade — Stories per day.
-- Adds `story_count` to the standing order: how many Stories (1–4) join the
-- 3 rotating feed posts (Reel / Carousel / Photo) each day. The clamp also
-- lives in _shared/socialiteAutopilot.ts; this check keeps the column sane
-- no matter who writes it. Existing rows pick up the default of 2.

alter table public.socialite_autopilot
  add column if not exists story_count integer not null default 2;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'socialite_autopilot_story_count_range'
  ) then
    alter table public.socialite_autopilot
      add constraint socialite_autopilot_story_count_range check (story_count between 1 and 4);
  end if;
end $$;

comment on column public.socialite_autopilot.story_count is
  'Stories per day for Autopilot (1–4, default 2). Feed slots rotate Reel/Carousel/Photo in code; story slots are scheduled separately by _shared/socialiteAutopilot.ts.';
