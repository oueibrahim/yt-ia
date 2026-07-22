-- 0003 — Atomic Prompt B version insertion.
-- Fixes the read-max / deactivate / insert race: a per-student advisory lock
-- serializes concurrent generations (e.g. a Trigger.dev job retry), so a
-- student can never end up with zero active version or a version collision.

create or replace function insert_prompt_b_version(
  p_student_id uuid,
  p_content text,
  p_source text
) returns prompt_b_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
  v_row prompt_b_versions;
begin
  perform pg_advisory_xact_lock(hashtext(p_student_id::text));

  select coalesce(max(version), 0) + 1
    into v_next
    from prompt_b_versions
   where student_id = p_student_id;

  update prompt_b_versions
     set is_active = false
   where student_id = p_student_id
     and is_active;

  insert into prompt_b_versions (student_id, version, content, source, is_active)
  values (p_student_id, v_next, p_content, p_source, true)
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function insert_prompt_b_version(uuid, text, text)
  from public, anon, authenticated;
grant execute on function insert_prompt_b_version(uuid, text, text)
  to service_role;
