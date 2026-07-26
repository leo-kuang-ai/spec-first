'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const {
  collectGitCachedNameStatus,
  collectGitDiffSignals,
  collectGitStatusPorcelain,
  normalizeRepoPath,
  parseNumstat,
  resolveRepoPath,
  topDirsForPaths,
  unquoteGitPath,
} = require('../../src/cli/helpers/git-diff-signals');
const { computeBootstrapLayer, computeSetupLayer } = require('../../src/cli/helpers/scenario-fingerprint');

const CHINESE_DIR = 'docs/10-prompt';
const CHINESE_BASENAME = '结构化项目角色契约.md';
const CHINESE_PATH = `${CHINESE_DIR}/${CHINESE_BASENAME}`;

const repos = [];

function makeRepo(label) {
  const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `git-quoted-${label}-`)));
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'Spec First Test'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 'spec-first-test@example.invalid'], { cwd: repo });
  // core.quotepath default is on; pin it so the decoder is exercised even if the
  // host has a global override.
  execFileSync('git', ['config', 'core.quotepath', 'true'], { cwd: repo });
  repos.push(repo);
  return repo;
}

function writeFile(repo, relativePath, contents) {
  const absolute = path.join(repo, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, contents, 'utf8');
  return absolute;
}

function git(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
}

afterAll(() => {
  for (const repo of repos) {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

describe('unquoteGitPath', () => {
  test('decodes octal escapes as a UTF-8 byte sequence, not per-character codes', () => {
    // git emits one \NNN escape per UTF-8 byte; per-character decoding produces mojibake.
    expect(unquoteGitPath('"\\347\\273\\223\\346\\236\\204.md"')).toBe('结构.md');
    // 4-byte code point (emoji) only survives byte-level decoding.
    expect(unquoteGitPath('"\\360\\237\\232\\200.md"')).toBe('🚀.md');
  });

  test('decodes C escape characters', () => {
    expect(unquoteGitPath('"tab\\there.md"')).toBe('tab\there.md');
    expect(unquoteGitPath('"quote\\".md"')).toBe('quote".md');
    expect(unquoteGitPath('"back\\\\slash.md"')).toBe('back\\slash.md');
    expect(unquoteGitPath('"line\\nbreak.md"')).toBe('line\nbreak.md');
  });

  test('leaves unquoted paths untouched', () => {
    expect(unquoteGitPath('docs/plain.md')).toBe('docs/plain.md');
    expect(unquoteGitPath('has space.md')).toBe('has space.md');
    // A path that merely contains a quote is not a C-quoted string.
    expect(unquoteGitPath('docs/od"d.md')).toBe('docs/od"d.md');
    expect(unquoteGitPath('')).toBe('');
    expect(unquoteGitPath(null)).toBe('');
  });

  test('does not invent path segments out of octal escapes', () => {
    const decoded = normalizeRepoPath('"docs/10-prompt/\\347\\273\\223\\346\\236\\204.md"');
    expect(decoded).toBe('docs/10-prompt/结构.md');
    expect(decoded.split('/')).toHaveLength(3);
  });
});

describe('git-diff-signals decodes real C-quoted non-ASCII paths', () => {
  let repo;

  beforeAll(() => {
    repo = makeRepo('signals');
    writeFile(repo, CHINESE_PATH, 'baseline\n');
    writeFile(repo, 'plain.md', 'baseline\n');
    writeFile(repo, 'has space.md', 'baseline\n');
    git(repo, ['add', '-A']);
  });

  test('git really does emit the C-quoted form for the Chinese path', () => {
    const raw = git(repo, ['status', '--porcelain', '-uall']);
    expect(raw).toContain('\\347\\273\\223');
    expect(raw).not.toContain(CHINESE_BASENAME);
  });

  test('collectGitCachedNameStatus yields the real path that exists on disk', () => {
    const result = collectGitCachedNameStatus(repo);
    expect(result.ok).toBe(true);
    const paths = result.entries.map((entry) => entry.path);
    expect(paths).toContain(CHINESE_PATH);
    for (const repoPath of paths) {
      expect(fs.existsSync(resolveRepoPath(repo, repoPath))).toBe(true);
    }
  });

  test('collectGitStatusPorcelain yields the real path that exists on disk', () => {
    const result = collectGitStatusPorcelain(repo);
    expect(result.ok).toBe(true);
    const paths = result.entries.map((entry) => entry.path);
    expect(paths).toContain(CHINESE_PATH);
    // Space-only paths are quoted by porcelain output but need no escape decoding.
    expect(paths).toContain('has space.md');
    for (const repoPath of paths) {
      expect(fs.existsSync(resolveRepoPath(repo, repoPath))).toBe(true);
    }
  });

  test('collectGitDiffSignals numstat decodes the worktree diff path', () => {
    git(repo, ['commit', '-qm', 'baseline']);
    writeFile(repo, CHINESE_PATH, 'baseline\nchanged\n');
    const result = collectGitDiffSignals({ targetRepo: repo });
    expect(result.ok).toBe(true);
    expect(result.paths).toEqual([CHINESE_PATH]);
    expect(result.entries[0].added).toBe(1);
    expect(fs.existsSync(resolveRepoPath(repo, result.paths[0]))).toBe(true);
  });

  test('topDirsForPaths reports the real top directory, not a quote fragment', () => {
    const topDirs = topDirsForPaths(collectGitStatusPorcelain(repo).entries.map((entry) => entry.path));
    expect(topDirs).toContain('docs');
    expect(topDirs.some((dir) => dir.includes('"'))).toBe(false);
  });

  test('renamed non-ASCII paths decode to the destination path', () => {
    const renameRepo = makeRepo('rename');
    writeFile(renameRepo, CHINESE_PATH, 'baseline\n');
    git(renameRepo, ['add', '-A']);
    git(renameRepo, ['commit', '-qm', 'baseline']);
    git(renameRepo, ['mv', CHINESE_PATH, `${CHINESE_DIR}/重命名后.md`]);
    const entries = collectGitCachedNameStatus(renameRepo).entries;
    const paths = entries.map((entry) => entry.path);
    expect(paths).toContain(`${CHINESE_DIR}/重命名后.md`);
    expect(paths.some((entry) => entry.includes('\\') || entry.includes('"'))).toBe(false);
  });
});

describe('parseNumstat decoding is independent of git invocation', () => {
  test('decodes quoted numstat output passed in directly', () => {
    const output = [
      `3\t1\t"docs/10-prompt/\\347\\273\\223\\346\\236\\204.md"`,
      '2\t0\tplain.md',
      '-\t-\t"assets/\\345\\233\\276.png"',
    ].join('\n');
    expect(parseNumstat(output)).toEqual([
      { added: 3, deleted: 1, path: 'docs/10-prompt/结构.md' },
      { added: 2, deleted: 0, path: 'plain.md' },
      { added: 0, deleted: 0, path: 'assets/图.png' },
    ]);
  });
});

describe('scenario-fingerprint worktree facts', () => {
  test('dirty_paths_sample carries decoded non-ASCII paths', () => {
    const repo = makeRepo('fingerprint');
    writeFile(repo, CHINESE_PATH, 'baseline\n');
    git(repo, ['add', '-A']);
    const fingerprint = computeSetupLayer({
      cwd: repo,
      workspaceRoot: repo,
      targetFacts: { target_root: repo, target_kind: 'git-repo' },
    });
    const samplePaths = fingerprint.worktree.dirty_paths_sample.map((entry) => entry.path);
    expect(samplePaths).toContain(CHINESE_PATH);
    expect(samplePaths.some((entry) => entry.includes('\\3') || entry.includes('"'))).toBe(false);
    expect(fingerprint.worktree.dirty).toBe(true);
    expect(fingerprint.worktree.dirty_state).toBe('confirmed-dirty');
  });

  test('a clean repo is reported as confirmed-clean with no reason code', () => {
    const repo = makeRepo('clean');
    writeFile(repo, 'plain.md', 'baseline\n');
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-qm', 'baseline']);
    const fingerprint = computeSetupLayer({
      cwd: repo,
      workspaceRoot: repo,
      targetFacts: { target_root: repo, target_kind: 'git-repo' },
    });
    expect(fingerprint.worktree.dirty).toBe(false);
    expect(fingerprint.worktree.dirty_state).toBe('confirmed-clean');
    expect(fingerprint.worktree.reason_code).toBeNull();
    expect(fingerprint.worktree.status_hash).toMatch(/^sha256:/);
    expect(fingerprint.limitations).not.toContain(
      'worktree dirty state is unknown: git status --porcelain did not succeed',
    );
  });

  test('a failing git status degrades to unknown instead of confirmed-clean', () => {
    const repo = makeRepo('status-failure');
    writeFile(repo, 'plain.md', 'baseline\n');
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-qm', 'baseline']);
    // Corrupt the index: `rev-parse --is-inside-work-tree` still succeeds, so the repo
    // is recognised as a git repo, but `git status --porcelain` fails.
    fs.writeFileSync(path.join(repo, '.git', 'index'), 'GARBAGE-NOT-AN-INDEX');
    expect(() => git(repo, ['status', '--porcelain'])).toThrow();
    expect(git(repo, ['rev-parse', '--is-inside-work-tree']).trim()).toBe('true');

    const setup = computeSetupLayer({
      cwd: repo,
      workspaceRoot: repo,
      targetFacts: { target_root: repo, target_kind: 'git-repo' },
    });
    expect(setup.state_class).toBe('git-status-unknown-single-repo');
    expect(setup.worktree.dirty_state).toBe('unknown');
    expect(setup.worktree.reason_code).toBe('git-status-unavailable');
    expect(setup.worktree.status_hash).toBeNull();
    expect(setup.limitations).toContain(
      'worktree dirty state is unknown: git status --porcelain did not succeed',
    );

    const setupPath = path.join(repo, '.spec-first', 'workspace', 'scenario-fingerprint-setup.json');
    fs.mkdirSync(path.dirname(setupPath), { recursive: true });
    fs.writeFileSync(setupPath, `${JSON.stringify(setup, null, 2)}\n`, 'utf8');
    const bootstrap = computeBootstrapLayer({ cwd: repo, workspaceRoot: repo });
    expect(bootstrap.state_class).toBe('git-status-unknown-single-repo');
    expect(bootstrap.worktree.dirty_state).toBe('unknown');
    expect(bootstrap.worktree.reason_code).toBe('git-status-unavailable');
    expect(bootstrap.limitations).toContain(
      'worktree dirty state is unknown: git status --porcelain did not succeed',
    );
  });

  test('a non-git target reports not-applicable rather than clean', () => {
    const folder = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'git-quoted-nongit-')));
    repos.push(folder);
    fs.writeFileSync(path.join(folder, 'plain.md'), 'baseline\n', 'utf8');
    const fingerprint = computeSetupLayer({
      cwd: folder,
      workspaceRoot: folder,
      targetFacts: { target_root: folder, target_kind: 'non-git-folder' },
    });
    expect(fingerprint.worktree.dirty_state).toBe('not-applicable');
    expect(fingerprint.worktree.reason_code).toBe('not-a-git-repo');
  });

  test('a multi-repo workspace with an unreadable child status does not degrade to ordinary bounded scope', () => {
    const workspace = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'git-quoted-workspace-')));
    repos.push(workspace);
    const cleanChild = makeRepo('workspace-clean-child');
    writeFile(cleanChild, 'plain.md', 'baseline\n');
    git(cleanChild, ['add', '-A']);
    git(cleanChild, ['commit', '-qm', 'baseline']);
    const unknownChild = makeRepo('workspace-unknown-child');
    writeFile(unknownChild, 'plain.md', 'baseline\n');
    git(unknownChild, ['add', '-A']);
    git(unknownChild, ['commit', '-qm', 'baseline']);
    fs.writeFileSync(path.join(unknownChild, '.git', 'index'), 'GARBAGE-NOT-AN-INDEX');

    const fingerprint = computeSetupLayer({
      cwd: workspace,
      workspaceRoot: workspace,
      targetFacts: {
        target_root: cleanChild,
        target_kind: 'git-repo',
        target_mode: 'multi-repo-workspace',
        target_candidates: [
          { repo_label: 'clean', git_root: cleanChild, workspace_relative_path: 'clean' },
          { repo_label: 'unknown', git_root: unknownChild, workspace_relative_path: 'unknown' },
        ],
      },
    });

    expect(fingerprint.state_class).toBe('multi-repo-unknown-workspace');
    expect(fingerprint.worktree.dirty_state).toBe('unknown');
    expect(fingerprint.worktree.reason_code).toBe('child-git-status-unavailable');
    expect(fingerprint.worktree.dirty_unknown_child_count).toBe(1);
    expect(fingerprint.topology.child_repos).toEqual(expect.arrayContaining([
      expect.objectContaining({ repo_label: 'unknown', dirty_state: 'unknown' }),
    ]));
  });
});
