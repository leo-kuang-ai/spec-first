---
title: "feat: Streamline README onboarding and promotion"
type: feat
status: completed
date: 2026-06-01
spec_id: 2026-06-01-002-readme-onboarding-promotion
origin: docs/brainstorms/2026-06-01-002-readme-onboarding-promotion-requirements.md
---

# feat: Streamline README onboarding and promotion

## Summary

本计划把 `README.md` 与 `README.zh-CN.md` 从“完整但重复的工程说明”收敛为更适合首次接入和开源推广的入口页：保留一个权威 workflow 可视化、一张完整入口表和一个极简示例，下沉 runtime / graph / workspace 深层治理细节，并用现有 README 回归测试锁住双语一致性、Quickstart 边界和公开入口完整性。

---

## Problem Frame

origin requirements 指出，当前两份 README 已经具备价值优先、渐进披露、trust badges 和首个 workflow 说明，但主体重新膨胀到 17 个 H2 节，workflow 链路和入口映射在多个章节重复出现，`Runtime Reference` 与 `Supported Development Modes` 把 graph readiness、scenario fingerprint、workspace 拓扑、init 输出和 capability 计数等内部治理细节抬到了首次接入路径中间（see origin: `docs/brainstorms/2026-06-01-002-readme-onboarding-promotion-requirements.md`）。

本次计划只处理 README 内容层重构和对应文档回归测试，不改变 CLI 行为、workflow 行为、runtime generation、graph readiness 机制或 generated runtime mirrors。

---

## Requirements

- R1. 首屏定位必须更易转述：面向 Claude Code 与 Codex 的 spec-driven AI engineering workflows，把一次性 AI coding 对话变成可复用研发闭环。
- R2. README 前半段保留紧凑差异化表达：spec-first 编排 requirement、plan、task、diff、review、learning 等工程实体，而非 agent/role/team。
- R3. 保留适用性判断、trust badges、官网链接与中英互链。
- R4. Quickstart 保留最短可验证闭环：terminal 安装 CLI、`doctor`、按当前宿主 `init`、重启宿主、宿主会话运行第一个 workflow；terminal 命令与 host-session 入口必须分开标注。
- R5. Quickstart 明确按实际宿主选择 `--claude` 或 `--codex`，并保留 Node `>=20`、npm、Git、已安装宿主、shell 位于目标仓库根目录、可用 throwaway repo 等 prerequisites。
- R6. 保留“第一个 workflow 怎么选”，以 brainstorm 作为默认 first-run 示例，并说明产出 `docs/brainstorms/YYYY-MM-DD-NNN-topic-requirements.md` 后可进入 plan。
- R7. 全文只保留一处权威端到端 workflow 可视化，外加最多一个极简示例；其他位置引用或局部提及，不再重复完整链路。
- R8. 多张 workflow 入口表收敛为一张规范表，覆盖 intent、Claude Code `spec-*`、Codex `spec-*`、预期产物，且不丢失任何公开 workflow 入口。
- R9. 合并 `What You Get` 与 `How It Works` 中对 durable entities、artifact roots 和 runtime shape 的重复描述。
- R10. `Supported Development Modes` 的完整仓库拓扑从主体前半段下沉；主体只保留 `.spec-first` facts 以所选 Git repo root 为权威的最小约束。
- R11. `Runtime Reference` 的 graph readiness、provider config、scenario fingerprint、workspace 子仓、init 输出预期和 capability 计数等深层细节下沉；README 只保留首次接入必需的 runtime 摘要和 CLI reference。
- R12. 下沉不等于删除：必要参考必须在 README 后半段压缩摘要或既有 docs 链接中可达；无等价承载位置时保留最小可发现参考。
- R13. README 不再硬编码会随版本漂移的内部 skills / agents / commands 数量，改为引导通过 `spec-first doctor`、`spec-first init` 输出或 runtime catalog 查看。
- R14. `README.md` 与 `README.zh-CN.md` 保持相同 H2 信息架构、等价信息量和一致收敛结果。
- R15. 中英文均保留 source/runtime 边界、当前宿主选择、适用性判断和设计边界收尾。
- R16. 交付后记录轻量验证：行数/H2 收敛度量、30 秒首访阅读检查、单宿主 Quickstart trace、README 回归测试结果或按需更新说明。
- R17. 首屏价值区保留未来演示素材位，本次复用 `docs/assets/readme/spec-first-flow.svg`，不生产 GIF、截图或录屏。

**Origin acceptance examples:** AE1 covers R1/R2/R3, AE2 covers R4/R5/R6, AE3 covers R7/R8/R9, AE4 covers R10/R11/R12/R13, AE5 covers R14/R15, AE6 covers R17, AE7 covers R16.

---

## Scope Boundaries

- 只改 README 内容结构、README 回归测试、轻量验证记录和 `CHANGELOG.md`。
- 不录制 GIF、asciinema、截图或新增营销素材；只保留可替换的素材位置并继续复用现有 SVG。
- 不新增 Roadmap、赞助、社区聊天渠道或未维护政策入口。
- 不删除任何公开 workflow 入口；只合并展示方式并下沉深层参考。
- 不改变 CLI 行为、workflow 行为、runtime 生成契约、graph readiness 机制或测试运行契约。
- 不修改 `CLAUDE.md`、`AGENTS.md`、`skills/`、`agents/`、`templates/` 或 generated runtime mirrors。
- 不手改 `.claude/`、`.codex/`、`.agents/skills/`。

### Deferred to Follow-Up Work

- CLI setup 动画：后续可用可重生成的 `.tape` / VHS 录制 `npm i -g spec-first` → `doctor` → `init` 的确定性段。
- Workflow 实跑录制：后续如需要，只能录真实宿主会话输出，不用 VHS 伪造非确定性 workflow 结果。
- 更完整英文文档：如要把 Chinese-first 详细手册双语化，另开文档计划，不混入本次 README 收敛。

---

## Graph Readiness

- target_repo: `.`
- status: stale
- source_revision: `31c4438e0184d495d27487b1d7604ee2fb723dae`
- current_revision: `0ed738ebd4dd1c3fae7ceaa455b66a150cd1881d`
- stale: true
- primary_providers: `gitnexus`
- degraded_providers: none recorded in compiled facts
- fallback_capabilities: bounded direct repo reads, README tests, package metadata, existing docs links, institutional learnings under `docs/solutions/`
- runtime_mcp_evidence: session-local GitNexus `query` succeeded and surfaced `tests/unit/readme-open-source-entry.test.js`, `README.md`, the origin requirements, and the prior README plan; process results were not relevant to this docs-only scope.
- confidence: high for docs/test planning from direct source reads; low for graph impact evidence because compiled graph facts are stale and dirty-advisory.
- limitations: compiled graph facts were generated from an older dirty worktree and current worktree contains many unrelated untracked docs/assets; graph evidence is advisory only and current-source claims require direct reads.

---

## Graph / GitNexus Evidence

- provider: GitNexus
- native_tool_or_resource: `query`
- repo_scope: `spec-first`
- capability_status: partial
- evidence_grade: session-local
- evidence_posture: fallback
- freshness_state: dirty-advisory
- source_tags: [checked-in-baseline, live-mcp-tool, session-local-inference]
- source_contract_fields: `graph-facts.v1.capabilities.query_global_graph`, `provider_summary.ready_primary_providers`, `source_revision`, `worktree_dirty`, `worktree_status_hash`
- source_reads_required: mandatory
- impact_on_plan: GitNexus was used only to orient likely README-related files and prior artifacts; implementation units and verification strategy are based on direct reads of README, tests, docs, changelog, and origin requirements.
- capabilities_used: `mcp__gitnexus.query`
- key_findings: GitNexus found `tests/unit/readme-open-source-entry.test.js`, `README.md`, `docs/brainstorms/2026-06-01-002-readme-onboarding-promotion-requirements.md`, and `docs/plans/2026-05-01-001-feat-readme-open-source-trust-plan.md` as relevant pointers.
- limitations: no GitNexus impact/process claim is used; README/docs-only work does not need provider refresh before planning.

---

## Context & Research

### Relevant Code and Patterns

- `README.md` and `README.zh-CN.md` currently mirror the same 17 H2 information architecture. Direct measurement during planning showed 663 / 664 lines and 17 H2 headings.
- `tests/unit/readme-open-source-entry.test.js` already protects top trust signals, SVG workflow diagram, first-run artifacts, first workflow chain, entrypoint distinctions, local link validity, and conservative community policy links.
- Prior README plan `docs/plans/2026-05-01-001-feat-readme-open-source-trust-plan.md` is completed and established the current trust-entry baseline: visible demo, success-oriented Quickstart, artifact examples, concise trust model, community files, and bilingual structure.
- Existing docs that can receive downshifted details include `docs/catalog/runtime-capabilities.md`, `docs/contracts/gitnexus-capability-catalog.md`, `docs/contracts/graph-evidence-policy.md`, `docs/contracts/graph-provider-consumption.md`, `docs/contracts/workspace-gitnexus-consumption.md`, `docs/contracts/source-runtime-customization-boundary.md`, `docs/05-用户手册/02-核心概念.md`, `docs/05-用户手册/04-workflows-artifacts-map.md`, `docs/05-用户手册/08-三种开发模式.md`, `docs/05-用户手册/09-首次工作流走查.md`, and `docs/05-用户手册/10-产物目录.md`.
- `package.json` confirms this is a CommonJS Node CLI with Node `>=20.0.0`; README testing is Jest-based via `npm run test:jest` / `npm run test:unit`, but this planning workflow does not execute tests.

### Institutional Learnings

- `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md`: host-specific `spec-*` / `spec-*` mappings should be centralized in init output, governance contracts, and README's central entry table; ordinary prose should prefer “current host”.
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`: generated runtime assets are disposable mirrors; README must preserve source-first and `spec-first init` regeneration boundaries.
- `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md`: workflow entry exposure spans manifest, governance and host adapter boundaries. For this plan, the README must list existing public entries without implying new runtime exposure.
- `docs/solutions/workflow-issues/workflow-host-instruction-reuse-policy-2026-05-25.md`: host/project instructions are loaded governance context, not ordinary README content. This supports downshifting internal governance details instead of front-loading them.

### External References

- None. Local README requirements, prior README plan, tests, package metadata, docs links, and institutional learnings are sufficient. This is content architecture work, not a new external API, security, payment, or framework integration.

---

## Key Technical Decisions

- **Make `See It In 90 Seconds` the canonical visual/proof slot:** reuse `docs/assets/readme/spec-first-flow.svg` near the front as the single authoritative workflow visualization and future demo replacement point; do not keep a second full ASCII lifecycle diagram.
- **Keep one tiny example, not multiple loop retellings:** preserve a compact brainstorm → requirements → plan continuation example, and make all other mentions point back to the canonical visualization or entry table.
- **Merge entrypoint mapping into one complete table:** combine `Choose Your Path`, `Core Workflows`, `Full Workflow Reference`, and `How It Works > Main flows` into one canonical table with intent, Claude Code entry, Codex entry, and expected artifact/result.
- **Downshift runtime details by consumer need:** first-run readers get only source assets → `spec-first init` → host runtime → workflow artifacts; maintainers get links to runtime catalog, graph contracts, workspace docs, and CLI help.
- **Avoid hardcoded runtime counts in README:** counts drift with each release and already have deterministic discovery surfaces. README should point to `doctor`, `init` output, `--help`, and runtime catalog instead of embedding skills/agents/commands counts.
- **Update tests as a content contract, not a snapshot:** README tests should assert structural properties, key links, no duplicate full-flow sections, no public entry loss, host-session command separation, and no hardcoded internal count table.
- **Record verification in the requirements artifact or a short plan/work closeout:** R16 asks for measured validation. The implementation should record metrics and reading checks in a durable source doc section rather than leaving them only in chat.

---

## Open Questions

### Resolved During Planning

- Which workflow visual should be authoritative? Use the existing SVG in `See It In 90 Seconds` as the canonical visual/proof slot; remove or compress the redundant full ASCII flow instead of maintaining two complete chain depictions.
- Which entry table should be canonical? Create one complete table derived from the current `Full Workflow Reference`, augmented with expected artifact/result; remove duplicated chooser/core-flow tables or convert them into short prose pointing to the canonical table.
- Where should verification be recorded? Prefer appending a concise `Implementation Verification` update to the origin requirements document or a dedicated closeout section in the implementation PR description; tests should also lock machine-checkable parts.

### Deferred to Implementation

- Exact H2 names and final line-count target: choose during README editing, but both languages must keep matching H2 order and a materially smaller body.
- Whether every downshifted runtime paragraph has an exact docs link: implementation must verify link coverage; if no equivalent exists, keep a compressed README reference per R12.
- Exact Jest assertions for duplicate-flow detection: implementation should inspect the edited README shape before choosing regex or parser-style checks.

---

## Implementation Units

### U1. Define the canonical README information architecture

**Goal:** Establish the new section order and content ownership before editing prose, so both READMEs converge on the same reduced structure.

**Requirements:** R1, R2, R3, R7, R8, R9, R14, R15

**Dependencies:** None

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Test: `tests/unit/readme-open-source-entry.test.js`

**Approach:**
- Keep the front-door sequence: title/trust/language links, one-line positioning, canonical proof/visual slot, tiny example, Why/differentiation, Quickstart, canonical workflow entry table, trust/source-runtime model, docs/development links.
- Collapse duplicated `Choose Your Path`, `Core Workflows`, `Full Workflow Reference`, and `How It Works > Main flows` into one canonical entry table.
- Merge duplicated artifact/runtime descriptions from `What You Get` and `How It Works` into a single “outputs and operating model” section.
- Keep H2 headings mirrored between English and Chinese even when localized names differ.

**Patterns to follow:**
- Current `README.md` / `README.zh-CN.md` bilingual mirror pattern.
- Prior completed plan `docs/plans/2026-05-01-001-feat-readme-open-source-trust-plan.md`.

**Test scenarios:**
- Covers AE3 / AE5. Happy path: both READMEs expose the same H2 count and order after localization mapping.
- Covers AE3. Happy path: exactly one canonical public workflow entry table contains every public workflow currently listed in the old Full Workflow Reference.
- Covers AE3. Edge case: tests fail if another full end-to-end workflow chain is reintroduced outside the canonical visual slot and the tiny example.
- Integration: local README link validation still passes after section removal and link consolidation.

**Verification:**
- A maintainer can identify one canonical place for workflow visual explanation and one canonical place for entrypoint lookup.

---

### U2. Rework the front-door positioning, differentiation, and demo slot

**Goal:** Make the README easier to summarize and share without turning it into a marketing-only page.

**Requirements:** R1, R2, R3, R17

**Dependencies:** U1

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Test: `tests/unit/readme-open-source-entry.test.js`

**Approach:**
- Sharpen the opening positioning around “spec-driven AI engineering workflows for Claude Code and Codex” plus “reusable engineering loop”.
- Add or tighten a compact differentiation block: spec-first organizes engineering artifacts and evidence, not generic agent teams.
- Keep trust badges, official site, language links, and the existing SVG.
- Treat the SVG placement as the future demo slot, with wording that makes replacement by GIF/screenshot possible later without moving sections.

**Patterns to follow:**
- Current badge/link pattern in both README files.
- `docs/assets/readme/spec-first-flow.svg` as the only current README visual asset.

**Test scenarios:**
- Covers AE1. Happy path: first screen contains positioning, official site, language link, trust signals, and no runtime capability count.
- Covers AE1. Happy path: differentiation text explains artifact/evidence workflow rather than agent orchestration.
- Covers AE6. Happy path: both READMEs still reference `docs/assets/readme/spec-first-flow.svg` through the maintained raw GitHub URL or equivalent existing pattern.
- Edge case: tests fail if a hardcoded skills/agents/commands count appears in the front-door or runtime summary.

**Verification:**
- A 30-second read can answer “what is this”, “why it is different”, and “why try it” before reaching Quickstart.

---

### U3. Convert Quickstart into a single-host success path

**Goal:** Preserve the shortest verified onboarding loop while removing ambiguity between terminal commands and host-session workflow entries.

**Requirements:** R4, R5, R6, R14, R15

**Dependencies:** U1

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Test: `tests/unit/readme-open-source-entry.test.js`

**Approach:**
- Keep prerequisites explicit and near Quickstart.
- Separate terminal commands (`npm install -g spec-first`, `spec-first doctor`, `spec-first init --claude|--codex`) from host-session entries (`spec-brainstorm`, `spec-brainstorm`).
- Keep the host choice explicit: users initialize the host they actually use, not both by default.
- Make the first-run brainstorm output and next step to plan visible without repeating the full workflow chain elsewhere.

**Patterns to follow:**
- Existing Quickstart terminal/host-session separation around current lines near the Quickstart section.
- `docs/05-用户手册/09-首次工作流走查.md` for first workflow expectations.

**Test scenarios:**
- Covers AE2. Happy path: Codex-only path shows `spec-first init --codex` as terminal command and `spec-brainstorm` as host-session entry.
- Covers AE2. Happy path: Claude-only path shows `spec-first init --claude` as terminal command and `spec-brainstorm` as host-session entry.
- Covers AE2. Error path: tests fail if `spec-*` or `spec-*` is placed in an unlabelled `bash` block that looks like a shell command.
- Edge case: tests fail if README implies all users must initialize both hosts.

**Verification:**
- A single-host Quickstart trace can be followed on paper from install through first brainstorm artifact without switching context unexpectedly.

---

### U4. Downshift runtime, graph, and workspace governance details

**Goal:** Keep source/runtime and graph evidence boundaries discoverable while removing internal lifecycle detail from the first-run reading path.

**Requirements:** R10, R11, R12, R13, R15

**Dependencies:** U1, U3

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Test: `tests/unit/readme-open-source-entry.test.js`

**Approach:**
- Replace the long `Runtime Reference` explanation with a compact runtime summary: source assets → `spec-first init` → host runtime assets → workflow artifacts.
- Keep a concise CLI reference block, but avoid full expected init output and internal capability counts.
- Move graph readiness/provider/scenario/workspace details behind links to existing docs and contracts.
- Compress `Supported Development Modes` to the minimum repository-root authority rule plus links to user manual / workspace docs.

**Patterns to follow:**
- `docs/contracts/source-runtime-customization-boundary.md` for source/runtime wording.
- `docs/catalog/runtime-capabilities.md`, `docs/contracts/gitnexus-capability-catalog.md`, `docs/contracts/graph-evidence-policy.md`, and `docs/contracts/workspace-gitnexus-consumption.md` for deep runtime/graph references.
- `docs/05-用户手册/08-三种开发模式.md` for development mode detail.

**Test scenarios:**
- Covers AE4. Happy path: front half does not contain scenario fingerprint, provider readiness detail, init full-output blocks, or hardcoded runtime capability counts.
- Covers AE4. Happy path: README retains links to runtime catalog, graph/provider contracts, and development modes docs.
- Covers AE4. Edge case: if a removed detail has no equivalent docs link, README retains a compressed reference rather than deleting it.
- Covers AE4. Error path: tests fail when skills/agents/commands numeric counts are reintroduced into README runtime tables.

**Verification:**
- Internal governance details remain findable, but a first-time user reaches Quickstart and the first workflow without reading provider lifecycle prose.

---

### U5. Update README regression tests around structure, dedupe, and public entry completeness

**Goal:** Convert the new README shape into maintainable contract tests so future README edits do not reintroduce redundancy or host-entrypoint drift.

**Requirements:** R7, R8, R13, R14, R15, R16

**Dependencies:** U1, U2, U3, U4

**Files:**
- Modify: `tests/unit/readme-open-source-entry.test.js`

**Approach:**
- Update section-order expectations for the new H2 architecture.
- Add assertions that all public workflow entries from the canonical table remain present in both host columns.
- Add structural checks for a single canonical workflow table and one canonical visual/proof slot.
- Add negative checks for hardcoded runtime counts and duplicate full-chain sections.
- Keep local markdown link resolution and conservative policy link checks.

**Patterns to follow:**
- Existing helper functions in `tests/unit/readme-open-source-entry.test.js`, especially ordered section and local link checks.
- Host entrypoint boundary learning from `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md`.

**Test scenarios:**
- Happy path: English and Chinese README section-order assertions pass with mirrored information architecture.
- Happy path: canonical entry table includes mcp-setup, graph-bootstrap, update, sessions, slack-research, skill-audit, ideate, brainstorm, prd, doc-review, plan, write-tasks, app-consistency-audit, debug, work, optimize, polish-beta, code-review, compound, compound-refresh, and release-notes.
- Edge case: tests fail if `spec-*` and `spec-*` mappings are scattered into multiple full entry tables.
- Error path: tests fail if local docs links introduced by downshifting do not exist.

**Verification:**
- README regressions are guarded by focused Jest assertions rather than snapshotting the entire document.

---

### U6. Record lightweight verification and changelog

**Goal:** Close the content-change loop with the metrics and source change record required by the origin and project governance.

**Requirements:** R16

**Dependencies:** U1, U2, U3, U4, U5

**Files:**
- Modify: `docs/brainstorms/2026-06-01-002-readme-onboarding-promotion-requirements.md`
- Modify: `CHANGELOG.md`

**Approach:**
- Add an `Implementation Verification` section or equivalent update to the origin requirements document after implementation, recording before/after line count and H2 count, public workflow entry completeness, 30-second read check, single-host Quickstart trace, and README test result.
- Update `CHANGELOG.md` with author from `~/.spec-first/.developer`; mark user-visible because README onboarding changes affect public users.
- Keep verification prose factual; do not claim external user research or runtime behavior that was not executed.

**Patterns to follow:**
- Existing `Implementation Verification` style in `docs/brainstorms/2026-05-01-001-readme-community-entry-requirements.md`.
- Root `CHANGELOG.md` format.

**Test scenarios:**
- Test expectation: none -- this unit records documentation and changelog evidence after the feature-bearing README/test work is complete.

**Verification:**
- The implemented change has a durable verification record and a changelog entry before handoff or PR.

---

## System-Wide Impact

- **Interaction graph:** README is a public documentation surface consumed by GitHub, npm users, current host users, contributors, and future workflow readers. No runtime code path changes.
- **Error propagation:** The main risk is documentation-induced user error, especially treating `spec-*` / `spec-*` as shell commands or thinking both hosts must be initialized.
- **State lifecycle risks:** No persistent data changes. Generated runtime mirrors remain out of scope and should not be edited.
- **API surface parity:** The canonical workflow table must preserve all current public Claude and Codex entrypoints.
- **Integration coverage:** README local links, SVG reference, community files, first workflow artifact paths, and bilingual section parity need regression coverage.
- **Unchanged invariants:** CLI commands, package version behavior, graph readiness semantics, source/runtime boundary, and dual-host governance remain unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Downshifting removes necessary runtime reference instead of making it discoverable | For each removed deep detail, map it to an existing docs link; if no link exists, keep a compressed README reference per R12. |
| Canonical entry table accidentally drops a public workflow | Use the current Full Workflow Reference as the source list and add tests for every public entry. |
| README becomes too marketing-heavy and hides governance boundaries | Keep source/runtime boundary, current-host init, scripts prepare / LLM decides, and generated mirror rules in a compact trust/model section. |
| English and Chinese README drift structurally | Update both in the same unit and assert mirrored H2 ordering/count. |
| Tests overfit wording and make future README edits expensive | Assert structural contracts, links, entry completeness, and key concepts rather than large exact text blocks. |
| Graph facts are stale and unrelated untracked docs/assets exist | Treat graph as advisory only; base plan and implementation on direct source reads. |

---

## Documentation / Operational Notes

- This plan does not require external research or runtime refresh.
- This plan should be implemented through source files only; generated mirrors remain untouched.
- Implementation should run the narrow README test file first, then expand only if the edit touches shared test helpers or release documentation expectations.
- If implementation discovers a necessary runtime concept has no durable docs target, keep the minimal README reference and consider a separate docs follow-up rather than deleting the concept.
