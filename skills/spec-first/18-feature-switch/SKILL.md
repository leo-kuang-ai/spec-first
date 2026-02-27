---
name: "spec-first:feature-switch"
description: "切换当前 Feature 上下文（更新 .spec-first/current）"
version: 1.0.0
last_updated: 2026-02-27
changelog: Initial version with standardized metadata
---

# Skill: feature-switch

切换当前活跃 Feature 上下文指针。

## 触发条件
- 阶段: 任意（不限阶段）
- Command: `/spec-first:feature-switch <featureId>`

## 执行阶段
- P0: 定位项目根目录，从用户输入解析目标 featureId
- P1: 加载 Feature 列表，校验目标 Feature 存在
- P2: 生成切换计划（目标 Feature 及预期阶段）
- P3: 请用户确认切换目标
- P4: 执行切换，写入 current 指针
- P5: 验证切换后上下文，报告当前阶段

## CLI 依赖
- `spec-first feature list`
- `spec-first feature switch <featureId>`
- `spec-first feature current`
- `spec-first stage current <featureId>`

## 输出路径
- `.spec-first/current`

## 确认策略
- 推荐: assisted（更新当前 Feature 指针）

## 成功标准
- 目标 featureId 校验通过
- `.spec-first/current` 已切换到目标 featureId
- 已输出切换后的当前阶段信息
