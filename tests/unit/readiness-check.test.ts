import { describe, expect, it } from 'vitest';
import { Stage } from '../../src/shared/types.js';
import { checkReadiness } from '../../src/core/process-engine/readiness-check.js';

describe('checkReadiness', () => {
  it('returns READY_TO_ADVANCE when previous node is done and artifacts exist', () => {
    const result = checkReadiness({
      currentStage: Stage.SPECIFY,
      targetStage: Stage.DESIGN,
      nodes: { [Stage.SPECIFY]: { status: 'done' } },
      artifacts: ['spec.md'],
      terminal: false,
    });

    expect(result.decision).toBe('READY_TO_ADVANCE');
    expect(result.targetStage).toBe(Stage.DESIGN);
  });

  it('requires wrap_up.md for wrap-up readiness', () => {
    const result = checkReadiness({
      currentStage: Stage.WRAP_UP,
      targetStage: Stage.RELEASE,
      nodes: { [Stage.WRAP_UP]: { status: 'done' } },
      artifacts: ['spec.md', 'design.md', 'task_plan.md', 'verify.md', 'wrap_up.md'],
      terminal: false,
    });

    expect(result.decision).toBe('READY_TO_ADVANCE');
    expect(result.targetStage).toBe(Stage.RELEASE);
  });
});
