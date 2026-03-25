# Claude Code 记忆系统与工作流分析

> **分析对象**: `/Users/kuang/xiaobu/everything-claude-code`
> **关注点**: `plan -> tdd -> review -> verify` 工作流，以及跨会话记忆系统设计
> **用途**: 记录对 Claude Code Harness 的工作流理解、记忆分层和实现方式

---

## 1. 结论

`everything-claude-code` 不是单纯的命令集合，而是一套面向 Claude Code 的 **Harness Engineering 系统**。  
它把开发过程拆成明确阶段，并通过 hook、session 文件、别名、学习型 skill 和 SQLite 状态层，把“本次会话做了什么”与“未来会话该继承什么”区分开来。

从 Claude Code 使用场景看，这个系统的目标不是让模型“更会说”，而是让模型：

- 能持续接着上次的工作做
- 能按固定流程推进任务
- 能把经验沉淀成可复用技能
- 能在压缩上下文后仍保留关键状态

---

## 2. Claude Code 工作流：`plan -> tdd -> review -> verify`

这条链路是仓库里最重要的执行路径之一。

### 2.1 `plan`

`/plan` 的职责是先把需求讲清楚，再开始做。

它会：

- 复述需求
- 识别风险
- 拆分阶段
- 等待用户确认后再继续

关键点是：**plan 不直接实现**，它先把问题空间收敛。

对应文件：

- [`commands/plan.md`](/Users/kuang/xiaobu/everything-claude-code/commands/plan.md)

### 2.2 `tdd`

`/tdd` 把实现阶段约束成测试先行。

它的固定顺序是：

1. 定义接口
2. 写失败测试
3. 写最小实现
4. 运行测试直到通过
5. 重构
6. 检查覆盖率

这一步的作用是把“实现正确性”从口头承诺变成可验证结果。

对应文件：

- [`commands/tdd.md`](/Users/kuang/xiaobu/everything-claude-code/commands/tdd.md)

### 2.3 `review`

这里对应的是 `/code-review`。

它关注的不是功能是否“能跑”，而是：

- 安全问题
- 质量问题
- 错误处理
- 测试缺失
- `console.log`
- TODO/FIXME

如果发现 CRITICAL 或 HIGH 级问题，流程会被拦截。

对应文件：

- [`commands/code-review.md`](/Users/kuang/xiaobu/everything-claude-code/commands/code-review.md)

### 2.4 `verify`

`/verify` 是最终验收闸门。

它按固定顺序跑：

1. build
2. typecheck
3. lint
4. test
5. console.log audit
6. git status

这一步的作用是把“是否可以交付”变成统一的机器输出。

对应文件：

- [`commands/verify.md`](/Users/kuang/xiaobu/everything-claude-code/commands/verify.md)

### 2.5 串联关系

整体可以理解为：

```text
需求进入
  -> plan: 先规划、控风险、等确认
  -> tdd: 先写测试，再实现
  -> review: 审查安全与质量
  -> verify: 跑全量验收
  -> 交付
```

对 Claude Code 来说，这是一条“先收敛、再实现、再审查、再验收”的工程化路径。

---

## 3. 记忆系统设计

这个仓库的记忆系统是分层设计，不是单一数据源。

### 3.1 第一层：会话级短期记忆

这层负责“这次会话刚刚做了什么”。

实现方式：

- `SessionStart` hook 在新会话开始时加载最近 session 摘要
- `SessionEnd` hook 在会话结束时把 transcript 解析成摘要并写回 session 文件
- `PreCompact` hook 在上下文压缩前保存状态，避免关键内容丢失

对应文件：

- [`scripts/hooks/session-start.js`](/Users/kuang/xiaobu/everything-claude-code/scripts/hooks/session-start.js)
- [`scripts/hooks/session-end.js`](/Users/kuang/xiaobu/everything-claude-code/scripts/hooks/session-end.js)
- [`scripts/hooks/pre-compact.js`](/Users/kuang/xiaobu/everything-claude-code/scripts/hooks/pre-compact.js)

存储位置：

- `~/.claude/sessions/<date>-<shortId>-session.tmp`

写入内容包括：

- 用户消息摘要
- 使用过的工具
- 修改过的文件
- 项目、分支、worktree 信息

### 3.2 第二层：会话别名记忆

这层负责“快速定位某个会话”。

实现方式：

- 把 session 映射成 alias
- 允许列表、加载、创建、删除、重命名

对应文件：

- [`scripts/lib/session-aliases.js`](/Users/kuang/xiaobu/everything-claude-code/scripts/lib/session-aliases.js)
- [`commands/sessions.md`](/Users/kuang/xiaobu/everything-claude-code/commands/sessions.md)

存储位置：

- `~/.claude/session-aliases.json`

价值：

- 让“回到上次会话”变成一个稳定操作
- 不需要人工翻日志找 session

### 3.3 第三层：学习型记忆

这层负责“把一次会话中的可复用经验提炼成 skill”。

实现方式：

- `evaluate-session` 在 Stop hook 中分析 transcript
- 长会话才会触发提取
- `learn.md` 提供手动抽取 pattern 的入口

对应文件：

- [`scripts/hooks/evaluate-session.js`](/Users/kuang/xiaobu/everything-claude-code/scripts/hooks/evaluate-session.js)
- [`commands/learn.md`](/Users/kuang/xiaobu/everything-claude-code/commands/learn.md)

存储位置：

- `~/.claude/skills/learned/`

特点：

- 不是保存原始对话，而是保存可复用模式
- 目标是把“这次解决问题的方法”沉淀为后续可调用能力

### 3.4 第四层：结构化状态记忆

这层负责“可查询、可审计、可组合的系统状态”。

实现方式：

- SQLite state store
- 通过 migration 和 query API 管理状态

对应文件：

- [`scripts/lib/state-store/index.js`](/Users/kuang/xiaobu/everything-claude-code/scripts/lib/state-store/index.js)
- [`scripts/lib/state-store/queries.js`](/Users/kuang/xiaobu/everything-claude-code/scripts/lib/state-store/queries.js)

存储位置：

- `~/.claude/ecc/state.db`

能承载的对象：

- session
- skill run
- decision
- install state
- governance event

这层是机器可查的“结构化真相源”，和 markdown session 记忆互补。

---

## 4. 记忆数据流

可以把数据流理解成四级递进：

```text
Claude 会话
  -> transcript / hook 输入
  -> session 文件（摘要）
  -> alias / learned skill
  -> SQLite state store
```

### 4.1 会话结束时

`session-end` 会：

- 解析 transcript
- 提取 user messages
- 提取 tools
- 提取 modified files
- 更新 session summary

### 4.2 新会话开始时

`session-start` 会：

- 读取最近的 session 文件
- 把有效摘要注入到上下文
- 报告 learned skills
- 报告 session aliases

### 4.3 压缩前

`pre-compact` 会：

- 记录 compaction 事件
- 给当前 session 加一个压缩标记

这确保上下文压缩不会把关键状态完全吃掉。

---

## 5. 设计特点

### 5.1 不是单层记忆

它不是“把聊天记录存起来”这么简单，而是把不同粒度的信息分别存放：

- 会话摘要
- 会话入口
- 可复用模式
- 结构化状态

### 5.2 记忆写入发生在生命周期节点

记忆不是人工整理的，而是在 hook 生命周期里自动产生：

- 开始时加载
- 结束时总结
- 压缩前保存
- 长会话后学习

### 5.3 目标是跨会话连续性

这个设计的核心不是“回看历史”，而是“让下一次会话继续上一轮的工作”。

### 5.4 兼顾人读和机读

- markdown session 文件适合人读
- alias 适合快速操作
- learned skills 适合复用
- SQLite state store 适合查询和编排

---

## 6. 对 Claude Code 使用场景的意义

对于 Claude Code 用户，这套设计的意义是：

- 让模型不必每次从零开始
- 让长任务可以按阶段推进
- 让上下文压缩后还能恢复主线
- 让经验可以沉淀为可复用能力
- 让审查、验证、学习都变成流程的一部分

换句话说，这不是一个“更会回答问题”的系统，而是一个“更适合做工程”的系统。

---

## 7. Agent / Skill 组织方式

这个仓库不是把所有能力都塞进同一层，而是分成三层来组织：

- `commands/` 负责入口和路由
- `agents/` 负责专职执行角色
- `skills/` 负责按需加载的能力包

### 7.1 `agents/`

`agents/` 目录里的每个文件通常是一个独立角色定义，特点是：

- 一个文件对应一个角色
- 元数据里会写 `name`、`description`、`tools`、`model`
- 侧重“谁来做”

例如：

- `planner`
- `tdd-guide`
- `code-reviewer`
- `security-reviewer`
- `go-reviewer`
- `python-reviewer`

对应文件：

- [`agents/planner.md`](/Users/kuang/xiaobu/everything-claude-code/agents/planner.md)
- [`agents/tdd-guide.md`](/Users/kuang/xiaobu/everything-claude-code/agents/tdd-guide.md)
- [`agents/code-reviewer.md`](/Users/kuang/xiaobu/everything-claude-code/agents/code-reviewer.md)

### 7.2 `skills/`

`skills/` 目录里的内容更像能力包或工作流模板，特点是：

- 一个 skill 通常是一个目录
- 核心文件是 `SKILL.md`
- 可以带 `references/`、`scripts/`、`hooks/` 等配套资源
- 侧重“怎么做”

例如：

- `tdd-workflow`
- `verification-loop`
- `agent-harness-construction`
- `continuous-learning-v2`
- `security-review`

对应文件：

- [`skills/tdd-workflow/SKILL.md`](/Users/kuang/xiaobu/everything-claude-code/skills/tdd-workflow/SKILL.md)
- [`skills/verification-loop/SKILL.md`](/Users/kuang/xiaobu/everything-claude-code/skills/verification-loop/SKILL.md)
- [`skills/agent-harness-construction/SKILL.md`](/Users/kuang/xiaobu/everything-claude-code/skills/agent-harness-construction/SKILL.md)

### 7.3 入口到执行体的映射

常见链路是：

```text
User / Slash Command
  -> command
  -> agent（可选）
  -> skill（可选）
  -> result
```

在这个仓库里，最典型的映射是：

| 用户入口 | 主要执行体 | skill 关系 | 说明 |
|---|---|---|---|
| `/plan` | `planner` agent | 不直接依赖 skill | 先出实施计划、评估风险 |
| `/tdd` | `tdd-guide` agent | 关联 `tdd-workflow` | 测试先行实现 |
| `/code-review` | `code-reviewer` agent | 以 agent 规则为主 | 通用代码审查 |
| `/verify` | verification flow | 关联 `verification-loop` | 构建、类型、lint、测试、扫描 |

### 7.4 这种组织方式的好处

- `agent` 和 `skill` 可以解耦
- 通用流程可以复用
- 领域知识可以单独扩展
- 入口命令可以稳定不变

换句话说：

- `command` 是启动按钮
- `agent` 是执行角色
- `skill` 是方法论和规范库

### 7.5 skill 和 agent 的调用方式

这两个概念在使用上不一样：

- `skill` 更像可单独调用的能力包，适合直接启用或被其他流程引用
- `agent` 更像专职执行角色，通常由 `command` 自动拉起

在这个仓库里，典型关系是：

- `/plan` -> `planner` agent
- `/tdd` -> `tdd-guide` agent + `tdd-workflow` skill
- `/code-review` -> `code-reviewer` agent
- `/verify` -> `verification-loop` skill 化流程

也就是说：

- 用户通常先选 **command**
- command 再决定是否调用 **agent**
- agent / command 再按需加载 **skill**

| 对象 | 用户感知 | 组织方式 | 典型作用 |
|---|---|---|---|
| `command` | 入口命令 | 扁平的 `.md` 文件 | 负责路由和触发 |
| `agent` | 专职执行者 | 扁平的角色文件 | 负责实际执行某类任务 |
| `skill` | 可复用能力包 | 目录 + `SKILL.md` + 资源 | 负责工作流、知识、模板 |

---

## 8. 结论

`everything-claude-code` 的工作流和记忆系统是配套设计的：

- `plan -> tdd -> review -> verify` 负责控制开发过程
- session / alias / learned skill / state store 负责跨会话连续性

两者合在一起，才构成它的 Harness Engineering 核心。
