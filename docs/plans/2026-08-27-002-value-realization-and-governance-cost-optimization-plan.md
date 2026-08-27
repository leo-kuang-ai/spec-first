---
title: "价值兑现与治理成本收敛优化方案"
type: strategy
status: proposed
date: 2026-08-27
revised: 2026-08-27（纳入 spec-first-doc 业界调研实证；WS1 拆分、新增调研机制裁决）
plan_depth: standard
related:
  - docs/strategic-review/2026-08-02-executive-summary.md
  - docs/strategic-review/2026-08-02-implementation-plan.md
  - docs/plans/2026-08-27-001-perf-skill-runtime-context-pilot-plan.md
  - docs/solutions/skill-simplification-patterns.md
  - /Users/kuang/xiaobu/spec-first-doc/业界调研/2026-07-31/spec-first-baseline.md
  - /Users/kuang/xiaobu/spec-first-doc/业界调研/2026-08-15/reports/99-benchmark-summary.md
  - /Users/kuang/xiaobu/spec-first-doc/业界调研/2026-08-19/reports/99-benchmark-summary.md
  - /Users/kuang/xiaobu/spec-first-doc/业界调研/2026-08-17/reports/spec-kit.md
evidence_basis: 2026-08-27 全面短板调查（本仓库只读盘点 + npm registry/downloads API + 业界检索）+ spec-first-doc/业界调研 本地资料（2026-06-19 至 2026-08-19 共 43 批）
owner_decision_required: true
---

# 价值兑现与治理成本收敛优化方案

## Goal Capsule

| 维度 | 决策 |
| --- | --- |
| 核心判断 | 项目最大短板不是架构或工程质量，而是**价值闭环只对自己闭环**：`structure_contract` 证据充分，`runtime_cost` 证据刚测出且为负值，`field_outcome` 接近全空白。 |
| 总目标 | 把证据阶梯从 `structure_contract` 推向 `field_outcome`，把治理 `runtime_cost` 收敛回自定门槛内，并把生态位从「另一个 spec-driven 工具」移到「spec-driven 的证据层」。 |
| 主要杠杆 | 五个工作流（WS1-WS5），90 天落地顺序，全部复用既有机制，不新增 skill / agent / schema。 |
| 最大风险 | 本方案自己变成又一份高仪式产物；field trial 结果难看；宿主矩阵收缩引发迁移摩擦。 |
| 与既有计划关系 | 不替代 `2026-08-02-implementation-plan.md`，是其 Q1/Q2 优先级的锐化；不修改 `2026-08-27-001` perf pilot 的 scope，WS2 直接执行它。 |
| 决策状态 | `proposed`：WS4 矩阵收缩与 WS1 trial 对象选择需要 Project owner 授权后执行。 |

---

## 1. 证据基线（本方案为什么存在）

以下事实全部可回源，按项目自身证据分级标注：

### 1.1 Confirmed（有验证依据）

| # | 事实 | 来源 |
| --- | --- | --- |
| F1 | 4 个 skill 简化候选门测 0/4 正收益（3 归档 anti-pattern + 1 pending）；逐臂实测 `cost_mean` 增幅按项均分 +27.0%、按 10 对照臂均分 +22.5%，均超过方案自定的「平均成本增加 <20%」继续门槛 | `CHANGELOG.md` 2026-08-21 两条目；`docs/solutions/skill-simplification-patterns.md` |
| F2 | 规模盘点：37 个 skill（入口 ~1.0MB/9,855 行，references 244 文件/2.0MB）；`docs/` 684 个 md/25.8 万行（290 plans + 160 validation）；`src/cli` 28,226 行；tests 53,394 行 | 2026-08-27 只读盘点 |
| F3 | 最大 skill 入口 `spec-code-review` 123,834 bytes/1,035 行、`spec-plan` 115,997 bytes/864 行 | `2026-08-27-001` pilot plan 的 source footprint facts |
| F4 | 六宿主 adapters 4,497 行；`codex.js`（814 行，最大）与 `kiro.js` 无专属 unit 测试，`host-runtime-projection-contracts.test.js` 完全未提及 codex；qoder 反而拥有最完整的专属 lifecycle 测试 | tests/ src/ 结构事实 |
| F5 | 战略自评已承认挑战在「价值外显、采纳门槛和能力兑现证据」；Q1 目标 time-to-first-value 30 分钟→5 分钟，`quickstart` 命令已落地（`src/cli/commands/quickstart.js` + README 已更新） | `docs/strategic-review/2026-08-02-executive-summary.md`、`implementation-plan.md`、源码 |
| F6 | git 身份仅两个（1244 + 499 commits，2026-02-05 起），巴士因子接近 1；`docs/plans/` 产出 4-7 月为 76/65/80/55，8 月骤降至 11 | git history |
| F7 | npm `spec-first` v1.15.1 存在；最近一月下载 1,174 次、最近一周 187 次（区间 2026-07-27 至 08-25） | npm downloads API（2026-08-27 查询） |

### 1.2 Advisory（方向性判断，非 confirmed truth）

- 月下载量级大概率以作者自用 CI/dogfood 为主（推断依据：项目自身体量 vs 数字、无外部反馈记录）。
- 业界格局：GitHub Spec Kit（官方背书）、AWS Kiro、OpenSpec、BMAD 已占据 spec-driven 公众心智，2026 年榜单无本项目的位置；Claude Code 工作采用率半年 18%→39%，宿主 skills/hooks/plan mode 原生化加速——AGENTS.md 自己承认的宿主商品化压力正在兑现。
- 8 月产出骤降（F6）可能是战略转向信号，也可能是投入回报递减信号；两者都指向同一动作：停止扩张，转向兑现。

### 1.2.1 本地业界调研实证（2026-08-27 修订增补）

`spec-first-doc/业界调研/`（2026-06-19 至 08-19 共 43 批，源码级）提供了一组比 web 检索更硬的事实：

| # | 事实 | 来源 |
| --- | --- | --- |
| F8 | owner 侧基线早已独立得出同构结论：定位应收紧为「**不是 another SDD 编排工具，而是 AI coding 的证据与验证层**」；短板为兑现/发布/采纳、多宿主面过大（建议聚焦 Claude+Codex）、差异化深埋、47 项 capability regressed；并留有 Q1-Q5 决策问题与 B1-B9 不可牺牲边界 | `2026-07-31/spec-first-baseline.md` |
| F9 | **截至 2026-07-31，「未真实跑通任一核心 `spec-*` workflow 宿主会话」**——sandbox 有验证，真实 clean-session 宿主闭环未确认。这比 field_outcome 空白更底层：自用真实宿主 E2E 是外部 trial 的前提 | 同上 §3.2 |
| F10 | 发布债在 07-31 时为 141 个未发版提交（当时周下载 247、62 stars）；当前仓库 v1.15.2 仍未发布（npm latest 仍为 1.15.1），发布债未清偿 | 同上 §3.1 + npm registry |
| F11 | 十个相邻项目调研（08-15/08-19 两批汇总）的共同结论：adoption/evidence 是全行业缺口、完成不应由 agent 自宣布、prompt→可执行边界；且 08-15 汇总明确「**优先解决 adoption 与 evidence，而非先造更重 runtime**」——但其 P0 又建议新增 6-10 个 schema/receipt 机制，与自身结论存在张力 | 两份 `99-benchmark-summary.md` |
| F12 | 07-31 handoff 计划的五个源码级深挖（AgenticLoop/Tessariq/ReasonForge/Graphify/VeRO）未见专项报告落盘；43 批滚动调研持续发现新项目，但调研结论到执行的转化存在明显损耗（如「聚焦两宿主」07-31 已明确、至今未执行） | 各批次 reports/ 目录结构 |

**元发现（判断，advisory）**：本方案的五条证据（F1/F6/F7/F10/F12）与 07-31 基线构成**四方独立收敛**——07-31 基线、08-15/19 调研汇总、08-17 spec-kit 复查（§19「Evidence/not-run 是 spec-first 可做强项」）、本方案——共同指向同一方向：证据与验证层定位 + 兑现优先。同时 F12 显示项目当前缺的不是认知（07-31 已写清一切），而是**把已收敛认知执行完的机制**：调研节奏应从「每两天一批」降为「按需触发」（如 trial 结果出现后针对性复查），释放的投入转给执行。

### 1.3 核心矛盾

项目用世界级的证据纪律要求自己，但证据纪律的对象一直是自己。所有 validation / eval / review 都是 self-validation。按角色契约自己的标准（「信任只能覆盖证据直接支持的 claim」），当前对外价值 claim 只站在 `structure_contract` 一级；而 F1 第一次提供了负向 `runtime_cost` 证据。**治理体系的边际成本已先于边际收益到顶。**

---

## 2. Goals / Non-goals

### Goals

1. `field_outcome` 从全 not-run 变为至少 1 条真实外部数据（最高优先）。
2. 完成 `2026-08-27-001` runtime context pilot，并把 F1 的成本门槛教训制度化为新增能力的准入条件。
3. 治理文档产出收敛到「有真实 consumer 才生产」，存量按 retention policy 分层。
4. 宿主矩阵投入与验证证据对齐，消除「最大代码量 + 零专属测试」的错位。
5. 对外定位改写为「spec-driven 的证据层」，与 Spec Kit / Kiro 明确互补而非竞争。

### Non-goals

- 不新增任何 skill、agent、workflow、schema 或 CLI 能力。
- 不重构核心 workflow 链路，不修改角色契约。
- 不对下载量 / star 数做硬 KPI 承诺（它们是方向指标，不是价值证明）。
- 不移除任何宿主支持（只做支持层级降级，保留 contract tests）。
- 不在本方案内执行任何代码变更；每个 workstream 落地时按任务分级走各自授权。

---

## 3. 指导原则（全部源自角色契约，非新增规则）

- **兑现优先于新增**：角色契约 §4「兑现、验证和简化已有能力优先于继续增加能力」。本方案 90 天内新增 durable mechanism 总数为 0（除 WS2 pilot 已冻结的产出与 WS3 的 retention policy 本身）。
- **负结果是有效结果**：field trial 与 pilot 都允许并诚实记录 `no-change-after-audit` / 负面结论；不得为达成正向指标粉饰数据。
- **方案自重约束**：本方案后续修订不得膨胀为新的高仪式产物；每个 workstream 的落地文档以「最小可审查」为准。

---

## 4. 工作流（Workstreams）

### WS1 兑现阶梯：自用真实闭环 → 外部 field outcome

**优先级：最高。** 它改变项目站位的能力大于其余四个 WS 之和。2026-08-27 修订：依据 F9/F10 将原单一 trial 拆为两阶——**先自证，再外证**。外部 trial 若在自用真实宿主闭环未确认前启动，失败将无法归因（是产品问题还是环境问题）。

#### WS1a 发布债清偿 + 自用真实宿主 E2E（WS1b 的前置门）

| 项 | 内容 |
| --- | --- |
| 目标 | ① 清偿发布债（v1.15.2 发版，外部可试用是 trial 的前提）；② owner 本人在真实宿主 clean-session 中完整跑通一条核心链路（建议：真实小任务走 `spec-prd → spec-plan → spec-work → spec-code-review`，或按 quickstart 路径），确认安装→激活→执行→审查→closeout 全链路 |
| 关键动作 | ① 按 `release:publish` 流程发版并记录 npm 实际可见性；② E2E 会话从新开宿主会话开始（不依赖当前缓存 skill 定义），使用真实任务（可复用 perf pilot 的 U1 之外的小任务），记录 raw evidence（会话记录、artifact 路径、遇到的每处摩擦）；③ 产出 `docs/validation/2026-XX-self-e2e-001.md`，按四轴分级，摩擦点逐条记录（它们同时是 WS5 before/after 素材与上手路径修复清单） |
| Artifacts | 发布记录、self-E2E 报告、摩擦清单 |
| Consumers | WS1b（前置门）、WS5（before/after 素材）、上手路径修复 backlog |
| 度量 | 发布债清零；`真实宿主 E2E ≥1 条链路` 状态从 not-run → confirmed（或 confirmed-blocked 带原因） |
| 停止条件 | E2E 不可完成（宿主阻断、skill 加载失败）→ 记录 blocked 与最小修复项，修复后重试；连续 2 轮 blocked 则升级为专项 debug（路由到 `spec-debug`） |
| 风险 | 把 E2E 做成又一次 sandbox 演练——判据是「真实宿主 clean session + 真实任务」，sandbox 复跑不算。 |

#### WS1b 外部 Field Trial（真正的 field_outcome）

| 项 | 内容 |
| --- | --- |
| 前置门 | WS1a 两项均达成 |
| 目标 | 1 个真实第二用户/第二项目，用 spec-first 完成 ≥3 个真实变更任务，产出可回源的 trial 报告 |
| 关键动作 | ① 定义 trial 协议：任务选择标准（中等复杂度 brownfield 变更）、观测指标（time-to-first-value、返工次数、审查发现数、用户主观可信度评分）、成功/失败判据、2-3 周时间盒；② 招募 1 个 trial 对象（同事/社区/自选开源项目 maintainer），签署最小数据授权；③ 全程 instrument 而不干预，记录 raw evidence——instrumentation 采用调研建议的 receipt 轻量版（见 §4.6 裁决 A 组）：每次安装/激活/执行/验证各留一条结构化记录（命令、时间、exit code、artifact ref），**作为 trial 内一次性记录格式，不做通用 schema**；④ 产出 `docs/validation/2026-XX-field-trial-001.md`，按四轴证据分级诚实记录 |
| Artifacts | trial 协议、trial 报告、receipt 记录集、CHANGELOG 条目 |
| Consumers | README 价值 claim、WS5 定位材料、下一轮战略审查 |
| 度量 | `field_outcome` 条目 0 → ≥1（confirmed 或 confirmed-negative） |
| 停止条件 | 4 周内找不到 trial 对象 → 降级为「对外开源 dogfood 公开招募」（Show HN / V2EX / r/ChatGPTCoding 各发一帖），再 4 周无果则记录 blocked 与原因 |
| 风险 | 结果难看。**预先声明：confirmed-negative 与 confirmed-positive 同等有效**，发布负结果本身建立可信度。 |

### WS2 完成 runtime context pilot 并把成本教训制度化

**性质：执行既有计划 + 一条新增治理规则。** 不修改 `2026-08-27-001` 的任何 scope。

| 项 | 内容 |
| --- | --- |
| 目标 | pilot 按 U1-U7 执行完毕；同时把 F1 教训固化为准入规则 |
| 关键动作 | ① 按 pilot plan 执行（U1 投资门优先，`no-change-after-audit` 是正当结局，带着 0/4 历史预期执行）；② 新增一条响亮约定（loud convention，声明未强制）：**任何新增 skill / governance 机制 / 入口扩容，必须在 proposal 中携带成本预算声明（入口 bytes 增量 + 是否触发 20% 门测门槛），无声明不开工**——挂靠 `lint-skill-entrypoints` 的 budget facts，pilot U1 落地后自然承载 |
| Artifacts | pilot 的三份 validation artifacts + budget 机制（pilot 已规划）；成本预算约定写入 `AGENTS.md` 任务分级段 |
| Consumers | 所有后续 skill/plan 提案 |
| 度量 | pilot 自身门禁（entry/first-stage delta、fresh-source eval）；新约定覆盖率（后续提案 100% 携带预算声明） |
| 停止条件 | pilot 出现 P0/P1 行为回归即按其 rollback gate 执行 |
| 风险 | pilot 失败（两候选均 `no-change-after-audit`）——可接受，证据本身有价值；但不得因失败而放宽 R1-R19。 |

### WS3 治理产出收敛 — docs retention 与消费导向

**性质：一次结构性清理 + 一条 retention 规则。**

| 项 | 内容 |
| --- | --- |
| 目标 | 存量 684 docs 分层为 active / archived；新增治理文档必须有声明 consumer |
| 关键动作 | ① 制定 retention policy：`docs/plans/`、`docs/validation/`、`docs/brainstorms/` 中已完结且超过 2 个月未被 `related`/`CHANGELOG`/contracts 引用的条目移入 `docs/archive/`（git mv，保留可回源性）；② 建立轻量索引：`docs/plans/README.md` 列 active 计划，archived 不索引；③ 新增响亮约定：新 plan/validation 文档 frontmatter 必须含 `consumers:` 字段，声明谁会读它 |
| Artifacts | retention policy 文档（并入 `docs/contracts/` 既有文档体系）、归档后的目录结构、各 README 索引 |
| Consumers | 项目 owner、后续 plan/review workflow |
| 度量 | 归档后 active plans 数量（预期 290 → <60）；后续新增 docs/月维持 ≤15 且全部有 consumer 声明 |
| 停止条件 | 归档操作发现大量文档仍被活跃引用 → 缩小归档范围，只归档确认无 consumer 的部分 |
| 风险 | 误归档仍被引用的文档——用 `grep` 引用扫描做前置检查（script-owned fact），语义判断保留给 owner。 |

### WS4 宿主矩阵收缩到证据

**性质：支持层级决策 + 测试补齐二选一。需要 owner 授权。**

| 项 | 内容 |
| --- | --- |
| 目标 | 消除「codex adapter 814 行代码 + 零专属测试」类投入/验证错位 |
| 关键动作 | ① 用证据矩阵逐宿主判定：真实使用证据（dogfood 记录、issue、下载归因）× 专属测试覆盖 × adapter 代码量；② 按结果分层：`tier-1`（claude——主力 dogfood 宿主）维持全验证；`tier-2`（有使用证据者）补最小专属 projection 测试或降级；`best-effort`（无使用证据者，预期含 kiro，codex 待判）在 README `getSupportedPlatforms()` 输出与 doctor 中显式标注支持层级，不再承诺同等验证；③ 对降级宿主保留 contract tests（不删），只停止主动演进 |
| Artifacts | 支持层级声明（README + doctor 输出 + adapters registry 元数据）、证据矩阵文档 |
| Consumers | 所有宿主用户、`spec-first doctor`、release checklist |
| 度量 | 每个 tier-1/tier-2 宿主至少 1 个专属 projection contract test；best-effort 宿主在用户可见面有降级标注 |
| 停止条件 | owner 判定某宿主有未记录的真实使用 → 该宿主升回并补测试 |
| 风险 | 降级引发存量用户不满——降级只影响验证承诺与演进优先级，功能与投射不撤回。 |

### WS5 生态位重定位 — 从「另一个 spec 工具」到「spec-driven 的证据层」

**性质：文档与叙事改写，零代码。接续 implementation-plan M1.2 未完成部分。**

| 项 | 内容 |
| --- | --- |
| 目标 | 外部用户 5 分钟内能感知 spec-first 与 Spec Kit / Kiro 的差异 |
| 关键动作 | ① README 三语重写定位段：明示「可与 Spec Kit / Kiro 叠加使用，本层负责它们都不做的证据闭环、claim 分级、source/runtime 纪律」；② 制作 before/after 对比表（同一任务：裸 agent vs +spec-first 的审查证据链、返工次数、可回源性），数据源优先用 WS1 trial 真实数据，trial 完成前用内部 dogfood 记录并标注 provenance；③ 补齐 implementation-plan M1.2 欠账：2 分钟演示视频（一个真实 task 的 evidence chain 演示） |
| Artifacts | README/README.en/README.zh-CN 定位段、before/after 表、演示视频 |
| Consumers | npm 落地页、潜在 trial 用户、WS1 招募材料 |
| 度量 | 对比表数据 100% 带 provenance 标注；无一条无证据的价值 claim |
| 停止条件 | 无（纯文档），但禁止在 trial 数据出来前发布任何量化收益 claim |
| 风险 | 定位改写滑向功能扩张（「为了演示加个功能」）——本 WS 冻结为零代码。 |

### WS5 定位锚点与下一周期候选（2026-08-27 修订增补）

- **叙事锚点**：直接采用 07-31 基线原话作为定位句——「**其他工具定义做什么，spec-first 证明是否做对**」。这句已有四方收敛支撑（07-31 基线、08-15/19 调研、08-17 spec-kit 复查 §19「Evidence/not-run 是 spec-first 可做强项」、本方案）。
- **下一周期候选（owner 裁决点，本周期不做）**：对外独立可用的 **read-only evidence/verify 入口**（`spec-first verify` 形态：输入 intent/spec ref + repo fingerprint + command receipts，输出 verdict/limitations/handoff，最小 schema 见基线 Q2）。这是「5 分钟试用路径」的最短形态，也是唯一可能值得破例的新增能力——但须待 WS1b trial 证明外部用户确实需要独立消费证据层，再按 Build Gate 立项。在此之前，5 分钟路径由现有 `quickstart` + 一条 workflow 承载。

### 4.6 调研建议机制的显式裁决（2026-08-27 修订增补）

本地调研（08-15/08-19 两批汇总）共提出约 10 个可借鉴机制。为避免下轮调研把它们再次抬回未裁决状态，此处按基线 §6 采用判据（尤其第 4 条「减少维护面或提升独立采用，而非增加平行真相源」）一次性分级：

| 组 | 机制 | 裁决 | 理由与去向 |
| --- | --- | --- | --- |
| A（轻量采纳） | EvidenceReceipt、HostActivationReceipt、ReviewFinding 结构 | **以 trial 内一次性记录格式采纳**（WS1a/WS1b instrumentation） | 直接服务 adoption 证据收集；不做通用 schema、不进 CLI，trial 结束后按实际有用性再决定是否固化 |
| B（推迟） | WorkflowPackManifest、AdmissionPreview、CloseoutReceipt、HarnessHealthReceipt、RiskProfile、Gate/Invariant Registry、Living Contract Lite、KnowledgeCandidate | **推迟到 WS1b 产出 field 数据后重评** | 每个都是新 truth surface；在无外部用户证明「独立采用」需求前落地，将重演「机制就位但无 consumer」（F12 元发现）。重评时按 Build Gate 逐个过 |
| C（不做） | 中心控制平面 / fleet runtime / runner DB / dashboard 作为真相源 | **不做** | 基线 B9 与两份汇总的「不应盲从」清单已明确排除；repo truth 不退让 |

裁决一致性说明：08-15 汇总自己的结论「优先解决 adoption 与 evidence，而非先造更重 runtime」与本裁决一致；其 P0 的 schema 清单属于 A/B 组分流后的结果，未被静默丢弃，而是挂起了触发条件。

---

## 5. 90 天落地顺序（最小可维护路径）

```text
Day 0-14   WS1a 发布债清偿（v1.15.2 发版）+ 自用真实宿主 E2E
           WS1b trial 协议定稿、招募预热（等 WS1a 过门再启动对象）
           WS2 U1（pilot plan 已排期，直接执行）
           WS4 证据矩阵盘点（纯调查，成本低，产出决策提案）
           调研节奏切换：滚动调研转为按需触发（元发现 F12）
Day 15-45  WS1b trial 执行（前置门：WS1a 双项达成）
           WS2 U2-U5（视 U1 投资门结果）
           WS3 retention policy 定稿并开始归档
           WS4 owner 决策 + 层级标注
           WS5 README 定位段（对比表等 trial 数据）
Day 46-90  WS1b trial closeout 报告
           WS2 U6-U7 closeout
           WS3 归档完成 + 索引
           WS5 对比表/演示视频（消费 trial 数据）
           §4.6 B 组机制按 field 数据重评
           全方案复盘：按 §7 度量验收，决定下一周期
```

排序逻辑：WS1a 最先因为它是所有外部动作的物理前提（没有可安装的版本、没有跑通的链路，trial 与推广都是空转）；WS1b 招募预热并行但启动受前置门约束；WS4 决策前置因为它影响后续所有验证预算的分配；WS5 尾部因为它消费 WS1 产出。

---

## 6. 分工边界

| 层 | 职责 |
| --- | --- |
| Scripts（deterministic） | docs 引用扫描（WS3 前置检查）、入口 bytes/budget facts（WS2，随 pilot U1）、宿主测试覆盖矩阵统计（WS4 事实部分）、npm 下载量定期记录 |
| LLM / agents（semantic） | trial 协议设计、证据分级判断、retention 的「是否仍被语义引用」判断、宿主层级建议、定位叙事撰写 |
| Project owner（authority） | WS1 trial 对象与数据授权、WS4 层级最终决策、WS5 对外发布授权、本方案任何 scope 修改 |

---

## 7. 成功判据（诚实分级）

| 判据 | 类型 | 90 天目标 |
| --- | --- | --- |
| 发布债 | confirmed | 清零（npm latest = 仓库版本） |
| 真实宿主 E2E | confirmed | ≥1 条核心链路（自用 clean-session） |
| `field_outcome` 外部条目 | confirmed | ≥1（正负皆可） |
| pilot 两候选 | 按 pilot 自身门禁 | 走完 U1-U7 或诚实停止 |
| 新增提案成本预算覆盖率 | 流程 | 100% |
| active plans 数量 | 结构 | <60（自 290 收敛） |
| 月新增 docs | 结构 | ≤15 且全带 consumer 声明 |
| 调研批次 | 结构 | 按需触发（本轮周期新增 ≤4 批且各带明确触发事件） |
| tier-1/2 宿主专属测试 | 结构 | 100% 覆盖 |
| 月下载量 | 方向参考（非 KPI） | 相对 1,174 基线可观测变化即可，不设阈值 |

**明示失败模式**：若 90 天后 `field_outcome` 仍为 0 且 WS1 两条路径均 blocked，则本方案核心假设（存在可触达的外部消费者）被证伪，应升级为战略性讨论（项目定位为个人 harness 是否即为终态），而不是继续加码推广动作。

---

## 8. 风险与反模式

| 风险 | 缓解 |
| --- | --- |
| 本方案自身仪式化膨胀 | §3 自重约束；修订只允许收缩或细化，不允许新增 workstream |
| 用下载量自我激励 | §7 明确其为方向参考；价值证明只能是 trial/field evidence |
| pilot 失败被解读为方案失败 | 预注册：0/4 历史已证明简化难，`no-change-after-audit` 是证据不是挫折 |
| 归档破坏可回源性 | git mv 保留历史；引用扫描前置；contracts/solutions 永不归档 |
| 定位改写与竞品贬低混淆 | WS5 只声明差异与互补，不评价竞品优劣 |
| 治理纪律在收敛期松动 | 收敛的是产出量，不是证据等级；所有 WS 的 closeout 仍按四轴证据分级 |

---

## 9. 失效与重估触发条件

- WS1a 自用 E2E 连续 2 轮 blocked → 升级为专项 debug，WS1b 与 WS5 全部顺延（自证未过，外证无意义）。
- WS1b trial 出现 confirmed-negative 的强信号（用户无法完成 time-to-first-value 或主观可信度显著为负）→ 触发上手路径专项，优先于 WS5 发布任何推广材料。
- `2026-08-27-001` pilot 的 invalidation 条件（其 §Invalidations）触发 → WS2 顺延并重估。
- 任一宿主发布 breaking 变更影响投射 → WS4 矩阵重判。
- 新一轮滚动调研在无触发事件下重启 → 视为元发现 F12 失效，重估调研节奏约定。
- npm 下载出现无法归因的异动（如被其他同名包流量污染）→ 重设外部信号基线。
- 角色契约修订使命或价值权重 → 本方案整体重估。

---

## 10. 验证声明

本方案为 docs-only proposal：已执行 2026-08-27 全面短板调查（仓库只读盘点、CHANGELOG 关键条目原文核实、npm registry/downloads API、业界检索两组）与本地业界调研资料核查（2026-07-31 基线三份、2026-08-15/08-19 benchmark-summary 两份、2026-08-17 spec-kit 复查、43 批次目录结构扫描）；未执行任何代码修改、行为评估或 runtime refresh。§1.1 与 §1.2.1 全部事实可按来源列回源核验；§1.2 其余与元发现为标注的 advisory 判断。本地调研文档位于仓库外（`spec-first-doc/`），其结论转述未经二次源码复核，等级按原文自标（多为 A/B 级源码证据）继承。本方案状态为 `proposed`，WS1a 发版、WS1b 招募、WS4 决策、WS5 发布四个副作用点需 owner 授权。
