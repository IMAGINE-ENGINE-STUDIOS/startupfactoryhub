-- External share links for the Investor Data Room. Credits: Imagine Engine Studios Corp.
create table public.data_room_links (
  token text primary key,
  label text,
  created_by uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
grant select, insert, delete on public.data_room_links to authenticated;
grant all on public.data_room_links to service_role;
alter table public.data_room_links enable row level security;
create policy "dr links admin" on public.data_room_links for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));