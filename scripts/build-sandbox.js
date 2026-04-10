'use strict';

/**
 * Script de build de l'image sandbox Docker
 * Usage: node scripts/build-sandbox.js [--force] [--tag <tag>]
 *
 * Options:
 *  --force   Rebuild même si l'image existe déjà
 *  --tag     Tag custom (défaut: hf-ai-code-sandbox:latest)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const force = args.includes('--force');
const tagIdx = args.indexOf('--tag');
const imageTag = tagIdx !== -1 && args[tagIdx + 1] ? args[tagIdx + 1] : 'hf-ai-code-sandbox:latest';

const dockerfilePath = path.join(__dirname, '..', 'sandbox', 'Dockerfile');
const contextPath = path.join(__dirname, '..', 'sandbox');

if (!fs.existsSync(dockerfilePath)) {
  console.error(`[build-sandbox] ERROR: Dockerfile not found at ${dockerfilePath}`);
  process.exit(1);
}

function runDockerCommand(args, label) {
  return new Promise((resolve, reject) => {
    console.log(`[build-sandbox] ${label}: docker ${args.join(' ')}`);
    const child = spawn('docker', args, { stdio: 'inherit' });
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`docker command failed with exit code ${code}`));
    });
    child.on('error', reject);
  });
}

async function imageExists(tag) {
  return new Promise(resolve => {
    const child = spawn('docker', ['image', 'inspect', tag], { stdio: 'pipe' });
    child.on('close', code => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

async function main() {
  console.log(`[build-sandbox] Target image: ${imageTag}`);
  console.log(`[build-sandbox] Dockerfile: ${dockerfilePath}`);
  console.log(`[build-sandbox] Context: ${contextPath}`);

  if (!force) {
    const exists = await imageExists(imageTag);
    if (exists) {
      console.log(`[build-sandbox] Image "${imageTag}" already exists. Use --force to rebuild.`);
      return;
    }
  }

  const buildArgs = [
    'build',
    '--tag', imageTag,
    '--file', dockerfilePath,
    '--progress', 'plain',
    contextPath
  ];

  try {
    await runDockerCommand(buildArgs, 'Building sandbox image');
    console.log(`\n[build-sandbox] ✅ Image "${imageTag}" built successfully.`);
    console.log('[build-sandbox] You can now enable hfaicode.sandbox.enabled in VS Code settings.');
  } catch (err) {
    console.error(`[build-sandbox] ❌ Build failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[build-sandbox] Unexpected error:', err.message);
  process.exit(1);
});
