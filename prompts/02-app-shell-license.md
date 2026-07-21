# 02 — Shell applicatif + écran d'activation de licence (UI, mock data)

## Goal

Construire la coquille de navigation de l'espace élève (layout partagé) et l'écran d'activation de licence, en affichage seul avec données mockées typées — aucune logique métier, aucun appel API, prêt à être branché plus tard sans retoucher les composants de présentation.

## Skills et fichiers lus

- `AGENTS.md` (§2 produit, §3 out of scope, §4 architecture, §9 qualité)
- `PLAN.md` §3 (modèle de données — les types mock doivent le refléter) et §7 (étape 2)
- `components/ui/` (design system — seule source de style autorisée)
- `app/layout.tsx`, `app/globals.css`

## Décisions / hypothèses (résolues seul)

1. **Types mock centralisés** dans `lib/mock/types.ts` + `lib/mock/data.ts`, calqués sur le modèle de PLAN.md §3 (`Student`, `License`, `Niche`, `Conversation`, …). Quand Supabase arrivera (étape 4), seuls les imports de données changeront, pas les composants.
2. **Structure de routes** :
   - `app/(app)/` — groupe de routes de l'espace élève avec layout partagé (sidebar) : `/dashboard` (accueil élève minimal : statut, raccourcis), `/configurateur`, `/chat`, `/historique` (pages placeholder vides pour l'instant, remplies aux prompts 03-04)
   - `app/activation/page.tsx` — écran d'activation de licence, **hors** du layout sidebar (l'élève n'a pas encore accès à l'app)
   - La homepage `/` reste le scaffold pour l'instant (une landing n'est pas dans le périmètre V1 — l'accueil produit est `/dashboard`)
3. **Shell** : sidebar fixe à gauche sur desktop (logo "Plateforme", nav : Tableau de bord, Configurateur, Assistant, Historique ; en bas : badge statut licence + jours restants, lien Déconnexion inactif), bascule en barre supérieure + menu sur mobile. Composant `components/layout/app-shell.tsx`.
4. **Écran d'activation** : carte centrée, champ clé de licence (format libre), bouton "Activer ma licence" (sans action), états visuels montrés via mock : normal / erreur (clé invalide) / succès (licence activée, expire le …). Lien "Où trouver ma clé ?" vers l'achat Chariow (href `#` pour l'instant).
5. **Aucune logique** : pas de validation réelle, pas de navigation conditionnelle, pas d'auth (étape 3). Les états de l'écran d'activation sont démontrés statiquement (variante par défaut : formulaire vide).
6. Aucune dépendance ajoutée.

## Fichiers modifiés / créés

- `lib/mock/types.ts`, `lib/mock/data.ts` — créés (types + jeu de données Fitness cohérent : 1 élève, 1 licence active, 1 niche)
- `components/layout/app-shell.tsx` — créé (sidebar desktop + topbar mobile, "use client" pour l'état du menu mobile)
- `app/(app)/layout.tsx` — créé (enveloppe AppShell)
- `app/(app)/dashboard/page.tsx` — créé (accueil : salutation, statut licence, 3 cartes raccourcis vers Configurateur/Assistant/Historique)
- `app/(app)/configurateur/page.tsx`, `app/(app)/chat/page.tsx`, `app/(app)/historique/page.tsx` — créés (placeholders titrés, remplis aux prompts suivants)
- `app/activation/page.tsx` — créé

## Ce qui sera construit

- Shell responsive complet réutilisant exclusivement le design system (tokens + primitives).
- Navigation avec état actif (route courante en accent).
- Dashboard mock : nom de l'élève, badge statut, jours restants de licence, raccourcis.
- Écran d'activation avec les 3 états visuels démontrables.
- Textes en français.

## Sécurité

Aucune : pages statiques sur mock, aucune entrée traitée, aucun secret. L'auth et la protection des routes arrivent à l'étape 3.

## Critères d'acceptation

- `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur

## Vérification manuelle

1. `npm run dev`
2. `http://localhost:3000/activation` — carte centrée, champ clé, bouton accent ; pas de sidebar
3. `http://localhost:3000/dashboard` — sidebar à gauche, item "Tableau de bord" actif en accent, badge licence "Actif" + jours restants en bas de sidebar, 3 cartes raccourcis
4. Cliquer Configurateur / Assistant / Historique — pages placeholder, item de nav actif qui suit
5. Vue mobile (DevTools iPhone) — sidebar remplacée par topbar + menu, aucune casse, pas de scroll horizontal
