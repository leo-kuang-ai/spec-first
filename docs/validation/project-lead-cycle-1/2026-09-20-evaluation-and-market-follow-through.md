---
artifact_type: advisory
status: proposed-execution-contract
updated_at: 2026-09-20
owner: project-lead
plan: docs/plans/2026-09-18-001-project-lead-cycle-1-plan.md
---

# 周期 1：竞品矩阵立项与持续评测闭环

本文件完成 P2 的矩阵口径和来源要求、P8 的触发和处置约定。它是可执行的工作安排，不是竞品能力已验证、自动化已上线或现场收益已发生的证明。本周期不新增平台、调度器、schema 或产品机制。

## 1. P2：围绕决策建立能力矩阵

**要回答的决策：** 在已有 AI coding 宿主的研发任务中，哪些能力直接 Adopt，哪些只需最小 Wrap，哪些具有项目长期拥有的证据/交接/知识缺口而值得 Build；没有收益证据的候选进入 Experiment/Defer。主用户和 anti-persona 沿用[定位基线](../2026-09-13-full-system-audit-plan-v2.md#working-positioning-baseline)，不把不使用 AI coding 宿主的团队纳入默认用户。

**比较对象分层：**

| 层 | 首批对象与来源入口 | 用途与限制 |
|---|---|---|
| 宿主原生基线 | Claude Code、Codex；已有来源账本 O1–O6/A1–A6；Cursor/Kiro/Qoder/OpenCode/ZCode/Pi 从各官方文档与当前 adapter 定向补充 | 比较各宿主的原生 primitive 与入口；CLI 与 GUI 分行，不能用 CLI 缺失否定 GUI 能力 |
| 项目工作流方案 | 当前 spec-first、Compound Engineering；后续可纳入 OpenSpec、Spec Kit 等具名候选，先核实官方 repo 与实际 consumer | 比较 intent→plan→code→review→knowledge 的连接责任，不将“有同名 Skill”当语义等价 |
| 最小替代方案 | 原生宿主 + 项目必要规则 + 现有测试/CI/人工 review | 是必须保留的反方基线，不能与“零工具、零约束”混同 |

首批先完成 Claude Code、Codex、spec-first、Compound Engineering 和最小替代方案的同场景对照；其余宿主先核验适配/入口与证据能力，再按试点优先级扩展。本文件不声称已经重新读取外部站点：9 月 5 日[来源账本](../../strategic-review/2026-09-05-harness-research-sources.md)只是发现入口，当前版本事实需要重新读取官方正文。

矩阵按“对象 × 版本/日期 × 执行面 × 场景”一行，不用一个总分覆盖以下维度：

| 维度 | 要求的可核验问题 |
|---|---|
| 意图与验收 | 需求、计划、任务和验收证据怎样连接？谁拥有 source？ |
| 上下文与接续 | 加载范围、检索来源、stale 检出、resume/handoff 是否可回源？ |
| 执行与权限 | 隔离、授权、停止、回滚/恢复由谁实施？哪些是 hard gate，哪些只是约定？ |
| 审查与验证 | 是否验证最终 diff、untracked/index、失败归因、真实 outcome？ |
| 多宿主与可移植 | CLI/GUI 的 projection、loader、invocation 各有什么证据？哪里 lossy/degraded？ |
| 知识与失效 | 经验何时可提升为 durable knowledge？如何撤销和重验？ |
| 首次采用与成本 | 首个可信变更需要哪些步骤？额外确认、返工、维护、review 成本是否可测？ |
| 相对收益 | 同任务与复杂度、同输入和允许工具、同质量约束下的效果与不确定性如何？ |

每行至少保留：`comparison_id`、场景/JTBD、对象版本和渠道、核查日期、官方 URL/版本固定引用、实际读取章节、事实摘录、项目推论、证据范围、未验证项、consumer、建议处置与重估触发器。字段是人工账本约定，暂不新增 JSON schema。

**来源与验收：**

- 产品事实优先官方文档、release note、固定 commit 源码；论文与厂商实验分别注明模型/任务/版本与复现状态。搜索摘要只用于导航。
- “官方有此功能”“本机存在适配”“真实运行成功”“相对效率有益”分别记账。冲突保留双方时间和引用，不选更有利的一方；缺证记 `unknown/not-run`。
- 首批至少覆盖一次存量代码修复、一次需求到审查、一次跨会话接续三个场景；能力主张均有一手来源，效益主张另外要求配对结果。文档比较完成不等于现场对照完成。
- Project lead 负责来源复核与建议；架构 reviewer 查是否重复宿主 primitive；FDE/field owner 提供真实任务与采用约束。语义判断不能交给字段计数脚本。
- 停止：来源无法访问/版本不明则只阻断该行 claim；无配对数据不排收益名次；新增模型费用、受限数据外发或真实宿主写入回到对应授权边界。

## 2. P8：复用现有资产形成周期闭环

现有 owner 保持不变：

- [角色契约](../../10-prompt/结构化项目角色契约.md)决定四轴价值与证据边界。
- [战略 §5](../../strategic-review/2026-09-05-next-phase-capability-strategy.md)定义候选投资与指标；本文件将其接到具体触发和处置。
- [field protocol](../ce-localization/field-validation/protocol.json)拥有 cohort/配对/冻结纪律；[task-pairs](../ce-localization/field-validation/task-pairs.json)与[results](../ce-localization/field-validation/results.json)当前为空，保持不变。
- [measurement-admission.cjs](../../../skills/spec-optimize/scripts/measurement-admission.cjs)校验 source/corpus/harness/environment 身份、A/A 重复、阈值、噪声、重试与停止预算。准入脚本不裁决业务收益；本轮只读其输入校验，未运行优化实验。
- [verification-run-summary](../../contracts/verification/verification-run-summary.md)承接实际命令与退出结果；[fresh-source checklist](../../contracts/workflows/fresh-source-eval-checklist.md)承接当前源码语义审查。

| 触发 | 最小动作及 owner | 产物与后续消费者 |
|---|---|---|
| 每轮负责人周期收口 | Project lead 对照 scope，汇总已执行/未执行/失败/限制与实际成本；没有新数据也明确记零新增样本 | `docs/validation/` 周期报告；下一轮 plan 消费 |
| canonical Skill/共享出口/consumer 改变 | 对应 source owner 跑聚焦回归；行为语义改变另做 fresh-source/负例；只测影响面 | 原 run 的 checks、review、source hash；发布/完成 owner 消费 |
| 宿主、模型或 provider 重大升级 | Host/eval owner 先核实版本/身份，再重跑受影响 loader/journey 和代表用例 | 版本绑定的结果；默认路径与矩阵更新 |
| 真实错误、越权、恢复失败、review 负担增加 | Debug owner 保存反例并停止受影响 claim，定位后交本地修复和回归 | finding→fix→复验链；不等待季度总评 |
| 要宣称提效、扩大采用或精简补偿机制 | Measurement/field owner 先冻结执行实例与反指标，校准 A/A，再做 paired A/B/holdout | 原始事件与可重算差异、限制；Project owner 裁决推广/退役 |
| 已保留 aspirational 能力连续两轮无激活证据 | Project lead 记录为何保留、明确激活输入与下一次重估；若无 consumer 提出 Defer/Retire | 当前路线中的处置记录；不自动删除功能或知识 |

以上是人工执行约定，未安装定时任务或自动 gate。首次触发从本周期报告落地开始；实际持续有效性要由后续周期结果证明。

## 3. 汇总、反指标与处置

每次结果沿四轴分开：`structure_contract`、`behavior_quality`、`runtime_cost`、`field_outcome`。原始 attempts、有效样本、排除及原因、失败、环境错误、timeout、not-run 均保留；历史筛选集不明时只做复算勘误，不重建一个假定的最终样本。

对相对收益，先在独立执行实例/amendment 中冻结：真实 actor/pair、复杂度与顺序、source/宿主/model 身份、trusted-change 起止事件和验收者、吞吐观测窗口及分母、返工归属、缺失/中断/超时规则、最小有意义效应、噪声上限、停止预算与脱敏存放位置。没有这些参数时，保留 `not-admitted/not-run`，不向历史冻结 cohort 补造样本。每类至少 3 对仅供 exploratory，不构成普遍收益结论。

| 主结果 | 必须同看反指标 | 决策边界 |
|---|---|---|
| time-to-trusted-change | 任务正确性、越权/安全回归、后续返工、人工 review/澄清时间 | 提速不能抵消关键质量或权限失败 |
| quality-adjusted throughput | 被接受任务分母、失败与丢弃样本、冲突/回滚/维护、任务组合变化 | 不将代码量/token/agent 数当吞吐；质量不合格不计可信交付 |
| 上下文/知识成本 | 重复调查、错误召回、陈旧事实、用户纠正、接续丢失约束 | 更短或更便宜不自动更好；有反例需降级并重验 |
| 宿主适配 | GUI/CLI 分层成功率、人工步骤、loader 漂移、降级可见性 | 安装成功不覆盖 loader；一个宿主不能代替所有宿主 |

处置必须记录“证据→判断→下一步”，不由分数自动执行：

- **Adopt / 保留：** 宿主已有能力满足当前 consumer，或项目机制在适用范围有可复核收益；保留范围和失效条件。
- **Experiment / Defer：** 差异小于预声明噪声、代表性不足、结果相互冲突或未取得输入；写最小实验/恢复条件，不宣布无效。
- **最小 Wrap / 修复：** 有明确权限、证据、可移植或恢复缺口；由 owning source 的小改动解决，再跑反例回归。
- **Thin / Retire：** 有实际重复/维护成本与可替代 consumer 证据；先预览迁移与回滚，按相应授权执行，不能只因没有 field 数据就删。
- **Build：** 原生能力与既有 owner 都不能承接、真实任务确认 durable gap 后才立项；需求、consumer、失败路径与验收进入后续实施计划。

## 4. 本周期实用一次闭环

| 输入证据 | 当前判断 | 已执行处置 | 后续触发 |
|---|---|---|---|
| benchmark 四 run 复算与 runner 输入 | 历史计数/“完整指令”表述不支持原外推 | 历史报告加勘误，保留 raw；未改默认机制 | 恢复选集并完成可比测量后再讨论收益 |
| field schema 合法、任务与结果为空 | 资产可复用，执行实例尚不足 | 列必补参数与外部条件；保持旧冻结文件 | field owner 绑定真实任务和参数后进入准入 |
| U9 source/fixture findings | 关键出口与恢复存在可修问题 | 去重问题账本，提供 owner、触发、修复、回归条件 | 后续 `spec-debug`/实施计划按优先级修复 |
| B/C1 旧机械占位 | 不能证明语义审查 | 撤销旧覆盖声明，用真实读源结果重建 receipt | 最终 hash/覆盖/范围校验后保留有限结论 |

完成的是一次文档与审查层的闭环；自动运行、真实 field 样本与长期收益仍未完成。
