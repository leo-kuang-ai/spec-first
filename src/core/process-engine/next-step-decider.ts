import { Stage } from '../../shared/types.js';
import type { AutoAdvancePolicy, GateStatus, StageStatus } from '../../shared/types.js';
import type { TodoRunnerState } from '../ai-orchestrator/todo-runner.js';
import type { AutoLoopStatus } from '../ai-orchestrator/auto-loop.js';
import type { DependencyCheckResult } from './dependency-checker.js';
import { describeDependencyIssues } from './dependency-checker.js';

/**
 * 决策阻塞原因码
 *
 * 用途：
 * - 测试断言：提供稳定的错误码，避免依赖中文字符串
 * - 脚本集成：可编程化判断阻塞原因
 * - 审计日志：结构化记录决策过程
 *
 * @example
 * ```typescript
 * const decision = decideNextStep({ ... });
 * if (decision.reasonCodes.includes(ReasonCode.GATE_FAILED)) {
 *   // 处理 Gate 失败场景
 * }
 * ```
 */
export const ReasonCode = {
  NO_NEXT_STAGE: 'NO_NEXT_STAGE',
  AUTO_LOOP_HAS_BLOCKED: 'AUTO_LOOP_HAS_BLOCKED',
  AUTO_LOOP_TIMEOUT: 'AUTO_LOOP_TIMEOUT',
  AUTO_LOOP_NO_STATE_FILE: 'AUTO_LOOP_NO_STATE_FILE',
  AUTO_LOOP_MAX_ITERATIONS: 'AUTO_LOOP_MAX_ITERATIONS',
  AUTO_LOOP_INCOMPLETE: 'AUTO_LOOP_INCOMPLETE',
  DEPENDENCY_FAILED: 'DEPENDENCY_FAILED',
  GATE_FAILED: 'GATE_FAILED',
  TODO_BLOCKED: 'TODO_BLOCKED',
  TODO_PENDING: 'TODO_PENDING',
} as const;

export type ReasonCodeValue = typeof ReasonCode[keyof typeof ReasonCode];

export type NextStepDecisionType =
  | 'BLOCKED'
  | 'SUGGEST_NEXT'
  | 'READY_TO_ADVANCE'
  | 'AUTO_ADVANCE'
  | 'AUTO_RUN_NEXT_SKILL';

export type DeciderGateStatus = GateStatus | 'PILOT_PASS';

export interface NextStepDecisionInput {
  featureId?: string;
  currentStage: Stage;
  stageStatus?: StageStatus;
  autoAdvancePolicy?: AutoAdvancePolicy;
  gateStatus?: DeciderGateStatus;
  dependencyCheck?: DependencyCheckResult;
  todoState?: Pick<TodoRunnerState, 'halted' | 'haltReason' | 'items'>;
  autoLoopStatus?: AutoLoopStatus;
}

export interface NextStepDecision {
  decision: NextStepDecisionType;
  currentStage: Stage;
  nextStage?: Stage;
  suggestedCommand?: string;
  reasons: string[];
  reasonCodes: ReasonCodeValue[];
}

export interface TodoProgress {
  allDone: boolean;
  hasBlocked: boolean;
  pendingCount: number;
  blockedCount: number;
}

const STAGE_ORDER: readonly Stage[] = [
  Stage.INIT,
  Stage.SPECIFY,
  Stage.DESIGN,
  Stage.PLAN,
  Stage.IMPLEMENT,
  Stage.VERIFY,
  Stage.WRAP_UP,
  Stage.RELEASE,
  Stage.DONE,
];

const SUGGESTED_SKILL_COMMANDS: Partial<Record<Stage, string>> = {
  [Stage.SPECIFY]: '/spec-first:spec-review',
  [Stage.DESIGN]: '/spec-first:task',
  [Stage.PLAN]: '/spec-first:code',
  [Stage.IMPLEMENT]: '/spec-first:verify',
};

const AUTO_LOOP_STATUS_TO_REASON_CODE: Record<Exclude<AutoLoopStatus, 'all_done'>, ReasonCodeValue> = {
  has_blocked: ReasonCode.AUTO_LOOP_HAS_BLOCKED,
  timeout: ReasonCode.AUTO_LOOP_TIMEOUT,
  no_state_file: ReasonCode.AUTO_LOOP_NO_STATE_FILE,
  max_iterations: ReasonCode.AUTO_LOOP_MAX_ITERATIONS,
  incomplete: ReasonCode.AUTO_LOOP_INCOMPLETE,
};

export function getNextStage(currentStage: Stage): Stage | undefined {
  const index = STAGE_ORDER.indexOf(currentStage);
  if (index === -1 || index >= STAGE_ORDER.length - 1) return undefined;
  return STAGE_ORDER[index + 1];
}

export function summarizeTodoProgress(
  todoState?: NextStepDecisionInput['todoState'],
): TodoProgress {
  if (!todoState) {
    return {
      allDone: false,
      hasBlocked: false,
      pendingCount: 0,
      blockedCount: 0,
    };
  }

  const blockedCount = todoState.items.filter((item) => item.status === 'blocked').length;
  const pendingCount = todoState.items.filter((item) => item.status === 'pending' || item.status === 'in_progress').length;

  return {
    allDone: todoState.items.length > 0 && todoState.items.every((item) => item.status === 'done'),
    hasBlocked: blockedCount > 0 || todoState.haltReason?.startsWith('blocked') === true,
    pendingCount,
    blockedCount,
  };
}

export function decideNextStep(input: NextStepDecisionInput): NextStepDecision {
  const nextStage = getNextStage(input.currentStage);
  if (!nextStage) {
    return {
      decision: 'BLOCKED',
      currentStage: input.currentStage,
      reasons: [`阶段 ${input.currentStage} 之后不存在下一阶段`],
      reasonCodes: [ReasonCode.NO_NEXT_STAGE],
    };
  }

  if (input.autoLoopStatus && input.autoLoopStatus !== 'all_done') {
    return {
      decision: 'BLOCKED',
      currentStage: input.currentStage,
      nextStage,
      reasons: [`auto-loop 未完成: ${input.autoLoopStatus}`],
      reasonCodes: [AUTO_LOOP_STATUS_TO_REASON_CODE[input.autoLoopStatus]],
    };
  }

  if (input.stageStatus !== 'ready_to_advance') {
    return {
      decision: 'SUGGEST_NEXT',
      currentStage: input.currentStage,
      nextStage,
      suggestedCommand: SUGGESTED_SKILL_COMMANDS[input.currentStage],
      reasons: [],
      reasonCodes: [],
    };
  }

  const reasons: string[] = [];
  const reasonCodes: ReasonCodeValue[] = [];
  if (input.dependencyCheck && !input.dependencyCheck.pass) {
    reasons.push(...describeDependencyIssues(input.dependencyCheck));
    reasonCodes.push(ReasonCode.DEPENDENCY_FAILED);
  }

  if (input.gateStatus && input.gateStatus !== 'PASS' && input.gateStatus !== 'PILOT_PASS') {
    reasons.push('Gate 未通过，需先修复失败条件后再推进阶段');
    reasonCodes.push(ReasonCode.GATE_FAILED);
  }

  const todoProgress = summarizeTodoProgress(input.todoState);
  if (todoProgress.hasBlocked) {
    reasons.push('存在 blocked todo，需先清除阻塞后再推进阶段');
    reasonCodes.push(ReasonCode.TODO_BLOCKED);
  }

  if (reasons.length > 0) {
    return {
      decision: 'BLOCKED',
      currentStage: input.currentStage,
      nextStage,
      reasons,
      reasonCodes,
    };
  }

  if (input.currentStage === Stage.SPECIFY) {
    return {
      decision: 'SUGGEST_NEXT',
      currentStage: input.currentStage,
      nextStage,
      suggestedCommand: buildAdvanceCommand(input.featureId),
      reasons: [],
      reasonCodes: [],
    };
  }

  if (input.currentStage === Stage.DESIGN) {
    return {
      decision: 'READY_TO_ADVANCE',
      currentStage: input.currentStage,
      nextStage,
      suggestedCommand: buildAdvanceCommand(input.featureId),
      reasons: [],
      reasonCodes: [],
    };
  }

  if (input.currentStage === Stage.PLAN) {
    if (input.autoAdvancePolicy === 'auto_advance' && (todoProgress.allDone || !input.todoState)) {
      return {
        decision: 'AUTO_ADVANCE',
        currentStage: input.currentStage,
        nextStage,
        suggestedCommand: buildAdvanceCommand(input.featureId),
        reasons: [],
        reasonCodes: [],
      };
    }

    if (input.todoState && !todoProgress.allDone) {
      return {
        decision: 'SUGGEST_NEXT',
        currentStage: input.currentStage,
        nextStage,
        suggestedCommand: SUGGESTED_SKILL_COMMANDS[input.currentStage],
        reasons: [],
        reasonCodes: [ReasonCode.TODO_PENDING],
      };
    }

    return {
      decision: 'READY_TO_ADVANCE',
      currentStage: input.currentStage,
      nextStage,
      suggestedCommand: buildAdvanceCommand(input.featureId),
      reasons: [],
      reasonCodes: [],
    };
  }

  if (input.currentStage === Stage.IMPLEMENT) {
    if (input.todoState && !todoProgress.allDone) {
      return {
        decision: 'SUGGEST_NEXT',
        currentStage: input.currentStage,
        nextStage,
        suggestedCommand: '/spec-first:code',
        reasons: [],
        reasonCodes: [ReasonCode.TODO_PENDING],
      };
    }

    if (input.autoAdvancePolicy === 'auto_advance') {
      return {
        decision: 'AUTO_ADVANCE',
        currentStage: input.currentStage,
        nextStage,
        suggestedCommand: buildAdvanceCommand(input.featureId),
        reasons: [],
        reasonCodes: [],
      };
    }
  }

  return {
    decision: 'READY_TO_ADVANCE',
    currentStage: input.currentStage,
    nextStage,
    suggestedCommand: buildAdvanceCommand(input.featureId),
    reasons: [],
    reasonCodes: [],
  };
}

function buildAdvanceCommand(featureId?: string): string | undefined {
  return featureId ? `spec-first stage advance ${featureId}` : undefined;
}
