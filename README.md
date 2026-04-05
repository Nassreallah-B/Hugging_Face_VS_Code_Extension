# HF AI Code

HF AI Code est une extension VS Code orientee agent de code, branchée sur Hugging Face Inference Providers. Elle combine chat persistant, mémoire durable, RAG workspace, tâches agent, sandbox Docker, patch review et exécution cloud optionnelle.

## Ce que fait l'extension

- ouvre un chat persistant par workspace, avec historique sauvegardé sur disque
- construit le contexte à partir des instructions, de la mémoire, du résumé, du fichier actif et du retrieval
- peut répondre en chat direct ou en mode agent multi-étapes
- exécute les outils agent dans un sandbox Docker au lieu du workspace hôte
- produit un patch à relire avant toute écriture réelle dans le projet
- peut déléguer des tâches longues au cloud executor

## Architecture rapide

- `extension.js` : point d’entrée principal, orchestration, stockage, chat, agent runtime, RAG, UI bridge
- `media/` : webview du chat
- `lib/` : sandbox Docker et helpers runtime partagés
- `cloud-executor/` : serveur optionnel pour les tâches distantes
- `sandbox/` : image Docker utilisée par les outils agent
- `docs/` : documentation d’architecture, protocoles, tests et usage
- `scripts/` : smoke tests et live tests
- `test/` : scénarios de test côté extension host

## Installation

### Installation utilisateur

1. Installer l’extension dans VS Code.
2. Ouvrir les paramètres `HF AI Code`.
3. Renseigner `hfaicode.apiToken`.
4. Choisir un `hfaicode.modelId` compatible chat.
5. Recharger VS Code si nécessaire.

### Installation développeur

1. Cloner le repo.
2. Ouvrir le dossier dans VS Code.
3. Installer les dépendances si nécessaire.
4. Lancer l’extension en mode développement via l’host VS Code.
5. Vérifier les prérequis Docker si le mode agent doit utiliser les outils.

## Prérequis

### Obligatoires

- VS Code `^1.94.0`
- un token Hugging Face avec accès aux Inference Providers
- un modèle chat disponible via `router.huggingface.co`

### Pour le mode agent avec outils

- Docker Desktop avec moteur Linux actif
- WSL2 sur Windows
- image construite depuis `sandbox/Dockerfile`

### Pour le cloud executor

- un serveur Node capable de lancer `cloud-executor/server.js`
- `HF_API_TOKEN` disponible côté serveur ou forwarding volontaire du token

## Réglages importants

### Cœur

- `hfaicode.apiToken`
- `hfaicode.modelId`
- `hfaicode.temperature`
- `hfaicode.maxTokens`
- `hfaicode.sendFileContext`

### Mémoire et retrieval

- `hfaicode.memory.enabled`
- `hfaicode.memory.scope`
- `hfaicode.rag.enabled`
- `hfaicode.rag.mode`
- `hfaicode.rag.embeddingModel`
- `hfaicode.rag.embeddingMaxRetries`
- `hfaicode.rag.autoRefreshIntervalMinutes`

### Agent et sandbox

- `hfaicode.agent.enabled`
- `hfaicode.agent.maxRounds`
- `hfaicode.agent.allowShell`
- `hfaicode.sandbox.enabled`
- `hfaicode.sandbox.runtimeRequired`
- `hfaicode.sandbox.image`
- `hfaicode.sandbox.toolTimeoutMs`

### Cloud

- `hfaicode.cloud.enabled`
- `hfaicode.cloud.executorUrl`
- `hfaicode.cloud.apiKey`
- `hfaicode.cloud.pollIntervalMs`

## Fonctionnement

### Chat

Le message utilisateur arrive dans `extension.js`, le contexte est reconstruit, puis la requête part soit en chat direct, soit dans la boucle agent. L’état du chat est persisté sur disque.

### RAG

Le workspace est découpé en chunks. Le retrieval lexical et sémantique injecte les snippets les plus utiles dans le prompt final.

### Agent

L’agent peut demander des outils comme lecture fichier, recherche texte, shell, web ou LSP. Les outils sont exécutés dans le sandbox Docker. Les modifications sont transformées en patch review au lieu d’être appliquées directement au workspace.

### Patch review

Quand l’agent modifie des fichiers, l’extension crée un patch en attente. L’utilisateur peut le relire, l’accepter ou le rejeter.

### Cloud executor

Les tâches longues peuvent être envoyées à `cloud-executor/server.js`. Le serveur recrée le snapshot du workspace, lance le sandbox, exécute les rounds agent et stocke checkpoints, logs et résultats.

## Commandes utiles

- `hfaicode.openChat`
- `hfaicode.newChat`
- `hfaicode.selectModel`
- `hfaicode.checkConnection`
- `hfaicode.reviewDiff`
- `hfaicode.acceptDiff`
- `hfaicode.rejectDiff`

## Tests

- `npm run test:cloud-smoke`
- `npm run test:vscode-live`
- `npm run cloud:executor`

## Documentation par dossier

- [cloud-executor/README.md](/c:/Serveurs/hf-ai-code/cloud-executor/README.md)
- [docs/README.md](/c:/Serveurs/hf-ai-code/docs/README.md)
- [lib/README.md](/c:/Serveurs/hf-ai-code/lib/README.md)
- [media/README.md](/c:/Serveurs/hf-ai-code/media/README.md)
- [resources/README.md](/c:/Serveurs/hf-ai-code/resources/README.md)
- [sandbox/README.md](/c:/Serveurs/hf-ai-code/sandbox/README.md)
- [scripts/README.md](/c:/Serveurs/hf-ai-code/scripts/README.md)
- [test/README.md](/c:/Serveurs/hf-ai-code/test/README.md)
- [test/vscode/README.md](/c:/Serveurs/hf-ai-code/test/vscode/README.md)
- [.qwen/README.md](/c:/Serveurs/hf-ai-code/.qwen/README.md)
