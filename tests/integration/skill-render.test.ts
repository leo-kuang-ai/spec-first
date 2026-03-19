import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ExitCode } from '../../src/shared/types.js';
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

const TMP = join(import.meta.dirname, '../fixtures/.tmp-skill-render');
const FEATURE_ID = 'FSREQ-20260312-FIRST-001';
const EXPLICIT_FEATURE_ID = 'FSREQ-20260312-FIRST-002';

function healthyEntry(path: string) {
  return {
    path,
    fileHash: path,
    lastUpdated: '2026-03-12T10:00:00.000Z',
    healthy: true,
  };
}

function seedCanonicalRuntime(): void {
  writeFirstRuntimeSummary(TMP, {
    generatedAt: '2026-03-12T10:00:00.000Z',
    mode: 'deep',
    project: { name: 'spec-first', platformType: 'backend', overview: 'skill render test' },
    techStack: ['language: TypeScript'],
    modules: ['src/core/skill-runtime'],
    capabilities: ['runtime truth source'],
    entryPoints: ['src/cli/index.ts'],
    dataModels: ['Feature'],
    apiSurface: ['CLI: spec-first'],
    risks: [],
    evidence: ['src/cli/index.ts'],
  });
  writeFirstSteering(TMP, {
    product: { overview: 'skill render test', coreScenarios: ['bootstrap'], nonGoals: [], glossary: ['Feature'] },
    tech: { stack: ['language: TypeScript'], constraints: ['backend'], forbiddenPatterns: ['docs-only truth'] },
    structure: { modules: ['src/core/skill-runtime'], boundaries: ['src/cli/index.ts'], entryRules: ['read runtime truth first'] },
  });
  writeFirstConventions(TMP, {
    api: { observedPatterns: ['CLI: spec-first'], deviations: [], recommendedConvention: 'stable CLI', evidence: ['src/cli/index.ts'] },
    module: { observedPatterns: ['src/core/skill-runtime'], deviations: [], recommendedConvention: 'runtime under src/core', evidence: ['src/core/skill-runtime'] },
    testing: { observedPatterns: ['Vitest'], deviations: [], recommendedConvention: 'use Vitest', evidence: ['tests/unit'] },
    projectRules: { observedPatterns: ['runtime truth first'], deviations: [], recommendedConvention: 'runtime first', evidence: ['.spec-first/runtime/first'] },
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
      readFirst: ['.spec-first/runtime/first/summary.json'],
      thenRead: ['src/core/skill-runtime/first-runtime-store.ts'],
      avoidEntry: ['docs/first/summary.md'],
      relatedFlows: ['flow-cli-entry'],
    },
  ]);
  writeFirstApiContracts(TMP, { interfaces: [], integrationPoints: ['src/cli/index.ts'], notes: [] });
  writeFirstStructureOverview(TMP, {
    topology: ['entry -> runtime'],
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
        description: 'feature',
        invariants: ['runtime truth first'],
        relationships: [],
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
    lastRun: '2026-03-12T10:00:00.000Z',
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
  mkdirSync(join(TMP, 'skills', 'spec-first', '01-spec'), { recursive: true });
  mkdirSync(join(TMP, 'skills', 'spec-first', '10-plan'), { recursive: true });
  mkdirSync(join(TMP, 'specs', FEATURE_ID), { recursive: true });
  mkdirSync(join(TMP, 'specs', EXPLICIT_FEATURE_ID), { recursive: true });
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  seedCanonicalRuntime();

  writeFileSync(join(TMP, '.spec-first', 'current'), `${FEATURE_ID}\n`, 'utf-8');
  writeFileSync(join(TMP, 'skills', 'spec-first', '01-spec', 'SKILL.md'), '# Spec Skill\n\nOriginal spec body.\n', 'utf-8');
  writeFileSync(join(TMP, 'skills', 'spec-first', '10-plan', 'SKILL.md'), '# Plan Skill\n\nOriginal plan body.\n', 'utf-8');
  writeFileSync(
    join(TMP, 'specs', FEATURE_ID, 'stage-state.json'),
    JSON.stringify({
      featureId: FEATURE_ID,
      currentStage: '01_specify',
      history: [],
      terminal: false,
      mode: 'N',
      size: 'S',
      platforms: ['h5'],
      createdAt: '2026-03-12T10:00:00.000Z',
      updatedAt: '2026-03-12T10:00:00.000Z',
    }),
    'utf-8'
  );
  writeFileSync(
    join(TMP, 'specs', EXPLICIT_FEATURE_ID, 'stage-state.json'),
    JSON.stringify({
      featureId: EXPLICIT_FEATURE_ID,
      currentStage: '02_design',
      history: [],
      terminal: false,
      mode: 'N',
      size: 'S',
      platforms: ['h5'],
      backgroundInputStatus: 'degraded',
      createdAt: '2026-03-12T11:00:00.000Z',
      updatedAt: '2026-03-12T11:00:00.000Z',
    }),
    'utf-8'
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(TMP, { recursive: true, force: true });
});

describe('handleSkill render', () => {
  it('renders dynamic skill content for spec', async () => {
    const { handleSkill } = await import('../../src/cli/commands/skill.js');
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process, 'cwd').mockReturnValue(TMP);

    const exitCode = handleSkill(['render', 'spec', '--feature', FEATURE_ID]);

    expect(exitCode).toBe(ExitCode.SUCCESS);
    const rendered = stdout.mock.calls[0]?.[0];
    expect(rendered).toContain('<!-- spec-runtime-context -->');
    expect(rendered).toContain('specViewSummary: spec-first');
    expect(rendered).toContain('# Spec Skill');
  });

  it('prefers --feature over .spec-first/current when rendering plan context', async () => {
    const { handleSkill } = await import('../../src/cli/commands/skill.js');
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process, 'cwd').mockReturnValue(TMP);

    const exitCode = handleSkill(['render', 'plan', '--feature', EXPLICIT_FEATURE_ID]);

    expect(exitCode).toBe(ExitCode.SUCCESS);
    const rendered = stdout.mock.calls[0]?.[0];
    expect(rendered).toContain('<!-- plan-runtime-context -->');
    expect(rendered).toContain('project_name: spec-first');
  });
});
