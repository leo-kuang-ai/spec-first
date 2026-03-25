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

function parseTimestamp(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function assertChronologicalState(state: FeatureState): void {
  for (const [stage, node] of Object.entries(state.nodes ?? {})) {
    const startedAt = parseTimestamp(node.startedAt);
    const completedAt = parseTimestamp(node.completedAt);
    if (startedAt !== undefined && completedAt !== undefined && completedAt < startedAt) {
      throw new Error(`stage-state.json 时间线非法：${stage} completedAt 早于 startedAt`);
    }
  }

  let prevHistoryTs: number | undefined;
  for (const entry of state.history ?? []) {
    const ts = parseTimestamp(entry.timestamp);
    if (ts === undefined) continue;
    if (prevHistoryTs !== undefined && ts < prevHistoryTs) {
      throw new Error('stage-state.json history 时间线非法：记录未按时间递增');
    }
    prevHistoryTs = ts;
  }
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

  const nextState: FeatureState = {
    ...rest,
    nodes,
    history,
    currentStage: targetStage,
    terminal: isTerminal(targetStage),
    updatedAt: timestamp,
  };

  assertChronologicalState(nextState);
  return nextState;
}
