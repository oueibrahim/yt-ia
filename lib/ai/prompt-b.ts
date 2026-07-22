import "server-only";

import { getCompletedAnswers } from "@/lib/db/configurator";
import { getNicheForStudent } from "@/lib/db/niches";
import {
  insertPromptBVersion,
  type PromptBVersionRow,
} from "@/lib/db/prompt-b";
import { generateCompletion } from "./client";
import {
  buildPromptBSystemPrompt,
  buildPromptBUserPrompt,
  type PromptBInputs,
} from "./prompt-b-template";

function readAnswer(value: unknown, key: string): string {
  if (value && typeof value === "object" && key in value) {
    const field = (value as Record<string, unknown>)[key];
    if (typeof field === "string") return field;
  }
  return "";
}

// Generates the student's personalised assistant (Prompt B) from their
// completed configurator answers, stores it as a new active version.
// Called by the Trigger.dev job (plan step 6).
export async function generatePromptB(
  studentId: string,
): Promise<PromptBVersionRow> {
  const answers = await getCompletedAnswers(studentId);
  if (!answers) {
    throw new Error(
      `generatePromptB: no completed configurator session for student ${studentId}`,
    );
  }

  const niche = await getNicheForStudent(studentId);

  const inputs: PromptBInputs = {
    targetSummary: readAnswer(answers.target, "summary"),
    channelName: readAnswer(answers.channel_name, "name"),
    colors: {
      primary: readAnswer(answers.colors, "primary"),
      secondary: readAnswer(answers.colors, "secondary"),
    },
    avatarDescription: readAnswer(answers.avatar, "description"),
    bannerDescription: readAnswer(answers.banner, "description"),
  };

  const content = await generateCompletion({
    system: buildPromptBSystemPrompt({
      name: niche.name,
      terms: niche.vocabulary.terms,
      hookExamples: niche.hook_examples,
      structures: niche.script_structures,
    }),
    prompt: buildPromptBUserPrompt(inputs),
    studentId,
    kind: "prompt_b_generation",
  });

  return insertPromptBVersion({ studentId, content, source: "initial" });
}
