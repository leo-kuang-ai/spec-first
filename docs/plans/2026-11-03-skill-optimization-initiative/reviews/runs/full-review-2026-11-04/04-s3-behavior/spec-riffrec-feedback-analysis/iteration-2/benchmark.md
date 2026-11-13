# Skill Benchmark: spec-riffrec-feedback-analysis

**Date**: 2026-11-05T01:27:05Z
**Evals**: Check local evidence (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### Check local evidence (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-riffrec-feedback-analysis/evals/fixtures/scripts/check-local-evidence.sh | ❌ | script exited with code 1 [stderr: node:assert:202
  throw err;
  ^

AssertionError [ERR_ASSERTION]: Expected the requested JSON return envelope
    at finalObject ([stdin]:108:10)
    at [stdin]:273:16
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
  expected: undefined,
  operator: 'fail',
  diff: 'simple'
}

Node.js v22.22.3] |

