-- Notification preferences and announcement storage for mobile broadcasts.

create table if not exists public.user_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  booking_updates boolean not null default true,
  messages boolean not null default true,
  account_security boolean not null default true,
  news_announcements boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null default 'system' check (category in ('system', 'news')),
  delivery text not null default 'in_app' check (delivery in ('in_app', 'push', 'both')),
  audience text not null default 'all' check (audience in ('all', 'authenticated')),
  show_once boolean not null default true,
  cta_label text,
  cta_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text
);

create index if not exists app_announcements_published_at_idx
  on public.app_announcements (published_at desc);

create table if not exists public.user_announcement_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  announcement_id uuid not null references public.app_announcements(id) on delete cascade,
  seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, announcement_id)
);

create index if not exists user_announcement_receipts_announcement_idx
  on public.user_announcement_receipts (announcement_id, seen_at desc);

alter table public.user_notification_preferences enable row level security;
alter table public.user_announcement_receipts enable row level security;
alter table public.app_announcements enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_notification_preferences'
      and policyname = 'user_notification_preferences_owner_select'
  ) then
    create policy user_notification_preferences_owner_select
      on public.user_notification_preferences
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_notification_preferences'
      and policyname = 'user_notification_preferences_owner_insert'
  ) then
    create policy user_notification_preferences_owner_insert
      on public.user_notification_preferences
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_notification_preferences'
      and policyname = 'user_notification_preferences_owner_update'
  ) then
    create policy user_notification_preferences_owner_update
      on public.user_notification_preferences
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_announcement_receipts'
      and policyname = 'user_announcement_receipts_owner_select'
  ) then
    create policy user_announcement_receipts_owner_select
      on public.user_announcement_receipts
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_announcement_receipts'
      and policyname = 'user_announcement_receipts_owner_insert'
  ) then
    create policy user_announcement_receipts_owner_insert
      on public.user_announcement_receipts
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_announcement_receipts'
      and policyname = 'user_announcement_receipts_owner_update'
  ) then
    create policy user_announcement_receipts_owner_update
      on public.user_announcement_receipts
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;
