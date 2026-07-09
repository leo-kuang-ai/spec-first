---
title: "spec-first optimization upgrade final acceptance"
date: 2026-05-17
status: passed
plan: docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md
spec_id: 2026-05-11-002-spec-first-project-optimization-upgrade
branch: leo-2026-05-16-update
---

# spec-first optimization upgrade final acceptance

## Scope

本验收收口 `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md` 的全量开发、测试、验证、验收与全流程审查。

Source-of-truth 变更只落在 `skills/`、`agents/`、`src/cli/`、`scripts/`、`docs/`、`tests/`、`README*`、`package.json` 和 `CHANGELOG.md` 等 source 文件。Generated runtime mirrors under `.claude/`、`.codex/`、`.agents/skills/` 未作为 source fix 手改。

Graph readiness artifacts 当前是 2026-05-16 针对旧 clean worktree 生成的结果；本验收将它们标为 stale/advisory。最终判断以当前 source diff、确定性测试、fresh-source eval 和本 artifact 记录为准。

## U1-U12 Traceability

| Unit | Completion evidence | Acceptance status |
| --- | --- | --- |
| U1 Public workflow contract summaries | Phase 1D 覆盖核心链路；Phase 2 覆盖 batch 1；Phase 3 覆盖 batch 2，并让测试从 `skills-governance.json` 派生 `workflow_command` inventory。 | passed |
| U2 Task-pack source-plan focus | Phase 1A validation 记录 task-pack mode 必须回查 `source_unit`、`requirement_refs`、acceptance、scope boundaries、non-goals 和 deferred notes；task-pack validator 保持 source-plan authority。 | passed |
| U3 Durable run evidence | Phase 1B 交付 write-side producer；Phase 3 补 `read` / `prune` 最小 deterministic consumer、安全 id / symlink containment 和 retention owner/expiry schema。`workflow_integrated` 仍保持 false。 | passed |
| U4 Standards next-action candidates | Phase 1C 交付 `next_action_candidates` facts artifact、validator、example 与 consumer tests；脚本只产出候选 facts，不做 workflow recommendation。 | passed |
| U5 Source/runtime boundary docs | Phase 2 补 `docs/contracts/source-runtime-customization-boundary.md`、README/用户手册边界说明与相关 tests。 | passed |
| U6 Agent role / dispatch boundary | Phase 2 收紧 research/review/verification/worker suitability gate、autofix 和 fresh-source eval 边界。 | passed |
| U7 Domain language / ADR / decision ledger | Phase 2 让 plan/work/debug/review 先消费 repo-local domain artifacts、ADR-like docs 和 decision notes，缺失时只 advisory。 | passed |
| U8 Feedback-loop-first / vertical slicing | Phase 2 为 debug/work/task guidance 增加最小反馈环、not-possible reason 和 vertical tracer bullet 要求。 | passed |
| U9 Release/source-runtime continuity guards | Phase 3 新增 deterministic `scripts/check-release-continuity.cjs`，并接入 `release-governance`，覆盖 catalog freshness、summary coverage、package surface、website gate preservation 和 README boundary links。 | passed |
| U10 Public surface / rejected-scope replay | Phase 3 让 skill-review 消费 guard facts，让 plan/work/sessions/compound 消费 provenance-backed rejected/out-of-scope rationale 作为 advisory boundary evidence。 | passed |
| U11 Closeout checklist | 每阶段均记录 validation artifact、CHANGELOG、runtime impact、fresh-source eval/not-run reason；本 artifact 为最终 closeout。 | passed |
| U12 Token economy / progressive disclosure | Phase task packs、contract summary、deterministic inventory、minimal replay consumer、review dispatch sizing 与 durable checkpoint guidance 已落到 source 和 tests。 | passed |

## Evidence Artifacts

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/validation/2026-05-16-phase1a-fresh-source-eval.md` | passed | Phase 1A hard gate，fresh read-only reviewer passed。 |
| `docs/validation/2026-05-17-phase1b-run-evidence-foundation-validation.md` | passed | Producer available；`workflow_integrated=false` boundary retained。 |
| `docs/validation/2026-05-17-phase1c-next-action-candidates-validation.md` | passed | Standards next-action candidate facts closed。 |
| `docs/validation/2026-05-17-phase1d-core-intake-validation.md` | passed | Core chain summaries and intake order closed。 |
| `docs/validation/2026-05-17-phase2-boundary-discipline-validation.md` | passed | Boundary, dispatch, domain, feedback-loop, progressive disclosure closed。 |
| `docs/validation/2026-05-17-phase3-spec-work-retention-replay-validation.md` | passed | Earlier Phase 3 replay/retention slice closed, but not full Phase 3 acceptance by itself。 |
| `docs/tasks/2026-05-17-005-feat-spec-first-optimization-phase3-tasks.md` | passed | Final Phase 3 task-pack validation passed before this closeout。 |

## Deterministic Validation

| Command | Status | Result |
| --- | --- | --- |
| `./bin/spec-first.js tasks validate docs/tasks/2026-05-17-005-feat-spec-first-optimization-phase3-tasks.md --json` | passed | Task pack valid; `spec_id` and `source_plan_hash` matched before final closeout. |
| `node scripts/check-release-continuity.cjs --json` | passed | Blocking failures: `[]`; guard output includes `guard_id`、`result`、`reason_code`、`classification`、`artifact_path`、`checked_sources`。 |
| `node --check scripts/check-release-continuity.cjs` | passed | Syntax check passed。 |
| `node --check src/cli/helpers/spec-work-run-artifact.js` | passed | Syntax check passed。 |
| Targeted post-review regression suite | passed | 6 suites, 101 tests passed after fixing fresh-source P1/P2/P3。 |
| `npm run typecheck` | passed | 98 files checked。 |
| `npm run lint:skill-entrypoints` | passed | 170 files scanned。 |
| `git diff --check` | passed | Whitespace check passed after final closeout edits。 |
| `bash -x tests/smoke/release-dual-host-governance.sh` | passed | Dual-host release governance smoke passed。 |
| `npm run test:release:governance` | passed | Release governance suite passed after rerun。 |
| `npm run test:unit` | passed | 121 suites, 1001 tests passed after final review fixes。 |
| `npm run test:smoke` | passed | CLI/install smoke passed after plan status flip。 |
| `npm run test:integration` | passed | Verification gate integration and five-step e2e passed。 |
| `npm run build` | passed | `npm pack --dry-run` passed and included `scripts/check-release-continuity.cjs`。 |
| `npm run test:release` | passed | Release continuity guard, dual-host release governance smoke, and tarball install smoke passed。 |
| Final focused regression set | passed | Re-ran spec-work run artifact, spec-standards next-action/custom-output, schema path, changelog, and `git diff --check` checks after final fixes。 |

## Fresh-Source Eval

Final fresh-source eval was executed with a fresh read-only subagent against current disk source and without reading generated runtime mirror contents.

- Round 1 result: identified one P1 and one P2, both caused by this artifact still self-reporting draft gate statuses after the deterministic commands had already passed.
- Remediation applied here: frontmatter `status: passed`, U11 `passed`, smoke/integration/build/release/focused regression recorded as `passed`, and Acceptance Gate set to passed.
- Boundary review result from Round 1: no evidence of generated runtime mirror hand-editing, scripts replacing LLM semantic judgment, run evidence becoming workflow state, release guard judging semantic release readiness, or rejected-scope replay becoming a state machine.
- Runtime paths: the evaluator did not read `.claude/**`, `.codex/**`, or `.agents/skills/**`; it only checked git status for generated runtime mirror modifications and found none.
- Round 2 result: passed. The fresh read-only reviewer confirmed the Round 1 P1/P2 findings were fixed, found no P0/P1/P2 findings, and accepted this artifact as final gate evidence for the source plan `status: completed`.
- Final code-review remediation eval: passed. A fresh read-only reviewer confirmed the follow-up P1 `run.json` leaf symlink escape, P2 custom `--output` next-action path drift, and P3 schema path-width finding were closed, with no new P0/P1/P2 findings.

## Runtime Impact

- Source changed: yes.
- Generated runtime mirrors hand-edited: no.
- Runtime regeneration performed: no.
- Runtime regeneration required before source validation: no.
- Catalog/README/package surface changed through source files and deterministic tests, not runtime patching.

## Residual Risks

- Graph/provider readiness facts are stale for this dirty branch and are not used as confirmed impact proof in this final closeout.
- `spec-work` run evidence remains `workflow_integrated=false` intentionally; Phase 3 added deterministic read/prune consumers, not full workflow closeout integration.
- Release continuity guard is deterministic facts only; it does not judge semantic release readiness.
- Rejected/out-of-scope replay refs remain advisory boundary evidence, not workflow state or approval status.

## Acceptance Gate

Status: passed. U1-U12 are mapped to source/test/evidence artifacts, deterministic validation passed, final fresh-source re-eval passed with no P0/P1/P2 findings, and the source plan status is completed.
