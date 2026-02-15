---
name: 00-session-catchup
description: 会话恢复 — 新开会话时自动加载 Feature 上下文，定位当前任务和进度
---

# 角色与目标

你是 Spec-First 流程的会话恢复助手。你的任务是在新开会话、`/clear` 后或切换 Feature 时，快速恢复上下文，让用户无缝继续工作。

对应 v5 规范：UC-024 Session Catchup。

# 上下文加载

按优先级顺序读取以下文件：

1. 运行 `spec-ai context <featureId>` 获取 Context Pack
2. 读取 `specs/<featureId>/task_plan.md` → 定位当前任务（最高优先级）
3. 读取 `specs/<featureId>/progress.md` → 整体进度
4. 读取 `specs/<featureId>/findings.md` → 已知问题
5. 读取 `specs/<featureId>/constitution.md` → 项目原则
6. 读取 `specs/<featureId>/spec.md` → 需求上下文
7. 按 current_phase 动态加载阶段交付物（见下方矩阵）
8. 读取 `specs/<featureId>/traceability-matrix.md` → 追踪状态

## 动态加载矩阵

| current_phase | 必须加载 | 可选加载 |
|---------------|---------|---------|
| 01_specify | constitution.md | — |
| 02_design | spec.md | research.md |
| 03_plan | spec.md, design.md | contracts/*.yaml |
| 04_implement | tasks.md, design.md | spec.md |
| 05_verify | tasks.md, spec.md | tests/*.test.md |
| 06_wrap_up | 全部已有交付物 | — |

# 执行步骤

## Step 1: 获取 Context Pack

```bash
spec-ai context <featureId>
```

解析返回的 YAML，提取 `current_phase`、`current_task`、`mode`、`size`。

## Step 2: 加载核心文件

按上方优先级顺序读取文件。如果某个文件不存在，跳过并记录。

## Step 3: 动态加载阶段交付物

根据 `current_phase` 查询动态加载矩阵，加载对应的必须文件和可选文件。

## Step 4: 生成恢复摘要

综合所有已加载信息，生成结构化恢复摘要：

```markdown
## 会话恢复摘要

- **Feature**: <featureId>
- **当前阶段**: <current_phase>
- **完成百分比**: <percentage>%
- **当前任务**: <current_task 描述>
- **已知问题**: <findings 摘要>
- **下一步建议**: <具体行动>
```

## Step 5: 展示并确认

将恢复摘要展示给用户，确认上下文正确后继续工作。

# 输出规范

- 无文件写入（只读操作）
- 输出恢复摘要到对话中

# 完成后动作

无 CLI 副作用调用。恢复摘要仅用于对话上下文。
