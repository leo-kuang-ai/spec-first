# Fresh-Source Eval: spec-prd Enforce Grill And Design Gate

```yaml
fresh_source_eval:
  schema_version: fresh-source-eval-record.v1
  producer: spec-work
  freshness: current-worktree
  authority_level: advisory
  reason_code: fresh-source-eval-not-run-no-dispatch-authorization
  consumer: spec-prd contract tests and work closeout
  status: not_run
  related_plan: docs/plans/2026-06-25-002-fix-spec-prd-enforce-grill-and-design-gate-plan.md
  extends: docs/validation/spec-prd/fresh-source-eval-2026-06-25-relentless-grill.md
  source_paths:
    - skills/spec-prd/SKILL.md
    - skills/spec-prd/references/design-source-evidence.md
    - skills/spec-prd/references/prd-output-template.md
    - skills/spec-prd/references/prd-readiness-lens.md
    - skills/spec-prd/references/product-expert-lens.md
    - skills/spec-prd/scripts/check-prd-artifact.js
    - skills/spec-prd/evals/examples.json
    - tests/unit/spec-prd-contracts.test.js
    - docs/05-用户手册/22-PRD需求文档质量增强流程.md
  runtime_paths_checked:
    - source: skills/spec-prd/SKILL.md
      claude_projection: .claude/spec-first/workflows/spec-prd/scripts/check-prd-artifact.js
      codex_projection: .agents/skills/spec-prd/scripts/check-prd-artifact.js
  changed_behavior: "在既有 Phase 4 生产端强制 checker 的基础上，补完原 002 defense-in-depth：checker 支持 `--inputs` 输入侧 design-source 扫描，新增 `clarification_trace_absent`、`design_source_unaccounted`、`input_refs_unavailable`、`input_scan_degraded`、`prd_readiness_declarations_evaded`、`preflight_sweep_closure_absent` findings 和 `input_scan_attempted` / `preflight_sweep_closure` facts；SKILL 与 readiness lens 强制消费 grill/design/input/preflight findings，Phase 4 source path 走 runtime rewrite contract。"
  reviewer_context: "本会话用户要求继续完成开发，但未显式授权 subagent / parallel reviewer / delegated review。按 dispatch 授权边界，未 dispatch fresh read-only reviewer；语义行为验证记 not_run。确定性验证使用当前 source、脚本实跑、contract tests、eval runner 和 runtime adapter projection 断言。Generated runtime mirrors 未作为 source 使用，也未手改。"
  checks:
    checker_inputs_and_findings: deterministic-passed
    clarification_trace_absent_skipped_final_prd: deterministic-passed
    design_source_unaccounted_input_side: deterministic-passed
    input_scan_degraded_and_unavailable: deterministic-passed
    prd_readiness_declarations_evaded: deterministic-passed
    preflight_sweep_closure_absent: deterministic-passed
    source_runtime_projection_contract: deterministic-passed
    eval_fixture_contract: deterministic-passed
    semantic_fresh_source_reviewer: not_run
  not_run_reason: "dispatch_authorization_missing：本会话未授权 subagent dispatch，语义行为验证降级为 deterministic 脚本 + 契约测试 + eval fixture 验证。"
```

## Deterministic Evidence

- `node --check skills/spec-prd/scripts/check-prd-artifact.js`: passed.
- `npx jest tests/unit/spec-prd-contracts.test.js --runInBand`: 29 passed.
- `node skills/spec-prd/scripts/run-evals.js --json`: 93 cases passed, `reason_code=eval_fixture_passed`.
- Contract tests cover the checker `--inputs` behavior, KAZ-style `source_docs/Figma-市场页设计稿链接.md` input file, `clarification_evidence: skipped` with `write_mode: final-prd`, PRD-shaped declaration evasion, `preflight_sweep_closure`, and Claude/Codex runtime path projection.

## Limitations

This artifact does not claim semantic reviewer behavior passed. A later run with explicit dispatch authorization can add a successor fresh-source eval if needed.
