# 01 — Design System

## Goal

Établir la fondation visuelle de la Plateforme — tokens de design, primitives UI réutilisables et une page showcase de validation — selon la direction "sombre énergique" (univers créateurs YouTube), pour que tous les écrans à venir soient construits sur ce système sans jamais restyler en dehors.

## Skills et fichiers lus

- `AGENTS.md` (§2 produit, §9 qualité de code, §10 ordre de construction)
- `PLAN.md` §7 (étape 1)
- `.agents/skills/architect/SKILL.md`
- `app/globals.css` (Tailwind v4, `@theme inline`, tokens par défaut du scaffold)
- `app/layout.tsx` (fonts Geist Sans / Geist Mono déjà chargées via `next/font`)
- `node_modules/next/dist/docs/` (patterns App Router à jour)

## Décisions / hypothèses (résolues seul)

1. **Tailwind v4, tokens CSS-first** : tous les tokens définis dans `app/globals.css` via `@theme` (pas de tailwind.config), utilisables comme classes utilitaires (`bg-surface`, `text-accent`…).
2. **Dark-only en V1** : le produit est sombre par défaut ; pas de toggle de thème (out of scope AGENTS.md). Suppression du `@media (prefers-color-scheme)` du scaffold.
3. **Palette "sombre énergique"** :
   - Fonds : `background` #0B0B0F (quasi-noir bleuté), `surface` #15151C (cartes), `surface-raised` #1D1D26 (éléments surélevés), bordure `border` #2A2A36
   - Accent primaire : `accent` #FF4D2E (rouge-orangé énergique, clin d'œil YouTube sans copier son rouge exact), `accent-hover` #FF6A50, dégradé signature `accent` → #FF8A00 pour les CTA forts
   - Texte : `text-primary` #F5F5F7, `text-secondary` #A0A0B0, `text-muted` #6B6B7B
   - États : `success` #34D399, `warning` #FBBF24, `danger` #F87171, `info` #60A5FA
4. **Typographie** : Geist Sans (déjà chargée) pour tout, Geist Mono pour les blocs de prompt/code (affichage du Prompt B, prompts d'image copiables). Échelle : display 36/40, h1 30, h2 24, h3 20, body 16, small 14, caption 12.
5. **Primitives V1 uniquement** (rien de plus, do not overbuild) : `Button` (primary/secondary/ghost/danger, tailles sm/md, état loading et disabled), `Chip` (sélectionnable — étapes couleurs/catégories), `Badge` (statuts : actif, expiré, suspendu, en attente), `Card`, `Input`, `Textarea`, `Field` (label + erreur), `StepIndicator` (progression du configurateur), `Alert` (info/succès/erreur — quota atteint, licence expirée), `CopyBlock` (bloc mono avec bouton copier — prompts d'image).
6. **Emplacement** : `components/ui/*` (un fichier par primitive), export groupé `components/ui/index.ts`.
7. **Showcase** : page `/design-system` rendant tokens et toutes les primitives dans tous leurs états — outil interne de validation visuelle, non liée à la navigation produit.
8. **Radius et ombres** : radius `md` 10px (contrôles), `lg` 16px (cartes) ; ombres discrètes (le contraste vient des surfaces, pas des ombres).
9. Aucune dépendance ajoutée. Pas de mock data métier ici (ce sera l'étape 2).

## Fichiers modifiés / créés

- `app/globals.css` — remplacé : tokens complets `@theme` (couleurs, radius, ombres), styles de base (body, sélection, scrollbar discrète)
- `app/layout.tsx` — metadata (titre provisoire "Plateforme", lang `fr`), classe body sur tokens
- `components/ui/button.tsx`, `chip.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `field.tsx`, `step-indicator.tsx`, `alert.tsx`, `copy-block.tsx`, `index.ts` — créés
- `app/design-system/page.tsx` — créé (showcase)
- `lib/utils.ts` — créé (helper `cn()` de concaténation de classes, sans dépendance)

## Ce qui sera construit

- Couche de tokens complète dans `globals.css`, consommable en classes Tailwind.
- Les 10 primitives listées, typées strictement (props TypeScript, pas de `any`), composants serveur par défaut, `"use client"` uniquement pour `Chip` (sélection), `CopyBlock` (clipboard) et `Button` si état loading contrôlé.
- Page showcase `/design-system` : sections Couleurs, Typographie, Boutons, Chips & Badges, Formulaires, StepIndicator, Alertes, CopyBlock, Carte exemple.
- Textes d'interface en français.

## Sécurité

Aucune surface d'attaque : pas de route API, pas de données, page showcase statique. Rien à protéger à ce stade (l'auth arrive à l'étape 3).

## Critères d'acceptation

- `npx tsc --noEmit` sans erreur
- `npm run lint` sans erreur
- `npm run build` sans erreur

## Vérification manuelle

1. `npm run dev`
2. Ouvrir `http://localhost:3000/design-system`
3. Vérifier : fond sombre #0B0B0F, accent rouge-orangé sur les boutons primaires, dégradé sur le CTA fort, hover visibles sur boutons et chips
4. Cliquer un `Chip` → état sélectionné (bordure/fond accent) ; cliquer le bouton copier d'un `CopyBlock` → feedback "Copié"
5. Passer en vue mobile (iPhone, DevTools) → aucune casse de layout, pas de scroll horizontal
6. `http://localhost:3000` (homepage scaffold) doit toujours s'afficher sans erreur console
