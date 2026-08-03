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

**A repo-native AI coding harness that turns intent into trusted change.**

`spec-first` turns one-off AI coding conversations into inspectable requirements, plans, scoped work, review evidence, and reusable learning. It works inside the AI coding hosts you already use; scripts enforce deterministic invariants and prepare facts, while LLMs make semantic judgments above that floor.

[Official site](http://spec-first.cn/) | [User manual](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md)

</div>

---

## See It In 90 Seconds

![spec-first CLI workflow demo](https://raw.githubusercontent.com/sunrain520/spec-first/main/docs/assets/readme/spec-first-cli-workflow-demo.svg)

```text
Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
```

The loop leaves three things behind that a chat window does not:

- **Intent:** requirements and plans that explain what should change and why.
- **Evidence:** review and verification records that constrain what an agent may claim.
- **Learning:** reusable solutions with provenance, scope, and invalidation conditions.

The demo is simulated. The artifacts, commands, and contracts it shows are inspectable in this repository.

## Why spec-first?

AI can write code quickly. The expensive part is preserving the judgment around the code: why this scope was chosen, which evidence was checked, what was verified, and what the next agent or teammate should inherit.

| Without spec-first | With spec-first |
|---|---|
| Decisions disappear with the chat session | Requirements and plans stay in `docs/` |
| A reviewer sees only the diff | The diff can be read with its plan, task pack, and findings |
| "Tests passed" is a transcript claim | Closeout can reference commands and redacted logs that actually ran |
| A repeated bug starts from zero | A verified solution can be preserved in `docs/solutions/` |
| Moving to another host means rebuilding prompts | One source asset set projects the same `spec-*` workflow identities |

Use `spec-first` when you already use an AI coding host and want project-local workflows, reviewable artifacts, and evidence-aware completion. It may not fit if you only need a prompt snippet, a generic agent marketplace, a host-independent application, or a process that must not write workflow artifacts into the repository.

## Quickstart

Prerequisites:

- Node.js `>=20.0.0`, npm, and Git on `PATH`.
- One supported AI coding host installed.
- A terminal opened at the root of the Git repository you want to enable. Use a throwaway repository for the first trial if you prefer.

### 1. Install and initialize

```bash
npm install -g spec-first
spec-first quickstart
```

`quickstart` checks Node.js, Git, and installed host CLIs. If it finds one host, it continues into that host's existing `init` flow; otherwise it opens interactive host selection. It does not run an LLM workflow for you.

Prefer the explicit path?

```bash
npm install -g spec-first
spec-first doctor
spec-first init
```

`init` previews and confirms the managed files it will write. For scripted setup, select the host explicitly and provide the developer profile, for example:

```bash
spec-first init --codex -y -u <name> --lang <zh|en>
```

See the [full Quickstart guide](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/01-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B.md) for multi-host, multi-repo, dry-run, preview-host, and Runtime Setup options.

### 2. Restart the host

Restart the selected host or open a new session so it loads the generated runtime assets. `spec-*` workflows run inside the host session, not in your terminal.

### 3. Run the first workflow

Start with a rough product or engineering change:

```text
spec-brainstorm "Improve onboarding for first-time CLI users"
```

Then inspect the requirements-only plan created under:

```text
docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.md
```

That file is the completion signal for the first trial: the intent is now repo-local, inspectable, and ready for `spec-plan`.

## What You Get

A workflow writes only the artifacts it owns. A typical project may accumulate:

```text
docs/
  ideation/      ranked ideas and exploration notes
  brainstorms/   PRD artifacts produced by spec-prd
  plans/         requirements-only and implementation-ready plans
  tasks/         derived task packs for structured execution
  reviews/       document and code review findings
  solutions/     reusable, qualified learnings
.spec-first/
  workflows/     structured workflow evidence (gitignored by default)
```

These artifacts are project-owned. Generated host runtime assets are disposable projections and can be rebuilt from source with `spec-first init`.

## Core Workflows

Public workflow identifiers use the same `spec-*` form across hosts. The entry governor chooses one route from the current intent; it does not force every task through a rigid state machine.

| Intent | Start with | Primary result |
|---|---|---|
| Explore possible directions | `spec-ideate` | ranked ideas in `docs/ideation/` |
| Turn a rough idea into requirements | `spec-brainstorm` | requirements-only plan in `docs/plans/` |
| Refine an existing PRD or brownfield request | `spec-prd` | PRD artifact in `docs/brainstorms/` |
| Decide how to implement settled requirements | `spec-plan` | implementation-ready plan in `docs/plans/` |
| Split a plan for structured handoff | `spec-write-tasks` | derived task pack in `docs/tasks/` |
| Execute scoped work | `spec-work` | source changes plus verification evidence |
| Diagnose a failure | `spec-debug` | root-cause and verification evidence |
| Review a document or implementation | `spec-doc-review` / `spec-code-review` | structured findings |
| Preserve reusable learning | `spec-compound` | qualified solution in `docs/solutions/` |

Other public entries cover browser dogfooding, optimization, polishing, handoff, skill authoring, and release workflows. See the [complete workflows and artifacts map](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/04-workflows-artifacts-map.md).

## Trust Model

The core rule is: **scripts enforce deterministic invariants and prepare facts; LLMs judge semantic adequacy above that floor.**

- **Scripts and tools own facts:** paths, Git state, hashes, schema checks, exit codes, generation, and machine-readable receipts.
- **LLMs and people own judgment:** requirements, scope, trade-offs, implementation choices, review conclusions, and business value.
- **Evidence limits claims:** an artifact, passing source test, or confident model response proves only what its direct evidence supports.
- **Exit gates stay explicit:** local mutation, worker dispatch, commit, push, handoff, and durable knowledge promotion are separate authorities.
- **Source stays authoritative:** edit `skills/`, `templates/`, `src/cli/`, and checked-in docs; do not patch generated runtime mirrors as source fixes.

For the full boundaries, read the [source/runtime contract](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/source-runtime-customization-boundary.md), [runtime capability catalog](https://github.com/sunrain520/spec-first/blob/main/docs/catalog/runtime-capabilities.md), and [honest closeout contract](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/workflows/honest-closeout.md).

## Host Support

Host delivery and host evidence are different claims. A generated projection does not by itself prove that a host loader discovered and invoked it correctly.

| Host | Current posture | Setup |
|---|---|---|
| Claude Code | primary supported host | interactive `init` or `--claude` |
| Codex | primary supported host | interactive `init` or `--codex` |
| Kiro | opt-in preview | `--kiro` |
| Qoder | opt-in preview | `--qoder` |
| Cursor | opt-in `generated_runtime_preview`; local loader journey remains unverified | `--cursor` |
| OpenCode | opt-in `generated_runtime_preview`; version-matched loader journey remains unverified | `--opencode` |

Run `spec-first doctor --verbose` for current project facts. The [runtime capability catalog](https://github.com/sunrain520/spec-first/blob/main/docs/catalog/runtime-capabilities.md) is the detailed support reference.

## Documentation

**Get started**

- [User manual](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md)
- [First workflow walkthrough](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/09-%E9%A6%96%E6%AC%A1%E5%B7%A5%E4%BD%9C%E6%B5%81%E8%B5%B0%E6%9F%A5.md)
- [Artifact catalog](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/10-%E4%BA%A7%E7%89%A9%E7%9B%AE%E5%BD%95.md)

**Understand the model**

- [Project role contract](https://github.com/sunrain520/spec-first/blob/main/docs/10-prompt/%E7%BB%93%E6%9E%84%E5%8C%96%E9%A1%B9%E7%9B%AE%E8%A7%92%E8%89%B2%E5%A5%91%E7%BA%A6.md)
- [Runtime capability catalog](https://github.com/sunrain520/spec-first/blob/main/docs/catalog/runtime-capabilities.md)
- [Verification run summary contract](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/verification/verification-run-summary.md)

Detailed manuals are Chinese-first; this README is the English quick path.

## CLI Reference

```bash
spec-first doctor      # inspect environment and managed runtime health
spec-first quickstart  # detect prerequisites and continue into init
spec-first init        # generate selected host runtime assets
spec-first update      # upgrade the CLI and refresh runtime assets
spec-first clean       # remove selected generated runtime assets
spec-first plans audit --status completed --json
```

Use `spec-first --help` and the [user manual](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md) for all commands and options.

## Development & Contributing

```bash
npm run typecheck
npm run test:unit
npm run test:smoke
npm run test:integration
npm run test:release
npm run build
```

`npm run build` performs `npm pack --dry-run` and validates the package payload shape. Source changes belong in canonical source surfaces; regenerate runtime copies with `spec-first init` only when those runtime sources change.

See [CONTRIBUTING.md](https://github.com/sunrain520/spec-first/blob/main/CONTRIBUTING.md), [SECURITY.md](https://github.com/sunrain520/spec-first/blob/main/SECURITY.md), [LICENSE](https://github.com/sunrain520/spec-first/blob/main/LICENSE), [release history](https://github.com/sunrain520/spec-first/blob/main/CHANGELOG.md), and [GitHub Issues](https://github.com/sunrain520/spec-first/issues).
