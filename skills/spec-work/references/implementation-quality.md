# Implementation Quality And Architecture Fit

本 reference 是 `spec-work` 的 implementation-quality owner。它负责 durable-surface trigger、current-source capability inventory、`reuse / extend / compose / new` recheck、thin-glue ownership、future-only refusal、wrong-owner escape、material deviation note 和 simplification classification。

它不重新设计 plan。`spec-plan` 负责架构设计；`spec-work` 只检查 plan/task decision 在当前 source 中是否仍然适配。需要新的 public contract、跨模块架构、schema/runtime/provider/source-of-truth 决策时，停止并回到 `spec-plan` 或 task-pack regeneration。

## Owned

- 在 durable surface mutation 前做 current-source capability inventory 与四姿态 recheck。
- 约束 thin-glue owns/does-not-own、failure/degradation/observability/evidence seam。
- 拒绝 future-only wrapper、wrong-owner reuse 与未授权架构扩张。
- 在 phase boundary 分类 simplification，并记录 material deviation/claim limitation。

## Not Owned

- 重新设计 plan、发明 acceptance/public contract 或替代 `spec-plan` 的 architecture decision。
- 把通用 best practice、单一 nearby pattern 或 provider candidate 变成 hard rule。
- 用脚本裁决 owner fit、四姿态或 simplification 语义。

## Trigger

在新增或实质改变以下 durable surface 前读取：dependency、file、abstraction、helper、wrapper、adapter、orchestrator、public contract、schema、config/runtime surface、source-of-truth entry、workflow handoff、provider/repo boundary、generator、template、agent/skill prompt、artifact contract 或 generated runtime delivery。

## Fallback

以下通常不触发完整 lens：typo/docs wording、changelog-only、test expectation 的 bounded update、已明确 owner 内的局部实现、纯格式化、无 durable surface 的小修。它们继续遵守 scope/source/runtime/verification 边界，但不输出架构矩阵或长 decision note。

## Current-Source Capability Inventory

在 invention 前做 bounded inventory：

1. 当前 source 是否已有能力完整满足需求；
2. 当前 owner、source-of-truth、public/internal contract 和 extension point 是什么；
3. 是否可以通过 caller、config、现有 workflow 或窄 adapter 协调，而无需复制第二套实现；
4. plan 中的 `compose / thin-glue` 或 `new` 判断是否已因 current source 演化而过时；
5. generated runtime mirror 只作为 drift/consumer evidence，永远不是 candidate owner。

停止条件是“足以判断 fit”，不是“证明仓库里绝无相似代码”。Provider/graph 只用于候选导航，重要 owner/contract 仍从 source/test/doc 确认。

## Four-Posture Recheck

对 material durable surface 选择一个 right-sized 姿态：

- `reuse`：现有 capability/contract 已满足，直接使用，不加 wrapper；
- `extend`：现有 owner 本来就拥有该边界，可以吸收 focused behavior 而不混责；
- `compose / thin-glue`：多个 authoritative capability 保持独立，由窄 seam 连接；
- `new`：reuse/extend/compose 都会混淆职责、扭曲 contract、隐藏 coupling 或制造 ambiguous source of truth，因此新边界有当前需求支撑。

Reuse 不是 quota。若 nearby capability 是 wrong owner，不得为了“少建文件”把业务规则硬塞进去；优先寻找正确 owner/extension seam，确实无法承载时再使用 plan 已授权的新边界。单一可疑 nearby pattern、generic best practice 或 imagined future consumer 都不能独立授权新 abstraction。

证据冲突时使用：confirmed active standard/source-of-truth > explicit plan/task decision > owner/source module boundary > nearby pattern。若 plan 与 current source 的有效 owner 明显漂移，选择 current valid posture并记录 material deviation；若这会改变 acceptance/public boundary，停止回 plan。

## Thin-Glue Boundary

Thin glue 可以拥有：

- contract/representation translation；
- sequencing 与 orchestration；
- participant failure propagation；
- partial failure 的聚合、rollback/fallback/degradation routing；
- cross-step observability、trace/correlation 和 evidence aggregation；
- 明确的 safety/authorization boundary。

Thin glue 不拥有：

- duplicated domain truth 或新的业务 policy；
- participant 已拥有的 validation rule 的复制品；
- parallel durable state / second source of truth；
- 为了隐藏失败而吞掉 error、partial result 或 owner identity；
- 与协调无关的 convenience API 或 future-only option。

如果 wrapper 没有增加真实 translation、sequencing、safety 或 evidence/observability boundary，删除或不创建它。若 glue 开始决定领域规则、持久状态或最终 truth，应把行为移回正确 owner，或依据 plan 授权建立真正的新边界。

Compose 时至少能回答：

- 每个 participant 仍对什么 authoritative；
- glue owns / does-not-own 什么；
- 单个 participant 失败、多个 partial failure、timeout/retry 时如何传播；
- degraded path 对 caller 如何可见；
- 日志、metrics、artifact、reason_code 如何保留跨 seam 证据。

## Scope And Authorization Stop-Back

如果 active plan/task 没有授权新的 public API/contract、cross-module abstraction、schema/runtime/config surface、source-of-truth entry、workflow handoff、provider/repo boundary 或 generated runtime delivery，不在实现阶段临场设计。停止 mutation并返回：发现的 direct evidence、当前四姿态候选、为什么这会改变 scope/ownership，以及建议的 `spec-plan` / `spec-write-tasks` repair path。

“实现起来顺手”“以后可能复用”“行业通常这样做”不是 authorization。

## Material Deviation Note

只有当 recheck 改变 plan 的 material implementation direction、拒绝明显 overbuild、保留非显然 protected code，或选择 different owner/seam 时，记录 compact note：

- `question`
- `planned_posture`
- `current_posture`
- `existing_capabilities_inspected`
- `source_of_truth`
- `direct_evidence`
- `chosen_answer`
- `consequence`
- `limitations` / `deferred_reason`

普通 local edit 保持安静，不生成空矩阵或 ceremony note。

## Simplification At Phase Boundaries

在一个 behavior cluster / dependency wave 完成后，或进入 final review 前做一次；不要每改一行就抽 helper。先分类再行动：

| 分类 | 行动 |
| --- | --- |
| `remove-now` | 删除 current-run dead code、duplicate wrapper、unused file/import/test、speculative option，复跑同一 feedback loop。 |
| `minimality-debt` | 真实但 out-of-scope 的 debt 进入现有 `deferred_follow_up[]` / review residual / tracker sink，记录 title、reason、evidence、owner；不顺手扩大 scope，不新建 debt schema。 |
| `protected` | 保留 security、data integrity、privacy、a11y、observability、rollback、compatibility、required verification 或 confirmed owner constraint；缺口作为 `protected-gap` residual/review focus。 |
| `architecture-mismatch` | Plan 已授权的 wrong-layer/duplicate-owner/source-runtime 问题在 scope 内修；需要新架构决策则 stop-back。 |

Extract helper 不是默认答案。只有当 helper 有稳定 owner、当前重复语义、清晰 contract，且减少 coupling/duplication而不隐藏控制流时才提取。两段看起来相似但语义/生命周期不同的代码可以保持分离。

Simplification 不能删除 required check、error propagation、a11y state、observability breadcrumb 或安全边界来追求 LOC。也不能把当前 run 没造成的 broad debt包装成“cleanup”。

## Fallback And Claim Boundary

无法确认 owner、source-of-truth 或 architecture fit 时，不新增未授权 durable surface；使用现有最窄路径、返回 blocker/limitation并回 plan。Source contract tests只能证明这些 prompt anchors 存在，不能证明模型已稳定作出正确四姿态判断；fresh-source/host/field evidence缺失时按层声明。

Scripts 可以 inventory paths、读取 git、验证 schema/hash/containment；LLM 负责 owner fit、四姿态、thin-glue充分性、material deviation与 simplification语义判断。
