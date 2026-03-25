<p align="center">
<strong>给 AI 立规矩的开源框架</strong><br/>
<sub>支持 Claude Code、Cursor、OpenCode、iFlow、Codex、Kilo、Kiro、Gemini CLI、Antigravity、Qoder 和 CodeBuddy。</sub>
</p>

<p align="center">
<a href="./README.md">English</a> •
<a href="https://github.com/sunrain520/spec-first/blob/master/docs/trellis-workflow-analysis.md">文档</a> •
<a href="https://github.com/sunrain520/spec-first/blob/master/docs/trellis-first-time-existing-project.md">快速开始</a> •
<a href="https://github.com/sunrain520/spec-first/blob/master/docs/多平台集成架构/multi-platform-architecture.md">支持平台</a> •
<a href="https://github.com/sunrain520/spec-first/blob/master/docs/trellis-existing-project-iteration.md">使用场景</a> •
<a href="#wechat-group">微信群</a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@leokuang/spec-first"><img src="https://img.shields.io/npm/v/@leokuang/spec-first.svg?style=flat-square&color=2563eb" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@leokuang/spec-first"><img src="https://img.shields.io/npm/dw/@leokuang/spec-first?style=flat-square&color=cb3837&label=downloads" alt="npm downloads" /></a>
<a href="https://github.com/sunrain520/spec-first/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-16a34a.svg?style=flat-square" alt="license" /></a>
<a href="https://github.com/sunrain520/spec-first/stargazers"><img src="https://img.shields.io/github/stars/sunrain520/spec-first?style=flat-square&color=eab308" alt="stars" /></a>
<a href="https://github.com/sunrain520/spec-first/blob/master/docs/trellis-workflow-analysis.md"><img src="https://img.shields.io/badge/docs-github%20docs-0f766e?style=flat-square" alt="docs" /></a>
<a href="https://discord.com/invite/tWcCZ3aRHc"><img src="https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord" /></a>
<a href="https://github.com/sunrain520/spec-first/issues"><img src="https://img.shields.io/github/issues/sunrain520/spec-first?style=flat-square&color=e67e22" alt="open issues" /></a>
<a href="https://github.com/sunrain520/spec-first/pulls"><img src="https://img.shields.io/github/issues-pr/sunrain520/spec-first?style=flat-square&color=9b59b6" alt="open PRs" /></a>
<a href="https://deepwiki.com/sunrain520/spec-first"><img src="https://img.shields.io/badge/Ask-DeepWiki-blue?style=flat-square" alt="Ask DeepWiki" /></a>
<a href="https://chatgpt.com/?q=Explain+the+project+sunrain520/spec-first+on+GitHub"><img src="https://img.shields.io/badge/Ask-ChatGPT-74aa9c?style=flat-square&logo=openai&logoColor=white" alt="Ask ChatGPT" /></a>
</p>

## 为什么用 spec-first？

| 能力 | 带来的变化 |
| --- | --- |
| **自动注入 Spec** | 把规范写进 `.spec-first/spec/` 之后，spec-first 会在每次会话里注入当前任务真正需要的上下文，不用反复解释。 |
| **任务驱动工作流** | PRD、实现上下文、检查上下文和任务状态都放进 `.spec-first/tasks/`，AI 开发不会越做越乱。 |
| **并行 Agent 执行** | 用 git worktree 同时推进多个 AI 任务，不需要把一个分支挤成大杂烩。 |
| **项目记忆** | `.spec-first/workspace/` 里的 journal 会保留上一次工作的脉络，让新会话不是从空白开始。 |
| **团队共享标准** | Spec 跟着仓库一起版本化，一个人总结出来的规则和流程，可以直接变成整个团队的基础设施。 |
| **多平台复用** | 同一套 spec-first 结构可以带到 10 个 AI coding 平台上，而不是每换一个工具就重搭一次工作流。 |

## 快速开始

```bash
# 1. 安装 spec-first
npm install -g @leokuang/spec-first@latest

# 2. 在仓库里初始化
spec-first init -u your-name

# 3. 或者按你实际使用的平台初始化
spec-first init --cursor --opencode --codex -u your-name
```

- `-u your-name` 会创建 `.spec-first/workspace/your-name/`，用来保存个人 journal 和会话连续性。
- 平台参数可以自由组合。当前可选项包括 `--cursor`、`--opencode`、`--iflow`、`--codex`、`--kilo`、`--kiro`、`--gemini`、`--antigravity`、`--qoder` 和 `--codebuddy`。
- 更完整的安装步骤、各平台入口命令和升级方式放在文档站：
  [快速开始](https://github.com/sunrain520/spec-first/blob/master/docs/trellis-first-time-existing-project.md) •
  [支持平台](https://github.com/sunrain520/spec-first/blob/master/docs/多平台集成架构/multi-platform-architecture.md) •
  [使用场景](https://github.com/sunrain520/spec-first/blob/master/docs/trellis-existing-project-iteration.md)

## 使用场景

### 把项目知识一次性交给 AI

把编码规范、目录规则、评审习惯和工作流偏好写进 Markdown Spec。spec-first 会自动加载相关部分，你不需要每次都从头解释这个项目怎么做事。

### 并行推进多个 AI 任务

借助 git worktree 和 spec-first 的任务结构，可以把不同任务拆开并行推进。多个 Agent 同时工作时，分支和本地状态也不会互相踩来踩去。

### 把项目历史变成可用记忆

任务 PRD、检查清单和 workspace journal 会把上一次的决策留下来。下一次进场的 Agent 不需要从零开始猜上下文。

### 在不同工具之间保持同一套流程

如果团队不会只用一个 AI coding 工具，spec-first 可以把 Spec、Task 和流程结构统一起来。平台接入方式会变，但工作流本身不需要重学。

## 工作原理

spec-first 把核心工作流放在 `.spec-first/` 里，再按你启用的平台生成对应的接入文件。

```text
.spec-first/
├── spec/                    # 项目规范、模式和指南
├── tasks/                   # 任务 PRD、上下文文件和状态
├── workspace/               # Journal 和开发者级连续性
├── workflow.md              # 共享工作流规则
└── scripts/                 # 驱动整个流程的脚本
```

根据你启用的平台不同，spec-first 还会生成对应的接入文件，比如 `.claude/`、`.cursor/`、`AGENTS.md`、`.agents/`、`.codex/`、`.kilocode/` 和 `.kiro/`。对 Codex 而言，spec-first 现在会同时安装 `.agents/skills/` 下的项目技能，以及 `.codex/` 下的项目级配置和自定义 agent。

整体流程可以理解成四步：

1. 把标准写进 Spec。
2. 从任务 PRD 开始组织工作。
3. 让 spec-first 为当前任务注入正确的上下文。
4. 用检查、journal 和 worktree 保证质量与连续性。

## Spec 模板与 Marketplace

Spec 默认是空模板——需要根据你的项目技术栈和团队规范来填写。你可以从零开始写，也可以从社区模板起步：

```bash
# 从自定义仓库拉取模板
spec-first init --registry https://github.com/your-org/your-spec-templates
```

浏览可用模板和了解如何发布你自己的模板，请查看 [Spec 模板页面](https://github.com/sunrain520/spec-first/blob/master/marketplace/README.md)。

## 最新进展

- **v0.4.0-beta.8**：增强 CLI 输出、改进技能发现、优化归档和文档链接契约、整合工作区更新。
- **v0.3.6**：任务生命周期 hooks、自定义模板仓库（`--registry`）、父子 subtask、修复 CC v2.1.63+ PreToolUse hook 失效。
- **v0.3.5**：修复 Kilo workflows 删除迁移清单字段名。
- **v0.3.4**：Qoder 平台支持、Kilo workflows 迁移、record-session 任务感知。
- **v0.3.0**：支持平台从 2 个扩展到 10 个、Windows 兼容、远程 Spec 模板、`/spec:brainstorm`。

## 常见问题

<details>
<summary><strong>它和 <code>CLAUDE.md</code>、<code>AGENTS.md</code>、<code>.cursorrules</code> 有什么区别？</strong></summary>

这些文件当然有用，但它们很容易越写越大、越写越散。spec-first 在它们之外补上了结构：分层 Spec、任务上下文、workspace 记忆，以及按平台接入的工作流。

</details>

<details>
<summary><strong>spec-first 只适合 Claude Code 吗？</strong></summary>

不是。spec-first 目前支持 Claude Code、Cursor、OpenCode、iFlow、Codex、Kilo、Kiro、Gemini CLI 和 Antigravity。每个平台的具体接入方式和入口命令，文档站都有单独说明。

</details>

<details>
<summary><strong>是不是每个 Spec 都得手写？</strong></summary>

不需要。很多团队一开始会先让 AI 根据现有代码起草 Spec，再把真正关键的规则和经验手动收紧。spec-first 的价值不在于把所有文档都写满，而在于把高信号规则沉淀下来并持续复用。

</details>

<details>
<summary><strong>团队一起用会不会经常冲突？</strong></summary>

不会。个人 workspace journal 是按开发者隔离的；共享的 Spec 和 Task 则作为仓库内容正常走评审和迭代，和其他工程资产一样管理。

</details>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=sunrain520/spec-first&type=Date)](https://star-history.com/#sunrain520/spec-first&Date)

## 社区与资源

- [官方文档](https://github.com/sunrain520/spec-first/blob/master/docs/trellis-workflow-analysis.md) - 产品说明和工作流分析
- [快速开始](https://github.com/sunrain520/spec-first/blob/master/docs/trellis-first-time-existing-project.md) - 在现有仓库里快速接入
- [支持平台](https://github.com/sunrain520/spec-first/blob/master/docs/多平台集成架构/multi-platform-architecture.md) - 各平台的接入方式和命令差异
- [使用场景](https://github.com/sunrain520/spec-first/blob/master/docs/trellis-existing-project-iteration.md) - 看 spec-first 在真实任务里怎么落地
- [Marketplace](https://github.com/sunrain520/spec-first/blob/master/marketplace/README.md) - 模板包和安装说明
- [GitHub Issues](https://github.com/sunrain520/spec-first/issues) - 提 Bug 或功能建议
- [Discord](https://discord.com/invite/tWcCZ3aRHc) - 加入社区讨论

<a id="wechat-group"></a>

### 微信群

<p align="center">
<img src="assets/wx_link3.jpg" alt="spec-first AI 框架中文社群二维码" width="260" />
</p>

<p align="center">
<a href="https://github.com/sunrain520/spec-first">官方仓库</a> •
<a href="https://github.com/sunrain520/spec-first/blob/master/LICENSE">AGPL-3.0 License</a> •
Built by <a href="https://github.com/mindfold-ai">Mindfold</a>
</p>
