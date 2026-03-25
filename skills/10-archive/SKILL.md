---
name: "spec-first:archive"
description: "Use when a feature is in 06_wrap_up and you need to archive delivery evidence, summarize outcomes, and prepare release handoff."
version: 1.1.0
last_updated: 2026-03-05
changelog: v1.1.0 - 新增自动 Feature 定位（优先读取 .spec-first/current）
---

# Skill: archive

## Node Workflow Update

- archive 负责 `06_wrap_up` 节点的总结与归档，不再依赖 gate 通过后再执行
- 若 wrap-up 已完成，后续推进建议使用 `spec-first transition <featureId>`

归档 Feature 交付物，生成复盘报告与覆盖率总结。

## 输入上下文

执行此 skill 时，从 `.spec-first/runtime/first/` 加载以下产物：

| 产物 | 优先级 | 用途 |
|------|--------|------|
| `summary` | 必需 | 项目概览，理解技术栈和模块划分 |
| `structure-overview` | 推荐 | 代码结构，理解模块边界 |
| `domain-model` | 推荐 | 领域模型，理解业务概念 |

> **缺失处理**: 如果必需产物不存在，提示用户先执行 `/spec-first:first`


## break-loop 核心理念（P1-BL）

> 调试的价值不在于修复这个 bug，而在于让这类 bug 不再重复发生。

复盘输出至少覆盖三层洞察：
1. 战术层：如何修复本次问题
2. 战略层：如何预防同类问题
3. 哲学层：如何沉淀可复用的方法论

## 触发条件
- 阶段: 06_wrap_up
- Command: `/spec-first:archive`


## Feature 定位规则

### 优先级

1. **显式参数**: 用户提供 featureId 参数时直接使用
2. **自动定位**: 读取 `.spec-first/current` 获取当前激活 Feature
3. **交互式**: 列出可用 Feature 供用户选择

### 错误处理

- `.spec-first/current` 不存在或为空 → 降级到交互式
- 指定 Feature 不存在 → 报错并终止

## 归档组合门槛（P1-19）

归档判定不再只看行数，改为三要素组合：
1. 内容类型：运行态文件（`findings.md`、`task_plan.md`）
2. 风险项：出现 `FORCE_SKIPPED` / `PASS_WITH_WAIVER` / `Exception` / `阻塞` 等关键标记
3. 规模阈值：大文件（默认 >500 行）或中等文件 + 风险项（默认 >200 行且含风险）

满足组合门槛即触发归档。

## 执行阶段
- P0: 定位 Feature（优先读取 `.spec-first/current`，无则交互式提示），校验阶段为 06_wrap_up
- P1: 加载全部交付物、矩阵、Gate 历史
- P2: 生成归档摘要（覆盖率报告、经验教训）
- P2.5: 输出 break-loop 分析与 Immediate Actions（必须可执行）
- P3: 与用户确认归档内容
- P4: 写入归档文档并执行组合门槛归档
- P5: Gate 通过后推进阶段至 07_release

## Immediate Actions（P1-BL-ACTION）

完成失败分析后，必须立即输出并执行行动项（禁止只留 TODO）：
1. 至少 3 条动作，且每条包含：目标文件路径 + 具体动作 + 责任人 + 状态
2. 至少 1 条动作必须是“更新规范/清单”（如 `references/retro-template.md`）
3. 至少 1 条动作必须是“验证闭环”（如新增/更新测试）
4. 未完成动作必须记录阻塞原因与下一步命令

## Constitution 主副本回写策略（P1-CON）

归档复盘输出的知识回写必须区分主副本：

1. 全局原则变更：更新 `.spec-first/constitution.md`（主权威）
2. Feature 特例约束：更新 `specs/{featureId}/constitution.md`，并注明覆盖原因
3. 禁止仅更新 Feature 副本而不更新主模板（会造成规则漂移）

最小记录字段（写入 `retro.md`）：
- 变更类型：global / feature-override
- 目标文件路径
- 变更原因
- 审核人/确认人

## CLI 依赖
- `spec-first metrics report`
- `spec-first gate check`
- `spec-first transition <featureId>`

## 输出路径
- `specs/{featureId}/retro.md`
- 已归档的运行态文件

## 参考模板
- `references/retro-template.md`

## 确认策略
- 推荐: strict（归档为里程碑节点）

## 成功标准
- `retro.md` 已写入，包含覆盖率报告和经验教训
- 运行态文件按组合门槛完成归档
- `gate check` 通过后 `transition` 已执行，阶段推进至 07_release
- 若涉及宪法知识回写：主副本更新策略已执行并可审计
