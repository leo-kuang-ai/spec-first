import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleInit } from '../../src/cli/commands/init.js';
import { handleOrchestrate } from '../../src/cli/commands/orchestrate.js';
import { Stage } from '../../src/shared/types.js';
import type { StageState } from '../../src/shared/types.js';
import { initTodoState, saveTodoState } from '../../src/core/ai-orchestrator/todo-runner.js';
import type { TaskExecutor } from '../../src/core/ai-orchestrator/auto-loop.js';
import { writeFirstRuntimeIndex, writeFirstRuntimeSummary, writeFirstRoleViews, writeFirstStageViews } from '../../src/core/skill-runtime/first-runtime-store.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-orchestrate-stage');
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
    apiSurface: ['spec-first init', 'spec-first orchestrate'],
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
    code: { stage: 'code', summary: 'code', entryPoints: ['src/cli/commands/orchestrate.ts'], likelyChangeAreas: ['src/core/ai-orchestrator/auto-loop.ts'], changeHazards: [], verificationHooks: ['tests/unit/orchestrate-stage-integration.test.ts'] },
    verify: { stage: 'verify', summary: 'verify', testFocus: ['orchestrate coordination'], riskAreas: [], validationHooks: ['pnpm vitest run tests/unit/orchestrate-stage-integration.test.ts'], releaseBlockers: [] },
  });
}

async function setupFeature(feat = 'ORC'): Promise<string> {
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

function seedTodo(featureId: string): void {
  const state = initTodoState(featureId, TMP, [
    { id: 'TASK-ORC-001', title: '推进任务', status: 'pending' },
  ]);
  saveTodoState(state, TMP);
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

describe('handleOrchestrate stage integration', () => {
  const successExecutor: TaskExecutor = async () => ({ success: true, message: 'ok' });
  const failExecutor: TaskExecutor = async () => ({ success: false, message: 'ENOENT: no such file' });

  it('should suggest stage advance after auto-loop completes by default', async () => {
    const featureId = await setupFeature();
    updateState(featureId, (state) => {
      state.currentStage = Stage.INIT;
      state.stageStatus = 'ready_to_advance';
      state.autoAdvancePolicy = 'suggest';
    });
    seedTodo(featureId);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = await handleOrchestrate(['--auto'], { executor: successExecutor });
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain('auto-loop: ✅ 所有任务完成');
      expect(output).toContain('决策：READY_TO_ADVANCE');
      expect(output).toContain(`建议命令：spec-first stage advance ${featureId}`);

      const state = JSON.parse(readFileSync(join(TMP, 'specs', featureId, 'stage-state.json'), 'utf-8')) as StageState;
      expect(state.currentStage).toBe(Stage.INIT);
    } finally {
      logSpy.mockRestore();
    }
  });

  it('should auto advance when auto-advance is enabled and decision is ready', async () => {
    const featureId = await setupFeature('AAV');
    updateState(featureId, (state) => {
      state.currentStage = Stage.INIT;
      state.stageStatus = 'ready_to_advance';
      state.autoAdvancePolicy = 'suggest';
    });
    seedTodo(featureId);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = await handleOrchestrate(['--auto', '--auto-advance'], { executor: successExecutor });
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain('auto-loop: ✅ 所有任务完成');
      expect(output).toContain('已推进：00_init → 01_specify');

      const state = JSON.parse(readFileSync(join(TMP, 'specs', featureId, 'stage-state.json'), 'utf-8')) as StageState;
      expect(state.currentStage).toBe(Stage.SPECIFY);
    } finally {
      logSpy.mockRestore();
    }
  });

  it('should stop at blocked todo and never advance stage', async () => {
    const featureId = await setupFeature('BLK');
    updateState(featureId, (state) => {
      state.currentStage = Stage.INIT;
      state.stageStatus = 'ready_to_advance';
      state.autoAdvancePolicy = 'suggest';
    });
    seedTodo(featureId);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = await handleOrchestrate(['--auto', '--auto-advance'], { executor: failExecutor });
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain('auto-loop: ❌ 存在阻塞任务');
      expect(output).toContain('决策：BLOCKED');
      expect(output).toContain('auto-loop 未完成: has_blocked');

      const state = JSON.parse(readFileSync(join(TMP, 'specs', featureId, 'stage-state.json'), 'utf-8')) as StageState;
      expect(state.currentStage).toBe(Stage.INIT);
    } finally {
      logSpy.mockRestore();
    }
  });
});
