# 11 — Chat réel : streaming, commandes, quota, historique branché

## Goal

Remplacer le chat mock par l'espace de chat réel : le Prompt B actif comme system prompt permanent, streaming via Vercel AI SDK, parsing de `/script` et `/short` (structure imposée par la niche), quota mensuel bloquant vérifié avant tout appel, persistance des conversations/messages, et l'historique qui lit les vraies données.

## Skills et fichiers lus

- `AGENTS.md` (§2 espace de chat, §6 quota bloquant + prompt_b actif requis, §7)
- Skill `ai-sdk` — lu `node_modules/ai/docs/04-ai-sdk-ui/02-chatbot.mdx` et `03-chatbot-message-persistence.mdx` (version installée `ai@7.0.34`, pattern à jour : `useChat` + `DefaultChatTransport`, route handler avec `streamText` + `createUIMessageStreamResponse`/`toUIMessageStream`, sauvegarde via `onEnd`)
- `docs/reference/prompt-a-chainfit.md` (règles /script et /short, structures, règles absolues)
- `lib/ai/client.ts`, `lib/db/prompt-b.ts`, `lib/db/usage.ts`, `supabase/migrations/0001` (conversations, messages)
- `components/chat/*` (à remplacer), `app/(app)/historique/page.tsx`

## Décisions / hypothèses (résolues seul)

1. **Dépendance ajoutée** : `@ai-sdk/react` (hook `useChat`, absent du projet).
2. **Route handler** `app/api/chat/route.ts` (seule route API du projet — server actions partout ailleurs, mais `useChat` requiert un endpoint HTTP streamable) :
   - session Clerk → student → **statut `active` requis** sinon 403 avec message clair (licence non active bloque le chat, historique restant lisible par ailleurs)
   - **quota du mois courant** : compte les `usage_events` (kind=chat, created_at dans le mois) du student vs `formations.monthly_message_quota` ; si atteint → 403 avant tout appel LLM (aucun coût engagé)
   - **Prompt B actif requis** (`getActivePromptB`) sinon 409 « Terminez d'abord votre configurateur »
   - reçoit `{ message, conversationId }` (id créé côté client avant le premier message si absent — via server action `createConversation`)
   - **parsing de la commande** : si le texte commence par `/script` ou `/short`, on injecte dans le prompt système un rappel de la structure correspondante (tirée de `niches.script_structures`) ; sinon message libre normal (l'assistant reste utilisable en conversation, conforme au Prompt A)
   - `streamText({ system: promptB.content + rappel de structure, messages })`, `onEnd` : sauvegarde les 2 messages (user + assistant) en DB avec leur `command`, et enregistre un **unique** `usage_event` (kind=chat) avec les tokens réels de la réponse
3. **Composants réécrits sur données réelles** (mêmes primitives visuelles qu'avant, mêmes noms de fichiers) :
   - `chat-view.tsx` : charge conversations + messages du student depuis le serveur (page serveur), utilise `useChat` avec `DefaultChatTransport({ api: "/api/chat" })`, gère la sélection de conversation, création (« Nouvelle conversation » redevient active), erreurs serveur affichées (quota atteint / licence / pas d'assistant) via `Alert`
   - `chat-input.tsx` : branché à `sendMessage` de `useChat`, désactivé si `status !== "ready"` ou quota atteint (calculé côté serveur, passé en prop)
   - `conversation-list.tsx` : données réelles, bouton « Nouvelle conversation » actif
   - `quota-banner.tsx` : reçoit le vrai `used`/`limit`
4. **Historique** (`app/(app)/historique/page.tsx`) : lit les messages assistant avec `command` non nul du student depuis la DB (remplace les mocks), lien « Ouvrir la conversation » pointe vers `/chat?conversation=<id>`.
5. **`lib/db/messages.ts`** (nouveau) : `createConversation`, `getConversations`, `getMessages`, `saveMessagePair`, `countMonthlyChatUsage`. **`lib/mock/`** n'est plus utilisé par le chat/historique (conservé pour l'admin, étape suivante).
6. **Titre de conversation** : dérivé du premier message (tronqué), mis à jour à la création — pas d'édition manuelle (hors scope V1).

## Fichiers modifiés / créés

- `package.json` — + `@ai-sdk/react`
- `app/api/chat/route.ts` — créé
- `app/(app)/chat/actions.ts` — créé (createConversation, getQuotaStatus)
- `lib/db/messages.ts` — créé
- `components/chat/chat-view.tsx`, `chat-input.tsx`, `conversation-list.tsx`, `quota-banner.tsx` — réécrits
- `app/(app)/chat/page.tsx` — modifié (chargement serveur)
- `app/(app)/historique/page.tsx` — modifié (données réelles)

## Sécurité

- La route `/api/chat` vérifie systématiquement, dans l'ordre : session → statut élève actif → quota → Prompt B actif — avant tout appel LLM (AGENTS §7).
- Le `conversationId` du client est vérifié appartenir au student courant côté serveur avant toute lecture/écriture.
- Aucune clé API côté client. Tout appel LLM passe par `streamText` avec le modèle de `lib/ai/client.ts` (même `OPENAI_MODEL`).

## Critères d'acceptation

- `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur
- Review Greptile de la PR sans objection restante

## Vérification manuelle

1. Prérequis : un élève avec `status=active`, une session configurateur `completed`, un Prompt B actif généré (étapes précédentes)
2. `/chat` : « Nouvelle conversation » → taper un message libre → réponse en streaming de l'assistant personnalisé (persona/tagline reconnaissables)
3. Taper `/script un sujet fitness` → la réponse suit une des 5 structures longues ; `/short un sujet` → un des 5 formats courts
4. Vérifier en DB : `conversations` (1 ligne), `messages` (paires user/assistant avec `command`), `usage_events` (kind=chat, 1 ligne par échange)
5. `/historique` : les scripts/shorts générés apparaissent, groupés par date
6. Test quota : en DB, insérer assez de `usage_events` kind=chat pour atteindre `monthly_message_quota` → recharger `/chat` → saisie désactivée + bannière quota atteint ; la route API renvoie 403 si appelée quand même
7. Test licence : passer `students.status` à `expired` → `/chat` doit refuser l'envoi avec un message clair, `/historique` reste accessible
8. Mobile : parcours complet sans casse
