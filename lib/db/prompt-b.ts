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
// Not transactional (supabase-js has no client-side transactions): the
// partial unique index `prompt_b_versions_one_active_per_student` still
// guarantees a single active version — a concurrent insert fails loudly
// instead of corrupting state.
export async function insertPromptBVersion(params: {
  studentId: string;
  content: string;
  source: PromptBVersionRow["source"];
}): Promise<PromptBVersionRow> {
  const supabase = getSupabaseServer();

  const { data: latest, error: latestError } = await supabase
    .from("prompt_b_versions")
    .select("version")
    .eq("student_id", params.studentId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) {
    throw new Error(`insertPromptBVersion failed: ${latestError.message}`);
  }

  const { error: deactivateError } = await supabase
    .from("prompt_b_versions")
    .update({ is_active: false })
    .eq("student_id", params.studentId)
    .eq("is_active", true);
  if (deactivateError) {
    throw new Error(`insertPromptBVersion failed: ${deactivateError.message}`);
  }

  const { data, error } = await supabase
    .from("prompt_b_versions")
    .insert({
      student_id: params.studentId,
      version: (latest?.version ?? 0) + 1,
      content: params.content,
      source: params.source,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw new Error(`insertPromptBVersion failed: ${error.message}`);
  return data;
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
