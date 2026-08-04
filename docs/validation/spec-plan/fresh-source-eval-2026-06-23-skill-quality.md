---
title: "spec-plan skill quality refactor validation"
date: 2026-06-23
spec_id: 2026-06-22-004-spec-plan-skill-quality
target: skills/spec-plan
fresh_source_eval: passed
runtime_mirrors_modified: false
---

# spec-plan skill quality refactor validation

## Summary

本记录验证 `spec-plan` skill 质量与边界优化的 source 变更。结论：当前 source 保留 `spec-plan` / `spec-plan` 的 HOW planning 身份、direct invocation、plan-only safety、blocking handoff、question-tool fallback、source/runtime boundary 和双宿主 runtime projection；eval fixtures 覆盖 trigger / boundary / failure / expected 四类结构性样例；fresh-source reviewer 最终复核为 `passed`，无 P0/P1/P2 findings。

`$yao-meta-skill` 的 `context_budget_limit: 1000` 是外部 advisory production budget，不是本仓当前 public workflow 的硬 gate。本轮不为了追预算牺牲 plan-only safety、handoff、direct evidence 或双宿主交付 contract。

## Source Reads

- `docs/brainstorms/2026-06-23-001-refactor-spec-plan-skill-quality-requirements.md`
- `docs/plans/2026-06-22-004-refactor-spec-plan-skill-quality-plan.md`
- `docs/10-prompt/结构化项目角色契约.md`
- `skills/spec-plan/SKILL.md`
- `skills/spec-plan/references/planning-flow.md`
- `skills/spec-plan/references/governance-boundaries.md`
- `skills/spec-plan/references/plan-handoff.md`
- `skills/spec-plan/evals/examples.json`
- `skills/spec-plan/evals/output-quality-cases.json`
- `skills/spec-plan/evals/README.md`
- `src/cli/plugin.js`
- `tests/unit/spec-plan-contracts.test.js`
- `tests/unit/runtime-plan-contracts.test.js`
- `tests/unit/skill-path-rewrite-guard.test.js`
- `tests/unit/init-dry-run.test.js`
- `tests/unit/spec-prd-contracts.test.js`
- `docs/contracts/workflows/skill-agent-quality-governance.md`
- `tests/unit/skill-agent-quality-governance-contracts.test.js`

## Resource Boundary Facts

| metric | before | after | delta | status |
| --- | ---: | ---: | ---: | --- |
| `skills/spec-plan/SKILL.md` lines | 756 | 465 | -291 / -38.5% | improved |
| `$yao-meta-skill` estimated initial-load tokens | 16633 | 11054 | -5579 / -33.5% | improved, advisory warning remains |
| `$yao-meta-skill` quality density | 2.7 | 4.1 | +1.4 / +51.9% | improved |
| deferred resource dirs | n/a | `references`: 26975 tokens, `evals`: 4226 tokens | detail moved behind explicit references | acceptable |

Final advisory command:

```text
python3 /Users/kuang/.agents/skills/yao-meta-skill/scripts/resource_boundary_check.py skills/spec-plan
```

Result: `ok: false` because `Estimated initial-load tokens exceed budget: 11054 > 1000`. This is recorded as `advisory_waived`: current `spec-plan` remains a public workflow with required safety and handoff contract text in the hot path. Recheck if a future package/runtime consumer adopts the 1000-token budget as an explicit source-owned requirement, or if another refactor can move detail without weakening safety.

Other `$yao-meta-skill` advisory checks:

- `lint_skill.py skills/spec-plan`: `ok: true`; warning: `SKILL.md is getting long`.
- `validate_skill.py skills/spec-plan`: `ok: false`; failure: `Missing agents/interface.yaml`; waived by centralized lifecycle metadata policy.
- `governance_check.py skills/spec-plan`: `ok: true`; warning: no `manifest.json`; waived by centralized lifecycle metadata policy.

## Eval Readiness Facts

Source-owned command:

```text
node skills/retired-skill-review/scripts/write-audit-artifacts.js --repo . --target skills/spec-plan
```

Latest source-owned run:

- run_id: `2026-06-22T18-39-10-449Z`
- executor_origin: `source`
- executor_path: `skills/retired-skill-review/scripts/write-audit-artifacts.js`
- warnings: none

Latest `eval-readiness-report.json` facts:

- normalized cases: 21
- invalid cases: 0
- coverage buckets present: `trigger`, `boundary`, `failure`, `expected`
- optional missing: none
- readiness: `ready`
- semantic note: structural coverage does not prove model output quality; LLM/human review still owns semantic quality.

## Runtime Projection Boundary

Changed projection behavior in `src/cli/plugin.js`:

- `evals/` support files are copied into runtime mirrors but keep source-authority refs unchanged.
- Ordinary skill/references text still uses host adapter path rewrite.
- `copyFileWithTransform`, dry-run planning, and integrity checks now pass `{ sourcePath, targetPath }` to the transform.

Focused tests confirm:

- Claude runtime references rewrite to `.claude/spec-first/workflows/spec-plan/references/...`.
- Codex runtime references rewrite to `.agents/skills/spec-plan/references/...`.
- `evals/examples.json` and `evals/output-quality-cases.json` keep source refs such as `skills/spec-plan/references/planning-flow.md`, not generated mirror paths.
- No generated runtime mirrors under `.claude/**`, `.codex/**`, or `.agents/skills/**` were hand-edited.

## Review Results

### Multi-Agent Review

Three read-only reviewers were dispatched:

- workflow semantics reviewer: found P2 that eval `source_refs` omitted `skills/spec-plan/references/planning-flow.md`; fixed by adding that source ref to both eval JSON files and tests.
- runtime/projection reviewer: found P2 untracked support-file risk and P3 init apply coverage asymmetry; fixed by ensuring new source files are part of the change set and adding Claude/Codex init apply assertions for `planning-flow.md`, both eval JSON files, and eval README.
- eval/governance/closeout reviewer: found P1 missing changelog, validation artifact, resource-boundary record, and untracked support files; fixed by this artifact and changelog update. P3 English governance waiver prose was fixed by translating the waiver to Chinese while keeping paths/field names literal.

Follow-up read-only reviewers checked the current closeout:

- workflow-correctness reviewer found P3 changelog wording that incorrectly attributed all 21 cases to `evals/examples.json`; fixed by recording `examples.json` 17 cases and `output-quality-cases.json` 4 cases.
- testing-governance reviewer found P3 gaps in fresh-source prompt boundary and eval readiness provenance; fixed by adding `reviewer_context` and rerunning the source-owned `skills/retired-skill-review/scripts/write-audit-artifacts.js` command.
- runtime-boundary reviewer found P1 untracked support files; fixed by adding the four new source files to the git index: this validation artifact, eval README, output-quality cases, and `references/planning-flow.md`.

Final closeout reviewers checked the latest code and artifacts:

- runtime-test-closeout reviewer found that the older structured closeout still recorded broad eval fixtures as degraded; fixed by rerunning `npm run test:eval-fixtures -- --silent --no-cache` successfully and writing superseding `spec-plan-skill-quality-20260623-closeout-final` artifacts.
- requirement-semantics reviewer found that `spec-plan` could still be read as treating a public `spec-plan` invocation as Codex `spawn_agent` authorization; fixed by requiring both host capability and per-run dispatch authorization, and by recording `dispatch_authorization_missing` when the user did not explicitly authorize subagents/delegation/parallel research/research-agent dispatch.
- requirement-semantics reviewer also found Direct Evidence wording drift between `planning-flow.md` and `plan-template.md`; fixed by aligning planning-flow guidance to the canonical `Direct Evidence Readiness` / `Direct Evidence` fields and removing legacy `worktree_dirty`, `discovery_methods`, and `tests_or_logs` anchors from the planning-flow contract tests.

### Fresh-Source Eval

Final fresh-source reviewer result:

```yaml
fresh_source_eval:
  status: passed
  reviewer_context: "fresh source snippets from current disk; target behavior changes; docs/contracts/workflows/fresh-source-eval-checklist.md evidence boundary"
  source_paths:
    - skills/spec-plan/SKILL.md
    - skills/spec-plan/references/planning-flow.md
    - skills/spec-plan/evals/examples.json
    - skills/spec-plan/evals/output-quality-cases.json
    - docs/contracts/workflows/skill-agent-quality-governance.md
    - tests/unit/init-dry-run.test.js
  runtime_paths_checked: []
  changed_behavior: "spec-plan hot path delegates Phase 0/1 detail to planning-flow.md while eval support files preserve source-authority refs during runtime projection."
  checks:
    trigger_precision: passed
    source_runtime_boundary: passed
    host_entrypoints: passed
    internal_only_boundary: passed
    deterministic_vs_semantic_boundary: passed
    tests: passed
  findings: []
```

Reviewer limitation: the fresh-source reviewer itself was read-only and did not run Jest. The orchestrator separately ran focused Jest suites and other deterministic checks listed below.

## Verification Commands

Earlier implementation-pass checks:

```text
npx jest tests/unit/spec-plan-contracts.test.js tests/unit/runtime-plan-contracts.test.js tests/unit/skill-path-rewrite-guard.test.js tests/unit/workflow-eval-readiness-contracts.test.js tests/unit/eval-fixture-contracts.test.js tests/unit/public-workflow-contract-summary.test.js tests/unit/skill-agent-quality-governance-contracts.test.js tests/unit/spec-write-tasks-contracts.test.js tests/unit/init-dry-run.test.js tests/unit/spec-prd-contracts.test.js --runInBand --silent
```

```text
npm run test:eval-fixtures
```

```text
npm run lint:skill-entrypoints
```

```text
npm run typecheck
```

```text
git diff --check
```

Latest current-worktree checks for the `spec-plan` scope passed:

```text
npx jest tests/unit/changelog-format.test.js tests/unit/plan-status-taxonomy.test.js tests/unit/spec-plan-contracts.test.js tests/unit/runtime-plan-contracts.test.js tests/unit/skill-path-rewrite-guard.test.js tests/unit/workflow-eval-readiness-contracts.test.js tests/unit/eval-fixture-contracts.test.js tests/unit/public-workflow-contract-summary.test.js tests/unit/skill-agent-quality-governance-contracts.test.js tests/unit/init-dry-run.test.js tests/unit/spec-plan-governance-signals-contract.test.js tests/unit/governance-contracts.test.js tests/unit/runtime-capability-catalog.test.js --runInBand --silent
```

```text
npm run lint:skill-entrypoints
```

```text
npm run typecheck
```

```text
npm run test:smoke
```

```text
npm run test:integration
```

```text
npm run build
```

```text
git diff --check && git diff --cached --check
```

Additional focused reruns passed after reviewer fixes:

```text
npx jest tests/unit/init-dry-run.test.js tests/unit/spec-plan-contracts.test.js --runInBand --silent
```

```text
npx jest tests/unit/init-dry-run.test.js tests/unit/spec-plan-contracts.test.js tests/unit/skill-agent-quality-governance-contracts.test.js --runInBand --silent
```

```text
npx jest tests/unit/spec-plan-contracts.test.js tests/unit/runtime-plan-contracts.test.js tests/unit/skill-path-rewrite-guard.test.js --runInBand --silent
```

Broad current-worktree eval fixture reruns:

- `npm run test:eval-fixtures -- --silent --no-cache`: passed in the current dirty worktree; 8 suites / 98 tests passed. An earlier closeout artifact recorded this check as degraded because unrelated `spec-prd` / `spec-write-tasks` in-progress changes were failing at that time; the superseding structured closeout below records the current passed state.

Superseding structured closeout artifacts:

- `.spec-first/workflows/spec-work/spec-first/spec-plan-skill-quality-20260623-closeout-final/verification-run-summary.json`
- `.spec-first/workflows/spec-work/spec-first/spec-plan-skill-quality-20260623-closeout-final/honest-closeout.json`
- `.spec-first/workflows/spec-work/spec-first/spec-plan-skill-quality-20260623-closeout-final/run.json`

Final `honest-closeout.v1` result: `overall: verified`, `overall_reason_code: all-claims-consistent`.

## Remaining Limitations

- `$yao-meta-skill` resource and package-interface checks remain advisory warnings/failures as documented above.
- No provider-backed model execution telemetry or human adjudication was produced for output quality fixtures; `missing_evidence` remains explicit in each case.
- Runtime mirrors were not regenerated by `spec-first init`; source changes are ready for later runtime refresh.
