---
name: "spec-first:research"
description: "定位 Feature 上下文并生成调研结论"
---

# Skill: research

执行技术调研，输出方案对比与推荐结论。

## 触发条件
- 阶段: 任意（不限阶段）
- Command: `/spec-first:research`

## 执行阶段
- P0: 定位 Feature 上下文
- P1: 加载当前阶段交付物、constitution.md
- P2: 生成调研分析（技术选型、方案对比、推荐结论）
- P3: 与用户确认调研发现
- P4: 将调研笔记写入 research.md
- P5: 无副作用

## CLI 依赖
- `spec-first ai context`

## 输出路径
- `specs/{featureId}/research.md`

## 确认策略
- 推荐: assisted（调研笔记写入 research.md）

## 成功标准
- `research.md` 已写入，包含方案对比、优劣分析、推荐结论
- 用户已确认研究结论
