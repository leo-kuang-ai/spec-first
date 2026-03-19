# Plan Agent 详解

> 本文档详细分析 Trellis 的 Plan Agent（计划代理）

---

## 1. 核心定位

### 1.1 角色定义

**需求评估与任务配置专家** — 评估需求有效性，配置任务上下文，有权拒绝不合理需求。

```
┌─────────────────────────────────────────────────────────────┐
│                     Plan Agent 定位                          │
├─────────────────────────────────────────────────────────────┤
│  核心能力：                                                  │
│  ├─ 评估需求有效性（可拒绝）                                  │
│  ├─ 调用 Research Agent 分析代码库                           │
│  ├─ 创建并配置任务目录                                        │
│  ├─ 编写 prd.md 和验收标准                                   │
│  └─ 输出即用的任务目录                                        │
│                                                              │
│  拒绝权限：                                                  │
│  ├─ 模糊需求                                                 │
│  ├─ 不完整需求                                               │
│  ├─ 过大需求                                                 │
│  └─ 有害需求                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 与其他 Agent 的区别

| Agent | 是否可拒绝 | 主要职责 |
|-------|-----------|----------|
| **Plan** | ✅ 可以 | 需求评估、任务配置 |
| **Dispatch** | ❌ 不可以 | 纯调度，无决策 |
| **Implement** | ❌ 不可以 | 代码实现 |
| **Check** | ❌ 不可以 | 质量检查 |

---

## 2. 拒绝机制

### 2.1 拒绝条件

```
┌─────────────────────────────────────────────────────────────┐
│                    Plan Agent 拒绝门禁                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               模糊需求 (Vague)                       │    │
│  │  "优化性能" / "改进用户体验" / "让代码更好"           │    │
│  │  → 要求具体化：优化什么指标？改进哪方面？              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              不完整需求 (Incomplete)                 │    │
│  │  缺少关键信息：输入/输出/边界条件/错误处理             │    │
│  │  → 要求补充：缺少哪些必要信息？                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               过大需求 (Too Large)                   │    │
│  │  单个任务涉及多个模块/跨多天工作                       │    │
│  │  → 要求拆分：建议分解为哪些子任务？                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               有害需求 (Harmful)                     │    │
│  │  安全风险/违反规范/破坏现有功能                        │    │
│  │  → 直接拒绝：说明风险和替代方案                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 拒绝响应模板

```markdown
## 需求无法执行

**拒绝原因**: [Vague | Incomplete | Too Large | Harmful]

**问题分析**:
- [具体问题 1]
- [具体问题 2]

**需要的补充信息**:
- [ ] [信息 1]
- [ ] [信息 2]

**建议**:
- [建议 1]
- [建议 2]

请补充以上信息后重新提交需求。
```

---

## 3. 执行流程

### 3.1 完整流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Plan Agent Flow                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: 接收需求                                            │
│          │                                                   │
│          ▼                                                   │
│  Step 2: 评估有效性                                          │
│          ├─ 模糊？ → 要求具体化                               │
│          ├─ 不完整？ → 要求补充                               │
│          ├─ 过大？ → 要求拆分                                 │
│          └─ 有害？ → 直接拒绝                                 │
│          │                                                   │
│          ▼                                                   │
│  Step 3: 调用 Research Agent                                 │
│          分析代码库、查找相关文件、识别依赖                    │
│          │                                                   │
│          ▼                                                   │
│  Step 4: 创建任务目录                                        │
│          python3 ./.trellis/scripts/task.py create "..."     │
│          │                                                   │
│          ▼                                                   │
│  Step 5: 配置任务上下文                                      │
│          - init-context（设置开发类型）                       │
│          - set-branch（设置分支）                             │
│          - set-scope（设置范围）                              │
│          - add-context（添加上下文文件）                      │
│          │                                                   │
│          ▼                                                   │
│  Step 6: 编写 prd.md                                         │
│          需求、验收标准、技术方案                              │
│          │                                                   │
│          ▼                                                   │
│  Step 7: 验证任务配置                                        │
│          python3 ./.trellis/scripts/task.py validate         │
│          │                                                   │
│          ▼                                                   │
│  Step 8: 输出任务目录                                        │
│          可直接启动 worktree agent                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 任务配置命令

```bash
# Step 4: 创建任务目录
TASK_DIR=$(python3 ./.trellis/scripts/task.py create "<title>" --slug <task-name>)

# Step 5: 配置任务
python3 ./.trellis/scripts/task.py init-context "$TASK_DIR" <dev_type>
python3 ./.trellis/scripts/task.py set-branch "$TASK_DIR" feature/<name>
python3 ./.trellis/scripts/task.py set-scope "$TASK_DIR" <scope>

# Step 5.1: 添加上下文
python3 ./.trellis/scripts/task.py add-context "$TASK_DIR" implement "<path>" "<reason>"
python3 ./.trellis/scripts/task.py add-context "$TASK_DIR" check "<path>" "<reason>"

# Step 7: 验证
python3 ./.trellis/scripts/task.py validate "$TASK_DIR"
```

---

## 4. PRD 模板

### 4.1 标准 PRD 结构

```markdown
# Feature: <name>

## Goal
<one paragraph: what + why>

## Requirements
* <requirement 1>
* <requirement 2>

## Acceptance Criteria
* [ ] <testable criterion 1>
* [ ] <testable criterion 2>

## Definition of Done
* Tests added/updated
* Lint / typecheck / CI green
* Docs/notes updated if behavior changes

## Out of Scope
* <what we will not do>

## Technical Notes
* <files inspected, constraints, links, references>
```

### 4.2 上下文配置模板

**implement.jsonl**:
```jsonl
{"file": ".trellis/spec/backend/index.md", "reason": "Backend guidelines"}
{"file": ".trellis/spec/backend/api-design.md", "reason": "API design patterns"}
{"file": "src/auth/", "reason": "Auth module reference"}
```

**check.jsonl**:
```jsonl
{"file": ".trellis/spec/backend/testing.md", "reason": "Testing standards"}
{"file": ".trellis/spec/guides/cross-layer.md", "reason": "Cross-layer checks"}
```

---

## 5. 与 Research Agent 协作

### 5.1 调用时机

```
Plan Agent 需要以下信息时调用 Research Agent：
├─ 查找相关代码文件
├─ 分析代码结构
├─ 识别依赖关系
├─ 查找规范文档
└─ 了解现有实现模式
```

### 5.2 协作流程

```
┌──────────────┐     调用      ┌──────────────┐
│  Plan Agent  │──────────────▶│Research Agent│
│              │               │              │
│  - 需求评估  │               │  - 代码搜索  │
│  - 任务配置  │◀──────────────│  - 信息收集  │
│              │     返回结果   │              │
└──────────────┘               └──────────────┘
       │
       ▼
┌──────────────┐
│  输出任务    │
│  目录配置    │
└──────────────┘
```

---

## 6. 核心规则

### 6.1 五大铁律

| 规则 | 说明 |
|------|------|
| **1. 有权拒绝** | 对不合理需求必须拒绝，不能强行执行 |
| **2. 必须研究** | 调用 Research Agent 分析代码库 |
| **3. 完整配置** | 输出即用的任务目录，不能半成品 |
| **4. 明确 PRD** | prd.md 必须包含可测试的验收标准 |
| **5. 验证配置** | 提交前必须运行 validate 命令 |

### 6.2 配置检查清单

```markdown
## 任务配置检查清单

- [ ] 任务目录已创建
- [ ] dev_type 已设置（backend/frontend/fullstack）
- [ ] 分支已设置（feature/xxx）
- [ ] scope 已设置
- [ ] implement.jsonl 已配置
- [ ] check.jsonl 已配置
- [ ] prd.md 已编写
- [ ] 验收标准可测试
- [ ] task.py validate 通过
```

---

## 7. 与 `/trellis:parallel` 的关系

### 7.1 两种规划方式

| 方式 | 适用场景 | 执行者 |
|------|----------|--------|
| **Plan Agent** | 复杂功能、需分析验证 | AI Agent |
| **手动配置** | 简单功能、需求清晰 | 人类 + AI 辅助 |

### 7.2 Plan Agent 启动命令

```bash
python3 ./.trellis/scripts/multi_agent/plan.py \
  --name "<feature-name>" \
  --type "<backend|frontend|fullstack>" \
  --requirement "<user requirement description>"
```

---

## 8. 对 spec-first 的借鉴价值

### 8.1 核心借鉴点

| 借鉴点 | 优先级 | 说明 |
|--------|--------|------|
| **需求拒绝机制** | P0 | 及早识别问题需求，避免无效工作 |
| **Research Agent 协作** | P1 | 自动分析代码库，提供上下文 |
| **完整配置输出** | P1 | 一次性输出可用配置，减少迭代 |
| **PRD 模板规范** | P2 | 标准化需求文档格式 |

### 8.2 拒绝机制实现建议

```python
class PlanAgent:
    """Plan Agent - 需求评估与任务配置"""

    def evaluate_requirement(self, requirement: str) -> EvaluationResult:
        """评估需求有效性"""
        if self.is_vague(requirement):
            return Rejection(
                reason="Vague",
                message="需求不够具体，请明确：...",
                suggestions=[...]
            )

        if self.is_incomplete(requirement):
            return Rejection(
                reason="Incomplete",
                message="缺少关键信息：...",
                missing_info=[...]
            )

        if self.is_too_large(requirement):
            return Rejection(
                reason="Too Large",
                message="需求过大，建议拆分为：...",
                subtasks=[...]
            )

        if self.is_harmful(requirement):
            return Rejection(
                reason="Harmful",
                message="需求存在风险：...",
                risks=[...]
            )

        return Acceptance(requirement=requirement)
```

---

## 9. 相关文档

- [Dispatch Agent](./dispatch-agent.md) - 纯调度器
- [Research Agent](./research-agent.md) - 代码搜索与信息收集
- [Implement Agent](./implement-agent.md) - 代码实现
- [parallel 命令](../01-commands/dev-commands.md) - 多 Agent 管道
