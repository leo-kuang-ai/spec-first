---
name: "spec-first:archive"
description: "定位 Feature 并校验阶段为归档复盘（06_wrap_up）"
---

# Skill: archive

归档 Feature 交付物，生成复盘报告与覆盖率总结。

## 触发条件
- 阶段: 06_wrap_up
- Command: `/spec-first:archive`

## 执行阶段
- P0: 定位 Feature，校验阶段为 06_wrap_up
- P1: 加载全部交付物、矩阵、Gate 历史
- P2: 生成归档摘要（覆盖率报告、经验教训）
- P3: 与用户确认归档内容
- P4: 写入归档文档，运行态文件超 500 行则归档
- P5: Gate 通过后推进阶段至 07_release

## CLI 依赖
- `spec-first metrics report`
- `spec-first gate check`
- `spec-first stage advance`

## 输出路径
- `specs/{featureId}/retro.md`
- 已归档的运行态文件

## 确认策略
- 推荐: strict（归档为里程碑节点）

## 成功标准
- `retro.md` 已写入，包含覆盖率报告和经验教训
- 运行态文件（>500 行）已归档
- `gate check` 通过后 `stage advance` 已执行，阶段推进至 07_release
