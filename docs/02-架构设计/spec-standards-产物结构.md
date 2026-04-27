# spec-standards 产物结构说明

本文说明当前 `spec-standards` MVP 开发完成后会落盘的最终产物、文件内容、正式性与消费方。

核心边界：

```text
docs/specs/**                         正式规范资产
docs/specs/_index/**                  正式规范索引
docs/specs/reports/**                 辅助报告
.spec-first/workflows/spec-standards/**          规范草案运行产物
.spec-first/workflows/spec-standards-refresh/**  refresh 请求运行产物
.spec-first/workflows/<consumer>/<task-id>/**    plan/work/review 消费上下文
docs/contracts/specs/**               schema contract
```

`docs/specs/**/*.md` 是唯一正式规范源。`.spec-first/workflows/**` 只保存草案、请求和单次任务上下文，不是正式规范源。

## 1. 正式规范资产

| 文件 / 路径 | 内容 | 生成 / 写入时机 | 是否正式生效 | 说明 |
| --- | --- | --- | --- | --- |
| `docs/specs/README.md` | 规范目录说明、使用入口、人工维护说明 | `spec-first specs init` | 是 | 给人看的规范库入口 |
| `docs/specs/SPEC.md` | 规范系统总入口、加载原则、优先级说明 | `init` 或 promote | 是 | 后续 agent 可先读的规范总说明 |
| `docs/specs/architecture.md` | 项目架构类规范 | 人工 promote 或手写 | 是 | 当前已生成正式规范 |
| `docs/specs/governance.md` | spec-first 治理边界、脚本 / LLM 分工规范 | 人工 promote 或手写 | 是 | 当前已生成正式规范 |
| `docs/specs/workflow-boundaries.md` | workflow 边界、入口、产物职责规范 | 人工 promote 或手写 | 是 | 当前已生成正式规范 |
| `docs/specs/changelog-iron-law.md` | changelog 强制治理规则 | 人工 promote | 是 | 当前已生成正式规范 |
| `docs/specs/testing-layers.md` | 测试分层与验证规范 | 人工 promote | 是 | 当前已生成正式规范 |
| `docs/specs/common/**/*.md` | 通用规范，例如安全、依赖、测试、Git 工作流 | promote / 手写 | 是 | 当前结构支持，具体文件按项目生成 |
| `docs/specs/backend/**/*.md` | 后端规范，例如 API、错误处理、数据库、日志 | promote / 手写 | 是 | 当前结构支持，按项目需要生成 |
| `docs/specs/frontend/**/*.md` | 前端规范，例如组件、权限、API client、样式 | promote / 手写 | 是 | 当前结构支持，按项目需要生成 |
| `docs/specs/custom/**/*.md` | 团队人工覆盖规范 | 用户手写 / promote | 是，优先级最高 | 自动 refresh 不允许覆盖 manual/custom |

## 2. 规范文件格式

正式规范文件使用 Markdown + YAML frontmatter。无 frontmatter 的 manual 文档也支持索引，但 `validate` 会提示补齐 metadata。

| 区域 | 内容 | 是否必需 | 说明 |
| --- | --- | --- | --- |
| YAML Frontmatter | `spec_id`、`title`、`source`、`confirmation_status`、`lifecycle_status`、`level`、`scope`、`categories`、`keywords`、`applies_to_paths`、`priority`、`severity`、`confidence`、`status` | 推荐必填 | 用于索引、resolve、check |
| `# Title` | 规范标题 | 是 | 人读入口 |
| `## Summary for Agent` | 给 agent 的短摘要 | 强烈推荐 | `resolve` 命中 summary 模式时优先读取 |
| `## Rules` | 具体规则列表 | 可选但推荐 | `rules-map.json` 会抽取规则标题 |
| `### RULE-...` | 规则 ID + 标题 | 可选 | 用于 check report 中定位候选规则 |
| 证据 / 检查方式 | 规则来源、证据文件、建议检查方法 | 可选 | LLM review 的输入，不是脚本 hard gate |

示例：

```markdown
---
spec_id: backend-api
title: Backend API
source: manual
confirmation_status: manual
lifecycle_status: active
level: L4
scope:
  - backend
categories:
  - api
keywords:
  - controller
  - response
applies_to_paths:
  - "src/main/java/**/controller/**"
priority: 100
severity: high
confidence: high
status: active
---

# Backend API

## Summary for Agent

- New backend APIs must follow the project response and error handling standards.

## Rules

### RULE-BACKEND-API-001 Unified response

- New controllers should use the project-approved response wrapper.
```

## 3. 正式规范索引

| 文件 / 路径 | 内容 | 生成 / 写入时机 | 是否正式生效 | 说明 |
| --- | --- | --- | --- | --- |
| `docs/specs/_index/specs-index.json` | 所有正式规范的机器索引：路径、标题、source、scope、keywords、priority、token 估算等 | `index` / `promote` / `refresh --index-only` | 是 | `resolve` 的主输入，不全量读规范 |
| `docs/specs/_index/specs-index.md` | 人可读索引表 | `index` | 是 | 方便人工浏览当前规范库 |
| `docs/specs/_index/rules-map.json` | 从规范中抽取的规则映射、规则 ID、适用路径、检查方式 | `index` | 是 | `check` 的候选规则来源 |
| `docs/specs/_index/profiles.json` | 当前项目检测到的轻量 profiles | `index` / promote 后重建 | 是 | 用于后续 resolve 加权 |
| `docs/specs/_index/last-scan.json` | 最近一次索引扫描信息、source hash、生成时间 | `index` | 是 | 用于 freshness / 可重建审计 |

## 4. 辅助报告

| 文件 / 路径 | 内容 | 生成 / 写入时机 | 是否正式生效 | 说明 |
| --- | --- | --- | --- | --- |
| `docs/specs/reports/spec-check-report.json` | check 的机器可读报告：changed files、加载的规范、review items、enforcement posture | `spec-first specs check` | 否 | 辅助 LLM/reviewer，不是 hard gate |
| `docs/specs/reports/spec-check-report.md` | check 的人可读报告 | `check` | 否 | 给人工审查使用 |
| `docs/specs/reports/spec-refresh-report.json` | refresh 报告：`mode=index-only\|changed`、是否改动规范、proposal request 路径 | `refresh` | 否 | 报告本次 refresh 行为 |
| `docs/specs/reports/spec-refresh-report.md` | refresh 的人可读报告 | `refresh` | 否 | 给人工审查使用 |

## 5. 规范草案运行产物

`$spec-standards` 生成草案时写入 `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/`。这些产物 promote 前不正式生效。

| 文件 / 路径 | 内容 | 生成 / 写入时机 | 是否正式生效 | 说明 |
| --- | --- | --- | --- | --- |
| `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/run-state.json` | 本次 proposal run 状态、target、consumer、evidence mode、时间 | `write-proposal` | 否 | 运行审计文件 |
| `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/preview.md` | 草案预览，给人审查 | `$spec-standards` + `write-proposal` | 否 | human confirm 的入口 |
| `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/detected-profiles.json` | LLM/CRG 识别出的项目 profiles | `write-proposal` | 否 | 草案证据之一 |
| `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/evidence-map.json` | CRG evidence、graph quality、source queries、limitations、redaction 状态 | `write-proposal` | 否 | 说明草案从哪些事实推导 |
| `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/drafts/**/*.md` | 待确认的规范 Markdown 草案 | `write-proposal` | 否 | promote 后才进入 `docs/specs/**` |
| `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/rejected/inferred-rules.md` | 被拒绝或不应直接沉淀的 inferred 候选 | `write-proposal` | 否 | 防止“现状等于规范” |
| `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/rejected/uncertain-rules.md` | 低置信度、不确定候选 | `write-proposal` | 否 | 留给人工判断 |
| `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/rejected/conflicts.md` | 冲突候选 | `write-proposal` | 否 | 不自动裁决 |
| `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/promote-report.json` | 人工 promote 结果：accepted / rejected / deferred / promoted paths | `promote` | 否 | 审计本次人工确认 |

## 6. Changed Refresh 请求产物

`spec-first specs refresh --changed` 或 `--files` 不直接改规范，而是生成后续 `$spec-standards` 的输入请求。

| 文件 / 路径 | 内容 | 生成 / 写入时机 | 是否正式生效 | 说明 |
| --- | --- | --- | --- | --- |
| `.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/refresh-request.json` | changed refresh 的结构化请求：changed files、task、resolve result、proposal instruction | `refresh --changed` 或 `refresh --files` | 否 | 后续交给 `$spec-standards` 生成草案 |
| `.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/preview.md` | changed refresh 请求预览 | `refresh --changed/files` | 否 | 人读摘要 |
| `.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/check.jsonl` | changed files 命中的规范加载上下文 | `refresh --changed/files` | 否 | 辅助 `$spec-standards` 判断是否需要更新规范 |

## 7. 任务消费上下文

当后续 workflow 调用 `spec-first specs resolve` 时，会为具体任务生成按需加载计划。它们是单次任务上下文，可重建，不是规范源。

| 文件 / 路径 | 内容 | 生成 / 写入时机 | 是否正式生效 | 说明 |
| --- | --- | --- | --- | --- |
| `.spec-first/workflows/spec-plan/<task-id>/resolve-result.json` | plan 阶段规范加载决策结果 | `specs resolve --consumer spec-plan` | 否 | 任务级缓存，可重建 |
| `.spec-first/workflows/spec-plan/<task-id>/implement.jsonl` | plan 可读取的规范文件列表和模式 | `resolve` | 否 | `full` / `summary` |
| `.spec-first/workflows/spec-plan/<task-id>/check.jsonl` | plan 检查用上下文 | `resolve` | 否 | 与规范检查相关 |
| `.spec-first/workflows/spec-work/<task-id>/resolve-result.json` | work 阶段规范加载决策结果 | `resolve --consumer spec-work` | 否 | 编码前按需加载 |
| `.spec-first/workflows/spec-work/<task-id>/implement.jsonl` | work 实现阶段应读哪些规范 | `resolve` | 否 | 避免全量读 `docs/specs/**` |
| `.spec-first/workflows/spec-work/<task-id>/check.jsonl` | work 检查上下文 | `resolve` | 否 | 给实现后自查用 |
| `.spec-first/workflows/spec-code-review/<task-id>/resolve-result.json` | review 阶段规范加载决策结果 | `resolve --consumer spec-code-review` | 否 | review 输入 |
| `.spec-first/workflows/spec-code-review/<task-id>/implement.jsonl` | review 可参考的规范上下文 | `resolve` | 否 | 兼容统一 consumer 输出 |
| `.spec-first/workflows/spec-code-review/<task-id>/check.jsonl` | review 应重点检查的规范上下文 | `resolve` | 否 | code review 使用 |
| `.spec-first/workflows/spec-check/<task-id>/resolve-result.json` | check 内部复用的 resolve 结果 | `specs check` | 否 | 支撑 check report |
| `.spec-first/workflows/spec-check/<task-id>/implement.jsonl` | check 复用输出 | `check` | 否 | 统一格式 |
| `.spec-first/workflows/spec-check/<task-id>/check.jsonl` | check 实际检查上下文 | `check` | 否 | 供 LLM/reviewer 使用 |

## 8. Schema Contract

| 文件 / 路径 | 内容 | 作用 | 说明 |
| --- | --- | --- | --- |
| `docs/contracts/specs/standards-proposal-payload-v1.schema.json` | proposal payload schema | 约束 LLM 到 helper 的交接格式 | `write-proposal` 的 contract |
| `docs/contracts/specs/standards-run-state-v1.schema.json` | run-state schema | 约束 proposal run 状态文件 | `validate-run` 参考 |
| `docs/contracts/specs/detected-profiles-v1.schema.json` | detected profiles schema | 约束 profile 识别结果 | proposal evidence |
| `docs/contracts/specs/evidence-map-v1.schema.json` | evidence map schema | 约束 CRG evidence 记录 | 防止草案与事实脱钩 |
| `docs/contracts/specs/spec-frontmatter-v1.schema.json` | 规范 Markdown frontmatter schema | 约束正式规范文件元数据 | `index/validate` 参考 |
| `docs/contracts/specs/standards-refresh-proposal-request-v1.schema.json` | refresh proposal request schema | 约束 `refresh --changed/files` 请求产物 | changed refresh contract |

## 9. 真相源关系

| 类型 | 真相源级别 | 可否提交共享 | 是否可重建 | 主要消费者 |
| --- | --- | --- | --- | --- |
| `docs/specs/**/*.md` | 正式真相源 | 是 | 否，人工确认资产 | plan / work / review / check |
| `docs/specs/_index/**` | 机器索引 | 是 | 是 | resolve / check |
| `docs/specs/reports/**` | 辅助报告 | 可选 | 是 | 人工 / LLM review |
| `.spec-first/workflows/spec-standards/**` | 草案运行产物 | 通常否 | 是 | 人工 promote |
| `.spec-first/workflows/spec-standards-refresh/**` | refresh 请求产物 | 通常否 | 是 | `$spec-standards` |
| `.spec-first/workflows/<consumer>/<task-id>/**` | 单次任务上下文 | 通常否 | 是 | 对应 workflow |
| `docs/contracts/specs/**` | contract 文档 | 是 | 否 | CLI / tests / 实现者 |

