-- Diagnostic error reports (admin-only).
--
-- Privacy posture (Apple App Privacy / GDPR safe as first-party diagnostics):
--   * Stores only technical diagnostics: route, error message, error code,
--     truncated stack, HTTP status, timestamp, app version and platform.
--   * user_id is our own internal Supabase UUID (nullable) for debugging only.
--   * NEVER stores device push tokens, emails, names, phone numbers, or raw
--     request bodies.
--   * RLS is enabled with NO public policies, so only the service role (the
--     admin client) can read or write. End users cannot access this table.
--
-- Run this in the Supabase SQL editor (or include db/migration.sql which now
-- contains the same block).

create table if not exists error_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null default 'web',   -- 'web' | 'ios' | 'android'
  route text,                           -- e.g. '/api/mobile/push/register'
  method text,                          -- HTTP method
  status integer,                       -- HTTP status returned to the client
  message text,                         -- technical error message (admin-only)
  code text,                            -- Postgres / Supabase / error code
  stack text,                           -- truncated stack trace (admin-only)
  user_id uuid,                         -- internal user id (nullable)
  app_version text,                     -- client app version, if reported
  platform text,                        -- client platform, if reported
  context jsonb,                        -- optional non-PII structured context
  resolved boolean not null default false,
  resolved_at timestamptz
);

create index if not exists idx_error_reports_created
  on error_reports(created_at desc);
create index if not exists idx_error_reports_unresolved
  on error_reports(resolved, created_at desc);

alter table error_reports enable row level security;
-- No policies are defined on purpose: only the service role (admin client)
-- may read or write. This keeps diagnostic data out of reach of end users.
