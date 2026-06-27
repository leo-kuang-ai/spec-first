'use strict';

// run-evals.js validateFixture in-process 单测。
// contracts 测试 100% 走 execFileSync 子进程;此文件直接调用 validateFixture,
// 可针对每个验证路径做最小化断言,无需构造整份 fixture JSON 文件。

const {
  validateFixture,
} = require('../../skills/spec-prd/scripts/run-evals');

// 最小合法 fixture:能通过 validateFixture 的最小结构。
function minimalFixture(overrides = {}) {
  return {
    schema_version: 'spec-prd-evals.v1',
    case_contract: {
      schema_version: 'spec-prd-eval-case-contract.v1',
      case_types: ['positive', 'failure'],
      required_quality_buckets: ['brownfield-create'],
      must_not_required_quality_buckets: ['failure'],
      sentinel_cases: [],
    },
    cases: [
      {
        id: 'case-1',
        intent: 'create',
        case_type: 'positive',
        input_shape: 'rough PRD with known gaps',
        expected: ['asks owner one question at a time'],
        coverage_tags: ['brownfield-create'],
        quality_buckets: ['brownfield-create'],
      },
    ],
    ...overrides,
  };
}

describe('validateFixture — 基础结构验证', () => {
  test('最小合法 fixture 通过验证', () => {
    const report = validateFixture(minimalFixture(), '/test.json');
    expect(report.status).toBe('passed');
    expect(report.reason_code).toBe('eval_fixture_passed');
    expect(report.invalid_cases).toEqual([]);
  });

  test('fixture 不是对象 → fixture_not_object', () => {
    const report = validateFixture([], '/test.json');
    expect(report.status).toBe('failed');
    expect(report.invalid_cases[0].reason_code).toBe('fixture_not_object');
  });

  test('schema_version 错误 → schema_version_invalid', () => {
    const report = validateFixture(minimalFixture({ schema_version: 'wrong.v9' }), '/test.json');
    expect(report.invalid_cases.some((c) => c.reason_code === 'schema_version_invalid')).toBe(true);
  });

  test('cases 不是数组 → cases_missing', () => {
    const fixture = minimalFixture();
    fixture.cases = 'not-array';
    const report = validateFixture(fixture, '/test.json');
    expect(report.invalid_cases.some((c) => c.reason_code === 'cases_missing')).toBe(true);
  });
});

describe('validateFixture — case 字段验证', () => {
  test('id 重复 → id_duplicate', () => {
    const fixture = minimalFixture();
    fixture.cases = [
      { ...fixture.cases[0] },
      { ...fixture.cases[0] }, // 重复 id
    ];
    const report = validateFixture(fixture, '/test.json');
    expect(report.invalid_cases.some((c) => c.reason_code === 'id_duplicate')).toBe(true);
  });

  test('intent 不合法 → intent_invalid', () => {
    const fixture = minimalFixture();
    fixture.cases[0] = { ...fixture.cases[0], intent: 'invalid-intent' };
    const report = validateFixture(fixture, '/test.json');
    expect(report.invalid_cases.some((c) => c.reason_code === 'intent_invalid')).toBe(true);
  });

  test('case_type 不在 allowed 列表 → case_type_invalid', () => {
    const fixture = minimalFixture();
    fixture.cases[0] = { ...fixture.cases[0], case_type: 'unknown-type' };
    const report = validateFixture(fixture, '/test.json');
    expect(report.invalid_cases.some((c) => c.reason_code === 'case_type_invalid')).toBe(true);
  });

  test('expected 为空数组 → expected_invalid', () => {
    const fixture = minimalFixture();
    fixture.cases[0] = { ...fixture.cases[0], expected: [] };
    const report = validateFixture(fixture, '/test.json');
    expect(report.invalid_cases.some((c) => c.reason_code === 'expected_invalid')).toBe(true);
  });

  test('quality_buckets 含非法字符 → quality_bucket_invalid', () => {
    const fixture = minimalFixture();
    fixture.cases[0] = { ...fixture.cases[0], quality_buckets: ['INVALID_BUCKET'] };
    const report = validateFixture(fixture, '/test.json');
    expect(report.invalid_cases.some((c) => c.reason_code === 'quality_bucket_invalid')).toBe(true);
  });

  test('must_not_required bucket 的 case 缺 must_not → must_not_missing', () => {
    const fixture = minimalFixture();
    // failure 在 must_not_required_quality_buckets 里
    fixture.cases[0] = { ...fixture.cases[0], quality_buckets: ['brownfield-create', 'failure'] };
    // 不加 must_not
    const report = validateFixture(fixture, '/test.json');
    expect(report.invalid_cases.some((c) => c.reason_code === 'must_not_missing')).toBe(true);
  });
});

describe('validateFixture — required bucket + sentinel 验证', () => {
  test('required bucket 无对应 case → required_quality_bucket_missing', () => {
    const fixture = minimalFixture();
    fixture.case_contract.required_quality_buckets = ['brownfield-create', 'refine'];
    // cases 里只有 brownfield-create,没有 refine
    const report = validateFixture(fixture, '/test.json');
    expect(report.missing_required_buckets).toContain('refine');
    expect(report.invalid_cases.some((c) => c.reason_code === 'required_quality_bucket_missing')).toBe(true);
    expect(report.status).toBe('failed');
  });

  test('sentinel case 在 cases 中缺失 → sentinel_case_missing', () => {
    const fixture = minimalFixture();
    fixture.case_contract.sentinel_cases = [{
      id: 'nonexistent-sentinel',
      requires: { case_type: 'failure' },
    }];
    const report = validateFixture(fixture, '/test.json');
    expect(report.invalid_cases.some(
      (c) => c.reason_code === 'sentinel_case_missing' && c.id === 'nonexistent-sentinel',
    )).toBe(true);
  });

  test('sentinel case 的 expected 字符串缺失 → sentinel_case_requirement_missing', () => {
    const fixture = minimalFixture();
    fixture.case_contract.sentinel_cases = [{
      id: 'case-1',
      requires: {
        expected: ['some required string'],
      },
    }];
    // case-1 的 expected 里没有 'some required string'
    const report = validateFixture(fixture, '/test.json');
    expect(report.invalid_cases.some(
      (c) => c.reason_code === 'sentinel_case_requirement_missing'
        && c.id === 'case-1'
        && c.field === 'expected',
    )).toBe(true);
  });

  test('合法 sentinel case 通过验证', () => {
    const fixture = minimalFixture();
    fixture.case_contract.sentinel_cases = [{
      id: 'case-1',
      requires: {
        case_type: 'positive',
        quality_buckets: ['brownfield-create'],
        expected: ['asks owner one question at a time'],
      },
    }];
    const report = validateFixture(fixture, '/test.json');
    expect(report.status).toBe('passed');
    expect(report.invalid_cases).toEqual([]);
  });
});

describe('validateFixture — coverage 统计', () => {
  test('coverage 统计与 case_types 统计正确', () => {
    const report = validateFixture(minimalFixture(), '/test.json');
    expect(report.coverage['brownfield-create']).toBe(1);
    expect(report.case_types['positive']).toBe(1);
    expect(report.case_count).toBe(1);
  });
});
