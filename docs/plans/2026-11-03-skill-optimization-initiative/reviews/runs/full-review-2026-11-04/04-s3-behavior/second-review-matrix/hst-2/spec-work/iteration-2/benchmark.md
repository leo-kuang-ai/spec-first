# Skill Benchmark: spec-work

**Date**: 2026-11-05T02:23:35Z
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
| script: /Users/kuang/xiaobu/spec-first/skills/spec-work/evals/fixtures/scripts/check-closeout-order.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ {
+   claims: [
+     {
+       asserted_status: 'passed',
+       claim_type: 'validation',
+       reason_code: 'validation-evidence-consistent',
+       verdict: 'consistent'
+     }
+   ],
+   overall: 'verified',
+   overall_reason_code: 'all-claims-consistent'
+ }
- 'verified'

    at checkCloseout ([stdin]:285:10)
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
  actual: {
    overall: 'verified',
    overall_reason_code: 'all-claims-consistent',
    claims: [
      {
        claim_type: 'validation',
        asserted_status: 'passed',
        verdict: 'consistent',
        reason_code: 'validation-evidence-consistent'
      }
    ]
  },
  expected: 'verified',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

