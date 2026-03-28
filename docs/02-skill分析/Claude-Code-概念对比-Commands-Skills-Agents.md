# Claude Code 概念对比：Commands vs Skills vs Agents

## Commands vs Skills vs Agents

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claude Code                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  用户输入 ──→ [触发器] ──→ 执行主体 ──→ 工具/资源              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 对比表

| 维度 | Commands | Skills | Agents |
|------|----------|--------|--------|
| **触发方式** | `/xxx` 手动输入 | 自然语言自动触发 + 手动 | 主 Agent 自动调用 |
| **存储位置** | `.claude/commands/` | `.claude/skills/` | `.claude/agents/` |
| **本质** | Prompt 模板 | 能力扩展包 | 独立的子进程 Agent |
| **执行者** | 主 Claude | 主 Claude | 独立的子 Claude |
| **上下文** | 共享主会话 | 共享主会话 | **独立上下文** |
| **工具访问** | 主会话的工具 | 主会话的工具 | 可配置子集工具 |
| **用途** | 工作流模板 | 领域知识/工具集成 | 并行/隔离任务 |

## 层级关系

```
┌────────────────────────────────────────────────────────────────┐
│                     Main Session (主会话)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Claude (主 Agent)                                        │  │
│  │                                                           │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │   │  Commands   │  │   Skills    │  │  Agent (spawn)  │  │  │
│  │   │  /xxx       │  │  (auto)     │  │  ────────────>  │  │  │
│  │   │             │  │             │  │                 │  │  │
│  │   │ 模板展开    │  │ 知识注入    │  │  ┌───────────┐  │  │  │
│  │   │ 共享上下文  │  │ 共享上下文  │  │  │ Sub-Agent │  │  │  │
│  │   │             │  │             │  │  │ 独立上下文│  │  │  │
│  │   └─────────────┘  └─────────────┘  │  │ 独立工具集│  │  │  │
│  │                                     │  └───────────┘  │  │  │
│  │                                     └─────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## 详细说明

### 1. Commands (Slash Commands)

```
用户: /spec:start
      ↓
Claude: 读取 .claude/commands/spec/start.md
      ↓
展开为完整 prompt，在主会话中执行
```

- **轻量级**，只是 prompt 模板
- **共享上下文**，能访问当前对话历史
- 适合：固定流程、checklist

### 2. Skills

```
用户: "帮我生成一张图片"
      ↓
Claude: 检测到触发条件 → 加载 image-gen skill
      ↓
注入 skill 的知识和工具调用方式，在主会话中执行
```

- **能力扩展**，包含知识 + 可能的工具
- **共享上下文**，能访问当前对话历史
- **自动触发**，不需要用户记住命令
- 适合：领域知识、工具集成、API 调用

### 3. Agents (Sub-Agents)

```
主 Claude: 这个任务需要并行处理
      ↓
spawn Agent(subagent_type="research", prompt="...")
      ↓
┌─────────────────────────────────┐
│  Sub-Agent (独立进程)            │
│  - 独立的 Claude 实例            │
│  - 独立的上下文 (只看到 prompt)  │
│  - 可配置的工具子集              │
│  - 可以 worktree 隔离           │
└─────────────────────────────────┘
      ↓
返回结果给主 Claude
```

- **独立进程**，有自己的上下文
- **可隔离**，能在 worktree 中工作
- **可并行**，同时跑多个 sub-agent
- 适合：复杂任务、并行处理、需要隔离的操作

## 选择指南

| 场景 | 推荐 |
|------|------|
| 固定工作流模板 | **Command** |
| 需要自动识别并激活 | **Skill** |
| 需要领域专业知识 | **Skill** |
| 需要并行处理多个任务 | **Agent** |
| 需要隔离的代码修改 | **Agent (worktree)** |
| 需要长时间独立运行 | **Agent** |
| 简单 prompt 指令 | **Command** |

## 实际例子

```bash
# Command - 手动触发工作流
/spec:start          # 开始开发会话
/spec:finish-work    # 完成前检查

# Skill - 自动触发
用户: "帮我搜索推特"     → agent-reach skill 自动激活
用户: "生成一张图片"     → baoyu-image-gen skill 自动激活

# Agent - 主 Claude 决定调用
主 Claude: "我需要研究代码库，spawn research agent"
主 Claude: "我需要并行实现 3 个任务，spawn 3 个 implement agents"
```

## Commands vs Skills 详细对比

| 维度 | Commands (Slash Commands) | Skills |
|------|---------------------------|--------|
| **触发方式** | `/command-name` | 自然语言触发或 `Skill` tool |
| **存储位置** | `.claude/commands/` | `.claude/skills/` |
| **用途** | 预定义的工作流程模板 | 扩展能力、工具集成、专业知识 |
| **执行方式** | 展开成 prompt 注入上下文 | 可以调用 MCP tools、有 resources |
| **复杂度** | 较简单，主要是 prompt 模板 | 更复杂，可包含工具调用、资源文件 |

### Commands 结构示例

```
.claude/commands/
└── spec/
    └── start.md      # 输入 /spec:start → 展开为完整 prompt
```

- 本质是 **prompt 模板**
- 用户输入 `/xxx` 时，Claude 读取文件内容作为指令
- 适合：固定流程、checklist、引导式任务

### Skills 结构示例

```
.claude/skills/
└── my-skill/
    ├── SKILL.md      # 技能描述 + 触发条件
    └── resources/    # 可选资源文件
```

- 有 **触发条件**（TRIGGER when: ...）
- 可以 **主动推荐**（用户说某句话时自动激活）
- 可以包含 **MCP tools** 和 **resources**
- 适合：领域知识、工具集成、复杂工作流

### 示例对比

**Command** (`/spec:start`):
```markdown
# Start Session
1. Run get_context.py
2. Read workflow.md
3. Ask user what to work on
```

**Skill** (`baoyu-image-gen`):
```markdown
# Image Generation Skill
TRIGGER when: user asks to "generate image", "create image"

This skill provides AI image generation capabilities...
(可以调用 DALL-E、Gemini 等 API)
```

## 总结

| 场景 | 用什么 |
|------|--------|
| 固定流程模板 | Command |
| 需要自动触发 | Skill |
| 需要调用外部工具 | Skill |
| 简单的 prompt 指令 | Command |
| 需要并行处理 | Agent |
| 需要隔离执行 | Agent |
