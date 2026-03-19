# Dispatch Agent 详解

> 本文档详细分析 Trellis 的 Dispatch Agent（调度代理）

---

## 1. 核心定位

### 1.1 角色定义

**纯调度器** — 不读取规范、不分析需求，只负责按阶段顺序调用子代理。

```
┌─────────────────────────────────────────────────────────────┐
│                    Dispatch Agent 定位                       │
├─────────────────────────────────────────────────────────────┤
│  ❌ 不做什么：                                               │
│     - 不读取 prd.md 或规范文件                               │
│     - 不分析需求或理解代码                                    │
│     - 不做决策或判断                                          │
│     - 不更新 task.json（由 Hook 自动完成）                    │
│                                                              │
│  ✅ 只做什么：                                               │
│     - 按顺序调用子代理                                        │
│     - 传递参数                                                │
│     - 执行 Hook 注入的上下文                                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 设计哲学

```
传统 Agent: 读取规范 → 理解上下文 → 执行任务 → 更新状态
Dispatch Agent: 接收指令 → 调用子代理 → 传递结果（上下文由 Hook 注入）
```

**核心理念**: 上下文注入，而非 Agent 记忆

---

## 2. 调度流程

### 2.1 管道阶段

```
┌─────────────────────────────────────────────────────────────┐
│                  Dispatch Pipeline                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ implement│───▶│  check   │───▶│  finish  │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│       │               │               │                     │
│       ▼               ▼               ▼                     │
│   代码实现        质量检查        最终验证                   │
│                                                              │
│                         │                                    │
│                         ▼                                    │
│                   ┌──────────┐                              │
│                   │create-pr │                              │
│                   └──────────┘                              │
│                         │                                    │
│                         ▼                                    │
│                    创建 PR                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 阶段自动更新

**Hook 层自动处理** — Dispatch Agent 无需关心：

```python
# Hook 自动更新 task.json 中的 current_phase
def update_current_phase(repo_root, task_dir, subagent_type):
    phase_mapping = {
        "implement": "implement",
        "check": "check",
        "debug": "debug",
        "finish": "finish"
    }
    # 根据 subagent_type 自动设置阶段
    set_phase(repo_root, task_dir, phase_mapping[subagent_type])
```

---

## 3. 上下文注入机制

### 3.1 JSONL 上下文定义

每个任务目录包含 JSONL 文件，定义各阶段上下文：

```
.trellis/tasks/<task-name>/
├── implement.jsonl    # 实现阶段上下文
├── check.jsonl        # 检查阶段上下文
├── debug.jsonl        # 调试阶段上下文
└── task.json          # 任务元数据
```

**JSONL 格式示例**:

```jsonl
{"file": ".trellis/spec/backend/index.md", "reason": "Backend guidelines"}
{"file": ".trellis/spec/guides/cross-layer.md", "reason": "Cross-layer checks"}
{"file": ".trellis/spec/backend/testing.md", "reason": "Testing standards"}
```

### 3.2 Hook 注入流程

```
┌─────────────────────────────────────────────────────────────┐
│                Context Injection Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Dispatch Agent 调用子代理                                │
│          │                                                   │
│          ▼                                                   │
│  2. PreToolUse Hook 拦截                                     │
│          │                                                   │
│          ▼                                                   │
│  3. 读取对应阶段的 JSONL 文件                                 │
│          │                                                   │
│          ▼                                                   │
│  4. 注入上下文到子代理 prompt                                 │
│          │                                                   │
│          ▼                                                   │
│  5. 子代理执行（已有完整上下文）                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 核心规则

### 4.1 六大铁律

| 规则 | 说明 |
|------|------|
| **1. 不读取规范** | 所有规范由 Hook 注入，Dispatch 只负责调度 |
| **2. 不分析需求** | 需求分析由 Plan Agent 完成 |
| **3. 不做决策** | 只执行预定义的调度逻辑 |
| **4. 不更新状态** | task.json 更新由 Hook 自动处理 |
| **5. 信任 Hook** | 假设上下文已正确注入 |
| **6. 顺序执行** | 严格按照阶段顺序调用 |

### 4.2 错误处理

```python
# Dispatch Agent 的错误处理策略
def handle_subagent_failure(subagent_type, error):
    if subagent_type == "implement":
        # 实现失败 → 调用 Debug Agent
        return dispatch("debug", error_context=error)
    elif subagent_type == "check":
        # 检查失败 → 提供修复建议
        return provide_fix_suggestions(error)
    elif subagent_type == "debug":
        # 调试失败 → 升级给用户
        return escalate_to_user(error)
```

---

## 5. 与其他 Agent 的关系

### 5.1 Agent 协作图

```
                 ┌──────────────┐
                 │  Plan Agent  │
                 │ (需求分析)    │
                 └──────┬───────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│                    Dispatch Agent                        │
│                     (纯调度器)                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │implement│─▶│  check  │─▶│  debug  │─▶│ finish  │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │ Research Agent│
                 │ (代码搜索)    │
                 └──────────────┘
```

### 5.2 职责边界

| Agent | 职责 | 与 Dispatch 关系 |
|-------|------|------------------|
| **Plan** | 需求评估、任务配置 | 前置：准备任务目录 |
| **Implement** | 代码实现 | 被调度：执行实现 |
| **Check** | 质量检查 | 被调度：执行检查 |
| **Debug** | 问题修复 | 被调度：处理失败 |
| **Research** | 信息收集 | 辅助：提供信息 |

---

## 6. 实现参考

### 6.1 伪代码

```python
class DispatchAgent:
    """纯调度器 - 不读取规范，只按顺序调用子代理"""

    def execute(self, task_dir: str):
        # 阶段 1: 实现
        self.dispatch_subagent("implement", task_dir)

        # 阶段 2: 检查
        check_result = self.dispatch_subagent("check", task_dir)

        # 阶段 3: 失败处理
        if not check_result.success:
            self.dispatch_subagent("debug", task_dir)

        # 阶段 4: 完成
        self.dispatch_subagent("finish", task_dir)

        # 阶段 5: 创建 PR
        self.dispatch_subagent("create-pr", task_dir)

    def dispatch_subagent(self, subagent_type: str, task_dir: str):
        """调度子代理 - Hook 自动注入上下文"""
        # 注意：这里不读取任何文件
        # 所有上下文由 PreToolUse Hook 注入
        return call_subagent(subagent_type, task_dir=task_dir)
```

### 6.2 关键设计决策

| 决策 | 原因 |
|------|------|
| **纯调度器模式** | 降低复杂度，避免上下文膨胀 |
| **Hook 注入上下文** | 确保每次调用都有完整、新鲜的上下文 |
| **JSONL 定义格式** | 灵活、可维护、每个任务可定制 |
| **阶段自动更新** | 无需 Dispatch 记住更新状态 |

---

## 7. 对 spec-first 的借鉴价值

### 7.1 核心借鉴点

| 借鉴点 | 优先级 | 说明 |
|--------|--------|------|
| **纯调度器模式** | P0 | 分离调度与执行，降低 Agent 复杂度 |
| **JSONL 上下文定义** | P0 | 替代硬编码上下文列表，实现灵活配置 |
| **阶段自动更新** | P1 | Hook 层自动处理状态，Agent 无需关心 |
| **上下文注入模式** | P1 | 确保 AI 每次调用都有完整上下文 |

### 7.2 适用场景

```
✅ 适合借鉴:
   - 多阶段工作流编排
   - 需要 AI 遵循规范的开发场景
   - 需要灵活配置上下文的任务

❌ 不适合:
   - 简单单步操作
   - 无需规范约束的场景
   - 上下文固定的简单任务
```

---

## 8. 相关文档

- [Plan Agent](./plan-agent.md) - 需求评估与任务配置
- [Implement Agent](./implement-agent.md) - 代码实现
- [Check Agent](./check-agent.md) - 质量检查
- [PreToolUse Hook](../03-hooks/pre-tool-use.md) - 上下文注入机制
