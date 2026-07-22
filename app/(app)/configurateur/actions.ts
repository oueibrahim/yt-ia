"use server";

import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { generateCompletion, generateStructured } from "@/lib/ai/client";
import {
  buildAvatarPromptsPrompts,
  buildBannerPromptPrompts,
  buildNameSuggestionsPrompts,
  buildPaletteSuggestionPrompts,
  buildTargetReformulationPrompts,
} from "@/lib/ai/configurator-prompts";
import {
  completeSession,
  getAnswers,
  getOrCreateSession,
} from "@/lib/db/configurator";
import { getNicheForStudent } from "@/lib/db/niches";
import { getStudentByClerkId } from "@/lib/db/students";
import { upsertAnswer } from "@/lib/db/configurator";
import type {
  AvatarAnswer,
  BannerAnswer,
  ColorsAnswer,
  ImagePrompt,
  NameSuggestion,
  PaletteSuggestion,
  TargetAnswer,
} from "@/lib/configurator-types";
import type { StudentRow } from "@/lib/db/types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const GENERIC_ERROR = "Une erreur est survenue. Réessayez.";

async function requireStudent(): Promise<StudentRow> {
  const user = await currentUser();
  if (!user) throw new Error("unauthenticated");
  const student = await getStudentByClerkId(user.id);
  if (!student) throw new Error("no student");
  return student;
}

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const targetInput = z.object({
  gender: z.enum(["hommes", "femmes", "mixte"]),
  ageRange: z.string().trim().min(1).max(30),
  pain: z.string().trim().min(5).max(600),
});

// Save target + AI "avatar marketing" reformulation (stored together).
export async function saveTarget(
  raw: unknown,
): Promise<ActionResult<TargetAnswer>> {
  try {
    const input = targetInput.parse(raw);
    const student = await requireStudent();
    const niche = await getNicheForStudent(student.id);

    const { system, prompt } = buildTargetReformulationPrompts({
      nicheName: niche.name,
      ...input,
    });
    const summary = (
      await generateCompletion({
        system,
        prompt,
        studentId: student.id,
        kind: "configurator",
      })
    ).trim();

    const answer: TargetAnswer = { ...input, summary };
    const session = await getOrCreateSession(student.id);
    await upsertAnswer({
      sessionId: session.id,
      step: "target",
      answer,
      nextStep: "channel_name",
    });
    return { ok: true, data: answer };
  } catch (error) {
    console.error("saveTarget failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

// 6 channel-name suggestions (2 identité, 2 promesse, 2 punchy).
export async function suggestChannelNames(): Promise<
  ActionResult<NameSuggestion[]>
> {
  try {
    const student = await requireStudent();
    const session = await getOrCreateSession(student.id);
    const answers = await getAnswers(session.id);
    const target = answers.target as TargetAnswer | undefined;
    if (!target?.summary) {
      return { ok: false, error: "Renseignez d'abord votre cible." };
    }

    const niche = await getNicheForStudent(student.id);
    const { system, prompt } = buildNameSuggestionsPrompts({
      nicheName: niche.name,
      targetSummary: target.summary,
    });
    const result = await generateStructured({
      system,
      prompt,
      schema: z.object({
        names: z
          .array(
            z.object({
              name: z.string(),
              angle: z.enum(["identite", "promesse", "punchy"]),
              justification: z.string(),
            }),
          )
          .length(6),
      }),
      studentId: student.id,
      kind: "configurator",
    });
    return { ok: true, data: result.names };
  } catch (error) {
    console.error("suggestChannelNames failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

const channelNameInput = z.object({ name: z.string().trim().min(2).max(50) });

export async function saveChannelName(
  raw: unknown,
): Promise<ActionResult<null>> {
  try {
    const input = channelNameInput.parse(raw);
    const student = await requireStudent();
    const session = await getOrCreateSession(student.id);
    await upsertAnswer({
      sessionId: session.id,
      step: "channel_name",
      answer: { name: input.name },
      nextStep: "colors",
    });
    return { ok: true, data: null };
  } catch (error) {
    console.error("saveChannelName failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

// AI palette: 2 main colors + 1 neutral, consistent with name + target.
export async function suggestPalette(): Promise<
  ActionResult<PaletteSuggestion>
> {
  try {
    const student = await requireStudent();
    const session = await getOrCreateSession(student.id);
    const answers = await getAnswers(session.id);
    const target = answers.target as TargetAnswer | undefined;
    const channelName = answers.channel_name as { name?: string } | undefined;
    if (!target?.summary || !channelName?.name) {
      return { ok: false, error: "Renseignez d'abord votre cible et votre nom." };
    }

    const niche = await getNicheForStudent(student.id);
    const { system, prompt } = buildPaletteSuggestionPrompts({
      nicheName: niche.name,
      channelName: channelName.name,
      targetSummary: target.summary,
    });
    const palette = await generateStructured({
      system,
      prompt,
      schema: z.object({
        primary: hexColor,
        secondary: hexColor,
        neutral: hexColor,
        rationale: z.string(),
      }),
      studentId: student.id,
      kind: "configurator",
    });
    return { ok: true, data: palette };
  } catch (error) {
    console.error("suggestPalette failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

const colorsInput = z.object({
  paletteId: z.string().max(40).nullable(),
  primary: hexColor,
  secondary: hexColor,
  neutral: hexColor.optional(),
});

export async function saveColors(raw: unknown): Promise<ActionResult<null>> {
  try {
    const input = colorsInput.parse(raw) as ColorsAnswer;
    const student = await requireStudent();
    const session = await getOrCreateSession(student.id);
    await upsertAnswer({
      sessionId: session.id,
      step: "colors",
      answer: input,
      nextStep: "avatar",
    });
    return { ok: true, data: null };
  } catch (error) {
    console.error("saveColors failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

const visualInput = z.object({
  description: z.string().trim().min(5).max(1000),
  styles: z.array(z.string().max(40)).max(8),
});

// Save avatar description + generate the 3 English image prompts (Prompt A rules).
export async function saveAvatar(
  raw: unknown,
): Promise<ActionResult<ImagePrompt[]>> {
  try {
    const input = visualInput.parse(raw);
    const student = await requireStudent();
    const session = await getOrCreateSession(student.id);
    const answers = await getAnswers(session.id);
    const target = answers.target as TargetAnswer | undefined;
    const channelName = answers.channel_name as { name?: string } | undefined;
    const colors = answers.colors as ColorsAnswer | undefined;
    if (!target || !channelName?.name || !colors) {
      return { ok: false, error: "Terminez d'abord les étapes précédentes." };
    }

    const { system, prompt } = buildAvatarPromptsPrompts({
      gender: target.gender,
      channelName: channelName.name,
      primaryColor: colors.primary,
      description: input.description,
      styles: input.styles,
    });
    const result = await generateStructured({
      system,
      prompt,
      schema: z.object({
        prompts: z
          .array(z.object({ title: z.string(), prompt: z.string() }))
          .length(3),
      }),
      studentId: student.id,
      kind: "configurator",
    });

    const answer: AvatarAnswer = { ...input, imagePrompts: result.prompts };
    await upsertAnswer({
      sessionId: session.id,
      step: "avatar",
      answer,
      nextStep: "banner",
    });
    return { ok: true, data: result.prompts };
  } catch (error) {
    console.error("saveAvatar failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

// Save banner description + generate the single English banner prompt.
export async function saveBanner(raw: unknown): Promise<ActionResult<string>> {
  try {
    const input = visualInput.parse(raw);
    const student = await requireStudent();
    const session = await getOrCreateSession(student.id);
    const answers = await getAnswers(session.id);
    const channelName = answers.channel_name as { name?: string } | undefined;
    const colors = answers.colors as ColorsAnswer | undefined;
    const avatar = answers.avatar as AvatarAnswer | undefined;
    if (!channelName?.name || !colors || !avatar) {
      return { ok: false, error: "Terminez d'abord les étapes précédentes." };
    }

    const niche = await getNicheForStudent(student.id);
    const { system, prompt } = buildBannerPromptPrompts({
      nicheName: niche.name,
      channelName: channelName.name,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      avatarDescription: avatar.description,
      description: input.description,
      styles: input.styles,
    });
    const imagePrompt = (
      await generateCompletion({
        system,
        prompt,
        studentId: student.id,
        kind: "configurator",
      })
    ).trim();

    const answer: BannerAnswer = { ...input, imagePrompt };
    await upsertAnswer({
      sessionId: session.id,
      step: "banner",
      answer,
      nextStep: "summary",
    });
    return { ok: true, data: imagePrompt };
  } catch (error) {
    console.error("saveBanner failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function completeConfiguration(): Promise<ActionResult<null>> {
  try {
    const student = await requireStudent();
    const session = await getOrCreateSession(student.id);
    await completeSession(session.id);
    return { ok: true, data: null };
  } catch (error) {
    console.error("completeConfiguration failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
