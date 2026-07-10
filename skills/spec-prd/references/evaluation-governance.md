# Evaluation And Governance Status

Deferred governance detail for `spec-prd`. The `SKILL.md` entry keeps only route-critical trigger, output, and reference-routing guidance.

## Maturity

Current posture: production, team-reused brownfield PRD workflow command.

This package is not governed-ready and not public-claim-ready. Do not claim governed status until blind output review and reviewer-scored output evidence exists (topology-heavy semantic eval is already covered by a dispatched fresh-source pass; see Eval Status).

Owner: Spec-First maintainers.

Review cadence: per release, or whenever trigger, requirements artifact, readiness/handoff, topology, or evidence-tag contracts change.

## Eval Status

`skills/spec-prd/evals/examples.json` is source-owned examples-as-context for maintainers, focused contract tests, audits, and fresh-source eval prompts. It covers routing, evidence, readiness, and helper-boundary behavior with concise representative cases. It is not user documentation, not a runtime API, not packaged user-facing workflow state, not a runtime state machine, and not semantic output-quality proof.

`skills/spec-prd/scripts/check-prd-artifact.js` and `check-glossary-drift.js` report deterministic script-owned facts (structure, trace gaps, placeholder lines, avoid-term drift). `skills/spec-prd/scripts/run-evals.js` reports deterministic fixture-contract facts (case metadata, coverage buckets, required `must_not` constraints, and reason codes). They never decide `ready-for-planning` or semantic output quality; those judgments stay LLM-owned.

`tests/unit/spec-prd-*.test.js` 下的聚焦 Jest 测试覆盖当前 source package 合同：产品内置模板资产与五宿主投射、Decision Card 确定性一致性，以及 `spec-prd` 到 `spec-plan` 的 handoff 边界。当前 source topology 包含 `SKILL.md`、references、scripts、由 checker/finalize 共享的 `scripts/lib/reason-codes.js` 分类法，以及 `assets/templates/` 和 `assets/overlays/` 下的产品内置资产；文件数量只是实现事实，不再冻结为产品合同。这些是 file-backed fixture checks，不是 provider-backed 模型执行或语义输出质量证明。

Dispatched fresh-source eval records live in `docs/validation/spec-prd/`. Several behaviors are honestly recorded `not_run` with explicit reasons; dispatched reviewer passes carry `status:passed` or `passed-with-concerns`. The domain-grill behavior has a dispatched pass; Sanitization, Feature Slices, and topology-heavy behaviors were validated by a dispatched fresh-source pass on 2026-06-21 (`passed-with-concerns`, one minor non-blocking generated-runtime-boundary hardening note). The remaining `not_run` records name the specific behaviors still awaiting a dispatched semantic pass — see those records for current status.

## Governed-Package Evidence Labels

- `file-backed fixture`：当前证据包括 `evals/examples.json`、确定性脚本、产品内置模板资产和聚焦 Jest contract tests。
- `input_files`: increment request or existing PRD path, optional notes/screenshots/transcripts/PDF extraction, repo source/docs/tests read during current-state analysis, and product-owner decisions.
- `output contract`: a PRD-grade requirements artifact under `docs/brainstorms/` with `artifact_kind: prd-requirements`, plus a closeout summary, or a compact bypass/handoff/route-out.
- `rollback boundary`: source-only changes here; generated runtime mirrors refresh through `spec-first init`.
- `trust report`: `missing evidence`.
- `reports/output_quality_scorecard.md`: `missing evidence` (output quality is verified by fresh-source eval + deterministic scripts + contract tests by design, deliberately not by an automated baseline-vs-skill scorecard).

## Promotion Boundary

Treat examples-as-context fixtures and focused contract tests as readiness evidence only. They do not replace fresh-source eval, blind output review, or human-owner acceptance for semantic quality claims.

Do not add a per-skill `manifest.json` unless spec-first adopts that as a source truth; lifecycle delivery currently lives in the dual-host governance contract. Do not create a new global governance index — co-located references like this file are the settled convention.

A yao-style automated output-eval scorecard (10-20 live brownfield runs, with-skill vs baseline, model-executed, blind A/B review) is a settled out-of-scope decision, not an outstanding deliverable. Adversarial review of the yao-gate findings judged it over-engineering for this repo: no skill carries an `evals/output/` tree, hand-authored baselines would not be the provider-backed model evidence yao requires, and automated scoring of subjective PRD prose contradicts the role contract's "scripts enforce deterministic invariants; scripts prepare facts; LLM decides semantic adequacy above that floor" and "可信证据 > 自动化便利". Output quality here is verified by dispatched fresh-source eval + deterministic scripts + focused contract tests; that substitution is the recorded rationale in Eval Status above, which closes the only legitimate residue of that finding.
