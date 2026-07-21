# PLAN DÉFINITIF — Plateforme d'assistants IA pour élèves de formations YouTube

> Document de référence figé avant toute ligne de code.
> Méthode de développement : **Vibe Engineering** — AGENTS.md + skills + prompts d'implémentation auto-générés par l'IA, approuvés un par un.

---

## 1. Décisions figées

| Sujet | Décision |
|---|---|
| Frontend/Backend | Next.js (App Router, TypeScript, Tailwind), app web unique responsive |
| Authentification | **Clerk** (composants prêts, gestion utilisateurs complète) |
| Base de données | **Supabase** (Postgres + RLS), source de vérité de toutes les données |
| Tâches asynchrones | **Trigger.dev** (génération Prompt B, régénérations, jobs longs) |
| LLM texte | API OpenAI, derrière une **couche d'abstraction interne** (`lib/ai/`) |
| Génération d'image | **MVP : option minimale** (prompt copiable). V2 : API image OpenAI |
| Paiement | **Chariow** — vente + licence côté Chariow ; la plateforme active/valide les clés de licence via l'API Chariow. Aucun tunnel de paiement à développer |
| Modèle d'accès | Licence à durée limitée (pass), renouvelée par nouvel achat Chariow ; rappel avant expiration |
| Quota d'usage | **Plafond simple dès V1** : quota de messages/mois configurable par formation, bloquant avec message clair |
| Niche MVP | **Fitness** (seed en base par le développeur). Schéma multi-niche dès le jour 1 |
| Versioning Prompt B | **Dans le schéma dès la V1**, même si l'édition n'arrive qu'en V2 |
| Suivi consommation | Table `usage_events` alimentée dès le premier appel LLM en V1 |

## 2. Architecture en couches (séparation stricte)

```
UI (pages, composants)          → affiche uniquement des données stockées, n'appelle jamais OpenAI
API (route handlers Next.js)    → validation, auth, lecture/écriture Supabase, déclenche Trigger.dev
Data (Supabase)                 → source de vérité unique, RLS activée
IA (lib/ai/)                    → SEUL point d'entrée vers OpenAI (texte et image), interchangeable
Async (Trigger.dev)             → génération/régénération du Prompt B, jobs longs
Licences (lib/chariow/)         → SEUL point d'entrée vers l'API Chariow
```

Règles dures :
- Le chat ne modifie **jamais** le Prompt B.
- Le configurateur n'écrit **jamais** dans l'historique de chat.
- Tout appel LLM passe par `lib/ai/` et écrit un `usage_event`.
- Aucune clé API côté client.

## 3. Modèle de données (Supabase)

- **niches** — id, slug, name, vocabulary (jsonb), hook_examples (jsonb), default_palette (jsonb), script_structures (jsonb), is_active. *La niche est de la donnée, jamais du code.*
- **formations** — id, name, niche_id, chariow_product_id, monthly_message_quota, access_duration_days
- **students** — id, clerk_user_id, email, formation_id, status (pending_license | active | expired | suspended)
- **licenses** — id, license_key, student_id, chariow_payload (jsonb), activated_at, expires_at
- **configurator_sessions** — id, student_id, current_step, status (in_progress | completed)
- **configurator_answers** — id, session_id, step (target | channel_name | colors | avatar | banner), answer (jsonb), updated_at. *Sauvegarde à chaque étape, retour en arrière = mise à jour de la réponse.*
- **prompt_b_versions** — id, student_id, version (int auto-incrémenté par élève), content (text), source (initial | guided_edit | free_edit), is_active, created_at. *Un seul actif par élève.*
- **conversations** — id, student_id, title, created_at
- **messages** — id, conversation_id, role (user | assistant), command (null | script | short | …), content, tokens_in, tokens_out, created_at
- **usage_events** — id, student_id, kind (configurator | prompt_b_generation | chat | image), model, tokens_in, tokens_out, created_at

Règles de données dures (à reprendre dans AGENTS.md) :
- Un message élève est refusé si le quota mensuel de sa formation est atteint.
- Le chat exige un `prompt_b_versions.is_active` existant.
- Une licence expirée ⇒ `students.status = expired` ⇒ accès chat bloqué (lecture de l'historique autorisée).

## 4. Les deux couches métier

### Couche 1 — Configurateur (ex Prompt A)
Machine à états à ordre fixe : **cible → nom de chaîne → couleurs → avatar → bannière**.
Référence de terrain : `docs/reference/prompt-a-chainfit.md` (le Prompt A réel de la niche Fitness, fourni par le formateur) — le configurateur reproduit son parcours.
- Chaque réponse sauvegardée immédiatement en base. Retour en arrière possible.
- **L'IA assiste à l'intérieur des étapes** (appels LLM via `lib/ai/`, logués en usage_events kind=configurator) :
  - **Cible** : 3 sous-questions (genre, tranche d'âge, douleur principale) → reformulation "avatar marketing" en 2-3 phrases par l'IA, stockée avec la réponse brute
  - **Nom** : l'IA propose 6 noms (2 identité, 2 promesse/résultat, 2 punchy) avec justification ; l'élève en choisit un ou saisit le sien
  - **Couleurs** : l'élève saisit ses couleurs OU demande une proposition IA (2 couleurs principales + 1 neutre, HEX, vives et cohérentes avec le nom et la psychologie de la cible)
  - **Avatar** : l'IA génère **3 prompts d'image en anglais** copiables (cartoon flat vector, contours noirs, couleur HEX de la marque, fond blanc, 3 angles : force/action/pointage caméra)
  - **Bannière** : affichage des dimensions YouTube officielles (bannière 2560×1440, zone sûre 1546×423, vignette 1280×720, logo 800×800, générique 3-5 s) + **1 prompt de bannière en anglais** copiable
- La niche paramètre le vocabulaire, les exemples et les critères de génération (données en base).
- Conséquence sur l'ordre de construction : l'étape 8 « prompt d'image copiable » est absorbée par le configurateur (avatar/bannière) et dépend de `lib/ai/` (étape 5).

### Couche 2 — Assistant personnalisé (ex Prompt B)
- À la complétion du configurateur, un **job Trigger.dev** appelle le LLM avec un méta-prompt (réponses de l'élève + données de niche) et génère l'assistant selon les règles du Prompt A de référence :
  - Nom : `[NOM DE CHAÎNE]BOT` ; persona 100% originale ; tagline inédite
  - Phrases signature en quantités fixes : 3 ouvertures, 3 relances de rétention, 2 call-to-like, 2 call-to-subscribe, 4 transitions, 3 conclusions
  - 5 structures de scripts longs (Mythe Brisé, Erreurs Fatales, Secret Révélé, Classement/Liste, Transformation) et 5 formats de Shorts (Classement Niveau, Liste Choc, Liste Solution Express, Comparaison Personnalisée, Défi Progressif), adaptés au vocabulaire de la cible
  - Reprise de la description exacte de l'avatar (HEX, style flat vector comic)
  - Confirmé par le formateur : il n'existe pas de « Guide LAO » séparé — le Prompt A est auto-suffisant et doit être repris **tel quel** comme base du méta-prompt (le LLM invente l'architecture détaillée à chaque génération)
- Résultat stocké comme `prompt_b_versions` v1, `is_active = true`.
- Ce prompt devient le system prompt permanent de l'espace de chat. **Aucun copier-coller pour l'élève.**

### Espace de chat
- Conversations persistantes, historique classé par date/vidéo.
- Commandes MVP : **/script**, **/short** (parsées côté serveur, enrichissent le contexte envoyé au LLM avec la structure de script de la niche).
- Réponses en streaming (Vercel AI SDK).
- Compteur de quota visible par l'élève.

## 5. Périmètre V1 (MVP) — et OUT OF SCOPE explicite

### Dans le MVP
1. Activation de licence Chariow (saisie de clé → validation API → accès à durée limitée)
2. Configurateur complet, niche Fitness seedée
3. Génération + stockage versionné du Prompt B (Trigger.dev)
4. Chat avec /script et /short, streaming, quota bloquant
5. Historique des scripts générés
6. Prompt d'image copiable (avatar + bannière)
7. **Panneau admin opérationnel** (formateur) :
   - Lecture : liste des élèves, statut d'avancement configurateur, dernière activité, consommation par élève (usage_events)
   - Actions : suspendre/réactiver un élève, ajuster le quota mensuel d'une formation, prolonger ou révoquer une licence manuellement
   - Accès réservé au rôle `admin` (rôle Clerk), routes `/admin/*` protégées par middleware

### OUT OF SCOPE V1 (l'IA ne doit JAMAIS les construire sans demande explicite)
- Édition guidée ou libre du Prompt B (le versioning existe en schéma, pas d'UI)
- Génération d'image via API (intégrée en V2)
- Commandes /suite, /titre, /miniature, /image, /description
- Back office de création/édition de niches et de formations par le formateur (l'admin V1 ajuste les quotas d'une formation existante, il n'en crée pas)
- Dashboard de consommation graphique (V1 = tableaux de données brutes seulement)
- Notifications email, multi-langue, mode sombre, commentaires, bookmarks, partage social
- Tout tunnel de paiement (Chariow s'en charge)

### V2 (après validation du MVP)
Édition guidée + libre du Prompt B avec rollback de version · toutes les niches + back office niches · API image OpenAI intégrée · dashboard de consommation détaillé · ensemble complet des commandes · rappels d'expiration de licence automatisés.

## 6. Risques et parades (intégrées à l'architecture)

| Risque (CDC ch. 12) | Parade V1 |
|---|---|
| Dérive du coût API | Quota bloquant + usage_events dès le 1er appel |
| Dépendance OpenAI | Couche `lib/ai/` unique, interface interne, fournisseur interchangeable |
| Élève qui casse son Prompt B | Versioning en schéma dès V1 ; l'édition (V2) n'écrase jamais, elle crée une version |
| Qualité variable par niche | Niche = données en base, ajustables sans redéploiement ; niche Politique repoussée en V2 |

## 7. Ordre de construction (un prompt approuvé par étape)

0. **Setup** — projet Next.js, AGENTS.md, installation des skills (Clerk, Supabase, Vercel AI SDK ; docs Trigger.dev + Chariow en référence)
1. **Design system** — tokens, typographie, composants primitifs, page showcase
2. **UI en mock data** — écran d'activation de licence, configurateur, chat, historique, panneau admin
3. **Authentification Clerk** — middleware, routes protégées, redirections
4. **Schéma Supabase** — tables, RLS, seed niche Fitness, couche d'accès données
5. **Couche IA** — `lib/ai/` (abstraction), méta-prompt de génération du Prompt B
6. **Trigger.dev** — job de génération du Prompt B branché à la complétion du configurateur
7. **Chat réel** — branchement du Prompt B actif, parsing /script /short, streaming, quota, usage_events
8. **Prompt d'image copiable** — génération à partir des réponses configurateur
9. **Licences Chariow** — `lib/chariow/`, activation de clé, expiration, blocage
10. **Panneau admin** — rôle admin Clerk, liste élèves + consommation, actions : suspension élève, ajustement quota, prolongation/révocation de licence
11. **Recette complète** — parcours élève de bout en bout, mobile + desktop

Règle : **jamais d'étape hors ordre** — pas d'UI branchée avant que la donnée existe, pas d'intégration avant le schéma.

## 8. Variables d'environnement prévues

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
TRIGGER_SECRET_KEY
CHARIOW_API_KEY
```

## 9. Workflow de développement (méthode Vibe Engineering)

1. AGENTS.md décrit le produit, l'out-of-scope, l'architecture, le modèle de données, le workflow et les règles de fallback.
2. Skills installés par outil (Clerk, Supabase, AI SDK).
3. Pour chaque étape du §7 : prompt court de l'utilisateur → l'IA lit AGENTS.md + skills + code → écrit un prompt d'implémentation détaillé dans `/prompts/*.md` (goal, fichiers modifiés, hypothèses, sécurité, critères d'acceptation, **étapes de vérification manuelle**) → demande l'approbation → sur approbation, **relit le fichier prompt** et implémente strictement → lance les checks → donne les étapes de test.
4. Toute décision non couverte par AGENTS.md : **demander avant de supposer**, avant le prompt, jamais en cours de build.
