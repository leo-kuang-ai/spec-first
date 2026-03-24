import { type FeatureState, Stage } from '../../shared/types.js';
import { assertTransitionAllowed, isTerminal } from './stage-machine.js';

export function applyTransition(state: FeatureState, targetStage: Stage): FeatureState {
  assertTransitionAllowed(state.currentStage, targetStage);
  const { current_stage: _legacyCurrentStage, ...rest } = state as FeatureState & {
    current_stage?: Stage;
  };

  return {
    ...rest,
    currentStage: targetStage,
    terminal: isTerminal(targetStage),
    updatedAt: new Date().toISOString(),
  };
}
