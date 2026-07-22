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
  applyChildHookPosture,
  installWorkspaceChildHooks,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-child-hook.cjs');

function initRepo(rel) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-wch-${rel}-`)));
  spawnSync('git', ['-C', root, 'init', '-q']);
  return root;
}
function pinLocalHooks(repo, value) {
  spawnSync('git', ['-C', repo, 'config', '--local', 'core.hooksPath', value]);
}

describe('workspace child hook — render and idempotency', () => {
  test('renders a managed block embedding node, async-refresh, workspace root and repos', () => {
    const block = renderWorkspaceRefreshHookBlock({
      node: '/abs/node',
      asyncRefreshScript: '/abs/workspace-async-refresh.cjs',
      setupScript: '/abs/setup.cjs',
      workspaceRoot: '/abs/ws',
      repoIds: ['api', 'web'],
    });
    expect(block).toContain(BLOCK_START);
    expect(block).toContain(HOOK_MARKER);
    expect(block).toContain('"/abs/node" "/abs/workspace-async-refresh.cjs" --trigger');
    expect(block).toContain('--workspace "/abs/ws"');
    expect(block).toContain('\\"--repos\\",\\"api,web\\"');
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
      "require('node:fs').writeFileSync(process.env.SPEC_FIRST_CAPTURE_PATH, JSON.stringify(process.argv.slice(2)));",
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
    const result = spawnSync('/bin/sh', ['-c', block], {
      env: { ...process.env, SPEC_FIRST_CAPTURE_PATH: capturePath },
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
        '--repos', repoIds.join(','),
      ]),
    ]);
  });
});

describe('workspace child hook — classification and install', () => {
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
      workspaceRoot: '/abs/ws',
      repoIds: ['svc'],
    });
    expect(outcome).toMatchObject({ repo_id: 'svc', hook_status: 'installed' });
    const postCommit = fs.readFileSync(path.join(repo, '.githooks', 'post-commit'), 'utf8');
    const postCheckout = fs.readFileSync(path.join(repo, '.githooks', 'post-checkout'), 'utf8');
    expect(postCommit).toContain(HOOK_MARKER);
    expect(postCheckout).toContain(HOOK_MARKER);
    // Re-install replaces the managed block without duplicating it.
    applyChildHookPosture({
      child: { repo_id: 'svc', git_root: repo },
      node: '/abs/node', asyncRefreshScript: '/abs/async.cjs', setupScript: '/abs/setup.cjs',
      workspaceRoot: '/abs/ws', repoIds: ['svc'],
    });
    const reinstalled = fs.readFileSync(path.join(repo, '.githooks', 'post-commit'), 'utf8');
    expect(reinstalled.split(BLOCK_START)).toHaveLength(2);
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
      node: 'n', asyncRefreshScript: 'a', setupScript: 's',
    });
    expect(summary.status).toBe('partial');
    expect(summary.repos.map((r) => r.hook_status).sort()).toEqual(['blocked', 'installed']);
  });
});
