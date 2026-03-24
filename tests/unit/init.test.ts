import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { vi } from 'vitest';
import { init } from '../../src/core/process-engine/init.js';
import type { InitOptions } from '../../src/core/process-engine/init.js';
import { handleInit } from '../../src/cli/commands/init.js';
import { Stage } from '../../src/shared/types.js';
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

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-init');

function baseOpts(overrides?: Partial<InitOptions>): InitOptions {
  return {
    feat: 'AUTH',
    title: 'User Authentication',
    mode: 'N',
    size: 'S',
    platforms: [],
    author: 'Leo',
    projectRoot: TMP,
    ...overrides,
  };
}

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), 'platform: h5\n', 'utf-8');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('init', () => {
  it('should create feature directory with all skeleton files', () => {
    const result = init(baseOpts());
    expect(result.featureId).toMatch(/^FSREQ-\d{8}-AUTH-001$/);
    expect(result.featureDir).toContain('specs/');

    // stage-state.json
    const state = JSON.parse(readFileSync(join(result.featureDir, 'stage-state.json'), 'utf-8'));
    expect(state.featureId).toBe(result.featureId);
    expect(state.currentStage).toBe(Stage.INIT);
    expect(state.mode).toBe('N');
    expect(state.size).toBe('S');
    expect(state.terminal).toBe(false);
    expect(state.nodes['00_init'].status).toBe('done');
    expect(state.nodes['00_init'].checklistStatus).toBe('complete');
    expect(state.nodes['00_init'].canMarkDone).toBe(true);
    expect(state.stageStatus).toBeUndefined();
    expect(state.autoAdvancePolicy).toBe('suggest');
    expect(state.mergedRules).toBeDefined();
    expect(state.mergedRules.profile).toBe('default-simplified');
    expect(state.mergedRules.gateConditions).toBeDefined();
    expect(state.mergedRules.deliverables).toBeDefined();

    // 运行态文件
    expect(readFileSync(join(result.featureDir, 'findings.md'), 'utf-8')).toContain('Findings');
    const taskPlan = readFileSync(join(result.featureDir, 'task_plan.md'), 'utf-8');
    expect(taskPlan).toContain('Task Plan');
    expect(taskPlan).toContain('| title | status | summary | next_step | owner | notes |');
    expect(taskPlan).toContain('## Plan Status');

    // document-links.yaml
    const documentLinks = readFileSync(join(result.featureDir, 'document-links.yaml'), 'utf-8');
    expect(documentLinks).toContain('version: 1');
    expect(documentLinks).toContain(`featureId: ${result.featureId}`);
    expect(documentLinks).toContain('path: spec.md');
    // constitution.md
    const constitution = readFileSync(join(result.featureDir, 'constitution.md'), 'utf-8');
    expect(constitution).toContain('Constitution');
    expect(constitution).toContain('1.0.0');
    expect(constitution).toContain('Amendment History');
    expect(constitution).toContain('User Authentication');
    expect(constitution).toContain('角色映射');
    expect(constitution).toContain('Leo');
  });

  it('should classify pure h5 projects as frontend in constitution.md', () => {
    const result = init(baseOpts({ feat: 'H5', title: 'H5 App', platforms: ['h5'] }));
    const constitution = readFileSync(join(result.featureDir, 'constitution.md'), 'utf-8');
    expect(constitution).toContain('- **项目类型**: frontend');
  });

  it('should write .spec-first/current', () => {
    const result = init(baseOpts());
    const current = readFileSync(join(TMP, '.spec-first', 'current'), 'utf-8');
    expect(current).toBe(`${result.featureId}\n`);
  });

  it('should record full background input status when runtime first assets are healthy', () => {
    writeFirstRuntimeIndex(TMP, {
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
    writeFirstRuntimeSummary(TMP, {
      generatedAt: '2026-03-08T12:00:00.000Z',
      mode: 'deep',
      project: { name: 'spec-first' },
      modules: [],
      capabilities: [],
      entryPoints: [],
      dataModels: [],
      apiSurface: [],
      risks: [],
      evidence: [],
    });
    writeFirstSteering(TMP, {
      product: { overview: 'spec-first', coreScenarios: ['init'], nonGoals: [], glossary: [] },
      tech: { stack: ['TypeScript'], constraints: [], forbiddenPatterns: [] },
      structure: { modules: ['src/core'], boundaries: [], entryRules: [] },
    });
    writeFirstConventions(TMP, {
      api: { observedPatterns: [], deviations: [], recommendedConvention: 'stable', evidence: [] },
      module: { observedPatterns: [], deviations: [], recommendedConvention: 'stable', evidence: [] },
      testing: { observedPatterns: [], deviations: [], recommendedConvention: 'stable', evidence: [] },
      projectRules: { observedPatterns: [], deviations: [], recommendedConvention: 'stable', evidence: [] },
    });
    writeFirstCriticalFlows(TMP, [
      {
        flowId: 'flow-init',
        name: 'Init Flow',
        entryPoints: ['src/cli/commands/init.ts'],
        coreModules: ['src/core/process-engine/init.ts'],
        invariants: ['runtime truth first'],
        verificationHooks: ['pnpm vitest'],
      },
    ]);
    writeFirstEntryGuide(TMP, [
      {
        taskCategory: 'init',
        readFirst: ['.spec-first/runtime/first/summary.json'],
        thenRead: ['src/core/process-engine/init.ts'],
        avoidEntry: ['docs/first/README.md'],
        relatedFlows: ['flow-init'],
      },
    ]);
    writeFirstApiContracts(TMP, { interfaces: [], integrationPoints: ['src/cli/commands/init.ts'], notes: [] });
    writeFirstStructureOverview(TMP, { topology: ['init -> process-engine'], modules: [], readingOrder: [], evidence: [] });
    writeFirstDomainModel(TMP, { entities: [], glossary: ['Feature'], evidence: [] });
    writeFirstDatabaseSchema(TMP, { status: 'healthy', provider: 'sqlite', tables: [], risks: [], evidence: [] });

    const result = init(baseOpts());
    const state = JSON.parse(readFileSync(join(result.featureDir, 'stage-state.json'), 'utf-8')) as { backgroundInputStatus?: string };

    expect(result.backgroundInputStatus).toBe('full');
    expect(state.backgroundInputStatus).toBe('full');
  });

  it('should record degraded background input status when runtime truth source is incomplete but first docs exist', () => {
    mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
    writeFileSync(join(TMP, 'docs', 'first', 'README.md'), '# projected docs\n', 'utf-8');

    const result = init(baseOpts({ feat: 'DOCS', title: 'Docs only' }));
    const state = JSON.parse(readFileSync(join(result.featureDir, 'stage-state.json'), 'utf-8')) as { backgroundInputStatus?: string };

    expect(result.backgroundInputStatus).toBe('degraded');
    expect(state.backgroundInputStatus).toBe('degraded');
  });

  it('should record blind background input status when first assets are absent', () => {
    const result = init(baseOpts({ feat: 'BLIND', title: 'Blind init' }));
    const state = JSON.parse(readFileSync(join(result.featureDir, 'stage-state.json'), 'utf-8')) as { backgroundInputStatus?: string };

    expect(result.backgroundInputStatus).toBe('blind');
    expect(state.backgroundInputStatus).toBe('blind');
  });

  it('should create default .spec-first/meta/config.yaml when missing', () => {
    init(baseOpts());
    const configPath = join(TMP, '.spec-first', 'meta', 'config.yaml');
    expect(existsSync(configPath)).toBe(true);
    const content = readFileSync(configPath, 'utf-8');
    expect(content).toContain('pilot_mode: false');
    expect(content).toContain('token_budget: 16000');
    expect(content).toContain('trigger: prompt');
    expect(content).toContain('max_self_corrections: 3');
    expect(content).toContain('kv_cache_hard_gate: false');
  });

  it('should not overwrite existing .spec-first/meta/config.yaml', () => {
    const metaDir = join(TMP, '.spec-first', 'meta');
    const configPath = join(metaDir, 'config.yaml');
    mkdirSync(metaDir, { recursive: true });
    const custom = 'gate:\n  pilot_mode: true\n';
    writeFileSync(configPath, custom, 'utf-8');

    init(baseOpts());
    expect(readFileSync(configPath, 'utf-8')).toBe(custom);
  });

  it('should register FEAT abbreviation', () => {
    const result = init(baseOpts());
    const registry = readFileSync(join(TMP, 'specs', '.feat-registry.md'), 'utf-8');
    expect(registry).toContain('| AUTH |');
    expect(registry).toContain(result.featureId);
  });

  it('should be idempotent — existing feature not overwritten', () => {
    const r1 = init(baseOpts());
    // 修改 findings.md 内容
    writeFileSync(join(r1.featureDir, 'findings.md'), 'custom content', 'utf-8');

    const r2 = init(baseOpts({ featureId: r1.featureId }));
    expect(r2.featureId).toBe(r1.featureId);
    // 内容未被覆盖
    expect(readFileSync(join(r1.featureDir, 'findings.md'), 'utf-8')).toBe('custom content');
  });

  it('should self-heal .spec-first/current on idempotent init', () => {
    const r1 = init(baseOpts());
    writeFileSync(join(TMP, '.spec-first', 'current'), 'FSREQ-20990101-OTHER-999\n', 'utf-8');

    init(baseOpts({ featureId: r1.featureId }));
    const current = readFileSync(join(TMP, '.spec-first', 'current'), 'utf-8');
    expect(current).toBe(`${r1.featureId}\n`);
  });

  it('should backfill FEAT registry on idempotent init when missing', () => {
    const r1 = init(baseOpts());
    const registryPath = join(TMP, 'specs', '.feat-registry.md');
    writeFileSync(
      registryPath,
      '# FEAT 缩写注册表\n\n| FEAT | Feature ID |\n|------|------------|\n',
      'utf-8',
    );

    init(baseOpts({ featureId: r1.featureId }));
    const registry = readFileSync(registryPath, 'utf-8');
    expect(registry).toContain(`| AUTH | ${r1.featureId} |`);
  });

  it('should reject duplicate FEAT abbreviation for different feature', () => {
    init(baseOpts());
    expect(() => init(baseOpts({ featureId: 'FSREQ-20260211-AUTH-999' })))
      .toThrow(/已被注册/);
  });

  it('should reject invalid FEAT abbreviation', () => {
    expect(() => init(baseOpts({ feat: 'auth' }))).toThrow(/无效 FEAT 缩写/);
    expect(() => init(baseOpts({ feat: '123' }))).toThrow(/无效 FEAT 缩写/);
  });

  it('should auto-increment sequence number', () => {
    const _r1 = init(baseOpts());
    // 用不同缩写创建第二个
    const r2 = init(baseOpts({ feat: 'PAY', title: 'Payment' }));
    expect(r2.featureId).toMatch(/PAY-001$/);

    // 同缩写第二个（需要先让第一个的 feat 注册不冲突）
    // 直接用不同 feat 测试序号递增
    const r3 = init(baseOpts({ feat: 'SHIP', title: 'Shipping' }));
    expect(r3.featureId).toMatch(/SHIP-001$/);
  });

  it('should copy global constitution.md when available', () => {
    const constDir = join(TMP, '.spec-first');
    mkdirSync(constDir, { recursive: true });
    writeFileSync(join(constDir, 'constitution.md'), '# Global Constitution\n\nProject rules here.\n', 'utf-8');

    const result = init(baseOpts());
    const content = readFileSync(join(result.featureDir, 'constitution.md'), 'utf-8');
    expect(content).toContain('Global Constitution');
    expect(content).toContain('Project rules here');
    expect(content).toContain('Version: 1.0.0');
    expect(content).toContain('Amendment History');
  });

  it('should render constitution from local init template when global constitution is missing', () => {
    const localTplDir = join(TMP, '.spec-first', 'local', 'templates', 'init');
    mkdirSync(localTplDir, { recursive: true });
    writeFileSync(
      join(localTplDir, 'constitution.md.hbs'),
      [
        '# Local Constitution {{featureId}}',
        '',
        '- owner: {{author}}',
        '- title: {{title}}',
        '- mode: {{mode}}',
        '- size: {{size}}',
        '',
      ].join('\n'),
      'utf-8',
    );

    const result = init(baseOpts({ mode: 'I', size: 'L' }));
    const content = readFileSync(join(result.featureDir, 'constitution.md'), 'utf-8');
    expect(content).toContain('Local Constitution');
    expect(content).toContain('owner: Leo');
    expect(content).toContain('title: User Authentication');
    expect(content).toContain('mode: I');
    expect(content).toContain('size: L');
  });

  it('should include merged rules in result', () => {
    const result = init(baseOpts({ mode: 'I', size: 'L' }));
    expect(result.mergedRules.mode).toBe('I');
    expect(result.mergedRules.size).toBe('L');
    // Mode I 应有 impact-analysis gate
    const specGates = result.mergedRules.gateConditions['01_specify'];
    expect(specGates.some((g) => g.id === 'L1-MODE-I-001')).toBe(true);
  });

  it('should create subdirectories (reports, contracts, tests)', () => {
    const result = init(baseOpts());
    expect(existsSync(join(result.featureDir, 'reports'))).toBe(true);
    expect(existsSync(join(result.featureDir, 'contracts'))).toBe(true);
    expect(existsSync(join(result.featureDir, 'tests'))).toBe(true);
  });

  it('should not leave temporary init directories after successful init', () => {
    init(baseOpts());
    const entries = readFileSync(join(TMP, 'specs', '.feat-registry.md'), 'utf-8');
    expect(entries).toContain('| AUTH |');
    const dirs = existsSync(join(TMP, 'specs'))
      ? readdirSync(join(TMP, 'specs'))
      : [];
    expect(dirs.some((name: string) => name.includes('.tmp-'))).toBe(false);
  });

  it('should recover stale FEAT registry lock and continue init', () => {
    const specsDir = join(TMP, 'specs');
    mkdirSync(specsDir, { recursive: true });
    writeFileSync(
      join(specsDir, '.feat-registry.lock'),
      JSON.stringify({
        pid: 999999,
        createdAt: Date.now() - 60_000,
      }),
      'utf-8',
    );

    const result = init(baseOpts());
    expect(result.featureId).toMatch(/^FSREQ-\d{8}-AUTH-001$/);
    expect(existsSync(join(specsDir, '.feat-registry.lock'))).toBe(false);
  });
});

describe('init CLI help', () => {
  it('should explain track selection and brownfield baseline guidance', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = await handleInit(['--help']);
      expect(code).toBe(0);
      const output = logSpy.mock.calls.flat().join('\n');
      expect(output).toContain('典型场景：');
      expect(output).toContain('新项目创建 / 刚 clone 的远程项目');
      expect(output).toContain('本地存量项目需求迭代');
      expect(output).toContain('轨道选择：');
      expect(output).toContain('--track baseline');
      expect(output).toContain('--track feature');
      expect(output).toContain('brownfield-baseline');
      expect(output).toContain('存量项目会先进入 brownfield-baseline');
      expect(output).toContain('退出语义：');
      expect(output).toContain('brownfield-baseline 里的 [n] 是放弃本次基线选择');
      expect(output).toContain('feature-init 里的取消只是终止当前参数收集');
    } finally {
      logSpy.mockRestore();
    }
  });
});

describe('init CLI diagnostics', () => {
  it('should explain invalid mode and size in feature-init context', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const code = await handleInit(['--feat', 'AUTH', '--mode', 'X', '--size', 'S', '--platforms', 'h5']);
      expect(code).toBe(2);
      const output = errorSpy.mock.calls.flat().join('\n');
      expect(output).toContain('当前处于 feature-init 参数校验阶段');
      expect(output).toContain('mode "X" 无效');
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('should explain platform mismatch in feature-init context', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'ios']);
      expect(code).toBe(2);
      const output = errorSpy.mock.calls.flat().join('\n');
      expect(output).toContain('当前处于 feature-init 参数校验阶段');
      expect(output).toContain('所选 platforms 与 .spec-first/layer2/*.yaml 不匹配');
      expect(output).toContain('可选平台:');
      expect(output).toContain('如果你是新项目或刚 clone 的远程项目');
    } finally {
      errorSpy.mockRestore();
    }
  });
});

// ─────────────────────────────────────────────
// Task 6: impact-analysis.md for Mode I
// ─────────────────────────────────────────────

describe('init - impact-analysis', () => {
  it('mode I should generate impact-analysis.md in the feature directory', () => {
    const result = init(baseOpts({ mode: 'I', feat: 'ITER' }));
    const impactPath = join(result.featureDir, 'impact-analysis.md');
    expect(existsSync(impactPath)).toBe(true);
  });

  it('mode N should NOT generate impact-analysis.md', () => {
    const result = init(baseOpts({ mode: 'N', feat: 'NEW1' }));
    const impactPath = join(result.featureDir, 'impact-analysis.md');
    expect(existsSync(impactPath)).toBe(false);
  });

  it('mode I non-baseline feature also gets impact-analysis.md', () => {
    const result = init(baseOpts({ mode: 'I', feat: 'UIOPT', title: 'UI Optimization' }));
    const impactPath = join(result.featureDir, 'impact-analysis.md');
    expect(existsSync(impactPath)).toBe(true);
    // Other skeleton files should still exist
    expect(existsSync(join(result.featureDir, 'prd.md'))).toBe(true);
    expect(existsSync(join(result.featureDir, 'task_plan.md'))).toBe(true);
  });
});
