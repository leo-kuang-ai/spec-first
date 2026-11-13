# Skill Benchmark: spec-work

**Date**: 2026-11-04T14:15:52Z
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

AssertionError [ERR_ASSERTION]: Protected fixture changed: src/server.js
+ actual - expected

+ '215c24a84bd9cd8d0af963f8c55860c426478a99ddb2fa3029533cbc2fbdbf31'
- 'e5f46eadeb6533438ee83f04cfcfe5296a8f25d66736945f8b783e077d0ae726'

    at checkFixture ([stdin]:78:69)
    at [stdin]:99:1
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
  actual: '215c24a84bd9cd8d0af963f8c55860c426478a99ddb2fa3029533cbc2fbdbf31',
  expected: 'e5f46eadeb6533438ee83f04cfcfe5296a8f25d66736945f8b783e077d0ae726',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

