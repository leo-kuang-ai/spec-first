<div align="center">

# 🚀 Spec-First

**A Spec-First AI Coding Workflow CLI for Claude Code and Codex**

*候选发散 → 需求澄清 → 方案规划 → 实施执行 → 结构化评审 → 知识沉淀*

<p>
  <a href="./docs/05-用户手册/README.md">📖 用户手册</a>
  <span>&nbsp;•&nbsp;</span>
  <a href="./docs/05-用户手册/01-快速开始.md">⚡ 快速开始</a>
  <span>&nbsp;•&nbsp;</span>
  <a href="./docs/05-用户手册/02-核心概念.md">💡 核心概念</a>
  <span>&nbsp;•&nbsp;</span>
  <a href="./docs/05-用户手册/05-最佳实践.md">🏆 最佳实践</a>
</p>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![license][license-src]][license-href]
[![github stars][stars-src]][stars-href]
[![docs][docs-src]][docs-href]
[![github issues][issues-src]][issues-href]
[![github prs][prs-src]][prs-href]
[![Ask DeepWiki][deepwiki-src]][deepwiki-href]
[![Ask ChatGPT][chatgpt-src]][chatgpt-href]

</div>

---

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./docs/assets/svg/spec-first-overview.svg">
    <source media="(prefers-color-scheme: light)" srcset="./docs/assets/svg/spec-first-overview.svg">
    <img alt="Spec-First Overview" src="./docs/assets/svg/spec-first-overview.svg">
  </picture>
</p>

---

## ✨ Why Spec-First

<table>
<tr>
<td width="50%">

### 🎯 问题

大多数 AI 开发流的问题不在模型，而在**工程边界不稳定**：

- ❌ 需求没有被明确记录
- ❌ 计划和实现容易脱节
- ❌ 评审没有结构化结论
- ❌ 好的经验无法沉淀为下一轮输入

</td>
<td width="50%">

### 💡 解决方案

Spec-First 把 AI 辅助开发从**一次性对话**，收敛成一套**稳定、可追踪、可复用**的工程系统：

- ✅ Claude 的 `/spec:*` 命令与 Codex 的 `$spec-*` skills
- ✅ 前置 ideate + 五阶段闭环工作流
- ✅ 47 个专业代理审查
- ✅ 知识沉淀与自动发现

</td>
</tr>
</table>

---

## 🏗️ What It Is

> **Prompt Engineering ⊂ Context Engineering ⊂ Harness Engineering**

Spec-First 采用三层工程边界设计：

<p align="center">
  <img src="./docs/assets/svg/spec-first-engineering-layers-deep.svg" alt="Three Engineering Layers">
</p>

| 层级 | 职责 | 数量 |
|------|------|------|
| **Commands** | 稳定入口 | 6 个命令入口 |
| **Skills** | 编排阶段流程 | 41 个技能 |
| **Agents** | 提供专业能力 | 47 个代理 |
| **State** | 资产版本管理 | 可更新、可恢复、可清理 |

---

## 🔄 Core Workflow

<p align="center">
  <img src="./docs/assets/svg/spec-first-workflow.svg" alt="Workflow">
</p>

| Stage | Claude Code | Codex | 职责 | 产出物 |
|:-----:|-------------|-------|------|--------|
| 💡 | `/spec:ideate` | `$spec-ideate` | 发散候选、评估方向 | `docs/ideation/*.md` |
| 🧠 | `/spec:brainstorm` | `$spec-brainstorm` | 澄清问题、控制范围、明确验收标准 | `docs/brainstorms/*.md` |
| 📋 | `/spec:plan` | `$spec-plan` | 收集上下文、拆解任务、识别风险 | `docs/plans/*.md` |
| ⚡ | `/spec:work` | `$spec-work` | 按计划实施、补齐测试和文档 | Code + Tests |
| 🔎 | `/spec:review` | `$spec-review` | 结构化审查、阻断项、结论 | Review Report |
| 📚 | `/spec:compound` | `$spec-compound` | 经验提炼、知识沉淀 | `docs/solutions/**/*.md` |

---

## 🛠️ Skills & Agents

### 核心工作流 Skills

| Skill | 描述 |
|-------|------|
| `spec-ideate` | 发散候选并筛选值得继续探索的方向 |
| `spec-brainstorm` | 探索需求和方案，生成需求文档 |
| `spec-plan` | 将需求转化为实现计划 |
| `spec-work` | 执行工作计划 |
| `spec-review` | 结构化代码审查（多角色代理） |
| `spec-compound` | 知识捕获和文档化 |

<details>
<summary><b>📦 辅助 Skills (36个)</b></summary>

| 分类 | Skills |
|------|--------|
| **Git** | `git-commit`, `git-commit-push-pr`, `git-worktree`, `git-clean-gone-branches` |
| **开发** | `agent-browser`, `reproduce-bug`, `test-browser`, `test-xcode`, `feature-video` |
| **文档** | `document-review`, `changelog`, `onboarding`, `proof` |
| **任务** | `todo-create`, `todo-resolve`, `todo-triage` |
| **设计** | `frontend-design`, `design-iterator`, `figma-design-sync` |
| **其他** | `setup`, `lfg`, `slfg`, `rclone`, `deploy-docs` |

</details>

<details>
<summary><b>🤖 审查代理 (47个)</b></summary>

| 分类 | 代理 |
|------|------|
| **Always-on (6)** | `correctness-reviewer`, `testing-reviewer`, `maintainability-reviewer`, `project-standards-reviewer`, `code-simplicity-reviewer`, `pattern-recognition-specialist` |
| **安全 (3)** | `security-reviewer`, `security-sentinel`, `security-lens-reviewer` |
| **性能 (2)** | `performance-reviewer`, `performance-oracle` |
| **数据 (3)** | `data-integrity-guardian`, `data-migrations-reviewer`, `schema-drift-detector` |
| **技术栈 (4)** | `dhh-rails-reviewer`, `kieran-rails-reviewer`, `kieran-python-reviewer`, `kieran-typescript-reviewer` |
| **架构 (3)** | `architecture-strategist`, `api-contract-reviewer`, `reliability-reviewer` |
| **研究 (3)** | `git-history-analyzer`, `best-practices-researcher`, `issue-intelligence-analyst` |

</details>

---

## 📦 Install

```bash
# 从 npm 安装
npm install -g spec-first

# 验证安装
spec-first doctor
spec-first -v
```

`spec-first -v` 会稳定输出欢迎页和版本信息。安装阶段的 `postinstall` 提示不作为对外承诺，是否显示取决于 npm 的生命周期输出策略。

<details>
<summary><b>🔧 从源码安装</b></summary>

```bash
git clone https://github.com/sunrain520/spec-first.git
cd spec-first
npm pack
npm install -g ./spec-first-<version>.tgz
hash -r  # 刷新 shell 缓存
```

</details>

---

## ⚡ Quick Start

```bash
# 1️⃣ 检查环境与平台状态
spec-first doctor
# 或显式检查某个平台
spec-first doctor --claude
spec-first doctor --codex
spec-first -v

# 2️⃣ 在目标项目初始化运行时
spec-first init --claude
# 或
spec-first init --codex

# 或者显式指定开发者信息
spec-first init --claude -u <name> --lang <zh|en>
spec-first init --codex -u <name> --lang <zh|en>

# 3️⃣ 启动目标平台
claude   # Claude Code
# 或
codex    # Codex
```

如果你没有传 `-u/--user`，`spec-first init` 会优先回退到全局 `~/.spec-first/.developer`，再回退到 `git config user.name`。
初始化成功后，项目内会生成 `.claude/spec-first/.developer` 或 `.codex/spec-first/.developer`，记录开发者名称、语言偏好、初始化时间和 CLI 版本。

现在你可以在项目里使用：

```bash
# Claude Code
/spec:ideate      # 💡 发散候选
/spec:brainstorm   # 🧠 澄清需求
/spec:plan         # 📋 生成计划
/spec:work         # ⚡ 执行实现
/spec:review       # 🔎 结构化评审
/spec:compound     # 📚 知识沉淀

# Codex
$spec-ideate      # 💡 发散候选
$spec-brainstorm   # 🧠 澄清需求
$spec-plan         # 📋 生成计划
$spec-work         # ⚡ 执行实现
$spec-review       # 🔎 结构化评审
$spec-compound     # 📚 知识沉淀
```

---

## 🏃 Runtime Model

<p align="center">
  <img src="./docs/assets/svg/spec-first-runtime-assets.svg" alt="Runtime Assets">
</p>

**发布包 → 项目运行时**

```
spec-first/                        .claude/ or .codex/
├── bin/           CLI 入口        ├── commands/spec/*.md       命令入口
├── src/           CLI 源码        ├── skills/*                 流程层
├── templates/     命令模板   ──►  ├── agents/*                 能力层
├── skills/        41个技能        ├── spec-first/state.json    状态追踪
├── agents/        47个代理        └── spec-first/.developer    开发者身份
└── .claude-plugin/ 插件清单
```

---

## 💻 CLI Reference

| 命令 | 参数 | 描述 |
|------|------|------|
| `spec-first doctor` | `--claude` or `--codex` | 检查环境和项目状态；无参数时自动检测当前项目中的已初始化平台 |
| `spec-first init` | `--claude` or `--codex`, `-u`, `--lang` | 同步命令、技能、代理与项目开发者元数据到项目 |
| `spec-first clean` | `--claude` or `--codex` | 移除受管资产，保留自定义内容 |

---

## 🎯 Use Cases

<table>
<tr>
<td width="50%">

### 🎓 教 AI 理解项目

通过 Brainstorm 阶段澄清需求、控制范围，让 AI 在明确的边界内工作。

### 🔍 多角色代码审查

`/spec:review` 调用 47 个代理从不同维度审查：
- 安全性（SQL 注入、XSS）
- 性能（查询效率）
- 可维护性（复杂度）

</td>
<td width="50%">

### 📚 知识沉淀与复用

`/spec:compound` 将已解决的问题提炼成可搜索的文档，自动发现相关经验。

### ⚡ 并行开发

配合 `git-worktree` skill，不同任务可以在独立 worktree 中并行推进。

</td>
</tr>
</table>

---

## ❓ FAQ

<details>
<summary><b>Spec-First 和直接用 Claude Code / Codex 有什么区别？</b></summary>
<br/>

Claude Code 和 Codex 都是强大的 AI 编程助手，但默认更偏向“一次性对话”模式。Spec-First 把工作流固化下来：**需求被记录、计划可追踪、评审有结论、经验可复用**。

</details>

<details>
<summary><b>为什么要用五阶段而不是直接让 AI 写代码？</b></summary>
<br/>

大多数 AI 开发流的问题不在模型，而在工程边界不稳定：需求没有被明确记录、计划和实现容易脱节、评审没有结构化结论、好的经验无法沉淀。**五阶段解决的是这四件事**。

</details>

<details>
<summary><b>支持哪些平台？</b></summary>
<br/>

当前版本已支持 **Claude Code** 和 **Codex**。更多平台支持（Cursor、OpenCode、Gemini CLI 等）仍在规划中。

</details>

<details>
<summary><b>47 个代理都会在每次审查时运行吗？</b></summary>
<br/>

**不是**。有 6 个 Always-on 代理会始终运行，其他代理根据代码变更内容条件性触发（如涉及 API 才触发 `api-contract-reviewer`）。

</details>

---

## 📚 Documentation

| 文档 | 描述 |
|------|------|
| [用户手册](./docs/05-用户手册/README.md) | 完整用户指南 |
| [快速开始](./docs/05-用户手册/01-快速开始.md) | 5 分钟上手 |
| [核心概念](./docs/05-用户手册/02-核心概念.md) | 理解工作流 |
| [完整示例](./docs/05-用户手册/03-完整示例.md) | 端到端演示 |
| [常见问题](./docs/05-用户手册/04-常见问题.md) | FAQ 汇总 |
| [最佳实践](./docs/05-用户手册/05-最佳实践.md) | 经验总结 |

---

## 📊 Stats

<p align="center">
  <a href="https://npmtrends.com/spec-first">
    <img src="https://img.shields.io/npm/dw/spec-first?style=flat-square&label=weekly&color=2563eb" alt="npm weekly downloads">
  </a>
  <a href="https://npmtrends.com/spec-first">
    <img src="https://img.shields.io/npm/dm/spec-first?style=flat-square&label=monthly&color=2563eb" alt="npm monthly downloads">
  </a>
  <a href="https://npmtrends.com/spec-first">
    <img src="https://img.shields.io/npm/dy/spec-first?style=flat-square&label=yearly&color=2563eb" alt="npm yearly downloads">
  </a>
  <a href="https://npmtrends.com/spec-first">
    <img src="https://img.shields.io/npm/dt/spec-first?style=flat-square&label=total&color=2563eb" alt="npm total downloads">
  </a>
  <a href="https://npmtrends.com/spec-first">
    <img src="https://img.shields.io/badge/📈_Trends-npmtrends.com-2563eb?style=flat-square" alt="View npm trends">
  </a>
  <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
  <a href="https://github.com/sunrain520/spec-first/stargazers">
    <img src="https://img.shields.io/github/stars/sunrain520/spec-first?style=flat-square&color=eab308" alt="GitHub stars">
  </a>
  <a href="https://github.com/sunrain520/spec-first/network/members">
    <img src="https://img.shields.io/github/forks/sunrain520/spec-first?style=flat-square&color=8b5cf6" alt="GitHub forks">
  </a>
  <a href="https://github.com/sunrain520/spec-first/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/sunrain520/spec-first?style=flat-square&color=22c55e" alt="GitHub contributors">
  </a>
  <a href="https://github.com/sunrain520/spec-first/issues">
    <img src="https://img.shields.io/github/issues/sunrain520/spec-first?style=flat-square&color=e67e22" alt="GitHub issues">
  </a>
  <a href="https://star-history.com/#sunrain520/spec-first&Date">
    <img src="https://img.shields.io/badge/📊_History-star--history.com-eab308?style=flat-square" alt="View star history">
  </a>
</p>

### Star History

<p align="center">
  <a href="https://star-history.com/#sunrain520/spec-first&Date">
    <img src="https://api.star-history.com/svg?repos=sunrain520/spec-first&type=Date" alt="Star History Chart">
  </a>
</p>

---

## 🤝 Contributing

欢迎提交 Issue 和 Pull Request！

```bash
git clone https://github.com/sunrain520/spec-first.git
cd spec-first
npm install
npm test
```

---

## 📄 License

[MIT](./LICENSE) © [sunrain520](https://github.com/sunrain520)

---

<div align="center">

**[⬆ 返回顶部](#-spec-first)**

Made with ❤️ by [sunrain520](https://github.com/sunrain520)

</div>

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/spec-first.svg?style=flat-square&color=2563eb
[npm-version-href]: https://www.npmjs.com/package/spec-first
[npm-downloads-src]: https://img.shields.io/npm/dw/spec-first.svg?style=flat-square&color=cb3837&label=downloads
[npm-downloads-href]: https://npmtrends.com/spec-first
[license-src]: https://img.shields.io/badge/license-MIT-16a34a.svg?style=flat-square
[license-href]: https://github.com/sunrain520/spec-first/blob/master/LICENSE
[stars-src]: https://img.shields.io/github/stars/sunrain520/spec-first.svg?style=flat-square&color=eab308
[stars-href]: https://github.com/sunrain520/spec-first/stargazers
[docs-src]: https://img.shields.io/badge/docs-github%20docs-0f766e.svg?style=flat-square
[docs-href]: https://github.com/sunrain520/spec-first/blob/master/docs/05-用户手册/README.md
[issues-src]: https://img.shields.io/github/issues/sunrain520/spec-first.svg?style=flat-square&color=e67e22
[issues-href]: https://github.com/sunrain520/spec-first/issues
[prs-src]: https://img.shields.io/github/issues-pr/sunrain520/spec-first.svg?style=flat-square&color=9b59b6
[prs-href]: https://github.com/sunrain520/spec-first/pulls
[deepwiki-src]: https://img.shields.io/badge/Ask-DeepWiki-blue?style=flat-square
[deepwiki-href]: https://deepwiki.com/sunrain520/spec-first
[chatgpt-src]: https://img.shields.io/badge/Ask-ChatGPT-74aa9c?style=flat-square&logo=openai&logoColor=white
[chatgpt-href]: https://chatgpt.com/?q=Explain+the+project+sunrain520/spec-first+on+GitHub

<!-- Stats -->
[npm-weekly-src]: https://img.shields.io/npm/dw/spec-first?style=flat-square&label=weekly&color=2563eb
[npm-monthly-src]: https://img.shields.io/npm/dm/spec-first?style=flat-square&label=monthly&color=2563eb
[npm-yearly-src]: https://img.shields.io/npm/dy/spec-first?style=flat-square&label=yearly&color=2563eb
[npm-total-src]: https://img.shields.io/npm/dt/spec-first?style=flat-square&label=total&color=2563eb
[npm-trends-href]: https://npmtrends.com/spec-first

[forks-src]: https://img.shields.io/github/forks/sunrain520/spec-first?style=flat-square&color=8b5cf6
[forks-href]: https://github.com/sunrain520/spec-first/fork
[contributors-src]: https://img.shields.io/github/contributors/sunrain520/spec-first?style=flat-square&color=22c55e
[contributors-href]: https://github.com/sunrain520/spec-first/graphs/contributors

[star-history-href]: https://star-history.com/#sunrain520/spec-first&Date
