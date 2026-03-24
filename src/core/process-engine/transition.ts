import { type FeatureState, Stage } from '../../shared/types.js';
import { assertTransitionAllowed, isTerminal } from './stage-machine.js';

export function applyTransition(state: FeatureState, targetStage: Stage): FeatureState {
  assertTransitionAllowed(state.currentStage, targetStage);

  return {
    ...state,
    currentStage: targetStage,
    terminal: isTerminal(targetStage),
    updatedAt: new Date().toISOString(),
  };
}
