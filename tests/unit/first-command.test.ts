import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleFirst } from '../../src/cli/commands/first.js';
import {
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  writeFirstChangeMap,
  writeFirstConventions,
  writeFirstCriticalFlows,
  writeFirstEntryGuide,
  writeFirstRebootGuide,
  writeFirstRoleViews,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstSteering,
  writeFirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-store.js';
import type { FirstConventions, FirstSteering } from '../../src/core/skill-runtime/first-runtime-types.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-first-command');
const origCwd = process.cwd;

function seedProject(): void {
  mkdirSync(join(TMP, 'src', 'cli'), { recursive: true });
  writeFileSync(
    join(TMP, 'package.json'),
    JSON.stringify({
      name: 'demo-first',
      description: 'Specification-driven development process engine',
      engines: { node: '>=20.0.0' },
      bin: { 'spec-first': 'dist/cli/index.js' },
      dependencies: { express: '^4.0.0' },
      devDependencies: { typescript: '^5.4.0', vitest: '^1.6.1', tsup: '^8.5.1' },
    }, null, 2),
    'utf-8',
  );
  writeFileSync(join(TMP, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022' } }, null, 2), 'utf-8');
  writeFileSync(join(TMP, 'vitest.config.ts'), 'export default {}\n', 'utf-8');
  writeFileSync(join(TMP, 'src', 'cli', 'index.ts'), 'export const cli = true;\n', 'utf-8');
  mkdirSync(join(TMP, 'specs'), { recursive: true });
}

function seedRuntimeTruthOnly(): void {
  writeFirstRuntimeSummary(TMP, {
    generatedAt: '2026-03-09T12:00:00.000Z',
    mode: 'quick',
    project: { name: 'runtime-truth', platformType: 'backend', overview: 'runtime summary only' },
    techStack: ['runtime: Node.js >=20.0.0', 'language: TypeScript'],
    modules: ['src/core/skill-runtime'],
    capabilities: ['runtime truth source'],
    entryPoints: ['src/cli/index.ts'],
    dataModels: ['Feature'],
    apiSurface: ['CLI: spec-first'],
    risks: [],
    evidence: ['package.json', 'src/cli/index.ts'],
  });
  writeFirstRoleViews(TMP, {
    product: { role: 'product', summary: 'product', focus: ['runtime truth source'], warnings: [] },
    dev: { role: 'dev', summary: 'dev', focus: ['src/core/skill-runtime'], warnings: [] },
    qa: { role: 'qa', summary: 'qa', focus: ['runtime truth source'], warnings: [] },
    architect: { role: 'architect', summary: 'architect', focus: ['backend'], warnings: [] },
  });
  writeFirstStageViews(TMP, {
    spec: { stage: 'spec', summary: 'spec', businessCapabilities: ['runtime truth source'], coreEntities: ['Feature'], dependencies: ['CLI: spec-first'], warnings: [] },
    design: { stage: 'design', summary: 'design', moduleBoundaries: ['src/core/skill-runtime'], integrationPoints: ['CLI: spec-first'], technicalConstraints: ['平台类型: backend'], risks: [] },
    code: { stage: 'code', summary: 'code', entryPoints: ['src/cli/index.ts'], likelyChangeAreas: ['src/core/skill-runtime'], changeHazards: [], verificationHooks: ['tests/unit/first-command.test.ts'] },
    verify: { stage: 'verify', summary: 'verify', testFocus: ['runtime truth source'], riskAreas: [], validationHooks: ['pnpm vitest'], releaseBlockers: [] },
  });
  const steering: FirstSteering = {
    product: { overview: 'runtime summary only', coreScenarios: ['runtime truth source'], nonGoals: [], glossary: ['Feature'] },
    tech: { stack: ['runtime: Node.js >=20.0.0', 'language: TypeScript'], constraints: [], forbiddenPatterns: ['docs-only truth'] },
    structure: { modules: ['src/core/skill-runtime'], boundaries: ['src/cli/index.ts'], entryRules: ['read runtime truth first'] },
  };
  const conventions: FirstConventions = {
    api: { observedPatterns: ['CLI: spec-first'], deviations: [], recommendedConvention: 'Expose command surfaces through stable spec-first CLI verbs.', evidence: ['src/cli/index.ts'] },
    module: { observedPatterns: ['src/core/skill-runtime'], deviations: [], recommendedConvention: 'Keep runtime logic under src/core and CLI entry under src/cli.', evidence: ['src/core/skill-runtime'] },
    testing: { observedPatterns: ['Vitest'], deviations: [], recommendedConvention: 'Use Vitest.', evidence: ['vitest.config.ts'] },
    projectRules: { observedPatterns: ['runtime truth first'], deviations: [], recommendedConvention: 'Read runtime truth before docs.', evidence: ['.spec-first/runtime/first'] },
  };
  writeFirstSteering(TMP, steering);
  writeFirstConventions(TMP, conventions);
  writeFirstCriticalFlows(TMP, [
    {
      flowId: 'flow-cli-entry',
      name: 'CLI Entry Flow',
      entryPoints: ['src/cli/index.ts'],
      coreModules: ['src/core/skill-runtime'],
      invariants: ['runtime truth first'],
      verificationHooks: ['pnpm vitest'],
    },
  ]);
  writeFirstChangeMap(TMP, [
    {
      changeType: 'runtime-asset-extension',
      likelyModules: ['src/core/skill-runtime'],
      likelyCommands: ['src/cli/commands/first.ts'],
      likelyConfigs: ['package.json'],
      likelyTests: ['tests/unit/first-command.test.ts'],
      riskPoints: ['runtime index drift'],
    },
  ]);
  writeFirstEntryGuide(TMP, [
    {
      taskCategory: 'runtime-extension',
      readFirst: ['.spec-first/runtime/first/summary.json', '.spec-first/runtime/first/steering.json'],
      thenRead: ['src/core/skill-runtime/first-runtime-store.ts'],
      avoidEntry: ['docs/first/tech-stack.md'],
      relatedFlows: ['flow-cli-entry'],
    },
  ]);
  writeFirstRebootGuide(TMP, {
    projectWhat: 'runtime summary only',
    whereToStart: ['.spec-first/runtime/first/summary.json', 'docs/first/README.md'],
    currentCriticalAreas: ['runtime truth first'],
    commonChangePaths: ['src/core/skill-runtime'],
    verifyChecklist: ['pnpm vitest'],
  });
  writeFirstRuntimeIndex(TMP, {
    version: '1.0.0',
    lastRun: '2026-03-09T12:00:00.000Z',
    mode: 'quick',
    summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-09T12:00:00.000Z', healthy: true },
    roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'role', lastUpdated: '2026-03-09T12:00:00.000Z', healthy: true },
    stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'stage', lastUpdated: '2026-03-09T12:00:00.000Z', healthy: true },
    steering: { path: '.spec-first/runtime/first/steering.json', fileHash: 'steering', lastUpdated: '2026-03-09T12:00:00.000Z', healthy: true },
    conventions: { path: '.spec-first/runtime/first/conventions.json', fileHash: 'conventions', lastUpdated: '2026-03-09T12:00:00.000Z', healthy: true },
    criticalFlows: { path: '.spec-first/runtime/first/critical-flows.json', fileHash: 'critical-flows', lastUpdated: '2026-03-09T12:00:00.000Z', healthy: true },
    changeMap: { path: '.spec-first/runtime/first/change-map.json', fileHash: 'change-map', lastUpdated: '2026-03-09T12:00:00.000Z', healthy: true },
    entryGuide: { path: '.spec-first/runtime/first/entry-guide.json', fileHash: 'entry-guide', lastUpdated: '2026-03-09T12:00:00.000Z', healthy: true },
    rebootGuide: { path: '.spec-first/runtime/first/reboot-guide.json', fileHash: 'reboot-guide', lastUpdated: '2026-03-09T12:00:00.000Z', healthy: true },
    docsProjection: {},
    status: 'current',
  });
}

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  process.cwd = () => TMP;
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
  vi.restoreAllMocks();
});

describe('handleFirst', () => {
  it('首次运行生成 canonical runtime 与 docs 投影视图', () => {
    seedProject();

    const code = handleFirst(['--quick']);

    expect(code).toBe(0);
    expect(existsSync(join(TMP, '.spec-first', 'runtime', 'first', 'index.json'))).toBe(true);
    expect(existsSync(join(TMP, 'docs', 'first', 'summary.md'))).toBe(true);
    expect(existsSync(join(TMP, '.config-first'))).toBe(false);

    const summary = readFirstRuntimeSummary(TMP);
    const index = readFirstRuntimeIndex(TMP);

    expect(summary?.mode).toBe('quick');
    expect(summary?.project.name).toBe('demo-first');
    expect(summary?.project.platformType).toBe('backend');
    expect(summary?.techStack).toContain('language: TypeScript');
    expect(summary?.entryPoints).toContain('dist/cli/index.js');
    expect(index?.docsProjection['docs/first/summary.md']?.healthy).toBe(true);
  });

  it('已有 runtime 真源时恢复 docs/first 投影视图', () => {
    seedProject();
    seedRuntimeTruthOnly();
    rmSync(join(TMP, 'docs'), { recursive: true, force: true });

    const code = handleFirst([]);

    expect(code).toBe(0);
    const summaryDoc = join(TMP, 'docs', 'first', 'summary.md');
    const readmeDoc = join(TMP, 'docs', 'first', 'README.md');
    expect(existsSync(summaryDoc)).toBe(true);
    expect(readFileSync(summaryDoc, 'utf-8')).toContain('runtime-truth');
    expect(readFileSync(readmeDoc, 'utf-8')).toContain('.spec-first/runtime/first/');
    expect(readFileSync(readmeDoc, 'utf-8')).toContain('Canonical Projection Docs');
  });

  it('check-health 在缺失 runtime 时返回校验失败', () => {
    seedProject();

    const code = handleFirst(['--check-health']);

    expect(code).toBe(2);
  });

  it('补跑 first 后会同步已有 Feature 的 backgroundInputStatus', () => {
    seedProject();
    const featureId = 'FSREQ-20260312-FIRSTSYNC-001';
    mkdirSync(join(TMP, 'specs', featureId), { recursive: true });
    writeFileSync(
      join(TMP, 'specs', featureId, 'stage-state.json'),
      JSON.stringify({
        featureId,
        currentStage: '02_design',
        history: [],
        terminal: false,
        mode: 'N',
        size: 'S',
        platforms: ['h5'],
        backgroundInputStatus: 'blind',
        createdAt: '2026-03-12T12:00:00.000Z',
        updatedAt: '2026-03-12T12:00:00.000Z',
      }),
      'utf-8',
    );

    const code = handleFirst(['--quick']);

    expect(code).toBe(0);
    const state = JSON.parse(
      readFileSync(join(TMP, 'specs', featureId, 'stage-state.json'), 'utf-8')
    ) as { backgroundInputStatus?: string; updatedAt?: string };
    expect(state.backgroundInputStatus).toBe('full');
    expect(state.updatedAt).toBe('2026-03-12T12:00:00.000Z');
  });

  it('help 与 health 输出明确 canonical projection docs 边界', () => {
    seedProject();

    handleFirst(['--help']);
    handleFirst(['--check-health']);

    const logOutput = vi.mocked(console.log).mock.calls.flat().join('\n');

    expect(logOutput).toContain('canonical `.spec-first/runtime/first/`');
    expect(logOutput).toContain('canonical projection docs');
    expect(logOutput).toContain('仅检查 runtime truth + canonical projection docs');
    expect(logOutput).not.toContain('检查全部 legacy docs');
  });
});
