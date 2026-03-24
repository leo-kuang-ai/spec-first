import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { handleOrchestrate } from '../../src/cli/commands/orchestrate.js';
import { Stage, type FeatureState } from '../../src/shared/types.js';

let tmp = '';
const originalCwd = process.cwd;

function createProjectRoot(): string {
  const root = mkdtempSync(join(os.tmpdir(), 'spec-first-orchestrate-'));
  mkdirSync(join(root, '.spec-first', 'meta'), { recursive: true });
  writeFileSync(join(root, '.spec-first', 'meta', 'config.yaml'), 'version: 1.0.0\n', 'utf-8');
  mkdirSync(join(root, 'specs'), { recursive: true });
  return root;
}

function writeFeatureState(root: string, featureId: string, state: FeatureState): void {
  const featureDir = join(root, 'specs', featureId);
  mkdirSync(featureDir, { recursive: true });
  writeFileSync(join(featureDir, 'stage-state.json'), JSON.stringify(state, null, 2), 'utf-8');
}

function writeArtifact(root: string, featureId: string, name: string): void {
  const featureDir = join(root, 'specs', featureId);
  mkdirSync(featureDir, { recursive: true });
  writeFileSync(join(featureDir, name), `# ${name}\n`, 'utf-8');
}

function readFeatureState(root: string, featureId: string): FeatureState {
  return JSON.parse(readFileSync(join(root, 'specs', featureId, 'stage-state.json'), 'utf-8'));
}

afterEach(() => {
  process.cwd = originalCwd;
  if (tmp) {
    rmSync(tmp, { recursive: true, force: true });
    tmp = '';
  }
});

describe('handleOrchestrate stage integration', () => {
  it('returns READY_TO_ADVANCE when current node is done and next stage is ready', async () => {
    tmp = createProjectRoot();
    process.cwd = () => tmp;

    const featureId = 'FSREQ-20260324-NODE-001';
    writeFeatureState(tmp, featureId, {
      featureId,
      currentStage: Stage.INIT,
      terminal: false,
      nodes: {
        [Stage.INIT]: { status: 'done', checklistStatus: 'complete', canMarkDone: true },
      },
      createdAt: '2026-03-24T00:00:00.000Z',
      updatedAt: '2026-03-24T00:00:00.000Z',
    });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = await handleOrchestrate([featureId]);
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain('决策：READY_TO_ADVANCE');
      expect(output).toContain(`目标阶段：${Stage.SPECIFY}`);
      expect(readFeatureState(tmp, featureId).currentStage).toBe(Stage.INIT);
    } finally {
      logSpy.mockRestore();
    }
  });

  it('returns READY_TO_WORK when current node is still in progress', async () => {
    tmp = createProjectRoot();
    process.cwd = () => tmp;

    const featureId = 'FSREQ-20260324-NODE-002';
    writeFeatureState(tmp, featureId, {
      featureId,
      currentStage: Stage.DESIGN,
      terminal: false,
      nodes: {
        [Stage.DESIGN]: { status: 'in_progress', checklistStatus: 'partial', canMarkDone: false },
      },
      createdAt: '2026-03-24T00:00:00.000Z',
      updatedAt: '2026-03-24T00:00:00.000Z',
    });
    writeArtifact(tmp, featureId, 'spec.md');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = await handleOrchestrate([featureId]);
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain('决策：READY_TO_WORK');
      expect(output).toContain(`目标阶段：${Stage.DESIGN}`);
    } finally {
      logSpy.mockRestore();
    }
  });

  it('auto-advances when readiness is satisfied and --auto-advance is set', async () => {
    tmp = createProjectRoot();
    process.cwd = () => tmp;

    const featureId = 'FSREQ-20260324-NODE-003';
    writeFeatureState(tmp, featureId, {
      featureId,
      currentStage: Stage.INIT,
      terminal: false,
      nodes: {
        [Stage.INIT]: { status: 'done', checklistStatus: 'complete', canMarkDone: true },
      },
      createdAt: '2026-03-24T00:00:00.000Z',
      updatedAt: '2026-03-24T00:00:00.000Z',
    });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = await handleOrchestrate([featureId, '--auto-advance']);
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain('已推进：00_init → 01_specify');
      expect(readFeatureState(tmp, featureId).currentStage).toBe(Stage.SPECIFY);
    } finally {
      logSpy.mockRestore();
    }
  });

  it('returns BLOCKED when current node is blocked', async () => {
    tmp = createProjectRoot();
    process.cwd = () => tmp;

    const featureId = 'FSREQ-20260324-NODE-004';
    writeFeatureState(tmp, featureId, {
      featureId,
      currentStage: Stage.PLAN,
      terminal: false,
      nodes: {
        [Stage.PLAN]: { status: 'blocked', checklistStatus: 'partial', canMarkDone: false },
      },
      createdAt: '2026-03-24T00:00:00.000Z',
      updatedAt: '2026-03-24T00:00:00.000Z',
    });
    writeArtifact(tmp, featureId, 'spec.md');
    writeArtifact(tmp, featureId, 'design.md');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = await handleOrchestrate([featureId]);
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain('决策：BLOCKED');
    } finally {
      logSpy.mockRestore();
    }
  });
});
