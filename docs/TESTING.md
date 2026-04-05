# Testing

## Runtime vNext checks

Current validation performed after the advanced runtime changes:

- `node -c extension.js`
- `node -c cloud-executor/server.js`
- `node -c lib/runtimeFeatures.js`

Cloud API additions to smoke manually:

- `GET /tasks/:id/output`
- `PATCH /tasks/:id`
- `POST /tasks/:id/messages`
- `POST /tasks/:id/resume`

## Local Static Validation

These checks should pass after code changes:

```powershell
node -c extension.js
node -c cloud-executor/server.js
node -c lib/dockerSandbox.js
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package ok')"
```

The embedded webview script can also be syntax-checked by extracting the `<script>` block from `media/chat.html`.

## Live Hugging Face Checks

Useful direct checks:

- router model discovery through `/v1/models`
- chat completion through `/v1/chat/completions`
- embedding call through `/hf-inference/models/<embedding-model>`

Requirements:

- `HF_TOKEN` or `HF_API_TOKEN`
- router-compatible chat model
- embedding-capable HF model

## Extension Live Test

Script:

```powershell
npm run test:vscode-live
```

This test exercises:

- extension activation
- connection check
- RAG rebuild
- semantic retrieval
- prompt send
- multi-chat persistence
- background task flow

Environment:

- `HF_TOKEN`

## Cloud Executor Smoke Test

Script:

```powershell
npm run test:cloud-smoke
```

This validates:

- executor startup
- `/health`
- remote task creation
- remote agent completion

Requirements for the full path:

- Docker available
- `HF_API_TOKEN` or forwarded token enabled

## Sandbox-Specific Validation

To validate the sandbox runtime itself:

1. start Docker Desktop
2. confirm the Linux engine is healthy
3. run an agent request that edits files
4. confirm a pending patch appears instead of direct workspace mutation
5. review and accept the patch

## Resume Validation

Manual restart test:

1. start a long-running background task
2. close VS Code or stop the cloud executor while it is running
3. restart the runtime
4. confirm the task returns as `resuming` or `interrupted`
5. confirm execution continues from the last checkpoint

## Known Environment Blockers

The most common reasons integration tests cannot be completed are:

- Docker daemon unavailable
- HF token missing or under-scoped
- selected model unavailable through the router
- embedding model unavailable
