# 12 — Licences Chariow : activation réelle, webhook Pulses, expiration automatique

## Goal

Remplacer l'écran d'activation mock par le vrai flux Chariow : vérification de la clé via l'API Chariow, liaison à l'élève, passage du statut à `active` ; recevoir les événements de licence en temps quasi réel via un webhook (Pulse) ; et un filet de sécurité quotidien (Trigger.dev) qui expire automatiquement les élèves dont la licence n'est plus valide.

## Skills et fichiers lus

- `AGENTS.md` (§4 `lib/chariow/` seul point d'entrée, §6 règles licence/statut, §7 sécurité)
- `PLAN.md` (modèle de licence pass, risques §12 dérive de coût / support)
- Documentation Chariow consultée le 24/07/2026 : `chariow.dev/api-reference/introduction`, `chariow.dev/en/guides/licenses.md`, `chariow.dev/en/guides/pulses.md`, `help.chariow.com/fr/articles/147-...`, `chariow.com/fr/licenses`
- `lib/db/licenses.ts`, `lib/db/students.ts`, `lib/db/types.ts`, `supabase/migrations/0001` (table `licenses`), `app/activation/page.tsx`, `proxy.ts`, `trigger/generate-prompt-b.ts` (pattern de tâche existant)

## Ce que dit la doc Chariow (résumé retenu)

- **Licences** : `GET /v1/licenses/{key}` renvoie `status` (`pending_activation`|`active`|`expired`|`revoked`), `expires_at`, `customer.email`, `product.id`. Génération automatique à l'achat d'un produit de type Licence.
- **Pulses (webhooks)** : configurés dans le dashboard Chariow (Automation → Pulses), URL HTTPS obligatoire. Événements utiles : `license.activated`, `license.expired`, `license.revoked`. Retry sur 5 tentatives (~27h) si non-200.
- ⚠️ **Aucune vérification de signature documentée** (pas de header/secret HMAC). Parade retenue ci-dessous.

## Décisions / hypothèses (résolues seul)

1. **Génération des clés : option automatique Chariow** (pas d'import CSV) — confirmé par le fonctionnement déjà prévu au PLAN ("l'élève achète, reçoit une clé, l'active sur la plateforme"). Le formateur crée ses produits de type Licence dans son dashboard Chariow (action manuelle, hors code).
2. **V1 = une seule formation (Fitness)** : `ensureStudent` rattache déjà tout nouvel élève à l'unique formation seedée. Pas besoin de mapper un `chariow_product_id` vers une formation pour l'instant — `formations.chariow_product_id` reste informatif, non utilisé par la logique.
3. **`lib/chariow/client.ts`** : un seul appel nécessaire, `getLicense(key)` (le endpoint `/activate` de Chariow sert au *device activation* d'un logiciel installable, hors sujet ici — notre "activation" = lier la licence à un compte élève, géré entièrement dans notre base). Bearer token (`CHARIOW_API_KEY`), base URL `https://api.chariow.com/v1`, gestion d'erreur HTTP explicite.
4. **Activation réelle** (`app/activation/actions.ts` → `activateLicenseAction`) : session Clerk requise → `ensureStudent()` → **garde anti-abus** (voir point 4bis) → validation zod de la clé saisie → `getLicense(key)` → rejet si `status` ∉ {`active`} (message clair par cas : en attente, expirée, révoquée) ou si déjà liée à un **autre** élève → upsert `licenses` (onConflict `license_key` : `student_id`, `chariow_payload`, `activated_at=now()`, `expires_at`) → `students.status='active'`. Le même flux couvre nativement une réactivation ou un upgrade (nouvelle clé après un nouvel achat) : `getActiveLicense` (déjà en place) retient toujours la ligne dont `expires_at` est le plus tardif.

4bis. **Anti-abus** (faille identifiée en revue : la clé API Chariow est limitée à 100 req/min, *partagée entre tous les élèves* — sans garde, un élève pourrait soumettre des clés au hasard en boucle et épuiser ce quota pour tout le monde). Nouvelle table `license_activation_attempts` (student_id, created_at) : avant d'appeler Chariow, on compte les tentatives du student sur les 10 dernières minutes ; au-delà de 5, rejet immédiat ("Trop de tentatives, réessayez dans quelques minutes") **sans appeler l'API Chariow**. Chaque tentative (succès ou échec) est journalisée.
5. **Sécurité du webhook — pas de signature disponible, défense en profondeur retenue** :
   - Jeton secret dans l'URL du Pulse (`?token=CHARIOW_WEBHOOK_SECRET`), vérifié en premier — 401 sinon.
   - **Le corps du webhook n'est jamais utilisé pour muter l'état.** Il sert uniquement à savoir *quelle* licence re-vérifier ; l'état réel vient toujours d'un appel `getLicense(key)` à l'API Chariow (serveur à serveur) avant toute écriture.
   - Réponse 200 rapide même sur événement ignoré (évite les retries inutiles de Chariow).
6. **Mapping des statuts** : `license.expired` et `license.revoked` ⇒ `students.status='expired'` (le statut `suspended` reste réservé à l'action manuelle de l'admin, pour ne pas mélanger les sémantiques). `license.activated` ⇒ upsert du cache local + `active` si un élève est déjà lié.
7. **Le webhook pré-alimente la table `licenses`** même avant qu'un élève l'active chez nous (upsert par `license_key`, `student_id` reste `null` tant que personne ne l'a saisie sur `/activation`) — trace d'audit utile, aucun risque.
8. **Filet de sécurité** : tâche planifiée quotidienne Trigger.dev (`trigger/expire-licenses.ts`, `schedules.task`, cron `0 3 * * *`) — pour chaque élève `status='active'`, si `getActiveLicense` (déjà existant) ne renvoie plus de licence valide, passe `status='expired'`. Couvre un Pulse définitivement manqué après les 5 tentatives de Chariow.
9. **Route webhook exemptée de l'auth Clerk** (`proxy.ts` : ajout de `/api/webhooks/chariow(.*)` aux routes publiques) — appel serveur à serveur sans session utilisateur, sécurisé par le jeton uniquement.
10. Aucune dépendance ajoutée (fetch natif).

## Fichiers modifiés / créés

- `supabase/migrations/0004_license_activation_attempts.sql` — créé (table + index anti-abus)
- `lib/chariow/client.ts` — créé (`getLicense`)
- `lib/db/licenses.ts` — modifié : + `linkLicenseToStudent`, `upsertLicenseFromChariow`, `getLicenseByKey`, `countRecentActivationAttempts`, `recordActivationAttempt`
- `app/activation/actions.ts` — créé (`activateLicenseAction`)
- `app/activation/page.tsx` — modifié : formulaire réel, suppression du mock `?state=`
- `app/api/webhooks/chariow/route.ts` — créé
- `proxy.ts` — modifié : route publique ajoutée
- `trigger/expire-licenses.ts` — créé
- `.env.local` — + `CHARIOW_API_KEY`, `CHARIOW_WEBHOOK_SECRET` (secret généré aléatoirement)

## Sécurité

- `CHARIOW_API_KEY` strictement serveur (`server-only`).
- Webhook : jeton obligatoire, jamais de mutation d'état depuis un champ du payload non revérifié.
- Activation : session + garde anti-abus (5 tentatives/10 min) + zod + vérification d'appartenance (une licence = un seul élève).
- Route webhook publique uniquement pour Clerk ; protégée par le jeton applicatif.

## Limites connues, assumées pour la V1

- Fenêtre d'accès résiduelle en cas d'échec du webhook : jusqu'à ~24h (cycle du cron quotidien), le webhook couvrant déjà quasi tous les cas en quasi temps réel (retries Chariow sur ~27h).
- Le jeton du webhook transite en query string (visible dans les logs serveur) — compromis standard pour ce type de webhook sans signature ; sans impact réel grâce à la revérification systématique côté Chariow avant toute écriture.

## Critères d'acceptation

- `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur
- Review Greptile de la PR sans objection restante

## Vérification manuelle

**Prérequis côté toi** : dans le dashboard Chariow → Settings → API, génère une clé API et donne-la-moi (`CHARIOW_API_KEY`) ; crée au moins un produit de type Licence pour obtenir une vraie clé de test.

1. `/activation` : saisir une vraie clé de test → redirection `/dashboard`, badge "Actif" ; vérifier en base la ligne `licenses` (`expires_at` correct, `student_id` renseigné)
2. Saisir une clé invalide/inexistante → message d'erreur clair, pas de redirection
2bis. Soumettre 6 clés invalides d'affilée en moins de 10 minutes → la 6e est rejetée sans appel à Chariow ("Trop de tentatives")
3. Webhook sans jeton : `curl -X POST http://localhost:3000/api/webhooks/chariow -d '{}'` → 401
4. Test webhook réel (nécessite une URL publique — ngrok ou déploiement) : créer une Pulse Chariow vers `https://<url>/api/webhooks/chariow?token=<secret>`, cocher `license.activated`/`expired`/`revoked`, "Envoyer un pulse test" → vérifier la mise à jour en base
5. Cron : lancer un run test de `expire-licenses` depuis le dashboard Trigger.dev sur un élève dont la licence est expirée → `students.status` passe à `expired`
