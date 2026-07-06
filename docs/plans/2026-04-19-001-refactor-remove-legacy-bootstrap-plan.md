---
title: "refactor: Remove legacy bootstrap workflow"
type: refactor
status: completed
created: 2026-04-19
author: Claude
depth: medium
---

# refactor: Remove legacy bootstrap workflow

## Overview

这份文档记录旧 Stage-0 bootstrap workflow 的撤役清单。目标是让仓库只保留 `spec-graph-bootstrap` 作为 graph-informed Stage-0 上下文生成入口，并把 runtime 安装面、治理契约、测试和用户文档统一到这一事实。

本轮不重写 `spec-graph-bootstrap` 的核心流程，也不新增新的 Stage-0 workflow 名称。

## Requirements Trace

- R1. 仓库中不再存在旧 bootstrap workflow 的 skill、命令模板、runtime 目录、测试断言或用户入口说明。
- R2. Claude 与 Codex 的 Stage-0 graph bootstrap 入口统一为 `spec-graph-bootstrap` 与 `spec-graph-bootstrap`。
- R3. `using-spec-first` 只把 graph/context bootstrap 请求路由到 `spec-graph-bootstrap` 或 `spec-compound`。
- R4. dual-host governance、plugin manifest、runtime 安装与 smoke tests 对保留入口的事实保持一致。
- R5. active README、用户手册、setup/mcp-setup 文档不再宣传旧入口。
- R6. 历史分析、计划和知识库文档也不再保留旧 workflow 名称；如需要保留内容，统一迁移到 `spec-graph-bootstrap` 语境。
- R7. 任何源码或文档变动都必须同步更新 `CHANGELOG.md`。

## Scope

### In Scope

- 删除旧 bootstrap skill 与命令模板
- 清理旧 runtime 目录
- 更新 `using-spec-first`、governance、plugin manifest 和 smoke/unit tests
- 更新 active README / 用户手册 / setup / mcp-setup 口径
- 将历史文档中的旧 workflow 命名迁移为 `spec-graph-bootstrap` 或中性的 legacy bootstrap 表述
- 补充负向守卫，防止旧名称重新出现在 source-of-truth 面

### Out of Scope

- 不删除 `skills/spec-graph-bootstrap/`
- 不删除 `templates/claude/commands/spec/graph-bootstrap.md`
- 不改变 `spec-graph-bootstrap` 的 Phase 0-4 产物契约
- 不把 `spec-compound` 改造成 graph bootstrap 的替代品

## Decisions

### D1. 不保留兼容壳

旧入口彻底退场，不保留 alias、转发模板或空壳 skill。保留壳会继续制造入口歧义。

### D2. 只保留 graph bootstrap 当前入口

Stage-0 graph-informed 上下文生成统一使用：

- Claude: `spec-graph-bootstrap`
- Codex: `spec-graph-bootstrap`

知识捕获和复合上下文整理仍由 `spec-compound` / `spec-compound` 承接。

### D3. 历史文档也清旧名

本轮采用更严格的仓库级命名收口：不再把旧 workflow 名称保留在历史 plans、brainstorms、analysis 或 changelog 中。需要保留历史内容时，改写为 `spec-graph-bootstrap` 或“旧 Stage-0 bootstrap”。

## Verification Checklist

- `rg` 查不到旧 workflow 名称、旧入口、旧 runtime 路径或旧命令模板路径。
- `find` 查不到旧 workflow 名称相关文件或目录。
- `npm run test:unit` 通过。
- `npm run test:smoke` 通过。
- `npm pack --dry-run` 仍包含 `skills/spec-graph-bootstrap/SKILL.md` 与 `templates/claude/commands/spec/graph-bootstrap.md`。
