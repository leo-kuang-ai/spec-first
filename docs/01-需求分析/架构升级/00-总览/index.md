# 架构升级总览

> **目标**: 从 workflow engine 收敛为 compiler + contract + enforcement 的工程化 harness

---

## 核心方案

**主方案**: [整体方案-目标架构与三阶段实施](../10-主方案/整体方案-目标架构与三阶段实施.md)

**版本**: v2.1
**状态**: ✅ 已审查通过，可实施

---

## 核心理念

> **Spec / Policy -> Task Compiler -> Task Contract -> Runtime Enforcement -> Evidence**

### 设计原则

1. **dispatch 保持纯调度** - 只读取 next_action 并启动 phase
2. **next_action 只负责 topology** - 只表达 phase 顺序
3. **decision_hints 只负责最小 policy** - 只表达最关键策略
4. **runtime hooks 负责 enforcement** - 关键 gate 下沉到 runtime
5. **LLM 自主性保留在执行层** - plan/implement/check/debug 可自主决策
6. **不过度设计** - 拒绝完整 workflow DSL、完整 gate engine

---

## 三阶段实施

### Phase 1: 建立最小闭环 (2 个工作日)

**目标**: 建立 compiler + contract + enforcement 的基础架构

**核心改造**:
- task_store.py 成为编译器
- task.json 增加 workflow_type + decision_hints
- hooks 消费 task-level policy

**工作量**: 10-15 小时

**状态**: 📋 待实施

---

### Phase 2: 增加 preset (1 个工作日)

**目标**: 在不扩张 topology 的前提下，增加高价值 policy preset

**新增能力**:
- `--preset with-tdd`
- `--preset debug`

**组合方式**: `--workflow <topology> --preset <preset>`

**状态**: 📋 待规划

---

### Phase 3: Evidence 模型 (待定)

**目标**: 从状态驱动转向证据驱动

**核心能力**:
- verify_results 记录
- phase_completions 追踪
- artifacts 管理

**状态**: 📋 待规划

---

## 快速开始

### 1. 阅读主方案
```bash
cat docs/01-需求分析/架构升级/10-主方案/整体方案-目标架构与三阶段实施.md
```

### 2. 开始 Phase 1 实施

**前置条件**: ✅ 所有关键细节已补充

**实施步骤**:
1. types.py - 增加字段定义
2. task_store.py - 实现编译逻辑
3. task.py - 增加 CLI 参数
4. inject-subagent-context.py - 注入 policy
5. ralph-loop.py - 消费 verify_commands
6. 集成测试
