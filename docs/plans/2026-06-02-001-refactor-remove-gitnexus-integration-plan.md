---
title: "refactor: 彻底删除 GitNexus active integration"
type: refactor
status: completed
date: 2026-06-02
spec_id: 2026-06-02-001-refactor-remove-gitnexus-integration
origin: docs/brainstorms/2026-06-02-001-refactor-remove-gitnexus-integration-requirements.md
---

# refactor: 彻底删除 GitNexus active integration

## Summary

本计划把 GitNexus 从 spec-first 的 active product surface 中硬删除：安装/setup 不再配置 GitNexus，CLI/runtime 不再注入 GitNexus 指令，`spec-graph-bootstrap` source skill 与 Claude command template 整体删除，workflow skills 不再消费 graph-bootstrap / review-pre-facts / GitNexus readiness 产物，文档、测试、package 和 runtime generation 全部改为无 GitNexus 当前能力。

删除后的默认上下文路径是 bounded direct source reads、`rg`、ast-grep、git diff、tests/logs 和用户提供证据。本期不新增替代 graph provider，也不保留 provider-neutral graph-bootstrap 空壳。

---

## Problem Frame

origin PRD 明确要求“彻底删除 GitNexus，从安装流程、使用流程、产物等等全部彻底删除”。当前仓库中 GitNexus 已经不是一个单点 MCP provider，而是横跨 setup registry、provider projection、host instruction block、startup reminder、workflow routing、`spec-graph-bootstrap` public workflow、review-pre-facts helper、contracts、README、用户手册、tests、fixtures、CI quality gate 和 package allowlist 的 active integration。

旧计划的问题是仍按“GitNexus graph provider 下线”理解删除边界，保留了 graph readiness 空结构、历史文档批量改写和部分 provider 骨架；这与最新 PRD 的 R-06 / R-16 冲突。新的技术决策是：删除产物生产者、删除公共入口、删除所有 active 消费链，再用残留扫描保护 active source 不重新引用 GitNexus。

---

## Requirements

| Origin requirement | Plan coverage | Primary units |
| --- | --- | --- |
| R-01 setup 不再把 GitNexus 列为 required tool / graph-provider / host MCP server | 删除 `mcp-tools.json` GitNexus entry、warmup/install/verify/projection 输出与 setup prose | U2, U8 |
| R-02 setup 不再写 GitNexus provider projection / runtime capabilities | 停止写 `graph-providers.json.providers.gitnexus`、`gitnexus_capability_discovery`、GitNexus command arrays 和 artifact refs | U2, U9 |
| R-03 `spec-first init` 不再注入 GitNexus block | 删除 instruction block source、init normalize path、checked-in host docs block 和 generated runtime 入口 | U4, U9 |
| R-04 CLI 不暴露 GitNexus commands | 删除 `gitnexus-instruction`、`workspace-gitnexus-readiness` 和 GitNexus-only `review-pre-facts` active command | U4, U5, U8 |
| R-05 router 不推荐 graph-bootstrap / workspace-gitnexus | 更新 `using-spec-first` 与 host bootstrap managed block source | U4, U6 |
| R-06 删除 `spec-graph-bootstrap` source skill 和 command template | 整目录删除 `skills/spec-graph-bootstrap/`，删除 `templates/claude/commands/spec/graph-bootstrap.md`，清理 skill governance/runtime index/tests | U3, U9 |
| R-07 workflow 上下文改为 direct reads / `rg` / ast-grep / tests/logs | 更新所有 active workflow skill prose，删除 GitNexus-first、Graph / GitNexus Evidence 和 review-pre-facts 依赖 | U6 |
| R-08 evidence 输出不再含 GitNexus-specific envelope | 删除 plan/work/debug/review 中 graph evidence block 消费与 run artifact GitNexus 口径 | U5, U6, U7 |
| R-09 旧 `.gitnexus` / provider artifacts 视为 retired residue | clean/doctor/setup 只做 preview-first residue 处理，不把旧 artifact 当 readiness | U2, U4, U9 |
| R-10 active contracts 不再定义 GitNexus capability/readiness/pre-facts | 删除或 retire active GitNexus contracts，更新引用它们的总合同和 source/runtime contract | U7, U8 |
| R-11 README / 用户手册不再介绍 GitNexus 当前路径 | 更新 README、README.zh-CN 和 active 用户手册；历史分析只可标 archived 且不再被 current docs 链接 | U7 |
| R-12 tests/package 保护删除后 contract | 删除或改写 GitNexus unit/smoke/fixture/benchmark/package assertions；`npm run build` tarball 无 active GitNexus assets | U8 |
| R-13 active-source residual scan 只允许 archive/removal docs/changelog | 新增/更新 residual guard，allowlist 仅覆盖 origin PRD、本计划、CHANGELOG 和明确 archived historical docs | U1, U8 |
| R-14 本期不新增替代 graph provider | 所有 units 只删除或降级为 direct-read prose，不新增 graph abstraction/schema | All |
| R-15 发布说明标记 user-visible breaking change | CHANGELOG 和 release/package docs 记录 GitNexus setup、graph-bootstrap、artifacts、evidence path retired | U8 |
| R-16 删除 source skill 后同步更新所有 consumer skills | 至少覆盖 `spec-mcp-setup`、`using-spec-first`、`spec-plan`、`spec-code-review`、`spec-doc-review`、`spec-work`、`spec-debug`、`spec-brainstorm`、`spec-write-tasks` | U2, U6 |

**Origin acceptance examples:** AE-01 through AE-13 are all carried forward. The implementation is complete only when active setup, CLI, source skills, runtime generation, docs, tests, package build, and residual scans satisfy those examples.

---

## Scope Boundaries

本期做：

- 删除 GitNexus install/setup/config/warmup/projection/verification/next-action 行为。
- 删除 GitNexus host instruction block 的 source、CLI command、init generation path 和 checked-in `AGENTS.md` / `CLAUDE.md` managed block。
- 删除 `skills/spec-graph-bootstrap/` source directory、its scripts/evals、and `templates/claude/commands/spec/graph-bootstrap.md`。
- 删除 GitNexus-only review-pre-facts helper 和 active workflow consumption。
- 更新 active workflow skills，使代码理解、plan、work、debug、review、doc-review、brainstorm、tasks 只依赖 bounded direct evidence。
- 清理 active contracts、README、用户手册、runtime capability catalog、tests、fixtures、CI gates、package allowlist 中的当前 GitNexus 语义。
- 以 source-first 方式通过 `spec-first init` 重新生成 runtime mirrors；不手改 generated runtime assets。
- 更新 `CHANGELOG.md`，标记 user-visible breaking change。

本期不做：

- 不新增替代 provider、provider-neutral graph workflow、graph readiness schema 或新的 evidence pipeline。
- 不把 ast-grep、browser tooling、Context7、sequential-thinking、shell commands 等非 GitNexus 工具一起删除。
- 不重写历史事实：历史 PRD/plan/analysis/validation/run artifacts 可保留为 archive，但 active docs/tests/package/workflow 不得把它们当 current contract。
- 不强删用户全局自管 GitNexus MCP 配置；只删除 spec-first source/runtime/setup 管理的入口，并对本地 retired residue 使用 preview-first cleanup。
- 不在计划阶段实施代码删除或运行 npm 测试；执行验证属于后续 `spec-work`。

---

## Completion Criteria

- `skills/spec-graph-bootstrap/` and `templates/claude/commands/spec/graph-bootstrap.md` do not exist in source, package contents, or regenerated runtime mirrors.
- `spec-first --help`, `spec-first init`, `spec-first doctor`, `spec-first clean`, startup reminder, and host bootstrap prose do not mention GitNexus, graph-bootstrap, review-pre-facts, or graph readiness as current behavior.
- `skills/spec-mcp-setup` no longer installs, warms, configures, verifies, projects, or hands off to GitNexus.
- All active workflow skills named in R-16 have no active dependency on `.spec-first/graph/provider-status.json`, `.spec-first/graph/graph-facts.json`, `.spec-first/impact/bootstrap-impact-capabilities.json`, `.spec-first/workspace/gitnexus-readiness.json`, `Graph / GitNexus Evidence`, `review-pre-facts`, `spec-graph-bootstrap`, or `spec-graph-bootstrap`.
- Active docs/tests/package/CI/source roots pass the residual allowlist scan.
- `CHANGELOG.md` contains the user-visible breaking change entry.

---

## Direct Evidence Readiness

- target_repo: spec-first
- evidence_sources: [direct source reads, rg, ast-grep, git diff, tests/logs, user-provided evidence]
- source_refs:
  - `docs/brainstorms/2026-06-02-001-refactor-remove-gitnexus-integration-requirements.md`
  - `docs/10-prompt/结构化项目角色契约.md`
  - active source/docs/test/package inventory listed below
- source_revision: unavailable
- current_revision: unavailable
- worktree_status: dirty at planning/review time; execution must re-check before edits
- confidence: confirmed-source for direct reads; no graph evidence used
- limitations: no graph readiness artifacts are consumed; this plan retires graph readiness surfaces and uses direct source/test/package evidence only

---

## Direct Evidence

- repo_scope: `/Users/kuang/xiaobu/spec-first`
- source_reads_completed: role contract, origin PRD, existing plan, active source/docs/test/package GitNexus inventory
- source_reads_required: current source reads during each implementation unit before editing
- commands_or_tools_used: `rg`, `sed`, `git status`, package/test manifest inspection
- impact_on_plan: implementation must delete active producers and consumers, then prove absence across source, package, generated runtime, release install, and current docs
- key_findings: `spec-graph-bootstrap` and review-pre-facts are GitNexus-only active surfaces; no provider-neutral replacement is in scope
- limitations: historical docs may retain GitNexus mentions only when explicitly archived and not linked as current guidance

---

## Context & Research

### Source Evidence Read

- `docs/10-prompt/结构化项目角色契约.md`: confirms this is a large source/runtime/workflow governance change and must prefer light contracts, explicit boundaries, and scripts-prepare/LLM-decides separation.
- `docs/brainstorms/2026-06-02-001-refactor-remove-gitnexus-integration-requirements.md`: primary WHAT source, including R-01 through R-16 and AE-01 through AE-13.
- Existing plan at `docs/plans/2026-06-02-001-refactor-remove-gitnexus-integration-plan.md`: superseded in content because it retained stale graph-bootstrap and graph readiness assumptions.
- Direct `rg` inventory over active roots: confirmed references in `src/cli`, `skills`, `templates`, `tests`, `scripts`, `.github`, `README.md`, `README.zh-CN.md`, `AGENTS.md`, `CLAUDE.md`, `docs/contracts`, `docs/05-用户手册`, `docs/README.md`, `docs/catalog/runtime-capabilities.md`, `docs/workflow-skill-agent-map.md`, `package.json`, `bin/`, and `.gitignore`. Broader historical docs under `docs/00-版本路线/`, `docs/02-架构设计/`, `docs/03-实施方案/`, and `docs/项目介绍/` must either be explicitly archived/retired or cleaned before they are linked as current guidance.

### Active Surface Inventory

| Surface | Current active files / dirs | Planning implication |
| --- | --- | --- |
| setup registry/projection | `skills/spec-mcp-setup/mcp-tools.json`, `skills/spec-mcp-setup/SKILL.md`, `skills/spec-mcp-setup/references/supported-mcp-tools.md`, `skills/spec-mcp-setup/scripts/*` | Remove GitNexus provider identity and stop producing setup-owned graph/readiness facts |
| graph-bootstrap public workflow | `skills/spec-graph-bootstrap/`, `templates/claude/commands/spec/graph-bootstrap.md` | Delete source assets; no empty shell |
| CLI/init/runtime source | `src/cli/gitnexus-instruction-block.js`, `src/cli/index.js`, `src/cli/commands/init.js`, `src/cli/commands/internal.js`, `src/cli/commands/clean.js`, `src/cli/commands/doctor.js`, `src/cli/version-reminder.js`, `src/cli/instruction-bootstrap.js`, `src/cli/runtime-tools-index.js`, `src/cli/gitignore-policy.js` | Remove commands, blocks, startup graph snapshot, routing hints, clean/ignore productization |
| review pre-facts helper | `src/cli/helpers/review-pre-facts/`, `src/cli/helpers/compile-workspace-gitnexus-readiness.js` | Delete GitNexus-only deterministic helper and hidden command path |
| workflow skills | `skills/spec-mcp-setup/SKILL.md`, `skills/using-spec-first/SKILL.md`, `skills/spec-plan/SKILL.md`, `skills/spec-code-review/SKILL.md`, `skills/spec-doc-review/SKILL.md`, `skills/spec-work/SKILL.md`, `skills/spec-debug/SKILL.md`, `skills/spec-brainstorm/SKILL.md`, `skills/spec-write-tasks/SKILL.md` | Replace active GitNexus evidence paths with bounded direct evidence |
| contracts/docs | `docs/contracts/*gitnexus*`, `docs/contracts/*graph*`, `docs/contracts/workflows/review-pre-facts-extraction.md`, `docs/contracts/ai-coding-harness.md`, `docs/contracts/source-runtime-customization-boundary.md`, `docs/contracts/parent-artifact-quarantine.md`, `README.md`, `README.zh-CN.md`, `docs/05-用户手册/**` | Remove active contract references; archive only where explicitly historical |
| tests/fixtures/CI/package | `tests/unit/*gitnexus*`, `tests/unit/*graph-bootstrap*`, `tests/unit/*review-pre-facts*`, `tests/fixtures/review-pre-facts/`, `tests/fixtures/gitnexus-workspace/`, `tests/benchmark/extract-graph-anchors.sh`, `.github/workflows/ai-dev-quality-gate.yml`, `scripts/run-ai-dev-quality-gate.js`, `scripts/run-test-suite.cjs`, `package.json` | Delete or rewrite expectations to assert absence |

### Context Model After Deletion

The replacement context path is not a new provider contract. It is a workflow posture:

- scripts and tools may deterministically gather file paths, git diff, package/test facts, syntax checks, and logs;
- LLM workflows choose what evidence matters and disclose limitations;
- no active workflow waits for GitNexus readiness or graph-bootstrap output before ordinary plan/work/debug/review;
- graph-heavy future capability requires a new PRD with its own source, artifacts, consumers, failure modes, and tests.

---

## Key Technical Decisions

- **Delete `spec-graph-bootstrap`, do not preserve a provider-neutral shell.** The current skill, scripts, evals, tests, and artifacts are GitNexus-centered. Keeping the name would preserve a public entry whose only real behavior was removed.
- **Remove producers before cleaning consumers.** Setup projection, CLI commands, source skill directories, and helper modules must disappear before workflow prose can truthfully stop referencing their outputs.
- **Retire GitNexus artifacts, do not reinterpret them.** `.gitnexus/`, `.spec-first/providers/gitnexus/`, `.spec-first/graph/*`, `.spec-first/impact/bootstrap-impact-capabilities.json`, and `.spec-first/workspace/gitnexus-readiness.json` are no longer current readiness facts. They may be cleaned as residue, but cannot guide routing or evidence.
- **Use absence tests, not historical rewrite, as the durable guard.** Historical docs can retain past facts when archived; active source, runtime generation, package contents, tests, README, user manual current paths, and contracts must pass a residual allowlist scan.
- **Do not introduce a replacement graph abstraction.** Direct reads and `rg` are a fallback evidence posture, not a new `graph provider`.
- **Source-first runtime cleanup.** Modify source and generator logic first, then run `spec-first init`. Do not patch `.claude/`, `.codex/`, or `.agents/skills/` by hand.
- **Tests must protect the new product contract.** Existing tests that assert GitNexus presence should be deleted or inverted to assert absence; otherwise the implementation can appear complete while package/runtime still exposes GitNexus.

---

## Open Questions

### Resolved During Planning

- Should `skills/spec-graph-bootstrap/` be deleted or converted to a shell? Deleted. The PRD explicitly rejects an empty or provider-neutral shell for this increment.
- Should review-pre-facts remain as a generic helper? No. Current operation names, readiness reads, fixtures, and workflow instructions are GitNexus-only.
- Should historical brainstorms/plans be bulk edited? No by default. Treat them as archive unless they are linked from active docs/contracts/package/tests as current behavior.
- Should a replacement graph provider be introduced? No. Future graph capability requires a separate PRD.

### Deferred to Implementation

- Exact test deletion vs inversion per suite: decide while editing each test file, based on whether the suite protects active behavior or only GitNexus implementation internals.
- Exact residue cleanup command UX for `.gitnexus/` and `.spec-first/providers/gitnexus/`: keep preview-first and source-owned; do not force-delete user-owned global config.
- Whether some old user-manual pages should be moved under an explicit archive section instead of edited in place: allowed if it removes them from active onboarding/current contract links.

---

## Implementation Units

### U1. Establish Active Residual Guard And Allowlist

**Goal:** Create the deletion safety net before broad edits, so implementation can distinguish active product residue from allowed historical archive.

**Requirements:** R-12, R-13, R-15

**Dependencies:** None

**Files:**

- Modify focused existing guard suites for active surface, package, tarball, and quality-gate residue checks; do not introduce a standalone `remove-gitnexus` test file.
- Modify: `scripts/run-test-suite.cjs`
- Modify: `scripts/run-ai-dev-quality-gate.js`
- Modify: `.github/workflows/ai-dev-quality-gate.yml`
- Modify: `src/cli/contracts/quality-gates/branch-protection-policy.json`

**Approach:**

- Define active roots for the guard: `AGENTS.md`, `CLAUDE.md`, `README.md`, `README.zh-CN.md`, `package.json`, `.gitignore`, `bin/`, `src/`, `skills/`, `agents/`, `templates/`, `tests/`, `scripts/`, `.github/`, `docs/contracts/`, active `docs/05-用户手册/`, `docs/README.md`, `docs/catalog/runtime-capabilities.md`, and `docs/workflow-skill-agent-map.md`.
- Treat broader docs that can act as current navigation or source-of-truth (`docs/00-版本路线/`, `docs/02-架构设计/`, `docs/03-实施方案/`, `docs/项目介绍/`) as active unless each matching file is explicitly classified as archived/retired.
- Match terms case-insensitively: `gitnexus`, `git-nexus`, `graph-bootstrap`, `review-pre-facts`, `Graph / GitNexus Evidence`, `workspace-gitnexus`, `graph-facts`, `provider-status`, and `bootstrap-impact`.
- Allow only current removal artifacts and explicitly archived historical docs outside active roots: origin PRD, this plan, `CHANGELOG.md`, and docs with a deterministic archive signal where they are not linked as current user guidance.
- Define the archive signal before broad cleanup: either an explicit path allowlist or a frontmatter/lifecycle marker such as `historical-input`, `external-reference`, `archive`, or `retired`. Add a link/navigation check so active README, user manual, contracts, catalog, package docs, and workflow maps do not present archived GitNexus pages as current setup or usage guidance.
- Update quality gate path filters that currently reference `skills/spec-graph-bootstrap/**`, `src/cli/helpers/review-pre-facts/**`, or `tests/unit/spec-graph-bootstrap-contracts.test.js`.
- In U1, add the residual guard helper/policy and focused synthetic tests only. Do not wire the broad active-source guard into the normal unit/quality-gate path until U8, after U2 through U7 remove the known active references.

**Test scenarios:**

- Happy path: active roots with no GitNexus terms pass.
- Error path: a synthetic active file containing `spec-graph-bootstrap` fails the residual guard.
- Edge case: origin PRD and this plan are allowed while active docs are not.
- Edge case: an explicitly archived historical doc passes only when it carries the chosen archive signal and is not linked as current guidance.
- Error path: a non-archived doc outside the narrow active roots fails if it contains current GitNexus guidance.

**Verification:**

- Focused existing unit suites that cover residual guard helper behavior, synthetic active-file failure, archive allowlist behavior, package/tarball contents, and quality-gate path filters pass under the repo's existing Jest/shell test style.
- The residual guard is not included in the normal unit/quality gate path until U8 wires it after active references have been removed.

---

### U2. Remove GitNexus From MCP Setup Registry, Scripts, And Setup Prose

**Goal:** `spec-mcp-setup` no longer installs, warms, configures, verifies, projects, or hands off to GitNexus.

**Requirements:** R-01, R-02, R-05, R-09, R-16

**Dependencies:** U1

**Files:**

- Modify: `skills/spec-mcp-setup/mcp-tools.json`
- Modify: `skills/spec-mcp-setup/SKILL.md`
- Modify: `skills/spec-mcp-setup/references/supported-mcp-tools.md`
- Modify: `skills/spec-mcp-setup/scripts/detect-tools.sh`
- Modify: `skills/spec-mcp-setup/scripts/install-mcp.sh`
- Modify: `skills/spec-mcp-setup/scripts/install-mcp.ps1`
- Modify: `skills/spec-mcp-setup/scripts/verify-tools.sh`
- Modify: `skills/spec-mcp-setup/scripts/verify-tools.ps1`
- Modify: `skills/spec-mcp-setup/scripts/write-provider-config.sh`
- Modify: `skills/spec-mcp-setup/scripts/write-provider-config.ps1`
- Modify or delete tests: `tests/unit/mcp-setup.sh`, `tests/unit/mcp-setup-powershell-contracts.test.js`, and related setup contract tests

**Approach:**

- Delete the `gitnexus` tool entry from `mcp-tools.json`. If no graph providers remain, setup output should not render a current `Graph providers` readiness table that implies a pending provider.
- Remove GitNexus package pin, host config entries, native capabilities, mutation boundary, `global_knowledge` role, and license advisory.
- Stop writing GitNexus-derived setup facts: `graph-providers.json.providers.gitnexus`, `runtime-capabilities.json.gitnexus_capability_discovery`, GitNexus command arrays, GitNexus raw/normalized artifact refs, and graph-bootstrap next actions.
- Update setup scripts so old `.gitnexus/` or `.spec-first/providers/gitnexus/` paths are classified only as retired residue or cleanup candidates, not current readiness.
- Remove prose that says setup hands off to `spec-graph-bootstrap` or Plan-stage live GitNexus probing.

**Execution note:** Characterization-first. Capture current setup output shape from focused tests before editing, then update tests to assert absence rather than preserving old table columns that only existed for graph providers.

**Test scenarios:**

- Happy path: `verify-tools.*` reports required harness runtime without GitNexus rows or graph-bootstrap next action.
- Happy path: generated `.spec-first/config/runtime-capabilities.json` has no `gitnexus_capability_discovery`.
- Happy path: generated `.spec-first/config/graph-providers.json` is absent or contains no providers; it must not contain `gitnexus`.
- Edge case: old `.gitnexus/` in a workspace is reported as retired residue or ignored for readiness, not as a provider failure.
- Error path: stale provider projection does not ask the user to run graph-bootstrap.

**Verification:**

- `bash -n` / PowerShell parse checks for edited scripts pass.
- Focused mcp-setup unit and contract tests pass.
- `rg -n -i "gitnexus|graph-bootstrap|graph-facts|provider-status|bootstrap-impact|workspace-gitnexus" skills/spec-mcp-setup tests/unit/mcp-setup*` returns only allowed archive/removal references, ideally none in active setup source/tests.

---

### U3. Delete Graph-Bootstrap Public Workflow Source

**Goal:** Remove the public workflow and source assets that produce GitNexus graph readiness artifacts.

**Requirements:** R-05, R-06, R-12, R-16

**Dependencies:** U1

**Files:**

- Delete: `skills/spec-graph-bootstrap/`
- Delete: `templates/claude/commands/spec/graph-bootstrap.md`
- Modify: `src/cli/contracts/dual-host-governance/skills-governance.json`
- Modify: `src/cli/runtime-tools-index.js`
- Modify: `package.json`
- Modify: `scripts/run-test-suite.cjs`
- Delete or rewrite: `tests/unit/spec-graph-bootstrap.sh`
- Delete or rewrite: `tests/unit/spec-graph-bootstrap-contracts.test.js`
- Delete or rewrite: `tests/benchmark/extract-graph-anchors.sh`
- Delete or rewrite: `tests/unit/graph-anchor-extraction-helper.test.js`

**Approach:**

- Remove the entire source directory, including `SKILL.md`, `evals/`, and `scripts/`.
- Remove the Claude command template so `spec-graph-bootstrap` is not generated.
- Remove generated runtime governance entries that list `spec-graph-bootstrap` as a deliverable source skill.
- Remove package/test suite entries such as `test:graph-bootstrap` and graph-bootstrap runners.
- Do not create a replacement `spec-graph` skill, empty command, or provider-neutral bootstrap contract in this increment.

**Test scenarios:**

- Happy path: skill governance no longer expects `spec-graph-bootstrap`.
- Happy path: command generation source has no `graph-bootstrap.md`.
- Happy path: package dry-run excludes `skills/spec-graph-bootstrap/` and `templates/claude/commands/spec/graph-bootstrap.md`.
- Error path: any active workflow or test that references `spec-graph-bootstrap` fails residual guard.

**Verification:**

- `test ! -e skills/spec-graph-bootstrap`
- `test ! -e templates/claude/commands/spec/graph-bootstrap.md`
- Focused governance/runtime tool index tests pass after expectation updates.

---

### U4. Remove CLI, Init, Host Bootstrap, Startup, Doctor, Clean, And Ignore GitNexus Paths

**Goal:** The CLI and host entry source no longer expose GitNexus commands, instruction blocks, startup graph snapshots, graph-bootstrap routing, or managed ignore policy.

**Requirements:** R-03, R-04, R-05, R-09

**Dependencies:** U1, U3

**Files:**

- Delete: `src/cli/gitnexus-instruction-block.js`
- Delete: `src/cli/helpers/compile-workspace-gitnexus-readiness.js`
- Modify: `src/cli/index.js`
- Modify: `src/cli/commands/init.js`
- Modify: `src/cli/commands/internal.js`
- Modify: `src/cli/commands/clean.js`
- Modify: `src/cli/commands/doctor.js`
- Modify: `src/cli/version-reminder.js`
- Modify: `src/cli/instruction-bootstrap.js`
- Modify: `src/cli/gitignore-policy.js`
- Modify: `.gitignore`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Delete or rewrite: `tests/unit/gitnexus-instruction-block.test.js`
- Modify: `tests/unit/clean-dry-run.test.js`
- Modify: `tests/unit/claude-settings.test.js`
- Modify related init/doctor/runtime bootstrap tests

**Approach:**

- Remove `gitnexus-instruction` registration from `src/cli/index.js` and help output.
- Remove GitNexus block normalization from `init.js`, including next-step text that says to run graph-bootstrap.
- Delete checked-in `<!-- gitnexus:start -->` / `<!-- gitnexus:end -->` blocks from `AGENTS.md` and `CLAUDE.md`.
- Remove startup reminder code that reads `.spec-first/graph/provider-status.json`, `.spec-first/graph/graph-facts.json`, `.spec-first/impact/bootstrap-impact-capabilities.json`, or prints GitNexus graph state.
- Remove `workspace-gitnexus-readiness` internal command path; remove `review-pre-facts` internal command registration in U5.
- Update `clean` and `doctor` so retired GitNexus residue is not presented as active setup/runtime readiness.
- Remove `.gitnexus` from managed ignore policy/source docs after implementation has a preview-first cleanup path for local residue; do not leave `.gitnexus` as a current spec-first-managed artifact.

**Test scenarios:**

- Happy path: `spec-first --help` has no `gitnexus-instruction`.
- Happy path: `spec-first init` generated instruction source has no GitNexus block or graph-bootstrap next step.
- Happy path: startup reminder output does not read or print graph readiness snapshot.
- Edge case: `spec-first clean --dry-run` can report old residue without treating it as current readiness.
- Error path: partial GitNexus managed block in host docs is removed by source edits, not repaired into a fresh block.

**Verification:**

- `node --check` passes for edited JS files.
- Focused CLI/init/clean/doctor/startup tests pass.
- `rg -n -i "gitnexus|graph-bootstrap|workspace-gitnexus|graph-facts|provider-status|bootstrap-impact" src/cli AGENTS.md CLAUDE.md .gitignore` returns no active references.

---

### U5. Delete Review-Pre-Facts Helper And Hidden Command Consumption

**Goal:** Remove the GitNexus-only deterministic reviewer facts pipeline and all active references to it.

**Requirements:** R-04, R-07, R-08, R-10, R-12, R-16

**Dependencies:** U1, U4

**Files:**

- Delete: `src/cli/helpers/review-pre-facts/`
- Delete: `tests/fixtures/review-pre-facts/`
- Delete or rewrite: `tests/unit/review-pre-facts-helper.test.js`
- Delete or rewrite: `tests/unit/review-pre-facts-internal-command.test.js`
- Modify: `src/cli/commands/internal.js`
- Modify: `skills/spec-doc-review/SKILL.md`
- Modify: `skills/spec-doc-review/references/pre-facts-extraction.md`
- Modify: `skills/spec-code-review/SKILL.md`
- Modify related doc-review/code-review contract tests

**Approach:**

- Delete the helper directory rather than trying to generalize operation names. Current constants are `gitnexus.query`, `gitnexus.context`, `gitnexus.impact`, and `gitnexus.detect_changes`.
- Remove hidden CLI command `internal review-pre-facts`.
- Remove doc-review/code-review pre-facts command choreography and replace with reviewer context built from bounded document/source reads, git diff, tests/logs, and user evidence.
- Delete `review-pre-facts` fixtures because they encode GitNexus provider results and readiness artifacts.

**Test scenarios:**

- Happy path: doc-review and code-review can dispatch/use reviewers with a bounded `{codebase_facts}` summary that does not require helper output.
- Happy path: `spec-first internal review-pre-facts` is no longer a valid active command.
- Edge case: reviewer dispatch absence is not blamed on stale graph/pre-facts.
- Error path: active workflow prose containing `review-pre-facts` fails residual guard.

**Verification:**

- `test ! -e src/cli/helpers/review-pre-facts`
- `test ! -e tests/fixtures/review-pre-facts`
- Focused doc-review/code-review contract tests pass after expectation updates.

---

### U6. Update Active Workflow Skills To Direct-Read Evidence

**Goal:** Remove graph-bootstrap / GitNexus / review-pre-facts consumption from all active workflow skills named by R-16.

**Requirements:** R-05, R-07, R-08, R-16

**Dependencies:** U2, U3, U5

**Files:**

- Modify: `skills/using-spec-first/SKILL.md`
- Modify: `skills/spec-plan/SKILL.md`
- Modify: `skills/spec-code-review/SKILL.md`
- Modify: `skills/spec-doc-review/SKILL.md`
- Modify: `skills/spec-work/SKILL.md`
- Modify: `skills/spec-debug/SKILL.md`
- Modify: `skills/spec-brainstorm/SKILL.md`
- Modify: `skills/spec-write-tasks/SKILL.md`
- Modify: `skills/spec-work/references/shipping-workflow.md`
- Check only after U2 owns the setup prose cleanup: `skills/spec-mcp-setup/SKILL.md`
- Modify related workflow invariant fixtures and skill contract tests under `tests/unit/` and `tests/fixtures/workflow-invariants/`

**Approach:**

- Replace “GitNexus-first, fallback to direct reads” with “bounded direct source reads, `rg`, ast-grep, git diff, tests/logs, and user evidence”.
- Delete graph freshness / graph refresh trigger sections that recommend `spec-graph-bootstrap` or read `.spec-first/graph/*`.
- Delete `## Graph / GitNexus Evidence` block production/consumption from plan/work/debug/review paths.
- Remove workspace-gitnexus routing and group-ready hints from `using-spec-first`; parent workspace still requires explicit target repo before writes.
- Keep source/runtime governance, target repo discipline, reviewer dispatch boundaries, and direct evidence disclosure.
- Do not re-own setup-specific prose in `skills/spec-mcp-setup/SKILL.md`; U2 owns that file's setup behavior and handoff text. U6 only scans it for cross-workflow consistency after U2.

**Execution note:** Read each full `SKILL.md` before editing. These are semantic prose changes, so run fresh-source eval if the host can dispatch a fresh read-only reviewer; otherwise record why not.

**Test scenarios:**

- Happy path: `spec-plan` from a PRD with no graph facts records direct-read limitations, not GitNexus evidence.
- Happy path: `spec-work` consumes source/test evidence and does not expect a graph evidence block.
- Happy path: `spec-debug` hypothesis ledger has no GitNexus-specific root-cause gate.
- Happy path: `spec-code-review` and `spec-doc-review` do not instruct users to run graph-bootstrap before high-risk review.
- Edge case: parent workspace routing still requires explicit write target and does not infer from graph artifacts.

**Verification:**

- Focused skill contract tests pass after expectation updates.
- Residual scan has no active workflow skill hits for GitNexus terms except allowed removal-plan references, ideally none.

---

### U7. Retire Active Contracts, README, User Manual, And Runtime Capability Catalog References

**Goal:** Remove GitNexus as a current documented capability and contract source.

**Requirements:** R-10, R-11, R-12, R-13, R-15

**Dependencies:** U3, U5, U6

**Files:**

- Delete or archive: `docs/contracts/gitnexus-capability-catalog.md`
- Delete or archive: `docs/contracts/workspace-gitnexus-consumption.md`
- Delete or archive: `docs/contracts/downstream-graph-evidence-consumption.md`
- Delete or rewrite: `docs/contracts/graph-evidence-policy.md`
- Delete or rewrite: `docs/contracts/graph-provider-consumption.md`
- Delete or archive: `docs/contracts/workflows/review-pre-facts-extraction.md`
- Modify: `docs/contracts/ai-coding-harness.md`
- Modify: `docs/contracts/source-runtime-customization-boundary.md`
- Modify: `docs/contracts/parent-artifact-quarantine.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `docs/05-用户手册/README.md`
- Modify active current-path pages under `docs/05-用户手册/`
- Modify: `scripts/generate-runtime-capability-catalog.js`
- Modify related README/user-manual/contract tests

**Approach:**

- Remove active contract pages whose only purpose is GitNexus capability/readiness/pre-facts. If preserving for history, move or mark them explicitly as archived and ensure active docs no longer link to them as current contract.
- Update `ai-coding-harness.md` so Context/Evidence Harness examples refer to direct evidence and source confirmation, not GitNexus lanes.
- Update source/runtime boundary docs so provider facts remain generally untrusted evidence, but without GitNexus-specific current paths or review-pre-facts reuse.
- Remove README table rows and test commands for graph-bootstrap.
- Update user manual current onboarding, concepts, artifact map, best practices, local install, first workflow walkthrough, and development modes to remove GitNexus setup/use flows.
- Treat old CRG/GitNexus analysis pages as historical archive if retained; do not keep them in current user manual navigation as active behavior.

**Test scenarios:**

- Happy path: README and README.zh-CN list only existing public workflows.
- Happy path: runtime capability catalog generation does not produce a graph readiness row.
- Happy path: user manual quickstart has no GitNexus install/setup/bootstrap step.
- Edge case: historical pages can mention GitNexus only if clearly archived and not part of active onboarding.

**Verification:**

- README/user-manual/contract tests pass after updated expectations.
- Residual guard passes for active docs.

---

### U8. Rewrite Tests, Fixtures, Package, CI, And Release Guards Around Absence

**Goal:** Make the test/build system enforce that GitNexus is gone from the active product surface.

**Requirements:** R-12, R-13, R-15

**Dependencies:** U1 through U7

**Files:**

- Modify: `package.json`
- Modify: `scripts/check-release-continuity.cjs`
- Modify: `scripts/run-test-suite.cjs`
- Modify: `scripts/run-ai-dev-quality-gate.js`
- Modify: `.github/workflows/ai-dev-quality-gate.yml`
- Delete: `tests/fixtures/gitnexus-workspace/`
- Delete: `tests/fixtures/review-pre-facts/`
- Delete or rewrite GitNexus-specific unit tests under `tests/unit/`
- Modify: `tests/unit/user-manual-contracts.test.js`
- Modify: `tests/unit/spec-debug-contracts.test.js`
- Modify: `tests/unit/spec-doc-review-contracts.test.js`
- Modify: `tests/unit/spec-work-run-artifact-contract.test.js`
- Modify: `tests/unit/ai-dev-quality-gate.test.js`
- Modify: `tests/unit/gitignore-policy.test.js`

**Approach:**

- Remove `test:graph-bootstrap` and package allowlist entries for GitNexus-only contracts and skills.
- Remove GitNexus workspace/review-pre-facts fixtures from the package/test tree.
- Invert tests that previously asserted GitNexus presence to assert absence in active source and generated outputs.
- Update release continuity guards so deleted GitNexus contract files are not required package contents.
- Wire the broad residual guard into the normal unit/quality-gate path only here, after U2 through U7 have removed active references.
- Run `npm run docs:runtime-catalog` after governance/source delivery edits and assert `docs/catalog/runtime-capabilities.md` has no GitNexus, graph-bootstrap, review-pre-facts, or graph readiness rows.
- Keep general evidence, source/runtime, and review-finding tests; only delete GitNexus-specific implementation expectations.

**Test scenarios:**

- Happy path: `npm run build` tarball has no GitNexus-only skills/templates/contracts/fixtures.
- Happy path: unit tests fail if active source reintroduces `spec-graph-bootstrap`.
- Happy path: `npm test` no longer tries to run graph-provider e2e.
- Edge case: `CHANGELOG.md`, origin PRD, and this plan are not rejected by residual tests.
- Happy path: package manifest and runtime catalog checks include `bin/` and `docs/catalog/runtime-capabilities.md`.

**Verification:**

- `npm run typecheck`
- `npm run test:unit`
- `npm run test:smoke`
- `npm run build`
- `npm run test:release:install` or `npm run test:release`
- Prefer `npm test` once the suite no longer contains GitNexus graph-provider e2e.

---

### U9. Regenerate Runtime And Validate End-To-End Absence

**Goal:** Confirm source changes project cleanly into Claude/Codex runtime without hand-editing generated mirrors.

**Requirements:** R-03, R-05, R-06, R-11, R-12, R-13

**Dependencies:** U1 through U8

**Files:**

- Generated by command, do not hand-edit: `.claude/`
- Generated by command, do not hand-edit: `.codex/`
- Generated by command, do not hand-edit: `.agents/skills/`
- Modify only if source change requires it: generator code under `src/cli/` and templates under `templates/`

**Approach:**

- Run `spec-first init` after source cleanup.
- Verify generated runtime mirrors do not include `spec-graph-bootstrap`, GitNexus managed blocks, or graph-bootstrap commands.
- Run host doctor paths only after source deletion has removed GitNexus expectations.
- If old local `.gitnexus/` or `.spec-first/providers/gitnexus/` residues appear, preview cleanup and remove only repo-local retired residue; do not mutate user-global MCP config.

**Test scenarios:**

- Happy path: `.agents/skills/spec-graph-bootstrap/` is not generated.
- Happy path: `.claude/spec-first/workflows/spec-graph-bootstrap/` is not generated.
- Happy path: `.claude/commands/spec/graph-bootstrap.md` is not generated.
- Happy path: generated `AGENTS.md` / `CLAUDE.md` mirrors have no `<!-- gitnexus:start -->`.
- Edge case: old ignored residue does not affect `doctor`, `init`, or workflow routing.
- Edge case: stale generated `spec-graph-bootstrap` mirrors are pruned by source-owned init behavior, not hand-edited.

**Verification:**

- `spec-first init`
- `spec-first doctor --claude`
- `spec-first doctor --codex`
- `test ! -e .claude/spec-first/workflows/spec-graph-bootstrap`
- `test ! -e .claude/commands/spec/graph-bootstrap.md`
- `test ! -e .agents/skills/spec-graph-bootstrap`
- Residual scan over source and generated runtime mirrors passes, with generated mirrors checked only after regeneration.

---

## System-Wide Impact

- **User-visible breaking change:** GitNexus MCP setup, graph-bootstrap workflow, graph readiness artifacts, GitNexus startup reminders, and GitNexus evidence paths are retired.
- **Workflow context shift:** plan/work/debug/review lose graph impact shortcuts; they must compensate with narrower direct source reads, git diff, tests/logs, and explicit limitations.
- **Runtime generation:** source changes affect Claude and Codex. The only valid runtime update path is `spec-first init`.
- **Package contents:** published tarball must drop GitNexus-only skills, templates, contracts, fixtures, and tests.
- **CI expectations:** quality gates and release continuity checks must stop requiring deleted files and start protecting absence.
- **Historical docs:** old research and plans can remain as archive, but active docs must not link to them as current setup or usage guidance.

---

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Hidden consumer still expects `.spec-first/graph/*` or `review-pre-facts` | U1 residual guard plus focused `rg` over active roots; U6 updates all R-16 skills |
| Setup script JSON projections break because graph-provider assumptions were structural | Characterization-first tests in U2; remove provider table/output only where GitNexus was the sole provider |
| Generated runtime reintroduces graph-bootstrap from governance metadata | U3 updates dual-host governance and command templates; U9 verifies regenerated mirrors |
| Removing `.gitnexus` ignore reveals local residue as untracked files | Treat as retired repo-local residue during U4/U9 preview cleanup; do not keep active ignore policy solely to hide current product residue |
| Historical docs create false residual failures | Guard uses explicit archive/removal allowlist; active docs/tests/package cannot rely on archive pages |
| Direct-read fallback makes reviews less exhaustive | Workflow prose must disclose limitation and choose targeted reads/tests; future graph capability requires separate PRD |

---

## Verification Plan

Focused validation during implementation:

- `node --check` for edited JS files.
- `bash -n` for edited shell scripts.
- PowerShell parse checks for edited `.ps1` scripts.
- Focused unit/contract suites for setup, init, clean, doctor, startup, workflow skills, README/user manual, package, and residual guard.

Full validation before handoff:

- `npm run typecheck`
- `npm run test:unit`
- `npm run test:smoke`
- `npm run build`
- `npm run test:release:install` or `npm run test:release`
- Prefer `npm test` after graph-provider e2e has been removed from the main test chain.
- `spec-first init`
- `spec-first doctor --claude`
- `spec-first doctor --codex`
- Active residual scan:

```bash
rg -n -i "gitnexus|git-nexus|graph-bootstrap|review-pre-facts|Graph / GitNexus Evidence|workspace-gitnexus|graph-facts|provider-status|bootstrap-impact" \
  AGENTS.md CLAUDE.md README.md README.zh-CN.md package.json .gitignore \
  bin src skills agents templates tests scripts .github \
  docs/contracts docs/05-用户手册 docs/README.md docs/catalog/runtime-capabilities.md docs/workflow-skill-agent-map.md \
  docs/00-版本路线 docs/02-架构设计 docs/03-实施方案 docs/项目介绍
```

The scan should have no active-source matches. Allowed matches belong only to the current removal PRD, this plan, `CHANGELOG.md`, or documents that match the deterministic archive rule and are not linked as current setup or usage guidance.

---

## Documentation / Operational Notes

- `CHANGELOG.md` must record this as a user-visible breaking change and name the retired surfaces: GitNexus setup, `spec-graph-bootstrap`, GitNexus artifacts, review-pre-facts, and GitNexus evidence path.
- README and user manual should guide users toward normal spec-first workflows without graph readiness setup.
- If maintainers still need GitNexus for unrelated personal work, that is outside spec-first managed setup and should not appear in spec-first source/runtime/package.
- Follow-up graph provider work must start from a new PRD with explicit artifacts, consumers, failure modes, mutation boundaries, tests, and release communication.

---

## Readiness And Handoff

Plan status: completed.

Completion evidence:

- Active source/docs residual scan returned no GitNexus / graph-bootstrap / review-pre-facts matches in current runtime-facing surfaces.
- Historical docs that still contain retired graph terms now carry lifecycle/archive markers and are not current setup or usage guidance.
- Generated runtime mirrors were scanned for retired GitNexus / graph-bootstrap terms after source cleanup and returned no matches.
- `npm run typecheck`, `npm run test:unit`, `npm run test:release`, and `npm run build` passed.
- `spec-first doctor --claude` and `spec-first doctor --codex` exited successfully; remaining drift warnings are unrelated spec-plan/spec-prd runtime mismatch warnings from concurrent source changes, not GitNexus residue.

Do not start implementation by deleting generated runtime mirrors. Source changes must come first; generated runtime is only proof after `spec-first init`.

## Sources & References

- Origin PRD: `docs/brainstorms/2026-06-02-001-refactor-remove-gitnexus-integration-requirements.md`
- Role contract: `docs/10-prompt/结构化项目角色契约.md`
- Plan template: `skills/spec-plan/references/plan-template.md`
- Fresh-source eval checklist: `docs/contracts/workflows/fresh-source-eval-checklist.md`
