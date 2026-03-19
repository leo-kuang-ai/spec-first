import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { refreshFirstDocsFromRuntime } from '../../src/core/skill-runtime/first-doc-projection.js';
import { resolveSkillContext } from '../../src/core/skill-runtime/context-resolver.js';
import {
  writeFirstApiContracts,
  writeFirstConventions,
  writeFirstCriticalFlows,
  writeFirstDatabaseSchema,
  writeFirstDocsIndex,
  writeFirstDomainModel,
  writeFirstEntryGuide,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstSteering,
  writeFirstStructureOverview,
} from '../../src/core/skill-runtime/first-runtime-store.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-context-resolver');
const FEATURE_ID = 'FSREQ-20260312-FIRST-001';

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
    project: { name: 'spec-first', platformType: 'backend', overview: 'resolver test' },
    techStack: ['language: TypeScript'],
    modules: ['src/core/skill-runtime'],
    capabilities: ['runtime truth source'],
    entryPoints: ['src/cli/index.ts'],
    dataModels: ['Feature'],
    apiSurface: ['CLI: spec-first'],
    risks: ['docs drift'],
    evidence: ['src/cli/index.ts'],
  });
  writeFirstSteering(TMP, {
    product: { overview: 'resolver test', coreScenarios: ['bootstrap'], nonGoals: [], glossary: ['Feature'] },
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
    status: 'healthy',
    provider: 'sqlite',
    tables: [{ name: 'features', fields: ['id'], relations: [], evidence: ['schema.prisma'] }],
    risks: [],
    evidence: ['schema.prisma'],
  });
  writeFirstDocsIndex(TMP, {
    generatedAt: '2026-03-12T10:00:00.000Z',
    mode: 'deep',
    quickStart: [
      'docs/first/README.md',
      'docs/first/summary.md',
      'docs/first/entry-guide.md',
    ],
    entries: [
      {
        path: 'docs/first/README.md',
        title: '项目认知输出总览',
        purpose: '快速导航 runtime 与 docs 输出。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/index.json', '.spec-first/runtime/first/summary.json'],
        recommendedWhen: ['首次进入项目'],
        priority: 'primary',
      },
      {
        path: 'docs/first/summary.md',
        title: '项目摘要',
        purpose: '建立项目背景。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/summary.json'],
        recommendedWhen: ['需要建立项目认知'],
        priority: 'primary',
      },
      {
        path: 'docs/first/codebase-overview.md',
        title: '代码库总览',
        purpose: '了解代码库结构。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/structure-overview.json'],
        recommendedWhen: ['需要定位模块'],
        priority: 'secondary',
      },
    ],
    notes: ['docs/first 仅供阅读。'],
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
      status: 'healthy',
    },
    docsProjection: {},
    status: 'current',
  });
}

describe('resolveSkillContext', () => {
  beforeEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(join(TMP, 'specs', FEATURE_ID), { recursive: true });
  });

  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('returns runtime context when canonical runtime is healthy', () => {
    seedCanonicalRuntime();

    const result = resolveSkillContext(TMP, 'spec', FEATURE_ID);

    expect(result.source).toBe('runtime');
    expect(result.backgroundInputStatus).toBe('full');
    expect(result.requiredAssetNames).toEqual(['summary']);
    expect(result.optionalAssetNames).toEqual(['domain-model', 'conventions']);
    expect(result.contextSummary).toContain('spec-first');
    expect(result.docsIndex?.quickStart).toContain('docs/first/README.md');
    expect(result.optional.domainModel?.glossary).toContain('Feature');
  });

  it('falls back to docs context when runtime is incomplete but canonical docs exist', () => {
    seedCanonicalRuntime();
    writeFirstRuntimeIndex(TMP, {
      ...readIndex(),
      summary: {
        ...healthyEntry('.spec-first/runtime/first/summary.json'),
        healthy: false,
        issues: ['broken'],
      },
      status: 'stale',
      staleReason: 'summary unhealthy',
    });
    const docs = refreshFirstDocsFromRuntime(TMP);
    writeFirstRuntimeIndex(TMP, {
      ...readIndex(),
      summary: {
        ...healthyEntry('.spec-first/runtime/first/summary.json'),
        healthy: false,
        issues: ['broken'],
      },
      docsProjection: Object.fromEntries(
        docs.map((docPath) => [docPath, healthyEntry(docPath)])
      ),
      status: 'stale',
      staleReason: 'summary unhealthy',
    });

    const result = resolveSkillContext(TMP, 'design', FEATURE_ID);

    expect(result.source).toBe('docs');
    expect(result.contextSummary).toContain('architecture.md');
    expect(result.missingRequiredAssets).toEqual(['summary']);
    expect(result.fallback.warning).toContain('summary');
  });

  it('returns none when runtime and docs are unavailable', () => {
    const result = resolveSkillContext(TMP, 'plan', FEATURE_ID);

    expect(result.source).toBe('none');
    expect(result.backgroundInputStatus).toBe('blind');
    expect(result.missingAssets).toEqual([
      'summary',
      'steering',
      'conventions',
      'critical-flows',
      'entry-guide',
      'api-contracts',
      'structure-overview',
      'domain-model',
      'database-schema',
    ]);
  });
});

function readIndex() {
  return {
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
      status: 'healthy' as const,
    },
    docsProjection: {},
    status: 'current' as const,
  };
}
