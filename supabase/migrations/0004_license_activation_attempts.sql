-- 0004 — Anti-abuse guard for license activation attempts.
-- Chariow's API is rate-limited to 100 req/min per key, shared across all
-- students. Without a guard, one student hammering random keys could
-- exhaust that budget for everyone. Every attempt (success or failure) is
-- logged here so the server action can reject after N attempts without
-- ever calling Chariow.

create table license_activation_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id),
  created_at timestamptz not null default now()
);

create index license_activation_attempts_student_created_idx
  on license_activation_attempts (student_id, created_at);

alter table license_activation_attempts enable row level security;
