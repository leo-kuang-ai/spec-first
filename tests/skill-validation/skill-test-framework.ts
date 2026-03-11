/**
 * Skill 测试用例框架
 *
 * 支持 3 类测试用例（正常/异常/边界），与 Vitest 集成
 *
 * @module tests/skill-validation/skill-test-framework
 * @trace FR-SKILLREFINE-002, DS-SKILLREFINE-002
 */

import { describe, it, expect, type TestContext } from 'vitest';
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ─── 核心类型定义 ───────────────────────────────────────────

/**
 * 测试用例分类
 * - normal: 正常流程测试，验证 Skill 在标准输入下的正确输出
 * - error: 异常流程测试，验证 Skill 对无效输入的错误处理
 * - boundary: 边界流程测试，验证 Skill 在边界条件下的行为
 */
export type TestCaseCategory = 'normal' | 'error' | 'boundary';

/**
 * Gate 预期结果
 */
export type ExpectedGate = 'PASS' | 'FAIL' | 'PASS_WITH_WAIVER';

/**
 * Skill 测试用例接口
 */
export interface SkillTestCase {
  /** Skill ID，如 "07-code"、"04-design" */
  skillId: string;
  /** 测试用例分类 */
  category: TestCaseCategory;
  /** 测试用例描述 */
  description: string;
  /** 输入条件，包含模拟的 Feature 状态、文件内容等 */
  input: SkillTestInput;
  /** 预期输出 */
  expectedOutput: SkillTestExpectedOutput;
  /** 预期 Gate 结果 */
  expectedGate: ExpectedGate;
  /** 可选：测试用例 ID，用于追溯 */
  traceId?: string;
  /** 可选：标签，用于分组过滤 */
  tags?: string[];
}

/**
 * Skill 测试输入
 */
export interface SkillTestInput {
  /** Feature ID */
  featureId?: string;
  /** 当前阶段 */
  currentStage?: string;
  /** 模拟的文件系统内容，相对路径 -> 内容 */
  files?: Record<string, string>;
  /** 命令行参数 */
  args?: string[];
  /** 环境变量 */
  env?: Record<string, string>;
  /** Git 状态 */
  gitState?: {
    branch?: string;
    stagedFiles?: string[];
    modifiedFiles?: string[];
  };
  /** 运行时配置 */
  config?: Record<string, unknown>;
}

/**
 * Skill 测试预期输出
 */
export interface SkillTestExpectedOutput {
  /** 预期的路由类型 */
  route?: 'skill' | 'runtime' | 'error';
  /** 预期抛出的错误信息（部分匹配） */
  errorMessage?: string;
  /** 预期不抛出错误 */
  shouldNotThrow?: boolean;
  /** 预期输出包含的内容 */
  contains?: string[];
  /** 预期输出不包含的内容 */
  notContains?: string[];
  /** 自定义校验函数 */
  customValidator?: (result: SkillTestResult) => boolean | string;
}

/**
 * Skill 测试执行结果
 */
export interface SkillTestResult {
  /** 是否通过 */
  passed: boolean;
  /** 实际输出或错误信息 */
  actual?: string;
  /** 错误对象（如果有） */
  error?: Error;
  /** 执行时间（毫秒） */
  duration: number;
  /** 测试用例引用 */
  testCase: SkillTestCase;
}

/**
 * 验证问题
 */
export interface ValidationIssue {
  /** 问题 ID */
  id: string;
  /** 问题类型 */
  type: 'missing_file' | 'invalid_content' | 'gate_failed' | 'unexpected_error' | 'assertion_failed' | 'custom';
  /** 问题严重程度 */
  severity: 'error' | 'warning' | 'info';
  /** 问题描述 */
  description: string;
  /** 关联的测试用例 ID */
  testCaseId?: string;
  /** 关联的文件路径 */
  filePath?: string;
  /** 修复建议 */
  suggestion?: string;
}

/**
 * Skill 验证报告
 */
export interface ValidationReport {
  /** Skill ID */
  skillId: string;
  /** 所有测试用例 */
  testCases: SkillTestCase[];
  /** 测试结果 */
  results: SkillTestResult[];
  /** 通过率（0-100） */
  passRate: number;
  /** 通过的测试数量 */
  passedCount: number;
  /** 失败的测试数量 */
  failedCount: number;
  /** 发现的问题列表 */
  issues: ValidationIssue[];
  /** 报告生成时间 */
  generatedAt: string;
  /** 总执行时间（毫秒） */
  totalDuration: number;
}

/**
 * 测试套件配置
 */
export interface TestSuiteConfig {
  /** 测试套件名称 */
  name: string;
  /** Skill ID 列表（可选，不指定则测试所有） */
  skillIds?: string[];
  /** 测试分类过滤（可选） */
  categories?: TestCaseCategory[];
  /** 标签过滤（可选） */
  tags?: string[];
  /** 是否生成报告文件 */
  generateReport?: boolean;
  /** 报告输出目录 */
  reportDir?: string;
}

// ─── 测试用例加载器 ─────────────────────────────────────────

/**
 * 测试用例加载器
 *
 * 从文件系统或内存加载测试用例
 */
export class TestCaseLoader {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * 从目录加载测试用例
   * 目录结构：
   * test-cases/
   *   07-code/
   *     normal-01.yaml
   *     error-01.yaml
   *     boundary-01.yaml
   *   04-design/
   *     ...
   */
  loadFromDirectory(skillId?: string): SkillTestCase[] {
    const cases: SkillTestCase[] = [];
    const testCasesDir = join(this.baseDir, 'test-cases');

    if (!existsSync(testCasesDir)) {
      return cases;
    }

    const skillDirs = skillId
      ? [skillId]
      : readdirSync(testCasesDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name);

    for (const dir of skillDirs) {
      const skillDir = join(testCasesDir, dir);
      if (!existsSync(skillDir)) continue;

      const files = readdirSync(skillDir).filter((f) =>
        /\.(yaml|yml|json)$/.test(f)
      );

      for (const file of files) {
        const filePath = join(skillDir, file);
        try {
          const content = readFileSync(filePath, 'utf-8');
          const testCase = this.parseTestCase(content, dir);
          if (testCase) {
            cases.push(testCase);
          }
        } catch (e) {
          console.warn(`Failed to load test case: ${filePath}`, e);
        }
      }
    }

    return cases;
  }

  /**
   * 从 JSON 数组加载测试用例
   */
  loadFromJson(json: SkillTestCase[]): SkillTestCase[] {
    return json.map((tc) => ({
      ...tc,
      traceId: tc.traceId ?? this.generateTraceId(tc),
    }));
  }

  /**
   * 解析测试用例文件
   */
  private parseTestCase(content: string, skillId: string): SkillTestCase | null {
    try {
      // 简单 JSON 解析（YAML 需要额外依赖，这里用 JSON 格式）
      const parsed = JSON.parse(content);
      return {
        skillId,
        ...parsed,
        traceId: parsed.traceId ?? this.generateTraceId({ skillId, ...parsed }),
      } as SkillTestCase;
    } catch {
      return null;
    }
  }

  /**
   * 生成追溯 ID
   */
  private generateTraceId(tc: Partial<SkillTestCase>): string {
    const category = tc.category ?? 'normal';
    const timestamp = Date.now();
    return `TC-${tc.skillId}-${category}-${timestamp}`;
  }
}

// ─── 测试执行器 ─────────────────────────────────────────────

/**
 * Skill 测试执行器
 *
 * 执行测试用例并收集结果
 */
export class SkillTestExecutor {
  private readonly projectRoot: string;
  private readonly results: Map<string, SkillTestResult[]> = new Map();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * 执行单个测试用例
   */
  async execute(testCase: SkillTestCase): Promise<SkillTestResult> {
    const startTime = Date.now();
    let passed = false;
    let actual: string | undefined;
    let error: Error | undefined;

    try {
      // 根据测试类型执行不同的验证逻辑
      const validationResult = await this.runValidation(testCase);
      passed = validationResult.passed;
      actual = validationResult.actual;
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
      actual = error.message;

      // 检查是否预期抛出错误
      if (testCase.expectedOutput.errorMessage) {
        passed = actual.includes(testCase.expectedOutput.errorMessage);
      }
    }

    const duration = Date.now() - startTime;

    const result: SkillTestResult = {
      passed,
      actual,
      error,
      duration,
      testCase,
    };

    // 存储结果
    const skillResults = this.results.get(testCase.skillId) ?? [];
    skillResults.push(result);
    this.results.set(testCase.skillId, skillResults);

    return result;
  }

  /**
   * 批量执行测试用例
   */
  async executeAll(testCases: SkillTestCase[]): Promise<SkillTestResult[]> {
    const results: SkillTestResult[] = [];

    for (const testCase of testCases) {
      const result = await this.execute(testCase);
      results.push(result);
    }

    return results;
  }

  /**
   * 获取指定 Skill 的测试结果
   */
  getResults(skillId: string): SkillTestResult[] {
    return this.results.get(skillId) ?? [];
  }

  /**
   * 清空结果
   */
  clear(): void {
    this.results.clear();
  }

  /**
   * 运行验证逻辑
   *
   * 注意：这是一个框架方法，具体的 Skill 验证逻辑需要在实际测试文件中实现
   */
  private async runValidation(
    testCase: SkillTestCase
  ): Promise<{ passed: boolean; actual?: string }> {
    // 验证输入完整性
    if (!testCase.skillId) {
      return { passed: false, actual: 'Missing skillId' };
    }

    if (!testCase.description) {
      return { passed: false, actual: 'Missing description' };
    }

    // 验证分类有效性
    const validCategories: TestCaseCategory[] = ['normal', 'error', 'boundary'];
    if (!validCategories.includes(testCase.category)) {
      return {
        passed: false,
        actual: `Invalid category: ${testCase.category}`,
      };
    }

    // 验证 Gate 预期
    const validGates: ExpectedGate[] = ['PASS', 'FAIL', 'PASS_WITH_WAIVER'];
    if (!validGates.includes(testCase.expectedGate)) {
      return {
        passed: false,
        actual: `Invalid expectedGate: ${testCase.expectedGate}`,
      };
    }

    // 自定义验证器
    if (testCase.expectedOutput.customValidator) {
      const validatorResult = testCase.expectedOutput.customValidator({
        passed: true,
        duration: 0,
        testCase,
      });

      if (typeof validatorResult === 'string') {
        return { passed: false, actual: validatorResult };
      }

      if (!validatorResult) {
        return { passed: false, actual: 'Custom validator failed' };
      }
    }

    return { passed: true, actual: 'Validation passed' };
  }
}

// ─── 报告生成器 ─────────────────────────────────────────────

/**
 * 报告生成器
 *
 * 生成 Markdown 格式的验证报告
 */
export class ReportGenerator {
  /**
   * 生成单个 Skill 的验证报告
   */
  generateReport(
    skillId: string,
    testCases: SkillTestCase[],
    results: SkillTestResult[]
  ): ValidationReport {
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.length - passedCount;
    const passRate = results.length > 0 ? (passedCount / results.length) * 100 : 0;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    // 收集问题
    const issues: ValidationIssue[] = [];
    for (const result of results) {
      if (!result.passed) {
        issues.push({
          id: `ISSUE-${result.testCase.traceId ?? Date.now()}`,
          type: 'assertion_failed',
          severity: 'error',
          description: result.actual ?? 'Test failed',
          testCaseId: result.testCase.traceId,
          suggestion: this.generateSuggestion(result),
        });
      }
    }

    return {
      skillId,
      testCases,
      results,
      passRate: Math.round(passRate * 100) / 100,
      passedCount,
      failedCount,
      issues,
      generatedAt: new Date().toISOString(),
      totalDuration,
    };
  }

  /**
   * 将报告转换为 Markdown 格式
   */
  toMarkdown(report: ValidationReport): string {
    const lines: string[] = [
      `# Skill 验证报告 - ${report.skillId}`,
      '',
      `> 生成时间: ${report.generatedAt}`,
      '',
      '## 概览',
      '',
      `| 指标 | 值 |`,
      `|------|-----|`,
      `| 总测试数 | ${report.testCases.length} |`,
      `| 通过数 | ${report.passedCount} |`,
      `| 失败数 | ${report.failedCount} |`,
      `| 通过率 | ${report.passRate.toFixed(2)}% |`,
      `| 总耗时 | ${report.totalDuration}ms |`,
      '',
      '## 测试结果详情',
      '',
    ];

    // 按分类分组
    const categories: TestCaseCategory[] = ['normal', 'error', 'boundary'];
    for (const category of categories) {
      const categoryResults = report.results.filter(
        (r) => r.testCase.category === category
      );

      if (categoryResults.length === 0) continue;

      const categoryNames: Record<TestCaseCategory, string> = {
        normal: '正常流程',
        error: '异常流程',
        boundary: '边界流程',
      };

      lines.push(`### ${categoryNames[category]}`);
      lines.push('');
      lines.push('| 状态 | 描述 | 耗时 |');
      lines.push('|------|------|------|');

      for (const result of categoryResults) {
        const status = result.passed ? ':white_check_mark:' : ':x:';
        lines.push(
          `| ${status} | ${result.testCase.description} | ${result.duration}ms |`
        );
      }

      lines.push('');
    }

    // 问题列表
    if (report.issues.length > 0) {
      lines.push('## 发现的问题');
      lines.push('');

      for (const issue of report.issues) {
        lines.push(`### ${issue.id}`);
        lines.push('');
        lines.push(`- **类型**: ${issue.type}`);
        lines.push(`- **严重程度**: ${issue.severity}`);
        lines.push(`- **描述**: ${issue.description}`);
        if (issue.suggestion) {
          lines.push(`- **建议**: ${issue.suggestion}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * 将报告写入文件
   */
  writeReport(report: ValidationReport, outputDir: string): string {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const filename = `skill-validation-${report.skillId}-${Date.now()}.md`;
    const filePath = join(outputDir, filename);
    const content = this.toMarkdown(report);

    writeFileSync(filePath, content, 'utf-8');

    return filePath;
  }

  /**
   * 生成修复建议
   */
  private generateSuggestion(result: SkillTestResult): string {
    const tc = result.testCase;

    if (tc.category === 'error' && tc.expectedOutput.errorMessage) {
      return `检查错误处理逻辑，确保正确抛出包含 "${tc.expectedOutput.errorMessage}" 的错误`;
    }

    if (tc.expectedGate === 'PASS' && !result.passed) {
      return '检查 Gate 条件是否满足，确保所有前置条件已满足';
    }

    return '检查测试用例的预期输出是否正确，或修复 Skill 实现中的问题';
  }
}

// ─── Vitest 集成工具 ─────────────────────────────────────────

/**
 * 创建 Vitest 测试套件的工厂函数
 *
 * @example
 * ```typescript
 * import { createSkillTestSuite } from './skill-test-framework';
 *
 * const testCases: SkillTestCase[] = [
 *   {
 *     skillId: '07-code',
 *     category: 'normal',
 *     description: '标准代码编写流程',
 *     input: { featureId: 'FSREQ-001', currentStage: '04_implement' },
 *     expectedOutput: { route: 'skill', shouldNotThrow: true },
 *     expectedGate: 'PASS',
 *   },
 * ];
 *
 * createSkillTestSuite('07-code', testCases);
 * ```
 */
export function createSkillTestSuite(
  skillId: string,
  testCases: SkillTestCase[],
  options?: {
    projectRoot?: string;
    beforeEach?: (ctx: TestContext) => Promise<void> | void;
    afterEach?: (ctx: TestContext) => Promise<void> | void;
  }
): void {
  const executor = new SkillTestExecutor(options?.projectRoot ?? process.cwd());

  describe(`Skill: ${skillId}`, () => {
    // 分类统计
    const byCategory = testCases.reduce(
      (acc, tc) => {
        acc[tc.category] = (acc[tc.category] ?? 0) + 1;
        return acc;
      },
      {} as Record<TestCaseCategory, number>
    );

    describe(`测试用例统计 (共 ${testCases.length} 个)`, () => {
      it('should have at least 3 test categories', () => {
        expect(Object.keys(byCategory).length).toBeGreaterThanOrEqual(3);
      });

      it('should have normal flow tests', () => {
        expect(byCategory['normal'] ?? 0).toBeGreaterThan(0);
      });

      it('should have error flow tests', () => {
        expect(byCategory['error'] ?? 0).toBeGreaterThan(0);
      });

      it('should have boundary flow tests', () => {
        expect(byCategory['boundary'] ?? 0).toBeGreaterThan(0);
      });
    });

    // 正常流程测试
    describe('正常流程', () => {
      const normalCases = testCases.filter((tc) => tc.category === 'normal');

      for (const tc of normalCases) {
        it(tc.description, async () => {
          const result = await executor.execute(tc);
          expect(result.passed).toBe(true);
        });
      }
    });

    // 异常流程测试
    describe('异常流程', () => {
      const errorCases = testCases.filter((tc) => tc.category === 'error');

      for (const tc of errorCases) {
        it(tc.description, async () => {
          const result = await executor.execute(tc);

          if (tc.expectedOutput.errorMessage) {
            expect(result.actual).toContain(tc.expectedOutput.errorMessage);
          } else {
            // 异常测试应该通过（正确处理了异常）
            expect(result.passed).toBe(true);
          }
        });
      }
    });

    // 边界流程测试
    describe('边界流程', () => {
      const boundaryCases = testCases.filter((tc) => tc.category === 'boundary');

      for (const tc of boundaryCases) {
        it(tc.description, async () => {
          const result = await executor.execute(tc);
          expect(result.passed).toBe(tc.expectedGate === 'PASS');
        });
      }
    });
  });
}

/**
 * 快速创建测试用例的辅助函数
 */
export const TestCaseFactory = {
  normal(
    skillId: string,
    description: string,
    input: SkillTestInput,
    expectedOutput: SkillTestExpectedOutput
  ): SkillTestCase {
    return {
      skillId,
      category: 'normal',
      description,
      input,
      expectedOutput,
      expectedGate: 'PASS',
    };
  },

  error(
    skillId: string,
    description: string,
    input: SkillTestInput,
    errorMessage: string
  ): SkillTestCase {
    return {
      skillId,
      category: 'error',
      description,
      input,
      expectedOutput: { errorMessage },
      expectedGate: 'FAIL',
    };
  },

  boundary(
    skillId: string,
    description: string,
    input: SkillTestInput,
    expectedGate: ExpectedGate
  ): SkillTestCase {
    return {
      skillId,
      category: 'boundary',
      description,
      input,
      expectedOutput: { shouldNotThrow: true },
      expectedGate,
    };
  },
};

// ─── 导出所有类型和工具 ─────────────────────────────────────

export default {
  TestCaseLoader,
  SkillTestExecutor,
  ReportGenerator,
  createSkillTestSuite,
  TestCaseFactory,
};
