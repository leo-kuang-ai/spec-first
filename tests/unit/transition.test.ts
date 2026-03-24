import { describe, expect, it } from 'vitest';
import { Stage } from '../../src/shared/types.js';
import { applyTransition } from '../../src/core/process-engine/transition.js';

describe('applyTransition', () => {
  it('moves currentStage when readiness is satisfied', () => {
    const result = applyTransition(
      {
        featureId: 'FSREQ-20260324-NODE-001',
        currentStage: Stage.SPECIFY,
        terminal: false,
        nodes: {
          [Stage.SPECIFY]: { status: 'done', checklistStatus: 'complete', canMarkDone: true },
        },
        createdAt: '2026-03-24T00:00:00.000Z',
        updatedAt: '2026-03-24T00:00:00.000Z',
      },
      Stage.DESIGN
    );

    expect(result.currentStage).toBe(Stage.DESIGN);
  });
});
