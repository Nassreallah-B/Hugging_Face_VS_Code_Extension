# HF AI Code — Hugging Face

> Extension VS Code d'assistance au codage alimentée par Hugging Face Inference Providers.
> Architecture agentic distribuée avec agents autonomes, sandbox Docker, mémoire persistante, RAG hybride et exécuteur cloud.

---

## ✨ Fonctionnalités Clés

### 🤖 Agent Autonome Multi-Rounds

- **Agent foreground** : traite les messages normaux avec outils autonomes (lecture/écriture fichiers, shell, git, web)
- **Agent background local** : tâche persistante avec checkpoints, survie aux redémarrages VS Code
- **Agent background distant** : exécution via `cloud-executor` (serveur Node.js séparé)
- **ARIA Agent Ecosystem** : 10+ rôles spécialisés (ARIA Orchestrator, RTL UI Auditor, Database Expert, Security Sentinel) avec budgets d'étapes dynamiques (jusqu'à 80 rounds)
- **Sub-agents et équipes** : spawn, orchestration, teams avec lead + workers + verifier

### 🐳 Sandbox Docker Isolé

- Toutes les opérations fichiers/shell exécutées dans un container Docker isolé
- Le workspace hôte n'est JAMAIS modifié directement — seule la revue de patch autorise les changements
- Image auto-buildée depuis `sandbox/Dockerfile`
- Modes réseau : `none` (défaut, offline total) ou `bridge`

### 🧠 Mémoire Persistante & RAG

- Rolling summaries des conversations longues
- Notes de mémoire globales (préférences) et workspace (conventions projet)
- RAG hybride : lexical + sémantique via embeddings Hugging Face
- Auto-indexation du workspace avec refresh configurable

### ☁️ Cloud Executor

- Serveur autonome `cloud-executor/server.js`
- API REST pour gérer les tâches distantes
- Persistance sur disque, reprise après redémarrage
- Déployable en Docker via `docker-compose.yml`

---

## 🚀 Installation & Configuration

### Prérequis

- VS Code 1.94+
- Docker Desktop (pour le sandbox)
- Token Hugging Face (<https://huggingface.co/settings/tokens>)

### Configuration Rapide

```jsonc
// .vscode/settings.json
{
  "hfaicode.modelId": "Qwen/Qwen3.5-397B-A17B:fastest",
  "hfaicode.temperature": 0.2,
  "hfaicode.maxTokens": 8192,

  // Mémoire
  "hfaicode.memory.enabled": true,
  "hfaicode.memory.scope": "global+workspace",
  "hfaicode.memory.maxRecentMessages": 20,

  // RAG
  "hfaicode.rag.enabled": true,
  "hfaicode.rag.mode": "hybrid-local",
  "hfaicode.rag.topK": 10,
  "hfaicode.rag.autoRefreshIntervalMinutes": 15,

  // Agent
  "hfaicode.agent.enabled": true,
  "hfaicode.agent.maxRounds": 20,
  "hfaicode.agent.allowShell": true,
  "hfaicode.agent.shellTimeoutMs": 60000,
  "hfaicode.agent.maxConcurrentTasks": 4,

  // Sandbox Docker
  "hfaicode.sandbox.enabled": true,
  "hfaicode.sandbox.autoStartDocker": true,
  "hfaicode.sandbox.image": "hf-ai-code-sandbox:latest",
  "hfaicode.sandbox.autoBuildImage": true,
  "hfaicode.sandbox.networkMode": "none",
  "hfaicode.sandbox.toolTimeoutMs": 180000,
  "hfaicode.sandbox.retainOnFailure": true
}
```

### Configurer le Token

Utilisez la commande `HF AI: Set API Token` (Ctrl+Shift+P) — le token est stocké de façon sécurisée dans VS Code SecretStorage.

---

## 🛠️ Commandes Disponibles

| Commande | Description |
| :--- | :--- |
| `HF AI: Open Chat` | Ouvrir le panneau de chat |
| `HF AI: New Conversation` | Démarrer une nouvelle conversation |
| `HF AI: Select / Change Model` | Changer le modèle Hugging Face |
| `HF AI: Set API Token` | Définir le token (stockage sécurisé SecretStorage) |
| `HF AI: Check API Connection` | Vérifier la connexion |
| `HF AI: Explain Code` | Expliquer le code sélectionné |
| `HF AI: Fix Code / Errors` | Corriger le code sélectionné |
| `HF AI: Refactor Code` | Refactoriser le code sélectionné |
| `HF AI: Generate Unit Tests` | Générer des tests unitaires |
| `HF AI: Optimize Code` | Optimiser le code sélectionné |
| `HF AI: Add Comments & Docs` | Ajouter des commentaires |
| `HF AI: Accept Pending Patch` | Appliquer le patch en attente |
| `HF AI: Reject Pending Patch` | Rejeter le patch en attente |
| `HF AI: Review Pending Patch` | Ouvrir la revue du patch |
| `HF AI: Clean Sandbox Workspaces` | Nettoyer les workspaces sandbox |
| `HF AI: Create AGENTS.md` | Créer un fichier d'instructions agents |
| `HF AI: View Memory Notes` | Voir les notes mémorisées |

---

## 🏗️ Architecture

```text
extension.js                  ← Noyau principal (7100+ lignes)
lib/
  runtimeFeatures.js          ← Sub-agents, teams, hooks, MCP-like, coûts + pont MemoryDB
  memoryDB.js                 ← Stockage structuré local (10 tables JSON, fichier unique)
  sparc.js                    ← SPARC : Sense → Plan → Act → Reflect → Correct
  mutationGuard.js            ← Garde-fou écriture/shell/suppression (15 rôles)
  aiDefence.js                ← Sécurité : injection, PII, secrets, shell
  providerRouter.js           ← Routage multi-LLM (6 providers, failover, round-robin)
  vectorDB.js                 ← Recherche vectorielle hybride (cosine + BM25 + RRF)
  pluginManager.js            ← Système de plugins hot-loadable
  learningEngine.js           ← Auto-apprentissage SONA
  swarmTopology.js            ← Topologies multi-agents (pipeline, hub-spoke, map-reduce)
  cveScanner.js               ← Scanner vulnérabilités npm
  encryption.js               ← Coffre-fort AES-256-GCM
  hooksAndWorkers.js          ← Hooks lifecycle (11 phases) + workers background
  dockerSandbox.js            ← Gestionnaire Docker (sandbox lifecycle)
  antiHallucination.js        ← Validation post-génération
  config.js                   ← Constantes et lecteurs de config
plugins/
  design-system/
    manifest.json             ← Déclaration du plugin design system
    tools/designSystem.js     ← Bridge JS → Python + fallback intégré
skills/
  ui-ux-pro-max/
    scripts/                  ← 3 scripts Python (core, design_system, search)
    data/                     ← 30 CSVs + 16 stacks (1.5 MB total)
cloud-executor/
  server.js                   ← Serveur HTTP d'exécution distante
  Dockerfile                  ← Image du cloud executor
  docker-compose.yml          ← Déploiement cloud executor
sandbox/
  Dockerfile                  ← Image sandbox Node.js 22 + outils
scripts/
  build-sandbox.js            ← Build de l'image sandbox
  run-cloud-executor-smoke.js ← Tests de l'executor
test/
  antiHallucination.test.js   ← Tests antiHallucination
  agent-orchestration.test.js ← Tests orchestration multi-agents
test-modules.js               ← Suite de tests modulaire (132 tests)
docs/
  MODULAR_ARCHITECTURE.md     ← Documentation complète des 16 modules lib/
  PLUGIN_SYSTEM.md            ← Plugin system + UI/UX Pro Max bridge
  ARIA_ECOSYSTEM.md           ← Orchestration agents + SPARC + MutationGuard
  ARCHITECTURE_MEMORY_RAG.md  ← Mémoire, RAG, MemoryDB, VectorDB
  ADVANCED_AGENT_RUNTIME.md   ← Runtime avancé (sub-agents, teams, hooks)
  AGENTS_AND_SANDBOXES.md     ← Sandbox et cycle de vie agents
  SCHEMAS_AND_PROTOCOLS.md    ← Schemas et protocoles
  CLOUD_EXECUTOR.md           ← Cloud executor
  TESTING.md                  ← Tests (132 tests documentés)
  IMPLEMENTATION_HISTORY.md   ← Historique des 17 phases d'évolution
```

> **⚠️ TOUT EST LOCAL** — Aucune base de données externe, aucun stockage cloud.
> Le seul trafic réseau est vers les API LLM (HuggingFace, Ollama, etc.).

---

## 🐳 Build & Déploiement Sandbox

```powershell
# Build de l'image sandbox
node scripts/build-sandbox.js

# Rebuild forcé
node scripts/build-sandbox.js --force

# Tag custom
node scripts/build-sandbox.js --tag mon-sandbox:v2
```

---

## ☁️ Déploiement Cloud Executor

```powershell
# 1. Copier .env.example
cp cloud-executor/.env.example cloud-executor/.env

# 2. Renseigner HF_API_TOKEN et CLOUD_EXECUTOR_API_KEY
notepad cloud-executor/.env

# 3. Lancer avec Docker Compose
cd cloud-executor
docker compose up -d

# 4. Configurer dans VS Code
# hfaicode.cloud.enabled = true
# hfaicode.cloud.executorUrl = http://127.0.0.1:7788
# hfaicode.cloud.apiKey = <votre clé>
```

---

## 🧪 Tests

```powershell
# Suite de tests modulaire (132 tests — 16 modules + wiring)
node test-modules.js

# Tests anti-hallucination
npm run test:anti-hallucination

# Test smoke cloud executor
npm run test:cloud-smoke

# Tests orchestration agents
node test/agent-orchestration.test.js

# Tests antiHallucination unitaires
node test/antiHallucination.test.js

# Validation syntaxique complète
node -c extension.js && node -c lib/runtimeFeatures.js && node -c lib/memoryDB.js && node -c lib/sparc.js
```

---

## 🔒 Sécurité

- **Token HF** : stocké dans VS Code SecretStorage (jamais en clair dans les settings)
- **Sandbox réseau** : mode `none` par défaut (le container est offline)
- **Workspace hôte** : jamais modifié directement — revue de patch obligatoire
- **Secrets non injectés** dans le container sandbox
- **AIDefence** (`lib/aiDefence.js`) : détection injection de prompt, PII, secrets, commandes shell dangereuses
- **MutationGuard** (`lib/mutationGuard.js`) : garde-fou fail-closed par rôle d'agent — 15 rôles configurés, chemins bloqués (`.env`, `node_modules/`, `.git/`), audit log
- **Encryption** (`lib/encryption.js`) : coffre-fort AES-256-GCM optionnel pour données sensibles
- **RLS agents** : agents read-only (Explore, Plan, verification) ne peuvent ni écrire ni exécuter de shell
- **Orchestrator** : `aria-orchestrator` est interdit d'écriture directe — il doit déléguer
- **Stockage** : 100% local — aucune base de données externe, aucun stockage cloud

---

## 📋 Paramètres Référence Complète

Voir [docs/USER_GUIDE.md](docs/USER_GUIDE.md) pour la liste complète des paramètres.

---

## 🗺️ Roadmap

### ✅ Complété
- [x] Modularisation en 16 modules `lib/` testés (132 tests)
- [x] MemoryDB — stockage structuré local (10 tables)
- [x] SPARC — analyse automatique pour l'orchestrateur
- [x] MutationGuard — garde-fou écriture/shell/suppression
- [x] Plugin system + UI/UX Pro Max bridge
- [x] VectorDB — recherche hybride cosine + BM25
- [x] AIDefence — sécurité multi-couches
- [x] Encryption vault AES-256-GCM
- [x] Swarm topologies (pipeline, hub-spoke, map-reduce)
- [x] CVE scanner background
- [x] Dual-write MemoryDB ↔ RuntimeFeatureStore

### 🔮 Futur
- [ ] SecretStorage pour cloud bearer token
- [ ] Tests CI complets GitHub Actions
- [ ] callMcpTool — invocation outil MCP distante complète
- [ ] Dashboard agents tree dans le webview
- [ ] Icône Activity Bar SVG simplifiée
- [ ] Phases hooks `post_tool` et `on_error` (implémentées côté hook system, pas encore câblées)
- [ ] Migration SQLite optionnelle pour MemoryDB (upgrade path documenté)
- [ ] Mesh topology pour swarms complexes

---

## License

HF AI Code v1.2.0 — MIT License
