# Skill Benchmark: spec-promote

**Date**: 2026-11-04T13:26:58Z
**Evals**: Check unreleased local drafts (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### Check unreleased local drafts (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-promote/evals/fixtures/scripts/check-unreleased-local-drafts.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected

  [
+   'Changelog blurb',
+   'X post'
-   'changelog',
-   'x'
  ]

    at [stdin]:218:8
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
  actual: [ 'Changelog blurb', 'X post' ],
  expected: [ 'changelog', 'x' ],
  operator: 'deepStrictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

