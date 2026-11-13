# Skill Benchmark: spec-work

**Date**: 2026-11-04T11:39:55Z
**Evals**: A requirements-only plan stops before implementation, A completed plan cannot authorize implementation, A stale task pack is rejected without implementation, A trivial request performs the exact README change, 开放式 bug 描述应路由 spec-debug, An already implemented requirement does not authorize changing plan lifecycle, R2变体:无日志无堆栈的偶现 500 应路由 spec-debug, Caller-owned implementation returns a complete evidence-bound envelope, A bounded README change remains uncommitted without commit authority, Standalone completion requires ordered execution and closeout evidence (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 70% ± 46% |

## Per-Case Results

### A requirements-only plan stops before implementation (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-work/evals/fixtures/scripts/check-no-implementation.sh | ✅ | PASS: fixture state and required outcome evidence verified; semantic quality is not scored. |

### A completed plan cannot authorize implementation (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-work/evals/fixtures/scripts/check-no-implementation.sh | ✅ | PASS: fixture state and required outcome evidence verified; semantic quality is not scored. |

### A stale task pack is rejected without implementation (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-work/evals/fixtures/scripts/check-no-implementation.sh | ✅ | PASS: fixture state and required outcome evidence verified; semantic quality is not scored. |

### A trivial request performs the exact README change (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-work/evals/fixtures/scripts/check-readme-fixed.sh | ✅ | PASS: fixture state and required outcome evidence verified; semantic quality is not scored. |

### 开放式 bug 描述应路由 spec-debug (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-debug]} | ✅ | output satisfies all contains checks (all:[spec-debug]) |

### An already implemented requirement does not authorize changing plan lifecycle (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-work/evals/fixtures/scripts/check-r2-reverse-mismatch.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Protected fixture changed: docs/plans/2026-09-01-001-feat-month-filter-plan.md
+ actual - expected

+ '708a10ca3b5fb73801501630f4199c440963383113553e67d76b67f6bb742263'
- 'ebe41c2e90728c765a06f1e9b200c668a93570310c8b102fe70081ced9cbc1a1'

    at checkFixture ([stdin]:64:69)
    at [stdin]:85:1
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
  actual: '708a10ca3b5fb73801501630f4199c440963383113553e67d76b67f6bb742263',
  expected: 'ebe41c2e90728c765a06f1e9b200c668a93570310c8b102fe70081ced9cbc1a1',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

### R2变体:无日志无堆栈的偶现 500 应路由 spec-debug (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ✅ | all checks passed |
| output_contains{all:[spec-debug]} | ✅ | output satisfies all contains checks (all:[spec-debug]) |

### Caller-owned implementation returns a complete evidence-bound envelope (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-work/evals/fixtures/scripts/check-return-to-caller.sh | ❌ | script exited with code 1 [stderr: node:internal/assert/utils:77
    throw err;
    ^

AssertionError [ERR_ASSERTION]: Missing successful summary producer call/result
    at checkCloseout ([stdin]:168:10)
    at [stdin]:220:1
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
  actual: undefined,
  expected: true,
  operator: '==',
  diff: 'simple'
}

Node.js v22.22.3] |

### A bounded README change remains uncommitted without commit authority (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-work/evals/fixtures/scripts/check-uncommitted-handback.sh | ✅ | PASS: fixture state and required outcome evidence verified; semantic quality is not scored. |

### Standalone completion requires ordered execution and closeout evidence (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-work/evals/fixtures/scripts/check-closeout-order.sh | ❌ | script exited with code 1 [stderr: node:internal/assert/utils:77
    throw err;
    ^

AssertionError [ERR_ASSERTION]: No successful check before summary: grep -c '^Known limitations: ' README.md
    at checkCloseout ([stdin]:174:12)
    at [stdin]:220:1
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

