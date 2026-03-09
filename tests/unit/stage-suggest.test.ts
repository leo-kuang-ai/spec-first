import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, readFileSync, rmSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { handleInit } from '../../src/cli/commands/init.js';
import { handleStage } from '../../src/cli/commands/stage.js';
import { Stage } from '../../src/shared/types.js';
import type { StageState } from '../../src/shared/types.js';
import { saveTodoState } from '../../src/core/ai-orchestrator/todo-runner.js';
import { writeFirstRuntimeIndex, writeFirstRuntimeSummary, writeFirstRoleViews, writeFirstStageViews } from '../../src/core/skill-runtime/first-runtime-store.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-stage-suggest');
const origCwd = process.cwd;
const origSpecFirstSkillsDir = process.env.SPEC_FIRST_SKILLS_DIR;

function seedHealthyRuntimeFirst(projectRoot: string): void {
  writeFirstRuntimeIndex(projectRoot, {
    version: '1.0.0',
    lastRun: '2026-03-08T12:00:00.000Z',
    mode: 'quick',
    summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'roles', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'stages', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    docsProjection: {},
    status: 'current',
  });
  writeFirstRuntimeSummary(projectRoot, {
    generatedAt: '2026-03-08T12:00:00.000Z',
    mode: 'quick',
    project: { name: 'spec-first', platformType: 'backend', overview: 'runtime init' },
    modules: ['src/core/process-engine/init.ts'],
    capabilities: ['feature initialization'],
    entryPoints: ['src/cli/commands/init.ts'],
    dataModels: ['Feature'],
    apiSurface: ['spec-first init'],
    risks: [],
    evidence: [],
  });
  writeFirstRoleViews(projectRoot, {
    product: { role: 'product', summary: 'product', focus: ['capabilities'], warnings: [] },
    dev: { role: 'dev', summary: 'dev', focus: ['modules'], warnings: [] },
    qa: { role: 'qa', summary: 'qa', focus: ['validation'], warnings: [] },
    architect: { role: 'architect', summary: 'architect', focus: ['entrypoints'], warnings: [] },
  });
  writeFirstStageViews(projectRoot, {
    spec: { stage: 'spec', summary: 'spec', businessCapabilities: ['feature initialization'], coreEntities: ['Feature'], dependencies: ['spec-first init'], warnings: [] },
    design: { stage: 'design', summary: 'design', moduleBoundaries: ['src/core/process-engine'], integrationPoints: ['src/cli/commands/init.ts'], technicalConstraints: ['runtime truth source'], risks: [] },
    code: { stage: 'code', summary: 'code', entryPoints: ['src/cli/commands/init.ts'], likelyChangeAreas: ['src/core/process-engine/init.ts'], changeHazards: [], verificationHooks: ['tests/unit/stage-suggest.test.ts'] },
    verify: { stage: 'verify', summary: 'verify', testFocus: ['runtime readiness'], riskAreas: [], validationHooks: ['pnpm vitest run tests/unit/stage-suggest.test.ts'], releaseBlockers: [] },
  });
}

async function setupFeature(feat = 'SGG'): Promise<string> {
  await handleInit(['--feat', feat, '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
  const entries = readdirSync(join(TMP, 'specs')).filter((e) => e.startsWith('FSREQ-'));
  return entries.find((e) => e.includes(`-${feat}-`)) ?? entries[entries.length - 1];
}

function updateState(featureId: string, updater: (state: StageState & Record<string, unknown>) => void): void {
  const statePath = join(TMP, 'specs', featureId, 'stage-state.json');
  const state = JSON.parse(readFileSync(statePath, 'utf-8')) as StageState & Record<string, unknown>;
  updater(state);
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), 'platform: h5\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'tech-stack.md'), '# Tech Stack\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'codebase-overview.md'), '# Codebase Overview\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'domain-model.md'), '# Domain Model\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'api-docs.md'), '# API Docs\n', 'utf-8');
  seedHealthyRuntimeFirst(TMP);
  process.env.SPEC_FIRST_SKILLS_DIR = join(TMP, '.host', 'spec-first-skills');
  process.cwd = () => TMP;
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  if (origSpecFirstSkillsDir === undefined) delete process.env.SPEC_FIRST_SKILLS_DIR;
  else process.env.SPEC_FIRST_SKILLS_DIR = origSpecFirstSkillsDir;
  process.cwd = origCwd;
});

describe('stage suggest', () => {
  it('should be read-only and surface gate blockers', async () => {
    const fid = await setupFeature();
    updateState(fid, (state) => {
      state.currentStage = Stage.SPECIFY;
      state.stageStatus = 'ready_to_advance';
      state.autoAdvancePolicy = 'suggest';
    });

    const featureDir = join(TMP, 'specs', fid);
    const statePath = join(featureDir, 'stage-state.json');
    const beforeState = readFileSync(statePath, 'utf-8');
    const gateHistoryPath = join(featureDir, 'gate-history.jsonl');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = handleStage(['suggest', fid]);
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain('决策：BLOCKED');
      expect(output).toContain('Gate 未通过');
      expect(readFileSync(statePath, 'utf-8')).toBe(beforeState);
      expect(existsSync(gateHistoryPath)).toBe(false);
    } finally {
      logSpy.mockRestore();
    }
  });

  it('should surface dependency blockers without mutating state', async () => {
    const fid = await setupFeature('DSG');
    updateState(fid, (state) => {
      state.currentStage = Stage.DESIGN;
      state.stageStatus = 'ready_to_advance';
      state.autoAdvancePolicy = 'assisted';
    });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = handleStage(['suggest', fid]);
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain(`缺少 file: specs/${fid}/design.md`);
    } finally {
      logSpy.mockRestore();
    }
  });

  it('should surface blocked todo reasons during implement handoff', async () => {
    const fid = await setupFeature('IMP');
    updateState(fid, (state) => {
      state.currentStage = Stage.IMPLEMENT;
      state.stageStatus = 'ready_to_advance';
      state.autoAdvancePolicy = 'auto_run';
    });
    saveTodoState({
      featureId: fid,
      iteration: 1,
      maxIterations: 8,
      halted: true,
      haltReason: 'blocked:TASK-IMP-001',
      items: [
        { id: 'TASK-IMP-001', title: '补测试', status: 'blocked' },
      ],
      updatedAt: '2026-03-09T00:00:00.000Z',
    }, TMP);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = handleStage(['suggest', fid]);
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain('存在 blocked todo，需先清除阻塞后再推进阶段');
    } finally {
      logSpy.mockRestore();
    }
  });
});
