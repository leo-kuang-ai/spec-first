<div align="center">

# spec-first

[![npm version](https://img.shields.io/npm/v/spec-first.svg)](https://www.npmjs.com/package/spec-first)
[![npm yearly downloads](https://img.shields.io/npm/dy/spec-first.svg)](https://www.npmjs.com/package/spec-first)
[![npm monthly downloads](https://img.shields.io/npm/dm/spec-first.svg)](https://www.npmjs.com/package/spec-first)
[![npm weekly downloads](https://img.shields.io/npm/dw/spec-first.svg)](https://www.npmjs.com/package/spec-first)
[![license](https://img.shields.io/npm/l/spec-first.svg)](https://github.com/sunrain520/spec-first/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/spec-first.svg)](https://github.com/sunrain520/spec-first/blob/main/package.json)
[![CI](https://github.com/sunrain520/spec-first/actions/workflows/npm-install-matrix.yml/badge.svg?branch=master)](https://github.com/sunrain520/spec-first/actions/workflows/npm-install-matrix.yml?query=branch%3Amaster)
[![docs](https://img.shields.io/badge/docs-spec--first.cn-0b7285.svg)](http://spec-first.cn/)

[English](https://github.com/sunrain520/spec-first/blob/main/README.md) | [简体中文](https://github.com/sunrain520/spec-first/blob/main/README.zh-CN.md)

**面向 Claude Code、Codex、Kiro、Qoder 与 Cursor 的 AI Coding Harness。**

`spec-first` 让 Claude Code、Codex、Kiro、Qoder 和 Cursor 在真实项目中更容易被信任：一次性的 AI coding 对话会变成仓库承载的 requirements、plans、scoped work、review 和 reusable learning 闭环。脚本强制确定性不变量并准备事实，LLM 判断这层地板之上的语义充分性，证据留在你的仓库里。Kiro 与 Qoder 支持当前是 opt-in preview；Cursor 当前更保守，是 opt-in `generated_runtime_preview`，只证明可生成 `.cursor/skills/**`、`.cursor/spec-first/**` 与 `.cursor/mcp.json` 相关证据，本机尚未验证 Cursor skill discovery/invocation，generated skills 可能不会被 Cursor 加载。

官网：[spec-first.cn](http://spec-first.cn/)

</div>

---

## 90 秒看懂

![spec-first CLI workflow demo](https://raw.githubusercontent.com/sunrain520/spec-first/main/docs/assets/readme/spec-first-cli-workflow-demo.svg)

首次评估时，重点不应该是 agent 数量或 prompt 库，而是一次 workflow 是否会留下可复用的东西。健康的第一圈会给你已有的 Claude Code、Codex、Kiro、Qoder 或 Cursor 会话加上一条可治理路径：定义问题、规划方案、必要时拆 task、执行、评审，并把经验沉淀下来。

最小成功信号是具体可检查的：安装和 init 后，在宿主里运行一个 workflow，然后查看它写入仓库的 Markdown artifact，通常位于 `docs/brainstorms/` 或 `docs/plans/`。更深的治理内容可以稍后再读；第一次试用先确认工作是否变得可检查。

<sub>模拟演示路径：安装 → init → mcp-setup → ideate → brainstorm → prd → doc-review → plan → write-tasks → work → code-review → compound；mcp-setup 是 helper 或 MCP readiness facts 缺失时运行的准备步骤，debug 作为测试失败或根因不明时的旁路循环，并在仓库中留下可检查的 Markdown artifacts。动画源文件：[spec-first-cli-workflow-demo.svg](https://raw.githubusercontent.com/sunrain520/spec-first/main/docs/assets/readme/spec-first-cli-workflow-demo.svg)。</sub>

## 快速开始

约 5 分钟完成安装、初始化并运行第一个 workflow。

前置条件：

- Node.js `>=20.0.0` 和 npm。
- Git 已安装并在 `PATH` 中；`doctor`、setup 和 workflow 检查会读取 Git 仓库事实。
- 已安装 Claude Code、Codex、Kiro、Qoder 或 Cursor，并选择其中一个作为当前宿主。Cursor 需要显式 `--cursor` opt-in，且当前只处于 generated-runtime preview。
- terminal 位于你想启用 `spec-first` 的项目仓库根目录。首次试用者可以先在 throwaway/test repo 中体验，再初始化真实项目。

**步骤 1 — 安装并检查环境**

macOS / Linux：

```bash
npm install -g spec-first
spec-first doctor
```

Windows PowerShell 7+ 或 Windows PowerShell 5.1：

```powershell
npm install -g spec-first
spec-first doctor
```

Windows cmd.exe：

```bat
npm install -g spec-first
spec-first doctor
```

在 Win64 上，推荐使用 Windows Terminal + PowerShell 7+ 或原生 `cmd.exe` 做安装和 smoke check。Windows PowerShell 5.1 也支持，但 PowerShell 7+ 的 UTF-8 行为更稳定。

预期结果：`doctor` 报告无阻断问题。若有问题，按提示修复后再继续。

**步骤 2 — 初始化宿主 runtime**

```bash
spec-first init
```

选择宿主（Claude Code、Codex、Cursor、Kiro 和/或 Qoder）、确认开发者姓名与语言，然后确认写入。交互确认默认显示摘要：按宿主聚合生成规模和风险操作总量，突出项目外写入与 degraded warnings，不展示具体 remove/prune/untrack 路径；需要检查 target/host/root、关键写入和有界路径样本时，显式运行 `spec-first init --dry-run`。在包含大量 child Git repos 的父级 workspace 中，`init` 默认在父 root 执行 workspace bootstrap：写入 instruction、`.gitignore`、缺失时的 `CHANGELOG.md` 以及 selected host runtime/state。`--repo <child>` 只初始化指定 child repo；`--all-repos` 初始化父 workspace 和所有发现的 child repos。child 的 setup/readiness truth 仍只属于各 child。全新机器上的脚本化 `init -y` 必须传入 `-u <name>`，因为非交互模式不会再提示输入开发者姓名，例如 `spec-first init --codex -y -u <name> --lang <zh|en>`。脚本化 preview 初始化可使用 `spec-first init --kiro -y -u <name> --lang <zh|en>` 初始化 Kiro，使用 `spec-first init --qoder -y -u <name> --lang <zh|en>` 初始化 Qoder，或使用 `spec-first init --cursor -y -u <name> --lang <zh|en>` 初始化 Cursor generated-runtime preview。Cursor 不属于 `init -y` 默认宿主集合。

预期结果：交互 init 先给出可确认的宿主级摘要，完成后用单一 run-level 回执报告各宿主结果；`--dry-run` 才展开 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/` 或 `.qoder/` 下的有界路径明细。生成的 runtime copies 随时可通过 `spec-first init` 重建。

Init 只在目标仓库缺少 `CHANGELOG.md` 时创建初始文件；已有 Changelog 保持逐字节不变并继续由仓库自行拥有。

如果宿主提示缺少 helper 或 MCP readiness facts，继续前先在当前宿主运行统一入口 `spec-mcp-setup`。标准流程会准备必备 baseline、CodeGraph 与 Graphify；`--only` 仅用于高级子集修复，`--verify-only` 保持不安装的只读验证边界。

Cursor 注意事项：`spec-first init --cursor` 会在 `.cursor/skills/**` 下生成同名 `spec-*` workflow runtime、在 `.cursor/spec-first/**` 下生成 spec-first state，并默认把项目 MCP setup 目标设为 `.cursor/mcp.json`。用户级 `~/.cursor/mcp.json` 必须显式使用 `--user-scope` / `CURSOR_USER_SCOPE=1`。当前 release evidence 记录的是 `cursor_loader_validation_unavailable`，不能把 Cursor 视为完整 host support 或 `init -y` 默认宿主。

Cursor/Kiro/Qoder native pointer 文件：`init --cursor`、`init --kiro` 和 `init --qoder` 也会写入 `.cursor/rules/spec-first.mdc`、`.kiro/steering/spec-first.md` 与 `.qoder/rules/spec-first.md`。这些文件只把宿主指回根目录 `AGENTS.md` 和当前宿主已安装的 `using-spec-first` runtime skill（`.cursor/skills/`、`.kiro/skills/` 或 `.qoder/skills/`）；它们是 generated runtime pointer，不是第二个 source of truth。如果同路径已有无 spec-first managed marker 的用户文件，init 和 clean 都不会覆盖或删除；init 和 doctor 都会显式报告冲突 warning。

所有 init 选项（flags、脚本模式、多仓库）见 [完整快速开始指南](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/01-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B.md)。

**步骤 3 — 重启宿主**

重启宿主或开一个新会话，让宿主加载刚生成的 runtime assets。宿主内 workflow 入口不是 shell 命令——它们在 Claude Code、Codex、Kiro、Qoder 或 Cursor 会话里运行，而不是在终端里。

**步骤 4 — 运行第一个 workflow**

从 `brainstorm` 开始——这是最自然的第一个入口，并且会写入一个你可以立刻检查的 artifact：

```text
# 在任意受支持宿主会话中
spec-brainstorm "描述你的第一个任务"
```

**步骤 5 — 验证成功**

brainstorm 完成后，在仓库里检查是否出现了新文件：

```text
docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.md
```

这就是你的第一个 artifact。工作已经写进仓库，可检查，并可以移交给 plan 继续推进。

后续任务可按这个快速路由选择入口：

| 你的第一个任务是... | 从这里开始... |
|---|---|
| 粗略想法、功能方向或产品变化 | `spec-brainstorm` |
| 已有 PRD、需求笔记或 brownfield change request | `spec-prd` |
| bug、失败测试、堆栈或异常行为 | `spec-debug` |
| 已定计划、task pack 或范围明确的实现请求 | `spec-work` |
| 需要审查的文档、计划、task pack、diff 或实现 | `spec-doc-review` 或 `spec-code-review` |

完整走查见 [首次工作流走查](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/09-%E9%A6%96%E6%AC%A1%E5%B7%A5%E4%BD%9C%E6%B5%81%E8%B5%B0%E6%9F%A5.md)。产物归属见 [产物目录](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/10-%E4%BA%A7%E7%89%A9%E7%9B%AE%E5%BD%95.md)。

## 你能得到什么

一个典型的工作流链路会产出这些仓库内 artifact：

```text
docs/
  ideation/      ranked ideas 与探索记录
  brainstorms/   spec-prd 与历史 brainstorm 的 legacy PRD 级需求
  plans/         requirements-only Product Contract 与可执行 implementation plan
  tasks/         结构化 handoff 用 derived task packs
  reviews/       文档与代码审查 findings
  solutions/     解决问题后沉淀的可复用经验
.spec-first/
  workflows/     structured work closeout evidence（默认 gitignore）
```

不是每个 workflow 都写入所有 artifact。新的 `spec-brainstorm` 在 `docs/plans/` 写 requirements-only unified plan；`spec-prd` 继续在 `docs/brainstorms/` 写 legacy PRD artifact。更深的链路会继续积累 tasks、代码变更、review findings 和 learnings——全部在仓库里，全部可检查。

## Workflow Entry Points

研发主链路：`Codebase → Spec → Plan → Tasks → Code → Review → Knowledge`。公开 workflow 标识在受支持宿主中统一使用 `spec-*` 形式。

| 任务 | 统一入口 | 产物 |
|---|---|---|
| 从粗略想法提炼需求 | `spec-brainstorm` | `docs/plans/`（`requirements-only`） |
| 从已有 PRD 提炼需求 | `spec-prd` | `docs/brainstorms/` |
| 制定实现计划 | `spec-plan` | `docs/plans/` |
| 将计划拆成可执行任务 | `spec-write-tasks` | `docs/tasks/` |
| 执行有范围的工作 | `spec-work` | 源码变更 + 证据 |
| 代码审查 | `spec-code-review` | 结构化 findings |
| 文档/计划审查 | `spec-doc-review` | 结构化 findings |
| 沉淀可复用经验 | `spec-compound` | `docs/solutions/` |

支撑入口（按需触发）：`spec-mcp-setup` 用于 runtime 环境与必备 harness、MCP/helper readiness；debug、optimize、ideate、compound-refresh、polish、write-skill 使用当前宿主对应入口。

需求澄清由当前 producer 持有：`spec-ideate` 向 `spec-brainstorm` 传递聚焦 evidence snapshot；`spec-brainstorm` 先核实 source fact、每轮只向当前用户询问一个产品决定，并把 blocker、source limitation 与下一问题持久化到 requirements-only Product Contract；`spec-prd` 对 brownfield PRD 使用同一 sole-current-user 边界。项目 glossary/context/ADR 在这些 workflow 中只作 advisory 输入，跨 release 知识只输出带 provenance、consumer 与 invalidation condition 的 promotion candidate，后续显式维护请求才可写入。视觉/空间决定使用表格、状态序列、ASCII wireframe 或只读 source screenshot，不再启动 bundled browser helper。

`spec-write-skill` 是通用的项目级 Agent Skill workflow：可创建或修改项目拥有的 canonical package，也可只读验证现有或外部 package。Portable core 不要求项目使用 spec-first；宿主 metadata 与项目治理只在适用时加载。只审查质量仍走 bounded review，第三方安装仍交给 installer，generated runtime mirror 必须从 source 重建而不是直接修补。

[→ 完整入口与路由规则](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/04-workflows-artifacts-map.md)

## 你遇到的问题

AI 写代码很快；真正昂贵的是保存代码背后的判断：为什么选这个 scope、检查过哪些证据、哪些 review finding 重要、下一位 agent 或同事应该继承什么上下文。

如果没有仓库承载的轨迹，这些上下文会随聊天窗口一起消失。下一次会话缺上下文，reviewer 看不到计划为什么变化，团队也很难复用一次成功经验。`spec-first` 把这些工作作为持久 artifact 留在仓库里：requirements、PRD、plans、task packs、work evidence、debug notes、reviews 和 learnings。

## 为什么使用 spec-first？

`spec-first` 让软件生命周期本身保持可读，同时不把 prose 当成证明。它不是替代 Claude Code、Codex、Kiro、Qoder 或 Cursor，而是给这些宿主加上一层项目内 harness。Cursor native rules、Kiro native Specs 与 Qoder native rules 仍由宿主拥有；`.cursor/rules/**`、`.kiro/specs/**` 和 `.qoder/rules/**` 只有在显式命名时才作为 advisory input。

| 采纳时真正关心的问题 | Prompt pack / agent 编排 | spec-first |
|---|---|---|
| 第一次跑完能得到什么？ | 更好的聊天答案或 agent transcript | 仓库内 artifact，例如 requirements brief 或 plan |
| 决策和证据在哪里？ | Session state、消息总线、runtime memory | 项目内文档、generated runtime assets、可验证 CLI facts |
| 人要 review 什么？ | 通常是最终 diff 或 agent 输出 | Requirements、plans、task packs、diff、review findings、bugs 和 learnings |
| 谁守住机械边界？ | 主要靠模型自觉或自定义 glue | 脚本强制确定性不变量并准备事实，LLM 在这层地板之上做语义判断 |
| Claude Code、Codex、Cursor、Kiro 与 Qoder 怎么对齐？ | 分开 setup 和维护 prompt | 一套 source assets 重新生成受支持宿主的 runtime surface |

你今天就能检查的当前机制：

- requirements 变成持久 brief，而不是会话里消失的 prompt。
- plans 和 task packs 把模糊意图变成可评审、可执行的上下文。
- work closeout 可以指向结构化 verification evidence，而不是一句自由文本的"tests passed"。
- task-pack handoff 会基于 source plan 结构推荐是否拆分，并对高风险 task pack 推荐文档审查，同时保持工程师在环确认。
- work、review、debug、optimize 和 compound workflows 会沉淀证据与经验。
- knowledge handoff 默认 summary-first，召回的 `docs/solutions/` learning 在回源确认前保持 advisory。
- 一套 source assets 以统一 `spec-*` workflow 入口支持 Claude Code、Codex、Cursor、Kiro 和 Qoder，不需要手工维护生成副本。

这些是当前 repo 机制，不是"已经被外部采纳数据证明"的效果宣称。先相信 artifacts、tests 和 source/runtime boundaries，再相信任何营销句子。

## 产物与工作方式

`spec-first` 有两类 durable surface：仓库内 workflow artifacts 和 generated host runtime assets。

Source assets（`skills/`、`skills/**/references/{agents,personas}/` 下的 skill-local prompt assets、`templates/`、`src/cli/`）经 `spec-first init` 重新生成为 host runtime assets——产出仓库内 workflow artifacts：`ideation -> brainstorms -> plans -> tasks -> work/review/debug -> learnings`。

各宿主根目录下由 spec-first 生成的 `spec-*`、`using-spec-first`、Graphify project skill、`spec-first/` state、command、hook 与 pointer 资产是可丢弃镜像，可通过 `spec-first init` 重建。宿主根目录本身是 mixed-ownership surface：不属于上述命名空间的团队 skill、agent、rule 和可移植项目配置可以按团队策略提交。Cursor project `.cursor/mcp.json`、spec-first managed `.kiro/settings/`、Qoder local `.qoder/settings.local.json` 与 Qoder `.qoder/settings.json` managed hook entries 默认属于本地输出或 managed slice；已经跟踪的 team-policy 文件不会被 `init` 自动从 Git index 移除。精确生成路径和选择性共享方法见 gitignore 参考。

详细参考：

- [Source / Runtime / Provider Customization Boundary](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/source-runtime-customization-boundary.md)
- [Runtime Capability Catalog](https://github.com/sunrain520/spec-first/blob/main/docs/catalog/runtime-capabilities.md)
- [整体架构说明](https://github.com/sunrain520/spec-first/blob/main/docs/02-%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1/01-%E6%95%B4%E4%BD%93%E6%9E%B6%E6%9E%84.md)

## Trust Model

核心规则：scripts enforce deterministic invariants; scripts prepare facts; LLM decides semantic adequacy above that floor.

- **脚本负责什么：** 在出口和副作用处强制可机械判定的不变量，install、validate、generate、report machine facts。
- **LLM 负责什么：** requirements framing、scope boundaries、tradeoffs、implementation judgment、review evidence。
- **普通上下文排除什么：** `.spec-first/audits/**`、`.spec-first/governance/**` 以及 `.claude/**`、`.codex/**`、`.agents/skills/**`、`.cursor/skills/**`、`.cursor/spec-first/**`、`.kiro/skills/**`、`.kiro/agents/**`、`.kiro/spec-first/**`、spec-first managed `.kiro/settings/**`、`.qoder/commands/spec-*.md`、已退役的 `.qoder/commands/spec/**`、`.qoder/skills/**`、`.qoder/agents/**`、`.qoder/spec-first/**`、spec-first managed `.qoder/hooks/session-start`、`.qoder/hooks/prd-prewrite-guard`、`.qoder/hooks/prd-readiness-guard` 等 generated mirrors，以及 `.cursor/mcp.json`、`.qoder/settings.local.json` 这类 host-local config。

[→ 完整 Trust Model 与验证合同](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/workflows/honest-closeout.md)

## 适合使用 spec-first 的情况

适合使用 `spec-first`：

- 你已经使用 Claude Code、Codex、Kiro、Qoder 或 Cursor，希望用项目内 workflow 替代一次性 prompt。
- 你希望 AI coding work 留下 durable requirements、plans、显式路由的 review summaries 和 learnings。
- 你希望脚本处理确定性 setup 并守住可机器检查的边界，同时让语义判断继续由 LLM 完成。
- 你希望 workflow layer 足够轻，并能从 source assets 重新生成。

如果你只需要单次 prompt 片段、通用 agent marketplace、不依赖宿主的独立应用，或团队流程不希望 workflow artifacts 写入 repo，`spec-first` 可能不是最合适的形态。

## 相关文档

**快速上手**
- [spec-first.cn](http://spec-first.cn/) — 官网
- [用户手册](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md)
- [首次工作流走查](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/09-%E9%A6%96%E6%AC%A1%E5%B7%A5%E4%BD%9C%E6%B5%81%E8%B5%B0%E6%9F%A5.md)
- [Workflows 与产物地图](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/04-workflows-artifacts-map.md)

**理解模型**
- [整体架构](https://github.com/sunrain520/spec-first/blob/main/docs/02-%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1/01-%E6%95%B4%E4%BD%93%E6%9E%B6%E6%9E%84.md)
- [Source / Runtime / Provider Customization Boundary](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/source-runtime-customization-boundary.md)
- [Verification Run Summary Contract](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/verification/verification-run-summary.md)
- [Honest Closeout Contract](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/workflows/honest-closeout.md)
- [版本更新](https://github.com/sunrain520/spec-first/blob/main/docs/08-%E7%89%88%E6%9C%AC%E6%9B%B4%E6%96%B0/README.md)

详细手册和实施文档均以中文为主。

## Runtime 与 CLI Reference

首次接入：`source assets -> spec-first init -> host runtime assets -> workflow artifacts`

常用命令：

```bash
spec-first doctor    # 检查环境
spec-first init      # 生成 runtime
spec-first update    # 升级 CLI + 刷新 runtime
spec-first clean     # 移除 generated runtime
```

[→ 完整 CLI 参考与所有选项](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md)

## 开发与贡献

```bash
npm run typecheck
npm run test:mcp-setup
npm run test:unit
npm run test:smoke
npm run test:integration
npm run test:ai-dev:gate
npm run test:release
npm run test:release:website
npm run build
npm test
```

`npm run build` 会执行 `npm pack --dry-run` 并通过 npm 验证 package payload 形态。

修改 source assets 时，编辑 `skills/`、`skills/**/references/{agents,personas}/` 下的 skill-local prompt assets、`templates/` 或 `src/cli/`，再通过 `spec-first init` 重新生成 runtime copies，并在 fresh host session 中选择目标宿主。

贡献与支持见 [CONTRIBUTING.md](https://github.com/sunrain520/spec-first/blob/main/CONTRIBUTING.md)、[SECURITY.md](https://github.com/sunrain520/spec-first/blob/main/SECURITY.md)、[LICENSE](https://github.com/sunrain520/spec-first/blob/main/LICENSE) 和 [GitHub Issues](https://github.com/sunrain520/spec-first/issues)。
