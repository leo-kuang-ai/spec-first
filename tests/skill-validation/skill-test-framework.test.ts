/**
 * Skill 测试框架单元测试
 *
 * 验证框架本身的功能正确性
 *
 * @module tests/skill-validation/skill-test-framework.test
 * @trace TC-SKILLFRAMEWORK-001
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TestCaseLoader,
  SkillTestExecutor,
  ReportGenerator,
  createSkillTestSuite,
  TestCaseFactory,
  type SkillTestCase,
} from './skill-test-framework.js';

// ─── TestCaseLoader 测试 ───────────────────────────────────

describe('TestCaseLoader', () => {
  let loader: TestCaseLoader;

  beforeEach(() => {
    loader = new TestCaseLoader('/tmp/test-cases');
  });

  it('should create loader instance', () => {
    expect(loader).toBeDefined();
  });

  it('should return empty array for non-existent directory', () => {
    const cases = loader.loadFromDirectory();
    expect(cases).toEqual([]);
  });

  it('should load test cases from JSON array', () => {
    const jsonCases: SkillTestCase[] = [
      {
        skillId: '07-code',
        category: 'normal',
        description: 'Test case from JSON',
        input: { featureId: 'FSREQ-001' },
        expectedOutput: { route: 'skill' },
        expectedGate: 'PASS',
      },
    ];

    const loaded = loader.loadFromJson(jsonCases);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].skillId).toBe('07-code');
    expect(loaded[0].traceId).toBeDefined();
  });
});

// ─── SkillTestExecutor 测试 ─────────────────────────────────

describe('SkillTestExecutor', () => {
  let executor: SkillTestExecutor;

  beforeEach(() => {
    executor = new SkillTestExecutor('/tmp/project');
  });

  it('should create executor instance', () => {
    expect(executor).toBeDefined();
  });

  it('should execute valid test case and pass', async () => {
    const testCase: SkillTestCase = {
      skillId: '07-code',
      category: 'normal',
      description: 'Valid test case',
      input: {},
      expectedOutput: { shouldNotThrow: true },
      expectedGate: 'PASS',
    };

    const result = await executor.execute(testCase);
    expect(result.passed).toBe(true);
    expect(result.testCase).toBe(testCase);
  });

  it('should fail for invalid category', async () => {
    const testCase = {
      skillId: '07-code',
      category: 'invalid' as 'normal',
      description: 'Invalid category',
      input: {},
      expectedOutput: {},
      expectedGate: 'PASS' as const,
    };

    const result = await executor.execute(testCase);
    expect(result.passed).toBe(false);
    expect(result.actual).toContain('Invalid category');
  });

  it('should fail for missing skillId', async () => {
    const testCase = {
      skillId: '',
      category: 'normal' as const,
      description: 'Missing skillId',
      input: {},
      expectedOutput: {},
      expectedGate: 'PASS' as const,
    };

    const result = await executor.execute(testCase);
    expect(result.passed).toBe(false);
    expect(result.actual).toContain('Missing skillId');
  });

  it('should fail for invalid expectedGate', async () => {
    const testCase = {
      skillId: '07-code',
      category: 'normal' as const,
      description: 'Invalid gate',
      input: {},
      expectedOutput: {},
      expectedGate: 'INVALID' as 'PASS',
    };

    const result = await executor.execute(testCase);
    expect(result.passed).toBe(false);
    expect(result.actual).toContain('Invalid expectedGate');
  });

  it('should store results by skillId', async () => {
    const testCase1: SkillTestCase = {
      skillId: '07-code',
      category: 'normal',
      description: 'Test 1',
      input: {},
      expectedOutput: {},
      expectedGate: 'PASS',
    };

    const testCase2: SkillTestCase = {
      skillId: '07-code',
      category: 'error',
      description: 'Test 2',
      input: {},
      expectedOutput: { errorMessage: 'expected error' },
      expectedGate: 'FAIL',
    };

    await executor.execute(testCase1);
    await executor.execute(testCase2);

    const results = executor.getResults('07-code');
    expect(results).toHaveLength(2);
  });

  it('should clear results', async () => {
    const testCase: SkillTestCase = {
      skillId: '07-code',
      category: 'normal',
      description: 'Test',
      input: {},
      expectedOutput: {},
      expectedGate: 'PASS',
    };

    await executor.execute(testCase);
    expect(executor.getResults('07-code')).toHaveLength(1);

    executor.clear();
    expect(executor.getResults('07-code')).toHaveLength(0);
  });

  it('should execute multiple test cases', async () => {
    const testCases: SkillTestCase[] = [
      {
        skillId: '07-code',
        category: 'normal',
        description: 'Test 1',
        input: {},
        expectedOutput: {},
        expectedGate: 'PASS',
      },
      {
        skillId: '04-design',
        category: 'normal',
        description: 'Test 2',
        input: {},
        expectedOutput: {},
        expectedGate: 'PASS',
      },
    ];

    const results = await executor.executeAll(testCases);
    expect(results).toHaveLength(2);
  });

  it('should support custom validator that passes', async () => {
    const testCase: SkillTestCase = {
      skillId: '07-code',
      category: 'normal',
      description: 'Custom validator pass',
      input: {},
      expectedOutput: {
        customValidator: () => true,
      },
      expectedGate: 'PASS',
    };

    const result = await executor.execute(testCase);
    expect(result.passed).toBe(true);
  });

  it('should support custom validator that fails with message', async () => {
    const testCase: SkillTestCase = {
      skillId: '07-code',
      category: 'normal',
      description: 'Custom validator fail',
      input: {},
      expectedOutput: {
        customValidator: () => 'Validation failed: missing required field',
      },
      expectedGate: 'PASS',
    };

    const result = await executor.execute(testCase);
    expect(result.passed).toBe(false);
    expect(result.actual).toContain('Validation failed');
  });
});

// ─── ReportGenerator 测试 ───────────────────────────────────

describe('ReportGenerator', () => {
  let generator: ReportGenerator;

  beforeEach(() => {
    generator = new ReportGenerator();
  });

  it('should create generator instance', () => {
    expect(generator).toBeDefined();
  });

  it('should generate validation report', () => {
    const testCases: SkillTestCase[] = [
      {
        skillId: '07-code',
        category: 'normal',
        description: 'Pass test',
        input: {},
        expectedOutput: {},
        expectedGate: 'PASS',
      },
      {
        skillId: '07-code',
        category: 'error',
        description: 'Fail test',
        input: {},
        expectedOutput: { errorMessage: 'expected' },
        expectedGate: 'FAIL',
      },
    ];

    const results = [
      { passed: true, duration: 10, testCase: testCases[0] },
      { passed: false, duration: 5, actual: 'Test failed', testCase: testCases[1] },
    ] as const;

    const report = generator.generateReport('07-code', testCases, [...results]);

    expect(report.skillId).toBe('07-code');
    expect(report.testCases).toHaveLength(2);
    expect(report.passedCount).toBe(1);
    expect(report.failedCount).toBe(1);
    expect(report.passRate).toBe(50);
    expect(report.issues).toHaveLength(1);
    expect(report.generatedAt).toBeDefined();
  });

  it('should calculate 100% pass rate when all pass', () => {
    const testCases: SkillTestCase[] = [
      {
        skillId: '07-code',
        category: 'normal',
        description: 'Test',
        input: {},
        expectedOutput: {},
        expectedGate: 'PASS',
      },
    ];

    const results = [{ passed: true, duration: 10, testCase: testCases[0] }];

    const report = generator.generateReport('07-code', testCases, results);

    expect(report.passRate).toBe(100);
    expect(report.issues).toHaveLength(0);
  });

  it('should generate markdown report', () => {
    const testCases: SkillTestCase[] = [
      {
        skillId: '07-code',
        category: 'normal',
        description: 'Test',
        input: {},
        expectedOutput: {},
        expectedGate: 'PASS',
      },
    ];

    const results = [{ passed: true, duration: 10, testCase: testCases[0] }];
    const report = generator.generateReport('07-code', testCases, results);
    const markdown = generator.toMarkdown(report);

    expect(markdown).toContain('# Skill 验证报告 - 07-code');
    expect(markdown).toContain('## 概览');
    expect(markdown).toContain('## 测试结果详情');
    expect(markdown).toContain('### 正常流程');
  });

  it('should include issues in markdown when present', () => {
    const testCases: SkillTestCase[] = [
      {
        skillId: '07-code',
        category: 'error',
        description: 'Failing test',
        input: {},
        expectedOutput: { errorMessage: 'expected' },
        expectedGate: 'FAIL',
      },
    ];

    const results = [
      { passed: false, duration: 5, actual: 'Test failed', testCase: testCases[0] },
    ];
    const report = generator.generateReport('07-code', testCases, results);
    const markdown = generator.toMarkdown(report);

    expect(markdown).toContain('## 发现的问题');
  });
});

// ─── TestCaseFactory 测试 ───────────────────────────────────

describe('TestCaseFactory', () => {
  it('should create normal test case', () => {
    const tc = TestCaseFactory.normal(
      '07-code',
      'Normal test',
      { featureId: 'FSREQ-001' },
      { route: 'skill' }
    );

    expect(tc.skillId).toBe('07-code');
    expect(tc.category).toBe('normal');
    expect(tc.description).toBe('Normal test');
    expect(tc.expectedGate).toBe('PASS');
  });

  it('should create error test case', () => {
    const tc = TestCaseFactory.error(
      '07-code',
      'Error test',
      { featureId: 'FSREQ-001' },
      'Expected error message'
    );

    expect(tc.skillId).toBe('07-code');
    expect(tc.category).toBe('error');
    expect(tc.description).toBe('Error test');
    expect(tc.expectedOutput.errorMessage).toBe('Expected error message');
    expect(tc.expectedGate).toBe('FAIL');
  });

  it('should create boundary test case', () => {
    const tc = TestCaseFactory.boundary(
      '07-code',
      'Boundary test',
      { featureId: 'FSREQ-001' },
      'PASS_WITH_WAIVER'
    );

    expect(tc.skillId).toBe('07-code');
    expect(tc.category).toBe('boundary');
    expect(tc.description).toBe('Boundary test');
    expect(tc.expectedGate).toBe('PASS_WITH_WAIVER');
  });
});

// ─── createSkillTestSuite 集成测试 ──────────────────────────

describe('createSkillTestSuite', () => {
  it('should create test suite with proper structure', () => {
    const testCases: SkillTestCase[] = [
      TestCaseFactory.normal('test-skill', 'Normal 1', {}, { shouldNotThrow: true }),
      TestCaseFactory.normal('test-skill', 'Normal 2', {}, { shouldNotThrow: true }),
      TestCaseFactory.error('test-skill', 'Error 1', {}, 'expected error'),
      TestCaseFactory.boundary('test-skill', 'Boundary 1', {}, 'PASS'),
    ];

    // 调用工厂函数创建测试套件
    // 注意：这会在 Vitest 中注册实际的测试用例
    createSkillTestSuite('test-skill', testCases);
  });
});

// ─── 边界条件测试 ─────────────────────────────────────────

describe('Edge Cases', () => {
  it('should handle empty test cases array', async () => {
    const executor = new SkillTestExecutor('/tmp');
    const results = await executor.executeAll([]);
    expect(results).toHaveLength(0);
  });

  it('should handle report with no results', () => {
    const generator = new ReportGenerator();
    const report = generator.generateReport('07-code', [], []);

    expect(report.passRate).toBe(0);
    expect(report.passedCount).toBe(0);
    expect(report.failedCount).toBe(0);
  });

  it('should handle long duration in report', async () => {
    const executor = new SkillTestExecutor('/tmp');
    const testCase: SkillTestCase = {
      skillId: '07-code',
      category: 'normal',
      description: 'Test',
      input: {},
      expectedOutput: {},
      expectedGate: 'PASS',
    };

    const result = await executor.execute(testCase);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });
});
