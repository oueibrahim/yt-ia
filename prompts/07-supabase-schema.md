# 07 — Schéma Supabase, seed Fitness et couche d'accès données

## Goal

Créer le schéma complet de la base (10 tables du PLAN §3, RLS activée), seeder la niche Fitness et la formation, construire la couche d'accès données côté serveur, et brancher les premières vraies données : provisionnement automatique de l'élève à la connexion (lien Clerk ↔ students) et affichage du statut réel dans le dashboard et la sidebar.

## Skills et fichiers lus

- `AGENTS.md` (§4 architecture, §6 modèle de données — règles dures, §7 sécurité)
- `PLAN.md` §3 (colonnes) et §4
- Skills `supabase` et `supabase-postgres-best-practices`
- `docs/reference/prompt-a-chainfit.md` (contenu du seed de la niche)
- `lib/mock/` (types à faire converger), `app/(app)/layout.tsx`, `app/(app)/dashboard/page.tsx`

## Décisions / hypothèses (résolues seul)

1. **Dépendance ajoutée** : `@supabase/supabase-js` uniquement (pas de `@supabase/ssr` : aucun accès client en V1).
2. **Modèle d'accès V1 — tout côté serveur** : les composants/routes serveur utilisent un client Supabase `service_role` (`lib/supabase/server.ts`, jamais importé côté client). **RLS activée sur toutes les tables avec zéro policy pour `anon`/`authenticated`** = toute la base est fermée au public ; seul le serveur passe. C'est conforme à AGENTS §6 (« toute écriture passe côté serveur ») et évite de coupler les JWT Clerk à Supabase en V1. La clé anon reste inutilisée pour l'instant.
3. **Migrations en SQL versionné** : fichiers dans `supabase/migrations/` (`0001_initial_schema.sql`, `0002_seed_fitness.sql`). Application : copier-coller dans le SQL Editor du dashboard Supabase (documenté en vérification manuelle) — pas de CLI liée en V1 (nécessiterait un access token).
4. **Tables** (PLAN §3, toutes avec `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`) :
   - `niches` : slug unique, name, vocabulary jsonb, hook_examples jsonb, default_palette jsonb, script_structures jsonb, is_active bool
   - `formations` : name, niche_id fk, chariow_product_id text null, monthly_message_quota int, access_duration_days int
   - `students` : clerk_user_id text unique, email, formation_id fk, status text check in (pending_license, active, expired, suspended), default `pending_license`
   - `licenses` : license_key text unique, student_id fk null, chariow_payload jsonb null, activated_at, expires_at
   - `configurator_sessions` : student_id fk, current_step text, status text check (in_progress, completed)
   - `configurator_answers` : session_id fk, step text, answer jsonb, updated_at — **unique (session_id, step)** (règle d'upsert)
   - `prompt_b_versions` : student_id fk, version int, content text, source text check (initial, guided_edit, free_edit), is_active bool — **index unique partiel : un seul `is_active=true` par élève** ; unique (student_id, version)
   - `conversations` : student_id fk, title
   - `messages` : conversation_id fk, role text check (user, assistant), command text null, content text, tokens_in int, tokens_out int
   - `usage_events` : student_id fk, kind text check (configurator, prompt_b_generation, chat, image), model text, tokens_in int, tokens_out int — index (student_id, created_at) pour le comptage mensuel
5. **Seed Fitness** : niche `fitness` avec les données déjà mockées (2 exemples de cible, 3 palettes, styles avatar/bannière) + vocabulaire et structures issus du Prompt A (noms des 5 structures longues et 5 formats Shorts) ; formation « Formation YouTube Fitness » (quota 200, accès 30 jours, chariow_product_id null pour l'instant).
6. **Couche d'accès** : `lib/supabase/server.ts` (client service_role, `server-only`) + `lib/db/students.ts` (getStudentByClerkId, ensureStudent — upsert par clerk_user_id avec email + formation Fitness par défaut), `lib/db/licenses.ts` (getActiveLicense). Types DB dans `lib/db/types.ts` (écrits à la main, alignés sur le SQL).
7. **Branchement minimal réel** (le reste des pages reste sur mock) :
   - `app/(app)/layout.tsx` : appelle `ensureStudent()` (crée l'élève `pending_license` à la première visite), lit statut + licence réels, passe à `AppShell` (badge de statut dynamique : Actif/En attente/Expiré/Suspendu, jours restants réels ou « — »)
   - `app/(app)/dashboard/page.tsx` : prénom (depuis Clerk), statut et échéance réels
   - Configurateur/chat/historique/admin : inchangés (branchés aux étapes suivantes)
8. **Pas de vérification de statut bloquante** encore (un `pending_license` voit l'app) — le blocage arrive avec l'activation Chariow (étape 9), pour pouvoir tester le configurateur d'ici là.

## Fichiers modifiés / créés

- `package.json` — + `@supabase/supabase-js`, `server-only`
- `supabase/migrations/0001_initial_schema.sql`, `0002_seed_fitness.sql` — créés
- `lib/supabase/server.ts`, `lib/db/types.ts`, `lib/db/students.ts`, `lib/db/licenses.ts` — créés
- `app/(app)/layout.tsx` — modifié (ensureStudent + données réelles)
- `components/layout/app-shell.tsx` — modifié (badge statut dynamique)
- `app/(app)/dashboard/page.tsx` — modifié (statut réel, prénom Clerk)
- `.env.local` — déjà complété (URL + clés) — jamais commité

## Sécurité

- `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur (`server-only` importé dans `lib/supabase/server.ts`).
- RLS activée partout, aucune policy publique : la base est inaccessible sans la clé service.
- `ensureStudent` lit l'identité depuis la session Clerk serveur (`auth()`/`currentUser()`), jamais depuis le client.

## Critères d'acceptation

- `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur
- Review Greptile de la PR sans objection restante

## Vérification manuelle

1. Dashboard Supabase → SQL Editor → coller `0001_initial_schema.sql` → Run → puis `0002_seed_fitness.sql` → Run
2. Table Editor : vérifier 10 tables, RLS « enabled » partout, 1 ligne dans `niches` et `formations`
3. `npm run dev` → se connecter → `/dashboard` : badge « En attente » (élève auto-créé), pas de crash
4. Table Editor → `students` : une ligne avec ton `clerk_user_id` et ton email, status `pending_license`
5. SQL : `update students set status='active';` + insérer une licence expirant dans 30 jours → recharger `/dashboard` → badge « Actif » + jours restants corrects
6. Vérifier que `/configurateur`, `/chat`, `/historique` fonctionnent toujours (mock inchangé)
