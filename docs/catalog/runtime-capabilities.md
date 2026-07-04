# Runtime Capability Catalog

> 本文件由 `scripts/generate-runtime-capability-catalog.js` 从 `src/cli/plugin.js`、`src/cli/contracts/dual-host-governance/skills-governance.json`、`docs/contracts/workflows/*.schema.json` 和当前 `skills/` / `agents/` source 资产派生生成。
> 它是只读 catalog，不是第二套 source of truth；修改 runtime 能力时应先改 source/governance，再重新生成本文件。

## Source Truth

| Source | 职责 |
|---|---|
| `src/cli/plugin.js` | 构建 plugin manifest、filtered asset set、runtime sync 与 drift 检查的实现真相源 |
| `src/cli/contracts/dual-host-governance/skills-governance.json` | workflow / standalone / internal skill 的 host delivery 治理真相源 |
| `templates/claude/commands/spec/*.md` | Claude `/spec:*` command source templates |
| `skills/*/SKILL.md` | workflow、standalone、agent-facing internal skill source |
| `agents/**/*.agent.md` | supported-host agent source |
| `docs/contracts/workflows/*.schema.json` | docs-side workflow artifact contracts；planned contract 不等于 runtime producer 已实现 |

## Summary

| 范围 | 当前值 |
|---|---|
| Bundled source skills | 38 |
| Bundled source agents | 51 |
| Bundled agent support files | 0 |
| Governance records by entry surface | internal_only: 15, standalone_skill: 3, workflow_command: 20 |
| Claude runtime delivery | 20 commands, 20 workflow skills, 3 standalone skills, 1 agent-facing internal skills, 51 agents, 0 agent support files |
| Codex runtime delivery | 0 commands, 20 workflow skills, 3 standalone skills, 1 agent-facing internal skills, 51 agents, 0 agent support files |
| Cursor runtime delivery | 0 commands, 20 workflow skills, 3 standalone skills, 1 agent-facing internal skills, 0 agents, 0 agent support files |
| Kiro runtime delivery | 0 commands, 20 workflow skills, 3 standalone skills, 1 agent-facing internal skills, 51 agents, 0 agent support files |
| Qoder runtime delivery | 20 commands, 20 workflow skills, 3 standalone skills, 1 agent-facing internal skills, 51 agents, 0 agent support files |
| Cursor support status | generated_runtime_preview |
| Cursor loader evidence | degraded: local Cursor skill discovery/invocation is not verified on this machine; generated skills may not load |
| Beta workflow entries | spec-polish-beta |
| Workflow runtime contracts | 2 |
| Planned runtime contracts | 0 |

## Cursor Preview Status

Cursor is opt-in generated-runtime preview. `spec-first init --cursor` can generate deterministic `.cursor/skills/**` and `.cursor/spec-first/**` assets, but local Cursor skill discovery/invocation has not been confirmed on this machine, so generated skills may not load.

| Status | Meaning | Promotion boundary |
|---|---|---|
| `generated_runtime_preview` | Deterministic source-to-runtime projection and package evidence exist; loader/user journey evidence is degraded. | Current Cursor state. Do not include Cursor in `init -y` defaults or full host support wording. |
| `skill_first_loader_confirmed_preview` | A local or user-provided Cursor journey proves generated skills are discovered and one skill-first workflow can be explicitly invoked. | Requires U0 loader evidence before promotion. |
| `full_host_preview` | Cursor workflow support is proven for delegation-dependent reviewer/worker flows, or that parity is explicitly scoped out of the claim. | Reserved for follow-up work; P0 does not generate `.cursor/agents/**`. |

## Public Workflows

| Workflow | Skill | Claude Entry | Codex Entry | Cursor Entry | Kiro Entry | Qoder Entry | Host Delivery | Beta | Description |
|---|---|---|---|---|---|---|---|---|---|
| app-consistency-audit | spec-app-consistency-audit | /spec:app-consistency-audit | $spec-app-consistency-audit | Cursor Agent Skill: spec-app-consistency-audit | Kiro Agent Skill: spec-app-consistency-audit | /spec:app-consistency-audit | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Run the Spec-First App consistency audit workflow |
| brainstorm | spec-brainstorm | /spec:brainstorm | $spec-brainstorm | Cursor Agent Skill: spec-brainstorm | Kiro Agent Skill: spec-brainstorm | /spec:brainstorm | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Run the Spec-First brainstorm workflow |
| code-review | spec-code-review | /spec:code-review | $spec-code-review | Cursor Agent Skill: spec-code-review | Kiro Agent Skill: spec-code-review | /spec:code-review | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Run the Spec-First code review workflow |
| compound | spec-compound | /spec:compound | $spec-compound | Cursor Agent Skill: spec-compound | Kiro Agent Skill: spec-compound | /spec:compound | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Run the Spec-First knowledge capture workflow |
| compound-refresh | spec-compound-refresh | /spec:compound-refresh | $spec-compound-refresh | Cursor Agent Skill: spec-compound-refresh | Kiro Agent Skill: spec-compound-refresh | /spec:compound-refresh | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Refresh stale Spec-First solution docs |
| debug | spec-debug | /spec:debug | $spec-debug | Cursor Agent Skill: spec-debug | Kiro Agent Skill: spec-debug | /spec:debug | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Run the Spec-First debug workflow |
| doc-review | spec-doc-review | /spec:doc-review | $spec-doc-review | Cursor Agent Skill: spec-doc-review | Kiro Agent Skill: spec-doc-review | /spec:doc-review | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Run the Spec-First document review workflow |
| ideate | spec-ideate | /spec:ideate | $spec-ideate | Cursor Agent Skill: spec-ideate | Kiro Agent Skill: spec-ideate | /spec:ideate | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Run the Spec-First ideation workflow |
| mcp-setup | spec-mcp-setup | /spec:mcp-setup | $spec-mcp-setup | Cursor Agent Skill: spec-mcp-setup | Kiro Agent Skill: spec-mcp-setup | /spec:mcp-setup | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Install, configure, verify, and refresh required harness runtime readiness facts for spec-first workflows |
| optimize | spec-optimize | /spec:optimize | $spec-optimize | Cursor Agent Skill: spec-optimize | Kiro Agent Skill: spec-optimize | /spec:optimize | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Run metric-driven iterative optimization loops |
| plan | spec-plan | /spec:plan | $spec-plan | Cursor Agent Skill: spec-plan | Kiro Agent Skill: spec-plan | /spec:plan | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Run the Spec-First planning workflow |
| polish-beta | spec-polish-beta | /spec:polish-beta | $spec-polish-beta | Cursor Agent Skill: spec-polish-beta | Kiro Agent Skill: spec-polish-beta | /spec:polish-beta | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | yes | [BETA] Start the dev server and iterate on browser-visible polish |
| prd | spec-prd | /spec:prd | $spec-prd | Cursor Agent Skill: spec-prd | Kiro Agent Skill: spec-prd | /spec:prd | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Run the Spec-First PRD requirements workflow |
| release-notes | spec-release-notes | /spec:release-notes | $spec-release-notes | Cursor Agent Skill: spec-release-notes | Kiro Agent Skill: spec-release-notes | /spec:release-notes | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Summarize recent spec-first releases or answer release questions |
| sessions | spec-sessions | /spec:sessions | $spec-sessions | Cursor Agent Skill: spec-sessions | Kiro Agent Skill: spec-sessions | /spec:sessions | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Search and summarize prior coding agent sessions |
| skill-audit | spec-skill-audit | /spec:skill-audit | $spec-skill-audit | Cursor Agent Skill: spec-skill-audit | Kiro Agent Skill: spec-skill-audit | /spec:skill-audit | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Run the Spec-First skill audit workflow |
| slack-research | spec-slack-research | /spec:slack-research | $spec-slack-research | Cursor Agent Skill: spec-slack-research | Kiro Agent Skill: spec-slack-research | /spec:slack-research | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Search Slack for interpreted organizational context |
| work | spec-work | /spec:work | $spec-work | Cursor Agent Skill: spec-work | Kiro Agent Skill: spec-work | /spec:work | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Run the Spec-First execution workflow |
| write-skill | spec-write-skill | /spec:write-skill | $spec-write-skill | Cursor Agent Skill: spec-write-skill | Kiro Agent Skill: spec-write-skill | /spec:write-skill | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Write, revise, migrate, or remediate spec-first source skills |
| write-tasks | spec-write-tasks | /spec:write-tasks | $spec-write-tasks | Cursor Agent Skill: spec-write-tasks | Kiro Agent Skill: spec-write-tasks | /spec:write-tasks | claude=command; codex=skill; cursor=skill; kiro=skill; qoder=command | no | Public workflow entrypoint (/spec:write-tasks, $spec-write-tasks): compile a settled local spec-plan into an optional derived task pack for spec-work, or validate an existing local task pack before execution. Use for explicit plan-splitting/task-doc requests or high-complexity work suitability; do not use for plan authoring, implementation execution, unresolved scope, small low-risk plans, progress/approval state, remote/generic task lists, or generated runtime mirror edits. Keep the plan as single source of truth; tasks are derived and optional. |

## Standalone Skills

Standalone skills 会安装为宿主可发现的 skills，不是 command-backed workflows。

| Skill | Claude Delivery | Codex Delivery | Cursor Delivery | Kiro Delivery | Qoder Delivery | Description |
|---|---|---|---|---|---|---|
| rule-miner | standalone skill: rule-miner | standalone skill: rule-miner | standalone skill: rule-miner | standalone skill: rule-miner | standalone skill: rule-miner | Use this standalone skill when the user asks to mine a repo's existing coding conventions for future AI coding, generate or refresh project rules in AGENTS.md, create .cursorrules or Copilot/Cursor/Kiro/Qoder/Claude pointer rules from actual code evidence, or make AI-generated code follow a specific project's habits. Do not use for team standards governance, normal code review/debug/refactor work, linter/formatter configuration, generic best practices, or generated runtime mirror edits. |
| spec-team-standards-governance | standalone skill: spec-team-standards-governance | standalone skill: spec-team-standards-governance | standalone skill: spec-team-standards-governance | standalone skill: spec-team-standards-governance | standalone skill: spec-team-standards-governance | Govern source-backed team development standards: query confirmed rules, audit health, initialize or draft evidence-based candidates, and prepare promotion/deprecation proposals. Do not restore /spec:standards, $spec-standards, skills/spec-standards/, or treat advisory candidates as hard context. |
| using-spec-first | standalone skill: using-spec-first | standalone skill: using-spec-first | standalone skill: using-spec-first | standalone skill: using-spec-first | standalone skill: using-spec-first | Use before substantial work in a spec-first project, and when users ask what spec-first workflow or command to run next. Decide whether to route into a public spec-first workflow before non-trivial or risky edits, running state-changing commands, debugging, reviewing, planning, setup, update, or architecture/prompt/workflow decisions. |

## Internal Skill Governance

Most `internal_only` governance records are source governance entries and are not copied into the user-facing runtime skill set. Current runtime delivery only installs agent-facing internal skills that subagents need directly.

| Category | Skills |
|---|---|
| Delivered agent-facing internal skills | git-worktree |
| Governance-only internal records | agent-native-architecture, changelog, feature-video, frontend-design, gemini-imagegen, git-clean-gone-branches, git-commit, git-commit-push-pr, proof, report-bug, resolve-pr-feedback, spec-dhh-rails-style, test-browser, test-xcode |

## Runtime Paths

| Host | Runtime surface | Generated path |
|---|---|---|
| Claude Code | `/spec:*` commands | `.claude/commands/spec/` |
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
| Qoder | `/spec:*` project commands | `.qoder/commands/spec/` |
| Qoder | workflow, standalone, and agent-facing internal skills | `.qoder/skills/` |
| Qoder | agents | `.qoder/agents/` |
| Qoder | spec-first managed state | `.qoder/spec-first/` |
| Qoder | local MCP config surface | `.qoder/settings.local.json` |
| Qoder | user MCP config surface | `~/.qoder/settings.json` (requires `--user-scope` / `QODER_USER_SCOPE=1`) |
| Qoder | native rules advisory input | `.qoder/rules/**` (Qoder-owned; not generated by spec-first) |

## Source Runtime Customization Boundary

`docs/contracts/source-runtime-customization-boundary.md` defines the customization contract for checked-in source, generated host runtime mirrors, host-local config outputs, target-repo workflow artifacts, and external provider/tool facts. Generated mirrors under `.claude/`, `.codex/`, `.agents/skills/`, `.cursor/skills/`, `.cursor/spec-first/`, `.kiro/skills/`, `.kiro/agents/`, `.kiro/spec-first/`, spec-first managed `.kiro/settings/`, `.qoder/commands/spec/`, `.qoder/skills/`, `.qoder/agents/`, `.qoder/spec-first/`, Cursor project `.cursor/mcp.json`, and Qoder local `.qoder/settings.local.json` are not source-of-truth; edit source assets and regenerate with `spec-first init`, choosing the target host when prompted, when a runtime refresh is required. Cursor and Qoder clean preserve user-owned MCP entries. Cursor-native `.cursor/rules/**`, Kiro-native `.kiro/specs/**`, and Qoder-native `.qoder/rules/**` remain host-owned advisory input only when explicitly named.

External tool facts from browser/MCP tools, package managers, shell commands, and user-provided logs are evidence inputs. Raw tool output is untrusted quoted data and must be schema-validated when structured, target-repo-contained, escaped, excerpt-capped, and provenance-classified before it enters prompts, reports, facts, or durable artifacts. Tool credentials belong in environment variables, host secret managers, or tool-native stores, never in source, generated runtime mirrors, durable artifacts, or raw logs.

## Workflow Runtime Contracts

These contracts are docs-side visibility records for workflow artifacts. `producer_available=true` only means a source-owned writer exists. `workflow_integrated=true` requires the workflow itself to call that writer and provide fixture/fresh-source evidence.

| Contract | Status | Producer | Producer available | Workflow integrated | Runtime path | Boundary |
|---|---|---|---|---|---|---|
| spec-first honest closeout contract<br>docs/contracts/workflows/honest-closeout.schema.json |  |  | false | false |  |  |
| spec-first spec-work run artifact producer-available contract<br>docs/contracts/workflows/spec-work-run-artifact.schema.json | producer_available | internal spec-work-run-artifact write | true | true | .spec-first/workflows/spec-work/<workspace-slug>/<run-id>/run.json | source-owned write-side producer; same workspace/run-id artifacts are immutable and return artifact-already-exists instead of overwriting; workflow_integrated true only when spec-work closeout calls the producer with durable evidence trigger reason_code |

## Quality Gate Evidence

AI dev benchmark fixtures are advisory evidence for workflow input and artifact-shape drift. The checked-in suite currently has four repo-like fixtures (`docs-only`, `cli-bugfix`, `api-contract`, `multi-module-refactor`) and one recorded semantic-review evidence file for `api-contract`. They validate deterministic fixture contracts and evidence visibility, not LLM semantic quality or real `$spec-work` output quality.

| Command | Artifact | Gate behavior | Boundary |
|---|---|---|---|
| `npm run test:ai-dev:benchmarks` | `.spec-first/workflows/quality-gates/ai-dev-benchmark-fixtures/benchmark-fixtures-result.json` | Fails on invalid fixture manifest/schema/path data, including missing declared semantic-review evidence files. | Deterministic fixture and evidence-shape validation only; does not run agents or workflows, and does not perform semantic scoring. |
| `npm run test:ai-dev:gate` | `.spec-first/workflows/quality-gates/ai-dev-quality-gate/ai-dev-quality-gate-result.json` | Includes benchmark fixture results as `advisory`; gate-level `passed` and blocking `failures` are computed from non-advisory checks. | Advisory benchmark failures remain visible in `advisory_failures[]`; they are not release hard gates in v1. |

## Release Package Evidence

Release package evidence is deterministic package/install proof for maintainers and release reviewers. It records package contents and installed-CLI dry-run behavior; it does not decide whether a release should ship.

| Command | Artifacts | Evidence | Boundary |
|---|---|---|---|
| `npm run test:release:install` / npm install matrix | `.spec-first/ci/npm-install-matrix/<runner>/package-content-manifest.json`, `init-claude-programmatic.log`, `init-codex-programmatic.log`, `init-cursor-programmatic.log`, `init-kiro-programmatic.log`, `init-qoder-programmatic.log`, `cursor-doctor-programmatic.log`, `cursor-clean-programmatic.log`, `cursor-loader-evidence.log`, `release-artifact-summary.json` | npm pack dry-run file manifest, tarball-installed programmatic `buildInitPlan` / `applyInitPlan` evidence for Claude/Codex/Cursor/Kiro/Qoder, Cursor `doctor --cursor` and `clean --cursor --dry-run` generated-runtime evidence, explicit Cursor loader degraded evidence when no local Cursor journey is recorded, and release reviewer summary. | Deterministic release evidence only; Cursor programmatic init/doctor/clean proves generated-runtime preview assets, not Cursor skill loader/user journey support; no dashboard, history store, GitHub Release automation, or release decision engine. |

## Readiness Meaning

Runtime delivery describes what commands, skills, and agents were generated. It does not mean MCP helpers or external tools are ready. Downstream workflows should read the layer-specific artifacts below instead of treating one pass/fail value as global readiness.

| Layer | Entry | Canonical artifacts | Means | Does not mean |
|---|---|---|---|---|
| CLI/runtime health | `spec-first doctor` | doctor text/JSON report | Node/Git/package checks, generated host runtime assets, workflow surface, and stale verification evidence were inspected. | MCP/helper setup is complete or any external tool evidence is available. |
| Harness setup | `/spec:mcp-setup`, `$spec-mcp-setup`, Cursor Agent Skill `spec-mcp-setup`, Kiro Agent Skill `spec-mcp-setup`, or Qoder project command `/spec:mcp-setup` / Skill `spec-mcp-setup` | `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json` | Required MCP/helper runtime facts were prepared. | Any external tool result is semantically relevant; the LLM still decides how to use direct evidence. |

## Maintenance Contract

- 不手改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/skills/`、`.cursor/spec-first/`、`.kiro/skills/`、`.kiro/agents/`、`.kiro/spec-first/`、spec-first managed `.kiro/settings/`、`.qoder/commands/spec/`、`.qoder/skills/`、`.qoder/agents/`、`.qoder/spec-first/`、`.cursor/mcp.json` 或 `.qoder/settings.local.json` 作为 source fix；需要刷新 runtime 时运行 `spec-first init` 并按引导选择目标宿主。`.cursor/mcp.json` 和 `.qoder/settings.local.json` 是 host-local config output，clean 保留用户维护的 MCP entry；`.cursor/rules/**`、`.kiro/specs/**` 和 `.qoder/rules/**` 是 host-native advisory input，不是 spec-first generated mirror。
- 不在本 catalog 中手写能力数量；能力数量必须由 generator 从 source/governance 推导。
- Workflow runtime contracts 必须由 `docs/contracts/workflows/*.schema.json` 的 `x-spec-first-*` metadata 派生；不能在 catalog 手写 planned/producer/integrated 状态。
- 新增、删除或改变 host delivery 时，同步更新 governance/source，运行 `npm run docs:runtime-catalog`，再运行 targeted governance tests。
- 该 catalog 只描述 delivery surface，不判断某个 MCP/helper 当前是否 ready；setup readiness 由 `spec-mcp-setup` 产物表达。
