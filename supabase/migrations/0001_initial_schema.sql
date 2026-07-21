-- 0001 — Initial schema for the Platform (PLAN.md §3)
-- Access model V1: RLS enabled on every table with NO public policies.
-- Only the server (service_role key) can read/write.

create table niches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  vocabulary jsonb not null default '{}'::jsonb,
  hook_examples jsonb not null default '[]'::jsonb,
  default_palette jsonb not null default '[]'::jsonb,
  script_structures jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table formations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  niche_id uuid not null references niches (id),
  chariow_product_id text,
  monthly_message_quota integer not null default 200,
  access_duration_days integer not null default 30,
  created_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text not null,
  formation_id uuid not null references formations (id),
  status text not null default 'pending_license'
    check (status in ('pending_license', 'active', 'expired', 'suspended')),
  created_at timestamptz not null default now()
);

create table licenses (
  id uuid primary key default gen_random_uuid(),
  license_key text not null unique,
  student_id uuid references students (id),
  chariow_payload jsonb,
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index licenses_student_id_idx on licenses (student_id);

create table configurator_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id),
  current_step text not null default 'target',
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed')),
  created_at timestamptz not null default now()
);

create index configurator_sessions_student_id_idx
  on configurator_sessions (student_id);

create table configurator_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references configurator_sessions (id),
  step text not null,
  answer jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  -- Hard rule: one answer per (session, step); going back updates, never duplicates
  unique (session_id, step)
);

create table prompt_b_versions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id),
  version integer not null,
  content text not null,
  source text not null default 'initial'
    check (source in ('initial', 'guided_edit', 'free_edit')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (student_id, version)
);

-- Hard rule: a single active Prompt B per student
create unique index prompt_b_versions_one_active_per_student
  on prompt_b_versions (student_id)
  where is_active;

create table conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id),
  title text not null default 'Nouvelle conversation',
  created_at timestamptz not null default now()
);

create index conversations_student_id_idx on conversations (student_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id),
  role text not null check (role in ('user', 'assistant')),
  command text check (command in ('script', 'short')),
  content text not null,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on messages (conversation_id);

create table usage_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id),
  kind text not null
    check (kind in ('configurator', 'prompt_b_generation', 'chat', 'image')),
  model text not null,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  created_at timestamptz not null default now()
);

-- Monthly quota counting: (student, created_at) scans
create index usage_events_student_created_idx
  on usage_events (student_id, created_at);

-- RLS: enabled everywhere, zero public policies — server-only access
alter table niches enable row level security;
alter table formations enable row level security;
alter table students enable row level security;
alter table licenses enable row level security;
alter table configurator_sessions enable row level security;
alter table configurator_answers enable row level security;
alter table prompt_b_versions enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table usage_events enable row level security;
