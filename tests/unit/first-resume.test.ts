/**
 * First Resume 单元测试
 * @see 00-first skill 会话恢复逻辑
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  generateResumeRecommendation,
  formatResumePrompt,
  formatProductSummary,
  updateIndexAfterGeneration,
  type ResumeRecommendation,
} from '../../src/core/skill-runtime/first-resume.js';
import { createIndex, readIndex, INDEX_FILE_NAME } from '../../src/core/skill-runtime/first-index.js';

const TEST_DIR = join(import.meta.dirname, '../fixtures/first-resume');

describe('generateResumeRecommendation', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('无产物时返回首次运行建议', () => {
    const nonExistentDir = join(TEST_DIR, 'nonexistent');
    const result = generateResumeRecommendation(nonExistentDir);

    expect(result.hasExistingProducts).toBe(false);
    expect(result.isStale).toBe(false);
    expect(result.recommendedOption).toBe('full_regenerate');
    expect(result.message).toContain('首次运行');
  });

  it('无产物 + Greenfield 项目时提示先创建代码', () => {
    const projectRoot = join(TEST_DIR, 'greenfield');
    mkdirSync(projectRoot, { recursive: true });
    writeFileSync(join(projectRoot, 'README.md'), '# empty project', 'utf-8');

    const result = generateResumeRecommendation(join(projectRoot, 'docs/first'), projectRoot);
    expect(result.recommendedOption).toBe('skip');
    expect(result.message).toContain('建议先创建代码');
  });

  it('有产物时返回会话恢复选项', () => {
    createIndex({
      firstDir: TEST_DIR,
      mode: 'quick',
      platformType: 'backend',
      projectName: 'test-project',
      products: [],
    });

    const result = generateResumeRecommendation(TEST_DIR);

    expect(result.hasExistingProducts).toBe(true);
    expect(result.lastMode).toBe('quick');
    expect(result.options).toContain('view_summary');
    expect(result.options).toContain('upgrade_deep');
  });

  it('传入 projectRoot 时触发 Git 状态检测路径 (B4)', () => {
    createIndex({
      firstDir: TEST_DIR,
      mode: 'deep',
      platformType: 'backend',
      projectName: 'test-project',
      products: [{ name: 'tech-stack.md', fileHash: 'h1', mode: 'deep' }],
    });

    // 使用 TEST_DIR 的父目录作为 projectRoot（非 Git 仓库，但会走 projectRoot 分支）
    const result = generateResumeRecommendation(TEST_DIR, TEST_DIR);

    expect(result.hasExistingProducts).toBe(true);
    expect(result.lastMode).toBe('deep');
    // projectRoot 传入后不应提供 upgrade_deep（已是 deep）
    expect(result.options).not.toContain('upgrade_deep');
  });

  it('索引未记录端类型时，基于 projectRoot 自动补充检测结果', () => {
    createIndex({
      firstDir: TEST_DIR,
      mode: 'quick',
      projectName: 'web-admin',
      products: [],
    });
    writeFileSync(
      join(TEST_DIR, 'package.json'),
      JSON.stringify({ dependencies: { react: '^18.0.0', antd: '^5.0.0' } }),
      'utf-8',
    );

    const result = generateResumeRecommendation(TEST_DIR, TEST_DIR);
    expect(result.message).toContain('端类型: frontend/admin');
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
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('格式化产物摘要', () => {
    createIndex({
      firstDir: TEST_DIR,
      mode: 'quick',
      platformType: 'backend',
      projectName: 'test-project',
      gitCommit: 'abc1234',
      products: [
        { name: 'tech-stack.md', fileHash: 'h1', mode: 'quick' },
        { name: 'api-docs.md', fileHash: 'h2', mode: 'quick' },
      ],
    });

    const summary = formatProductSummary(TEST_DIR);

    expect(summary).toContain('产物摘要');
    expect(summary).toContain('quick');
    expect(summary).toContain('backend');
    expect(summary).toContain('test-project');
    expect(summary).toContain('abc1234');
    expect(summary).toContain('2 个');
  });

  it('无索引时返回错误提示', () => {
    const summary = formatProductSummary(TEST_DIR);

    expect(summary).toContain('未找到产物索引');
  });
});

describe('updateIndexAfterGeneration', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('首次生成后创建新索引', () => {
    updateIndexAfterGeneration(TEST_DIR, {
      mode: 'quick',
      platformType: 'backend',
      projectName: 'test-project',
      gitCommit: 'abc1234',
      generatedProducts: [
        { name: 'tech-stack.md', content: '# Tech Stack\n\nContent.' },
        { name: 'api-docs.md', content: '# API Docs\n\nContent.' },
      ],
    });

    const index = readIndex(TEST_DIR);
    expect(index).toBeDefined();
    expect(index?.mode).toBe('quick');
    expect(index?.products['tech-stack.md']).toBeDefined();
    expect(index?.products['api-docs.md']).toBeDefined();
  });

  it('后续生成时更新现有索引', () => {
    // 先创建索引
    createIndex({
      firstDir: TEST_DIR,
      mode: 'quick',
      products: [],
    });

    // 更新索引
    updateIndexAfterGeneration(TEST_DIR, {
      mode: 'deep',
      generatedProducts: [
        { name: 'call-graph.md', content: '# Call Graph' },
      ],
    });

    const index = readIndex(TEST_DIR);
    expect(index?.mode).toBe('deep');
    expect(index?.products['call-graph.md']).toBeDefined();
  });
});
