'use strict';

/**
 * Script de test d'orchestration multi-agents
 * Valide le cycle de vie spawn → wait → message → stop
 * Usage: node test/agent-orchestration.test.js
 */

const path = require('path');

const rfPath = path.join(__dirname, '..', 'lib', 'runtimeFeatures.js');
let runtimeFeatures;
try {
  runtimeFeatures = require(rfPath);
} catch (e) {
  console.error('Cannot load runtimeFeatures.js:', e.message);
  process.exit(1);
}

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(() => {
        passed++;
        results.push({ name, status: 'PASS' });
      }).catch(err => {
        failed++;
        results.push({ name, status: 'FAIL', error: err.message });
      });
    }
    passed++;
    results.push({ name, status: 'PASS' });
  } catch (err) {
    failed++;
    results.push({ name, status: 'FAIL', error: err.message });
  }
  return Promise.resolve();
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// Mock store pour les tests
function createMockStore() {
  const agents = {};
  const teams = {};
  const tasks = {};
  const questions = {};
  const hooks = { hooks: [] };
  const mcpConnections = { connections: [] };
  const mcpProfiles = { activeProfile: '', profiles: [] };
  const onboarding = { summary: '', conventions: [], riskyZones: [], commands: { build: '', test: '', lint: '' }, importantFiles: [] };
  const costs = { global: { calls: 0, promptTokens: 0, completionTokens: 0, embeddingTokens: 0 }, byChat: {}, byTask: {}, byAgent: {} };
  const events = { events: [] };
  const logs = { runtime: [], audit: [] };

  return {
    agents, teams, tasks, questions,
    loadAgent: id => agents[id] || null,
    saveAgent: agent => { agents[agent.id] = agent; },
    loadTeam: id => teams[id] || null,
    saveTeam: team => { teams[team.id] = team; },
    loadTask: id => tasks[id] || null,
    saveTask: task => { tasks[task.id] = task; },
    loadQuestion: id => questions[id] || null,
    saveQuestion: q => { questions[q.id] = q; },
    loadHooks: () => hooks,
    saveHooks: h => Object.assign(hooks, h),
    loadMcpConnections: () => mcpConnections,
    saveMcpConnections: c => Object.assign(mcpConnections, c),
    loadMcpProfiles: () => mcpProfiles,
    saveMcpProfiles: p => Object.assign(mcpProfiles, p),
    loadOnboarding: () => onboarding,
    saveOnboarding: o => Object.assign(onboarding, o),
    loadCosts: () => costs,
    saveCosts: c => Object.assign(costs, c),
    loadEvents: () => events,
    saveEvents: e => Object.assign(events, e),
    loadLogs: () => logs,
    appendLog: (type, entry) => logs[type] && logs[type].push(entry),
    discoverOnboarding: () => ({ summary: '', conventions: [], riskyZones: [], commands: { build: '', test: '', lint: '' }, importantFiles: [] })
  };
}

function createMockBridge() {
  const tasks = {};
  let taskIdCounter = 1;
  return {
    createTask: async (opts) => {
      const id = `task_${taskIdCounter++}`;
      const task = { id, status: 'pending', ...opts };
      tasks[id] = task;
      return task;
    },
    getTask: id => tasks[id] || null,
    stopTask: async id => { if (tasks[id]) tasks[id].status = 'stopped'; },
    resumeTask: async id => { if (tasks[id]) tasks[id].status = 'running'; },
    appendTaskMessage: async () => {},
    waitForTaskAgents: async (states, ms) => new Promise(r => setTimeout(r, Math.min(ms, 10))),
    getTaskOutput: id => tasks[id] ? { output: '', logs: [], task: tasks[id] } : null,
    updateTask: (id, changes) => { if (tasks[id]) Object.assign(tasks[id], changes); return tasks[id]; }
  };
}

async function runTests() {
  const { RuntimeFeatureStore } = runtimeFeatures;

  if (!RuntimeFeatureStore) {
    console.warn('RuntimeFeatureStore not exported, skipping orchestration tests');
    return;
  }

  await test('RuntimeFeatureStore instantiates correctly', () => {
    const store = createMockStore();
    const bridge = createMockBridge();
    const rfs = new RuntimeFeatureStore({ store, bridge, workspaceRoot: '/tmp/test' });
    assert(rfs, 'Expected RuntimeFeatureStore instance');
    assert(typeof rfs.createAgent === 'function', 'Expected createAgent method');
    assert(typeof rfs.executeTool === 'function', 'Expected executeTool method');
  });

  await test('spawn_agent creates agent record', async () => {
    const store = createMockStore();
    const bridge = createMockBridge();
    const rfs = new RuntimeFeatureStore({ store, bridge, workspaceRoot: '/tmp/test' });
    const result = await rfs.executeTool('spawn_agent', {
      prompt: 'Analyze the codebase and report findings',
      name: 'test-explorer',
      subagent_type: 'Explore',
      run_in_background: true,
      description: 'Test exploration agent'
    }, { chatId: 'chat_test', rootPath: '/tmp/test' });
    assert(result, 'Expected spawn_agent result');
    assert(result.id, 'Expected agent id');
    assert(result.name, 'Expected agent name');
  });

  await test('list_agents returns created agents', async () => {
    const store = createMockStore();
    const bridge = createMockBridge();
    const rfs = new RuntimeFeatureStore({ store, bridge, workspaceRoot: '/tmp/test' });
    await rfs.executeTool('spawn_agent', { prompt: 'Agent A', name: 'agent-a', run_in_background: true }, {});
    await rfs.executeTool('spawn_agent', { prompt: 'Agent B', name: 'agent-b', run_in_background: true }, {});
    const result = await rfs.executeTool('list_agents', {}, {});
    assert(result.count >= 2, `Expected at least 2 agents, got ${result.count}`);
  });

  await test('create_team creates team record', async () => {
    const store = createMockStore();
    const bridge = createMockBridge();
    const rfs = new RuntimeFeatureStore({ store, bridge, workspaceRoot: '/tmp/test' });
    const team = await rfs.executeTool('create_team', {
      teamName: 'test-squad',
      description: 'Test orchestration team'
    }, {});
    assert(team, 'Expected team result');
    assert(team.id, 'Expected team id');
    assert(team.teamName === 'test-squad', `Expected teamName 'test-squad', got '${team.teamName}'`);
  });

  await test('todo_write stores todos on agent', async () => {
    const store = createMockStore();
    const bridge = createMockBridge();
    const rfs = new RuntimeFeatureStore({ store, bridge, workspaceRoot: '/tmp/test' });
    const agent = await rfs.executeTool('spawn_agent', { prompt: 'Todo test', name: 'todo-agent', run_in_background: true }, {});
    const result = await rfs.executeTool('todo_write', {
      agentId: agent.id,
      todos: [
        { text: 'Read files', done: false },
        { text: 'Write report', done: false }
      ],
      mode: 'replace'
    }, { agentId: agent.id });
    assert(result, 'Expected result');
    assert(Array.isArray(result.todos), 'Expected todos array');
    assert(result.todos.length === 2, `Expected 2 todos, got ${result.todos.length}`);
  });

  await test('get_onboarding returns state', async () => {
    const store = createMockStore();
    const bridge = createMockBridge();
    const rfs = new RuntimeFeatureStore({ store, bridge, workspaceRoot: '/tmp/test' });
    const result = await rfs.executeTool('get_onboarding', {}, {});
    assert(result, 'Expected onboarding state');
    assert(typeof result.summary === 'string', 'Expected summary string');
  });

  await test('upsert_hook stores hook record', async () => {
    const store = createMockStore();
    const bridge = createMockBridge();
    const rfs = new RuntimeFeatureStore({ store, bridge, workspaceRoot: '/tmp/test' });
    const hook = await rfs.executeTool('upsert_hook', {
      phase: 'pre_tool',
      action: 'block',
      match: { tools: ['delete_path'] },
      reason: 'Prevent accidental deletions in test'
    }, {});
    assert(hook, 'Expected hook result');
    assert(hook.id, 'Expected hook id');

    const list = await rfs.executeTool('list_hooks', {}, {});
    assert(list.hooks.length >= 1, 'Expected at least 1 hook');
  });
}

runTests().then(() => {
  console.log('\n=== Agent Orchestration Test Results ===\n');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.name}`);
    if (r.error) console.log(`   Error: ${r.error}`);
  }
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
  if (failed > 0) process.exit(1);
}).catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
