---
title: "refactor: spec-doc-review Roster Budget + Cost-Shape + Isolation"
type: refactor
created_at: 2026-07-14
artifact_contract: spec-unified-plan/v1
artifact_readiness: verification-pending
product_contract_source: none
execution: code
upstream: docs/plans/2026-07-14-001-refactor-spec-doc-review-token-optimization-plan.md
---

# refactor: spec-doc-review Roster Budget + Cost-Shape + Isolation

## Goal Capsule

- **Objective:** 在 **不合并角色、不改 finding schema** 的前提下，降低 `spec-doc-review` 的 **运行乘数**：默认更少 reviewer（降 N）、dispatch 前可见 cost-shape、子 agent 最小上下文继承；并收紧文档全文 ×(N+1) 的浪费。目标（待测）：典型 plan 审查默认 **N≤3** 时，`aggregate_no_doc` 相对 001-after 再降约 **30–40%**（叶侧近似按 N 线性）；大文档场景通过切片纪律避免全文重复主导账单。
- **Authority:** 分析报告 §5 P0 运行乘数、§10.2 roster、§13 TopologyBudget；001 轨 1 已完成固定项压缩。
- **Stop conditions:** 不合并/删除 persona 文件；不引入 per-finding validator；不改 walkthrough 主状态机；不收紧 adversarial **方法论**（可收紧 **默认是否派**）；不手改 generated runtime。

## Implementation Status

| 项 | 状态 |
| --- | --- |
| 本 plan 文档 | **drafted** |
| 实施 W1–W3 文案 | **done** @ SKILL.md（roster/cost-shape/isolation/anti-waste） |
| 人工 standard vs full 对照审查 | **open** |

## Product Contract

### Problem Frame

001 后 headless N=5 的 `aggregate_no_doc` 仍 ~42k tok（chars/4），其中 **55% 为 N×(template+schema)**。继续压 spine ROI 低。第一性原理：`Cost ∝ N × (template + schema + persona + doc_slice) + host_hidden`。

### Requirements

- **R1 Profile 合同：** 定义 `lite` / `standard`（默认）/ `full`。
  - **lite：** always-on 仅 coherence **或** coherence+feasibility（二选一写死：coherence+feasibility 若文档 < ~150 行且无 plan IU；否则见矩阵）；最多 0 个条件角色。**修正：lite = coherence + feasibility only，N=2。**
  - **standard（默认）：** always-on coherence + feasibility；条件角色 **最多再 +1**（按风险优先级：security > design > product > scope > adversarial，或文档类型表）。N≤3。
  - **full：** 现网逻辑（条件角色按表全开可能），N 可达 5–7；需用户显式 `depth:full` / `roster:full` 或参数。
- **R2 激活参数：** skill 参数支持 `roster:lite|standard|full`（或 `depth:` 别名）；缺省 standard。
- **R3 Cost-shape 一行（advisory）：** Phase 1 确定 roster 后、dispatch 前输出一行：  
  `cost-shape: profile=standard N=3 personas=[…] doc_bytes=… isolation=min|degraded_inherited slices=unified|full`
- **R4 Isolation 合同：** 子 agent 任务包自包含时，优先最小继承（Codex `fork_turns: none` 或宿主等价）；若宿主不支持，cost-shape 标 `isolation=degraded_inherited`，不假装已隔离。
- **R5 文档切片纪律：** 保持 unified 按角色切片；legacy/无法切片时 `slices=full` 且 cost-shape 标明；禁止在已切片时再把全文塞进每个 leaf（编排器可读全文一次以分类，leaf 只收 slice）。
- **R6 测量：** 更新 baseline 附录或新 JSON：同一 fixture 下 standard vs full 的 N 与 aggregate 估算。
- **R7 质量：** 至少 1 个 plan fixture 上 standard vs full 的 finding 覆盖对比（P0/P1 是否仅在 full 出现 unique 高价值 finding）— advisory，不阻塞 R1 合并若 full 仍可用。

### Scope Boundaries

- **In:** `skills/spec-doc-review/SKILL.md`；必要时 `persona-activation-matrix.md` 增加「standard 预算下只选 1 个条件角色」规则；contract test 断言 profile 文案与 cost-shape 标记存在；docs baseline 附录。
- **Out:** persona 内容重写、schema 变更、code-review、CLI 新命令、U5 primer、spine 再拆。
- **Deferred:** 自动风险评分脚本（先 LLM 按表选 1 个条件角色）；schema 叶摘要。

### Delivery Waves

| Wave | 内容 | 可独立验收 |
| --- | --- | --- |
| **W1** | R1–R3：profile + 默认 standard N≤3 + cost-shape 一行 | 是 |
| **W2** | R4 isolation 合同文案 + degraded 标记 | 是 |
| **W3** | R5 切片纪律强化 + R6/R7 测量对照 | 是 |

## Key Technical Decisions

- **KTD1:** 省 token 靠 **少派**，不靠合并角色。  
- **KTD2:** standard 下「多个条件角色都命中」时 **只派优先级最高的 1 个**，其余写入 cost-shape `skipped_conditional=[…] reason=budget`。  
- **KTD3:** full 必须显式，避免「省钱默认」被无声切回全量。  
- **KTD4:** cost-shape 为 **advisory 输出**，不做硬 gate 阻断审查。

## Risks

| 风险 | 级别 | 缓解 |
| --- | --- | --- |
| standard 漏派 adversarial 导致漏高风险 finding | P1 | full 仍在；高风险信号（auth/支付/迁移）时 standard 优先选 adversarial 作为 +1 |
| 用户不知默认已变 | P2 | cost-shape 行 + CHANGELOG + skill description 提示 |
| 宿主无 isolation | P2 | degraded 标记诚实 |

## Verification

```bash
npx jest tests/unit/spec-doc-review-contracts.test.js --runInBand
# 扩展断言：SKILL 含 roster:lite|standard|full 与 cost-shape 字样
```

人工：同一 plan 用 standard 与 full 各 headless 一次，对比 N 与 finding 集合。

## Definition of Done

- [x] W1 profile + 默认 standard + cost-shape 落地  
- [x] W2 isolation 合同 + degraded  
- [x] W3 切片纪律（anti-waste）；测量附录见 baseline 追加 N 估算  
- [x] contract tests 更新（002 四条）  
- [x] CHANGELOG  
- [ ] 不修改 generated runtime（source only；init 由用户/CI）

## Open Questions

1. lite 是否允许 N=1（仅 coherence）？**默认否（N=2）**，除非用户后续要更激进。  
2. 参数名 `roster:` vs `depth:`？**实施时主名 `roster:`，`depth:full` 作别名映射到 full。**
