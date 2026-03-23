---
name: "spec-first:spec-review"
description: "Use when a feature is in 01_specify and you need a quality review of spec outputs before design begins."
version: 1.1.0
last_updated: 2026-03-05
changelog: v1.1.0 - 新增自动 Feature 定位（优先读取 .spec-first/current）
---

# Skill: spec-review

对 `spec.md` 执行"英语单元测试"式质量审查，产出 Checklist 与质量分（C10）。

## 触发条件
- 阶段: 01_specify（可在 02_design 前重复执行）
- Command: `/spec-first:spec-review [featureId]`

## Feature 定位规则

### 优先级

1. **显式参数**: 用户提供 featureId 参数时直接使用
2. **自动定位**: 读取 `.spec-first/current` 获取当前激活 Feature
3. **交互式**: 列出可用 Feature 供用户选择

### 错误处理

- `.spec-first/current` 不存在或为空 → 降级到交互式
- 指定 Feature 的 `spec.md` 不存在 → 报错并终止

## 执行阶段
- P0: 定位 Feature（优先读取 `.spec-first/current`，无则交互式提示），校验 `spec.md` 已存在
- P1: 加载 `spec.md`、`constitution.md`、`document-links.yaml`
- P2: 基于清单生成审查项并评估通过/不通过
- P3: 与用户确认未通过项和修订建议
- P4: 写入审查结果到 `checklists/spec-review.md`
- P5: 输出 Spec Quality Score（C10）并提示 gate 校验

## 审查清单来源
- `../03-spec/references/spec-review-checklist.md`
- `../03-spec/references/test-level-glossary.md`

## First 项目认知资产接入

当项目已生成 `00-first` runtime 真源时，审查时应优先吸收以下项目认知资产作为辅助输入，而不是依赖零散 `docs/first/*` 推断：

- `summary.json`
- `critical-flows.json`
- `domain-model.json`

使用原则：

- `summary.json`：辅助判断需求目标、平台边界与项目范围是否完整
- `critical-flows.json`：辅助判断关键链路、验收路径与风险覆盖是否充分
- `domain-model.json`：辅助判断术语、实体边界、关系描述是否一致
- 若 `00-first` 资产缺失，不阻断 `spec-review`，但应标记为“缺少项目认知辅助输入”

## 输出路径
- `specs/{featureId}/checklists/spec-review.md`

## 确认策略
- 推荐: assisted（质量项需要人工判断）

## 成功标准
- `checklists/spec-review.md` 已生成或更新
- 清单项可解析（`- [x]` / `- [ ]`）
- 已输出 `C10 = checked/total` 百分比
- 当 C10 < 80% 时明确标记为阻断风险
