import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleFirst } from '../../src/cli/commands/first.js';
import {
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
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

const TMP = join(import.meta.dirname, '../fixtures/.tmp-first-command');
const origCwd = process.cwd;

function healthyEntry(path: string) {
  return {
    path,
    fileHash: path,
    lastUpdated: '2026-03-09T12:00:00.000Z',
    healthy: true,
  };
}

function seedProject(): void {
  mkdirSync(join(TMP, 'src', 'cli'), { recursive: true });
  writeFileSync(
    join(TMP, 'package.json'),
    JSON.stringify(
      {
        name: 'demo-first',
        description: 'Specification-driven development process engine',
        engines: { node: '>=20.0.0' },
        bin: { 'spec-first': 'dist/cli/index.js' },
        dependencies: { express: '^4.0.0' },
        devDependencies: { typescript: '^5.4.0', vitest: '^1.6.1', tsup: '^8.5.1' },
      },
      null,
      2
    ),
    'utf-8'
  );
  writeFileSync(
    join(TMP, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: { target: 'ES2022' } }, null, 2),
    'utf-8'
  );
  writeFileSync(join(TMP, 'vitest.config.ts'), 'export default {}\n', 'utf-8');
  writeFileSync(join(TMP, 'src', 'cli', 'index.ts'), 'export const cli = true;\n', 'utf-8');
  mkdirSync(join(TMP, 'specs'), { recursive: true });
}

function seedRuntimeTruthOnly(): void {
  writeFirstRuntimeSummary(TMP, {
    generatedAt: '2026-03-09T12:00:00.000Z',
    mode: 'deep',
    project: {
      name: 'runtime-truth',
      platformType: 'backend',
      overview: 'runtime summary only',
    },
    techStack: ['runtime: Node.js >=20.0.0', 'language: TypeScript'],
    modules: ['src/core/skill-runtime'],
    capabilities: ['runtime truth source'],
    entryPoints: ['src/cli/index.ts'],
    dataModels: ['Feature'],
    apiSurface: ['CLI: spec-first'],
    risks: [],
    evidence: ['package.json', 'src/cli/index.ts'],
  });
  writeFirstSteering(TMP, {
    product: {
      overview: 'runtime summary only',
      coreScenarios: ['runtime truth source'],
      nonGoals: [],
      glossary: ['Feature'],
    },
    tech: {
      stack: ['runtime: Node.js >=20.0.0', 'language: TypeScript'],
      constraints: [],
      forbiddenPatterns: ['docs-only truth'],
    },
    structure: {
      modules: ['src/core/skill-runtime'],
      boundaries: ['src/cli/index.ts'],
      entryRules: ['read runtime truth first'],
    },
  });
  writeFirstConventions(TMP, {
    api: {
      observedPatterns: ['CLI: spec-first'],
      deviations: [],
      recommendedConvention: 'Expose command surfaces through stable spec-first CLI verbs.',
      evidence: ['src/cli/index.ts'],
    },
    module: {
      observedPatterns: ['src/core/skill-runtime'],
      deviations: [],
      recommendedConvention: 'Keep runtime logic under src/core and CLI entry under src/cli.',
      evidence: ['src/core/skill-runtime'],
    },
    testing: {
      observedPatterns: ['Vitest'],
      deviations: [],
      recommendedConvention: 'Use Vitest.',
      evidence: ['vitest.config.ts'],
    },
    projectRules: {
      observedPatterns: ['runtime truth first'],
      deviations: [],
      recommendedConvention: 'Read runtime truth before docs.',
      evidence: ['.spec-first/runtime/first'],
    },
  });
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
  writeFirstEntryGuide(TMP, [
    {
      taskCategory: 'runtime-extension',
      readFirst: ['.spec-first/runtime/first/summary.json', '.spec-first/runtime/first/steering.json'],
      thenRead: ['src/core/skill-runtime/first-runtime-store.ts'],
      avoidEntry: ['docs/first/summary.md'],
      relatedFlows: ['flow-cli-entry'],
    },
  ]);
  writeFirstApiContracts(TMP, {
    interfaces: [
      {
        interfaceType: 'cli-command',
        name: 'spec-first',
        path: 'spec-first',
        method: 'run',
        handler: 'src/cli/index.ts',
        request: [],
        response: ['runtime truth source'],
        auth: [],
        errors: [],
        evidence: ['src/cli/index.ts'],
      },
    ],
    integrationPoints: ['src/cli/index.ts'],
    notes: [],
  });
  writeFirstStructureOverview(TMP, {
    topology: ['entry -> modules -> runtime projection'],
    modules: [
      {
        name: 'skill-runtime',
        purpose: 'runtime truth source',
        keyPaths: ['src/core/skill-runtime'],
        entryPoints: ['src/cli/index.ts'],
        dependencies: [],
      },
    ],
    readingOrder: ['src/cli/index.ts', 'src/core/skill-runtime'],
    evidence: ['src/cli/index.ts'],
  });
  writeFirstDomainModel(TMP, {
    entities: [
      {
        name: 'Feature',
        kind: 'concept',
        description: 'feature metadata',
        invariants: ['runtime truth first'],
        relationships: ['关联 CLI: spec-first'],
        evidence: ['src/cli/index.ts'],
      },
    ],
    glossary: ['Feature'],
    evidence: ['src/cli/index.ts'],
  });
  writeFirstDatabaseSchema(TMP, {
    status: 'not_applicable',
    tables: [],
    risks: [],
    evidence: [],
  });
  writeFirstRuntimeIndex(TMP, {
    version: '1.0.0',
    lastRun: '2026-03-09T12:00:00.000Z',
    summary: healthyEntry('.spec-first/runtime/first/summary.json'),
    steering: healthyEntry('.spec-first/runtime/first/steering.json'),
    conventions: healthyEntry('.spec-first/runtime/first/conventions.json'),
    criticalFlows: healthyEntry('.spec-first/runtime/first/critical-flows.json'),
    entryGuide: healthyEntry('.spec-first/runtime/first/entry-guide.json'),
    apiContracts: healthyEntry('.spec-first/runtime/first/api-contracts.json'),
    structureOverview: healthyEntry('.spec-first/runtime/first/structure-overview.json'),
    domainModel: healthyEntry('.spec-first/runtime/first/domain-model.json'),
    databaseSchema: {
      ...healthyEntry('.spec-first/runtime/first/database-schema.json'),
      status: 'not_applicable',
    },
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

    const code = handleFirst([]);

    expect(code).toBe(0);
    expect(existsSync(join(TMP, '.spec-first', 'runtime', 'first', 'index.json'))).toBe(true);
    expect(existsSync(join(TMP, 'docs', 'first', 'summary.md'))).toBe(true);

    const summary = readFirstRuntimeSummary(TMP);
    const index = readFirstRuntimeIndex(TMP);

    expect(summary?.project.name).toBe('demo-first');
    expect(summary?.project.platformType).toBe('backend');
    expect(summary?.techStack).toContain('language: TypeScript');
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
    expect(readFileSync(summaryDoc, 'utf-8')).toContain('## 项目是什么');
    expect(readFileSync(readmeDoc, 'utf-8')).toContain('.spec-first/runtime/first/');
    expect(readFileSync(readmeDoc, 'utf-8')).toContain('Canonical Projection Docs');
  });

  it('check-health 在缺失 runtime 时返回校验失败', () => {
    seedProject();
    expect(handleFirst(['--check-health'])).toBe(2);
  });

  it('补跑 first 后会同步已有 Feature 的 backgroundInputStatus', () => {
    seedProject();
    const featureId = 'FSREQ-20260312-FIRSTSYNC-001';
    mkdirSync(join(TMP, 'specs', featureId), { recursive: true });
    writeFileSync(
      join(TMP, 'specs', featureId, 'stage-state.json'),
      JSON.stringify(
        {
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
        },
        null,
        2
      ),
      'utf-8'
    );

    const code = handleFirst([]);

    expect(code).toBe(0);
    const state = JSON.parse(
      readFileSync(join(TMP, 'specs', featureId, 'stage-state.json'), 'utf-8')
    ) as { backgroundInputStatus?: string; updatedAt?: string };
    expect(state.backgroundInputStatus).toBe('blind');
    expect(state.updatedAt).toBe('2026-03-12T12:00:00.000Z');
  });

  it('help 与 health 输出明确 canonical projection docs 边界', () => {
    seedProject();

    handleFirst(['--help']);
    handleFirst(['--check-health']);

    const logOutput = vi.mocked(console.log).mock.calls.flat().join('\n');

    expect(logOutput).toContain('.spec-first/runtime/first/');
    expect(logOutput).toContain('docs/first/');
    expect(logOutput).toContain('项目级认知真源');
  });
});
