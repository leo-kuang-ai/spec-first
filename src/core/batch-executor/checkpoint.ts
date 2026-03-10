/**
 * Checkpoint 机制
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { LayerResult } from './types.js';

export interface CheckpointState {
  kind: 'batch-checkpoint-state';
  version: 1;
  featureId: string;
  currentLayer: number;
  completedTasks: string[];
  failedTasks: string[];
  startTime: string;
  lastUpdateTime: string;
  layerResults: LayerResult[];
}

function getCheckpointPath(featureId: string, projectRoot: string): string {
  return join(projectRoot, 'specs', featureId, 'batch-checkpoint.json');
}

export function saveCheckpoint(
  state: Omit<CheckpointState, 'kind' | 'version'> | CheckpointState,
  projectRoot: string,
): void {
  const path = getCheckpointPath(state.featureId, projectRoot);
  const payload: CheckpointState = {
    kind: 'batch-checkpoint-state',
    version: 1,
    ...state,
  };
  writeFileSync(path, JSON.stringify(payload, null, 2), 'utf-8');
}

export function loadCheckpoint(
  featureId: string,
  projectRoot: string,
): CheckpointState | null {
  const path = getCheckpointPath(featureId, projectRoot);
  if (!existsSync(path)) return null;

  try {
    const content = readFileSync(path, 'utf-8');
    const parsed = JSON.parse(content) as Partial<CheckpointState>;
    if (parsed.kind !== 'batch-checkpoint-state' || parsed.version !== 1) {
      return null;
    }
    return parsed as CheckpointState;
  } catch {
    return null;
  }
}
