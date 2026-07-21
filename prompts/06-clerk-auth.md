# 06 — Authentification Clerk

## Goal

Brancher l'authentification réelle : middleware Clerk protégeant tout sauf les pages publiques, écrans de connexion/inscription, déconnexion fonctionnelle dans le shell, et protection du panneau `/admin` par le rôle `admin` — sans toucher à la logique métier (les pages restent sur mock data).

## Skills et fichiers lus

- `AGENTS.md` (§7 sécurité, §5 stack)
- Skills `clerk-setup` et `clerk-nextjs-patterns` (`.agents/skills/`)
- `node_modules/next/dist/docs/` (middleware/proxy et conventions de la version installée)
- `components/layout/app-shell.tsx`, `app/admin/layout.tsx`, `app/layout.tsx`

## Décisions / hypothèses (résolues seul)

1. **Dépendances ajoutées** : `@clerk/nextjs` (obligatoire) et `@clerk/localizations` (interface Clerk en français via `frFR` — le produit est francophone).
2. **Périmètre des routes** :
   - Publiques : `/` (scaffold provisoire), `/sign-in`, `/sign-up`
   - Protégées (session requise) : `/dashboard`, `/configurateur`, `/chat`, `/historique`, `/activation`, `/design-system`
   - `/admin/*` : session + rôle `admin` (lu depuis `sessionClaims.metadata.role`, stocké dans `publicMetadata` Clerk) ; sinon redirection vers `/dashboard`
   - Non connecté sur une route protégée → redirection `/sign-in`
3. **Écrans d'auth** : pages `app/sign-in/[[...sign-in]]/page.tsx` et `app/sign-up/[[...sign-up]]/page.tsx` avec les composants Clerk (`<SignIn/>`, `<SignUp/>`), centrés, thémés sombre via l'API `appearance` (variables alignées sur nos tokens : fond surface, accent #FF4D2E, radius 10px).
4. **Provider** : `<ClerkProvider>` dans `app/layout.tsx` avec `localization={frFR}`.
5. **Shell élève** : le bouton "Déconnexion" inactif devient un vrai `<SignOutButton>` (redirection `/sign-in` après) ; le prénom mocké du dashboard reste mock (le lien Clerk↔students arrive à l'étape 4 avec Supabase).
6. **Redirections** : après sign-in/sign-up → `/dashboard` (variables d'env Clerk dédiées). Un élève connecté qui visite `/sign-in` est renvoyé vers `/dashboard` (comportement Clerk par défaut).
7. **Rôle admin** : attribué manuellement dans le dashboard Clerk (`publicMetadata` → `{"role": "admin"}`) sur le compte du formateur — procédure documentée dans la vérification manuelle. Aucune UI de gestion de rôles (out of scope).
8. Le statut élève (active/expired/…) n'est PAS vérifié ici — c'est l'étape 4 (Supabase) qui l'apportera ; le middleware ne gère que session + rôle.

## Fichiers modifiés / créés

- `package.json` — + `@clerk/nextjs`, `@clerk/localizations`
- `middleware.ts` (ou convention équivalente de la version de Next.js installée — à confirmer dans les docs au moment de l'implémentation) — créé : `clerkMiddleware` + matchers publiques/admin
- `app/layout.tsx` — modifié : `ClerkProvider` + localisation française
- `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx` — créés
- `components/layout/app-shell.tsx` — modifié : vrai bouton Déconnexion
- `app/admin/layout.tsx` — modifié : suppression du TODO (la protection est réelle), pas d'autre changement
- `.env.local` — complété si besoin (URLs de redirection Clerk) — jamais commité

## Ce qui sera construit

- Middleware de protection complet (session partout sauf publiques, rôle admin sur `/admin/*`).
- Pages sign-in/sign-up thémées design system, en français.
- Déconnexion fonctionnelle.

## Sécurité

- Secret Clerk uniquement côté serveur (`CLERK_SECRET_KEY` dans `.env.local`).
- Vérification du rôle admin côté serveur (middleware + layout), jamais côté client seul.
- Aucune donnée métier exposée : les pages restent sur mock.

## Critères d'acceptation

- `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur
- Review Greptile de la PR sans objection restante

## Vérification manuelle

1. `npm run dev` → visiter `/dashboard` déconnecté → redirigé vers `/sign-in`
2. Créer un compte via `/sign-up` (email ou Google) → atterrit sur `/dashboard`, sidebar visible
3. Cliquer "Déconnexion" → retour à `/sign-in`, `/chat` inaccessible
4. Visiter `/admin` avec un compte sans rôle → redirigé vers `/dashboard`
5. Dans le dashboard Clerk : Users → ton utilisateur → Metadata → **Public** → `{"role": "admin"}` → sauvegarder → revisiter `/admin` → accessible
6. Vérifier que `/sign-in` connecté redirige vers `/dashboard`
