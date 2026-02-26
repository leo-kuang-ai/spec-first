import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateSkillHardGate, buildHardGateRuntimeNotice } from '../../src/core/skill-runtime/hard-gate.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-hard-gate');
const FEAT = 'FSREQ-20260211-AUTH-001';

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('evaluateSkillHardGate', () => {
  it('should BLOCK code when current feature pointer is missing', () => {
    const result = evaluateSkillHardGate('code', TMP);
    expect(result.allowed).toBe(false);
    expect(result.severity).toBe('BLOCKED');
  });

  it('should PASS orchestrate on non-implement stage when context exists', () => {
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '02_design' }),
      'utf-8',
    );

    const result = evaluateSkillHardGate('orchestrate', TMP);
    expect(result.allowed).toBe(true);
    expect(result.severity).toBe('PASS');
  });

  it('should BLOCK code when no in_progress task exists', () => {
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '04_implement' }),
      'utf-8',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| Task ID | 标题 | 状态 |\n|---|---|---|\n| TASK-AUTH-001 | Login | todo |\n',
      'utf-8',
    );

    const result = evaluateSkillHardGate('code', TMP);
    expect(result.allowed).toBe(false);
    expect(result.severity).toBe('BLOCKED');
    expect(result.reason).toContain('in_progress');
  });
});

describe('buildHardGateRuntimeNotice', () => {
  it('should include BLOCKED status in runtime notice', () => {
    const notice = buildHardGateRuntimeNotice('code', TMP);
    expect(notice).toContain('检查结果: BLOCKED');
  });
});

