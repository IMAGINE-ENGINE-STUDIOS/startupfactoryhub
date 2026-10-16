-- Investor Data Room. Credits: Imagine Engine Studios Corp.
create table public.data_room_documents (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  description text,
  file_path text,
  external_url text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table public.data_room_access (
  email text primary key,
  note text,
  granted_at timestamptz not null default now()
);
grant select, insert, update, delete on public.data_room_documents to authenticated;
grant select, insert, update, delete on public.data_room_access to authenticated;
grant all on public.data_room_documents to service_role;
grant all on public.data_room_access to service_role;
alter table public.data_room_documents enable row level security;
alter table public.data_room_access enable row level security;

create or replace function public.can_view_data_room()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.data_room_access a
               where lower(a.email) = lower(coalesce(auth.jwt()->>'email','')));
$$;
grant execute on function public.can_view_data_room() to authenticated;

create policy "dr docs read" on public.data_room_documents for select to authenticated using (public.can_view_data_room());
create policy "dr docs admin" on public.data_room_documents for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "dr access admin" on public.data_room_access for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "dr files read" on storage.objects for select to authenticated using (bucket_id = 'data-room' and public.can_view_data_room());
create policy "dr files admin write" on storage.objects for insert to authenticated with check (bucket_id = 'data-room' and public.has_role(auth.uid(),'admin'));
create policy "dr files admin delete" on storage.objects for delete to authenticated using (bucket_id = 'data-room' and public.has_role(auth.uid(),'admin'));