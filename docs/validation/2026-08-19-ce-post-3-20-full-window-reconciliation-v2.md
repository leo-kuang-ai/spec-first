---
artifact_type: confirmed-reconciliation-ledger
schema_version: ce-upstream-reconciliation/v2
upstream_range: 5c7cb347d0686663743b87cd7227246ba24f7fa7..956087b3e1dd7ccc03df32cee9e7c044dfbe75cf
---

# CE post-3.20 Full-Window Reconciliation

该摘要由对账器消费独立的 LLM adjudication artifact 后生成。脚本只校验 Git、path、snapshot、schema 与聚合不变量，不生成 owner、action 或 limitation 语义判断。

## 冻结事实

- 路径：517
- 分组：G05=15, G01=298, G06=5, G02=95, G04=6, G03=98
- package：33
- G01 package 路径：298
- adjudication SHA-256：`560abb6a4108d7f3a3fa69a4354d00229312095751c820f18e55b74ac7de3cc3`
- target source HEAD：`741175a23615e37382ce65ec1e0448abfa214e95`
- target source dirty：true

## Package Summary

package_id | surface | paths | canonical_owner | implementation_unit | target_action | evidence_status
--- | --- | ---: | --- | --- | --- | ---
P01 | ce-babysit-pr | 12 | product-excluded | not-applicable | out-of-scope-by-product-decision | not-applicable
P02 | ce-brainstorm | 19 | skills/spec-brainstorm/SKILL.md | U4 | compose | planned
P03 | ce-code-review | 18 | skills/spec-code-review/SKILL.md | U3 | compose | planned
P04 | ce-commit | 1 | skills/spec-commit/SKILL.md | U2b | compose | planned
P05 | ce-commit-push-pr | 8 | skills/spec-commit-push-pr/SKILL.md | U2b | compose | planned
P06 | ce-compound | 21 | skills/spec-compound/SKILL.md | U5a | compose | planned
P07 | ce-compound-refresh | 15 | skills/spec-compound-refresh/SKILL.md | U5a | compose | planned
P08 | ce-debug | 6 | skills/spec-debug/SKILL.md | U2a | compose | planned
P09 | ce-doc-review | 24 | skills/spec-doc-review/SKILL.md | U3 | compose | planned
P10 | ce-dogfood | 4 | skills/spec-dogfood/SKILL.md | U5c | compose | planned
P11 | ce-explain | 9 | skills/spec-explain/SKILL.md | U5b | compose | planned
P12 | ce-handoff | 3 | skills/spec-handoff/SKILL.md | U2b | compose | planned
P13 | ce-ideate | 15 | skills/spec-ideate/SKILL.md | U4 | compose | planned
P14 | ce-optimize | 12 | skills/spec-optimize/SKILL.md | U5a | compose | planned
P15 | ce-plan | 20 | skills/spec-plan/SKILL.md | U4 | compose | planned
P16 | ce-pov | 12 | skills/spec-pov/SKILL.md | U3 | compose | planned
P17 | ce-product-pulse | 6 | skills/spec-product-pulse/SKILL.md | U5b | compose | planned
P18 | ce-promote | 2 | skills/spec-promote/SKILL.md | U5b | compose | planned
P19 | ce-proof | 3 | product-excluded | not-applicable | out-of-scope-by-product-decision | not-applicable
P20 | ce-prototype | 7 | skills/spec-prototype/SKILL.md | U4 | implement-in-current-owner | planned
P21 | ce-resolve-pr-feedback | 8 | skills/spec-resolve-pr-feedback/SKILL.md | U2b | compose | planned
P22 | ce-retune | 8 | product-excluded | not-applicable | out-of-scope-by-product-decision | not-applicable
P23 | ce-riffrec-feedback-analysis | 3 | skills/spec-riffrec-feedback-analysis/SKILL.md | U5b | evidence-only | planned
P24 | ce-setup | 4 | skills/spec-runtime-setup/SKILL.md | U6 | implement-in-current-owner | planned
P25 | ce-simplify-code | 5 | skills/spec-simplify-code/SKILL.md | U5a | compose | planned
P26 | ce-strategy | 5 | skills/spec-strategy/SKILL.md | U4 | compose | planned
P27 | ce-sweep | 9 | skills/spec-sweep/SKILL.md | U5b | compose | planned
P28 | ce-test-browser | 4 | skills/spec-test-browser/SKILL.md | U5c | compose | planned
P29 | ce-test-xcode | 1 | skills/spec-test-xcode/SKILL.md | U5c | compose | planned
P30 | ce-work | 19 | skills/spec-work/SKILL.md | U2b | implement-in-current-owner | planned
P31 | ce-worktree | 1 | skills/spec-worktree/SKILL.md | U2a | compose | planned
P32 | lfg | 8 | skills/spec-lfg/SKILL.md | U2b | compose | planned
P33 | ce-skill-work | 6 | skills/spec-write-skill/SKILL.md | U1 | compose | planned

详细逐路径事实见 `/Users/kuang/xiaobu/spec-first/docs/validation/2026-08-19-ce-post-3-20-full-window-reconciliation-v2.json`；当前 source inventory 见 `/Users/kuang/xiaobu/spec-first/docs/validation/2026-08-19-spec-first-current-skill-package-inventory-v2.json`。
