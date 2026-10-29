-- SFH: NEW FILE (SFH-only, not from Wonderlands) — SOCIALITE storage buckets.
-- SFH: WW migration 20261019180000 creates the socialite-autopost bucket
-- SFH: inline, but the socialite-knowledge bucket was created outside
-- SFH: migrations in Wonderlands (spec §13 Q4) — only its policies exist,
-- SFH: in migration 20261001002726. This file creates BOTH buckets
-- SFH: idempotently and (re)applies their storage policies using the exact
-- SFH: patterns of WW migrations 20261019180000 (autopost) and
-- SFH: 20261001002726 (knowledge), so the SFH pack is self-contained even
-- SFH: if individual bucket statements are ever re-run out of order.

-- Buckets
insert into storage.buckets (id, name, public)
values ('socialite-autopost', 'socialite-autopost', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('socialite-knowledge', 'socialite-knowledge', false)
on conflict (id) do nothing;

-- socialite-autopost policies (pattern: WW migration 20261019180000)
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

-- socialite-knowledge policies (pattern: WW migration 20261001002726)
drop policy if exists "Own knowledge files read" on storage.objects;
create policy "Own knowledge files read" on storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'socialite-knowledge' AND (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Own knowledge files insert" on storage.objects;
create policy "Own knowledge files insert" on storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'socialite-knowledge' AND (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Own knowledge files delete" on storage.objects;
create policy "Own knowledge files delete" on storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'socialite-knowledge' AND (storage.foldername(name))[1] = auth.uid()::text);
