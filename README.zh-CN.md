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

**面向 Claude Code、Codex 与 Kiro 的 AI Coding Harness。**

`spec-first` 让 Claude Code、Codex 和 Kiro 在真实项目中更容易被信任：一次性的 AI coding 对话会变成仓库承载的 requirements、plans、scoped work、review 和 reusable learning 闭环。脚本强制确定性不变量并准备事实，LLM 判断这层地板之上的语义充分性，证据留在你的仓库里。Kiro 支持当前是 opt-in preview，需等 Kiro IDE smoke 与真实用户价值信号确认后再提升为主路径 parity。

官网：[spec-first.cn](http://spec-first.cn/)

</div>

---

## 90 秒看懂

![spec-first CLI workflow demo](https://raw.githubusercontent.com/sunrain520/spec-first/main/docs/assets/readme/spec-first-cli-workflow-demo.svg)

首次评估时，重点不应该是 agent 数量或 prompt 库，而是一次 workflow 是否会留下可复用的东西。健康的第一圈会给你已有的 Claude Code、Codex 或 Kiro 会话加上一条可治理路径：定义问题、规划方案、必要时拆 task、执行、评审，并把经验沉淀下来。

最小成功信号是具体可检查的：安装和 init 后，在宿主里运行一个 workflow，然后查看它写入仓库的 Markdown artifact，通常位于 `docs/brainstorms/` 或 `docs/plans/`。更深的治理内容可以稍后再读；第一次试用先确认工作是否变得可检查。

<sub>模拟演示路径：安装 → init → mcp-setup → ideate → brainstorm → prd → doc-review → plan → write-tasks → work → code-review → compound；mcp-setup 是 helper 或 MCP readiness facts 缺失时运行的准备步骤，debug 作为测试失败或根因不明时的旁路循环，并在仓库中留下可检查的 Markdown artifacts。动画源文件：[spec-first-cli-workflow-demo.svg](https://raw.githubusercontent.com/sunrain520/spec-first/main/docs/assets/readme/spec-first-cli-workflow-demo.svg)。</sub>

## 快速开始

约 5 分钟完成安装、初始化并运行第一个 workflow。

前置条件：

- Node.js `>=20.0.0` 和 npm。
- Git 已安装并在 `PATH` 中；`doctor`、setup 和 workflow 检查会读取 Git 仓库事实。
- 已安装 Claude Code、Codex 或 Kiro，并选择其中一个作为当前宿主。
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

选择宿主（Claude Code、Codex 和/或 Kiro）、确认开发者姓名与语言，然后确认写入。脚本化 Kiro preview 初始化可使用 `spec-first init --kiro -y -u <name> --lang <zh|en>`。

预期结果：init 列出 `.claude/`、`.codex/`、`.agents/skills/` 或 `.kiro/` 下的生成路径，并确认 setup 完成。生成的 runtime copies 随时可通过 `spec-first init` 重建。

如果宿主提示缺少 helper 或 MCP readiness facts，继续前先在 Claude Code 运行 `/spec:mcp-setup`，在 Codex 运行 `$spec-mcp-setup`，或在 Kiro 运行 Agent Skill `spec-mcp-setup`。

所有 init 选项（flags、脚本模式、多仓库）见 [完整快速开始指南](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/01-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B.md)。

**步骤 3 — 重启宿主**

重启宿主或开一个新会话，让宿主加载刚生成的 runtime assets。宿主内 workflow 入口不是 shell 命令——它们在 Claude Code、Codex 或 Kiro 会话里运行，而不是在终端里。

**步骤 4 — 运行第一个 workflow**

从 `brainstorm` 开始——这是最自然的第一个入口，并且会写入一个你可以立刻检查的 artifact：

```text
# 在 Claude Code 会话中
/spec:brainstorm "描述你的第一个任务"

# 在 Codex 会话中
$spec-brainstorm "描述你的第一个任务"

# 在 Kiro 会话中
Kiro Agent Skill spec-brainstorm "描述你的第一个任务"
```

**步骤 5 — 验证成功**

brainstorm 完成后，在仓库里检查是否出现了新文件：

```text
docs/brainstorms/YYYY-MM-DD-NNN-<topic>-requirements.md
```

这就是你的第一个 artifact。工作已经写进仓库，可检查，并可以移交给 plan 继续推进。

后续任务可按这个快速路由选择入口：

| 你的第一个任务是... | 从这里开始... |
|---|---|
| 粗略想法、功能方向或产品变化 | `/spec:brainstorm`、`$spec-brainstorm` 或 Kiro Agent Skill `spec-brainstorm` |
| 已有 PRD、需求笔记或 brownfield change request | `/spec:prd`、`$spec-prd` 或 Kiro Agent Skill `spec-prd` |
| bug、失败测试、堆栈或异常行为 | `/spec:debug`、`$spec-debug` 或 Kiro Agent Skill `spec-debug` |
| 已定计划、task pack 或范围明确的实现请求 | `/spec:work`、`$spec-work` 或 Kiro Agent Skill `spec-work` |
| 需要审查的文档、计划、task pack、diff 或实现 | `/spec:doc-review`、`$spec-doc-review`、`/spec:code-review`、`$spec-code-review` 或匹配的 Kiro Agent Skill |

完整走查见 [首次工作流走查](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/09-%E9%A6%96%E6%AC%A1%E5%B7%A5%E4%BD%9C%E6%B5%81%E8%B5%B0%E6%9F%A5.md)。产物归属见 [产物目录](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/10-%E4%BA%A7%E7%89%A9%E7%9B%AE%E5%BD%95.md)。

## 你能得到什么

一个典型的工作流链路会产出这些仓库内 artifact：

```text
docs/
  ideation/      ranked ideas 与探索记录
  brainstorms/   requirements briefs 与 PRD 级需求
  plans/         可评审、可执行的 implementation plans
  tasks/         结构化 handoff 用 derived task packs
  reviews/       文档与代码审查 findings
  solutions/     解决问题后沉淀的可复用经验
.spec-first/
  workflows/     structured work closeout evidence（默认 gitignore）
```

不是每个 workflow 都写入所有 artifact。第一次运行只在 `docs/brainstorms/` 下写一个文件。更深的链路随着时间积累 plans、tasks、代码变更、review findings 和 learnings——全部在仓库里，全部可检查。

## Workflow Entry Points

研发主链路：`Codebase → Spec → Plan → Tasks → Code → Review → Knowledge`

| 任务 | Claude Code | Codex | Kiro | 产物 |
|---|---|---|---|---|
| 从粗略想法提炼需求 | `/spec:brainstorm` | `$spec-brainstorm` | Agent Skill `spec-brainstorm` | `docs/brainstorms/` |
| 从已有 PRD 提炼需求 | `/spec:prd` | `$spec-prd` | Agent Skill `spec-prd` | `docs/brainstorms/` |
| 制定实现计划 | `/spec:plan` | `$spec-plan` | Agent Skill `spec-plan` | `docs/plans/` |
| 将计划拆成可执行任务 | `/spec:write-tasks` | `$spec-write-tasks` | Agent Skill `spec-write-tasks` | `docs/tasks/` |
| 执行有范围的工作 | `/spec:work` | `$spec-work` | Agent Skill `spec-work` | 源码变更 + 证据 |
| 代码审查 | `/spec:code-review` | `$spec-code-review` | Agent Skill `spec-code-review` | 结构化 findings |
| 文档/计划审查 | `/spec:doc-review` | `$spec-doc-review` | Agent Skill `spec-doc-review` | 结构化 findings |
| 沉淀可复用经验 | `/spec:compound` | `$spec-compound` | Agent Skill `spec-compound` | `docs/solutions/` |

支撑入口（按需触发）：`/spec:mcp-setup`、`$spec-mcp-setup` 或 Kiro Agent Skill `spec-mcp-setup` 用于 runtime 环境与必备 harness、MCP/helper readiness；debug、optimize、ideate、compound-refresh、polish-beta、write-skill 使用当前宿主对应入口。

[→ 完整入口与路由规则](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/04-workflows-artifacts-map.md)

## 你遇到的问题

AI 写代码很快；真正昂贵的是保存代码背后的判断：为什么选这个 scope、检查过哪些证据、哪些 review finding 重要、下一位 agent 或同事应该继承什么上下文。

如果没有仓库承载的轨迹，这些上下文会随聊天窗口一起消失。下一次会话缺上下文，reviewer 看不到计划为什么变化，团队也很难复用一次成功经验。`spec-first` 把这些工作作为持久 artifact 留在仓库里：requirements、PRD、plans、task packs、work evidence、debug notes、reviews 和 learnings。

## 为什么使用 spec-first？

`spec-first` 让软件生命周期本身保持可读，同时不把 prose 当成证明。它不是替代 Claude Code、Codex 或 Kiro，而是给这些宿主加上一层项目内 harness。Kiro native Specs 仍由 Kiro 拥有；`.kiro/specs/**` 只有在显式命名时才作为 advisory input。

| 采纳时真正关心的问题 | Prompt pack / agent 编排 | spec-first |
|---|---|---|
| 第一次跑完能得到什么？ | 更好的聊天答案或 agent transcript | 仓库内 artifact，例如 requirements brief 或 plan |
| 决策和证据在哪里？ | Session state、消息总线、runtime memory | 项目内文档、generated runtime assets、可验证 CLI facts |
| 人要 review 什么？ | 通常是最终 diff 或 agent 输出 | Requirements、plans、task packs、diff、review findings、bugs 和 learnings |
| 谁守住机械边界？ | 主要靠模型自觉或自定义 glue | 脚本强制确定性不变量并准备事实，LLM 在这层地板之上做语义判断 |
| Claude Code、Codex 与 Kiro 怎么对齐？ | 分开 setup 和维护 prompt | 一套 source assets 重新生成受支持宿主的 runtime surface |

你今天就能检查的当前机制：

- requirements 变成持久 brief，而不是会话里消失的 prompt。
- plans 和 task packs 把模糊意图变成可评审、可执行的上下文。
- work closeout 可以指向结构化 verification evidence，而不是一句自由文本的"tests passed"。
- task-pack handoff 会基于 source plan 结构推荐是否拆分，并对高风险 task pack 推荐文档审查，同时保持工程师在环确认。
- work、review、debug、optimize 和 compound workflows 会沉淀证据与经验。
- knowledge handoff 默认 summary-first，召回的 `docs/solutions/` learning 在回源确认前保持 advisory。
- 团队开发规范合同以 source 文档形式放在 `docs/contracts/team-standards.md` 与 `docs/standards/**`，由 workflow 按 scope 选择 confirmed 规则，而不是新增入口。
- 一套 source assets 同时支持 Claude Code 的 `/spec:*` 入口、Codex 的 `$spec-*` 入口和 Kiro Agent Skills，不需要手工维护生成副本。

这些是当前 repo 机制，不是"已经被外部采纳数据证明"的效果宣称。先相信 artifacts、tests 和 source/runtime boundaries，再相信任何营销句子。

## 产物与工作方式

`spec-first` 有两类 durable surface：仓库内 workflow artifacts 和 generated host runtime assets。

Source assets（`skills/`、`agents/`、`templates/`、`src/cli/`）经 `spec-first init` 重新生成为 host runtime assets——产出仓库内 workflow artifacts：`ideation -> brainstorms -> plans -> tasks -> work/review/debug -> learnings`。

`.claude/`、`.codex/`、`.agents/skills/`、`.kiro/skills/`、`.kiro/agents/` 和 `.kiro/spec-first/` 下的 generated runtime copies 是可丢弃镜像，可通过 `spec-first init` 重建。spec-first managed `.kiro/settings/` 是配置输出；Kiro native `.kiro/specs/**` 不是 spec-first source。

详细参考：

- [Source / Runtime / Provider Customization Boundary](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/source-runtime-customization-boundary.md)
- [Runtime Capability Catalog](https://github.com/sunrain520/spec-first/blob/main/docs/catalog/runtime-capabilities.md)
- [整体架构说明](https://github.com/sunrain520/spec-first/blob/main/docs/02-%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1/01-%E6%95%B4%E4%BD%93%E6%9E%B6%E6%9E%84.md)

## Trust Model

核心规则：scripts enforce deterministic invariants; scripts prepare facts; LLM decides semantic adequacy above that floor.

- **脚本负责什么：** 在出口和副作用处强制可机械判定的不变量，install、validate、generate、report machine facts。
- **LLM 负责什么：** requirements framing、scope boundaries、tradeoffs、implementation judgment、review evidence。
- **普通上下文排除什么：** `.spec-first/audits/**`、`.spec-first/governance/**` 以及 `.claude/**`、`.codex/**`、`.agents/skills/**`、`.kiro/skills/**`、`.kiro/agents/**`、`.kiro/spec-first/**`、spec-first managed `.kiro/settings/**` 等 generated mirrors。

[→ 完整 Trust Model 与验证合同](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/workflows/honest-closeout.md)

## 适合使用 spec-first 的情况

适合使用 `spec-first`：

- 你已经使用 Claude Code、Codex 或 Kiro，希望用项目内 workflow 替代一次性 prompt。
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
npm run test:ai-dev:benchmarks
npm run test:release
npm run test:release:website
npm run build
npm test
```

`npm run build` 会执行 `npm pack --dry-run` 并通过 npm 验证 package payload 形态。

修改 source assets 时，编辑 `skills/`、`agents/`、`templates/` 或 `src/cli/`，再通过 `spec-first init` 重新生成 runtime copies，并在 fresh host session 中选择目标宿主。

贡献与支持见 [CONTRIBUTING.md](https://github.com/sunrain520/spec-first/blob/main/CONTRIBUTING.md)、[SECURITY.md](https://github.com/sunrain520/spec-first/blob/main/SECURITY.md)、[LICENSE](https://github.com/sunrain520/spec-first/blob/main/LICENSE) 和 [GitHub Issues](https://github.com/sunrain520/spec-first/issues)。
