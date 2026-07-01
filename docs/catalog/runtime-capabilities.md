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
| `agents/**/*.agent.md` | Claude/Codex 双宿主 agent source |
| `docs/contracts/workflows/*.schema.json` | docs-side workflow artifact contracts；planned contract 不等于 runtime producer 已实现 |

## Summary

| 范围 | 当前值 |
|---|---|
| Bundled source skills | 37 |
| Bundled source agents | 51 |
| Bundled agent support files | 0 |
| Governance records by entry surface | internal_only: 15, standalone_skill: 2, workflow_command: 20 |
| Claude runtime delivery | 20 commands, 20 workflow skills, 2 standalone skills, 1 agent-facing internal skills, 51 agents, 0 agent support files |
| Codex runtime delivery | 0 commands, 20 workflow skills, 2 standalone skills, 1 agent-facing internal skills, 51 agents, 0 agent support files |
| Beta workflow entries | spec-polish-beta |
| Workflow runtime contracts | 2 |
| Planned runtime contracts | 0 |

## Public Workflows

| Workflow | Skill | Claude Entry | Codex Entry | Host Delivery | Beta | Description |
|---|---|---|---|---|---|---|
| app-consistency-audit | spec-app-consistency-audit | /spec:app-consistency-audit | $spec-app-consistency-audit | claude=command; codex=skill | no | Run the Spec-First App consistency audit workflow |
| brainstorm | spec-brainstorm | /spec:brainstorm | $spec-brainstorm | claude=command; codex=skill | no | Run the Spec-First brainstorm workflow |
| code-review | spec-code-review | /spec:code-review | $spec-code-review | claude=command; codex=skill | no | Run the Spec-First code review workflow |
| compound | spec-compound | /spec:compound | $spec-compound | claude=command; codex=skill | no | Run the Spec-First knowledge capture workflow |
| compound-refresh | spec-compound-refresh | /spec:compound-refresh | $spec-compound-refresh | claude=command; codex=skill | no | Refresh stale Spec-First solution docs |
| debug | spec-debug | /spec:debug | $spec-debug | claude=command; codex=skill | no | Run the Spec-First debug workflow |
| doc-review | spec-doc-review | /spec:doc-review | $spec-doc-review | claude=command; codex=skill | no | Run the Spec-First document review workflow |
| ideate | spec-ideate | /spec:ideate | $spec-ideate | claude=command; codex=skill | no | Run the Spec-First ideation workflow |
| mcp-setup | spec-mcp-setup | /spec:mcp-setup | $spec-mcp-setup | claude=command; codex=skill | no | Install, configure, verify, and refresh required harness runtime readiness facts for spec-first workflows |
| optimize | spec-optimize | /spec:optimize | $spec-optimize | claude=command; codex=skill | no | Run metric-driven iterative optimization loops |
| plan | spec-plan | /spec:plan | $spec-plan | claude=command; codex=skill | no | Run the Spec-First planning workflow |
| polish-beta | spec-polish-beta | /spec:polish-beta | $spec-polish-beta | claude=command; codex=skill | yes | [BETA] Start the dev server and iterate on browser-visible polish |
| prd | spec-prd | /spec:prd | $spec-prd | claude=command; codex=skill | no | Run the Spec-First PRD requirements workflow |
| release-notes | spec-release-notes | /spec:release-notes | $spec-release-notes | claude=command; codex=skill | no | Summarize recent spec-first releases or answer release questions |
| sessions | spec-sessions | /spec:sessions | $spec-sessions | claude=command; codex=skill | no | Search and summarize prior coding agent sessions |
| skill-audit | spec-skill-audit | /spec:skill-audit | $spec-skill-audit | claude=command; codex=skill | no | Run the Spec-First skill audit workflow |
| slack-research | spec-slack-research | /spec:slack-research | $spec-slack-research | claude=command; codex=skill | no | Search Slack for interpreted organizational context |
| work | spec-work | /spec:work | $spec-work | claude=command; codex=skill | no | Run the Spec-First execution workflow |
| write-skill | spec-write-skill | /spec:write-skill | $spec-write-skill | claude=command; codex=skill | no | Write, revise, migrate, or remediate spec-first source skills |
| write-tasks | spec-write-tasks | /spec:write-tasks | $spec-write-tasks | claude=command; codex=skill | no | Public workflow entrypoint (/spec:write-tasks, $spec-write-tasks): compile a settled local spec-plan into an optional derived task pack for spec-work, or validate an existing local task pack before execution. Use for explicit plan-splitting/task-doc requests or high-complexity work suitability; do not use for plan authoring, implementation execution, unresolved scope, small low-risk plans, progress/approval state, remote/generic task lists, or generated runtime mirror edits. Keep the plan as single source of truth; tasks are derived and optional. |

## Standalone Skills

Standalone skills 会安装为宿主可发现的 skills，不是 command-backed workflows。

| Skill | Claude Delivery | Codex Delivery | Description |
|---|---|---|---|
| spec-team-standards-governance | standalone skill: spec-team-standards-governance | standalone skill: spec-team-standards-governance | Govern team development standards as source documents: query confirmed standards, audit standards health, draft candidates, and prepare promotion/deprecation proposals without restoring spec-standards. |
| using-spec-first | standalone skill: using-spec-first | standalone skill: using-spec-first | Use before substantial work in a spec-first project, and when users ask what spec-first workflow or command to run next. Decide whether to route into a public spec-first workflow before non-trivial or risky edits, running state-changing commands, debugging, reviewing, planning, setup, update, or architecture/prompt/workflow decisions. |

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

## Source Runtime Customization Boundary

`docs/contracts/source-runtime-customization-boundary.md` defines the customization contract for checked-in source, generated host runtime mirrors, target-repo workflow artifacts, and external provider/tool facts. Generated mirrors under `.claude/`, `.codex/`, and `.agents/skills/` are not source-of-truth; edit source assets and regenerate with `spec-first init`, choosing the target host when prompted, when a runtime refresh is required.

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
| `npm run test:release:install` / npm install matrix | `.spec-first/ci/npm-install-matrix/<runner>/package-content-manifest.json`, `init-claude-programmatic.log`, `init-codex-programmatic.log`, `release-artifact-summary.json` | npm pack dry-run file manifest, tarball-installed programmatic `buildInitPlan` / `applyInitPlan` evidence for Claude/Codex, and release reviewer summary. | Deterministic release evidence only; no dashboard, history store, GitHub Release automation, or release decision engine. |

## Readiness Meaning

Runtime delivery describes what commands, skills, and agents were generated. It does not mean MCP helpers or external tools are ready. Downstream workflows should read the layer-specific artifacts below instead of treating one pass/fail value as global readiness.

| Layer | Entry | Canonical artifacts | Means | Does not mean |
|---|---|---|---|---|
| CLI/runtime health | `spec-first doctor` | doctor text/JSON report | Node/Git/package checks, generated host runtime assets, workflow surface, and stale verification evidence were inspected. | MCP/helper setup is complete or any external tool evidence is available. |
| Harness setup | `/spec:mcp-setup` or `$spec-mcp-setup` | `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json` | Required MCP/helper runtime facts were prepared. | Any external tool result is semantically relevant; the LLM still decides how to use direct evidence. |

## Maintenance Contract

- 不手改 `.claude/`、`.codex/` 或 `.agents/skills/` 作为 source fix；需要刷新 runtime 时运行 `spec-first init` 并按引导选择目标宿主。
- 不在本 catalog 中手写能力数量；能力数量必须由 generator 从 source/governance 推导。
- Workflow runtime contracts 必须由 `docs/contracts/workflows/*.schema.json` 的 `x-spec-first-*` metadata 派生；不能在 catalog 手写 planned/producer/integrated 状态。
- 新增、删除或改变 host delivery 时，同步更新 governance/source，运行 `npm run docs:runtime-catalog`，再运行 targeted governance tests。
- 该 catalog 只描述 delivery surface，不判断某个 MCP/helper 当前是否 ready；setup readiness 由 `spec-mcp-setup` 产物表达。
