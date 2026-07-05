---
title: "feat: lightweight no-graph fast path"
type: feat
status: completed
date: 2026-05-11
spec_id: 2026-05-11-010-lightweight-no-graph-fast-path
origin: docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md
origin_issue: P2-006
---

# feat: lightweight no-graph fast path

## Summary

本计划交付 `P2-006 lightweight/no-graph fast path` 的轻量版：把现有 `doctor -> init -> restart -> workflow` 的最小可用路径讲清楚，让新用户在 MCP / graph / standards 尚未 ready 时也能先完成轻量 `ideate/brainstorm -> plan -> work -> review` 闭环。

实现方式以文档、入口治理 prose 和 contract tests 为主；不新增 `spec-quick`、不新增独立 CLI mode、不降低 graph-heavy workflow 的 setup/readiness 提示，也不让脚本替 LLM 判断某个任务是否“简单”。

---

## Problem Frame

当前 README、用户手册和 init next steps 已经解释 readiness ladder，但首次使用路径仍容易被理解为：必须先跑完 `mcp-setup -> graph-bootstrap -> standards`，才能进入任何下游 workflow。

这对 graph-heavy planning/review 是合理提醒，但对 docs-only、小 bugfix、小项目试用、无 MCP 环境或首次 10 分钟体验来说仪式感偏重。项目本身已经允许 degraded/no-graph fallback：`spec-plan`、`spec-work`、`spec-code-review` 等 workflow 都能在 graph stale / unavailable 时用 bounded direct repo reads 继续。P2-006 要解决的是用户心智和入口引导问题，而不是新增执行能力。

---

## Requirements

- R1. README 和中文 README 必须明确区分“最小可用 fast path”和“增强型 readiness path”：`doctor` / `init` / host restart 后即可开始轻量 workflow，`mcp-setup`、`graph-bootstrap`、`standards` 是增强证据和 graph-heavy 场景的推荐准备，不是所有任务的 hard gate。
- R2. 用户手册快速开始必须给出 no-graph fast path 示例，并说明适用范围：docs-only、小 bugfix、轻量 plan/work/review、首次试用。
- R3. 用户手册必须保留 readiness ladder：当任务依赖 graph evidence、standards baseline、MCP provider 或跨模块/跨仓影响分析时，仍建议运行 setup/bootstrap/standards。
- R4. `using-spec-first` guide mode 必须在用户有清晰目标时按目标路由，而不是因为 MCP/graph readiness 未完成就一律推荐 setup；只有用户询问 setup/readiness、graph-heavy 能力、provider 缺失或 workflow 明确阻塞时才优先 setup/update/bootstrap。
- R5. `init` post-init guidance 可以增加 fast path 提示，但不能删除现有 setup/bootstrap/standards guidance，也不能把 host workflow entrypoints 表述成 shell commands。
- R6. 必须增加 contract tests，防止 README、用户手册、using-spec-first 和 init guidance 再次把 graph readiness 表述成所有 workflow 的必需前置。
- R7. 不新增 `spec-quick` / `spec-quick`、不新增 CLI flag/mode、不新增 runtime state、dashboard 或自动模式选择器。
- R8. 不修改 generated runtime mirrors；如后续实现修改 source skills，runtime regeneration 必须由实现阶段按 source-first 规则另行处理。

---

## Scope Boundaries

- 不新增新的 public workflow entrypoint。
- 不新增 `spec-first quick`、`--quick-workflow`、`--no-graph` 之类 CLI mode。
- 不削弱 `spec-mcp-setup`、`spec-graph-bootstrap`、`spec-standards` 的推荐价值；只说明它们是增强路径和 graph-heavy readiness path。
- 不让脚本自动判断任务是否低风险、是否应跳过 setup、是否应跳过 review。
- 不修改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirrors。
- 不把 graph unavailable 包装成成功的 graph evidence；只能说 workflow 可降级为 bounded direct reads。

### Deferred to Follow-Up Work

- 真实新用户 onboarding 可用性实验：本计划只补文档和 contract tests，不做 telemetry、dashboard 或用户实验平台。
- 若未来需要测量首次 10 分钟成功率，另行规划 optional eval，不进入核心 runtime。

---

## Graph Readiness

- status: stale
- source_revision: `b5ca72a99056fb2dc6c21b6e0c063c5d6b8203a7`
- current_revision: `3c843a17e0263783f8482d10f2acce6f77afdfdb`
- stale: true
- primary_providers: `code-review-graph`, `gitnexus`
- degraded_providers: none in compiled artifact
- fallback_capabilities: bounded direct repo reads, README/user-manual/source-skill contract tests
- runtime_mcp_evidence: not used; this is a docs/workflow-entry planning task and direct source reads were sufficient
- confidence: medium
- limitations: compiled graph facts are stale and the worktree currently has unrelated pre-facts plan edits; this plan relies on current source reads and the P2 backlog document as primary evidence.

---

## Context & Research

### Relevant Code and Patterns

- `README.md` and `README.zh-CN.md` already include Quickstart and Readiness ladder sections; these are the right first-viewport docs to clarify fast path vs enhanced readiness path.
- `docs/05-用户手册/01-快速开始.md` currently lists `mcp-setup / graph-bootstrap / standards` before the ordinary workflow chain; it needs a small fast-path note so users do not treat that list as mandatory sequencing.
- `docs/05-用户手册/README.md` currently describes the full engineering loop beginning with `mcp-setup / graph-bootstrap / standards`; it already says the chain is not mandatory, but the no-graph fast path is not first-class.
- `skills/using-spec-first/SKILL.md` currently says after init it should prefer setup/readiness guidance when runtime or MCP readiness is unresolved; this needs a narrower condition so clear plan/work/review goals can still route normally.
- `src/cli/commands/init` output is covered by `tests/unit/init-dry-run.test.js`; any post-init guidance wording change must keep existing setup/bootstrap/standards expectations visible.
- Existing contract-test style is prose-focused: `tests/unit/user-manual-contracts.test.js`, `tests/unit/using-spec-first-contracts.test.js`, `tests/unit/init-dry-run.test.js`, and `tests/unit/readme-language-split.test.js`.

### Institutional Learnings

- `docs/10-prompt/结构化项目角色契约.md` requires `Light contract + Explicit boundaries + Scripts prepare, LLM decides`; therefore P2-006 should improve routing and documentation, not create a hidden state machine or hard-coded quick-mode classifier.
- `docs/examples/standards-glue-consumption-examples.md` established the pattern of clarifying advisory consumption through examples instead of adding new schema or runtime state.
- Recent P2 fixes favored lightweight source prose plus contract tests over new runtime producers when the problem is user/agent interpretation.

### External References

- No external research was used. The backlog mentions OpenSpec only as a low-ceremony inspiration; this plan grounds implementation in repo-local docs and workflow contracts.

---

## Key Technical Decisions

- Use docs + source skill prose + tests, not a new CLI mode. Rationale: the problem is entry friction and graph-readiness interpretation, not missing executor capability.
- Keep setup/bootstrap as the enhanced path. Rationale: graph-heavy tasks still benefit from MCP and graph providers; the fast path should not train users to ignore readiness when it matters.
- Narrow `using-spec-first` guidance instead of adding a separate router. Rationale: the route governor already owns “what should I run next”; adding another mode would fragment entry governance.
- Add tests that forbid `spec-quick` / `spec-quick` recommendations. Rationale: this is the overdesign failure mode most likely to reappear.

---

## Open Questions

### Resolved During Planning

- Should this add a new `spec-quick` entrypoint? Resolved: no. The fast path is a documented route through existing workflows.
- Should `mcp-setup` and `graph-bootstrap` be removed from Quickstart? Resolved: no. They remain recommended enhanced readiness steps, but not mandatory for every lightweight workflow.
- Should implementation modify generated runtime mirrors? Resolved: no. Source files only; runtime regeneration, if needed, belongs to implementation/shipping.

### Deferred to Implementation

- Exact wording in init next steps: implementation may choose the shortest wording that preserves existing tests and does not imply workflow entries are shell commands.
- Whether to add a dedicated new test file or extend existing contract tests: choose the narrower approach that keeps assertions readable.

---

## Implementation Units

### U1. Document the no-graph fast path in public docs

**Goal:** Make the fast path visible where new users start, without weakening the readiness ladder.

**Requirements:** R1, R2, R3, R7

**Dependencies:** None

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `docs/05-用户手册/01-快速开始.md`
- Modify: `docs/05-用户手册/README.md`
- Test: `tests/unit/user-manual-contracts.test.js`
- Test: `tests/unit/readme-language-split.test.js`

**Approach:**
- Add a compact “Fast path / enhanced path” explanation near Quickstart, before or beside Readiness ladder.
- State that after `doctor`, `init`, and host restart, users can start lightweight `ideate/brainstorm/plan/work/review` flows even if graph readiness is not compiled.
- List examples where fast path is appropriate: docs-only, small bugfix, first project trial, lightweight planning.
- Keep a clear enhanced path: run `mcp-setup`, `graph-bootstrap`, and optionally `standards` when the task depends on project-wide evidence, graph-heavy review, standards baseline, or cross-module/cross-repo reasoning.

**Patterns to follow:**
- `README.md` Readiness ladder table.
- `docs/05-用户手册/01-快速开始.md` current workflow list.
- `docs/05-用户手册/README.md` “这不是必须顺序执行的命令链” wording.

**Test scenarios:**
- Happy path: README and zh README both mention the lightweight path can start after init/restart without graph readiness.
- Boundary: README and user manual still mention `mcp-setup`, `graph-bootstrap`, and `spec-standards` as enhanced readiness steps.
- Overdesign guard: docs do not mention `spec-quick`, `spec-quick`, or a new CLI quick mode.

**Verification:**
- Public docs distinguish fast path from enhanced readiness path and preserve dual-host command spelling.

---

### U2. Narrow guide-mode routing around unresolved readiness

**Goal:** Ensure `using-spec-first` recommends setup/readiness only when that is actually the user's goal or the workflow is blocked by missing readiness.

**Requirements:** R4, R7, R8

**Dependencies:** U1

**Files:**
- Modify: `skills/using-spec-first/SKILL.md`
- Test: `tests/unit/using-spec-first-contracts.test.js`

**Approach:**
- Update User Next-Step Guide Mode guidance so after init it does not automatically prefer setup when the user asks for a clear plan/work/review task.
- Keep safety/repair priority for explicit setup, host readiness, missing runtime assets, graph-heavy provider setup, or workflow failure caused by unavailable tools.
- Add a short no-graph fast-path note: when graph/MCP readiness is unresolved but the user has a lightweight docs/small-code task, route to the appropriate public workflow and require the selected workflow to disclose degraded evidence if it matters.

**Patterns to follow:**
- `skills/using-spec-first/SKILL.md` Routing Priority and User Next-Step Guide Mode.
- Existing tests in `tests/unit/using-spec-first-contracts.test.js` that assert exact contract snippets.

**Test scenarios:**
- Happy path: guide mode text says clear lightweight plan/work/review goals can route normally before graph readiness is complete.
- Error path: setup/readiness remains recommended when the user asks for MCP setup, graph bootstrap, missing tools, or readiness repair.
- Boundary: no new public entrypoint is introduced.

**Verification:**
- `using-spec-first` preserves entry-governance priority while avoiding graph-as-universal-gate wording.

---

### U3. Adjust post-init guidance without creating a CLI mode

**Goal:** Make CLI init output support the same fast-path mental model while keeping setup/bootstrap guidance visible.

**Requirements:** R5, R7

**Dependencies:** U1, U2

**Files:**
- Modify: `src/cli/commands/init.js`
- Test: `tests/unit/init-dry-run.test.js`

**Approach:**
- Add one concise post-init line or next-step note that says lightweight tasks can start in the host after restart.
- Preserve existing next steps for `spec-mcp-setup`, `spec-graph-bootstrap`, and `spec-standards`.
- Avoid adding CLI flags, shell aliases, or new commands.

**Patterns to follow:**
- Existing `init --dry-run` output assertions in `tests/unit/init-dry-run.test.js`.
- Current README rule that host workflow entries are not shell commands.

**Test scenarios:**
- Happy path: Claude and Codex init output include the fast-path note and still include setup/bootstrap/standards next steps.
- Boundary: init help/output does not mention `spec-quick`, `spec-quick`, `spec-first quick`, or `--no-graph`.

**Verification:**
- Init output reduces onboarding friction without changing command surface.

---

### U4. Add no-graph fast-path contract coverage

**Goal:** Lock the lightweight boundary so future changes do not reintroduce graph-as-hard-gate messaging.

**Requirements:** R6, R7

**Dependencies:** U1, U2, U3

**Files:**
- Create or modify: `tests/unit/no-graph-fast-path-contracts.test.js`
- Modify as needed: `tests/unit/user-manual-contracts.test.js`
- Modify as needed: `tests/unit/using-spec-first-contracts.test.js`
- Modify as needed: `tests/unit/init-dry-run.test.js`
- Optional smoke: `tests/smoke/cli.sh`

**Approach:**
- Prefer one focused contract test file if assertions would otherwise scatter too much.
- Assert positive language: no-graph/lightweight path, bounded direct reads or degraded evidence, enhanced readiness path.
- Assert negative language: no `spec-quick`, no `spec-quick`, no `spec-first quick`, no “graph required before any workflow” wording.
- If adding smoke coverage, keep it package-CLI only: `doctor` / `init --dry-run` in a fresh temp repo with no `.spec-first/graph` artifacts should succeed and should not run graph bootstrap.

**Patterns to follow:**
- `tests/unit/user-manual-contracts.test.js` for doc snippet contracts.
- `tests/unit/init-dry-run.test.js` for post-init output contracts.
- `tests/smoke/cli.sh` if implementation chooses a shell smoke.

**Test scenarios:**
- Happy path: contract tests pass when docs and source skill expose the no-graph fast path.
- Error path: tests fail if a new quick entrypoint is documented.
- Boundary: tests fail if fast path wording removes setup/bootstrap/standards enhanced path guidance.

**Verification:**
- Regression coverage proves the fast path is a documentation/routing boundary, not a new runtime mode.

---

### U5. Update status docs and changelog

**Goal:** Close P2-006 in project status once implementation and review pass.

**Requirements:** R6

**Dependencies:** U1-U4

**Files:**
- Modify: `docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/plans/2026-05-11-010-feat-no-graph-fast-path-plan.md`

**Approach:**
- Mark `P2-006` as v1 fixed only after implementation verification passes.
- Update remaining P2 counts so `P2-008` becomes the only “worth doing but non-required” item, while `P2-001` and `P2-005` remain deferred.
- Flip this plan's `status: active` to `status: completed` at shipping, not during implementation.
- Add a changelog entry using the current developer profile.

**Patterns to follow:**
- Recent P2 completion updates in `docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md`.
- Current `CHANGELOG.md` single-line format.

**Test scenarios:**
- Changelog format test accepts the new entry.
- Main review document no longer lists P2-006 as pending after implementation.

**Verification:**
- Project backlog state matches the actual shipped diff.

---

## System-Wide Impact

- **Interaction graph:** This changes onboarding and routing prose, not workflow execution. Downstream workflows still decide how to consume missing/stale graph evidence.
- **Error propagation:** Missing graph readiness remains a disclosed degraded evidence state, not a silent success and not a universal blocker.
- **State lifecycle risks:** No new runtime state is introduced. Existing `.spec-first/graph/*` and provider artifacts remain generated/local evidence.
- **API surface parity:** Public workflow entrypoints remain unchanged for Claude and Codex.
- **Integration coverage:** Unit/contract tests should cover README, user manual, `using-spec-first`, and init output wording together.
- **Unchanged invariants:** `spec-mcp-setup`, `spec-graph-bootstrap`, and `spec-standards` remain the right path for graph-heavy, standards-heavy, or provider-readiness work.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Users skip setup for tasks that actually need graph evidence | Docs must distinguish fast path examples from graph-heavy enhanced path examples. |
| Fast path becomes a hidden mode or state machine | Explicitly ban new quick workflow/CLI mode and enforce with tests. |
| Init guidance gets too long | Add one compact line; keep detailed explanation in README/user manual. |
| Docs drift between English and Chinese | Update README and zh README together and cover both in tests. |
| Existing local pre-facts plan edits are accidentally mixed into implementation commit | Keep P2-006 commits scoped; review `git status` before staging. |

---

## Documentation / Operational Notes

- This is user-visible documentation and onboarding behavior. It should update README, Chinese README, and user manual together.
- Runtime mirror regeneration is not part of this plan. If source skill changes need regenerated runtime assets, implementation should run the appropriate `spec-first init --claude|--codex` only as a source-driven regeneration step and avoid committing generated mirrors unless project policy explicitly requires it.

---

## Sources & References

- Origin issue: `docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md`
- Role baseline: `docs/10-prompt/结构化项目角色契约.md`
- Public docs: `README.md`, `README.zh-CN.md`
- User manual: `docs/05-用户手册/01-快速开始.md`, `docs/05-用户手册/README.md`
- Entry governor: `skills/using-spec-first/SKILL.md`
- Init output tests: `tests/unit/init-dry-run.test.js`
- User manual tests: `tests/unit/user-manual-contracts.test.js`
- Entry governor tests: `tests/unit/using-spec-first-contracts.test.js`
