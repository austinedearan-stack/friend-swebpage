-- Austine checking in: live backend.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run again (it only creates what is missing and resets the rules).
--
-- BEFORE RUNNING: change the email on the last lines to the one you'll log in with.

-- ---------- tables ----------

-- all the words + page settings, as one JSON document (same shape as src/config/site-config.json)
create table if not exists public.site_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint site_content_size check (pg_column_size(data) < 300000)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 140),
  body text not null default '' check (char_length(body) <= 4000),
  category text not null default 'info' check (category in ('important', 'event', 'fun', 'info')),
  pinned boolean not null default false,
  published boolean not null default true,
  event_at timestamptz,
  expires_at timestamptz,
  sort_order integer not null default 0,
  image text not null default 'none' check (image in ('none', 'neon-red', 'neon-teal', 'too-late', 'eclipse', 'balcony')),
  link_url text check (link_url is null or link_url ~* '^https?://'),
  link_label text check (link_label is null or char_length(link_label) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- who counts as admin. Nobody can read or change this table through the website.
create table if not exists public.admins (
  email text primary key
);

-- ---------- who is admin? ----------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- row level security ----------

alter table public.site_content enable row level security;
alter table public.announcements enable row level security;
alter table public.admins enable row level security;

drop policy if exists "anyone can read the site words" on public.site_content;
drop policy if exists "admins write the site words" on public.site_content;
create policy "anyone can read the site words" on public.site_content
  for select to anon, authenticated using (true);
create policy "admins write the site words" on public.site_content
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "visitors see live announcements" on public.announcements;
drop policy if exists "admins manage announcements" on public.announcements;
create policy "visitors see live announcements" on public.announcements
  for select to anon, authenticated
  using ((published and (expires_at is null or expires_at > now())) or public.is_admin());
create policy "admins manage announcements" on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- admins table: RLS on and no policies = invisible to the website
revoke all on public.admins from anon, authenticated;

grant select on public.site_content, public.announcements to anon, authenticated;
grant insert, update, delete on public.site_content, public.announcements to authenticated;

-- ---------- starter content (only if the table is empty) ----------

insert into public.announcements (title, body, category, pinned, image, sort_order)
select * from (values
  ('welcome to the notice board', E'this is where the important stuff lives. events, updates, reminders, and the occasional nonsense.\n\ncheck back now and then. it changes.', 'info', true, 'neon-red', 0),
  ('public service announcement', 'drink some water. that is it. that is the announcement.', 'fun', false, 'none', 1)
) as v(title, body, category, pinned, image, sort_order)
where not exists (select 1 from public.announcements);

-- ---------- YOUR admin email (change this!) ----------

insert into public.admins (email) values ('you@example.com')
on conflict (email) do nothing;
