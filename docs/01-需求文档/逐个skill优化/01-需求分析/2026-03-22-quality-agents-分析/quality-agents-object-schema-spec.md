# Quality Agents Object Schema 规格

文档状态：Draft v1
文档日期：2026-03-22
适用范围：Quality Agents V0.1

## 1. 文档目标

本稿定义 Quality Agents 平台的最小统一对象 schema。

设计目标：

- 对象数尽量少
- 字段稳定且长期可复用
- 支持 skill 之间共享
- 支持 memory、evidence、gate evaluator 消费

## 2. 设计原则

### 2.1 最小集合

第一阶段只保留：

- Problem
- Scope
- Assumption
- Risk
- Decision
- Finding
- Evidence

### 2.2 统一字段

所有对象共享一组基础字段，便于索引、版本和引用。

### 2.3 可追溯

所有对象必须能追溯到来源、关联对象和更新时间。

## 3. 通用基础字段

所有对象必须包含：

- `id`
- `type`
- `title`
- `status`
- `created_at`
- `updated_at`
- `source`
- `related_ids`
- `summary`

### 3.1 字段说明

`id`
- 全局唯一标识

`type`
- 对象类型，如 `problem`、`scope`

`title`
- 简要标题

`status`
- 当前状态，如 `draft`、`confirmed`、`superseded`

`created_at` / `updated_at`
- ISO 时间戳

`source`
- 来源，如 `skill:/clarify`、`user`、`file`

`related_ids`
- 关联对象 id 数组

`summary`
- 一段摘要

## 4. Problem Schema

### 4.1 语义

Problem 定义真正要解决的问题，而非表层功能描述。

### 4.2 必填字段

- `statement`
- `user_context`
- `success_criteria`
- `non_goals`

### 4.3 建议结构

```yaml
id: problem-001
type: problem
title: Daily briefing is framed too narrowly
status: confirmed
created_at: 2026-03-22T10:00:00Z
updated_at: 2026-03-22T10:05:00Z
source: skill:/clarify
related_ids: []
summary: 当前用户表述的是日报功能，但真正问题是会议准备质量不足。
statement: 用户真正需要的是高质量会议准备，而不是一个表面的日报页面。
user_context:
  - 用户需要跨多个日历源组织会议信息
  - 现有准备方式效率低且质量不稳定
success_criteria:
  - 能提前形成高质量会前准备摘要
  - 能减少遗漏、错误地点和过期信息
non_goals:
  - 不做完整 CRM 平台
  - 不做所有日历功能整合
```

## 5. Scope Schema

### 5.1 语义

Scope 描述本次明确做什么、不做什么。

### 5.2 必填字段

- `problem_id`
- `in_scope`
- `out_of_scope`
- `acceptance_boundary`

### 5.3 建议结构

```yaml
id: scope-001
type: scope
title: V0 scope for briefing preparation
status: confirmed
created_at: 2026-03-22T10:10:00Z
updated_at: 2026-03-22T10:12:00Z
source: skill:/scope-lock
related_ids:
  - problem-001
summary: 仅聚焦高质量会前准备，不扩展到完整关系管理。
problem_id: problem-001
in_scope:
  - 会议准备摘要
  - 日历信息聚合
  - 错误信息暴露
out_of_scope:
  - 完整 CRM
  - 自动排期
acceptance_boundary:
  - 用户可得到一份可用的会前准备摘要
deferred_items:
  - 联系人画像系统
```

## 6. Assumption Schema

### 6.1 语义

Assumption 表示当前判断所依赖的前提。

### 6.2 必填字段

- `problem_id`
- `statement`
- `confidence`

### 6.3 建议结构

```yaml
id: assumption-001
type: assumption
title: Calendar remains the anchor data source
status: active
created_at: 2026-03-22T10:20:00Z
updated_at: 2026-03-22T10:20:00Z
source: skill:/challenge
related_ids:
  - problem-001
summary: 当前方案假设日历仍然是主数据入口。
problem_id: problem-001
statement: Calendar data is sufficient as the initial anchor for meeting preparation.
confidence: medium
evidence_refs: []
```

## 7. Risk Schema

### 7.1 语义

Risk 描述潜在失败点、偏差点或质量隐患。

### 7.2 必填字段

- `description`
- `severity`
- `likelihood`

### 7.3 建议结构

```yaml
id: risk-001
type: risk
title: Scope may drift into CRM system
status: open
created_at: 2026-03-22T10:30:00Z
updated_at: 2026-03-22T10:30:00Z
source: skill:/challenge
related_ids:
  - problem-001
  - scope-001
summary: 若不锁定边界，需求可能自然膨胀成 CRM 平台。
description: Briefing preparation may expand into contact management and relationship modeling.
severity: high
likelihood: medium
mitigation: Lock scope early and defer CRM capabilities explicitly.
```

## 8. Decision Schema

### 8.1 语义

Decision 表示重要取舍和边界决定。

### 8.2 必填字段

- `problem_id`
- `summary`
- `reasoning`

### 8.3 建议结构

```yaml
id: decision-001
type: decision
title: Start from briefing wedge
status: active
created_at: 2026-03-22T10:40:00Z
updated_at: 2026-03-22T10:40:00Z
source: skill:/scope-lock
related_ids:
  - problem-001
  - scope-001
summary: 先做 briefing wedge，不扩展 CRM。
problem_id: problem-001
reasoning: Narrow wedge creates faster validation and avoids scope explosion.
tradeoffs:
  - CRM depth is delayed
evidence_refs: []
supersedes: []
```

## 9. Finding Schema

### 9.1 语义

Finding 是 skill 在 challenge/review/design-review/qa 过程中发现的问题。

### 9.2 必填字段

- `category`
- `severity`
- `details`

### 9.3 建议结构

```yaml
id: finding-001
type: finding
title: Failure path for stale event data is undefined
status: open
created_at: 2026-03-22T10:50:00Z
updated_at: 2026-03-22T10:50:00Z
source: skill:/design-review
related_ids:
  - problem-001
  - scope-001
summary: 设计未定义事件信息过期时如何处理。
category: design-gap
severity: high
details: The design describes the summary generation flow but not how to detect and surface stale event information.
recommended_action: Add a stale-data detection and warning path.
```

## 10. Evidence Schema

### 10.1 语义

Evidence 是支撑 decision、finding、risk 或 gate 结果的证据。

### 10.2 必填字段

- `evidence_type`
- `source`
- `summary`
- `related_object`
- `confidence`

### 10.3 建议结构

```yaml
id: evidence-001
type: evidence
title: User examples show stale event data pain
status: active
created_at: 2026-03-22T11:00:00Z
updated_at: 2026-03-22T11:00:00Z
source: user
related_ids:
  - problem-001
summary: 用户明确提到错误地点和过期信息导致准备质量差。
evidence_type: text_evidence
related_object: problem-001
confidence: high
artifact_ref: null
```

## 11. 存储格式建议

V0.1 推荐采用：

- YAML frontmatter
- Markdown body

原因：

- 便于人工阅读
- 便于 agent 解析
- 便于后续 git diff 审查

建议结构：

```markdown
---
id: problem-001
type: problem
...
---

## Notes

这里放补充说明。
```

## 12. 命名与 ID 约定

建议前缀：

- `problem-`
- `scope-`
- `assumption-`
- `risk-`
- `decision-`
- `finding-`
- `evidence-`

建议格式：

- `problem-20260322-001`

## 13. 对象状态建议

统一状态枚举建议：

- `draft`
- `confirmed`
- `active`
- `resolved`
- `superseded`
- `archived`

## 14. Schema 校验建议

V0.1 至少实现：

- required fields 校验
- `type` 与目录对应校验
- `related_ids` 格式校验
- 状态枚举校验

## 15. 结论

对象 schema 的设计目标不是追求丰富，而是提供一组足够稳定、足够小、足够能复用的质量对象。

只要对象层稳定，skills、memory、evidence 和 gates 才不会很快失控。
