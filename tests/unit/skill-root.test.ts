import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  resolveSkillRootUpwards,
  resolveSkillRootWithin,
} from '../../src/shared/skill-root.js';

let TMP_ROOT = '';

beforeEach(() => {
  TMP_ROOT = mkdtempSync(join(tmpdir(), 'spec-first-skill-root-'));
});

afterEach(() => {
  rmSync(TMP_ROOT, { recursive: true, force: true });
});

describe('skill-root resolution', () => {
  it('should resolve a renamed skill collection root inside the project tree', () => {
    const renamedRoot = join(TMP_ROOT, 'skill-pack');
    mkdirSync(join(renamedRoot, 'alpha'), { recursive: true });
    writeFileSync(join(renamedRoot, 'alpha', 'SKILL.md'), '# alpha', 'utf-8');

    expect(resolveSkillRootWithin(TMP_ROOT)).toBe(renamedRoot);
  });

  it('should resolve a renamed skill collection root while walking upward', () => {
    const renamedRoot = join(TMP_ROOT, 'bundle', 'skill-pack');
    mkdirSync(join(renamedRoot, 'beta'), { recursive: true });
    writeFileSync(join(renamedRoot, 'beta', 'SKILL.md'), '# beta', 'utf-8');

    expect(resolveSkillRootUpwards(join(TMP_ROOT, 'bundle', 'nested', 'module'))).toBe(renamedRoot);
  });
});
