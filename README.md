# Spec-First — Spec-Driven AI Development Workflow Engine

**Bring structure and node-based execution control to AI-assisted software delivery.**

> Runtime note: the current workflow has shifted to `FeatureState / NodeState`, `transition`, `readiness-check`, and node-local checklists. Older `gate / id / trace / document-links` commands are historical and no longer part of the primary CLI path.

[![Version](https://img.shields.io/badge/version-v1.1.4-blue)](https://www.npmjs.com/package/spec-first)
[![npm downloads](https://img.shields.io/npm/dm/spec-first)](https://www.npmjs.com/package/spec-first)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-brightgreen)](LICENSE)

📖 [中文文档 README-CN.md](./README-CN.md)

---

## The Problem

AI coding assistants (Claude Code, Codex, Cursor) are powerful — but stateless. Every new session loses the context of previous decisions. Code ships without validation. Requirement changes become untraceable. Team members use AI inconsistently, making reviews unreliable.

Spec-First solves this at the process level, not the prompt level:

| Symptom | Root Cause | Spec-First Solution |
|---|---|---|
| AI generates code inconsistent with earlier decisions | No persistent semantic context between sessions | `specs/<featureId>/` directory as the single source of truth across all sessions |
| Unvalidated AI output reaches production | No enforcement layer between generation and commit | Node-based state machine with node-local checklists and readiness checks |
| "Why was this written this way?" is unanswerable | No artifact linkage from requirements to implementation | Node summaries, task plans, and stage artifacts keep the delivery story readable |
| Every developer prompts AI differently | No shared execution protocol | 20 Skills with a unified 6-phase execution model (P0–P5) |

---

## How It Works

Spec-First wraps your AI workflow in a structured state machine. A feature begins at `00_init` and advances when the current node is complete and the target node is ready.

```
[Idea] → 00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done
           ↓            ↓            ↓           ↓            ↓             ↓             ↓             ↓
                                          09_cancelled  ←  (cancellable from any active stage)
```

At each stage, a **Skill** guides the AI through a deterministic 6-phase protocol:

```
P0  LOCATE       — Resolve the active feature and validate the current stage
P1  CONTEXT      — Load the spec directory, prior artifacts, and run history
P2  GENERATE     — AI inference produces a structured draft artifact
P3  CONFIRM      — User reviews, iterates, or rejects (multi-round supported)
P4  WRITE        — Finalized artifact is written and node summary is updated
P5  SIDE EFFECTS — Sync runtime state, refresh readiness notice, update surrounding notices
```

This means every AI action is **locatable, context-aware, confirmable, and auditable**.

## First Principle

Spec-First is fundamentally a **Skill-led system**, not a CLI-led code generator.

- Skills define the workflow, agent orchestration, constraints, and success criteria
- CLI commands provide the minimal support layer: bootstrap, persistence, validation, and host integration
- For project cognition tasks such as `first`, the desired direction is: Skill-led multi-agent orchestration first, local scripts second

The practical boundary is simple: runtime artifacts are machine inputs and must remain contract-stable; human-facing docs may be generated more freely as long as they do not become a hidden source of truth for later Skills.

---

## Quick Start

### Prerequisites

- Node.js ≥ 20.0.0
- npm or pnpm
- Git
- Claude Code or Codex *(optional — required for Skill integration)*

### Install

```bash
npm install -g spec-first@latest
spec-first doctor          # Verify installation and host integration
```

### Initialize a Feature

```bash
cd /path/to/your-project

# --mode N  = New feature  |  --mode I = Incremental improvement
# --size S  = Small        |  --size M = Medium  |  --size L = Large
spec-first init --feat AUTH --mode N --size M --platforms web,node
```

### Run the Full Development Cycle (Claude Code / Codex)

```bash
/spec-first:onboarding    # First time? Start here
/spec-first:init          # Initialize feature workspace
/spec-first:spec          # Author requirements spec (FR + acceptance criteria)
/spec-first:design        # Technical design (DS + API contracts)
/spec-first:task          # Break design into tracked tasks
/spec-first:code          # Implement tasks with spec-linked commits
/spec-first:verify        # Run stage verification against acceptance criteria
/spec-first:archive       # Retrospective and close-out
```

### Requirement Focus

When an already reviewed requirement needs to be narrowed to a single owner's delivery boundary, use:

```bash
/spec-first:focus-requirements
```

It compresses the original requirement into an owner-scoped PRD, side requirements, and a handoff summary, with emphasis on:

- `In Scope / Out of Scope`
- dependency boundaries
- verifiable acceptance criteria
- the minimum context needed for handoff

### Day-to-Day CLI

```bash
spec-first feature current          # Which feature am I on?
spec-first stage current            # Which stage is active?
spec-first status                   # Node summary, task progress, and next step
spec-first transition <featureId>   # Move to the next node
spec-first validate format <featureId> # Validate artifact format
spec-first validate links <featureId>  # Validate document links when present
```

---

## Core Features

### Stage State Machine (8 Active + 2 Terminal)

Every feature advances through eight active stages — each with blocking gate conditions — and terminates in one of two terminal states. Terminal states are irreversible by design.

| Stage | Deliverable | Entry via |
|---|---|---|
| `00_init` | Feature workspace, config | `spec-first init` |
| `01_specify` | Requirements spec (FR + AC) | `/spec-first:spec` |
| `02_design` | Technical design (DS + API) | `/spec-first:design` |
| `03_plan` | Task list with traceability IDs | `/spec-first:task` |
| `04_implement` | Spec-linked code commits | `/spec-first:code` |
| `05_verify` | Test cases and document-link evidence | `/spec-first:verify` |
| `06_wrap_up` | Retrospective document | `/spec-first:archive` |
| `07_release` | Smoke test report + release note | `spec-first done` |
| `08_done` | *(terminal)* | `spec-first done` |
| `09_cancelled` | *(terminal)* | `spec-first stage cancel` |

### Node Readiness & Validation

`status` shows the current node summary and next suggested action. `transition` moves to the next node. `validate` handles artifact format and document-link checks when those artifacts are present.

```bash
spec-first status                             # Show node summary and next step
spec-first transition <featureId>             # Advance to the next node
spec-first validate format <featureId>        # Validate artifact format
spec-first validate links <featureId>         # Validate document-link YAML
```

### Full-Lifecycle Traceability

Every artifact is tagged with a typed traceability ID, forming a navigable chain from business requirements to deployed code:

```
FR · DS · TASK · TC · RFC                  ← primary delivery chain
REQ · SYS · ARCH · MOD                    ← requirements & architecture
ATP · STP · ITP · UTP                     ← test planning
Feature                                    ← feature-level tracking
```

14 ID types in total. Every ID is registered, searchable, and validated.

```bash
spec-first status                    # Inspect node and task progress
spec-first transition <featureId>     # Advance the feature node
spec-first validate links <featureId> # Validate document-link YAML when used
```

### 20 Built-in Skills

Skills are the AI-facing interface. Each Skill executes the deterministic P0–P5 protocol, ensuring every AI interaction is context-loaded, confirmable, and side-effect-tracked.

| Category | Skills |
|---|---|
| **Onboarding** | `onboarding`, `first` |
| **Core Stages** | `init`, `spec`, `design`, `research`, `task`, `code`, `review`, `archive`, `catchup` |
| **Orchestration** | `plan`, `verify`, `orchestrate`, `status`, `transition`, `sync`, `feature`, `doctor` |
| **Quality** | `spec-review`, `analyze` |

### Host Integration and Automation

```bash
spec-first update          # Refresh baseline Skills/MCP for stable hosts (Claude Code + Codex)
spec-first update --host gemini   # Opt in to Gemini baseline (experimental)
spec-first update --host cursor   # Opt in to Cursor baseline (experimental)
spec-first hooks status    # Inspect Git hook integration
spec-first viewer start    # Launch the Stage Viewer dashboard
spec-first commit          # Structured commit with auto-linked traceability ID
```

### Release

```bash
pnpm run release:publish                # Cross-platform release entry (auto version bump by default)
pnpm run release:publish -- minor       # Force a minor bump
pnpm run release:publish -- auto --dry-run
```

`publish.sh` is kept as a compatibility wrapper, but the supported release entry is `release:publish` / `scripts/publish.mjs`.

---

## Architecture

Spec-First is organized in three layers. The boundary between layers is strict: Skills never access the runtime directly; CLI commands never call Skills.

```
┌────────────────────────────────────────────────────┐
│  Skill Layer  — Claude Code / Codex integration    │
│  20 Skills · P0–P5 execution protocol              │
├────────────────────────────────────────────────────┤
│  CLI Layer  — spec-first <command>                 │
│  28 deterministic command groups                   │
├────────────────────────────────────────────────────┤
│  Runtime Layer                                     │
│  ┌─────────────────┬──────────────────────────┐   │
│  │ process-engine  │ Stage FSM, lifecycle ctrl │   │
│  │ gate-engine     │ Blocking condition eval   │   │
│  │ trace-engine    │ ID registry, document links│   │
│  │ skill-runtime   │ Skill dispatch, prompts   │   │
│  │ ai-orchestrator │ Auto-loop, context pack   │   │
│  │ metrics-engine  │ Health score, bottlenecks │   │
│  └─────────────────┴──────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

---

## Stage Viewer

Spec-First ships with a built-in visual dashboard. Launch it with `spec-first viewer start` to inspect feature health, stage progress, gate status, and time distribution at a glance.

<img src="./image.png" alt="Spec-First Stage Viewer — showing feature health score, stage flow diagram, timeline, and duration distribution" width="900">

---

## Ecosystem Learning

Spec-First was built by studying the best ideas across the AI workflow ecosystem — not to replace these tools, but to synthesize their strongest patterns into one coherent process engine.

| Project | Core Philosophy | What Spec-First Adopted |
|---|---|---|
| **OpenSpec** | Actions not Phases — artifact DAG over rigid stage gates | Delta Spec concept for requirement evolution tracking |
| **Spec Kit** | Spec-Driven Development — constitution as supreme authority | Specification-as-contract principle; consistency analysis patterns |
| **Planning-Files** | Context Engineering — files as persistent working memory | Cross-session context persistence via `specs/<featureId>/`; 5-Question Reboot for `catchup` |
| **Trellis** | Read Before Write — spec injection before every dev action | `before-dev` spec loading protocol; `break-loop` retrospective in `archive` |
| **Superpowers** | Discipline Over Convenience — TDD as a hard gate | P0–P5 deterministic execution model; verification-before-completion as a gate condition |

---

## Contributing

Bug reports and pull requests are welcome. Please open an [issue](https://github.com/sunrain520/spec-first/issues) first to discuss significant changes.

For local development:

```bash
npm install
npm run build
npm test
npm run lint
```

---

## Repository

- [GitHub](https://github.com/sunrain520/spec-first)
- [Gitee](https://gitee.com/sunnyrain/spec-first)
- [Issue Tracker](https://github.com/sunrain520/spec-first/issues)
- [中文文档](./README-CN.md)

---

## License

MIT © [leo.kuang](https://github.com/sunrain520)
