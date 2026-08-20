'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const scriptPath = path.join(repoRoot, 'skills/spec-worktree/scripts/worktree-manager.sh');

function canonicalShellPath(targetPath) {
  const realpath = fs.realpathSync.native || fs.realpathSync;
  return realpath(targetPath).replace(/\\/g, '/');
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function initRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-worktree-'));
  run('git', ['init', '-b', 'main'], { cwd: dir });
  run('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  run('git', ['config', 'user.name', 'Spec Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'README.md'), '# Test\n');
  run('git', ['add', 'README.md'], { cwd: dir });
  run('git', ['commit', '-m', 'init'], { cwd: dir });
  run('git', ['branch', 'feature/login'], { cwd: dir });
  return dir;
}

describe('spec-worktree existing-ref isolation contracts', () => {
  test('source documents caller-owned isolation for spec-dogfood and spec-work', () => {
    const skill = fs.readFileSync(path.join(repoRoot, 'skills/spec-worktree/SKILL.md'), 'utf8');
    const dogfood = fs.readFileSync(path.join(repoRoot, 'skills/spec-dogfood/SKILL.md'), 'utf8');

    expect(skill).toContain('isolate [--copy-env] <target-ref|pr:<number>|#<number>> [worktree-slug]');
    expect(skill).toContain('already_checked_out branch=<name> path=<path>');
    expect(skill).toContain('Governed callers are spec-dogfood and spec-work');
    expect(skill).toContain('caller-owned isolation contract');
    expect(skill).toMatch(/never selects an execution engine, dispatches a worker/i);
    expect(skill).toContain('worker_git_index_enforcement_unavailable');
    expect(skill).toMatch(/linked worktree does not enforce Git-index isolation/i);
    expect(skill).not.toContain('`spec-code-review` offer this skill');
    expect(skill).not.toMatch(/description:.*spec-work.*spec-code-review/i);
    expect(dogfood).toContain('isolate pr:<number>');
    expect(dogfood).toContain('isolate <branch>');
    expect(dogfood).toContain('already_checked_out branch=<name> path=<path>');
    expect(dogfood).toContain('never switch the primary checkout');
  });

  test('isolate attaches an existing branch and reports already-checked-out on repeat', () => {
    const dir = initRepo();

    const first = run('bash', [scriptPath, 'isolate', 'feature/login'], { cwd: dir });
    const worktreePath = path.posix.join(canonicalShellPath(dir), '.worktrees', 'feature-login');

    expect(first).toContain(`Worktree ready: ${worktreePath}`);
    expect(fs.existsSync(worktreePath)).toBe(true);
    expect(run('git', ['branch', '--show-current'], { cwd: worktreePath }).trim()).toBe('feature/login');
    expect(run('git', ['branch', '--show-current'], { cwd: dir }).trim()).toBe('main');

    const second = run('bash', [scriptPath, 'isolate', 'feature/login'], { cwd: dir });
    expect(second).toContain('already_checked_out branch=feature/login path=');
    expect(second).toContain(worktreePath);
  });

  test.each([['..'], ['../escaped'], ['.'], ['a/b']])(
    'rejects the traversal-unsafe worktree slug %s instead of building a path from it',
    (slug) => {
      const dir = initRepo();
      const escapeProbe = path.join(path.dirname(dir), 'escaped');

      let failure;
      try {
        run('bash', [scriptPath, 'isolate', 'feature/login', slug], { cwd: dir });
      } catch (error) {
        failure = error;
      }

      expect(failure).toBeDefined();
      expect(String(failure.stderr)).toContain('unsafe worktree slug');
      expect(fs.existsSync(escapeProbe)).toBe(false);
      // Rejection happens before any path is built, so no worktree root is created at all.
      expect(fs.existsSync(path.join(dir, '.worktrees'))).toBe(false);
    },
  );

  test('accepts a safe caller-supplied worktree slug', () => {
    const dir = initRepo();

    const output = run('bash', [scriptPath, 'isolate', 'feature/login', 'my-slug.v2'], { cwd: dir });

    expect(output).toContain('Worktree ready:');
    expect(fs.existsSync(path.join(dir, '.worktrees', 'my-slug.v2'))).toBe(true);
  });

  test('detect compares git directories through one canonical path resolver', () => {
    const dir = initRepo();
    const bashEnv = path.join(dir, 'bash-env');
    fs.writeFileSync(bashEnv, [
      'pwd() {',
      '  local result',
      '  result=$(builtin pwd "$@")',
      '  printf \'%s/\\n\' "${result%/}"',
      '}',
      '',
    ].join('\n'));

    const facts = JSON.parse(run('bash', [scriptPath, 'detect', '--json'], {
      cwd: dir,
      env: { BASH_ENV: canonicalShellPath(bashEnv) },
    }));

    expect(facts.state).toBe('ordinary-checkout');
    expect(facts.reason_code).toBe('same-git-dir');
    expect(facts.git_dir).toBe(facts.common_dir);
  });

  test('reports mise and direnv trust commands without executing them', () => {
    const dir = initRepo();
    const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-worktree-fake-tools-'));
    const marker = path.join(fakeBin, 'called.log');
    for (const tool of ['mise', 'direnv']) {
      const executable = path.join(fakeBin, tool);
      fs.writeFileSync(executable, `#!/bin/sh\nprintf '%s\\n' "${tool}" >> "$FAKE_TOOL_MARKER"\n`);
      fs.chmodSync(executable, 0o755);
    }
    fs.writeFileSync(path.join(dir, '.mise.toml'), '[tools]\nnode = "22"\n');
    fs.writeFileSync(path.join(dir, '.envrc'), 'export SAFE_FIXTURE=1\n');
    run('git', ['add', '.mise.toml', '.envrc'], { cwd: dir });
    run('git', ['commit', '-m', 'add dev tool config'], { cwd: dir });

    const output = run('bash', [scriptPath, 'create', 'feature/no-auto-trust', 'main'], {
      cwd: dir,
      env: {
        PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
        FAKE_TOOL_MARKER: marker,
      },
    });

    expect(output).toContain('Manual review required for: mise trust .mise.toml direnv allow');
    expect(fs.existsSync(marker)).toBe(false);
  });

  test('env copy audit log is owner-only and contains no paths or content hash', () => {
    const dir = initRepo();
    const secretPath = path.join(dir, '.env.local');
    fs.writeFileSync(secretPath, 'SECRET_SENTINEL=value\n');

    run('bash', [scriptPath, 'isolate', '--copy-env', 'feature/login'], { cwd: dir });
    const worktreePath = path.join(dir, '.worktrees', 'feature-login');
    const logPath = path.join(worktreePath, '.env-copy.log');
    const log = fs.readFileSync(logPath, 'utf8');

    expect(fs.statSync(logPath).mode & 0o777).toBe(0o600);
    expect(log).toContain('file_name=.env.local');
    expect(log).toContain('size_bytes=');
    expect(log).not.toContain(canonicalShellPath(dir));
    expect(log).not.toContain('source_path=');
    expect(log).not.toContain('destination_path=');
    expect(log).not.toContain('sha256');
    expect(log).not.toContain('SECRET_SENTINEL');
  });
});
