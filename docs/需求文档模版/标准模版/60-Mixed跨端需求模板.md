---
spec_id: YYYY-MM-DD-NNN-<slug>
artifact_kind: prd-requirements
target_surface: mixed
industry: securities
status: draft
evidence_grade: mixed
author: <作者>
created: YYYY-MM-DD
---

# <需求名称> Mixed / 跨端增量需求文档

> 本模板在「00-通用增量需求模板」骨架上，叠加 **跨端 / 多 surface / producer-consumer** 专属关注点。
>
> **WHAT not HOW**：写 source-of-truth、跨端一致性、契约期望、异步同步、降级策略和端到端验收；不写服务拆分、接口字段、数据库设计或任务排期。

---

## Summary [core]

（同通用模板：一句话需求）

## 跨端属性确认 [core，Mixed 专属]

| 维度 | 内容 |
| --- | --- |
| 涉及 surface | App / H5-PC / Admin / Backend / CLI / 第三方 / 其它 |
| 主 source-of-truth | 产品配置 / 后台服务 / Admin 操作 / 外部系统 / 待确认 |
| 主要 producer | 谁产生状态、配置、内容或 artifact |
| 主要 consumer | 谁读取、展示、执行或二次加工 |
| 是否异步同步 | 是 / 否（若是，写同步延迟和失败感知） |
| 是否存在跨端不一致允许窗口 | 是 / 否 / 待确认 |
| 是否涉及资金、交易、权限、审计 | 是 / 否（若是，必须写端到端验收） |
| 是否需要灰度 / 回滚 | 是 / 否 |

## Change Delta [core]

（同通用模板。Mixed 场景必须按 surface 拆开写 keep/extend/replace/remove/unknown，避免某端被默认带上。）

| surface | 当前行为 | 目标行为 | 一致性要求 | 证据 tag |
| --- | --- | --- | --- | --- |
| App | | | must-match / may-differ / not-applicable | |
| H5/PC | | | | |
| Admin | | | | |
| Backend | | | | |
| CLI/DevTool | | | | |

## Requirements [core]

（同通用模板：EARS + BR 编号）

Mixed 需求应把以下行为写成 R 或 BR：

- source-of-truth 谁拥有，谁只能消费。
- 状态、配置、内容、权限或 artifact 从 producer 到 consumer 的可见时机。
- 各端一致和允许差异的明确边界。
- 同步失败、延迟、回滚、灰度期间用户/运营看到什么。
- 端到端验收覆盖从 producer 到至少一个关键 consumer 的链路。

## Scope Boundaries [core]

（同通用模板。必须列出本期不覆盖的端、消费者、旧版本、历史数据或外部系统。）

## Acceptance Examples [core]

Mixed 验收必须至少覆盖一条端到端路径和一条跨端差异/失败路径。

```text
AC-01（对应 R-01）
Given <producer 端产生状态或配置>
When <同步或消费动作发生>
Then <关键 consumer 端在规定时间/状态下展示或执行一致行为>

AC-02（对应 R-02，异常）
Given <同步失败或某端不可用>
When <用户或运营查看相关端>
Then <系统展示降级状态，并不让用户误以为动作已成功>
```

## Evidence And Assumptions [core]

（同通用模板。跨端 source-of-truth、现有同步、灰度、回滚、审计与兼容主张必须标证据或进入 Outstanding Questions。）

## 行业横切关注点自检 [core，证券行业]

（复制通用模板表格并按本需求填写；Mixed 命中 C1/C6/C7/C8/C9/C10 时通常需要展开下面的专属 section。）

---

## Source-Of-Truth Resolution [conditional，Mixed 专属]

| 事实 / 状态 / 配置 / artifact | owner | producer | consumer | 冲突时以谁为准 |
| --- | --- | --- | --- | --- |
| | | | | |

必须写清：旧 source 是否废弃、过渡期是否双写、冲突如何展示给用户或运营。

## Producer / Consumer Map [conditional，Mixed 专属]

| producer | artifact / 状态 | consumer | 消费时机 | 失败影响 |
| --- | --- | --- | --- | --- |
| Admin | | App | 实时 / T+N / 手动刷新 | |
| Backend | | H5/PC | | |
| CLI/DevTool | | workflow / runtime | | |

## 跨端一致性矩阵 [conditional，Mixed 专属]

| 场景 | App | H5/PC | Admin | Backend / API 可见结果 | 是否必须一致 |
| --- | --- | --- | --- | --- | --- |
| 正常状态 | | | | | 是 / 否 |
| 无权限 | | | | | |
| 风险揭示未确认 | | | | | |
| 同步延迟 | | | | | |
| 旧版本 / 低版本 | | | | | |

允许差异必须写原因和验收方式；不能用“各端自行处理”替代需求。

## 异步同步与降级 [conditional，Mixed 专属]

| 场景 | 可接受延迟 | 用户/运营可见状态 | 失败恢复 | 是否阻塞关键动作 |
| --- | --- | --- | --- | --- |
| 配置发布 | | | | |
| 状态同步 | | | | |
| 审核结果传播 | | | | |
| runtime mirror / artifact 更新 | | | | |

## 端到端验收与回归保护 [conditional，Mixed 专属]

| E2E 场景 | 涉及 R/AE | 起点 | 终点 | 必须验证的跨端事实 |
| --- | --- | --- | --- | --- |
| | | producer | consumer | |

回归保护建议覆盖：旧端不崩、旧数据可读、权限不扩大、资金/交易结果不重复、审计链不断裂。

## Rollout / Backout [conditional，Mixed 专属]

| 项 | 产品要求 |
| --- | --- |
| 灰度对象 | |
| 各端发布顺序 | |
| 兼容窗口 | |
| 回滚后用户感知 | |
| 运营/客服口径 | |

## Exception Handling / Outstanding Questions [conditional]

（同通用模板。Mixed 重点：source-of-truth 冲突、同步延迟、局部发布、旧版本、consumer 缺失、回滚、跨端验收缺口。）

---

## 变更记录 / Handoff

（同通用模板）
