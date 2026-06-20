const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

function quoteArg(value) {
  const text = String(value);
  if (!/[ \t"]/u.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function waitForPath(targetPath, timeoutMs = 5000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(targetPath)) return true;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return fs.existsSync(targetPath);
}

async function waitForLogMarkers(targetPath, marker, timeoutMs = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(targetPath)) {
      const content = fs.readFileSync(targetPath, 'utf8');
      const lines = content.split(/\r?\n/).filter(line => line.includes(marker));
      if (lines.length) return lines;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  if (!fs.existsSync(targetPath)) return [];
  return fs.readFileSync(targetPath, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.includes(marker));
}

async function runVsCodeTests(executablePath, args) {
  await new Promise((resolve, reject) => {
    const child = process.platform === 'win32'
      ? cp.spawn('powershell.exe', [
        '-NoProfile',
        '-Command',
        `& ${quotePowerShell(executablePath)} ${args.map(quotePowerShell).join(' ')}`
      ], {
        stdio: 'inherit',
        shell: false,
        env: process.env
      })
      : cp.spawn(executablePath, args, {
        stdio: 'inherit',
        shell: false,
        env: process.env
      });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(signal ? `VS Code test run terminated with signal ${signal}` : `VS Code test run failed with code ${code}`));
    });
  });
}

async function main() {
  if (!process.env.HF_TOKEN) {
    console.log('[hf-ai-code] Skipping live VS Code tests: HF_TOKEN is not set.');
    return;
  }

  const repoRoot = path.resolve(__dirname, '..');
  const installedCodePath = process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd')
    : '';
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-ai-code-live-'));
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-ai-code-user-'));
  const extensionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-ai-code-exts-'));
  const logsPath = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-ai-code-logs-'));
  const srcDir = path.join(workspaceDir, 'src');

  if (!fs.existsSync(installedCodePath)) {
    console.log(`[hf-ai-code] Skipping live VS Code tests: VS Code executable was not found at ${installedCodePath}.`);
    return;
  }

  fs.mkdirSync(srcDir, { recursive: true });

  const expectedTerm = 'hyperfluxSemaphore';
  const expectedFile = 'src/semantic-target.js';

  fs.writeFileSync(
    path.join(srcDir, 'semantic-target.js'),
    [
      'export function loadSemanticTarget() {',
      '  const hyperfluxSemaphore = "Photon orchard retrieval pipeline";',
      '  return hyperfluxSemaphore;',
      '}',
      ''
    ].join('\n'),
    'utf8'
  );

  fs.writeFileSync(
    path.join(srcDir, 'notes.js'),
    [
      'export const miscNote = "This file is intentionally unrelated to the semantic target.";',
      ''
    ].join('\n'),
    'utf8'
  );

  fs.writeFileSync(
    path.join(workspaceDir, 'README.md'),
    [
      '# Live Test Workspace',
      '',
      'This workspace is generated automatically for HF AI Code live integration tests.',
      ''
    ].join('\n'),
    'utf8'
  );

  process.env.HF_AI_CODE_EXPECTED_TERM = expectedTerm;
  process.env.HF_AI_CODE_EXPECTED_FILE = expectedFile;
  process.env.HF_AI_CODE_TEST_WORKSPACE = workspaceDir;

  console.log(`[hf-ai-code] Live test workspace: ${workspaceDir}`);
  console.log(`[hf-ai-code] Expected semantic target: ${expectedFile} (${expectedTerm})`);
  console.log(`[hf-ai-code] VS Code logs: ${logsPath}`);

  await runVsCodeTests(installedCodePath, [
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--disable-updates',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-workspace-trust',
    `--extensionTestsPath=${path.join(repoRoot, 'test', 'vscode')}`,
    `--extensionDevelopmentPath=${repoRoot}`,
    '--user-data-dir',
    userDataDir,
    '--extensions-dir',
    extensionsDir,
    '--logsPath',
    logsPath,
    '--new-window',
    workspaceDir
  ]);

  const resultPath = path.join(workspaceDir, 'live-test-result.json');
  await waitForPath(resultPath, 1500);
  if (fs.existsSync(resultPath)) {
    const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    console.log(`[hf-ai-code] Live test result: ${JSON.stringify(result)}`);
  } else {
    const rendererLogPath = path.join(logsPath, 'window1', 'renderer.log');
    await waitForPath(rendererLogPath, 3000);
    if (fs.existsSync(rendererLogPath)) {
      const extracted = (await waitForLogMarkers(rendererLogPath, '[hf-ai-code:test]', 10000))
        .map(line => line.replace(/^.*\[info\]\s*/, ''));
      if (extracted.length) {
        console.log('[hf-ai-code] Live test confirmations:');
        for (const line of extracted) console.log(`- ${line}`);
      } else {
        console.warn(`[hf-ai-code] Warning: no structured test confirmations were found in ${rendererLogPath}`);
      }
    } else {
      console.warn(`[hf-ai-code] Warning: live test did not produce ${resultPath} or ${rendererLogPath}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
