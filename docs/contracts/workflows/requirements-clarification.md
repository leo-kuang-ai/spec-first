# 需求澄清合同

> 生命周期：current。由 `spec-ideate`、`spec-brainstorm`、`spec-prd` 与 `spec-plan` 共同遵循的需求澄清 source-of-truth。

## 目的

需求澄清是当前拥有 Product Contract 或 PRD 的 producer 能力。它不是公开 workflow、共享执行器、状态机或第三种 handoff artifact。

支持的成熟度路径保持不变：

```text
0→1: spec-ideate → spec-brainstorm → spec-plan
1→10: spec-brainstorm → spec-plan
10→100: spec-prd → spec-plan
```

没有 upstream producer artifact 时，`spec-plan` 仍可直接 bootstrap。未解决的产品假设必须标记为 planning-time assumption，不得漂白为 producer 已确认事实。

## 权威与 Ownership

| 角色 | 负责 | 不得越权 |
| --- | --- | --- |
| Scripts/tools | 文件发现、路径、hash、schema/receipt 状态、source/runtime projection 事实 | 裁决产品含义、语义充分性、优先级或 readiness |
| LLM/agent producer | 读取 source、分类 gap、判断场景相关性、提出建议、综合 artifact | 伪造 source 检查、产品确认或确定性验证 |
| 当前执行对话用户 | 需求、验收、范围、术语、兼容性、优先级、风险接受与发布行为的唯一人类产品确认人 | 产品确认不隐含项目级知识 mutation 或仓库治理迁移授权 |
| Specialist/regulatory/privacy/security/financial material | 确认依据与风险证据 | 创建第二个人类确认人或替代当前用户决策 |
| Repository/project owner | 单独授权新 PRD topology、Gate A attempt 等仓库治理变更 | 仅因其他位置需要治理授权就进入产品问题路径 |

专业证据不足时，producer 向当前用户提供显式确认、defer、scope-cap、source-candidate/assumption 或具名 blocker 选择。不得联系第二确认人，也不得代替用户签字确认。

## Source-First 问题合同

询问可由 source 回答的当前事实前，先读取相关 source、tests、当前 contracts 或当前 docs。一个 source-sensitive question 必须记录：

- 具名 gap；
- source attempt 与 direct refs；
- 既有 Product Contract / PRD write target；
- planning 否则会发明的 load-bearing WHAT。

纯产品偏好或开放探索没有有用 source 时，记录 `source_attempt: not-applicable` 及原因，不做形式化查找。

每轮只向当前用户询问一个最高影响的独立产品问题。只有 source evidence 或明确 tradeoff 支持时才提供推荐答案；不得用虚构推荐锚定开放探索。

## Durable Persistence 与恢复

requirements-only unified Product Contract 或 legacy PRD 是 durable source。`/tmp` dossier、transcript、cache、provider output 与 helper status 只属于加速或 advisory 材料。

暂停、headless continuation 或 context reset 前，把每项 load-bearing 结果持久化到既有 artifact section：

- confirmed/current fact 与 source ref；
- 已观察的 source snapshot 或 version；
- limitation 与 invalidation condition；
- 当前用户决定或显式 assumption；
- 未解决的具名 blocker；
- 下一个最高影响问题及其 write target。

不得伪造当前用户 closure。blocker 仍存在时，暂停 artifact 保持 non-ready 或 checkpoint 形态。

## 场景落点

对 Standard/Deep 行为需求，只考虑实质适用的场景：happy path、role/permission、state transition、failure/degraded behavior、negative acceptance 与 cross-context handoff。

保留的场景必须改变至少一个既有 durable destination：Acceptance Example、Resolve Before Planning / Outstanding Question、显式 assumption 或 Non-Goal；否则作为 ceremony 删除。相关性由 LLM 做语义判断；script 不构造 Cartesian-product checklist，也不裁决适用性。

## 本地语言与 Promotion 边界

当前 Product Contract 或 PRD 闭合当前 release slice 所需含义。项目 glossary、`CONCEPTS.md`、`CONTEXT.md`、`CONTEXT-MAP.md` 与 ADR-like 文件只作 advisory calibration source；文件名、年龄或 “canonical” 标签不会在冲突中静默胜出。

`spec-brainstorm`、`spec-prd` 与 `spec-plan` 不创建或修改项目级 glossary/context/ADR artifact。跨 release 知识只能在 local closure 后输出 promotion candidate。candidate 包含：

- target kind/path；
- proposed meaning 或 decision；
- provenance；
- applicability scope；
- 真实 consumer；
- reuse rationale；
- invalidation condition；
- 显式的 “not written by this workflow” 声明与后续明确 knowledge-maintenance entrypoint。

ADR candidate 还必须同时满足：hard to reverse、surprising without context、real tradeoff。缺少资格字段时，结果保持 PRD/Product-Contract-local。local closure 已充分时，缺少项目 topology 不得阻塞 planning。

## 当前 PRD 边界

当前 `spec-prd` 基线保持：

- default profile 加精确 opt-in `analysis_profile=contract-reset-lite`；
- legacy PRD artifact topology；
- ready claim 前必须执行 producer finalize；
- validate 保持 report-only；
- consumer `--verify-receipt` 诊断保持 optional read-only；
- 当前执行对话用户是唯一人类产品确认人。

活跃 Gate A source 是 `docs/validation/spec-prd/2026-07-11-spec-prd-contract-reset-gate-a.md`，其决定为 `inconclusive` 且不 promotion。本合同不授权新 attempt、candidate arm、runner、统一 `spec-prd` topology、migration 或 mandatory consumer gate。reopen 需要单独取得 repository/project owner 批准的治理计划，并且不会增加另一个产品确认人。

## Artifact 与 Runtime 边界

- 复用 requirements-only unified Product Contract 或 legacy PRD；不新增完整访谈 transcript、持久 gap table、通用澄清 schema 或第三种 handoff artifact。
- 修改 `skills/`、`docs/`、tests 与 generator contracts 下的 source。Generated host runtime mirror 必须从 source 重建，禁止手改。
- Tests/scripts 可以证明字段、路径、hash、禁止写入、receipt 与 projection；fresh reviewer 或 human 判断问题质量、场景相关性、答案 fidelity 与 planning invention。
