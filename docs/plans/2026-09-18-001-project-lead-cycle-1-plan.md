---
artifact_type: advisory
title: 项目负责人周期 1 - 证据缺口闭合与计划语料一致性
type: execution-plan
date: 2026-09-18
status: completed
execution: knowledge-work
---

# 项目负责人周期 1 - 证据缺口闭合与计划语料一致性

> 本周期不新增能力。目标是把「声明与证据之间的距离」收窄，并修掉会说谎的现状描述。
> 收口决定（2026-09-24）：按项目负责人用户裁决，本周期方案标记为 `completed`。这表示计划范围内的文档、审查、修复与本地回归已收口；外部 GUI、账号、真实参与者、真实模型和现场收益验证仍保留为后续人工验证，不提升为本周期已验证结果。
> 依据：[`项目负责人工作契约.md`](../10-prompt/项目负责人工作契约.md) §2.3 的优先级裁决顺序。

---

## 0. 交付物地图（P1–P8）

owner 要求项目负责人交付八项产物。本计划是它们的**路线图**，周期 1 只执行其中可内部完成的部分。

| # | 交付物 | 现状 | 本周期动作 | 归属批次 |
|---|---|---|---|---|
| P1 | 产品定位与目标用户 | 存在（owner 2026-09-14 固化，`hypothesis` 级） | 不重做；标注其证据层与验证归属 U10 | B1 |
| P2 | 行业趋势与竞品能力矩阵 | 历史来源账本存在，当前能力矩阵尚未实际填充 | 矩阵对象、维度、来源与验收已立项，见 B3.4 | B3 |
| P3 | 当前能力基线与主要问题 | 分散（FSA2/FSA3）；缺统一口径 | 本计划 §2 即为 V1 基线；补齐四态标注 | B0/B2 |
| P4 | 各面优化方向 | advisory 方向存在，部分候选已有实施证据 | 按 owning plan 逐项核对，不笼统称均未实施 | B1 |
| P5 | 分阶段路线图 | 存在但语料自相矛盾 | 消除矛盾，建立单一路线入口 | B1 |
| P6 | 每项任务的目标/范围/依赖/验收/证据 | 已有 B0–B4 批次级定义；逐包范围、预算和执行输入仍需细化 | 为 B2.4 补齐逐包任务定义 | B2 |
| P7 | 优先级/风险/资源/停止条件 | 本计划已有批次级优先级、依赖和停止条件；跨计划资源口径仍需核对 | 统一本周期口径并补齐 B2.4 资源/停止条件 | B2 |
| P8 | 持续评测与复盘机制 | 既有协议与准入可复用；本周期补触发/汇总/反指标/处置约定 | 一次文档与审查闭环，持续运行及field效果仍未验证 | B3 |

**判断：P8 的短板是复用和闭环，而不是没有评测资产。** 在统一触发、结果汇总、反指标复盘和能力处置尚未证实前，G4（可信变更交付速度）与 G5（收益可试用可评估）的整体推进仍受限；已有局部证据保持各自 claim ceiling。

---

## 1. Goal Capsule

| 项目 | 内容 |
|---|---|
| 目标 | 关闭可内部完成却长期未关闭的证据缺口，并消除计划/审查语料中的状态自相矛盾 |
| 不新增 | 宿主、skill/agent 体系、指标平台、根指令篇幅、机制加固 |
| 最高价值批次 | B2（证据缺口闭合） |
| 新增 owner 裁决 | 无；§4 的可逆文档处置已在既有授权内执行，外部执行条件见 §6 |
| 收口标准 | 每项产出可回源证据或显式 `not-run` + 原因；不以中间产物关闭目标 |

---

## 2. 现状评估（可回源）

采集时间 2026-09-18，基线 HEAD `36d19d95`，采集时工作树已包含本契约、周期计划、目录索引和 CHANGELOG 的未提交草稿，版本 `1.15.3`。该状态不是可复用的 clean snapshot；执行批次前必须重新冻结 source snapshot。

### 2.1 confirmed（可复核）

| 事实 | 证据 |
|---|---|
| 38 个 canonical Skill、8 宿主枚举一致 | registry + `tests/unit/host-enumeration-drift-guard.test.js` |
| 计划状态机制及消费边界已存在 | `src/cli/helpers/plan-status.js`：`CANONICAL_PLAN_STATUSES = active/partially-shipped/completed/superseded`，`completePlanStatus` 仅允许 `active→completed`；消费侧 `skills/spec-work/references/input-triage.md:36` 明确「status 与源码现实不符是 finding，不是授权」 |
| 宿主 invocation 证据契约已存在 | `docs/contracts/verification/host-invocation-receipt.schema.json`（`host-invocation-receipt/v1`），生产者 `skills/spec-runtime-setup/scripts/lib/host-authority.cjs` |
| 现场验证协议已冻结并已预注册 | `docs/validation/ce-localization/field-validation/protocol.json`（`FIELD-CE-LOCALIZATION-2026-08-20`，`frozen_at: 2026-08-20`）+ `task-pairs.json` |
| FSA3 四项 finding 全部修复并回归 | `docs/validation/full-system-audit/2026-09-16-fsa3-findings.json`（status 全为 `fixed`） |
| FSA2 批次 26 项修复/澄清 + 8 项回源确认无需修改 | `docs/validation/full-system-audit/2026-09-14-fsa2-report.md:308` |
| P123 P1 批大体落地并已有聚焦证据 | `docs/validation/runtime-setup-p123-progress.md` |

**证据边界：** 部分合同、schema、协议与脚本已存在；逐包逻辑、真实执行、field 参数及复盘闭环仍有缺口。资产存在不足以支持“缺执行、不缺设计”。

### 2.1.1 确定性地板在本周期开始时为红（已修复）

`tests/unit/changelog-format.test.js` 在本周期开始时**失败**，且该测试属于正式单元链路（`npm run test:unit` → `jest tests/unit --runInBand`，见 `scripts/run-test-suite.cjs:122`）。

原会话记录了两次完整单元链路结果，第二次记录于格式修复后；未重建两次 source/environment 快照，不声明这是唯一变量对照：

| 运行 | 时点 | 结果 |
|---|---|---|
| 修复前 | 2026-09-18 14:22 | `Test Suites: 1 failed, 237 passed, 238 total`；`Tests: 1 failed, 2967 passed, 2968 total` |
| 修复后 | 2026-09-18 14:26 | `Test Suites: 238 passed, 238 total`；`Tests: 2968 passed, 2968 total` |

**唯一红项就是 `changelog-format`，无其他失败。**

- **失败断言：** `expect(entryPattern.test(entries[0])).toBe(true)`——顶层 CHANGELOG 条目必须带 `HH:MM:SS`。
- **当时的顶层条目：** `- v1.15.3 2026-09-16 codex: fix(audit): ...`（无时分秒），由 HEAD 提交 `36d19d95` 引入。
- **不是 HEAD 独有：** HEAD~1 顶层条目同样不合规，回归早于 HEAD 提交。

**根因边界：** 已确认直接原因是顶层条目缺少 `HH:MM:SS`。相同的测试计数不能证明历史运行与最终写入的先后顺序；“先验证后写入”和“非原子收口”均未确认。前述历史单元结果保留其原会话口径；本轮有原始日志的最终检查另见执行证据。

**处置：** 格式已修复。最终文档写入后重跑受影响检查是本轮预防措施，不是历史流程根因的证明。

### 2.2 not-run / 未闭合（关键）

| 缺口 | 证据 | 性质 |
|---|---|---|
| 冻结的 CE field cohort 未执行 | `docs/validation/ce-localization/field-validation/results.json` → `results: []`、`overall_status: "not-run"` | 需外部条件 |
| 真实宿主 loader / invocation | FSA2 F-18、FSA3 行 29/31 均未闭合 | **部分可内部完成** |
| fresh-source 独立评审 | FSA3 原审未运行，修复阶段已有带 hash 的复核；本周期另有独立有界审查 | 闭包与真实宿主仍未覆盖 |
| 真实任务与 comparator | FSA2/FSA3 的该波未运行；9 月 8 日已有 GLM-5.3 受限维护对照，不等于目标模型或外部用户 field | 部分可内部完成 |
| 审查整体生命周期 | FSA2 `lifecycle_status: incomplete`、`mechanism_result: failed`；FSA3 仍 `incomplete`、claim ceiling C1 | 结构性问题 |
| 24 个承诺审查包 | 已完成有界源码审查：4 failed、20 degraded；另 C2=14 not-run。B/C1 旧机械占位已撤销并以实际复核替换 | 8 项问题未修；源码审查与运行/闭包分开 |
| 产品定位 | FSA 记为 hypothesis，非 confirmed | 需外部条件 |
| Astra 目标模型行为 | 已检查的周期与 FSA 证据未提供目标模型对照；不作全仓不存在证明 | 需认证身份与测量实例 |
| 指令层相对收益 | benchmark 历史报告及 2026-09-20 勘误：现存文件复算 60 attempts / 55 valid / 5 excluded；受限单模型 fixture 未证明追加入口文本收益 | 仅方向信号，不支持模型或 field 外推 |

### 2.3 历史语料冲突与本周期处置

| 编号 | 历史问题 | 当前处置 |
|---|---|---|
| X-1 | 002 的 completed 易被读成仓内全验证 | 保留历史 owner 生命周期，正文区分线下收口与未入仓证据 |
| X-2 | P123 bare 只读前提与当前 source 冲突 | Goal/KTD2/U1/U4 已勘误；其他 P2/P3 单元仍未完成 |
| X-3 | 001 总方案与 002 协调计划范围混淆 | 明确 001 无 YAML active、候选不等于实施，002 按批次查证 |
| X-4 | 7 月行数/脚本指标被当作当前基线 | 两份原文已加历史快照说明，保留历史数字不作当前指标 |
| X-5 | 战略索引缺 FSA2/FSA3 | 已补入口；索引可达不证明审查完成 |
| X-6 | 7 月 stats 建设建议与当前优先级易冲突 | 标注本周期暂缓及重估条件，未永久否决或偷偷实现 |

---

## 3. 优先级判断与重估条件

当前应优先收窄声明与证据之间的距离：已有机制需要实测，已发现的逻辑分歧需要修复输入，field 协议还需要执行实例参数。有限 benchmark 没有证明入口文本的准确率增益，也没有证伪所有指令或 harness 的收益；本周期不使用“结构已过剩”或“收益已被证伪”作为事实。

后续按证据调整投入：真实任务发现机制阻断时先修 owner；宿主 primitive 已能满足目标时优先采用；相对收益不明确时做有界实验。只有配对任务、身份、质量与成本口径齐全的结果，才能支持加强、精简或推广默认路径。

---

## 4. owner 口径处置

以下三项已按当前用户“继续完成”的授权和既有推荐执行；新证据仍可触发回滚或重评。

**D-1｜002 的 `completed` 状态如何处置**（对应 X-1）— **已执行推荐**

已保留 `completed`，并在正文解释其来自历史 owner 线下收口；线下材料未入仓，仓内证据仍按批次读取。没有新增非标准 YAML 生命周期字段。
本次为既有授权下的文档处置，不冒充用户逐项确认，也不替历史 owner 的线下声明补写验证证据。

**D-2｜p123 计划契约前提的处置**（对应 X-2）— **已执行 source 勘误**

已修订该计划的 KTD2/U1 记录，显式标注该前提已被 FSA2 F-16/F-17 反向修正；保留合法的 `active`，因为当前状态仍包含未完成的 P2/P3 实施与验证单元，不使用非法 `superseded-by-evidence` 枚举。
理由：把失效前提修正为当前 source 是必要的；生命周期是否收口仍由后续真实验收决定。

**D-3｜`docs/项目审查/` 与 7 月建议的退役方式**（对应 X-4/X-6）— **已执行推荐**

保留两份文档并加历史快照标注；`spec-first stats` 本周期暂缓，未作永久否决，也未建设统一指标平台。
理由：保留演化证据，同时阻止过期数字被误读为当前基线。

---

## 5. 批次

### B0 语料卫生（立即可执行，无需裁决）

- **B0.1** 在 `docs/strategic-review/README.md` 补索引 FSA2、FSA3 与全链路审查方案 v2。
- **B0.2** 建立最小「状态语义」规则：分别记录文档生命周期、证据性质、运行结果与交付状态；`completed` 不自动等于验证通过，`confirmed` 不与 `degraded` / `not-run` 混为同一枚举。规则已落在工作契约 §6.1–6.3，既有文档逐项核对仍由 B1/B2 承担。
- **B0.3** 为 `docs/项目审查/` 两份文档补历史快照标注（X-4 部分，不含 D-3 的方向判断）。**已完成**：两份文档均标注 2026-09-20 历史快照，7 月 `spec-first stats` 记为本周期暂缓候选。
- **B0.4｜确定性地板转绿**：顶层 CHANGELOG 格式已修复；历史流程根因未知。最终条目写入后复跑格式/连续性检查并保留 command、exit、时间与 hash。本周期不改发布脚本。

验收：历史工作树修复后单元结果已记录；当前最终文档另经聚焦检查。不可把 dirty 工作树的通过写成未改动 HEAD 的通过。

### B1 计划语料冲突处置

- **B1.1** 按已执行的 D-1 / D-2 / D-3 口径处置 X-1、X-2、X-4、X-6；后续新证据可触发重评。
- **B1.2** 统一 001 与 002 的口径（X-3）：001 没有 YAML `status: active`，是 advisory 总方案；002 是协调方案生命周期。两者均补范围说明，不把候选方向视作已实施。
- **B1.3** 核对所有 `docs/plans/` 下 `status: active` 的计划，标出哪些实际已完成、哪些前提已被推翻（同一类记录错误可能不止 X-2 一处）。**已完成首轮 inventory**：8 个 active 计划已按 YAML metadata 全量枚举并写入 [`active-plan-inventory.json`](../validation/project-lead-cycle-1/active-plan-inventory.json)；该产物是 C0 语义 triage，不把任一 active 计划自动改成 completed。

验收：本批次处理的文档须明确区分生命周期、授权与验证状态，不能仅凭 `completed` 推断验证通过；B1.3 逐项记录核对范围和未解决冲突，不以 B0.2 规则成文替代既有文档核对。

### B2 证据缺口闭合（本周期最高价值）

- **B2.1｜宿主真实调用边界盘点**：确认当前 8 宿主中哪些可在本机真实调用并留下证据、哪些 `blocked` 及原因，闭合 FSA2 F-18 的可内部部分。
  产出：宿主 × 可调用性 × 证据路径的矩阵，含真实命令输出或 blocked 原因。
  **前提修正（2026-09-18 实测）：** 产出物已有既有契约——`docs/contracts/verification/host-invocation-receipt.schema.json`（`host-invocation-receipt/v1`），由 `skills/spec-runtime-setup/scripts/lib/host-authority.cjs` 生成，关键字段 `enforcement_status: loaded-root-checked | loaded-root-unverified`。复用其字段与边界区分安装、loader 和实际调用；矩阵只是盘点，不手工伪造具有 loaded-root 权威的 invocation receipt。
  **已实测的边界：** 本机 8 宿主中 `claude` / `codex` / `opencode` / `pi` 有 PATH CLI；Cursor/Kiro/ZCode 无对应宿主 CLI 但 GUI 应用已安装；Qoder GUI 已安装，另有 `qodercli` companion CLI（不能替代 Qoder GUI loader 证据）。四个 GUI 适配面必须单独记录为「GUI 适配存在」，不能因无 CLI 将其记为未适配。另注：按 `skills/spec-runtime-setup/SKILL.md:44` 的规定，该命令**必须**从「当前已加载的 skill 目录」解析，不得从 source checkout 路径解析，因此有效证据需经宿主投影而非源目录运行。
- **B2.2｜fresh-source 独立评审**：按 `docs/contracts/workflows/fresh-source-eval-checklist.md` 对核心 workflow 做一次可复核的独立评审。
  约束：评审方必须是 fresh 上下文，不能是本周期产出的作者；缺 dispatch primitive 时记录未执行原因并降级，不得声称通过。
- **B2.3｜审查证据可复核性要求**：FSA2 因「原审计证据大面积不可复核」导致 8 个单元由 passed 降为 degraded（`2026-09-14-fsa2-report.md:53-70`）——这是结构性问题，不是一次性事故。
  产出：最小要求定义，即「一条审查证据要能被下一次独立重放，必须留下什么」，并对照现有 FSA artifact 检验差距。
  已有可用素材：`docs/contracts/verification/` 下 `worker-dispatch-host-journey.md`、`provider-serving-receipt.md`、`verification-run-summary.md` 均已定义 freshness / limitations / invalidation condition / claim limit 的写法，本项应**收敛为可复用规则并检验缺口**，而非重新发明。
- **B2.4｜U9 承诺包审查**：按原方案 Batch A=5、B=11、C1=8 共 24 包执行有界逻辑审查；C2=14 依计划保留 `not-run`。先前 B/C1 的 19 条机械占位已撤销，必须以真实阅读范围、五分支判断和未覆盖依赖替换，计数以 [`u9/skill-receipts.json`](../validation/project-lead-cycle-1/u9/skill-receipts.json) 为准。
  - 目标与输入：冻结 HEAD `36d19d95`、1654 文件 manifest、包级 inventory；正例、near-neighbor、实际输出 consumer、关键停止、高风险恢复/交接逐包留证。
  - 边界与资源：一次性 worktree 内只读被审 source；主 owner 串行合并证据，独立只读 reviewer 分批审查，不调用外部模型/安装/宿主 mutation。receipt 写入不计作 Git 提交。
  - 停止条件：source hash 漂移、输出截断、关键 owner 未读则停止对应结论升级；429 重复失败退回 inline 或保留 `not-run`，不得用关键词命中代替审查。
  - 预算：沿用原方案按复杂度有界分批；已发生等待使主动耗时不可分离，本轮不据墙钟推算单包成本。未闭包面逐项列恢复点，不以包数或读取数作完整性证明。
  - 隔离：`execution_isolation: disposable-worktree`；完成后校验 source stability，先验证交付副本，再清理本次临时 worktree。主仓仅写计划授权的 docs/CHANGELOG 审查产物。

验收：每项产出可回源证据；未完成项写 `not-run` + 原因 + 重估触发条件。

### B3 收益假设复核

背景：历史报告的结论曾写成 45 次行为门测试、零指导 baseline 20/20 通过、与加载完整指令无差异；本周期复算现存四个结果文件为 60 attempts / 55 valid / 5 excluded，且原始筛选集未恢复。它仍是单一模型、受限 fixture 的方向信号，不是当前收益结论。

**前提修正（2026-09-18 实测）：** 原计划写「设计任务对照协议」是错的——**协议已冻结**。`docs/validation/ce-localization/field-validation/protocol.json` 已是 `FIELD-CE-LOCALIZATION-2026-08-20`（`frozen_at: 2026-08-20`），含 cohort、task_categories、pairing_rule、complexity_strata、actor_profiles、minimum_sample、metrics、decision_rule 与 predeclared 口径；`task-pairs.json` 已预注册配对结构。执行缺口包括 `task_pairs: 0`、`results: []`、`overall_status: not-run`，以及尚未冻结的事件、观测窗口、缺失处理和判定参数；schema 合法不等于执行设计充分。

- **B3.1** 复核既有基准的方法与当前适用性：任务集是否仍代表真实使用、judge 口径是否可复核、结论是否被后续模型变化推翻。
- **B3.2** 复核已冻结协议的可执行性与**可内部执行的子集**：哪些环节可用 repo-local 任务替代 A1（企业研发人员）角色的部分观察，哪些必须真实 actor。产出**可执行性判定**，不产出替代协议。
- **B3.3** 明确协议中必须外部条件的环节（真实 actor、真实项目、模型访问），列入 §6 owner-gated backlog。
- **B3.4｜P2/P8**：已补[矩阵立项与持续评测闭环](../validation/project-lead-cycle-1/2026-09-20-evaluation-and-market-follow-through.md)，明确比较对象、来源新鲜度、八维矩阵、版本/错误/收口触发、四轴汇总、反指标、Adopt/Experiment/Wrap/Thin/Build 处置。已用本轮 benchmark、field、U9 反例完成一次文档层闭环；未运行最新竞品实验或自动周期调度。

验收：判定可通过「换一个执行者能否复现同样的对照」这一检验；不得以 repo-local 替代品冒充 A1 actor 证据。

### B4 机制侧冻结

本周期不对 Skill 机制做能力性改动。唯一例外是 B1 修正所必需的最小文案修订。

本周期先交付可核验审查与修复输入。发现机制问题不等于可以在冻结审查中顺带修复；问题按 owner 与验收条件进入后续实施。

---

## 6. Owner-gated Backlog（显式记账，不隐藏）

| 项 | 为什么需要外部条件 | 重估触发条件 |
|---|---|---|
| Astra 目标模型身份与行为验证 | 需可用的目标模型服务端身份 | 目标模型可访问时 |
| 真实用户 field outcome / 产品定位验证 | 需真实用户与真实项目 | 有试点或真实使用者时 |
| Windows CI 补齐 | 需 Windows 执行环境 | 有 Windows runner 时 |
| 八宿主真实旅程（含 Cursor/Kiro/Qoder/ZCode GUI） | 安装已盘点；隔离目标、会话/账号与调用证据仍待绑定。GUI 自动化尚未探测，不能先记 blocked | 先完成不调用模型的可操作性探针，再在明确调用/数据范围内执行；companion CLI 不替 GUI |
| 指令层相对收益的多模型复核 | 需多模型访问 | B3.1 结论为「需重跑」且模型可访问时 |

**记账纪律：** 本表不得作为「等外部条件」的挡箭牌。任何列出项，若经 B2.1 盘点判定为可内部完成，必须移入 B2 而不是留在本表。

---

## 7. Non-goals

- 不新增宿主、skill、agent 或新能力体系。
- 不建统一指标平台、向量知识库或 Skill 市场。
- 不扩写根指令篇幅；有限 fixture 的饱和不能外推为全量指令冗余。
- 不做与 B1 修正无关的机制加固。
- 不在本周期内声明任何 field outcome。

---

## 8. 验证与收口

**每批最小验证：**

- docs-only 改动：`npm run typecheck`，并确认改动文档的相对链接可达。
- 涉及 source 的改动：最窄聚焦套件 + `npm run test:unit`。
- 涉及共享引用的改动：`npm run check:shared-references`。

**收口要求**（对应工作契约 §5）：每批结束时写全「已完成 / 未完成 / 为什么 / 重估触发条件」四项。本周期已按用户裁决收口为 `completed`；该生命周期状态只表示本计划范围的执行已结束，不等于所有外部验证通过。未运行的真实宿主、模型、GUI、账号、参与者与现场收益项目必须继续保留 `not-run` / `blocked` 及原因，并移交 §6 的后续人工验证 backlog。

---

## 9. 证据索引

- [`docs/10-prompt/项目负责人工作契约.md`](../10-prompt/项目负责人工作契约.md)
- [`docs/10-prompt/结构化项目角色契约.md`](../10-prompt/结构化项目角色契约.md)
- [`docs/validation/2026-09-13-full-system-audit-plan-v2.md`](../validation/2026-09-13-full-system-audit-plan-v2.md)
- [`docs/validation/full-system-audit/2026-09-14-fsa2-report.md`](../validation/full-system-audit/2026-09-14-fsa2-report.md)
- [`docs/validation/full-system-audit/2026-09-16-fsa3-report.md`](../validation/full-system-audit/2026-09-16-fsa3-report.md)
- [`docs/validation/runtime-setup-p123-progress.md`](../validation/runtime-setup-p123-progress.md)
- [`docs/validation/project-lead-cycle-1/2026-09-18-cycle-1-execution-evidence.md`](../validation/project-lead-cycle-1/2026-09-18-cycle-1-execution-evidence.md)
- [`benchmarks/agentic/REPORT-20260820-sonnet5-saturation.md`](../../benchmarks/agentic/REPORT-20260820-sonnet5-saturation.md)
- [`docs/strategic-review/2026-09-05-next-phase-capability-strategy.md`](../strategic-review/2026-09-05-next-phase-capability-strategy.md)

---

## 10. 执行记录与恢复入口

详细结果、原始探针和限制统一进入 [执行证据](../validation/project-lead-cycle-1/2026-09-18-cycle-1-execution-evidence.md)，避免本计划复制一份易漂移的审查总表。

| 批次 | 当前结果 | 未完成与恢复条件 |
|---|---|---|
| B0 | 索引、状态语义、历史标注与 CHANGELOG 格式已处理 | 历史运行顺序不可确认；本轮最终检查单独留证 |
| B1 | D-1/D-2/D-3 与 001/002 范围已纠正；8 个 active 计划完成 inventory/triage | 全部 active 的逐单元 DoD 未复验；不能自动改生命周期 |
| B2.1–B2.3 | 八宿主安装/适配边界、独立有界源码意见和最小证据字段已记录 | 真实 loader/invocation、历史 raw logs 与深层 consumer 仍有限制 |
| B2.4 | 24 包有界审查记录已整合：4 failed、20 degraded；确认 1 P1、7 P2 | 8 项已在后续授权修复阶段逐项修复；dependency closure 未全闭合，C2 14 包仍未运行 |
| B3.1–B3.3 | benchmark 复算与勘误完成；field schema/实例缺口已分开 | 未运行真实 cohort；先补执行实例/amendment，保留旧冻结数据 |
| P2/P8 | B3.4 的立项口径与周期复盘约定已交付 | 文档约定不等于矩阵调研或真实持续运行已完成 |
| B4 | 原审查阶段保持机制冻结；用户后续明确授权 8 项修复 | 原冻结证据保留，后续修复单独留证 |

2026-09-18 的历史单元结果为 238 suites / 2968 tests 通过；2026-09-20 已执行 typecheck 265 files、skill entrypoint lint 491 files。最终证据文件另记本轮准确 command、exit、hash 与限制。无被审产品源码改动，不为此次 docs-only 变更重跑完整模型或全部宿主链路。

**本计划现标记为 `completed`（按 2026-09-24 用户裁决）。** 本轮文档、有界审查产物、授权修复和本地回归已交付；未闭合依赖、真实宿主/模型/现场结果不被局部产物覆盖，继续以 `not-run` / `blocked` 记录并移交后续人工验证 backlog。8 项代码/合同修复另见下节。最终校验与范围见执行证据及 `final-checks.json`；冻结工作树的 1654 文件无漂移，主仓存在一处已披露的 LF/CRLF 差异。


### 后续授权修复阶段（2026-09-21）

授权来源为用户在问题列表后的「逐个问题，思考最佳方案进行修复，验证」及持续执行请求。该授权独立于原 B4 审查冻结；不倒写原计划已包含实现，也不扩大到真实宿主 runtime 写入、付费模型或远端发布。

已按问题顺序完成 8 项源码/合同修复、反例与定向验证，并处理 fresh-source 复核发现的两处相关缺口。当前状态以 [finding-ledger](../validation/project-lead-cycle-1/u9/finding-ledger.json) 与 [修复报告](../validation/project-lead-cycle-1/repairs/2026-09-21-repair-report.md) 为准。第 7 项选择保留父目录 bare 只读诊断并纠正文案；第 8 项保持单项目 bare 完整 artifact baseline、普通 plan/verify 默认 installation 的既有产品行为，通过共享执行建议保持计划范围。

本次源码修复完成后，按用户 2026-09-24 裁决将周期方案收口为 `completed`；这不升级原包级 receipts、宿主 loader/invocation、模型、field 或 comparator 证据。

修复阶段最终广域回归仍为 `degraded`：CE 清单/旧审查快照两个 unit 失败，全仓另有其他任务 TSV whitespace；定向修复通过不豁免这些检查。smoke 与 integration 已在主链 unit 阻断后独立完成，详见修复报告。

后续收口更新：上述回归残留已在用户继续授权后修复，完整 npm test 3088 通过 / 2 条件跳过，全仓 whitespace 通过。CE 历史完整性与 current claim 已分层，current binding 仍 stale；详见 [剩余回归报告](../validation/project-lead-cycle-1/repairs/2026-09-21-residual-regression-report.md)。本轮局部修复与本地回归已完成；方案按用户裁决标记 `completed`，外部验证仍由 §6 backlog 承担。
