# 05 — Panneau admin (UI, mock data)

## Goal

Construire l'interface du panneau admin du formateur — liste des élèves avec avancement et consommation, et les 3 actions opérationnelles (suspension/réactivation, ajustement de quota, prolongation/révocation de licence) — en affichage seul sur mock data : les actions sont présentées mais inactives, le branchement réel (routes serveur + rôle Clerk admin) arrive aux étapes 3-4 du plan.

## Skills et fichiers lus

- `AGENTS.md` (§2 panneau admin, §6 statuts élève, §7 sécurité `/admin/*`)
- `PLAN.md` §5 point 7 (périmètre admin V1)
- `components/ui/`, `lib/mock/`

## Décisions / hypothèses (résolues seul)

1. **Routes** : `app/admin/layout.tsx` (layout propre : topbar sobre "Plateforme — Admin" + lien retour, PAS la sidebar élève) et `app/admin/page.tsx` (page unique V1 : tableau élèves + carte formation). La protection par rôle Clerk arrive à l'étape 3 — aucune protection en mock.
2. **Mock enrichi** : `mockAdminStudents` (5-6 élèves couvrant les 4 statuts : active, pending_license, expired, suspended) avec étape configurateur atteinte (ou "Terminé"), dernière activité, messages consommés ce mois. Type `AdminStudentRow` dans `lib/mock/types.ts`.
3. **Tableau élèves** (données brutes, pas de graphique — out of scope) : colonnes Élève (nom + email), Statut (Badge), Configurateur (étape/Terminé), Dernière activité, Conso (n / quota), Actions. Sur mobile : le tableau passe en liste de cartes empilées.
4. **Actions par élève** selon statut, toutes **désactivées** avec note "Bientôt disponible" : Suspendre (si active), Réactiver (si suspended), Prolonger la licence / Révoquer (si active ou expired).
5. **Carte formation** au-dessus du tableau : nom de la formation, niche, quota mensuel actuel avec champ numérique + bouton "Enregistrer" désactivé.
6. **Pas de navigation depuis l'espace élève vers /admin** (les élèves ne doivent pas le voir) — accès par URL directe seulement en V1 mock.
7. Composants dans `components/admin/` : `students-table.tsx`, `formation-quota-card.tsx`. Aucune dépendance ajoutée. Textes en français.

## Fichiers modifiés / créés

- `lib/mock/types.ts` — modifié : + `AdminStudentRow`
- `lib/mock/data.ts` — modifié : + `mockAdminStudents`
- `components/admin/students-table.tsx`, `components/admin/formation-quota-card.tsx` — créés
- `app/admin/layout.tsx`, `app/admin/page.tsx` — créés

## Ce qui sera construit

- Page `/admin` complète : carte formation (quota) + tableau des élèves responsive avec badges de statut et actions contextuelles inactives.
- Uniquement les primitives du design system.

## Sécurité

Aucune en mock (pas de données réelles, actions inactives). Dette explicite et assumée : la route sera protégée par le rôle Clerk `admin` à l'étape 3 — noté en commentaire dans le layout.

## Critères d'acceptation

- `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur
- Review Greptile de la PR sans objection restante

## Vérification manuelle

1. `npm run dev` → `/admin`
2. Carte formation : nom, niche Fitness, quota 200 avec champ + bouton désactivé
3. Tableau : 5-6 élèves, badges de statut corrects (Actif vert, En attente jaune, Expiré rouge, Suspendu gris), conso affichée en "n / 200"
4. Actions cohérentes avec le statut (Suspendre sur un actif, Réactiver sur un suspendu…), toutes désactivées
5. Vue mobile : le tableau devient des cartes empilées lisibles, pas de scroll horizontal
