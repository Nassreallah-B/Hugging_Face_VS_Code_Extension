FROM node:22-slim

# Outils système essentiels pour les tâches agent
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    python3 \
    python3-pip \
    python3-venv \
    ripgrep \
    jq \
    zip \
    unzip \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Outils Node.js fréquemment nécessaires dans le sandbox
RUN npm install -g \
    typescript \
    ts-node \
    eslint \
    prettier \
    jest \
    --no-fund \
    --no-audit \
    --loglevel error

# Dossier de travail par défaut  
WORKDIR /workspace

# L'agent écrira ses scripts dans .hfai-sandbox/
# Ces chemins sont réservés par le runtime
# Ne jamais monter ce dossier depuis l'hôte
