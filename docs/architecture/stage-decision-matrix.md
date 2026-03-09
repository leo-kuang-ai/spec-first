# 阶段决策矩阵

## 概述

本文档定义 `next-step-decider` 的统一决策规则，确保 03_plan → 04_implement → 05_verify 主线流转的一致性。

## 决策优先级

决策按以下优先级顺序执行（从高到低）：

1. **autoLoopStatus** - auto-loop 执行结果
2. **stageStatus** - 阶段子状态
3. **gate + dependency + todo** - 推进前置条件
4. **阶段特定规则** - 各阶段的特殊逻辑

---

## 通用规则

### 优先级1: autoLoopStatus 检查

| autoLoopStatus | 决策 | reasonCode |
|----------------|------|------------|
| `all_done` | 继续检查 | - |
| `has_blocked` | `BLOCKED` | `AUTO_LOOP_HAS_BLOCKED` |
| `timeout` | `BLOCKED` | `AUTO_LOOP_TIMEOUT` |
| `no_state_file` | `BLOCKED` | `AUTO_LOOP_NO_STATE_FILE` |
| `max_iterations` | `BLOCKED` | `AUTO_LOOP_MAX_ITERATIONS` |
| `incomplete` | `BLOCKED` | `AUTO_LOOP_INCOMPLETE` |

### 优先级2: stageStatus 检查

| stageStatus | 决策 |
|-------------|------|
| `!= ready_to_advance` | `SUGGEST_NEXT` |
| `== ready_to_advance` | 继续检查 |

### 优先级3: 推进前置条件

| 条件 | 决策 | reasonCode |
|------|------|------------|
| dependency 失败 | `BLOCKED` | `DEPENDENCY_FAILED` |
| gate 失败 | `BLOCKED` | `GATE_FAILED` |
| todo blocked | `BLOCKED` | `TODO_BLOCKED` |
| 全部通过 | 继续检查 | - |

---

## 阶段特定规则

### 01_specify (需求规格)

| 条件 | 决策 | 说明 |
|------|------|------|
| ready_to_advance | `SUGGEST_NEXT` | 需人工确认后推进 |

### 02_design (技术设计)

| 条件 | 决策 | 说明 |
|------|------|------|
| ready_to_advance | `READY_TO_ADVANCE` | 可直接推进 |

### 03_plan (任务拆解)

| 条件 | autoAdvancePolicy | todoState | 决策 | reasonCode |
|------|-------------------|-----------|------|------------|
| ready_to_advance | `auto_advance` | allDone 或 无 | `AUTO_ADVANCE` | - |
| ready_to_advance | - | 有 pending | `SUGGEST_NEXT` | `TODO_PENDING` |
| ready_to_advance | - | allDone | `READY_TO_ADVANCE` | - |

### 04_implement (代码实现)

| 条件 | autoAdvancePolicy | todoState | 决策 | reasonCode |
|------|-------------------|-----------|------|------------|
| ready_to_advance | - | 有 pending | `SUGGEST_NEXT` | `TODO_PENDING` |
| ready_to_advance | `auto_advance` | allDone | `AUTO_ADVANCE` | - |
| ready_to_advance | - | allDone | `READY_TO_ADVANCE` | - |

### 05_verify (验收测试)

| 条件 | 决策 | 说明 |
|------|------|------|
| ready_to_advance | `READY_TO_ADVANCE` | 可直接推进 |

### 06_wrap_up 及以后

| 条件 | 决策 | 说明 |
|------|------|------|
| ready_to_advance | `READY_TO_ADVANCE` | 默认规则 |

---

## 决策类型说明

| 决策类型 | 含义 | orchestrate 行为 |
|----------|------|------------------|
| `BLOCKED` | 存在阻塞条件 | 打印阻塞原因，不推进 |
| `SUGGEST_NEXT` | 建议执行下一步 | 打印建议命令，不推进 |
| `READY_TO_ADVANCE` | 可以推进 | 打印建议，需 `--auto-advance` 才推进 |
| `AUTO_ADVANCE` | 自动推进候选 | 打印建议，需 `--auto-advance` 才推进 |

---

## 实现位置

- **代码**: `src/core/process-engine/next-step-decider.ts`
- **测试**: `tests/unit/stage-flow-03-05.test.ts`
- **集成测试**: `tests/unit/orchestrate-stage-integration.test.ts`

---

## 更新日志

- 2026-03-10: 初始版本，基于 P0 优化完成后的实现
