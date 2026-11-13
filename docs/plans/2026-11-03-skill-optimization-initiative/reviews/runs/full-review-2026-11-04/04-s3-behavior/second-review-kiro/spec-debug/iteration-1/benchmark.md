# Skill Benchmark: spec-debug

**Date**: 2026-11-05T01:57:28Z
**Evals**: Ask for prior attempts before starting a new investigation (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### Ask for prior attempts before starting a new investigation (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-debug/evals/fixtures/scripts/check-prior-attempt-ask.sh | ❌ | script exited with code 1 [stderr: node:internal/assert/utils:77
    throw err;
    ^

AssertionError [ERR_ASSERTION]: Recorded investigation or mutation preceded the prior-attempt question
    at priorAttemptQuestion ([stdin]:30:14)
    at [stdin]:52:1
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

