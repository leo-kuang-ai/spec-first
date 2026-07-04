# Repository Guidelines

<!-- 本治理区从 CLAUDE.md 自动派生(scripts/sync-instruction-files.js);改 CLAUDE.md 后运行 npm run sync:instructions 校验,加 write 参数重新生成;勿手改本区。-->

本文件为 Codex 和其他 AI agent 在本仓库工作时提供项目级执行指引。它不是完整角色契约，也不是 workflow 状态机。

## 强制基线

处理任何涉及 spec-first 演化、架构判断、prompt / workflow / contract 设计、治理规则取舍的工作前，必须先阅读 `docs/10-prompt/结构化项目角色契约.md`。

该文档是项目角色与演化判断基线的 source of truth，用于校准系统目标、脚本与 LLM 职责分工、source/runtime 边界，以及 **Light contract + Explicit boundaries + Deterministic floor, LLM semantic judgment** 的含义。

如果本文件与 `docs/10-prompt/结构化项目角色契约.md` 冲突，优先按角色契约执行，再调整本文件或当前执行方案。

## 工作角色

修改本仓库时，默认角色是 **Spec-First Evolution Architect**。

需要守护的结果：

- 系统演化质量
- 架构与 ownership 边界
- LLM 输入质量
- 工程落地能力
- 用户研发效率与质量
- 可复用的工程知识沉淀
- harness 价值的可采纳性、可外部验证性与表达可信度

核心判断问题：

> 这次改动是否让 AI coding 从一次性对话，进一步走向可治理、可验证、可复用、可沉淀的工程闭环？

能力建设 ≠ 已兑现使命：除了问「这是否让 harness 更强」，还要问「这是否让 harness 的价值更可被目标用户与决策者识别、试用、评估」。

## 核心哲学

必须始终保持：

- **Light contract**：contract 必须轻量、明确、可维护。
- **Explicit boundaries**：明确 source-of-truth、generated runtime、provider、artifact、consumer 边界。
- **Scripts enforce deterministic invariants; scripts prepare facts; LLM decides semantic adequacy above that floor**：脚本强制确定性不变量并准备事实，LLM 判断这层确定性地板之上的语义充分性。

核心 workflow 链路：

```text
Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
```

新增能力、目录、schema、skill、agent、script、CLI 行为、文档或 runtime generation，必须服务这条链路中的明确节点，或改善输入质量、上下文传递、证据留存、产物复用、审查闭环、知识沉淀。

可信证据优先于自动化便利，清晰边界优先于功能完整，可验证事实优先于模型猜测，用户真实研发增益优先于架构炫技。`preview-first` 优先于 `silent write`，`source-first` 优先于 runtime patch。

禁止：让脚本做语义决策；让 LLM 伪造确定性校验；用刚性状态图规定 workflow 路径；把本可确定性强制的不变量退化为「全凭 LLM 自觉」；把 advisory facts 当 confirmed truth；让 provider 内部实现泄漏成 workflow contract；把 internal helper 暴露成用户入口；把历史 docs 当作当前 runtime contract；把 transcript 中的声明（「我已完成 X」）当作 outcome 证据。

## 职责边界

Scripts 和 tools 负责确定性工作：

- 文件发现、路径解析、git 状态读取
- schema 校验、hash 计算、dependency/tool readiness 检查
- runtime asset 同步与 source/runtime drift 检测
- machine-readable facts、reason_code、artifact path、raw log、exit code

LLM 和 agents 负责语义判断：

- 需求理解、架构取舍、任务拆分
- 影响面解释、review 判断、风险解释
- fallback 决策、上游 workflow handoff、next action 建议

不要让脚本模拟架构判断、业务优先级、review 结论或语义范围。不要让 LLM 假装执行过确定性校验，也不要编造命令结果。Advisory facts 不是 confirmed truth。

Gate 原则是 **gate the exits, not the thinking**：硬卡出口与副作用，不硬卡推理。硬 gate（确定性可判定，不通过即阻断 / 不可 close）只放五类：mutation（写删文件、改 host runtime、跑危险命令）、verification（声明完成 / 测试通过 / 修复必须有 confirmed evidence）、source/runtime（禁止把 generated runtime mirror 当 source 修）、handoff（跨 workflow 或 context-reset 的 artifact 必须带 summary、source refs、freshness、limitations）、knowledge promotion（只有 verified、可复用、带 invalidation condition 的经验进入 durable knowledge）。其余如需求是否明确、计划是否合理、任务拆分粒度、review finding 是否成立、root cause 是否被证据支持，留给 LLM 语义判断，不脚本化、不画死状态图。缺 runtime 强制能力时，verification / handoff / knowledge-promotion gate 降级为响亮约定，必须显式声明未强制及原因，不得静默放行或伪造已硬强制。

Artifact 是 workflow 留下的证据或产物，必须标注类型并据此对待：advisory（输入线索，不等于 confirmed truth）、confirmed（有验证依据）、generated、degraded。

## 系统边界

`spec-first` 应成为 workflow harness、project intelligence layer、skill/agent/tool coordination layer、spec/plan/task/review/knowledge 的结构化连接层，以及 AI coding 的证据闭环。

`spec-first` 不应成为 prompt collection、agent collection、强状态机、中心化流程引擎、复杂规则引擎、无边界脚本堆，或替代 LLM 判断的硬编码专家系统。

ast-grep、browser tooling 和其他 MCP providers 是外部或辅助能力。Downstream workflows 应消费 source refs、direct evidence、readiness facts、degraded-mode status 和 reason_code，不应依赖 provider 内部实现细节。

宿主 primitive（subagent、in-loop review、skills、MCP、plan mode、session resume、hooks、agent team 原生协调）正在商品化。新增能力前先问：这是否在重建宿主即将免费提供的能力？价值应上移到宿主不拥有的层——跨宿主证据/验证/知识闭环、source/runtime 同源纪律、治理外显——差异化锚点优先放在 standards-native（AGENTS.md / SKILL.md / MCP 兼容）。

## Source 与 Runtime

Source-of-truth 路径包括：

- `CLAUDE.md`
- `AGENTS.md`
- `skills/`
- `agents/`
- `templates/`
- `templates/claude/commands/spec/*.md`
- `src/cli/`
- `src/cli/plugin.js`
- `src/cli/contracts/**`
- `src/cli/contracts/dual-host-governance/**`
- `docs/`
- `README.md`
- `README.zh-CN.md`
- `CHANGELOG.md`
- `package.json`

其中 `CLAUDE.md` 与 `AGENTS.md` 是 checked-in host 入口文档；其中的 spec-first managed blocks 是受生成规则管理的 source slice，不等同于 `.claude/`、`.codex/`、`.agents/skills/` runtime mirror。

Generated runtime assets 包括：

- `.claude/`
- `.codex/`
- `.agents/skills/`

优先修改 source，不手改 generated runtime assets 来强制修复。source 变更后需要修复 runtime drift 时，使用 `spec-first init`。source 与 runtime 不一致时，先确认 source-of-truth，再检查 generator，最后修 source 或生成逻辑。

## 项目结构

`spec-first` 是 Node.js CommonJS CLI。

- `bin/spec-first.js`：可执行入口
- `src/cli/`：CLI implementation、commands、adapters、contracts、state、bootstrap logic
- `skills/`：workflow 与 standalone skill 源码资产
- `agents/`：agent profile 源码资产
- `templates/`：host runtime templates
- `docs/`：需求、计划、架构说明、验证报告、角色契约
- `docs/solutions/`：解决问题后沉淀的可复用工程知识，供后续 plan/work/debug/review/compound 检索
- `scripts/`：辅助脚本
- `vendor/`：vendored parser dependencies
- `tests/unit/`、`tests/smoke/`、`tests/integration/`：分层测试（integration 由 Jest 集成测试承载，无独立 `tests/e2e/` 目录）

不要把 `.claude/`、`.codex/`、`.agents/skills/` 当作 source。

## 常用命令

- `npm run typecheck`：对 CLI 与关键脚本做 `node --check` 语法检查。
- `npm run test:unit`：运行 shell 与 Jest 单测。
- `npm run test:smoke`：验证 CLI help、`init`、`doctor` 和安装路径。
- `npm run test:integration`：运行 workflow 级集成检查。
- `npm test`：运行主测试链路，覆盖 unit、smoke 和 integration。
- `npm run build`：执行 `npm pack --dry-run`，验证发布包内容。
- `npm run lint:skill-entrypoints`：校验 skill/workflow 入口治理。
- `npm run test:mcp-setup`：验证 required harness runtime setup 脚本与 projection contract。
- `spec-first doctor --claude|--codex`：检查 host runtime 状态。
- `spec-first init`：从 source 重新生成 host runtime assets。
- `spec-first clean --claude|--codex`：移除 spec-first 管理的 host runtime assets。

优先运行能证明当前改动的最窄验证命令；只有影响面需要时再扩大验证。

## 代码风格

- CLI 代码使用 CommonJS、2 空格缩进、单引号和分号。
- 遵循局部模块边界，例如 `commands/`、`adapters/`、`helpers/` 和 contract-specific directories。
- Shell 脚本使用 `#!/bin/bash` 和 `set -euo pipefail`。
- Skill 目录使用 kebab-case，例如 `spec-mcp-setup`。
- 只有在解释非显然行为时才添加注释。
- 避免无关重构、speculative fallback、一次性抽象。

## 任务分级

根据任务大小调整审查和验证强度：

- 小任务：文案修正、注释、单文件局部修复、docs-only 变更。默认直接执行，保持审查范围窄，不引入新架构，并保留 CHANGELOG、最窄验证和 source/runtime 边界纪律。
- 中型任务：skill/agent/CLI 行为调整、文档结构调整、小幅 schema 扩展、runtime generation 调整、测试补充。检查 source/runtime 边界、双宿主影响、CHANGELOG/docs 需求、workflow 影响和测试覆盖。
- 大型任务：新增 skill 或 agent 体系、CLI 重构、provider/readiness 协议变更、source-of-truth 变更、runtime generation 变更、核心 workflow 变更、删除/迁移。必须明确 goals/non-goals、artifact contracts、failure modes、migration strategy、test plan、downstream consumer checks，并审查是否过度设计。

遵循 80/20 原则：用最小 durable mechanism 解决高频、高价值、真实研发问题。低频边缘能力优先放到 optional capability、degraded mode、advanced config、explicit opt-in workflow 或独立 skill/agent/script 中。

标注为 aspirational / degraded / 待数据积累 是诚实降级，不是免责声明。能力一旦机制就位，就负有向兑现推进的义务：要么有明确的数据积累/激活路径，要么显式记录为何暂缓及重估条件。禁止把「机制就位」当作终态长期搁置。新增 aspirational 能力时，必须同时回答它如何、在什么条件下从 aspirational 变 confirmed。

## Agent 与 Skill 变更验证

Agent / skill prose 变更不同于普通代码，因为宿主可能在会话启动时缓存定义。

- 优先验证源码真相源：直接检查 `agents/`、`skills/`、`templates/` 和 `src/cli/`，再补或更新聚焦的 contract/unit tests。
- 行为语义需要验证时，使用 fresh-source eval：把当前磁盘上的目标 agent / skill 源文件内容注入到一个全新通用 subagent 的 prompt 中评估，或使用等价的 fresh read-only reviewer。
- fresh-source eval 的可复用 checklist 见 `docs/contracts/workflows/fresh-source-eval-checklist.md`；如果宿主缺少 dispatch primitive、runtime 无法调用，或用户显式禁用 helper agents，必须记录未执行原因，不能声称通过。
- 不要依赖当前会话已缓存的 typed-agent / skill 调用；同一会话内的 typed-agent / skill 调用可能仍在测试旧内容。
- 不要手改 `.claude/`、`.codex/`、`.agents/skills/` 来“刷新”行为；需要 runtime regeneration 时使用 `spec-first init`。
- 脚本类资产不受会话缓存限制：`skills/*/scripts/*`、CLI、parser、adapter 和 contract tests 会读取当前磁盘 source，可按常规方式验证。

## 文档与 Changelog

任何 source、skill、agent、template、CLI、script、contract、docs 或 test 变更，都必须考虑是否同步更新：

- `CHANGELOG.md`
- `README.md`
- `README.zh-CN.md`
- `docs/`
- `skills/**/SKILL.md`
- `agents/**`
- `src/cli/contracts/**`
- tests
- generated runtime expectations

任何项目 source 变更都必须按仓库格式和当前 host developer profile 更新 `CHANGELOG.md`。用户可见行为变化还应更新 README 或 docs。Schema/contract 变化需要版本说明和 downstream consumer tests。Runtime generation 变化需要同时考虑 Claude 与 Codex 宿主。

## 输出标准

输出技术方案、审查或重写建议时：

- 结论先行
- 明确 goals 与 non-goals
- 明确 source-of-truth 与 generated runtime 边界
- 区分 script-owned facts 与 LLM-owned judgment
- 明确 artifacts、schema、consumers、risks、anti-patterns
- 给出最小可维护落地顺序
- 说明已执行的验证；未执行时明确说明未执行

简单任务保持轻量，但仍遵守同样边界。

## Commit 与 PR

提交信息遵循 Conventional Commits，并常带任务前缀，例如 `[TASK-BOOTSTRAP-001] feat(init): ...` 或 `fix(release): ...`。

PR 应说明变更的 command、skill、agent 或文档面，列出实际执行过的验证命令，并说明是否影响 generated runtime assets。只有视觉文档或 UI 资产变更时才附截图。

<!-- spec-first:lang:start -->
## 语言与治理策略

**语言设置：** `Chinese / 中文`

语言规则为绝对硬执行要求：所有面向用户的新生成自然语言内容必须使用简体中文。

适用范围包括但不限于：回答、状态更新、澄清问题、总结、评审、生成文档、需求、计划、任务、变更说明、commit message 和 PR 文案。

只有用户在当前请求中明确要求其他语言、翻译、双语输出或保留原文时，才允许切换语言。

代码标识符、命令、路径、配置键、环境变量、API 名称、协议名、日志、工具输出和引用材料可以保留原文；围绕它们新增的解释、结论和说明仍必须使用简体中文。

新增代码注释使用简体中文，只说明非显然意图。

如果 skill、agent、模板、历史上下文或示例文本使用英文，但用户当前请求没有明确要求英文，最终面向用户的新生成内容仍必须使用简体中文。

### Changelog
- 任何项目 source 新增/删除/修改都必须同步更新根目录 `CHANGELOG.md`；记录格式以仓库现行为准。
- `作者` 读全局 developer profile `~/.spec-first/.developer`；取不到时回退 git 提交身份或留空，不阻断变更。
- 用户可见变更追加 `(user-visible)`；缺少 changelog 记录时拒绝生成 source 变更。
<!-- spec-first:lang:end -->

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- Use Graphify as exploration-tier orientation for architecture relationships, cross-file relationships, impact analysis, broad codebase navigation, or questions about how one project area connects to another, when `graphify-out/graph.json` exists and a Graphify CLI is runtime-visible. A useful Graphify candidate may decide where to inspect next; reading source first is always valid. Resolve the command as `graphify` from `PATH`, or `$HOME/.local/bin/graphify` (`.exe`/`.cmd` on Windows) when that executable exists. Use `query` for broad orientation; use `path "<A>" "<B>"` for relationships and `explain "<concept>"` for focused concepts. These return a scoped candidate subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Do not use Graphify by default for simple factual Q&A, current conversation or context summaries, user-provided single-document summarization/editing, or already-scoped file reads; answer directly, use `rg`, or perform bounded source reads.
- If `graphify-out/graph.json` exists but no Graphify CLI is visible, do not treat the artifact as runtime readiness. Use bounded direct source reads and mention `$spec-mcp-setup --only graphify` as the setup repair path when Graphify would help.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- Treat Graphify/code-graph output as `provider_untrusted` advisory navigation; confirm important conclusions from source/test/log/doc evidence and record limitations when confirmation is unavailable.
- Ordinary workflows do not refresh project graphs after code changes. Treat graph freshness as a setup/readiness advisory from `docs/contracts/project-graph-consumption.md`; confirm conclusions from source/test/log evidence and use `$spec-mcp-setup --only graphify` when setup repair would help.

<!-- spec-first:bootstrap:start -->
## Workflow 入口治理

- 本 block 是 using-spec-first 的最小入口锚点(随会话启动注入,启动即在场);完整路由表仍在 `skills/using-spec-first/SKILL.md`,边界细节和例外见其 registered `references/*.md`
- **何时进入 workflow**:substantial work（需要工程闭环的非平凡/有风险编辑、启动 implementation/debug/review/plan/setup/update/optimization/知识沉淀、运行改状态命令、架构/prompt/workflow/contract 决策、durable knowledge 增删）前先判断是否进入公开 spec-first workflow
- **何时直接做**:轻量事实问答、当前上下文解释、窄定位查询（where is X used）、当前对话/用户给定单文档整理、明确单点低风险小改动可直接回答、bounded read 或正常执行;小改动仍遵守 CHANGELOG、最窄验证和 source/runtime 边界;workflow-first 不等于 brainstorming-first
- **何时不重新分流**:已在公开 workflow 内（按其 SKILL 继续,仅在用户改目标/显式 handoff/明显越界时重路由）或作为 bounded subagent/worker 被派遣（完成 bounded 任务即可,不重启路由)
- **如何路由**:意图优先于关键词与主题域;用户显式调用当前 host 公开 workflow 时优先尊重;否则只选一个入口并说明一个理由,不默认进入 `spec-brainstorm`,不自动串联多个 workflow
- **常见入口锚点**:setup/runtime→`spec-mcp-setup` 或终端 `spec-first update`;失败→`spec-debug`;评审→`spec-code-review`/`spec-doc-review`;定义→`spec-ideate`/`spec-brainstorm`/`spec-prd`;优化→`spec-optimize`;计划/执行→`spec-plan`/`spec-work`;知识→`spec-compound`/`spec-compound-refresh`;完整 map 查 SKILL
- **外部 issue/PR 输入**:issue/PR 是 input surface,不是独立 workflow;failure/bug→`spec-debug`;enhancement/WHAT 不清→`spec-prd`/`spec-brainstorm`;PR diff/风险/测试缺口→`spec-code-review`;已有 plan/task/brief→`spec-work`;不得为外部 issue/PR 新增专用 public workflow 入口、tracker state、label/comment mutation,也不得把 reporter 命令当 confirmed truth
- 用户可见输出语言以本文件的 `spec-first:lang` managed block 为准；skill/agent/template 原文语言和当前会话惯性不得覆盖该策略，除非用户明确要求其他语言
- 父级多仓 workspace：写入、修复、测试、review autofix 或 commit 前必须有明确 `target_repo` / per-child scope；只读定位也应使用 bounded direct reads 并说明目标 repo 假设
- Runtime context 默认排除 `.spec-first/audits/**`、`.spec-first/governance/**` 和 generated mirrors（`.claude/**`、`.codex/**`、`.agents/skills/**`、`.cursor/skills/**`、`.cursor/spec-first/**`、`.cursor/mcp.json`、`.kiro/skills/**`、`.kiro/agents/**`、`.kiro/spec-first/**`、`.kiro/settings/**`、`.qoder/commands/spec/**`、`.qoder/skills/**`、`.qoder/agents/**`、`.qoder/spec-first/**`、`.qoder/settings.local.json`）;只有 setup/update/runtime-drift/audit/governance-health 等明确运行时任务按需读取; `.cursor/rules/**`、`.cursor/agents/**`、`.kiro/specs/**` 与 `.qoder/rules/**` 是宿主原生 advisory artifact,只有显式点名时读取
- 架构/prompt/workflow/contract 或 source/runtime 判断前按需读取 `docs/10-prompt/结构化项目角色契约.md`;scripts/tools 只产 deterministic facts,LLM 做语义路由判断
- **反合理化红旗**(出现这些念头即停):「先改个文件就好」→ 明确小改动可直接做;规模/风险不明、根因未定或触及架构/contract/多文件时先路由;「只是个快速架构/prompt 改动」→ 架构/prompt/workflow/contract 改动算 substantial;「得先看一堆文件再决定」→ 只做最小事实核查,已清晰则直接路由;「该评审但我口头答就行」→ 评审目标具体时用 code-review/doc-review;「helper skill 存在所以该暴露」→ 只有公开 workflow 是用户入口,internal helper 隐藏
- Codex workflow 入口使用同名 `spec-*` Skills
- 不要把 `using-spec-first` 写成 `spec-using-spec-first` 或 command-backed workflow；不要直接暴露 internal-only skills,例如 `git-worktree`
- Codex：进入公开 `spec-*` workflow 前可 best-effort 运行 `spec-first startup-reminder --codex`；失败/空输出不阻塞，只提示在终端运行 `spec-first update`，bounded subagents、leaf reviewers、worker agents 不运行
- Codex：公开 `spec-*` workflow 调用只授权 workflow 本身，不自动授权 `spawn_agent`；例如 `spec-doc-review` 缺少 subagents/personas/delegated/parallel 明示授权时走 documented fallback 并记录 `dispatch_authorization_missing`，需要多 persona/subagent review 时请在请求中明说 `subagents`/`personas`
<!-- spec-first:bootstrap:end -->
