/**
 * First Resume 单元测试（runtime-only）
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  formatProductSummary,
  formatResumePrompt,
  generateResumeRecommendation,
  type ResumeRecommendation,
} from '../../src/core/skill-runtime/first-resume.js';
import {
  getFirstRuntimeDir,
  writeFirstRoleViews,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-store.js';

const TEST_DIR = join(import.meta.dirname, '../fixtures/first-resume');

function seedHealthyRuntime(projectRoot: string, overrides?: { mode?: 'quick' | 'deep'; platformType?: string }) {
  const now = '2026-03-08T12:00:00.000Z';
  writeFirstRuntimeIndex(projectRoot, {
    version: '1.0.0',
    lastRun: now,
    mode: overrides?.mode ?? 'quick',
    summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: now, healthy: true },
    roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'roles', lastUpdated: now, healthy: true },
    stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'stages', lastUpdated: now, healthy: true },
    docsProjection: {},
    status: 'current',
  });
  writeFirstRuntimeSummary(projectRoot, {
    generatedAt: now,
    mode: overrides?.mode ?? 'quick',
    project: { name: 'spec-first', platformType: overrides?.platformType, overview: 'runtime-only' },
    modules: ['src/core/skill-runtime'],
    capabilities: ['runtime truth source'],
    entryPoints: ['src/cli/commands/init.ts'],
    dataModels: ['Feature'],
    apiSurface: ['spec-first init'],
    risks: [],
    evidence: ['tests/unit/first-resume.test.ts'],
  });
  writeFirstRoleViews(projectRoot, {
    product: { role: 'product', summary: 'product', focus: [], warnings: [] },
    dev: { role: 'dev', summary: 'dev', focus: [], warnings: [] },
    qa: { role: 'qa', summary: 'qa', focus: [], warnings: [] },
    architect: { role: 'architect', summary: 'architect', focus: [], warnings: [] },
  });
  writeFirstStageViews(projectRoot, {
    spec: { stage: 'spec', summary: 'spec', businessCapabilities: [], coreEntities: [], dependencies: [], warnings: [] },
    design: { stage: 'design', summary: 'design', moduleBoundaries: [], integrationPoints: [], technicalConstraints: [], risks: [] },
    code: { stage: 'code', summary: 'code', entryPoints: [], likelyChangeAreas: [], changeHazards: [], verificationHooks: [] },
    verify: { stage: 'verify', summary: 'verify', testFocus: [], riskAreas: [], validationHooks: [], releaseBlockers: [] },
  });
}

describe('generateResumeRecommendation', () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('无 runtime 资产时返回首次运行建议', () => {
    const nonExistentDir = join(TEST_DIR, 'nonexistent');
    const result = generateResumeRecommendation(nonExistentDir);

    expect(result.hasExistingProducts).toBe(false);
    expect(result.isStale).toBe(false);
    expect(result.recommendedOption).toBe('full_regenerate');
    expect(result.message).toContain('首次运行');
  });

  it('无 runtime 资产 + Greenfield 项目时提示先创建代码', () => {
    const projectRoot = join(TEST_DIR, 'greenfield');
    mkdirSync(projectRoot, { recursive: true });
    writeFileSync(join(projectRoot, 'README.md'), '# empty project', 'utf-8');

    const result = generateResumeRecommendation(projectRoot);
    expect(result.recommendedOption).toBe('skip');
    expect(result.message).toContain('建议先创建代码');
  });

  it('仅基于 runtime 真源返回会话恢复选项', () => {
    seedHealthyRuntime(TEST_DIR, { mode: 'quick', platformType: 'backend' });

    const result = generateResumeRecommendation(TEST_DIR);

    expect(result.hasExistingProducts).toBe(true);
    expect(result.lastMode).toBe('quick');
    expect(result.options).toContain('view_summary');
    expect(result.options).toContain('upgrade_deep');
    expect(result.message).toContain('00-first runtime 产物');
  });

  it('runtime 索引缺失时提示全量重建', () => {
    mkdirSync(getFirstRuntimeDir(TEST_DIR), { recursive: true });

    const result = generateResumeRecommendation(TEST_DIR);

    expect(result.hasExistingProducts).toBe(true);
    expect(result.isStale).toBe(true);
    expect(result.recommendedOption).toBe('full_regenerate');
    expect(result.staleReason).toContain('runtime 索引文件缺失');
  });

  it('runtime 摘要缺失端类型时，基于 projectRoot 自动补充检测结果', () => {
    seedHealthyRuntime(TEST_DIR);
    writeFileSync(
      join(TEST_DIR, 'package.json'),
      JSON.stringify({ dependencies: { react: '^18.0.0', antd: '^5.0.0' } }),
      'utf-8',
    );

    const result = generateResumeRecommendation(TEST_DIR);
    expect(result.message).toContain('端类型: frontend');
  });

  it('忽略 docs/first 历史文件，仅以 runtime 真源为准', () => {
    const docsFirst = join(TEST_DIR, 'docs', 'first');
    mkdirSync(docsFirst, { recursive: true });
    writeFileSync(join(docsFirst, 'tech-stack.md'), '# legacy docs\n', 'utf-8');

    const result = generateResumeRecommendation(TEST_DIR);

    expect(result.hasExistingProducts).toBe(false);
    expect(result.message).toContain('首次运行');
  });
});

describe('formatResumePrompt', () => {
  it('格式化首次运行提示', () => {
    const recommendation: ResumeRecommendation = {
      hasExistingProducts: false,
      isStale: false,
      commitMismatch: false,
      options: ['full_regenerate'],
      recommendedOption: 'full_regenerate',
      message: '✅ 首次运行',
    };

    const prompt = formatResumePrompt(recommendation);
    expect(prompt).toContain('首次运行');
  });

  it('格式化会话恢复提示', () => {
    const recommendation: ResumeRecommendation = {
      hasExistingProducts: true,
      lastMode: 'quick',
      lastRunTime: new Date('2026-03-01'),
      isStale: false,
      commitMismatch: false,
      options: ['view_summary', 'upgrade_deep', 'full_regenerate', 'skip'],
      recommendedOption: 'skip',
      message: '检测到已有产物 | 模式: quick | 距今: 1 天',
    };

    const prompt = formatResumePrompt(recommendation);
    expect(prompt).toContain('检测到已有产物');
    expect(prompt).toContain('选项');
  });

  it('格式化过期状态提示', () => {
    const recommendation: ResumeRecommendation = {
      hasExistingProducts: true,
      lastMode: 'quick',
      lastRunTime: new Date('2026-02-20'),
      isStale: true,
      staleReason: '产物已过期（距今 10 天）',
      commitMismatch: false,
      options: ['full_regenerate', 'skip'],
      recommendedOption: 'full_regenerate',
      message: '检测到已有产物 | 模式: quick',
    };

    const prompt = formatResumePrompt(recommendation);
    expect(prompt).toContain('full_regenerate');
  });
});

describe('formatProductSummary', () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('格式化 runtime 摘要', () => {
    seedHealthyRuntime(TEST_DIR, { mode: 'quick', platformType: 'backend' });

    const summary = formatProductSummary(TEST_DIR);

    expect(summary).toContain('runtime 摘要');
    expect(summary).toContain('.spec-first/runtime/first/summary.json');
    expect(summary).toContain('.spec-first/runtime/first/role-views.json');
    expect(summary).toContain('.spec-first/runtime/first/stage-views.json');
  });

  it('无 runtime 索引时返回错误提示', () => {
    const summary = formatProductSummary(TEST_DIR);
    expect(summary).toContain('未找到 runtime 索引文件');
  });
});
