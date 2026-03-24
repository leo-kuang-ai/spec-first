import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { Stage } from '../../src/shared/types.js';
import { getFeatureState, listFeatures } from '../../src/core/process-engine/feature.js';

const tempRoots: string[] = [];

function createProjectRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'spec-first-feature-state-'));
  tempRoots.push(root);
  return root;
}

function writeFeatureState(root: string, featureId: string): void {
  const featureDir = join(root, 'specs', featureId);
  const statePath = join(featureDir, 'stage-state.json');
  mkdirSync(featureDir, { recursive: true });
  writeFileSync(
    statePath,
    JSON.stringify(
      {
        featureId,
        currentStage: Stage.PLAN,
        terminal: false,
        nodes: {
          [Stage.PLAN]: {
            status: 'in_progress',
            checklistStatus: 'partial',
            canMarkDone: false,
            summary: 'task table drafted',
          },
        },
        createdAt: '2026-03-24T00:00:00.000Z',
        updatedAt: '2026-03-24T00:00:00.000Z',
      },
      null,
      2
    )
  );
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root) rmSync(root, { recursive: true, force: true });
  }
});

describe('FeatureState runtime', () => {
  it('reads node-based state without legacy summary fields', () => {
    const projectRoot = createProjectRoot();
    const featureId = 'FSREQ-20260324-NODE-001';
    writeFeatureState(projectRoot, featureId);

    const state = getFeatureState(featureId, projectRoot);
    const summaries = listFeatures(projectRoot);

    expect(state.nodes[Stage.PLAN]?.status).toBe('in_progress');
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).not.toHaveProperty('mode');
    expect(summaries[0]).not.toHaveProperty('size');
    expect(summaries[0]?.currentStage).toBe(Stage.PLAN);
  });
});
