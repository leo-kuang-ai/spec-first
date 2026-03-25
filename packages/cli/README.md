<p align="center">
<strong>A multi-platform AI coding workflow for specs, tasks, and session history</strong><br/>
<sub>Supports Claude Code, Cursor, OpenCode, iFlow, Codex, Kilo, Kiro, Gemini CLI, Antigravity, Qoder, and CodeBuddy.</sub>
</p>

<p align="center">
<a href="./README_CN.md">简体中文</a> •
<a href="https://github.com/sunrain520/spec-first/blob/master/docs/工作流分析.md">Docs</a> •
<a href="https://github.com/sunrain520/spec-first/blob/master/docs/首次接入已有项目流程分析.md">Quick Start</a> •
<a href="https://github.com/sunrain520/spec-first/blob/master/docs/多平台集成架构/multi-platform-architecture.md">Supported Platforms</a> •
<a href="https://github.com/sunrain520/spec-first/blob/master/docs/已存在项目需求迭代流程分析.md">Use Cases</a> •
<a href="https://github.com/sunrain520/spec-first/blob/master/docs/记忆体系分析.md">Memory</a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/spec-first"><img src="https://img.shields.io/npm/v/spec-first.svg?style=flat-square&color=2563eb" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/spec-first"><img src="https://img.shields.io/npm/dw/spec-first?style=flat-square&color=cb3837&label=downloads" alt="npm downloads" /></a>
<a href="https://github.com/sunrain520/spec-first/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-16a34a.svg?style=flat-square" alt="license" /></a>
<a href="https://github.com/sunrain520/spec-first/stargazers"><img src="https://img.shields.io/github/stars/sunrain520/spec-first?style=flat-square&color=eab308" alt="stars" /></a>
<a href="https://github.com/sunrain520/spec-first/blob/master/docs/工作流分析.md"><img src="https://img.shields.io/badge/docs-github%20docs-0f766e?style=flat-square" alt="docs" /></a>
<a href="https://github.com/sunrain520/spec-first/issues"><img src="https://img.shields.io/github/issues/sunrain520/spec-first?style=flat-square&color=e67e22" alt="open issues" /></a>
<a href="https://github.com/sunrain520/spec-first/pulls"><img src="https://img.shields.io/github/issues-pr/sunrain520/spec-first?style=flat-square&color=9b59b6" alt="open PRs" /></a>
<a href="https://deepwiki.com/sunrain520/spec-first"><img src="https://img.shields.io/badge/Ask-DeepWiki-blue?style=flat-square" alt="Ask DeepWiki" /></a>
<a href="https://chatgpt.com/?q=Explain+the+project+sunrain520/spec-first+on+GitHub"><img src="https://img.shields.io/badge/Ask-ChatGPT-74aa9c?style=flat-square&logo=openai&logoColor=white" alt="Ask ChatGPT" /></a>
</p>

## Why spec-first?

| Capability | What it changes |
| --- | --- |
| **Auto-injected specs** | Write conventions once in `.spec-first/spec/`, then let spec-first inject the relevant context into each session instead of repeating yourself. |
| **Task-centered workflow** | Keep PRDs, implementation context, review context, and task status in `.spec-first/tasks/` so AI work stays structured. |
| **Parallel agent execution** | Run multiple AI tasks side by side with git worktrees instead of turning one branch into a traffic jam. |
| **Project memory** | Journals in `.spec-first/workspace/` preserve what happened last time, so each new session starts with real context. |
| **Team-shared standards** | Specs live in the repo, so one person’s hard-won workflow or rule can benefit the whole team. |
| **Multi-platform setup** | Bring the same spec-first structure to 10 AI coding platforms instead of rebuilding your workflow per tool. |

## Quick Start

```bash
# 1. Install spec-first
npm install -g spec-first@latest

# 2. Set global identity (once, works for all projects)
spec-first init --global -u your-name

# 3. Initialize in your repo (uses global identity automatically)
spec-first init --claude
```

### Global Identity Options

```bash
# With language preference (default: zh)
spec-first init --global -u your-name --lang en

# Per-project override (optional)
spec-first init -u other-name
```

**Identity Priority**: Project-level > Global > Git config

### Platform Selection

```bash
# Initialize with specific platforms
spec-first init --cursor --opencode --codex
```

Platform flags can be mixed and matched. Current options include `--cursor`, `--opencode`, `--iflow`, `--codex`, `--kilo`, `--kiro`, `--gemini`, `--antigravity`, `--qoder`, and `--codebuddy`.

For platform-specific setup, entry commands, and upgrade paths, use the docs:
  [Quick Start](https://github.com/sunrain520/spec-first/blob/master/docs/首次接入已有项目流程分析.md) •
  [Supported Platforms](https://github.com/sunrain520/spec-first/blob/master/docs/多平台集成架构/multi-platform-architecture.md) •
  [Real-World Scenarios](https://github.com/sunrain520/spec-first/blob/master/docs/已存在项目需求迭代流程分析.md) •
  [Memory System](https://github.com/sunrain520/spec-first/blob/master/docs/记忆体系分析.md)

## Core Docs

- [Workflow Analysis](https://github.com/sunrain520/spec-first/blob/master/docs/工作流分析.md) - How the init, task, context, and session pipeline fits together
- [First-Time Existing Project](https://github.com/sunrain520/spec-first/blob/master/docs/首次接入已有项目流程分析.md) - What to do before the first real task in an existing repo
- [Memory System](https://github.com/sunrain520/spec-first/blob/master/docs/记忆体系分析.md) - How specs, tasks, workspaces, and journals form recoverable memory
- [Existing Project Iteration](https://github.com/sunrain520/spec-first/blob/master/docs/已存在项目需求迭代流程分析.md) - The task-driven flow for day-to-day delivery

## Use Cases

### Teach AI your project once

Put coding standards, file structure rules, review habits, and workflow preferences into Markdown specs. spec-first loads the relevant pieces automatically so you do not have to re-explain the repo every time.

### Run multiple AI tasks in parallel

Use git worktrees and spec-first task structure to split work cleanly across agents. Different tasks can move forward at the same time without stepping on each other’s branches or local state.

### Turn project history into usable memory

Task PRDs, checklists, and workspace journals make previous decisions available to the next session. Instead of starting from blank context, the next agent can pick up where the last one left off.

### Keep one workflow across tools

If your team uses more than one AI coding tool, spec-first gives you one shared structure for specs, tasks, and process. The platform-specific wiring changes, but the workflow stays recognizable.

## How It Works

spec-first keeps the core workflow in `.spec-first/` and generates the platform-specific entry points you need around it.

```text
.spec-first/
├── spec/                    # Project standards, patterns, and guides
├── tasks/                   # Task PRDs, context files, and status
├── workspace/               # Journals and developer-specific continuity
├── workflow.md              # Shared workflow rules
└── scripts/                 # Utilities that power the workflow
```

Depending on the platforms you enable, spec-first also creates tool-specific integration files such as `.claude/`, `.cursor/`, `AGENTS.md`, `.agents/`, `.codex/`, `.kilocode/`, and `.kiro/`. For Codex, spec-first now installs both project skills under `.agents/skills/` and project-scoped config/custom agents under `.codex/`.

At a high level, the workflow is simple:

1. Define standards in specs. `spec-first init` creates the initial `.spec-first/spec/` skeleton; later learning is written back with `$update-spec` / `/spec:update-spec`.
2. Start or refine work from a task PRD.
3. Let spec-first inject the right context for the current task.
4. Use checks, journals, and worktrees to keep quality and continuity intact.

## Spec Templates & Marketplace

Specs ship as empty templates by default — they are meant to be customized for your project's stack and conventions. You can fill them from scratch, or start from a community template:

```bash
# Fetch templates from a custom registry
spec-first init --registry https://github.com/your-org/your-spec-templates
```

Browse available templates and learn how to publish your own on the [Spec Templates page](https://github.com/sunrain520/spec-first/blob/master/marketplace/README.md).

`spec-first update` upgrades the framework and platform wiring. It does not rewrite your project `spec/` files; knowledge capture happens through `$update-spec` / `/spec:update-spec`.

## FAQ

<details>
<summary><strong>How is this different from <code>CLAUDE.md</code>, <code>AGENTS.md</code>, or <code>.cursorrules</code>?</strong></summary>

Those files are useful, but they tend to become monolithic. spec-first adds structure around them: layered specs, task context, workspace memory, and platform-aware workflow wiring.

</details>

<details>
<summary><strong>Is spec-first only for Claude Code?</strong></summary>

No. spec-first currently supports Claude Code, Cursor, OpenCode, iFlow, Codex, Kilo, Kiro, Gemini CLI, and Antigravity. The detailed setup and entry command for each tool lives in the supported platforms guide.

</details>

<details>
<summary><strong>Do I have to write every spec file manually?</strong></summary>

No. Many teams start by letting AI draft specs from existing code and then tighten the important parts by hand. spec-first works best when you keep the high-signal rules explicit and versioned.

</details>

<details>
<summary><strong>Can teams use this without constant conflicts?</strong></summary>

Yes. Personal workspace journals stay separate per developer, while shared specs and tasks stay in the repo where they can be reviewed and improved like any other project artifact.

</details>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=sunrain520/spec-first&type=Date)](https://star-history.com/#sunrain520/spec-first&Date)

## Community & Resources

- [Official Docs](https://github.com/sunrain520/spec-first/blob/master/docs/工作流分析.md) - Product docs and workflow analysis
- [Quick Start](https://github.com/sunrain520/spec-first/blob/master/docs/首次接入已有项目流程分析.md) - First-time setup for existing projects
- [Supported Platforms](https://github.com/sunrain520/spec-first/blob/master/docs/多平台集成架构/multi-platform-architecture.md) - Platform-specific setup and command details
- [Memory System](https://github.com/sunrain520/spec-first/blob/master/docs/记忆体系分析.md) - How project knowledge, tasks, and journals stay recoverable
- [Real-World Scenarios](https://github.com/sunrain520/spec-first/blob/master/docs/已存在项目需求迭代流程分析.md) - See how the workflow plays out in practice
- [Marketplace](https://github.com/sunrain520/spec-first/blob/master/marketplace/README.md) - Template packs and installation guidance
- [GitHub Issues](https://github.com/sunrain520/spec-first/issues) - Report bugs or request features

<p align="center">
<a href="https://github.com/sunrain520/spec-first">Official Repository</a> •
<a href="https://github.com/sunrain520/spec-first/blob/master/LICENSE">AGPL-3.0 License</a> •
Built by <a href="https://github.com/sunrain520">sunrain520</a>
</p>
