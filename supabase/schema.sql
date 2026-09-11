create extension if not exists pgcrypto;

create table if not exists public.projects (
  id text primary key,
  canonical_key text not null,
  name text not null,
  country text,
  current_stage text,
  primary_account text,
  opportunity_score integer check (opportunity_score between 0 and 100),
  data_confidence integer check (data_confidence between 0 and 100),
  matched_products jsonb not null default '[]'::jsonb,
  signal_count integer not null default 0,
  source_count integer not null default 0,
  sources jsonb not null default '[]'::jsonb,
  first_seen timestamptz,
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists projects_canonical_key_idx on public.projects(canonical_key);
create index if not exists projects_stage_idx on public.projects(current_stage);
create index if not exists projects_country_idx on public.projects(country);
create index if not exists projects_score_idx on public.projects(opportunity_score desc);

create table if not exists public.project_signals (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  title text not null,
  source text not null,
  source_url text,
  published_at timestamptz,
  stage text,
  account text,
  notice_type text,
  relevance integer,
  customer_score integer,
  matched_products jsonb not null default '[]'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_signals_project_idx on public.project_signals(project_id);
create index if not exists project_signals_published_idx on public.project_signals(published_at desc);
create index if not exists project_signals_source_idx on public.project_signals(source);

-- Foundation for the next stakeholder-graph sprint.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  country text,
  website text,
  linkedin_url text,
  phone text,
  email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists organizations_domain_idx on public.organizations(domain) where domain is not null;

create table if not exists public.project_stakeholders (
  project_id text not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null,
  confidence integer check (confidence between 0 and 100),
  source_url text,
  active_from timestamptz,
  active_to timestamptz,
  created_at timestamptz not null default now(),
  primary key(project_id,organization_id,role)
);

-- No anonymous access. Server-side service-role calls bypass RLS.
alter table public.projects enable row level security;
alter table public.project_signals enable row level security;
alter table public.organizations enable row level security;
alter table public.project_stakeholders enable row level security;
