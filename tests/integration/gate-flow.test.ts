/**
 * Gate 推进链集成测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateGate } from '../../src/core/gate-engine/gate-evaluator.js';
import { Stage } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-gate-flow');
const FEAT = 'FSREQ-20260312-FLOW-001';

function writeState(stage: string, mergedRules = {}) {
  writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
    featureId: FEAT,
    mode: 'N',
    size: 'M',
    platforms: ['h5'],
    currentStage: stage,
    history: [],
    terminal: false,
    createdAt: '2026-03-12T00:00:00Z',
    updatedAt: '2026-03-12T00:00:00Z',
    mergedRules,
  }));
}

function writeMatrix(rows: string) {
  writeFileSync(join(TMP, 'specs', FEAT, 'traceability-matrix.md'),
    '| ID | Type | Title | Status | Upstream | Downstream |\n' +
    '|----|------|-------|--------|----------|------------|\n' + rows,
  );
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('gate flow integration', () => {
  it('should pass through init -> specify -> design with warnings', () => {
    // 00_init
    writeState('00_init');
    let result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');

    // 01_specify with warning
    writeState('01_specify');
    writeFileSync(join(TMP, 'specs', FEAT, 'prd.md'), '# PRD\n## 1. 业务目标\nTest');
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec');
    writeMatrix('| FR-FLOW-001 | FR | Feature | Planned |  |  |\n');
    mkdirSync(join(TMP, 'specs', FEAT, 'checklists'), { recursive: true });
    writeFileSync(join(TMP, 'specs', FEAT, 'checklists', 'spec-review.md'), '- [x] Item1\n- [ ] Item2\n');

    result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');
    const warnings = result.conditions.filter(c => c.blocking === false && c.status === 'FAIL');
    expect(warnings.length).toBeGreaterThan(0);

    // 02_design
    writeState('02_design');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# Design');
    writeMatrix('| FR-FLOW-001 | FR | Feature | Planned |  |  |\n| DS-FLOW-001 | DS | Design | Planned | FR-FLOW-001 |  |\n');

    result = evaluateGate(FEAT, TMP);
    expect(result.status).toBe('PASS');
  });

  it('should apply profile-specific Layer2 rules', () => {
    writeState('00_init', {
      gateConditions: {
        '00_init': [{
          id: 'L2-PROFILE-001',
          description: 'Profile test',
          command: 'node -e "process.exit(0)"',
        }],
      },
    });

    const result = evaluateGate(FEAT, TMP);
    const l2Cond = result.conditions.find(c => c.id === 'L2-PROFILE-001');
    expect(l2Cond?.status).toBe('PASS');
  });
});
