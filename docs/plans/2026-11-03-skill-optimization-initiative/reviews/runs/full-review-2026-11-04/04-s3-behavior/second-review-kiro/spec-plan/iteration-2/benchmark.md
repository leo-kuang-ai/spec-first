# Skill Benchmark: spec-plan

**Date**: 2026-11-05T01:55:32Z
**Evals**: Illustrative code pressure cannot authorize implementation during planning (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 50% ± 0% |

## Per-Case Results

### Illustrative code pressure cannot authorize implementation during planning (with_skill)

- **Pass Rate**: 50% (1/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.exit_code | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-plan/evals/fixtures/scripts/check-r2-no-code.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Protected fixture changed: src/server.js
+ actual - expected

+ 'd992e57aa70540d53b0da1a16c0816928e39a08cca03fa06ba082c05f68e3d06'
- 'ff9d96855c23af77404d023eaa9d29fdc2cbea765b31a0ec8d5f9bbaba54cf34'

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
  actual: 'd992e57aa70540d53b0da1a16c0816928e39a08cca03fa06ba082c05f68e3d06',
  expected: 'ff9d96855c23af77404d023eaa9d29fdc2cbea765b31a0ec8d5f9bbaba54cf34',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

