# Skill Benchmark: spec-compound-refresh

**Date**: 2026-11-04T11:59:29Z
**Evals**: 与 docs/solutions 无关的请求应被 scope gate 拦下, 独有离线知识与实质引用阻止误删, 部分发布不能被完整的成功报告掩盖, 恢复部分发布时保留人工条目及完整知识 (1 runs each per configuration)

## Summary

| Metric | With Skill |
|--------|------------|
| Pass Rate | 25% ± 43% |

## Per-Case Results

### 与 docs/solutions 无关的请求应被 scope gate 拦下 (with_skill)

- **Pass Rate**: 100% (1/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-compound-refresh/evals/fixtures/scripts/check-scope-gate.sh | ✅ | script passed (exit code 0) |

### 独有离线知识与实质引用阻止误删 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-compound-refresh/evals/fixtures/scripts/check-publication-preserve.sh | ❌ | script exited with code 1 [stderr: <anonymous_script>:1
调查完成。证据链汇总：
^

SyntaxError: Unexpected token '调', "调查完成。证据链汇总"... is not valid JSON
    at JSON.parse (<anonymous>)
    at checkKnowledgePublication ([stdin]:106:23)
    at [stdin]:155:1
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3)
    at node:internal/main/eval_stdin:53:5

Node.js v22.22.3] |

### 部分发布不能被完整的成功报告掩盖 (with_skill)

- **Pass Rate**: 0% (0/1)

| Expectation | Result | Evidence |
|-------------|--------|----------|
| script: /Users/kuang/xiaobu/spec-first/skills/spec-compound-refresh/evals/fixtures/scripts/check-publication-partial.sh | ❌ | script exited with code 1 [stderr: <anonymous_script>:1
核对完成。入站引用检查确认：`docs/solutions/catalog.md:3` 存在指向 `old.md#离线恢复` 的实质性链接；`prepare-eval.cjs` 仅创建了基线提交 `18546c0`，本轮工作区无任何变更（`?? .claude/` 为会话前既有的 skill 目录）。
^

SyntaxError: Unexpected token '核', "核对完成。入站引用检"... is not valid JSON
    at JSON.parse (<anonymous>)
    at checkKnowledgePublication ([stdin]:106:23)
    at [stdin]:155:1
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:446:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:444:60)
    at evalFunction (node:internal/process/execution:279:30)
    at evalTypeScript (node:internal/process/execution:291:3)
    at node:internal/main/eval_stdin:53:5

Node.js v22.22.3] |

### 恢复部分发布时保留人工条目及完整知识 (with_skill)

- **Pass Rate**: 0% (0/0)

