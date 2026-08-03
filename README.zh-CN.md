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

**把意图转化为可信变更的仓库原生 AI Coding Harness。**

`spec-first` 把一次性的 AI coding 对话变成可检查的需求、计划、范围化执行、审查证据和可复用经验。它运行在你已经使用的 AI coding 宿主中：脚本强制确定性不变量并准备事实，LLM 在这层地板之上完成语义判断。

[官方网站](http://spec-first.cn/) | [用户手册](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md)

</div>

---

## 90 秒看懂

![spec-first CLI workflow demo](https://raw.githubusercontent.com/sunrain520/spec-first/main/docs/assets/readme/spec-first-cli-workflow-demo.svg)

```text
Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
```

这条闭环会留下聊天窗口无法长期保存的三类资产：

- **意图**：解释改什么、为什么改的需求与计划。
- **证据**：约束 Agent 可以声称什么的审查与验证记录。
- **经验**：带来源、适用范围和失效条件的可复用解决方案。

演示图使用模拟流程；其中展示的产物、命令和合同都可以在本仓库中检查。

## 为什么使用 spec-first？

AI 写代码很快，真正昂贵的是保留代码背后的判断：为什么选择这个范围、检查过哪些证据、实际验证了什么，以及下一位 Agent 或同事需要继承什么。

| 没有 spec-first | 使用 spec-first |
|---|---|
| 决策随聊天会话消失 | 需求和计划保存在 `docs/` 中 |
| Reviewer 只能看到 diff | 可以结合计划、task pack 和 findings 审查 diff |
| “测试通过”只是一句对话声明 | 收尾证据可以引用实际运行的命令和脱敏日志 |
| 同一个问题复发时从零开始 | 已验证方案可以沉淀到 `docs/solutions/` |
| 更换宿主就要重新维护 prompt | 一套 source assets 投射相同的 `spec-*` workflow 标识 |

当你已经使用 AI coding 宿主，并希望获得项目内 workflow、可审查产物和证据约束的完成声明时，适合使用 `spec-first`。如果你只需要一段 prompt、通用 Agent 市场、脱离宿主的独立应用，或团队不允许把 workflow 产物写入仓库，它可能不是合适的选择。

## 快速开始

前置条件：

- Node.js `>=20.0.0`、npm，并确保 Git 位于 `PATH`。
- 已安装一个受支持的 AI coding 宿主。
- 终端位于需要启用 spec-first 的 Git 仓库根目录。首次体验可以使用临时测试仓库。

### 1. 安装并初始化

```bash
npm install -g spec-first
spec-first quickstart
```

`quickstart` 会检查 Node.js、Git 和已安装的宿主 CLI。只发现一个宿主时，它会继续进入该宿主既有的 `init` 流程；发现零个或多个宿主时，则进入交互式宿主选择。它不会替你运行需要 LLM 推理的 workflow。

希望逐步执行时，可以使用：

```bash
npm install -g spec-first
spec-first doctor
spec-first init
```

`init` 会先预览并确认它准备写入的受管文件。脚本化初始化时，应显式指定宿主和开发者信息，例如：

```bash
spec-first init --codex -y -u <name> --lang <zh|en>
```

多宿主、多仓、dry-run、预览宿主和 Runtime Setup 选项见[完整快速开始指南](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/01-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B.md)。

### 2. 重启宿主

重启已选择的宿主或新开会话，让它加载生成的 runtime assets。`spec-*` workflow 在宿主会话中运行，不是终端命令。

### 3. 运行第一个 workflow

从一个粗略的产品或工程变更开始：

```text
spec-brainstorm "改进 CLI 新用户的 onboarding"
```

然后检查生成的 requirements-only plan：

```text
docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.md
```

这个文件就是首次体验的完成信号：意图已经进入仓库，可检查，并可以继续交给 `spec-plan`。

## 你能得到什么

每个 workflow 只写入自己拥有的产物。一个典型项目可能逐步积累：

```text
docs/
  ideation/      排序后的想法与探索记录
  brainstorms/   spec-prd 生成的 PRD 产物
  plans/         requirements-only 与 implementation-ready plans
  tasks/         结构化执行所用的 derived task packs
  reviews/       文档与代码审查 findings
  solutions/     经过约束的可复用经验
.spec-first/
  workflows/     结构化 workflow 证据（默认 gitignore）
```

这些 workflow 产物由项目拥有。宿主 runtime assets 是可丢弃的投射，可以随时通过 `spec-first init` 从 source 重新生成。

## 核心 Workflows

公开 workflow 在各宿主中统一使用 `spec-*` 标识。入口治理根据当前意图选择一个路径，不强迫所有任务经过固定状态机。

| 当前意图 | 从这里开始 | 主要产物 |
|---|---|---|
| 探索多个可能方向 | `spec-ideate` | `docs/ideation/` 中的排序结果 |
| 把粗略想法转成需求 | `spec-brainstorm` | `docs/plans/` 中的 requirements-only plan |
| 完善已有 PRD 或 brownfield 请求 | `spec-prd` | `docs/brainstorms/` 中的 PRD 产物 |
| 为已确定需求制定实现方式 | `spec-plan` | `docs/plans/` 中的 implementation-ready plan |
| 将计划拆成结构化交接任务 | `spec-write-tasks` | `docs/tasks/` 中的 derived task pack |
| 执行范围明确的工作 | `spec-work` | 源码变更与验证证据 |
| 诊断失败或异常 | `spec-debug` | 根因与验证证据 |
| 审查文档或实现 | `spec-doc-review` / `spec-code-review` | 结构化 findings |
| 沉淀可复用经验 | `spec-compound` | `docs/solutions/` 中的受约束方案 |

其他公开入口覆盖浏览器 dogfood、优化、polish、handoff、Skill 编写与发布流程。完整清单见 [Workflows 与产物地图](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/04-workflows-artifacts-map.md)。

## 信任模型

核心规则是：**脚本强制确定性不变量并准备事实，LLM 在这层地板之上判断语义充分性。**

- **脚本与工具拥有事实**：路径、Git 状态、hash、schema 校验、exit code、生成结果和机器可读 receipt。
- **LLM 与人拥有判断**：需求、范围、取舍、实现选择、审查结论和业务价值。
- **证据限制声明**：artifact、source test 通过或模型自信，只能证明直接证据覆盖的范围。
- **出口权限相互独立**：本地修改、worker dispatch、commit、push、handoff 和持久知识提升分别授权。
- **Source 始终权威**：修改 `skills/`、`templates/`、`src/cli/` 和 checked-in docs，不把 generated runtime mirror 当作 source 修补。

完整边界见 [Source/Runtime 合同](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/source-runtime-customization-boundary.md)、[Runtime Capability Catalog](https://github.com/sunrain520/spec-first/blob/main/docs/catalog/runtime-capabilities.md)和 [Honest Closeout Contract](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/workflows/honest-closeout.md)。

## 宿主支持

宿主投射能力与宿主实机证据是不同声明。能够生成 runtime，并不自动证明宿主 loader 已正确发现并调用它。

| 宿主 | 当前状态 | 初始化方式 |
|---|---|---|
| Claude Code | 主要支持宿主 | 交互式 `init` 或 `--claude` |
| Codex | 主要支持宿主 | 交互式 `init` 或 `--codex` |
| Kiro | opt-in preview | `--kiro` |
| Qoder | opt-in preview | `--qoder` |
| Cursor | opt-in `generated_runtime_preview`；本机 loader journey 尚未验证 | `--cursor` |
| OpenCode | opt-in `generated_runtime_preview`；同版本 loader journey 尚未验证 | `--opencode` |

运行 `spec-first doctor --verbose` 可以查看当前项目事实；详细支持状态以 [Runtime Capability Catalog](https://github.com/sunrain520/spec-first/blob/main/docs/catalog/runtime-capabilities.md)为准。

## 相关文档

**开始使用**

- [用户手册](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md)
- [首次工作流走查](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/09-%E9%A6%96%E6%AC%A1%E5%B7%A5%E4%BD%9C%E6%B5%81%E8%B5%B0%E6%9F%A5.md)
- [产物目录](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/10-%E4%BA%A7%E7%89%A9%E7%9B%AE%E5%BD%95.md)

**理解模型**

- [项目角色契约](https://github.com/sunrain520/spec-first/blob/main/docs/10-prompt/%E7%BB%93%E6%9E%84%E5%8C%96%E9%A1%B9%E7%9B%AE%E8%A7%92%E8%89%B2%E5%A5%91%E7%BA%A6.md)
- [Runtime Capability Catalog](https://github.com/sunrain520/spec-first/blob/main/docs/catalog/runtime-capabilities.md)
- [Verification Run Summary Contract](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/verification/verification-run-summary.md)

详细手册和实施文档以中文为主。

## CLI 参考

```bash
spec-first doctor      # 检查环境和受管 runtime 健康状态
spec-first quickstart  # 检查前置条件并继续进入 init
spec-first init        # 生成所选宿主的 runtime assets
spec-first update      # 升级 CLI 并刷新 runtime assets
spec-first clean       # 移除所选 generated runtime assets
spec-first plans audit --status completed --json
```

所有命令和选项见 `spec-first --help` 与[用户手册](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md)。

## 开发与贡献

```bash
npm run typecheck
npm run test:unit
npm run test:smoke
npm run test:integration
npm run test:release
npm run build
```

`npm run build` 执行 `npm pack --dry-run` 并验证发布包内容。Source 变更应发生在 canonical source surface；只有这些 runtime source 发生变化时，才通过 `spec-first init` 重新生成 runtime copies。

贡献与支持见 [CONTRIBUTING.md](https://github.com/sunrain520/spec-first/blob/main/CONTRIBUTING.md)、[SECURITY.md](https://github.com/sunrain520/spec-first/blob/main/SECURITY.md)、[LICENSE](https://github.com/sunrain520/spec-first/blob/main/LICENSE)、[版本记录](https://github.com/sunrain520/spec-first/blob/main/CHANGELOG.md)和 [GitHub Issues](https://github.com/sunrain520/spec-first/issues)。
