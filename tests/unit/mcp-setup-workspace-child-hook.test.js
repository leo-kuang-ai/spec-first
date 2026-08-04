'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  BLOCK_START,
  HOOK_MARKER,
  classifyChildHookTarget,
  renderWorkspaceRefreshHookBlock,
  stripManagedBlock,
  probeChildHookMarker,
  inspectWorkspaceChildHookPosture,
  applyChildHookPosture,
  installWorkspaceChildHooks,
  removeWorkspaceChildHook,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-child-hook.cjs');

function initRepo(rel) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-wch-${rel}-`)));
  spawnSync('git', ['-C', root, 'init', '-q']);
  return root;
}
function pinLocalHooks(repo, value) {
  spawnSync('git', ['-C', repo, 'config', '--local', 'core.hooksPath', value]);
}
function makeExecutable(root, name = 'graphify') {
  const target = path.join(root, name);
  fs.writeFileSync(target, '#!/bin/sh\nexit 0\n');
  fs.chmodSync(target, 0o755);
  return target;
}

describe('workspace child hook — render and idempotency', () => {
  test('renders a managed block embedding node, async-refresh, workspace root and repos', () => {
    const block = renderWorkspaceRefreshHookBlock({
      node: '/abs/node',
      asyncRefreshScript: '/abs/workspace-async-refresh.cjs',
      setupScript: '/abs/setup.cjs',
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
      workspaceRoot: '/abs/ws',
      repoIds: ['api', 'web'],
    });
    expect(block).toContain(BLOCK_START);
    expect(block).toContain(HOOK_MARKER);
    expect(block).not.toContain('env -i');
    expect(block).not.toContain('OPENAI_API_KEY=');
    expect(block).toContain('"/abs/node" "/abs/workspace-async-refresh.cjs" --trigger');
    expect(block).toContain('SPEC_FIRST_INTERNAL_WORKSPACE_CODEGRAPH_COMMAND="/verified/bin/codegraph"');
    expect(block).toContain('SPEC_FIRST_INTERNAL_WORKSPACE_GRAPHIFY_COMMAND="/verified/bin/graphify"');
    expect(block).toContain('MCP_SETUP_HOST="codex"');
    expect(block).toContain('SPEC_FIRST_BUNDLED_VERSION="1.13.2"');
    expect(block).toContain('--workspace "/abs/ws"');
    expect(block).not.toContain('--repos');
    expect(block).toContain('|| true');
  });

  test('stripManagedBlock is idempotent and preserves foreign hook content', () => {
    const foreign = '#!/bin/sh\necho org-policy\n';
    const withBlock = `${foreign}\n${renderWorkspaceRefreshHookBlock({
      node: 'n', asyncRefreshScript: 'a', setupScript: 's', workspaceRoot: 'w', repoIds: ['x'],
    })}`;
    const stripped = stripManagedBlock(withBlock);
    expect(stripped).toContain('echo org-policy');
    expect(stripped).not.toContain(BLOCK_START);
    // Stripping again is a no-op.
    expect(stripManagedBlock(stripped)).toBe(stripped);
  });

  const posixRoundTripTest = process.platform === 'win32' ? test.skip : test;
  posixRoundTripTest('round-trips quotes, newlines and shell metacharacters through /bin/sh', () => {
    const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wch-quote-')));
    const specialRoot = path.join(parent, 'single\' double" dollar$ tick` slash\\ line\nnext');
    fs.mkdirSync(specialRoot);
    const asyncRefreshScript = path.join(specialRoot, 'capture args.cjs');
    const capturePath = path.join(parent, 'captured.json');
    fs.writeFileSync(asyncRefreshScript, [
      "'use strict';",
      `require('node:fs').writeFileSync(${JSON.stringify(capturePath)}, JSON.stringify(process.argv.slice(2)));`,
      '',
    ].join('\n'));

    const workspaceRoot = path.join(specialRoot, 'workspace\nroot\' "$`\\');
    const setupScript = path.join(specialRoot, 'setup\nscript\' "$`\\.cjs');
    const repoIds = ['api\' "$`\\\nnode'];
    const block = renderWorkspaceRefreshHookBlock({
      node: process.execPath,
      asyncRefreshScript,
      setupScript,
      workspaceRoot,
      repoIds,
    });
    const result = spawnSync('/bin/sh', ['-c', `set -e\n${block}`], {
      env: {
        HOME: process.env.HOME || '',
        PATH: '',
        REVIEW_MULTILINE_SECRET: 'line1\nline2"',
      },
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(fs.existsSync(capturePath)).toBe(true);
    expect(JSON.parse(fs.readFileSync(capturePath, 'utf8'))).toEqual([
      '--trigger',
      '--workspace', workspaceRoot,
      '--command', process.execPath,
      '--args', JSON.stringify([
        setupScript,
        '--only', 'codegraph,graphify',
        '--workspace-graph',
      ]),
    ]);
  });
});

describe('workspace child hook — classification and install', () => {
  const runtimeContext = {
    codegraphCommand: '/verified/bin/codegraph',
    graphifyCommand: '/verified/bin/graphify',
    runtimeHost: 'codex',
    bundledVersion: '1.13.2',
  };

  test('classifies a default git repo hooks root as child-contained when pinned in-project', () => {
    const repo = initRepo('contained');
    pinLocalHooks(repo, '.git/hooks');
    expect(classifyChildHookTarget(repo)).toMatchObject({ classification: 'child-contained' });
  });

  test('installs the self-owned hook idempotently into a contained hooks root', () => {
    const repo = initRepo('install');
    pinLocalHooks(repo, '.githooks');
    const outcome = applyChildHookPosture({
      child: { repo_id: 'svc', git_root: repo },
      node: '/abs/node',
      asyncRefreshScript: '/abs/async.cjs',
      setupScript: '/abs/setup.cjs',
      ...runtimeContext,
      workspaceRoot: '/abs/ws',
      repoIds: ['svc'],
    });
    expect(outcome).toMatchObject({ repo_id: 'svc', hook_status: 'installed' });
    const postCommit = fs.readFileSync(path.join(repo, '.githooks', 'post-commit'), 'utf8');
    const postCheckout = fs.readFileSync(path.join(repo, '.githooks', 'post-checkout'), 'utf8');
    expect(postCommit).toContain(HOOK_MARKER);
    expect(postCheckout).toContain(HOOK_MARKER);
    // Re-install replaces the managed block without duplicating it.
    const originalRenameSync = fs.renameSync;
    let hookRenameCount = 0;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      if (String(target).includes(`${path.sep}.githooks${path.sep}post-`)) hookRenameCount += 1;
      return originalRenameSync.call(fs, source, target);
    });
    try {
      applyChildHookPosture({
        child: { repo_id: 'svc', git_root: repo },
        node: '/abs/node', asyncRefreshScript: '/abs/async.cjs', setupScript: '/abs/setup.cjs',
        ...runtimeContext,
        workspaceRoot: '/abs/ws', repoIds: ['svc'],
      });
    } finally {
      renameSpy.mockRestore();
    }
    const reinstalled = fs.readFileSync(path.join(repo, '.githooks', 'post-commit'), 'utf8');
    expect(reinstalled.split(BLOCK_START)).toHaveLength(2);
    expect(hookRenameCount).toBe(0);
  });

  const posixModeRepairTest = process.platform === 'win32' ? test.skip : test;
  posixModeRepairTest('repairs a missing executable bit without replacing unchanged hook content', () => {
    const repo = initRepo('mode-repair');
    pinLocalHooks(repo, '.githooks');
    const input = {
      child: { repo_id: 'svc', git_root: repo },
      node: '/abs/node',
      asyncRefreshScript: '/abs/async.cjs',
      setupScript: '/abs/setup.cjs',
      ...runtimeContext,
      workspaceRoot: '/abs/ws',
    };
    expect(applyChildHookPosture(input).hook_status).toBe('installed');
    const hookPath = path.join(repo, '.githooks', 'post-commit');
    fs.chmodSync(hookPath, 0o640);
    const before = fs.statSync(hookPath);
    const originalRenameSync = fs.renameSync;
    let hookRenameCount = 0;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      if (String(target).includes(`${path.sep}.githooks${path.sep}post-`)) hookRenameCount += 1;
      return originalRenameSync.call(fs, source, target);
    });

    let outcome;
    try {
      outcome = applyChildHookPosture(input);
    } finally {
      renameSpy.mockRestore();
    }

    const after = fs.statSync(hookPath);
    expect(outcome.hook_status).toBe('installed');
    expect(after.ino).toBe(before.ino);
    expect(after.mode & 0o777).toBe(0o740);
    expect(hookRenameCount).toBe(0);
  });

  posixModeRepairTest('preserves an existing hook permission mode when replacing its content', () => {
    const repo = initRepo('mode-preserve');
    pinLocalHooks(repo, '.githooks');
    const hooksRoot = path.join(repo, '.githooks');
    fs.mkdirSync(hooksRoot, { recursive: true });
    const hookPath = path.join(hooksRoot, 'post-commit');
    fs.writeFileSync(hookPath, '#!/bin/sh\necho user-hook\n');
    fs.chmodSync(hookPath, 0o700);

    const outcome = applyChildHookPosture({
      child: { repo_id: 'svc', git_root: repo },
      node: '/abs/node',
      asyncRefreshScript: '/abs/async.cjs',
      setupScript: '/abs/setup.cjs',
      ...runtimeContext,
      workspaceRoot: '/abs/ws',
    });

    expect(outcome.hook_status).toBe('installed');
    expect(fs.statSync(hookPath).mode & 0o777).toBe(0o700);
  });

  posixModeRepairTest.each([
    ['exit', 'exit 0'],
    ['exec', 'exec /bin/true'],
    ['set -e', 'set -e\nfalse'],
  ])('runs the managed refresh before an existing %s hook body', (_label, body) => {
    const repo = initRepo(`reachable-${_label.replace(/\s+/g, '-')}`);
    pinLocalHooks(repo, '.githooks');
    const hooksRoot = path.join(repo, '.githooks');
    fs.mkdirSync(hooksRoot, { recursive: true });
    const hookPath = path.join(hooksRoot, 'post-commit');
    fs.writeFileSync(hookPath, `#!/bin/sh\n${body}\n`);
    fs.chmodSync(hookPath, 0o755);
    const capturePath = path.join(repo, 'managed-refresh-ran');
    const asyncRefreshScript = path.join(repo, 'capture-refresh.cjs');
    fs.writeFileSync(asyncRefreshScript, [
      "'use strict';",
      `require('node:fs').writeFileSync(${JSON.stringify(capturePath)}, 'ran');`,
      '',
    ].join('\n'));

    const outcome = applyChildHookPosture({
      child: { repo_id: 'svc', git_root: repo },
      node: process.execPath,
      asyncRefreshScript,
      setupScript: '/abs/setup.cjs',
      ...runtimeContext,
      workspaceRoot: path.dirname(repo),
    });

    expect(outcome.hook_status).toBe('installed');
    const installed = fs.readFileSync(hookPath, 'utf8');
    expect(installed.indexOf(BLOCK_START)).toBeLessThan(installed.indexOf(body.split('\n')[0]));
    spawnSync(hookPath, [], { encoding: 'utf8' });
    expect(fs.readFileSync(capturePath, 'utf8')).toBe('ran');
  });

  test('removes the temporary hook file when installation fails after writing it', () => {
    const repo = initRepo('temp-cleanup');
    pinLocalHooks(repo, '.githooks');
    const tempPath = path.join(repo, '.githooks', 'post-commit.spec-first.tmp');
    const originalChmodSync = fs.chmodSync;
    let injected = false;
    const chmodSpy = jest.spyOn(fs, 'chmodSync').mockImplementation((target, mode) => {
      if (!injected && path.resolve(String(target)) === path.resolve(tempPath)) {
        injected = true;
        const error = new Error('injected hook chmod failure');
        error.code = 'EACCES';
        throw error;
      }
      return originalChmodSync.call(fs, target, mode);
    });

    let outcome;
    try {
      outcome = applyChildHookPosture({
        child: { repo_id: 'svc', git_root: repo },
        node: '/abs/node',
        asyncRefreshScript: '/abs/async.cjs',
        setupScript: '/abs/setup.cjs',
        ...runtimeContext,
        workspaceRoot: '/abs/ws',
      });
    } finally {
      chmodSpy.mockRestore();
    }

    expect(injected).toBe(true);
    expect(outcome).toMatchObject({
      repo_id: 'svc',
      hook_status: 'failed',
      reason_code: 'workspace-child-hook-install-failed',
    });
    expect(fs.existsSync(tempPath)).toBe(false);
  });

  posixModeRepairTest('status uses effective owner executability instead of accepting any execute bit', () => {
    const repo = initRepo('mode-owner-exec');
    pinLocalHooks(repo, '.git/hooks');
    const workspaceRoot = path.dirname(repo);
    const codegraphCommand = makeExecutable(workspaceRoot, `codegraph-${path.basename(repo)}`);
    const graphifyCommand = makeExecutable(workspaceRoot, `graphify-${path.basename(repo)}`);
    const summary = installWorkspaceChildHooks({
      workspaceRoot,
      repos: [{ repo_id: 'svc', git_root: repo }],
      node: process.execPath,
      asyncRefreshScript: require.resolve('../../skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs'),
      setupScript: require.resolve('../../skills/spec-runtime-setup/scripts/setup.cjs'),
      codegraphCommand,
      graphifyCommand,
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    const hookPath = path.join(repo, '.git', 'hooks', 'post-commit');
    fs.chmodSync(hookPath, 0o401);
    const originalAccessSync = fs.accessSync;
    const accessSpy = jest.spyOn(fs, 'accessSync').mockImplementation((target, mode) => {
      if (path.resolve(String(target)) === path.resolve(hookPath) && mode === fs.constants.X_OK) {
        const error = new Error('owner execute denied');
        error.code = 'EACCES';
        throw error;
      }
      return originalAccessSync.call(fs, target, mode);
    });

    let posture;
    try {
      posture = inspectWorkspaceChildHookPosture({
        child: { repo_id: 'svc', git_root: repo },
        workspaceRoot,
        bundledVersion: '1.13.2',
        expectedHookContract: summary.hook_contract,
      });
    } finally {
      accessSpy.mockRestore();
    }
    expect(posture).toEqual({
      hook_status: 'blocked',
      reason_code: 'workspace-child-hook-not-executable',
    });
  });

  const posixHookSwapTest = process.platform === 'win32' ? test.skip : test;
  posixHookSwapTest('status rejects a hook swapped to an external symlink while it is opened', () => {
    const repo = initRepo('status-symlink-swap');
    pinLocalHooks(repo, '.git/hooks');
    const workspaceRoot = path.dirname(repo);
    const codegraphCommand = makeExecutable(workspaceRoot, `codegraph-${path.basename(repo)}`);
    const graphifyCommand = makeExecutable(workspaceRoot, `graphify-${path.basename(repo)}`);
    const summary = installWorkspaceChildHooks({
      workspaceRoot,
      repos: [{ repo_id: 'svc', git_root: repo }],
      node: process.execPath,
      asyncRefreshScript: require.resolve('../../skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs'),
      setupScript: require.resolve('../../skills/spec-runtime-setup/scripts/setup.cjs'),
      codegraphCommand,
      graphifyCommand,
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    const hookPath = path.join(repo, '.git', 'hooks', 'post-commit');
    const outsideRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-hook-swap-')));
    const outsideHook = path.join(outsideRoot, 'post-commit');
    fs.copyFileSync(hookPath, outsideHook);
    fs.chmodSync(outsideHook, 0o755);
    const originalOpenSync = fs.openSync;
    const originalReadFileSync = fs.readFileSync;
    let hookDescriptor = null;
    let swapped = false;
    const openSpy = jest.spyOn(fs, 'openSync').mockImplementation((target, ...args) => {
      const descriptor = originalOpenSync.call(fs, target, ...args);
      if (path.resolve(String(target)) === path.resolve(hookPath)) hookDescriptor = descriptor;
      return descriptor;
    });
    const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((target, ...args) => {
      if (!swapped && target === hookDescriptor) {
        swapped = true;
        fs.rmSync(hookPath);
        fs.symlinkSync(outsideHook, hookPath);
      }
      return originalReadFileSync.call(fs, target, ...args);
    });

    let posture;
    try {
      posture = inspectWorkspaceChildHookPosture({
        child: { repo_id: 'svc', git_root: repo },
        workspaceRoot,
        bundledVersion: '1.13.2',
        expectedHookContract: summary.hook_contract,
      });
    } finally {
      readSpy.mockRestore();
      openSpy.mockRestore();
    }

    expect(swapped).toBe(true);
    expect(fs.lstatSync(hookPath).isSymbolicLink()).toBe(true);
    expect(posture).toEqual({
      hook_status: 'blocked',
      reason_code: 'workspace-child-hook-symlink-escape',
    });
  });

  test('status rejects an installed managed block when the hook interpreter drifts to non-shell', () => {
    const repo = initRepo('status-interpreter');
    pinLocalHooks(repo, '.git/hooks');
    const workspaceRoot = path.dirname(repo);
    const codegraphCommand = makeExecutable(workspaceRoot, `codegraph-${path.basename(repo)}`);
    const graphifyCommand = makeExecutable(workspaceRoot, `graphify-${path.basename(repo)}`);
    const summary = installWorkspaceChildHooks({
      workspaceRoot,
      repos: [{ repo_id: 'svc', git_root: repo }],
      node: process.execPath,
      asyncRefreshScript: require.resolve('../../skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs'),
      setupScript: require.resolve('../../skills/spec-runtime-setup/scripts/setup.cjs'),
      codegraphCommand,
      graphifyCommand,
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    const hookPath = path.join(repo, '.git', 'hooks', 'post-commit');
    fs.writeFileSync(
      hookPath,
      fs.readFileSync(hookPath, 'utf8').replace('#!/bin/sh', '#!/usr/bin/env python3'),
    );

    expect(inspectWorkspaceChildHookPosture({
      child: { repo_id: 'svc', git_root: repo },
      workspaceRoot,
      bundledVersion: '1.13.2',
      expectedHookContract: summary.hook_contract,
    })).toEqual({
      hook_status: 'blocked',
      reason_code: 'workspace-child-hook-interpreter-unsupported',
    });
  });

  test('status rejects duplicate managed blocks instead of accepting the first matching block', () => {
    const repo = initRepo('status-duplicate');
    pinLocalHooks(repo, '.git/hooks');
    const workspaceRoot = path.dirname(repo);
    const codegraphCommand = makeExecutable(workspaceRoot, `codegraph-${path.basename(repo)}`);
    const graphifyCommand = makeExecutable(workspaceRoot, `graphify-${path.basename(repo)}`);
    const summary = installWorkspaceChildHooks({
      workspaceRoot,
      repos: [{ repo_id: 'svc', git_root: repo }],
      node: process.execPath,
      asyncRefreshScript: require.resolve('../../skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs'),
      setupScript: require.resolve('../../skills/spec-runtime-setup/scripts/setup.cjs'),
      codegraphCommand,
      graphifyCommand,
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    const hookPath = path.join(repo, '.git', 'hooks', 'post-commit');
    const contents = fs.readFileSync(hookPath, 'utf8');
    fs.appendFileSync(hookPath, `\n${contents.slice(contents.indexOf(BLOCK_START))}`);

    expect(inspectWorkspaceChildHookPosture({
      child: { repo_id: 'svc', git_root: repo },
      workspaceRoot,
      bundledVersion: '1.13.2',
      expectedHookContract: summary.hook_contract,
    })).toEqual({
      hook_status: 'stale',
      reason_code: 'workspace-child-hook-managed-block-stale',
    });
  });

  test('fails closed without modifying an existing non-shell hook', () => {
    const repo = initRepo('non-shell');
    pinLocalHooks(repo, '.githooks');
    const hooksRoot = path.join(repo, '.githooks');
    const sentinel = path.join(repo, 'python-hook-ran');
    fs.mkdirSync(hooksRoot, { recursive: true });
    const postCommit = path.join(hooksRoot, 'post-commit');
    fs.writeFileSync(postCommit, [
      '#!/usr/bin/env python3',
      'from pathlib import Path',
      'Path(' + JSON.stringify(sentinel) + ').write_text("ok")',
      '',
    ].join('\n'));
    fs.chmodSync(postCommit, 0o755);
    const before = fs.readFileSync(postCommit, 'utf8');

    const outcome = applyChildHookPosture({
      child: { repo_id: 'svc', git_root: repo },
      node: '/abs/node',
      asyncRefreshScript: '/abs/async.cjs',
      setupScript: '/abs/setup.cjs',
      ...runtimeContext,
      workspaceRoot: '/abs/ws',
      repoIds: ['svc'],
    });

    expect(outcome).toMatchObject({
      hook_status: 'blocked',
      reason_code: 'workspace-child-hook-interpreter-unsupported',
    });
    expect(fs.readFileSync(postCommit, 'utf8')).toBe(before);
    expect(fs.existsSync(path.join(hooksRoot, 'post-checkout'))).toBe(false);
    expect(spawnSync(postCommit, [], { encoding: 'utf8' }).status).toBe(0);
    expect(fs.readFileSync(sentinel, 'utf8')).toBe('ok');
  });

  test('clean preserves pre-existing shell content and removes only a hook created by spec-first', () => {
    const repo = initRepo('preexisting-shell');
    pinLocalHooks(repo, '.githooks');
    const hooksRoot = path.join(repo, '.githooks');
    fs.mkdirSync(hooksRoot, { recursive: true });
    const postCommit = path.join(hooksRoot, 'post-commit');
    fs.writeFileSync(postCommit, '#!/bin/sh\n');
    fs.chmodSync(postCommit, 0o755);

    const installed = applyChildHookPosture({
      child: { repo_id: 'svc', git_root: repo },
      node: '/abs/node',
      asyncRefreshScript: '/abs/async.cjs',
      setupScript: '/abs/setup.cjs',
      ...runtimeContext,
      workspaceRoot: '/abs/ws',
      repoIds: ['svc'],
    });
    expect(installed.hook_status).toBe('installed');

    expect(removeWorkspaceChildHook(repo, hooksRoot)).toMatchObject({ ok: true, changed: true });
    expect(fs.readFileSync(postCommit, 'utf8')).toBe('#!/bin/sh\n');
    expect(fs.existsSync(path.join(hooksRoot, 'post-checkout'))).toBe(false);
  });

  test('clean fails closed on a malformed managed hook block', () => {
    const repo = initRepo('malformed-clean');
    pinLocalHooks(repo, '.githooks');
    const hooksRoot = path.join(repo, '.githooks');
    fs.mkdirSync(hooksRoot, { recursive: true });
    const hookPath = path.join(hooksRoot, 'post-commit');
    const malformed = `#!/bin/sh\n${BLOCK_START}\necho incomplete\n`;
    fs.writeFileSync(hookPath, malformed);
    fs.chmodSync(hookPath, 0o755);

    expect(removeWorkspaceChildHook(repo, hooksRoot)).toMatchObject({
      ok: false,
      changed: false,
      reason_code: 'workspace-child-hook-managed-block-stale',
    });
    expect(fs.readFileSync(hookPath, 'utf8')).toBe(malformed);
  });

  test('never writes an external hooks root and reports blocked', () => {
    const repo = initRepo('external');
    const outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wch-outside-')));
    pinLocalHooks(repo, outside);
    const before = fs.readdirSync(outside);
    const outcome = applyChildHookPosture({
      child: { repo_id: 'svc', git_root: repo },
      node: '/abs/node', asyncRefreshScript: '/abs/async.cjs', setupScript: '/abs/setup.cjs',
      workspaceRoot: '/abs/ws', repoIds: ['svc'],
    });
    expect(outcome.hook_status).toBe('blocked');
    expect(fs.readdirSync(outside)).toEqual(before);
  });

  test('read-only detects an existing marker in an external hooks root as verified-external', () => {
    const repo = initRepo('external-marker');
    const outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wch-outside-marked-')));
    fs.writeFileSync(path.join(outside, 'post-commit'), `#!/bin/sh\n# ${HOOK_MARKER}\n`);
    pinLocalHooks(repo, outside);
    const outcome = applyChildHookPosture({
      child: { repo_id: 'svc', git_root: repo },
      node: 'n', asyncRefreshScript: 'a', setupScript: 's', workspaceRoot: 'w', repoIds: ['svc'],
    });
    expect(outcome.hook_status).toBe('verified-external');
  });

  test('install:false yields not-installed without writing', () => {
    const repo = initRepo('disabled');
    pinLocalHooks(repo, '.githooks');
    const summary = installWorkspaceChildHooks({
      workspaceRoot: '/abs/ws',
      repos: [{ repo_id: 'svc', git_root: repo }],
      node: 'n', asyncRefreshScript: 'a', setupScript: 's',
      install: false,
    });
    expect(summary.status).toBe('not-installed');
    expect(fs.existsSync(path.join(repo, '.githooks', 'post-commit'))).toBe(false);
  });

  test('refuses to install a PATH-dependent hook when the runtime context is incomplete', () => {
    const repo = initRepo('incomplete-context');
    pinLocalHooks(repo, '.githooks');

    const outcome = applyChildHookPosture({
      child: { repo_id: 'svc', git_root: repo },
      node: '/abs/node',
      asyncRefreshScript: '/abs/async.cjs',
      setupScript: '/abs/setup.cjs',
      graphifyCommand: 'graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
      workspaceRoot: '/abs/ws',
      repoIds: ['svc'],
    });

    expect(outcome).toMatchObject({
      hook_status: 'blocked',
      reason_code: 'workspace-child-hook-runtime-context-incomplete',
    });
    expect(fs.existsSync(path.join(repo, '.githooks', 'post-commit'))).toBe(false);
  });

  test('aggregate status is installed only when all children install', () => {
    const contained = initRepo('agg-contained');
    pinLocalHooks(contained, '.githooks');
    const external = initRepo('agg-external');
    const outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wch-agg-out-')));
    pinLocalHooks(external, outside);
    const summary = installWorkspaceChildHooks({
      workspaceRoot: '/abs/ws',
      repos: [
        { repo_id: 'a', git_root: contained },
        { repo_id: 'b', git_root: external },
      ],
      node: '/abs/node', asyncRefreshScript: '/abs/async.cjs', setupScript: '/abs/setup.cjs',
      ...runtimeContext,
    });
    expect(summary.status).toBe('partial');
    expect(summary.repos.map((r) => r.hook_status).sort()).toEqual(['blocked', 'installed']);
  });
});
