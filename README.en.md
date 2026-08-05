<div align="center">

# spec-first

**Turn AI coding sessions into trusted, repo-owned change.**

`spec-first` is a repo-native AI coding harness for Claude Code, Codex, Kiro, Qoder, Cursor, and OpenCode. Your host still writes the code; `spec-first` preserves intent, scopes execution, ties completion claims to evidence, and turns verified work into reusable project knowledge.

[![npm version](https://img.shields.io/npm/v/spec-first.svg)](https://www.npmjs.com/package/spec-first)
[![npm monthly downloads](https://img.shields.io/npm/dm/spec-first.svg)](https://www.npmjs.com/package/spec-first)
[![CI](https://github.com/sunrain520/spec-first/actions/workflows/npm-install-matrix.yml/badge.svg?branch=master)](https://github.com/sunrain520/spec-first/actions/workflows/npm-install-matrix.yml?query=branch%3Amaster)
[![node](https://img.shields.io/node/v/spec-first.svg)](https://github.com/sunrain520/spec-first/blob/master/package.json)
[![license](https://img.shields.io/npm/l/spec-first.svg)](https://github.com/sunrain520/spec-first/blob/master/LICENSE)

[English](https://github.com/sunrain520/spec-first/blob/master/README.en.md) | [简体中文](https://github.com/sunrain520/spec-first/blob/master/README.md)

[Quickstart](#quickstart) | [Workflows](#choose-the-right-workflow) | [Documentation](https://github.com/sunrain520/spec-first/blob/master/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md) | [Website](http://spec-first.cn/)

</div>

![spec-first workflow: intent to trusted change](https://raw.githubusercontent.com/sunrain520/spec-first/master/docs/assets/readme/spec-first-cli-workflow-demo.en.svg)

```text
Intent -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
```

## Why spec-first?

AI can generate code quickly. The harder problem is preserving the judgment around the code: what was requested, why this scope was chosen, which checks actually ran, what remains uncertain, and what the next session should inherit.

| A chat alone | With spec-first |
|---|---|
| Intent and trade-offs disappear when the session ends | Requirements and plans remain inspectable in the repository |
| The next agent reconstructs context from scratch | Plans, task packs, findings, and source references carry context forward |
| “Tests passed” is only a transcript claim | Closeout can point to the commands, exit codes, and redacted logs that actually ran |
| Switching hosts means rebuilding workflow prompts | One canonical source set projects the same `spec-*` identities to each host |
| A solved problem becomes forgotten history | Qualified learnings can be preserved with provenance and invalidation conditions |

The result is not a rigid development process. It is a lightweight contract around the exits that matter: mutation, verification, handoff, source/runtime ownership, and durable learning.

## Quickstart

You need Node.js `>=20.0.0`, npm, Git, and at least one supported AI coding host. Run the terminal commands from the root of the Git repository you want to enable.

### 1. Install and initialize

```bash
npm install -g spec-first
spec-first quickstart
```

`quickstart` checks Node.js, Git, and installed host CLIs, then continues into the existing `init` flow. It auto-selects the host only when exactly one is detected; otherwise you choose interactively. It never runs an LLM workflow outside the host session.

For an explicit or scripted setup:

```bash
spec-first doctor
spec-first init --codex -y -u <name> --lang <zh|en>
```

`init` previews the managed runtime files before writing them. See the [full Quickstart guide](https://github.com/sunrain520/spec-first/blob/master/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/01-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B.md) for multi-host, multi-repo, dry-run, and preview-host setup.

### 2. Restart the host

Restart the selected host or open a new session so it discovers the generated runtime assets. The `spec-*` entries below run inside that host session; they are not shell subcommands. For preview hosts such as Cursor and OpenCode, generated runtime assets do not prove loader discovery. If the entries are missing after restart, run `spec-first doctor --verbose` and check the [runtime capability catalog](https://github.com/sunrain520/spec-first/blob/master/docs/catalog/runtime-capabilities.md).

### 3. Prepare the runtime

```text
spec-runtime-setup
```

Runtime Setup installs or verifies the required harness runtime, MCP servers, helper tools, providers, and project readiness facts. Run it before the first workflow. After that, rerun it only when the host, provider, helper configuration, or setup facts change.

### 4. Create the first inspectable artifact

```text
spec-brainstorm "Improve onboarding for first-time CLI users"
```

For this non-trivial example, `spec-brainstorm` normally writes a requirements-only unified plan after the scope is settled:

```text
docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.md
```

If the run produces no decision worth preserving, the workflow may legitimately skip writing a document; that is not a failure. When the file is created, it is the first inspectable signal: intent is now project-owned, reviewable, and ready for `spec-plan` to deepen in place.

## From Prompt to Trusted Change

Two common inputs can converge on the same implementation path:

```text
rough idea   -> spec-brainstorm --\
existing PRD -> spec-prd ----------+-> spec-plan -> [spec-write-tasks] -> spec-work -> spec-code-review -> spec-compound
```

- `spec-brainstorm` starts from a rough idea and settles **what** to build. It writes a requirements-only unified plan when the run has decisions worth preserving.
- `spec-prd` is the alternative entry for an existing PRD or brownfield request, not a mandatory step after `spec-brainstorm`.
- `spec-doc-review` is an optional cross-stage review lane after requirements, an implementation-ready plan, or a task pack; it returns structured document findings.
- `spec-plan` settles **how** to build it and deepens that same plan to implementation-ready.
- `spec-write-tasks` optionally derives a task pack for large, parallel, or handoff-heavy work. The plan remains authoritative.
- `spec-work` executes bounded work and records verification evidence for checks that actually ran.
- `spec-code-review` returns structured findings without silently acquiring commit or landing authority.
- `spec-compound` promotes only qualified learning into durable project knowledge.

This is a map, not a mandatory state machine. Start at the entry that matches the current intent; `using-spec-first` can route an unclear request to one public workflow.

## What Stays in the Repository

Each producer owns a specific artifact surface:

```text
docs/
  ideation/      ranked directions from spec-ideate
  brainstorms/   clarified PRD artifacts from spec-prd
  plans/         requirements-only and implementation-ready unified plans
  tasks/         optional task packs derived from plans
  solutions/     qualified, reusable learnings
.spec-first/
  workflows/     conditional verification evidence (gitignored by default)
```

Durable documents belong to the project. Generated host runtime assets are disposable projections and can be rebuilt from canonical source with `spec-first init`.

Review findings normally return in the session. Full code-review coordination artifacts use the OS temporary directory; repo-local `.spec-first/workflows/` evidence is written only when a workflow actually runs targeted commands or a durable evidence trigger applies. An artifact proves only the claim its direct evidence supports.

## Choose the Right Workflow

| Current intent | Entry | Primary result |
|---|---|---|
| Prepare or repair required runtime readiness | `spec-runtime-setup` | setup facts and concrete next actions |
| Explore several possible directions | `spec-ideate` | ranked ideas in `docs/ideation/` |
| Turn a rough idea into settled requirements | `spec-brainstorm` | requirements-only plan in `docs/plans/` |
| Clarify an existing PRD or brownfield request | `spec-prd` | planning-readiness artifact in `docs/brainstorms/` |
| Review requirements, plans, or task packs | `spec-doc-review` | structured document findings |
| Decide implementation for settled requirements | `spec-plan` | implementation-ready plan in `docs/plans/` |
| Derive an executable handoff for a large plan | `spec-write-tasks` | optional task pack in `docs/tasks/` |
| Execute a plan, brief, task pack, or scoped request | `spec-work` | source changes and verification evidence |
| Diagnose a failure, regression, or flaky test | `spec-debug` | root cause, fix, and verification evidence |
| Review a diff, branch, or PR | `spec-code-review` | structured code findings and residual risks |
| Preserve or refresh reusable learning | `spec-compound` / `spec-compound-refresh` | qualified knowledge in `docs/solutions/` |

Other entries cover browser dogfooding, UI polish, measurable optimization, App consistency audits, cross-session handoff, project rules, product strategy, Skill authoring, and an explicitly authorized hands-off path to a green PR. See the [complete entrypoint catalog](https://github.com/sunrain520/spec-first/blob/master/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/24-%E5%85%AC%E5%BC%80%E5%85%A5%E5%8F%A3%E4%B8%8ESkill%E7%9B%AE%E5%BD%95.md).

## How Trust Works

`spec-first` separates facts, judgment, and authority instead of asking one model response to own all three.

| Layer | Owner | Responsibility |
|---|---|---|
| Deterministic facts | scripts and tools | paths, Git state, hashes, schemas, exit codes, runtime generation, and receipts |
| Semantic judgment | LLMs and people | requirements, scope, trade-offs, architecture, review conclusions, and business value |
| Side-effect authority | project owner / current request | local mutation, worker dispatch, commit, push, external communication, and knowledge promotion |

Five rules keep those layers aligned:

1. **Evidence over confidence.** A confident answer, generated artifact, or passing source test proves only its direct claim scope.
2. **Gate the exits, not the thinking.** Reasoning stays flexible; mutation, verification, handoff, source/runtime, and knowledge exits stay explicit.
3. **Source first.** Edit `skills/`, `templates/`, `src/cli/`, and checked-in docs; rebuild generated runtime mirrors instead of patching them as source.
4. **Bounded autonomy.** Long-running or high-impact work carries scope, permissions, checkpoints, stop conditions, and recovery boundaries.
5. **Reversible learning.** Knowledge is promoted only with provenance, applicability limits, and invalidation conditions.

Read the [project role contract](https://github.com/sunrain520/spec-first/blob/master/docs/10-prompt/%E7%BB%93%E6%9E%84%E5%8C%96%E9%A1%B9%E7%9B%AE%E8%A7%92%E8%89%B2%E5%A5%91%E7%BA%A6.md), [source/runtime boundary](https://github.com/sunrain520/spec-first/blob/master/docs/contracts/source-runtime-customization-boundary.md), [verification summary contract](https://github.com/sunrain520/spec-first/blob/master/docs/contracts/verification/verification-run-summary.md), and [honest closeout contract](https://github.com/sunrain520/spec-first/blob/master/docs/contracts/workflows/honest-closeout.md) for the complete model.

## Host Support

Runtime delivery and real host evidence are different claims. Generating a projection does not prove that a host loader discovered and invoked it correctly.

| Host | Current posture | Initialize with |
|---|---|---|
| Claude Code | primary supported host | interactive `init` or `--claude` |
| Codex | primary supported host | interactive `init` or `--codex` |
| Kiro | opt-in preview | `--kiro` |
| Qoder | opt-in preview | `--qoder` |
| Cursor | opt-in `generated_runtime_preview`; local loader journey unverified | `--cursor` |
| OpenCode | opt-in `generated_runtime_preview`; version-matched loader journey unverified | `--opencode` |

Run `spec-first doctor --verbose` for the current project's runtime facts. The generated [runtime capability catalog](https://github.com/sunrain520/spec-first/blob/master/docs/catalog/runtime-capabilities.md) is the detailed support reference.

## When It Fits

Use `spec-first` when your team already codes with an AI host and wants project-local intent, inspectable handoffs, explicit review boundaries, evidence-aware completion, and reusable learning across sessions or hosts.

It is probably unnecessary when you only need a one-off prompt, cannot write workflow artifacts into the repository, want a standalone coding application, or expect a central process engine to choose product priorities and architecture for you.

## Documentation

- [User manual](https://github.com/sunrain520/spec-first/blob/master/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md): complete usage and operating model
- [First workflow walkthrough](https://github.com/sunrain520/spec-first/blob/master/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/09-%E9%A6%96%E6%AC%A1%E5%B7%A5%E4%BD%9C%E6%B5%81%E8%B5%B0%E6%9F%A5.md): first setup through the engineering loop
- [Artifact catalog](https://github.com/sunrain520/spec-first/blob/master/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/10-%E4%BA%A7%E7%89%A9%E7%9B%AE%E5%BD%95.md): producers, consumers, and Git boundaries
- [Runtime capability catalog](https://github.com/sunrain520/spec-first/blob/master/docs/catalog/runtime-capabilities.md): generated host and workflow facts
- [Contributing](https://github.com/sunrain520/spec-first/blob/master/CONTRIBUTING.md) and [Security](https://github.com/sunrain520/spec-first/blob/master/SECURITY.md)

The default README and detailed manuals are Chinese-first; this file is the English quick path.

## CLI Reference

```bash
spec-first doctor      # inspect environment and managed runtime health
spec-first quickstart  # detect prerequisites and continue into init
spec-first init        # generate selected host runtime assets
spec-first update      # upgrade the CLI and refresh runtime assets
spec-first clean       # remove selected generated runtime assets
spec-first plans audit --status completed --json
```

Use `spec-first --help` for all package CLI options. Primary hosts normally discover Workflow entries after `init` and restart; Cursor and OpenCode preview projections may still remain undiscovered by their loaders. Treat `spec-first doctor --verbose` and the [runtime capability catalog](https://github.com/sunrain520/spec-first/blob/master/docs/catalog/runtime-capabilities.md) as authoritative.

## Development & Contributing

```bash
npm run typecheck
npm run test:unit
npm run test:smoke
npm run test:integration
npm run test:release
npm run build
```

`npm run build` performs `npm pack --dry-run` and validates the package payload. Source changes belong in canonical source surfaces; regenerate runtime copies with `spec-first init` only when those runtime sources change.

MIT licensed. See the [release history](https://github.com/sunrain520/spec-first/blob/master/CHANGELOG.md) and [GitHub Issues](https://github.com/sunrain520/spec-first/issues).

## Community

- WeChat group: scan the QR code to join the Chinese-language community chat.
- WeChat official account: follow `spec-first` for release notes (Chinese only).

<div align="center">
<img src="https://raw.githubusercontent.com/sunrain520/spec-first/master/docs/assets/readme/spec-first-wechat-group.jpg" alt="spec-first WeChat group QR code" width="220" />
</div>
