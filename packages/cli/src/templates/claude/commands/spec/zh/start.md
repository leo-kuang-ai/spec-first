# 开始会话

初始化你的 AI 开发会话并开始处理任务。

如果你需要在现有任务之间选择，先使用 `current-task`。此页面描述你已经知道确切任务后的低级开始/恢复流程。

---

## 操作类型

| Marker | Meaning | Executor |
|--------|---------|----------|
| `[AI]` | AI 执行的 Bash 脚本或 Task 调用 | 你 (AI) |
| `[USER]` | 用户执行的斜杠命令 | User |

---

## 初始化 `[AI]`

### 步骤 1：理解开发工作流

首先，阅读工作流指南以了解开发过程：

```bash
cat .spec-first/workflow.md
```

**遵循 workflow.md 中的指令** - 它包含：
- 核心原则（读后再写、遵循标准等）
- 文件系统结构
- 开发流程
- 最佳实践

### 步骤 2：获取当前上下文

```bash
python3 ./.spec-first/scripts/get_context.py
```

这显示：开发者身份、git 状态、当前任务（如果有）、活动任务。

### 步骤 3：阅读规范索引

```bash
python3 ./.spec-first/scripts/get_context.py --mode packages
```

这显示可用的包及其规范层。阅读相关的规范索引：

```bash
cat .spec-first/spec/<package>/<layer>/index.md   # 包特定规范
cat .spec-first/spec/guides/index.md              # 思维指南（始终阅读）
```

> **重要**：索引文件是导航——它们列出实际的规范文件（例如 `error-handling.md`、`conventions.md`、`mock-strategies.md`）。
> 在此步骤中，只需阅读索引以了解有哪些可用内容。
> 当你开始实际开发时，你必须回去阅读索引的开发前检查清单中列出的与你的任务相关的具体规范文件。

### 步骤 4：报告并询问

报告你学到的内容并询问："你想处理什么？"

---

## 任务分类

当用户描述任务时，分类它：

| Type | Criteria | Workflow |
|------|----------|----------|
| **Question** | 用户询问代码、架构或某事如何工作 | 直接回答 |
| **Trivial Fix** | 错别字修复、注释更新、单行更改 | 直接编辑 |
| **Simple Task** | 目标明确、1-2 个文件、范围定义良好 | 快速确认 → 实现 |
| **Complex Task** | 目标模糊、多个文件、架构决策 | **头脑风暴 → 任务工作流** |

### 分类信号

**琐碎/简单指标：**
- 用户指定确切文件和更改
- "修复 X 中的错别字"
- "向组件 Z 添加字段 Y"
- 验收标准已明确说明

**复杂指标：**
- "我想添加一个功能..."
- "你能帮我改进..."
- 提到多个区域或系统
- 没有明确的实现路径
- 用户似乎不确定方法

### 决策规则

> **如果有疑问，使用头脑风暴 + 任务工作流。**
>
> 任务工作流确保 code-spec 上下文被注入到代理中，从而产生更高质量的代码。
> 开销很小，但好处很大。

---

## 问题 / 琐碎修复

对于问题或琐碎修复，直接工作：

1. 回答问题或进行修复
2. 如果更改了代码，提醒用户运行 `/spec:finish-work`

---

## 简单任务

对于简单、定义明确的任务：

1. 快速确认："我理解你想 [goal]。我可以继续吗？"
2. 如果否，澄清并再次确认
3. **如果是：不停顿地执行以下所有步骤。不要在步骤之间请求额外确认。**
   - 创建任务目录（阶段 1 路径 B，步骤 2）
   - 编写 PRD（步骤 3）
   - 研究代码库（阶段 2，步骤 5）
   - 配置上下文（步骤 6）
   - 激活任务（步骤 7）
   - 实现（阶段 3，步骤 8）
   - 检查质量（步骤 9）
   - 完成（步骤 10）

---

## 复杂任务 - 先头脑风暴

对于复杂或模糊的任务，**自动启动头脑风暴流程** — 不要直接跳到实现。

见 `/spec:brainstorm` 了解完整流程。摘要：

1. **确认和分类** - 陈述你的理解
2. **创建任务目录** - 在 `prd.md` 中跟踪演变的需求
3. **一次问一个问题** - 每次回答后更新 PRD
4. **提出方法** - 对于架构决策
5. **确认最终需求** - 获得明确批准
6. **继续任务工作流** - 带有 PRD 中的明确需求

> **子任务分解**：如果头脑风暴揭示多个独立工作项，
> 考虑使用 `--parent` 标志或 `add-subtask` 命令创建子任务。
> 见 `/spec:brainstorm` 步骤 8 了解详情。

### 关键头脑风暴原则

| Principle | Description |
|-----------|-------------|
| **一次一个问题** | 永远不要用多个问题压倒用户 |
| **立即更新 PRD** | 每次回答后，更新文档 |
| **优先多选** | 更容易让用户回答 |
| **YAGNI** | 挑战不必要的复杂性 |

---

## 任务工作流（开发任务）

**为什么这个工作流？**
- 研究代理分析需要哪些 code-spec 文件
- Code-spec 文件配置在 jsonl 文件中
- 实现代理通过 Hook 注入接收 code-spec 上下文
- 检查代理根据 code-spec 要求进行验证
- 结果：自动遵循项目约定的代码

### 概述：两个入口点

```
From Brainstorm (Complex Task):
  PRD confirmed → Research → Configure Context → Activate → Implement → Check → Complete

From Simple Task:
  Confirm → Create Task → Write PRD → Research → Configure Context → Activate → Implement → Check → Complete
```

**关键原则：研究在需求明确后发生（PRD 存在）。**

---

### 阶段 1：建立需求

#### 路径 A：从头脑风暴（跳到阶段 2）

PRD 和任务目录已从头脑风暴中存在。直接跳到阶段 2。

#### 路径 B：从简单任务

**步骤 1：确认理解** `[AI]`

快速确认：
- 目标是什么？
- 什么类型的开发？（frontend / backend / fullstack）
- 有任何特定需求或约束吗？

**步骤 2：创建任务目录** `[AI]`

```bash
TASK_DIR=$(python3 ./.spec-first/scripts/task.py create "<title>" --slug <name>)
```

**步骤 3：编写 PRD** `[AI]`

在任务目录中创建 `prd.md`：

```markdown
# <Task Title>

## Goal
<What we're trying to achieve>

## Requirements
- <Requirement 1>
- <Requirement 2>

## Acceptance Criteria
- [ ] <Criterion 1>
- [ ] <Criterion 2>

## Technical Notes
<Any technical decisions or constraints>
```

---

### 阶段 2：准备实现（共享）

> 两条路径在这里汇合。继续之前 PRD 和任务目录必须存在。

**步骤 4：Code-Spec 深度检查** `[AI]`

如果任务涉及 infra 或跨层约定，在 code-spec 深度定义之前不要开始实现。

当更改包含以下任何内容时触发此要求：
- 新或更改的命令/API 签名
- 数据库 schema 或迁移更改
- Infra 集成（存储、队列、缓存、密钥、环境约定）
- 跨层负载转换

继续之前必须有：
- [ ] 识别要更新的目标 code-spec 文件
- [ ] 定义具体约定（签名、字段、环境键）
- [ ] 定义验证和错误矩阵
- [ ] 定义至少一个 Good/Base/Bad 案例

**步骤 5：研究代码库** `[AI]`

基于确认的 PRD，调用研究代理查找相关规范和模式：

```
Task(
  subagent_type: "research",
  prompt: "Analyze the codebase for this task:

  Task: <goal from PRD>
  Type: <frontend/backend/fullstack>

  Please find:
  1. Relevant code-spec files in .spec-first/spec/
  2. Existing code patterns to follow (find 2-3 examples)
  3. Files that will likely need modification

  Output:
  ## Relevant Code-Specs
  - <path>: <why it's relevant>

  ## Code Patterns Found
  - <pattern>: <example file path>

  ## Files to Modify
  - <path>: <what change>",
  model: "opus"
)
```

**步骤 6：配置上下文** `[AI]`

初始化默认上下文：

```bash
python3 ./.spec-first/scripts/task.py init-context "$TASK_DIR" <type>
# type: backend | frontend | fullstack
```

添加研究代理找到的 code-spec 文件：

```bash
# For each relevant code-spec and code pattern:
python3 ./.spec-first/scripts/task.py add-context "$TASK_DIR" implement "<path>" "<reason>"
python3 ./.spec-first/scripts/task.py add-context "$TASK_DIR" check "<path>" "<reason>"
```

**步骤 7：激活任务** `[AI]`

```bash
python3 ./.spec-first/scripts/task.py start "$TASK_DIR"
```

这设置 `.current-task` 以便 hooks 可以注入上下文。

---

### 阶段 3：执行（共享）

**步骤 8：实现** `[AI]`

调用实现代理（code-spec 上下文由 hook 自动注入）：

```
Task(
  subagent_type: "implement",
  prompt: "Implement the task described in prd.md.

  Follow all code-spec files that have been injected into your context.
  Run lint and typecheck before finishing.",
  model: "opus"
)
```

**步骤 9：检查质量** `[AI]`

调用检查代理（code-spec 上下文由 hook 自动注入）：

```
Task(
  subagent_type: "check",
  prompt: "Review all code changes against the code-spec requirements.

  Fix any issues you find directly.
  Ensure lint and typecheck pass.",
  model: "opus"
)
```

**步骤 10：完成** `[AI]`

1. 验证 lint 和 typecheck 通过
2. 报告实现了什么
3. 提醒用户：
   - 测试更改
   - 准备好后提交
   - 运行 `/spec:record-session` 记录此会话

---

## 继续现有任务

如果 `get_context.py` 显示当前任务：

1. 读取任务的 `prd.md` 了解目标
2. 检查 `task.json` 了解当前状态和阶段
3. 询问用户："继续处理 <task-name> 吗？"

如果是，从适当的步骤恢复（通常是步骤 7 或 8）。

---

## 命令参考

### 用户命令 `[USER]`

| Command | When to Use |
|---------|-------------|
| `/spec:start` | 开始会话（此命令） |
| `/spec:brainstorm` | 澄清模糊需求（从 start 调用） |
| `/spec:parallel` | 需要隔离 worktree 的复杂任务 |
| `/spec:finish-work` | 提交更改之前 |
| `/spec:record-session` | 完成任务后 |

### AI 脚本 `[AI]`

| Script | Purpose |
|--------|---------|
| `python3 ./.spec-first/scripts/get_context.py` | 获取会话上下文 |
| `python3 ./.spec-first/scripts/task.py create` | 创建任务目录 |
| `python3 ./.spec-first/scripts/task.py init-context` | 初始化 jsonl 文件 |
| `python3 ./.spec-first/scripts/task.py add-context` | 添加 code-spec/上下文文件到 jsonl |
| `python3 ./.spec-first/scripts/task.py start` | 设置当前任务 |
| `python3 ./.spec-first/scripts/task.py finish` | 清除当前任务 |
| `python3 ./.spec-first/scripts/task.py archive` | 归档已完成的任务 |

### 子代理 `[AI]`

| Agent | Purpose | Hook Injection |
|-------|---------|----------------|
| research | 分析代码库 | No (reads directly) |
| implement | 编写代码 | Yes (implement.jsonl) |
| check | 审查和修复 | Yes (check.jsonl) |
| debug | 修复特定问题 | Yes (debug.jsonl) |

---

## 关键原则

> **Code-spec 上下文是注入的，不是记住的。**
>
> 任务工作流确保代理自动接收相关的 code-spec 上下文。
> 这比希望 AI"记住"约定更可靠。
