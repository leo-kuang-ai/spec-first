import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { init } from '../../src/core/process-engine/init.js';
import { advance, cancel } from '../../src/core/process-engine/advance.js';
import { checkReadiness } from '../../src/core/process-engine/readiness-check.js';
import { applyTransition } from '../../src/core/process-engine/transition.js';
import { Stage, type FeatureState } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-node-workflow');

function readState(featureId: string): FeatureState {
  return JSON.parse(readFileSync(join(TMP, 'specs', featureId, 'stage-state.json'), 'utf-8'));
}

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  mkdirSync(join(TMP, 'specs'), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'config.yaml'), 'version: 1.0.0\n', 'utf-8');
  writeFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), 'platform: h5\n', 'utf-8');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('node workflow e2e', () => {
  it('advances by readiness and transition instead of gate', () => {
    const { featureId } = init({
      feat: 'NODE',
      mode: 'N',
      size: 'M',
      platforms: ['h5'],
      projectRoot: TMP,
    });

    let state = readState(featureId);
    state.nodes = {
      [Stage.INIT]: { status: 'done', checklistStatus: 'complete', canMarkDone: true },
    };
    writeFileSync(join(TMP, 'specs', featureId, 'stage-state.json'), JSON.stringify(state), 'utf-8');

    const readiness = checkReadiness({
      currentStage: state.currentStage,
      targetStage: Stage.SPECIFY,
      nodes: state.nodes,
      artifacts: [],
      terminal: state.terminal,
    });
    expect(readiness.decision).toBe('READY_TO_ADVANCE');

    const next = applyTransition(state, Stage.SPECIFY);
    expect(next.currentStage).toBe(Stage.SPECIFY);
  });

  it('keeps skipped nodes advanceable and allows cancel from non-terminal stage', () => {
    const state: FeatureState = {
      featureId: 'FSREQ-20260324-NODE-002',
      currentStage: Stage.SPECIFY,
      terminal: false,
      nodes: {
        [Stage.SPECIFY]: { status: 'skipped', summary: '已记录跳过原因' },
      },
      createdAt: '2026-03-24T00:00:00.000Z',
      updatedAt: '2026-03-24T00:00:00.000Z',
    };

    const readiness = checkReadiness({
      currentStage: Stage.SPECIFY,
      targetStage: Stage.DESIGN,
      nodes: state.nodes,
      artifacts: ['spec.md'],
      terminal: false,
    });
    expect(readiness.decision).toBe('READY_TO_ADVANCE');

    mkdirSync(join(TMP, 'specs', state.featureId), { recursive: true });
    writeFileSync(join(TMP, 'specs', state.featureId, 'stage-state.json'), JSON.stringify(state), 'utf-8');
    const result = cancel(state.featureId, TMP, 'stop here');
    expect(result.to).toBe(Stage.CANCELLED);
    expect(readState(state.featureId).terminal).toBe(true);
  });

  it('keeps standalone edits from implicitly advancing current stage', () => {
    const { featureId } = init({
      feat: 'STANDALONE',
      mode: 'N',
      size: 'S',
      platforms: ['h5'],
      projectRoot: TMP,
    });

    advance(featureId, TMP);
    const state = readState(featureId);
    writeFileSync(join(TMP, 'specs', featureId, 'spec.md'), '# Spec\n', 'utf-8');

    expect(state.currentStage).toBe(Stage.SPECIFY);
    expect(readState(featureId).currentStage).toBe(Stage.SPECIFY);
  });
});
