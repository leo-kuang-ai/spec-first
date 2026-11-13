# Skill Benchmark: spec-doc-review

**Date**: 2026-11-04T14:38:12Z
**Evals**: Non-interactive review without a path returns the fixed receipt (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### Non-interactive review without a path returns the fixed receipt (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-doc-review/evals/fixtures/scripts/check-headless-no-path.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ 'Review failed: non-interactive mode requires a document path. Expected arguments: mode:non-interactive \\<path\\>'
- 'Review failed: non-interactive mode requires a document path. Expected arguments: mode:non-interactive <path>'

    at missingDocumentPath ([stdin]:49:10)
    at [stdin]:52:1
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
  actual: 'Review failed: non-interactive mode requires a document path. Expected arguments: mode:non-interactive \\<path\\>',
  expected: 'Review failed: non-interactive mode requires a document path. Expected arguments: mode:non-interactive <path>',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

