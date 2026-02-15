/**
 * Gate Condition Evaluator 单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateGate, getConditions, getGateHistory } from '../../src/core/gate-engine/gate-evaluator.js';
import { Stage } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-gate-evaluator');
const FEAT = 'FSREQ-20260211-AUTH-001';

function withCwd(dir: string, fn: () => unknown): unknown {
  const orig = process.cwd;
  process.cwd = () => dir;
  try { return fn(); } finally { process.cwd = orig; }
}

function writeState(stage: string, mode = 'N', size = 'M') {
  writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
    featureId: FEAT, mode, size, platforms: ['h5'],
    currentStage: stage, history: [], terminal: false,
    createdAt: '2026-02-11T00:00:00Z',
  }));
}

function writeMatrix(rows: string) {
  writeFileSync(join(TMP, 'specs', FEAT, 'traceability-matrix.md'),
    '| ID | Type | Title | Status | Upstream | Downstream |\n' +
    '|----|------|-------|--------|----------|------------|\n' + rows,
  );
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT, 'reports'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('getConditions', () => {
  it('should return conditions for 00_init', () => {
    const conds = getConditions(Stage.INIT);
    expect(conds.length).toBeGreaterThanOrEqual(2);
    expect(conds[0].id).toBe('G-INIT-01');
  });

  it('should return empty for unknown stage', () => {
    expect(getConditions('99_unknown' as Stage)).toEqual([]);
  });

  it('should have conditions for all main stages', () => {
    for (const s of [Stage.INIT, Stage.SPECIFY, Stage.DESIGN, Stage.PLAN, Stage.IMPLEMENT, Stage.VERIFY, Stage.WRAP_UP, Stage.RELEASE]) {
      expect(getConditions(s).length).toBeGreaterThan(0);
    }
  });
});

describe('evaluateGate', () => {
  it('should PASS for 00_init when directory and state exist', () => {
    writeState('00_init');
    const result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');
    expect(result.stage).toBe('00_init');
    expect(result.conditions.every(c => c.status === 'PASS')).toBe(true);
  });

  it('should FAIL for 01_specify when spec.md missing', () => {
    writeState('01_specify');
    const result = evaluateGate(FEAT, TMP);
    const specCond = result.conditions.find(c => c.id === 'G-SPEC-01');
    expect(specCond?.status).toBe('FAIL');
    expect(result.status).toBe('FAIL');
  });

  it('should PASS for 01_specify when spec.md exists and matrix has FR', () => {
    writeState('01_specify');
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec');
    writeMatrix('| FR-AUTH-001 | FR | Login | Planned |  |  |\n');
    const result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');
  });

  it('should FAIL for 02_design when design.md missing', () => {
    writeState('02_design');
    writeMatrix('| FR-AUTH-001 | FR | Login | Planned |  |  |\n');
    const result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('FAIL');
    expect(result.suggestions).toBeDefined();
  });

  it('should write gate-history.jsonl on evaluation', () => {
    writeState('00_init');
    evaluateGate(FEAT, TMP);
    const history = getGateHistory(FEAT, TMP);
    expect(history).toHaveLength(1);
    expect(history[0].stage).toBe('00_init');
  });

  it('should accumulate history entries', () => {
    writeState('00_init');
    evaluateGate(FEAT, TMP);
    evaluateGate(FEAT, TMP);
    const history = getGateHistory(FEAT, TMP);
    expect(history).toHaveLength(2);
  });

  it('should FAIL for 06_wrap_up when matrix has non-terminal entries', () => {
    writeState('06_wrap_up');
    writeMatrix('| FR-AUTH-001 | FR | Login | Planned |  |  |\n');
    const result = evaluateGate(FEAT, TMP);
    const wrapCond = result.conditions.find(c => c.id === 'G-WRAP-02');
    expect(wrapCond?.status).toBe('FAIL');
  });

  it('should PASS for 06_wrap_up when all matrix entries are terminal', () => {
    writeState('06_wrap_up');
    writeMatrix('| FR-AUTH-001 | FR | Login | Accepted |  |  |\n| DS-AUTH-001 | DS | Design | Cancelled |  |  |\n');
    const result = evaluateGate(FEAT, TMP);
    const wrapCond = result.conditions.find(c => c.id === 'G-WRAP-02');
    expect(wrapCond?.status).toBe('PASS');
  });
});

describe('getGateHistory', () => {
  it('should return empty array when no history file', () => {
    expect(getGateHistory(FEAT, TMP)).toEqual([]);
  });
});
