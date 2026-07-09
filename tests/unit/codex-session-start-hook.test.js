'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { getAdapter } = require('../../src/cli/adapters');
const { buildManagedBlock } = require('../../src/cli/lang-policy');

const REPO_ROOT = path.join(__dirname, '..', '..');
const TRUSTED_CLI_PATH = path.join(REPO_ROOT, 'bin', 'spec-first.js');
const LEGACY_CLEANUP_PATHS = [
  '.codex/commands/spec',
  '.codex/spec-first/commands',
  '.agents/plugins',
  'plugins/spec',
  'plugins/spec-first',
];

function expectedSessionStartCommand(projectRoot) {
  return `${shellQuote(process.execPath)} ${shellQuote(path.join(projectRoot, '.codex/hooks/session-start').replace(/\\/g, '/'))}`;
}

function expectedWindowsSessionStartCommand(projectRoot) {
  return windowsCommandQuote(path.join(projectRoot, '.codex/hooks/session-start.cmd'));
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function windowsCommandQuote(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-codex-hook-'));
}

function writeRenderedCodexHook(projectRoot, transform = (content) => content) {
  const adapter = getAdapter('codex');
  const hookOperation = adapter
    .planRuntimeFilesSync(projectRoot)
    .operations
    .find((operation) => operation.path === '.codex/hooks/session-start');
  const hookPath = path.join(projectRoot, '.codex', 'hooks', 'session-start');
  fs.mkdirSync(path.dirname(hookPath), { recursive: true });
  fs.writeFileSync(hookPath, transform(hookOperation.contents), 'utf8');
  fs.chmodSync(hookPath, 0o755);
  return hookPath;
}

function replaceTrustedCliPath(content, nextPath) {
  return content.replace(JSON.stringify(TRUSTED_CLI_PATH), JSON.stringify(nextPath));
}

function runHook(hookPath, options = {}) {
  return spawnSync(process.execPath, [hookPath], {
    cwd: options.cwd || path.dirname(path.dirname(path.dirname(hookPath))),
    encoding: 'utf8',
    input: options.input || '',
    env: {
      ...process.env,
      HOME: options.home || path.join(path.dirname(path.dirname(path.dirname(hookPath))), 'home'),
      ...options.env,
    },
  });
}

describe('Codex SessionStart hook runtime plan', () => {
  test('sync plan appends hook writes without replacing legacy cleanup ops', () => {
    const projectRoot = makeTempDir();

    try {
      const adapter = getAdapter('codex');
      const plan = adapter.planRuntimeFilesSync(projectRoot);
      const hookOps = plan.operations.filter((operation) => operation.reason === 'managed_runtime_hook');
      const cleanupOps = plan.operations.filter((operation) => operation.reason === 'managed_runtime_cleanup'
        || operation.reason === 'legacy_codex_spec_first_skill_cleanup');

      expect(plan.operations.slice(-2).map((operation) => operation.path)).toEqual([
        '.codex/hooks/session-start.cmd',
        '.codex/hooks.json',
      ]);
      expect(plan.operations.slice(-3).map((operation) => operation.path)).toEqual([
        '.codex/hooks/session-start',
        '.codex/hooks/session-start.cmd',
        '.codex/hooks.json',
      ]);
      expect(LEGACY_CLEANUP_PATHS.every((cleanupPath) =>
        cleanupOps.some((operation) => operation.path === cleanupPath)
      )).toBe(true);
      expect(cleanupOps.some((operation) => operation.path === '.codex/skills/work')).toBe(true);
      expect(cleanupOps.every((operation) => (
        operation.kind === 'remove_dir'
        && (
          operation.reason === 'managed_runtime_cleanup'
          || operation.reason === 'legacy_codex_spec_first_skill_cleanup'
        )
      ))).toBe(true);

      const sessionStart = hookOps.find((operation) => operation.path === '.codex/hooks/session-start');
      expect(sessionStart).toMatchObject({
        kind: 'write_file',
        reason: 'managed_runtime_hook',
        mode: 0o755,
      });
      expect(sessionStart.contents).toContain('using-spec-first SessionStart injection');
      expect(sessionStart.contents).toContain('--codex');
      expect(sessionStart.contents).toContain('process.execPath');
      expect(sessionStart.contents).toContain("await import('node:fs')");
      expect(sessionStart.contents).not.toContain("require('node:fs')");
      expect(sessionStart.contents).toContain(TRUSTED_CLI_PATH);
      expect(sessionStart.contents).not.toContain('const SPEC_FIRST_CLI_PATH = "__SPEC_FIRST_CLI_PATH__";');
      expect(sessionStart.contents).not.toContain("spawnSync('spec-first'");

      const sessionStartCmd = hookOps.find((operation) => operation.path === '.codex/hooks/session-start.cmd');
      expect(sessionStartCmd).toMatchObject({
        kind: 'write_file',
        reason: 'managed_runtime_hook',
        mode: 0o755,
      });
      expect(sessionStartCmd.contents).toContain('@echo off');
      expect(sessionStartCmd.contents).toContain(process.execPath);
      expect(sessionStartCmd.contents).toContain('"%~dp0session-start"');
      expect(sessionStartCmd.contents).not.toContain('__CODEX_SESSION_START_NODE__');

      const hooksJson = hookOps.find((operation) => operation.path === '.codex/hooks.json');
      expect(hooksJson).toMatchObject({
        kind: 'write_file',
        reason: 'managed_runtime_hook',
      });
      const parsed = JSON.parse(hooksJson.contents);
      expect(parsed).toEqual({
        hooks: {
          SessionStart: [
            {
              hooks: [
                {
                  type: 'command',
                  command: expectedSessionStartCommand(projectRoot),
                  commandWindows: expectedWindowsSessionStartCommand(projectRoot),
                },
              ],
            },
          ],
        },
      });
      expect(parsed.hooks.SessionStart[0].hooks[0].command).toContain('.codex/hooks/session-start');
      expect(parsed.hooks.SessionStart[0].hooks[0].command).toContain(process.execPath);
      expect(parsed.hooks.SessionStart[0].hooks[0].commandWindows).toContain('.codex/hooks/session-start.cmd');
      expect(hooksJson.contents).not.toContain('__CODEX_SESSION_START_COMMAND__');
      expect(hooksJson.contents).not.toContain('__CODEX_SESSION_START_COMMAND_WINDOWS__');
      expect(plan.summary).toEqual({ remove_dir: cleanupOps.length, write_file: 3 });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('skips SessionStart hook writes when projectRoot .codex is CODEX_HOME (anti double-injection)', () => {
    // Simulate "init in a directory whose .codex IS the Codex global hook location":
    // set CODEX_HOME to <projectRoot>/.codex so the derived-position predicate matches.
    const projectRoot = makeTempDir();
    const prevCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = path.join(projectRoot, '.codex');

    try {
      const plan = getAdapter('codex').planRuntimeFilesSync(projectRoot);
      const hookOps = plan.operations.filter((operation) => operation.reason === 'managed_runtime_hook');

      expect(plan.skippedHookWrite).toBe(true);
      expect(hookOps).toHaveLength(0);
      // Cleanup ops (skills/agents/legacy) still planned — only the hook write is skipped.
      expect(plan.operations.some((operation) => (
        operation.reason === 'managed_runtime_cleanup'
        || operation.reason === 'legacy_codex_spec_first_skill_cleanup'
      ))).toBe(true);
      expect(plan.summary.write_file || 0).toBe(0);
    } finally {
      if (prevCodexHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = prevCodexHome;
      }
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('runtime file inspection treats CODEX_HOME skipped hooks as intentional', () => {
    const projectRoot = makeTempDir();
    const prevCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = path.join(projectRoot, '.codex');

    try {
      const checks = getAdapter('codex').inspectRuntimeFiles(projectRoot);

      expect(checks).toEqual([
        {
          level: 'PASS',
          name: '.codex/hooks/session-start',
          message: 'managed SessionStart hook intentionally skipped because project .codex is CODEX_HOME',
        },
        {
          level: 'PASS',
          name: '.codex/hooks/session-start.cmd',
          message: 'managed SessionStart hook intentionally skipped because project .codex is CODEX_HOME',
        },
        {
          level: 'PASS',
          name: '.codex/hooks.json',
          message: 'managed SessionStart hook intentionally skipped because project .codex is CODEX_HOME',
        },
      ]);
    } finally {
      if (prevCodexHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = prevCodexHome;
      }
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('sync plan preserves provider-owned hooks while refreshing managed SessionStart', () => {
    const projectRoot = makeTempDir();
    const graphifyHook = {
      matcher: 'Bash',
      hooks: [
        {
          type: 'command',
          command: 'graphify hook status --refresh',
        },
      ],
    };
    const customSessionStart = {
      hooks: [
        {
          type: 'command',
          command: 'echo custom-session-start',
        },
      ],
    };

    try {
      fs.mkdirSync(path.join(projectRoot, '.codex'), { recursive: true });
      fs.writeFileSync(path.join(projectRoot, '.codex', 'hooks.json'), JSON.stringify({
        hooks: {
          PreToolUse: [graphifyHook],
          SessionStart: [
            customSessionStart,
            {
              hooks: [
                {
                  type: 'command',
                  command: `bash ${shellQuote(path.join(os.tmpdir(), 'old-project', '.codex/hooks/session-start').replace(/\\/g, '/'))}`,
                },
              ],
            },
            {
              hooks: [
                {
                  type: 'command',
                  commandWindows: 'C:\\Users\\spec\\old-project\\.codex\\hooks\\session-start.cmd',
                },
              ],
            },
            {
              hooks: [
                {
                  type: 'command',
                  command_windows: 'cmd.exe /d /c "C:\\Users\\spec\\old-project\\.codex\\hooks\\session-start.cmd"',
                },
              ],
            },
          ],
        },
      }, null, 2), 'utf8');

      const plan = getAdapter('codex').planRuntimeFilesSync(projectRoot);
      const hooksJson = plan.operations.find((operation) => operation.path === '.codex/hooks.json');
      const parsed = JSON.parse(hooksJson.contents);

      expect(hooksJson.kind).toBe('update_file');
      expect(parsed.hooks.PreToolUse).toEqual([graphifyHook]);
      expect(parsed.hooks.SessionStart).toHaveLength(2);
      expect(parsed.hooks.SessionStart).toContainEqual(customSessionStart);
      expect(parsed.hooks.SessionStart).toContainEqual({
        hooks: [
          {
            type: 'command',
            command: expectedSessionStartCommand(projectRoot),
            commandWindows: expectedWindowsSessionStartCommand(projectRoot),
          },
        ],
      });
      expect(JSON.stringify(parsed)).not.toContain('old-project');
      expect(JSON.stringify(parsed)).not.toContain('C:\\\\Users\\\\spec');
      // The on-disk file still holds the stale old-project managed entries (the plan is not
      // written), so inspect sees a present-but-outdated managed hook, not a missing one.
      expect(getAdapter('codex').inspectRuntimeFiles(projectRoot)[2]).toMatchObject({
        level: 'WARNING',
        message: 'managed SessionStart hook config is outdated (run init to refresh after a node/project/host change)',
      });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('sync plan preserves a user hook co-located in the same SessionStart entry as the managed hook', () => {
    const projectRoot = makeTempDir();
    const coLocatedUserHook = { type: 'command', command: 'echo USER-OWNED-SESSION-START-HOOK' };

    try {
      fs.mkdirSync(path.join(projectRoot, '.codex'), { recursive: true });
      fs.writeFileSync(path.join(projectRoot, '.codex', 'hooks.json'), JSON.stringify({
        hooks: {
          SessionStart: [
            {
              hooks: [
                {
                  type: 'command',
                  command: expectedSessionStartCommand(projectRoot),
                  commandWindows: expectedWindowsSessionStartCommand(projectRoot),
                },
                coLocatedUserHook,
              ],
            },
          ],
        },
      }, null, 2), 'utf8');

      const plan = getAdapter('codex').planRuntimeFilesSync(projectRoot);
      const hooksJson = plan.operations.find((operation) => operation.path === '.codex/hooks.json');
      const parsed = JSON.parse(hooksJson.contents);
      const allHooks = parsed.hooks.SessionStart.flatMap((entry) => entry.hooks);

      // Entry-granularity deletion would have dropped the whole entry; the co-located
      // user hook must survive while the managed hook is refreshed to a standalone entry.
      expect(allHooks).toContainEqual(coLocatedUserHook);
      expect(allHooks.filter((hook) => hook.command === expectedSessionStartCommand(projectRoot))).toHaveLength(1);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('sync plan preserves a Codex user wrapper hook that merely references the managed path', () => {
    const projectRoot = makeTempDir();
    const sessionStartPath = path.join(projectRoot, '.codex/hooks/session-start').replace(/\\/g, '/');
    const userWrapper = {
      type: 'command',
      command: `my-wrapper bash ${sessionStartPath} --my-flag && echo done`,
    };

    try {
      fs.mkdirSync(path.join(projectRoot, '.codex'), { recursive: true });
      fs.writeFileSync(path.join(projectRoot, '.codex', 'hooks.json'), JSON.stringify({
        hooks: { SessionStart: [{ hooks: [userWrapper] }] },
      }, null, 2), 'utf8');

      const plan = getAdapter('codex').planRuntimeFilesSync(projectRoot);
      const hooksJson = plan.operations.find((operation) => operation.path === '.codex/hooks.json');
      const allHooks = JSON.parse(hooksJson.contents).hooks.SessionStart.flatMap((entry) => entry.hooks);

      // The wrapper embeds the managed path as an argument, not as the invoked program,
      // so it must survive refresh (parity with the Claude P2-I2 removal contract).
      expect(allHooks).toContainEqual(userWrapper);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('sync plan quotes hook command paths with active shell characters', () => {
    const projectRoot = path.join(os.tmpdir(), "spec first '$HOME' `touch bad` $(touch bad)");

    const plan = getAdapter('codex').planRuntimeFilesSync(projectRoot);
    const hooksJson = plan.operations.find((operation) => operation.path === '.codex/hooks.json');
    const parsed = JSON.parse(hooksJson.contents);
    const command = parsed.hooks.SessionStart[0].hooks[0].command;

    expect(command).toBe(expectedSessionStartCommand(projectRoot));
    expect(command).toContain("'\\''");
    expect(command).toContain('$HOME');
    expect(command).toContain('`touch bad`');
    expect(command).toContain('$(touch bad)');
    expect(parsed.hooks.SessionStart[0].hooks[0].commandWindows).toBe(expectedWindowsSessionStartCommand(projectRoot));
  });

  test('sync plan renders project paths with $-replacement sequences literally', () => {
    // $&, $`, $', $$ and $1 are String.prototype.replace special replacement patterns.
    // With a string replacement they would expand instead of inserting literally,
    // corrupting (or throwing while JSON.parse-ing) the generated hooks.json.
    const projectRoot = path.join(os.tmpdir(), "spec-first $& $` $' $$ $1 dir");

    const plan = getAdapter('codex').planRuntimeFilesSync(projectRoot);
    const hooksJson = plan.operations.find((operation) => operation.path === '.codex/hooks.json');
    const parsed = JSON.parse(hooksJson.contents);
    const entry = parsed.hooks.SessionStart[0].hooks[0];

    // toBe is the round-trip check: the production value (rendered through the template
    // .replace) and the directly-computed expected value diverge exactly when the
    // $-replacement footgun is present, so equality proves the literal was preserved.
    expect(entry.command).toBe(expectedSessionStartCommand(projectRoot));
    expect(entry.commandWindows).toBe(expectedWindowsSessionStartCommand(projectRoot));
    // $&, $$, $1 and $` survive shellQuote (only the embedded ' is escaped).
    expect(entry.command).toContain('$&');
    expect(entry.command).toContain('$$');
  });

  test('sync plan escapes percent characters inside generated Windows batch wrapper', () => {
    const originalExecPath = process.execPath;
    const projectRoot = makeTempDir();

    try {
      Object.defineProperty(process, 'execPath', {
        value: 'C:\\Program Files\\Node%22%\\node.exe',
        configurable: true,
      });
      const plan = getAdapter('codex').planRuntimeFilesSync(projectRoot);
      const commandHook = plan.operations.find((operation) => operation.path === '.codex/hooks/session-start.cmd');

      expect(commandHook.contents).toContain('"C:\\Program Files\\Node%%22%%\\node.exe"');
      expect(commandHook.contents).toContain('"%~dp0session-start"');
    } finally {
      Object.defineProperty(process, 'execPath', {
        value: originalExecPath,
        configurable: true,
      });
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('sync plan does not double percent in the commandWindows command-line value', () => {
    // Codex runs commandWindows on a cmd command line (cmd /C), where %% does not collapse to %.
    // A literal % in the project path must be left as-is, not doubled (the old batch-rule bug).
    const projectRoot = path.join(os.tmpdir(), 'spec-first 100%done dir');

    const plan = getAdapter('codex').planRuntimeFilesSync(projectRoot);
    const hooksJson = plan.operations.find((operation) => operation.path === '.codex/hooks.json');
    const commandWindows = JSON.parse(hooksJson.contents).hooks.SessionStart[0].hooks[0].commandWindows;

    expect(commandWindows).toBe(expectedWindowsSessionStartCommand(projectRoot));
    expect(commandWindows).toContain('100%done');
    expect(commandWindows).not.toContain('100%%done');
    expect(commandWindows).not.toContain('cmd.exe /d /c');
  });

  test('sync plan switches hook files to update_file when they already exist', () => {
    const projectRoot = makeTempDir();

    try {
      fs.mkdirSync(path.join(projectRoot, '.codex', 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(projectRoot, '.codex', 'hooks', 'session-start'), '#!/bin/bash\n', 'utf8');
      fs.writeFileSync(path.join(projectRoot, '.codex', 'hooks', 'session-start.cmd'), '@echo off\n', 'utf8');
      fs.writeFileSync(path.join(projectRoot, '.codex', 'hooks.json'), '{}\n', 'utf8');

      const plan = getAdapter('codex').planRuntimeFilesSync(projectRoot);
      const hookOps = plan.operations.filter((operation) => operation.reason === 'managed_runtime_hook');
      const cleanupOps = plan.operations.filter((operation) => operation.reason === 'managed_runtime_cleanup'
        || operation.reason === 'legacy_codex_spec_first_skill_cleanup');

      expect(hookOps.map((operation) => operation.kind)).toEqual(['update_file', 'update_file', 'update_file']);
      expect(cleanupOps.length).toBeGreaterThan(LEGACY_CLEANUP_PATHS.length);
      expect(plan.summary).toEqual({ remove_dir: cleanupOps.length, update_file: 3 });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('removal plan appends hook removals without dropping legacy cleanup ops', () => {
    const plan = getAdapter('codex').planRuntimeFilesRemoval('/tmp/unused');
    const cleanupOps = plan.operations.filter((operation) => operation.reason === 'managed_runtime_cleanup'
      || operation.reason === 'legacy_codex_spec_first_skill_cleanup');

    expect(LEGACY_CLEANUP_PATHS.every((cleanupPath) =>
      cleanupOps.some((operation) => operation.path === cleanupPath)
    )).toBe(true);
    expect(cleanupOps.some((operation) => operation.path === '.codex/skills/work')).toBe(true);
    expect(plan.operations.slice(-3).map((operation) => operation.path)).toEqual([
      '.codex/hooks/session-start',
      '.codex/hooks/session-start.cmd',
      '.codex/hooks.json',
    ]);
    expect(cleanupOps.every((operation) => (
      operation.kind === 'remove_dir'
      && (
        operation.reason === 'managed_runtime_cleanup'
        || operation.reason === 'legacy_codex_spec_first_skill_cleanup'
      )
    ))).toBe(true);
    expect(plan.operations.slice(-3)).toEqual([
      {
        kind: 'remove_file',
        path: '.codex/hooks/session-start',
        reason: 'managed_runtime_hook',
      },
      {
        kind: 'remove_file',
        path: '.codex/hooks/session-start.cmd',
        reason: 'managed_runtime_hook',
      },
      {
        kind: 'remove_file',
        path: '.codex/hooks.json',
        reason: 'managed_runtime_hook',
      },
    ]);
    expect(plan.summary).toEqual({ remove_dir: cleanupOps.length, remove_file: 3 });
  });

  test('runtime file inspection reports missing, present, and drifted hook assets', () => {
    const projectRoot = makeTempDir();

    try {
      const adapter = getAdapter('codex');
      expect(adapter.inspectRuntimeFiles(projectRoot).map((check) => check.message)).toEqual([
        'missing',
        'missing (Windows hook wrapper; only required when Codex runs on Windows)',
        'missing',
      ]);

      const plan = adapter.planRuntimeFilesSync(projectRoot);
      for (const operation of plan.operations.filter((entry) => entry.reason === 'managed_runtime_hook')) {
        const targetPath = path.join(projectRoot, operation.path);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, operation.contents, 'utf8');
      }

      expect(adapter.inspectRuntimeFiles(projectRoot)).toEqual([
        {
          level: 'PASS',
          name: '.codex/hooks/session-start',
          message: 'managed SessionStart hook present',
        },
        {
          level: 'PASS',
          name: '.codex/hooks/session-start.cmd',
          message: 'managed Windows SessionStart hook wrapper present',
        },
        {
          level: 'PASS',
          name: '.codex/hooks.json',
          message: 'managed SessionStart hook config present',
        },
      ]);

      const hooksPath = path.join(projectRoot, '.codex', 'hooks.json');
      const hooksJson = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
      hooksJson.hooks.SessionStart[0].hooks[0].command = expectedSessionStartCommand(path.join(os.tmpdir(), 'old-project'));
      fs.writeFileSync(hooksPath, JSON.stringify(hooksJson, null, 2), 'utf8');
      const checks = adapter.inspectRuntimeFiles(projectRoot);
      expect(checks[0].level).toBe('PASS');
      expect(checks[1].level).toBe('PASS');
      // Stale-but-present managed entry (old-project path still matches by managed path/shape).
      expect(checks[2]).toMatchObject({
        level: 'WARNING',
        name: '.codex/hooks.json',
        message: 'managed SessionStart hook config is outdated (run init to refresh after a node/project/host change)',
      });

      fs.writeFileSync(hooksPath, '{', 'utf8');
      expect(adapter.inspectRuntimeFiles(projectRoot)[2]).toMatchObject({
        level: 'WARNING',
        name: '.codex/hooks.json',
        message: 'invalid JSON',
      });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('runtime file inspection reports drifted Windows command wrapper', () => {
    const projectRoot = makeTempDir();

    try {
      const adapter = getAdapter('codex');
      const plan = adapter.planRuntimeFilesSync(projectRoot);
      for (const operation of plan.operations.filter((entry) => entry.reason === 'managed_runtime_hook')) {
        const targetPath = path.join(projectRoot, operation.path);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, operation.contents, 'utf8');
      }

      fs.writeFileSync(path.join(projectRoot, '.codex', 'hooks', 'session-start.cmd'), '@echo off\nnotepad.exe\n', 'utf8');

      expect(adapter.inspectRuntimeFiles(projectRoot)[1]).toMatchObject({
        level: 'WARNING',
        name: '.codex/hooks/session-start.cmd',
        message: 'drifted from bundled template',
      });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('runtime file inspection reports drifted Windows commandWindows config', () => {
    const projectRoot = makeTempDir();

    try {
      const adapter = getAdapter('codex');
      const plan = adapter.planRuntimeFilesSync(projectRoot);
      for (const operation of plan.operations.filter((entry) => entry.reason === 'managed_runtime_hook')) {
        const targetPath = path.join(projectRoot, operation.path);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, operation.contents, 'utf8');
      }

      const hooksPath = path.join(projectRoot, '.codex', 'hooks.json');
      const hooksJson = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
      hooksJson.hooks.SessionStart[0].hooks[0].commandWindows = 'cmd.exe /d /c "C:\\Users\\spec\\old-project\\.codex\\hooks\\session-start.cmd"';
      fs.writeFileSync(hooksPath, JSON.stringify(hooksJson, null, 2), 'utf8');

      // command still current but commandWindows stale -> present-but-outdated, not missing.
      expect(adapter.inspectRuntimeFiles(projectRoot)[2]).toMatchObject({
        level: 'WARNING',
        name: '.codex/hooks.json',
        message: 'managed SessionStart hook config is outdated (run init to refresh after a node/project/host change)',
      });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('runtime file inspection distinguishes truly-missing managed config from outdated', () => {
    const projectRoot = makeTempDir();

    try {
      const adapter = getAdapter('codex');
      const plan = adapter.planRuntimeFilesSync(projectRoot);
      for (const operation of plan.operations.filter((entry) => entry.reason === 'managed_runtime_hook')) {
        const targetPath = path.join(projectRoot, operation.path);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, operation.contents, 'utf8');
      }

      const hooksPath = path.join(projectRoot, '.codex', 'hooks.json');
      // Replace the managed entry with an unrelated user-only entry: no managed hook at all.
      fs.writeFileSync(hooksPath, JSON.stringify({
        hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'echo only-user' }] }] },
      }, null, 2), 'utf8');

      expect(adapter.inspectRuntimeFiles(projectRoot)[2]).toMatchObject({
        level: 'WARNING',
        name: '.codex/hooks.json',
        message: 'missing managed SessionStart hook config',
      });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});

describe('Codex SessionStart hook script', () => {
  test('emits a short governance pointer without re-injecting the AGENTS language/governance block', () => {
    const projectRoot = makeTempDir();

    try {
      fs.writeFileSync(path.join(projectRoot, 'AGENTS.md'), [
        '# AGENTS.md',
        '',
        buildManagedBlock('en'),
        '',
      ].join('\n'), 'utf8');
      const hookPath = writeRenderedCodexHook(projectRoot, (content) => (
        replaceTrustedCliPath(content, path.join(projectRoot, 'missing-spec-first.js'))
      ));

      const result = runHook(hookPath, {
        env: { CODEX_PROJECT_DIR: projectRoot },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      const ctx = payload.hookSpecificOutput.additionalContext;
      expect(ctx).toContain('[spec-first] using-spec-first SessionStart injection');
      expect(ctx).toContain('Workflow entry governance is active');
      expect(ctx).toContain('before non-trivial or risky edits');
      expect(ctx).toContain('target_repo');
      expect(ctx).toContain('skills/using-spec-first/SKILL.md');
      // AGENTS.md already carries the block; the hook must not duplicate its body.
      expect(ctx).not.toContain('### Workflow Entry Governance');
      expect(ctx).not.toContain('Language rules are an absolute hard-execution requirement');
      expect(ctx).not.toContain('before editing');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('degrades non-blockingly when the AGENTS language/governance block is missing', () => {
    const projectRoot = makeTempDir();

    try {
      const hookPath = writeRenderedCodexHook(projectRoot, (content) => (
        replaceTrustedCliPath(content, path.join(projectRoot, 'missing-spec-first.js'))
      ));

      const result = runHook(hookPath, {
        cwd: os.tmpdir(),
        env: { CODEX_PROJECT_DIR: projectRoot },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      expect(payload.hookSpecificOutput.additionalContext).toContain('Managed language/governance block is missing from `AGENTS.md`.');
      expect(payload.hookSpecificOutput.additionalContext).toContain('spec-first init');
      expect(payload.hookSpecificOutput.additionalContext).toContain('choose Codex');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('degrades non-blockingly when AGENTS legacy bootstrap markers are incomplete', () => {
    const projectRoot = makeTempDir();

    try {
      fs.writeFileSync(path.join(projectRoot, 'AGENTS.md'), [
        '# AGENTS.md',
        '',
        '<!-- spec-first:bootstrap:start -->',
        '## Workflow entry governance',
        '',
      ].join('\n'), 'utf8');
      const hookPath = writeRenderedCodexHook(projectRoot, (content) => (
        replaceTrustedCliPath(content, path.join(projectRoot, 'missing-spec-first.js'))
      ));

      const result = runHook(hookPath, {
        env: { CODEX_PROJECT_DIR: projectRoot },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      expect(payload.hookSpecificOutput.additionalContext).toContain('Legacy standalone bootstrap markers are incomplete in `AGENTS.md`');
      expect(payload.hookSpecificOutput.additionalContext).toContain('choose Codex');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('degrades non-blockingly when the AGENTS path is unreadable', () => {
    const projectRoot = makeTempDir();

    try {
      // A directory in place of AGENTS.md makes readFileSync throw EISDIR regardless of
      // the runner's uid (unlike chmod 0o000, which root bypasses) -> exercises the guard.
      fs.mkdirSync(path.join(projectRoot, 'AGENTS.md'));
      const hookPath = writeRenderedCodexHook(projectRoot, (content) => (
        replaceTrustedCliPath(content, path.join(projectRoot, 'missing-spec-first.js'))
      ));

      const result = runHook(hookPath, {
        env: { CODEX_PROJECT_DIR: projectRoot },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      expect(payload.hookSpecificOutput.additionalContext).toContain('using-spec-first SessionStart injection');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('drains Codex hook stdin payload before writing hook output', () => {
    const projectRoot = makeTempDir();

    try {
      fs.writeFileSync(path.join(projectRoot, 'AGENTS.md'), [
        buildManagedBlock('en'),
      ].join('\n'), 'utf8');
      const hookPath = writeRenderedCodexHook(projectRoot, (content) => (
        replaceTrustedCliPath(content, path.join(projectRoot, 'missing-spec-first.js'))
      ));

      const result = runHook(hookPath, {
        env: { CODEX_PROJECT_DIR: projectRoot },
        input: JSON.stringify({ hook_event_name: 'SessionStart' }),
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      expect(payload.hookSpecificOutput.additionalContext).toContain('using-spec-first SessionStart injection');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('runs inside a package with type module', () => {
    const projectRoot = makeTempDir();

    try {
      fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify({
        type: 'module',
      }, null, 2), 'utf8');
      fs.writeFileSync(path.join(projectRoot, 'AGENTS.md'), [
        buildManagedBlock('en'),
        '',
      ].join('\n'), 'utf8');
      const hookPath = writeRenderedCodexHook(projectRoot, (content) => (
        replaceTrustedCliPath(content, path.join(projectRoot, 'missing-spec-first.js'))
      ));

      const result = runHook(hookPath, {
        env: { CODEX_PROJECT_DIR: projectRoot },
        input: JSON.stringify({ hook_event_name: 'SessionStart' }),
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      expect(payload.hookSpecificOutput.additionalContext).toContain('using-spec-first SessionStart injection');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('appends startup reminder output when the trusted helper prints one', () => {
    const projectRoot = makeTempDir();
    const fakeCliPath = path.join(projectRoot, 'spec-first.js');

    try {
      fs.writeFileSync(fakeCliPath, [
        'if (process.argv[2] === "startup-reminder" && process.argv[3] === "--codex") {',
        '  console.log("[spec-first] Update available for Codex runtime: 1.6.1 -> 1.6.2");',
        '  console.log("Run `spec-first update` in your terminal to check version and runtime freshness.");',
        '}',
      ].join('\n'), 'utf8');
      fs.writeFileSync(path.join(projectRoot, 'AGENTS.md'), [
        buildManagedBlock('en'),
        '',
      ].join('\n'), 'utf8');
      const hookPath = writeRenderedCodexHook(projectRoot, (content) => (
        replaceTrustedCliPath(content, fakeCliPath)
      ));

      const result = runHook(hookPath, {
        env: { CODEX_PROJECT_DIR: projectRoot },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.additionalContext).toContain('using-spec-first SessionStart injection');
      expect(payload.hookSpecificOutput.additionalContext).toContain('1.6.1 -> 1.6.2');
      expect(payload.hookSpecificOutput.additionalContext).toContain('spec-first update');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('does not execute a fake spec-first from PATH', () => {
    const projectRoot = makeTempDir();
    const fakeBin = path.join(projectRoot, 'bin');
    const sentinelPath = path.join(projectRoot, 'fake-spec-first-ran');

    try {
      fs.mkdirSync(fakeBin, { recursive: true });
      fs.writeFileSync(path.join(fakeBin, 'spec-first'), [
        '#!/bin/bash',
        `printf fake > ${JSON.stringify(sentinelPath)}`,
        'printf "%s\\n" "FAKE PATH REMINDER"',
      ].join('\n'), 'utf8');
      fs.chmodSync(path.join(fakeBin, 'spec-first'), 0o755);
      const hookPath = writeRenderedCodexHook(projectRoot, (content) => (
        replaceTrustedCliPath(content, '__SPEC_FIRST_CLI_PATH__')
      ));

      const result = runHook(hookPath, {
        env: {
          CODEX_PROJECT_DIR: projectRoot,
          PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
        },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(fs.existsSync(sentinelPath)).toBe(false);
      expect(result.stdout).not.toContain('FAKE PATH REMINDER');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('degrades non-blockingly when the trusted helper exits non-zero', () => {
    const projectRoot = makeTempDir();
    const fakeCliPath = path.join(projectRoot, 'spec-first.js');

    try {
      fs.writeFileSync(fakeCliPath, 'process.exit(23);\n', 'utf8');
      const hookPath = writeRenderedCodexHook(projectRoot, (content) => (
        replaceTrustedCliPath(content, fakeCliPath)
      ));

      const result = runHook(hookPath, {
        env: { CODEX_PROJECT_DIR: projectRoot },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      expect(payload.hookSpecificOutput.additionalContext).toContain('using-spec-first SessionStart injection');
      expect(payload.hookSpecificOutput.additionalContext).not.toContain('Update available');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('emits exactly the SessionStart wire contract (no extra keys, single JSON object on stdout)', () => {
    // Codex parses stdout against SessionStartCommandOutputWire / SessionStartHookSpecificOutputWire,
    // both `#[serde(deny_unknown_fields)]`. If stdout looks like JSON (starts with `{`) but fails to
    // parse against that schema, Codex marks the hook Failed ("hook returned invalid session start
    // JSON output"). Any extra key under hookSpecificOutput, or any non-JSON noise on stdout, breaks
    // SessionStart injection. Lock the net output shape so a future edit cannot reintroduce that.
    const projectRoot = makeTempDir();

    try {
      fs.writeFileSync(path.join(projectRoot, 'AGENTS.md'), [
        buildManagedBlock('en'),
        '',
      ].join('\n'), 'utf8');
      const hookPath = writeRenderedCodexHook(projectRoot, (content) => (
        replaceTrustedCliPath(content, path.join(projectRoot, 'missing-spec-first.js'))
      ));

      const result = runHook(hookPath, {
        env: { CODEX_PROJECT_DIR: projectRoot },
        input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup' }),
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      // stdout must be a single JSON object (no leading/trailing noise that would corrupt parsing).
      const trimmed = result.stdout.trim();
      expect(trimmed.startsWith('{')).toBe(true);
      const payload = JSON.parse(trimmed);
      // Top-level: only hookSpecificOutput (universal fields are optional and we omit them).
      expect(Object.keys(payload)).toEqual(['hookSpecificOutput']);
      // hookSpecificOutput: exactly the two deny_unknown_fields-allowed keys, nothing else.
      expect(Object.keys(payload.hookSpecificOutput).sort()).toEqual(['additionalContext', 'hookEventName']);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      expect(typeof payload.hookSpecificOutput.additionalContext).toBe('string');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
