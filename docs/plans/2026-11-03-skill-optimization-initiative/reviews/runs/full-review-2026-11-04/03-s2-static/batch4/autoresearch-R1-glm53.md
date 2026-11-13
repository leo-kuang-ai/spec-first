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
