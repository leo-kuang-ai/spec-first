你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/autoresearch/` 的以下维度给出相反裁决，逐维度核实源码后给最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。「没读完」的 not-verified 是覆盖声明不是对象结论。可确定性核实的以源码为准。

## 待仲裁维度
- **D03**（R2 fail）： `AR/SKILL.md:103-107`；`AR/scripts/orchestrate.sh:128-141,256-287` | 状态校验没有检查直接决定验证与收敛的布尔字段，畸形账本仍可能通过校验并输出 DONE。 |
- **D04**（R2 fail）： `AR/fix.md:101-104`；`AR/debug.md:93-97`；`AR/scripts/orchestrate.sh:118-125`；`AR/SKILL.md:83-87` | 生产者交接提供 `findings`，路由消费者读取 `errors`、`untested_gaps`，但没有定义折叠转换，未解决事项可能丢失。 |
- **D05**（R2 fail）： `AR/SKILL.md:20-30,68-72`；`AR/references/orchestrator-routing.md:8,71` | 顺序匹配与强制模式标志冲突，主入口对主观目标的排除和接纳也不一致，关键分发规则不能唯一解释。 |
- **D06**（R2 fail）： `AR/predict.md:43-58`；`AR/references/predict-personas.md:44-51`；对照 `AR/references/reason-judge-protocol.md:15-22` | reason 有无授权或无 dispatch 能力时的诚实降级，predict 却直接要求独立隔离 personas，能力假设没有同等出口。 |
- **D08**（R2 fail）： `AR/SKILL.md:24,32-49,68-79`；`AR/autoresearch.md:32-59` | 主入口声明 Classic 和各子命令，却未规定加载对应协议文件，按需加载可能漏掉 Git ownership、测量冻结等必要原文。 |
- **B01**（R2 fail）： `AR/SKILL.md:3,20-28,68-72` | description 要求不可检查目标转出，正文却内置主观单次分发；`--classic`／`--auto` 的强制语义也与匹配顺序冲突。 |
- **B02**（R2 fail）： `AR/SKILL.md:83-97`；`AR/fix.md:103`；`AR/scripts/orchestrate.sh:118-125` | 输入、交接和消费者之间缺少明确归一化合同；存在文件和同名概念不能证明字段语义已经衔接。 |
- **B03**（R2 fail）： `AR/ship.md:84-92,110-115`；`AR/predict.md:43-58`；`AR/references/reason-judge-protocol.md:18` | 正向发布有批准门，但 rollback 未核对目标与当前状态；predict 也没有继承 reason 已明确的委派授权边界。 |
- **B04**（R2 fail）： `AR/evals/eval.yaml:3-11`；`AR/evals/cases/dispatch-classic-mode.yaml:9-11`；`AR/evals/cases/screen-cmd-refuses-unsafe-predicate.yaml:9-11`；`src/cli/contracts/dual-host-governance/skills-governance.json:6-20` | 源码治理将其作为跨宿主 Skill，评测
- **B05**（R2 fail）： `AR/autoresearch.md:35-44,58,99`；对照 `AR/fix.md:40-43`、`AR/debug.md:44-46`、`AR/ship.md:104-108` | Classic 已有唯一目录和精确恢复规则，其他子命令仍使用分钟级目录且缺少同等恢复约定，隔离与重复执行保障不一致。 |
- **X01**（R2 fail）： `AR/SKILL.md:82-97`；`AR/autoresearch.md:58,99`；`AR/fix.md:42`；`AR/reason.md:38` | 长循环有预算与日志，但多 hop 的唯一运行身份、恢复和输出隔离未统一，不能可靠承接长任务或同分钟重入。 |
- **X03**（R2 fail）： `AR/regression.md:64,80,88`；`AR/ship.md:86-99,110-115` | 正向高风险交付有验证和授权约束，但 rollback 仅按最近日志反向操作，未绑定当前部署／产物和精确授权范围。 |
- **X04**（R2 fail）： `AR/SKILL.md:95-97`；`AR/autoresearch.md:120-123`；`AR/improve.md:22-25,40-46`；`AR/learn.md:63-65` | 交接有 owner 和时间戳，但缺统一来源身份、有效性和限制信息；“最近摘要”与“已生成页面”可在来源变化后直接复用。 |

## R1 完整评审
# autoresearch 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | CHANGELOG.md:942,946,214；skills/autoresearch/SKILL.md:30 | 约束均可追溯到已记录的真实失败（脚本空引用、banner 时序、凭据回显、路由抢答 0/440），未发现过时或相互矛盾的补丁层；唯一完整性缺口见 F1 不属此类 |
| D02 | pass | references/security-checklist.md:3-56；regression.md:42（1−(1−p)^n）；regression.md:63（独立进程采样）；scripts/orchestrate.sh:74-84（classify 仅 advisory + requires_semantic_judgment） | 大量真实领域知识（STRIDE/OWASP 检查表、severity 判据、flake 概率、Mann-Whitney 独立性、DB 锚定白名单）；脚本出事实、LLM 做语义分类的分工明确且被测试钉住 |
| D03 | pass | regression.md:78 ↔ scripts/score-regression.sh:149-168（exit 0/1/2）；scripts/orchestrate.sh:214-217,256-287；tests/unit/autoresearch-score-regression.test.js:26-73；tests/unit/autoresearch-orchestrator-regression.test.js:49-64 | 确定性验证门有脚本、有正反例单测、退出码契约文档与实现一致；纯 prose 门（banner、classic 安全筛查）未冒充机械判定且有 eval case 兜底 |
| D04 | fail | regression.md:105 ↔ ship.md:65-75；orchestrator-routing.md:27 ↔ scripts/orchestrate.sh:118-124；SKILL.md:24-49 | 三处衔接断点：声明「ship reads verdict」但 ship.md 无消费步骤（F2）；handoff findings[]→last_handoff.errors 的折叠口径未定义、直接影响路由（F3）；入口不定位 classic/子命令协议文件（F1） |
| D05 | pass | SKILL.md:108 行；evals.md:87-111 与各子命令 Eval Checkpoint 块；抽查 interval 数学一致（evals.md:104-111 ↔ autoresearch.md:114、debug.md:87、fix.md:95 等） | 关键规则可定位、无内部矛盾；重复块（Eval Checkpoint ×9、Chain Handoff ×13）是子命令文件独立加载前提下的自包含代价，属可辩护取舍 |
| D06 | pass | references/reason-judge-protocol.md:18-19（无 dispatch 能力则 inline + 披露共享上下文 + 不作独立性声明）；evals.md:14（v2.2.0 placeholder 如实标注） | 最重的能力假设（冷启动隔离 agent）有显式诚实降级；未把宿主能力冒充为保证 |
| D07 | pass | CHANGELOG.md:946（双 agent 深评 4/10 发现空引用）→942（当日补建脚本+evals）→214（FSA3 凭据回显修复+21 项回归）→143（2026-10-29 评分收紧）；tests/unit/ce-localization-review-contracts.test.js:49-56 冻结包 | 完整的 问题→修订→复验 链落在 CHANGELOG 与单测里；有真实消费者（3 个测试文件）与回归资产（3 个 eval case） |
| D08 | fail | SKILL.md:24（“Classic — existing metric loop, unchanged” 无文件指针）；SKILL.md:34-49（子命令表仅一行描述） | 入口摘要遗漏承载性要求的原文位置：git ownership、verify 安全筛查、keep/discard 恢复规则只在 autoresearch.md，而 dispatch 表与子命令表均不指向对应文件（F1） |
| B01 | pass | SKILL.md:3（正向触发 + spec-debug/spec-code-review/spec-plan 负例）；SKILL.md:20-28（bare 三分支 + 强制旗标）；src/cli/contracts/dual-host-governance/skills-governance.json:5-18（standalone_skill, command_name null） | 正负触发边界完整；子协议文件未被暴露为宿主入口 |
| B02 | fail | probe.md:81-84（--evals checkpoint 分析 results TSV，但全文未定义 TSV）+ SKILL.md:16（“Evals reads \*-results.tsv”）+ probe.md:115（handoff 无 results_tsv）；improve.md:52（列分隔用 `\|` 记法）；learn.md:39 ↔ evals.md:36-51（learn 列不在检测表） | 生产者/消费者 IO 契约内部不一致：probe 运行对 evals 不可见（F4）、improve 列记法与 tab-TSV 约定冲突、learn 列落入 unknown→skip（F5） |
| B03 | pass | SKILL.md:13,101；ship.md:86（--auto 永不免除批准门）；autoresearch.md:42-44（默认不提交、commit 须经 spec-commit 显式授权、绝不回滚恰为 HEAD 的提交）；regression.md:64（白名单内仍需用户确认）；references/reason-judge-protocol.md:18（推理请求不构成外部咨询授权） | 授权边界系统化：写入、Git、外发、部署四类各有显式门，材料内嵌指令不扩权 |
| B04 | pass | skills-governance.json:5-18（8 宿主 skill 投影）；tests/unit/ce-localization-review-contracts.test.js:51-56（SKILL.md 冻结为 canonical source）；tests/unit/autoresearch-*-regression.test.js:7（直接消费 skills/ 源路径） | 真相源为 skills/autoresearch/**，投射可追溯，消费者直读源码；本 worktree 干净无手改镜像（symlink 历史已于 CHANGELOG.md:942 反转） |
| B05 | pass | scripts/orchestrate.sh:45-48（exit 127 解释器缺失）；autoresearch.md:58（时间戳+随机后缀、不复用同分钟 run）；autoresearch.md:99（resume 先对账再重试）；SKILL.md:103（resume 重筛已持久化命令）；regression.md:46（崩溃时 worktree 清理+prune）；score-regression.sh:109-111（不可读→UNAVAILABLE，不静默） | 工具缺失、中断恢复、重复执行、崩溃清理、部分成功（UNAVAILABLE 必列）均有明确处理 |
| B06 | pass | regression.md:76-80（UNAVAILABLE 必列、STABLE 不豁免缺席维度、status 列不认证运行）；autoresearch.md:109（总结必须带显式限制、零基线无相对增益）；reason.md:67（平票/证据不足是合法结果） | 需求→实现→验证可经 TSV+handoff+evals-summary 追溯；未完成与不确定性有显式披露规则 |
| X01 | pass | SKILL.md:82-93（有界循环、hop 结果分类、plateau/ceiling/blocked 三重背停）；autoresearch.md:44（重叠工作保留并报恢复冲突）；SKILL.md:97（两个所有权清晰的状态对象） | 长任务分解、共享写面、恢复与背停齐备；编排用宿主原生 agent 派发而非另造流程引擎（orchestrate.sh 仅薄确定性地板） |
| X02 | pass | references/orchestrator-routing.md:19（旧 label/mode 输出退役+迁移说明）；scripts/orchestrate.sh:81-83（schema_version 1）；evals.md:113-118（v2.0.03 兼容+模糊列匹配）；score-regression.sh:85-88（legacy 别名接受） | 接口版本、退役迁移、向后兼容均显式且有测试钉住 |
| X03 | pass | ship.md:86（无条件批准门）；scripts/orchestrate.sh:236-240（PENDING-SHIP-APPROVAL 终态）；ship.md:110-116（--rollback）；regression.md:64 + orchestrate.sh:188-212（锚定 DB 白名单）；SKILL.md:103（resume 重筛） | 高风险面（部署/迁移/命令执行）的验证-授权对账完整，回滚路径存在 |
| X04 | pass | 各子命令 Chain Handoff（version 2.1.0+timestamp+status，如 debug.md:95、regression.md:103-106）；SKILL.md:103-105（resume 复用 pinned predicate）；learn.md:63-65（manifest 中断安全恢复 + generated_at）；reason.md:64（lineage.md 保留决策谱系） | 跨会话交接带版本/时间戳/新鲜度，决策保留与恢复语义明确 |

## Findings

**F1（D04/D08）入口不定位 classic 与子命令协议文件**
- 位置：`skills/autoresearch/SKILL.md:24`（Classic 行无指针）、`skills/autoresearch/SKILL.md:34-49`（子命令表仅行为描述）；对照 `skills/autoresearch/SKILL.md:68,76`（orchestrator 部分却有 `references/orchestrator-routing.md`、`scripts/orchestrate.sh` 指针）。
- 后果：宿主只注入 SKILL.md。Classic 模式的承载性规则（git ownership、verify 安全筛查、keep/discard 恢复、metric-error 处理）只存在于 `autoresearch.md`，入口写的是“existing metric loop, unchanged”——fresh 会话无从知道“existing”指哪个文件；13 个子命令同理只能靠同名猜测。更弱的执行会直接拿 SKILL.md 骨架即兴跑循环，绕过全部安全细则。skill 自身的 eval（`evals/cases/dispatch-classic-mode.yaml`）只断言 banner，捕获不到该缺口。
- 最小修复：dispatch 表 Classic 行与 Subcommands 表各加一列（或一行说明）文件指针：`→ autoresearch.md`、`→ plan.md` 等；一行话即可，不动协议正文。

**F2（D04）regression→ship 的 verdict 消费契约只有生产侧声明**
- 位置：`skills/autoresearch/regression.md:105`（“`ship` reads `verdict` for the deploy-gate”）；`skills/autoresearch/ship.md:38-75`（Phase 1-4 无任何读取上游 handoff/verdict 的步骤）。
- 后果：直接调用 `autoresearch ship` 时无 STABLE 前置检查；ship.md Phase 4 只重跑测试，而 STABLE≠测试通过（flakiness/performance/resource/visual 维度不会挡住 Phase 4），声明的 deploy-gate 在消费者侧不存在。
- 最小修复：ship.md Phase 1 或 Phase 4 加一步“若存在 regression handoff（链入或 CWD 内），读取 `verdict`，非 STABLE 即列为 blocker”。

**F3（D04）handoff findings[] → last_handoff.errors 的折叠语义未定义**
- 位置：`skills/autoresearch/references/orchestrator-routing.md:27`（信号源标注为 handoff.json `findings`）↔ `skills/autoresearch/scripts/orchestrate.sh:118-124`（消费 `last_handoff.errors` 整数、`verdict`、`untested_gaps`）；各子命令 handoff 的 findings 结构不一（debug.md:95=confirmed bugs、fix.md:103=unfixed errors、security.md:100=含 Info 级全量 findings）。
- 后果：`errors>0` 决定路由到 `fix`，但“多少 findings 算 errors、severity 阈值是什么”没有任何文件规定。security hop 若把 Info 级 findings 折成 errors>0，循环会被永久路由回 fix；不同折叠选择产生不同路由结果，破坏“确定性状态与出口检查”的意图。
- 最小修复：routing doc 决策表加一列折叠规则（如 errors = severity ≥ medium 的 findings 数），或改由各 handoff 直接输出机器可读的 `errors` 计数字段。

**F4（B02）probe 声明了无法兑现的 --evals 契约**
- 位置：`skills/autoresearch/probe.md:81`（Phase 8 “Append to output” 未定义任何 TSV 文件）、`probe.md:84,105-111`（--evals checkpoint 按 evals.md:91-100 协议要“分析当前 results TSV”）、`probe.md:115`（handoff 无 results_tsv 字段）、`skills/autoresearch/SKILL.md:16`（“Evals reads `*-results.tsv`”）。
- 后果：probe 运行不产生 `*-results.tsv`，`autoresearch evals` 的发现扫描对 probe 运行不可见；probe 自身的 checkpoint 也没有可分析对象，承诺与产物断开。
- 最小修复：二选一——给 probe 定义 `probe-results.tsv`（round/personas/questions/net_new 列）；或在 probe.md 声明其无 TSV、checkpoint 改为分析 constraint registry，并从 SKILL.md:16 的总契约中豁免。

**F5（B02）TSV 记法与 evals 列检测表的三处不一致**
- 位置：`skills/autoresearch/improve.md:52`（列定义用 `|` 分隔记法，与全家族 tab-TSV 约定冲突）；debug.md:46、fix.md:43、improve.md:50（TSV 文件名未写明，仅可按 `{subcommand}-results.tsv` 惯例推断）；`skills/autoresearch/learn.md:39`（file_documented/validation_status/issues_found 列不在 `evals.md:36-51` 检测表，落入 unknown→skip）。
- 后果：evals 对 learn 运行几乎无分析输出；improve 的分隔记法若被按字面执行会产生不可解析的“TSV”；文件名靠惯例存在链路脆弱。
- 最小修复：improve.md 改 tab 记法；debug/fix/improve 补文件名；evals.md 列表补 learn 列或在 unknown 行为处声明覆盖范围。

**F6（D03，保持现状成立）两套安全筛查覆盖面不同且关系未声明**
- 位置：`skills/autoresearch/autoresearch.md:46-48`（classic prose 筛查含 embedded credentials、outbound writes）↔ `skills/autoresearch/scripts/orchestrate.sh:170-212`（screen-cmd 覆盖 8 类危险命令 + DB 白名单，不含 credentials/outbound writes）。
- 后果：orchestrator 的每条派生命令走 screen-cmd（SKILL.md:81），而脚本层不查凭据嵌入——该风险只由 classic 侧 prose 覆盖。分层本身合理（LLM 语义义务在确定性地板之上），但两套筛查的分工没有一句话声明，读者可能误以为 screen-cmd 穷尽。
- 建议：SKILL.md Orchestrator Safety Invariants 处加一句“screen-cmd 是确定性地板，凭据/出站写入等语义风险仍由 LLM 筛查兜住”。

## 主责深挖面发现

**D01（去补丁化）**：逐条约束均可归因到已登记的真实失败——`EXECUTE IMMEDIATELY`（对抗 meta-deliberation）、banner gate 的“dispatch violation”严格性（CHANGELOG.md:942 记录了与文件加载 preamble 的时序矛盾并被实证修复）、classify 的 advisory 化（CHANGELOG.md:214，修复“候选直接变执行决定”风险）、拒绝输出固定原因串（CHANGELOG.md:214 凭据回显修复，`orchestrate.sh:211` 返回 canned message，`autoresearch-orchestrator-regression.test.js:23-32` 钉住 redaction）。未发现过时或互相矛盾的指令。`db_url_allowed` 返回的 detail 字符串实际未被任何调用方使用（orchestrate.sh:202 的拒绝信息为固定串）——死代码级小瑕疵，不影响裁决。

**D02（领域知识）**：该 skill 是 38 个包里领域密度最高的一档：green→red 分类不变量与“5/5 green ≠ non-flaky”的检测概率公式（regression.md:42）、性能采样的独立进程要求与 n=7 只能检 ≳1σ 的诚实标注（regression.md:63）、锚定白名单对“裸子串不算数”的显式反例（regression.md:64）、reason 的按域 judge 判据表（reason-judge-protocol.md:62-69）、build-feature 的 TDD 阶梯与 floor-guard（orchestrator-routing.md:62-64）。autoresearch.md:52-54 与 spec-optimize 的边界是“编码真实取舍”而非口号。模型/脚本分工符合仓库哲学：`classify` 只出事实候选且 `requires_semantic_judgment: true`，单测断言其不输出 archetype/mode（orchestrator-regression.test.js:82-84）。

**D03（验证门）**：两个脚本都是真确定性地板且有退出码契约：score-regression 的 0/1/2 语义在 regression.md:78 与实现逐条对上（含“malformed row 不能被丢弃来让另一行通过”——score-regression.sh:80-97 读到即 invalid）；`verdict` 与 `next-hop` 在脚本内共用 `unresolved_hop`（orchestrate.sh:136-139, 231），从结构上保证两个出口不会判定漂移。单测覆盖正反例（invalid 输入不给安全 verdict、历史失败不阻断已恢复 hop、白名单不变量）。未强制的门（banner、classic 筛查、Round-0 dry-run）均为 prose 约定且未冒充机械——按“缺 runtime 强制即降级为响亮约定”的标准，这里没有伪称已强制之处。

**D04（衔接）**：fail 依据 F1/F2/F3。补充一条正面观察：orchestrator 链内的衔接质量很高——SKILL.md:97 “两个所有权清晰的状态对象，无重叠”、hop handoff 作为 single-hop bridge、routing 表的 Source 列逐行标注信号来源；问题集中在**入口→协议文件**与**跨子命令链的最弱一环（ship、probe）**，恰是测试未钉住的两处。

**D05（紧凑性）**：19 文件约 1,900 行，入口 108 行紧凑。重复块（Eval Checkpoint ×9、Chain Handoff ×13、Precondition ×2）在“子命令文件独立加载”前提下是自包含必需而非冗余；evals.md:87-111 同时充当独立子命令与共享协议文档的双重角色是可接受的设计。逐项交叉核对未发现矛盾：默认迭代数（SKILL.md:36-49 ↔ 各文件）、interval 数学（evals.md:104-111 ↔ 各文件）、security 复合分公式（security.md:69 ↔ security-checklist.md:50-54）、reason TSV schema（reason.md:39 ↔ reason-judge-protocol.md:83）全部一致。子文件 frontmatter 的 `name: autoresearch:plan` 记法不对应任何宿主入口面，属无害残留。

**D08（上下文效率）**：fail 依据 F1。正面面：references 全部按阶段加载（security-checklist.md 仅在 STRIDE 建模步、predict-personas.md 仅 Phase 2）；learn 的模块页上下文有硬界（≤10 关键文件 × 前 50 行，learn.md:69）；improve 自动发现限 1500 tokens（improve.md:44）；evals 子命令用列检测避免重读原始运行；graph 边界段（SKILL.md:8-10）显式复用 project intelligence 而非重扫。缺的只是入口把“必要原文在哪”说清楚。

## 未读文件

- `docs/plans/.../process/REVIEW-EXECUTION-WORKFLOW.md` §1-3、§5-10（仅完整读取第 4 节检查表与裁决纪律要求）：任务指定检查表为第 4 节；§5-10 为执行流程与交付规范，对本单 skill 裁决无增量判据。未覆盖后果：无（裁决口径以 §4 + 两份校准补强为准）。
- `scripts/check-ce-localization-review.cjs`（消费者测试引用的 producer 实现）：已读其测试断言（ce-localization-review-contracts.test.js 全文），autoresearch 相关断言（包冻结、SHA、直援关系）已由测试侧核对；producer 内部实现细节不影响本裁决。未覆盖后果：若 producer 实现与测试断言背离（极低概率），B04/D07 的“消费者真实”判断会偏松。
- 各宿主 runtime 镜像（`.claude/` 等）：本 worktree 未生成 runtime（干净检出），B04 依 source 侧治理契约 + 会话内 skill 列表与 SKILL.md 逐字一致佐证；未实测 `spec-first init` 投射。未覆盖后果：投射字节级一致性未验证，属 S3 行为层。
- 未运行任何测试/脚本（静态盲评纪律）；单测仅作为源码证据阅读。

## 结论一句话

autoresearch 的确定性地板、领域知识与经验演化链在全仓属第一梯队，但 fail 集中在静态衔接面：入口不指路（F1/F8）、ship 消费声明落空（F2）、handoff 折叠口径缺失（F3）、probe 的 evals 契约不可兑现（F4）——四处均为加一两行指针/规则即可闭合的最小修复，不动协议主体。


## R2 完整评审
# autoresearch 评审（R2）

范围：当前 worktree 的 `skills/autoresearch/` 全包、消费者清单所列三份测试、检查表与合同基线。以下裁决仅针对 `structure_contract`；未执行行为评测、测试或运行成本测量，不据此降级静态裁决。冻结提交 `5b59293b` 采用任务提供的信息，未独立完成 Git 身份核验。

## 逐项裁决表

表中 `skills/autoresearch/` 简写为 `AR/`；其余路径相对仓库根目录。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `AR/autoresearch.md:40-54,87-99`；`AR/references/reason-judge-protocol.md:24-46` | 候选隔离、冻结测量、防取巧、允许无缺陷和并列裁决都有明确风险对象，不因模型能力增强而应直接删除。 |
| D02 | pass | `AR/SKILL.md:76-78`；`AR/scripts/orchestrate.sh:74-84,118-150`；`AR/regression.md:30-64` | 目标语义归 LLM，脚本提供关键词事实、状态计算和格式检查；回归分类、噪声与迁移约束具有具体决策内容。 |
| D03 | fail | `AR/SKILL.md:103-107`；`AR/scripts/orchestrate.sh:128-141,256-287` | 状态校验没有检查直接决定验证与收敛的布尔字段，畸形账本仍可能通过校验并输出 DONE。 |
| D04 | fail | `AR/fix.md:101-104`；`AR/debug.md:93-97`；`AR/scripts/orchestrate.sh:118-125`；`AR/SKILL.md:83-87` | 生产者交接提供 `findings`，路由消费者读取 `errors`、`untested_gaps`，但没有定义折叠转换，未解决事项可能丢失。 |
| D05 | fail | `AR/SKILL.md:20-30,68-72`；`AR/references/orchestrator-routing.md:8,71` | 顺序匹配与强制模式标志冲突，主入口对主观目标的排除和接纳也不一致，关键分发规则不能唯一解释。 |
| D06 | fail | `AR/predict.md:43-58`；`AR/references/predict-personas.md:44-51`；对照 `AR/references/reason-judge-protocol.md:15-22` | reason 有无授权或无 dispatch 能力时的诚实降级，predict 却直接要求独立隔离 personas，能力假设没有同等出口。 |
| D07 | pass | `tests/unit/autoresearch-orchestrator-regression.test.js:23-91`；`tests/unit/autoresearch-score-regression.test.js:26-73`；`AR/autoresearch.md:88-109` | 当前维护依据包含针对拒绝脱敏、错误收敛、协议非法值和测量投机的聚焦防回归约束；不将它们外推为真实收益。 |
| D08 | fail | `AR/SKILL.md:24,32-49,68-79`；`AR/autoresearch.md:32-59` | 主入口声明 Classic 和各子命令，却未规定加载对应协议文件，按需加载可能漏掉 Git ownership、测量冻结等必要原文。 |
| B01 | fail | `AR/SKILL.md:3,20-28,68-72` | description 要求不可检查目标转出，正文却内置主观单次分发；`--classic`／`--auto` 的强制语义也与匹配顺序冲突。 |
| B02 | fail | `AR/SKILL.md:83-97`；`AR/fix.md:103`；`AR/scripts/orchestrate.sh:118-125` | 输入、交接和消费者之间缺少明确归一化合同；存在文件和同名概念不能证明字段语义已经衔接。 |
| B03 | fail | `AR/ship.md:84-92,110-115`；`AR/predict.md:43-58`；`AR/references/reason-judge-protocol.md:18` | 正向发布有批准门，但 rollback 未核对目标与当前状态；predict 也没有继承 reason 已明确的委派授权边界。 |
| B04 | fail | `AR/evals/eval.yaml:3-11`；`AR/evals/cases/dispatch-classic-mode.yaml:9-11`；`AR/evals/cases/screen-cmd-refuses-unsafe-predicate.yaml:9-11`；`src/cli/contracts/dual-host-governance/skills-governance.json:6-20` | 源码治理将其作为跨宿主 Skill，评测输入却明确要求加载 `.claude/skills/` 镜像，fresh-source 来源合同不成立。 |
| B05 | fail | `AR/autoresearch.md:35-44,58,99`；对照 `AR/fix.md:40-43`、`AR/debug.md:44-46`、`AR/ship.md:104-108` | Classic 已有唯一目录和精确恢复规则，其他子命令仍使用分钟级目录且缺少同等恢复约定，隔离与重复执行保障不一致。 |
| B06 | pass | `AR/autoresearch.md:87-109`；`AR/regression.md:78-88`；`AR/security.md:56-60`；`AR/learn.md:85-108` | 有任务行为与 diff 核查、最终确认、限域 STABLE、修复后重检、finding 位置证据和只读检查保护；这些是静态义务，不等于已执行。 |
| X01 | fail | `AR/SKILL.md:82-97`；`AR/autoresearch.md:58,99`；`AR/fix.md:42`；`AR/reason.md:38` | 长循环有预算与日志，但多 hop 的唯一运行身份、恢复和输出隔离未统一，不能可靠承接长任务或同分钟重入。 |
| X02 | pass | `AR/regression.md:48-64,74-80`；`AR/references/orchestrator-routing.md:17-19`；`AR/scripts/score-regression.sh:85-95` | 职责内已有 API 兼容、迁移验证、旧协议退役说明与别名兼容；不强加额外 ADR 或通用版本框架。 |
| X03 | fail | `AR/regression.md:64,80,88`；`AR/ship.md:86-99,110-115` | 正向高风险交付有验证和授权约束，但 rollback 仅按最近日志反向操作，未绑定当前部署／产物和精确授权范围。 |
| X04 | fail | `AR/SKILL.md:95-97`；`AR/autoresearch.md:120-123`；`AR/improve.md:22-25,40-46`；`AR/learn.md:63-65` | 交接有 owner 和时间戳，但缺统一来源身份、有效性和限制信息；“最近摘要”与“已生成页面”可在来源变化后直接复用。 |

## Findings

### F1 · P1：主入口没有建立子协议的必读分发关系

- **位置：** `skills/autoresearch/SKILL.md:20-49,76-85`；`skills/autoresearch/autoresearch.md:32-59`。
- **事实：** Classic 分支仅写“existing metric loop, unchanged”；子命令表只列功能与迭代次数，没有要求进入分支前读取对应 `.md`。正文明确加载的主要是 `references/orchestrator-routing.md`。
- **后果：** 仅加载 `SKILL.md` 的执行者可能直接开始迭代，而未获得实际承载 Git ownership、冻结测量输入、唯一目录及精确恢复规则的协议。文件随包交付不等于已进入执行上下文。
- **最小修复：** 在分发表增加协议路径，并规定“进入所选模式／子命令前完整读取对应文件”；Classic 明确绑定 `autoresearch.md`，无需把全部协议塞回入口。

### F2 · P2：分发优先级和职责边界存在两组冲突

- **位置：** `skills/autoresearch/SKILL.md:3,20-28,68-72`。
- **事实：**
  1. 要求按表顺序解析，但 `Metric:`／`Verify:` 和自由文本均排在强制模式标志之前。
  2. description 要求不能表达为可检查信号的目标转出，正文却将 document、what-to-build、decide-design 纳入内部单次分发。
- **后果：** `--auto` 搭配 `Verify:`、`--classic` 搭配自由文本，以及主观设计请求，都没有唯一静态解释；自然入口和显式调用可能选择不同职责。
- **最小修复：** 明确标志覆盖关系及双标志冲突处理；对主观单次分发作一次产品裁决：保留则同步 description，转出则给出目标入口并移除内部接管承诺。

### F3 · P1：handoff 到路由状态的转换缺失

- **位置：** `skills/autoresearch/debug.md:95`；`skills/autoresearch/fix.md:103`；`skills/autoresearch/security.md:100`；`skills/autoresearch/SKILL.md:83-97`；`skills/autoresearch/scripts/orchestrate.sh:118-125`。
- **事实：** debug 输出已确认 bugs，fix 输出未修复 errors，security 输出 findings；消费者却通过 `last_handoff.errors` 和 `last_handoff.untested_gaps` 选择补救路径。“Fold handoff”未说明如何转换，也未规定失败／有残余时清除旧的 `predicate_met`。
- **后果：** 合法生产者输出不能直接满足消费者预期；若沿用旧 predicate，残余事项存在却未进入阻断分支在静态上是可达的。
- **最小修复：** 定义一个轻量归一化合同：各 source 如何映射未解决错误、验证缺口和状态；无法解释的交接阻断完成声明。同步生产者、消费者并补一条完整链路反例，而非只测试手工构造的 `errors` 字段。
- **保持边界：** `core/08` 的拟议 YAML 与数量阈值不应直接套用；本问题是现有生产者与消费者之间的实际语义缺口。

### F4 · P1：`validate-state` 没有校验收敛关键字段

- **位置：** `skills/autoresearch/scripts/orchestrate.sh:128-141,236-240,256-287`。
- **事实：** 校验函数不检查 `predicate_met`、`pending_verify` 的类型，消费者却直接使用 Python truthiness。
- **静态反例：** 在其余必填字段合法时，`predicate_met: "false"` 不会被校验拒绝；字符串为真值，`next-hop` 随后可以输出 `DONE`。这由源码分支可直接判断，未声称运行过该反例。
- **后果：** “ malformed ledger 不可用于路由”的入口承诺不成立，错误类型可被升级成完成信号。
- **最小修复：** 对出口相关布尔字段实施严格类型校验；对实际消费的 hop、路由位置等嵌套字段补必要类型与取值检查，非法输入统一返回明确错误。脚本只校验结构，不替代证据真实性判断。

### F5 · P1：fresh-source 评测反向指定 generated runtime

- **位置：** `skills/autoresearch/evals/eval.yaml:3-11`；三份 `skills/autoresearch/evals/cases/*.yaml` 中的输入说明，分别为 `dispatch-classic-mode.yaml:9-11`、`screen-cmd-refuses-unsafe-predicate.yaml:9-11`、`ship-never-auto-approves.yaml:10-15`。
- **事实：** 配置声明加载本地 Skill，case 又要求完整读取 `.claude/skills/autoresearch/SKILL.md`；环境为 `none`。
- **后果：** 即使评测通过，也不能唯一绑定当前 owning source；镜像过期、缺失或额外加载都可能改变被测对象。这是静态加载合同冲突，不是因本轮没有运行评测而判失败。
- **最小修复：** case 只引用明确传入的 source 根或由 runner 注入当前 source；移除对 `.claude/` 的被测真相源声明。自然 runtime 加载另设场景、另记版本。

### F6 · P2：评测判据不能兑现其“顺序／不得执行”声明

- **位置：** `skills/autoresearch/evals/fixtures/scripts/check-classic-banner.sh:8-20`；`skills/autoresearch/evals/fixtures/scripts/check-screen-refusal.sh:4-19`；`skills/autoresearch/evals/fixtures/scripts/check-ship-gate.sh:5-24`。
- **事实：** banner 检查只查全文是否含字符串；安全和发布检查主要查最终消息关键词，没有检查工具动作轨迹。
- **后果：** 工作之后补 banner 仍可通过；执行过危险动作后再输出拒绝措辞，也不一定被判据检出。因此它们只能证明部分输出措辞，不能证明声明的行为不变量。
- **最小修复：** 从 transcript 区分消息角色与工具调用，核查 banner 相对首个工作调用的顺序，并核查禁止动作是否出现。若轨迹不可用，明确只验证输出文本，不称“硬断言”。

### F7 · P2：predict 的隔离与委派能力没有诚实降级路径

- **位置：** `skills/autoresearch/predict.md:43-58`；`skills/autoresearch/references/predict-personas.md:44-51`；对照 `skills/autoresearch/references/reason-judge-protocol.md:15-22`。
- **事实：** predict 要求 personas 独立、无共享上下文，但未要求既有 dispatch 授权和实时能力，也未给出不可用时的报告方式；reason 已有这些边界。
- **后果：** 无 subagent 能力或未获对应委派授权时，协议没有合法的等价执行出口，容易将同一上下文的角色扮演描述为独立审查。
- **最小修复：** 将 reason 已有的能力／授权与 inline 降级条款抽成可共享约定，并由 predict 明确加载；降级产物不得保留独立性声明。

### F8 · P1：rollback 未绑定目标身份与当前副作用状态

- **位置：** `skills/autoresearch/ship.md:11-18,84-99,110-115`。
- **事实：** 正向 Ship 有明确批准门；Rollback 则按“最近 ship log”识别并反向操作，没有要求与 `Target`、当前部署／发布身份和已授权范围对账。
- **后果：** 最近日志不一定对应本次目标，发布后也可能已有其他变更；直接反向操作可能回退错误对象或覆盖后续工作。
- **最小修复：** 操作前读取当前状态，核对目标、环境、版本／部署 ID 与日志；现有授权只覆盖匹配范围，新增破坏性后果再确认。结果不明时先查状态，不盲目再次 rollback。

### F9 · P2：唯一运行目录与恢复纪律只在 Classic 完整落地

- **位置：** `skills/autoresearch/autoresearch.md:58,99`；对照 `skills/autoresearch/debug.md:45`、`fix.md:42`、`reason.md:38`、`ship.md:104-108`。
- **事实：** Classic 要求随机后缀、排他创建、恢复核对和读回；其他子命令仅规定分钟级目录名。
- **后果：** 同分钟重入、多个 hop 或中断后重新执行时，输出命名空间可能重叠，无法唯一对应结果、handoff 与实际副作用。
- **最小修复：** 在入口定义全子命令共享的唯一 run ID 和恢复约定，各 hop 使用独立子目录；复用现有 Classic 纪律，不新增中心化编排器。

## 主责深挖面发现

### B01–B04：入口、交接、授权与来源

- **入口应先收敛，而非继续扩能力。** description 已有清晰正反例；主要问题是正文重新接管主观设计、文档和产品发现，以及强制模式优先级不明。最小方案是统一分发表与职责声明，不是增加新的路由层。见 F1、F2。
- **交接首先缺语义映射，不是缺字段数量。** `findings` 到 `errors`／`untested_gaps` 的转换才是当前直接消费者需要的合同；盲加 core/08 示例字段不能解决这一问题。见 F3。
- **已有授权边界值得保留。** `autoresearch.md:42-44` 明确命令筛查不产生执行或 Git 权限，`learn.md:85-108` 明确 check／`--no-fix` 不得修复被审文档；两处均应保持。缺口主要在 predict 委派和 rollback 的精确范围，见 F7、F8。
- **确定性工具与 prose 约定必须分开。** `screen-cmd` 是文本模式筛查，`orchestrate.sh` 不包裹实际执行命令，也不验证副作用授权；不能把返回 `allow` 当作安全或授权证明。该边界在 `autoresearch.md:42` 已表述，建议同步到全局安全不变量。依据：`scripts/orchestrate.sh:170-217,302-312`。
- **跨宿主交付声明不等于投射已验证。** governance 声明八宿主 Skill 交付，消费者测试证明其 canonical source 身份的检查意图；本轮没有核验实际宿主镜像或生成全链路，不宣称支持范围已实测。已确认问题是评测直接指定镜像，见 F5。

### X01–X04：扩展场景

- **X01——长任务：** 已有内外循环上限、plateau 和 blocked 出口；应补运行身份及恢复隔离，而不是另造强状态机。当前缺口见 F9。
- **X02——接口／版本变化：** regression 的 API、迁移、旧别名处理足以支持职责内静态通过；`--select auto` 的盲点也被明确披露，应保持。依据：`regression.md:48-64,74-80`。
- **X03——高风险交付：** `STABLE` 被明确限制为已列证据，不豁免必要但不可用的维度，也不授权部署；这一点成立。不能用它抵消 rollback 的目标绑定缺口。依据：`regression.md:78-80`；F8。
- **X04——跨会话与知识复用：** `improve.md:40-46` 优先采用最近 learn 摘要；`learn.md:63-65` 恢复时直接跳过 generated 页面。两者都未要求核对对应源码是否变化，时间戳不能替代 freshness。最小补充是来源身份、变化后的失效条件与已知限制；交接不必扩成庞大 schema。
- **独立验证不能由 personas 数量推导。** reason 的授权与降级条款正确；predict 应复用同一边界。投票、共识和 `pending_verify` 字段本身都不是独立验证已发生的证据。

## 未读文件

- **被审包及指定必读材料：无未读文件。** 已完整读取 `SKILL.md`、14 份根目录子协议、4 份 references、2 份脚本、agent 配置、eval 配置、3 份 cases、3 份判据脚本和 fixture README；消费者清单所列三份测试、检查表、合同基线与项目角色契约均已读取。
- `/Users/kuang/.codex/AGENTS.md`：读取请求未获工具访问许可，未取得正文。**未覆盖后果：** 无法核对其中额外的全局约束；不据此推断被审 Skill 有缺陷。
- `src/cli/` 中未列入消费者清单的其他 runtime 生成实现及各宿主镜像：本轮未扩展到全生成链路。**未覆盖后果：** 不评价实际投射等价性或 drift，不声称常规宿主加载已验证。
- 其他评审者输出与历史评审报告：为保持 fresh-source 盲评未读取。**未覆盖后果：** 未进行跨评审去重或历史 finding 关闭核对，不影响本报告逐项静态裁决。

本轮没有修改文件；未运行测试、行为评测或成本测量。上述 pass 均仅指可定位的静态承诺及其内部一致性。

## 结论一句话

autoresearch 的测量纪律、回归分层和部分权限边界值得保留，但入口加载、handoff 转换、账本校验及评测来源存在关键静态缺口，本轮静态审查不通过，不能外推为已验证的行为质量或实际收益。


## 输出格式

每个维度一行：| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |。裁决词汇只用 pass / fail / not-applicable。最后一段「修复建议」：fail 成立的给最小可维护修复。语言：中文。先读源码再下结论。
