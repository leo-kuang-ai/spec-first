import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  evaluateSkillHardGate,
  buildHardGateRuntimeNotice,
  assessHighRiskChanges,
} from '../../src/core/skill-runtime/hard-gate.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-hard-gate');
const FEAT = 'FSREQ-20260211-AUTH-001';

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('evaluateSkillHardGate (deprecated shim)', () => {
  it('no longer blocks stage mismatch for spec skill', () => {
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '02_design' }),
      'utf-8'
    );

    const result = evaluateSkillHardGate('spec', TMP);
    expect(result.allowed).toBe(true);
    expect(result.severity).toBe('PASS');
  });

  it('returns warning instead of blocking when feature context is missing', () => {
    const result = evaluateSkillHardGate('code', TMP);
    expect(result.allowed).toBe(true);
    expect(['PASS', 'WARN']).toContain(result.severity);
  });

  it('keeps high-risk assessment available for orchestrate and code notices', () => {
    const result = assessHighRiskChanges(TMP, FEAT);
    expect(result.isHighRisk).toBe(false);
    expect(result.reasons).toEqual([]);
  });
});

describe('buildHardGateRuntimeNotice (deprecated shim)', () => {
  it('returns undefined when there is no safety signal to surface', () => {
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| title | status |\n|---|---|\n| Login | in_progress |\n',
      'utf-8'
    );

    const notice = buildHardGateRuntimeNotice('code', TMP);
    expect(notice).toBeUndefined();
  });
});
