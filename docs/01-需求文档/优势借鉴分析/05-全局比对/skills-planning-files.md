# Planning-Files 项目 Skill 详细列表

> **版本**: 1.1.0 | **更新日期**: 2026-03-03 | **Skill 源**: `/Users/kuang/xiaobu/planning-with-files/skills/`

---

## 概述

Planning-Files 项目共包含 **1 个核心 Skill**，基于 Manus（2025 年被 Meta 以 20 亿美元收购）的上下文工程原则设计。

---

## 核心 Skill

### planning-with-files

| 属性 | 值 |
|------|-----|
| **名称** | `planning-with-files` |
| **版本** | 2.16.1 |
| **用户可调用** | 是 (`user-invocable: true`) |
| **允许工具** | Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch |

**描述**:
> Implements Manus-style file-based planning to organize and track progress on complex tasks. Creates task_plan.md, findings.md, and progress.md. Use when asked to plan out, break down, or organize a multi-step project, research task, or any work requiring >5 tool calls. Supports automatic session recovery after /clear.

---

## 核心理念

基于 **Manus** 的上下文工程原则：

| 原则 | 说明 |
|------|------|
| **设计围绕 KV-Cache** | 保持 prompt 前缀稳定 |
| **屏蔽而非移除** | 使用 logit masking 而非动态移除工具 |
| **文件系统作为外部内存** | Markdown 是"磁盘上的工作记忆" |
| **通过复述操控注意力** | 定期重读计划文件以保持目标在注意力窗口中 |
| **保留错误内容** | 错误的尝试留在上下文中以减少重复 |
| **不要被 Few-Shot** | 引入受控变化避免漂移 |

**关键引用**:
> "Context window = RAM (volatile, limited). Filesystem = Disk (persistent, unlimited). Anything important gets written to disk."

---

## 代理循环

### 7 步代理循环

```
1. ANALYZE CONTEXT - 理解用户意图、评估当前状态、回顾最近观察
2. THINK - 是否需要更新计划？下一个逻辑动作是什么？有阻塞吗？
3. SELECT TOOL - 选择一个工具，确保参数可用
4. EXECUTE ACTION - 工具在沙箱中运行
5. RECEIVE OBSERVATION - 结果追加到上下文
6. ITERATE - 返回步骤 1，继续直到完成
7. DELIVER OUTCOME - 发送结果给用户，附加所有相关文件
```

---

## 常见任务节奏（实践抽象）

> 说明：以下是基于 `SKILL.md` 与 `reference.md` 提炼的常见节奏，并非 `SKILL.md` 中硬编码的固定 Phase 1-5。

| 阶段 | 名称 | 说明 |
|------|------|------|
| **阶段 A** | Discovery | 理解用户意图、识别约束、在 findings.md 中记录 |
| **阶段 B** | Planning | 定义方案并维护 task_plan.md |
| **阶段 C** | Execution | 按计划执行并持续写入 findings/progress |
| **阶段 D** | Verification | 用 check-complete/progress 校验完成度 |
| **阶段 E** | Delivery | 汇总输出并交付结果 |

---

## 触发条件

**适用场景**:
- 多步骤任务（3+ 步骤）
- 研究任务
- 构建/创建项目
- 跨越多轮工具调用的任务
- 任何需要组织的任务
- 工具调用超过 5 次的工作

**跳过场景**:
- 简单问题
- 单文件编辑
- 快速查找

---

## 创建的文件类型

| 文件 | 用途 | 创建时机 | 更新时机 |
|------|------|----------|----------|
| `task_plan.md` | 阶段跟踪、进度 | 任务开始时 | 完成阶段后 |
| `findings.md` | 发现、决策 | 任何发现后 | 查看 图片/PDF 后 |
| `progress.md` | 会话日志、已完成事项 | 断点处 | 整个会话期间 |

---

## 关键规则

### 1. 先创建计划
复杂任务必须有 `task_plan.md`

### 2. 2-Action 规则
每 2 次 view/browser/search 操作后立即保存关键发现到文本文件

### 3. 决定前先读
重大决策前读取计划文件

### 4. 行动后更新
完成任何阶段后更新状态

### 5. 记录所有错误
每个错误都记录在计划文件中

### 6. 永不重复失败
如果动作失败，下一个动作必须不同

---

## 3-Strike 错误协议

```
ATTEMPT 1: 诊断并修复
ATTEMPT 2: 替代方案
ATTEMPT 3: 更广泛地重新思考
AFTER 3 FAILURES: 升级给用户
```

**关键引用**:
> "if action_failed: next_action != same_action. Track what you tried. Mutate the approach."

---

## 5-Question Reboot Test

用于验证上下文管理是否健全的 5 个问题：

| 问题 | 答案来源 |
|------|----------|
| Where am I? | task_plan.md 中的当前阶段 |
| Where am I going? | 剩余阶段 |
| What's the goal? | 计划中的目标声明 |
| What have I learned? | findings.md |
| What have I done? | progress.md |

---

## Hooks 配置

| Hook 类型 | 匹配器 | 动作 |
|-----------|--------|------|
| **PreToolUse** | Write, Edit, Bash, Read, Glob, Grep | 读取 task_plan.md 前 30 行 |
| **PostToolUse** | Write, Edit | 提示文件已更新，如完成阶段需更新状态 |
| **Stop** | - | 运行 check-complete.sh 检查任务完成状态 |

---

## 脚本文件

| 脚本 | 路径 | 功能 |
|------|------|------|
| `init-session.sh` | `scripts/init-session.sh` | 初始化所有规划文件 |
| `check-complete.sh` | `scripts/check-complete.sh` | 验证所有阶段是否完成 |
| `session-catchup.py` | `scripts/session-catchup.py` | 从上一会话恢复上下文 (v2.2.0) |
| `init-session.ps1` | `scripts/init-session.ps1` | Windows PowerShell 初始化脚本 |
| `check-complete.ps1` | `scripts/check-complete.ps1` | Windows PowerShell 完成检查脚本 |

---

## 模板文件

| 模板 | 路径 | 用途 |
|------|------|------|
| `task_plan.md` | `templates/task_plan.md` | 阶段跟踪模板 |
| `findings.md` | `templates/findings.md` | 研究存储模板 |
| `progress.md` | `templates/progress.md` | 会话日志模板 |

---

## 多平台适配

该项目为以下 AI 工具平台提供了适配版本的 skill：

| 平台 | 适配目录 |
|------|----------|
| Adal | `.adal/skills/planning-with-files/` |
| Agent | `.agent/skills/planning-with-files/` |
| CodeBuddy | `.codebuddy/skills/planning-with-files/` |
| Codex | `.codex/skills/planning-with-files/` |
| Continue | `.continue/skills/planning-with-files/` |
| Cursor | `.cursor/skills/planning-with-files/` |
| Factory | `.factory/skills/planning-with-files/` |
| Gemini | `.gemini/skills/planning-with-files/` |
| Kilocode | `.kilocode/skills/planning-with-files/` |
| Kiro | `.kiro/steering/` (planning-rules.md, planning-templates.md, planning-workflow.md) |
| OpenClaw | `.openclaw/skills/planning-with-files/` |
| OpenCode | `.opencode/skills/planning-with-files/` |
| Pi Agent | `.pi/skills/planning-with-files/` |

---

## 文件结构总览

```
/Users/kuang/xiaobu/planning-with-files/skills/planning-with-files/
├── SKILL.md                 # 主 Skill 定义文件 (7080 bytes)
├── examples.md              # 使用示例 (4426 bytes)
├── reference.md             # Manus 原则参考 (8066 bytes)
├── scripts/
│   ├── check-complete.ps1   # Windows 完成检查脚本
│   ├── check-complete.sh    # Unix 完成检查脚本
│   ├── init-session.ps1     # Windows 初始化脚本
│   ├── init-session.sh      # Unix 初始化脚本
│   └── session-catchup.py   # 会话恢复脚本 (7459 bytes)
└── templates/
    ├── findings.md          # 发现模板
    ├── progress.md          # 进度模板
    └── task_plan.md         # 任务计划模板
```

---

## 关键引用

> "Context window = RAM (volatile, limited). Filesystem = Disk (persistent, unlimited). Anything important gets written to disk."

> "Error recovery is one of the clearest signals of TRUE agentic behavior."

> "KV-cache hit rate is the single most important metric for a production-stage AI agent."
