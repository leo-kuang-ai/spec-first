# Capability Evolution Decision Ledger

- **Type:** validation-only decision ledger（`new: validation-only decision ledger`，见 `docs/plans/2026-08-11-002-refactor-capability-gap-technical-optimization-plan.md` KTD11）
- **Owner plan:** `docs/plans/2026-08-11-002-refactor-capability-gap-technical-optimization-plan.md`
- **Consumers:** Project owner、该 Plan 的 U3-U5、U11、未来 successor Plan
- **不拥有：** workflow state、Build verdict、product truth；不复用 `docs/validation/spec-decompose/**`（该 root 由 `docs/plans/2026-07-28-002-feat-spec-decompose-vertical-closed-loop-plan.md` program-decomposition experiment 独占）
- **Created:** 2026-08-12
- **Source binding:** branch `leo-2026-08-11-updateskills`；本 ledger 记录 disposition/decision，不产生 field claim，也不替代 successor Build evidence

---

## Freshness / Evidence State（U1 + U2 intake）

- `docs/validation/spec-decompose/**`（program experiment 唯一 artifact root）**当前不存在**：field summary、case-local recommendation 与 baseline/candidate report 均为 `not-run / unavailable`。
- `docs/plans/2026-08-11-001-refactor-optimization-execution-sequence-plan.md` U7 的 program-level successor decision **尚未产生**。
- Ownership reconciliation（U1）已完成：
  - `2026-07-28-002` U5 收窄为 **case-local recommendation** owner，删除其直接创建 successor 的权限。
  - `2026-08-11-001` U7 固定为 `spec-decompose` successor 的**唯一创建/授权 owner**。
  - `docs/validation/spec-decompose/**` 确认为 program experiment 唯一 artifact root；本 ledger 不复制 case root、scorecard、recommendation 或 program decision。
- **结论：** 两层 evidence（case-local recommendation + program decision）均缺失，本计划保持 **core Defer**，不启动 U3/U4 core source mutation。docs-only Defer 是本计划的合法终态（见 owner plan Goal Capsule 的 Readiness scope）。

---

## Core Delta（U2 evidence-to-delta / skip decision）

| Item | Evidence state | Decision | Source refs | Invalidation condition |
| --- | --- | --- | --- | --- |
| PRD -> Plan continuity core delta（U3/U4） | field evidence `not-run`；无三案例 baseline/candidate、无重复 baseline failure、无 consumer correction | **skip-with-evidence**：不修改 `skills/spec-prd/`、`skills/spec-plan/`、`skills/spec-write-tasks/` source | 无 `docs/validation/spec-decompose/**` field summary，无 program decision | `docs/validation/spec-decompose/summary.md` 产出可裁决三案例、`2026-08-11-001` U7 给出 Extend 且 evidence 明确指向未覆盖 core gap 时，重开 U3 delta 评估 |

**Rationale:** 不得从外部 prior art、fixture 或文档完整度推导真实需求。缺 field evidence 时，任何 PRD/Plan/Task Pack source 改动都会退化为无 confirmed consumer 的猜测，违反 owner plan R1-R4/R15/R16 与 non-compensatory Gate（KTD10）。

---

## Successor Disposition（U5 对账）

| Candidate | case-local recommendation（2026-07-28-002 U5） | program decision（2026-08-11-001 U7） | Disposition |
| --- | --- | --- | --- |
| `spec-decompose` | `not-run`（field experiment 未运行） | `not-run`（未裁决） | **Defer**：本计划不创建 `skills/spec-decompose/`、route entry、inventory expectation 或 placeholder schema。Build-successor 仅能由 `2026-08-11-001` U7 在两层 evidence 齐备后创建。 |

---

## Peripheral Demand（U6-U10）

统一 demand threshold（KTD9，high-severity-or-recurring loss threshold）：至少两个可回源的独立 occurrence，或一个由 owner 确认为 P0/P1 高严重度/高纠正成本的 occurrence，并同时要求 confirmed consumer。未达阈值一律 `deferred`，不修改任何 Skill/reference/route/schema/projection。

| U-ID | Candidate | Documented occurrences | Current owner behavior | Confirmed consumer | Recurring loss | Disposition | Invalidation condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U6 | domain / deep-module continuity | 无 | `spec-prd` 术语/不变量、`spec-plan` 模块边界、`spec-compound` verified knowledge promotion 现足够 | 无 | 未证明 | **deferred** | 出现达到 KTD9 阈值的真实语义丢失 occurrence 且有 confirmed consumer |
| U7 | throwaway prototype | 无 | 普通 `spec-plan` + scoped `spec-work` 现足够；`spec-polish` 负责已有实现打磨 | 无 | 未证明 | **deferred** | 探索性决策反复无法由 scoped Work 安全回答，且有 owner-visible recurring loss |
| U8 | feedback route-loss triage | 无 | `spec-sweep` deterministic state writer + LLM 语义分类现足够 | 无 | 未证明 | **deferred** | `spec-sweep` 出现重复真实错路由损失且人工纠正成本达阈值 |
| U9 | merge-conflict resolution | 无 | Direct Lane / current `spec-work` 现足够 | 无 | 未证明 | **deferred** | 复杂语义冲突重复高损失且 Direct Lane 无法安全解析 |
| U10 | manual wizard（第三方配置） | 无 | 普通 checklist + `spec-runtime-setup`（仅 harness readiness）现足够 | 无 | 未证明 | **deferred** | 人工第三方配置构成可复用、高频且有 confirmed consumer 的真实缺口 |

**Note:** 以上 occurrence 一栏为 `无`，因为当前没有可回源的真实事件记录；不得为形成案例预先制造 fixture 或新增 glossary/reference/route。任一候选达到阈值时，仅创建独立 successor Plan，本 ledger 不承载其运行行为。
