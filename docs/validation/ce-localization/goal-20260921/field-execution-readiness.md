---
artifact_type: advisory
status: draft
date: 2026-09-21
owner: project-lead
protocol_id: FIELD-CE-LOCALIZATION-2026-08-20
amendment_id: FIELD-CE-LOCALIZATION-2026-09-21-DRAFT-01
approval_state: draft-not-owner-approved
execution_state: not-run
---

# 真实任务与现场收益验证：执行条件及 amendment 草案

当前可以准备并执行获授权的真实仓库、真实模型内部任务；进入原 CE 现场 cohort，仍缺真实 actor、任务对、执行身份及执行前冻结的指标参数。最小启动单位是一对真实任务，原协议的 exploratory 最低覆盖为三个任务类别各 3 对，即 9 对、18 个 arm。一个真实样本、一次模型成功或 9 对全部通过，都不能直接写成 `confirmed-improved`。

本文是 2026-09-21 新持续任务的执行准备，不把原周期计划“不声明 field outcome”的历史边界倒写为已执行。本文中的数值均为明确标注的草案建议；尚未开始测量，未取得 owner 对 amendment 的批准。主 owner 应先回读当前任务授权，已有授权不重复索取；只有实际缺失的 actor 参与、受限数据/新渠道、费用或其他新增副作用需要补齐。

## 1. 已核实的冻结内容

| 项目 | 当前事实 | 直接来源 |
|---|---|---|
| 旧协议 | `FIELD-CE-LOCALIZATION-2026-08-20`，声明冻结于 `2026-08-20T00:00:00.000Z`；source 为 `66b0e0c6c83c1e75d2e9634132586bfce5581ff3` 加声明的 dirty snapshot | [protocol.json](../field-validation/protocol.json)，6–9、223–224 行 |
| cohort / actor | `enterprise研发任务代表性用户`；`A1企业研发人员`、`A2项目owner` 是角色类型，未绑定真实参与者 | 同文件 225–241 行 |
| 类别与分层 | 需求到计划、实施到审查、交付与知识复用；低/中/高复杂度 | 同文件 228–238 行 |
| 配对 | 按同类任务、复杂度、角色、宿主和 provider readiness 配对，不跨链路归因 | 同文件 233 行 |
| 样本与提升条件 | 每类至少 3 对 exploratory；confirmed 需预声明 effect/不确定性并独立复现 | 同文件 252 行 |
| 指标 | `time-to-trusted-change`、`quality-adjusted-throughput`、返工次数、人工审查负担；尚无事件定义、单位、窗口或公式 | 同文件 253–259 行 |
| 实际样本 | `task_pairs=[]`、`results=[]`、`overall_status=not-run`、`reproduction_status=not-run` | [task-pairs.json](../field-validation/task-pairs.json)，224–232 行；[results.json](../field-validation/results.json)，224–233 行 |
| 原原因码 | `field-owner-execution-not-authorized`、`representative-task-cohort-not-available` | protocol 261–264 行；这是旧快照原因，不能单凭它认定当前授权仍缺失 |
| 周期要求 | 新执行须绑定当前 source、真实角色、配对/顺序、事件、缺失策略、阈值、噪声、预算、脱敏和存放边界 | [周期执行证据](../../project-lead-cycle-1/2026-09-18-cycle-1-execution-evidence.md)，175–201 行；[P8 约定](../../project-lead-cycle-1/2026-09-20-evaluation-and-market-follow-through.md)，66、73–75 行 |

2026-09-21 本次只读 SHA-256 核对：

| 文件 | SHA-256 |
|---|---|
| `field-validation/protocol.json` | `3c524804da292b8dee9c36c9be0ddd6fccf3fee506a588d81676e2cc4b26e032` |
| `field-validation/task-pairs.json` | `8326ffaf3b54c3e520ab5c6b760cc065492b7248118452aa4dab9a2e43b0d309` |
| `field-validation/results.json` | `316d6c27f5c18f0688bee6caffca1e68f11de2b19917f657b89603fb7217e3b9` |

两份 evidence 中的 `protocol_sha256` 均与当前 protocol 文件相符。该一致性只证明引用的字节相同，不证明旧冻结时间、当前 source 适用性、任务注册或现场执行。

## 2. 实际可执行的任务矩阵

以下行是任务定义和待绑定槽位，均为 `not-run`，不计入原协议的任务或样本数。

### 2.1 不等待外部 cohort 的真实内部工作

| ID / 实际任务 | 必需输入与执行方式 | 验收与记录 | 当前精确缺口 / 可支持结论 |
|---|---|---|---|
| I-01：对当前实际修改的 Skill 出口做一次真实代码审查 | 从本轮真实 diff 选择一个尚未被评审者知道结论的边界，例如 `spec-worktree` 的隔离/恢复变更或 `spec-work` 的 closeout 变更；主 owner 固定 source/tree hash、diff 和当前需求。两个新会话分别使用原生宿主 + 相同项目规则、以及相同输入 + 目标 review workflow；独立副本、同权限/工具/模型，不给已知 finding 或修复答案 | 保存全部 findings、非 finding、未完成项、tool logs、实际时长/成本；由同一验收者回源确认误报/漏报，不能用模型自评分替代事实。主任务真实消费审查结果 | 需绑定本轮最终 diff、无答案泄露的 reviewer、model/channel/预算、验收者。可支持“真实维护任务上的内部 review 质量/成本对照”；没有真实研发 actor 的过程记录时，不算 A1 field |
| I-02：完成当前 CE 证据消费/再生成的实际维护任务 | 以主 owner 当前已授权、尚未完成的 CE 任务为准；输入真实当前 snapshot、合法的新 run 输出目录和验收清单。禁止把已修完的 8 项故障再次注入而称现场问题；历史回放必须另标 retrospective | 产物被实际下游校验/审查消费，保留命令 exit、source hash、失败和返工。两个 arm 的实际改动互相隔离，不能操作同一主仓状态 | 需主 owner 指定一个仍未解决的真实维护单元并冻结前置状态；若已完成，选择下一项真实任务，不制造缺陷。可支持真实工程结果；未有 paired arm 不能声称相对收益 |
| I-03：把本轮一个真实未完成任务交给新会话接续 | 固定 pending task、约束及 source snapshot；同一基础材料下，一侧按原生会话/项目材料接续，一侧增加目标 `spec-handoff` 产物；跨会话隐藏原作者答案 | 记录恢复到首个正确行动的时间、重复调查、漏掉约束、实际完成质量；继续到原任务验收，不能只检验 handoff 文件存在 | 需真实 pending task、同等未见过历史的接续执行者和相同工具/权限。可支持内部真实接续结果；不自动成为跨团队采用证据 |
| I-04：目标 GUI 宿主中的首次真实 workflow 使用 | 在授权隔离项目内选择 Cursor/Kiro/Qoder/ZCode 中一个真实目标；先探测可操作性，再记录该 GUI 的版本、投射 hash、loader 与实际 invocation，保持模型/数据权限边界 | 留下实际 GUI 路径和任务产物、人工步骤及失败；companion CLI 不能替 GUI，启动应用不能替 loader | 需绑定目标 app/账号、可操作路径、隔离目录、model 与数据授权。它是宿主现场使用证据，仍不能仅凭一次成功推出提效或八宿主等价 |

I-01/I-02/I-03 使用真实项目和真实模型，并有实际 consumer，属于真实内部任务研究；它们不是 toy fixture。主 owner 可以在新任务已授权范围内继续这些工作。该 child 只准备条件，不调用模型、不复制 runtime、不改变主仓源码。真实企业研发人员也可以在本仓承担 A1；地点在本地并不是排除条件，关键是其角色、任务必要性、实际使用、验收和代表性有证据。

### 2.2 原 cohort 的最小 9 对现场任务槽位

| 槽位 | 干预类别 / 数量 | 真实任务准入 | baseline / candidate / 归因 | 实际 consumer 与完成条件 | 当前缺口 |
|---|---|---|---|---|---|
| F-P-01～03 | 需求到计划，3 对 | 六项本来需要开展的真实需求或变更；每对在同类项目、角色与复杂度上匹配。不能使用已写好方案当未知需求 | 原生宿主 + 必要项目规则，对照相同环境 + 冻结的 `spec-brainstorm/spec-plan` 范围；多 Skill 整体变化记 `chain`，不能归因到单一 Skill | A1 使用产出的计划实施，A2 接受验收标准；记录计划接受时点，并继续追踪真实变更验收 | 未提供具体需求/仓库、A1/A2、复杂度 adjudication、两个 arm 的内容 hash |
| F-I-01～03 | 实施到审查，3 对 | 六项真实待实现或待审变更；开始前定义相同质量要求和复杂度。已被试验者看过修复答案的故障不得当首次任务 | 原生宿主 + 现有 tests/review，对照相同环境 + 明确的 `spec-work/spec-code-review` 或指定单 Skill；只有一个变量时才记 `single-skill` | 实际项目 owner/授权 reviewer 接受最终 diff 和必要验证；失败、拒绝及回滚保留 | 未绑定真实任务/验收者、合法执行目录、可用模型、统一环境/权限 |
| F-K-01～03 | 交付与知识复用，3 对 | 六项真实交接/后续复用任务；必须存在后续实际 consumer 和使用机会 | baseline 沿用团队现有交接/知识；candidate 增加固定的 `spec-handoff/spec-compound` 能力；不以“有文档”作收益 | 新会话/其他研发实际使用产物解决后续任务；记录重复调查、纠正、失效知识及最终验收 | 未绑定后续任务/接收者及使用日期；仅发布 knowledge 没有使用事件时不能计复用完成 |

为避免同一人在第二次已知答案，草案采用“同类但不同的真实任务”配对；9 对对应 18 次真实任务执行。首对只需先绑定两个任务，不要求一次找齐 18 个。跨类别不直接合并吞吐或时间；建议每类覆盖低/中/高各一对作为探索分层，但这不是原协议规定的配额，每层一对也不支持层内总体结论。若只能取得一个复杂度层，应执行窄范围 pilot，并明确剩余类别/复杂度未覆盖。

最小真实参与可以是一位兼具研发与项目责任的用户，分别记录 A1 操作与 A2 验收身份，结果限定为单人内部 pilot，不能声称企业用户代表性或独立复现。不能由 Agent 扮演 A1/A2 填表，也不能把当前用户要求持续执行等同于用户已对具体结果验收。后续代表性 cohort 与独立复现需要另行绑定不同参与者/任务。

## 3. Draft amendment：开始第一对前冻结的约定

以下是 `DRAFT-01` 建议值，未写入旧 protocol，未获 owner 批准，不存在已注册的 `pair_id`。可由获委托的测量 owner 在首个任务观察前采用/修订并保存真实决定来源；人的任务参与和实际验收仍须真实发生。

### 3.1 干预、身份、顺序与周期

| 参数 | 草案值 / 冻结动作 | 不能省略的记录 |
|---|---|---|
| 目标 claim | 首轮仅 `exploratory`：验证流程可执行，记录配对差异与失败；不设本轮 `confirmed-improved` 出口 | 面向哪类 actor、任务、宿主和模型；不声称全产品/全宿主收益 |
| baseline | 原生 AI coding 宿主 + 与 candidate 相同的必要项目规则、权限、测试和可用工具；不把 baseline 变成零上下文/零质量门 | 输入 hash、规则/系统提示来源、实际加载列表；两 arm 安全规则不得不同 |
| candidate | 同一基础环境，仅加入该 pair 声明的 Skill/链路与指定源版本 | `candidate_feature_set`、`skill_ids`、`intervention_unit`、`attribution_mode`；链路改善不分摊到单 Skill |
| source | 每 arm 固定 `full HEAD + dirty diff/manifest hash + included/excluded paths`；旧 `66b0e0c6…` 不自动成为当前 baseline | 运行目录、hash、source/runtime 投射关系；任务中途漂移停止可比性结论 |
| actor / evaluator | 具名或本地匿名 ID 的真实 actor、角色、经验、对任务既有知识；独立 evaluator 以匿名 arm 包评判 | owner 的授权引用、实际验收事件；无法盲评时记 `not-blinded`，不伪造独立性 |
| 顺序 | 同一 actor 在两个匹配任务上交叉 A→B / B→A；每个 pair 的任务分配与顺序在开跑前用固定 seed 生成并保存 | 草案 seed `20260921`；首对顺序与后续对交换。人不可隐藏自己使用的工具，避免宣称 actor 盲法 |
| 首轮周期 | 从首个真实任务释放时间 T0 起 10 个实际工作日完成招募/执行观察；每个接受变更另外观察 5 个实际工作日的返工/回滚 | 真实 T0、工作日历、时区和结束日期；观察未结束先报 provisional，不把等待时间隐藏 |
| 超时 | 按 pair 复杂度冻结同一 active budget：低 2 小时、中 4 小时、高 8 小时/arm；这是试运行资源上限，不是任务难度真值 | actor/tools 累积 active、等待、elapsed 分开；每 arm 最长 elapsed 2 个工作日，超出记 timeout/censored |
| 费用 | 不自行新增付费调用；已有获准渠道按原授权执行。执行 owner 必须写入实际 `provider/account/model` 和数值金额/调用上限或可核验的既有预算引用 | 本草案不把“自主调研”解释为无限费用，不因已有精确预算另行索权 |
| 外部写入 | 真实 repo 写入限定当前任务和隔离目录；真实 runtime 修改、外发、merge/push/发布各按既有授权核对 | 无需为了测量强行发布；本地被真实 consumer 验收可计对应范围 trusted change，不能冒充部署 |

### 3.2 指标、事件与反指标

统一使用带时区 UTC 时间戳并保留原时区。每条事件至少有 `run_id/pair_id/arm/task_id/actor_id/event_type/timestamp/source_ref/outcome/evidence_ref`；clock 与计时方式执行前固定。人工作量取自真实 start/stop/备注记录，缺失不能由 token 或模型估计补齐。

| 指标 | 可重算定义（草案） | 失败和反指标处理 |
|---|---|---|
| `time-to-trusted-change` | T0 = 实际任务交给 actor 且输入可访问；T1 = 预声明质量/安全/必要验证通过，且授权验收者接受具体产物。主结果为 `T1 - T0` elapsed；active、等待和 tool 时间单列 | 未通过或未验收没有 T1，记右删失/未完成，不能补 0 秒或丢样本。需求→计划只完成阶段时另记 `time-to-accepted-plan`，不冒称可信代码变更 |
| `quality-adjusted-throughput` | 同类别、相同固定观察窗口内，经接受且观察期内未撤销的任务数 / 该 arm 的真实人力 active 小时；同时报告完成率及单位日历工作日接受数 | 未完成/拒绝纳入 assigned 分母，质量不合格不进入 accepted 分子；返工/回滚时间记入成本。18 个不同任务不能忽略类别/复杂度组合后简单合并 |
| 返工次数 | 每次已交付后因不满足冻结验收、漏约束或新引入错误而再次修改计一个 cycle，保存原因、时间、关联 diff | 合法新增需求单独记 scope change；不得全当新需求掩盖返工。观察窗口外发现的问题追加后续证据，不倒改原冻结结果 |
| 人工审查负担 | 所有 reviewer 的实际 active 审查/澄清/复验分钟数之和；重复审查也计入 | 未记录为 missing，不用 commit 数、消息数或 LLM 自评替代；报告角色与是否同一人 |
| 反指标 | 每 arm 同报接受/失败率、关键安全/越权事件、回滚、人工澄清、额外工具成本及维护/接续纠正 | 速度和 token 改善不能抵消关键失败；零观测事件不能推出总体安全非劣性 |

`trusted-change` 的验收人和具体质量门在每对开始前列出；任务类别并不改变最终变更的定义。阶段研究可以止于 plan/review/knowledge 产物，但只能声明阶段效果；要回答 G4 仍须追踪最终真实变更。后续真实使用尚未发生时，知识复用时长/收益保持 `not-run`。

### 3.3 A/A、缺失、阈值和结论

- **先校准，再对照。** 同一冻结内部 calibration 任务用相同 arm 与新会话做至少两次 A/A；不能让同一个人重复已知答案后把熟练收益当噪声校准。真实 cohort 用不同匹配任务和交叉顺序另外控制人学习效应；模型 A/A 不代表人群或 field 的噪声已充分估计。
- **准入复用。** [measurement-admission.cjs](../../../../skills/spec-optimize/scripts/measurement-admission.cjs) 接受 `admit --input <admission.json>`，再接受 `allow-ab --input <aa-calibration.json>`。它要求至少 2 次 A/A、不可变身份、阈值、噪声、重试、attempt 和 timeout 预算；每个被判断的数值指标分别绑定输入。脚本只校验结构与传入噪声，不自行从样本估计噪声、不检查真实 actor、不代表收益判定。
- **草案噪声计算。** 对正值时间/成本，A/A 相对波动先用 `(max - min) / median` 明示计算，草案噪声上限为 `0.10`；超过则停止该效应 claim 并检查环境/测量，最多加两次预定 A/A，不选最有利子集。两次 A/A 只作早期筛查，不估计可信总体分布。
- **草案效应阈值。** exploratory 的进入后续确认研究信号为同一类别配对 `1 - candidate/baseline` 的中位时间改善至少 `0.15`，且每对质量验收、权限边界均满足；人工 review 分钟不得劣化超过 `0.10`，返工/回滚无新增关键问题。分母为 0 的项保持不可计算并报告实际值；这些数值是资源/研究决策建议，不是统计显著性或已确认收益。
- **原始样本不删除。** 每次 attempt 记录为完成、任务失败、harness-error、timeout、环境漂移或未运行；基础设施错误最多重试 1 次/arm，必须有新 attempt ID 并保留旧日志。质量失败不能改成环境错误后排除；全数据的完成率与失败原因和仅完整 pair 的时间差分开报告。
- **缺失与变更。** 缺一个 arm、真实成本或验收证据的 pair 记 `degraded`，不可用于相对收益结论；在全部 assigned 分母中保留。任务复杂度变更/输入不足按照开跑前排除规则留证，不结果导向补换；补充新任务用新 pair ID。资源上限触发后不为凑足 9 对追加无上限运行。
- **确认研究另立实例。** 满足 9 对仅完成 exploratory 覆盖。`candidate-confirmed` / `confirmed-improved` 必须另有预声明主效应、最小意义效应、基于 pilot 方差的样本/不确定性方案、真实质量非回归约束及独立 cohort/执行者复现。不能因探索结果为正，就回填本轮为 confirmatory；复现允许无差异或负向结果。

## 4. 不改冻结文件的产物路径

执行 owner 在条件齐全后使用本目录下新的 run 子目录，例如 `runs/<actual-run-id>/`。以下是拟议路径，当前不存在也未伪造：

| 产物 | 最少内容 / consumer |
|---|---|
| `amendment.md` | 旧 protocol/hash、具体变更、当前 source/arm、owner 决策来源、冻结时间、上述取值；field owner 和后续 reviewer 消费 |
| `task-pairs.json` | 复用 v1 task-pair 形状，列实际 pair、skills、category、complexity、intervention、attribution、feature set、order、blinding、event schema、missing policy、status 和 refs |
| `participants-and-authority.json`（受控 sidecar） | 匿名 actor/真实映射的受控位置、真实角色、验收者、任务/数据/渠道/费用/写入授权；禁止把凭据或身份敏感信息写进公开仓库 |
| `source-and-environment.json` | 两 arm 源、runtime、host/model/provider 身份与核验级别、工具/权限、数据与 prompts 的 hash；claim 按实际身份能力收缩 |
| `events.jsonl` / `attempts.jsonl` | 真实开始、调用、artifact、验证、验收、返工、失败、超时、成本、后续使用；支持确定性重算 |
| `admission*.json` / `aa-calibration*.json` | 实际数值、独立身份与 A/A 结果，保留命令、exit 和校验输出 |
| `results.json` / `analysis.md` | 复用 v1 result envelope，数值/原始事件经 `evidence_refs` 回源；明确 partial、excluded、失败、限度及真实 reproduction status |

现有 [results schema](../../../contracts/verification/field-validation-results.schema.json) 的 `taskPair` 与 `result` 都是 `additionalProperties: false`，顶层也限制额外字段；actor、授权、预算和事件不能随意加进旧 JSON。用已有 `event_schema_ref` / `evidence_refs` 引用 sidecar，或另行提出明确 schema 变更。`metric_results` 当前是字符串数组；它不替代可重算的数值原始账本。

`scripts/check-ce-localization-review.cjs:1278–1293` 会核对旧 protocol/results/knowledge hashes，并禁止 field `not-run` 时知识 promoted。新 run 不会自动被旧 closeout consumer 接纳；保持旧链原样。若以后要把新 run 提升为 CE 当前汇总证据，须由对应 owner 先审查新结果，再显式迁移 refs/hash 和相关 consumer，不借此次 readiness 文档静默改旧状态。

## 5. 精确缺口与最小下一步

| 缺口 | 谁能补 | 当前可做的最小动作 | 阻断范围 |
|---|---|---|---|
| G1：真实 A1/A2 与实际验收者未绑定 | 当前用户/项目 owner 可指定自己或已授权真实参与者；Agent 不能代演 | 先绑定首对实际操作者与接受产物的人；不必先招满一个大 cohort | 原 cohort 的真实 actor claim；不阻断内部真实模型研究 |
| G2：没有两个可比真实任务 | 主 owner 从已授权的当前 backlog 找；无法获取时由真实 actor 提供 | 为首对列任务 ref、仓库/访问范围、为何本来就要做、复杂度、输入及 DoD；已完成问题只能 retrospective | 该 pair 开跑与配对收益；不阻断采集现有真实任务单臂结果 |
| G3：model/channel/host 及费用未实例化 | 主 owner 只读盘点现有会话/CLI/GUI 可用性；真实账号/新增预算由 owner 给出 | 选一个现有获准渠道；核验实际服务身份上限，不用请求 model 字符串冒充 serving identity | 依赖该渠道的调用与模型特定 claim；不足不阻断 source/readiness 工作 |
| G4：当前 source、arms 和污染控制未冻结 | 主 owner / measurement owner | 生成当前 source/environment 清单，先读现有 dirty ownership；两个 arm 独立目标，排除答案泄露 | 比较可归因性；不能拿旧 hash 覆盖当前代码 |
| G5：指标、窗口、A/A、阈值/预算缺值 | 获委托的 measurement owner 可据本文草案落值 | 在首个样本前固定并保留决定依据；跑计时/事件重算与至少两次真实 A/A，不把合成事件计作 field | 效果/不确定性判断；不妨碍采集明确 exploratory 的非比较观察 |
| G6：真实任务数据/外部接收方/写范围未绑定 | 对应数据/项目 owner，已有明确授权可复用 | 将现有授权映射到确切 repo、字段、渠道、actor 与副作用；只问新增或无法推断部分 | 受影响访问、调用或写入；不泛化停止所有任务 |
| G7：知识复用机会、返工观察及独立复现未到位 | 实际 downstream consumer、field owner | 首对指定后续使用任务/日期，按实际窗口追踪；另预注册独立复现 | 复用收益、稳定改善、代表性 claim；当前样本可以先标 provisional |

对主 owner 的建议执行顺序：先完成 I-01 的真实新 diff 对照或 I-02 的真实维护任务并留下事件；同步从当前授权和现有项目中绑定 F-I-01 的两个真实任务及实际 actor。若仍无真实 actor，交付内部实测证据并明确 field 为 `not-run`，把唯一需要用户补充的内容收敛为“首对任务/仓库范围、真实执行与验收人员、已有模型渠道/预算和观察时间”；不要请求用户重新批准已经授权的源码审查和本地准备。

## 6. 本次检查范围与限制

本次读取了三个冻结 JSON 的业务段、身份/hash 和空数组状态，两个 field schema 全文，周期计划 B3/外部条件及报告 field 段，P8 的 50–101 行，以及 measurement-admission 的 1–257 行和 CE consumer 的 1270–1305 行。协议内长 dirty-path 清单只作为身份引用读取，未逐路径重建旧 source；不声称旧 snapshot 可完整复现。本次为继承项目上下文的非盲分析，不是独立现场复现。

已执行 JSON 解析、三文件 SHA-256 与 protocol hash 引用一致性检查；未重跑 schema validator、模型、GUI、现场任务或付费服务；未新增原始 field 样本、未外发消息、未修改冻结协议或源码。本文完成 readiness/草案交付；真实执行与收益判定保持未完成。CHANGELOG 与主任务总状态由主 owner 统一收口，避免并行覆盖。
