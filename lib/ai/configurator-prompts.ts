// Prompt builders for the AI-assisted configurator steps. Pure functions,
// rules taken from the reference Prompt A (docs/reference/prompt-a-chainfit.md).

import type { TargetGender } from "@/lib/configurator-types";

export function buildTargetReformulationPrompts(input: {
  nicheName: string;
  gender: TargetGender;
  ageRange: string;
  pain: string;
}): { system: string; prompt: string } {
  return {
    system: `Tu es un expert en création de chaînes YouTube ${input.nicheName} francophones. On te donne la cible d'un élève en trois éléments. Reformule cette cible en 2 à 3 phrases percutantes façon "avatar marketing" (ex : "Ta cible : des hommes sédentaires de 25 à 35 ans, qui travaillent au bureau, qui ont honte de se montrer torse nu l'été, et qui ont déjà essayé une salle de sport sans résultat durable."). Réponds UNIQUEMENT avec la reformulation, en français, sans préambule.`,
    prompt: `Genre : ${input.gender}\nTranche d'âge : ${input.ageRange}\nDouleur principale : ${input.pain}`,
  };
}

export function buildNameSuggestionsPrompts(input: {
  nicheName: string;
  targetSummary: string;
}): { system: string; prompt: string } {
  return {
    system: `Tu es un expert en création de chaînes YouTube ${input.nicheName} francophones. Génère 6 propositions de noms de chaîne selon ces critères (règles du formateur, à respecter exactement) :
- Mémorisable, court (1 à 3 mots maximum)
- Évoque la transformation, la force, ou l'identité à atteindre
- Doit pouvoir devenir un avatar/mascotte visuel (comme "L'Homme Athlétique Orange" = un personnage orange)
- Adapté au genre de la cible
- Varier les angles : 2 noms orientés "identite", 2 noms orientés "promesse" (résultat), 2 noms orientés "punchy" (un mot)
Chaque nom est accompagné d'une justification d'une ligne, en français.`,
    prompt: `La cible de l'élève : ${input.targetSummary}`,
  };
}

export function buildPaletteSuggestionPrompts(input: {
  nicheName: string;
  channelName: string;
  targetSummary: string;
}): { system: string; prompt: string } {
  return {
    system: `Tu es un directeur artistique pour chaînes YouTube ${input.nicheName}. Génère une palette de 2 couleurs principales + 1 couleur neutre (noir ou blanc), avec codes HEX précis. Choisis des couleurs vives et énergiques (jamais ternes), cohérentes avec le nom de chaîne et la psychologie de la cible (ex : rouge/orange = énergie/agressivité positive, bleu/vert = discipline/calme mental, violet/rose = féminin fort et premium). Explique ton choix en une phrase en français.`,
    prompt: `Nom de chaîne : ${input.channelName}\nCible : ${input.targetSummary}`,
  };
}

export function buildAvatarPromptsPrompts(input: {
  gender: TargetGender;
  channelName: string;
  primaryColor: string;
  description: string;
  styles: string[];
}): { system: string; prompt: string } {
  return {
    system: `You write image-generation prompts for YouTube channel avatars/mascots. Generate exactly 3 prompts in ENGLISH, each one a complete standalone prompt including MANDATORY elements (trainer's rules):
- cartoon character, flat vector illustration, comic style, bold black outlines
- main body/outfit color = the given HEX color
- gender consistent with the given audience
- a visual element recalling the channel name
- pure white background
- no realistic face — always stylized/masked/simplified like a superhero or mascot
The 3 prompts must cover 3 different angles: 1) strength/confidence pose, 2) movement/action pose, 3) close-to-viewer/pointing-at-camera pose. Give each prompt a short French title describing the angle.`,
    prompt: `Channel name: ${input.channelName}\nAudience gender: ${input.gender}\nMain HEX color: ${input.primaryColor}\nStudent's avatar description: ${input.description}\nPreferred styles: ${input.styles.join(", ") || "none"}`,
  };
}

export function buildBannerPromptPrompts(input: {
  nicheName: string;
  channelName: string;
  primaryColor: string;
  secondaryColor: string;
  avatarDescription: string;
  description: string;
  styles: string[];
}): { system: string; prompt: string } {
  return {
    system: `You write image-generation prompts for YouTube channel banners. Generate exactly ONE prompt in ENGLISH: landscape format, includes the channel avatar, the channel name as text, the given HEX colors, a background consistent with the ${input.nicheName}/transformation theme, dimensions 2560x1440 with the key content inside the 1546x423 safe area. Respond with the prompt only.`,
    prompt: `Channel name: ${input.channelName}\nColors: primary ${input.primaryColor}, secondary ${input.secondaryColor}\nAvatar: ${input.avatarDescription}\nStudent's banner description: ${input.description}\nPreferred ambiance: ${input.styles.join(", ") || "none"}`,
  };
}
