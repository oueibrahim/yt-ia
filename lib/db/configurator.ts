import "server-only";

import { getSupabaseServer } from "@/lib/supabase/server";

export type ConfiguratorStep =
  | "target"
  | "channel_name"
  | "colors"
  | "avatar"
  | "banner";

export type CompletedAnswers = Partial<Record<ConfiguratorStep, unknown>>;

// Answers of the student's most recent COMPLETED configurator session.
export async function getCompletedAnswers(
  studentId: string,
): Promise<CompletedAnswers | null> {
  const supabase = getSupabaseServer();

  const { data: session, error: sessionError } = await supabase
    .from("configurator_sessions")
    .select("id")
    .eq("student_id", studentId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sessionError) {
    throw new Error(`getCompletedAnswers failed: ${sessionError.message}`);
  }
  if (!session) return null;

  const { data: answers, error: answersError } = await supabase
    .from("configurator_answers")
    .select("step, answer")
    .eq("session_id", session.id);
  if (answersError) {
    throw new Error(`getCompletedAnswers failed: ${answersError.message}`);
  }

  const result: CompletedAnswers = {};
  for (const row of answers ?? []) {
    result[row.step as ConfiguratorStep] = row.answer;
  }
  return result;
}
