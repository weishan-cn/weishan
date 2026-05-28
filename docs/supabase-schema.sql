create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  purpose text not null default 'signup',
  consumed boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_verification_codes_email
on public.email_verification_codes(email);

create table if not exists public.email_risk_events (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  domain text,
  risk_score int,
  risk_level text,
  recommendation text,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_risk_events_email
on public.email_risk_events(email);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid,
  user_email text not null,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  user_id uuid,
  user_email text,
  action text not null,
  target_type text,
  target_value text,
  result text,
  risk_level text,
  ip_address text,
  device_info text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_user_email on public.audit_logs(user_email);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);
