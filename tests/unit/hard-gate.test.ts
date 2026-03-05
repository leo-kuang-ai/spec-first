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

  it('should BLOCK code when TDD RED evidence is missing', () => {
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '04_implement' }),
      'utf-8',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| Task ID | 标题 | 状态 |\n|---|---|---|\n| TASK-AUTH-001 | Login | in_progress |\n',
      'utf-8',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'findings.md'), '# Findings\n', 'utf-8');

    const result = evaluateSkillHardGate('code', TMP);
    expect(result.allowed).toBe(false);
    expect(result.severity).toBe('BLOCKED');
    expect(result.reason).toContain('TDD RED');
  });

  it('should PASS code when TDD RED evidence exists for in_progress task', () => {
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '04_implement' }),
      'utf-8',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| Task ID | 标题 | 状态 |\n|---|---|---|\n| TASK-AUTH-001 | Login | in_progress |\n',
      'utf-8',
    );
    writeFileSync(
      join(TMP, 'specs', FEAT, 'findings.md'),
      [
        '# Findings',
        '',
        '## TDD Evidence',
        '- TASK: TASK-AUTH-001',
        '- TDD-RED',
        '- command: pnpm test -- tests/auth/login.test.ts',
        '- exit code: 1',
        '- reason: function not implemented',
        '',
      ].join('\n'),
      'utf-8',
    );

    const result = evaluateSkillHardGate('code', TMP);
    expect(result.allowed).toBe(true);
    expect(result.severity).toBe('PASS');
  });

  it('should PASS code when structured TDD waiver exists', () => {
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '04_implement' }),
      'utf-8',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| Task ID | 标题 | 状态 |\n|---|---|---|\n| TASK-AUTH-001 | Login | in_progress |\n',
      'utf-8',
    );
    writeFileSync(
      join(TMP, 'specs', FEAT, 'findings.md'),
      [
        '# Findings',
        '',
        '## [TDD-WAIVER]',
        '- TASK: TASK-AUTH-001',
        '- 场景: 纯配置变更',
        '- 理由: 不涉及业务逻辑',
        '- 批准人: product-owner',
        '- 时间: 2026-03-04T00:00:00Z',
        '',
      ].join('\n'),
      'utf-8',
    );

    const result = evaluateSkillHardGate('code', TMP);
    expect(result.allowed).toBe(true);
    expect(result.severity).toBe('PASS');
  });
});

describe('buildHardGateRuntimeNotice', () => {
  it('should include BLOCKED status in runtime notice', () => {
    const notice = buildHardGateRuntimeNotice('code', TMP);
    expect(notice).toContain('检查结果: BLOCKED');
  });
});
