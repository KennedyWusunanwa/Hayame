-- Admin team accounts with roles, plus a richer, tamper-resistant audit log.
-- Run once in the Supabase SQL editor. The env-configured admin (ADMIN_USERNAME)
-- keeps working as the root Super Admin, so nobody is locked out.

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  full_name text not null,
  role text not null default 'support'
    check (role in ('super_admin', 'admin', 'support', 'finance')),
  password_hash text not null,
  active boolean not null default true,
  must_change_password boolean not null default true,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  last_login_ip text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

-- Who did it, from where, and how serious it is.
alter table public.admin_actions add column if not exists admin_id text;
alter table public.admin_actions add column if not exists admin_email text;
alter table public.admin_actions add column if not exists admin_role text;
alter table public.admin_actions add column if not exists ip text;
alter table public.admin_actions add column if not exists user_agent text;
alter table public.admin_actions add column if not exists summary text;
alter table public.admin_actions add column if not exists severity text not null default 'info';
alter table public.admin_actions drop constraint if exists admin_actions_severity_check;
alter table public.admin_actions
  add constraint admin_actions_severity_check check (severity in ('info', 'important', 'critical'));

create index if not exists idx_admin_actions_created_at on public.admin_actions (created_at desc);
create index if not exists idx_admin_actions_severity on public.admin_actions (severity, created_at desc);
create index if not exists idx_admin_actions_admin_email on public.admin_actions (admin_email);

-- Append-only: nobody, including the service role, can edit or delete history.
create or replace function public.admin_actions_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'admin_actions is append-only';
end;
$$;

drop trigger if exists trg_admin_actions_immutable on public.admin_actions;
create trigger trg_admin_actions_immutable
before update or delete on public.admin_actions
for each row execute function public.admin_actions_immutable();
