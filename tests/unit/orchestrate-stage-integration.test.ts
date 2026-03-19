import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import os from 'node:os';
import { handleInit } from '../../src/cli/commands/init.js';
import { handleOrchestrate } from '../../src/cli/commands/orchestrate.js';
import { Stage } from '../../src/shared/types.js';
import type { StageState } from '../../src/shared/types.js';
import { initTodoState, saveTodoState } from '../../src/core/ai-orchestrator/todo-runner.js';
import type { TaskExecutor } from '../../src/core/ai-orchestrator/auto-loop.js';
import {
  writeFirstApiContracts,
  writeFirstConventions,
  writeFirstCriticalFlows,
  writeFirstDatabaseSchema,
  writeFirstDomainModel,
  writeFirstEntryGuide,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstSteering,
  writeFirstStructureOverview,
} from '../../src/core/skill-runtime/first-runtime-store.js';

let TMP = '';
const origCwd = process.cwd;
const origSpecFirstSkillsDir = process.env.SPEC_FIRST_SKILLS_DIR;

function seedHealthyRuntimeFirst(projectRoot: string): void {
  writeFirstRuntimeIndex(projectRoot, {
    version: '1.0.0',
    lastRun: '2026-03-08T12:00:00.000Z',
    mode: 'deep',
    summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    steering: { path: '.spec-first/runtime/first/steering.json', fileHash: 'steering', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    conventions: { path: '.spec-first/runtime/first/conventions.json', fileHash: 'conventions', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    criticalFlows: { path: '.spec-first/runtime/first/critical-flows.json', fileHash: 'critical-flows', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    entryGuide: { path: '.spec-first/runtime/first/entry-guide.json', fileHash: 'entry-guide', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    apiContracts: { path: '.spec-first/runtime/first/api-contracts.json', fileHash: 'api-contracts', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    structureOverview: { path: '.spec-first/runtime/first/structure-overview.json', fileHash: 'structure-overview', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    domainModel: { path: '.spec-first/runtime/first/domain-model.json', fileHash: 'domain-model', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    databaseSchema: { path: '.spec-first/runtime/first/database-schema.json', fileHash: 'database-schema', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true, status: 'healthy' },
    docsProjection: {},
    status: 'current',
  });
  writeFirstRuntimeSummary(projectRoot, {
    generatedAt: '2026-03-08T12:00:00.000Z',
    mode: 'deep',
    project: { name: 'spec-first', platformType: 'backend', overview: 'runtime init' },
    modules: ['src/core/process-engine/init.ts'],
    capabilities: ['feature initialization'],
    entryPoints: ['src/cli/commands/init.ts'],
    dataModels: ['Feature'],
    apiSurface: ['spec-first init', 'spec-first orchestrate'],
    risks: [],
    evidence: [],
  });
  writeFirstSteering(projectRoot, {
    product: { overview: 'runtime init', coreScenarios: ['feature initialization'], nonGoals: [], glossary: ['Feature'] },
    tech: { stack: ['TypeScript'], constraints: ['runtime truth source'], forbiddenPatterns: [] },
    structure: { modules: ['src/core/process-engine'], boundaries: ['src/cli/commands/init.ts'], entryRules: ['read runtime truth first'] },
  });
  writeFirstConventions(projectRoot, {
    api: { observedPatterns: ['spec-first init'], deviations: [], recommendedConvention: 'stable', evidence: [] },
    module: { observedPatterns: ['src/core/process-engine'], deviations: [], recommendedConvention: 'stable', evidence: [] },
    testing: { observedPatterns: ['Vitest'], deviations: [], recommendedConvention: 'stable', evidence: [] },
    projectRules: { observedPatterns: ['runtime truth first'], deviations: [], recommendedConvention: 'stable', evidence: [] },
  });
  writeFirstCriticalFlows(projectRoot, [
    {
      flowId: 'flow-orchestrate',
      name: 'Orchestrate Flow',
      entryPoints: ['src/cli/commands/orchestrate.ts'],
      coreModules: ['src/core/ai-orchestrator/auto-loop.ts'],
      invariants: ['runtime truth first'],
      verificationHooks: ['pnpm vitest run tests/unit/orchestrate-stage-integration.test.ts'],
    },
  ]);
  writeFirstEntryGuide(projectRoot, [
    {
      taskCategory: 'runtime-extension',
      readFirst: ['.spec-first/runtime/first/summary.json'],
      thenRead: ['src/core/ai-orchestrator/auto-loop.ts'],
      avoidEntry: ['docs/first/summary.md'],
      relatedFlows: ['flow-orchestrate'],
    },
  ]);
  writeFirstApiContracts(projectRoot, { interfaces: [], integrationPoints: ['src/cli/commands/init.ts', 'src/cli/commands/orchestrate.ts'], notes: [] });
  writeFirstStructureOverview(projectRoot, { topology: ['init -> orchestrate'], modules: [], readingOrder: [], evidence: [] });
  writeFirstDomainModel(projectRoot, { entities: [], glossary: ['Feature'], evidence: [] });
  writeFirstDatabaseSchema(projectRoot, { status: 'healthy', provider: 'sqlite', tables: [], risks: [], evidence: [] });
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
  TMP = mkdtempSync(join(os.tmpdir(), 'spec-first-orchestrate-stage-'));
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
  mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
  execSync('git -c core.hooksPath=/dev/null init', { cwd: TMP, stdio: 'ignore' });
  execSync('git config user.email \"test@example.com\"', { cwd: TMP, stdio: 'ignore' });
  execSync('git config user.name \"test\"', { cwd: TMP, stdio: 'ignore' });
  writeFileSync(join(TMP, '.spec-first', 'meta', 'config.yaml'), 'version: 1.0.0\nbaselineSkipped: true\n', 'utf-8');
  writeFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), 'platform: h5\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'summary.md'), '# Summary\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'codebase-overview.md'), '# Codebase Overview\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'domain-model.md'), '# Domain Model\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'api-docs.md'), '# API Docs\n', 'utf-8');
  seedHealthyRuntimeFirst(TMP);
  process.env.SPEC_FIRST_SKILLS_DIR = join(TMP, '.host', 'spec-first-skills');
  process.cwd = () => TMP;
});

afterEach(() => {
  if (TMP) {
    rmSync(TMP, { recursive: true, force: true });
    TMP = '';
  }
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
