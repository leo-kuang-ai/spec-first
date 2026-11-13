# Skill Benchmark: spec-product-pulse

**Date**: 2026-11-04T12:16:32Z
**Evals**: Check source outcomes, 未配置时应引导 setup 而非硬跑空报告 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### Check source outcomes (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-product-pulse/evals/fixtures/scripts/check-source-outcomes.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected

  [
    {
      name: 'revenue',
      source: 'payments-export',
+     state: 'confirmed-value',
-     state: 'ok',
      value: 1200
    },
    {
      name: 'active_users',
      source: 'analytics-export',

    at [stdin]:203:8
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3)
    at node:internal/main/eval_stdin:53:5
    at ReadStream.<anonymous> (node:internal/process/execution:201:5)
    at ReadStream.emit (node:events:519:28) {
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: [
    {
      name: 'revenue',
      source: 'payments-export',
      state: 'confirmed-value',
      value: 1200
    },
    {
      name: 'active_users',
      source: 'analytics-export',
      state: 'permission-denied',
      value: null
    }
  ],
  expected: [
    {
      name: 'revenue',
      source: 'payments-export',
      state: 'ok',
      value: 1200
    },
    {
      name: 'active_users',
      source: 'analytics-export',
      state: 'permission-denied',
      value: null
    }
  ],
  operator: 'deepStrictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

### 未配置时应引导 setup 而非硬跑空报告 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-product-pulse/evals/fixtures/scripts/asks-a-question.sh | ❌ | 输出未包含问句变体或索要输入的表述,未体现向用户提问的行为 |

