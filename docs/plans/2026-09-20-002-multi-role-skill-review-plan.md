# 多角色 Skill 审查方案 v1

- **observed_at**: 2026-09-20 14:30 (Asia/Shanghai)；`source_head: 36d19d95`；`worktree_state: dirty`
- **角色**: 项目负责人（`docs/10-prompt/项目负责人工作契约.md` §5 专家协作范围的操作化）
- **姊妹方案**: [`2026-09-20-001-skill-up-eval-program-plan.md`](./2026-09-20-001-skill-up-eval-program-plan.md)（行为层，T0–T3）

## 0. 结论先行

多角色审查的编排模式**在本仓已被验证，缺的是把它应用到「审查对象 = 本项目自身 38 个 skill」这一元层任务的方法成文**：

- `spec-code-review` 已有一套成熟多角色编排：14+6 personas 分层（always-on + conditional）、`persona-catalog.md` / `select-and-route.md` 选取路由、findings schema（P0–P3 + confidence anchors）、dispatch 授权门与 inline 降级、「未执行的角色不算独立覆盖」纪律——**这是可复用的编排骨架**。
- 2026-09-02 dual-agent 深度测评已做过一次双角色实践（A 组行为实证 × B 组评测资产治理，38 skill 全覆盖，产出真实缺陷：engine 硬编码、零断言 case、autoresearch 边界倒置）——**这是可复用的先例与预算锚**。
- 全量轮（09-03 summary）的 14 个真实缺陷几乎全部是路由/越界/收编类——**多角色中对抗与路由视角是历史命中率最高的角色**。

本方案定义：六个审查角色的 charter、独立性与授权纪律、按风险分层的角色组合矩阵、`review-finding.v1` 输出契约、汇总与冲突规则、处置闭环，以及与 U9（审查方案 v2）/ skill-up 测评方案的接线。**U9 拥有「审什么、覆盖到哪、receipt 交什么」；本方案拥有「怎么审——角色、独立性、汇总」**；skill-up 测评方案拥有行为层客观证据。三层互补，不互相替代。

## 1. 可复用资产（不新建）

| 资产 | 位置 | 复用方式 |
|---|---|---|
| persona 编排骨架 | `skills/spec-code-review/references/{persona-catalog,select-and-route}.md` + `personas/` | 角色分层（always-on + conditional）与 spawn 纪律的模板 |
| findings 契约 | `docs/contracts/workflows/review-finding.md`（envelope）+ `skills/spec-code-review/references/findings-schema.json`（P0–P3 anchors） | 输出格式，本方案只加 `extensions` |
| 独立性纪律 | `docs/contracts/workflows/fresh-source-eval-checklist.md`（passed/concerns/not_run/N/A 词表） | 每角色运行的独立性与诚实记账 |
| 派发授权 | `docs/contracts/workflows/worker-dispatch-capability.md`（六授权事实） | 角色 = fresh generic subagent + charter 注入，只读 |
| 质量底线 | `docs/contracts/workflows/skill-agent-quality-governance.md`（Skill Minimum Contract v1、High-risk Safety Contract） | R2/R3 的必查清单 |
| 盲评裁决 | 全量轮 paired ×3 实践（13 轮 3-0 keep 先例） | 修复后 keep/revert 裁决 |
| 预算锚 | dual-agent 报告（2 角色 × 38 skill 单日完成）；审查方案 v2 KTD8（L/M/S 档） | 批次预算定档 |
| 角色定义域 | 项目负责人契约 §5 七域专家表 | 角色 charter 来源（收敛为 6） |

## 2. Goals / Non-goals

**Goals**

- G-1: 为本项目 38 个 skill 的语义审查提供**注意力分账**的多角色方法——不同角色不同盲区，替代单 reviewer 单 checklist 的注意力瓶颈。
- G-2: 把「独立视角」从口号变成可记账事实：每角色 fresh-source、只读、带 provenance/freshness/limitations 标注，未执行的记 `not_run`。
- G-3: 定义汇总与冲突规则，防止「多角色一致」被误用为证据升级。
- G-4: 与 U9、skill-up 测评方案双向接线：R4 角色产出的 eval 缺口直接进测评方案批次；U9 执行时可直接复用本方法。

**Non-goals**

- 不新建 persona 文件库（角色 charter 以任务包注入，不预置 `references/` 资产；待某角色复用 ≥3 次再考虑沉淀——80/20）。
- 不做 38 × 6 全量角色覆盖（分层矩阵，见 §5）。
- 不替代 U9 的 receipt 契约与覆盖裁定，不替代 skill-up 的行为实测。
- 不做多模型 peer 交叉（cross-model adversarial 属 spec-code-review Stage 4 能力，本方案角色保持同宿主 fresh subagent；多模型交叉列为可选增强，需独立预算）。

## 3. 角色集（6 角色，charter 制）

每个角色 = 一份自包含 charter（职责 / 必查问题 / 证据要求 / 历史缺陷锚），注入 fresh generic subagent。charter 差异化是反「角色剧场」的硬要求。

| 角色 | charter 要点 | 必查问题 | 历史缺陷锚（仓内存档实证） |
|---|---|---|---|
| **R1 路由与边界**（always-on） | trigger/non-trigger 精度、排除语义完整性、入口唯一性 | 「Not for X」是否带目的地？同形输入（审查≈挖规则≈打磨）会不会被收编？description 排除句与正文 Phase 0 是否双层落点？ | 全量轮 14 缺陷中 11 个为路由/收编类（#2–#5、#9、#13 六连等）；结构性残留集中在同形输入边界 |
| **R2 契约与权威** | source/runtime 边界、五类硬 gate 声明诚实度、授权边界、claim ceiling | SKILL.md 是否把 advisory 写成 confirmed？是否承诺 hard-enforced 但缺 blocking primitive（应降级 loud convention 并声明）？Skill Minimum Contract v1 七字段是否可判定？ | autoresearch source/runtime 边界倒置（dual-agent 第五部分）；FSA2/FSA3 多项 gate 强度误述 |
| **R3 流程完备性**（always-on） | phase 分支闭合、错误/降级/停止/恢复路径、引用闭包、输出 consumer | 每个分支有无出口？失败是降级还是静默？引用文件是否全部存在且被条件加载？产物谁消费？ | U9 逐项清单同源；dual-agent B 组 references 抽查发现空引用 |
| **R4 证据与断言** | SKILL.md 内 claim 与证据匹配、eval case 覆盖质量、done signal 可判定性 | 声明的验证是否可复跑？eval 是否存在零断言 case（跑过≠测过）？覆盖缺口在哪（对照 dual-agent P1 清单）？ | spec-promote 零断言 case、spec-product-pulse 单 case 覆盖缺口（dual-agent B 组） |
| **R5 多宿主投影** | 8 宿主投射保真、degraded/lossy 标注、runtime 强制能力诚实 | 该 skill 的 gate/行为在弱宿主是否 lossy 且已标注？投射是否语义保真而非 feature parity 幻觉？ | 契约「跨宿主投射不承诺 parity」条款的逐 skill 落实核查（FSA2 R-11/R-12 类） |
| **R6 对抗**（always-on） | 注入、用户施压、越权副作用、eval 安全 | 材料内嵌指令是否被当授权？「直接发布不用问我」能否击穿 admission？发布类 skill 的副作用是否锚文件系统？ | spec-lfg「发布+不用问我」失守（引发 eval 安全守则）；plan/work「用户施压击穿」双例 |

**分层规则**（复用 persona-catalog 模式）：R1/R3/R6 为 always-on（历史命中率 + 通用风险）；R2/R4/R5 为 conditional——R2 对 gate owner 与高风险面必开，R4 对有 evals/ 的 37 skill 必开，R5 对投射面广（workflow_command / 全宿主 skill）必开。

## 4. 独立性与授权纪律

对齐项目负责人契约 §5 硬约束与三项契约：

1. **Fresh-source**：每角色审查当前磁盘 `skills/` source（含未提交变更，如实标注 dirty）；禁止读 runtime mirror，禁止依赖会话缓存定义（fresh-source-eval-checklist Source Boundary 节）。
2. **只读派发**：按 worker-dispatch 契约，六授权事实中 mutation=forbidden、无受限读取/外发/凭证/外部通信；task packet 自包含（目标、scope、证据 refs、要回答的问题、必须标注的不确定项）。
3. **诚实记账**：dispatch 不可用 / 未授权 / 显式禁用 helper 时，记 `fresh_source_eval: not_run` + 原因，可退化为 inline 单角色审查但覆盖面如实缩窄——「未执行的角色不算独立覆盖」。
4. **Advisory 性质**：角色产出是候选分析；进入 disposition 前必须回源确认。多角色一致**不升级** claim，升级只能来自新证据。作者自检与新建 subagent 均须记录是否继承作者推理、是否 fresh-read。
5. **签名要求**：每角色产出标 `provenance`（读了哪些文件/diff）、`freshness`（observed_at + source_head）、`limitations`（抽查级/全文级）、`evidence_scope`（E1/E2）。

## 5. 角色组合矩阵与预算

| 层 | 对象 | 角色组合 | 规模估算 |
|---|---|---|---|
| **Tier 1** | 审查方案 v2 Batch A 五 gate/readiness owner：`spec-work` `spec-code-review` `spec-runtime-setup` `spec-compound` `spec-handoff` | 全 6 角色 | 30 次角色审查 × 15–30 min ≈ **8–15 h** |
| **Tier 2** | Batch B 11 个核心 workflow/入口 | R1+R3+R6 + conditional（workflow 类加 R2，有 evals 加 R4） | ≈ 40–50 次 × 15–25 min ≈ **10–20 h** |
| **Tier 3** | C1/C2 共 22 个（mutation/外部副作用优先） | R1+R6；R3 按 KTD8 S/M 档抽样 | ≈ 50 次 × 10–20 min ≈ **8–17 h** |

- 预算锚：dual-agent 单日完成 2 角色 × 38 skill（含 skill-up 实测）；本方案纯静态审查不跑模型，单位成本更低，但角色数×独立性要求抵消部分。
- **不承诺一次跑完三层**：Tier 1 为 pilot，跑完校准单位成本与 finding 密度后再决定 Tier 2/3 排期（对齐审查方案 v2「承诺 + not-run receipt」模式）。
- 触发时机：① U9 Batch 执行时直接复用本方法；② 重大 skill 变更批次合入后（如 FSA 修复级）；③ 周期计划排期。

## 6. 输出契约

沿用 `review-finding.v1` envelope（severity/category/evidence/impact/recommendation/confidence/residual_status），增加 `extensions`：

```json
{
  "extensions": {
    "review_run": "mrr-2026-XX-<target>",
    "role": "R1-routing | R2-contract | R3-flow | R4-evidence | R5-projection | R6-adversarial",
    "target_skill": "<skill-name>",
    "evidence_scope": "E1 | E2",
    "charter_version": "v1",
    "freshness": { "observed_at": "…", "source_head": "…", "worktree_state": "clean | dirty" },
    "coverage_note": "全文级 | 抽查级(范围说明)"
  }
}
```

硬规则：severity 用 P0–P3 anchors；**零 evidence 的 finding 不入库**（每条至少一条 path/anchor）；`residual_status` 初始 `unresolved`，处置后更新。

## 7. 汇总与冲突规则

1. 按 evidence anchor 去重合并；同主题多角色 finding 保留各自 confidence，**不平均、不投票**。
2. 角色间矛盾（如 R1 判收编、R3 判合法分支）：记为 open question，由项目负责人裁决或升级 owner；不得静默取舍。
3. 汇总产物三件套：findings 集（envelope）、覆盖矩阵（角色 × skill × passed/concerns/not_run）、未完成记账（四项：已完成/未完成/为什么/重估条件）。
4. 汇总人不得替角色补证据；汇总新增的观点必须标注为汇总人自身判断（advisory）。

## 8. 处置闭环（与测评方案接线）

```text
findings → 分型四类 → 各自出口
  ├─ skill 行为缺陷 → 修 SKILL.md（最小 diff，双层落点）
  │     → paired ×3 独立盲评（3-0 keep）
  │     → T1 单引擎回归 + 双引擎交叉（测评方案 §5 流程）
  │     → runtime MIRROR-SYNCED + CHANGELOG
  ├─ eval 覆盖缺口（R4 主产）→ 新 case 进测评方案 P-A/P-B 批次
  ├─ docs/契约缺陷 → docs 修复（按 docs-only 小任务分级）
  └─ 治理级缺口（角色 charter 覆盖不了的）→ 记 gap，owner 裁决
```

修复后的 skill 进入测评方案新鲜度声明循环（`drift: changed(untested)` → 回归后 `clean`）。

## 9. Anti-patterns（禁止）

- **角色剧场**：无 charter 差异化的多角色 = 换名字的同视角；charter 必查问题必须互斥或互补。
- **共识洗白**：用「6 个角色都同意」替代证据；共识不是证据升级路径。
- **无证据 finding**：印象、风格偏好、未回源的推测一律不入 findings。
- **预算爆炸**：默认 38 × 6；必须走分层矩阵 + pilot 校准。
- **审错对象**：审 runtime mirror、审会话缓存定义、把 09-02 历史绿灯当当前证据（36/37 skill 已 `changed(untested)`）。
- **角色越权**：审查角色只读不修；修复走处置闭环，不在审查 task packet 内顺手改。

## 10. 与既有轨道的关系

| 轨道 | owns | 与本方案关系 |
|---|---|---|
| 审查方案 v2 U9 | 审什么 / 覆盖裁定 / receipt 契约 | 本方案是 U9 的执行方法层；U9 Batch A/B 执行时可直接以本方案角色编队，receipt 照 U9 schema 出 |
| skill-up 测评方案 v2 | 行为层客观证据（T0–T3） | R4 产出的 eval 缺口进其批次；其红灯分型 B（skill 缺陷）可触发本方案 R1/R6 定向复审 |
| cycle-1 B3 | 收益假设 / field 层 | 无重叠；本方案 findings 不做收益 claim |
| spec-code-review（产品 skill） | 代码 PR 审查 | 本方案复用其编排模式，但不复用其 personas（对象不同：审 skill 文本而非代码 diff） |

## 11. 已执行 / 未执行声明

**已执行（方案设计过程）**：可复用资产全部回源核实（persona-catalog / select-and-route / review-finding / fresh-source-eval-checklist / worker-dispatch / skill-agent-quality-governance / dual-agent 报告 / 全量轮 summary）；历史缺陷锚逐条对应仓内存档；预算锚取自 dual-agent 实测与 KTD8 档位。

**未执行**：任何角色派发与审查运行（pilot Tier 1 列为批次，需 dispatch 授权与排期）；charter prompt 文件编写（pilot 启动时随首跑产出）；与 U9 的批次合并决策（待 U9 排期后由 owner 裁决）。本方案是方法设计，不构成任何 skill 的审查通过声明。
