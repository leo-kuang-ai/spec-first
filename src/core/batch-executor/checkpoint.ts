/**
 * Checkpoint 机制
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { LayerResult } from './types.js';

export interface CheckpointState {
  featureId: string;
  currentLayer: number;
  completedTasks: string[];
  failedTasks: string[];
  startTime: string;
  lastUpdateTime: string;
  layerResults: LayerResult[];
}

export function saveCheckpoint(
  state: CheckpointState,
  projectRoot: string,
): void {
  const path = join(projectRoot, 'specs', state.featureId, 'todo-state.json');
  writeFileSync(path, JSON.stringify(state, null, 2), 'utf-8');
}

export function loadCheckpoint(
  featureId: string,
  projectRoot: string,
): CheckpointState | null {
  const path = join(projectRoot, 'specs', featureId, 'todo-state.json');
  if (!existsSync(path)) return null;

  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
