import { Stage } from '../../shared/types.js';
import type { AutoAdvancePolicy, GateStatus, StageStatus } from '../../shared/types.js';
import type { TodoRunnerState } from '../ai-orchestrator/todo-runner.js';
import type { DependencyCheckResult } from './dependency-checker.js';
import { describeDependencyIssues } from './dependency-checker.js';

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
}

export interface NextStepDecision {
  decision: NextStepDecisionType;
  currentStage: Stage;
  nextStage?: Stage;
  suggestedCommand?: string;
  reasons: string[];
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
      allDone: true,
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
    };
  }

  if (input.stageStatus !== 'ready_to_advance') {
    return {
      decision: 'SUGGEST_NEXT',
      currentStage: input.currentStage,
      nextStage,
      suggestedCommand: SUGGESTED_SKILL_COMMANDS[input.currentStage],
      reasons: [],
    };
  }

  const reasons: string[] = [];
  if (input.dependencyCheck && !input.dependencyCheck.pass) {
    reasons.push(...describeDependencyIssues(input.dependencyCheck));
  }

  if (input.gateStatus && input.gateStatus !== 'PASS' && input.gateStatus !== 'PILOT_PASS') {
    reasons.push('Gate 未通过，需先修复失败条件后再推进阶段');
  }

  const todoProgress = summarizeTodoProgress(input.todoState);
  if (todoProgress.hasBlocked) {
    reasons.push('存在 blocked todo，需先清除阻塞后再推进阶段');
  }

  if (reasons.length > 0) {
    return {
      decision: 'BLOCKED',
      currentStage: input.currentStage,
      nextStage,
      reasons,
    };
  }

  if (input.currentStage === Stage.SPECIFY) {
    return {
      decision: 'SUGGEST_NEXT',
      currentStage: input.currentStage,
      nextStage,
      suggestedCommand: buildAdvanceCommand(input.featureId),
      reasons: [],
    };
  }

  if (input.currentStage === Stage.DESIGN) {
    return {
      decision: 'READY_TO_ADVANCE',
      currentStage: input.currentStage,
      nextStage,
      suggestedCommand: buildAdvanceCommand(input.featureId),
      reasons: [],
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
      };
    }

    if (input.todoState && !todoProgress.allDone) {
      return {
        decision: 'SUGGEST_NEXT',
        currentStage: input.currentStage,
        nextStage,
        suggestedCommand: SUGGESTED_SKILL_COMMANDS[input.currentStage],
        reasons: [],
      };
    }

    return {
      decision: 'READY_TO_ADVANCE',
      currentStage: input.currentStage,
      nextStage,
      suggestedCommand: buildAdvanceCommand(input.featureId),
      reasons: [],
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
      };
    }

    if (input.autoAdvancePolicy === 'auto_run') {
      return {
        decision: 'AUTO_RUN_NEXT_SKILL',
        currentStage: input.currentStage,
        nextStage,
        suggestedCommand: '/spec-first:verify',
        reasons: [],
      };
    }

    if (input.autoAdvancePolicy === 'auto_advance') {
      return {
        decision: 'AUTO_ADVANCE',
        currentStage: input.currentStage,
        nextStage,
        suggestedCommand: buildAdvanceCommand(input.featureId),
        reasons: [],
      };
    }
  }

  return {
    decision: 'READY_TO_ADVANCE',
    currentStage: input.currentStage,
    nextStage,
    suggestedCommand: buildAdvanceCommand(input.featureId),
    reasons: [],
  };
}

function buildAdvanceCommand(featureId?: string): string | undefined {
  return featureId ? `spec-first stage advance ${featureId}` : undefined;
}
