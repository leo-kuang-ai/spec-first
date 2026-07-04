'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const BIN_PATH = path.join(REPO_ROOT, 'bin', 'spec-first.js');
const PACKAGE_JSON = require('../../package.json');

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [BIN_PATH, ...args], {
    cwd: options.cwd || REPO_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(options.env || {}),
    },
    shell: false,
    windowsHide: true,
  });
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-cli-entry-'));
}

async function captureRunCliInProcess(args, options = {}) {
  const { runCli: runCliInProcess } = require('../../src/cli');
  const stdoutChunks = [];
  const stderrChunks = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  const originalUserInfo = os.userInfo;
  const originalHomedir = os.homedir;
  const envKeys = Object.keys(options.env || {});
  const previousEnv = {};

  for (const key of envKeys) {
    previousEnv[key] = process.env[key];
    process.env[key] = options.env[key];
  }

  if (options.home) {
    os.userInfo = () => ({ homedir: options.home });
    os.homedir = () => options.home;
  }

  console.log = (message = '') => stdoutChunks.push(`${String(message)}\n`);
  console.error = (message = '') => stderrChunks.push(`${String(message)}\n`);
  process.stdout.write = (chunk) => {
    stdoutChunks.push(String(chunk));
    return true;
  };
  process.stderr.write = (chunk) => {
    stderrChunks.push(String(chunk));
    return true;
  };

  try {
    const status = await runCliInProcess(args);
    return {
      status,
      stdout: stdoutChunks.join(''),
      stderr: stderrChunks.join(''),
    };
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    os.userInfo = originalUserInfo;
    os.homedir = originalHomedir;
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previousEnv[key];
      }
    }
  }
}

describe('CLI entry contract', () => {
  test('help exits successfully and advertises supported package commands', () => {
    const result = runCli(['--help']);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('doctor');
    expect(result.stdout).toContain('init');
    expect(result.stdout).toContain('Interactively install workflows');
    expect(result.stdout).toContain('clean (--claude|--codex|--cursor|--kiro|--qoder)');
    expect(result.stdout).toContain('Upgrade the spec-first CLI package');
    expect(result.stdout).toContain('refresh runtime assets with `spec-first init`');
    expect(result.stdout).not.toContain('check-only; never auto-upgrades');
    expect(result.stdout).not.toContain('[--claude|--codex] Check version and runtime freshness');
    expect(result.stdout).toContain('tasks <subcommand>');
    expect(result.stdout).toContain('session <subcommand>');
  });

  test('version exits successfully and keeps package CLI guidance visible', () => {
    const result = runCli(['-v']);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(`Spec-First v${PACKAGE_JSON.version}`);
    expect(result.stdout).toContain('Claude Code, Codex, Kiro, Qoder, and Cursor generated-runtime preview');
    expect(result.stdout).toContain('例如: spec-plan、spec-work、spec-code-review、spec-mcp-setup');
  });

  test('doctor help names the current setup entrypoint and deferred runtime-setup alias', () => {
    const result = runCli(['doctor', '--help']);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('MCP/helper setup is handled by the matching spec-mcp-setup workflow entrypoint: Claude/Qoder project command or Codex/Cursor/Kiro Skill.');
    expect(result.stdout).toContain('target name: spec-runtime-setup, pending host alias contract');
    expect(result.stdout).not.toContain('legacy alias: spec-mcp-setup');
    expect(result.stdout).not.toContain('$spec-runtime-setup or /spec:runtime-setup');
  });

  test('init help documents non-interactive workspace targeting flags', () => {
    const result = runCli(['init', '--help']);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('--all-repos');
    expect(result.stdout).toContain('--repo <path>');
    expect(result.stdout).toContain('--dry-run');
    expect(result.stdout).toContain('--sync-user-language');
    expect(result.stdout).toContain('--no-sync-user-language');
  });

  test('subcommand help does not consume the package version reminder gate', async () => {
    const home = makeTempDir();
    const statePath = path.join(home, '.spec-first', 'version-reminder.json');

    try {
      for (const command of ['doctor', 'init', 'clean', 'update']) {
        for (const helpFlag of ['--help', '-h']) {
          const result = await captureRunCliInProcess([command, helpFlag], {
            home,
            env: {
              SPEC_FIRST_VERSION_REMINDER_LATEST: '9.9.9',
            },
          });

          expect(result.status).toBe(0);
          expect(result.stderr).not.toContain('Update available for spec-first');
        }
      }

      expect(fs.existsSync(statePath)).toBe(false);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  });

  test('init --all-repos dry-run uses the real CLI parser from a parent workspace', () => {
    const workspaceRoot = makeTempDir();
    const home = makeTempDir();

    try {
      fs.mkdirSync(path.join(workspaceRoot, 'project-a', '.git'), { recursive: true });
      fs.mkdirSync(path.join(workspaceRoot, 'project-b', '.git'), { recursive: true });

      const result = runCli([
        'init',
        '--codex',
        '--all-repos',
        '--dry-run',
        '-y',
        '-u',
        'reviewer',
        '--lang',
        'en',
      ], {
        cwd: workspaceRoot,
        env: { HOME: home },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('Workspace preview: spec-first init (codex)');
      expect(result.stdout).toContain('selection_source: explicit-all-repos');
      expect(result.stdout).toContain('Child 1/2: project-a');
      expect(fs.existsSync(path.join(workspaceRoot, '.spec-first', 'workspace', 'init-summary.json'))).toBe(false);
      expect(fs.existsSync(path.join(workspaceRoot, 'project-a', 'AGENTS.md'))).toBe(false);
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    }
  });

  test('init --all-repos -y preserves per-host workspace summaries for default hosts', () => {
    const workspaceRoot = makeTempDir();
    const home = makeTempDir();

    try {
      fs.mkdirSync(path.join(workspaceRoot, 'project-a', '.git'), { recursive: true });
      fs.mkdirSync(path.join(workspaceRoot, 'project-b', '.git'), { recursive: true });

      const result = runCli([
        'init',
        '--all-repos',
        '-y',
        '-u',
        'reviewer',
        '--lang',
        'en',
      ], {
        cwd: workspaceRoot,
        env: { HOME: home },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('Workspace init summary: ready (2/2 ready)');

      const workspaceSummaryDir = path.join(workspaceRoot, '.spec-first', 'workspace');
      const summaryIndex = JSON.parse(fs.readFileSync(path.join(workspaceSummaryDir, 'init-summary.json'), 'utf8'));
      const claudeSummary = JSON.parse(fs.readFileSync(path.join(workspaceSummaryDir, 'init-summary-claude.json'), 'utf8'));
      const codexSummary = JSON.parse(fs.readFileSync(path.join(workspaceSummaryDir, 'init-summary-codex.json'), 'utf8'));

      expect(summaryIndex.schema_version).toBe('workspace-init-summary-index.v1');
      expect(summaryIndex.counts).toMatchObject({
        platform_total: 2,
        platform_ready: 2,
        platform_action_required: 0,
        total: 4,
        ready: 4,
        action_required: 0,
      });
      expect(Object.keys(summaryIndex.platforms).sort()).toEqual(['claude', 'codex']);
      expect(summaryIndex.platforms.claude.path).toBe('.spec-first/workspace/init-summary-claude.json');
      expect(summaryIndex.platforms.codex.path).toBe('.spec-first/workspace/init-summary-codex.json');
      expect(claudeSummary).toMatchObject({
        schema_version: 'workspace-init-summary.v1',
        platform: 'claude',
        overall_status: 'ready',
      });
      expect(codexSummary).toMatchObject({
        schema_version: 'workspace-init-summary.v1',
        platform: 'codex',
        overall_status: 'ready',
      });
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    }
  });

  test('init workspace target flags reject unsafe combinations through the real CLI parser', () => {
    const projectRoot = makeTempDir();
    const workspaceRoot = makeTempDir();
    const home = makeTempDir();

    try {
      fs.mkdirSync(path.join(projectRoot, '.git'), { recursive: true });
      fs.mkdirSync(path.join(workspaceRoot, 'project-a', '.git'), { recursive: true });

      const insideGit = runCli([
        'init',
        '--codex',
        '--all-repos',
        '-y',
        '-u',
        'reviewer',
        '--lang',
        'en',
      ], {
        cwd: projectRoot,
        env: { HOME: home },
      });
      expect(insideGit.status).toBe(2);
      expect(insideGit.stderr).toContain('--all-repos must be run from a parent workspace');

      const conflicting = runCli([
        'init',
        '--codex',
        '--all-repos',
        '--repo',
        'project-a',
        '-y',
        '-u',
        'reviewer',
        '--lang',
        'en',
      ], {
        cwd: workspaceRoot,
        env: { HOME: home },
      });
      expect(conflicting.status).toBe(2);
      expect(conflicting.stderr).toContain('Cannot combine --repo and --all-repos');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    }
  });

  test('unknown command exits with usage-error code and actionable help', () => {
    const result = runCli(['unknown-command']);

    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr).toMatch(/Unknown command: unknown-command/i);
    expect(result.stderr).toContain('Run `spec-first --help`');
    expect(result.stderr).toContain('Usage:');
  });

  test('CI and NO_COLOR mode does not emit ANSI escape sequences', () => {
    const result = runCli(['--help'], {
      env: {
        CI: 'true',
        NO_COLOR: '1',
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/\x1B\[[0-?]*[ -/]*[@-~]/);
  });
});
