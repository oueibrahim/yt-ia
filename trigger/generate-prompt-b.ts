import { task } from "@trigger.dev/sdk";
import { generatePromptB } from "@/lib/ai/prompt-b";

// Generates the student's personalised assistant (Prompt B) from their
// completed configurator answers. Retries are safe: version insertion is
// atomic (SQL function, migration 0003), so a retry can only create the
// next version, never corrupt the active one.
export const generatePromptBTask = task({
  id: "generate-prompt-b",
  run: async (payload: { studentId: string }) => {
    const version = await generatePromptB(payload.studentId);
    return { versionId: version.id, version: version.version };
  },
});
