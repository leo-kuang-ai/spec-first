---
name: "spec-first:feature"
description: "统一 Feature 管理入口（list/current/switch）"
---

# Skill: feature

- Command: `/spec-first:feature <list|current|switch>`
- 用途：统一承接 Feature 查询、查看当前 Feature、切换当前 Feature。

## 子命令

- `feature list`
- `feature current`
- `feature switch <featureId>`

## 成功标准

- 能用单一入口完成 Feature 列表、查看和切换
- 不再依赖拆分旧入口，而是统一走单一 `feature` 家族
