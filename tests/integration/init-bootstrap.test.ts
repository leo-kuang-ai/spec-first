import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleInit } from '../../src/cli/commands/init.js';
import { resolveHostAdapterStatuses } from '../../src/core/host-adapters/registry.js';
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

const TMP = join(import.meta.dirname, '../fixtures/.tmp-init-bootstrap');
const originalCwd = process.cwd;
const originalEnv = {
  HOME: process.env.HOME,
  AGENTS_HOME: process.env.AGENTS_HOME,
  CODEX_HOME: process.env.CODEX_HOME,
  CODEX_SKILLS_DIR: process.env.CODEX_SKILLS_DIR,
  SPEC_FIRST_SKILLS_DIR: process.env.SPEC_FIRST_SKILLS_DIR,
  CLAUDE_HOME: process.env.CLAUDE_HOME,
  CLAUDE_SKILLS_DIR: process.env.CLAUDE_SKILLS_DIR,
  CLAUDE_COMMANDS_DIR: process.env.CLAUDE_COMMANDS_DIR,
  CLAUDE_CODE_CONFIG_DIR: process.env.CLAUDE_CODE_CONFIG_DIR,
  CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR,
  GEMINI_HOME: process.env.GEMINI_HOME,
  GEMINI_CONFIG_DIR: process.env.GEMINI_CONFIG_DIR,
  CURSOR_HOME: process.env.CURSOR_HOME,
  CURSOR_CONFIG_DIR: process.env.CURSOR_CONFIG_DIR,
  VITEST: process.env.VITEST,
  NODE_ENV: process.env.NODE_ENV,
};

function healthyEntry(path: string) {
  return {
    path,
    fileHash: path,
    lastUpdated: '2026-03-15T00:00:00.000Z',
    healthy: true,
  };
}

function seedRuntimeFirst(projectRoot: string): void {
  writeFirstRuntimeSummary(projectRoot, {
    generatedAt: '2026-03-15T00:00:00.000Z',
    mode: 'deep',
    project: { name: 'spec-first', platformType: 'backend', overview: 'bootstrap integration' },
    modules: ['src/cli/commands/init.ts'],
    capabilities: ['bootstrap'],
    entryPoints: ['spec-first init'],
    dataModels: ['Feature'],
    apiSurface: ['spec-first init --bootstrap'],
    risks: [],
    evidence: [],
  });
  writeFirstSteering(projectRoot, {
    product: { overview: 'bootstrap integration', coreScenarios: ['bootstrap'], nonGoals: [], glossary: ['Feature'] },
    tech: { stack: ['TypeScript'], constraints: ['backend'], forbiddenPatterns: ['docs-only truth'] },
    structure: { modules: ['src/cli/commands/init.ts'], boundaries: ['init'], entryRules: ['read runtime truth first'] },
  });
  writeFirstConventions(projectRoot, {
    api: { observedPatterns: ['spec-first init'], deviations: [], recommendedConvention: 'stable CLI', evidence: ['src/cli/commands/init.ts'] },
    module: { observedPatterns: ['src/cli/commands/init.ts'], deviations: [], recommendedConvention: 'keep CLI stable', evidence: ['src/cli/commands/init.ts'] },
    testing: { observedPatterns: ['Vitest'], deviations: [], recommendedConvention: 'use Vitest', evidence: ['tests/integration'] },
    projectRules: { observedPatterns: ['runtime truth first'], deviations: [], recommendedConvention: 'runtime first', evidence: ['.spec-first/runtime/first'] },
  });
  writeFirstCriticalFlows(projectRoot, [
    {
      flowId: 'flow-cli-entry',
      name: 'CLI Entry Flow',
      entryPoints: ['src/cli/commands/init.ts'],
      coreModules: ['src/cli/commands/init.ts'],
      invariants: ['runtime truth first'],
      verificationHooks: ['pnpm vitest'],
    },
  ]);
  writeFirstEntryGuide(projectRoot, [
    {
      taskCategory: 'runtime-extension',
      readFirst: ['.spec-first/runtime/first/summary.json'],
      thenRead: ['src/cli/commands/init.ts'],
      avoidEntry: ['docs/first/summary.md'],
      relatedFlows: ['flow-cli-entry'],
    },
  ]);
  writeFirstApiContracts(projectRoot, { interfaces: [], integrationPoints: ['src/cli/commands/init.ts'], notes: [] });
  writeFirstStructureOverview(projectRoot, {
    topology: ['cli -> runtime'],
    modules: [
      {
        name: 'init',
        purpose: 'bootstrap',
        keyPaths: ['src/cli/commands/init.ts'],
        entryPoints: ['src/cli/commands/init.ts'],
        dependencies: [],
      },
    ],
    readingOrder: ['src/cli/commands/init.ts'],
    evidence: [],
  });
  writeFirstDomainModel(projectRoot, {
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
  writeFirstDatabaseSchema(projectRoot, {
    status: 'not_applicable',
    tables: [],
    risks: [],
    evidence: [],
  });
  writeFirstRuntimeIndex(projectRoot, {
    version: '1.0.0',
    lastRun: '2026-03-15T00:00:00.000Z',
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
  mkdirSync(join(TMP, '.git'), { recursive: true });
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), 'platform: h5\n', 'utf-8');
  mkdirSync(join(TMP, 'agents-home', 'skills', 'find-skills'), { recursive: true });
  mkdirSync(join(TMP, 'agents-home', 'skills', 'skill-creator'), { recursive: true });
  writeFileSync(join(TMP, 'agents-home', 'skills', 'find-skills', 'SKILL.md'), '# find-skills\n', 'utf-8');
  writeFileSync(join(TMP, 'agents-home', 'skills', 'skill-creator', 'SKILL.md'), '# skill-creator\n', 'utf-8');
  seedRuntimeFirst(TMP);

  process.env.HOME = join(TMP, 'home');
  process.env.AGENTS_HOME = join(TMP, 'agents-home');
  process.env.CODEX_HOME = join(TMP, 'home', '.codex');
  process.env.CODEX_SKILLS_DIR = join(TMP, 'home', '.codex', 'skills');
  process.env.SPEC_FIRST_SKILLS_DIR = join(TMP, 'home', '.spec-first', 'skills');
  process.env.CLAUDE_HOME = join(TMP, 'home', '.claude');
  process.env.CLAUDE_SKILLS_DIR = join(TMP, 'home', '.claude', 'skills');
  process.env.CLAUDE_COMMANDS_DIR = join(TMP, 'home', '.claude', 'commands');
  process.env.CLAUDE_CODE_CONFIG_DIR = join(TMP, 'home', '.config', 'claude-code');
  process.env.CLAUDE_CONFIG_DIR = join(TMP, 'home', '.config', 'claude-code');
  process.env.GEMINI_HOME = join(TMP, 'home', '.gemini');
  process.env.GEMINI_CONFIG_DIR = join(TMP, 'home', '.gemini', 'config');
  process.env.CURSOR_HOME = join(TMP, 'home', '.cursor');
  process.env.CURSOR_CONFIG_DIR = join(TMP, 'home', '.cursor', 'config');
  delete process.env.VITEST;
  process.env.NODE_ENV = 'development';
  process.cwd = () => TMP;
});

afterEach(() => {
  process.cwd = originalCwd;
  rmSync(TMP, { recursive: true, force: true });
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('init bootstrap integration', () => {
  it('should initialize feature and install baseline host capabilities', async () => {
    const code = await handleInit([
      '--feat',
      'AUTH',
      '--mode',
      'N',
      '--size',
      'S',
      '--platforms',
      'h5',
      '--bootstrap',
    ]);

    expect(code).toBe(0);
    const hostStatuses = resolveHostAdapterStatuses();
    const claude = hostStatuses.find((entry) => entry.id === 'claude');
    const codex = hostStatuses.find((entry) => entry.id === 'codex');
    expect(claude).toBeDefined();
    expect(codex).toBeDefined();
  });

  it('should initialize a new local project without git and bootstrap layer2 templates on demand', async () => {
    rmSync(join(TMP, '.git'), { recursive: true, force: true });
    rmSync(join(TMP, '.spec-first'), { recursive: true, force: true });

    const code = await handleInit([
      '--feat',
      'AUTH',
      '--mode',
      'N',
      '--size',
      'S',
      '--platforms',
      'h5',
    ]);

    expect(code).toBe(0);
    const configYaml = readFileSync(join(TMP, '.spec-first', 'meta', 'config.yaml'), 'utf-8');
    expect(configYaml).toContain('catchup:');
    expect(configYaml).toContain('runtime:');
    expect(readFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), 'utf-8')).toContain('platform: h5');
    expect(readdirSync(join(TMP, 'specs')).some((name) => name.startsWith('FSREQ-'))).toBe(true);
  });

  it('should bootstrap missing layer2 templates and continue feature init', async () => {
    rmSync(join(TMP, '.spec-first', 'layer2'), { recursive: true, force: true });
    mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
      'baselineSkipped: true\nversion: 1.0\nproject: bootstrap\n',
      'utf-8'
    );

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const code = await handleInit([
        '--feat',
        'AUTH',
        '--mode',
        'N',
        '--size',
        'S',
        '--platforms',
        'h5',
      ]);

      expect(code).toBe(0);
      const output = [...logSpy.mock.calls.flat(), ...errorSpy.mock.calls.flat()].join('\n');
      expect(output).toContain('已创建平台模板');
      expect(output).toContain('Feature 初始化完成');
      expect(readFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), 'utf-8')).toContain('platform: h5');
    } finally {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  it('should stop early for brownfield baseline when layer2 templates are missing', async () => {
    rmSync(join(TMP, '.spec-first', 'layer2'), { recursive: true, force: true });
    mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
      'baselineSkipped: false\nversion: 1.0\nproject: brownfield\n',
      'utf-8'
    );
    mkdirSync(join(TMP, 'src', 'brownfield'), { recursive: true });
    for (let i = 1; i <= 55; i += 1) {
      writeFileSync(join(TMP, 'src', 'brownfield', `file-${i}.ts`), 'export const value = 1;\n', 'utf-8');
    }

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const code = await handleInit([]);

      expect(code).toBe(2);
      const output = [...logSpy.mock.calls.flat(), ...errorSpy.mock.calls.flat()].join('\n');
      expect(output).toContain('spec-first skill render init');
      expect(output).toContain('平台模板属于 Skill/工作流决策');
      expect(output).not.toContain('是否创建基线 Feature');
    } finally {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});
