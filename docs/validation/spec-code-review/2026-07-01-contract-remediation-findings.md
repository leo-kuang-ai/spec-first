---
title: "spec-code-review contract remediation findings"
type: validation
status: fixed-pending-commit
date: 2026-07-01
target: skills/spec-code-review
---

# spec-code-review contract remediation findings

## Summary

This document records the confirmed follow-up findings from the 2026-07-01 multi-agent review and direct source recheck of `skills/spec-code-review/**`.

Scope is source-of-truth only: `skills/spec-code-review/**`, focused tests, and source-owned documentation. Generated runtime mirrors under `.claude/`, `.codex/`, and `.agents/skills/` are not source and must not be hand-edited.

## Findings To Fix

| ID | Priority | Status | Source refs | Finding | Fix direction |
| --- | --- | --- | --- | --- | --- |
| SCR-F1 | P1 | fixed | `skills/spec-code-review/SKILL.md` Stage 1 skip-condition pre-check; Stage 4 dispatch gate | Trivial PR judgment asked to spawn a lightweight sub-agent before the dispatch capability and authorization gate. This could bypass Codex's explicit subagent permission boundary. | Stage 1 now requires inline orchestrator judgment and explicitly forbids `Agent`, `Task`, `spawn_agent`, or equivalent dispatch in the skip pre-check. |
| SCR-F2 | P1 | fixed | `skills/spec-code-review/SKILL.md` Stage 5b validation budget | Stage 5b dropped findings beyond the 15-validator cap, causing already-surviving findings to disappear from headless/autofix/ticket externalization paths. | Over-budget findings are now marked `validation_skipped/over_budget`, carried into the next phase, and reported as validation skips rather than drops. |
| SCR-F3 | P1 | fixed | `skills/spec-code-review/SKILL.md` runtime readiness preflight and dispatch fallback | Required MCP not-ready fallback treated the effective mode as report-only, while headless/autofix contracts require failure/stop behavior when mutating review is unsafe. | Runtime fallback is now mode-aware: interactive/report-only can use inline report-only fallback; headless/autofix stop with failure messages and no mutation/artifact claim. |
| SCR-F4 | P2 | fixed | `skills/spec-code-review/SKILL.md` Stage 5; `references/findings-schema.json`; `references/subagent-template.md` | Full reviewer schema requires `why_it_matters` and `evidence`, but Stage 5 validated only merge-tier required fields and allowed detail-tier omission without clearly separating legacy compact returns from current full-schema returns. | Stage 5 now requires detail-tier fields for current full reviewer returns and limits missing detail to explicit legacy/compact degraded handling. |
| SCR-F5 | P2 | fixed | `skills/spec-code-review/SKILL.md` cross-reviewer agreement; `references/findings-schema.json` confidence anchors | Cross-reviewer agreement could promote `75 -> 100`, but `100` means verifiable from code alone with no interpretation required. Agreement is stronger signal, not code-alone certainty. | Agreement promotion is now capped at `75` unless merged direct evidence independently satisfies the `100` anchor. |
| SCR-F6 | P2 | fixed | `references/findings-schema.json`; `references/diff-scope.md`; `references/subagent-template.md` | The confidence `0` description treated pre-existing issues as "do not report", while diff scope and Stage 6 define `pre_existing: true` as a separate reported section. | Confidence `0` now means false positive/non-finding only; `pre_existing` remains an independent routing flag. |
| SCR-F7 | P2 | fixed | `skills/spec-code-review/SKILL.md`; `references/subagent-template.md` | Leaf reviewers were told not to "propose refactors", but the schema/template require defensible `suggested_fix` values and permit local structural fixes such as helper extraction. | The source now bans unrelated/speculative refactors while allowing minimal finding-scoped structural fixes grounded in the diff. |
| SCR-F8 | P2 | fixed | `references/tracker-defer.md`; `skills/spec-code-review/SKILL.md` run artifact boundary | Durable tracker tickets could truncate to a session-scoped `<artifact-path>`, but review artifacts are temporary and not guaranteed to survive. | Tracker bodies now preserve minimal inline evidence and truncate by finding ID rather than depending on a temp artifact as durable truth. |
| SCR-F9 | P2-low | fixed | `scripts/resolve-base.sh` | The PR metadata path used external `jq` without checking availability. Missing `jq` could silently fall back to other base detection and review the wrong base. | PR metadata parsing now uses `gh --jq`, removing the external `jq` dependency from this path. |
| SCR-F10 | P2-low | fixed | `skills/spec-code-review/SKILL.md`; `skills/spec-mcp-setup/scripts/detect-tools.sh` (evidence, unchanged) | Runtime readiness prose omitted `registry-args-drift`, even though `detect-tools.sh` treats it as host-ready/configured but degraded. | `registry-args-drift` is now documented as acceptable-for-dispatch but degraded, with Coverage recording required. |

## Repair Order

1. Fix P1 mode/dispatch/data-loss issues: SCR-F1, SCR-F2, SCR-F3.
2. Fix schema/detail/confidence consistency: SCR-F4, SCR-F5, SCR-F6.
3. Fix reviewer wording, durable tracker handoff, and runtime/base degraded semantics: SCR-F7, SCR-F8, SCR-F9, SCR-F10.
4. Add focused contract tests for each repaired boundary.
5. Run focused validation and record generated-runtime mirror status honestly.

## Validation Target

Minimum deterministic validation:

- `npx jest tests/unit/spec-code-review-contracts.test.js tests/unit/changelog-format.test.js --runInBand`
- `node -e "JSON.parse(require('fs').readFileSync('skills/spec-code-review/references/findings-schema.json','utf8')); JSON.parse(require('fs').readFileSync('skills/spec-code-review/evals/examples.json','utf8'))"`
- `bash -n skills/spec-code-review/scripts/resolve-base.sh`
- `git diff --check -- CHANGELOG.md docs/validation/spec-code-review/2026-07-01-contract-remediation-findings.md skills/spec-code-review tests/unit/spec-code-review-contracts.test.js`
- `npm run lint:skill-entrypoints`

Semantic validation remains source-level unless a fresh-source eval is explicitly run. Contract tests prove static source anchors, not broad reviewer behavior.

## Validation Result

Executed on 2026-07-01:

- `npx jest tests/unit/spec-code-review-contracts.test.js tests/unit/changelog-format.test.js --runInBand` passed, 43 tests.
- JSON parse for `findings-schema.json` and `evals/examples.json` passed.
- `bash -n skills/spec-code-review/scripts/resolve-base.sh` passed.
- `git diff --check -- CHANGELOG.md docs/validation/spec-code-review/2026-07-01-contract-remediation-findings.md skills/spec-code-review tests/unit/spec-code-review-contracts.test.js` passed.
- `npm run lint:skill-entrypoints` passed, 225 files scanned.

### Coverage level

契约测试为静态 source 锚点断言（对 source 文本的 `toContain`），不是 runtime 行为证明。F1（skip 预检不 spawn）、F2（超预算 carry-forward）、F3（mode-aware headless/autofix stop）为承载行为的修复，其 `fixed` 状态在 fresh-source eval 或场景测试实际驱动这些 runtime 路径前应视为 `source-fixed, behavior-unverified`。参见 `docs/contracts/workflows/fresh-source-eval-checklist.md`。

### Finding-to-test refs

每项 finding 在 `tests/unit/spec-code-review-contracts.test.js` 中都有专属断言（行号为近似锚点）：

| Finding | Test anchor |
| --- | --- |
| SCR-F1 | ~L502 |
| SCR-F2 | ~L962-966 |
| SCR-F3 | ~L490-492 |
| SCR-F4 | ~L284-286 |
| SCR-F5 | ~L296-297 |
| SCR-F6 | ~L266-270 |
| SCR-F7 | ~L244-245 |
| SCR-F8 | ~L440-443 |
| SCR-F9 | ~L819-820 |
| SCR-F10 | ~L477-478 |

`43 tests passed` 计数包含既有 spec-code-review 契约覆盖；仅上表锚点为本次 remediation 专属。

### Runtime status

仅 source-of-truth 层。Generated runtime mirrors（`.claude/`、`.agents/skills/`）本次未刷新，在 `spec-first init` 重新生成前仍带修复前行为——包括 F1 dispatch 边界与 F3 headless-stop bug。上表 `fixed` 状态适用于 source 层，不代表已部署的 runtime 面。

### Durability

截至撰写时所有修复仍在未提交的 working-tree 改动中；`git diff --check` 仅校验空白/冲突标记，不代表持久化。提交后应记录验证所用的 commit SHA；在此之前 frontmatter `status` 保持 `fixed-pending-commit`。
