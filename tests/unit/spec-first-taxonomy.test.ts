import { describe, it, expect } from 'vitest';
import { Stage } from '../../src/shared/types.js';
import {
  GATE_OUTPUT_NAMES,
  GATE_STATUS_VALUES,
} from '../../src/core/gate-engine/gate-taxonomy.js';
import { getConditions } from '../../src/core/gate-engine/gate-evaluator.js';

describe('spec-first taxonomy baseline', () => {
  it('keeps canonical gate labels and status values stable', () => {
    expect([...GATE_OUTPUT_NAMES]).toEqual([
      'precondition',
      'stage-gate',
      'hard-gate',
      'release-gate',
      'confirm-policy',
    ]);
    expect([...GATE_STATUS_VALUES]).toEqual(['PASS', 'PASS_WITH_WAIVER', 'FAIL']);
  });

  it('keeps the current gate registry surface stable', () => {
    const registrySnapshot = [
      [Stage.INIT, getConditions(Stage.INIT).map((condition) => condition.id)],
      [Stage.SPECIFY, getConditions(Stage.SPECIFY).map((condition) => condition.id)],
      [Stage.DESIGN, getConditions(Stage.DESIGN).map((condition) => condition.id)],
      [Stage.PLAN, getConditions(Stage.PLAN).map((condition) => condition.id)],
      [Stage.IMPLEMENT, getConditions(Stage.IMPLEMENT).map((condition) => condition.id)],
      [Stage.VERIFY, getConditions(Stage.VERIFY).map((condition) => condition.id)],
      [Stage.WRAP_UP, getConditions(Stage.WRAP_UP).map((condition) => condition.id)],
      [Stage.RELEASE, getConditions(Stage.RELEASE).map((condition) => condition.id)],
    ] as const;

    expect(registrySnapshot).toEqual([
      [Stage.INIT, ['G-INIT-01', 'G-INIT-02', 'G-INIT-03']],
      [Stage.SPECIFY, ['G-SPEC-00', 'G-SPEC-01', 'G-SPEC-02', 'G-SPEC-03']],
      [Stage.DESIGN, ['G-DESIGN-01', 'G-DESIGN-02', 'G-DESIGN-03']],
      [Stage.PLAN, ['G-PLAN-01', 'G-PLAN-02', 'G-PLAN-03']],
      [Stage.IMPLEMENT, ['G-IMPL-01']],
      [Stage.VERIFY, ['G-VERIFY-01', 'G-VERIFY-03']],
      [Stage.WRAP_UP, ['G-WRAP-01', 'G-WRAP-02']],
      [Stage.RELEASE, ['G-REL-01', 'G-REL-02']],
    ]);
  });
});
