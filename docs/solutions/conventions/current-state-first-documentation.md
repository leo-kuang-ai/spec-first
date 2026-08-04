---
title: 当前态优先的文档表达
date: 2026-07-12
category: conventions
module: documentation-governance
problem_type: convention
component: documentation
severity: medium
applies_when:
  - 能力、入口、Provider、配置或 artifact 已被删除、退役或完整替代
  - 更新 README、用户手册、当前 contract、skill 文案或交付摘要
  - 决定历史名称、旧路径或旧实现是否仍需保留
tags: [current-state, documentation-governance, retirement, source-of-truth]
---

# 当前态优先的文档表达

## Context

实现完成删除、退役或替代后，文档容易继续用大量反向说明解释旧能力，例如反复描述“不再支持什么”或“不得回到什么”。这些句子即使事实正确，也会让已消失的设计继续占据用户和 agent 的主要心智。

当前态文档应直接说明现存能力、权威边界和有效操作。历史材料不应反向成为当前 runtime contract。

## Guidance

README、用户手册、当前 contract、skill 主流程和交付摘要采用正向当前态表达：

- 说明现在唯一有效的入口、依赖、artifact 和恢复方式。
- 删除已失效能力的功能介绍、对照表、fallback 分支和重复警告。
- 测试当前行为与确定性边界，不以字符串断言长期保留旧名称。
- source 收敛后，通过正式生成流程刷新 runtime，避免派生面重新投影旧叙事。

历史信息只在存在当前消费者时保留，并放在最窄所有权面：

- 安全清理需要识别历史残留时，标识符留在 cleanup resolver 与安全测试中。
- 单向迁移仍需读取旧状态时，信息留在 migration contract 中。
- 决策与验证来源留在 CHANGELOG、git history、validation artifact 或事故复盘中。

如果旧引用既不改变当前用户决策，也不支撑清理、迁移或追溯，就直接删除，不再通过“已退役”“禁止恢复”等反向文案维持它的存在感。

## Why This Matters

当前文档是用户和 coding agent 的高权重输入。持续突出已失效能力会制造错误入口、多真相源和隐性兼容义务，也会诱导后续维护者重新补回已经删除的分支。

当前态优先让 source 只表达仍然成立的事实；必要历史证据仍可追溯，但不会与当前能力争夺注意力。

## When to Apply

- 多实现收敛为单一 Provider 或单一 source of truth。
- 公开 workflow、skill、agent、command 或 fallback 被删除或合并。
- 一次性迁移完成后清理用户文档和当前合同。
- durable knowledge 中的历史案例开始被误读为当前操作建议。

## Examples

优先写：

> Graphify 使用 PyPI `graphifyy`，通过隔离的 Python tool environment 运行。

避免把主说明组织成一长串旧实现对照和禁止项。若清理代码仍需识别历史 package，该名称留在清理实现和安全测试即可。

## Related

- [Skill 发布时保持 command surface 一致](./skill-publication-command-surface-alignment-2026-06-23.md)
- [钢筋化 Skill 简化模式](../architecture-patterns/rebar-structure-skill-simplification-pattern-2026-06-04.md)
- [上游 CE 同步升级方法](../architecture-patterns/upstream-ce-sync-upgrade-methodology-2026-04-26.md)
- [修改源头而非生成产物](../workflow-issues/modify-source-not-artifacts-2026-04-13.md)
