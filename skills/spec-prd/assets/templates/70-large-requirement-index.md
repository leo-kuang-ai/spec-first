# <大需求名称> 总索引模板

> 仅在当前执行对话用户确认拆分边界后使用。它是导航、范围和跨文档关系视图，不承载具体 Requirements、Acceptance 或实现任务。
>
> Frontmatter 使用 `references/prd-output-template.md` 的 split-summary contract；不要从本文件自行声明 ready。

## 需求全景

说明整体问题、目标用户、业务结果、涉及 surface、为什么必须拆分，以及哪些规则仍由所有子 PRD 共享。

## 整体边界

| 维度 | 内容 |
| --- | --- |
| In Scope | |
| Non-Goals | |
| 共享默认行为 | |
| 共享术语 source | |
| 共享数据 / 权限边界 | |
| 统一发布约束 | |

## 子 PRD 清单

| child_id | 文档 | 独立业务结果 | In Scope | Non-Goals | primary surface | 状态 / blocker |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

每篇子 PRD 必须能独立进入 `spec-plan`，并拥有自己的 Requirements、Acceptance Examples、Scope Boundaries、Evidence 和 readiness receipt。

## 跨文档依赖

| from child | to child | 依赖内容 | 是否改变 WHAT | 未满足影响 | source / 决定 |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

不要把 task sequencing 或文件级依赖写入这里；这里只记录产品级前置关系和共享 contract。

## Source-Of-Truth 与共享规则

| item | source-of-truth | consumers | conflict rule | child refs |
| --- | --- | --- | --- | --- |
| | | | | |

## 整体验收

| AE | 场景 | 涉及 child | 整体可观察结果 | 负向保护 |
| --- | --- | --- | --- | --- |
| AE-X01 | | | | |

整体验收只覆盖跨 child 结果；单模块验收留在对应子 PRD。

## 大需求级待闭合问题候选

> 这里只提示跨 child 候选缺口，不生成第二套 OQ schema；真正未闭合的问题统一移入 output contract 的 canonical `Outstanding Questions`。

| 候选缺口 | 影响 child | 先查 source | 推荐答案 / 待确认原因 |
| --- | --- | --- | --- |
| | | | |

## Handoff

- 总索引不是 implementation plan。
- planning 通常从具体 child PRD 开始，并保留 parent/split trace。
- 任一 child 仍需 planning 发明 WHAT 时，该 child 不得以总索引为由宣称 ready。
