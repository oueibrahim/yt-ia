# 13 — Achat de licence intégré (Checkout Chariow)

## Goal

Permettre à l'élève d'acheter sa licence sans quitter la plateforme : choix du plan (30 ou 90 jours) sur `/activation`, formulaire minimal, redirection vers la page de paiement hébergée par Chariow, retour automatique chez nous après paiement — l'élève termine ensuite avec le formulaire d'activation déjà existant (il reçoit sa clé par e-mail).

## Skills et fichiers lus

- Documentation Chariow Checkout consultée le 24/07/2026 : `POST /v1/checkout` — requis `product_id`, `email`, `first_name`, `last_name`, `phone.number`, `phone.country_code` ; optionnel `custom_metadata`, `redirect_url` ; réponse `payment.checkout_url` (page de paiement Chariow à rediriger), ou `already_purchased`
- `app/activation/actions.ts`, `app/activation/page.tsx`, `lib/chariow/client.ts` (existants)
- AGENTS §4 (`lib/chariow/` seul point d'entrée), §7 sécurité

## Décisions / hypothèses (résolues seul)

1. **Pas d'auto-activation via webhook dans cette V1** : le paiement redirige vers `/activation`, mais l'élève colle sa clé lui-même (reçue par e-mail Chariow) dans le formulaire déjà construit et testé en PR #12. Une auto-liaison silencieuse dépendrait de champs de webhook (`license.issued` porte-t-il `custom_metadata` ou seulement `customer.email` ?) non confirmés dans la documentation — à explorer en V2 une fois un vrai payload observé.
2. **2 plans fixes, en dur** (V1, une seule formation, pas de table plans) : `{ id: "30j", productId: "prd_nby7ikmq", label: "1 mois" }`, `{ id: "90j", productId: "prd_6bkc9wgw", label: "3 mois" }`. Pas d'affichage de prix (non fourni, la page Chariow l'affichera).
3. **Champs requis par Chariow non disponibles via Clerk** : téléphone (`number` + `country_code`). Petit formulaire : prénom/nom pré-remplis depuis Clerk (modifiables), **e-mail non modifiable** (celui du compte, pour la cohérence de corrélation), code pays (2 lettres, ex. CI, FR, SN) + numéro (chiffres uniquement).
4. **Corrélation** : `custom_metadata: { student_id }` envoyé à la création — utile pour un futur rapprochement (V2), pas exploité activement en V1.
5. **`redirect_url`** : construit depuis une nouvelle variable `APP_URL` (serveur uniquement) → `${APP_URL}/activation?checkout=success`. À mettre à jour dans Vercel après déploiement.
6. **Nouvelle fonction** `lib/chariow/client.ts` → `createCheckoutSession(params)` (POST `/checkout`).
7. **Nouvelle server action** `app/activation/actions.ts` → `createCheckoutSessionAction(planId, form)` : session Clerk + `ensureStudent()` requis → zod sur le formulaire → construit le payload → appelle Chariow → `redirect(response.payment.checkout_url)` (Next.js `redirect()` gère une URL externe).
8. **UI** : `/activation` affiche désormais, au-dessus du formulaire de clé existant (inchangé), une section "Choisir un plan" avec 2 cartes + un petit formulaire d'achat (affiché au clic sur "Acheter"). Si `?checkout=success` est présent dans l'URL, une bannière "Paiement reçu, votre clé arrive par e-mail" s'affiche au-dessus du formulaire de clé.
9. Aucune dépendance ajoutée.

## Fichiers modifiés / créés

- `lib/chariow/client.ts` — modifié : + `createCheckoutSession`
- `app/activation/actions.ts` — modifié : + `createCheckoutSessionAction`
- `components/activation/purchase-plans.tsx` — créé
- `app/activation/page.tsx` — modifié : section plans + bannière retour paiement
- `.env.local` — + `APP_URL=http://localhost:3000`

## Sécurité

- Server action protégée par session Clerk + `ensureStudent()`, comme le reste.
- `redirect_url` construit côté serveur depuis `APP_URL` (jamais depuis une entrée utilisateur) — pas de risque d'open redirect.
- Validation zod stricte du formulaire (téléphone, prénom/nom).
- `CHARIOW_API_KEY` toujours strictement serveur.

## Critères d'acceptation

- `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur
- Review Greptile de la PR sans objection restante

## Vérification manuelle

1. `/activation` (sans licence valide) : la section "Choisir un plan" apparaît avec les 2 cartes
2. Cliquer "Acheter" sur un plan → petit formulaire (prénom/nom pré-remplis, e-mail affiché non modifiable, code pays + téléphone) → soumettre
3. Redirection vers une vraie page de paiement Chariow (`payment.chariow.com/checkout?...`)
4. Effectuer un paiement de test → vérifier le retour automatique sur `/activation?checkout=success` avec la bannière de confirmation
5. Coller la clé reçue par e-mail dans le formulaire existant → activation comme testé en PR #12
