import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleHooks } from '../../src/cli/commands/hooks.js';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-hooks');

function withCwd(dir: string, fn: () => number): number {
  const orig = process.cwd;
  process.cwd = () => dir;
  try { return fn(); } finally { process.cwd = orig; }
}

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('handleHooks', () => {
  it('should return VALIDATION_ERROR when install without .git', () => {
    const code = withCwd(TMP, () => handleHooks(['install']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should install hooks when .git exists', () => {
    mkdirSync(join(TMP, '.git', 'hooks'), { recursive: true });
    const code = withCwd(TMP, () => handleHooks(['install']));
    expect(code).toBe(ExitCode.SUCCESS);
    expect(existsSync(join(TMP, '.git', 'hooks', 'pre-commit'))).toBe(true);
    expect(existsSync(join(TMP, '.git', 'hooks', 'commit-msg'))).toBe(true);

    const preCommit = readFileSync(join(TMP, '.git', 'hooks', 'pre-commit'), 'utf-8');
    expect(preCommit).toContain('CHANGELOG.md');
    expect(preCommit).toContain('CLAUDE.md');
    expect(preCommit).toContain('--diff-filter=ACMRD');
    expect(preCommit).toContain('while IFS= read -r FILE');
  });

  it('should return SUCCESS for status without .git', () => {
    const code = withCwd(TMP, () => handleHooks(['status']));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should uninstall spec-first hooks', () => {
    mkdirSync(join(TMP, '.git', 'hooks'), { recursive: true });
    writeFileSync(join(TMP, '.git', 'hooks', 'pre-commit'), '#!/bin/sh\n# spec-first-hook\n', 'utf-8');
    const code = withCwd(TMP, () => handleHooks(['uninstall']));
    expect(code).toBe(ExitCode.SUCCESS);
  });
});
