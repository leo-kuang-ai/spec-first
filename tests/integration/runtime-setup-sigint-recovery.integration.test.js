'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../..');
const setupScript = path.join(repoRoot, 'skills/spec-runtime-setup/scripts/setup.cjs');

test('顶层 setup 进程收到 SIGINT 后可安全重入且不发布伪 complete', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-runtime-setup-sigint-'));
  const home = path.join(root, 'home');
  const work = path.join(root, 'work');
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(work, { recursive: true });
  const child = spawn(process.execPath, [
    '-e',
    `process.env.MCP_SETUP_HOST='codex'; const { runSetup } = require(${JSON.stringify(setupScript)}); runSetup({ argv: ['--only', 'codegraph'], cwd: ${JSON.stringify(work)}, homeDir: ${JSON.stringify(home)}, env: process.env, runner: () => { const end=Date.now()+30000; while(Date.now()<end){} return { status: 0, stdout: '', stderr: '' }; } });`,
  ], { cwd: repoRoot, env: { ...process.env, HOME: home, MCP_SETUP_HOST: 'codex' }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve) => setTimeout(resolve, 150));
  child.kill('SIGINT');
  const first = await new Promise((resolve) => child.once('close', (code, signal) => resolve({ code, signal })));
  expect(first.signal).toBe('SIGINT');

  const stateCandidates = [
    path.join(home, '.codex/spec-first/state.json'),
    path.join(work, '.codex/spec-first/state.json'),
  ];
  for (const statePath of stateCandidates) {
    if (!fs.existsSync(statePath)) continue;
    const raw = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    expect(raw.status).not.toBe('complete');
  }

  const rerun = spawn(process.execPath, [setupScript, '--help'], {
    cwd: work,
    env: { ...process.env, HOME: home, MCP_SETUP_HOST: 'codex' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const second = await new Promise((resolve) => rerun.once('close', (code, signal) => resolve({ code, signal })));
  expect(second.code).toBe(0);
  expect(second.signal).toBeNull();
  fs.rmSync(root, { recursive: true, force: true });
}, 40000);
