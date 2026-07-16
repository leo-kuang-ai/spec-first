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

**An AI Coding Harness for Claude Code, Codex, Kiro, Qoder, and Cursor.**

`spec-first` helps Claude Code, Codex, Kiro, Qoder, and Cursor become easier to trust in real projects: one-off AI coding conversations become repo-backed requirements, plans, scoped work, review, and reusable learning. Scripts enforce deterministic invariants and prepare facts; LLMs judge semantic adequacy above that floor; evidence stays in your repository. Kiro and Qoder remain opt-in previews. Cursor is more conservative: it is an opt-in `generated_runtime_preview` that currently proves generation of `.cursor/skills/**`, `.cursor/spec-first/**`, and `.cursor/mcp.json` evidence only. Local Cursor skill discovery/invocation has not been verified, and generated skills may not be loaded by Cursor.

Official site: [spec-first.cn](http://spec-first.cn/)

</div>

---

## See It In 90 Seconds

![spec-first CLI workflow demo](https://raw.githubusercontent.com/sunrain520/spec-first/main/docs/assets/readme/spec-first-cli-workflow-demo.svg)

The first thing to evaluate is not an agent count or a prompt library. It is whether a workflow leaves something durable behind. A healthy first loop gives your existing Claude Code, Codex, Kiro, Qoder, or Cursor session a governed path: define the work, plan it, split it when useful, execute it, review it, and compound the learning.

The smallest success is intentionally concrete: after install and init, run one host workflow and inspect the Markdown artifact it writes under your repo, usually in `docs/brainstorms/` or `docs/plans/`. Deeper governance is available later; the first test is whether the work becomes inspectable.

<sub>Simulated demo path: install → init → runtime-setup → ideate → brainstorm → prd → doc-review → plan → write-tasks → work → code-review → compound; runtime-setup is the readiness/setup step to run when helper or MCP facts are missing, debug is shown as a side loop for test failures or unclear root causes, and inspectable Markdown artifacts remain in the repository. Animation source: [spec-first-cli-workflow-demo.svg](https://raw.githubusercontent.com/sunrain520/spec-first/main/docs/assets/readme/spec-first-cli-workflow-demo.svg).</sub>

## Quickstart

Install, initialize, and run your first workflow in about 5 minutes.

Prerequisites:

- Node.js `>=20.0.0` and npm.
- Git on `PATH`; `doctor`, setup, and workflow checks read repository facts from Git.
- Claude Code, Codex, Kiro, Qoder, or Cursor installed, with one chosen as the current host. Cursor requires explicit `--cursor` opt-in and is currently generated-runtime preview only.
- A terminal opened at the root of the project repo where you want to enable `spec-first`. First-time users can try a throwaway/test repo before initializing a real project.

**Step 1 — Install and check health**

macOS / Linux:

```bash
npm install -g spec-first
spec-first doctor
```

Windows PowerShell 7+ or Windows PowerShell 5.1:

```powershell
npm install -g spec-first
spec-first doctor
```

Windows cmd.exe:

```bat
npm install -g spec-first
spec-first doctor
```

On Win64, prefer native Windows Terminal with PowerShell 7+ or `cmd.exe` for installation and smoke checks. Windows PowerShell 5.1 is supported, but PowerShell 7+ has better UTF-8 behavior.

Expected: `doctor` reports no blocking issues. If issues appear, follow the printed suggestions before continuing.

**Step 2 — Initialize the host runtime**

```bash
spec-first init
```

Select your host (Claude Code, Codex, Cursor, Kiro, and/or Qoder), confirm your developer name and language, then confirm the writes. Interactive confirmation uses a summary-first view: generated scale and risk-operation totals are grouped by host, while project-external writes and degraded warnings stay prominent. Individual remove/prune/untrack paths are hidden from the default view. Run `spec-first init --dry-run` explicitly when you need target/host/root details, critical writes, and bounded path samples. In a parent workspace with many child Git repos, `init` defaults to bootstrapping the parent root with its instruction file, `.gitignore`, a missing `CHANGELOG.md`, and the selected host runtime/state. Use `--repo <child>` to initialize only one child repo; use `--all-repos` to initialize the parent workspace and every discovered child repo. Child setup and readiness truth remains local to each child. Scripted `init -y` setup on fresh machines must pass `-u <name>` because there is no prompt to collect a developer name, for example `spec-first init --codex -y -u <name> --lang <zh|en>`. Scripted preview setup uses `spec-first init --kiro -y -u <name> --lang <zh|en>` for Kiro, `spec-first init --qoder -y -u <name> --lang <zh|en>` for Qoder, or `spec-first init --cursor -y -u <name> --lang <zh|en>` for Cursor generated-runtime preview. Cursor is not part of the `init -y` default host set.

Expected: interactive init first presents a host-level confirmation summary, then reports the result as one run-level receipt. `--dry-run` is the detailed view that lists bounded runtime paths under `.claude/`, `.codex/`, `.agents/skills/`, `.cursor/`, `.kiro/`, or `.qoder/`. Generated copies can be rebuilt any time with `spec-first init`.

Init creates `CHANGELOG.md` only when it is missing; an existing repository changelog remains byte-for-byte user-owned.

If the host reports missing helper or MCP readiness facts, run the unified `spec-runtime-setup` entry in your current host. Its standard flow prepares the required baseline plus CodeGraph and Graphify; `--only` is reserved for advanced subset repair, while `--verify-only` remains non-installing verification.

For a non-Git multi-repo requirement workspace, default `init` remains parent-only: it does not project generated runtime into child repositories. Before a runtime setup mutation, finish the current host's child projection with `spec-first init --all-repos` (or the narrow `spec-first init --repo <child>` repair). Runtime Setup blocks provider and host-config mutation when a selected child's current-host projection is missing or stale; `--plan --all-repos` instead previews each child without writing. `spec-first doctor` presents projection, managed runtime facts, optional workspace graph, and unmanaged external MCP separately — only the first two can contribute to managed readiness.

Graphify is pinned to PyPI `graphifyy@0.9.12` and requires an existing Python `>=3.10` plus `uv` (preferred) or `pipx`. Setup does not bootstrap Python/tool managers or use plain pip. It verifies the direct wheel hash and package identity, generates the local AST graph with `extract --code-only` under `.graphify/`, and treats Graphify output as advisory navigation only. During an explicit Graphify mutation setup, a verified Python cutover automatically removes a confirmed global `@sentropic/graphify` incumbent and only launcher symlinks proven to resolve into that npm package; diagnostic, plan, and verify-only modes remain read-only.

Graphify Git hook 是可选的 project-local 自动刷新增强。Runtime Setup 使用 `git rev-parse --git-path hooks` 解析有效 hooks root，只有目标位于当前项目内且通过 no-follow symlink containment 时才安装、规范化和验证 hook。用户级或组织级 `core.hooksPath` 指向项目外时，setup 不运行 Graphify hook install/uninstall/status、不读取或修改外部 hook，也不覆盖 local/global Git 配置；核心 package、host integration、graph integrity 与真实 query 通过时，完整 setup 仍为 ready，支持并验证的 project-local steady state 则显示为 `manual-only`。该状态不证明外部 hook 不存在或不会执行；外部 hook execution 保持 unverified。只有源码已变化且消费前需要新的 currentness evidence 时，才按需运行 `spec-runtime-setup --only graphify --refresh`；该命令不是 hooksPath 修复动作，core-ready `unknown` 也不自动触发 refresh。

在**按需求组织的非 Git 多仓父目录**中，`spec-runtime-setup --only codegraph,graphify --workspace-graph --repos a,b` 会一次性建立 per-child CodeGraph 战术图和 workspace Graphify 合并图，并将可核验构建状态写入 `.graphify/workspace-graph-state.json`。`--workspace-graph-status` 只有在最近构建完整、repo/source snapshot 未变化且子图、合并图、路由块齐备时才报告 ready；仅有旧 `merged-graph.json` 不再足够。自动发现只扫描直接子目录；重复 alias 或嵌套仓根会 fail closed，需先消除歧义。Graphify 0.9.x 原生 child hook 与 out-of-tree workspace 子图不兼容，因此当前采用显式刷新：child source 变化后重跑 `--workspace-graph --repos ...`。`--workspace-graph-clean` 或 `spec-first clean --workspace-graph` 只清理已确认/receipt 记录的仓和 managed 资产；自动发现的新仓必须先确认。


Cursor note: `spec-first init --cursor` generates the same `spec-*` workflow runtime under `.cursor/skills/**`, spec-first state under `.cursor/spec-first/**`, and project MCP setup targets `.cursor/mcp.json` by default. User-level `~/.cursor/mcp.json` requires `--user-scope` / `CURSOR_USER_SCOPE=1`. Current release evidence records `cursor_loader_validation_unavailable`, so do not treat Cursor as full host support or an `init -y` default.

Cursor/Kiro/Qoder native pointer files: `init --cursor`, `init --kiro`, and `init --qoder` also write `.cursor/rules/spec-first.mdc`, `.kiro/steering/spec-first.md`, and `.qoder/rules/spec-first.md`. These files only point the host back to root `AGENTS.md` and that host's installed `using-spec-first` runtime skill (`.cursor/skills/`, `.kiro/skills/`, or `.qoder/skills/`); they are generated runtime pointers, not a second source of truth. If a same-path user-owned file already exists without the spec-first managed marker, init and clean leave it untouched; init and doctor both report the collision as a warning.

For all init options (flags, scripted mode, multi-repo), see the [full Quickstart guide](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/01-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B.md).

**Step 3 — Restart the host**

Restart the host or open a new session so it loads the generated runtime assets. Host-session workflow entries are not shell commands — they run inside the Claude Code, Codex, Kiro, Qoder, or Cursor session, not in your terminal.

**Step 4 — Run your first workflow**

Start with `brainstorm` — it is the most natural first entry and writes a visible artifact you can immediately inspect:

```text
# In any supported host session
spec-brainstorm "describe your first task here"
```

**Step 5 — Verify success**

After the brainstorm completes, check your repo for a new file:

```text
docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.md
```

That file is your first artifact. The work is now repo-local, inspectable, and ready to hand off to planning. From here, continue to the current host's plan entrypoint.

For subsequent tasks, use this quick route to pick the right entrypoint:

| If your first task is... | Start with... |
|---|---|
| A rough idea, feature, or product change | `spec-brainstorm` |
| An existing PRD, requirement note, or brownfield change request | `spec-prd` |
| A bug, failing test, stack trace, or abnormal behavior | `spec-debug` |
| A settled plan, task pack, or scoped implementation request | `spec-work` |
| A document, plan, task pack, diff, or implementation that needs review | `spec-doc-review` or `spec-code-review` |

Detailed manuals are Chinese-first; this README is the English quick path. Walkthrough: [Chinese First Workflow Walkthrough](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/09-%E9%A6%96%E6%AC%A1%E5%B7%A5%E4%BD%9C%E6%B5%81%E8%B5%B0%E6%9F%A5.md). Artifact ownership: [Chinese Artifact Catalog](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/10-%E4%BA%A7%E7%89%A9%E7%9B%AE%E5%BD%95.md).

## What You Get

A typical workflow chain produces these repo-local artifacts:

```text
docs/
  ideation/      ranked ideas and exploration notes
  brainstorms/   legacy PRD-grade requirements from spec-prd and older brainstorms
  plans/         requirements-only Product Contracts and implementation-ready plans
  tasks/         derived task packs for structured handoff
  reviews/       document and code review findings
  solutions/     reusable learnings after solving problems
.spec-first/
  workflows/     structured work closeout evidence (gitignored by default)
```

Not every workflow writes every artifact. A new `spec-brainstorm` run writes a requirements-only unified plan under `docs/plans/`; `spec-prd` keeps its legacy PRD artifact under `docs/brainstorms/`. Deeper chains add tasks, code changes, review findings, and learnings over time — all inspectable, all in your repository.

## Workflow Entry Points

The main engineering loop: `Codebase → Spec → Plan → Tasks → Code → Review → Knowledge`. Public workflow identifiers use the same `spec-*` form across supported hosts.

| Task | Unified entry | Artifact |
|---|---|---|
| Requirements from a rough idea | `spec-brainstorm` | `docs/plans/` (`requirements-only`) |
| Requirements from an existing PRD | `spec-prd` | `docs/brainstorms/` |
| Implementation plan | `spec-plan` | `docs/plans/` |
| Split a plan into executable tasks | `spec-write-tasks` | `docs/tasks/` |
| Execute scoped work | `spec-work` | source changes + evidence |
| Dogfood a branch in browser | `spec-dogfood` | `docs/dogfood-reports/` |
| Review code | `spec-code-review` | structured findings |
| Review docs or plans | `spec-doc-review` | structured findings |
| Capture reusable learning | `spec-compound` | `docs/solutions/` |

Before proposing a new abstraction, adapter, orchestrator, integration seam, or durable source, `spec-plan` inventories existing capabilities and chooses semantically among `reuse / extend / compose / new`. `compose` permits thin glue to own only contract translation, sequencing, failure/degradation routing, and observability/evidence; it must not duplicate business truth or parallel durable state. Markdown and HTML are both first-class unified-plan formats: Markdown review may apply safe writes, while `spec-doc-review` reviews HTML report-only and `spec-plan` owns any deterministic full recompose and re-review. `spec-work` rejects requirements-only artifacts, progress-like readiness values, and duplicate, missing, or conflicting unified metadata, then reads implementation-ready artifacts through stable headings or anchors. These source and projection contracts are not evidence of a real host loader, model quality, or field outcomes.

For a validated task pack, `spec-work` pins artifact-root-relative identity, the task-pack digest, the source-plan body hash, and a fresh source-plan readiness replay before the LLM judges semantic fit. It executes the machine-readable Task Cards and waves without turning the pack into progress or scope authority; a required task review is bounded and report-only, and it must close before dependent work starts. During implementation, work rechecks current source with `reuse / extend / compose / new`: thin glue may coordinate translation, sequencing, failure/partial-failure propagation, degradation, and observability/evidence, but it may not copy domain policy, validation truth, or durable state. Scope-changing public/schema/runtime/provider decisions return to planning.

Repository mutation, reviewer/worker dispatch, commit, and outward landing are separate authorities. `spec-code-review mode:agent` is always report-only; an ordinary review is also report-only unless review-and-fix is explicit, and commit still needs separate authorization. Final work closeout records commands that actually ran and repo-relative redacted logs in `verification-run-summary.v1`, checks structured claims through `honest-closeout.v1`, and writes `spec-work-run-artifact/v2` only when a durable trigger applies. `spec-debug` and `spec-code-review` may return their own run-summary refs and closeout limitations, but they do not own the spec-work run artifact. Prompt/source tests and generated projection prove these contracts exist; they do not prove clean-session model behavior or external adoption outcomes.

Support entrypoints (on demand): `spec-runtime-setup` for runtime environment plus required harness and MCP/helper readiness; plus the matching debug, optimize, ideate, compound-refresh, polish, dogfood, and write-skill entries for the current host.

Requirements clarification stays inside its current producer. `spec-ideate` passes a focused evidence snapshot to `spec-brainstorm`; `spec-brainstorm` verifies source facts, asks the current user one product question at a time, and persists blockers/source limitations in the requirements-only Product Contract; `spec-prd` does the same for brownfield PRDs. Project glossary/context/ADR files are advisory inputs only during these workflows—cross-release knowledge is emitted as a qualified promotion candidate for a later explicit maintenance request. Visual or spatial decisions use tables, state sequences, ASCII wireframes, or read-only source screenshots; there is no bundled browser helper.

`spec-write-skill` is a general project-level Agent Skill authoring workbench: it creates or revises a project-owned canonical package, or validates an existing/external package read-only. Apply work first produces a Design Brief, capability map, shape-aware eval and package topology preview; scripts then verify source shape plus preview hash/scope/write-set binding, while people/LLMs retain semantic judgment. The portable core does not require spec-first; host metadata and project governance load only when applicable. A host without atomic conditional patch support stops apply rather than claiming a closed mutation gate. Audit-only quality review stays a bounded review, third-party installation stays with the installer, and generated runtime mirrors are rebuilt from source rather than patched directly.

[→ Full entrypoint reference with routing rules](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/04-workflows-artifacts-map.md)

## The Problem

AI can write code quickly. The expensive part is preserving the judgment around the code: why this scope, what evidence was checked, which review findings mattered, and what the next agent or teammate should inherit.

Without a repo-backed trail, that context disappears with the chat window. The next session starts cold, reviewers cannot see why a plan changed, and teams cannot reuse what worked. `spec-first` keeps that work as durable artifacts: requirements, PRDs, plans, task packs, work evidence, debugging notes, reviews, and learnings.

## Why spec-first?

`spec-first` keeps the software lifecycle legible without pretending that prose alone is proof. It is not trying to replace Claude Code, Codex, Kiro, Qoder, or Cursor; it gives those hosts a project-local harness. Cursor native rules, Kiro native Specs, and Qoder native rules remain host-owned artifacts; spec-first only treats `.cursor/rules/**`, `.kiro/specs/**`, and `.qoder/rules/**` as advisory input when explicitly named.

| Adoption question | Prompt pack / agent orchestration | spec-first |
|---|---|---|
| What do I get after the first run? | A better chat answer or agent transcript | A repo-local artifact such as a requirements brief or plan |
| Where do decisions and evidence live? | Session state, message bus, runtime memory | Repo-local docs, generated runtime assets, and verifiable CLI facts |
| What does the human review? | Often the final diff or agent output | Requirements, plans, task packs, diffs, review findings, bugs, and learnings |
| Who enforces mechanical boundaries? | Mostly model discipline or custom glue | Scripts enforce deterministic invariants and prepare facts; LLMs make semantic decisions above that floor |
| How do Claude Code, Codex, Cursor, Kiro, and Qoder stay aligned? | Separate setup and prompt maintenance | One source asset set regenerates supported host runtime surfaces |

Current mechanisms you can inspect today:

- Requirements become durable briefs instead of disappearing prompts.
- Plans and task packs turn vague intent into reviewable execution context; deterministic validation prepares identity/drift facts while the LLM still judges task semantic fit.
- Work closeout can point to structured verification evidence instead of a free-form "tests passed" claim.
- Required task-level review is report-only and blocks dependent waves when scope attribution or blocking findings remain unresolved.
- Work rechecks current owners and thin-glue boundaries before adding durable surfaces, and keeps local mutation separate from commit/landing authority.
- Work, review, debug, optimize, and compound workflows preserve evidence and learning.
- Knowledge handoffs stay summary-first, and recalled `docs/solutions/` learnings remain advisory until reconfirmed from source evidence.
- One source asset set supports unified `spec-*` workflow entries across Claude Code, Codex, Cursor, Kiro, and Qoder without hand-maintaining generated runtime copies.

These are current repo mechanisms, not measured adoption-outcome claims. Trust the artifacts, tests, and source/runtime boundaries before trusting any marketing sentence.

## Operating Model

`spec-first` has two durable surfaces: repo-local workflow artifacts and generated host runtime assets.

Source assets (`skills/`, skill-local prompt assets under `skills/**/references/{agents,personas}/`, `templates/`, `src/cli/`) are regenerated by `spec-first init` into host runtime assets — producing repo-local workflow artifacts: `ideation -> brainstorms -> plans -> tasks -> work/review/debug -> learnings`.

Generated `spec-*`, `using-spec-first`, Graphify project-skill, `spec-first/` state, command, hook, and pointer assets under the host roots are disposable and can be rebuilt with `spec-first init`. The host roots are mixed-ownership surfaces: team-authored skills, agents, rules, and portable project configuration outside those namespaced assets may be committed. Cursor project `.cursor/mcp.json`, spec-first managed `.kiro/settings/`, Qoder local `.qoder/settings.local.json`, and Qoder `.qoder/settings.json` managed hook entries are local outputs or managed slices rather than source by default; existing tracked team-policy files are not automatically removed from the Git index. See the gitignore reference for the exact generated paths and opt-in sharing guidance.

Detailed references:

- [Source / Runtime / Provider Customization Boundary](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/source-runtime-customization-boundary.md)
- [Runtime Capability Catalog](https://github.com/sunrain520/spec-first/blob/main/docs/catalog/runtime-capabilities.md)
- [Architecture Overview](https://github.com/sunrain520/spec-first/blob/main/docs/02-%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1/01-%E6%95%B4%E4%BD%93%E6%9E%B6%E6%9E%84.md)

## Trust Model

Scripts enforce deterministic invariants; scripts prepare facts; the LLM decides semantic adequacy above that floor.

- **What scripts do:** enforce mechanically decidable invariants, install, validate, generate, report machine facts.
- **What the LLM decides:** requirements framing, scope boundaries, tradeoffs, implementation judgment, review evidence.
- **What is excluded from ordinary context:** `.spec-first/audits/**`, `.spec-first/governance/**`, generated mirrors such as `.claude/**`, `.codex/**`, `.agents/skills/**`, `.cursor/skills/**`, `.cursor/spec-first/**`, `.kiro/skills/**`, `.kiro/agents/**`, `.kiro/spec-first/**`, spec-first managed `.kiro/settings/**`, `.qoder/commands/spec-*.md`, retired `.qoder/commands/spec/**`, `.qoder/skills/**`, `.qoder/agents/**`, `.qoder/spec-first/**`, spec-first managed `.qoder/hooks/session-start`, `.qoder/hooks/prd-prewrite-guard`, `.qoder/hooks/prd-readiness-guard`, and host-local config such as `.cursor/mcp.json` and `.qoder/settings.local.json`.

[→ Full trust model and verification contracts](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/workflows/honest-closeout.md)

## Use spec-first when

Use `spec-first` when:

- You already use Claude Code, Codex, Kiro, Qoder, or Cursor and want project-local workflows instead of one-off prompts.
- You want AI coding work to leave durable requirements, plans, explicitly routed review summaries, and learnings.
- You want scripts to handle deterministic setup and enforce machine-checkable boundaries while keeping semantic judgment with the LLM.
- You want a lightweight workflow layer that can be regenerated from source assets.

It may not fit when you only need a single prompt snippet, a generic agent marketplace, a no-host standalone app, or a team process that does not want workflow artifacts written into the repo.

## Documentation

**Get started**
- [spec-first.cn](http://spec-first.cn/) — official site
- [Chinese User Manual](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md)
- [Chinese First Workflow Walkthrough](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/09-%E9%A6%96%E6%AC%A1%E5%B7%A5%E4%BD%9C%E6%B5%81%E8%B5%B0%E6%9F%A5.md)
- [Chinese Workflows and Artifacts Map](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/04-workflows-artifacts-map.md)

**Understand the model**
- [Chinese Architecture Overview](https://github.com/sunrain520/spec-first/blob/main/docs/02-%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1/01-%E6%95%B4%E4%BD%93%E6%9E%B6%E6%9E%84.md)
- [Source / Runtime / Provider Customization Boundary](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/source-runtime-customization-boundary.md)
- [Verification Run Summary Contract](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/verification/verification-run-summary.md)
- [Honest Closeout Contract](https://github.com/sunrain520/spec-first/blob/main/docs/contracts/workflows/honest-closeout.md)
- [Chinese Release Notes](https://github.com/sunrain520/spec-first/blob/main/docs/08-%E7%89%88%E6%9C%AC%E6%9B%B4%E6%96%B0/README.md)

Detailed manuals and implementation docs are currently Chinese-first.

## Runtime And CLI Reference

First-run users: `source assets -> spec-first init -> host runtime assets -> workflow artifacts`.

Key commands:

```bash
spec-first doctor    # check health
spec-first init      # generate runtime
spec-first update    # upgrade CLI + refresh runtime
spec-first clean     # remove generated runtime
spec-first plans audit --status completed --json  # 只读盘点 Markdown code plan 的 lifecycle marker
```

新的 Markdown software unified plan 以 `status: active` 创建；拥有完整 shipping tail 的 workflow 只有在 verification、required review 与 residual gate 收口后，才把 direct plan 或 task pack 的 `source_plan` 更新为 `completed`。`plans audit` 只扫描当前仓库 `docs/plans/*.md` 的直接普通文件，不写文件、不扫描 HTML。`completed` 只是 lifecycle marker，不是 tests、CI、merge、release 或 field outcome 证据。

[→ Full CLI reference with all flags and options](https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md)

## Development & Contributing

```bash
npm run typecheck
npm run test:runtime-setup
npm run test:unit
npm run test:smoke
npm run test:integration
npm run test:ai-dev:gate
npm run test:release
npm run test:release:website
npm run build
npm test
```

`npm run build` runs `npm pack --dry-run` and verifies the package payload shape through npm.

When changing source assets, edit `skills/`, skill-local prompt assets under `skills/**/references/{agents,personas}/`, `templates/`, or `src/cli/`, then regenerate runtime copies with `spec-first init` and choose the target host in a fresh host session.

For contribution and support details, see [CONTRIBUTING.md](https://github.com/sunrain520/spec-first/blob/main/CONTRIBUTING.md), [SECURITY.md](https://github.com/sunrain520/spec-first/blob/main/SECURITY.md), [LICENSE](https://github.com/sunrain520/spec-first/blob/main/LICENSE), and [GitHub Issues](https://github.com/sunrain520/spec-first/issues).
