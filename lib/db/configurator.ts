import "server-only";

import { getSupabaseServer } from "@/lib/supabase/server";
import {
  CONFIGURATOR_STEPS,
  type ConfiguratorStepName,
} from "@/lib/configurator-types";

export type ConfiguratorStep = ConfiguratorStepName;

export type CompletedAnswers = Partial<Record<ConfiguratorStep, unknown>>;

export type SessionRow = {
  id: string;
  student_id: string;
  current_step: string;
  status: "in_progress" | "completed";
  created_at: string;
};

export async function getLatestSession(
  studentId: string,
): Promise<SessionRow | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("configurator_sessions")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getLatestSession failed: ${error.message}`);
  return data;
}

export async function getOrCreateSession(
  studentId: string,
): Promise<SessionRow> {
  const latest = await getLatestSession(studentId);
  if (latest && latest.status === "in_progress") return latest;
  if (latest && latest.status === "completed") return latest;

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("configurator_sessions")
    .insert({ student_id: studentId })
    .select()
    .single();
  if (error) throw new Error(`getOrCreateSession failed: ${error.message}`);
  return data;
}

export async function getAnswers(sessionId: string): Promise<CompletedAnswers> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("configurator_answers")
    .select("step, answer")
    .eq("session_id", sessionId);
  if (error) throw new Error(`getAnswers failed: ${error.message}`);

  const result: CompletedAnswers = {};
  for (const row of data ?? []) {
    result[row.step as ConfiguratorStep] = row.answer;
  }
  return result;
}

// Hard rule (AGENTS §6): one answer per (session, step) — going back updates.
export async function upsertAnswer(params: {
  sessionId: string;
  step: ConfiguratorStep;
  answer: unknown;
  nextStep: string;
}): Promise<void> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("configurator_answers").upsert(
    {
      session_id: params.sessionId,
      step: params.step,
      answer: params.answer,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id,step" },
  );
  if (error) throw new Error(`upsertAnswer failed: ${error.message}`);

  // Best-effort step pointer, and only while the session is in progress:
  // an edit from the summary of a completed session must not corrupt it,
  // and a pointer failure must not surface an error for a saved answer.
  const { error: stepError } = await supabase
    .from("configurator_sessions")
    .update({ current_step: params.nextStep })
    .eq("id", params.sessionId)
    .eq("status", "in_progress");
  if (stepError) {
    console.error(`upsertAnswer: current_step update failed: ${stepError.message}`);
  }
}

export async function completeSession(sessionId: string): Promise<void> {
  const answers = await getAnswers(sessionId);
  const missing = CONFIGURATOR_STEPS.filter((step) => !(step in answers));
  if (missing.length > 0) {
    throw new Error(`completeSession: missing steps: ${missing.join(", ")}`);
  }

  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from("configurator_sessions")
    .update({ status: "completed", current_step: "done" })
    .eq("id", sessionId);
  if (error) throw new Error(`completeSession failed: ${error.message}`);
}

// Answers of the student's most recent COMPLETED session (used by Prompt B).
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
  return getAnswers(session.id);
}
