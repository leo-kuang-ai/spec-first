---
title: "Top 3 优化优先级分析"
type: strategy
status: proposed
date: 2026-08-27
plan_depth: standard
related:
  - docs/plans/2026-08-27-002-value-realization-and-governance-cost-optimization-plan.md
  - docs/plans/2026-08-27-001-perf-skill-runtime-context-pilot-plan.md
  - docs/strategic-review/2026-08-02-executive-summary.md
  - /Users/kuang/xiaobu/spec-first-doc/业界调研/2026-08-05/reports/01-spec-first-baseline.md
  - /Users/kuang/xiaobu/spec-first-doc/业界调研/2026-08-10/reports/witness.md
  - /Users/kuang/xiaobu/spec-first-doc/业界调研/2026-08-04/reports/boundary-bench.md
evidence_basis: 2026-08-27 短板调查 + spec-first-doc/业界调研 二次深挖（08-05 基线复查、08-10/08-16/08-17 竞品与基准报告、repos/ 约 250 仓库清单、发版状态核实）
owner_decision_required: true
---

# Top 3 优化优先级分析

## Goal Capsule

| 维度 | 决策 |
| --- | --- |
| 结论 | spec-first 当前最需要优化的 Top 3：**① 自证闭环（发版 + 真实宿主 E2E）② 运行时上下文成本收敛（诚实执行既有 pilot）③ 外部第一证据（借基准语义设计的 field trial）**。三者分别对应三条 confirmed 短板：自证未过、成本超标、外证空白。 |
| 方法 | 候选池（12 项）× 四维判据（短板杠杆 / 证据强度 / 90 天可完成性 / 时机依赖）统一裁决，落选项全部写明理由与去向。 |
| 新发现的裁决点 | 调研侧基线（08-05 版）已向「receipt 协议族」深化设计，与主仓「兑现优先」形成两条半拍方向——**需要 owner 一次性裁决，防止设计侧与执行侧再次分裂**（见 §4）。 |
| 与 002 方案关系 | 本文档是 `2026-08-27-002` 五 workstream 的执行优先级锐化：Top 1 = WS1a，Top 2 = WS2，Top 3 = WS1b；不替代 002，落选项（WS3/WS4/WS5）按原节奏推进。 |

---

## 1. 分析方法（可复现）

1. **补盲区**：读取 08-01~08-05 基线滚动复查（确认为逐日增量而非重复）、08-16/08-17 最新竞品复查（openspec/quoin/trellis/gsd-pi/spec-kitty）、08-10/08-04 基准视角项目（witness/boundary-bench）、repos/ 清单（约 250 个克隆仓库）。
2. **建候选池**：合并三个来源的全部优化候选——002 方案五 WS、调研建议的 A/B/C 组机制、07-31/08-05 基线的 Q1-Q5 决策问题、F1-F12 事实。
3. **四维裁决**：短板杠杆（对「自证未过 / 成本超标 / 外证空白」哪一条起作用）、证据强度（confirmed 优先）、90 天可完成性（依赖与成本）、时机依赖（不做它是否阻塞其他项）。
4. **事实核实**：发版状态（package.json = npm latest = 1.15.1，CHANGELOG 积压 **35 条 v1.15.2 未发版条目**）、pilot 状态（`status: active`，`worker_dispatch_authorization: missing`——计划就绪、执行未启动）。

## 2. 候选池与裁决表

| 候选 | 来源 | 裁决 | 理由 |
| --- | --- | --- | --- |
| **① 自证闭环（发版+E2E）** | 002/WS1a；F9/F10 | **Top 1** | 见 §3.1 |
| **② 上下文成本收敛（pilot）** | 002/WS2；F1/F3 | **Top 2** | 见 §3.2 |
| **③ 外部 field trial** | 002/WS1b；F7/F12 | **Top 3** | 见 §3.3 |
| 宿主矩阵收缩（WS4） | 002；F4；07-31 基线 | 落选但并入 Top 1 | 减负项而非产证项；其释放的维护预算恰是 Top 1/3 的投入来源；矩阵盘点（纯调查）在 Top 1 的 Day 0-14 窗口并行完成，正式决策仍按 002/WS4 走 owner 授权 |
| 定位改写 + 5 分钟路径（WS5） | 002；四方收敛 | 落选，排后 | 消费 Top 1 摩擦清单与 Top 3 trial 数据才有材料；提前做只能产生无证据 claim |
| docs retention 收敛（WS3） | 002；F2/F6 | 落选，自走 | 结构卫生，不阻塞任何项，按 002 节奏独立推进 |
| Receipt 协议族（ContractReadinessReceipt 等 5 种） | 08-05 基线 §4 | 落选，显式裁决 | 08-05 基线（调研侧）已设计到具体名词，但全部未进主仓、无外部 consumer 证据；维持 002 §4.6 B 组裁决：待 Top 3 产出 field 数据后重评。**方向冲突需 owner 裁决（§4）** |
| 独立 read-only verify 入口 | 07-31 Q2；spec-kit 复查 | 落选，记录 | 唯一可能破例的下一周期候选（002 已列 owner 裁决点）；触发条件 = Top 3 证明外部需要独立消费证据层 |
| Spec↔code 对账 / PASS-FAIL-UNVERIFIABLE 边 | trellis 调研 | 落选，记录 | 触及「证据绑定源码真实状态」的深层差距（witness 对比确认 spec-first 弱于此），但属新增能力，排 Top 2 完成后的候选 |
| Witness 式 sha-bound 硬门 | witness 调研 | 落选，部分吸收 | witness 自评「state/motion 比 spec-first 硬」但承认 spec-first 的 honest closeout/knowledge promotion 更强；其 Reviewer Coverage Anchors（clean verdict 也需 coverage）思想可被 Top 3 trial 协议直接吸收，无需新机制 |
| 调研仓治理建议（evidence index、closeout boundary、retrospective） | openspec/gsd-pi/spec-kitty 复查 | 落选，转告 | 这些建议大多指向 spec-first-doc 调研仓自身的报告治理，不属主仓优化；供调研仓自用 |
| Harness 科学评估框架 | boundary-bench | 落选，作为方法吸收 | 不建框架，取其 claim→condition→probe→eligibility→aggregate 语义用于 Top 3 协议设计（§3.3） |

## 3. Top 3 分析方案与执行

### 3.1 Top 1：自证闭环（Ship-then-Prove）——一切外部动作的物理前提

**问题定义**：spec-first 从未确认过真实宿主 clean-session 的核心链路闭环（F9，07-31 基线 §3.2 记录后无翻案证据）；且外部无法安装最新能力（35 条 v1.15.2 条目未发版，npm latest 停在 1.15.1）。缺这两项，trial、推广、价值 claim 全部空转且无法归因。

**证据基线（confirmed）**：F9；发版状态核实（本日）；quickstart 验收标准「5 个新用户独立完成」从未执行（implementation-plan M1.1 验收项遗留）。

**执行步骤**：

1. **发版**：跑 `npm run test:release` 与 `release:publish` 流程 → bump 1.15.2 → publish → 用 `npm view spec-first version` 确认可见。全部验证命令与结果记入 CHANGELOG。
2. **定义 E2E 判据**（执行前冻结，防「跑完再定标准」）：链路选 `quickstart → spec-runtime-setup → 真实小任务 spec-work → spec-code-review（report-only）`；成功判据 = 四阶段 artifact 齐全 + closeout evidence 真实存在 + 摩擦点 ≤10 且无阻断级。
3. **真实宿主 clean session 执行**：重开宿主会话（不依赖当前会话缓存 skill），逐阶段记录时间戳、遇到的摩擦（阶段/描述/严重级）、实际产物路径。
4. **产出**：`docs/validation/2026-XX-self-e2e-001.md`（四轴分级，E2E 本身标 sandbox/真实分层）+ 摩擦清单（同时是 Top 3 协议设计与 WS5 材料的输入）。

**判据与停止条件**：发布债清零（npm latest = 仓库版本）；E2E ≥1 条链路 confirmed。E2E 连续 2 轮 blocked → 路由 `spec-debug`，Top 3 与所有推广动作顺延。

**调研关系**：吸收 gsd-pi 复查的 closeout boundary 语义（质量门通过前不得标 done）用于 E2E 报告自身；吸收 spec-kitty 的「evidence 必须是交付物」用于摩擦清单格式。

### 3.2 Top 2：运行时上下文成本收敛——唯一负值 runtime_cost 证据的解药，计划就绪只差执行

**问题定义**：项目唯一的 confirmed 负向成本证据（F1：门测 +27.0%/+22.5% 超自定门槛、0/4 正收益）与入口过重（F3：spec-code-review 123KB/1035 行）的解药已经写成 implementation-ready 计划（2026-08-27-001，718 行/19 条需求/U1-U7），但 `worker_dispatch_authorization: missing`——执行未启动。风险不在设计而在执行纪律：0/4 历史证明简化从未轻易赢过。

**证据基线（confirmed）**：F1、F3、pilot plan 状态字段、`skill-simplification-patterns.md` 的 4 项 anti-pattern 记录。

**执行步骤**：

1. **获取执行授权**：owner 授权 pilot 执行（当前 missing 的 dispatch authorization），从 U1（冻结 baseline + 投资门）开始。
2. **U1 投资门是第一决策点**：两候选（spec-code-review、spec-plan）任一未过门即记录 `no-change-after-audit` 并停止该候选——**不替补、不放宽**。这是把 0/4 教训制度化的第一现场。
3. **执行纪律**：严格按 plan 的 Verification Contract 逐 U 落地；R19 的 promotion decision table（target 与 minimum delta 分开、primary metric 必须可观测）在 candidate 开始后不得修改。
4. **witness 差距的顺带闭合**：U5 的 read-ledger（declared vs actual reads，不可观测时降级 `reference_read_status=unobservable`）正是 witness 对比指出的「CLI 亲见 vs agent 自报」差距在本仓的落点——执行时不得跳过该记录。

**判据与停止条件**：全部按 pilot 自身门禁（本方案不复述、不重定义）；P0/P1 行为回归按其 rollback gate 恢复。

**落点声明**：pilot 全部失败（两候选均 `no-change-after-audit`）是可接受结局，证据照常 closeout；但禁止以「简化难」为由把入口扩容回趋势——budget 机制（U1）落地后即生效。

### 3.3 Top 3：外部第一证据（Field Trial）——用基准语义设计，把 field_outcome 从 not-run 变成 ≥1

**问题定义**：所有 validation 都是 self-validation，field_outcome 全 not-run（F7/F12），外部反馈循环不存在。这是使命级缺口：项目已证明能治理自己，未证明值得被别人使用。

**证据基线**：F7（月下载 1,174/周 187，大概率自用）、localization-ledger 大量 not-run、F12（调研-执行转化损耗，含 handoff 五项目深挖未落盘）。

**执行步骤**：

1. **前置门**：Top 1 双项达成（可安装的版本 + 跑通的链路）。
2. **协议设计借用 boundary-bench 评估语义**（不建框架，只取语义）：每个观测 claim 绑定 executable condition（如「time-to-first-value <30min」→ 具体起止事件定义）→ probe/evidence（原始记录，非事后回忆）→ eligibility（拒绝 dry-run/中断/未完成样本混入结论，同 EvidenceEligibility 思想）→ aggregate（分桶报告，不平均掉 hard failure）；sandbox/semantic/field 三层证据分开陈述。
3. **instrumentation**：002 §4.6 A 组轻量 receipts（安装/激活/执行/验证各一条结构化记录：命令、时间、exit code、artifact ref），trial 内一次性格式，不做通用 schema。
4. **招募与时间盒**：2-3 周、1 个真实第二用户/项目、≥3 个真实变更任务；4 周无对象 → 公开招募帖（Show HN / V2EX / r/ChatGPTCoding），再 4 周无果 → 记录 blocked 与原因（这也是有效 field 数据：市场需求信号）。
5. **产出**：`docs/validation/2026-XX-field-trial-001.md`，confirmed-negative 与 confirmed-positive 同等有效，负结果照发。

**判据与停止条件**：`field_outcome` 条目 0 → ≥1（正负皆可）；trial 协议中预注册的失败判据触发时如实记录，不为挽尊调整。

## 4. 显式裁决点：两条半拍方向（需 owner 一次裁决）

本轮最重要的结构性发现：**调研侧与主仓执行侧已形成方向分裂**——

- **调研侧**（08-05 基线复查演进终点）：向「协议骨架 receipt 化」深化——Claim ladder、五种 Receipt（ContractReadiness/ExecutionWorkspace/Evidence Wire/Shadow Knowledge/HostCapability+Projection）、Evidence/Approval/Waiver 分离。设计精密，但**全部未进主仓、无外部 consumer**。
- **主仓执行侧**（002 方案 + 本 Top 3）：兑现优先——先发版、先自证、先外证，零新增 durable mechanism，receipt 族待 field 数据重评。

两条方向共享全部价值观（repo truth、fail-closed、claim 分级），分歧只在**顺序**：先造协议还是先拿证据。若不裁决，最可能的失败模式是：调研继续产出协议设计（认知债增加），主仓继续执行兑现（证据增加），两边互不消费——F12 的转化损耗在更大的尺度上重演。

**本方案的裁决建议**（供 owner 采纳或推翻）：维持「先证据后协议」——Top 3 的 field trial 是 receipt 族的最小 consumer 测试场：trial 结束时，若轻量 A 组 receipts 被证明有用，B 组协议族从「设计完备」进入「需求验证」；若 trial 中 receipts 从未被需要，协议族的优先级应实质下调。这个裁决把 08-05 基线的 five receipts 从「待实现清单」变成「带触发条件的设计储备」，两边由此合流。

## 5. 与既有计划的关系与执行顺序

```text
立即（Day 0-3）   Top 1 发版（35 条积压清偿）
并行（Day 0-14）  Top 2 U1 授权与投资门；宿主矩阵证据盘点（WS4 前置调查）
Day 7-21          Top 1 E2E（发版后即做）
Day 14-45         Top 3 协议定稿 + 招募 + 执行（前置门：Top 1 双项达成）
Day 45-90         Top 3 closeout；WS3/WS5 按 002 节奏；§4 裁决点兑现
```

002 方案的 WS1a/WS2/WS1b 与本 Top 1/2/3 一一对应，无 scope 冲突；本文档不新增任何 durable mechanism。

## 6. 验证声明

本分析为 docs-only：已执行调研目录二次深挖（08-05 基线复查全文、08-16/17 五份竞品复查结论、08-10/04 两份基准视角报告结论、repos/ 清单、08-01~05 基线增量 diff 判断——由只读 agent 转述，等级按原文自标继承）、发版状态与 pilot 状态事实核实（本仓库 grep/npm view）。未执行：任何代码修改、发版、E2E、trial、runtime refresh；调研仓源码未二次复核。三个 Top 项的执行（发版、E2E、trial）均含副作用，需 owner 分别授权。
