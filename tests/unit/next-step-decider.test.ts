import { describe, it, expect } from 'vitest';
import { Stage } from '../../src/shared/types.js';
import { decideNextStep } from '../../src/core/process-engine/next-step-decider.js';

describe('decideNextStep', () => {
  it('should suggest the next skill during specify drafting', () => {
    const result = decideNextStep({
      featureId: 'FSREQ-20260309-AUTO-001',
      currentStage: Stage.SPECIFY,
      stageStatus: 'drafting',
      autoAdvancePolicy: 'suggest',
      gateStatus: 'FAIL',
      dependencyCheck: { pass: false, missing: ['file: specs/FSREQ-20260309-AUTO-001/spec.md'] },
    });

    expect(result.decision).toBe('SUGGEST_NEXT');
    expect(result.nextStage).toBe(Stage.DESIGN);
    expect(result.suggestedCommand).toBe('/spec-first:spec-review');
  });

  it('should return ready to advance for design when gate and dependencies pass', () => {
    const result = decideNextStep({
      featureId: 'FSREQ-20260309-AUTO-001',
      currentStage: Stage.DESIGN,
      stageStatus: 'ready_to_advance',
      autoAdvancePolicy: 'assisted',
      gateStatus: 'PASS',
      dependencyCheck: { pass: true, missing: [] },
    });

    expect(result.decision).toBe('READY_TO_ADVANCE');
    expect(result.nextStage).toBe(Stage.PLAN);
    expect(result.suggestedCommand).toBe('spec-first stage advance FSREQ-20260309-AUTO-001');
    expect(result.reasons).toEqual([]);
  });

  it('should return auto advance candidate for plan when todos are done', () => {
    const result = decideNextStep({
      featureId: 'FSREQ-20260309-AUTO-001',
      currentStage: Stage.PLAN,
      stageStatus: 'ready_to_advance',
      autoAdvancePolicy: 'auto_advance',
      gateStatus: 'PASS',
      dependencyCheck: { pass: true, missing: [] },
      todoState: {
        halted: true,
        haltReason: 'completed',
        items: [
          { id: 'TASK-AUTO-001', title: '拆解任务', status: 'done' },
        ],
      },
    });

    expect(result.decision).toBe('AUTO_ADVANCE');
    expect(result.nextStage).toBe(Stage.IMPLEMENT);
    expect(result.suggestedCommand).toBe('spec-first stage advance FSREQ-20260309-AUTO-001');
  });

  it('should return auto run next skill candidate for implement when policy is auto_run', () => {
    const result = decideNextStep({
      featureId: 'FSREQ-20260309-AUTO-001',
      currentStage: Stage.IMPLEMENT,
      stageStatus: 'ready_to_advance',
      autoAdvancePolicy: 'auto_run',
      gateStatus: 'PASS',
      dependencyCheck: { pass: true, missing: [] },
      todoState: {
        halted: true,
        haltReason: 'completed',
        items: [
          { id: 'TASK-AUTO-002', title: '实现代码', status: 'done' },
        ],
      },
    });

    expect(result.decision).toBe('AUTO_RUN_NEXT_SKILL');
    expect(result.nextStage).toBe(Stage.VERIFY);
    expect(result.suggestedCommand).toBe('/spec-first:verify');
  });

  it('should block when dependencies are missing for design handoff', () => {
    const result = decideNextStep({
      featureId: 'FSREQ-20260309-AUTO-001',
      currentStage: Stage.DESIGN,
      stageStatus: 'ready_to_advance',
      autoAdvancePolicy: 'assisted',
      gateStatus: 'PASS',
      dependencyCheck: { pass: false, missing: ['file: specs/FSREQ-20260309-AUTO-001/task_plan.md'] },
    });

    expect(result.decision).toBe('BLOCKED');
    expect(result.reasons).toContain('缺少 file: specs/FSREQ-20260309-AUTO-001/task_plan.md');
  });

  it('should block when todo state contains blocked items', () => {
    const result = decideNextStep({
      featureId: 'FSREQ-20260309-AUTO-001',
      currentStage: Stage.IMPLEMENT,
      stageStatus: 'ready_to_advance',
      autoAdvancePolicy: 'auto_run',
      gateStatus: 'PASS',
      dependencyCheck: { pass: true, missing: [] },
      todoState: {
        halted: true,
        haltReason: 'blocked:TASK-AUTO-003',
        items: [
          { id: 'TASK-AUTO-003', title: '补测试', status: 'blocked' },
        ],
      },
    });

    expect(result.decision).toBe('BLOCKED');
    expect(result.reasons).toContain('存在 blocked todo，需先清除阻塞后再推进阶段');
  });
});
