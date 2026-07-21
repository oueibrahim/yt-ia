# 03 — Configurateur (UI, mock data)

## Goal

Construire l'interface complète de la machine à états du configurateur — cible → nom de chaîne → couleurs → avatar → bannière → récapitulatif — navigable en avant et en arrière, avec état local uniquement (aucune persistance, aucun appel API) : la sauvegarde en base et la génération du Prompt B seront branchées aux étapes 4 et 6 sans retoucher les composants de présentation.

## Skills et fichiers lus

- `AGENTS.md` (§2 couche 1, §3 out of scope, §9 qualité)
- `PLAN.md` §4 (couche 1 : ordre fixe, retour en arrière, niche = données)
- `components/ui/` (design system), `components/layout/app-shell.tsx`
- `lib/mock/types.ts`, `lib/mock/data.ts`

## Décisions / hypothèses (résolues seul)

1. **Machine à états côté client** : composant `"use client"` avec un state `{ currentStep, answers }` ; types des réponses ajoutés dans `lib/mock/types.ts` (`ConfiguratorAnswers` : target, channelName, colors, avatar, banner). L'étape 4 remplacera ce state local par la persistance Supabase (upsert par étape).
2. **Données de niche mockées** : `lib/mock/data.ts` enrichi avec les données Fitness que la niche fournira en base — 3 palettes de couleurs proposées, exemples de cibles, suggestions de descripteurs d'avatar/bannière. L'UI lit ces données, jamais de valeurs en dur dans les composants.
3. **Les 5 étapes + récapitulatif** :
   - **Cible** : textarea guidée (qui, tranche d'âge, objectif) + 2 exemples cliquables issus de la niche
   - **Nom de chaîne** : input + règle d'aide (court, mémorisable)
   - **Couleurs** : 3 palettes proposées (issues de la niche) sélectionnables via cartes-swatch, ou personnalisation via 2 champs hex (principale, secondaire) avec aperçu
   - **Avatar** : description libre (textarea) + chips de style suggérés (ex. réaliste, cartoon, mascotte) — pas de génération ici, le prompt d'image copiable arrive à l'étape 8 du plan
   - **Bannière** : même modèle que l'avatar (description + chips d'ambiance)
   - **Récapitulatif** : toutes les réponses en cartes avec bouton "Modifier" (retourne à l'étape), CTA final "Générer mon assistant" **désactivé** avec note "Disponible bientôt" (branché à l'étape 6)
4. **Navigation** : `StepIndicator` en haut (étape courante), boutons Précédent/Suivant ; Suivant désactivé tant que l'étape n'a pas de réponse valide (validation minimale de présence, pas de règles métier) ; les réponses sont conservées quand on revient en arrière.
5. **Mention "Enregistrement automatique"** discrète (statique en mock) pour préparer l'UX de la vraie sauvegarde.
6. Composants dans `components/configurator/` : un composant par étape + `configurator-flow.tsx` (orchestrateur). Page `/configurateur` = rendu du flow.
7. Aucune dépendance ajoutée. Textes en français.

## Fichiers modifiés / créés

- `lib/mock/types.ts` — modifié : + `ConfiguratorAnswers`, `ColorPalette`, `NicheContent`
- `lib/mock/data.ts` — modifié : + `mockNicheContent` (palettes, exemples de cible, chips avatar/bannière)
- `components/configurator/configurator-flow.tsx` — créé ("use client", machine à états)
- `components/configurator/step-target.tsx`, `step-channel-name.tsx`, `step-colors.tsx`, `step-avatar.tsx`, `step-banner.tsx`, `step-summary.tsx` — créés
- `app/(app)/configurateur/page.tsx` — modifié : rend le flow

## Ce qui sera construit

- Le parcours complet des 5 étapes + récapitulatif, ordre fixe, retour arrière sans perte de réponses.
- Sélections visuelles (palettes, chips) construites sur les primitives du design system exclusivement.
- États vides/valides gérés (bouton Suivant conditionné), responsive mobile.

## Sécurité

Aucune : état local en mémoire, aucune entrée transmise, aucun secret.

## Critères d'acceptation

- `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur

## Vérification manuelle

1. `npm run dev` → `/configurateur`
2. Étape Cible : cliquer un exemple → textarea remplie ; Suivant s'active
3. Parcourir les 5 étapes en remplissant ; à Couleurs, sélectionner une palette puis tester les champs hex personnalisés (aperçu mis à jour)
4. Revenir en arrière (Précédent) → les réponses sont conservées
5. Récapitulatif : chaque carte "Modifier" ramène à la bonne étape ; le CTA "Générer mon assistant" est désactivé avec la note
6. Vue mobile : StepIndicator lisible (numéros seuls), aucune casse
