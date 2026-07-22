import "server-only";

import { getSupabaseServer } from "@/lib/supabase/server";

export type UsageKind = "configurator" | "prompt_b_generation" | "chat" | "image";

export async function recordUsageEvent(params: {
  studentId: string;
  kind: UsageKind;
  model: string;
  tokensIn: number;
  tokensOut: number;
}): Promise<void> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("usage_events").insert({
    student_id: params.studentId,
    kind: params.kind,
    model: params.model,
    tokens_in: params.tokensIn,
    tokens_out: params.tokensOut,
  });
  if (error) throw new Error(`recordUsageEvent failed: ${error.message}`);
}
