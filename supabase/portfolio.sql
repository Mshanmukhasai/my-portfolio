-- Configure the existing public.portfolio table; this script does not create a table.
-- Public editing is required because the portfolio admin page has no authentication.
alter table public.portfolio enable row level security;

grant select, insert, update on public.portfolio to anon, authenticated;

drop policy if exists "Public can read portfolio" on public.portfolio;
create policy "Public can read portfolio"
  on public.portfolio
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can create portfolio" on public.portfolio;
create policy "Public can create portfolio"
  on public.portfolio
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can update portfolio" on public.portfolio;
create policy "Public can update portfolio"
  on public.portfolio
  for update
  to anon, authenticated
  using (true)
  with check (true);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'portfolio-assets',
  'portfolio-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read portfolio photos" on storage.objects;
create policy "Public can read portfolio photos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'portfolio-assets');

drop policy if exists "Public can upload portfolio photos" on storage.objects;
create policy "Public can upload portfolio photos"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'portfolio-assets'
    and (storage.foldername(name))[1] = 'profile'
  );
