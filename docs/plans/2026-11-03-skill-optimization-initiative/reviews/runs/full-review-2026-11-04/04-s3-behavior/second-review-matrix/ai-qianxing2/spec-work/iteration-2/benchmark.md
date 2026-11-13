# Skill Benchmark: spec-work

**Date**: 2026-11-05T02:15:10Z
**Evals**: Standalone completion requires ordered execution and closeout evidence (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### Standalone completion requires ordered execution and closeout evidence (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-work/evals/fixtures/scripts/check-closeout-order.sh | ❌ | script exited with code 1 [stderr: node:assert:883
    throw err;
    ^

AssertionError [ERR_ASSERTION]: The "string" argument must be of type string. Received type object (null)
    at checkCloseout ([stdin]:250:10)
    at [stdin]:317:1
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3)
    at node:internal/main/eval_stdin:53:5
    at ReadStream.<anonymous> (node:internal/process/execution:201:5) {
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: null,
  expected: /^\.spec-first\/workflows\/spec-work\/[^/]+\/[^/]+\/verification-run-summary\.json$/,
  operator: 'match',
  diff: 'simple'
}

Node.js v22.22.3] |

