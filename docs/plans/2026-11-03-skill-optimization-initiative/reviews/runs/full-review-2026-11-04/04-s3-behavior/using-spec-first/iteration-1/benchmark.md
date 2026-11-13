# Skill Benchmark: using-spec-first

**Date**: 2026-11-04T12:21:28Z
**Evals**: 失败信号应路由到 spec-debug, 模糊想法应路由到 spec-brainstorm, 推荐类请求应推荐 0-1 入口且不直接开始, 轻量一次性问答应留在 Direct Lane 不进 workflow, 复合意图按失败优先且只选一个入口, An uncertain next step allows one route-changing question or one recommendation (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 92% ± 19% |

## Per-Case Results

### 失败信号应路由到 spec-debug (with_skill)

- **Pass Rate**: 100% (3/3)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| expect.must_not_contain | ✅ | all checks passed |
| output_contains{all:[spec-debug]} | ✅ | output satisfies all contains checks (all:[spec-debug]) |

### 模糊想法应路由到 spec-brainstorm (with_skill)

- **Pass Rate**: 100% (3/3)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| expect.must_not_contain | ✅ | all checks passed |
| output_contains{all:[spec-brainstorm]} | ✅ | output satisfies all contains checks (all:[spec-brainstorm]) |

### 推荐类请求应推荐 0-1 入口且不直接开始 (with_skill)

- **Pass Rate**: 100% (3/3)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| expect.must_not_contain | ✅ | all checks passed |
| output_contains{all:[spec-ideate]} | ✅ | output satisfies all contains checks (all:[spec-ideate]) |

### 轻量一次性问答应留在 Direct Lane 不进 workflow (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_not_contain | ✅ | all checks passed |
| output_contains{all:[```]} | ✅ | output satisfies all contains checks (all:[```]) |

### 复合意图按失败优先且只选一个入口 (with_skill)

- **Pass Rate**: 100% (3/3)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| expect.must_not_contain | ✅ | all checks passed |
| output_contains{all:[spec-debug]} | ✅ | output satisfies all contains checks (all:[spec-debug]) |

### An uncertain next step allows one route-changing question or one recommendation (with_skill)

- **Pass Rate**: 50% (1/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_not_contain | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/using-spec-first/evals/fixtures/scripts/check-r2-asks.sh | ❌ | script exited with code 1 [stderr: node:internal/assert/utils:77
    throw err;
    ^

AssertionError [ERR_ASSERTION]: Expected one question or one recommendation
    at oneRouteDecision ([stdin]:40:10)
    at [stdin]:49:1
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3)
    at node:internal/main/eval_stdin:53:5
    at ReadStream.<anonymous> (node:internal/process/execution:201:5) {
  generatedMessage: false,
  code: 'ERR_ASSERTION',
  actual: false,
  expected: true,
  operator: '==',
  diff: 'simple'
}

Node.js v22.22.3] |

