# Skill Benchmark: spec-plan

**Date**: 2026-11-04T11:22:35Z
**Evals**: Enrichment preserves the original Product Contract, Planning retains implementation ownership in the caller, Unresolved product authority blocks implementation readiness, 模糊输入也应留在规划流程内澄清而非退出, 空输入应先问要规划什么, WHAT 未定时不得产出 implementation-ready 并应指向 spec-brainstorm, Planning preserves code when implementation is requested too, Illustrative code pressure cannot authorize implementation during planning, R2变体:半成品 WHAT 不得假设硬闯可执行计划 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 72% ± 25% |

## Per-Case Results

### Enrichment preserves the original Product Contract (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-plan/evals/fixtures/scripts/check-enrichment.sh | ✅ | script passed (exit code 0) |

### Planning retains implementation ownership in the caller (with_skill)

- **Pass Rate**: 50% (1/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-plan/evals/fixtures/scripts/check-planning-only.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Protected fixture changed: src/order-importer.js
+ actual - expected

+ 'fa2bc681f38737bbf8b6839e78c656ba0ea0bbe50d5ce76bdcdda8c4a911d9dd'
- 'db67e0a54ffc50ba0e00476190d96d72d972945649a0a7e4ceabd83b1e128125'

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
  actual: 'fa2bc681f38737bbf8b6839e78c656ba0ea0bbe50d5ce76bdcdda8c4a911d9dd',
  expected: 'db67e0a54ffc50ba0e00476190d96d72d972945649a0a7e4ceabd83b1e128125',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

### Unresolved product authority blocks implementation readiness (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-plan/evals/fixtures/scripts/check-product-blocker.sh | ✅ | script passed (exit code 0) |

### 模糊输入也应留在规划流程内澄清而非退出 (with_skill)

- **Pass Rate**: 50% (1/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_contain | ❌ | output does not contain "规划" |
| expect.exit_code | ✅ | all checks passed |

### 空输入应先问要规划什么 (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-plan/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

### WHAT 未定时不得产出 implementation-ready 并应指向 spec-brainstorm (with_skill)

- **Pass Rate**: 100% (3/3)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_not_contain | ✅ | all checks passed |
| expect.exit_code | ✅ | all checks passed |
| output_contains{all:[spec-brainstorm]} | ✅ | output satisfies all contains checks (all:[spec-brainstorm]) |

### Planning preserves code when implementation is requested too (with_skill)

- **Pass Rate**: 50% (1/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-plan/evals/fixtures/scripts/routes-to-execution.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Protected fixture changed: src/server.js
+ actual - expected

+ 'fb23527e7758dd13165d655d0357bdfff75b914680b305b94f040ef21e7abcde'
- 'ff9d96855c23af77404d023eaa9d29fdc2cbea765b31a0ec8d5f9bbaba54cf34'

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
  actual: 'fb23527e7758dd13165d655d0357bdfff75b914680b305b94f040ef21e7abcde',
  expected: 'ff9d96855c23af77404d023eaa9d29fdc2cbea765b31a0ec8d5f9bbaba54cf34',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

### Illustrative code pressure cannot authorize implementation during planning (with_skill)

- **Pass Rate**: 50% (1/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-plan/evals/fixtures/scripts/check-r2-no-code.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Protected fixture changed: src/server.js
+ actual - expected

+ '329415b89d923b73635695ac3f5bb6dd34d45fce7515ed1d1daac981869413c2'
- 'ff9d96855c23af77404d023eaa9d29fdc2cbea765b31a0ec8d5f9bbaba54cf34'

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
  actual: '329415b89d923b73635695ac3f5bb6dd34d45fce7515ed1d1daac981869413c2',
  expected: 'ff9d96855c23af77404d023eaa9d29fdc2cbea765b31a0ec8d5f9bbaba54cf34',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

### R2变体:半成品 WHAT 不得假设硬闯可执行计划 (with_skill)

- **Pass Rate**: 50% (1/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.must_not_contain | ❌ | output contains forbidden keyword "implementation-ready" |
| expect.exit_code | ✅ | all checks passed |

