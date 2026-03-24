import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import {
  assessSafety,
  buildSafetyNotice,
} from '../../src/core/skill-runtime/safety-guard.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-safety-guard');

describe('safety guard', () => {
  beforeEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(TMP, { recursive: true });
  });

  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('returns safe when no repo signals exist', () => {
    const assessment = assessSafety('code', TMP);
    expect(assessment.level).toBe('safe');
    expect(assessment.signals).toEqual([]);
  });

  it('returns warning notice on protected branch without blocking execution', () => {
    execSync('git -c core.hooksPath=/dev/null init', { cwd: TMP, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: TMP, stdio: 'ignore' });
    execSync('git config user.name "test"', { cwd: TMP, stdio: 'ignore' });
    writeFileSync(join(TMP, 'README.md'), 'seed\n', 'utf-8');
    execSync('git -c core.hooksPath=/dev/null add README.md', { cwd: TMP, stdio: 'ignore' });
    execSync('git -c core.hooksPath=/dev/null -c commit.gpgsign=false commit -m "seed"', {
      cwd: TMP,
      stdio: 'ignore',
    });
    execSync('git checkout -b main || git checkout main', { cwd: TMP, stdio: 'ignore' });

    const assessment = assessSafety('code', TMP);
    const notice = buildSafetyNotice(assessment, 'code');
    expect(assessment.level).toBe('warning');
    expect(notice).toContain('Safety Guard');
    expect(notice).toContain('当前在保护分支');
  });
});
