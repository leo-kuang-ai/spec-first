# Runtime Capability Catalog

> 本文件由 `scripts/generate-runtime-capability-catalog.js` 从 `src/cli/plugin.js`、`src/cli/contracts/dual-host-governance/skills-governance.json`、`docs/contracts/workflows/*.schema.json` 和当前 `skills/` source 资产派生生成。
> 它是只读 catalog，不是第二套 source of truth；修改 runtime 能力时应先改 source/governance，再重新生成本文件。

## Source Truth

| Source | 职责 |
|---|---|
| `src/cli/plugin.js` | 构建 plugin manifest、filtered asset set、runtime sync 与 drift 检查的实现真相源 |
| `src/cli/contracts/dual-host-governance/skills-governance.json` | workflow / standalone / internal skill 的 host delivery 治理真相源 |
| `templates/claude/commands/spec/*.md` | Unified `spec-*` workflow runtime source templates |
| `skills/*/SKILL.md` | workflow、standalone、agent-facing internal skill source |
| `skills/**/references/agents/`, `skills/**/references/personas/` | skill-local prompt assets；不再通过顶层 `agents/` 作为 runtime source |
| `docs/contracts/workflows/*.schema.json` | docs-side workflow artifact contracts；planned contract 不等于 runtime producer 已实现 |

## Summary

| 范围 | 当前值 |
|---|---|
| Bundled source skills | 38 |
| Bundled source agents | 0 |
| Bundled agent support files | 0 |
| Governance records by entry surface | internal_only: 4, standalone_skill: 17, workflow_command: 17 |
| Claude Code runtime delivery | 17 commands, 17 workflow skills, 17 standalone skills, 4 agent-facing internal skills, 0 agents, 0 agent support files |
| Codex runtime delivery | 0 commands, 17 workflow skills, 17 standalone skills, 4 agent-facing internal skills, 0 agents, 0 agent support files |
| Cursor runtime delivery | 0 commands, 17 workflow skills, 17 standalone skills, 4 agent-facing internal skills, 0 agents, 0 agent support files |
| Kiro runtime delivery | 0 commands, 17 workflow skills, 17 standalone skills, 4 agent-facing internal skills, 0 agents, 0 agent support files |
| Qoder runtime delivery | 17 commands, 17 workflow skills, 17 standalone skills, 4 agent-facing internal skills, 0 agents, 0 agent support files |
| OpenCode runtime delivery | 17 commands, 17 workflow skills, 17 standalone skills, 4 agent-facing internal skills, 0 agents, 0 agent support files |
| ZCode runtime delivery | 0 commands, 17 workflow skills, 17 standalone skills, 4 agent-facing internal skills, 0 agents, 0 agent support files |
| Pi runtime delivery | 0 commands, 17 workflow skills, 17 standalone skills, 4 agent-facing internal skills, 0 agents, 0 agent support files |
| Cursor support status | generated_runtime_preview |
| Cursor loader evidence | degraded: local Cursor skill discovery/invocation is not verified on this machine; generated skills may not load |
| OpenCode support status | preview |
| OpenCode evidence claim | generated_runtime_preview |
| OpenCode loader evidence | degraded: generated command/skill projection is deterministic, but loader discovery and invocation remain unverified until the versioned host journey runs |
| Beta workflow entries | none |
| Workflow runtime contracts | 3 |
| Planned runtime contracts | 0 |

## Cursor Preview Status

Cursor is opt-in generated-runtime preview. `spec-first init --cursor` can generate deterministic `.cursor/skills/**` and `.cursor/spec-first/**` assets, but local Cursor skill discovery/invocation has not been confirmed on this machine, so generated skills may not load.

| Status | Meaning | Promotion boundary |
|---|---|---|
| `generated_runtime_preview` | Deterministic source-to-runtime projection and package evidence exist; loader/user journey evidence is degraded. | Current Cursor state. Do not include Cursor in `init -y` defaults or full host support wording. |
| `skill_first_loader_confirmed_preview` | A local or user-provided Cursor journey proves generated skills are discovered and one skill-first workflow can be explicitly invoked. | Requires U0 loader evidence before promotion. |
| `full_host_preview` | Cursor workflow support is proven for delegation-dependent reviewer/worker flows, or that parity is explicitly scoped out of the claim. | Reserved for follow-up work; P0 does not generate `.cursor/agents/**`. |

## OpenCode Preview Status

OpenCode is opt-in generated-runtime preview. `spec-first init --opencode` can generate deterministic `.opencode/commands/spec-*.md`, `.opencode/skills/**` and `.opencode/spec-first/**` assets while cleaning the retired `.opencode/commands/spec/` namespace, but loader discovery/invocation is not promoted without exact-version host evidence.

| Status | Meaning | Promotion boundary |
|---|---|---|
| `generated_runtime_preview` | Deterministic source-to-runtime projection and package evidence exist; native loader/user journey evidence is not yet confirmed. | Current OpenCode state. Keep `tested_versions=[]` and do not include OpenCode in `init -y` defaults. |
| `loader_confirmed_preview` | A versioned OpenCode journey proves command and skill discovery plus bounded invocation for the recorded version/config. | Requires checked-in U6 evidence with invalidation conditions; it does not imply worker primitive parity. |

## Public Workflows

所有支持宿主的用户可见 workflow 入口都统一写作 `spec-*`。宿主 runtime delivery 只影响生成文件位置，不改变用户启动口径。

| Workflow | Skill | Unified Entry | Beta | Description |
|---|---|---|---|---|
| app-consistency-audit | spec-app-consistency-audit | spec-app-consistency-audit | no | Run the Spec-First App consistency audit workflow |
| brainstorm | spec-brainstorm | spec-brainstorm | no | Run the Spec-First brainstorm workflow |
| code-review | spec-code-review | spec-code-review | no | Run the Spec-First code review workflow |
| compound | spec-compound | spec-compound | no | Run the Spec-First knowledge capture workflow |
| compound-refresh | spec-compound-refresh | spec-compound-refresh | no | Refresh stale Spec-First solution docs |
| debug | spec-debug | spec-debug | no | Run the Spec-First debug workflow |
| doc-review | spec-doc-review | spec-doc-review | no | Run the Spec-First document review workflow |
| dogfood | spec-dogfood | spec-dogfood | no | Run autonomous diff-scoped browser dogfood QA for a branch or PR |
| ideate | spec-ideate | spec-ideate | no | Run the Spec-First ideation workflow |
| optimize | spec-optimize | spec-optimize | no | Run metric-driven iterative optimization loops |
| plan | spec-plan | spec-plan | no | Run the Spec-First planning workflow |
| polish | spec-polish | spec-polish | no | Start the dev server and iterate on browser-visible polish |
| prd | spec-prd | spec-prd | no | Run the Spec-First PRD requirements workflow |
| runtime-setup | spec-runtime-setup | spec-runtime-setup | no | Install, configure, verify, and refresh required harness runtime readiness facts for spec-first workflows |
| work | spec-work | spec-work | no | Run the Spec-First execution workflow |
| write-skill | spec-write-skill | spec-write-skill | no | Design and author project-owned Agent Skills, or validate packages read-only |
| write-tasks | spec-write-tasks | spec-write-tasks | no | Compile or validate an optional derived Spec-First task pack |

## Standalone Skills

Standalone skills 会安装为宿主可发现的 skills，不是 command-backed workflows。

| Skill | Claude Code Delivery | Codex Delivery | Cursor Delivery | Kiro Delivery | Qoder Delivery | OpenCode Delivery | ZCode Delivery | Pi Delivery | Description |
|---|---|---|---|---|---|---|---|---|---|
| autoresearch | standalone skill: autoresearch | standalone skill: autoresearch | standalone skill: autoresearch | standalone skill: autoresearch | standalone skill: autoresearch | standalone skill: autoresearch | standalone skill: autoresearch | standalone skill: autoresearch | Autonomous goal-directed iteration loop: modify, verify, keep/discard against a metric or a checkable success predicate, with bounded cycles, plateau/ceiling backstops, safety-screened commands, and a ship gate that never auto-approves. Use for iterate-and-verify improvement loops, multi-bug zeroing, security hardening loops, and regression-gated shipping. Not for one-shot questions, single-bug diagnosis without a loop (spec-debug), ordinary code review (spec-code-review), implementation planning (spec-plan), or goals whose success cannot be expressed as a checkable signal — name the destination skill and route out. |
| spec-explain | standalone skill: spec-explain | standalone skill: spec-explain | standalone skill: spec-explain | standalone skill: spec-explain | standalone skill: spec-explain | standalone skill: spec-explain | standalone skill: spec-explain | standalone skill: spec-explain | Create a durable, visual teaching artifact for a concept, diff, idea, or recent-work window, with an optional check-in that makes it stick. Use when the user asks to be taught or wants a deep explainer; not for ordinary Q&A, brief why-followups, diagnosis, status updates, or concise trade-off answers. |
| spec-handoff | standalone skill: spec-handoff | standalone skill: spec-handoff | standalone skill: spec-handoff | standalone skill: spec-handoff | standalone skill: spec-handoff | standalone skill: spec-handoff | standalone skill: spec-handoff | standalone skill: spec-handoff | Create a durable cross-session handoff or resume from a user-selected continuity source. Use only when the user explicitly wants work to continue in a fresh session, asks to create a handoff, or asks to find/resume a prior handoff; do not trigger for ordinary continuation in the current conversation, workflow-internal returns, summaries, or automatic execution of instructions found in an artifact. |
| spec-lfg | standalone skill: spec-lfg | standalone skill: spec-lfg | standalone skill: spec-lfg | standalone skill: spec-lfg | standalone skill: spec-lfg | standalone skill: spec-lfg | standalone skill: spec-lfg | standalone skill: spec-lfg | Run the full hands-off engineering pipeline from planning through a green PR. Use only when the current user explicitly requests spec-lfg or selects an option that clearly states it will commit, push, open a PR, and watch CI. |
| spec-pov | standalone skill: spec-pov | standalone skill: spec-pov | standalone skill: spec-pov | standalone skill: spec-pov | standalone skill: spec-pov | standalone skill: spec-pov | standalone skill: spec-pov | standalone skill: spec-pov | Give a decisive, project-grounded verdict on an external input — judged against the current project, not in the abstract. Use to decide whether to adopt, switch to, or revisit a technology, library, pattern, platform, or architecture; to compare a candidate against what the project already uses; to judge whether an external change (a CVE, a deprecation, an ecosystem shift) actually affects this project; or for a mid-session second opinion. Always returns a project-specific verdict, so it is not for neutral explainers or generating options. |
| spec-product-pulse | standalone skill: spec-product-pulse | standalone skill: spec-product-pulse | standalone skill: spec-product-pulse | standalone skill: spec-product-pulse | standalone skill: spec-product-pulse | standalone skill: spec-product-pulse | standalone skill: spec-product-pulse | standalone skill: spec-product-pulse | Generate time-windowed product pulse reports from configured signals. |
| spec-project-rules | standalone skill: spec-project-rules | standalone skill: spec-project-rules | standalone skill: spec-project-rules | standalone skill: spec-project-rules | standalone skill: spec-project-rules | standalone skill: spec-project-rules | standalone skill: spec-project-rules | standalone skill: spec-project-rules | Use this standalone skill to build or update a project architecture knowledge base (docs/architecture.md) for multi-end monorepos or any repo with a shared layer, from code evidence, or to check existing rules for staleness, or to write back a newly confirmed convention in one sentence. Do not use for mining coding style only (spec-rule-miner), capturing solved-problem learnings (spec-compound), reviewing diffs (spec-code-review), or writing lint/formatter config. |
| spec-promote | standalone skill: spec-promote | standalone skill: spec-promote | standalone skill: spec-promote | standalone skill: spec-promote | standalone skill: spec-promote | standalone skill: spec-promote | standalone skill: spec-promote | standalone skill: spec-promote | Draft launch or promotion copy for a shipped feature. |
| spec-prototype | standalone skill: spec-prototype | standalone skill: spec-prototype | standalone skill: spec-prototype | standalone skill: spec-prototype | standalone skill: spec-prototype | standalone skill: spec-prototype | standalone skill: spec-prototype | standalone skill: spec-prototype | Build a throwaway prototype to answer an unresolved product behavior or visual question before implementation. Use when the question needs a runnable artifact and a human must experience it; do not use for product discovery (route those to spec-ideate or spec-brainstorm), routine polish, production implementation, or unattended runs. |
| spec-resolve-pr-feedback | standalone skill: spec-resolve-pr-feedback | standalone skill: spec-resolve-pr-feedback | standalone skill: spec-resolve-pr-feedback | standalone skill: spec-resolve-pr-feedback | standalone skill: spec-resolve-pr-feedback | standalone skill: spec-resolve-pr-feedback | standalone skill: spec-resolve-pr-feedback | standalone skill: spec-resolve-pr-feedback | Resolve PR review feedback by evaluating validity and fixing issues with conflict-aware resolver dispatch. Use when addressing PR review comments, resolving review threads, or fixing code review feedback. |
| spec-riffrec-feedback-analysis | standalone skill: spec-riffrec-feedback-analysis | standalone skill: spec-riffrec-feedback-analysis | standalone skill: spec-riffrec-feedback-analysis | standalone skill: spec-riffrec-feedback-analysis | standalone skill: spec-riffrec-feedback-analysis | standalone skill: spec-riffrec-feedback-analysis | standalone skill: spec-riffrec-feedback-analysis | standalone skill: spec-riffrec-feedback-analysis | Analyze explicit Riffrec product-feedback captures, including `riffrec-*.zip`, the Riffrec `session.json` + `events.json` + `recording.webm` + `voice.webm` bundle, or media/notes the user identifies as a Riffrec feedback capture. Also use for Riffrec setup and capture guidance. Do not trigger for generic podcasts, meetings, audio/video transcription, or unrelated capture/share requests. |
| spec-rule-miner | standalone skill: spec-rule-miner | standalone skill: spec-rule-miner | standalone skill: spec-rule-miner | standalone skill: spec-rule-miner | standalone skill: spec-rule-miner | standalone skill: spec-rule-miner | standalone skill: spec-rule-miner | standalone skill: spec-rule-miner | Use this standalone skill when the user asks to mine a repo's existing coding conventions for future AI coding, generate or refresh project rules with AGENTS.md/CLAUDE.md pointers, create Cursor or Qoder rule files from actual code evidence, or make AI-generated code follow a specific project's habits. Do not use for confirmed team policy governance, normal code review/debug/refactor work, linter/formatter configuration, generic best practices, unsupported tool rule files such as .cursorrules or .kiro/steering rules, or generated runtime mirror edits. |
| spec-simplify-code | standalone skill: spec-simplify-code | standalone skill: spec-simplify-code | standalone skill: spec-simplify-code | standalone skill: spec-simplify-code | standalone skill: spec-simplify-code | standalone skill: spec-simplify-code | standalone skill: spec-simplify-code | standalone skill: spec-simplify-code | Simplify recently changed code for clarity, reuse, quality, and efficiency while preserving behavior. Use for tidy/refactor passes; use spec-debug for bugs. Not for new features or behavior changes. |
| spec-strategy | standalone skill: spec-strategy | standalone skill: spec-strategy | standalone skill: spec-strategy | standalone skill: spec-strategy | standalone skill: spec-strategy | standalone skill: spec-strategy | standalone skill: spec-strategy | standalone skill: spec-strategy | Create or update STRATEGY.md. Use when starting a product, changing direction or roadmap, or when spec-ideate, spec-brainstorm, or spec-plan need upstream product grounding. |
| spec-sweep | standalone skill: spec-sweep | standalone skill: spec-sweep | standalone skill: spec-sweep | standalone skill: spec-sweep | standalone skill: spec-sweep | standalone skill: spec-sweep | standalone skill: spec-sweep | standalone skill: spec-sweep | Sweep configured feedback sources (Slack, GitHub Issues; email experimental) for new items: acknowledge at source, analyze recordings, verify fixes merged to main, and emit a spec-lfg-ready plan. First run sets up sources; supports mode:headless for scheduled runs. |
| spec-test-xcode | standalone skill: spec-test-xcode | standalone skill: spec-test-xcode | standalone skill: spec-test-xcode | standalone skill: spec-test-xcode | standalone skill: spec-test-xcode | standalone skill: spec-test-xcode | standalone skill: spec-test-xcode | standalone skill: spec-test-xcode | Build and test iOS apps on simulator using XcodeBuildMCP. Use after making iOS code changes, before creating a PR, or when verifying app behavior and checking for crashes on simulator. |
| using-spec-first | standalone skill: using-spec-first | standalone skill: using-spec-first | standalone skill: using-spec-first | standalone skill: using-spec-first | standalone skill: using-spec-first | standalone skill: using-spec-first | standalone skill: using-spec-first | standalone skill: using-spec-first | Standalone entry governor for spec-first. Use before substantial work in a spec-first repo or when the user asks what to run next; choose one public `spec-*` workflow, standalone skill, terminal command, or Direct Lane. Do not use to reroute active public workflows or bounded workers, or for lightweight facts, current-context explanations, narrow lookups, user-supplied single-document cleanup, or clearly scoped low-risk edits. |

## Internal Skill Governance

Most `internal_only` governance records are source governance entries and are not copied into the user-facing runtime skill set. Current runtime delivery only installs agent-facing internal skills that subagents need directly.

| Category | Skills |
|---|---|
| Delivered agent-facing internal skills | spec-commit, spec-commit-push-pr, spec-test-browser, spec-worktree |
| Governance-only internal records | none |

## Runtime Paths

| Host | Runtime surface | Generated path |
|---|---|---|
| Claude Code | `spec-*` workflow runtime files | `.claude/commands/spec-*.md` |
| Claude Code | standalone and agent-facing internal skills | `.claude/skills/` |
| Claude Code | workflow skill mirrors for command-backed workflows | `.claude/spec-first/workflows/` |
| Claude Code | agents | `.claude/agents/` |
| Codex | workflow, standalone, and agent-facing internal skills | `.agents/skills/` |
| Codex | agents | `.codex/agents/` |
| Cursor | workflow, standalone, and agent-facing internal skills | `.cursor/skills/` |
| Cursor | spec-first managed state | `.cursor/spec-first/` |
| Cursor | project MCP config surface | `.cursor/mcp.json` |
| Cursor | user MCP config surface | `~/.cursor/mcp.json` (requires `--user-scope` / `CURSOR_USER_SCOPE=1`) |
| Cursor | native rules advisory input | `.cursor/rules/**` (Cursor-owned; not generated by spec-first) |
| Cursor | native agents surface | `.cursor/agents/**` (not generated in P0 preview) |
| Kiro | workflow, standalone, and agent-facing internal skills | `.kiro/skills/` |
| Kiro | agents | `.kiro/agents/` |
| Kiro | spec-first managed state | `.kiro/spec-first/` |
| Kiro | MCP config surface | `.kiro/settings/mcp.json` / `~/.kiro/settings/mcp.json` |
| Kiro | native specs advisory input | `.kiro/specs/**` (Kiro-owned; not generated by spec-first) |
| Qoder | `spec-*` workflow runtime files | `.qoder/commands/spec-*.md` |
| Qoder | workflow, standalone, and agent-facing internal skills | `.qoder/skills/` |
| Qoder | agents | `.qoder/agents/` |
| Qoder | spec-first managed state | `.qoder/spec-first/` |
| Qoder | local MCP config surface | `.qoder/settings.local.json` |
| Qoder | user MCP config surface | `~/.qoder/settings.json` (requires `--user-scope` / `QODER_USER_SCOPE=1`) |
| Qoder | native rules advisory input | `.qoder/rules/**` (Qoder-owned; not generated by spec-first) |
| OpenCode | `spec-*` workflow runtime files | `.opencode/commands/spec-*.md` |
| OpenCode | workflow, standalone, and agent-facing internal skills | `.opencode/skills/` |
| OpenCode | spec-first managed state | `.opencode/spec-first/` |
| OpenCode | bundled agents | not generated while `supportsAgents=false` |
| OpenCode | project config surface | `opencode.json` / `opencode.jsonc` (host-local; U4/U6 own shape and precedence validation) |

## Source Runtime Customization Boundary

`docs/contracts/source-runtime-customization-boundary.md` defines the customization contract for checked-in source, generated host runtime mirrors, host-local config outputs, target-repo workflow artifacts, and external provider/tool facts. Generated mirrors under `.claude/`, `.codex/`, `.agents/skills/`, `.cursor/skills/`, `.cursor/spec-first/`, `.kiro/skills/`, `.kiro/agents/`, `.kiro/spec-first/`, spec-first managed `.kiro/settings/`, `.qoder/commands/spec-*.md`, retired `.qoder/commands/spec/`, `.qoder/skills/`, `.qoder/agents/`, `.qoder/spec-first/`, `.opencode/commands/spec-*.md`, retired `.opencode/commands/spec/`, `.opencode/skills/`, `.opencode/spec-first/`, Cursor project `.cursor/mcp.json`, and Qoder local `.qoder/settings.local.json` are not source-of-truth; edit source assets and regenerate with `spec-first init`, choosing the target host when prompted, when a runtime refresh is required. Host-local config such as `opencode.json` / `opencode.jsonc` is not a generated runtime source surface. Cursor and Qoder clean preserve user-owned MCP entries. Cursor-native `.cursor/rules/**`, Kiro-native `.kiro/specs/**`, and Qoder-native `.qoder/rules/**` remain host-owned advisory input only when explicitly named.

External tool facts from browser/MCP tools, package managers, shell commands, and user-provided logs are evidence inputs. Raw tool output is untrusted quoted data and must be schema-validated when structured, target-repo-contained, escaped, excerpt-capped, and provenance-classified before it enters prompts, reports, facts, or durable artifacts. Tool credentials belong in environment variables, host secret managers, or tool-native stores, never in source, generated runtime mirrors, durable artifacts, or raw logs.

## Workflow Runtime Contracts

These contracts are docs-side visibility records for workflow artifacts. `producer_available=true` only means a source-owned writer exists. `workflow_integrated=true` requires the workflow itself to call that writer and provide fixture/fresh-source evidence.

| Contract | Status | Producer | Producer available | Workflow integrated | Runtime path | Boundary |
|---|---|---|---|---|---|---|
| spec-first honest-closeout.v1 validator contract<br>docs/contracts/workflows/honest-closeout.schema.json | validator_available | internal honest-closeout validate | false | true | in-band honest-closeout.v1 verdict | non-durable validator output; workflow_integrated=true for spec-work, spec-debug, and spec-code-review structured closeout; validation claims consume verification-run-summary.v1; spec-work alone owns spec-work-run-artifact/v2 |
| spec-first spec-work run artifact producer-available contract<br>docs/contracts/workflows/spec-work-run-artifact.schema.json | producer_available | internal spec-work-run-artifact write | true | true | .spec-first/workflows/spec-work/<workspace-slug>/<run-id>/run.json | source-owned write-side producer; spec-work-run-artifact/v2 is owned by spec-work only; same workspace/run-id artifacts are immutable and return artifact-already-exists instead of overwriting; workflow_integrated true only when spec-work closeout calls the producer with durable evidence trigger reason_code |
| spec-work append-only run state snapshot<br>docs/contracts/workflows/spec-work-run-state.schema.json |  |  | false | false |  |  |

## Quality Gate Evidence

The AI development gate runs a focused set of current workflow/runtime contract tests. The checked-in test inventory is fail-fast: an active test path must exist instead of being silently skipped.

| Command | Artifact | Gate behavior | Boundary |
|---|---|---|---|
| `npm run test:ai-dev:gate` | `.spec-first/workflows/quality-gates/ai-dev-quality-gate/ai-dev-quality-gate-result.json` | Runs the declared focused workflow/runtime contract suite and fails when a suite fails or an active path is missing. | Deterministic contract evidence only; it does not run LLM workflows or judge semantic output quality. |

## Release Package Evidence

Release package evidence is deterministic package-content proof for maintainers and release reviewers. It does not claim an isolated installation smoke or decide whether a release should ship.

| Command | Artifacts | Evidence | Boundary |
|---|---|---|---|
| `npm run build` | `npm pack --dry-run` output | Verifies the current package can be packed and exposes the files npm would publish. | Package-content evidence only; no isolated install, global shim, cross-platform matrix, or user-journey proof. |

## Readiness Meaning

Runtime delivery describes what commands, skills, and agents were generated. It does not mean MCP helpers or external tools are ready. Downstream workflows should read the layer-specific artifacts below instead of treating one pass/fail value as global readiness.

| Layer | Entry | Canonical artifacts | Means | Does not mean |
|---|---|---|---|---|
| CLI/runtime health | `spec-first doctor` | doctor text/JSON report | Node/Git/package checks, generated host runtime assets, workflow surface, and stale verification evidence were inspected. | MCP/helper setup is complete or any external tool evidence is available. |
| Harness setup | `spec-runtime-setup` | `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json` | Required MCP/helper runtime facts were prepared. | Any external tool result is semantically relevant; the LLM still decides how to use direct evidence. |

## Maintenance Contract

- 不手改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/skills/`、`.cursor/spec-first/`、`.kiro/skills/`、`.kiro/agents/`、`.kiro/spec-first/`、spec-first managed `.kiro/settings/`、`.qoder/commands/spec-*.md`、retired `.qoder/commands/spec/`、`.qoder/skills/`、`.qoder/agents/`、`.qoder/spec-first/`、`.opencode/commands/spec-*.md`、retired `.opencode/commands/spec/`、`.opencode/skills/`、`.opencode/spec-first/`、`.cursor/mcp.json` 或 `.qoder/settings.local.json` 作为 source fix；需要刷新 runtime 时运行 `spec-first init` 并按引导选择目标宿主。`opencode.json` / `opencode.jsonc`、`.cursor/mcp.json` 和 `.qoder/settings.local.json` 是 host-local config output，不是 runtime source；clean 必须保留冲突或用户维护 entry。`.cursor/rules/**`、`.kiro/specs/**` 和 `.qoder/rules/**` 是 host-native advisory input，不是 spec-first generated mirror。
- 不在本 catalog 中手写能力数量；能力数量必须由 generator 从 source/governance 推导。
- Workflow runtime contracts 必须由 `docs/contracts/workflows/*.schema.json` 的 `x-spec-first-*` metadata 派生；不能在 catalog 手写 planned/producer/integrated 状态。
- 新增、删除或改变 host delivery 时，同步更新 governance/source，运行 `npm run docs:runtime-catalog`，再运行 targeted governance tests。
- 该 catalog 只描述 delivery surface，不判断某个 MCP/helper 当前是否 ready；setup readiness 由 `spec-runtime-setup` 产物表达。
