# everything-claude-code 项目架构篇

文档日期：2026-03-22
分析对象：`/Users/kuang/xiaobu/everything-claude-code`
版本基线：`package.json` 中版本 `1.9.0`
分支基线：`main`

## 1. 项目一句话定义

`everything-claude-code` 不是单纯的 Claude Code 配置仓库，而是一套“面向 AI agent harness 的性能优化与运行治理系统”。

它由五部分组成：

1. 大规模 skills / commands / agents / rules 内容库。
2. 一套可选择安装的 manifest-driven installer。
3. 一套 hook runtime，用于会话启动、执行前后、Stop 和 SessionEnd 阶段的自动治理。
4. 一套状态与会话基础设施，包括 SQLite state store 和 session adapters。
5. 一套持续学习与 skill evolution 机制，用于把会话模式沉淀成可复用资产。

可以把它理解为：

```text
            everything-claude-code
                        |
   +--------------------+--------------------+-------------------+
   |                                         |                   |
内容资产层                               安装与运行治理层        状态与演进层
   |                                         |                   |
skills / commands / rules / agents           selective install + hooks   sessions + state + evolution
   |                                         |                   |
给 agent 提供能力                             控制何时加载与如何运行     让系统可观察、可恢复、可优化
```

## 2. 顶层目录结构

```text
everything-claude-code/
├── README.md                               项目定位、安装、版本演进、总入口
├── package.json                            NPM 包定义与 CLI 入口
├── skills/                                 100+ skills
├── commands/                               50+ commands
├── agents/                                 各类 reviewer / resolver / specialist prompts
├── rules/                                  按语言与通用能力拆分的 rules
├── hooks/                                  Claude Code hook 配置
├── manifests/                              selective install 声明
├── schemas/                                安装状态与 state store schema
├── scripts/                                安装器、doctor、repair、session、state 等脚本
├── tests/                                  hooks / install / state / scripts / integration 测试
├── .claude / .cursor / .codex / .opencode  各平台适配产物
└── docs/                                   架构、设计、安全与多语言文档
```

核心判断：

- `skills/commands/rules/agents` 是内容资产层。
- `manifests/` 与 `scripts/install-*` 是分发层。
- `hooks/` 与 `scripts/hooks/*` 是运行治理层。
- `schemas/`、`scripts/lib/state-store/*`、`scripts/lib/session-adapters/*` 是状态基础设施层。
- 这已经不是“配置合集”，而是一个多层次 agent harness 系统。

### 2.1 核心能力 / 子系统功能表

| 子系统 / 命令 | 类别 | 主要功能 | 典型输入 | 典型输出 |
| --- | --- | --- | --- | --- |
| `skills/` | 内容资产 | 提供领域能力、工作流、研究和实现模式 | 用户任务、代码库上下文 | 被 agent 触发的 skill 行为 |
| `commands/` | 内容资产 | 提供显式命令入口，如计划、审计、测试、构建、文档、orchestrate | 用户命令调用 | 命令驱动的工作流 |
| `agents/` | 内容资产 | 提供专门 reviewer / resolver / researcher prompt | 代码差异、构建失败、语言子系统问题 | 更聚焦的子代理结果 |
| `rules/` | 内容资产 | 提供跨语言和语言专属 coding/testing/security guidance | 项目语言、技术栈 | 持续性的编码约束 |
| `ecc install` | 安装分发 | 把选中的 ECC 模块安装到支持的 target | target、profile、modules、components | 安装后的 harness 文件 |
| `ecc plan` | 安装分发 | 预览 selective install 计划 | profile / modules / target | 计划摘要或 JSON |
| `ecc doctor` / `repair` | 运行维护 | 检查安装漂移并修复 | target、当前目录 | drift report / repaired files |
| `ecc status` | 状态查询 | 查询 SQLite state store 的汇总状态 | 当前项目或全局状态 | 状态摘要 |
| `ecc sessions` / `session-inspect` | 会话系统 | 查看会话、打开 canonical snapshots、桥接不同会话来源 | session target、adapter type | 标准化 session snapshot |
| `hooks/hooks.json` | 运行治理 | 定义 SessionStart、PreToolUse、PostToolUse、Stop、SessionEnd hooks | Claude Code 生命周期事件 | 自动提醒、质量门禁、上下文加载 |
| `session-start.js` | 运行治理 | 会话开始时注入最近 session、package manager、project type 等信息 | 新会话 | 注入上下文和诊断信息 |
| `state-store` | 状态基础设施 | 结构化保存 sessions、skill runs、decisions、install state、governance events | 各 hook / 脚本事件 | SQLite / schema-validated state |
| `session-adapters` | 状态基础设施 | 统一访问 Claude history、dmux/tmux 等不同 session 源 | structured target | canonical session snapshot |
| `skill-evolution` | 演进系统 | 跟踪 skill provenance、versioning、health、dashboard | session observations、skill metadata | 自优化所需指标与记录 |

## 3. 核心设计思想

### 3.1 不是“配置包”，而是“harness performance system”

README 最新定义已经非常明确：这是一个 **performance optimization system for AI agent harnesses**。

它优化的对象不是单个 agent prompt，而是：

- agent 在不同 harness 中的行为质量
- token / cost / memory persistence
- hook 执行稳定性
- 技能与规则的可维护性
- 安装与运行过程的可观察性

### 3.2 把“装什么”从硬编码脚本升级为 manifest

新版本最大的结构变化是 selective install。

`install-apply.js` 与 `install-plan.js` 的角色分离非常清晰：

- `install-plan.js`：只负责解析、列出、预览和解释安装计划
- `install-apply.js`：负责真正执行安装

而“安装计划”本身由：

- `manifests/install-profiles.json`
- `manifests/install-components.json`
- `manifests/install-modules.json`

共同定义。

这意味着它已经从“脚本里写 if/else 复制文件”进化成：

```text
profile / component / module
  -> 解析为 plan
  -> 再执行 plan
```

### 3.3 hooks 是运行治理系统，不是零散提醒

`hooks/hooks.json` 已经形成一个完整生命周期治理面：

- `SessionStart`
- `PreToolUse`
- `PreCompact`
- `PostToolUse`
- `PostToolUseFailure`
- `Stop`
- `SessionEnd`

而且 hook 覆盖内容包括：

- git push 提醒
- tmux/server 运行治理
- 文档文件警告
- compact 建议
- MCP health check
- governance capture
- quality gate
- auto format / typecheck / console warn
- session end persistence
- cost tracking
- session evaluation

这表明 ECC 的 hooks 已经不是“几个好用小脚本”，而是一个 agent runtime control plane。

### 3.4 状态要结构化，不只靠文本日志

最新代码新增 state store schema，实体包括：

- `session`
- `skillRun`
- `skillVersion`
- `decision`
- `installState`
- `governanceEvent`

这说明作者已经不满足于：

- 临时日志
- 分散在文件里的 hook 输出

而是想把 agent harness 的关键行为转成结构化、可校验、可查询的数据层。

### 3.5 会话是可适配对象，而不是只认一种格式

`session-adapters/registry.js` 支持：

- `claude-history`
- `dmux-tmux`

并且有 structured target normalization。

这意味着 ECC 试图解决的问题不是“只在 Claude Code 本地跑得好”，而是：

- 把不同来源的 session 统一成 canonical snapshot
- 让后续观察、恢复、学习、状态记录都基于同一抽象层工作

### 3.6 技能演进被视为系统能力

`skill-evolution/` 模块包含：

- provenance
- versioning
- tracker
- health
- dashboard

这表明 ECC 不是只“发布 skill”，而是想让 skill 本身成为可演进、可健康检查、可追踪来源的对象。

## 4. 项目运行主链路

### 4.1 安装链路

现在的安装链路大致是：

```text
用户运行 ecc install / ecc-install / install.sh
  -> parse request
  -> normalize install request
  -> create install plan from manifests
  -> apply plan to target
  -> write install-state
```

`install.sh` 只是 legacy shell wrapper，真正逻辑已经转到 Node：

```text
install.sh -> node scripts/install-apply.js
```

这说明安装系统已经完成从 shell-first 到 node-first 的迁移。

### 4.2 Selective install 链路

安装流程抽象出来大致是：

```text
profile / modules / with / without / target
  -> load manifests
  -> normalize request
  -> resolve install plan
  -> target adapter 生成 scaffold 计划
  -> file operations
  -> install-state 记录
```

`install-profiles.json` 里的 profile（如 `core`、`developer`、`security`、`research`、`full`）只是用户可理解入口。
真正安装粒度在 module 层。

### 4.3 会话启动链路

`SessionStart` 通过 hook 调用 `session-start.js`，它会：

- 确保 sessions / learned skills 目录存在
- 读取最近 7 天的 session summary
- 注入上一轮 session 内容
- 列出 learned skills
- 检查 session aliases
- 检测 package manager
- 检测项目语言和框架

这意味着新会话不是空白启动，而是：

```text
恢复上轮上下文
  + 当前项目类型探测
  + 包管理器环境探测
```

### 4.4 运行时治理链路

典型一次工具调用前后可能经历：

```text
PreToolUse
  -> 安全提醒 / tmux / compact / observe / governance / mcp health
  -> 实际工具执行
  -> PostToolUse
      -> quality gate / format / typecheck / observe / governance
  -> Stop / SessionEnd
      -> session persist / evaluate / cost tracking
```

这已经是明显的“治理流水线”，而不是单一 hook。

### 4.5 CLI 运维链路

`scripts/ecc.js` 把 CLI 抽象成多命令入口：

- `install`
- `plan`
- `list-installed`
- `doctor`
- `repair`
- `status`
- `sessions`
- `session-inspect`
- `uninstall`

因此 ECC 不只是“安装一次后结束”，而是支持长期运维：

- 装什么
- 装了什么
- 漂不漂
- 会话状态如何
- 怎么修

## 5. 内容资产系统

### 5.1 skills 是广域能力库

当前仓库有 100+ skill，覆盖：

- 通用工程
- 多语言编码规范
- 研究与内容生产
- 业务领域能力
- 安全与验证
- agentic patterns

这使它不只是“工程框架”，而是“可组合能力市场”。

### 5.2 commands 是显式入口层

`commands/` 的价值不只是把 skill 暴露为 slash command，而是形成一层显式操作界面。

例如：

- `context-budget`
- `docs`
- `devfleet`
- `harness-audit`
- `rust-build`
- `rust-test`
- `skill-health`

说明命令不仅覆盖开发，也覆盖治理和自检。

### 5.3 rules 是语言与组织规范层

`rules/` 现在已经按语言和 common 层分拆：

- `common`
- `typescript`
- `python`
- `golang`
- `java`
- `kotlin`
- `php`
- `perl`
- `rust`
- `swift`
- `cpp`
- `csharp`

这代表 ECC 已经把“编码规范”从附属文档提升为正式可分发资产。

### 5.4 agents 是专业角色资产

`agents/` 下新增不少 reviewer/build-resolver：

- `rust-reviewer`
- `java-build-resolver`
- `cpp-reviewer`
- `docs-lookup`
- `typescript-reviewer`

这说明它并不只靠主 agent，而是在推动“专业角色化 subagents”。

## 6. 状态、会话与持续学习

### 6.1 state store 是新基础设施

`state-store/schema.js` 与相关 schema 说明：

- 所有关键状态都被 schema 校验
- 目标是保证记录结构稳定
- 便于后续 CLI 查询、dashboard 展示和迁移

这是整个仓库从“文件集合”向“系统产品”跨越的重要标志。

### 6.2 session adapters 解决多来源会话统一

`session-adapters` 的设计关键点：

- structured target normalization
- adapter registry
- canOpen / open / getSnapshot

说明 session 不再被当成某一种工具专属产物，而是抽象成统一接口。

### 6.3 持续学习已经模块化

旧 ECC 就有 continuous learning，但最新代码把它进一步分拆成：

- continuous-learning-v2 hooks
- skill evolution modules
- health / dashboard / tracker

说明“从会话里提炼知识”已经不只是技巧，而是产品级功能。

## 7. 测试与可验证性

### 7.1 测试范围非常广

`package.json` 的 `test` 会先跑：

- validate agents
- validate commands
- validate rules
- validate skills
- validate hooks
- validate install manifests
- validate no personal paths
- catalog count
- 再跑 `tests/run-all.js`

这说明：

- 内容资产有结构校验
- 安装声明有校验
- hook 有回归
- 脚本和状态基础设施也有回归

### 7.2 测试层次体现产品化程度

`tests/` 下已经分成：

- `hooks`
- `lib`
- `scripts`
- `integration`
- `ci`

这代表项目测试的对象不是单一代码库行为，而是整个系统的多个横切层。

## 8. 项目最关键的工程取舍

### 8.1 选择“模块化 selective install”而不是全量复制

这让项目从“巨型配置仓库”变成“可裁剪 harness 平台”。

用户不再必须装全部，而是可以按：

- profile
- module
- component
- target

选择性安装。

### 8.2 选择“hook runtime control plane”而不是零散脚本

通过 `run-with-flags.js`、hook profiles、disabled hooks 等机制，ECC 把 hooks 统一到一层可控制的 runtime。

### 8.3 选择“结构化状态”而不是散日志

state store、schemas、queries 说明作者要解决的是：

- 长期运行
- 会话恢复
- 技能健康
- 治理审计

这些都要求结构化存储。

### 8.4 选择“内容资产 + 运行治理 + 演进系统”三位一体

很多项目只做其中一个：

- 只做 prompt 内容
- 或只做 hooks
- 或只做安装器

ECC 试图把三者结合起来，所以复杂度更高，但系统性也更强。

## 9. 如何理解整个项目

如果用一句更工程化的话总结：

```text
everything-claude-code = 大规模 agent 资产库
                       + manifest 驱动的 selective installer
                       + 生命周期 hook 治理系统
                       + state store / session adapter 基础设施
                       + 持续学习与 skill evolution 系统
```

如果用组织结构来理解：

```text
用户 / harness
 |
 +--> 安装层: ecc install / plan / doctor / repair / uninstall
 |
 +--> 内容层: skills / commands / rules / agents
 |
 +--> 运行层: hooks + runtime flags + governance
 |
 +--> 状态层: install-state + sessions + decisions + governance events
 |
 +--> 演进层: continuous learning + skill evolution + health dashboard
```

## 10. 结论

这个仓库的真正价值不在“有很多 skill”，而在它把 agent harness 当成一个需要安装、治理、观察、恢复和持续优化的系统来做：

- 有大规模内容资产。
- 有 selective install 分发机制。
- 有 hook-based runtime control plane。
- 有结构化 state store。
- 有 session adapter 抽象。
- 有持续学习和 skill evolution。
- 有覆盖内容、安装、hooks、state 的测试体系。

所以从本质上说：

- `skills` 更像 workflow 素材库。
- `superpowers` 更像 coding agent 流程框架。
- `cc-sdd` 更像 spec-driven workflow 安装器。
- `planning-with-files` 更像持久化工作记忆 skill。
- `everything-claude-code` 则更像一个面向多 harness 的 agent performance platform。
