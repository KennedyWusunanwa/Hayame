-- Site maintenance / under-construction mode, controlled from /admin/maintenance.
-- One row (id = 1). Read and written only with the service role: the proxy and the
-- admin portal use SUPABASE_SERVICE_ROLE_KEY, so no public policy is created.
create table if not exists public.site_maintenance (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default false,
  mode text not null default 'indefinite' check (mode in ('indefinite', 'timed')),
  ends_at timestamptz,
  show_countdown boolean not null default true,
  badge text not null default 'Under construction',
  headline text not null default 'We''re building something *better.*',
  message text not null default 'Hayame is getting an upgrade. We''ll be back shortly. Thanks for your patience.',
  theme text not null default 'navy' check (theme in ('navy', 'blue', 'light')),
  background text not null default 'accra',
  contact_email text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.site_maintenance (id) values (1) on conflict (id) do nothing;

alter table public.site_maintenance enable row level security;
revoke all on public.site_maintenance from anon, authenticated;
