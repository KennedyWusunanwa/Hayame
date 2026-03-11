-- Mobile push tokens for iOS/Android device notifications.
create table if not exists public.mobile_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android', 'web')),
  device_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mobile_push_tokens_unique
  on public.mobile_push_tokens (user_id, platform, device_token);

alter table public.mobile_push_tokens enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mobile_push_tokens'
      and policyname = 'mobile_push_tokens_owner_select'
  ) then
    create policy mobile_push_tokens_owner_select
      on public.mobile_push_tokens
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
      and tablename = 'mobile_push_tokens'
      and policyname = 'mobile_push_tokens_owner_insert'
  ) then
    create policy mobile_push_tokens_owner_insert
      on public.mobile_push_tokens
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
      and tablename = 'mobile_push_tokens'
      and policyname = 'mobile_push_tokens_owner_update'
  ) then
    create policy mobile_push_tokens_owner_update
      on public.mobile_push_tokens
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;
