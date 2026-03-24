# gstack 实现层文档索引

本文档用于索引当前围绕 `/implement-tdd` 形成的终版文档与配套草案。

## 终版文档

这些文档代表当前已经收敛的正式方案。

1. [`gstack-flow-style-deep-analysis-zh.md`](/Users/kuang/xiaobu/gstack/docs/tdd需求/gstack-flow-style-deep-analysis-zh.md)
   说明 gstack 的流程风格、artifact 倾向、specialist workflow 特征，以及为什么实现层应该补成 `/implement-tdd`。

2. [`implementation-lead-role-definition-zh.md`](/Users/kuang/xiaobu/gstack/docs/tdd需求/implementation-lead-role-definition-zh.md)
   定义 `Implementation Lead / TDD Engineer` 角色，包括输入模式、输出产物、职责边界，以及与 `/plan-eng-review`、`/review`、`/qa`、`/ship` 的关系。

## 草案文档

这些文档用于后续真正接入 skill 模板和生成链路。

1. [`implement-tdd-SKILL-draft.md`](/Users/kuang/xiaobu/gstack/docs/tdd需求/implement-tdd-SKILL-draft.md)
   `/implement-tdd` 的可执行型 `SKILL.md` 草案，已经接近正式模板，但尚未迁入 `.tmpl`。

2. [`implement-tdd-template-integration-checklist-zh.md`](/Users/kuang/xiaobu/gstack/docs/tdd需求/implement-tdd-template-integration-checklist-zh.md)
   记录后续如何把草案迁入 `SKILL.md.tmpl`、接入生成链路、运行校验命令。

## 当前结论

当前文档体系已经统一到以下口径：

- `/execute-plan` 已经并入 `/implement-tdd`
- `/implement-tdd` 是唯一的实现阶段 skill
- 默认使用 `plan-backed mode`
- 小 bugfix / 小调整允许 `context-backed mode`
- 解耦的是输入来源，不解耦的是角色职责

## 推荐阅读顺序

如果第一次进入这组文档，建议按这个顺序阅读：

1. [`gstack-flow-style-deep-analysis-zh.md`](/Users/kuang/xiaobu/gstack/docs/tdd需求/gstack-flow-style-deep-analysis-zh.md)
2. [`implementation-lead-role-definition-zh.md`](/Users/kuang/xiaobu/gstack/docs/tdd需求/implementation-lead-role-definition-zh.md)
3. [`implement-tdd-SKILL-draft.md`](/Users/kuang/xiaobu/gstack/docs/tdd需求/implement-tdd-SKILL-draft.md)
4. [`implement-tdd-template-integration-checklist-zh.md`](/Users/kuang/xiaobu/gstack/docs/tdd需求/implement-tdd-template-integration-checklist-zh.md)
