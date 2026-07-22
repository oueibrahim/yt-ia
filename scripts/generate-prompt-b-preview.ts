// Dev-only preview: generates a sample Prompt B in the console from
// hardcoded example answers. No database access, no usage_event (there is
// no student in this context) — the real pipeline goes through
// lib/ai/client.ts which always logs usage.
//
// Run: npx tsx scripts/generate-prompt-b-preview.ts

import { readFileSync } from "node:fs";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  buildPromptBSystemPrompt,
  buildPromptBUserPrompt,
} from "../lib/ai/prompt-b-template";

// Minimal .env.local loader (no dotenv dependency)
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

// Mirrors the seeded Fitness niche (0002_seed_fitness.sql)
const fitnessNiche = {
  name: "Fitness",
  terms: [
    "transformation",
    "sèche",
    "prise de masse",
    "cardio",
    "hypertrophie",
    "déficit calorique",
    "récupération",
  ],
  hookExamples: [
    "On t'a répété que courir le ventre vide brûlait deux fois plus de gras. Et si je te disais que tu perds surtout ton temps ?",
    "Tes pecs ne grossissent pas ? C'est sûrement l'une de ces trois erreurs.",
  ],
  structures: {
    long: [
      "Mythe Brisé",
      "Erreurs Fatales",
      "Secret Révélé",
      "Classement/Liste",
      "Transformation",
    ],
    shorts: [
      "Classement Niveau",
      "Liste Choc",
      "Liste Solution Express",
      "Comparaison Personnalisée",
      "Défi Progressif",
    ],
  },
};

const sampleInputs = {
  targetSummary:
    "Hommes sédentaires de 25 à 35 ans, travail de bureau, qui ont honte de se montrer torse nu l'été et ont déjà abandonné une salle de sport sans résultat durable.",
  channelName: "FORGE",
  colors: { primary: "#FF4D2E", secondary: "#0B0B0F" },
  avatarDescription:
    "Cartoon flat vector, forgeron athlétique masqué, tenue rouge-orangé #FF4D2E, contours noirs épais, fond blanc, marteau stylisé rappelant la forge.",
  bannerDescription:
    "Salle de forge moderne, étincelles, ambiance rouge et noir, nom FORGE en typographie massive.",
};

async function main() {
  const modelId = process.env.OPENAI_MODEL ?? "gpt-5-mini";
  console.log(`— Génération du Prompt B (modèle : ${modelId})…\n`);

  const { text, usage } = await generateText({
    model: openai(modelId),
    system: buildPromptBSystemPrompt(fitnessNiche),
    prompt: buildPromptBUserPrompt(sampleInputs),
  });

  console.log(text);
  console.log(
    `\n— Terminé. Tokens : ${usage.inputTokens ?? "?"} entrée / ${usage.outputTokens ?? "?"} sortie`,
  );
}

main().catch((error) => {
  console.error("Échec de la génération :", error);
  process.exit(1);
});
