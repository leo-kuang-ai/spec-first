---
name: "spec-first:orchestrate"
description: "定位 Feature 并加载当前状态执行编排"
---

# Skill: orchestrate

编排调度器，驱动 plan → skill → verify → advance 全流程。

## 触发条件
- 阶段: 任意（主编排 Skill）
- Command: `/spec-first:orchestrate`

## 执行阶段
- P0: 定位 Feature，加载当前阶段与状态
- P1: 加载 stage-state、覆盖率、Gate 历史、任务计划
- P2: 生成编排计划：plan → skill 执行 → verify → stage advance
- P3: 与用户确认编排序列
- P4: 按序执行调度的子 Skill
- P5: Gate 通过后推进阶段

## CLI 依赖
- `spec-first stage current`
- `spec-first stage advance`
- `spec-first gate check`
- `spec-first metrics health`

## 输出路径
- `specs/{featureId}/findings.md`

## 确认策略
- 推荐: strict（编排驱动阶段转换）

## 成功标准
- 编排计划已生成并经用户确认
- 所有调度的子 Skill 执行成功
- `verify` 校验通过
- `stage advance` 已执行，阶段已推进

## 编排规则
- 主调度器：根据当前阶段分派对应 Skill
- 序列：plan → (spec|design|task|code|test|archive) → verify → advance

### 调度协议

Stage → Skill 映射（P4 按此表调度）：

| 当前阶段 | 调度 Skill | 说明 |
|---------|-----------|------|
| 00_init | 无（init 已完成） | 直接 verify → advance |
| 01_specify | 03-spec | 需求定义 |
| 02_design | 04-design | 技术设计（05-research 按需） |
| 03_plan | 06-task | 任务拆解 |
| 04_implement | 07-code | 代码实现（08-code-review 按需） |
| 05_verify | 09-test | 测试用例 |
| 06_wrap_up | 10-archive | 归档总结 |

### 子 Skill 失败处理

- 子 Skill P0 失败（阶段不匹配）→ orchestrate 终止，报告阶段冲突
- 子 Skill P3 用户拒绝 → orchestrate 暂停，等待用户决定是否继续
- 子 Skill P4/P5 失败 → orchestrate 终止，不执行 stage advance，报告失败 Skill 和错误
- 任何子 Skill 失败后，已完成的子 Skill 产出物保留不回滚

### 参数传递

- 所有子 Skill 继承 orchestrate 的 featureId
- 子 Skill 的 confirm_policy 保持各自定义（不被 orchestrate 覆盖）
