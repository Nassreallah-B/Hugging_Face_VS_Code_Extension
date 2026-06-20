'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');

const port = Number(process.env.CLOUD_EXECUTOR_TEST_PORT || 7791);
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-cloud-executor-'));
const hfToken = process.env.HF_API_TOKEN || process.env.HF_TOKEN || '';

function requestJson(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: urlPath,
      method,
      headers: payload
        ? {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        : {}
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk.toString());
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode || 0,
            data: raw ? JSON.parse(raw) : {}
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function waitForHealth(timeoutMs = 20000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await requestJson('GET', '/health');
      if (response.statusCode === 200 && response.data && response.data.ok) return response.data;
    } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Timed out waiting for cloud executor health check.');
}

async function waitForTask(taskId, timeoutMs = 180000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const response = await requestJson('GET', `/tasks/${encodeURIComponent(taskId)}`);
    if (response.statusCode === 200 && response.data && response.data.task) {
      const task = response.data.task;
      if (['completed', 'failed', 'stopped'].includes(task.status)) return task;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for remote task ${taskId}`);
}

function buildSystemPrompt() {
  return [
    'You are an autonomous coding agent in an isolated remote workspace snapshot.',
    'Use tool tags when you need to inspect files or run commands.',
    'Tool format:',
    '<hfai-tool name="read_file">{"path":"src/answer.txt"}</hfai-tool>',
    'Available tools:',
    '- list_files',
    '- read_file',
    '- search_text',
    '- write_file',
    '- delete_path',
    '- run_shell',
    'When the task is complete, answer normally without tool tags.'
  ].join('\n');
}

async function main() {
  const child = spawn(process.execPath, ['cloud-executor/server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(port),
      CLOUD_EXECUTOR_DATA_DIR: dataDir,
      HF_API_TOKEN: hfToken
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let serverOutput = '';
  child.stdout.on('data', chunk => serverOutput += chunk.toString());
  child.stderr.on('data', chunk => serverOutput += chunk.toString());

  try {
    const health = await waitForHealth();
    console.log(`health ok: ${health.mode}`);

    if (!health.sandbox || !health.sandbox.dockerReady) {
      console.log(`Skipping cloud executor task smoke test: Docker sandbox is unavailable${health.sandbox && health.sandbox.detail ? ` (${health.sandbox.detail})` : '.'}`);
      return;
    }

    if (!hfToken) {
      console.log('HF token not set; health-only smoke test completed.');
      return;
    }

    const createResponse = await requestJson('POST', '/tasks', {
      title: 'Smoke Task',
      prompt: 'Read src/answer.txt and reply with its exact contents.',
      workspaceName: 'smoke-workspace',
      modelId: process.env.HF_MODEL_ID || 'Qwen/Qwen2.5-Coder-32B-Instruct:fastest',
      temperature: 0,
      maxTokens: 256,
      maxRounds: 2,
      shellTimeoutMs: 15000,
      toolTimeoutMs: 60000,
      files: [
        { path: 'src/answer.txt', content: 'remote ok' },
        { path: 'package.json', content: '{\"name\":\"remote-smoke\",\"version\":\"1.0.0\"}' }
      ],
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: 'Read src/answer.txt and reply with its exact contents.' }
      ]
    });
    if (createResponse.statusCode !== 201 || !createResponse.data || !createResponse.data.task) {
      throw new Error(`Unexpected task creation response: ${JSON.stringify(createResponse.data)}`);
    }

    console.log(`task created: ${createResponse.data.task.id}`);
    const task = await waitForTask(createResponse.data.task.id);
    console.log(`task status: ${task.status}`);
    if (task.status !== 'completed') {
      throw new Error(`Cloud task failed: ${task.error || task.status}`);
    }
    if (!String(task.resultText || '').toLowerCase().includes('remote ok')) {
      throw new Error(`Unexpected cloud task result: ${task.resultText || ''}`);
    }
    console.log('cloud executor smoke test passed');
  } finally {
    try { child.kill(); } catch (_) {}
    try { fs.rmSync(dataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
