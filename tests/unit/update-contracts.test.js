'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  buildRuntimeRefreshArgs,
  detectInstalledRuntimePlatforms,
  insertInitTargetArgs,
  resolveRuntimeRefreshCommand,
  runUpdate,
  stripInitTargetArgs,
  withDeveloperPlaceholder,
} = require('../../src/cli/commands/update');

// 注入假 runInstall,避免单测触发真实 `npm install -g` 或联网。
function makeInstaller(outcome) {
  const calls = [];
  const runInstall = () => {
    calls.push(true);
    return outcome;
  };
  return { runInstall, calls };
}

function makeRuntimeRefresh(outcome) {
  const calls = [];
  const runRuntimeRefresh = (args, options) => {
    calls.push({ args, options });
    return outcome;
  };
  return { runRuntimeRefresh, calls };
}

async function captureUpdate(args, deps) {
  const logs = [];
  const errors = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (message = '') => logs.push(String(message));
  console.error = (message = '') => errors.push(String(message));
  try {
    const exitCode = await runUpdate(args, deps);
    return { exitCode, stdout: logs.join('\n'), stderr: errors.join('\n') };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

describe('spec-first update command', () => {
  test('successful npm install: calls installer once and refreshes runtime with fresh init', async () => {
    const { runInstall, calls } = makeInstaller({ status: 0, errorCode: null });
    const refresh = makeRuntimeRefresh({ status: 0, errorCode: null });
    const clearVersionReminderCooldown = jest.fn();
    const { exitCode, stdout } = await captureUpdate([], {
      runInstall,
      runRuntimeRefresh: refresh.runRuntimeRefresh,
      resolveRuntimeRefreshCommand: () => ({ args: ['init', '-y'], cwd: '/repo' }),
      clearVersionReminderCooldown,
    });
    expect(exitCode).toBe(0);
    expect(calls).toHaveLength(1);
    expect(refresh.calls).toEqual([{ args: ['init', '-y'], options: { cwd: '/repo' } }]);
    expect(clearVersionReminderCooldown).toHaveBeenCalledTimes(1);
    expect(stdout).toContain('npm install -g spec-first@latest');
    expect(stdout).toContain('Refreshing runtime assets via: spec-first init -y');
    expect(stdout).toContain('Runtime refresh completed.');
  });

  test('successful npm install: parent workspace refresh uses parent-only init', async () => {
    const { runInstall } = makeInstaller({ status: 0, errorCode: null });
    const refresh = makeRuntimeRefresh({ status: 0, errorCode: null });
    const { exitCode, stdout } = await captureUpdate([], {
      runInstall,
      runRuntimeRefresh: refresh.runRuntimeRefresh,
      resolveRuntimeRefreshCommand: () => ({ args: ['init', '-y'], cwd: '/workspace' }),
    });

    expect(exitCode).toBe(0);
    expect(refresh.calls).toEqual([{ args: ['init', '-y'], options: { cwd: '/workspace' } }]);
    expect(stdout).toContain('spec-first init -y');
  });

  test('default runtime refresh resolver detects a real parent workspace', () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-update-workspace-'));
    try {
      fs.mkdirSync(path.join(workspaceRoot, 'project-a', '.git'), { recursive: true });
      fs.mkdirSync(path.join(workspaceRoot, 'project-b', '.git'), { recursive: true });

      expect(resolveRuntimeRefreshCommand(workspaceRoot)).toEqual({
        args: ['init', '-y'],
        cwd: path.resolve(workspaceRoot),
        reason_code: 'parent-workspace',
        child_repo_count: 2,
      });
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  test('parent workspace runtime refresh uses child installed host flags when parent has no state', () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-update-workspace-child-host-'));
    try {
      const childRoot = path.join(workspaceRoot, 'project-a');
      fs.mkdirSync(path.join(childRoot, '.git'), { recursive: true });
      fs.mkdirSync(path.join(childRoot, '.kiro', 'spec-first'), { recursive: true });
      fs.writeFileSync(path.join(childRoot, '.kiro', 'spec-first', 'state.json'), '{}\n');

      expect(resolveRuntimeRefreshCommand(workspaceRoot)).toEqual({
        args: ['init', '--kiro', '--all-repos', '-y'],
        cwd: path.resolve(workspaceRoot),
        reason_code: 'parent-workspace',
        child_repo_count: 1,
      });
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  test('runtime refresh resolver uses explicit flags for installed preview host runtimes', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-update-kiro-'));
    try {
      fs.mkdirSync(path.join(projectRoot, '.git'), { recursive: true });
      fs.mkdirSync(path.join(projectRoot, '.kiro', 'spec-first'), { recursive: true });
      fs.writeFileSync(path.join(projectRoot, '.kiro', 'spec-first', 'state.json'), '{}\n');

      expect(detectInstalledRuntimePlatforms(projectRoot)).toEqual(['kiro']);
      expect(buildRuntimeRefreshArgs(projectRoot)).toEqual(['init', '--kiro', '-y']);
      expect(resolveRuntimeRefreshCommand(projectRoot)).toMatchObject({
        args: ['init', '--kiro', '-y'],
        cwd: path.resolve(projectRoot),
        reason_code: 'single-git-repo',
      });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('runtime refresh resolver preserves all installed host runtimes with explicit flags', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-update-hosts-'));
    try {
      fs.mkdirSync(path.join(projectRoot, '.git'), { recursive: true });
      for (const host of ['claude', 'codex', 'cursor', 'kiro', 'qoder']) {
        fs.mkdirSync(path.join(projectRoot, `.${host}`, 'spec-first'), { recursive: true });
        fs.writeFileSync(path.join(projectRoot, `.${host}`, 'spec-first', 'state.json'), '{}\n');
      }

      expect(detectInstalledRuntimePlatforms(projectRoot)).toEqual(['claude', 'codex', 'cursor', 'kiro', 'qoder']);
      expect(buildRuntimeRefreshArgs(projectRoot)).toEqual([
        'init',
        '--claude',
        '--codex',
        '--cursor',
        '--kiro',
        '--qoder',
        '-y',
      ]);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('failed npm install (non-zero): surfaces manual command, no init refresh, exit non-zero', async () => {
    const { runInstall } = makeInstaller({ status: 1, errorCode: null });
    const refresh = makeRuntimeRefresh({ status: 0, errorCode: null });
    const { exitCode, stdout, stderr } = await captureUpdate([], {
      runInstall,
      runRuntimeRefresh: refresh.runRuntimeRefresh,
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('Upgrade failed');
    expect(stderr).toContain('npm install -g spec-first@latest');
    expect(stdout).not.toContain('spec-first init');
    expect(refresh.calls).toHaveLength(0);
  });

  test('automatic runtime refresh failure returns update failure and fallback commands', async () => {
    const { runInstall } = makeInstaller({ status: 0, errorCode: null });
    const refresh = makeRuntimeRefresh({ status: 3, errorCode: null });
    const { exitCode, stderr } = await captureUpdate([], {
      runInstall,
      runRuntimeRefresh: refresh.runRuntimeRefresh,
      resolveRuntimeRefreshCommand: () => ({ args: ['init', '-y'], cwd: '/repo' }),
    });

    expect(exitCode).toBe(1);
    expect(stderr).toContain('Runtime refresh: degraded');
    expect(stderr).toContain('Single repo: spec-first init -y -u <name>');
    expect(stderr).toContain('Parent workspace: spec-first init -y -u <name>');
    expect(stderr).toContain('Child repo: spec-first init --repo <path> -y -u <name>');
  });

  test('automatic runtime refresh failure keeps fallback commands host-aware', async () => {
    const { runInstall } = makeInstaller({ status: 0, errorCode: null });
    const refresh = makeRuntimeRefresh({ status: 3, errorCode: null });
    const { exitCode, stderr } = await captureUpdate([], {
      runInstall,
      runRuntimeRefresh: refresh.runRuntimeRefresh,
      resolveRuntimeRefreshCommand: () => ({ args: ['init', '--kiro', '-y'], cwd: '/repo' }),
    });

    expect(exitCode).toBe(1);
    expect(stderr).toContain('Runtime refresh: degraded');
    expect(stderr).toContain('Single repo: spec-first init --kiro -y -u <name>');
    expect(stderr).toContain('Parent workspace: spec-first init --kiro -y -u <name>');
    expect(stderr).toContain('Child repo: spec-first init --kiro --repo <path> -y -u <name>');
    expect(stderr).not.toContain('Single repo: spec-first init -y -u <name>');
  });

  test('unknown refresh scope prints fallback commands without spawning init', async () => {
    const { runInstall } = makeInstaller({ status: 0, errorCode: null });
    const refresh = makeRuntimeRefresh({ status: 0, errorCode: null });
    const clearVersionReminderCooldown = jest.fn();
    const { exitCode, stdout, stderr } = await captureUpdate([], {
      runInstall,
      runRuntimeRefresh: refresh.runRuntimeRefresh,
      resolveRuntimeRefreshCommand: () => ({ args: null, cwd: '/tmp', reason_code: 'scope-undetermined' }),
      clearVersionReminderCooldown,
    });

    expect(exitCode).toBe(0);
    expect(refresh.calls).toHaveLength(0);
    expect(clearVersionReminderCooldown).toHaveBeenCalledTimes(1);
    expect(stdout).toContain('Runtime refresh: skipped');
    expect(stderr).toContain('Single repo: spec-first init -y -u <name>');
    expect(stderr).toContain('Parent workspace: spec-first init -y -u <name>');
    expect(stderr).toContain('Child repo: spec-first init --repo <path> -y -u <name>');
  });

  test('runtime refresh fallback helpers preserve host flags and insert target before -y', () => {
    expect(withDeveloperPlaceholder(['init', '--qoder', '-y'])).toEqual(['init', '--qoder', '-y', '-u', '<name>']);
    expect(insertInitTargetArgs(['init', '--qoder', '-y'], ['--repo', '<path>'])).toEqual([
      'init',
      '--qoder',
      '--repo',
      '<path>',
      '-y',
    ]);
  });

  test('all-repos refresh fallback prints valid single and child commands', async () => {
    const { runInstall } = makeInstaller({ status: 0, errorCode: null });
    const refresh = makeRuntimeRefresh({ status: 3, errorCode: null });
    const { exitCode, stderr } = await captureUpdate([], {
      runInstall,
      runRuntimeRefresh: refresh.runRuntimeRefresh,
      resolveRuntimeRefreshCommand: () => ({ args: ['init', '--kiro', '--all-repos', '-y'], cwd: '/workspace' }),
    });

    expect(exitCode).toBe(1);
    expect(stderr).toContain('Single repo: spec-first init --kiro -y -u <name>');
    expect(stderr).toContain('Parent workspace: spec-first init --kiro --all-repos -y -u <name>');
    expect(stderr).toContain('Child repo: spec-first init --kiro --repo <path> -y -u <name>');
    expect(stderr).not.toContain('--all-repos --repo');
    expect(stripInitTargetArgs(['init', '--kiro', '--all-repos', '--repo', 'repo-a', '-y'])).toEqual(['init', '--kiro', '-y']);
  });

  test('successful update remains successful when version reminder cleanup fails', async () => {
    const { runInstall } = makeInstaller({ status: 0, errorCode: null });
    const refresh = makeRuntimeRefresh({ status: 0, errorCode: null });
    const clearVersionReminderCooldown = jest.fn(() => {
      throw new Error('cleanup failed');
    });

    const { exitCode, stdout } = await captureUpdate([], {
      runInstall,
      runRuntimeRefresh: refresh.runRuntimeRefresh,
      resolveRuntimeRefreshCommand: () => ({ args: ['init', '-y'], cwd: '/repo' }),
      clearVersionReminderCooldown,
    });

    expect(exitCode).toBe(0);
    expect(clearVersionReminderCooldown).toHaveBeenCalledTimes(1);
    expect(stdout).toContain('Runtime refresh completed.');
  });

  test('failed update does not clear the cli version reminder cooldown', async () => {
    const { runInstall } = makeInstaller({ status: 1, errorCode: null });
    const clearVersionReminderCooldown = jest.fn();
    const { exitCode } = await captureUpdate([], {
      runInstall,
      clearVersionReminderCooldown,
    });

    expect(exitCode).not.toBe(0);
    expect(clearVersionReminderCooldown).not.toHaveBeenCalled();
  });

  test('npm not found (ENOENT): explains npm is missing, exit non-zero', async () => {
    const { runInstall } = makeInstaller({ status: null, errorCode: 'ENOENT' });
    const { exitCode, stderr } = await captureUpdate([], { runInstall });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('npm');
    expect(stderr.toLowerCase()).toContain('not found');
  });

  test('legacy --json flag is no longer supported: exit 2, installer not called', async () => {
    const { runInstall, calls } = makeInstaller({ status: 0, errorCode: null });
    const { exitCode, stderr } = await captureUpdate(['--json'], { runInstall });
    expect(exitCode).toBe(2);
    expect(stderr).toContain('Usage: spec-first update');
    expect(calls).toHaveLength(0);
  });

  test('unknown flag: exit 2, installer not called', async () => {
    const { runInstall, calls } = makeInstaller({ status: 0, errorCode: null });
    const { exitCode } = await captureUpdate(['--bogus'], { runInstall });
    expect(exitCode).toBe(2);
    expect(calls).toHaveLength(0);
  });

  test('--help documents the upgrade semantics and does not claim check-only', async () => {
    const { runInstall, calls } = makeInstaller({ status: 0, errorCode: null });
    const { exitCode, stdout } = await captureUpdate(['--help'], { runInstall });
    expect(exitCode).toBe(0);
    expect(calls).toHaveLength(0);
    expect(stdout).not.toContain('check-only');
    expect(stdout).not.toContain('NEVER');
    expect(stdout).toContain('npm install -g spec-first@latest');
    expect(stdout).toContain('spec-first init');
    expect(stdout).toContain('fresh `spec-first init` subprocess');
    expect(stdout).toContain('fallback init commands');
    expect(stdout).toContain('Exit codes:');
  });
});
