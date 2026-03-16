import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { sha256Hex } from '../../src/shared/crypto-utils.js';
import {
  analyzeChanges,
  checkFirstUpdateContext,
  detectFirstRefreshScope,
  formatChangeAnalysis,
  formatHealthStatus,
  getAffectedArtifacts,
  type FirstUpdateContext,
} from '../../src/core/skill-runtime/first-change-detector.js';
import {
  getFirstRuntimeDir,
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
import type { FirstChangeMap, FirstConventions, FirstCriticalFlows, FirstEntryGuide, FirstRebootGuide, FirstRuntimeIndex, FirstRuntimeSummary, FirstRoleViews, FirstStageViews, FirstSteering } from '../../src/core/skill-runtime/first-runtime-types.js';

const TEST_DIR = join(import.meta.dirname, '../fixtures/first-change-detector');

const index: FirstRuntimeIndex = {
  version: '1.0.0',
  lastRun: '2026-03-08T12:00:00.000Z',
  mode: 'quick',
  summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'roles', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'stages', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  steering: { path: '.spec-first/runtime/first/steering.json', fileHash: 'steering', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  conventions: { path: '.spec-first/runtime/first/conventions.json', fileHash: 'conventions', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  criticalFlows: { path: '.spec-first/runtime/first/critical-flows.json', fileHash: 'critical-flows', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  changeMap: { path: '.spec-first/runtime/first/change-map.json', fileHash: 'change-map', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  entryGuide: { path: '.spec-first/runtime/first/entry-guide.json', fileHash: 'entry-guide', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  rebootGuide: { path: '.spec-first/runtime/first/reboot-guide.json', fileHash: 'reboot-guide', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
  docsProjection: {
    'docs/first/README.md': {
      path: 'docs/first/README.md',
      fileHash: 'readme-doc',
      lastUpdated: '2026-03-08T12:00:00.000Z',
      healthy: true,
    },
    'docs/first/summary.md': {
      path: 'docs/first/summary.md',
      fileHash: 'summary-doc',
      lastUpdated: '2026-03-08T12:00:00.000Z',
      healthy: true,
    },
    'docs/first/role-views.md': {
      path: 'docs/first/role-views.md',
      fileHash: 'role-doc',
      lastUpdated: '2026-03-08T12:00:00.000Z',
      healthy: true,
    },
    'docs/first/stage-views.md': {
      path: 'docs/first/stage-views.md',
      fileHash: 'stage-doc',
      lastUpdated: '2026-03-08T12:00:00.000Z',
      healthy: true,
    },
    'docs/first/steering.md': {
      path: 'docs/first/steering.md',
      fileHash: 'steering-doc',
      lastUpdated: '2026-03-08T12:00:00.000Z',
      healthy: true,
    },
    'docs/first/conventions.md': {
      path: 'docs/first/conventions.md',
      fileHash: 'conventions-doc',
      lastUpdated: '2026-03-08T12:00:00.000Z',
      healthy: true,
    },
    'docs/first/critical-flows.md': {
      path: 'docs/first/critical-flows.md',
      fileHash: 'critical-flows-doc',
      lastUpdated: '2026-03-08T12:00:00.000Z',
      healthy: true,
    },
    'docs/first/change-map.md': {
      path: 'docs/first/change-map.md',
      fileHash: 'change-map-doc',
      lastUpdated: '2026-03-08T12:00:00.000Z',
      healthy: true,
    },
    'docs/first/entry-guide.md': {
      path: 'docs/first/entry-guide.md',
      fileHash: 'entry-guide-doc',
      lastUpdated: '2026-03-08T12:00:00.000Z',
      healthy: true,
    },
    'docs/first/reboot-guide.md': {
      path: 'docs/first/reboot-guide.md',
      fileHash: 'reboot-guide-doc',
      lastUpdated: '2026-03-08T12:00:00.000Z',
      healthy: true,
    },
    'docs/first/common-playbooks.md': {
      path: 'docs/first/common-playbooks.md',
      fileHash: 'common-playbooks-doc',
      lastUpdated: '2026-03-08T12:00:00.000Z',
      healthy: true,
    },
    'docs/first/known-risks-and-traps.md': {
      path: 'docs/first/known-risks-and-traps.md',
      fileHash: 'known-risks-doc',
      lastUpdated: '2026-03-08T12:00:00.000Z',
      healthy: true,
    },
  },
  status: 'current',
};

const summary: FirstRuntimeSummary = {
  generatedAt: '2026-03-08T12:00:00.000Z',
  mode: 'quick',
  project: { name: 'spec-first', platformType: 'backend', overview: 'runtime health' },
  modules: ['src/core/skill-runtime'],
  capabilities: ['runtime truth source'],
  entryPoints: ['src/cli/commands/init.ts'],
  dataModels: ['Feature'],
  apiSurface: ['spec-first init'],
  risks: [],
  evidence: ['tests/unit/first-change-detector.test.ts'],
};

const roleViews: FirstRoleViews = {
  product: { role: 'product', summary: 'product', focus: [], warnings: [] },
  dev: { role: 'dev', summary: 'dev', focus: [], warnings: [] },
  qa: { role: 'qa', summary: 'qa', focus: [], warnings: [] },
  architect: { role: 'architect', summary: 'architect', focus: [], warnings: [] },
};

const stageViews: FirstStageViews = {
  spec: { stage: 'spec', summary: 'spec', businessCapabilities: [], coreEntities: [], dependencies: [], warnings: [] },
  design: { stage: 'design', summary: 'design', moduleBoundaries: [], integrationPoints: [], technicalConstraints: [], risks: [] },
  code: { stage: 'code', summary: 'code', entryPoints: [], likelyChangeAreas: [], changeHazards: [], verificationHooks: [] },
  verify: { stage: 'verify', summary: 'verify', testFocus: [], riskAreas: [], validationHooks: [], releaseBlockers: [] },
};

const steering: FirstSteering = {
  product: { overview: 'runtime health', coreScenarios: ['runtime truth source'], nonGoals: [], glossary: ['Feature'] },
  tech: { stack: ['TypeScript'], constraints: [], forbiddenPatterns: ['docs-only truth'] },
  structure: { modules: ['src/core/skill-runtime'], boundaries: ['src/cli/commands/init.ts'], entryRules: ['read runtime truth first'] },
};

const conventions: FirstConventions = {
  api: { observedPatterns: ['spec-first init'], deviations: [], recommendedConvention: 'Expose command surfaces through stable spec-first CLI verbs.', evidence: ['src/cli/commands/init.ts'] },
  module: { observedPatterns: ['src/core/skill-runtime'], deviations: [], recommendedConvention: 'Keep runtime logic under src/core and CLI entry under src/cli.', evidence: ['src/core/skill-runtime'] },
  testing: { observedPatterns: ['Vitest'], deviations: [], recommendedConvention: 'Use Vitest.', evidence: ['tests/unit/first-change-detector.test.ts'] },
  projectRules: { observedPatterns: ['runtime truth first'], deviations: [], recommendedConvention: 'Read runtime truth before docs.', evidence: ['.spec-first/runtime/first'] },
};

const criticalFlows: FirstCriticalFlows = [
  {
    flowId: 'flow-cli-entry',
    name: 'CLI Entry Flow',
    entryPoints: ['src/cli/commands/init.ts'],
    coreModules: ['src/core/skill-runtime'],
    invariants: ['runtime truth first'],
    verificationHooks: ['pnpm vitest'],
  },
];

const changeMap: FirstChangeMap = [
  {
    changeType: 'runtime-asset-extension',
    likelyModules: ['src/core/skill-runtime'],
    likelyCommands: ['src/cli/commands/first.ts'],
    likelyConfigs: ['package.json'],
    likelyTests: ['tests/unit/first-change-detector.test.ts'],
    riskPoints: ['runtime index drift'],
  },
];

const entryGuide: FirstEntryGuide = [
  {
    taskCategory: 'runtime-extension',
    readFirst: ['.spec-first/runtime/first/summary.json', '.spec-first/runtime/first/steering.json'],
    thenRead: ['src/core/skill-runtime/first-runtime-store.ts'],
    avoidEntry: ['docs/first/tech-stack.md'],
    relatedFlows: ['flow-cli-entry'],
  },
];

const rebootGuide: FirstRebootGuide = {
  projectWhat: 'runtime health',
  whereToStart: ['.spec-first/runtime/first/summary.json', 'docs/first/README.md'],
  currentCriticalAreas: ['runtime truth first'],
  commonChangePaths: ['src/core/skill-runtime', 'src/cli/commands/init.ts'],
  verifyChecklist: ['pnpm vitest'],
};

function seedRuntime(projectRoot: string, overrideIndex?: Partial<FirstRuntimeIndex>) {
  writeFirstRuntimeSummary(projectRoot, summary);
  writeFirstRoleViews(projectRoot, roleViews);
  writeFirstStageViews(projectRoot, stageViews);
  writeFirstSteering(projectRoot, steering);
  writeFirstConventions(projectRoot, conventions);
  writeFirstCriticalFlows(projectRoot, criticalFlows);
  writeFirstChangeMap(projectRoot, changeMap);
  writeFirstEntryGuide(projectRoot, entryGuide);
  writeFirstRebootGuide(projectRoot, rebootGuide);
  mkdirSync(join(projectRoot, 'docs', 'first'), { recursive: true });
  const docsProjectionPaths = Object.keys(index.docsProjection);
  for (const docPath of docsProjectionPaths) {
    writeFileSync(join(projectRoot, docPath), `# ${docPath}\n`, 'utf-8');
  }

  const runtimeIndex = { ...index, ...overrideIndex };
  const runtimeDir = getFirstRuntimeDir(projectRoot);
  writeFirstRuntimeIndex(projectRoot, {
    ...runtimeIndex,
    summary: {
      ...runtimeIndex.summary,
      fileHash: runtimeIndex.summary.fileHash === 'summary'
        ? sha256Hex(readFileSync(join(runtimeDir, 'summary.json'), 'utf-8'))
        : runtimeIndex.summary.fileHash,
    },
    roleViews: {
      ...runtimeIndex.roleViews,
      fileHash: runtimeIndex.roleViews.fileHash === 'roles'
        ? sha256Hex(readFileSync(join(runtimeDir, 'role-views.json'), 'utf-8'))
        : runtimeIndex.roleViews.fileHash,
    },
    stageViews: {
      ...runtimeIndex.stageViews,
      fileHash: runtimeIndex.stageViews.fileHash === 'stages'
        ? sha256Hex(readFileSync(join(runtimeDir, 'stage-views.json'), 'utf-8'))
        : runtimeIndex.stageViews.fileHash,
    },
    steering: {
      ...runtimeIndex.steering,
      fileHash: runtimeIndex.steering.fileHash === 'steering'
        ? sha256Hex(readFileSync(join(runtimeDir, 'steering.json'), 'utf-8'))
        : runtimeIndex.steering.fileHash,
    },
    conventions: {
      ...runtimeIndex.conventions,
      fileHash: runtimeIndex.conventions.fileHash === 'conventions'
        ? sha256Hex(readFileSync(join(runtimeDir, 'conventions.json'), 'utf-8'))
        : runtimeIndex.conventions.fileHash,
    },
    criticalFlows: {
      ...runtimeIndex.criticalFlows,
      fileHash: runtimeIndex.criticalFlows.fileHash === 'critical-flows'
        ? sha256Hex(readFileSync(join(runtimeDir, 'critical-flows.json'), 'utf-8'))
        : runtimeIndex.criticalFlows.fileHash,
    },
    changeMap: {
      ...runtimeIndex.changeMap,
      fileHash: runtimeIndex.changeMap.fileHash === 'change-map'
        ? sha256Hex(readFileSync(join(runtimeDir, 'change-map.json'), 'utf-8'))
        : runtimeIndex.changeMap.fileHash,
    },
    entryGuide: {
      ...runtimeIndex.entryGuide,
      fileHash: runtimeIndex.entryGuide.fileHash === 'entry-guide'
        ? sha256Hex(readFileSync(join(runtimeDir, 'entry-guide.json'), 'utf-8'))
        : runtimeIndex.entryGuide.fileHash,
    },
    rebootGuide: {
      ...runtimeIndex.rebootGuide,
      fileHash: runtimeIndex.rebootGuide.fileHash === 'reboot-guide'
        ? sha256Hex(readFileSync(join(runtimeDir, 'reboot-guide.json'), 'utf-8'))
        : runtimeIndex.rebootGuide.fileHash,
    },
    docsProjection: Object.fromEntries(
      Object.entries(runtimeIndex.docsProjection).map(([docPath, entry]) => [
        docPath,
        {
          ...entry,
          fileHash: entry.fileHash.endsWith('-doc')
            ? sha256Hex(readFileSync(join(projectRoot, docPath), 'utf-8'))
            : entry.fileHash,
        },
      ])
    ),
  });
}

function initGitRepo(projectRoot: string): void {
  execSync('git init', { cwd: projectRoot, stdio: 'ignore' });
  execSync('git config user.email "dev@example.com"', { cwd: projectRoot, stdio: 'ignore' });
  execSync('git config user.name "Dev"', { cwd: projectRoot, stdio: 'ignore' });
}

describe('analyzeChanges', () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('无 Git 仓库返回全量更新策略', () => {
    const result = analyzeChanges(TEST_DIR);

    expect(result.recommendedStrategy).toBe('full');
    expect(result.reason).toContain('无 Git');
    expect(result.affectedArtifacts.length).toBeGreaterThan(0);
  });

  it('格式化全量更新策略结果', () => {
    const result = formatChangeAnalysis({
      changedFiles: 10,
      totalFiles: 20,
      changePercentage: 0.5,
      affectedArtifacts: ['tech-stack.md'],
      recommendedStrategy: 'full',
      reason: 'full',
    });

    expect(result).toContain('全量更新');
    expect(result).toContain('变更文件');
  });

  it('包含未提交工作区改动的受影响产物', () => {
    initGitRepo(TEST_DIR);
    mkdirSync(join(TEST_DIR, 'src', 'core', 'skill-runtime'), { recursive: true });
    writeFileSync(
      join(TEST_DIR, 'src', 'core', 'skill-runtime', 'first-doc-projection.ts'),
      'export const projection = true;\n',
      'utf-8'
    );
    execSync('git add .', { cwd: TEST_DIR, stdio: 'ignore' });
    execSync('git commit -m "seed"', { cwd: TEST_DIR, stdio: 'ignore' });

    writeFileSync(
      join(TEST_DIR, 'src', 'core', 'skill-runtime', 'first-doc-projection.ts'),
      'export const projection = false;\n',
      'utf-8'
    );

    const result = analyzeChanges(TEST_DIR, 'HEAD');

    expect(result.changedFiles).toBeGreaterThan(0);
    expect(result.affectedArtifacts.length).toBeGreaterThan(0);
    expect(result.recommendedStrategy).not.toBe('skip');
  });
});

describe('checkFirstUpdateContext', () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('runtime 目录不存在时返回 hasExistingOutput=false', () => {
    const result = checkFirstUpdateContext(TEST_DIR);

    expect(result.hasExistingOutput).toBe(false);
    expect(result.productStatus).toEqual([]);
    expect(result.hasManualModifications).toBe(false);
  });

  it('runtime 资产健康时返回 9 个运行时资产状态', () => {
    seedRuntime(TEST_DIR);

    const result = checkFirstUpdateContext(TEST_DIR);

    expect(result.hasExistingOutput).toBe(true);
    expect(result.productStatus.map((item) => item.name)).toEqual(
      expect.arrayContaining([
        'summary.json',
        'role-views.json',
        'stage-views.json',
        'steering.json',
        'conventions.json',
        'critical-flows.json',
        'change-map.json',
        'entry-guide.json',
        'reboot-guide.json',
        'docs/first/README.md',
        'docs/first/summary.md',
        'docs/first/role-views.md',
        'docs/first/stage-views.md',
        'docs/first/steering.md',
        'docs/first/conventions.md',
        'docs/first/critical-flows.md',
        'docs/first/change-map.md',
        'docs/first/entry-guide.md',
        'docs/first/reboot-guide.md',
        'docs/first/common-playbooks.md',
        'docs/first/known-risks-and-traps.md',
      ])
    );
    expect(result.productStatus).toHaveLength(21);
    expect(result.productStatus.every((item) => item.issues.length === 0)).toBe(true);
    expect(result.hasManualModifications).toBe(false);
  });

  it('runtime 健康上下文会透出 sourceCommit 作为 lastUpdateCommit', () => {
    seedRuntime(TEST_DIR, {
      sourceCommit: 'abc123',
    });

    const result = checkFirstUpdateContext(TEST_DIR);

    expect(result.lastUpdateCommit).toBe('abc123');
  });

  it('runtime 资产 hash 不匹配时标记 hasManualModifications=true', () => {
    seedRuntime(TEST_DIR, {
      summary: { ...index.summary, fileHash: 'not-the-real-hash' },
    });

    const result = checkFirstUpdateContext(TEST_DIR);
    const summaryStatus = result.productStatus.find((item) => item.name === 'summary.json');

    expect(summaryStatus?.issues.some((issue) => issue.type === 'hash_mismatch')).toBe(true);
    expect(result.hasManualModifications).toBe(true);
  });

  it('runtime 索引标记 unhealthy 时返回 format_error', () => {
    seedRuntime(TEST_DIR, {
      roleViews: { ...index.roleViews, healthy: false, issues: ['role unhealthy'] },
    });

    const result = checkFirstUpdateContext(TEST_DIR);
    const roleStatus = result.productStatus.find((item) => item.name === 'role-views.json');

    expect(roleStatus?.issues.some((issue) => issue.type === 'format_error')).toBe(true);
  });

  it('canonical projection docs 缺失时会出现在健康问题中', () => {
    seedRuntime(TEST_DIR);
    rmSync(join(TEST_DIR, 'docs', 'first', 'README.md'));

    const result = checkFirstUpdateContext(TEST_DIR);
    const readmeStatus = result.productStatus.find((item) => item.name === 'docs/first/README.md');

    expect(readmeStatus?.issues.some((issue) => issue.type === 'missing')).toBe(true);
  });

  it('忽略 docs/first 历史文件，未生成 runtime 时仍视为首次生成', () => {
    const docsFirst = join(TEST_DIR, 'docs', 'first');
    mkdirSync(docsFirst, { recursive: true });
    writeFileSync(join(docsFirst, 'tech-stack.md'), '# legacy docs\n', 'utf-8');

    const result = checkFirstUpdateContext(TEST_DIR);

    expect(result.hasExistingOutput).toBe(false);
    expect(result.productStatus).toEqual([]);
  });

  it('仅存在 runtime 目录但缺失索引时，标记三个资产均缺失', () => {
    mkdirSync(getFirstRuntimeDir(TEST_DIR), { recursive: true });

    const result = checkFirstUpdateContext(TEST_DIR);

    expect(result.hasExistingOutput).toBe(true);
    expect(result.productStatus.every((item) => item.issues.some((issue) => issue.type === 'missing'))).toBe(true);
  });
});

describe('getAffectedArtifacts', () => {
  it('forceUpdate=true 返回全部产物', () => {
    const context: FirstUpdateContext = {
      hasExistingOutput: true,
      productStatus: [],
      hasManualModifications: false,
    };

    const result = getAffectedArtifacts(context, true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('合并 changeAnalysis 与健康检查结果', () => {
    const context: FirstUpdateContext = {
      hasExistingOutput: true,
      changeAnalysis: {
        changedFiles: 1,
        totalFiles: 10,
        changePercentage: 0.1,
        affectedArtifacts: ['tech-stack.md'],
        recommendedStrategy: 'incremental',
        reason: 'incremental',
      },
      productStatus: [
        { name: 'summary.json', exists: true, issues: [], needsUpdate: false },
        { name: 'role-views.json', exists: true, issues: [{ type: 'format_error', message: 'bad' }], needsUpdate: true },
      ],
      hasManualModifications: false,
    };

    const result = getAffectedArtifacts(context);
    expect(result).toContain('tech-stack.md');
    expect(result).toContain('role-views.json');
  });
});

describe('formatHealthStatus', () => {
  it('无产物时提示首次生成', () => {
    expect(formatHealthStatus({ hasExistingOutput: false, productStatus: [], hasManualModifications: false })).toContain('首次生成');
  });

  it('显示 runtime 健康问题', () => {
    const output = formatHealthStatus({
      hasExistingOutput: true,
      lastUpdateTime: new Date('2026-03-08T12:00:00.000Z'),
      productStatus: [
        { name: 'summary.json', exists: true, issues: [{ type: 'hash_mismatch', message: 'summary mismatch' }], needsUpdate: true },
      ],
      hasManualModifications: true,
    });

    expect(output).toContain('summary.json');
    expect(output).toContain('summary mismatch');
  });

  it('显示 Git commit mismatch 状态', () => {
    const output = formatHealthStatus({
      hasExistingOutput: true,
      lastUpdateCommit: 'abc123',
      currentCommit: 'def456',
      productStatus: [],
      hasManualModifications: false,
    });

    expect(output).toContain('Git commit: ⚠️ 不匹配');
  });
});

describe('detectFirstRefreshScope', () => {
  it('marks source changes as runtime-only refresh by default', () => {
    const result = detectFirstRefreshScope(['src/core/skill-runtime/first-summary.ts']);
    expect(result.scope).toBe('runtime-only');
    expect(result.runtimeArtifacts).toContain('summary.json');
  });

  it('marks runtime asset changes as runtime-and-docs refresh', () => {
    const result = detectFirstRefreshScope(['.spec-first/runtime/first/stage-views.json']);
    expect(result.scope).toBe('runtime-and-docs');
    expect(result.docsProjections).toContain('docs/first/stage-views.md');
  });

  it('marks projection source changes as runtime-and-docs refresh', () => {
    const result = detectFirstRefreshScope(['src/core/skill-runtime/first-doc-projection.ts']);
    expect(result.scope).toBe('runtime-and-docs');
    expect(result.docsProjections.length).toBeGreaterThan(0);
  });
});
