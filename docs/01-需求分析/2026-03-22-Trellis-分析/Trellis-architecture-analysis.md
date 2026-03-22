# Trellis 架构分析

## 1. 一句话定义

`Trellis` 不是单纯的 skill 仓库，也不只是一个初始化 CLI。  
它更准确的定位是一个 **项目内常驻的 AI 工作流框架**：

> `Trellis = init/update CLI + .trellis 状态层 + hook 注入机制 + 多平台配置分发 + worktree 并行协作`

它的核心目标不是“给 agent 多装几个命令”，而是把一套可升级、可共享、可持续注入的工程规范层直接植入项目。

---

## 2. 定义层：它要解决什么问题

从 README 的自我表述看，Trellis 想解决 5 个典型问题：

- AI 会话上下文不稳定，规则容易丢
- 规范写在单一大文件里，加载粗糙且不分层
- 多 agent 并行工作时缺乏隔离和协调
- 项目经验无法沉淀成团队可复用资产
- agent 配置更新后，项目内旧模板和旧脚本难以升级

因此它给出的方案不是“多写一点 prompt”，而是：

1. 用 `trellis init` 把框架装进项目
2. 用 `.trellis/spec/` 存结构化规范
3. 用 `.claude/`、`.cursor/`、`.gemini/`、`.agents/skills/` 等承接不同宿主
4. 用 hook/session-start 自动注入上下文
5. 用 `.trellis/workspace/`、`.trellis/tasks/`、`.trellis/worktree.yaml` 管理状态和并行协作
6. 用 `trellis update` 把项目内框架持续升级

---

## 3. 架构层：核心组成部件

### 3.1 顶层结构

这个项目可以拆成 6 个核心层：

| 模块 | 作用 |
| --- | --- |
| `src/cli` / `src/commands` | `trellis` CLI 入口，只暴露 `init` 与 `update` 两个主命令 |
| `src/configurators` | 多平台分发层，把 Trellis 模板写到 Claude / Cursor / Codex / Kiro / Gemini 等宿主目录 |
| `src/templates` | 所有平台模板、markdown 模板、workflow 模板与 `.trellis` 内置资产 |
| `.trellis/` | 项目内运行时状态层，包含 spec、tasks、workspace、scripts、workflow |
| `src/migrations` | 版本迁移与升级清单 |
| `test/` | 用于验证初始化、升级、模板一致性、平台注册表和迁移逻辑 |

### 3.2 CLI 只是入口，不是全部

`src/cli/index.ts` 很克制，只有两个主命令：

- `trellis init`
- `trellis update`

表面看像轻量工具，但真正的重量不在 CLI 本身，而在它初始化后落到项目里的整套文件系统框架。

换句话说：

- CLI 负责“装载”和“升级”
- 真正持续工作的，是项目里的 `.trellis/`、平台命令目录和 hooks

### 3.3 `.trellis/` 是真正核心

README 和仓库自带的 `.trellis/` 样板已经说明，Trellis 的中心不是 `src/`，而是初始化后落地的 `.trellis/`：

| 路径 | 作用 |
| --- | --- |
| `.trellis/workflow.md` | 总 workflow 说明，作为会话入口规则 |
| `.trellis/spec/` | 分层规范库，按 frontend/backend/guides/unit-test 拆开 |
| `.trellis/tasks/` | 任务状态、PRD、check/debug/implement 记录 |
| `.trellis/workspace/{name}/` | 个人工作日志与会话记忆 |
| `.trellis/scripts/` | Python 脚本运行层 |
| `.trellis/worktree.yaml` | 多 agent / 多 worktree 编排配置 |
| `.trellis/.version` | 项目内 Trellis 版本标记 |
| `.trellis/.template-hashes.json` | 模板哈希，用于 upgrade 冲突检测 |

所以 Trellis 和 `spec-kit` 最大的区别之一是：

- `spec-kit` 更像把 workflow 装进去
- `Trellis` 更像把一个持续运转的“项目内治理层”装进去

### 3.4 多平台 configurator 是分发控制面

`src/configurators/index.ts` 把平台支持做成单一注册表，统一管理：

- 平台 ID
- 配置目录
- CLI flag
- 是否带 Python hooks
- 对应 configure 函数
- 更新时的模板收集逻辑

当前支持的平台包括：

- Claude Code
- Cursor
- OpenCode
- iFlow
- Codex
- Kilo
- Kiro
- Gemini
- Antigravity

这层的意义不是“多几个导出”，而是把 Trellis 变成一个跨宿主框架，而不是绑定单一 agent 的工具包。

### 3.5 hook 注入是它的关键方法论

README 里明确强调 Trellis 与普通 skills 的差异是：

> 不是 optional use，而是 enforced injection。

从结构上看，这套 enforced injection 依赖几部分：

- `.claude/hooks/session-start.py`
- `.claude/hooks/inject-subagent-context.py`
- `.claude/settings.json`
- `.trellis/workflow.md`
- `.trellis/spec/*`

也就是说，Trellis 的核心不是“让 agent 想起来用规范”，而是“在会话开始和子 agent 调用时把规范主动塞进去”。

### 3.6 Python 脚本层承担确定性控制

`.trellis/scripts/` 不是边角料，而是项目内控制平面的一部分。  
它包含：

- `init_developer.py`
- `get_developer.py`
- `get_context.py`
- `add_session.py`
- `create_bootstrap.py`
- `task.py`
- `multi_agent/start.py`
- `multi_agent/status.py`
- `multi_agent/cleanup.py`
- `multi_agent/plan.py`
- `multi_agent/create_pr.py`

以及一组 `common/*` 公共模块：

- developer
- git_context
- paths
- phase
- registry
- task_queue
- task_utils
- worktree
- cli_adapter

这些脚本的存在说明 Trellis 并不是纯 prompt 编排，而是把：

- 任务状态
- 开发者身份
- git / worktree 上下文
- 并行 agent 协作
- 会话归档

都落到了确定性脚本层。

---

## 4. 运行层：它如何真正工作

### 4.1 初始化主链路

`trellis init` 的主链路大致是：

```text
detect project type
-> create .trellis workflow structure
-> copy scripts/templates/spec docs
-> configure selected AI platforms
-> create AGENTS.md and developer identity
-> initialize template hashes and version
-> optionally create bootstrap task
```

这里最关键的不是复制文件，而是一次性把以下几层一起建好：

- 规范层
- 任务层
- 工作日志层
- 并行 worktree 层
- agent 命令 / hooks / skills 层

### 4.2 初始化并不只生成空模板

`src/commands/init.ts` 中可以看到，Trellis 会根据项目类型生成 bootstrap task，并显式要求使用者先把：

- backend guidelines
- frontend guidelines
- real code examples
- anti-patterns

补齐到 `.trellis/spec/`。

这说明 Trellis 的核心假设是：

> AI 规范库不是靠产品团队预装完就结束，而是项目初始化后要被真实代码库持续校准。

### 4.3 update 是一等能力

`src/commands/update.ts` 说明 Trellis 不是一次性 scaffold，而是带生命周期管理的框架。

它会做这些事：

- 检查 `.trellis/.version`
- 比对当前 CLI 版本与项目版本
- 收集所有托管模板文件
- 使用 `.template-hashes.json` 判断文件是否被用户修改
- 对未修改模板自动更新
- 对已修改模板提示 overwrite / skip / create-new
- 生成 backup
- 应用 rename / delete migration

因此 Trellis 的升级不是“重新 init 一次”，而是一个受控的模板迁移流程。

### 4.4 migration manifest 让升级具备可演进性

`src/migrations/index.ts` 使用独立 JSON manifest 管理版本迁移，支持：

- rename
- delete
- changelog 聚合
- breaking 版本标记
- migration guide
- AI instructions

这说明 Trellis 已经把“项目内框架资产如何升级”当作正式工程问题处理，而不是文档里一句“重新安装”。

### 4.5 模板市场能力是外部扩展入口

`src/utils/template-fetcher.ts` 支持从官方 docs 仓库的 marketplace 拉取远程模板，并按策略安装：

- `skip`
- `overwrite`
- `append`

当前主要面向 `spec` 类模板。  
这意味着 Trellis 不只是内置模板集合，也在尝试形成一个外部模板市场生态。

---

## 5. 自动化边界：哪些流程在系统内闭环

### 5.1 能闭环的部分

Trellis 在以下几类流程上已经接近闭环：

| 流程 | 是否闭环 | 说明 |
| --- | --- | --- |
| 项目初始化 | 是 | `trellis init` + configurators + `.trellis` 模板完整落地 |
| 平台配置注入 | 是 | 各平台目录与模板由 configurator 统一下发 |
| 项目内框架升级 | 是 | `trellis update` + hash + migration + backup |
| 会话上下文注入 | 基本是 | 借助 hooks 和 `.trellis/spec` 自动完成 |
| 多 agent 并行 | 基本是 | 借助 `worktree.yaml` 和 `multi_agent/*.py` |
| 工作日志归档 | 基本是 | `.trellis/workspace/` + `add_session.py` |

### 5.2 不完全闭环的部分

仍然有几部分依赖宿主和人工协作：

- spec 内容本身需要团队持续维护
- hooks 能否生效依赖宿主平台能力
- 多 agent 流程依赖 git/worktree 环境
- 远程模板市场依赖网络和官方 docs 仓库
- 质量检查和实际编码仍由宿主 agent 执行

所以 Trellis 不是“全自动软件工厂”，但已经明显比单纯 skill 仓库更接近“项目内工作流框架”。

---

## 6. 校验层：测试重点说明了什么

`test/` 目录的覆盖重点很能说明产品心智：

- `init.integration.test.ts`
- `update.integration.test.ts`
- `configurators/*`
- `templates/*`
- `registry-invariants.test.ts`
- `migrations/index.test.ts`
- `template-hash.test.ts`
- `template-fetcher.test.ts`
- `regression.test.ts`

这些测试主要在验证 4 件事：

1. 初始化后文件树是否正确
2. 各平台模板是否被正确写入
3. 注册表和平台配置是否一致
4. 升级、哈希检测、备份、迁移是否可预测

所以它的测试重点不是“某条 prompt 回答得好不好”，而是：

> “Trellis 作为一个可安装、可升级、跨平台的项目内框架，是否稳定可维护”

---

## 7. 与前面几个项目的定位差异

把它放进你前面分析过的那组项目里，位置会比较清楚：

| 项目 | 本质定位 |
| --- | --- |
| `skills` | workflow 素材库 |
| `superpowers` | 会话级纪律与流程框架 |
| `cc-sdd` | spec-driven 安装器 |
| `planning-with-files` | 持久化工作记忆 skill |
| `everything-claude-code` | 多层 agent harness 系统 |
| `OpenSpec` | artifact-guided workflow engine |
| `spec-kit` | spec-driven bootstrap toolkit |
| `Trellis` | 项目内常驻 AI 工作流框架 |

和 `spec-kit` 对比尤其明显：

- `spec-kit` 的重心在 `specify init`
- `Trellis` 的重心在初始化之后继续存在的 `.trellis/`

和 `superpowers` 对比：

- `superpowers` 更偏会话纪律注入
- `Trellis` 更偏项目目录中的制度化运行层

和 `everything-claude-code` 对比：

- `everything-claude-code` 更像大型 harness 平台
- `Trellis` 更聚焦“把一套持续注入的工程规范框架放到项目里”

---

## 8. 最终判断

### 8.1 核心结论

`Trellis` 最准确的理解方式不是“Claude 的一套命令模板”，而是：

> 一个把规范库、会话注入、任务状态、个人工作记忆、并行 worktree 协作和多平台适配统一放进项目目录中的 AI 工程框架。

### 8.2 最短公式

```text
Trellis = CLI installer/updater
        + project-local .trellis state system
        + hook-based context injection
        + multi-platform agent adapter
        + task/workspace/worktree coordination
```

### 8.3 一句话总结

```text
Trellis 不是给 AI “加几个技能”，而是把一套可升级、可注入、可协作的工程治理层嵌入项目。
```

