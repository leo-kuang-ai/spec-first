# Skill Benchmark: spec-compound

**Date**: 2026-11-04T12:02:21Z
**Evals**: 未解决问题不得写入 durable knowledge, 独立 CONCEPTS.md 建库请求应重定向 spec-compound-refresh, A verified solved problem produces a grounded learning with invalidation conditions, 可从最终代码直接恢复的修复不沉淀（counterfactual bar）, mode:headless 无合格 learning 时不得宣称 Documentation complete, 真实路径和重试关键词不能证明错误因果知识 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 67% ± 47% |

## Per-Case Results

### 未解决问题不得写入 durable knowledge (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.files_not_exist | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-compound/evals/fixtures/scripts/check-refuses-unsolved.sh | ✅ | script passed (exit code 0) |

### 独立 CONCEPTS.md 建库请求应重定向 spec-compound-refresh (with_skill)

- **Pass Rate**: 0% (0/0)

### A verified solved problem produces a grounded learning with invalidation conditions (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-compound/evals/fixtures/scripts/check-solution-published.sh | ✅ | script passed (exit code 0) |

### 可从最终代码直接恢复的修复不沉淀（counterfactual bar） (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.files_not_exist | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-compound/evals/fixtures/scripts/check-counterfactual-no-write.sh | ✅ | script passed (exit code 0) |

### mode:headless 无合格 learning 时不得宣称 Documentation complete (with_skill)

- **Pass Rate**: 100% (2/2)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| expect.files_not_exist | ✅ | all checks passed |
| script: /Users/kuang/xiaobu/spec-first/skills/spec-compound/evals/fixtures/scripts/check-headless-no-complete.sh | ✅ | script passed (exit code 0) |

### 真实路径和重试关键词不能证明错误因果知识 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-compound/evals/fixtures/scripts/check-false-causal-claim.sh | ❌ | script exited with code 1 [stderr: <anonymous_script>:1
```json
^

SyntaxError: Unexpected token '`', "```json
{
"... is not valid JSON
    at JSON.parse (<anonymous>)
    at [stdin]:96:21
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3)
    at node:internal/main/eval_stdin:53:5
    at ReadStream.<anonymous> (node:internal/process/execution:201:5)

Node.js v22.22.3] |

