import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { handleSetup } from '../../src/cli/commands/setup.js';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-setup');
const origCwd = process.cwd;

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
  process.cwd = () => TMP;
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
});

describe('handleSetup', () => {
  it('should print help without creating command files', () => {
    const code = handleSetup(['--help']);
    expect(code).toBe(ExitCode.SUCCESS);
    expect(existsSync(join(TMP, '.claude', 'commands'))).toBe(false);
  });

  it('should register project-level Claude command files by default', () => {
    const code = handleSetup([]);
    expect(code).toBe(ExitCode.SUCCESS);

    const commandDir = join(TMP, '.claude', 'commands');
    expect(existsSync(commandDir)).toBe(true);
    const namespacedDir = join(commandDir, 'spec-first');
    expect(existsSync(namespacedDir)).toBe(true);
    expect(readdirSync(namespacedDir).some((name) => name === 'init.md')).toBe(true);
  });
});
