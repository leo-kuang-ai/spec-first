---
name: "spec-first:spec-review"
description: "定位 Feature 并执行需求规格质量审查（C10）"
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
- P1: 加载 `spec.md`、`constitution.md`、`traceability-matrix.md`
- P2: 基于清单生成审查项并评估通过/不通过
- P3: 与用户确认未通过项和修订建议
- P4: 写入审查结果到 `checklists/spec-review.md`
- P5: 输出 Spec Quality Score（C10）并提示 gate 校验

## 审查清单来源
- `../03-spec/references/spec-review-checklist.md`
- `../03-spec/references/test-level-glossary.md`

## 输出路径
- `specs/{featureId}/checklists/spec-review.md`

## 确认策略
- 推荐: assisted（质量项需要人工判断）

## 成功标准
- `checklists/spec-review.md` 已生成或更新
- 清单项可解析（`- [x]` / `- [ ]`）
- 已输出 `C10 = checked/total` 百分比
- 当 C10 < 80% 时明确标记为阻断风险
