/**
 * Gate Condition Evaluator 单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  evaluateGate,
  getConditions,
  getGateHistory,
} from '../../src/core/gate-engine/gate-evaluator.js';
import { Stage } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-gate-evaluator');
const FEAT = 'FSREQ-20260211-AUTH-001';

function writeState(stage: string, mergedRules: Record<string, unknown> = {}) {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'stage-state.json'),
    JSON.stringify({
      featureId: FEAT,
      mode: 'N',
      size: 'M',
      platforms: ['h5'],
      currentStage: stage,
      history: [],
      terminal: false,
      createdAt: '2026-02-11T00:00:00Z',
      updatedAt: '2026-02-11T00:00:00Z',
      mergedRules,
    })
  );
}

function writeDocumentLinks(content?: string) {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'document-links.yaml'),
    content ??
      [
        'version: 1',
        `featureId: ${FEAT}`,
        'documents:',
        '  - path: spec.md',
        '    kind: requirements',
        '    stage: 01_specify',
        '    references: []',
        '  - path: design.md',
        '    kind: design',
        '    stage: 02_design',
        '    references:',
        '      - spec.md',
        '  - path: task_plan.md',
        '    kind: plan',
        '    stage: 03_plan',
        '    references:',
        '      - spec.md',
        '      - design.md',
        '',
      ].join('\n'),
    'utf-8'
  );
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT, 'reports'), { recursive: true });
  writeDocumentLinks();
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('getConditions', () => {
  it('should return conditions for all main stages', () => {
    for (const stage of [
      Stage.INIT,
      Stage.SPECIFY,
      Stage.DESIGN,
      Stage.PLAN,
      Stage.IMPLEMENT,
      Stage.VERIFY,
      Stage.WRAP_UP,
      Stage.RELEASE,
    ]) {
      expect(getConditions(stage).length).toBeGreaterThan(0);
    }
  });

  it('should upgrade warning conditions to blocking in strict profile', () => {
    const conditions = getConditions(Stage.SPECIFY, undefined, 'strict');
    const warning = conditions.find((condition) => condition.id === 'G-SPEC-00');
    expect(warning?.blocking).toBe(true);
  });
});

describe('evaluateGate', () => {
  it('should PASS for 00_init when directory and state exist', () => {
    writeState('00_init');
    const result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');
    expect(result.stage).toBe('00_init');
  });

  it('should FAIL for 01_specify when spec.md missing', () => {
    writeState('01_specify');
    const result = evaluateGate(FEAT, TMP);
    expect(result.conditions.find((condition) => condition.id === 'G-SPEC-01')?.status).toBe('FAIL');
    expect(result.status).toBe('FAIL');
  });

  it('should PASS for 01_specify when spec.md exists and links declare spec.md', () => {
    writeState('01_specify');
    writeFileSync(join(TMP, 'specs', FEAT, 'prd.md'), '# PRD\n## 1. 业务目标\nTest', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec\n', 'utf-8');
    mkdirSync(join(TMP, 'specs', FEAT, 'checklists'), { recursive: true });
    writeFileSync(
      join(TMP, 'specs', FEAT, 'checklists', 'spec-review.md'),
      '- [x] 完整性\n- [x] 清晰度\n- [x] 可测量\n- [x] 一致性\n- [x] 风险\n',
      'utf-8'
    );
    const result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');
  });

  it('should FAIL for 02_design when design.md does not reference spec.md', () => {
    writeState('02_design');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# Design\n', 'utf-8');
    writeDocumentLinks([
      'version: 1',
      `featureId: ${FEAT}`,
      'documents:',
      '  - path: spec.md',
      '    kind: requirements',
      '    stage: 01_specify',
      '    references: []',
      '  - path: design.md',
      '    kind: design',
      '    stage: 02_design',
      '    references: []',
      '',
    ].join('\n'));

    const result = evaluateGate(FEAT, TMP);
    expect(result.conditions.find((condition) => condition.id === 'G-DESIGN-02')?.status).toBe('FAIL');
    expect(result.status).toBe('FAIL');
  });

  it('should PASS for 03_plan when task plan exists and links are complete', () => {
    writeState('03_plan');
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), '# Task Plan\n', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'reports', 'analysis-report.md'), '# Analysis\nCRITICAL: 0\n', 'utf-8');
    const result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');
  });

  it('should persist gate history', () => {
    writeState('00_init');
    evaluateGate(FEAT, TMP);
    expect(getGateHistory(FEAT, TMP).length).toBeGreaterThan(0);
  });

  it('should execute layer2 command conditions', () => {
    writeState('00_init', {
      gateConditions: {
        '00_init': [
          {
            id: 'L2-PROFILE-001',
            description: 'Profile test',
            command: 'node -e "process.exit(0)"',
          },
        ],
      },
    });

    const result = evaluateGate(FEAT, TMP);
    expect(result.conditions.find((condition) => condition.id === 'L2-PROFILE-001')?.status).toBe(
      'PASS'
    );
  });
});
