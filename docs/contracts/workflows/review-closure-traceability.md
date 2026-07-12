# Review Closure Traceability Contract

`referenced_reviews` is a lightweight plan-frontmatter field that records which review/audit findings a plan addresses, so the review → 整改 闭环 stays machine-traceable instead of relying on人脑记忆.

It improves Evaluation/Knowledge Harness input by letting any tool join「审查报告 finding」to「承接它的 plan」without inferring the link from prose. It is **not** a workflow state, approval marker, progress database, coverage guarantee, or central registry.

It exists because a 2026-06-14 audit found a closure break (`META-closure-break`): the 2026-06-10 综合审查报告's 12 个 P1 had no plan pointing back at them via `origin`, so their逐条闭环状态 became unauditable. This contract makes the back-link explicit and minimally enforced.

This is the contract surface for 角色契约「Gate the exits, not the thinking」: a deterministic check that the back-link is *declared*, never a hard gate that blocks merges or mandates coverage completeness.

## Field Responsibilities

`referenced_reviews` is a YAML list in plan frontmatter. Each entry:

| Field | Required | Responsibility |
| --- | --- | --- |
| `path` | yes | Repo-relative path to the referenced review/audit report |
| `role` | yes | `origin`(本 plan 主要承接该报告)or `cross-reference`(顺带相关) |
| `scope` | yes | `in`(本 plan 处理其 finding)/ `deferred`(明确推迟)/ `adjudicated`(本 plan 给出逐条裁决) |
| `addresses_findings` | conditional | finding id 列表,本 plan 在 scope 内处理的 |
| `deferred_findings` | conditional | finding id 列表,明确推迟到 `followup_plan` 的 |
| `followup_plan` | optional | 承接 deferred findings 的后续 plan 路径 |
| `note` | optional | 自由说明 |

Top-level plan frontmatter may also carry `addresses_findings` directly when the plan's primary purpose is承接 a single review (see this contract's own consuming plan for an example).

## Enforcement Boundary (Weak by design)

The deterministic check is intentionally minimal — it catches只 silent 断链, not coverage gaps:

- **Enforced(确定性):** 一个 `role: origin` 且 `scope: in` 的 entry 必须带非空 `addresses_findings`(或非空 `deferred_findings`)。引了报告作为 origin 却不标任何 finding id = 静默断链,fail。
- **Not enforced(语义,归 LLM):** finding id 是否真实存在于报告中;finding 是否被正确裁决;报告所有 finding 是否都被某 plan 覆盖。这些是 LLM/orchestrator 语义判断,不脚本化。
- **Legacy 放行:** 两类放行——(1) 完全没有 `referenced_reviews` 字段的 plan;(2) frontmatter `date` 早于约定确立日 `2026-06-14` 的历史 plan(法不溯及既往,不回溯改写历史 plan frontmatter)。本约定只对该日及之后、且显式引用审查报告的 plan 生效。

为什么弱:角色契约把 handoff / knowledge promotion 定义为 exit gate,同时要求 deterministic floor 与 semantic judgment 分工。这里机械强制「必须声明 finding id」以防住 `META-closure-break` 那类静默断链;finding 是否被正确覆盖仍由 LLM 判断。把覆盖完整性脚本化会扩张 hard gate,成本高且收益边际。

## Artifact Metadata

- `schema_version`: 本 contract 无独立 schema 文件;约定由 `tests/unit/plan-status-taxonomy.test.js` 的 referenced_reviews 校验兑现。
- `producer`: plan 作者(LLM/human)在 `spec-plan` workflow 写入 frontmatter。
- `authority_level`: advisory(closure 裁决本身是 review-evidence,见各 closure-adjudication 文档)。
- `reason_code`: 校验失败时 test 输出 `referenced-review-missing-finding-ids`。
- `consumer`: `tests/unit/plan-status-taxonomy.test.js`(确定性校验);`skills/spec-plan`(未来 prose 接入,deferred);审查→整改闭环人工/语义追踪。

## Consumers

| Consumer | 消费方式 |
| --- | --- |
| `tests/unit/plan-status-taxonomy.test.js` | 弱校验:遍历 `docs/plans/*.md`,对 `role: origin`+`scope: in` entry 断言带 finding id |
| closure-adjudication 文档 | 如 `docs/项目审查/2026-06-14-06-10-P1-闭环裁决.md`,承载某报告逐条裁决,被 plan 以 `scope: adjudicated` 引用 |
| `skills/spec-plan`(deferred) | 未来在 plan frontmatter 生成时提示填 `addresses_findings`,本批不实现 |

## Legacy & Precedent

`docs/plans/2026-05-07-001-feat-skill-agent-quality-governance-plan.md` 已先用过 `referenced_reviews`(含 `deferred_findings`/`followup_plan`),本契约文档化并标准化该既有形态,不重构该先例。

## Source Contracts

The normative behavior lives in:

- `tests/unit/plan-status-taxonomy.test.js`(确定性校验实现)
- `skills/spec-plan/SKILL.md`(plan frontmatter 写入,prose 接入 deferred)
- `docs/contracts/workflows/spec-id-traceability.md`(姊妹身份契约)

This document is a map of the contract, not a second source of truth.
