---
title: "Rule Maturity Phase 1 Gate Validation"
date: 2026-06-14
status: completed
recommended_next_action: continue-phase1
---

# Rule Maturity Phase 1 Gate Validation

## Conclusion

最小 demo 已通过自动测试,证明 v1.17 phase 1 的 producer -> reader -> skill-review consumer -> phase gate facts 链路可以闭合。但当前真实仓库的本地 rule-maturity evidence store 仍为空,没有可供 phase 2 人审裁决/晋升计划使用的 shadow hit 样本。

因此本次 gate 结论是:继续 phase 1 观测,暂不打开 R9-R17 的 phase 2 active implementation plan。

## Required Gate Fields

- as_of: `2026-06-14T15:06:04+08:00`
- source_refs:
  - `spec-first internal rule-maturity list --json`
  - `.spec-first/audits/skill-review/rule-maturity-phase1-gate-2026-06-14/rule-maturity-observations.json`
  - `tests/unit/rule-maturity-phase1-demo.test.js`
- status_class: `empty`
- rule_count: `0`
- shadow_hit_count: `0`
- candidate_density:
  - window_days: `14`
  - shadow_hits_per_week: `0`
  - rule_count: `0`
  - workflow_count: `0`
- workflow_distribution: `{}`
- consumer_status: `empty`
- store_status: `empty`
- owner_cadence_decision:
  - status: `missing`
  - missing_fields: `reviewer`, `cadence`, `trigger`, `minimum_sample`, `fallback`
- recommended_next_action: `continue-phase1`

## Evidence Snapshot

`rule-maturity list --json`:

```json
{
  "schema_version": "rule-maturity-list.v1",
  "status": "empty",
  "reason_code": "rule-maturity-store-empty",
  "rules": []
}
```

`rule-maturity-observations.json`:

```json
{
  "schema_version": "rule-maturity-observations.v1",
  "status": "empty",
  "reason_code": "rule-maturity-observations-empty",
  "rule_count": 0,
  "shadow_hit_count": 0,
  "workflow_distribution": {}
}
```

## Demo Result

新增自动化 demo 使用临时 repo 执行:

1. `spec-first internal rule-maturity record --json`
2. `spec-first internal rule-maturity list --json`
3. `retired-skill-review` source script 写出 `rule-maturity-observations.json`
4. `buildRuleMaturityPhase1GateFacts()` 生成 phase gate facts

测试验证两条关键行为:

- 有 shadow hit 但没有 owner/cadence 决策时,仍返回 `continue-phase1`。
- 有 shadow hit、consumer 正常、owner/cadence 决策完整且样本数达到最低值时,才返回 `open-phase2-plan`。

这证明推进机制本身可以工作,但当前真实仓库数据还没有达到推进条件。

## Verification

- Passed: `npx jest tests/unit/rule-maturity-phase1-demo.test.js tests/unit/rule-maturity.test.js tests/unit/skill-review-scripts.test.js --runInBand`
- Passed: `npm run typecheck`
- Passed: `npm run lint:skill-entrypoints`
- Passed: `npx jest tests/unit/governance-contracts.test.js tests/unit/changelog-format.test.js --runInBand`
- Passed: `node --check src/cli/helpers/rule-maturity.js && node --check tests/unit/rule-maturity-phase1-demo.test.js`
- Passed: `git diff --check -- src/cli/helpers/rule-maturity.js tests/unit/rule-maturity-phase1-demo.test.js docs/contracts/governance/rule-maturity.md CHANGELOG.md`
- Partial: `npm run test:unit` ran the new demo successfully, but the full unit suite failed in pre-existing SCALE documentation contract tests because `docs/01-需求分析/13.scale-integration/CodeGraph技术方案.md` and `docs/01-需求分析/13.scale-integration/spec-first内化集成scale-project-scaffold技术方案.md` are currently missing from the dirty worktree. Those failures are unrelated to the rule-maturity demo.

## Next Action

Keep v1.17 at phase 1. Do not implement `adjudicate`, `promote`, `demote`, `report`, governance ROI, or resource/output hardening from R9-R17 until real shadow hits exist and owner/cadence is explicitly recorded.
