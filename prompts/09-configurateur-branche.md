# 09 — Configurateur branché : persistance + assistance IA dans les étapes

## Goal

Remplacer le configurateur mock par le vrai parcours du Prompt A : chaque réponse sauvegardée en base à chaque étape (upsert par (session, step), reprise en cours de route), et l'IA qui assiste à l'intérieur des étapes — reformulation de la cible, 6 propositions de noms, palette proposée, 3 prompts d'avatar + 1 prompt de bannière en anglais copiables — chaque appel logué en usage_events.

## Skills et fichiers lus

- `AGENTS.md` (§2 couche 1, §4, §6 upsert, §7 validation zod)
- `docs/reference/prompt-a-chainfit.md` (parcours exact, critères de chaque étape)
- `lib/ai/client.ts`, `lib/db/` (configurator, niches), `components/configurator/`
- Skill `ai-sdk` (structured output pour les propositions), docs Next.js (server actions)

## Décisions / hypothèses (résolues seul)

1. **Dépendance ajoutée** : `zod` (validation server actions).
2. **Server actions** (`app/(app)/configurateur/actions.ts`), toutes : session Clerk → student → validation zod → écriture/IA. Pas de nouvelle route API.
   - `saveStep(step, answer)` : upsert `configurator_answers` (session in_progress créée au besoin), met à jour `current_step`
   - `completeSession()` : vérifie les 5 réponses présentes → `status='completed'`
   - `reformulateTarget({gender, ageRange, pain})` : IA → reformulation "avatar marketing" 2-3 phrases (kind configurator)
   - `suggestChannelNames()` : IA → 6 noms JSON (2 identité, 2 promesse, 2 punchy, avec justification) via sortie structurée (`generateObject`) — ajout de `generateStructured` dans `lib/ai/client.ts` (même journalisation)
   - `suggestPalette()` : IA → 2 couleurs + 1 neutre HEX cohérentes nom+cible
   - `generateImagePrompts()` : IA → 3 prompts d'avatar (anglais, règles du Prompt A : flat vector, HEX, 3 angles) + 1 prompt de bannière — stockés DANS la réponse des steps avatar/bannière (données stockées, réaffichables)
3. **Étapes revues (UI)** conformes au Prompt A :
   - **Cible** : 3 champs (genre — chips Hommes/Femmes/Mixte, tranche d'âge, douleur principale) → au Suivant : sauvegarde + reformulation IA affichée à l'étape suivante en encart "Ta cible" (modifiable en revenant)
   - **Nom** : bouton "Proposer 6 noms" (IA) → cartes sélectionnables avec justification, OU saisie libre
   - **Couleurs** : palettes de la niche (DB) + bouton "Proposer une palette" (IA) + hex manuels
   - **Avatar** : description + styles (comme avant) → au Suivant, génération des 3 prompts anglais affichés en `CopyBlock` + dimensions logo
   - **Bannière** : idem avec 1 prompt + le bloc dimensions YouTube officielles du Prompt A
   - **Récapitulatif** : "Terminer la configuration" → `completeSession()` → état "Configuration terminée" ; le CTA "Générer mon assistant" reste désactivé ("dernière étape en cours de branchement") — activé au prompt 10 (Trigger.dev)
4. **Chargement** : la page serveur lit session+réponses+niche et hydrate le flow client (reprise là où l'élève s'était arrêté, `current_step`). "Enregistrement automatique" devient réel (indicateur pendant la sauvegarde).
5. **Données de niche depuis la DB** (`niches` : target_examples, palettes, styles) — `lib/mock` n'est plus utilisé par le configurateur (conservé pour chat/admin).
6. **Quota non appliqué** aux appels configurateur (ils sont peu nombreux et nécessaires) — seuls les kinds `chat` compteront (règle AGENTS §6). Statut élève non bloquant (étape 9).
7. États UI : boutons IA avec état loading, erreurs affichées en `Alert`, saisie désactivée pendant sauvegarde.

## Fichiers modifiés / créés

- `package.json` — + `zod`
- `lib/ai/client.ts` — + `generateStructured` (generateObject + usage_event)
- `lib/ai/configurator-prompts.ts` — créé (prompts de reformulation, noms, palette, images — règles du Prompt A verbatim où applicable)
- `lib/db/configurator.ts` — + getOrCreateSession, upsertAnswer, completeSession, getSessionWithAnswers
- `app/(app)/configurateur/actions.ts` — créé (server actions zod)
- `app/(app)/configurateur/page.tsx` — modifié (chargement serveur, hydratation)
- `components/configurator/*` — adaptés (étapes revues, sauvegarde réelle, encarts IA)
- `lib/mock/data.ts` — nettoyage des mocks configurateur devenus inutiles (si plus référencés)

## Sécurité

- Toutes les server actions : session Clerk vérifiée → student résolu côté serveur → zod sur chaque entrée ; le client n'envoie jamais d'id de session/étudiant.
- Appels IA uniquement via `lib/ai/` (usage_event kind configurator systématique).
- Aucun secret côté client.

## Critères d'acceptation

- `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur
- Review Greptile de la PR sans objection restante

## Vérification manuelle

1. `/configurateur` connecté : renseigner la cible (3 champs) → Suivant → l'encart "Ta cible" reformulé par l'IA apparaît ; vérifier en DB : session in_progress + answer `target` (réponse brute + reformulation)
2. Étape Nom : "Proposer 6 noms" → 6 cartes avec justifications ; en choisir une → Suivant → answer `channel_name` en DB
3. Étape Couleurs : "Proposer une palette" → 3 HEX cohérents ; valider
4. Étape Avatar : décrire → Suivant → 3 prompts anglais en CopyBlock (copier fonctionne) ; idem Bannière (1 prompt + dimensions)
5. Recharger la page en cours de parcours → reprise à la bonne étape avec les réponses
6. Récapitulatif → "Terminer la configuration" → session `completed` en DB ; usage_events contient des lignes kind=configurator
7. Mobile : parcours complet sans casse
