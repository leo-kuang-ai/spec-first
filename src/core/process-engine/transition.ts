import { type FeatureState, type NodeState, Stage } from '../../shared/types.js';
import { assertTransitionAllowed, isTerminal } from './stage-machine.js';

function markNodeDone(node: NodeState | undefined, timestamp: string): NodeState {
  return {
    ...(node ?? { status: 'done' as const }),
    status: node?.status === 'skipped' ? 'skipped' : 'done',
    completedAt: node?.completedAt ?? timestamp,
    checklistStatus: node?.checklistStatus ?? 'complete',
    canMarkDone: node?.canMarkDone ?? true,
  };
}

export function applyTransition(
  state: FeatureState,
  targetStage: Stage,
  options?: { reason?: string }
): FeatureState {
  assertTransitionAllowed(state.currentStage, targetStage);
  const timestamp = new Date().toISOString();
  const fromStage = state.currentStage;
  const { current_stage: _legacyCurrentStage, ...rest } = state as FeatureState & {
    current_stage?: Stage;
  };
  const nodes = { ...(rest.nodes ?? {}) };

  if (targetStage !== Stage.CANCELLED) {
    nodes[fromStage] = markNodeDone(nodes[fromStage], timestamp);
  }

  if (targetStage !== Stage.CANCELLED) {
    const targetNode = nodes[targetStage];
    nodes[targetStage] = {
      ...(targetNode ?? { status: 'in_progress' as const }),
      status: targetStage === Stage.DONE ? 'done' : 'in_progress',
      startedAt: targetNode?.startedAt ?? timestamp,
      completedAt: targetStage === Stage.DONE ? timestamp : targetNode?.completedAt,
    };
  }

  const history = [
    ...(rest.history ?? []),
    {
      from: fromStage,
      to: targetStage,
      timestamp,
      reason: options?.reason,
    },
  ];

  return {
    ...rest,
    nodes,
    history,
    currentStage: targetStage,
    terminal: isTerminal(targetStage),
    updatedAt: timestamp,
  };
}
