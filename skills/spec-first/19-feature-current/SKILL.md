---
name: "spec-first:feature-current"
description: "查看当前 Feature 与阶段信息"
version: 1.0.0
last_updated: 2026-02-27
changelog: Initial version with standardized metadata
---

# Skill: feature-current

查看当前活跃 Feature 的 ID、标题与阶段信息。

## 触发条件
- 阶段: 任意（不限阶段）
- Command: `/spec-first:feature-current`

## 执行阶段
- P0: 定位项目根目录和当前 Feature 指针
- P1: 加载当前 Feature 状态
- P2: 执行当前 Feature 查询
- P3: 向用户展示当前 Feature 详情
- P4: 无写入
- P5: 无副作用

## CLI 依赖
- `spec-first feature current`
- `spec-first stage current <featureId>`

## 输出路径
- 无（仅展示）

## 确认策略
- 推荐: auto（只读状态查询）

## 成功标准
- 已展示当前 featureId、标题与阶段
- 当未设置 current 时给出下一步引导
