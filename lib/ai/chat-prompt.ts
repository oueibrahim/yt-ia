import "server-only";

import type { NicheRow } from "@/lib/db/types";
import type { MessageCommand } from "@/lib/chat-command";

// Builds the reminder appended to the Prompt B system prompt when the
// student uses /script or /short, pointing to the niche's own structures
// (data, never hardcoded — AGENTS.md §2).
//
// Small models reliably undershoot a bare "at least N words" instruction —
// they need an explicit structural scaffold (required sections, each one
// forbidden from being a single sentence) to actually reach the target
// length. The duration-range framing also gives the assistant a concrete
// default to aim for when the student doesn't specify one, without turning
// script generation into a back-and-forth (each /script or /short still
// produces one complete, immediately usable script, per the reference
// Prompt A).
export function buildCommandReminder(
  command: MessageCommand,
  niche: NicheRow,
): string {
  if (command === "script") {
    return `\n\n---\nL'élève utilise la commande /script. Rédige un script long complet en choisissant la structure la plus adaptée au sujet parmi : ${niche.script_structures.long.join(", ")}.

Durée cible : si le sujet précise une durée ou un format (court, rapide, détaillé, complet…), respecte-le. Sinon, vise une vidéo de huit à douze minutes de voix off, soit environ mille cinq cents à deux mille mots.

Pour atteindre cette longueur, développe obligatoirement : un hook (plusieurs phrases, pas une accroche isolée), une introduction, au moins quatre parties substantielles développées chacune en plusieurs paragraphes avec explications et exemples concrets (jamais une partie résumée en une seule phrase), des transitions entre les parties, et une conclusion avec appel à l'action. Un script trop court est un script raté.

Respecte les règles absolues : nombres écrits en lettres pour la voix off.`;
  }
  return `\n\n---\nL'élève utilise la commande /short. Rédige un script de short en choisissant le format le plus adapté au sujet parmi : ${niche.script_structures.shorts.join(", ")}.

Durée cible : si le sujet précise une durée, respecte-la. Sinon, vise trente à quarante-cinq secondes de voix off, soit environ cent à cent-cinquante mots — pas moins.

Développe chaque point (deux à trois phrases par point, pas seulement un titre), avec un hook percutant dès la première seconde et un appel à l'action final.

Respecte les règles absolues : nombres écrits en lettres pour la voix off.`;
}
