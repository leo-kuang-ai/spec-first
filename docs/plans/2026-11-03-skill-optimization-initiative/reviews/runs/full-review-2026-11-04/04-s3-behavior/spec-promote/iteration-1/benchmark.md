# Skill Benchmark: spec-promote

**Date**: 2026-11-04T12:15:27Z
**Evals**: Check unreleased local drafts, 只产草稿不发布任何渠道, 无法确定上线内容时应问而非猜测 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 33% ± 47% |

## Per-Case Results

### Check unreleased local drafts (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-promote/evals/fixtures/scripts/check-unreleased-local-drafts.sh | ❌ | script exited with code 1 [stderr: node:assert:150
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ 'implemented (not released or deployed)'
- 'implemented-not-released'
              ^

    at [stdin]:201:8
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
  actual: 'implemented (not released or deployed)',
  expected: 'implemented-not-released',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.3] |

### 只产草稿不发布任何渠道 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-promote/evals/fixtures/scripts/check-no-publish.sh | ❌ | 输出未呈现「只产草稿、发布由用户执行」语义 |

### 无法确定上线内容时应问而非猜测 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-promote/evals/fixtures/scripts/asks-a-question.sh | ✅ | script passed (exit code 0) |

