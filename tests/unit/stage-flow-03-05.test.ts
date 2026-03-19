import { describe, it, expect } from 'vitest';
import { Stage } from '../../src/shared/types.js';
import { decideNextStep } from '../../src/core/process-engine/next-step-decider.js';

describe('Stage Flow: 03_plan → 05_verify', () => {
  describe('03_plan stage', () => {
    it('should return AUTO_ADVANCE when ready + all_done + auto_advance policy', () => {
      const result = decideNextStep({
        currentStage: Stage.PLAN,
        stageStatus: 'ready_to_advance',
        autoAdvancePolicy: 'auto_advance',
        gateStatus: 'PASS',
        dependencyCheck: { pass: true, missing: [] },
        autoLoopStatus: 'all_done',
        todoState: { halted: true, haltReason: 'completed', items: [{ id: 'T1', status: 'done' }] },
      });

      expect(result.decision).toBe('AUTO_ADVANCE');
      expect(result.nextStage).toBe(Stage.IMPLEMENT);
      expect(result.reasonCodes).toEqual([]);
    });

    it('should return BLOCKED when autoLoopStatus is has_blocked', () => {
      const result = decideNextStep({
        currentStage: Stage.PLAN,
        stageStatus: 'ready_to_advance',
        autoLoopStatus: 'has_blocked',
        todoState: { halted: true, haltReason: 'blocked:T1', items: [{ id: 'T1', status: 'blocked' }] },
      });

      expect(result.decision).toBe('BLOCKED');
      expect(result.reasonCodes).toEqual(['AUTO_LOOP_HAS_BLOCKED']);
      expect(result.reasons[0]).toContain('auto-loop 未完成: has_blocked');
    });

    it('should return SUGGEST_NEXT when todos are pending', () => {
      const result = decideNextStep({
        currentStage: Stage.PLAN,
        stageStatus: 'ready_to_advance',
        gateStatus: 'PASS',
        dependencyCheck: { pass: true, missing: [] },
        todoState: { halted: false, items: [{ id: 'T1', status: 'pending' }] },
      });

      expect(result.decision).toBe('SUGGEST_NEXT');
      expect(result.suggestedCommand).toBe('/spec-first:code');
      expect(result.reasonCodes).toEqual(['TODO_PENDING']);
    });
  });

  describe('04_implement stage', () => {
    it('should return SUGGEST_NEXT when todos are not all done', () => {
      const result = decideNextStep({
        currentStage: Stage.IMPLEMENT,
        stageStatus: 'ready_to_advance',
        todoState: { halted: false, items: [{ id: 'T2', status: 'in_progress' }] },
      });

      expect(result.decision).toBe('SUGGEST_NEXT');
      expect(result.suggestedCommand).toBe('/spec-first:code');
      expect(result.reasonCodes).toEqual(['TODO_PENDING']);
    });

    it('should return AUTO_ADVANCE when all done + auto_advance policy', () => {
      const result = decideNextStep({
        currentStage: Stage.IMPLEMENT,
        stageStatus: 'ready_to_advance',
        autoAdvancePolicy: 'auto_advance',
        gateStatus: 'PASS',
        dependencyCheck: { pass: true, missing: [] },
        autoLoopStatus: 'all_done',
        todoState: { halted: true, haltReason: 'completed', items: [{ id: 'T2', status: 'done' }] },
      });

      expect(result.decision).toBe('AUTO_ADVANCE');
      expect(result.nextStage).toBe(Stage.VERIFY);
    });

    it('should return BLOCKED when gate fails', () => {
      const result = decideNextStep({
        currentStage: Stage.IMPLEMENT,
        stageStatus: 'ready_to_advance',
        gateStatus: 'FAIL',
        dependencyCheck: { pass: true, missing: [] },
        autoLoopStatus: 'all_done',
        todoState: { halted: true, haltReason: 'completed', items: [{ id: 'T2', status: 'done' }] },
      });

      expect(result.decision).toBe('BLOCKED');
      expect(result.reasonCodes).toContain('GATE_FAILED');
    });
  });

  describe('05_verify stage', () => {
    it('should return READY_TO_ADVANCE when ready', () => {
      const result = decideNextStep({
        currentStage: Stage.VERIFY,
        stageStatus: 'ready_to_advance',
        gateStatus: 'PASS',
        dependencyCheck: { pass: true, missing: [] },
      });

      expect(result.decision).toBe('READY_TO_ADVANCE');
      expect(result.nextStage).toBe(Stage.WRAP_UP);
    });
  });

  describe('Cross-stage blocking scenarios', () => {
    it('should block on timeout autoLoopStatus', () => {
      const result = decideNextStep({
        currentStage: Stage.IMPLEMENT,
        stageStatus: 'ready_to_advance',
        autoLoopStatus: 'timeout',
      });

      expect(result.decision).toBe('BLOCKED');
      expect(result.reasonCodes).toEqual(['AUTO_LOOP_TIMEOUT']);
    });

    it('should block on max_iterations autoLoopStatus', () => {
      const result = decideNextStep({
        currentStage: Stage.PLAN,
        stageStatus: 'ready_to_advance',
        autoLoopStatus: 'max_iterations',
      });

      expect(result.decision).toBe('BLOCKED');
      expect(result.reasonCodes).toEqual(['AUTO_LOOP_MAX_ITERATIONS']);
    });

    it('should block when dependency check fails', () => {
      const result = decideNextStep({
        currentStage: Stage.PLAN,
        stageStatus: 'ready_to_advance',
        gateStatus: 'PASS',
        dependencyCheck: { pass: false, missing: ['file: task_plan.md'] },
        autoLoopStatus: 'all_done',
      });

      expect(result.decision).toBe('BLOCKED');
      expect(result.reasonCodes).toContain('DEPENDENCY_FAILED');
    });
  });
});
