# 04 — Espace de chat + historique (UI, mock data)

## Goal

Construire l'interface de l'espace de chat de l'assistant personnalisé (conversations, fil de messages, saisie avec commandes, compteur de quota) et la page historique des scripts — en affichage seul sur mock data, sans aucun appel LLM ni persistance : le branchement réel arrive à l'étape 7 du plan sans retoucher les composants de présentation.

## Skills et fichiers lus

- `AGENTS.md` (§2 espace de chat, §3 out of scope, §6 règles de données)
- `PLAN.md` §3 (conversations, messages) et §4 (espace de chat)
- `docs/reference/prompt-a-chainfit.md` (commandes et formats produits par l'assistant)
- `components/ui/`, `components/layout/app-shell.tsx`, `lib/mock/`

## Décisions / hypothèses (résolues seul)

1. **Types mock ajoutés** : `Conversation` (id, title, createdAt) et `Message` (id, conversationId, role user|assistant, command null|"script"|"short", content, createdAt) dans `lib/mock/types.ts`, + `mockConversations` / `mockMessages` dans `lib/mock/data.ts` : 2 conversations Fitness réalistes, dont une avec un échange `/script` complet (début de script "Mythe Brisé" cohérent avec le Prompt A) et un `/short`.
2. **Layout du chat** (`/chat`) : colonne conversations à gauche (bouton "Nouvelle conversation" inactif, liste avec titre + date, conversation active surlignée) ; fil de messages à droite (bulles user alignées à droite sur surface-raised, réponses assistant à gauche avec nom de l'assistant "FITBOT" mocké, rendu des sauts de ligne) ; zone de saisie en bas avec 2 chips-raccourcis `/script` et `/short` (cliquer préfixe la saisie), bouton Envoyer **désactivé** avec tooltip/note "Bientôt disponible". Sur mobile : la liste de conversations se replie (vue fil par défaut, bouton retour vers la liste).
3. **Compteur de quota** : bandeau discret au-dessus de la saisie — "128 / 200 messages ce mois-ci" avec barre de progression (mock), et variante pleine (`Alert` danger "Quota atteint") démontrable via `?quota=full`.
4. **Historique** (`/historique`) : liste des productions de l'assistant (messages assistant avec command non null), groupées par date (Aujourd'hui / Cette semaine / Plus ancien), cartes : titre déduit, badge commande (/script vert-neutre, /short accent), extrait 2 lignes, lien "Ouvrir la conversation" vers `/chat` (sans ancre précise en mock). État vide prévu (message + CTA vers le chat).
5. **La saisie n'envoie rien** (aucune logique d'envoi, pas d'écho local) — l'étape 7 branchera le streaming AI SDK. Aucune modification du Prompt B depuis le chat (règle d'architecture).
6. Composants dans `components/chat/` : `conversation-list.tsx`, `message-bubble.tsx`, `chat-input.tsx`, `quota-banner.tsx`, `chat-view.tsx` (orchestrateur client). Pages : `app/(app)/chat/page.tsx`, `app/(app)/historique/page.tsx`.
7. Aucune dépendance ajoutée. Textes en français.

## Fichiers modifiés / créés

- `lib/mock/types.ts` — modifié : + `Conversation`, `Message`
- `lib/mock/data.ts` — modifié : + `mockAssistantName`, `mockConversations`, `mockMessages`, `mockQuotaUsed`
- `components/chat/chat-view.tsx`, `conversation-list.tsx`, `message-bubble.tsx`, `chat-input.tsx`, `quota-banner.tsx` — créés
- `app/(app)/chat/page.tsx` — modifié (rend ChatView, lit `?quota=full`)
- `app/(app)/historique/page.tsx` — modifié (liste groupée par date depuis les mocks)

## Ce qui sera construit

- Chat 2 colonnes responsive avec sélection de conversation (état local), fil scrollable, chips de commandes, quota visible.
- Historique groupé par date avec badges de commande et état vide.
- Uniquement les primitives du design system.

## Sécurité

Aucune : mock local, aucune entrée transmise, aucun secret. Auth à l'étape 3 (prompt 05), données réelles à l'étape 7.

## Critères d'acceptation

- `npx tsc --noEmit`, `npm run lint`, `npm run build` sans erreur
- Review Greptile de la PR sans objection restante

## Vérification manuelle

1. `npm run dev` → `/chat` : 2 conversations à gauche, cliquer l'autre → le fil change ; bulles user/assistant différenciées ; chips `/script` `/short` préfixent la saisie ; Envoyer désactivé
2. `/chat?quota=full` → bannière "Quota atteint" et saisie désactivée
3. `/historique` : groupes par date, badges de commande, lien vers `/chat`
4. Vue mobile : liste ⇄ fil avec bouton retour, aucune casse, pas de scroll horizontal
