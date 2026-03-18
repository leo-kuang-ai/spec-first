import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getFirstRuntimeNotice,
  getOrchestrateRuntimeNotice,
} from '../../src/core/skill-runtime/dispatcher.js';
import { refreshFirstDocsFromRuntime } from '../../src/core/skill-runtime/first-doc-projection.js';
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

const TEST_ROOT = join(import.meta.dirname, '../fixtures/.tmp-dispatcher-first-runtime');

function healthyEntry(path: string) {
  return {
    path,
    fileHash: path,
    lastUpdated: '2026-03-08T12:00:00.000Z',
    healthy: true,
  };
}

function seedCanonicalRuntime(): void {
  writeFirstRuntimeSummary(TEST_ROOT, {
    generatedAt: '2026-03-08T12:00:00.000Z',
    mode: 'deep',
    project: { name: 'spec-first', platformType: 'backend', overview: 'Runtime-backed first context' },
    modules: ['src/core/skill-runtime'],
    capabilities: ['runtime truth source'],
    entryPoints: ['src/cli/commands/init.ts'],
    dataModels: ['Feature'],
    apiSurface: ['CLI: spec-first init'],
    risks: [],
    evidence: [],
  });
  writeFirstSteering(TEST_ROOT, {
    product: { overview: 'Runtime-backed first context', coreScenarios: ['bootstrap'], nonGoals: [], glossary: ['Feature'] },
    tech: { stack: ['TypeScript'], constraints: ['strict'], forbiddenPatterns: ['docs-only truth'] },
    structure: { modules: ['src/core/skill-runtime'], boundaries: ['src/cli/commands'], entryRules: ['read runtime truth first'] },
  });
  writeFirstConventions(TEST_ROOT, {
    api: { observedPatterns: ['spec-first init'], deviations: [], recommendedConvention: 'Keep CLI verbs stable.', evidence: ['src/cli/commands/init.ts'] },
    module: { observedPatterns: ['src/core/skill-runtime'], deviations: [], recommendedConvention: 'Keep runtime logic under src/core.', evidence: ['src/core/skill-runtime'] },
    testing: { observedPatterns: ['Vitest'], deviations: [], recommendedConvention: 'Use Vitest.', evidence: ['tests/unit'] },
    projectRules: { observedPatterns: ['runtime truth first'], deviations: [], recommendedConvention: 'Read runtime truth first.', evidence: ['.spec-first/runtime/first'] },
  });
  writeFirstCriticalFlows(TEST_ROOT, [
    {
      flowId: 'flow-cli-entry',
      name: 'CLI Entry Flow',
      entryPoints: ['src/cli/commands/init.ts'],
      coreModules: ['src/core/skill-runtime'],
      invariants: ['runtime truth first'],
      verificationHooks: ['pnpm vitest'],
    },
  ]);
  writeFirstEntryGuide(TEST_ROOT, [
    {
      taskCategory: 'runtime-extension',
      readFirst: ['.spec-first/runtime/first/summary.json'],
      thenRead: ['src/core/skill-runtime/first-runtime-store.ts'],
      avoidEntry: ['docs/first/README.md'],
      relatedFlows: ['flow-cli-entry'],
    },
  ]);
  writeFirstApiContracts(TEST_ROOT, {
    interfaces: [
      {
        interfaceType: 'cli-command',
        name: 'spec-first init',
        path: 'spec-first init',
        method: 'run',
        handler: 'src/cli/commands/init.ts',
        request: [],
        response: ['bootstrap'],
        auth: [],
        errors: [],
        evidence: ['src/cli/commands/init.ts'],
      },
    ],
    integrationPoints: ['src/cli/commands/init.ts'],
    notes: [],
  });
  writeFirstStructureOverview(TEST_ROOT, {
    topology: ['cli -> runtime'],
    modules: [
      {
        name: 'skill-runtime',
        purpose: 'runtime truth source',
        keyPaths: ['src/core/skill-runtime'],
        entryPoints: ['src/cli/commands/init.ts'],
        dependencies: [],
      },
    ],
    readingOrder: ['src/cli/commands/init.ts', 'src/core/skill-runtime'],
    evidence: [],
  });
  writeFirstDomainModel(TEST_ROOT, {
    entities: [
      {
        name: 'Feature',
        kind: 'concept',
        description: 'feature',
        invariants: ['runtime truth first'],
        relationships: [],
        evidence: [],
      },
    ],
    glossary: ['Feature'],
    evidence: [],
  });
  writeFirstDatabaseSchema(TEST_ROOT, {
    status: 'not_applicable',
    tables: [],
    risks: [],
    evidence: [],
  });
  writeFirstRuntimeIndex(TEST_ROOT, {
    version: '1.0.0',
    lastRun: '2026-03-08T12:00:00.000Z',
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

describe('dispatcher first runtime notice', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
    seedCanonicalRuntime();
    refreshFirstDocsFromRuntime(TEST_ROOT);
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('builds notice from runtime truth source without docs/first dependency leakage', () => {
    const notice = getFirstRuntimeNotice(TEST_ROOT);

    expect(notice).toContain('first-runtime-context');
    expect(notice).toContain('summary.json');
    expect(notice).toContain('api-contracts.json');
    expect(notice).toContain('spec-first');
  });

  it('builds orchestrate notice from current feature background guidance', () => {
    mkdirSync(join(TEST_ROOT, '.spec-first'), { recursive: true });
    writeFileSync(join(TEST_ROOT, '.spec-first', 'current'), 'FSREQ-20260308-AUTH-001\n', 'utf-8');
    mkdirSync(join(TEST_ROOT, 'specs', 'FSREQ-20260308-AUTH-001'), { recursive: true });
    writeFileSync(
      join(TEST_ROOT, 'specs', 'FSREQ-20260308-AUTH-001', 'stage-state.json'),
      JSON.stringify({
        featureId: 'FSREQ-20260308-AUTH-001',
        currentStage: '02_design',
        history: [],
        terminal: false,
        mode: 'N',
        size: 'S',
        platforms: ['h5'],
        backgroundInputStatus: 'blind',
        createdAt: '2026-03-08T12:00:00.000Z',
        updatedAt: '2026-03-08T12:00:00.000Z',
      }),
      'utf-8'
    );
    writeFileSync(
      join(TEST_ROOT, 'specs', 'FSREQ-20260308-AUTH-001', 'task_plan.md'),
      '# Task Plan\n\n- [parallel] TASK-AUTH-001 风险改造\n',
      'utf-8'
    );

    const notice = getOrchestrateRuntimeNotice(TEST_ROOT);

    expect(notice).toContain('orchestrate-runtime-context');
    expect(notice).toContain('project_name: spec-first');
    expect(notice).toContain('critical_flows: CLI Entry Flow');
    expect(notice).toContain('entry_categories: runtime-extension');
    expect(notice).toContain('api_interfaces: spec-first init');
  });
});
