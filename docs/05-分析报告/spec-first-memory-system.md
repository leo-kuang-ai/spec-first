# Spec-First 记忆体系分析

> 说明：本文是对当前仓库记忆体系的人工分析，不是运行时真源。以 `specs/<featureId>/stage-state.json`、`.spec-first/current`、相关 CLI/Skill 的实际实现为准。

## 1. 核心结论

Spec-First 当前的“记忆”已经从旧的 gate/trace/document-links 模型，收敛为一套更轻的节点化文件状态：

- 文件系统仍然是外部记忆
- `.spec-first/current` 仍然是当前 Feature 指针
- `stage-state.json` 仍然是运行态中心，但其内容已经切换为节点化 `FeatureState`
- `task_plan.md` 通过任务条目状态承载任务级进度，不再依赖 `TASK ID`
- `orchestrate + transition` 负责主流程推进，`skill checklist` 负责本节点完成度，`safety-guard` 只负责风险提示

可以概括为一句话：**Spec-First 的正式记忆不再围绕 gate、ID、矩阵和文档索引运转，而是围绕 `FeatureState + 节点文档 + 任务表格` 运转。**

## 2. 记忆分层总图

```text
┌────────────────────────────────────────────────────────────────────┐
│ 人类 / Skill / CLI 入口                                            │
│ /spec-first:feature                                                 │
│ /spec-first:status                                                  │
│ /spec-first:orchestrate                                             │
│ /spec-first:transition                                              │
│ /spec-first:catchup                                                 │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────── Runtime Memory ────────────────────────┐
│ .spec-first/current            → 当前 Feature 指针                  │
│ .spec-first/meta/config.yaml   → 运行配置 / 策略开关                │
│ .spec-first/runtime/*          → viewer / 临时运行态                 │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────── Feature Memory ────────────────────────┐
│ specs/<featureId>/stage-state.json  → FeatureState 运行态真源       │
│ specs/<featureId>/spec.md           → 01_specify 产物               │
│ specs/<featureId>/design.md         → 02_design 产物                │
│ specs/<featureId>/task_plan.md      → 03_plan 执行计划与任务进度    │
│ specs/<featureId>/findings.md       → 实现说明 / 调研记录 / 阻塞说明│
│ specs/<featureId>/verify.md         → 05_verify 产物                │
│ specs/<featureId>/wrap_up.md        → 06_wrap_up 产物               │
│ specs/<featureId>/release.md        → 07_release 产物               │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────── Recovery / Guidance ─────────────────────┐
│ catchup / status        → 从运行态 + 文档重建当前上下文             │
│ orchestrate             → readiness-check + 下一步建议              │
│ transition              → 唯一节点推进入口                          │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────── Auxiliary Memory ────────────────────────┐
│ .serena/memories/*         → 项目概述 / 架构 / 命令 / 检查清单      │
│ .history/*                 → 历史会话痕迹                          │
│ docs/first/*               → 人类可读的派生认知文档                │
└────────────────────────────────────────────────────────────────────┘
```

## 3. 记忆层级与职责

### 3.1 Runtime Memory：当前执行的短期工作记忆

这一层负责定位“当前在做哪个 Feature”，以及提供少量运行时配置。

| 文件 / 入口 | 作用 | 读写方式 |
|---|---|---|
| `.spec-first/current` | 当前 Feature 指针 | `feature switch` 写入，`feature current` / `status` / `catchup` 读取 |
| `.spec-first/meta/config.yaml` | 运行配置、策略开关 | 启动时读取 |
| `.spec-first/runtime/viewer-state.json` | 可视化面板运行态 | viewer 写入，用于展示 |

这层记忆不保存业务知识，主要保存“当前焦点”和“运行配置”。

### 3.2 Feature Memory：真正的项目知识与状态记忆

这一层是跨会话复用的核心。每个 Feature 独立目录，长期知识和阶段产物都沉淀在这里。

| 文件 | 记忆职责 |
|---|---|
| `stage-state.json` | 节点化 `FeatureState` 真源，记录 `currentStage`、终态标记、各节点 `NodeState` |
| `spec.md` | 需求规格与范围边界 |
| `design.md` | 设计决策与实现约束 |
| `task_plan.md` | 执行计划与任务级进度表格 |
| `findings.md` | 实现说明、调研结论、阻塞说明 |
| `verify.md` | 验证方法、结果、风险 |
| `wrap_up.md` | 收尾总结、剩余问题、后续建议 |
| `release.md` | 发布摘要、风险提示、结论 |

这里已经不再把以下文件视为主记忆组成：

- `document-links.yaml`
- `traceability-matrix.md`
- `gate-history.jsonl`

这些概念已退出当前节点化主流程。

### 3.3 Recovery / Guidance Memory：恢复和引导记忆

这一层不负责生成业务内容，而是负责恢复上下文、展示状态和给出下一步动作建议。

| 组件 | 作用 |
|---|---|
| `catchup` | 从 `FeatureState`、`task_plan.md`、`findings.md` 和阶段文档重建上下文 |
| `status` | 展示当前节点、节点状态、摘要、阻塞和建议动作 |
| `orchestrate` | 执行轻量 readiness-check，判断 `READY_TO_WORK / READY_TO_ADVANCE / BLOCKED` |
| `transition` | 作为唯一主流程推进入口，更新 `currentStage` 和节点状态 |

这层记忆的特点是：**偏恢复与决策，不偏内容创作**。

### 3.4 Auxiliary Memory：辅助型离线记忆

这一层不是正式真源，但对补上下文仍然有价值。

| 目录 | 角色 |
|---|---|
| `.serena/memories/project_overview.md` | 项目定位、用户对象、技术栈 |
| `.serena/memories/architecture.md` | 架构分层、核心模块、目录结构 |
| `.serena/memories/code_style.md` | 代码风格与约束 |
| `.serena/memories/task_completion_checklist.md` | 收尾检查清单 |
| `.serena/memories/suggested_commands.md` | 常用命令集合 |
| `.history/*` | 历史会话快照、旧上下文 |

它们适合辅助恢复，但不应覆盖 `specs/<featureId>/` 的正式语义。

## 4. 节点如何读写记忆

### 4.1 Feature 与状态节点

| 节点 | 读取 | 写入 | 说明 |
|---|---|---|---|
| `spec-first feature current` | `.spec-first/current`、`stage-state.json` | 无 | 展示当前工作焦点 |
| `spec-first feature switch <featureId>` | `stage-state.json` | `.spec-first/current` | 切换当前 Feature |
| `spec-first status` | `.spec-first/current`、`FeatureState`、阶段文档 | 无或更新 viewer 运行态 | 聚合当前节点状态和阻塞信息 |

### 4.2 恢复与编排节点

| 节点 | 读取 | 输出 / 写入 | 说明 |
|---|---|---|---|
| `spec-first catchup` | `FeatureState`、`task_plan.md`、`findings.md`、阶段文档 | 恢复摘要 | 从真源重建会话上下文 |
| `spec-first orchestrate` | `FeatureState`、最小产物集合 | readiness-check 结果 | 只回答“现在能否推进或继续工作” |
| `spec-first transition` | `FeatureState`、目标节点 | 更新 `FeatureState` | 唯一节点推进动作 |

### 4.3 Skill 节点

| 组件 | 读取 | 输出 | 说明 |
|---|---|---|---|
| `skill checklist` | 当前节点产物、节点状态 | checklist 结果、`suggestedStatus`、摘要 | 只检查本节点最小完成标准 |
| `safety-guard` | Git 分支、工作区风险信号 | safety notice | 只提示风险，不阻断流程 |

## 5. 恢复链路是怎么工作的

`catchup` 是当前体系里最典型的“记忆重建”流程。它不是读聊天记录，而是从运行态和阶段文档重新拼上下文。

### 5.1 恢复顺序

```text
Step 1 读取 .spec-first/current
Step 2 读取 stage-state.json (FeatureState)
Step 3 读取 task_plan.md
Step 4 读取 findings.md
Step 5 读取当前节点对应的阶段文档
Step 6 生成恢复摘要与下一步建议
```

### 5.2 恢复时依赖的事实

- `stage-state.json` 负责告诉系统“当前在哪个节点、每个节点是什么状态”
- `task_plan.md` 负责告诉系统“03_plan 及其后续执行阶段的任务级进度如何”
- `findings.md` 负责告诉系统“之前得到了什么结论、有哪些实现说明或阻塞”
- 阶段文档负责提供节点内容本身

换句话说，`catchup` 的本质不是“回忆”，而是“从文件真源重建当前工作面”。

## 6. 上下文为什么不会乱

当前模型能保持稳定，靠的是职责收敛。

### 6.1 单一真源

- `.spec-first/current` 只负责当前 Feature 指针
- `stage-state.json` 只负责节点运行态
- 阶段文档只负责各自节点产物
- `task_plan.md` 只负责任务级计划和进度

### 6.2 双层进度分离

- 节点级进度：由 `NodeState.status` 维护
- 任务级进度：由 `task_plan.md` 的汇总任务表格维护

任务级 `blocked` 不自动等于节点级 `blocked`。只有阻塞已影响整个节点继续推进时，节点运行态才进入 `blocked`。

### 6.3 恢复入口明确

- 指针丢失，先看 `feature current`
- 状态不一致，先看 `status`
- 上下文断裂，直接 `catchup`
- 需要决定下一步，走 `orchestrate`
- 需要推进主流程，走 `transition`

## 7. 典型失效模式

| 失效模式 | 现象 | 修复方式 |
|---|---|---|
| `.spec-first/current` 丢失 | 无法定位当前 Feature | 重新执行 `feature switch` 或 `init` |
| `stage-state.json` 缺失或损坏 | `status` / `orchestrate` 无法正常输出 | 重新初始化 Feature 或修复状态文件 |
| `task_plan.md` 表格失真 | 无法定位当前任务或统计进度 | 修复汇总任务表格约束 |
| `findings.md` 过旧 | 恢复摘要缺少最近实现和阻塞信息 | 先补 findings，再重新恢复 |
| 节点文档缺失 | readiness-check 无法通过 | 先补当前节点的最小产物 |
| `.spec-first/meta/config.yaml` 与实际不一致 | 运行配置失真 | 重新校准配置 |
| `.history` / `.serena` 过期 | 恢复时出现旧认知 | 仅作为辅助参考，不覆盖真源 |

## 8. 结论

Spec-First 当前的记忆体系不是一个“大而全的追踪库”，而是四层分工：

- `Runtime Memory` 负责当前指针和运行配置
- `Feature Memory` 负责节点运行态和阶段产物
- `Recovery / Guidance Memory` 负责恢复、展示与推进建议
- `Auxiliary Memory` 负责离线辅助，不参与真源判定

真正决定 AI 是否“记得项目”的，不是聊天上下文，而是这套 `FeatureState + 阶段文档 + 任务表格` 是否完整、同步、可恢复。
