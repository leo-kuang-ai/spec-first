'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  resolveWorkspaceTargets,
  MANIFEST_RELATIVE_PATH,
} = require('../../skills/spec-mcp-setup/scripts/lib/workspace-target.cjs');

function mkWorkspace(name = 'spec-first-ws-target-') {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), name)));
}

function initRepo(root, relativePath) {
  const repo = path.resolve(root, relativePath);
  fs.mkdirSync(repo, { recursive: true });
  const result = spawnSync('git', ['init', '-q', repo], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git init failed: ${result.stderr || result.stdout}`);
  return repo;
}

function writeManifest(root, contents) {
  const manifestPath = path.join(root, MANIFEST_RELATIVE_PATH);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, contents, 'utf8');
  return manifestPath;
}

function repoIds(result) {
  return result.repos.map((r) => r.repo_id).sort();
}

function bySource(result, source) {
  return result.repos.filter((r) => r.source === source).map((r) => r.repo_id).sort();
}

describe('resolveWorkspaceTargets — manifest + CLI + discovery', () => {
  test('AE1/AE2: manifest lists a subset; the rest are discovered candidates needing confirm', () => {
    const ws = mkWorkspace();
    initRepo(ws, '工程1');
    initRepo(ws, '工程2');
    initRepo(ws, '工程3');
    writeManifest(ws, [
      'schema_version: workspace-manifest.v1',
      'repos:',
      '  - path: 工程1',
      '  - path: 工程2',
    ].join('\n'));

    const result = resolveWorkspaceTargets({ cwd: ws });

    expect(result.topology).toBe('requirement-workspace');
    expect(result.manifest_present).toBe(true);
    expect(repoIds(result)).toEqual(['工程1', '工程2', '工程3']);
    // manifest repos are confirmed; discovered one needs confirm.
    expect(bySource(result, 'manifest')).toEqual(['工程1', '工程2']);
    expect(bySource(result, 'discovered')).toEqual(['工程3']);
    const discovered = result.repos.find((r) => r.repo_id === '工程3');
    expect(discovered.needs_confirm).toBe(true);
    const declared = result.repos.find((r) => r.repo_id === '工程1');
    expect(declared.needs_confirm).toBe(false);
  });

  test('CLI --repos declarations are confirmed (needs_confirm false)', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');
    const result = resolveWorkspaceTargets({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(repoIds(result)).toEqual(['api']);
    expect(bySource(result, 'cli')).toEqual(['api']);
    expect(result.repos[0].needs_confirm).toBe(false);
  });

  test('non-ASCII workspace folder name resolves child repos', () => {
    const parent = mkWorkspace();
    const ws = path.join(parent, '需求A');
    fs.mkdirSync(ws, { recursive: true });
    initRepo(ws, '工程1');
    const result = resolveWorkspaceTargets({ cwd: ws });
    expect(result.workspace_root).toBe(fs.realpathSync(ws));
    expect(repoIds(result)).toEqual(['工程1']);
  });

  test('manifest exclusions drop a discovered candidate', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'vendored');
    writeManifest(ws, [
      'schema_version: workspace-manifest.v1',
      'exclusions:',
      '  - vendored',
    ].join('\n'));
    const result = resolveWorkspaceTargets({ cwd: ws });
    expect(repoIds(result)).toEqual(['api']);
    expect(result.excluded).toContain('vendored');
  });
});

describe('resolveWorkspaceTargets — containment and safety', () => {
  test('declared repo path escaping the workspace via .. is rejected, not included', () => {
    const outer = mkWorkspace();
    const sibling = initRepo(outer, 'outside-repo');
    const ws = path.join(outer, 'ws');
    fs.mkdirSync(ws, { recursive: true });
    initRepo(ws, 'inside');

    const result = resolveWorkspaceTargets({ cwd: ws, repos: ['../outside-repo'], allowDiscovery: false });
    expect(repoIds(result)).toEqual([]);
    expect(result.rejected.some((r) => r.reason_code.includes('escape'))).toBe(true);
    expect(sibling).toBeTruthy();
  });

  test('declared repo reached through a symlink escaping the workspace is rejected', () => {
    const outer = mkWorkspace();
    const realOutside = initRepo(outer, 'real-outside');
    const ws = path.join(outer, 'ws');
    fs.mkdirSync(ws, { recursive: true });
    let linkSupported = true;
    try {
      fs.symlinkSync(realOutside, path.join(ws, 'linked'), 'dir');
    } catch (_error) {
      linkSupported = false;
    }
    if (!linkSupported) return;
    const result = resolveWorkspaceTargets({ cwd: ws, repos: ['linked'], allowDiscovery: false });
    expect(repoIds(result)).toEqual([]);
    expect(result.rejected.some((r) => r.reason_code.includes('escape'))).toBe(true);
  });

  test('declared path that is not a git repo is rejected with a clear reason', () => {
    const ws = mkWorkspace();
    fs.mkdirSync(path.join(ws, 'plain-dir'), { recursive: true });
    const result = resolveWorkspaceTargets({ cwd: ws, repos: ['plain-dir'], allowDiscovery: false });
    expect(repoIds(result)).toEqual([]);
    expect(result.rejected).toEqual([
      expect.objectContaining({ reason_code: 'declared-repo-not-git' }),
    ]);
  });
});

describe('resolveWorkspaceTargets — ambiguity is surfaced, never silently resolved', () => {
  test('duplicate alias across two repos is flagged ambiguous', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'a');
    initRepo(ws, 'b');
    writeManifest(ws, [
      'schema_version: workspace-manifest.v1',
      'repos:',
      '  - path: a',
      '    alias: core',
      '  - path: b',
      '    alias: core',
    ].join('\n'));
    const result = resolveWorkspaceTargets({ cwd: ws, allowDiscovery: false });
    expect(repoIds(result)).toEqual(['a', 'b']);
    expect(result.ambiguous.some((a) => a.reason_code === 'duplicate-alias' && a.alias === 'core')).toBe(true);
  });
});

describe('resolveWorkspaceTargets — topology guards', () => {
  test('cwd that is itself a git repo returns cwd-is-git-repo topology', () => {
    const ws = mkWorkspace();
    initRepo(ws, '.');
    const result = resolveWorkspaceTargets({ cwd: ws });
    expect(result.topology).toBe('cwd-is-git-repo');
    expect(result.reason_code).toBe('workspace-cwd-is-git-repo');
    expect(result.repos).toEqual([]);
  });

  test('non-git parent with no child repos and no declarations reports no-review-targets', () => {
    const ws = mkWorkspace();
    fs.mkdirSync(path.join(ws, 'docs'), { recursive: true });
    const result = resolveWorkspaceTargets({ cwd: ws });
    expect(result.topology).toBe('requirement-workspace');
    expect(result.repos).toEqual([]);
    expect(result.reason_code).toBe('workspace-no-review-targets');
  });

  test('malformed manifest with no other source fails loudly', () => {
    const ws = mkWorkspace();
    writeManifest(ws, 'schema_version: workspace-manifest.v0\nrepos: not-a-list');
    const result = resolveWorkspaceTargets({ cwd: ws, allowDiscovery: false });
    expect(result.manifest_error).toBe('workspace-manifest-version-mismatch');
    expect(result.reason_code).toBe('workspace-manifest-version-mismatch');
  });

  test.each([
    ['missing required version', 'repos:\n  - path: api\n', 'workspace-manifest-schema-invalid'],
    ['unknown top-level field', 'schema_version: workspace-manifest.v1\nowner: team\n', 'workspace-manifest-schema-invalid'],
    ['unknown repo field', 'schema_version: workspace-manifest.v1\nrepos:\n  - path: api\n    branch: main\n', 'workspace-manifest-schema-invalid'],
  ])('%s fails strict schema validation', (_name, manifest, reasonCode) => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    writeManifest(ws, manifest);
    const result = resolveWorkspaceTargets({ cwd: ws, allowDiscovery: false });
    expect(result.manifest_error).toBe(reasonCode);
    expect(result.reason_code).toBe(reasonCode);
  });
});
