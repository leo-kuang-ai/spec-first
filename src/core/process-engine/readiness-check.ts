import { Stage, type NodeState } from '../../shared/types.js';

export interface ReadinessCheckInput {
  currentStage: Stage;
  targetStage: Stage;
  nodes: Partial<Record<Stage, NodeState>>;
  artifacts: string[];
  terminal: boolean;
}

export interface ReadinessCheckResult {
  decision: 'READY_TO_WORK' | 'READY_TO_ADVANCE' | 'BLOCKED';
  currentStage: Stage;
  targetStage: Stage;
  checks: {
    previousNodeComplete: boolean;
    requiredArtifactsExist: boolean;
    noActiveWork: boolean;
    notTerminal: boolean;
    warnings: string[];
  };
}

export const STAGE_ARTIFACT_REQUIREMENTS: Record<Stage, string[]> = {
  [Stage.INIT]: [],
  [Stage.SPECIFY]: [],
  [Stage.DESIGN]: ['spec.md'],
  [Stage.PLAN]: ['spec.md', 'design.md'],
  [Stage.IMPLEMENT]: ['spec.md', 'design.md', 'task_plan.md'],
  [Stage.VERIFY]: ['spec.md', 'design.md', 'task_plan.md'],
  [Stage.WRAP_UP]: ['spec.md', 'design.md', 'task_plan.md', 'verify.md'],
  [Stage.RELEASE]: ['spec.md', 'design.md', 'task_plan.md', 'verify.md', 'wrap_up.md'],
  [Stage.DONE]: [],
  [Stage.CANCELLED]: [],
};

function isComplete(status?: NodeState['status']): boolean {
  return status === 'done' || status === 'skipped';
}

export function checkReadiness(input: ReadinessCheckInput): ReadinessCheckResult {
  const currentNode = input.nodes[input.currentStage];
  const currentStatus = currentNode?.status;
  const requiredArtifacts = STAGE_ARTIFACT_REQUIREMENTS[input.targetStage] ?? [];
  const requiredArtifactsExist = requiredArtifacts.every((name) => input.artifacts.includes(name));
  const previousNodeComplete = isComplete(currentStatus);
  const noActiveWork = !Object.entries(input.nodes).some(
    ([stage, node]) => stage !== input.currentStage && node?.status === 'in_progress'
  );
  const notTerminal = !input.terminal;
  const warnings: string[] = [];

  if (
    Object.values(input.nodes).some((node) => node?.status === 'blocked') ||
    currentStatus === 'blocked'
  ) {
    return {
      decision: 'BLOCKED',
      currentStage: input.currentStage,
      targetStage: input.targetStage,
      checks: {
        previousNodeComplete,
        requiredArtifactsExist,
        noActiveWork,
        notTerminal,
        warnings,
      },
    };
  }

  if (previousNodeComplete && requiredArtifactsExist && noActiveWork && notTerminal) {
    return {
      decision: 'READY_TO_ADVANCE',
      currentStage: input.currentStage,
      targetStage: input.targetStage,
      checks: {
        previousNodeComplete,
        requiredArtifactsExist,
        noActiveWork,
        notTerminal,
        warnings,
      },
    };
  }

  if ((currentStatus === 'todo' || currentStatus === 'in_progress') && notTerminal) {
    return {
      decision: 'READY_TO_WORK',
      currentStage: input.currentStage,
      targetStage: input.currentStage,
      checks: {
        previousNodeComplete,
        requiredArtifactsExist,
        noActiveWork,
        notTerminal,
        warnings,
      },
    };
  }

  return {
    decision: 'BLOCKED',
    currentStage: input.currentStage,
    targetStage: input.targetStage,
    checks: {
      previousNodeComplete,
      requiredArtifactsExist,
      noActiveWork,
      notTerminal,
      warnings,
    },
  };
}
