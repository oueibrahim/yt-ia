# 10 — Job Trigger.dev : génération du Prompt B + activation du CTA

## Goal

Activer le bouton « Générer mon assistant » : au clic, un job Trigger.dev asynchrone appelle `generatePromptB` (couche IA existante), l'UI suit l'avancement (génération en cours → assistant prêt), et l'élève voit son assistant créé — le tout sans bloquer la requête web.

## Skills et fichiers lus

- `AGENTS.md` (§4 Async = trigger/, §5 stack)
- Skills `trigger-tasks` et `trigger-config`
- `lib/ai/prompt-b.ts` (generatePromptB existant), `lib/db/prompt-b.ts` (getActivePromptB)
- `components/configurator/step-summary.tsx`, `app/(app)/configurateur/actions.ts`

## Décisions / hypothèses (résolues seul)

1. **Dépendance ajoutée** : `@trigger.dev/sdk` (v4). `trigger.config.ts` à la racine avec `project: "proj_pdhjqbcksjgxqmzoxejf"`, dossier `trigger/`.
2. **Tâche** `trigger/generate-prompt-b.ts` : `task({ id: "generate-prompt-b" })`, payload `{ studentId: string }`, exécute `generatePromptB(studentId)` ; retry par défaut du SDK (le versioning est sûr grâce à la fonction SQL atomique de la migration 0003 — un retry ne peut pas corrompre l'état).
3. **Déclenchement** : nouvelle server action `requestAssistantGeneration()` — vérifie session Clerk → student → session configurateur `completed` → pas de génération déjà en cours → `tasks.trigger("generate-prompt-b", { studentId })` → stocke le `runId` retourné en mémoire de réponse (pas en DB : la présence d'un `prompt_b_versions` actif fait foi).
4. **Suivi côté UI (simple et robuste)** : après le déclenchement, le récapitulatif passe en état « Génération en cours… » et **poll toutes les 5 s** une server action `getAssistantStatus()` qui renvoie `{ ready: boolean, assistantName?: string }` (lit `getActivePromptB` ; le nom est extrait de la première ligne du contenu). À `ready` : carte « 🎉 Votre assistant [NOM] est prêt » + lien vers `/chat` (le chat reste mock jusqu'à l'étape 7 — mention affichée). Pas de realtime Trigger.dev en V1 (simplicité).
5. **Regénération** : si un Prompt B actif existe déjà, le CTA affiche « Régénérer mon assistant » avec confirmation (crée une nouvelle version, l'ancienne reste en base, inactive) — conforme au versioning AGENTS §6.
6. **Dev** : `npx trigger.dev@latest dev` doit tourner pour exécuter les jobs en local (documenté en vérification). `TRIGGER_SECRET_KEY` déjà dans `.env.local`.
7. Le chat et l'historique ne sont pas touchés (étape 7 du plan).

## Fichiers modifiés / créés

- `package.json` — + `@trigger.dev/sdk`
- `trigger.config.ts` — créé (project ref, dirs)
- `trigger/generate-prompt-b.ts` — créé
- `app/(app)/configurateur/actions.ts` — + `requestAssistantGeneration`, `getAssistantStatus`
- `components/configurator/step-summary.tsx` — CTA actif + états (idle/génération/prêt/régénérer)
- `components/configurator/configurator-flow.tsx` — état de génération + polling

## Sécurité

- Le déclenchement exige : session Clerk → student résolu serveur → session configurateur `completed`. Le client n'envoie aucun identifiant.
- `TRIGGER_SECRET_KEY` serveur uniquement. Le job tourne côté Trigger.dev avec les env du projet (à configurer dans leur dashboard pour la prod ; en dev, `trigger dev` lit `.env.local`).
- Toute la génération passe par `lib/ai/` (usage_event kind prompt_b_generation, déjà en place).

## Critères d'acceptation

- `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur
- Review Greptile de la PR sans objection restante

## Vérification manuelle

1. Terminal A : `npm run dev` — Terminal B : `npx trigger.dev@latest dev` (login au premier lancement)
2. `/configurateur` avec la configuration terminée → le CTA « Générer mon assistant » est actif → cliquer
3. État « Génération en cours… » ; dans le dashboard Trigger.dev : le run `generate-prompt-b` apparaît et se termine en succès (~30-60 s)
4. L'UI bascule sur « Votre assistant [NOM] est prêt » avec le lien vers l'assistant
5. Supabase : `prompt_b_versions` contient une ligne `version=1, is_active=true, source=initial` ; `usage_events` a une ligne kind=prompt_b_generation
6. Cliquer « Régénérer mon assistant » → confirmer → nouvelle ligne `version=2` active, la v1 passe `is_active=false`
