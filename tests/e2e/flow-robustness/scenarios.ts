/**
 * 端到端流程健壮性测试场景定义
 *
 * DS-SKILLREFINE-003: 全流程健壮性审查设计
 * Traces: FR-SKILLREFINE-003, DS-SKILLREFINE-003
 *
 * 本文件定义三类测试场景：
 * 1. 完整闭环测试 - 覆盖 init → specify → design → plan → implement → verify → wrap_up
 * 2. 中断恢复测试 - 验证各阶段中断后 catchup 恢复能力
 * 3. Gate 阻断测试 - 验证违反条件时流程被正确阻断
 */

import { Stage, type GateStatus } from '../../../src/shared/types.js';

// ─── 核心接口定义 ───────────────────────────────────────────

/**
 * 上下文快照
 * 记录某一时刻 Feature 的完整上下文状态
 */
export interface Checkpoint {
  /** 检查点所在阶段 */
  stage: Stage;
  /** 上下文包快照（包含 stage-state、matrix、gate result 等） */
  contextPack: ContextPack;
  /** 检查点时间戳 */
  timestamp: string;
}

/**
 * 上下文包
 * 包含 Feature 在某一阶段的所有上下文信息
 */
export interface ContextPack {
  /** Feature ID */
  featureId: string;
  /** 阶段状态 */
  stageState: {
    currentStage: Stage;
    stageStatus: string;
    history: Array<{ from: Stage; to: Stage; timestamp: string }>;
  };
  /** Gate 评估结果（如果有） */
  gateResult?: {
    status: GateStatus;
    conditions: Array<{ id: string; status: string }>;
  };
  /** 追踪矩阵状态 */
  matrix?: {
    rows: Array<{ id: string; type: string; status: string }>;
  };
  /** 其他运行时数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 流程模拟
 * 定义一个完整的流程测试场景
 */
export interface FlowSimulation {
  /** 场景名称 */
  name: string;
  /** 场景描述 */
  description: string;
  /** 场景分类 */
  category: 'full_cycle' | 'recovery' | 'gate_blocking';
  /** 阶段序列 */
  stages: Stage[];
  /** 关键检查点 */
  checkpoints: Checkpoint[];
  /** 预期结果 */
  expectedOutcome: {
    /** 最终阶段 */
    finalStage: Stage;
    /** 是否应成功完成 */
    success: boolean;
    /** 预期的 Gate 状态（如果有） */
    gateStatus?: GateStatus;
  };
}

/**
 * 中断恢复测试
 * 验证流程中断后的上下文恢复能力
 */
export interface RecoveryTest {
  /** 测试名称 */
  name: string;
  /** 中断点阶段 */
  interruptPoint: Stage;
  /** 中断时保存的上下文 */
  savedContext: ContextPack;
  /** 恢复命令（通常是 catchup） */
  recoveryCommand: string;
  /** 恢复后的预期阶段 */
  expectedStage: Stage;
  /** 恢复是否应成功 */
  success: boolean;
  /** 恢复后需验证的检查点 */
  verifyCheckpoints: Array<{
    field: string;
    expectedValue: unknown;
  }>;
}

/**
 * Gate 阻断测试
 * 验证 Gate 规则的阻断有效性
 */
export interface GateBlockingTest {
  /** 测试名称 */
  name: string;
  /** 测试阶段 */
  stage: Stage;
  /** 故意违反的 Gate 条件 */
  violatedConditions: string[];
  /** 预期的 Gate 结果 */
  expectedGateResult: {
    status: 'FAIL';
    failedConditions: string[];
  };
  /** 阻断后预期的状态 */
  expectedState: {
    /** 是否应停留在当前阶段 */
    shouldStayInStage: boolean;
    /** 是否应生成修复建议 */
    shouldHaveSuggestions: boolean;
  };
}

// ─── 类型 1: 完整闭环测试场景 ───────────────────────────────

/**
 * 完整闭环测试场景定义
 * 覆盖从 init 到 wrap_up 的完整流程
 */
export const FULL_CYCLE_SCENARIOS: FlowSimulation[] = [
  {
    name: 'standard-feature-lifecycle',
    description: '标准 Feature 生命周期：init → specify → design → plan → implement → verify → wrap_up',
    category: 'full_cycle',
    stages: [
      Stage.INIT,
      Stage.SPECIFY,
      Stage.DESIGN,
      Stage.PLAN,
      Stage.IMPLEMENT,
      Stage.VERIFY,
      Stage.WRAP_UP,
    ],
    checkpoints: [
      {
        stage: Stage.INIT,
        contextPack: {
          featureId: 'FSREQ-TEST-FULLCYCLE-001',
          stageState: {
            currentStage: Stage.INIT,
            stageStatus: 'ready_to_advance',
            history: [],
          },
        },
        timestamp: '2026-03-11T00:00:00.000Z',
      },
      {
        stage: Stage.SPECIFY,
        contextPack: {
          featureId: 'FSREQ-TEST-FULLCYCLE-001',
          stageState: {
            currentStage: Stage.SPECIFY,
            stageStatus: 'ready_to_advance',
            history: [
              { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:01:00.000Z' },
            ],
          },
          gateResult: {
            status: 'PASS',
            conditions: [
              { id: 'spec-exists', status: 'PASS' },
              { id: 'spec-has-prd', status: 'PASS' },
            ],
          },
        },
        timestamp: '2026-03-11T00:01:00.000Z',
      },
      {
        stage: Stage.DESIGN,
        contextPack: {
          featureId: 'FSREQ-TEST-FULLCYCLE-001',
          stageState: {
            currentStage: Stage.DESIGN,
            stageStatus: 'ready_to_advance',
            history: [
              { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:01:00.000Z' },
              { from: Stage.SPECIFY, to: Stage.DESIGN, timestamp: '2026-03-11T00:02:00.000Z' },
            ],
          },
          gateResult: {
            status: 'PASS',
            conditions: [
              { id: 'design-exists', status: 'PASS' },
              { id: 'design-has-ds', status: 'PASS' },
            ],
          },
        },
        timestamp: '2026-03-11T00:02:00.000Z',
      },
      {
        stage: Stage.PLAN,
        contextPack: {
          featureId: 'FSREQ-TEST-FULLCYCLE-001',
          stageState: {
            currentStage: Stage.PLAN,
            stageStatus: 'ready_to_advance',
            history: [
              { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:01:00.000Z' },
              { from: Stage.SPECIFY, to: Stage.DESIGN, timestamp: '2026-03-11T00:02:00.000Z' },
              { from: Stage.DESIGN, to: Stage.PLAN, timestamp: '2026-03-11T00:03:00.000Z' },
            ],
          },
          gateResult: {
            status: 'PASS',
            conditions: [
              { id: 'plan-exists', status: 'PASS' },
              { id: 'plan-has-tasks', status: 'PASS' },
            ],
          },
        },
        timestamp: '2026-03-11T00:03:00.000Z',
      },
      {
        stage: Stage.IMPLEMENT,
        contextPack: {
          featureId: 'FSREQ-TEST-FULLCYCLE-001',
          stageState: {
            currentStage: Stage.IMPLEMENT,
            stageStatus: 'ready_to_advance',
            history: [
              { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:01:00.000Z' },
              { from: Stage.SPECIFY, to: Stage.DESIGN, timestamp: '2026-03-11T00:02:00.000Z' },
              { from: Stage.DESIGN, to: Stage.PLAN, timestamp: '2026-03-11T00:03:00.000Z' },
              { from: Stage.PLAN, to: Stage.IMPLEMENT, timestamp: '2026-03-11T00:04:00.000Z' },
            ],
          },
          gateResult: {
            status: 'PASS',
            conditions: [
              { id: 'impl-complete', status: 'PASS' },
              { id: 'impl-tests-pass', status: 'PASS' },
            ],
          },
        },
        timestamp: '2026-03-11T00:04:00.000Z',
      },
      {
        stage: Stage.VERIFY,
        contextPack: {
          featureId: 'FSREQ-TEST-FULLCYCLE-001',
          stageState: {
            currentStage: Stage.VERIFY,
            stageStatus: 'ready_to_advance',
            history: [
              { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:01:00.000Z' },
              { from: Stage.SPECIFY, to: Stage.DESIGN, timestamp: '2026-03-11T00:02:00.000Z' },
              { from: Stage.DESIGN, to: Stage.PLAN, timestamp: '2026-03-11T00:03:00.000Z' },
              { from: Stage.PLAN, to: Stage.IMPLEMENT, timestamp: '2026-03-11T00:04:00.000Z' },
              { from: Stage.IMPLEMENT, to: Stage.VERIFY, timestamp: '2026-03-11T00:05:00.000Z' },
            ],
          },
          gateResult: {
            status: 'PASS',
            conditions: [
              { id: 'verify-tests-pass', status: 'PASS' },
              { id: 'verify-coverage-met', status: 'PASS' },
            ],
          },
        },
        timestamp: '2026-03-11T00:05:00.000Z',
      },
      {
        stage: Stage.WRAP_UP,
        contextPack: {
          featureId: 'FSREQ-TEST-FULLCYCLE-001',
          stageState: {
            currentStage: Stage.WRAP_UP,
            stageStatus: 'ready_to_advance',
            history: [
              { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:01:00.000Z' },
              { from: Stage.SPECIFY, to: Stage.DESIGN, timestamp: '2026-03-11T00:02:00.000Z' },
              { from: Stage.DESIGN, to: Stage.PLAN, timestamp: '2026-03-11T00:03:00.000Z' },
              { from: Stage.PLAN, to: Stage.IMPLEMENT, timestamp: '2026-03-11T00:04:00.000Z' },
              { from: Stage.IMPLEMENT, to: Stage.VERIFY, timestamp: '2026-03-11T00:05:00.000Z' },
              { from: Stage.VERIFY, to: Stage.WRAP_UP, timestamp: '2026-03-11T00:06:00.000Z' },
            ],
          },
          gateResult: {
            status: 'PASS',
            conditions: [
              { id: 'wrapup-docs-complete', status: 'PASS' },
              { id: 'wrapup-changelog-updated', status: 'PASS' },
            ],
          },
        },
        timestamp: '2026-03-11T00:06:00.000Z',
      },
    ],
    expectedOutcome: {
      finalStage: Stage.WRAP_UP,
      success: true,
      gateStatus: 'PASS',
    },
  },

  {
    name: 'small-feature-fast-track',
    description: '小型 Feature 快速通道：简化流程（跳过部分非必要阶段）',
    category: 'full_cycle',
    stages: [
      Stage.INIT,
      Stage.SPECIFY,
      Stage.IMPLEMENT,
      Stage.VERIFY,
      Stage.WRAP_UP,
    ],
    checkpoints: [
      {
        stage: Stage.INIT,
        contextPack: {
          featureId: 'FSREQ-TEST-FASTTRACK-001',
          stageState: {
            currentStage: Stage.INIT,
            stageStatus: 'ready_to_advance',
            history: [],
          },
          metadata: { size: 'S' },
        },
        timestamp: '2026-03-11T00:00:00.000Z',
      },
      {
        stage: Stage.SPECIFY,
        contextPack: {
          featureId: 'FSREQ-TEST-FASTTRACK-001',
          stageState: {
            currentStage: Stage.SPECIFY,
            stageStatus: 'ready_to_advance',
            history: [
              { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:00:30.000Z' },
            ],
          },
          metadata: { size: 'S' },
        },
        timestamp: '2026-03-11T00:00:30.000Z',
      },
      {
        stage: Stage.IMPLEMENT,
        contextPack: {
          featureId: 'FSREQ-TEST-FASTTRACK-001',
          stageState: {
            currentStage: Stage.IMPLEMENT,
            stageStatus: 'ready_to_advance',
            history: [
              { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:00:30.000Z' },
              { from: Stage.SPECIFY, to: Stage.IMPLEMENT, timestamp: '2026-03-11T00:01:00.000Z' },
            ],
          },
          metadata: { size: 'S' },
        },
        timestamp: '2026-03-11T00:01:00.000Z',
      },
      {
        stage: Stage.VERIFY,
        contextPack: {
          featureId: 'FSREQ-TEST-FASTTRACK-001',
          stageState: {
            currentStage: Stage.VERIFY,
            stageStatus: 'ready_to_advance',
            history: [
              { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:00:30.000Z' },
              { from: Stage.SPECIFY, to: Stage.IMPLEMENT, timestamp: '2026-03-11T00:01:00.000Z' },
              { from: Stage.IMPLEMENT, to: Stage.VERIFY, timestamp: '2026-03-11T00:01:30.000Z' },
            ],
          },
          metadata: { size: 'S' },
        },
        timestamp: '2026-03-11T00:01:30.000Z',
      },
      {
        stage: Stage.WRAP_UP,
        contextPack: {
          featureId: 'FSREQ-TEST-FASTTRACK-001',
          stageState: {
            currentStage: Stage.WRAP_UP,
            stageStatus: 'ready_to_advance',
            history: [
              { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:00:30.000Z' },
              { from: Stage.SPECIFY, to: Stage.IMPLEMENT, timestamp: '2026-03-11T00:01:00.000Z' },
              { from: Stage.IMPLEMENT, to: Stage.VERIFY, timestamp: '2026-03-11T00:01:30.000Z' },
              { from: Stage.VERIFY, to: Stage.WRAP_UP, timestamp: '2026-03-11T00:02:00.000Z' },
            ],
          },
          metadata: { size: 'S' },
        },
        timestamp: '2026-03-11T00:02:00.000Z',
      },
    ],
    expectedOutcome: {
      finalStage: Stage.WRAP_UP,
      success: true,
      gateStatus: 'PASS',
    },
  },
];

// ─── 类型 2: 中断恢复测试场景 ───────────────────────────────

/**
 * 中断恢复测试场景定义
 * 覆盖各阶段中断后 catchup 恢复
 */
export const RECOVERY_SCENARIOS: RecoveryTest[] = [
  {
    name: 'recover-from-specify-interrupt',
    interruptPoint: Stage.SPECIFY,
    savedContext: {
      featureId: 'FSREQ-TEST-RECOVERY-001',
      stageState: {
        currentStage: Stage.SPECIFY,
        stageStatus: 'drafting',
        history: [
          { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:01:00.000Z' },
        ],
      },
      metadata: {
        lastCommand: 'spec-first stage specify',
        partialProgress: 'prd-drafting',
      },
    },
    recoveryCommand: 'spec-first catchup',
    expectedStage: Stage.SPECIFY,
    success: true,
    verifyCheckpoints: [
      { field: 'stageState.currentStage', expectedValue: Stage.SPECIFY },
      { field: 'stageState.history.length', expectedValue: 1 },
    ],
  },

  {
    name: 'recover-from-design-interrupt',
    interruptPoint: Stage.DESIGN,
    savedContext: {
      featureId: 'FSREQ-TEST-RECOVERY-002',
      stageState: {
        currentStage: Stage.DESIGN,
        stageStatus: 'drafting',
        history: [
          { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:01:00.000Z' },
          { from: Stage.SPECIFY, to: Stage.DESIGN, timestamp: '2026-03-11T00:02:00.000Z' },
        ],
      },
      matrix: {
        rows: [
          { id: 'FR-TEST-001', type: 'FR', status: 'Planned' },
        ],
      },
      metadata: {
        lastCommand: 'spec-first stage design',
        partialProgress: 'ds-drafting',
      },
    },
    recoveryCommand: 'spec-first catchup',
    expectedStage: Stage.DESIGN,
    success: true,
    verifyCheckpoints: [
      { field: 'stageState.currentStage', expectedValue: Stage.DESIGN },
      { field: 'stageState.history.length', expectedValue: 2 },
      { field: 'matrix.rows.length', expectedValue: 1 },
    ],
  },

  {
    name: 'recover-from-implement-interrupt',
    interruptPoint: Stage.IMPLEMENT,
    savedContext: {
      featureId: 'FSREQ-TEST-RECOVERY-003',
      stageState: {
        currentStage: Stage.IMPLEMENT,
        stageStatus: 'drafting',
        history: [
          { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:01:00.000Z' },
          { from: Stage.SPECIFY, to: Stage.DESIGN, timestamp: '2026-03-11T00:02:00.000Z' },
          { from: Stage.DESIGN, to: Stage.PLAN, timestamp: '2026-03-11T00:03:00.000Z' },
          { from: Stage.PLAN, to: Stage.IMPLEMENT, timestamp: '2026-03-11T00:04:00.000Z' },
        ],
      },
      matrix: {
        rows: [
          { id: 'FR-TEST-001', type: 'FR', status: 'Implemented' },
          { id: 'DS-TEST-001', type: 'DS', status: 'Implemented' },
          { id: 'TASK-TEST-001', type: 'TASK', status: 'Implemented' },
          { id: 'TASK-TEST-002', type: 'TASK', status: 'Planned' },
        ],
      },
      metadata: {
        lastCommand: 'spec-first stage implement',
        partialProgress: 'partial-implementation',
        completedTasks: ['TASK-TEST-001'],
        pendingTasks: ['TASK-TEST-002'],
      },
    },
    recoveryCommand: 'spec-first catchup',
    expectedStage: Stage.IMPLEMENT,
    success: true,
    verifyCheckpoints: [
      { field: 'stageState.currentStage', expectedValue: Stage.IMPLEMENT },
      { field: 'stageState.history.length', expectedValue: 4 },
      { field: 'metadata.pendingTasks', expectedValue: ['TASK-TEST-002'] },
    ],
  },

  {
    name: 'recover-from-verify-interrupt',
    interruptPoint: Stage.VERIFY,
    savedContext: {
      featureId: 'FSREQ-TEST-RECOVERY-004',
      stageState: {
        currentStage: Stage.VERIFY,
        stageStatus: 'drafting',
        history: [
          { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:01:00.000Z' },
          { from: Stage.SPECIFY, to: Stage.DESIGN, timestamp: '2026-03-11T00:02:00.000Z' },
          { from: Stage.DESIGN, to: Stage.PLAN, timestamp: '2026-03-11T00:03:00.000Z' },
          { from: Stage.PLAN, to: Stage.IMPLEMENT, timestamp: '2026-03-11T00:04:00.000Z' },
          { from: Stage.IMPLEMENT, to: Stage.VERIFY, timestamp: '2026-03-11T00:05:00.000Z' },
        ],
      },
      matrix: {
        rows: [
          { id: 'FR-TEST-001', type: 'FR', status: 'Implemented' },
          { id: 'TC-TEST-001', type: 'TC', status: 'Planned' },
          { id: 'TC-TEST-002', type: 'TC', status: 'Verified' },
        ],
      },
      metadata: {
        lastCommand: 'spec-first stage verify',
        partialProgress: 'partial-verification',
        testResults: {
          passed: 5,
          failed: 0,
          coverage: 0.82,
        },
      },
    },
    recoveryCommand: 'spec-first catchup',
    expectedStage: Stage.VERIFY,
    success: true,
    verifyCheckpoints: [
      { field: 'stageState.currentStage', expectedValue: Stage.VERIFY },
      { field: 'metadata.testResults.coverage', expectedValue: 0.82 },
    ],
  },

  {
    name: 'recover-with-waiver-context',
    interruptPoint: Stage.IMPLEMENT,
    savedContext: {
      featureId: 'FSREQ-TEST-RECOVERY-005',
      stageState: {
        currentStage: Stage.IMPLEMENT,
        stageStatus: 'drafting',
        history: [
          { from: Stage.INIT, to: Stage.SPECIFY, timestamp: '2026-03-11T00:01:00.000Z' },
          { from: Stage.SPECIFY, to: Stage.DESIGN, timestamp: '2026-03-11T00:02:00.000Z' },
          { from: Stage.DESIGN, to: Stage.PLAN, timestamp: '2026-03-11T00:03:00.000Z' },
          { from: Stage.PLAN, to: Stage.IMPLEMENT, timestamp: '2026-03-11T00:04:00.000Z' },
        ],
      },
      gateResult: {
        status: 'PASS_WITH_WAIVER',
        conditions: [
          { id: 'coverage-threshold', status: 'WAIVER' },
        ],
      },
      metadata: {
        lastCommand: 'spec-first stage implement',
        activeWaivers: ['RFC-TEST-001'],
        waiverDetails: {
          'RFC-TEST-001': {
            frId: 'FR-TEST-001',
            reason: 'Legacy code coverage exception',
            expiresAt: '2026-04-11T00:00:00.000Z',
          },
        },
      },
    },
    recoveryCommand: 'spec-first catchup',
    expectedStage: Stage.IMPLEMENT,
    success: true,
    verifyCheckpoints: [
      { field: 'stageState.currentStage', expectedValue: Stage.IMPLEMENT },
      { field: 'gateResult.status', expectedValue: 'PASS_WITH_WAIVER' },
      { field: 'metadata.activeWaivers', expectedValue: ['RFC-TEST-001'] },
    ],
  },
];

// ─── 类型 3: Gate 阻断测试场景 ───────────────────────────────

/**
 * Gate 阻断测试场景定义
 * 验证违反条件时流程被正确阻断
 */
export const GATE_BLOCKING_SCENARIOS: GateBlockingTest[] = [
  {
    name: 'block-missing-prd-at-specify',
    stage: Stage.SPECIFY,
    violatedConditions: ['spec-has-prd'],
    expectedGateResult: {
      status: 'FAIL',
      failedConditions: ['spec-has-prd'],
    },
    expectedState: {
      shouldStayInStage: true,
      shouldHaveSuggestions: true,
    },
  },

  {
    name: 'block-missing-design-at-design',
    stage: Stage.DESIGN,
    violatedConditions: ['design-has-ds', 'design-trace-complete'],
    expectedGateResult: {
      status: 'FAIL',
      failedConditions: ['design-has-ds', 'design-trace-complete'],
    },
    expectedState: {
      shouldStayInStage: true,
      shouldHaveSuggestions: true,
    },
  },

  {
    name: 'block-missing-tasks-at-plan',
    stage: Stage.PLAN,
    violatedConditions: ['plan-has-tasks'],
    expectedGateResult: {
      status: 'FAIL',
      failedConditions: ['plan-has-tasks'],
    },
    expectedState: {
      shouldStayInStage: true,
      shouldHaveSuggestions: true,
    },
  },

  {
    name: 'block-failing-tests-at-implement',
    stage: Stage.IMPLEMENT,
    violatedConditions: ['impl-tests-pass', 'impl-lint-pass'],
    expectedGateResult: {
      status: 'FAIL',
      failedConditions: ['impl-tests-pass', 'impl-lint-pass'],
    },
    expectedState: {
      shouldStayInStage: true,
      shouldHaveSuggestions: true,
    },
  },

  {
    name: 'block-low-coverage-at-verify',
    stage: Stage.VERIFY,
    violatedConditions: ['verify-coverage-met'],
    expectedGateResult: {
      status: 'FAIL',
      failedConditions: ['verify-coverage-met'],
    },
    expectedState: {
      shouldStayInStage: true,
      shouldHaveSuggestions: true,
    },
  },

  {
    name: 'block-missing-changelog-at-wrapup',
    stage: Stage.WRAP_UP,
    violatedConditions: ['wrapup-changelog-updated', 'wrapup-docs-complete'],
    expectedGateResult: {
      status: 'FAIL',
      failedConditions: ['wrapup-changelog-updated', 'wrapup-docs-complete'],
    },
    expectedState: {
      shouldStayInStage: true,
      shouldHaveSuggestions: true,
    },
  },

  {
    name: 'block-unlinked-trace-ids',
    stage: Stage.DESIGN,
    violatedConditions: ['design-trace-complete'],
    expectedGateResult: {
      status: 'FAIL',
      failedConditions: ['design-trace-complete'],
    },
    expectedState: {
      shouldStayInStage: true,
      shouldHaveSuggestions: true,
    },
  },

  {
    name: 'block-security-vulnerability-at-verify',
    stage: Stage.VERIFY,
    violatedConditions: ['verify-security-scan'],
    expectedGateResult: {
      status: 'FAIL',
      failedConditions: ['verify-security-scan'],
    },
    expectedState: {
      shouldStayInStage: true,
      shouldHaveSuggestions: true,
    },
  },
];

// ─── 辅助函数 ───────────────────────────────────────────────

/**
 * 获取所有完整闭环场景
 */
export function getFullCycleScenarios(): FlowSimulation[] {
  return FULL_CYCLE_SCENARIOS;
}

/**
 * 获取所有中断恢复场景
 */
export function getRecoveryScenarios(): RecoveryTest[] {
  return RECOVERY_SCENARIOS;
}

/**
 * 获取所有 Gate 阻断场景
 */
export function getGateBlockingScenarios(): GateBlockingTest[] {
  return GATE_BLOCKING_SCENARIOS;
}

/**
 * 按阶段筛选中断恢复场景
 */
export function filterRecoveryByStage(stage: Stage): RecoveryTest[] {
  return RECOVERY_SCENARIOS.filter((s) => s.interruptPoint === stage);
}

/**
 * 按阶段筛选 Gate 阻断场景
 */
export function filterGateBlockingByStage(stage: Stage): GateBlockingTest[] {
  return GATE_BLOCKING_SCENARIOS.filter((s) => s.stage === stage);
}

/**
 * 创建模拟上下文包（用于测试）
 */
export function createMockContextPack(
  featureId: string,
  stage: Stage,
  overrides?: Partial<ContextPack>
): ContextPack {
  return {
    featureId,
    stageState: {
      currentStage: stage,
      stageStatus: 'drafting',
      history: [],
    },
    ...overrides,
  };
}

/**
 * 创建模拟检查点（用于测试）
 */
export function createMockCheckpoint(
  stage: Stage,
  contextPack: ContextPack,
  timestamp?: string
): Checkpoint {
  return {
    stage,
    contextPack,
    timestamp: timestamp ?? new Date().toISOString(),
  };
}
