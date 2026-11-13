# Skill Benchmark: spec-resolve-pr-feedback

**Date**: 2026-11-05T02:15:57Z
**Evals**: Pipeline return preserves an already replied open thread without remote writes (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### Pipeline return preserves an already replied open thread without remote writes (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-resolve-pr-feedback/evals/fixtures/scripts/check-pipeline-pending.sh | ❌ | script exited with code 1 [stderr: node:internal/assert/utils:77
    throw err;
    ^

AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:

  assert.ok(['complete', 'partial'].includes(packet.status))

    at [stdin]:309:8
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

