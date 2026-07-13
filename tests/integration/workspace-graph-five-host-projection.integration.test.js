'use strict';

// D6 — five-host `spec-first init` projection of the per-requirement workspace
// graph surface. Runs in a clean sandbox (never against the dirty working tree).
// Asserts each host mirror of `spec-runtime-setup` carries the new workspace-graph
// modules + SKILL docs, and doctor reports no drift for that host.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');

const repoRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(repoRoot, 'bin', 'spec-first.js');
const sandboxRoots = new Set();

const WORKSPACE_LIB_MODULES = [
  'workspace-manifest.cjs',
  'workspace-graph-artifacts.cjs',
  'workspace-target.cjs',
  'workspace-git-exclude.cjs',
  'workspace-graph-build.cjs',
  'workspace-graph-clean.cjs',
  'workspace-graph-executor.cjs',
  'workspace-graph-refresh.cjs',
  'workspace-graph-scope.cjs',
  'workspace-graph-status.cjs',
  'workspace-graph-state.cjs',
  'workspace-exec.cjs',
  'workspace-provider-runners.cjs',
  'workspace-routing-inject.cjs',
  'workspace-routing-instruction.cjs',
];

// Claude projects workflow skills under workflowsRoot; others use skillsRoot.
const SETUP_RUNTIME_ROOT = Object.freeze({
  claude: '.claude/spec-first/workflows',
  codex: '.agents/skills',
  cursor: '.cursor/skills',
  kiro: '.kiro/skills',
  qoder: '.qoder/skills',
});

afterEach(() => {
  for (const root of sandboxRoots) {
    fs.rmSync(root, { recursive: true, force: true });
  }
  sandboxRoots.clear();
});

function tempSandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-d6-'));
  sandboxRoots.add(root);
  const projectRoot = path.join(root, 'project');
  const home = path.join(root, 'home');
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  return { projectRoot, home };
}

function runSpecFirst(args, sandbox) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: sandbox.projectRoot,
    env: {
      ...process.env,
      HOME: sandbox.home,
      USERPROFILE: sandbox.home,
      HOMEDRIVE: path.parse(sandbox.home).root,
      HOMEPATH: sandbox.home.slice(path.parse(sandbox.home).root.length),
    },
    encoding: 'utf8',
    timeout: 180000,
  });
}

function runProjectedSetup(setupRoot, args, sandbox) {
  return spawnSync(process.execPath, [path.join(setupRoot, 'scripts', 'setup.cjs'), ...args], {
    cwd: sandbox.projectRoot,
    env: {
      ...process.env,
      HOME: sandbox.home,
      USERPROFILE: sandbox.home,
    },
    encoding: 'utf8',
    timeout: 30000,
  });
}

describe('D6 five-host workspace-graph projection', () => {
  test('spec-first init projects workspace-graph modules + docs on all five hosts; doctor no drift', () => {
    const sourceSkill = fs.readFileSync(path.join(repoRoot, 'skills', 'spec-runtime-setup', 'SKILL.md'), 'utf8');
    const sourceArgumentHint = sourceSkill.split('\n').find((line) => line.startsWith('argument-hint:')) || '';
    expect(sourceArgumentHint).toContain('--workspace-graph');
    expect(sourceArgumentHint).toContain('--json');

    const sandbox = tempSandbox();
    const platforms = getSupportedPlatforms();
    expect(platforms).toEqual(expect.arrayContaining(['claude', 'codex', 'cursor', 'kiro', 'qoder']));
    expect(platforms).toHaveLength(5);

    const init = runSpecFirst([
      'init',
      ...platforms.map((p) => `--${p}`),
      '-y',
      '-u',
      'workspace-graph-d6',
      '--lang',
      'en',
      '--no-sync-user-language',
    ], sandbox);
    if (init.status !== 0) {
      throw new Error(`five-host init failed:\nstdout:\n${init.stdout}\nstderr:\n${init.stderr}`);
    }
    expect(init.status).toBe(0);

    const projectedRepo = path.join(sandbox.projectRoot, 'api');
    fs.mkdirSync(path.join(sandbox.projectRoot, '.spec-first'), { recursive: true });
    fs.mkdirSync(projectedRepo, { recursive: true });
    expect(spawnSync('git', ['init', '-q', projectedRepo]).status).toBe(0);
    fs.writeFileSync(path.join(sandbox.projectRoot, '.spec-first', 'workspace.yaml'), [
      'schema_version: workspace-manifest.v1',
      'repos:',
      '  - path: api',
      '',
    ].join('\n'));

    for (const platform of platforms) {
      const adapter = getAdapter(platform);
      const runtimeRoot = SETUP_RUNTIME_ROOT[platform] || adapter.workflowsRoot || adapter.skillsRoot;
      const setupRoot = path.join(sandbox.projectRoot, runtimeRoot, 'spec-runtime-setup');
      expect(fs.existsSync(setupRoot)).toBe(true);

      const skillMd = fs.readFileSync(path.join(setupRoot, 'SKILL.md'), 'utf8');
      expect(skillMd).toContain('Per-Requirement Workspace Graph');
      expect(skillMd).toContain('--workspace-graph');
      expect(skillMd).toContain('--workspace-graph-status');
      expect(skillMd).toContain('--workspace-graph-clean');
      // Honest Kiro/Qoder CodeGraph degradation stays in routing content (projected module).
      // SKILL documents the workspace-graph domain for all hosts.

      const argsSource = fs.readFileSync(path.join(setupRoot, 'scripts', 'lib', 'args.cjs'), 'utf8');
      expect(argsSource).toContain('workspaceGraph');
      expect(argsSource).toContain('workspaceGraphClean');
      expect(argsSource).toContain('workspaceGraphStatus');

      const setupSource = fs.readFileSync(path.join(setupRoot, 'scripts', 'setup.cjs'), 'utf8');
      expect(setupSource).toContain('runWorkspaceGraphSetup');
      expect(setupSource).toContain('runWorkspaceGraphCleanSetup');
      expect(setupSource).toContain('runWorkspaceGraphStatusSetup');

      for (const mod of WORKSPACE_LIB_MODULES) {
        const modPath = path.join(setupRoot, 'scripts', 'lib', mod);
        expect(fs.existsSync(modPath)).toBe(true);
      }

      const projectedHelp = runProjectedSetup(setupRoot, ['--help'], sandbox);
      expect(projectedHelp.status).toBe(0);
      expect(projectedHelp.stdout).toContain('--workspace-graph-status');

      // Parse and execute the generated entrypoint itself, rather than merely
      // requiring a projected helper module. Status is intentionally read-only
      // and an unbuilt graph reports `absent` with a successful diagnostic exit.
      const projectedStatus = runProjectedSetup(setupRoot, [
        '--workspace-graph-status',
        '--repos', 'api',
        '--json',
      ], sandbox);
      expect(projectedStatus.status).toBe(0);
      expect(JSON.parse(projectedStatus.stdout)).toEqual(expect.objectContaining({
        schema_version: 'workspace-graph-status.v1',
        status: 'absent',
        reason_code: 'absent',
      }));

      const projectedTarget = require(path.join(setupRoot, 'scripts', 'lib', 'workspace-target.cjs'));
      expect(projectedTarget.resolveWorkspaceTargets({
        cwd: sandbox.projectRoot,
        allowDiscovery: false,
      })).toEqual(expect.objectContaining({
        manifest_error: null,
        repos: [expect.objectContaining({ repo_id: 'api', source: 'manifest' })],
      }));

      // Routing instruction content carries Kiro/Qoder degradation note.
      const routing = fs.readFileSync(
        path.join(setupRoot, 'scripts', 'lib', 'workspace-routing-instruction.cjs'),
        'utf8',
      );
      expect(routing).toContain('kiro');
      expect(routing).toContain('qoder');

      const doctor = runSpecFirst(['doctor', `--${platform}`, '--json'], sandbox);
      expect(doctor.status).toBe(0);
      let report;
      try {
        report = JSON.parse(doctor.stdout);
      } catch (error) {
        throw new Error(`doctor JSON parse failed for ${platform}: ${error.message}\n${doctor.stdout}\n${doctor.stderr}`);
      }
      expect(report.checks.filter((check) => check.drift === true)).toEqual([]);
      expect(report.checks.filter((check) => check.level === 'ERROR')).toEqual([]);
    }
  }, 240000);
});
