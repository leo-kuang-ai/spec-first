# Platform Compatibility Reference

Detailed guide on spec-first feature availability across 11 AI coding platforms.

---

## Overview

spec-first v0.4.0 supports **11 platforms**. The key differentiator is **hook support** — Claude Code and iFlow have Python hook systems that enable automatic context injection and quality enforcement. Codex has optional SessionStart hooks. Other platforms use commands/skills with manual context loading.

| Platform    | Config Directory        | CLI Flag        | Hooks       | Command Format   |
| ----------- | ----------------------- | --------------- | ----------- | ---------------- |
| Claude Code | `.claude/`              | (default)       | ✅ Full     | Markdown         |
| iFlow       | `.iflow/`               | `--iflow`       | ✅ Full     | Markdown         |
| Cursor      | `.cursor/`              | `--cursor`      | ❌          | Markdown         |
| OpenCode    | `.opencode/`            | `--opencode`    | ❌          | Markdown         |
| Codex       | `.codex/`               | `--codex`       | ⚠️ Optional | Skills + TOML    |
| Kilo        | `.kilocode/`            | `--kilo`        | ❌          | Workflows        |
| Kiro        | `.kiro/skills/`         | `--kiro`        | ❌          | Skills           |
| Gemini CLI  | `.gemini/`              | `--gemini`      | ❌          | TOML             |
| Antigravity | `.agent/workflows/`     | `--antigravity` | ❌          | Markdown         |
| Qoder       | `.qoder/`               | `--qoder`       | ❌          | Skills           |
| CodeBuddy   | `.codebuddy/`           | `--codebuddy`   | ❌          | Markdown (nested)|

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TRELLIS FEATURE LAYERS                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    LAYER 4: AUTOMATION                              │ │
│  │  Hooks, Ralph Loop, Auto-injection, Multi-Session                  │ │
│  │  ─────────────────────────────────────────────────────────────────│ │
│  │  Platform: Claude Code + iFlow (full), Codex (SessionStart only)  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│  ┌────────────────────────────────▼───────────────────────────────────┐ │
│  │                    LAYER 3: AGENTS                                  │ │
│  │  Agent definitions, Agent tool, Subagent invocation                │ │
│  │  ─────────────────────────────────────────────────────────────────│ │
│  │  Platform: Claude Code + iFlow (full), Codex (TOML agents),       │ │
│  │            others (manual)                                         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│  ┌────────────────────────────────▼───────────────────────────────────┐ │
│  │                    LAYER 2: SHARED AGENT SKILLS                     │ │
│  │  .agents/skills/ (agentskills.io open standard)                    │ │
│  │  ─────────────────────────────────────────────────────────────────│ │
│  │  Platform: Codex + universal agent CLIs (Kimi, Amp, Cline, etc.)  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│  ┌────────────────────────────────▼───────────────────────────────────┐ │
│  │                    LAYER 1: PERSISTENCE                             │ │
│  │  Workspace, Tasks, Specs, Commands/Skills, JSONL files             │ │
│  │  ─────────────────────────────────────────────────────────────────│ │
│  │  Platform: ALL 11 (file-based, portable)                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Feature Breakdown

### Layer 1: Persistence (All 11 Platforms)

These features work on all platforms because they're file-based.

| Feature            | Location                 | Description                               |
| ------------------ | ------------------------ | ----------------------------------------- |
| Workspace system   | `.spec-first/workspace/`    | Journals, session history                 |
| Task system        | `.spec-first/tasks/`        | Task tracking, subtasks, lifecycle hooks  |
| Spec system        | `.spec-first/spec/`         | Coding guidelines (monorepo per-package)  |
| Config system      | `.spec-first/config.yaml`   | Packages, hooks, update.skip, spec_scope  |
| Commands/Skills    | Platform-specific dirs   | Command prompts in each platform's format |
| JSONL context      | `*.jsonl` in task dirs   | Context file lists                        |
| Developer identity | `.spec-first/.developer`    | Who is working                            |
| Current task       | `.spec-first/.current-task` | Active task pointer                       |

### Layer 2: Shared Agent Skills

| Feature            | Location               | Description                                |
| ------------------ | ---------------------- | ------------------------------------------ |
| Shared skills      | `.agents/skills/`      | agentskills.io standard, SKILL.md format   |

Readable by Codex and any universal agent CLI that follows the agentskills.io open standard.

### Layer 3: Agents (Claude Code + iFlow Full, Codex TOML, Others Manual)

| Feature            | Claude Code / iFlow            | Codex                          | Other Platforms           |
| ------------------ | ------------------------------ | ------------------------------ | ------------------------- |
| Agent definitions  | Auto-loaded via `--agent` flag | TOML agents in `.codex/agents/` | Read agent files manually |
| Agent tool         | Full subagent support          | Built-in agent support         | No Agent tool             |
| Context injection  | Automatic via hooks            | Manual / SessionStart only     | Manual copy-paste         |
| Agent restrictions | Enforced by definition         | TOML `sandbox_mode`            | Honor code only           |

### Layer 4: Automation (Claude Code + iFlow Full, Codex Partial)

| Feature                | Dependency             | Claude Code / iFlow | Codex             |
| ---------------------- | ---------------------- | ------------------- | ----------------- |
| SessionStart hook      | `settings.json`        | ✅ Full             | ⚠️ Optional       |
| PreToolUse hook        | Hook system            | ✅ Full             | ❌ None           |
| SubagentStop hook      | Hook system            | ✅ Full             | ❌ None           |
| Auto context injection | PreToolUse:Agent       | ✅ Full             | ❌ None           |
| Ralph Loop             | SubagentStop:check     | ✅ Full             | ❌ None           |
| Multi-Session          | CLI + hooks            | ✅ Full             | ❌ None           |

---

## Platform Usage Guides

### Claude Code + iFlow (Full Support)

All features work automatically. Hooks provide context injection and quality enforcement.

```bash
# Initialize
spec init -u your-name           # Claude Code (default)
spec init --iflow -u your-name   # iFlow
```

### Cursor

```bash
spec init --cursor -u your-name
```

- **Works**: Workspace, tasks, specs, commands (read via `.cursor/commands/spec-*.md`)
- **Doesn't work**: Hooks, auto-injection, Ralph Loop, Multi-Session
- **Workaround**: Manually read spec files at session start

### OpenCode

```bash
spec init --opencode -u your-name
```

- **Works**: Workspace, tasks, specs, agents, commands
- **Note**: Full subagent context injection requires [oh-my-opencode](https://github.com/nicepkg/oh-my-opencode). Without it, agents use Self-Loading fallback.

### Codex

```bash
spec init --codex -u your-name
```

- Platform-specific skills in `.codex/skills/` + shared skills in `.agents/skills/`
- TOML agent definitions in `.codex/agents/` (implement, research, check)
- Optional SessionStart hook (requires `codex_hooks = true` in `~/.codex/config.toml`)
- Use `$start`, `$finish-work`, `$brainstorm` etc. to invoke

### Qoder

```bash
spec init --qoder -u your-name
```

- Skills-based platform with templates at `.qoder/skills/{name}/SKILL.md`
- Uses YAML frontmatter for skill metadata

### CodeBuddy (Tencent Cloud)

```bash
spec init --codebuddy -u your-name
```

- Nested slash commands at `.codebuddy/commands/spec/{name}.md`
- 12 command templates included

### Kilo, Kiro, Gemini CLI, Antigravity

```bash
spec init --kilo -u your-name
spec init --kiro -u your-name
spec init --gemini -u your-name
spec init --antigravity -u your-name
```

- Each platform uses its native command format
- Kilo uses workflows (`.kilocode/workflows/`)
- Kiro uses skills (`.kiro/skills/{name}/SKILL.md`)
- Gemini uses TOML commands (`.gemini/commands/spec/{name}.toml`)
- Antigravity uses workflows (`.agent/workflows/`)
- Core file-based systems work the same across all platforms

---

## Version Compatibility Matrix

| spec-first Version   | Platforms Supported             |
| ----------------- | ------------------------------- |
| 0.2.x             | Claude Code, Cursor             |
| 0.3.0             | 9 platforms (+ OpenCode through Antigravity) |
| 0.3.4             | 10 platforms (+ Qoder)          |
| 0.4.0-beta.6      | 11 platforms (+ CodeBuddy)      |

---

## Checking Your Platform

### Claude Code

```bash
claude --version
cat .claude/settings.json | grep -A 5 '"hooks"'
```

### Other Platforms

```bash
# Check if platform config directory exists
ls -la .cursor/ .opencode/ .iflow/ .codex/ .agents/ .kilocode/ .kiro/ .gemini/ .agent/ .qoder/ .codebuddy/ 2>/dev/null
```

### Determining Support Level

```
Does the platform have hook support?
├── YES (Claude Code, iFlow) → Full spec-first support
├── PARTIAL (Codex) → SessionStart hook + TOML agents + shared skills
└── NO  (all others) → Partial support
         ├── Can read files → Layer 1 works
         └── Has agent system → Layer 3 partial
```
