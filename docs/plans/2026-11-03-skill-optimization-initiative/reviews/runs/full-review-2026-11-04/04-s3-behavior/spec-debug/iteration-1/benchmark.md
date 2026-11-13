# Skill Benchmark: spec-debug

**Date**: 2026-11-04T11:42:36Z
**Evals**: Diagnosis-only requests deliver the causal chain without changing source, Repair authority permits a verified fix but no task commit, Ask for prior attempts before starting a new investigation, Diagnosis-only preserves the complete implementation baseline (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 40% ± 49% |

## Per-Case Results

### Diagnosis-only requests deliver the causal chain without changing source (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-debug/evals/fixtures/scripts/check-diagnosis-no-fix.sh | ❌ | script exited with code 1 [stderr: node:fs:1722
  const stats = binding.lstat(
                        ^

Error: ENOENT: no such file or directory, lstat '.git/eval-baseline.json'
    at Object.lstatSync (node:fs:1722:25)
    at regular ([stdin]:18:21)
    at checkFixture ([stdin]:51:31)
    at [stdin]:85:1
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'lstat',
  path: '.git/eval-baseline.json'
}

Node.js v22.22.3] |

### Repair authority permits a verified fix but no task commit (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-debug/evals/fixtures/scripts/check-fixed-no-commit.sh | ✅ | PASS: invalid JSON rejected, process survives, valid entries preserved, no new reachable commit |

### Ask for prior attempts before starting a new investigation (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-debug/evals/fixtures/scripts/check-prior-attempt-ask.sh | ❌ | script exited with code 1 [stderr: node:internal/assert/utils:77
    throw err;
    ^

AssertionError [ERR_ASSERTION]: The prior attempts were not requested
    at priorAttemptQuestion ([stdin]:20:10)
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

### Diagnosis-only preserves the complete implementation baseline (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-debug/evals/fixtures/scripts/check-diagnosis-no-fix.sh | ✅ | script passed (exit code 0) |

### Ask for prior attempts before starting a new investigation (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-debug/evals/fixtures/scripts/check-r2-prior-ask.sh | ❌ | script exited with code 1 [stderr: node:internal/assert/utils:77
    throw err;
    ^

AssertionError [ERR_ASSERTION]: The prior attempts were not requested
    at priorAttemptQuestion ([stdin]:20:10)
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

