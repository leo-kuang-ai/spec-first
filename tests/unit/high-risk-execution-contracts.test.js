'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const EXPERIMENT_WORKTREE_SCRIPT = path.join(REPO_ROOT, 'skills', 'spec-optimize', 'scripts', 'experiment-worktree.sh');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_CONFIG_NOSYSTEM: '1',
    },
  });
}

function initGitRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-optimize-'));
  let result = run('git', ['init', '-b', 'main'], repo);
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  run('git', ['config', 'user.email', 'test@example.com'], repo);
  run('git', ['config', 'user.name', 'Spec First Test'], repo);
  fs.writeFileSync(path.join(repo, 'README.md'), '# fixture\n');
  fs.mkdirSync(path.join(repo, 'fixtures'));
  fs.writeFileSync(path.join(repo, 'fixtures', 'data.txt'), 'safe fixture\n');
  result = run('git', ['add', 'README.md', 'fixtures/data.txt'], repo);
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  result = run('git', ['-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'init'], repo);
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return repo;
}

function walkFiles(relativeDir, predicate) {
  const dir = path.join(REPO_ROOT, relativeDir);
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(relativePath, predicate));
    } else if (entry.isFile() && predicate(relativePath)) {
      out.push(relativePath);
    }
  }
  return out;
}

describe('high-risk execution safety contracts', () => {
  test('worktree helpers do not propagate env files by default', () => {
    const worktreeManager = read('skills/spec-worktree/scripts/worktree-manager.sh');
    const optimizeWorktree = read('skills/spec-optimize/scripts/experiment-worktree.sh');
    const gitWorktreeSkill = read('skills/spec-worktree/SKILL.md');

    expect(worktreeManager).toContain('local copy_env="false"');
    expect(worktreeManager).toContain('if [[ "$copy_env" == "true" ]]');
    expect(worktreeManager).toContain('Not copied by default. Re-run create with --copy-env to opt in.');

    expect(optimizeWorktree).toContain('local copy_env="false"');
    expect(optimizeWorktree).toContain('if [[ "$copy_env" == "true" ]]');
    expect(optimizeWorktree).toContain('Environment files not copied by default. Pass --copy-env to opt in.');
    expect(optimizeWorktree).not.toContain('# Copy .env files from main repo');
    expect(worktreeManager).toContain('.env.example|.env.template|.env.sample');
    expect(optimizeWorktree).toContain('.env.example|.env.template|.env.sample');

    expect(gitWorktreeSkill).toContain('Does not copy `.env*` files by default');
    expect(gitWorktreeSkill).toContain('downstream staging must still treat them as denied by default');
    expect(gitWorktreeSkill).not.toContain('Copies `.env`, `.env.local`, `.env.test`, etc. from the main repo');
  });

  test('all skill scripts with env-copy behavior require explicit opt-in', () => {
    const scriptPaths = walkFiles('skills', (relativePath) =>
      relativePath.includes(`${path.sep}scripts${path.sep}`) && /\.(sh|bash)$/.test(relativePath),
    );
    const offenders = [];

    for (const scriptPath of scriptPaths) {
      const body = read(scriptPath);
      const copiesEnvFiles = /\bcp\b[^\n]*\.env/.test(body) || /for [^\n]+ in "[^"]+"\/\.env\*/.test(body);
      if (!copiesEnvFiles) continue;
      const hasOptIn = body.includes('--copy-env') && body.includes('copy_env="false"');
      const hasDefaultWarning = body.includes('not copied by default') || body.includes('Not copied by default');
      if (!hasOptIn || !hasDefaultWarning) offenders.push(scriptPath);
    }

    expect(offenders).toEqual([]);
  });

  test('spec-optimize shared files cannot bypass env and secret boundaries', () => {
    const repo = initGitRepo();
    try {
      fs.writeFileSync(path.join(repo, '.env'), 'SECRET=should-not-copy\n');
      fs.writeFileSync(path.join(repo, 'fixtures', '.env.local'), 'SECRET=nested\n');

      const result = run('bash', [
        EXPERIMENT_WORKTREE_SCRIPT,
        'create',
        'secret-shared-file',
        '1',
        'main',
        '.env',
      ], repo);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('shared_file matches secret deny patterns: .env');

      const nestedResult = run('bash', [
        EXPERIMENT_WORKTREE_SCRIPT,
        'create',
        'secret-shared-dir',
        '1',
        'main',
        'fixtures',
      ], repo);

      expect(nestedResult.status).not.toBe(0);
      expect(nestedResult.stderr).toContain('shared_file directory contains secret-denied path: fixtures/.env.local');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('spec-optimize shared directories reject symlink escapes', () => {
    const repo = initGitRepo();
    const outsideFile = path.join(os.tmpdir(), `spec-first-outside-${process.pid}.txt`);
    try {
      fs.writeFileSync(outsideFile, 'outside secret\n');
      try {
        fs.symlinkSync(outsideFile, path.join(repo, 'fixtures', 'outside-link'));
      } catch (error) {
        if (error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'ENOSYS') return;
        throw error;
      }

      const result = run('bash', [
        EXPERIMENT_WORKTREE_SCRIPT,
        'create',
        'symlink-shared-dir',
        '1',
        'main',
        'fixtures',
      ], repo);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('shared_file directory contains symlink; symlink copying is not supported: fixtures/outside-link');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(outsideFile, { force: true });
    }
  });

  test('spec-optimize shared directories reject secret-denied directory names', () => {
    const repo = initGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'fixtures', 'token-cache'));

      const result = run('bash', [
        EXPERIMENT_WORKTREE_SCRIPT,
        'create',
        'secret-dir-name',
        '1',
        'main',
        'fixtures',
      ], repo);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('shared_file directory contains secret-denied directory: fixtures/token-cache');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('spec-optimize cleanup rejects path traversal spec names before destructive cleanup', () => {
    const repo = initGitRepo();
    const victim = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-optimize-victim-'));

    try {
      const result = run('bash', [
        EXPERIMENT_WORKTREE_SCRIPT,
        'cleanup',
        `foo/../../../${path.basename(victim)}`,
        '1',
      ], repo);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('unsafe spec_name');
      expect(fs.existsSync(victim)).toBe(true);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(victim, { recursive: true, force: true });
    }
  });

  test('spec-optimize cleanup rejects symlinked cleanup targets outside .worktrees', () => {
    const repo = initGitRepo();
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-optimize-outside-'));
    const outsideFile = path.join(outside, 'keep.txt');

    try {
      fs.writeFileSync(outsideFile, 'do not remove\n', 'utf8');
      fs.mkdirSync(path.join(repo, '.worktrees'), { recursive: true });
      fs.symlinkSync(outside, path.join(repo, '.worktrees', 'optimize-safe-exp-001'), 'dir');

      const result = run('bash', [
        EXPERIMENT_WORKTREE_SCRIPT,
        'cleanup',
        'safe',
        '1',
      ], repo);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('cleanup target escapes .worktrees');
      expect(fs.readFileSync(outsideFile, 'utf8')).toBe('do not remove\n');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('spec-optimize copy-env opt-in writes non-secret audit log outside git status', () => {
    const repo = initGitRepo();
    try {
      fs.writeFileSync(path.join(repo, '.env'), 'SECRET=audited-not-logged\n');
      fs.writeFileSync(path.join(repo, '.env.example'), 'EXAMPLE=not-copied\n');

      const result = run('bash', [
        EXPERIMENT_WORKTREE_SCRIPT,
        'create',
        '--copy-env',
        'audit-env-copy',
        '1',
        'main',
      ], repo);

      expect(result.status).toBe(0);
      const worktreePath = path.join(repo, '.worktrees', 'optimize-audit-env-copy-exp-001');
      expect(fs.readFileSync(path.join(worktreePath, '.env'), 'utf8')).toBe('SECRET=audited-not-logged\n');
      expect(fs.existsSync(path.join(worktreePath, '.env.example'))).toBe(false);

      const log = fs.readFileSync(path.join(worktreePath, '.env-copy.log'), 'utf8');
      expect(log).toContain('source_path=');
      expect(log).toContain('destination_path=');
      expect(log).toContain('size_bytes=');
      expect(log).toMatch(/sha256_8=[a-f0-9]{8}/);
      expect(log).not.toContain('audited-not-logged');

      expect(run('git', ['-C', worktreePath, 'check-ignore', '.env-copy.log'], repo).status).toBe(0);
      const status = run('git', ['-C', worktreePath, 'status', '--short', '--', '.env-copy.log'], repo);
      expect(status.stdout).toBe('');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('spec-optimize copy-env refuses symlinked env destinations', () => {
    const repo = initGitRepo();
    const outsideFile = path.join(os.tmpdir(), `spec-first-optimize-env-outside-${process.pid}.txt`);

    try {
      fs.writeFileSync(outsideFile, 'outside-before\n', 'utf8');
      try {
        fs.symlinkSync(outsideFile, path.join(repo, '.env'));
      } catch (error) {
        if (error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'ENOSYS') return;
        throw error;
      }
      run('git', ['add', '.env'], repo);
      run('git', ['-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'track env symlink'], repo);
      run('git', ['branch', 'symlink-base'], repo);
      fs.rmSync(path.join(repo, '.env'), { force: true });
      fs.writeFileSync(path.join(repo, '.env'), 'MAIN_SECRET=do-not-leak\n', 'utf8');

      const result = run('bash', [
        EXPERIMENT_WORKTREE_SCRIPT,
        'create',
        '--copy-env',
        'env-symlink',
        '1',
        'symlink-base',
      ], repo);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('refusing to copy env file through symlink destination: .env');
      expect(fs.readFileSync(outsideFile, 'utf8')).toBe('outside-before\n');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(outsideFile, { force: true });
    }
  });

  test('task-pack schema preserves expected_side_effects boundary metadata', () => {
    const taskPackSchema = read('skills/spec-write-tasks/references/task-pack-schema.md');

    expect(taskPackSchema).toContain('`expected_side_effects`');
    expect(taskPackSchema).toContain('must not use `**` whole-repo globs');
  });
});
