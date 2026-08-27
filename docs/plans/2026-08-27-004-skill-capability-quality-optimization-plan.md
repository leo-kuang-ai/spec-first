---
title: "Skill 能力质量优化提升方案"
type: skill-quality
status: reviewed-proposed
date: 2026-08-27
revised: 2026-08-27（Phase 4 三 agent 对抗性审查后按 findings 重排与修正）
plan_depth: deep
related:
  - docs/plans/2026-08-27-001-perf-skill-runtime-context-pilot-plan.md
  - docs/plans/2026-08-27-002-value-realization-and-governance-cost-optimization-plan.md
  - docs/plans/2026-08-27-003-top-3-optimization-priorities-analysis.md
  - docs/contracts/workflows/fresh-source-eval-checklist.md
  - docs/10-prompt/结构化项目角色契约.md
method: 多 agent 流水线（三路调查 -> 第一性原理+80/20 收敛 -> 草稿 -> 三 agent 对抗性审查 -> findings 回写重排）
evidence_basis: 主仓三路只读调查 + 调研机制提取 + 对抗性审查回源复核（全部行号/数字经独立 reviewer 复核）
consumers: Project owner（执行授权裁决）、后续 skill 修改 plan（引用其判据）、001 pilot 执行者（U2 fixtures 消费关系）
owner_decision_required: true
adversarial_review: completed（2026-08-27，三份 report-only 审查：架构治理 / 事实证据 / 可执行性；P1×5 全部处置，见 §9）
---

# Skill 能力质量优化提升方案（对抗性审查后修订版）

> 目标：提升 skill 执行质量，帮助研发高质量完成需求开发。本修订版按三份对抗性审查 findings 重排了优先级（SC-1 降级为证据门暂缓项）、撤销了草稿版不成立的"零新增 durable mechanism"边界声明、修正了全部事实口径。执行授权前需 owner 过 §9 裁决点。

## Goal Capsule

| 维度 | 决策 |
| --- | --- |
| 核心判断（审查后修正） | skill 执行质量的系统性短板集中在**可信变更四因子的"可核验证据"**：完成证据在链条前段断层（S9）、行为 eval 的 manifest 覆盖仅 2/37 且运行稀疏（S4）、intake 判据依赖 LLM 自觉（S6）。草稿版曾把"验收可判定性"列为质量源头居首——审查证实该缺口**远小于陈述**（R→AE fail-closed 追踪、Negative Acceptance、`Covers AE<N>` 约定已在仓内存在），已降级为证据门暂缓项。 |
| 总目标（重排后） | 三梯队落地：**第一梯队**（缺口确认+成本最小）：SC-4 intake 脚本化、SC-2b compound ref 必需 + 证据词表统一；**第二梯队**：SC-3 收窄版行为 eval 地板（5 个非 pilot skill + 消费 pilot U2 fixtures）；**证据门梯队**：SC-1 验收可判定性、SC-2a plan receipt——先做半天 PRD 工件抽样审计或等 003 Top 1 E2E / Top 3 trial 的真实痛点数据。 |
| durable mechanism 声明（替代草稿的"零新增"） | 本方案含 **5 项 skill-local 确定性补强**（§4 清单逐项判定），不新增通用 schema、不提前执行 002 §4.6 B 组通用协议族；但 skill-local receipt/词表/lint 是否属于"等 field 数据"范畴，**列为 owner 裁决点（§9-D1）**，不以格式论证自行豁免。 |
| 与既有计划关系 | 与 001（上下文因子）按**文件粒度**协调（仅 spec-plan/SKILL.md 真冲突）；与 003 兑现优先的关系增加**让位规则**（§6）：Top 3 trial 招募确认后，未启动的本方案项顺延至 trial closeout 后。 |
| 最大风险 | 执行带宽与 003 Top 1/2/3 竞争——以让位规则 + 三梯队独立可暂停控制。 |

---

## 1. 分析方法（多 agent 流水线）

```text
Phase 1  三 agent 并行只读调查（A 主仓现状 / B 调研机制 / C 核心 5 skill 结构抽样）
Phase 2  第一性原理（可信变更四因子）+ 80/20 收敛 -> 草稿（status: draft）
Phase 3  草稿落盘
Phase 4  三 agent 对抗性审查（fresh-source report-only）
         R1 架构治理：与角色契约/002 §4.6/003/B1-B9 一致性 -> P1×3, P2×4
         R2 事实证据：S1-S10 逐项回源 -> P1×0, P2×2, P3×4（行号/数字/commit 全过，eval 口径有误）
         R3 可执行性：80/20 与成本 -> P1×2, P2×4, P3×3（总裁决：砍一部分+重排）
Phase 5  findings 回写 -> 本修订版
```

## 2. 证据基线（审查修正后）

### 2.1 主仓现状（R2 复核通过，口径已修正）

| # | 事实 | 来源 |
| --- | --- | --- |
| S1 | 47 项 regressed capability 全部落在 13 个 removed-with-capability-loss 的**外围** skill（changelog、feature-video 等），核心链路五 skill regressed 均为 0；审计报告 926 行已被 commit `0e5f5fe8` 删除，可经 `git show d842a1f4:docs/项目审查/2026-07-27-current-vs-master-Skill能力审计报告.md` 恢复 | git 历史 |
| S2 | Claude 宿主确定性接线 hook 4 个，其中**真 block 能力仅 2 个**（prd-prewrite-guard PreToolUse、prd-readiness-guard Stop）；spec-plan-guard 自述 "best-effort attention reminder only"；session-start 无阻断语义；Qoder 3 个、Codex 仅 session-start（另有外部 graphify hook 不计入） | templates/claude/hooks/、.claude/settings.json |
| S3 | "loud convention / 未强制 / prose gate" 全仓 75 处；**gate inventory 不存在** | grep 取证 |
| S4 | fresh-source eval checklist 存在（advisory）；执行稀疏：spec-prd 15 次记录（6 passed / 1 passed-with-concerns / 8 not_run），spec-plan、spec-write-tasks、spec-compound 各 1 次 passed，其余 30+ skill 无记录 | docs/validation/ |
| S4b（口径修正） | **行为 eval 资产实际 15/37**：skill-up `eval.yaml` manifest 仅 2 个（spec-plan、spec-code-review），但 spec-prd 有 11 文件自研 eval 体系（run-evals.js + 111 case fixture，2026-07 报告全 pass）、spec-write-tasks 有 9 文件含 forbidden_signals/expected_decision 的 negative-case 纪律（即 witness 式纪律已在仓内存在）。真实缺口 = 无 manifest 且无 case 资产的 skill | skills/*/evals/ 清点 |
| S5 | 共享资产治理达标：SYNC_MAP 6 组 14 拷贝 + sha256 drift CI；11 组模板 25 文件有 A/B 档 skeleton-hash + B/C 档 frozen-hash 漂移测试 | scripts/sync-shared-references.js |

### 2.2 核心链路结构弱点（R2 行号复核通过；R3 增补 S11）

| # | 弱点 | 关键证据 |
| --- | --- | --- |
| S6 | intake readiness 判定普遍是 LLM 读 metadata 的 prose gate：spec-plan L131/138、spec-work L62-74 的 token 判据设计完好但由 LLM 自觉执行；spec-compound L586-596 前置条件显式 `enforcement="advisory"`；核心五 skill 中唯一入口脚本校验是 spec-code-review 的 task-context digest | 五 skill 抽样（行号经 R2 复核） |
| S7 | 验收标准的**语义可判定性**偏弱（注意：机械追踪层已部分存在，见 S11） | spec-prd SKILL.md ~L284（checker 自述只读 token 不判 load-bearing）、~L338-339（closeout 主体为计数）；spec-plan L84、L586 |
| S8 | hard exit 跨宿主强制不均：spec-prd gate 仅 Claude 有 confirmed hook，Codex/Cursor/Kiro 为 loud degraded prose | spec-prd L22/272-274 |
| S9 | 完成证据在链条前段断层：spec-work L258-276 与 spec-code-review L803-807 已有 command evidence 标准，spec-plan 完成无 script receipt，spec-prd grill trace/owner answer 自认 "host-provenance ceiling"（L280/284），spec-compound solved 前提 advisory | 五 skill 抽样 |
| S10 | 关键 schema 藏于 reference（DoD 在 plan-sections.md、promotion schema 在 schema.yaml），长会话后规则靠记忆重建 | 五 skill 抽样 |
| S11（R3 新增，削弱草稿 SC-1） | **验收追踪的机械 floor 已部分建成**：spec-prd 有 `requirement_acceptance_trace_missing`/`acceptance_example_row_missing` 的 **fail-closed 阻断**（prd-output-template.md ~L71）、`## Negative Acceptance` 独立 section、Goals/Success Metrics observable-signal 纪律；spec-plan L586 已有 "**AE-link convention:** prefix it with `Covers AE<N>.`" 的 PRD→plan criterion-id 追踪约定。SC-1 的真实净增量 = EARS 风格化、启发式可判定性 lint、禁 unit→unit 互指、closeout 三态覆盖声明 | R3 回源 |
| S12（R3 新增） | 无任何"验收不可判定 → 返工/质量事故"的 incident 记录；docs/solutions/ 与 docs/validation/ 检索为空——S7 是结构观察，不是已证实的事故源 | R3 回源 |

### 2.3 业界机制参照（R2 降格后）

上表机制（quoin spec-matrix/row_id/先 grounding 后生成、trellis 退出码绑定/证据与 prose 分离、witness coverage anchors、spec-kitty retrospective、adobe 声明与执行分层）均为**调研报告的 A 级静态源码证据——表明机制已被工程化实现，但原报告未运行任何目标仓库测试/eval，机制运行有效性 not-run**。引用它们时按"源码级实现证据"分级，不得表述为"业界已验证"。

## 3. 第一性原理分析（审查后校准）

skill 执行质量 = 清晰意图 × 有效上下文 × 有界执行 × 可核验证据（角色契约公式在 skill 边界的映射）。四因子实现度：

| 因子 | 实现度 | 证据 |
| --- | --- | --- |
| 清晰意图（intake） | 中 | S6 |
| 有效上下文 | 低→001 pilot 改善中 | F3（本文档不重复处理） |
| 有界执行 | 低且跨宿主不均 | S2/S8 |
| **可核验证据** | **最低且链条断层** | S9 + S4/S4b（manifest 2/37、运行稀疏） |

**审查后校准的推理**：最大乘数损失仍在证据因子，但草稿版"验收是质量源头"的第二推理被 S11/S12 削弱——验收的机械追踪 floor 已部分存在，语义可判定性缺口是**结构观察 + 业界源码级类比**（advisory 级），不是 confirmed 事故源。因此证据因子内部的优先序应为：**已证实缺口（S4/S6/S9 的 compound 前提）先做，想象缺口（S7 语义层）设证据门**——这正是本仓"advisory 不当 confirmed"纪律对方案自身的要求。

## 4. 80/20 裁决（R3 重排后）

### 4.1 durable mechanism 显式清单（替代草稿"零新增"声明）

| # | 机制 | 判定 | Build/Wrap 依据 |
| --- | --- | --- | --- |
| M1 | SC-4 intake-facts 脚本（**扩展现有 lint 优先，新脚本次之**） | 算 skill-local 确定性补强 | Wrap：既有判据规则换执行载体；扩展现有 owner 符合 001 R14 纪律 |
| M2 | SC-2b compound confirmed-ref 判据 | 算（advisory→机械 gate） | 最可辩护：兑现 AGENTS.md 已声明的 knowledge promotion 硬 gate，属 implementation gap 补齐 |
| M3 | SC-2b 三态证据词表进 _shared | 算（弱）：SYNC_MAP 第 7 组 | Thin：prose convention + sync 管控 |
| M4 | SC-3 eval manifests + cases | **不算**：既有 skill-up/evals 框架下的内容补齐 | — |
| M5 | SC-1 可判定性 lint / SC-2a plan receipt 脚本 | 算（若证据门通过） | 需新脚本（2-4 天）——**这正是 B 组裁决关心的模式，随证据门一并呈 owner** |

### 4.2 workstream 裁决表（重排后）

| 梯队 | 项 | 裁决 | 80/20 依据 |
| --- | --- | --- | --- |
| 一 | **SC-4** intake 脚本化 | 做 | 唯一"缺口 confirmed + 成本最小 + 确定性最高"三项全满足（S6 判据 100% 已存在） |
| 一 | **SC-2b** compound ref 必需 + 证据词表 | 做，可与 pilot 并行（零文件冲突） | knowledge promotion 是五类合法硬 gate 之一，advisory 前提是 confirmed 缺口；成本 1-2 天净新增（R3 修正：validate-doc-claims.py 需新增位置约定 + ref 类型分类 + gate 接线，非翻转开关） |
| 二 | **SC-3** 行为 eval 地板（收窄版） | 做：首批 5 个非 pilot skill（spec-prd、spec-compound、spec-write-tasks、spec-debug、spec-work）；spec-plan/spec-code-review 改为**消费 001 pilot U2 的 eval-context fixtures**，不另建 | 7 个 skill（19%）覆盖研发主线 >80% 路径；对 spec-prd/spec-write-tasks 是既有资产的 manifest 化（S4b），非从零写 |
| 证据门 | **SC-1** 验收可判定性 | 暂缓 + 证据门：半天 PRD 工件抽样审计（docs/prds/ 近期产物的验收条目可判定率），或等 003 Top 1 E2E 摩擦清单 / Top 3 trial 数据 | S11/S12 削弱缺口 claim；净增量小于草稿陈述；advisory 级排序依据不得当 confirmed |
| 证据门 | **SC-2a** plan receipt | 暂缓 + 同门：还需一起"plan 完成声明造假/失控"的 incident 或 trial 证据；`skills/spec-plan/scripts/` 为空，照抄 spec-prd 模式需新写脚本（R1-P1-3 / R3-P2-1） | 无 confirmed 痛点 + 最大单项成本 |
| 不做 | 47 项外围能力恢复 / 全宿主 hook 覆盖 / 模板参数化合并 / B 组协议族 | 维持既有裁决 | 见 002/003 |

## 5. Workstreams（最终版）

### SC-4 intake 校验脚本化（第一梯队）

- **机制**：扩展现有 `lint-skill-entrypoints` 或新增只读脚本（**裁决：优先扩展既有 owner**），输入上游 artifact 路径，输出 token 事实（`artifact_readiness`、`status`、requirements-only 判定、digest 可得性）+ 违规清单；spec-work/spec-plan 入口 prose 改为"先跑校验**并**把结果记入 run artifact，无脚本时按脚本口径人工判定并记录 `intake-check: manual-degraded`"（堵 R1-P3-1 的 or 分支逃生口）。只报事实不阻断（gate the exits）。
- **多宿主声明**：脚本对所有宿主同等可用（CLI 层，非 hook）；prose 记录要求在无 hook 宿主为 loud convention，按 AGENTS.md 显式声明未强制。
- **成本**：1-2 天；unit tests + 既有 contract tests 回归。
- **体量预算**：spec-work/spec-plan 入口 prose 净增量目标 ≤ 10 行（receipt 行替代现有 prose 判据描述，净变化趋零）。

### SC-2b 完成证据：compound ref 必需 + 三态词表（第一梯队）

- **机制**：(1) spec-compound 的 `problem_solved/solution_verified` 升级为"promotion gate 必须引用一个 confirmed 证据 ref"——合法来源：verification-run-summary、spec-work honest closeout verdict、PR/CI 链接；实现上 validate-doc-claims.py 需新增 ref 位置约定 + ref 类型分类 + gate 接线（R3-P2-2 修正后的真实成本 1-2 天）；conversation 自报不再单独充分（其 L418 本就拒绝 transcript 声明，此处补正向替代）。(2) verified（exit code/log/receipt）/ reported（LLM 判定）/ not-run 三态词表进 `_shared`（SYNC_MAP 第 7 组），各 skill closeout 字段消费同一词表。
- **多宿主声明**：promotion gate 机械判据在脚本层对所有宿主一致；closeout 字段的填写在无 hook 宿主为 loud convention。
- **成本**：1-2 天 + sync/CI 接线；contract tests。
- **B 组边界**：M2/M3 已列入 §4.1 清单随本方案呈 owner（§9-D1）；不以"非通用 schema"自行豁免时序裁决。

### SC-3 行为 eval 地板·收窄版（第二梯队）

- **范围**：首批 5 个非 pilot skill；spec-prd/spec-write-tasks 以既有资产 manifest 化为主（S4b：111 case fixture、forbidden_signals 纪律转 skill-up 格式或注明双轨）；spec-compound/spec-debug/spec-work 从最小集起步（每 skill：≥1 gold + ≥1 negative（断言拒绝行为+原因，防 findings:[] 不可证伪）+ 1 边界 fallback）。
- **与 pilot 的消费关系**：spec-plan/spec-code-review 的回归地板由 001 pilot U2 的 `eval-context-development/holdout` manifests 承载（pilot 已规划），本方案不重复建设；pilot 失败回滚时，这两个 skill 的回归地板缺口重新评估。
- **运行率而非存在率**（R1-P2-4）：判据为"每次 skill prose 变更的 eval 运行/豁免记录率 100%"（消费 fresh-source checklist 既有节奏），而非仅有 manifest。
- **失败回流**（spec-kitty 轻量版）：003 Top 1 E2E / Top 3 trial 暴露的 skill 行为缺陷，转化为 negative case 后才可关闭对应修复。
- **成本**（R3 修正）：真实估计 4-8 人日 + 持续维护；第一批仅冻结清单，case 落地在第三梯队窗口。
- **触发绑定**：全量 case 落地绑定触发条件——Top 1 E2E 实际暴露的行为缺陷 ≥3 处，或 pilot U3/U4 重构进入实施（重构需要地板）。未触发则维持最小集。

### SC-1 验收可判定性 + SC-2a plan receipt（证据门梯队，暂缓）

- **证据门**（任一满足即重评）：① 半天 PRD 工件抽样审计显示近期产物验收条目可判定率显著低（操作定义：抽 3 份近期 PRD，验收条目含 Given/When/Then 或 EARS 结构的比例 <50% 且 closeout 无补偿机制）；② Top 1 E2E 摩擦清单或 Top 3 trial 出现验收歧义类返工；③ 出现一起可回源的 incident。
- **过门后的净增量**（S11 修正后）：EARS 风格约定、check-prd-artifact 可判定性 lint（advisory finding，启发式不进保证区）、Traces-To 禁 unit→unit 互指、closeout 三态覆盖声明；SC-2a 为新写 plan finalize/receipt 脚本（2-4 天，R3-P2-1）。
- **体量预算**（R1-P2-3）：任何过门实施必须附入口 bytes 与 artifact 结构增量估算（F1 教训：小扩容实测 +27%），并与 S10（schema 藏于 reference）的对冲关系说明。

## 6. 与 001/003 的协调（文件粒度 + 让位规则，修正版）

1. **文件冲突面**（R3 核算）：真正与 pilot U3/U4 冲突的仅 `skills/spec-plan/SKILL.md`（SC-1 过门部分）与两个 pilot skill 的 evals 目录（已由 SC-3 消费关系解决）。SC-4（spec-work 部分）、SC-2b 全部、SC-3 的 5 个非 pilot skill **零文件冲突，不被 pilot 阻塞**——草稿的 blanket 串行废除。
2. **pilot 分支处理**：pilot rollback / no-change-after-audit 时，"重构后 reference 结构"不存在——SC-1 过门实施基于 rollback 后的现行结构（旧结构仍是合法靶面），仅在 pilot 成功时优先进入新结构。
3. **让位规则**（R1-P2-1）：003 Top 3 trial 招募确认后，本方案未启动的项顺延至 trial closeout 后；Top 1 E2E 期间仅 SC-4 可并行（量最小）。
4. 排序总纲：003 Top 1 > Top 2（pilot）≥ 本方案第一梯队 > Top 3 前置 > 本方案第二梯队 > 证据门梯队。

## 7. 风险与反模式

| 风险 | 缓解 |
| --- | --- |
| 与兑现优先争带宽 | §6 让位规则；每梯队独立可暂停 |
| manifest 齐备但运行稀疏（重演 S4） | SC-3 判据是运行记录率而非存在率；触发绑定防止空转扩产 |
| 新 gate 稀释 loud convention 信号 | 每个新 gate 附多宿主强制矩阵声明（§5 各 SC 内嵌） |
| SC-1/SC-2a 证据门形同虚设 | 门条件可证伪（抽样比例、incident 可回源），未过门不进入授权 |
| 后续修订漂移（advisory 变阻断、成本预算被删） | §5 的 advisory-not-blocking 设计与体量预算在本文档锁定（R1-P3-4），修订需重新过 owner |

## 8. 成功判据

| 判据 | 类型 | 目标 |
| --- | --- | --- |
| intake 确定性 | 结构 | SC-4 脚本覆盖 spec-work/spec-plan 判据，结果入 run artifact |
| compound promotion 证据 | 结构 | confirmed ref 为机械必需；三态词表进 _shared 并被 closeout 消费 |
| 行为 eval | 结构+运行率 | 5 个非 pilot skill 有最小集；prose 变更的 eval 运行/豁免记录率 100% |
| SC-1/SC-2a 证据门 | 流程 | 门条件被显式评估（抽样审计执行或显式等待 E2E/trial） |
| 本方案文档自身 | 诚实 | 按 fresh-source checklist 归类 `N/A`（docs-only plan，不在 skill prose 触发范围——R3-P2-4 修正：草稿的 dogfood 判据不可执行，删除） |

## 9. 对抗性审查结论与处置

三份 report-only 审查（advisory，不构成行为评估证据）的关键 findings 与处置：

| Finding | 级别 | 处置 |
| --- | --- | --- |
| R1-P1-1 "零新增 durable mechanism"不成立 | P1 | ✅ 撤销总声明，改 §4.1 显式清单（M1-M5）逐项 Build/Wrap 判定 |
| R1-P1-2 SC-2 规避 B 组时序裁决 | P1 | ✅ M2/M3/M5 随 §9-D1 呈 owner 裁决，不以格式论证自行豁免 |
| R1-P1-3 SC-2.1"既有校验"不可回源 | P1 | ✅ SC-2a 降入证据门；如实标注需新写脚本（2-4 天） |
| R3-P1-1 SC-1 证据不足居首 | P1 | ✅ SC-1 降为证据门梯队；§2 增补 S11/S12 |
| R3-P1-2 blanket 串行自设阻塞 | P1 | ✅ §6 改文件粒度协调 + pilot rollback 分支 |
| R1-P2-1 带宽让位缺失 / R1-P2-2 多宿主声明缺失 / R1-P2-3 体量预算缺失 / R1-P2-4 manifest≠运行率 | P2 | ✅ 分别以 §6 让位规则、§5 各 SC 内嵌声明、§5 体量预算行、SC-3 运行率判据处置 |
| R2-P2-1 eval 口径（35/37 混淆资产与 manifest） | P2 | ✅ S4b 修正；SC-3 对 spec-prd/spec-write-tasks 改为资产 manifest 化 |
| R2-P2-2 "业界证明可工程化"过度 | P2 | ✅ §2.3 降格为"源码级实现证据，运行有效性 not-run" |
| R3-P2-1/2 成本低估（receipt 脚本、doc-claims 扩展） | P2 | ✅ §5 如实标注 2-4 天 / 1-2 天净新增 |
| R3-P2-4 dogfood 判据不可执行 | P2 | ✅ §8 改为 N/A 归类说明 |
| P3 级（行号漂移、session-start 非 block、git show 完整命令、skill 数口径 36 canonical） | P3 | ✅ §2 全部修正 |

**遗留 owner 裁决点**：

- **D1**：skill-local 确定性补强清单（M1-M3 立即、M5 随证据门）是否允许在 003 Top 3 field trial 数据之前落地，还是与 002 §4.6 B 组同批等待——本方案建议 M1/M2/M3 放行（缺口 confirmed + 兑现既有声明的硬 gate）、M5 等门，但裁决权在 owner。
- **D2**：SC-3 的 4-8 人日投入与 003 Top 3 trial 的时间竞争（若 trial 先行，SC-3 可压缩为首批最小集）。

## 10. 验证声明

本方案基于：三路只读 agent 调查 + 三份对抗性审查回源复核（S 系列事实经 R2 独立复核全部通过；行号以 2026-08-27 工作树为准；skill 数口径 36 canonical bundled + 1 symlink，见 001）。业界机制为调研报告转述（原文自标 A 级静态源码证据、运行验证 not-run，经 R2 核实）。三份审查为 advisory，其回源事实（如 `skills/spec-plan/scripts/` 为空、S11 既有追踪机制）已直接采信并改变方案结论。未执行：任何 source 修改、测试运行、eval 运行、runtime refresh。执行授权需 owner 过 §9 D1/D2。
