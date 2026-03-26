# Parallel 深度分析

> 源文件: `/packages/cli/src/templates/claude/commands/spec/parallel.md`

---

## 1. Skill 概述

### 1.1 核心定位

**parallel** 是多 Agent 并行流水线编排器，在主仓库中协调并行开发任务。

| 维度 | 描述 |
|------|------|
| **角色** | 编排器，不直接写代码 |
| **位置** | 主仓库（非 worktree） |
| **职责** | 规划、配置、调度 |

### 1.2 核心规则

```
┌─────────────────────────────────────────────────────────────┐
│                    核心规则                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. 不直接写代码 - 代码由 worktree 中的 agent 完成        │
│   2. 不执行 git commit - agent 通过 create-pr 动作完成     │
│   3. 复杂分析委托给 research agent                         │
│   4. 所有子 agent 使用 opus 模型确保输出质量               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 启动流程

### 2.1 流程图

```
┌─────────────────────────────────────────────────────────────┐
│                   parallel 启动流程                          │
└─────────────────────────────────────────────────────────────┘

  ┌─────────────────┐
  │ Step 1: 理解    │
  │ workflow        │
  └────────┬────────┘
           │ cat .spec-first/workflow.md
           ▼
  ┌─────────────────┐
  │ Step 2: 获取    │
  │ 当前状态        │
  └────────┬────────┘
           │ get_context.py
           ▼
  ┌─────────────────┐
  │ Step 3: 读取    │
  │ 项目指南        │
  └────────┬────────┘
           │ spec/guides/index.md
           ▼
  ┌─────────────────┐
  │ Step 4: 询问用户│
  │ 需求           │
  └─────────────────┘
           │
           ▼
  ┌─────────────────┐
  │ Step 5: 选择    │
  │ 规划方式        │
  └─────────────────┘
```

### 2.2 步骤详解

#### Step 1: 理解 workflow

```bash
cat .spec-first/workflow.md
```

#### Step 2: 获取当前状态

```bash
python3 ./.spec-first/scripts/get_context.py
```

#### Step 3: 读取项目指南

```bash
python3 ./.spec-first/scripts/get_context.py --mode packages
cat .spec-first/spec/guides/index.md
```

#### Step 4: 询问用户需求

1. 开发什么功能？
2. 涉及哪些模块？
3. 开发类型？（backend / frontend / fullstack）

---

## 3. 规划选项

### 3.1 选项 A: Plan Agent（推荐用于复杂功能）

**适用场景**:
- 需求需要分析和验证
- 多模块或跨层变更
- 范围不清晰需要研究

```bash
python3 ./.spec-first/scripts/multi_agent/plan.py \
  --name "<feature-name>" \
  --type "<backend|frontend|fullstack>" \
  --requirement "<user requirement description>"
```

**Plan Agent 会**:
1. 评估需求有效性（可能拒绝不清晰/过大的需求）
2. 调用 research agent 分析代码库
3. 创建并配置任务目录
4. 编写带验收标准的 prd.md
5. 输出可用的任务目录

**完成后启动 worktree agent**:
```bash
python3 ./.spec-first/scripts/multi_agent/start.py "$TASK_DIR"
```

### 3.2 选项 B: 手动配置（用于简单/明确的功能）

**适用场景**:
- 需求已清晰具体
- 知道确切涉及的文件
- 简单、范围明确的变更

#### Step 1: 创建任务目录

```bash
TASK_DIR=$(python3 ./.spec-first/scripts/task.py create "<title>" --slug <task-name>)
```

#### Step 2: 配置任务

```bash
# 初始化 jsonl 上下文文件
python3 ./.spec-first/scripts/task.py init-context "$TASK_DIR" <dev_type>

# 设置分支和范围
python3 ./.spec-first/scripts/task.py set-branch "$TASK_DIR" feature/<name>
python3 ./.spec-first/scripts/task.py set-scope "$TASK_DIR" <scope>
```

#### Step 3: 添加上下文（可选：使用 research agent）

```bash
python3 ./.spec-first/scripts/task.py add-context "$TASK_DIR" implement "<path>" "<reason>"
python3 ./.spec-first/scripts/task.py add-context "$TASK_DIR" check "<path>" "<reason>"
```

#### Step 4: 创建 prd.md

```bash
cat > "$TASK_DIR/prd.md" << 'EOF'
# Feature: <name>

## Requirements
- ...

## Acceptance Criteria
- ...
EOF
```

#### Step 5: 验证并启动

```bash
python3 ./.spec-first/scripts/task.py validate "$TASK_DIR"
python3 ./.spec-first/scripts/multi_agent/start.py "$TASK_DIR"
```

---

## 4. 流水线阶段

worktree 中的 dispatch agent 自动执行：

```
┌─────────────────────────────────────────────────────────────┐
│                    流水线阶段                                │
└─────────────────────────────────────────────────────────────┘

  1. implement  →  实现功能
       ↓
  2. check      →  检查代码质量
       ↓
  3. finish     →  最终验证
       ↓
  4. create-pr  →  创建 PR
```

---

## 5. 监控命令

启动后，用户可以使用以下命令监控：

```bash
# 概览
python3 ./.spec-first/scripts/multi_agent/status.py

# 查看日志
python3 ./.spec-first/scripts/multi_agent/status.py --log <name>

# 实时监控
python3 ./.spec-first/scripts/multi_agent/status.py --watch <name>

# 清理 worktree
python3 ./.spec-first/scripts/multi_agent/cleanup.py <branch>
```

---

## 6. 用户可用命令

| 命令 | 描述 |
|------|------|
| `/spec:parallel` | 启动多 Agent 流水线（此命令） |
| `/spec:start` | 启动正常开发模式（单进程） |
| `/spec:record-session` | 记录会话进度 |
| `/spec:finish-work` | 完成前检查清单 |

---

## 7. 设计分析

### 7.1 架构角色

```
┌─────────────────────────────────────────────────────────────┐
│                    架构角色                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Main Repository                                           │
│        │                                                    │
│        └── parallel (编排器)                                │
│              │                                              │
│              ├── plan.py (规划)                             │
│              ├── start.py (启动)                            │
│              └── status.py (监控)                           │
│                    │                                        │
│                    └──▶ Worktree Agent                      │
│                          │                                  │
│                          ├── implement                      │
│                          ├── check                          │
│                          ├── finish                         │
│                          └── create-pr                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 职责分离

| 角色 | 职责 |
|------|------|
| **Orchestrator** | 规划、配置、调度、监控 |
| **Research Agent** | 代码库分析、spec 查找 |
| **Worktree Agent** | 实际代码实现 |

### 7.3 与单进程模式对比

| 特性 | parallel | start |
|------|----------|-------|
| 执行方式 | 多 Agent 并行 | 单进程 |
| 代码隔离 | worktree | 主仓库 |
| 适用场景 | 复杂功能 | 简单任务 |
| 风险 | 低（隔离） | 中（直接修改） |

---

## 8. 最佳实践

### 8.1 选择规划方式

- **复杂功能** → 选项 A（Plan Agent）
- **简单功能** → 选项 B（手动配置）

### 8.2 监控和干预

- 定期检查 agent 状态
- 发现问题时可停止并清理
- 完成后合并 PR

---

## 9. 总结

**parallel** 是多 Agent 并行开发协调器：

```
用户需求 → parallel → 规划 → worktree agent → PR
              │
              ├── Plan Agent (复杂)
              ├── 手动配置 (简单)
              └── 监控状态
```

**核心价值**:
- 并行开发能力
- 代码隔离（worktree）
- 自动化流水线
- 风险降低
