'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

// Node >=20.12 (CVE-2024-27980) refuses to spawn a `.cmd` shim with shell:false, so naming
// `npm.cmd` / `spec-first.cmd` directly makes these paths unusable on Windows. Both must go
// through an explicit Node interpreter instead.
describe('spec-first update spawns without .cmd shims', () => {
  function loadUpdateWithSpawnSpy() {
    jest.resetModules();
    const calls = [];
    jest.doMock('node:child_process', () => ({
      ...jest.requireActual('node:child_process'),
      spawnSync: (command, args, options) => {
        calls.push({ command, args, options });
        return { status: 0, error: null };
      },
    }));
    return { calls, update: require('../../src/cli/commands/update') };
  }

  afterEach(() => {
    jest.dontMock('node:child_process');
    jest.resetModules();
  });

  test('the global install runs npm through the shared Node CLI resolver', async () => {
    const { calls, update } = loadUpdateWithSpawnSpy();

    await update.runUpdate([], {
      runRuntimeRefresh: () => ({ status: 0, errorCode: null }),
      resolveRuntimeRefreshCommand: () => ({ args: ['init', '-y'], cwd: repoRoot, reason_code: 'test' }),
      resolveInstalledCliPath: () => ({ ok: true, cliPath: '/global/spec-first/bin/spec-first.js' }),
      clearVersionReminderCooldown: () => {},
    });

    expect(calls).toHaveLength(1);
    const [installCall] = calls;
    expect(installCall.command).toBe(process.execPath);
    expect(path.basename(installCall.args[0])).toBe('npm-cli.js');
    expect(installCall.args.slice(1)).toEqual(['install', '-g', 'spec-first@latest']);
    expect(calls.some((call) => String(call.command).endsWith('.cmd'))).toBe(false);
  });

  test('the runtime refresh runs the upgraded global package bin through Node instead of the invoking checkout', async () => {
    const { calls, update } = loadUpdateWithSpawnSpy();
    const globalCliPath = path.join(os.tmpdir(), 'global-node_modules', 'spec-first', 'bin', 'spec-first.js');

    await update.runUpdate([], {
      resolveRuntimeRefreshCommand: () => ({
        args: ['init', '--claude', '-y'],
        cwd: repoRoot,
        reason_code: 'test',
      }),
      resolveInstalledCliPath: () => ({
        ok: true,
        cliPath: globalCliPath,
        reason_code: 'global-package-cli-resolved',
      }),
      clearVersionReminderCooldown: () => {},
    });

    const refreshCall = calls.find((call) => Array.isArray(call.args) && call.args.includes('init'));
    expect(refreshCall).toBeDefined();
    expect(refreshCall.command).toBe(process.execPath);
    expect(refreshCall.args[0]).toBe(globalCliPath);
    expect(refreshCall.args.slice(1)).toEqual(['init', '--claude', '-y']);
    expect(refreshCall.args[0]).not.toBe(path.join(repoRoot, 'bin', 'spec-first.js'));
    expect(calls.some((call) => String(call.command).endsWith('.cmd'))).toBe(false);
  });

  test('an unresolved global CLI degrades without running the stale checkout or claiming refresh completion', async () => {
    const { update } = loadUpdateWithSpawnSpy();
    const runRuntimeRefresh = jest.fn(() => ({ status: 0, errorCode: null }));
    const logs = [];
    const errors = [];
    const logSpy = jest.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation((message = '') => errors.push(String(message)));
    try {
      const exitCode = await update.runUpdate([], {
        runInstall: () => ({ status: 0, errorCode: null }),
        runRuntimeRefresh,
        resolveRuntimeRefreshCommand: () => ({ args: ['init', '-y'], cwd: repoRoot, reason_code: 'test' }),
        resolveInstalledCliPath: () => ({ ok: false, reason_code: 'global-package-cli-unresolved' }),
        clearVersionReminderCooldown: () => {},
      });

      expect(exitCode).toBe(1);
      expect(runRuntimeRefresh).not.toHaveBeenCalled();
      expect(logs).not.toContain('Runtime refresh completed.');
      expect(errors.join('\n')).toContain('global-package-cli-unresolved');
    } finally {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});

// The refresh must target the repository root. Running it against the invocation cwd made
// platform detection come back empty in any subdirectory, which silently downgraded the refresh
// to `init -y` and installed default hosts the user never selected.
describe('spec-first update resolves the refresh target from the git root', () => {
  function initRepoWithSubdir(platform) {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-update-root-')));
    fs.mkdirSync(path.join(root, '.git'), { recursive: true });
    const { getAdapter } = require('../../src/cli/adapters');
    const stateFile = path.join(root, getAdapter(platform).stateFile);
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify({ platform }), 'utf8');
    const subdir = path.join(root, 'packages', 'nested');
    fs.mkdirSync(subdir, { recursive: true });
    return { root, subdir };
  }

  test('detects the installed host when invoked from a subdirectory', () => {
    const { resolveRuntimeRefreshCommand } = require('../../src/cli/commands/update');
    const { root, subdir } = initRepoWithSubdir('claude');

    const resolved = resolveRuntimeRefreshCommand(subdir);

    expect(resolved.reason_code).toBe('single-git-repo');
    expect(resolved.cwd).toBe(root);
    expect(resolved.args).toEqual(['init', '--claude', '-y']);
    expect(resolved.args).not.toEqual(['init', '-y']);
  });

  test('still resolves the git root when invoked at the root itself', () => {
    const { resolveRuntimeRefreshCommand } = require('../../src/cli/commands/update');
    const { root } = initRepoWithSubdir('codex');

    const resolved = resolveRuntimeRefreshCommand(root);

    expect(resolved.cwd).toBe(root);
    expect(resolved.args).toEqual(['init', '--codex', '-y']);
  });
});

describe('spec-first update resolves the upgraded global package entry', () => {
  test('validates package identity and resolves the declared bin under npm root -g', () => {
    const { resolvePackageCliFromGlobalRoot } = require('../../src/cli/commands/update');
    const globalRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-global-root-')));
    const packageRoot = path.join(globalRoot, 'spec-first');
    const cliPath = path.join(packageRoot, 'bin', 'spec-first.js');
    fs.mkdirSync(path.dirname(cliPath), { recursive: true });
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({
      name: 'spec-first',
      bin: { 'spec-first': 'bin/spec-first.js' },
    }), 'utf8');
    fs.writeFileSync(cliPath, '#!/usr/bin/env node\n', 'utf8');

    try {
      expect(resolvePackageCliFromGlobalRoot(globalRoot)).toEqual(expect.objectContaining({
        ok: true,
        cliPath,
        reason_code: 'global-package-cli-resolved',
      }));
    } finally {
      fs.rmSync(globalRoot, { recursive: true, force: true });
    }
  });

  test('rejects a global package manifest whose bin escapes the package root', () => {
    const { resolvePackageCliFromGlobalRoot } = require('../../src/cli/commands/update');
    const globalRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-global-root-')));
    const packageRoot = path.join(globalRoot, 'spec-first');
    fs.mkdirSync(packageRoot, { recursive: true });
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({
      name: 'spec-first',
      bin: { 'spec-first': '../stale-checkout.js' },
    }), 'utf8');

    try {
      expect(resolvePackageCliFromGlobalRoot(globalRoot)).toEqual({
        ok: false,
        cliPath: null,
        reason_code: 'global-package-bin-outside-package',
      });
    } finally {
      fs.rmSync(globalRoot, { recursive: true, force: true });
    }
  });
});
