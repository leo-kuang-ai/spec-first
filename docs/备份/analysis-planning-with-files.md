# Planning with Files 项目分析

> **分析日期**: 2026-02-06
> **分析对象**: planning-with-files v2.14.0
> **分析目的**: 理解其设计理念，为 Spec-First 项目提供参考

---

## 📊 项目定位

### 核心概念

**受 Manus AI 启发**（被 Meta 20 亿美元收购），通过持久化 Markdown 文件作为 AI Agent 的"外挂大脑"。

### 核心隐喻

```
Context Window = RAM（易失、有限）
Filesystem = Disk（持久、无限）

→ 任何重要信息都写入磁盘
```

---

## 🎯 解决的问题

| 问题 | 表现 | 解决方案 |
|------|------|----------|
| **易失记忆** | TodoWrite 在上下文重置后消失 | 持久化 Markdown 文件 |
| **目标漂移** | 50+ 工具调用后忘记原始目标 | PreToolUse Hook 自动重读计划 |
| **隐藏错误** | 失败不被追踪，重复犯错 | 强制错误日志，永不重复失败 |
| **上下文膨胀** | 所有信息塞进上下文窗口 | 大内容存入文件系统 |

---

## 📦 3-文件模式

| 文件 | 作用 | 更新时机 |
|------|------|----------|
| `task_plan.md` | 阶段跟踪、进度管理、决策记录 | 每个阶段完成后 |
| `findings.md` | 研究发现、技术决策、参考资料 | 任何发现时立即更新 |
| `progress.md` | 会话日志、操作记录、测试结果 | 贯穿整个会话 |

### 文件关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                         task_plan.md                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Goal: 目标定义                    │   │
│  │  Phases: 3-7 阶段（带状态跟踪）               │   │
│  │  Decisions: 重大决策记录                          │   │
│  │  Errors: 遇到的问题                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│              PreToolUse hook 每次操作前读取                        │
└─────────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    │                    ▼
┌─────────────────┐            │          ┌─────────────────┐
│   findings.md   │            │          │   progress.md   │
│                 │            │          │                 │
│  研究发现       │◄───────────┘          │  会话日志        │
│  技术决策       │                       │  操作记录        │
│  参考资料       │                       │  测试结果        │
└─────────────────┘                       └─────────────────┘
```

---

## 🛠️ 技术实现

### 1. Hooks 机制（自动干预）

| Hook | 触发时机 | 行为 |
|------|---------|------|
| `PreToolUse` | Write/Edit/Bash 前 | 自动读取 `task_plan.md` 前 30 行刷新目标 |
| `PostToolUse` | Write/Edit 后 | 提醒更新阶段状态 |
| `Stop` | 停止前 | 运行脚本验证所有阶段是否完成 |

### 2. 跨平台支持

支持 13+ IDE/Agent 平台：
- Claude Code（原生 Plugin + Skill）
- Cursor、Gemini CLI、OpenClaw、Kiro
- Continue、Kilocode、OpenCode、Codex
- AdaL、Pi Agent、FactoryAI、Antigravity、CodeBuddy

### 3. 会话恢复机制（v2.2.0+）

通过 `session-catchup.py` 实现：
1. 检测上次会话未同步的上下文
2. 从 `~/.claude/projects/` 恢复丢失的工作进度
3. 生成 catchup 报告同步计划文件

---

## 📌 关键规则

### 1. 先建计划（非协商）
复杂任务必须先创建 `task_plan.md`，不可跳过。

### 2. 2-Action 规则（最重要）
> 每执行 2 次 view/browser/search 操作后，**必须**立即保存发现到文件。

原因：多模态内容（图片、浏览器结果）不会持久化在上下文中。

### 3. 决策前重读
重大决策前读取计划文件，刷新注意力窗口。

### 4. 记录所有错误
即使是快速修复的错误也要记录，避免重复失败。

### 5. 永不重复失败
```
if action_failed:
    next_action != same_action
```

### 3-Strike 错误协议
```
ATTEMPT 1: 诊断并修复
ATTEMPT 2: 尝试不同方法
ATTEMPT 3: 更广泛地重新思考
AFTER 3: 升级给用户
```

---

## 💡 设计亮点

### 1. Manus 原则落地
将 Manus AI 的"context engineering"理念转化为可执行的工具链。

### 2. 低成本持久化
用简单的 Markdown 文件替代复杂的状态管理系统。

### 3. 自动化 Hook
无需手动记忆，脚本自动在关键检查点提醒。

### 4. 跨平台兼容性
一套技能适配 13+ IDE/Agent 平台，通过模板和脚本抽象差异。

### 5. 渐进式增强
- v1.0: 核心 3-文件模式
- v2.0: Hooks + 模板 + 脚本
- v2.2: 会话恢复
- v2.11: `/plan` 简化命令

---

## 🔍 与 Spec-First 的关联

### 共同理念

| 维度 | Planning with Files | Spec-First |
|------|---------------------|------------|
| 核心原则 | 文件系统即记忆 | 规范即契约 |
| 真理源 | Markdown 文件 | Spec 规范文档 |
| 可追溯性 | 决策 → 文件 | 需求 → 规范 → 代码 |
| 自动化校验 | Hooks + 脚本 | 规范校验工具 |

### 可借鉴点

1. **3-文件模式** → Spec-First 可采用类似结构
   - `spec.md`（规范定义）
   - `findings.md`（研究发现）
   - `progress.md`（实现进度）

2. **Hooks 机制** → 规范校验可集成到 Git Hooks
   - Pre-commit: 规范格式检查
   - Pre-push: 规范完整性验证

3. **2-Action 规则** → 规范设计时及时记录决策
   - 避免规范设计中的"遗忘"

4. **错误日志** → 规范演进的影响分析
   - 记录规范变更历史

---

## ⚠️ 反模式警告

| ❌ 不该做 | ✅ 应该做 |
|----------|----------|
| 用 TodoWrite 做持久化 | 创建 task_plan.md 文件 |
| 一次性声明目标后遗忘 | 决策前重读计划 |
| 隐藏错误静默重试 | 记录错误到计划文件 |
| 把所有信息塞进上下文 | 大内容存入文件 |
| 直接开始执行 | 先创建计划文件 |
| 重复失败的操作 | 记录尝试，调整方法 |

---

## 📚 文件模板概要

### task_plan.md 结构
```markdown
## Goal（一句话目标）
## Current Phase（当前阶段）
## Phases（3-7 个阶段，带状态）
## Key Questions（需要回答的问题）
## Decisions Made（决策表：决策 | 理由）
## Errors Encountered（错误表：错误 | 尝试 | 解决方案）
```

### findings.md 结构
```markdown
## Requirements（需求列表）
## Research Findings（研究发现）
## Technical Decisions（技术决策表）
## Issues Encountered（问题及解决）
## Resources（资源链接）
## Visual/Browser Findings（多模态发现）
```

### progress.md 结构
```markdown
## Session [DATE]
### Phase N: [Title]（每个阶段的详细日志）
## Test Results（测试结果表）
## Error Log（带时间戳的错误日志）
## 5-Question Reboot Check（5 问题重启测试）
```

---

## 🎯 对 Spec-First 的建议

### 1. 规范文件结构借鉴
考虑采用类似的 3-文件模式进行规范设计：
- `spec.md` - 规范定义
- `research.md` - 研究发现
- `implementation.md` - 实现进度

### 2. Hooks 集成
将规范校验集成到开发工作流：
- Pre-commit: 规范格式检查
- Pre-push: 规范与代码一致性验证

### 3. 决策追溯
规范文档中记录"为什么这样设计"，避免未来遗忘设计理由。

### 4. 错误/变更日志
规范变更时记录影响分析，类似"错误日志"的思路。

---

## 📖 参考资源

- **项目仓库**: https://github.com/OthmanAdi/planning-with-files
- **Manus 博客**: Context Engineering for AI Agents
- **安装方式**: `/plugin marketplace add OthmanAdi/planning-with-files`
- **使用命令**: `/plan` 或 `/planning-with-files:start`

---

**分析人**: Leo (况雨平)
**文档版本**: v1.0
**更新日期**: 2026-02-06
