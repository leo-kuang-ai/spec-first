[English](./README.md) | [简体中文](./README.zh-CN.md)

<div align="center">

<img src="./docs/assets/spec_first_workflow_animation_v6_lower_flow.gif" alt="Spec-First" width="100%" />

<h1>Spec-First</h1>

<p><strong>面向 Claude Code 与 Codex 的 spec-first workflow CLI，把需求、代码图证据、评审和经验沉淀转化为明确的 LLM 决策输入。</strong></p>

<p>安装一次，就能在 <strong>Claude Code</strong> 与 <strong>Codex</strong> 中运行同一套受治理交付闭环。</p>

<p>
  <a href="#快速开始"><strong>快速开始</strong></a>
  <span>&nbsp;•&nbsp;</span>
  <a href="#核心工作流"><strong>工作流</strong></a>
  <span>&nbsp;•&nbsp;</span>
  <a href="#cli-命令"><strong>CLI</strong></a>
  <span>&nbsp;•&nbsp;</span>
  <a href="#支持语言"><strong>语言</strong></a>
  <span>&nbsp;•&nbsp;</span>
  <a href="./docs/05-用户手册/README.md"><strong>用户手册 (zh)</strong></a>
  <span>&nbsp;•&nbsp;</span>
  <a href="https://www.npmjs.com/package/spec-first"><strong>npm</strong></a>
</p>

<p>
  <a href="https://www.npmjs.com/package/spec-first"><img src="https://img.shields.io/npm/v/spec-first?style=flat-square&color=2563eb" alt="npm version"></a>
  <a href="https://npmtrends.com/spec-first"><img src="https://img.shields.io/npm/dm/spec-first?style=flat-square&color=cb3837&label=downloads" alt="npm downloads"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/sunrain520/spec-first?style=flat-square&color=16a34a" alt="license"></a>
  <a href="https://github.com/sunrain520/spec-first/stargazers"><img src="https://img.shields.io/github/stars/sunrain520/spec-first?style=flat-square&color=eab308" alt="GitHub stars"></a>
  <a href="https://github.com/sunrain520/spec-first/issues"><img src="https://img.shields.io/github/issues/sunrain520/spec-first?style=flat-square&color=e67e22" alt="GitHub issues"></a>
  <a href="https://github.com/sunrain520/spec-first/pulls"><img src="https://img.shields.io/github/issues-pr/sunrain520/spec-first?style=flat-square&color=9b59b6" alt="GitHub PRs"></a>
</p>

<p>
  <sub>
    <a href="https://deepwiki.com/sunrain520/spec-first"><img src="https://img.shields.io/badge/Ask-DeepWiki-blue?style=flat-square" alt="Ask DeepWiki"></a>
    &nbsp;
    <a href="https://chatgpt.com/?q=Explain+the+project+sunrain520/spec-first+on+GitHub"><img src="https://img.shields.io/badge/Ask-ChatGPT-74aa9c?style=flat-square&logo=openai&logoColor=white" alt="Ask ChatGPT"></a>
  </sub>
</p>

</div>

## 为什么是 Spec-First

多数 AI 编码失败，并不是因为模型太弱，而是因为 LLM 拿到的决策输入已经退化。Spec-First 让脚本负责确定性流程，让 LLM 负责语义决策：

| 问题 | spec-first 怎么处理 | 约束方式 |
|------|---------------------|----------|
| LLM 从空白代码库上下文开始推断 | `graph-bootstrap` 构建 CRG 图索引，并暴露 query-first 证据（`locate`、`path`、`explain`、`impact`、`review-context`、lifecycle hooks） | CRG readiness + runtime workflow contract |
| 需求从未被显式化 | Brainstorm 阶段产出 requirements artifact，供 Plan 阶段消费 | `SKILL.md` contract |
| 计划与实现逐渐漂移 | Plan artifact 是 Work 阶段的一等输入；Review Stage 2b 会把 **Requirements Trace** 与 diff 对照检查 | `SKILL.md` contract |
| 评审缺少结构 | `spec-code-review` 使用 17 个 reviewer persona 外加 2 个辅助 agent，并按 `safe_auto / gated_auto / manual / advisory` 路由 | `SKILL.md` contract |
| 已解决问题无法复用 | Compound 把结构化 learnings 写入 `docs/solutions/`，并带 YAML frontmatter 供后续检索 | `SKILL.md` contract |

**适合：**

- 想从 prompt-driven coding 升级到受治理 AI engineering workflow 的团队
- 同时使用 Claude Code 与 Codex，希望跨宿主复用同一套交付体系的开发者
- 需要显式 spec、结构化 review、以及可复用 post-task learnings 的项目

**不适合：**

- 没有使用 Claude Code 或 Codex 的团队
- 期待零配置、全自动代码生成的场景
- 交付链路过短，不值得承担多阶段 workflow 开销的团队

## 设计哲学

> **轻 contract · 明确边界 · 让 LLM 决策。**

Spec-First 基于一个核心判断：AI 编码质量受限于 LLM 决策输入的质量，而不是 orchestration 的重量。仓库治理（见 `CLAUDE.md` / `AGENTS.md`）明确禁止：

- 用多状态迁移去替代 LLM 判断的硬编码状态机
- 把互不相关的信号硬塞进一个 orchestration object 的过度设计 gate
- 通过增加耦合来扩张 contract，而不是通过提高清晰度来扩张

同时明确偏好：

- 把 `provenance`、`freshness`、`confidence`、`fallback_reason`、`verification_gaps` 作为独立、可组合的输入事实暴露出来
- 先提升输入质量，只有在证据充分时才增加自动化
- 保持 control-plane 的边界清晰：repo profile、diff recommendation、verifier dispatch、gate state、workflow prose、telemetry 各自只回答一个问题，不越界替别人回答

这个 README 的其余设计，都是这套立场的结果。

## 工作原理

Spec-First 改善的是 **LLM 拿到的决策输入**，而不是用状态机替代 LLM 的判断。

### 两个互补部分

**graph-bootstrap：CRG 证据地基**

```text
代码库 → CRG 图索引 → graph-index-status + code-navigation + repo-topology
      → locate / path / explain / impact / review-context
      → workflow hooks 提供 advisory evidence
```

`graph-bootstrap` 在 planning、work、review 前准备确定性的图事实。它不替 LLM 判断该改哪里；它只提供低噪音证据和明确 limitations。

workspace root 会先走 preflight 层。如果 Claude 或 Codex 打开在包含多个独立 git repo 的父目录，`crg workspace scan/status/context` 会在父目录写入 `.spec-first/workspace/workspace-index.json`、`workspace-status.json` 与 advisory context。LLM/user 选择 child repo 边界后，再进入 repo-local `crg build` 或 hooks。父目录不会生成混合 `graph.db`，`workspace build` 也只会构建一个显式指定的 child repo。

**主工作流：交付闭环**

```text
Ideate → Brainstorm → Plan → Work → Review → Compound
```

它解决的是“一个需求如何被 AI 工程化地端到端交付”。每个阶段都有显式的输入产物、输出产物和 stage-gate contract。

### 证据与知识入口

| 入口 | 适用场景 | 产物 | 稳定性 |
|------|----------|------|--------|
| `/spec:graph-bootstrap` · `$spec-graph-bootstrap` | 你需要为 plan / work / review 准备 CRG graph-backed query evidence | `.spec-first/graph/graph.db`、`graph-index-status.json`、`code-navigation.json`、`repo-topology.json`、`graph-operations.jsonl`；workspace root 使用 `.spec-first/workspace/*` | **主要 CRG 入口** |
| `/spec:standards` · `$spec-standards` | 你需要先基于 CRG 生成项目规范草案，再经人工确认沉淀到 `docs/specs/**`，并按任务解析/检查/刷新/查看/校验规范资产 | `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/**` proposal 产物；确认 promote 后写入 `docs/specs/**` + `_index/**`；`spec-first specs resolve` 可写 `.spec-first/workflows/<consumer>/<task-id>/` 任务上下文；`spec-first specs refresh --changed` 写入 `.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/**` proposal request；`check/refresh` 写入 `docs/specs/reports/**`；list/validate 只读 | **preview-first 规范路径** |
| `/spec:compound` · `$spec-compound` | 你完成或重新发现了可复用解决方案，希望后续 workflow 能检索到 | `docs/solutions/**/*.md` 结构化 learning 文档 | **补充型知识路径** |

这些入口是 `spec-first init` 安装出来的宿主 workflow entrypoint，不是根级 `spec-first` CLI 子命令。

graph-bootstrap 会在可用时读取 host readiness ledger。如果你跳过了 MCP setup，或者宿主没有重启，它会给出明确提示；当 CRG 不可用时，后续 workflow 会显式退回 targeted direct repo reads，而不是读取过期摘要。

### 仓库形态

| 形态 | 支持方式 |
|------|----------|
| 父目录 workspace 下多个独立 git repo | 父目录只保存 `workspace-index.json` / `workspace-status.json` / advisory context；每个 child repo 保持自己的 CRG graph。跨 child 任务拆成显式 repo-local runs。 |
| 单个 git repo 下多个 module | 一个 repo-local CRG graph，加 advisory `repo-topology.json` module units；当前 topology pass 支持 Maven reactor modules 检测。 |
| 单个 git repo 单项目 | 沿用现有 repo-local CRG build/hook 流程。 |

### 当前升级重点

当前版本线把旧 Stage-0 / generated-summary 路径替换为更小的 CRG-first control plane：

| 升级点 | 变化 |
|--------|------|
| CRG query-first runtime | `locate`、`path`、`explain`、`workflow-context`、lifecycle `hook` 以及更新的 graph-quality / retrieval-eval 输出，直接向 workflow 提供图证据，不再要求 workflow 消费可能过期的生成摘要。 |
| Workspace topology | 父目录 workspace 只产出 discovery/status/context artifacts；repo-local `graph.db` 保持落在显式 child repo 下。 |
| Task-pack handoff | `spec-write-tasks` 作为 standalone skill，可从已收口 plan 派生 `docs/tasks/*-tasks.md`；`spec-first tasks hash|validate` 与 `spec-work` 共用同一套 validator，在执行前校验 identity、source hash、freshness 与 structure。 |
| 入口治理 | `using-spec-first` 在双宿主都是 standalone meta skill。它把 substantial work 路由到公开 `$spec-*` / `/spec:*` workflow，但自身不是 workflow command。 |
| Runtime delivery | 受管 bundle 现在把 session-history、PR 跟进、PR 描述与浏览器证据捕获这些 helper 都放进源码资产里，让最近的 CE 同步以受管 skill 的形式落地，而不是散落成临时 prompt。 |

### CRG 决策信号

Graph 与 hook 输出包含机器可读信号，下游 `SKILL.md` contract 把它们当作 advisory evidence：

| 字段 | 含义 |
|------|------|
| `graph_status.state` | `ready`、`degraded`、`unavailable` 或 `missing` |
| `capabilities` | 当前 graph 支持哪些 CRG query |
| `freshness` | graph freshness 是否检查，以及观察结果 |
| `limitations[]` | 证据不完整或退化的原因 |
| `decision_input_kind` | `observed`、`inferred` 或 `ambiguous` 证据标签 |
| `fallback.mode` | graph evidence 不可用时为 `direct_repo_reads` |

下游 skill 无论是否有 graph evidence 都可以继续执行。信号的作用是帮助 LLM 调整置信度，并选择下一次读取或查询。

### 约束模型

| 层级 | 覆盖内容 | 类型 |
|------|----------|------|
| CLI（`doctor` / `init` / `clean` / `crg <subcommand>`） | 资产同步、状态追踪、graph readiness、CRG query surface | **Code-hard**，由 shell exit code 强制 |
| CRG lifecycle hooks | 输出 graph status、recommended queries、diff blast radius 与 direct-read fallback | **Runtime signal**，由代码发出，供 LLM 消费 |
| Workflow stages（`SKILL.md`） | 阶段 contract、artifact 命名、review 类别、requirements trace | **SKILL contract**，由 LLM 遵循 |
| Context signals（`provenance` / `confidence` / `fallback_reason`） | 嵌在 artifact 中的元数据 | **SKILL contract**，由 LLM 消费 |

## 支持语言

由 15 个 vendored / pinned 的 `tree-sitter` parser 提供支持。默认全部安装，不需要手动 opt-in。

| 语言 | Parser | 说明 |
|------|--------|------|
| C | `tree-sitter-c` | |
| C++ | `tree-sitter-cpp` | |
| C# | `tree-sitter-c-sharp` | |
| Go | `tree-sitter-go` | |
| Java | `tree-sitter-java` | |
| JavaScript | `tree-sitter-javascript` | CommonJS `require()` 会解析成 `imports_from` edges |
| Kotlin | `tree-sitter-kotlin` | |
| Objective-C | `tree-sitter-objc`（vendored fork） | `.m` / `.mm` / 启发式 `.h` 路由；提取 `@interface/@implementation/@protocol` |
| PHP | `tree-sitter-php` | |
| Python | `tree-sitter-python` | |
| Ruby | `tree-sitter-ruby` | |
| Rust | `tree-sitter-rust` | |
| Scala | `tree-sitter-scala` | |
| Swift | `tree-sitter-swift`（vendored fork） | 移除了上游 `tree-sitter-cli` 的 install-time 依赖 |
| TypeScript | `tree-sitter-typescript` | 覆盖 `.ts` / `.tsx` / `.d.ts` |

iOS 仓库会自动检测（`Podfile.lock` / `.xcodeproj`），并自动应用 Pod exclude path。

## 你会得到什么

| 能力 | 解决的问题 |
|------|------------|
| **CLI 控制面**（`doctor` / `init` / `clean` / `crg <subcommand>`） | 提供可重复安装、健康检查、清理、graph readiness 和 query evidence；所有受管资产都有可追踪来源 |
| **CRG 图引擎**（`spec-first crg *`） | **Code Review Graph**：一个嵌入式 Node.js runtime，基于 SQLite + FTS5，支持 AST → symbols → resolved edges → PageRank flows → community detection → surprising-connections → god-nodes → review-context |
| **graph-bootstrap 查询引擎** | 让 LLM 获得 graph-backed 候选修改面和 blast-radius 证据，而不是直接面对裸代码库 |
| **完整工作流层** | Ideate → Brainstorm → Plan → 可选 Task Pack → Work → Review → Compound，全阶段都有显式 artifact contract |
| **结构化 Review stage** | 17 个 reviewer persona 外加 2 个辅助 agent 产出按 `safe_auto / gated_auto / manual / advisory` 路由的 findings，而不是一次性 review 扫描 |
| **Compound / knowledge capture** | 把已解决问题写入 `docs/solutions/`，供后续 workflow 检索复用 |
| **Task-pack 工具链** (`spec-first tasks`) | 对 source plan 做 canonical hash，并在 `spec-work` 消费派生 task pack 前完成校验 |
| **Session / PR 辅助技能** | session 历史检索、PR 描述 / 反馈处理和浏览器证据都留在受管 skill 里，而不是临时 prompt |
| **双平台支持** | 一套方法论同时覆盖 Claude Code（`/spec:*`）与 Codex（`$spec-*`）。Claude 使用 `SessionStart` hook + bare-agent rewrite；Codex 使用 `.agents/skills/` discovery + 显式 `.codex/agents/...` path rewrite |
| **能力层资产** | 仓库内置源码资产共 `41` 个 skills、`51` 个 agents、`0` 个 agent support files。运行时交付会按双宿主治理过滤：当前版本在 Claude 侧安装 `20` 个 commands + `2` 个 standalone skills + `2` 个 agent-facing internal skills，在 Codex 侧安装 `20` 个 workflow skills + `2` 个 standalone skills + `2` 个 agent-facing internal skills；两侧都会安装 `51` 个 agents |
| **运行时治理** | 受管资产记录在 `state.json` 中，可安全同步、刷新、恢复与清理 |

## 核心工作流

<p align="center">
  <img alt="Spec-First overview" src="./docs/assets/svg/spec-first-overview.svg">
</p>

### 主要阶段

| 阶段 | Claude Code | Codex | 输出产物 | 约束方式 |
|------|-------------|-------|----------|----------|
| 宿主准备 | `/spec:mcp-setup` → restart | `$spec-mcp-setup` → restart | 宿主专属 readiness ledger：`~/.claude/spec-first/host-setup.json` 或 `~/.codex/spec-first/host-setup.json` | **Code-hard**（bootstrap gate 会检查它） |
| CRG 图引导 | `/spec:graph-bootstrap` | `$spec-graph-bootstrap` | `graph.db` + graph status/navigation/operations artifacts | 宿主就绪 + CRG runtime workflow contract |
| 规范草案 | `/spec:standards` | `$spec-standards` | `.spec-first/workflows/spec-standards/<target-slug>/<run-id>/**`；显式 promote 后写入 `docs/specs/**`；`spec-first specs resolve` 可写 `.spec-first/workflows/<consumer>/<task-id>/`；`spec-first specs refresh --changed` 写入 `.spec-first/workflows/spec-standards-refresh/<target-slug>/<run-id>/**`；`check/refresh` 写入辅助报告 | **SKILL.md** + `spec-first specs` helper contract |
| Ideate | `/spec:ideate` | `$spec-ideate` | `docs/ideation/*.md` | **SKILL.md** contract |
| Brainstorm | `/spec:brainstorm` | `$spec-brainstorm` | `docs/brainstorms/*.md` | **SKILL.md** contract |
| Plan | `/spec:plan` | `$spec-plan` | `docs/plans/*.md` | **SKILL.md** contract |
| Work | `/spec:work` | `$spec-work` | code + tests | **SKILL.md** contract |
| Review | `/spec:code-review` | `$spec-code-review` | 结构化 review report | **SKILL.md** contract（17 个 reviewer persona + 2 个辅助 agent） |
| Doc Review | `/spec:doc-review` | `$spec-doc-review` | requirements / plan review report | **SKILL.md** contract |
| Compound | `/spec:compound` | `$spec-compound` | `docs/solutions/**/*.md` | **SKILL.md** contract |

### 辅助阶段

| 阶段 | Claude Code | Codex | 用途 |
|------|-------------|-------|------|
| Task compilation | `spec-write-tasks` standalone skill | `spec-write-tasks` standalone skill | 大 plan 进入 Work 前，可选编译成派生 `docs/tasks/*-tasks.md` 任务包 |
| Debug | `/spec:debug` | `$spec-debug` | 复现并诊断已有 bug 或 failure |
| Update | `/spec:update` | `$spec-update` | 检查 spec-first 版本并刷新宿主运行时资产 |
| Sessions | `/spec:sessions` | `$spec-sessions` | 搜索并总结过往 coding agent session |

这些 `/spec:*` 与 `$spec-*` 是生成出来的运行时 workflow 入口，不是根级 `spec-first` CLI 子命令。根 CLI 命令面见下方 [CLI 命令](#cli-命令)。

## 快速开始

### 前置条件

- Node.js `>=20`
- **Git 仓库**：`spec-first init` 会读取 `git config user.name`，`graph-bootstrap` 依赖 `git ls-files`，因此不支持非 Git 目录
- 至少安装 **Claude Code** 或 **Codex** 之一
- 磁盘空间：可选 CRG 原生模块安装成功时，大约需要 60–120 MB 的 `node_modules`

### 1. 安装

```bash
npm install -g spec-first
spec-first -v
```

> **`postinstall` 说明：** 安装器会执行 `bin/postinstall.js`，打印安装确认卡片，并在可选 CRG 原生模块存在时裁剪掉除当前平台之外的 `tree-sitter` 预编译产物。如果当前平台缺少预构建包或本机没有编译工具链，npm 仍可完成安装；CRG 缺失的原生模块会通过 `spec-first doctor` 报告，核心 `init` / `doctor` / `clean` 流程保持可用。

### 2. 检查环境

```bash
spec-first doctor
spec-first doctor --claude   # 只检查 Claude
spec-first doctor --codex    # 只检查 Codex
```

如果 `doctor` 报告 `legacy managed state`，请重新运行 `init`。这是唯一受支持的升级路径，它会先执行一次受管 hard reset，再重建运行时。
`doctor --json` 还会把 workflow verification evidence 作为结构化事实暴露出来：schema 有效性、freshness、`fallback_reason`，以及 `evidence_age_summary`（`oldest_*` / `newest_*` + `max_age_ms`），避免下游 workflow 自己猜证据是否过期。

### 3. 初始化项目

```bash
spec-first init --claude
# 或
spec-first init --codex
```

如果想显式设置开发者身份：

```bash
spec-first init --claude -u <name> --lang <zh|en>
spec-first init --codex -u <name> --lang <zh|en>
```

**身份解析顺序：**

1. `-u` flag 值（如果传了）
2. `~/.spec-first/.developer`（全局身份）
3. `git config user.name` 兜底

**语言解析顺序：**

1. `--lang` flag 值（如果传了）
2. 项目里已有的 `.developer` profile
3. 默认 `zh`

#### `init` 会写入什么

`init` **不是**只读操作。它会通过写入以下内容，把 `spec-first` 挂载进你的项目：

| 目标位置 | 写入内容 | `clean` 可移除？ |
|----------|----------|------------------|
| `CLAUDE.md` / `AGENTS.md` | `<!-- spec-first:lang:* -->` 语言策略块（幂等 marker block） | ❌ 需要手动删除，`clean` 不会移除这个语言策略块 |
| `CLAUDE.md` / `AGENTS.md` | `using-spec-first` 指令 bootstrap block | ✅ `clean` 会移除 |
| `CLAUDE.md` / `AGENTS.md` | `<!-- spec-first:coding-guidelines:* -->` 编码执行准则块 | ✅ `clean` 会移除 |
| `.claude/settings.json` | 受管 `SessionStart` matcher 条目（仅 Claude） | ✅ `clean` 会移除 |
| `.claude/hooks/session-start` | 受管 `SessionStart` hook 脚本（仅 Claude） | ✅ `clean` 会移除 |
| `.claude/commands/spec/**` · `.claude/skills/**` · `.claude/agents/**`（或 Codex 对应目录） | 受管运行时资产 | ✅ `clean` 会移除 |
| `.claude/spec-first/.developer` / `.codex/spec-first/.developer` | 宿主专属项目开发者 profile | ✅ `clean` 会移除 |
| `.claude/spec-first/state.json` / `.codex/spec-first/state.json` | 宿主专属受管资产追踪状态 | ✅ `clean` 会移除 |
| `CHANGELOG.md` | 仅在缺失时自动 bootstrap，写入受管格式头与初始 init 记录 | ❌ 创建后归用户所有 |

#### 如何回滚

```bash
spec-first clean --claude   # 或 --codex
```

`init` 不会覆盖已有的 `CLAUDE.md` / `AGENTS.md`。首次安装时，spec-first 会把自己受管的 instruction blocks 追加到现有用户内容后面；重新 `init` 时，只会替换它自己通过 marker 包裹的受管 block。

`clean` 会移除上表中“`clean` 可移除”列标记为可删的所有内容，然后打印本次删除了哪个平台的受管资产。受管范围之外的自定义资产不会受影响。语言策略块仍需手动删除；你可以在 `CLAUDE.md` / `AGENTS.md` 中搜索 `<!-- spec-first:lang:`。
`init --dry-run` 与 `clean --dry-run` 现在都会预览来自同一份 operation plan 的 file-level 变更面，因此 preview/apply 漂移被压缩到可测试、可回归的边界内。
当前运行时交付会按宿主治理分流：Claude 会写入 `20` 个 command、`4` 个 skill directories 和 `51` 个 agent；Codex 不生成 command 目录，而是写入 `24` 个 skill directories，并安装同样的 `51` 个 agent。

#### 示例输出

```bash
$ spec-first init --claude

🪝 Installed Claude SessionStart matcher in .claude/settings.json
📦 Generated 20 command file(s) in .claude/commands/spec
🧩 Generated 4 skill directory(ies) in .claude/skills
🤖 Generated 51 agent file(s) in .claude/agents
🪪 Wrote project developer profile:
  📍 path: .claude/spec-first/.developer
  👤 name: yourname
  🈯 lang: zh
  ⏱ initialized_at: <ISO-8601 timestamp>
  🔖 version: <installed spec-first version>

🔁 Restart Claude Code after generation so it can pick up the new /spec:* commands.
```

> 数量和版本号会以你运行时实际安装的版本为准。如果仓库里还没有 `CHANGELOG.md`，`init` 还会额外打印 `📝 Bootstrapped CHANGELOG.md`。无论 `--lang` 设置为何，安装日志本身都会以英文输出；`--lang` 影响的是后续 Claude / Codex 回应所遵循的语言策略，而不是安装器自己的输出语言。Codex 的输出按设计不同：它不会生成 `.claude/commands/spec`，而是重启后通过 `$spec-*` skill 入口工作。

### 4. 首次运行

| 步骤 | Claude Code | Codex |
|------|-------------|-------|
| 安装 MCP 工具 | `/spec:mcp-setup` | `$spec-mcp-setup` |
| 重启宿主 | 重启 Claude Code | 重启 Codex |
| 构建图证据 | `/spec:graph-bootstrap` | `$spec-graph-bootstrap` |
| 需要时沉淀可复用经验 | `/spec:compound` | `$spec-compound` |
| 启动工作流 | `/spec:ideate` → `/spec:brainstorm` → `/spec:plan` → `/spec:work` → `/spec:code-review` → `/spec:compound` | `$spec-ideate` → … → `$spec-compound` |

浏览器自动化能力仍然通过外部 `agent-browser` CLI 支持。它现在由 Claude 的 `/spec:mcp-setup` 或 Codex 的 `$spec-mcp-setup` 安装为 upstream/global helper；已有 `agent-browser` 命令不变。如果旧运行时里仍有本地 `agent-browser` skill 副本，请在升级后重新运行 `spec-first init --claude` 或 `spec-first init --codex`，让 managed obsolete assets 被清理。

`graph-bootstrap` 在启动时会检查 host readiness 与 CRG 可用性。graph evidence 不可用时，后续 workflow 会显式退回 direct-read fallback。

### Task Pack 命令（`spec-first tasks <subcommand>`）

围绕 `spec-write-tasks` handoff 的确定性工具。

```bash
spec-first tasks --help
spec-first tasks hash <plan-path>
spec-first tasks validate <task-pack-path> --repo=<path>
```

| 子命令 | 用途 |
|--------|------|
| `hash` | 对 plan 文件计算 canonical source-plan hash，并在哈希前移除 frontmatter |
| `validate` | 在 Work 消费派生 task pack 之前，校验其 source identity、freshness 与 structure |

`validate` 只检查 identity、freshness 和 structure，不判断 task 切分质量或业务范围。

## 架构

```text
┌──────────────────────────────────────────────────────────────┐
│  入口层 — spec-first CLI                                     │
│  doctor / init / clean / crg <subcommand>                    │
│  约束：code-hard（资产同步、状态、graph readiness、            │
│       CRG SQLite pipeline）                                  │
├──────────────────────────────────────────────────────────────┤
│  上下文层 — graph-bootstrap / CRG 模块                        │
│  AST 图索引 → status/navigation/operations artifacts          │
│  → locate / path / explain / impact / review-context         │
│  → lifecycle hooks with direct-read fallback                 │
│  约束：code-hard facts + SKILL.md decision boundary          │
├──────────────────────────────────────────────────────────────┤
│  工作流层 — skills                                            │
│  Ideate / Brainstorm / Plan / Work / Review / Compound       │
│  + Debug / Update / Sessions 辅助阶段                         │
│  阶段 contract、artifact 约定、review 分类                    │
│  约束：SKILL.md contract（由 LLM 遵循）                        │
├──────────────────────────────────────────────────────────────┤
│  能力层 — agents（6 类）                                      │
│  review/（17 reviewer personas + auxiliary agents）          │
│  spec-doc-review/（requirements / plan persona review）      │
│  research/（session / doc / Feishu / web context readers）   │
│  design/（UI / design-lens agents）                          │
│  workflow/（bug-reproduction / lint / pr-comment-resolver）  │
│  docs/（documentation / onboarding support）                 │
│  约束：convention（由 LLM 调度）                              │
└──────────────────────────────────────────────────────────────┘
```

`.claude/`、`.codex/`、`.agents/` 下的运行时资产都是**生成输出**，不是可编辑源码。`skills/`、`agents/`、`templates/`、`docs/` 才是 source of truth。

## CLI 命令

### 受管资产命令

| 命令 | 用途 | 说明 |
|------|------|------|
| `spec-first doctor` | 环境检查 | 校验平台状态、plugin manifest 与受管资产。`--claude` / `--codex` 可限定单平台。需要重新 `init` 时会报告 `legacy managed state`；`--json` 还会输出 evidence schema/freshness 与 `evidence_age_summary`。 |
| `spec-first init` | 初始化运行时 | 通过受管 operation plan 同步 commands、skills、agents、runtime hooks 与开发者元数据。它也是唯一受支持的 legacy 升级入口，会执行一次受管 hard reset。见上方 [init 会写入什么](#init-会写入什么)。 |
| `spec-first clean` | 删除受管资产 | 通过与 `--dry-run` 共用的 operation-plan 边界移除指定平台当前的 spec-first 受管资产；不会迁移 legacy state，也不会删除语言策略 marker block。 |

### CRG 图命令（`spec-first crg <subcommand>`）

这是一个基于 SQLite + FTS5 的嵌入式 Code Review Graph runtime。

```bash
spec-first crg --help
spec-first crg build --repo .
spec-first crg workspace context --root . --task "change api"
spec-first crg workspace build --root . --repo <child-slug-or-path>
spec-first crg hook before-work --repo . --plan <plan.md>
spec-first crg review-context --repo . --since <ref>
```

| 子命令 | 用途 |
|--------|------|
| `build` | 从仓库构建或增量刷新 graph DB |
| `stats` | 报告 node / edge / community 数量以及 unresolved edge |
| `context` | 导出某个 symbol 或文件的 context bundle |
| `query` | 提供 8 类结构化查询：`callers_of / callees_of / importers_of / importees_of / dependents_of / dependencies_of / tests_for / similar_to` |
| `impact` | 对文件或 symbol 做 impact-of-change 分析 |
| `locate` | 按任务 query 定位候选文件 / symbol |
| `path` | 解释两个节点之间的图路径 |
| `explain` | 用邻居与证据解释单个 node 或 file |
| `workflow-context` | 输出按阶段裁剪的 graph status 与 recommended queries |
| `hook` | 输出 plan、work、after-work、review lifecycle envelope |
| `workspace` | 对 parent workspace 执行 `scan`、`status`、`context` 或 selected-child `build`；不会自动选择语义目标 repo，也不支持 `--all` 批量 build |
| `large-functions` | 查找超过阈值的函数 |
| `search` | 对 symbols / files 做 FTS5 全文搜索 |
| `flows` | 执行 PageRank + BFS flow 检测 |
| `flow` / `affected-flows` | 查看单个 flow，或查看受 diff 影响的 flow |
| `communities` / `community` | 三阶段 community detection，以及单个 community 的查看 |
| `architecture` | 生成高层架构摘要 |
| `surprising-connections` | 检测跨 community / peripheral-to-hub 的意外连接 |
| `god-nodes` | 检测高 fan-in 的 hub |
| `detect-changes` | 做基于 SHA-256 的增量变更检测 |
| `review-context` | 从 diff 组合生成 review context bundle |
| `postprocess` | 在 build 或增量刷新后重算 communities、flows、graph analysis 与 FTS |

大多数 repo-local 子命令支持 `--repo=<path>`。`workspace` 使用 `--root=<workspace>`，可通过 `--task=<text>` / `--changed-file=<path>` 给 context scoring 提供信号，只有 selected-child build 使用 `--repo=<child-slug-or-path>`。完整列表以当前安装版本 `spec-first crg --help` 的输出为准。

## 文档

当前完整文档仍以中文为主。英文读者在英文翻译补齐之前，可以把 [DeepWiki](https://deepwiki.com/sunrain520/spec-first) 或 [Ask ChatGPT](https://chatgpt.com/?q=Explain+the+project+sunrain520/spec-first+on+GitHub) 作为补充入口。

| 文档 | 语言 | 说明 |
|------|------|------|
| [英文 README](./README.md) | en | 英文入口文档 |
| [中文 README](./README.zh-CN.md) | zh | 完整中文版 README |
| [用户手册](./docs/05-用户手册/README.md) | zh | 用户手册总目录 |
| [快速开始](./docs/05-用户手册/01-快速开始.md) | zh | 首次配置与启动指南 |
| [核心概念](./docs/05-用户手册/02-核心概念.md) | zh | 架构与术语解释 |
| [完整示例](./docs/05-用户手册/03-完整示例.md) | zh | 端到端交付 walkthrough |
| [常见问题](./docs/05-用户手册/04-常见问题.md) | zh | 排障与常见问题 |
| [最佳实践](./docs/05-用户手册/05-最佳实践.md) | zh | 团队使用模式 |
| [架构概览](./docs/02-架构设计/01-整体架构.md) | zh | 面向贡献者的系统设计 |
| [开发规范](./docs/03-实施方案/06-开发规范.md) | zh | 贡献者开发规范 |
| [测试方案](./docs/03-实施方案/04-测试方案.md) | zh | 验证策略与测试设计 |
| [CHANGELOG](./CHANGELOG.md) | en / zh mixed | 规范化版本历史（machine-readable） |
| [版本更新索引](./docs/08-版本更新/README.md) | zh | 叙述性版本说明 |

## 本地开发

```bash
git clone https://github.com/sunrain520/spec-first.git
cd spec-first
npm install --legacy-peer-deps
npm test
```

> 这里必须加 `--legacy-peer-deps`，因为 vendored `tree-sitter` fork 与 `jest` 的 peer dependency 解析，在更严格的 resolver 下会冲突。不加这个参数时，第一次跑 `jest` 往往就会失败。

### 验证脚本

```bash
npm run test:unit           # shell unit tests + jest unit suite（tests/unit/*）
npm run test:smoke          # install-local + CLI smoke
npm run test:integration    # verification-gate jest + e2e shell
npm run test:e2e:crg        # CRG 全命令 + SQLite 审计
npm run test:jest           # 只跑 jest
npm run test:ai-dev:gate    # AI Dev Quality Gate（light contract check）
npm pack                    # release tarball dry run
```

`npm test` 实际会按 `test:unit → test:smoke → test:integration → test:e2e:crg` 的顺序执行。

## 贡献

欢迎提交 Issue 和 Pull Request。

如果你要报告 bug，请在 [Issue](https://github.com/sunrain520/spec-first/issues) 中附上复现步骤、环境信息和预期行为。

如果你要贡献代码：

1. Fork 仓库，并从 `master` 创建 feature branch。
2. 将 `master` 视为唯一接受直接更新的分支；`main` 仅作为自动同步的镜像分支，不应直接开发或提交。
3. 阅读 [AGENTS.md](./AGENTS.md)，了解仓库 workflow 约定。
4. 运行 `npm install --legacy-peer-deps`，然后执行 `npm test`。
5. 提交 PR，说明变更目标和验证细节。
6. 每一次 code / doc 变更，都必须按文件顶部定义的格式，在 [CHANGELOG.md](./CHANGELOG.md) 追加一行记录。

提交前建议先阅读：[AGENTS.md](./AGENTS.md) · [User Manual](./docs/05-用户手册/README.md) · [CHANGELOG](./CHANGELOG.md)

## 许可证

[MIT](./LICENSE) © [sunrain520](https://github.com/sunrain520)
