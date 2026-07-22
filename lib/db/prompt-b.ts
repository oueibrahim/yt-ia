import "server-only";

import { getSupabaseServer } from "@/lib/supabase/server";

export type PromptBVersionRow = {
  id: string;
  student_id: string;
  version: number;
  content: string;
  source: "initial" | "guided_edit" | "free_edit";
  is_active: boolean;
  created_at: string;
};

// Inserts a new version (max+1) and makes it the single active one.
// Delegated to the transactional Postgres function (migration 0003): a
// per-student advisory lock makes read-max/deactivate/insert atomic, so
// concurrent generations (job retries) can't leave zero active version.
export async function insertPromptBVersion(params: {
  studentId: string;
  content: string;
  source: PromptBVersionRow["source"];
}): Promise<PromptBVersionRow> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .rpc("insert_prompt_b_version", {
      p_student_id: params.studentId,
      p_content: params.content,
      p_source: params.source,
    })
    .single();
  if (error) throw new Error(`insertPromptBVersion failed: ${error.message}`);
  return data as PromptBVersionRow;
}

export async function getActivePromptB(
  studentId: string,
): Promise<PromptBVersionRow | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("prompt_b_versions")
    .select("*")
    .eq("student_id", studentId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(`getActivePromptB failed: ${error.message}`);
  return data;
}
