/**
 * 端到端流程健壮性测试执行
 *
 * @module tests/e2e/flow-robustness/flow-robustness.test.ts
 * @trace FR-SKILLREFINE-003, DS-SKILLREFINE-003, TASK-SKILLREFINE-006
 */

import { describe, it, expect } from 'vitest';
import {
  FULL_CYCLE_SCENARIOS,
  RECOVERY_SCENARIOS,
  GATE_BLOCKING_SCENARIOS,
  type FlowSimulation,
  type RecoveryTest,
  type GateBlockingTest,
  createMockContextPack,
} from './scenarios.js';

// ─── 模拟验证器 ───────────────────────────────────────────────

/**
 * 验证完整闭环流程
 */
function validateFullCycleFlow(scenario: FlowSimulation): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  // 验证阶段序列完整性（只验证起始和结束阶段）
  if (scenario.stages[0] !== '00_init') {
    errors.push('Flow must start with 00_init');
  }
  if (!scenario.stages[scenario.stages.length - 1].includes('wrap_up') && !scenario.stages[scenario.stages.length - 1].includes('done')) {
    errors.push('Flow should end with wrap_up or done stage');
  }

  // 验证检查点完整性
  if (scenario.checkpoints.length !== scenario.stages.length) {
    errors.push(`Checkpoint count (${scenario.checkpoints.length}) doesn't match stage count (${scenario.stages.length})`);
  }

  // 验证预期结果
  if (!scenario.expectedOutcome.finalStage) {
    errors.push('Missing expectedOutcome.finalStage');
  }

  // 验证检查点时间戳顺序
  const timestamps = scenario.checkpoints.map(c => new Date(c.timestamp).getTime());
  for (let i = 1; i < timestamps.length; i++) {
    if (timestamps[i] <= timestamps[i - 1]) {
      errors.push(`Checkpoint timestamps not in ascending order at index ${i}`);
    }
  }

  // 验证历史记录完整性
  for (let i = 1; i < scenario.checkpoints.length; i++) {
    const history = scenario.checkpoints[i].contextPack.stageState.history;
    if (history.length !== i) {
      errors.push(`History length mismatch at checkpoint ${i}: expected ${i}, got ${history.length}`);
    }
  }

  return { passed: errors.length === 0, errors };
}

/**
 * 验证中断恢复测试
 */
function validateRecoveryTest(test: RecoveryTest): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  // 验证必要字段
  if (!test.name) errors.push('Missing name');
  if (!test.interruptPoint) errors.push('Missing interruptPoint');
  if (!test.recoveryCommand) errors.push('Missing recoveryCommand');
  if (!test.savedContext) errors.push('Missing savedContext');

  // 验证上下文完整性
  if (test.savedContext) {
    if (!test.savedContext.featureId) errors.push('Missing savedContext.featureId');
    if (!test.savedContext.stageState) errors.push('Missing savedContext.stageState');
  }

  // 验证检查点
  if (!test.verifyCheckpoints || test.verifyCheckpoints.length === 0) {
    errors.push('Missing verifyCheckpoints');
  } else {
    for (const checkpoint of test.verifyCheckpoints) {
      if (!checkpoint.field) errors.push('Missing checkpoint.field');
      if (checkpoint.expectedValue === undefined) errors.push('Missing checkpoint.expectedValue');
    }
  }

  return { passed: errors.length === 0, errors };
}

/**
 * 验证 Gate 阻断测试
 */
function validateGateBlockingTest(test: GateBlockingTest): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  // 验证必要字段
  if (!test.name) errors.push('Missing name');
  if (!test.stage) errors.push('Missing stage');
  if (!test.violatedConditions || test.violatedConditions.length === 0) {
    errors.push('Missing violatedConditions');
  }

  // 验证预期 Gate 结果
  if (!test.expectedGateResult) {
    errors.push('Missing expectedGateResult');
  } else {
    if (test.expectedGateResult.status !== 'FAIL') {
      errors.push('expectedGateResult.status must be FAIL');
    }
    if (!test.expectedGateResult.failedConditions) {
      errors.push('Missing expectedGateResult.failedConditions');
    }
  }

  // 验证预期状态
  if (!test.expectedState) {
    errors.push('Missing expectedState');
  } else {
    if (typeof test.expectedState.shouldStayInStage !== 'boolean') {
      errors.push('Missing expectedState.shouldStayInStage');
    }
  }

  return { passed: errors.length === 0, errors };
}

// ─── 测试套件 ─────────────────────────────────────────────────

describe('Flow Robustness Tests', () => {
  describe('Full Cycle Scenarios', () => {
    it('should have 2 full cycle scenarios defined', () => {
      expect(FULL_CYCLE_SCENARIOS.length).toBe(2);
    });

    it('should validate standard-feature-lifecycle scenario', () => {
      const scenario = FULL_CYCLE_SCENARIOS.find(s => s.name === 'standard-feature-lifecycle');
      expect(scenario).toBeDefined();

      if (scenario) {
        const result = validateFullCycleFlow(scenario);
        expect(result.passed).toBe(true);
        expect(result.errors).toEqual([]);
      }
    });

    it('should validate small-feature-fast-track scenario', () => {
      const scenario = FULL_CYCLE_SCENARIOS.find(s => s.name === 'small-feature-fast-track');
      expect(scenario).toBeDefined();

      if (scenario) {
        const result = validateFullCycleFlow(scenario);
        expect(result.passed).toBe(true);
        expect(result.errors).toEqual([]);
      }
    });

    it('should have correct stage sequences for each scenario', () => {
      for (const scenario of FULL_CYCLE_SCENARIOS) {
        expect(scenario.stages.length).toBeGreaterThan(0);
        expect(scenario.stages[0]).toBe('00_init');
      }
    });

    it('should have complete checkpoints for each stage', () => {
      for (const scenario of FULL_CYCLE_SCENARIOS) {
        expect(scenario.checkpoints.length).toBe(scenario.stages.length);
      }
    });
  });

  describe('Recovery Scenarios', () => {
    it('should have 5 recovery scenarios defined', () => {
      expect(RECOVERY_SCENARIOS.length).toBe(5);
    });

    it('should validate all recovery tests', () => {
      const failedTests: string[] = [];
      for (const test of RECOVERY_SCENARIOS) {
        const result = validateRecoveryTest(test);
        if (!result.passed) {
          failedTests.push(`${test.name}: ${result.errors.join(', ')}`);
        }
      }
      expect(failedTests).toEqual([]);
    });

    it('should have recovery command set to catchup', () => {
      for (const test of RECOVERY_SCENARIOS) {
        expect(test.recoveryCommand).toContain('catchup');
      }
    });

    it('should have valid interrupt points', () => {
      const validStages = ['01_specify', '02_design', '03_plan', '04_implement', '05_verify', '06_wrap_up'];
      for (const test of RECOVERY_SCENARIOS) {
        expect(validStages).toContain(test.interruptPoint);
      }
    });

    it('should have complete verifyCheckpoints for each test', () => {
      for (const test of RECOVERY_SCENARIOS) {
        expect(test.verifyCheckpoints.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should recover-with-waiver-context preserve waiver information', () => {
      const test = RECOVERY_SCENARIOS.find(t => t.name === 'recover-with-waiver-context');
      expect(test).toBeDefined();
      expect(test?.savedContext.gateResult?.status).toBe('PASS_WITH_WAIVER');
      expect(test?.savedContext.metadata?.activeWaivers).toBeDefined();
    });
  });

  describe('Gate Blocking Scenarios', () => {
    it('should have 8 gate blocking scenarios defined', () => {
      expect(GATE_BLOCKING_SCENARIOS.length).toBe(8);
    });

    it('should validate all gate blocking tests', () => {
      const failedTests: string[] = [];
      for (const test of GATE_BLOCKING_SCENARIOS) {
        const result = validateGateBlockingTest(test);
        if (!result.passed) {
          failedTests.push(`${test.name}: ${result.errors.join(', ')}`);
        }
      }
      expect(failedTests).toEqual([]);
    });

    it('should all have FAIL status for expectedGateResult', () => {
      for (const test of GATE_BLOCKING_SCENARIOS) {
        expect(test.expectedGateResult.status).toBe('FAIL');
      }
    });

    it('should all have shouldStayInStage set to true', () => {
      for (const test of GATE_BLOCKING_SCENARIOS) {
        expect(test.expectedState.shouldStayInStage).toBe(true);
      }
    });

    it('should all have shouldHaveSuggestions set to true', () => {
      for (const test of GATE_BLOCKING_SCENARIOS) {
        expect(test.expectedState.shouldHaveSuggestions).toBe(true);
      }
    });

    it('should have meaningful violated conditions', () => {
      for (const test of GATE_BLOCKING_SCENARIOS) {
        expect(test.violatedConditions.length).toBeGreaterThanOrEqual(1);
        for (const condition of test.violatedConditions) {
          expect(condition.length).toBeGreaterThan(0);
        }
      }
    });

    it('should cover all critical stages', () => {
      const coveredStages = new Set(GATE_BLOCKING_SCENARIOS.map(t => t.stage));
      expect(coveredStages.has('01_specify')).toBe(true);
      expect(coveredStages.has('02_design')).toBe(true);
      expect(coveredStages.has('03_plan')).toBe(true);
      expect(coveredStages.has('04_implement')).toBe(true);
      expect(coveredStages.has('05_verify')).toBe(true);
    });
  });

  describe('Context Pack Utilities', () => {
    it('should create mock context pack with defaults', () => {
      const pack = createMockContextPack('TEST-001', '01_specify');
      expect(pack.featureId).toBe('TEST-001');
      expect(pack.stageState.currentStage).toBe('01_specify');
      expect(pack.stageState.stageStatus).toBe('drafting');
    });

    it('should allow overriding context pack fields', () => {
      const pack = createMockContextPack('TEST-001', '01_specify', {
        stageState: {
          currentStage: '02_design',
          stageStatus: 'ready_to_advance',
          history: [],
        },
      });
      expect(pack.stageState.currentStage).toBe('02_design');
      expect(pack.stageState.stageStatus).toBe('ready_to_advance');
    });
  });

  describe('Statistics Summary', () => {
    it('should report correct test counts', () => {
      const totalScenarios = FULL_CYCLE_SCENARIOS.length + RECOVERY_SCENARIOS.length + GATE_BLOCKING_SCENARIOS.length;
      expect(totalScenarios).toBe(15); // 2 + 5 + 8
    });

    it('should have complete coverage of workflow stages', () => {
      const allStages = new Set([
        ...FULL_CYCLE_SCENARIOS.flatMap(s => s.stages),
        ...RECOVERY_SCENARIOS.map(t => t.interruptPoint),
        ...GATE_BLOCKING_SCENARIOS.map(t => t.stage),
      ]);

      // Verify all active stages are covered
      expect(allStages.has('01_specify')).toBe(true);
      expect(allStages.has('02_design')).toBe(true);
      expect(allStages.has('03_plan')).toBe(true);
      expect(allStages.has('04_implement')).toBe(true);
      expect(allStages.has('05_verify')).toBe(true);
    });
  });
});
