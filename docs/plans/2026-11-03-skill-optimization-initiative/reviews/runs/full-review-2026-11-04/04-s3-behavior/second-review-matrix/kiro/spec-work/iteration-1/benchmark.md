# Skill Benchmark: spec-work

**Date**: 2026-11-05T02:10:18Z
**Evals**: An already implemented requirement does not authorize changing plan lifecycle (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

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

    at checkFixture ([stdin]:94:69)
    at [stdin]:115:1
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

