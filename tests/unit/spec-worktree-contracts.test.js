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
  test('source documents existing-ref isolation for spec-dogfood', () => {
    const skill = fs.readFileSync(path.join(repoRoot, 'skills/spec-worktree/SKILL.md'), 'utf8');
    const dogfood = fs.readFileSync(path.join(repoRoot, 'skills/spec-dogfood/SKILL.md'), 'utf8');

    expect(skill).toContain('isolate [--copy-env] <target-ref|pr:<number>|#<number>> [worktree-slug]');
    expect(skill).toContain('already_checked_out branch=<name> path=<path>');
    expect(skill).toContain('当前已确认的 caller 只有 `spec-dogfood`');
    expect(skill).not.toContain('`spec-work` and `spec-code-review` offer this skill');
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
});
