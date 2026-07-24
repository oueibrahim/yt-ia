import "server-only";

import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { z } from "zod";
import { recordUsageEvent, type UsageKind } from "@/lib/db/usage";

const DEFAULT_MODEL = "gpt-5-mini";

export function getModelId(): string {
  return process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
}

// Single entry point to the LLM provider (AGENTS.md §4): every call is
// logged as a usage_event. Swapping providers means changing this file only.
export async function generateCompletion(params: {
  system: string;
  prompt: string;
  studentId: string;
  kind: UsageKind;
}): Promise<string> {
  const modelId = getModelId();
  const { text, usage } = await generateText({
    model: openai(modelId),
    system: params.system,
    prompt: params.prompt,
  });

  // Best-effort: a logging failure must never discard the generated content
  recordUsageEvent({
    studentId: params.studentId,
    kind: params.kind,
    model: modelId,
    tokensIn: usage.inputTokens ?? 0,
    tokensOut: usage.outputTokens ?? 0,
  }).catch((error) => {
    console.error("[usage] recordUsageEvent failed:", error);
  });

  return text;
}

// Structured variant (JSON constrained by a zod schema) — same usage logging.
export async function generateStructured<T>(params: {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  studentId: string;
  kind: UsageKind;
}): Promise<T> {
  const modelId = getModelId();
  const { object, usage } = await generateObject({
    model: openai(modelId),
    system: params.system,
    prompt: params.prompt,
    schema: params.schema,
  });

  recordUsageEvent({
    studentId: params.studentId,
    kind: params.kind,
    model: modelId,
    tokensIn: usage.inputTokens ?? 0,
    tokensOut: usage.outputTokens ?? 0,
  }).catch((error) => {
    console.error("[usage] recordUsageEvent failed:", error);
  });

  return object;
}
