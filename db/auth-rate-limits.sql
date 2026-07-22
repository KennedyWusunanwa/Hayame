-- Rate limiting for auth endpoints (login, signup, password reset, resend).
--
-- Backs src/lib/rate-limit.ts. Shared storage matters because Vercel runs many
-- serverless instances: an in-memory window would let an attacker get N times
-- the allowance simply by spreading requests across instances.
--
-- The app degrades to a per-instance in-memory window if this table is absent,
-- so deploying before running this migration is safe — just weaker.

create table if not exists public.auth_rate_limits (
  id uuid primary key default gen_random_uuid(),
  -- Bucket, e.g. 'login-ip', 'login-account', 'signup', 'password-reset'.
  scope text not null,
  -- The thing being limited: an IP address or a lowercased email.
  identifier text not null,
  created_at timestamptz not null default now()
);

-- The hot path is "count hits for (scope, identifier) since T", so lead with
-- those two columns and keep created_at in the index to serve the range scan.
create index if not exists auth_rate_limits_lookup_idx
  on public.auth_rate_limits (scope, identifier, created_at desc);

-- Supports the cleanup delete below without scanning the table.
create index if not exists auth_rate_limits_created_at_idx
  on public.auth_rate_limits (created_at);

-- Service-role only. No end user should read or write this table, and RLS with
-- no permissive policy denies everyone except the service role, which bypasses
-- RLS by design.
alter table public.auth_rate_limits enable row level security;

-- Rows are worthless once they fall outside the longest window in use (15
-- minutes). Without pruning this table grows forever.
create or replace function public.prune_auth_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.auth_rate_limits
  where created_at < now() - interval '1 hour';
$$;

-- Schedule it if pg_cron is available; otherwise prune manually or via an
-- external scheduler. Wrapped so this migration still succeeds without pg_cron.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'prune-auth-rate-limits',
      '17 * * * *',
      $cron$select public.prune_auth_rate_limits();$cron$
    );
  end if;
exception
  when others then
    raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end$$;
