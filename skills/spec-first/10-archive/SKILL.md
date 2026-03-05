---
name: "spec-first:archive"
description: "定位 Feature 并校验阶段为归档复盘（06_wrap_up）"
version: 1.0.0
last_updated: {{DATE}}
changelog: Initial version with standardized metadata
---

# Skill: archive

归档 Feature 交付物，生成复盘报告与覆盖率总结。

## 触发条件
- 阶段: 06_wrap_up
- Command: `/spec-first:archive`

## 归档组合门槛（P1-19）

归档判定不再只看行数，改为三要素组合：
1. 内容类型：运行态文件（`findings.md`、`task_plan.md`）
2. 风险项：出现 `FORCE_SKIPPED` / `PASS_WITH_WAIVER` / `Exception` / `阻塞` 等关键标记
3. 规模阈值：大文件（默认 >500 行）或中等文件 + 风险项（默认 >200 行且含风险）

满足组合门槛即触发归档。

## 执行阶段
- P0: 定位 Feature，校验阶段为 06_wrap_up
- P1: 加载全部交付物、矩阵、Gate 历史
- P2: 生成归档摘要（覆盖率报告、经验教训）
- P3: 与用户确认归档内容
- P4: 写入归档文档并执行组合门槛归档
- P5: Gate 通过后推进阶段至 07_release

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
- `spec-first stage advance`

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
- `gate check` 通过后 `stage advance` 已执行，阶段推进至 07_release
- 若涉及宪法知识回写：主副本更新策略已执行并可审计
