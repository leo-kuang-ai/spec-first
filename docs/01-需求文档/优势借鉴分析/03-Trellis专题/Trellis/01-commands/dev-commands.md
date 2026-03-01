# 开发流程命令详解

> 本文档详细分析 Trellis 的开发流程命令

---

## 1. `/trellis:brainstorm` - 需求发现

### 1.1 功能概述

**核心职责**: 在实现前进行协作式需求发现，针对 AI 编码工作流优化

**触发时机**: 从 `/trellis:start` 调用，当：
- 需求不清楚或正在演变
- 存在多种有效实现路径
- 权衡很重要（UX、可靠性、可维护性、成本、性能）
- 用户可能不知道最佳选项

### 1.2 核心原则（不可协商）

| 原则 | 描述 |
|------|------|
| **任务优先** | 立即确保任务存在，用户想法被记录 |
| **先行动再提问** | 如果可以从代码、文档、配置中推导答案，先做 |
| **每条消息一个问题** | 永远不要用问题列表压倒用户 |
| **偏好具体选项** | 对于偏好/决策问题，提供 2-3 个可行、具体的方法及权衡 |
| **技术选择先研究** | 如果决策取决于行业惯例/类似工具/既定模式，先研究再提议 |
| **发散 → 收敛** | 初步理解后，主动考虑未来演进、相关场景、失败/边界情况，然后收敛到 MVP |
| **不问元问题** | 不要问"应该搜索吗？"，如果需要信息：搜索/检查 |

### 1.3 执行流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Brainstorm Flow                          │
├─────────────────────────────────────────────────────────────┤
│  Step 0: 确保任务存在（总是）                                │
│          创建任务目录 + 初始化 prd.md                        │
│                                                              │
│  Step 1: 自动上下文（提问前做）                              │
│          检查代码库、文档、配置、约定                        │
│                                                              │
│  Step 2: 分类复杂度                                         │
│          Trivial → 跳过 brainstorm                          │
│          Simple → 1 个确认问题                               │
│          Moderate → 轻量 brainstorm (2-3 问题)              │
│          Complex → 完整 brainstorm                          │
│                                                              │
│  Step 3: 问题门禁                                           │
│          Gate A: 能推导吗？→ 不问                            │
│          Gate B: 元/懒惰问题？→ 不问                         │
│          Gate C: 阻塞/偏好/可推导？→ 只问阻塞/偏好           │
│                                                              │
│  Step 4: 研究优先模式（技术选择强制）                        │
│          识别 2-4 个可比工具/模式                            │
│          总结通用约定                                        │
│          产生 2-3 个可行方法                                 │
│                                                              │
│  Step 5: 扩展扫描（发散）                                    │
│          未来演进 → 相关场景 → 失败/边界情况                │
│                                                              │
│  Step 6: Q&A 循环（收敛）                                    │
│          每条消息一个问题                                    │
│          每次回答后更新 PRD                                  │
│                                                              │
│  Step 7: 提议方法 + 记录决策                                 │
│          2-3 个可行方法 → ADR-lite                          │
│                                                              │
│  Step 8: 最终确认 + 实施计划                                 │
│          确认完整需求 → 小 PR 分解                           │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 Step 0: 确保 Task 存在

```bash
TASK_DIR=$(python3 ./.trellis/scripts/task.py create "brainstorm: <short goal>" --slug <auto>)
```

初始 PRD 模板：

```markdown
# brainstorm: <short goal>

## Goal
<one paragraph: what + why>

## What I already know
* <facts from user message>
* <facts discovered from repo/docs>

## Assumptions (temporary)
* <assumptions to validate>

## Open Questions
* <ONLY Blocking / Preference questions; keep list short>

## Requirements (evolving)
* <start with what is known>

## Acceptance Criteria (evolving)
* [ ] <testable criterion>

## Definition of Done (team quality bar)
* Tests added/updated
* Lint / typecheck / CI green
* Docs/notes updated if behavior changes

## Out of Scope (explicit)
* <what we will not do in this task>

## Technical Notes
* <files inspected, constraints, links, references>
```

### 1.5 问题门禁逻辑

```python
# Gate A: 能推导吗？
if answer_available_via(repo_inspection, docs_specs, quick_research):
    # 不问，获取答案，更新 PRD
    pass

# Gate B: 元/懒惰问题？
if question in ["Should I search?", "Can you paste the code?", "What does the code look like?"]:
    # 不问，采取行动
    pass

# Gate C: 问题类型？
if question_type == "Derivable":
    # 不问
    pass
elif question_type in ["Blocking", "Preference"]:
    # 问
    ask_question()
```

### 1.6 研究优先模式

**触发条件**:
- 选择方法、库、协议、框架、模板系统、插件机制、CLI UX 约定
- 用户要求"最佳实践"、"其他人怎么做"、"推荐"
- 用户无法合理枚举选项

**研究输出格式**:

```markdown
## Research Notes

### What similar tools do
* ...
* ...

### Constraints from our repo/project
* ...

### Feasible approaches here

**Approach A: <name>** (Recommended)
* How it works:
* Pros:
* Cons:

**Approach B: <name>**
* How it works:
* Pros:
* Cons:
```

### 1.7 扩展扫描模板

```markdown
I understand you want to implement: <current goal>.

Before diving into design, let me quickly diverge to consider three categories:

1. Future evolution: <1–2 bullets>
2. Related scenarios: <1–2 bullets>
3. Failure/edge cases: <1–2 bullets>

For this MVP, which would you like to include (or none)?

1. Current requirement only (minimal viable)
2. Add <X> (reserve for future extension)
3. Add <Y> (improve robustness/consistency)
4. Other: describe your preference
```

### 1.8 最终确认格式

```markdown
Here's my understanding of the complete requirements:

**Goal**: <one sentence>

**Requirements**:
* ...
* ...

**Acceptance Criteria**:
* [ ] ...
* [ ] ...

**Definition of Done**:
* ...

**Out of Scope**:
* ...

**Technical Approach**:
<brief summary + key decisions>

**Implementation Plan (small PRs)**:
* PR1: <scaffolding + tests + minimal plumbing>
* PR2: <core behavior>
* PR3: <edge cases + docs + cleanup>

Does this look correct? If yes, I'll proceed with implementation.
```

### 1.9 与 Task Workflow 集成

```
Brainstorm
  Step 0: Create task directory + seed PRD
  Step 1–7: Discover requirements, research, converge
  Step 8: Final confirmation → user approves
  ↓
Task Workflow Phase 2 (Prepare for Implementation)
  Code-Spec Depth Check (if applicable)
  → Research codebase (based on confirmed PRD)
  → Configure code-spec context (jsonl files)
  → Activate task
  ↓
Task Workflow Phase 3 (Execute)
  Implement → Check → Complete
```

---

## 2. `/trellis:parallel` - 多 Agent 管道

### 2.1 功能概述

**核心职责**: 多 Agent 管道编排器，在主仓库中管理并行开发任务

**关键约束**:
- 你在主仓库中，不在 worktree
- 你不直接写代码 - 代码由 worktree 中的 agent 完成
- 你负责规划和调度：讨论需求、创建计划、配置上下文、启动 worktree agent

### 2.2 启动流程

```
Step 1: 理解 Trellis 工作流 → cat .trellis/workflow.md
Step 2: 获取当前状态 → python3 ./.trellis/scripts/get_context.py
Step 3: 读取项目规范 → cat .trellis/spec/*/index.md
Step 4: 询问用户需求
```

### 2.3 规划方式选择

#### Option A: Plan Agent（复杂功能推荐）

**适用场景**:
- 需求需要分析和验证
- 多模块或跨层变更
- 范围不清楚需要研究

```bash
python3 ./.trellis/scripts/multi_agent/plan.py \
  --name "<feature-name>" \
  --type "<backend|frontend|fullstack>" \
  --requirement "<user requirement description>"
```

**Plan Agent 功能**:
1. 评估需求有效性（可能拒绝如果不清楚/过大）
2. 调用 research agent 分析代码库
3. 创建并配置任务目录
4. 编写 prd.md 和验收标准
5. 输出即用的任务目录

完成后启动 worktree agent：

```bash
python3 ./.trellis/scripts/multi_agent/start.py "$TASK_DIR"
```

#### Option B: 手动配置（简单/清晰功能）

**适用场景**:
- 需求已清晰具体
- 你知道涉及哪些文件
- 简单、范围明确的变更

**手动配置步骤**:

```bash
# Step 1: 创建任务目录
TASK_DIR=$(python3 ./.trellis/scripts/task.py create "<title>" --slug <task-name>)

# Step 2: 配置任务
python3 ./.trellis/scripts/task.py init-context "$TASK_DIR" <dev_type>
python3 ./.trellis/scripts/task.py set-branch "$TASK_DIR" feature/<name>
python3 ./.trellis/scripts/task.py set-scope "$TASK_DIR" <scope>

# Step 3: 添加上下文（可选：使用 research agent）
python3 ./.trellis/scripts/task.py add-context "$TASK_DIR" implement "<path>" "<reason>"
python3 ./.trellis/scripts/task.py add-context "$TASK_DIR" check "<path>" "<reason>"

# Step 4: 创建 prd.md
cat > "$TASK_DIR/prd.md" << 'EOF'
# Feature: <name>

## Requirements
- ...

## Acceptance Criteria
- ...
EOF

# Step 5: 验证并启动
python3 ./.trellis/scripts/task.py validate "$TASK_DIR"
python3 ./.trellis/scripts/multi_agent/start.py "$TASK_DIR"
```

### 2.4 管道阶段

worktree 中的 dispatch agent 自动执行：

```
1. implement → 实现功能
2. check → 检查代码质量
3. finish → 最终验证
4. create-pr → 创建 PR
```

### 2.5 监控命令

```bash
python3 ./.trellis/scripts/multi_agent/status.py                    # 概览
python3 ./.trellis/scripts/multi_agent/status.py --log <name>       # 查看日志
python3 ./.trellis/scripts/multi_agent/status.py --watch <name>     # 实时监控
python3 ./.trellis/scripts/multi_agent/cleanup.py <branch>          # 清理 worktree
```

### 2.6 核心规则

1. **不直接写代码** - 委托给 worktree 中的 agent
2. **不执行 git commit** - agent 通过 create-pr 动作执行
3. **委托复杂分析给 research** - 查找规范、分析代码结构
4. **所有子 agent 使用 opus 模型** - 确保输出质量

---

## 3. `/trellis:create-command` - 创建斜杠命令

### 3.1 功能概述

**核心职责**: 根据用户需求在 `.cursor/commands/` 和 `.claude/commands/trellis/` 创建新斜杠命令

### 3.2 使用方式

```
/trellis:create-command <command-name> <description>
```

**示例**:
```
/trellis:create-command review-pr Check PR code changes against project guidelines
```

### 3.3 执行流程

```
┌─────────────────────────────────────────────────────────────┐
│                 Create Command Flow                          │
├─────────────────────────────────────────────────────────────┤
│  Step 1: 解析输入                                           │
│          提取命令名称（kebab-case）和描述                    │
│                                                              │
│  Step 2: 分析需求                                           │
│          确定命令类型：                                      │
│          - 初始化：读取文档、建立上下文                      │
│          - 预开发：读取规范、检查依赖                        │
│          - 代码检查：验证代码质量和规范合规                  │
│          - 记录：记录进度、问题、结构变更                    │
│          - 生成：生成文档、代码模板                          │
│                                                              │
│  Step 3: 生成命令内容                                       │
│          简单命令：1-3 行简洁指令                            │
│          复杂命令：标题 + 描述 + 步骤 + 输出格式             │
│                                                              │
│  Step 4: 创建文件                                           │
│          .cursor/commands/trellis-<name>.md                  │
│          .claude/commands/trellis/<name>.md                  │
│                                                              │
│  Step 5: 确认创建                                           │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 命令类型与内容

**简单命令** (1-3 行):
```markdown
Concise instruction describing what to do
```

**复杂命令** (带步骤):
```markdown
# Command Title

Command description

## Steps

### 1. First Step
Specific action

### 2. Second Step
Specific action

## Output Format (if needed)

Template
```

### 3.5 命令内容指南

**应该**:
- 清晰简洁：立即理解
- 可执行：AI 可直接遵循步骤
- 范围明确：清晰边界
- 有输出：指定预期输出格式（如需要）

**避免**:
- 太模糊：如"优化代码"
- 太复杂：单个命令不应超过 100 行
- 重复功能：先检查是否已有类似命令

### 3.6 命名约定

| 命令类型 | 前缀 | 示例 |
|----------|------|------|
| 会话开始 | `start` | `start` |
| 预开发 | `before-` | `before-frontend-dev` |
| 检查 | `check-` | `check-frontend` |
| 记录 | `record-` | `record-session` |
| 生成 | `generate-` | `generate-api-doc` |
| 更新 | `update-` | `update-changelog` |
| 其他 | 动词优先 | `review-code`, `sync-data` |

---

## 4. `/trellis:integrate-skill` - 集成 Claude Skill

### 4.1 功能概述

**核心职责**: 将 Claude 全局 skill 适配并集成到项目开发规范中

> **重要**: 目标是更新**开发规范**，而不是直接生成项目代码

### 4.2 使用方式

```
/trellis:integrate-skill <skill-name>
```

**示例**:
```
/trellis:integrate-skill frontend-design
/trellis:integrate-skill mcp-builder
```

### 4.3 核心原则

```
规范内容 → 写入 .trellis/spec/{target}/doc.md
代码示例 → 放在 .trellis/spec/{target}/examples/skills/<skill-name>/
示例文件 → 使用 .template 后缀（避免 IDE 错误）
```

### 4.4 执行流程

```
Step 1: 读取 Skill 内容 → openskills read <skill-name>
Step 2: 确定集成目标
        UI/Frontend → .trellis/spec/frontend/
        Backend/API → .trellis/spec/backend/
        Documentation → .trellis/ 或创建专门规范
        Testing → .trellis/spec/frontend/ (E2E)
Step 3: 分析 Skill 内容
        提取核心概念、最佳实践、代码模式、注意事项
Step 4: 执行集成
        4.1 更新规范文档 → 添加新 section
        4.2 创建示例目录（如有代码示例）
        4.3 更新索引文件
Step 5: 生成集成报告
```

### 4.5 集成目标映射

| Skill 类别 | 集成目标 |
|------------|----------|
| UI/Frontend (`frontend-design`, `web-artifacts-builder`) | `.trellis/spec/frontend/` |
| Backend/API (`mcp-builder`) | `.trellis/spec/backend/` |
| Documentation (`doc-coauthoring`, `docx`, `pdf`) | `.trellis/` 或创建专门规范 |
| Testing (`webapp-testing`) | `.trellis/spec/frontend/` (E2E) |

### 4.6 规范文档模板

```markdown
@@@section:skill-<skill-name>
## # <Skill Name> Integration Guide

### Overview
[Core functionality and use cases of the skill]

### Project Adaptation
[How to use this skill in the current project]

### Usage Steps
1. [Step 1]
2. [Step 2]

### Caveats
- [Project-specific constraints]
- [Differences from default behavior]

### Reference Examples
See `examples/skills/<skill-name>/`

@@@/section:skill-<skill-name>
```

### 4.7 示例目录结构

```
.trellis/spec/{target}/
|-- doc.md                      # Add skill-related section
|-- index.md                    # Update index
+-- examples/
    +-- skills/
        +-- <skill-name>/
            |-- README.md               # Example documentation
            |-- example-1.ts.template   # Code example (use .template suffix)
            +-- example-2.tsx.template
```

### 4.8 集成报告格式

```markdown
## Skill Integration Report: `<skill-name>`

### Overview
- **Skill description**: [Functionality description]
- **Integration target**: `.trellis/spec/{target}/`

### Tech Stack Compatibility

| Skill Requirement | Project Status | Compatibility |
|-------------------|----------------|---------------|
| [Tech 1] | [Project tech] | [OK]/[!]/[X] |

### Integration Locations

| Type | Path |
|------|------|
| Guidelines doc | `.trellis/spec/{target}/doc.md` (section: `skill-<name>`) |
| Code examples | `.trellis/spec/{target}/examples/skills/<name>/` |
| Index update | `.trellis/spec/{target}/index.md` |

### Dependencies (if needed)

```bash
npm install <package>
```

### Completed Changes

- [ ] Added `@@@section:skill-<name>` section to `doc.md`
- [ ] Added index entry to `index.md`
- [ ] Created example files in `examples/skills/<name>/`
- [ ] Example files use `.template` suffix
```
