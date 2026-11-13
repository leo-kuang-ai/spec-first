# Skill Benchmark: spec-handoff

**Date**: 2026-11-04T12:02:17Z
**Evals**: Check review continuation, Check research continuation, Ordinary continuation creates no handoff artifact, create 产出含 gate 四字段的 spec-handoff/v1 artifact, Explicit-source resume only orients the current session, Sparse-source resume preserves uncertainty and does not act (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 50% ± 50% |

## Per-Case Results

### Check review continuation (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-handoff/evals/fixtures/scripts/check-review-continuation.sh | ❌ | script exited with code 1 [stderr: node:internal/assert/utils:77
    throw err;
    ^

AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:

  assert.ok(report.findings.some((finding) => finding.file === 'src/retry.js' && finding.issue === 'retries permanent errors'))

    at [stdin]:204:8
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
  actual: false,
  expected: true,
  operator: '==',
  diff: 'simple'
}

Node.js v22.22.3] |

### Check research continuation (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-handoff/evals/fixtures/scripts/check-research-continuation.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ '已解决：src/retry.js 当前重试上限 retryLimit = 2（旧值在交接中未知，现已从当前源确认）'
- 'retry limit is 2'

    at [stdin]:204:8
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
  actual: '已解决：src/retry.js 当前重试上限 retryLimit = 2（旧值在交接中未知，现已从当前源确认）',
  expected: 'retry limit is 2',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

### Ordinary continuation creates no handoff artifact (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-handoff/evals/fixtures/scripts/check-continues-inline.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Protected fixture changed: README.md
+ actual - expected

+ '1e81926f3d6c07d3547a4016cac35ac518c00ac0d94ef9be97db5beba9e834ab'
- '4aac9f15131207d5e35f3d146e5e0998a26039d49c6ba87432a40e0697a71855'

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
  actual: '1e81926f3d6c07d3547a4016cac35ac518c00ac0d94ef9be97db5beba9e834ab',
  expected: '4aac9f15131207d5e35f3d146e5e0998a26039d49c6ba87432a40e0697a71855',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

### create 产出含 gate 四字段的 spec-handoff/v1 artifact (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-handoff/evals/fixtures/scripts/check-create-artifact.sh | ✅ | script passed (exit code 0) |

### Explicit-source resume only orients the current session (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-handoff/evals/fixtures/scripts/check-resume-no-side-effects.sh | ✅ | script passed (exit code 0) |

### Sparse-source resume preserves uncertainty and does not act (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-handoff/evals/fixtures/scripts/check-degraded-orientation.sh | ✅ | script passed (exit code 0) |

