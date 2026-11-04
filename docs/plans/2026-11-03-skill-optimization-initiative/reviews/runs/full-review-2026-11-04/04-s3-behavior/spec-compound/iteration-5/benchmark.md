# Skill Benchmark: spec-compound

**Date**: 2026-11-04T13:31:17Z
**Evals**: 真实路径和重试关键词不能证明错误因果知识 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 0% ± 0% |

## Per-Case Results

### 真实路径和重试关键词不能证明错误因果知识 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-compound/evals/fixtures/scripts/check-false-causal-claim.sh | ❌ | script exited with code 1 [stderr: node:internal/assert/utils:77
    throw err;
    ^

AssertionError [ERR_ASSERTION]: 引用了无关或不存在的证据
    at [stdin]:117:8
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3)
    at node:internal/main/eval_stdin:53:5
    at ReadStream.<anonymous> (node:internal/process/execution:201:5)
    at ReadStream.emit (node:events:519:28) {
  generatedMessage: false,
  code: 'ERR_ASSERTION',
  actual: false,
  expected: true,
  operator: '==',
  diff: 'simple'
}

Node.js v22.22.3] |

