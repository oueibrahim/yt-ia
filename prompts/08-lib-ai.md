# 08 — Couche IA (lib/ai) et méta-prompt du Prompt B

## Goal

Construire le point d'entrée unique vers OpenAI (`lib/ai/`) — abstraction fournisseur interchangeable, journalisation systématique en `usage_events` — et le méta-prompt de génération du Prompt B fidèle au Prompt A de référence, avec une fonction `generatePromptB` prête à être appelée par le job Trigger.dev (étape 6) et un script de test local.

## Skills et fichiers lus

- `AGENTS.md` (§4 IA = seul point d'entrée, §6 usage_events, §7)
- `PLAN.md` §4 (couche 2, règles du Prompt B)
- `docs/reference/prompt-a-chainfit.md` (règles de génération, à reprendre TEL QUEL)
- Skill `ai-sdk` (Vercel AI SDK)
- `lib/supabase/server.ts`, `lib/db/` (types, accès), `supabase/migrations/0001` (usage_events)

## Décisions / hypothèses (résolues seul)

1. **Dépendances ajoutées** : `ai` (Vercel AI SDK), `@ai-sdk/openai`, et `tsx` (dev, pour le script de test).
2. **Abstraction** : `lib/ai/client.ts` expose `generateCompletion({ system, prompt, studentId, kind })` — appelle OpenAI via AI SDK (`generateText`), **enregistre toujours un usage_event** (student_id, kind, model, tokens in/out) avant de retourner. Le modèle vient de `OPENAI_MODEL` (env, défaut raisonnable type gpt-5-mini) — changer de fournisseur = changer ce seul fichier.
3. **Méta-prompt Prompt B** (`lib/ai/prompt-b.ts`) :
   - `buildPromptBMetaPrompt(answers, niche)` : system prompt = les règles de l'ÉTAPE 6 du Prompt A **verbatim** (nom [CHAÎNE]BOT, persona originale, tagline inédite, quantités exactes de phrases signature, 5 structures longues + 5 formats Shorts, 7 commandes, description d'avatar reprise) + contexte niche (vocabulaire, structures depuis la table `niches`) ; user prompt = récapitulatif des réponses du configurateur (cible reformulée, nom, couleurs HEX, descriptions avatar/bannière).
   - `generatePromptB(studentId)` : lit les réponses du configurateur et la niche en base, appelle `generateCompletion` (kind `prompt_b_generation`), insère une nouvelle ligne `prompt_b_versions` (version = max+1, source `initial`, `is_active=true` en désactivant l'ancienne dans une même opération), retourne la version créée.
   - La sortie V1 ne contient que les commandes `/script` et `/short` dans la section commandes du Prompt B généré (les autres sont hors périmètre V1 — le méta-prompt l'impose explicitement).
4. **Accès données ajoutés** : `lib/db/niches.ts` (getNicheForStudent via formation), `lib/db/configurator.ts` (getCompletedAnswers(studentId) — lecture seule ici, l'écriture arrive avec le branchement du configurateur), `lib/db/prompt-b.ts` (insertVersion avec bascule d'activation), `lib/db/usage.ts` (recordUsageEvent).
5. **Script de test** : `scripts/generate-prompt-b-preview.ts` (lancé via `npx tsx`) — prend des réponses d'exemple en dur (pas besoin d'un configurateur branché), appelle le méta-prompt + OpenAI, affiche le Prompt B généré en console et n'écrit PAS en base (mode aperçu, mais logue l'usage_event si un student_id réel est fourni en argument ; sans argument : aperçu pur sans DB).
6. **Aucune route API, aucune UI** — le déclenchement à la complétion du configurateur arrive à l'étape 6 (Trigger.dev). Le chat n'est pas touché.

## Fichiers modifiés / créés

- `package.json` — + `ai`, `@ai-sdk/openai`, `tsx` (dev)
- `lib/ai/client.ts`, `lib/ai/prompt-b.ts` — créés
- `lib/db/niches.ts`, `lib/db/configurator.ts`, `lib/db/prompt-b.ts`, `lib/db/usage.ts` — créés
- `scripts/generate-prompt-b-preview.ts` — créé
- `.env.local` — `OPENAI_API_KEY` (déjà en place), `OPENAI_MODEL` optionnel

## Sécurité

- `OPENAI_API_KEY` serveur uniquement ; `lib/ai/*` et `lib/db/*` importent `server-only` (sauf le script CLI qui charge dotenv explicitement).
- Tout appel LLM passe par `generateCompletion` → usage_event systématique (règle AGENTS §4).
- Aucune entrée client ici (pas de route exposée).

## Critères d'acceptation

- `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur
- Review Greptile de la PR sans objection restante

## Vérification manuelle

1. Prérequis : migrations 0001/0002 appliquées (PR #6), `OPENAI_API_KEY` en place
2. `npx tsx scripts/generate-prompt-b-preview.ts` → affiche en console un Prompt B complet : nom `[CHAÎNE]BOT`, persona, tagline, phrases signature aux bonnes quantités (3/3/2/2/4/3), les 5 structures longues et 5 formats Shorts adaptés à la cible d'exemple, commandes /script et /short uniquement
3. Relancer une 2e fois → persona et tagline différentes (originalité à chaque génération)
4. Vérifier la structure Markdown (titres ##, séparateurs ---) prête à servir de system prompt
