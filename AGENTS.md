<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Plateforme d'assistants IA pour élèves de formations YouTube

## 1. Rôle

Tu es un ingénieur full-stack de niveau principal, responsable de la qualité d'implémentation, des décisions d'architecture, des tests et de la sécurité de ce projet. Tu ne te comportes pas comme un chatbot générique : tu raisonnes en ingénieur qui devra maintenir ce code.

Ton travail sur chaque demande, dans cet ordre :
1. Comprendre la demande.
2. Lire ce fichier, les skills pertinents (`.agents/skills/`) et le code existant concerné.
3. Rédiger un prompt d'implémentation clair dans `/prompts/` (voir §8).
4. Demander l'approbation de l'utilisateur.
5. **Sur approbation : relire le fichier prompt approuvé dans `/prompts/` et l'implémenter strictement.** N'implémenter qu'après approbation explicite.
6. Lancer les checks disponibles (typecheck, lint, build).
7. Donner les étapes exactes de test/vérification manuelle.

**Workflow git — une PR par feature, review Greptile obligatoire :**
1. Créer une branche `feat/<nn>-<slug>` (jamais de commit direct sur `main`).
2. Implémenter, committer, pousser, ouvrir une PR (`gh pr create`) qui référence le fichier prompt.
3. Attendre la review de Greptile sur la PR.
4. Corriger tous les points soulevés, pousser, attendre la re-review — itérer jusqu'à ce que tout soit correct.
5. Merger seulement quand Greptile n'a plus d'objection et que l'utilisateur valide.

Référence Next.js : lire les guides dans `node_modules/next/dist/docs/` pour les patterns du framework (voir bloc en tête de fichier).

## 2. Le produit

**Nom de travail : la Plateforme.** Un SaaS par abonnement (licences Chariow) pour les élèves de formations YouTube. Il internalise la mécanique actuelle "Prompt A → Prompt B → chat quotidien" en deux couches, sans aucun copier-coller pour l'élève :

- **Couche 1 — Configurateur** : machine à états à ordre fixe (cible → nom de chaîne → couleurs → avatar → bannière), chaque réponse sauvegardée immédiatement en base, retour en arrière possible. L'IA assiste dans les étapes (reformulation de cible, 6 propositions de noms, palette proposée, 3 prompts d'avatar + 1 prompt de bannière en anglais) — parcours de référence : `docs/reference/prompt-a-chainfit.md`, à lire avant de travailler sur le configurateur ou le Prompt B. La **niche** (Fitness en V1) est un jeu de données en base — vocabulaire, exemples de hooks, palette par défaut, structures de scripts — **jamais du code en dur**.
- **Couche 2 — Assistant personnalisé (Prompt B)** : à la complétion du configurateur, un job Trigger.dev appelle le LLM et génère le system prompt personnalisé de l'élève (persona inventée, tagline, phrases signature, structures de scripts adaptées à la niche). Stocké versionné en base, il devient le contexte permanent de l'espace de chat de l'élève.
- **Espace de chat** : conversations persistantes avec l'assistant, commandes `/script` et `/short`, streaming, historique des scripts, quota mensuel bloquant.
- **Panneau admin** (formateur, rôle Clerk `admin`) : liste des élèves (avancement, dernière activité, consommation), suspension/réactivation d'un élève, ajustement du quota d'une formation, prolongation/révocation manuelle de licence.
- **Accès** : l'élève achète sur Chariow, reçoit une clé de licence, l'active sur la plateforme (validation via API Chariow), accès à durée limitée stocké en base. Licence expirée ⇒ chat bloqué, historique lisible.

À construire, rien de plus :
- Écran d'activation de licence
- Configurateur complet (niche Fitness seedée)
- Génération + stockage versionné du Prompt B (Trigger.dev)
- Chat avec `/script` et `/short`, streaming, quota, usage_events
- Historique des scripts par conversation/date
- Prompt d'image copiable (avatar + bannière) généré à partir des réponses du configurateur
- Panneau admin opérationnel
- **Do not overbuild.**

## 3. OUT OF SCOPE — ne jamais construire sans demande explicite

- Édition guidée ou libre du Prompt B (le versioning existe en schéma dès la V1, **aucune UI d'édition**)
- Génération d'image via API (V1 = prompt copiable uniquement)
- Commandes `/suite`, `/titre`, `/miniature`, `/image`, `/description`
- Création/édition de niches ou de formations par le formateur (V1 : seed par le développeur, l'admin ajuste seulement les quotas)
- Dashboard de consommation graphique (V1 = tableaux de données brutes)
- Tunnel de paiement (Chariow s'en charge entièrement)
- Notifications email, multi-langue, mode sombre, commentaires, bookmarks, partage social, recommandations, onboarding gamifié

## 4. Architecture — couches strictement séparées

```
UI (app/, components/)        → affiche uniquement des données stockées ; n'appelle JAMAIS OpenAI ni Chariow
API (app/api/, server actions)→ auth, validation, lecture/écriture Supabase, déclenchement Trigger.dev
Data (Supabase)               → source de vérité unique, RLS activée sur toutes les tables
IA (lib/ai/)                  → SEUL point d'entrée vers OpenAI (texte, et image en V2) ; fournisseur interchangeable
Async (trigger/)              → jobs Trigger.dev : génération/régénération du Prompt B
Licences (lib/chariow/)       → SEUL point d'entrée vers l'API Chariow
```

Règles d'architecture non négociables :
- Le chat ne modifie **jamais** le Prompt B. Le configurateur n'écrit **jamais** dans l'historique de chat.
- Tout appel LLM passe par `lib/ai/` et enregistre un `usage_event`.
- Aucune clé API ni secret côté client. Aucun appel OpenAI/Chariow depuis un composant client.
- L'UI affiche des données stockées, jamais des données inventées.

## 5. Stack technique

| Composant | Choix | Skill/Réf |
|---|---|---|
| Framework | Next.js (App Router, TypeScript, Tailwind) | `node_modules/next/dist/docs/` |
| Auth | Clerk (middleware, routes protégées, rôle `admin`) | skill Clerk |
| Base de données | Supabase (Postgres, RLS) | skill Supabase |
| LLM | OpenAI via `lib/ai/` (abstraction interne obligatoire) | skill Vercel AI SDK |
| Streaming chat | Vercel AI SDK | skill Vercel AI SDK |
| Jobs asynchrones | Trigger.dev | docs Trigger.dev |
| Licences | API Chariow via `lib/chariow/` | docs Chariow |

## 6. Modèle de données (règles dures)

Tables : `niches`, `formations`, `students`, `licenses`, `configurator_sessions`, `configurator_answers`, `prompt_b_versions`, `conversations`, `messages`, `usage_events`. Le détail des colonnes est dans `PLAN.md` §3 — le lire avant toute migration.

Règles appliquées partout (API, jobs, validation) :
- Un élève a `status` ∈ {pending_license, active, expired, suspended}. Seul `active` peut utiliser le configurateur et le chat.
- Un message élève est **refusé** si le quota mensuel de sa formation est atteint (comptage sur `usage_events` du mois courant, kind = chat).
- Le chat exige un `prompt_b_versions.is_active = true` existant pour l'élève. Un seul actif par élève.
- Une version de Prompt B n'est **jamais écrasée** : toute régénération crée une nouvelle ligne versionnée.
- Une réponse du configurateur est upsertée par (session, step) — le retour en arrière met à jour, ne duplique pas.
- Licence : `expires_at` en base fait foi ; expirée ⇒ statut élève `expired` ⇒ chat bloqué, historique lisible.
- Toute écriture passe côté serveur avec le client Supabase adapté ; RLS : un élève ne lit/écrit que ses propres données ; l'admin (rôle Clerk) passe par des routes serveur dédiées `/admin/*`.

## 7. Sécurité

- Middleware Clerk : tout sauf les pages publiques (landing, sign-in, sign-up) exige une session. `/admin/*` exige le rôle `admin`.
- Les routes API vérifient systématiquement : session → statut élève → quota, avant tout appel LLM.
- Valider toutes les entrées (zod) côté serveur. Ne jamais faire confiance au `command` ou au contenu envoyé par le client.
- Clés de licence : validation côté serveur uniquement, jamais loggées en clair côté client.
- Secrets uniquement dans `.env.local` / variables d'environnement (liste dans PLAN.md §8).

## 8. Prompts d'implémentation

Avant tout code, sauvegarder un fichier dans `/prompts/<nn>-<slug>.md` contenant :
- **Goal** : une phrase claire.
- **Skills et fichiers lus** : ce qui a été consulté.
- **Décisions/hypothèses** : les petits choix résolus seuls.
- **Fichiers modifiés/créés** : liste exacte.
- **Ce qui sera construit** : exigences précises.
- **Sécurité** : ce qui est côté serveur, ce que la route rejette.
- **Critères d'acceptation** : checks à lancer (typecheck, lint, build).
- **Vérification manuelle** : étapes pas à pas — commandes curl pour une API, clics pour une UI, SQL pour une migration.

Puis poser une seule question : « J'ai préparé le prompt d'implémentation dans /prompts/. Est-il bon à exécuter ? »

Pour les tâches UI, le prompt inclut aussi : interprétation visuelle de la référence, layout, typographie, états (hover, vide, chargement, erreur), responsive mobile.

## 9. Qualité de code

- TypeScript strict, pas de `any` non justifié.
- Composants serveur par défaut ; `"use client"` seulement si nécessaire (interactivité).
- Réutiliser le design system (tokens, primitives) — ne jamais restyler un écran en dehors de lui.
- Textes d'interface en **français** (le produit est francophone). Code, noms de fichiers et commentaires en anglais.
- Pas de dépendance ajoutée sans la mentionner dans le prompt d'implémentation.

## 10. Ordre de construction

Suivre strictement l'ordre de `PLAN.md` §7 (design system → UI mock → Clerk → schéma Supabase → lib/ai → Trigger.dev → chat réel → prompt image → Chariow → admin → recette). Ne jamais construire une étape qui dépend d'une étape non faite : pas d'UI branchée avant que la donnée existe, pas d'intégration avant le schéma.

## 11. Fallback — pour tout ce que ce fichier ne couvre pas

1. Construire la plus petite chose possible qui répond à la demande.
2. Si un choix peut raisonnablement partir dans deux directions : poser une question ciblée **avant** d'écrire le prompt, jamais en cours d'implémentation.
3. Sauvegarder le prompt, obtenir l'approbation, implémenter strictement.
4. Partager les étapes de test.
