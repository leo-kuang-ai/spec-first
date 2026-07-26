'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');

const repoRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(repoRoot, 'bin', 'spec-first.js');
const roots = new Set();

afterEach(() => {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
  roots.clear();
});

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: 120000,
    ...options,
  });
  if (result.error) throw result.error;
  return result;
}

function requireSuccess(result, label) {
  if (result.status !== 0) {
    throw new Error(`${label} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

function createTargetRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-lfg-fingerprint-projection-'));
  roots.add(root);
  const projectRoot = path.join(root, 'project');
  const home = path.join(root, 'home');
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(path.join(projectRoot, 'README.md'), '# target\n');
  requireSuccess(run('git', ['init', '-q'], { cwd: projectRoot }), 'git init');
  requireSuccess(run('git', ['config', 'user.email', 'projection@example.com'], { cwd: projectRoot }), 'git config email');
  requireSuccess(run('git', ['config', 'user.name', 'Projection Test'], { cwd: projectRoot }), 'git config name');
  requireSuccess(run('git', ['add', 'README.md'], { cwd: projectRoot }), 'git add');
  requireSuccess(run('git', ['commit', '-qm', 'initial'], { cwd: projectRoot }), 'git commit');
  return { projectRoot, home };
}

test('init projects an executable LFG fingerprint helper and keeps ignored workflow evidence out of its fingerprint', () => {
  const fixture = createTargetRepo();
  const hostFlags = getSupportedPlatforms().map((platform) => `--${platform}`);
  requireSuccess(run(process.execPath, [
    cliPath,
    'init',
    ...hostFlags,
    '-y',
    '-u',
    'LFG Fingerprint Projection Test',
    '--lang',
    'zh',
    '--no-sync-user-language',
  ], {
    cwd: fixture.projectRoot,
    env: { ...process.env, HOME: fixture.home, USERPROFILE: fixture.home },
  }), 'spec-first init');

  const baselineFingerprints = new Map();
  for (const platform of getSupportedPlatforms()) {
    const adapter = getAdapter(platform);
    const runtimeRoot = adapter.skillsRoot;
    const helper = path.join(
      fixture.projectRoot,
      runtimeRoot,
      'spec-lfg',
      'scripts',
      'working-tree-fingerprint.cjs',
    );
    expect(fs.existsSync(helper)).toBe(true);

    const result = requireSuccess(run(process.execPath, [helper], { cwd: fixture.projectRoot }), `${platform} helper`);
    const output = JSON.parse(result.stdout);
    expect(output).toMatchObject({
      schema_version: 'spec-work-working-tree-fingerprint/v1',
      repo_root: fs.realpathSync(fixture.projectRoot),
    });
    expect(output.fingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
    baselineFingerprints.set(platform, output.fingerprint);
  }

  const summaryPath = path.join(
    fixture.projectRoot,
    '.spec-first',
    'workflows',
    'spec-work',
    'projection',
    'run',
    'verification-run-summary.json',
  );
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, '{"status":"written"}\n', 'utf8');
  const ignoreProbe = run('git', ['check-ignore', '-q', '.spec-first/workflows/spec-work/projection/run/verification-run-summary.json'], {
    cwd: fixture.projectRoot,
  });
  expect(ignoreProbe.status).toBe(0);

  for (const platform of getSupportedPlatforms()) {
    const adapter = getAdapter(platform);
    const helper = path.join(
      fixture.projectRoot,
      adapter.skillsRoot,
      'spec-lfg',
      'scripts',
      'working-tree-fingerprint.cjs',
    );
    const result = requireSuccess(run(process.execPath, [helper], { cwd: fixture.projectRoot }), `${platform} helper after summary`);
    expect(JSON.parse(result.stdout).fingerprint).toBe(baselineFingerprints.get(platform));
  }
});
