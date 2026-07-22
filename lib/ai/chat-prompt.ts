import "server-only";

import type { NicheRow } from "@/lib/db/types";
import type { MessageCommand } from "@/lib/chat-command";

// Builds the reminder appended to the Prompt B system prompt when the
// student uses /script or /short, pointing to the niche's own structures
// (data, never hardcoded — AGENTS.md §2).
export function buildCommandReminder(
  command: MessageCommand,
  niche: NicheRow,
): string {
  if (command === "script") {
    return `\n\n---\nL'élève utilise la commande /script. Rédige un script long complet en choisissant la structure la plus adaptée au sujet parmi : ${niche.script_structures.long.join(", ")}. Respecte les règles absolues : nombres écrits en lettres pour la voix off, au moins mille mots.`;
  }
  return `\n\n---\nL'élève utilise la commande /short. Rédige un script de short en choisissant le format le plus adapté au sujet parmi : ${niche.script_structures.shorts.join(", ")}. Respecte les règles absolues : nombres écrits en lettres pour la voix off, quarante-cinq secondes maximum.`;
}
