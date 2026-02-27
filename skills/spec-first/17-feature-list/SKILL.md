---
name: "spec-first:feature-list"
description: "列出当前项目全部 Feature"
version: 1.0.0
last_updated: 2026-02-27
changelog: Initial version with standardized metadata
---

# Skill: feature-list

列出当前项目所有 Feature 及其阶段状态。

## 触发条件
- 阶段: 任意（不限阶段）
- Command: `/spec-first:feature-list`

## 执行阶段
- P0: 定位项目根目录，校验 specs 目录存在
- P1: 加载 Feature 注册表和 Feature 目录
- P2: 执行 Feature 列表查询
- P3: 向用户展示 Feature 列表
- P4: 无写入
- P5: 无副作用

## CLI 依赖
- `spec-first feature list`

## 输出路径
- 无（仅展示）

## 确认策略
- 推荐: auto（只读列表）

## 成功标准
- 已展示当前项目 Feature 列表
- 输出包含 featureId、标题、阶段与更新时间
