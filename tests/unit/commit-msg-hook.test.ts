import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-commit-msg');
const SCRIPT = join(import.meta.dirname, '../../.spec-first/hooks/commit-msg.sh');
const POSIX_SHELL = existsSync('/bin/dash') ? '/bin/dash' : 'sh';

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('commit-msg hook', () => {
  it('should exit 0 for [TASK-XXX-001] format', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, '[TASK-AUTH-001] implement login feature\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 for [FR-XXX-001] format', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, '[FR-AUTH-001] user authentication\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 for [DS-XXX-001] format', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, '[DS-AUTH-001] auth service design\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 for [RFC-XXX-001] format', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, '[RFC-001] propose new auth flow\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 for conventional commits feat(scope): format', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, 'feat(auth): implement login\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 for fix: format', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, 'fix: correct login bug\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 for docs: format', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, 'docs: update README\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 for chore: format', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, 'chore: update dependencies\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 for ci: format', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, 'ci: add github actions\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 for test: format', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, 'test: add login tests\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 for refactor: format', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, 'refactor(auth): simplify login logic\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 for style: format', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, 'style: format code\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 1 for invalid format without tag', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, 'just a random message\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(1);
    const output = result.stdout + result.stderr;
    expect(output).toContain('Commit message 校验失败');
    expect(output).toContain('[What]');
    expect(output).toContain('[How]');
  });

  it('should exit 1 for empty message', () => {
    const msgFile = join(TMP, 'commit-msg.txt');
    writeFileSync(msgFile, '\n', 'utf-8');

    const result = spawnSync(POSIX_SHELL, [SCRIPT, msgFile], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(1);
    const output = result.stdout + result.stderr;
    expect(output).toContain('Commit message 校验失败');
  });

  it('should output version when --version flag is passed', () => {
    const result = spawnSync(POSIX_SHELL, [SCRIPT, '--version'], { encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('spec-first commit-msg hook');
    expect(result.stdout).toContain('0.1.0');
  });
});
