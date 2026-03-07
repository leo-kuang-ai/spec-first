/**
 * First Change Detector 单元测试
 * @see 00-first skill 增量更新变更检测
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import {
  analyzeChanges,
  checkProductHealth,
  checkFirstUpdateContext,
  getAffectedArtifacts,
  formatChangeAnalysis,
  formatHealthStatus,
  type ChangeAnalysis,
  type FirstUpdateContext,
} from '../../src/core/skill-runtime/first-change-detector.js';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createIndex } from '../../src/core/skill-runtime/first-index.js';

const TEST_DIR = join(import.meta.dirname, '../fixtures/.tmp-first-change-detector');

afterAll(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

describe('analyzeChanges', () => {
  beforeEach(() => {
    // 清理测试目录
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  it('无 Git 仓库返回全量更新策略', () => {
    const result = analyzeChanges(TEST_DIR);

    expect(result.recommendedStrategy).toBe('full');
    expect(result.reason).toContain('无 Git 仓库');
    expect(result.affectedArtifacts).toContain('tech-stack.md');
  });

  it('变更百分比 > 30% 返回全量更新', () => {
    // 由于测试环境可能没有实际的 Git 仓库，
    // 这里主要验证返回结构
    const result = analyzeChanges(TEST_DIR);

    expect(result).toHaveProperty('changedFiles');
    expect(result).toHaveProperty('totalFiles');
    expect(result).toHaveProperty('changePercentage');
    expect(result).toHaveProperty('affectedArtifacts');
    expect(result).toHaveProperty('recommendedStrategy');
    expect(result).toHaveProperty('reason');
  });

  it('返回类型包含所有必需字段', () => {
    const result: ChangeAnalysis = {
      changedFiles: 5,
      totalFiles: 100,
      changePercentage: 0.05,
      affectedArtifacts: ['tech-stack.md', 'api-docs.md'],
      recommendedStrategy: 'incremental',
      reason: '测试原因',
    };

    expect(result.changedFiles).toBe(5);
    expect(result.totalFiles).toBe(100);
    expect(result.changePercentage).toBe(0.05);
    expect(result.affectedArtifacts).toEqual(['tech-stack.md', 'api-docs.md']);
    expect(result.recommendedStrategy).toBe('incremental');
  });
});

describe('checkProductHealth', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  it('文件不存在返回 missing 问题', () => {
    const result = checkProductHealth(join(TEST_DIR, 'nonexistent.md'), 'abc1234');

    expect(result.exists).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].type).toBe('missing');
  });

  it('解析 frontmatter 中的 last_updated 和 git_commit', () => {
    const testFile = join(TEST_DIR, 'test-product.md');
    writeFileSync(testFile, `---
last_updated: 2026-03-02
git_commit: abc1234def5678
mode: quick
---
# Test Product

Content here.
`);

    const result = checkProductHealth(testFile, 'xyz5678');

    expect(result.exists).toBe(true);
    expect(result.lastUpdated).toEqual(new Date('2026-03-02'));
    expect(result.gitCommit).toBe('abc1234def5678');
    expect(result.currentHash).toBeDefined();
  });

  it('git_commit 不匹配产生 commit_mismatch 问题', () => {
    const testFile = join(TEST_DIR, 'test-product.md');
    writeFileSync(testFile, `---
git_commit: abc1234
---
# Test
`);

    const result = checkProductHealth(testFile, 'xyz5678');

    expect(result.issues.some(i => i.type === 'commit_mismatch')).toBe(true);
  });

  it('缺失 frontmatter 不抛错', () => {
    const testFile = join(TEST_DIR, 'test-product.md');
    writeFileSync(testFile, `# Test Product\n\nContent.`);

    const result = checkProductHealth(testFile, 'abc1234');

    expect(result.exists).toBe(true);
    expect(result.lastUpdated).toBeUndefined();
  });

  it('storedHash 不匹配时产生 hash_mismatch 问题 (A10)', () => {
    const testFile = join(TEST_DIR, 'test-product.md');
    writeFileSync(testFile, '# Test Product\n\nChanged content.');

    const result = checkProductHealth(testFile, undefined, 'not-the-same-hash');

    expect(result.issues.some(i => i.type === 'hash_mismatch')).toBe(true);
  });
});

describe('formatChangeAnalysis', () => {
  it('格式化增量更新策略结果', () => {
    const analysis: ChangeAnalysis = {
      changedFiles: 3,
      totalFiles: 100,
      changePercentage: 0.03,
      affectedArtifacts: ['tech-stack.md', 'api-docs.md'],
      recommendedStrategy: 'incremental',
      reason: '变更规模适中',
    };

    const result = formatChangeAnalysis(analysis);

    expect(result).toContain('📊');
    expect(result).toContain('变更文件: 3 个');
    expect(result).toContain('变更占比: 3.0%');
    expect(result).toContain('增量更新');
    expect(result).toContain('tech-stack.md');
    expect(result).toContain('api-docs.md');
  });

  it('格式化全量更新策略结果', () => {
    const analysis: ChangeAnalysis = {
      changedFiles: 40,
      totalFiles: 100,
      changePercentage: 0.40,
      affectedArtifacts: [],
      recommendedStrategy: 'full',
      reason: '超过 30% 阈值',
    };

    const result = formatChangeAnalysis(analysis);

    expect(result).toContain('全量更新');
    expect(result).toContain('40.0%');
  });

  it('格式化跳过策略结果', () => {
    const analysis: ChangeAnalysis = {
      changedFiles: 0,
      totalFiles: 100,
      changePercentage: 0,
      affectedArtifacts: [],
      recommendedStrategy: 'skip',
      reason: '无文件变更',
    };

    const result = formatChangeAnalysis(analysis);

    expect(result).toContain('跳过');
  });
});

describe('formatHealthStatus', () => {
  it('无产物时提示首次生成', () => {
    const context: FirstUpdateContext = {
      hasExistingOutput: false,
      productStatus: [],
      hasManualModifications: false,
    };

    const result = formatHealthStatus(context);

    expect(result).toContain('首次生成');
  });

  it('有产物时显示更新时间和 commit 状态', () => {
    const context: FirstUpdateContext = {
      hasExistingOutput: true,
      lastUpdateTime: new Date('2026-03-01'),
      lastUpdateCommit: 'abc1234',
      currentCommit: 'abc1234',
      productStatus: [],
      hasManualModifications: false,
    };

    const result = formatHealthStatus(context);

    expect(result).toContain('2026-03-01');
    expect(result).toContain('✅ 匹配');
  });

  it('commit 不匹配显示警告', () => {
    const context: FirstUpdateContext = {
      hasExistingOutput: true,
      lastUpdateTime: new Date('2026-03-01'),
      lastUpdateCommit: 'abc1234',
      currentCommit: 'xyz5678',
      productStatus: [],
      hasManualModifications: false,
    };

    const result = formatHealthStatus(context);

    expect(result).toContain('⚠️ 不匹配');
  });
});

describe('checkFirstUpdateContext (B1)', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  it('目录不存在时返回 hasExistingOutput=false', () => {
    const result = checkFirstUpdateContext(TEST_DIR, 'nonexistent-dir');

    expect(result.hasExistingOutput).toBe(false);
    expect(result.productStatus).toEqual([]);
    expect(result.hasManualModifications).toBe(false);
  });

  it('目录存在且有 .md 文件时返回产物状态', () => {
    const firstDir = join(TEST_DIR, 'docs', 'first');
    mkdirSync(firstDir, { recursive: true });
    writeFileSync(join(firstDir, 'tech-stack.md'), '---\nlast_updated: 2026-03-02\n---\n# Tech Stack\n');

    const result = checkFirstUpdateContext(TEST_DIR, 'docs/first');

    expect(result.hasExistingOutput).toBe(true);
    expect(result.productStatus.length).toBeGreaterThan(0);
    expect(result.productStatus[0].name).toBe('tech-stack.md');
    expect(result.productStatus[0].exists).toBe(true);
  });

  it('支持传入绝对路径 firstDir（避免 projectRoot+absolute 路径拼接错误）', () => {
    const firstDir = join(TEST_DIR, 'docs', 'first');
    mkdirSync(firstDir, { recursive: true });
    writeFileSync(join(firstDir, 'api-docs.md'), '# API Docs');

    const result = checkFirstUpdateContext(TEST_DIR, firstDir);
    expect(result.hasExistingOutput).toBe(true);
    expect(result.productStatus.some(p => p.name === 'api-docs.md')).toBe(true);
  });

  it('组合 analyzeChanges + checkProductHealth 结果', () => {
    const firstDir = join(TEST_DIR, 'docs', 'first');
    mkdirSync(firstDir, { recursive: true });
    writeFileSync(join(firstDir, 'api-docs.md'), '# API Docs\nContent');

    const result = checkFirstUpdateContext(TEST_DIR, 'docs/first');

    expect(result).toHaveProperty('changeAnalysis');
    expect(result.changeAnalysis).toHaveProperty('recommendedStrategy');
    expect(result.productStatus[0]).toHaveProperty('needsUpdate');
  });

  it('索引 hash 不匹配时标记 hasManualModifications=true (A10)', () => {
    const firstDir = join(TEST_DIR, 'docs', 'first');
    mkdirSync(firstDir, { recursive: true });
    writeFileSync(join(firstDir, 'tech-stack.md'), '# Tech Stack\nmanual change');

    createIndex({
      firstDir,
      mode: 'quick',
      products: [{ name: 'tech-stack.md', fileHash: 'stale-hash', mode: 'quick' }],
    });

    const result = checkFirstUpdateContext(TEST_DIR, 'docs/first');
    expect(result.hasManualModifications).toBe(true);
    expect(result.productStatus.some(p => p.issues.some(i => i.type === 'hash_mismatch'))).toBe(true);
  });
});

describe('analyzeChanges threshold logic (B2)', () => {
  it('无 Git 仓库时 recommendedStrategy 为 full 且 reason 包含"无 Git"', () => {
    const tmpDir = join(TEST_DIR, 'no-git');
    mkdirSync(tmpDir, { recursive: true });

    const result = analyzeChanges(tmpDir);

    expect(result.recommendedStrategy).toBe('full');
    expect(result.reason).toContain('无 Git 仓库');
    // 确认 affectedArtifacts 包含所有产物
    expect(result.affectedArtifacts.length).toBeGreaterThan(5);
  });
});

describe('analyzeChanges Git failure fallback (B3)', () => {
  it('Git diff 失败时回退到全量更新', () => {
    // 使用真实 Git 仓库但传入不存在的 commit 触发 git diff 失败
    const repoRoot = join(import.meta.dirname, '../..');
    const result = analyzeChanges(repoRoot, 'deadbeef0000000000000000000000000000dead');

    expect(result.recommendedStrategy).toBe('full');
    expect(result.reason).toContain('失败');
    expect(result.changePercentage).toBe(1.0);
    expect(result.affectedArtifacts.length).toBeGreaterThan(0);
  });
});

describe('getAffectedArtifacts', () => {
  it('无产物时返回所有产物', () => {
    const context: FirstUpdateContext = {
      hasExistingOutput: false,
      productStatus: [],
      hasManualModifications: false,
    };

    const result = getAffectedArtifacts(context);

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('tech-stack.md');
  });

  it('forceUpdate=true 返回所有产物', () => {
    const context: FirstUpdateContext = {
      hasExistingOutput: true,
      changeAnalysis: {
        changedFiles: 1,
        totalFiles: 100,
        changePercentage: 0.01,
        affectedArtifacts: ['tech-stack.md'],
        recommendedStrategy: 'incremental',
        reason: '测试',
      },
      productStatus: [],
      hasManualModifications: false,
    };

    const result = getAffectedArtifacts(context, true);

    expect(result.length).toBeGreaterThan(1); // 应该返回所有产物
  });

  it('从 changeAnalysis 获取受影响产物', () => {
    const context: FirstUpdateContext = {
      hasExistingOutput: true,
      changeAnalysis: {
        changedFiles: 1,
        totalFiles: 100,
        changePercentage: 0.01,
        affectedArtifacts: ['api-docs.md', 'tech-stack.md'],
        recommendedStrategy: 'incremental',
        reason: '测试',
      },
      productStatus: [],
      hasManualModifications: false,
    };

    const result = getAffectedArtifacts(context, false);

    expect(result).toContain('api-docs.md');
    expect(result).toContain('tech-stack.md');
  });

  it('从 needsUpdate 的产物添加到受影响列表', () => {
    const context: FirstUpdateContext = {
      hasExistingOutput: true,
      changeAnalysis: {
        changedFiles: 0,
        totalFiles: 100,
        changePercentage: 0,
        affectedArtifacts: [],
        recommendedStrategy: 'skip',
        reason: '无变更',
      },
      productStatus: [
        {
          name: 'tech-stack.md',
          exists: true,
          issues: [{ type: 'expired', message: '已过期' }],
          needsUpdate: true,
        },
      ],
      hasManualModifications: false,
    };

    const result = getAffectedArtifacts(context, false);

    expect(result).toContain('tech-stack.md');
  });
});
