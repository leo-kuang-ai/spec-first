---
title: "refactor: README adoption-first 二次重设计"
type: refactor
status: completed
date: 2026-06-30
spec_id: 2026-06-30-001-readme-adoption-first-redesign
origin: docs/brainstorms/2026-06-30-001-readme-adoption-first-redesign-requirements.md
origin_grade: brainstorm
---

# refactor: README adoption-first 二次重设计

## Summary

将 `README.md` 与 `README.zh-CN.md` 从“完整解释 spec-first”进一步收敛为 adoption-first 开源入口：前半段优先服务首次评估与 first success path，后半段保留 Trust Model、Operating Model、workflow、CLI 和贡献者深度信息。实现策略是重排与收紧现有 README 内容，不新增 runtime/CLI/workflow surface，也不新增图片资产。

---

## Completion Evidence

- **Status:** completed 2026-06-30.
- **Primary restructure (U1–U3 structural body):** already landed via commit `adb7008b` + matrix automation (CHANGELOG v1.12.0 2026-06-30 01:14:17). Adoption-first opening order, npm download badges, 90-second visible-effect framing, compact Problem/Why/Quickstart funnel, and Trust/Operating Model progressive disclosure were in place at session start; twelve of R1–R13 were satisfied structurally before this run.
- **Residual R11 mirror fix (this run):** prior execution left two bilingual-mirror defects — the English "Why spec-first?" funnel carried a stray Chinese team-standards bullet (8 vs ZH 7) and the English Documentation section lacked the team-standards links present in ZH. Fixed by converting the EN bullet to English, adding the matching ZH funnel bullet (both sides 8), adding Team Standards Contract/Index links to EN Documentation, and relocating (not deleting) the test-guarded Chinese substring into an EN Documentation `<sub>` note per KTD6.
- **Verification:** `npx jest tests/unit/package-install-contracts.test.js tests/unit/context-governance-contracts.test.js tests/unit/team-standards-governance-contracts.test.js tests/unit/release-continuity-guard.test.js tests/unit/contract-drift-guard.test.js tests/unit/changelog-format.test.js --runInBand` (37 passed); `git diff --check` clean; bilingual H2 (11=11) and funnel bullet (8=8) counts compared. CHANGELOG updated (user-visible). No generated runtime mirrors changed; no `spec-first init` required.

---

## Decision Brief

- **Recommended approach:** 复用现有 README 双语结构、三张 readme 图、Quickstart、Trust/Operating Model 和测试守护，做一次窄范围信息架构重排与文案收紧；不引入新 source-of-truth 或新 demo 资产。
- **Key decisions:** demo slot 继续用现有 `spec-first-flow.png`，Quickstart 中补强 “expected repo-local artifact” 体感；“What it does not do” 不新设首屏段落，沿用并收紧后段 `Use spec-first when` 的不适用边界。
- **Validation focus:** 双语章节镜像、英文 npm README 自洽、绝对链接/PNG/SVG caption 守护、context/team-standards/source-runtime 边界字符串、release-continuity 与 changelog 格式。
- **Largest risks / boundaries:** 风险集中在误删测试守护的 verbatim 字符串、双语结构漂移、把 adoption 文案写成夸大外部验证。计划用 anchor 清单与 targeted tests 兜底。

---

## Problem Frame

上游需求文档明确选择 adoption-first：README 第一目标是让新用户在 30-90 秒内判断是否值得安装试用。当前 README 已经经过上一轮集成上手重构，解决了安装入口过深和首次示例重复的问题，但前半段仍混合价值、完整治理、runtime 和深度参考，首次评估路径还可以更锐利。

本计划承接 `docs/brainstorms/2026-06-30-001-readme-adoption-first-redesign-requirements.md`，不重新定义 WHAT。规划重点是 HOW：在当前 repo 中只改现有 README 双语文件和 changelog，保留测试守护事实与 source/runtime 边界，把深度内容转为渐进披露。

---

## Requirements

- R1. README 前半段围绕 adoption-first 决策路径组织：是什么、解决什么痛点、为什么不同、看到什么效果、如何快速试用。（origin R1）
- R2. 首屏保留 “AI Coding Harness for Claude Code and Codex” 定位，并紧跟结果导向解释。（origin R2）
- R3. “The Problem / 你遇到的问题” 保持紧凑，聚焦决策、证据、review trail、learning 随聊天窗口消失的风险。（origin R3）
- R4. “Why spec-first?” 或等价价值段落优先呈现差异化对比，重点放在 artifact/evidence/governance/knowledge loop。（origin R4）
- R5. 深入架构之前展示可感知的实际效果；优先使用现有图示和最短 workflow 产物路径，不新增录屏/GIF。（origin R5）
- R6. Quickstart 保持 prerequisites → install → doctor → init → restart host → first workflow → expected repo-local artifact 的连续路径。（origin R6）
- R7. 首次 workflow 示例同时照顾 Claude Code 与 Codex，但避免重复两套长篇教程。（origin R7）
- R8. Trust Model 后移为渐进披露段落，并保留 scripts/LLM、source/runtime、verification/honest closeout、provider evidence boundary。（origin R8）
- R9. Operating Model 承载 repo-local artifacts、generated runtime assets 与 source-of-truth 解释。（origin R9）
- R10. README 诚实区分 confirmed capability、advisory evidence 和 aspirational/needs-evidence；不把机制就位写成效果已被外部验证。（origin R10）
- R11. `README.md` 与 `README.zh-CN.md` 章节结构镜像，关键信息量对等。（origin R11）
- R12. 英文 README 作为 npm package README 主入口，首次试用链路不依赖中文文档。（origin R12）
- R13. README 不引入新的 source-of-truth surface；深度内容通过现有 docs/contracts、user manual、runtime capability catalog、contributing/security/license 链接承接。（origin R13）

**Origin actors:** A1 首次评估者，A2 试用者，A3 团队采纳评估者，A4 潜在贡献者
**Origin flows:** F1 首次评估路径，F2 首次试用路径，F3 信任评估路径
**Origin acceptance examples:** AE1 covers R1/R2/R5，AE2 covers R6/R7，AE3 covers R8/R10，AE4 covers R11/R12

---

## Scope Boundaries

- 不新增 Roadmap、赞助、社区群、营销落地页或官网改版。
- 不新增 product capability、workflow entrypoint、CLI 命令、runtime surface、schema 或 source/runtime projection surface。
- 不修改 generated runtime mirrors。
- 不新增图片资产；继续复用 `docs/assets/readme/spec-first-flow.*`、`spec-first-artifact-trail.*`、`spec-first-runtime-model.*`。
- 不删除现有 README 深度入口；只调整信息架构、文案重心和前后顺序。
- 不把外部 README best practice 写成 spec-first 能力事实；能力事实只来自当前 repo source、docs、tests 和 CLI。

---

## Direct Evidence Readiness

- target_repo: spec-first（当前仓库根）
- evidence_sources: upstream requirements, prior README brainstorm/plan, direct README section scan, targeted `rg`, Codegraph advisory exploration, package/test source reads, git status
- source_refs: `docs/brainstorms/2026-06-30-001-readme-adoption-first-redesign-requirements.md`, `docs/brainstorms/2026-06-29-001-readme-integration-onboarding-refactor-requirements.md`, `docs/plans/2026-06-29-001-refactor-readme-integration-onboarding-plan.md`, `README.md`, `README.zh-CN.md`, `package.json`, `tests/unit/package-install-contracts.test.js`, `tests/unit/context-governance-contracts.test.js`, `tests/unit/team-standards-governance-contracts.test.js`, `scripts/check-release-continuity.cjs`
- current_revision: `adb7008b`
- worktree_status: dirty; current worktree already has unrelated edits in host instruction files, README assets, spec-prd docs, npm matrix smoke files, plus this run's brainstorm artifact and changelog entry. Implementation must preserve unrelated user changes and inspect current diffs before editing `README.md`, `README.zh-CN.md`, or `CHANGELOG.md`.
- confidence: medium-high for README/test constraints; final prose quality still depends on implementation-time editing and rendered scan.
- limitations: Codegraph returned weak README-specific coverage, so plan conclusions rely on direct source/test reads and `rg`; no live user adoption data exists, so adoption claims remain positioning goals, not confirmed outcome evidence.

---

## Direct Evidence

- repo_scope: single repo; docs-only public README surface.
- source_reads_completed: new requirements doc, prior README requirements doc, prior README plan, current README anchor scan, package manifest, targeted README/package/context/team-standards/release-continuity tests.
- source_reads_required: current full `README.md` and `README.zh-CN.md` during implementation before edits, because both are dirty and line positions may drift.
- commands_or_tools_used: `rg` for README/test anchors, `find` for existing plan names, `git status --short`, `git rev-parse --short HEAD`, `wc -l`, Codegraph exploration, `spec-first internal task-governance-signals`.
- impact_on_plan: preserved the previous plan's guardrail posture, downgraded `task-governance-signals` candidate from Deep to Standard because the runtime hit is keyword-only in a docs plan, and identified exact tests to protect package/readme boundary facts.
- key_findings:
  - `package.json` ships `README.md` but not `README.zh-CN.md` or `docs/assets/readme/`.
  - `README.md` currently has absolute raw GitHub PNG/SVG links for readme assets.
  - `tests/unit/package-install-contracts.test.js` guards absolute README links and package payload boundaries.
  - `tests/unit/context-governance-contracts.test.js` guards ordinary-context exclusion wording in both README files.
  - `tests/unit/team-standards-governance-contracts.test.js` guards team standards visibility in both README files.
  - `scripts/check-release-continuity.cjs` guards source/runtime boundary links in both README files.
- limitations: No browser-rendered README preview was checked during planning; implementation should rely on raw markdown review plus rendered scan if convenient.

---

## Context & Research

### Relevant Code and Patterns

- `README.md` and `README.zh-CN.md` are already structurally mirrored after the previous README refactor.
- Current public section pattern: intro/badges/language links, `See It In 90 Seconds`, `The Problem`, `Why spec-first?`, `Quickstart`, `Workflow Entry Points`, `Operating Model`, `Trust Model`, `Use spec-first when`, `Documentation`, `Runtime And CLI Reference`, `Development & Contributing`.
- Existing image pattern: PNG rendered in README, source SVG linked in a compact `<sub>` caption. This pattern should remain because npm package payload does not include `docs/assets/readme/`.
- Previous README plan is `status: completed` and remains advisory prior art. This plan should not revert that work; it narrows adoption-first message on top.

### Institutional Learnings

- Prior plan notes that README edits are guarded by tests for absolute links, PNG references, flow wording, team standards, context exclusion, and source/runtime boundary links.
- Loaded project instructions require CHANGELOG for any source/doc change and forbid editing generated runtime mirrors.

### External References

- GitHub README docs, Open Source Guides, npm README docs, and Make a README are used only as information-architecture references. They support prioritizing purpose, usefulness, getting started, support, and contribution paths; they do not define spec-first capability claims.

---

## Key Technical Decisions

- **KTD1. Keep this as docs-only extension of existing surfaces.** Reuse `README.md`, `README.zh-CN.md`, existing readme assets, existing docs links, and existing tests. Do not create a new README companion, landing page, demo asset, workflow, schema, or source-of-truth file.
- **KTD2. Structure the first half as an adoption funnel.** The opening should read in this order: identity/status, visible effect, problem, differentiated value, quick first success. Trust/Operating Model remain present but move later.
- **KTD3. Demo slot stays asset-light.** Keep `spec-first-flow.png` as the visible effect near the top and strengthen nearby prose/Quickstart expected artifact. A terminal transcript or GIF is deferred unless implementation can add a tiny text example without bloating the page.
- **KTD4. English README must be self-contained for first success.** Because only `README.md` ships in npm, a new user should complete install/init/first workflow from the English README without relying on Chinese manual links.
- **KTD5. Use existing “not fit” surface instead of a new early disclaimer.** Do not add a separate front-half “What it does not do” block unless implementation discovers a severe ambiguity; use `Use spec-first when` to carry fit/non-fit boundaries.
- **KTD6. Treat tests as source constraints, not wording suggestions.** The implementation may move guarded strings to better sections, but must not remove or paraphrase strings that tests assert verbatim.

---

## Open Questions

### Resolved During Planning

- **Plan depth:** `task-governance-signals` returned `candidate_level: deep` due to `runtime` keyword and multi-area docs scope. This plan uses Standard because the implementation is docs-only, does not touch runtime source, and has known tests.
- **Demo choice:** Use existing diagram and expected artifact path; do not plan new GIF or image asset.
- **Bilingual policy:** Keep section-level mirror. Chinese README may keep richer Chinese manual links, but the English README first-success path must be self-contained.
- **Misunderstanding boundary:** Do not add a new first-half disclaimer by default; preserve and tune `Use spec-first when`.

### Deferred to Implementation

- Exact heading names and final prose in the opening sections, as long as the adoption-first order and bilingual mirror hold.
- Whether to include a one-line “expected artifact” snippet in Quickstart or keep it as prose after first workflow command.
- Whether a rendered Markdown preview is worth checking after raw markdown tests pass.

---

## Implementation Units

### U1. Current README Anchor Audit And Outline

**Goal:** Establish the concrete edit map before changing prose, so implementation preserves dirty-worktree changes and test-guarded anchors.

**Requirements:** R1, R5, R8, R10, R11, R13

**Dependencies:** None

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`

**Approach:**
- Inspect current diffs for both README files before editing and preserve any unrelated user changes.
- List current H2 section order for both README files and sketch the target mirrored order.
- Locate all guarded anchors from package/context/team-standards/release-continuity tests before moving sections.
- Reuse decision: extend existing README files and existing image assets; do not create a new demo file or companion guide.

**Patterns to follow:**
- Prior completed plan: `docs/plans/2026-06-29-001-refactor-readme-integration-onboarding-plan.md`
- Image/caption pattern already present in `README.md` and `README.zh-CN.md`

**Test scenarios:**
- Happy path: all guarded anchor strings remain locatable before and after section movement.
- Edge case: if a guarded anchor is inside a paragraph being rewritten, preserve the exact asserted substring in the rewritten paragraph.
- Integration: both README files retain mirrored H2 count/order after outline application.

**Verification:**
- Current and target section outlines exist in implementation notes or closeout.
- No unrelated README diff is dropped.

---

### U2. Rewrite English README Opening And Quickstart Path

**Goal:** Make `README.md` adoption-first and npm-self-contained while preserving package/link guards.

**Requirements:** R1, R2, R3, R4, R5, R6, R7, R10, R12, R13

**Dependencies:** U1

**Files:**
- Modify: `README.md`
- Test: `tests/unit/package-install-contracts.test.js`
- Test: `tests/unit/context-governance-contracts.test.js`
- Test: `tests/unit/team-standards-governance-contracts.test.js`

**Approach:**
- Keep the title block compact: identity, badges, language links, and a result-oriented line explaining repo-backed engineering loop.
- Keep `See It In 90 Seconds` near the top but make its caption/prose serve visible effect rather than internal diagram maintenance.
- Tighten `The Problem` to the specific adoption pain: AI output is fast, but decisions/evidence/review/learning vanish without repo-local artifacts.
- Reframe `Why spec-first?` as the core differentiation table or bullets; avoid implying measured adoption outcomes.
- Keep Quickstart early and self-contained: prerequisites, install, doctor, init, restart host, first workflow for both hosts, expected repo-local artifact.
- Keep all English absolute links and raw GitHub asset URLs as absolute https links.

**Execution note:** Treat exact test-asserted substrings as immovable text anchors even if their surrounding section changes.

**Patterns to follow:**
- Existing Quickstart command formatting in `README.md`
- Existing absolute links in `README.md`

**Test scenarios:**
- Happy path: a first-time English reader can complete install/init/first workflow without leaving `README.md`.
- Edge case: no relative `](./` or `](../` links are introduced.
- Error path: no prose claims that external adoption results are proven; claims remain framed as product intent and current mechanism.
- Integration: package README links and SVG/PNG URLs remain compatible with npm package payload.

**Verification:**
- `tests/unit/package-install-contracts.test.js` passes.
- English-specific anchors for context governance and team standards still pass targeted tests.

---

### U3. Mirror Chinese README Structure And Preserve Localized Depth

**Goal:** Apply the same adoption-first structure to `README.zh-CN.md` while preserving Chinese wording, Chinese manual links, and existing guarded terms.

**Requirements:** R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11

**Dependencies:** U2

**Files:**
- Modify: `README.zh-CN.md`
- Test: `tests/unit/context-governance-contracts.test.js`
- Test: `tests/unit/team-standards-governance-contracts.test.js`

**Approach:**
- Mirror the final English section order one-for-one using Chinese section titles.
- Translate or adapt the revised adoption-first opening rather than independently inventing a second structure.
- Preserve Chinese manual/resource links where they already exist, but do not make the English README depend on them.
- Keep `普通上下文排除什么` and `团队开发规范合同` exact substrings intact.

**Patterns to follow:**
- Existing `README.zh-CN.md` translation style.
- U2 final section order.

**Test scenarios:**
- Happy path: H2 section sequence in Chinese mirrors the English sequence.
- Edge case: Chinese deep links remain in appropriate documentation sections, not in the first-success path as mandatory prerequisites.
- Integration: Chinese context-governance and team-standards tests pass.

**Verification:**
- Targeted context/team-standards tests pass.
- Manual H2 comparison confirms structure mirror.

---

### U4. Guarded Verification And Changelog

**Goal:** Prove the README redesign preserved package/documentation contracts and record the user-visible docs change.

**Requirements:** R8, R10, R11, R13

**Dependencies:** U2, U3

**Files:**
- Modify: `CHANGELOG.md`
- Test: `tests/unit/package-install-contracts.test.js`
- Test: `tests/unit/context-governance-contracts.test.js`
- Test: `tests/unit/team-standards-governance-contracts.test.js`
- Test: `tests/unit/release-continuity-guard.test.js`
- Test: `tests/unit/contract-drift-guard.test.js`
- Test: `tests/unit/changelog-format.test.js`

**Approach:**
- Run the narrow README-related tests first, then broaden to `npm run test:unit` only if targeted coverage exposes uncertainty or nearby contracts changed.
- Run `scripts/check-release-continuity.cjs` or its Jest wrapper to confirm source/runtime boundary links remain current.
- Update `CHANGELOG.md` with a compact `(user-visible)` entry naming the README adoption-first redesign and verification commands.
- Do not update `package.json`, readme assets, runtime mirrors, or user manual files unless implementation reveals a test-blocking omission directly tied to this plan.

**Test scenarios:**
- Happy path: all targeted README/package/context/team-standards/release-continuity/changelog tests pass.
- Edge case: if `contract-drift-guard` fails due unrelated dirty worktree changes, isolate whether README text caused the failure before editing non-README files.
- Integration: `git diff --check` passes on changed README/changelog files.

**Verification:**
- Targeted tests pass and are listed in closeout.
- Changelog entry exists and follows current format.

---

## System-Wide Impact

- **Public documentation surface:** `README.md` is in scope and ships to npm; `README.zh-CN.md` is in scope as repository/user-facing mirror.
- **Package payload:** `package.json` package files remain unchanged; `README.md` must keep absolute external links because assets are not packaged.
- **Runtime/source boundary:** no runtime source, generated mirrors, CLI, skill, agent, template, or provider contract changes.
- **Testing surface:** package install, context governance, team standards, release continuity, contract drift, and changelog tests are the relevant guardrail set.
- **Unchanged invariants:** workflow entrypoint names, CLI commands/flags, artifact paths, source/runtime boundary wording, ordinary context exclusions, and team standards visibility remain factually unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| README prose overclaims adoption or verification outcomes | Keep claims mechanism-based; state evidence loop and boundaries, not measured external outcomes |
| Guarded strings are paraphrased away during prose cleanup | U1 anchor audit and U4 targeted tests; preserve exact asserted substrings |
| English and Chinese README drift structurally | U3 mirrors U2 section order and performs H2 comparison |
| Dirty worktree changes get overwritten | Inspect current diffs before editing; preserve unrelated changes; do not revert assets or host instruction files |
| Quickstart becomes too long while trying to be self-contained | Keep first-success path compact; move deep explanations to Operating/Trust/Documentation sections |

---

## Documentation / Operational Notes

- This plan itself is a docs artifact. It does not require `spec-first init`.
- No generated runtime assets should change.
- If implementation changes a guarded assertion intentionally, that is out of scope and should return to planning or a separate requirements update.

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-06-30-001-readme-adoption-first-redesign-requirements.md](docs/brainstorms/2026-06-30-001-readme-adoption-first-redesign-requirements.md)
- Prior README requirements: [docs/brainstorms/2026-06-29-001-readme-integration-onboarding-refactor-requirements.md](docs/brainstorms/2026-06-29-001-readme-integration-onboarding-refactor-requirements.md)
- Prior README plan: [docs/plans/2026-06-29-001-refactor-readme-integration-onboarding-plan.md](docs/plans/2026-06-29-001-refactor-readme-integration-onboarding-plan.md)
- Related docs: `README.md`, `README.zh-CN.md`, `package.json`, `CHANGELOG.md`
- Guardrail tests/scripts: `tests/unit/package-install-contracts.test.js`, `tests/unit/context-governance-contracts.test.js`, `tests/unit/team-standards-governance-contracts.test.js`, `tests/unit/release-continuity-guard.test.js`, `tests/unit/contract-drift-guard.test.js`, `tests/unit/changelog-format.test.js`, `scripts/check-release-continuity.cjs`
