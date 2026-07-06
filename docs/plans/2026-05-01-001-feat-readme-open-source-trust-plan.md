---
title: "feat: Upgrade README into open-source trust entry"
type: feat
status: completed
date: 2026-05-01
spec_id: 2026-05-01-001-readme-community-entry
origin: docs/brainstorms/2026-05-01-001-readme-community-entry-requirements.md
---

# feat: Upgrade README into open-source trust entry

## Overview

Upgrade `README.md` and `README.zh-CN.md` from a correct community entry page into a mature open-source trust entry: show the product loop before explaining it, make the first-run path visibly verifiable, surface community trust signals, and preserve the spec-first governance boundary of "scripts prepare, LLM decides" (see origin: `docs/brainstorms/2026-05-01-001-readme-community-entry-requirements.md`).

This plan does not change CLI behavior, runtime generation, workflow semantics, or generated assets. It improves the public documentation surface and the tests that prevent README drift.

---

## Problem Frame

The current README is materially better than the earlier engineering-facts version: it now explains the project, Quickstart, current host boundary, Trust Model, and runtime reference in the right order. The remaining problem is proof and trust density. A first-time open-source reader still has to infer what a real workflow looks like, what success looks like after the first command, and whether the repository has the expected community maturity signals.

The next README iteration should follow the stronger pattern used by mature open-source projects: a crisp promise, visible demo, success-oriented Quickstart, artifact examples, concise "how it works" model, support/contribution paths, and a full reference section that remains discoverable without dominating the first half.

---

## Requirements Trace

- R1. Keep the first-screen positioning: spec-first is for spec-driven AI engineering workflows on Claude Code and Codex.
- R2. Preserve the reusable engineering loop: brainstorm, plan, task-pack handoff, work, review, debug, and compound.
- R3. Preserve official site `http://spec-first.cn/` and bilingual README links.
- R4. Upgrade "Why spec-first" from generic bullets into a problem-to-solution narrative grounded in AI coding failure modes.
- R5. Keep clear "Use when / May not fit" guidance, but present it as a confident fit signal rather than an early disclaimer.
- R6. Keep prerequisites explicit: Node/npm, current host selected, terminal at project repo root, optional throwaway repo.
- R7. Convert Quickstart into a success path that distinguishes terminal commands from host-session entries and names the expected first artifact.
- R8. Preserve host-selective init: do not imply users must initialize both Claude and Codex.
- R9. Keep brainstorm as the default first-run example and map common starting points to public workflow entries.
- R10. Improve progressive disclosure with a visible demo and "what you get" before full runtime/reference details.
- R11. Keep runtime assets, full init output, graph readiness provider details, and full workflow catalog out of the README front half.
- R12. Keep Core Concepts focused on source/runtime assets, current host, scripts prepare / LLM decides, and task-pack handoff.
- R13. Keep a grouped documentation map and make detailed Chinese-first documentation status explicit.
- R14. Keep `README.md` and `README.zh-CN.md` structurally mirrored.
- R15. Keep English and Chinese versions information-equivalent; no key governance rule should exist in only one language.
- R16. Preserve the lightweight trust summary and expanded Trust Model while reducing repeated governance phrasing.
- R17. Preserve the generated runtime boundary: generated runtime assets are disposable and rebuilt with `spec-first init`.
- R18. Preserve lightweight validation: 30-second first-read check and single-host Quickstart trace.
- R19. Add open-source trust signals: license, CI/test surface, npm/package identity, docs/site, contribution/support/security entrypoints.
- R20. Avoid creating policy theater: do not invent a Code of Conduct or security promise beyond what the repo can maintain.

**Origin actors:** A1 首次接触的开源用户, A2 已决定试用的 Claude Code / Codex 用户, A3 潜在贡献者 / 维护者
**Origin flows:** F1 首访评估路径, F2 第一次跑通路径, F3 深入理解路径
**Origin acceptance examples:** AE1 covers R1/R2/R4/R5/R16, AE2 covers R6/R7/R8/R9, AE3 covers R10/R11/R12, AE4 covers R14/R15, AE5 covers R9, AE6 covers R18, AE7 covers R3/R13/R17

---

## Scope Boundaries

- Do not change CLI commands, `spec-first init`, runtime generation, governance JSON, adapters, workflow skills, agents, or templates.
- Do not hand-edit `.claude/`, `.codex/`, or `.agents/skills/` generated runtime assets.
- Do not add a marketing-only landing page tone that hides trust boundaries, runtime generation, or current-host requirements.
- Do not add GIF/video generation as a blocker. This plan uses a maintainable text demo and artifact tree first; richer media can follow later.
- Do not add `CODE_OF_CONDUCT.md` unless the maintainer chooses a real conduct policy. Link only to community files that exist or are created in this plan.
- Do not promise full English documentation if detailed manuals remain Chinese-first.

### Deferred to Follow-Up Work

- Recorded terminal demo/GIF: add later with `vhs` or equivalent once the text demo proves the flow and the maintained command trace is stable.
- Full English documentation set: plan separately if the project chooses to invest in English docs beyond README.
- Code of Conduct policy: add separately after maintainer policy choice, not as a README polish side effect.

---

## Graph Readiness

- target_repo: `.`
- status: stale
- source_revision: `7db16f134adb2bf6c0596e6598f954434ed257ee`
- current_revision: `f21e0d7a`
- stale: true
- primary_providers: `code-review-graph` was primary in the recorded artifact, but the recorded source revision differs from the current tree.
- degraded_providers: `gitnexus`
- fallback_capabilities: bounded direct repo reads, existing Jest contract tests, package metadata, local docs and solution notes.
- runtime_mcp_evidence: unavailable in this Codex session; no live GitNexus MCP tool was exposed to the current toolset.
- confidence: medium for code impact; high for README/test planning because the change surface is documentation plus Jest contract tests.
- limitations: graph facts are stale and should not be treated as current impact evidence. This plan relies on direct reads of `README.md`, `README.zh-CN.md`, `package.json`, relevant tests, and docs.

---

## Context & Research

### Relevant Code and Patterns

- `README.md` and `README.zh-CN.md` currently share the same information architecture and should remain mirrored.
- `tests/unit/readme-language-split.test.js` already protects language entrypoints, English init examples, community-entry section order, Quickstart boundaries, Trust Model boundaries, and Chinese mirror structure.
- `tests/unit/dual-host-governance-contracts.test.js` protects README current-host language, task-pack handoff wording, runtime count alignment with bundled assets, and retired entrypoint avoidance.
- `package.json` provides `name`, `version`, `license`, `repository`, `bugs`, `engines.node`, and npm package identity for README badges/trust signals.
- `.github/workflows/` exists and can supply CI badge targets. Current workflows include `ai-dev-quality-gate.yml`, `npm-install-matrix.yml`, `skill-entrypoint-gate.yml`, and `sync-master-to-main.yml`.
- `LICENSE` exists. Root `CONTRIBUTING.md`, `SECURITY.md`, and `CODE_OF_CONDUCT.md` do not currently exist.

### Institutional Learnings

- `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md`: host-specific entrypoint mappings belong in init output, governance contracts, and central README tables. Shared prose should prefer "current host" to avoid a second truth source.
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`: generated runtime assets are not source truth. README must continue to tell users to modify source assets and regenerate runtime copies.
- `docs/10-prompt/项目角色.md`: improvements should preserve "Light contract, explicit boundaries, let the LLM decide"; do not replace semantic judgment with state-machine style README promises.

### External References

- GitHub Docs, "About READMEs": a README should explain why the project is useful, what users can do with it, how to get started, and where to get help.
- GitHub Docs, "Best practices for repositories": repository health includes a README, license, contribution guidelines, and community conduct/security expectations.
- npm Docs, package README guidance: package README content should help users install, configure, and use the package from npm.
- OpenSSF Scorecard documentation: mature repositories benefit from visible security, maintenance, license, and community health signals.

---

## Key Technical Decisions

- Use a text-first demo rather than a generated GIF in this iteration: it is maintainable, renders on GitHub and npm, and avoids adding media build tooling before the command trace is stable.
- Add a "See it in 90 seconds" section near the top: this answers "what does it do?" before asking the reader to parse workflow catalogs.
- Convert Quickstart into a success path: each host path should end with an expected artifact, not just a command list.
- Add a "What you get" artifact tree: spec-first's product value is durable artifacts, so the README should show the files it produces.
- Add an ASCII "How it works" model: source assets -> `spec-first init` -> host runtime -> workflow artifacts communicates the trust boundary more directly than prose alone.
- Split workflow presentation into "Core workflows" and "Full workflow reference": the first serves first-time users; the second preserves complete entrypoint discoverability.
- Create minimal `CONTRIBUTING.md` and `SECURITY.md`, but defer `CODE_OF_CONDUCT.md`: contribution and security entrypoints can be grounded in existing repo commands and GitHub issues, while conduct policy needs an explicit maintainer choice.
- Keep runtime asset counts in the back-half reference and keep their tests dynamic through existing `buildFilteredAssetSet` checks.

---

## Open Questions

### Resolved During Planning

- Should this replace the previous README community-entry work? No. It is a second-stage upgrade on the same `spec_id`, preserving the existing requirements and strengthening proof/trust.
- Should README include host-specific entrypoint mappings? Yes, but only in central tables and first-run examples. Shared explanatory prose should continue using current-host wording.
- Should this add a visual demo asset now? No. Start with a text demo and artifact tree; record media later if needed.

### Deferred to Implementation

- Exact badge set and badge URLs: implementer should verify current repository/workflow badge URLs before finalizing.
- Exact wording for English and Chinese proof sections: implementation should keep information equivalent but allow idiomatic localization.
- Whether `CONTRIBUTING.md` should mention branch naming or commit conventions beyond current repo evidence: use only conventions already visible in `AGENTS.md`, `CHANGELOG.md`, package scripts, and existing history.

---

## Output Structure

```text
README.md
README.zh-CN.md
CONTRIBUTING.md
SECURITY.md
tests/unit/readme-language-split.test.js
tests/unit/readme-open-source-entry.test.js
CHANGELOG.md
```

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```text
README front half
  Title + language links + trust badges
  One-line promise + best-fit signal
  See it in 90 seconds
    idea -> brainstorm -> requirements brief -> plan -> work/review
  Why spec-first
    AI coding failure modes -> spec-first engineering loop
  Quickstart
    terminal commands -> host restart -> host-session entry -> expected artifact
  What you get
    docs/brainstorms, docs/plans, docs/tasks, review notes, learnings
  How it works
    source assets -> spec-first init -> host runtime -> workflow artifacts

README back half
  Core workflows
  Trust Model
  Use / not-use fit
  Documentation map
  Full workflow reference
  Runtime reference
  Development & contributing
```

---

## Implementation Units

- U1. **Upgrade README front-door narrative**

**Goal:** Turn the top of both READMEs into a stronger open-source entry: badges, crisp promise, best-fit signal, and a problem-to-solution "Why spec-first" section.

**Requirements:** R1, R2, R3, R4, R5, R14, R15, R19

**Dependencies:** None

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Test: `tests/unit/readme-language-split.test.js`
- Test: `tests/unit/readme-open-source-entry.test.js`

**Approach:**
- Add a compact badge row using package/repo facts: npm version, license, Node `>=20`, CI/test workflow, official docs/site.
- Replace generic "Why" bullets with a short narrative: ad hoc AI coding loses context and evidence; spec-first produces durable requirements, plans, task packs, reviews, and learnings.
- Keep official site and language links near the top.
- Move "May not fit" later if it improves flow, but retain equivalent fit guidance.

**Patterns to follow:**
- `package.json` for package name, repository URL, license, Node engine, and issue tracker.
- Existing README language mirror pattern.

**Test scenarios:**
- Happy path: English README contains badges for npm/package identity, license, Node version, CI/test surface, and official site/docs.
- Happy path: Chinese README contains the same trust signals with localized surrounding text.
- Edge case: tests fail if a local README link points to a missing file such as `CONTRIBUTING.md` before it exists.
- Integration: existing language split tests still pass and confirm English uses `--lang en` while Chinese uses `--lang zh`.

**Verification:**
- First screen communicates project identity, value, current host requirement, and trust signals without mentioning runtime asset counts.

---

- U2. **Add visible demo and artifact examples**

**Goal:** Show what spec-first does before explaining every workflow, using a "See it in 90 seconds" text demo and "What you get" artifact tree.

**Requirements:** R2, R7, R9, R10, R11, R13, R18

**Dependencies:** U1

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Test: `tests/unit/readme-open-source-entry.test.js`

**Approach:**
- Add a short flow that starts with a user idea and ends with `docs/brainstorms/...-requirements.md`, then shows natural continuation to plan/work/review.
- Add an artifact tree for `docs/brainstorms/`, `docs/plans/`, `docs/tasks/`, review findings, and learnings. Keep examples illustrative and avoid claiming exact filenames for every workflow unless already documented.
- Prefer ASCII/text blocks over Mermaid because they render predictably across GitHub and npm.

**Patterns to follow:**
- Existing Quickstart first-run result wording in `README.md`.
- Origin AE5 and AE6.

**Test scenarios:**
- Covers AE5. Happy path: README contains the brainstorm expected artifact path and states that it is produced by the first-run workflow.
- Happy path: README contains a "See it in 90 seconds" or equivalent section before Quickstart.
- Happy path: README contains a "What you get" artifact tree or equivalent artifact list.
- Edge case: README must not imply all workflows always produce all listed artifact types.

**Verification:**
- A reader can understand the product loop from the demo without reading the full workflow catalog.

---

- U3. **Convert Quickstart into a host-specific success path**

**Goal:** Make Quickstart read like a 5-minute success path with explicit done signals for Claude Code and Codex.

**Requirements:** R6, R7, R8, R9, R14, R15, R18

**Dependencies:** U1, U2

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Test: `tests/unit/readme-language-split.test.js`
- Test: `tests/unit/dual-host-governance-contracts.test.js`
- Test: `tests/unit/readme-open-source-entry.test.js`

**Approach:**
- Keep terminal commands in `bash` blocks and host-session entries in `text` blocks.
- Present Claude and Codex as selected-host paths, not as mandatory combined setup.
- Add "You are done when..." wording tied to `docs/brainstorms/YYYY-MM-DD-NNN-topic-requirements.md`.
- Preserve current-host prose where the text is shared rather than a central mapping table.

**Patterns to follow:**
- `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md`
- Existing `dual-host-governance-contracts.test.js` assertions for current-host setup/graph/bootstrap wording.

**Test scenarios:**
- Covers AE2. Happy path: Codex-only reader sees `spec-first init --codex -u <name> --lang en` and `spec-brainstorm` without being told to run Claude init.
- Covers AE2. Happy path: Claude-only reader sees `spec-first init --claude -u <name> --lang en` and `spec-brainstorm` without being told to run Codex init.
- Edge case: `spec-*` entries do not appear in unlabelled shell command blocks.
- Integration: dual-host governance tests still confirm shared prose uses current-host wording.

**Verification:**
- The README supports a single-host trace from install to first generated requirements brief.

---

- U4. **Refactor model, trust, and workflow sections for progressive disclosure**

**Goal:** Preserve complete technical reference while reducing front-half overload and repetition.

**Requirements:** R10, R11, R12, R13, R16, R17, R20

**Dependencies:** U1, U2, U3

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Test: `tests/unit/readme-language-split.test.js`
- Test: `tests/unit/dual-host-governance-contracts.test.js`
- Test: `tests/unit/readme-open-source-entry.test.js`

**Approach:**
- Add "How it works" as an ASCII model: source assets -> `spec-first init` -> host runtime -> workflow artifacts.
- Split "Core workflows" from "Full workflow reference"; keep only first-use workflows in the core table.
- Rewrite Trust Model around user questions: what scripts do, what LLM decides, what gets written, what is generated/disposable, what spec-first does not do.
- Keep runtime asset summary and expected init output in the back-half reference, with existing dynamic count tests intact.

**Patterns to follow:**
- `docs/10-prompt/项目角色.md` for scripts-vs-LLM boundary.
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md` for source/runtime boundary.

**Test scenarios:**
- Covers AE3. Happy path: runtime asset counts appear after demo, Quickstart, artifact examples, and Trust Model.
- Covers AE7. Happy path: README states generated runtime assets are disposable and rebuilt from source assets via `spec-first init`.
- Edge case: README does not reintroduce `workflow asset bundle` as the top-level positioning.
- Integration: existing runtime count tests remain dynamic and pass when bundled assets change.

**Verification:**
- README remains technically complete but no longer asks first-time readers to parse runtime governance before seeing value and success path.

---

- U5. **Add community trust and support entrypoints**

**Goal:** Add minimal, maintainable open-source community surfaces and link them from README without inventing unsupported governance policy.

**Requirements:** R13, R19, R20

**Dependencies:** U1

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Test: `tests/unit/readme-open-source-entry.test.js`

**Approach:**
- `CONTRIBUTING.md` should cover local setup, core validation commands, changelog requirement, source-vs-generated asset boundary, and where to start for docs/skill/CLI changes.
- `SECURITY.md` should define a conservative vulnerability reporting route using the existing GitHub repository issue/security surface. If no private vulnerability reporting channel is configured, state the current route honestly and avoid promising an SLA.
- README should link to `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, GitHub issues, and the official site.
- Do not create or link `CODE_OF_CONDUCT.md` in this unit.

**Patterns to follow:**
- `AGENTS.md` changelog and generated asset guidance.
- `package.json` repository and bugs URL.
- `LICENSE`.

**Test scenarios:**
- Happy path: local README links to `CONTRIBUTING.md`, `SECURITY.md`, and `LICENSE` resolve.
- Edge case: README does not link to `CODE_OF_CONDUCT.md` unless that file exists.
- Error path: link existence test fails for missing repo-relative docs.

**Verification:**
- README has a mature support/contribution block without unsupported policy claims.

---

- U6. **Tighten README contract tests and validation record**

**Goal:** Make the new README quality bar enforceable while preserving the lightweight validation style from the origin requirements.

**Requirements:** R14, R15, R18, R19, R20

**Dependencies:** U1, U2, U3, U4, U5

**Files:**
- Create: `tests/unit/readme-open-source-entry.test.js`
- Modify: `tests/unit/readme-language-split.test.js`
- Modify: `tests/unit/dual-host-governance-contracts.test.js`
- Modify: `docs/brainstorms/2026-05-01-001-readme-community-entry-requirements.md`
- Modify: `CHANGELOG.md`

**Approach:**
- Put new open-source trust and local-link assertions in a dedicated test file instead of overloading `readme-language-split.test.js`.
- Keep language split tests focused on bilingual parity and section order.
- Keep dual-host governance tests focused on current-host wording, central mapping tables, and runtime count drift.
- Update the origin verification record with a second-stage "proof/trust" validation note: visible demo check, Quickstart success path check, and local-link check.
- Add a changelog entry for the docs and test changes.

**Patterns to follow:**
- Existing Jest file style in `tests/unit/readme-language-split.test.js`.
- Existing changelog format.

**Test scenarios:**
- Happy path: README section order enforces demo/proof before runtime reference.
- Happy path: English and Chinese READMEs contain equivalent community trust links.
- Edge case: local Markdown links in README resolve to existing files.
- Integration: targeted Jest tests pass together with existing dual-host governance tests.

**Verification:**
- Targeted README tests pass, `git diff --check` is clean, and the origin requirements document contains the updated lightweight validation record.

---

## System-Wide Impact

- **Interaction graph:** User-facing documentation only. No CLI execution flow, runtime generation flow, or workflow entrypoint implementation changes are planned.
- **Error propagation:** N/A for runtime behavior. Documentation errors should be caught by Jest contract tests and local-link checks.
- **State lifecycle risks:** Avoid linking to files that do not exist; avoid creating generated runtime drift by keeping changes out of `.claude/`, `.codex/`, and `.agents/skills/`.
- **API surface parity:** The README remains a public package surface on GitHub and npm; examples must stay valid for both Claude Code and Codex.
- **Integration coverage:** README tests should be run with existing dual-host governance tests because README text is part of host-entrypoint governance.
- **Unchanged invariants:** Current-host setup wording, dynamic runtime asset counts, generated runtime disposability, and `write-tasks` standalone naming remain unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| README becomes too long again | Split first-use sections from full reference; keep runtime reference in the back half. |
| Badges or community links become stale | Use package/repo-derived URLs and add local-link tests for repo-relative files. |
| Contribution/security docs overpromise governance | Keep them conservative and grounded in current repo evidence; defer Code of Conduct and SLA claims. |
| Dual-host wording regresses | Keep central entrypoint tables but preserve current-host prose in shared explanations; run dual-host governance tests. |
| English/Chinese README drift | Update both files in the same implementation unit and test section-order parity. |

---

## Documentation / Operational Notes

- README is part of the npm package payload through `package.json` `files`; changes affect npm readers as well as GitHub readers.
- New root community files should remain concise and maintainable. They are source documents, not generated runtime assets.
- Any implementation change must add a `CHANGELOG.md` entry with author from `.codex/spec-first/.developer`.

---

## Sources & References

- **Origin document:** `docs/brainstorms/2026-05-01-001-readme-community-entry-requirements.md`
- Related README tests: `tests/unit/readme-language-split.test.js`, `tests/unit/dual-host-governance-contracts.test.js`
- Related package metadata: `package.json`
- Related local learnings: `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md`, `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`
- External docs: `https://docs.github.com/articles/about-readmes`
- External docs: `https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories`
- External docs: `https://docs.npmjs.com/about-package-readme-files`
- External docs: `https://github.com/ossf/scorecard`
