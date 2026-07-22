// Shared configurator types (client-safe: no server imports).
// Answer shapes mirror the jsonb stored in configurator_answers.

export type TargetGender = "hommes" | "femmes" | "mixte";

export type TargetAnswer = {
  gender: TargetGender;
  ageRange: string;
  pain: string;
  summary: string; // AI "avatar marketing" reformulation
};

export type ChannelNameAnswer = {
  name: string;
};

export type ColorsAnswer = {
  paletteId: string | null;
  primary: string;
  secondary: string;
  neutral?: string;
};

export type ImagePrompt = {
  title: string;
  prompt: string;
};

export type AvatarAnswer = {
  description: string;
  styles: string[];
  imagePrompts: ImagePrompt[]; // 3 English prompts, generated server-side
};

export type BannerAnswer = {
  description: string;
  styles: string[];
  imagePrompt: string; // 1 English prompt, generated server-side
};

export type ConfiguratorAnswers = {
  target?: TargetAnswer;
  channel_name?: ChannelNameAnswer;
  colors?: ColorsAnswer;
  avatar?: AvatarAnswer;
  banner?: BannerAnswer;
};

export type NameSuggestion = {
  name: string;
  angle: "identite" | "promesse" | "punchy";
  justification: string;
};

export type PaletteSuggestion = {
  primary: string;
  secondary: string;
  neutral: string;
  rationale: string;
};

export type NichePalette = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
};

export type ConfiguratorNicheContent = {
  targetExamples: string[];
  palettes: NichePalette[];
  avatarStyles: string[];
  bannerStyles: string[];
};

export const CONFIGURATOR_STEPS = [
  "target",
  "channel_name",
  "colors",
  "avatar",
  "banner",
] as const;

export type ConfiguratorStepName = (typeof CONFIGURATOR_STEPS)[number];
