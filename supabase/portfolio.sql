-- Public portfolio data is intentionally writable without authentication.
-- Anyone with the site URL can edit the portfolio. Never store private data here.

create table if not exists public.portfolio_content (
  id text primary key default 'main' check (id = 'main'),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;

grant select, insert, update on public.portfolio_content to anon, authenticated;

drop policy if exists "Public can read portfolio content" on public.portfolio_content;
create policy "Public can read portfolio content"
  on public.portfolio_content
  for select
  to anon, authenticated
  using (id = 'main');

drop policy if exists "Public can create portfolio content" on public.portfolio_content;
create policy "Public can create portfolio content"
  on public.portfolio_content
  for insert
  to anon, authenticated
  with check (id = 'main');

drop policy if exists "Public can update portfolio content" on public.portfolio_content;
create policy "Public can update portfolio content"
  on public.portfolio_content
  for update
  to anon, authenticated
  using (id = 'main')
  with check (id = 'main');

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
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read portfolio assets" on storage.objects;
create policy "Public can read portfolio assets"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'portfolio-assets');

drop policy if exists "Public can upload portfolio assets" on storage.objects;
create policy "Public can upload portfolio assets"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'portfolio-assets'
    and (storage.foldername(name))[1] in ('profile', 'projects', 'certificates', 'resume')
  );

drop policy if exists "Public can replace portfolio assets" on storage.objects;
create policy "Public can replace portfolio assets"
  on storage.objects
  for update
  to anon, authenticated
  using (
    bucket_id = 'portfolio-assets'
    and (storage.foldername(name))[1] in ('profile', 'projects', 'certificates', 'resume')
  )
  with check (
    bucket_id = 'portfolio-assets'
    and (storage.foldername(name))[1] in ('profile', 'projects', 'certificates', 'resume')
  );
