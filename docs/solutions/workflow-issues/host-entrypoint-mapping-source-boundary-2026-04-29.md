---
title: 宿主入口映射只属于 init 和治理层
date: 2026-04-29
category: workflow-issues
module: workflow-entrypoint-governance
problem_type: workflow_issue
component: development_workflow
severity: medium
applies_when:
  - "修改 workflow、skill、README 或 handoff 文案时需要引用宿主入口"
  - "修复 Codex-only 或 Claude-only 文案时"
  - "检查 generated runtime 与 source-of-truth 是否漂移时"
tags: [host-entrypoints, workflow-governance, runtime-assets, source-truth]
related_components: [codex-runtime, claude-runtime, documentation]
---

# 宿主入口映射只属于 init 和治理层

## Context

一次入口文案修复中，原问题是部分共享说明只写了 Codex 的 `spec-*` 入口。错误修复方向是把普通 prose 改成“`spec-*` on Claude Code 与 `spec-*` on Codex”这种双宿主映射。

这看似补齐了 Claude/Codex，但实际破坏了 spec-first 的边界：`spec-first init --claude` 和 `spec-first init --codex` 已经负责生成宿主专属 runtime 产物，普通 workflow prose 不应再维护第二份入口映射。

## Guidance

普通 workflow、skill、handoff、README 共享流程说明中，只描述语义入口：

```markdown
Use the current host's setup workflow.
Use the current host's graph bootstrap workflow.
Use the current host's plan entrypoint.
```

不要在这些普通 prose 中写宿主分支：

```markdown
Use `spec-mcp-setup` on Claude Code and `spec-mcp-setup` on Codex.
```

可以承载 Claude/Codex 映射的地方很少，应该集中在明确的入口治理层：

- `spec-first init --claude` / `spec-first init --codex` 的生成产物和输出提示
- host adapter 与 dual-host governance contract
- README 的集中 `Workflow Entry Points` 表
- 专门验证 host delivery 的 contract tests

判断一个文案是否越界的简单规则：如果这段 prose 会被复制进不同宿主的 runtime，优先写“current host”；如果这段内容本身就是中心入口表或 init 输出，才列具体宿主命令。

## Why This Matters

入口映射散落在普通 prose 中会形成第二真相源。未来 entrypoint 命名、host delivery 或新增宿主变化时，init/adapters 已经能生成正确 runtime，但普通 prose 仍可能保留旧命令，导致用户被带到错误入口。

这也会污染测试方向。错误测试会把“同时出现 `spec-*` 和 `spec-*`”当成双宿主质量，实际上更应该测试普通 prose 不复制映射，且中心入口表仍保留公开对照。

## When to Apply

- 修复只写 `spec-*` 或只写 `spec-*` 的共享说明时
- 更新 skill 的 usage、handoff、fallback、缺依赖提示时
- 调整 README 顶部路径、graph readiness 流程、workflow next step 文案时
- 比较 source skill 和 `.agents/skills/`、`.claude/spec-first/workflows/` generated runtime 时

## Examples

共享说明中的修复：

```diff
-- Required harness runtime setup through `spec-mcp-setup`.
+ Required harness runtime setup through the current host's setup workflow.
```

不要改成：

```diff
-- Required harness runtime setup through `spec-mcp-setup`.
+ Required harness runtime setup through `spec-mcp-setup` on Claude Code and `spec-mcp-setup` on Codex.
```

测试中的正确防线：

```js
expect(readme).toContain("current host's setup workflow");
expect(readme).not.toContain('host-specific setup workflow (`spec-mcp-setup` on Claude Code');
```

中心入口表仍然可以保留具体映射：

```markdown
| Intent | Claude Code | Codex |
|---|---|---|
| Setup required harness runtime | `spec-mcp-setup` | `spec-mcp-setup` |
```

## Related

- `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md`
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`
