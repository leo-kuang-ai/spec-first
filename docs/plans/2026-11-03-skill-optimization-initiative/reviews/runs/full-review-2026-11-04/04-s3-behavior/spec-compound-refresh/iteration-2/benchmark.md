# Skill Benchmark: spec-compound-refresh

**Date**: 2026-11-04T12:51:05Z
**Evals**: 恢复部分发布时保留人工条目及完整知识 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### 恢复部分发布时保留人工条目及完整知识 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-compound-refresh/evals/fixtures/scripts/check-publication-recover.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ 'completed'
- 'applied'

    at checkKnowledgePublication ([stdin]:133:12)
    at [stdin]:165:1
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
  actual: 'completed',
  expected: 'applied',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

