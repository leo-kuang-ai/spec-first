# spec-first 与 CE：34 个 Skill 全量源码审查总报告

**审查结论：34/34 个纳入 Skill 的源码对照、研发能力裁定和建议已完成；4 个用户排除项保持跳过。spec-first 对 CE 的深度优化有明确价值，应保留；当前仍有确定性地板、跨 Skill 证据传递和文案自洽缺口，不能称为“完美融合”。**

本轮交付的是只读审查与融合建议，产品优化尚未实施。没有修改被审产品源码、generated runtime、原同步 receipts；没有 stage、commit、push、PR、外发、全局安装或启动外部模型。独立评审、fresh-model/真实宿主行为、视觉和真实研发收益均未验证，因此不作 merge-ready 或收益已兑现声明。

主产物：[映射与规划](../../plans/2026-10-28-001-ce-all-skills-source-audit-plan.md)、[38项文件表索引](file-review-index.md)、[覆盖账](coverage.json)、[完整文件账](full-asset-ledger.json)、[终验记录](final-verification.json)。每项笔记包含能力对照、双方源码、保留/吸收/暂缓裁定、问题和验证限制；本报告提供总体取舍，具体问题以对应笔记和原始探针为准。

## 1. 基准、范围与证据含义

| 项目 | 固定范围 |
| --- | --- |
| spec-first | `/Users/kuang/xiaobu/spec-first`；branch `leo-2026-10-27-update`；HEAD `fe81bae9ee55ec336c85cf80c4a0460d86e3a412`；**含冻结的现有未提交内容**，并非仅审HEAD |
| CE | `/Users/kuang/xiaobu/compound-engineering-plugin`；HEAD `00d0a5bbf1300b2138b65ce724b325dd4dff77ba`；上游窗口base `153e605e1622154a0d7da095fceed13edcb68bf7` |
| 映射分母 | 38个本地source Skill；34纳入，其中30个直接CE对应、4个本地独立扩展；不限制为dirty Skill |
| 用户排除 | `spec-app-consistency-audit`、`spec-project-rules`、`spec-rule-miner`、`spec-write-skill`；保留映射/历史记录，不形成审查或融合结论，不计入完成率 |
| 全量审读 | 纳入项双方包内1,361个文本文件，包括入口、引用、persona、schema、脚本、metadata、eval与fixture；截断补读，相同hash的已全文文本可复用 |
| 包外接口 | 316条直接依赖/consumer阅读关系，250个唯一包外路径；含CLI、共享合同和有关测试；与包内去重后共1,524个唯一文本路径 |
| 非源码资产 | 6个生成的`.pyc`缓存单列，不当作逐行源码阅读或行为证明 |
| 不承诺的范围 | 整个代码库所有递归依赖、全部CE-only产品、所有历史receipt及Git历史归因；本轮不判断每项问题是否由最近dirty改动引入 |

“全量”指逐个纳入Skill的包内文本和具名直接执行/消费闭包，没有以目录、检索命中或部分diff代替全文。读取区间/hash是可复核记录，**脚本不能据此证明模型实际阅读、理解正确或结论完备**。语义判断由逐项笔记承担；单模型自查也不等同独立评审。

CE另有6个无本地直接对应的Skill：`ce-babysit-pr`、`ce-bakeoff`、`ce-noslop`、`ce-proof`、`ce-retune`、`wtf`。本轮记录其无直接映射，不将它们全包纳入34项或默认移植；相邻主Skill对它们的调用，只按实际接口与本地owner关系裁定。

## 2. 应保留的本地研发增强

| 本地增强 | 代码事实与真实消费者 | 保留理由 |
| --- | --- | --- |
| WHAT/HOW、来源与已定决策 | PRD/Brainstorm → Plan的产品region、稳定ID、settlement provenance；Work/task-pack分别检查执行资格 | CE允许的等义重构、取消status/readiness不能直接替换本地字节保真及下游合同 |
| 可选task-pack | `src/cli/task-pack.js`与write-tasks、doc-review、work的producer/intake/review链 | 跨会话可验证的执行索引有实际消费者；小任务仍可skip，不应删层或强制所有任务编译 |
| 授权与真实能力边界 | worker capability、serving receipt、repo/effect/source边界、commit/landing独立授权 | CE可运行的路由不等于本地获得授权或真实隔离；不能为“同步完整”恢复默认外发/提交 |
| 最终工作树验证与caller-owned尾部 | Work summary/closeout/fingerprint → LFG work-return/再验证；required-proof reconciliation | simplify/review/fix后旧绿不能证明当前树；helper校结构，LLM仍负责验证充分性 |
| 单一browser owner | test-browser wrapper/conformance与LFG、Dogfood、Work、Polish直接接口 | 精确origin、effect、private evidence与cleanup是有意边界；server归caller，不重建第二browser入口 |
| 知识候选与可失效发布 | Compound/Refresh的candidate、grounding、publication、source hash、invalidation condition | 不回退先写永久知识再校验，不增并列retire_when；publication非多文件事务的限制必须保留 |
| 实验准入 | Optimize的measurement-only、冻结比较身份、独立holdout、预算与命令授权 | 这些本地增强比简单分数循环更可靠，但仍需修下节确认的样本/噪声地板 |
| Runtime事实与恢复 | Setup registry、安装身份、锁/快照/回滚、project/workspace图生命周期及setup-facts消费者 | CE轻量health helper不能替换本地runtime owner；installed/configured/indexed不等同语义理解或真实宿主验收 |

Source-of-truth是`skills/`及相应`src/cli/`、templates/contracts/docs；`.agents/skills/`等runtime mirror只作投射对照，未作为修复目标。脚本负责路径、hash、状态、schema和运行事实；LLM负责需求、scope、因果、风险、证据充分性与融合取舍。

## 3. 值得集成的 CE 研发能力，按建议落地顺序

下列优先级是本次源码语义判断，不是实测ROI。所有改动仍是建议；应在确定性缺陷修复后，以真实研发任务验证收益。

| 顺序 | 能力及研发价值 | 本地最小融合点 | 验收与成本边界 |
| --- | --- | --- | --- |
| 1 | **证明用测试贯穿简化**，防止实现和证明一起被改弱 | Work/Debug/LFG将现有证据点名的测试/案例传给Simplify；callee显式保护test-only seam | proof tests保持有效，生产实现仍可等价重构，复跑相同验证；跨4项共用一个根因，不建新证明框架。[详审](skills/spec-simplify-code.md) |
| 2 | **Plan concern裁定、规范单owner、稳定KTD与研究dossier** | 在现有research/structure/sections/settlement中补具体harm、后补代价、considered-not-built、稳定引用与短回传 | 不重写上游WHAT，不把已否决机制塞deferred，不强迫每次研究产文件；比对遗漏、返工和上下文成本。[详审](skills/spec-plan.md) |
| 3 | **Brainstorm问题/结果表达、settled/no-doc闭包** | 补problem/outcome/means区分；synthesis服从现有来源和本次产物目的地 | 不重问已定选择、无文档时不假称落盘；不迁入视觉server或通用跨模型runtime。[详审](skills/spec-brainstorm.md) |
| 4 | **Debug可重复复现仪器、性能归因、missing-seam诚实路径** | 在现有investigate/fix补原症状check、baseline/profile与可重跑替代证据 | 缺合适测试seam可免伪测试，不能免原症状验证；已异常性能先debug，正常系统相对优化归optimize。[详审](skills/spec-debug.md) |
| 5 | **Doc-review后果准入、事实重评、语义去重** | 同一owner判断照文档执行的具体后果，合并同修复根因，补Withdraw/恢复/幂等消费 | reviewer共识不自动升严重性，残余也不能回收被否决偏好；保留report-only/HTML producer ownership。[详审](skills/spec-doc-review.md) |
| 6 | **PR反馈的可恢复conversation尾部** | Resolver产最小pending actions，LFG发布后显式消费reply/resolve；保持caller拥有commit/push | crash后仅补未完成动作，不重复fix/POST；精确PR/repo/source/可见性；不只加无人消费的JSON字段。[详审](skills/spec-resolve-pr-feedback.md) |
| 7 | **有条件的测试价值lens与具体review检查** | Simplify按需读测试价值rubric；Code-review窄补资源释放、测试隔离、migration、末轮mechanics | 先有proof保护；默认五reviewer、条件depth、batch validator均需质量/成本对照，不直接改默认覆盖。[简化](skills/spec-simplify-code.md) / [代码审查](skills/spec-code-review.md) |
| 8 | **项目PR模板、tracker close-vs-link、已知决策来源** | 复用现有commit/PR owner的精确repo与写入方法 | 保留mixed-hunk、作者、独立外写授权；不额外发明U-ID，不新增stack/babysit产品面。[详审](skills/spec-commit-push-pr.md) |
| 9 | **知识正文留父上下文、corpus去重、历史词消费者** | Compound父owner分类/起草、finder按需；Refresh沿现有invalidation与alias处理 | 保留不可恢复独有知识；不默认全词表扫库、packs/config根或自动promotion。[捕获](skills/spec-compound.md) / [刷新](skills/spec-compound-refresh.md) |
| 10 | **Optimize机会定位、Goodhart反证、独立比较身份和可共享报告** | 复用当前decide/persistence/holdout，补原baseline→final确认与结果报告 | 不凑10–30假设，不将各轮百分比相加，不用自报噪声/样本支撑confirmed；remote/ticks延后。[详审](skills/spec-optimize.md) |
| 11 | **Explain行为trace、设计理由分层；Ideate唯一dossier与杠杆排序** | 沿已有证据和产物owner补trigger/state/failure/untraced、理由来源、path digest、来源覆盖 | 不从代码推定原始设计意图，不把issue数量当价值，不把低置信高危线索直接丢弃。[解释](skills/spec-explain.md) / [发现](skills/spec-ideate.md) |
| 12 | **UI比较与反馈恢复、Setup按需工具/原owner修复** | Work吸收同frame/token比较；Polish补反馈/residual；Dogfood补criteria与恢复；Setup窄补原配置层修复 | 保留browser唯一owner、精确origin、runtime source-first；实时语音/远程服务、native driver仅有真实需求与等价能力后实验。[实施](skills/spec-work.md) / [Polish](skills/spec-polish.md) / [Setup](skills/spec-runtime-setup.md) |

**暂不集成的整体机制**：CE通用跨模型runner/controller、approve-all协作式外部worker、默认自动commit/push、stack/merge/watch第二引擎、Pack/可配置docs root体系、Polish语音与远程实时runtime、通用视觉probe服务、默认删注释和泛化技术阈值。它们或与本地边界不兼容，或缺真实consumer/收益证据；未来以具体任务、授权、宿主能力缺口、维护owner与退出条件重新评估。

## 4. Actionable Findings：先修本地事实地板

以下是按影响排序的跨项问题摘要，**不是全部缺陷数量统计**；所有逐项问题、低优先候选与非问题反证均保留在34份笔记中。已运行的隔离反例是直接机制证据；prose冲突是源码事实。全部仍缺独立validator，`validation_status: unresolved`；行动类别为report-only，未授权自动apply。P1/P2是本轮风险建议，不宣称真实现场事故或新增回归。

| 编号 / 建议级别 | 触发、直接源码及观察事实 | 最小修复owner与证据 |
| --- | --- | --- |
| F01 / P1 | Optimize同名实验worktree再次create可`reset --hard/clean -fdx`删WIP；cleanup-all还会删同前缀普通目录。`scripts/experiment-worktree.sh:75,469` | 实验目录的ownership/manifest、dirty与删除授权；两方共同问题，不能搬CE当修复。[笔记](skills/spec-optimize.md) / [探针](optimize-source-probes.json) |
| F02 / P1 | Setup `path-safety.cjs:48`漏dangling symlink；routing:89、exclude:58两个direct writer跟随链接创建根外文件，隔离探针outside_created=true | owning path检查及两个writer的安全写；不将所有rename writer泛化为同一漏洞。[笔记](skills/spec-runtime-setup.md) / [探针](runtime-probes.json) |
| F03 / P1 | Worktree `.worktrees`链接指向repo外，`worktree-manager.sh:538,670`仍成功生成外部checkout | Git写入前realpath/祖先containment；不以slug拒绝斜线代替物理路径边界。[笔记](skills/spec-worktree.md) / [探针](worktree-source-probes.json) |
| F04 / P1 | Sweep `_run_locked`开锁失败仍执行handler；锁路径为目录、首次父目录不存在时都能写state且无有效锁；另`open(...,'w')`跟随symlink截断sentinel | 目录/锁file type、no-follow、不截断、锁失败时阻断互斥写；尚未复现真实lost update。[笔记](skills/spec-sweep.md) / [探针](sweep-boundary-probe.json) |
| F05 / P1 | Setup `workspace-graph-state.cjs:223`继承GIT_DIR/GIT_WORK_TREE；A仓快照记录B的HEAD且observed=true | 复用已有清理GIT_*的Git runner，核实际target身份。[笔记](skills/spec-runtime-setup.md) / [探针](runtime-probes.json) |
| F06 / P1 | Autoresearch scorer:74–77只认eligible；按文档写regression-eligible的HARD回归被漏过并返回STABLE；visual-ui也被排除 | scorer与协议共同统一字段、兼容旧名、未知值不能静默安全；未跑真实ship。[笔记](skills/autoresearch.md) / [探针](autoresearch-repros.json) |
| F07 / P2 | Task-pack `task-pack.js:804`词法containment放过外链文件/未来文件祖先；:792消费的shared denylist漏OpenCode；`.git/config`也可valid | 共享target/path owner覆盖物理路径、Git元数据与当前宿主runtime；这是资格误绿，未证明Work实际越权写。[笔记](skills/spec-write-tasks.md) / [探针](task-pack-boundary-probe.json) |
| F08 / P2 | Optimize `decide.cjs:501`接受自报sample_count代替独立重复样本；admission:226只核自报noise，A/A=0与100、noise=0仍准入 | 真实样本/可信receipt、预注册可计算噪声规则；不能把schema合格称测量可信。[笔记](skills/spec-optimize.md) / [探针](optimize-source-probes.json) |
| F09 / P2 | PRD finalizer:208只看stale reason，不核正文未变；改PRD正文后refresh-inputs仍finalized/verify=true。checker:761另把WHAT关键词当语义硬阻塞 | 分开artifact/input freshness；关键词只做advisory，声明矛盾才可机械gate。[笔记](skills/spec-prd.md) / [探针](prd-probes.json) |
| F10 / P2 | Code-review mechanics:219放P0/confidence0无证据进primary；truthy settled_conflict也可提升；路径lowercase合并A.js/a.js | finding门槛、字段形态与路径身份；末轮语义修改后重跑mechanics；未证明后续validator同样放行。[笔记](skills/spec-code-review.md) / [探针](code-review-source-probes.json) |
| F11 / P2 | LFG watch:374把两次相隔30分钟的green快照计为quiet_seconds=1800，违背连续观测约定 | watcher明确gap/resume与实际观测节奏，再重建窗口；不虚构失联期间事实。[笔记](skills/spec-lfg.md) / [探针](lfg-watch-gap-probe.json) |
| F12 / P2 | Browser wrapper接受vitals→open；conformance close固定exit9仍报passed并删除runRoot | 首次open顺序、cleanup独立receipt与失败诊断保留；fake provider探针不等真实浏览器conformance。[笔记](skills/spec-test-browser.md) / [探针](browser-source-probes.json) |
| F13 / P2 | 多Skill judge只查话术/条件grep/提交数：删实现、改正文、HEAD amend、未修tenant-bypass等违例仍通过；另有正确回执误拒 | 按各自owner校真实产物、HEAD/index/字节/结果与调用trace；语义裁判不能换成更大词表。[Work](work-judge-probes.json) / [Plan](plan-judge-probes.json) / [Review](code-review-source-probes.json) / [PRD](prd-probes.json) / [Simplify](simplify-judge-probes.json) |
| F14 / P2 | Work→Simplify proof保护未接线；Resolver→LFG缺发布后conversation consumer；Plan研究leaf及Work Figma leaf存在与parent权威/意图冲突 | 分别补caller/callee、明确completion owner、修真正leaf；prose事实不冒充真实模型失败。[简化](skills/spec-simplify-code.md) / [反馈](skills/spec-resolve-pr-feedback.md) / [规划](skills/spec-plan.md) / [实施](skills/spec-work.md) |

F15 / P2：`spec-pov/scripts/cross-model-pov.sh:141–144`的`__worker`入口在receipt校验前调用provider；无receipt的隔离fake codex确被调用，弱JSON也被接收。正常start fail-closed不能覆盖该入口。建议让所有worker invocation遵守同一admission/scope/deadline/schema；未调用真实provider，不声称真实代码已外发。[笔记](skills/spec-pov.md) / [探针](pov-probes.json)。

其余局部已复现问题仍需处理，包括Worktree remote-only detached、Polish缺参数循环/错误port与Procfile、Sweep close-evidence/version、Compound失败/未知工具状态误写成功、Riffrec覆盖/receipt事实表达等，均在逐项笔记，未因总报告聚焦共同问题而排除。

不列为已确认事故：真实PR误发/误合并、多机lost update、真实模型删弱测试、真实视觉回归、真实敏感数据泄露、Windows现场权限、跨模型实际served identity。未做历史归因，当前问题可能既有或两方共有。

## 5. 最小可维护实施顺序与出口

1. **先保护数据和事实身份**：F01–F06；路径问题修各自真实owner，Git环境用已有runner。逐条运行现有隔离反例及正常对照，危险清理只在可丢弃fixture，禁止在用户目录验证破坏。
2. **补验证地板与结果eval**：F07–F13；修当前producer/consumer/schema，不引入脚本语义评分器。无外部能力可用recorder/fixture，但不得升级为真实宿主结果。
3. **接通已有证据与owner**：proof保护、PR conversation completion、语义重评/去重、最终mechanics。每次同时改producer与真正consumer，避免“新增字段=融合完成”。
4. **窄化吸收研发语义**：第3节的Plan/Brainstorm/Debug/Knowledge/Explain等，优先补现有引用；保留本地授权、readiness、source/runtime和验证强度。
5. **最后做真实行为与成本验证**：冻结研发任务/基线与judge，fresh-source/实际host对照验证正确性、遗漏、返工、权限、上下文成本、time-to-trusted-change。缺证保持not-run/inconclusive，不能只凭测试通过或token下降改默认路径。

不新增workflow总路由、中央状态机、通用worker runtime、并列知识规范或无人消费schema。已有宿主primitive够用则复用；实验收益不足就保持可选或撤回。各建议都遵循当前角色契约的“确定性地板由脚本负责，语义充分性由LLM判断”。

## 6. 验证事实与未完成项

- 本轮已有针对性的本地tests及隔离counterexamples，日志和输入保存在审查根。测试混合prose pins、fixture/CLI/helper实际行为；不是34个真实Skill执行eval。不同批次存在重叠，不将其相加宣传为独立场景数。
- 例如Work现有8 suites/90 tests、Setup 4/33、Optimize 4/120、Plan 5/55、PRD 9/100均通过；同时已复现上述地板反例，绿测不撤销这些事实。完整批次索引见下表。
- 保留预期失败证据：Compound正向fixture两测试实际失败；Doc-review/Debug正确回执被词表误拒；Polish缺参探针超时。它们是审查发现，不伪装为验证全部通过。
- 用户排除前的早期consumer测试批次含部分排除项测试；仅作为历史执行记录保留，不计入4项审查完成、不继续该4项深审。
- [终验脚本](verify-audit.py)检查38/34/4映射、目录枚举、当前hash、读取区间、台账、产物与297份原dirty文件保护；原review snapshot另作[mutation复核](scope-final.json)。该脚本不证明模型实际阅读、判断正确、独立性或产品行为。
- 未执行真实模型/fresh-source独立reviewer、真实浏览器/Figma、真实8宿主投射或安装、Windows/WSL现场、GitHub/Slack/邮件操作、联网供应链及真实研发收益验证。未提交任何产品修复；本次“完成”仅限用户要求的源码审查与建议交付。

终验通过：38行映射、34项完成、4项跳过、包内枚举/hash/完整区间、75份文档链接均一致；297份原dirty文件无漂移，双方HEAD/本地分支不变，原71文件diff hash一致且mutation_detected=false。初次终验发现四项能力索引为空，已按已有深审笔记补齐；[初次失败记录](final-verification-initial.json)与[旧状态收束记录](ledger-finalization.json)保留，不把元数据修正冒充新增源码阅读或运行证据。

逐项笔记可能保留审查过程中的“其他项后续再核”等阶段说明；全局收尾状态以本报告、最终coverage和终验为准，原始运行事实不因状态收束被改写。

## 7. 全量映射与逐项结论

下表与规划、coverage同源；排除项不形成结论。每份笔记均对应完整包内阅读和具名直接依赖，不用此摘要代替细节。

| 序号 | spec-first / CE对应 | 状态 | 逐项结论与建议 |
| --- | --- | --- | --- |
| 1 | `autoresearch` / `无直接对应` | 源码审查完成 | [30包内文件及相邻Optimize/commit/治理接口全读；10项融合裁定，确认scorer字段失配，保留显式可选loop；先修评分/候选/check协议，再接本地实验和提交owner；补结果/恢复eval，不建立第二研发总路由](skills/autoresearch.md) |
| 2 | `spec-app-consistency-audit` / `无直接对应` | 跳过 | 用户指定跳过，不形成审查或融合结论。 |
| 3 | `spec-brainstorm` / `ce-brainstorm` | 源码审查完成 | [58包内文件全读；保留本地WHAT/授权/恢复增强，建议补problem、settled和no-doc闭包；先修synthesis本地自洽，再目标/范围标准与结果eval；暂缓视觉及通用跨模型runtime](skills/spec-brainstorm.md) |
| 4 | `spec-code-review` / `ce-code-review` | 源码审查完成 | [已全量核对；scope/准入增强保留，存在mechanics与eval共同缺口，非完美融合；先修finding地板与修复judge，再窄吸收条件depth、末轮重算和persona证据条目；跨模型保持dormant](skills/spec-code-review.md) |
| 5 | `spec-commit` / `ce-commit` | 源码审查完成 | [10 个包内文件及直接提交接口完整核对；核心能力已有等价实现，3 个轻量融合点和评测缺口已记录；复用共享 native 消息写入、exclude 与已知 U-ID；保留授权/mixed-hunk/作者保护；补 outcome eval](skills/spec-commit.md) |
| 6 | `spec-commit-push-pr` / `ce-commit-push-pr` | 源码审查完成 | [双方24个包内资产与直接接口完整核对；建议吸收项目PR模板、tracker语义与已知决策来源，保留本地提交/外写增强；先补模板/close-vs-link和真实状态eval；统一portable recipe；不引入stack/babysit产品面](skills/spec-commit-push-pr.md) |
| 7 | `spec-compound` / `ce-compound` | 源码审查完成 | [完整包内及知识合同核对；保留publication增强，复现摘要误绿与正向fixture失败；先合同自洽/状态摘要/fixture；吸收parent-owned正文和corpus去重；配置root按需](skills/spec-compound.md) |
| 8 | `spec-compound-refresh` / `ce-compound-refresh` | 源码审查完成 | [双方41文件全读；worth/失效条件核心已融合，保留本地候选发布和权限，窄化吸收历史术语消费者及cue覆盖；先补知识保留和发布失败结果eval；不并列retire_when、不恢复自动landing或全词表扫库](skills/spec-compound-refresh.md) |
| 9 | `spec-debug` / `ce-debug` | 源码审查完成 | [双方31文件与shared closeout/LFG直接消费完整核对；补复现仪器、性能归因、missing-seam和proof-test，保留本地source/授权/证据；优先集成复现/性能/测试保护，消除隐式port/未来CI措辞，增强全角问句和真实行为eval](skills/spec-debug.md) |
| 10 | `spec-doc-review` / `ce-doc-review` | 源码审查完成 | [全量核对完成；保留report-only与任务包增强，吸收后果准入/证据重评，复现judge漂移；先修schema/eval/Withdraw闭包，再融合语义准入/去重与恢复幂等；跨模型保持dormant](skills/spec-doc-review.md) |
| 11 | `spec-dogfood` / `ce-dogfood` | 源码审查完成 | [双方21包内文件与browser直接合同完整核对；优先吸收criteria证据链、stale-rule和知识去重，保留本地授权/owner边界；先补criteria与resume/server身份；不直接导入Pack分发器，增强零调用结果eval](skills/spec-dogfood.md) |
| 12 | `spec-explain` / `ce-explain` | 源码审查完成 | [双方24包内文件及直接测试完整核对；建议吸收行为trace和理由分层，保留持久教学定位；先补trace/理由和真实fallback eval，再融合source links/provider边界；不扩发布面](skills/spec-explain.md) |
| 13 | `spec-handoff` / `ce-handoff` | 源码审查完成 | [双方27包内文件与直接caller完整核对；CE主要能力已具备，保留持久writer和已授权继续分支；补真实受管路径、HEAD差分与继续执行eval；不导入临时store/一律等待](skills/spec-handoff.md) |
| 14 | `spec-ideate` / `ce-ideate` | 源码审查完成 | [双方48文本资产全读；主要发散/证据链已融合，建议补唯一dossier、杠杆排序与数量/预算闭包；先局部自洽，再分层样本与结果eval；保留独立授权/单次scratch/Brainstorm决策owner](skills/spec-ideate.md) |
| 15 | `spec-lfg` / `lfg` | 源码审查完成 | [双方35文件及work return/watch机制全读；保留本地验证和权限，确认未观测时间计入quiet window；先补watch连续观测和feedback completion；复用当前plan/发布owner；不复制CE通用路由/stack合并](skills/spec-lfg.md) |
| 16 | `spec-optimize` / `ce-optimize` | 源码审查完成 | [全包及6组测试源码核对；8探针确认样本/噪声与worktree缺口，保留独立holdout增强；先数据保护与真实样本地板，再定位/Goodhart/比较身份/报告；remote调度暂缓](skills/spec-optimize.md) |
| 17 | `spec-plan` / `ce-plan` | 源码审查完成 | [双方包内全读及work/task-pack消费者核对；55测试通过但复现3种judge误绿，不能整包覆盖；保留字节级WHAT/授权/readiness；吸收concern裁定、稳定KTD、研究dossier和决策去重，先修自洽与eval](skills/spec-plan.md) |
| 18 | `spec-polish` / `ce-polish` | 源码审查完成 | [47文件6825行全读；本地启动/授权更强，CE反馈及恢复闭环可窄吸收；7组共有边界证据复现；优先修resolver输入与Procfile事实选择；补反馈/验证/residual；暂缓整体语音/远程runtime](skills/spec-polish.md) |
| 19 | `spec-pov` / `ce-pov` | 源码审查完成 | [双方全包与直接合同核对；三类subject半融合，隔离复现worker绕过和judge误绿；正常peer仍degraded；先补worker/admission/schema，再统一subject/grounding；窄吸收callee证据、owner与最小实验，不导入品牌推定独立性](skills/spec-pov.md) |
| 20 | `spec-prd` / `无直接对应` | 源码审查完成 | [全包与直接hook/consumer核对；保留产品WHAT/receipt，复现refresh越界、语义词表阻塞和judge误绿；先修freshness/词表gate/评测，再统一release闭包与授权；有界吸收CE单owner和concern，不上线eval-only拓扑](skills/spec-prd.md) |
| 21 | `spec-product-pulse` / `ce-product-pulse` | 源码审查完成 | [双方20包内文件完整核对；CE核心已具备，本地证据/privacy更强，发现共有路由与评分歧义；保留本地增强；先统一metric source默认值、not-run枚举与结果eval](skills/spec-product-pulse.md) |
| 22 | `spec-project-rules` / `无直接对应` | 跳过 | 用户指定跳过，不形成审查或融合结论。 |
| 23 | `spec-promote` / `ce-promote` | 源码审查完成 | [双方14包内文件和noslop/auth接口完整核对；核心等价，保留本地egress/失败receipt增强；收敛空draft commentary例外、准确交付claims和结果eval；不扩发布或config层](skills/spec-promote.md) |
| 24 | `spec-prototype` / `ce-prototype` | 源码审查完成 | [建议吸收隔离页面批注与针对性craft floor；保留loopback/token自停和产品owner边界；先统一授权/eval和stop文案，再最小reload，最后真实任务验证可选批注](skills/spec-prototype.md) |
| 25 | `spec-resolve-pr-feedback` / `ce-resolve-pr-feedback` | 源码审查完成 | [双方35文件及LFG直接接口完整核对；中央判断已融合，建议补caller-owned可恢复conversation尾部，保留独立授权和失败证据；先接pending-actions消费者和publication证明；精确repo示例与隔离结果eval；不默认自动commit/外发/模型裁定](skills/spec-resolve-pr-feedback.md) |
| 26 | `spec-riffrec-feedback-analysis` / `ce-riffrec-feedback-analysis` | 源码审查完成 | [核心反馈证据链已融合，保留隐私/快照增强；隔离复现4项证据表达缺口；先聚合egress receipt和partial coverage，再补事件事实/结果eval](skills/spec-riffrec-feedback-analysis.md) |
| 27 | `spec-rule-miner` / `无直接对应` | 跳过 | 用户指定跳过，不形成审查或融合结论。 |
| 28 | `spec-runtime-setup` / `ce-setup` | 源码审查完成 | [双方全包及直接consumer已核对；保留runtime增强，隔离确认悬空symlink越界/Git污染/命令身份缺口；先修共享路径和Git runner，再统一命令/文档/consumer；窄吸收按需能力与原owner修复，不导入Pack和跨模型runtime](skills/spec-runtime-setup.md) |
| 29 | `spec-simplify-code` / `ce-simplify-code` | 源码审查完成 | [双方27包内文件及24直接依赖全读；9项融合裁定收敛，保留本地WHY/授权，优先proof-test与结果eval；先接caller proof-test保护与真实产物eval；条件式测试价值lens；不默认五reviewer或删除注释](skills/spec-simplify-code.md) |
| 30 | `spec-strategy` / `ce-strategy` | 源码审查完成 | [双方18包内文件及pulse直接消费合同完整核对；核心等价，建议窄化吸收判别式压力测试和拒绝原则；保留本地标题/ownership；先补压力测试质量与真实diff评测](skills/spec-strategy.md) |
| 31 | `spec-sweep` / `ce-sweep` | 源码审查完成 | [源端去重/租约/计划主能力已融合；保留本地授权与持久状态增强，4项floor反例复现；先锁/close证据floor，再版本UTF-8、shared publication与媒体授权packet](skills/spec-sweep.md) |
| 32 | `spec-test-browser` / `ce-test-browser` | 源码审查完成 | [双方14文件及真实LFG消费合同完整核对；保留唯一owner，复现vitals先于open及producer忽略cleanup；先补顺序/cleanup，再按等价能力实验自适应/native；不导回server管理](skills/spec-test-browser.md) |
| 33 | `spec-test-xcode` / `ce-test-xcode` | 源码审查完成 | [双方9个包内文件完整核对；多数核心能力已有等价/更强实现，可窄化吸收flow推导与操作结果观察；补bundle ID来源、setup准确handoff和零调用eval；保留source绑定/URL/Fail边界](skills/spec-test-xcode.md) |
| 34 | `spec-work` / `ce-work` | 源码审查完成 | [双方77包内文本与14直接接口全读；保留task-pack/授权/最终树增强，确认5类judge误绿及Figma合同冲突；先修结果eval并与simplify/Debug接proof-test保护，再吸收同frame/token比较；不导入外部runtime或自动提交](skills/spec-work.md) |
| 35 | `spec-worktree` / `ce-worktree` | 源码审查完成 | [双方17包内文件完整核对；复现路径逃逸和remote-only detached，work forward边未建立；先修containment/ref一致性并补caller合同；native/fork能力有条件吸收，保留env/trust边界](skills/spec-worktree.md) |
| 36 | `spec-write-skill` / `无直接对应` | 跳过 | 用户指定跳过，不形成审查或融合结论。 |
| 37 | `spec-write-tasks` / `无直接对应` | 源码审查完成 | [23包内文件及CLI/work/doc-review直接接口全读；保留可选派生层，复现路径/symlink及runtime边界误绿；先统一路径owner与结果eval，再无损投射proof/settled/external done intent；不复制CE默认并行或自动commit](skills/spec-write-tasks.md) |
| 38 | `using-spec-first` / `无直接对应` | 源码审查完成 | [本地11文件及CE相邻入口完整核对；保留单owner轻量路由，source/runtime差异已留证；增强真实routing eval与包外引用投射检查；不把CE模型carrier搬入入口](skills/using-spec-first.md) |

## 8. 测试批次索引

批次可重叠；以原JSON、日志和各Skill笔记的适用范围为准。未运行的模型行为不能由下表推断。

| 批次 | 记录结果 | 原始证据 |
| --- | --- | --- |
| brainstorm-tests | 4/4 suites；16 passed，0 failed，0 pending | [brainstorm-tests.json](brainstorm-tests.json) / [log](brainstorm-tests.log) |
| code-review-tests | 6/6 suites；87 passed，0 failed，0 pending | [code-review-tests.json](code-review-tests.json) / [log](code-review-tests.log) |
| compound-tests | 5/5 suites；77 passed，0 failed，0 pending | [compound-tests.json](compound-tests.json) / [log](compound-tests.log) |
| consumer-tests | 命令exit 0；数量与实际覆盖见日志/对应笔记 | [consumer-tests.json](consumer-tests.json) / [log](consumer-tests.log) |
| debug-contract-tests | 命令exit 0；数量与实际覆盖见日志/对应笔记 | [debug-contract-tests.json](debug-contract-tests.json) / [log](debug-contract-tests.log) |
| doc-review-tests | 2/2 suites；53 passed，0 failed，0 pending | [doc-review-tests.json](doc-review-tests.json) / [log](doc-review-tests.log) |
| entry-contract-tests | 命令exit 0；数量与实际覆盖见日志/对应笔记 | [entry-contract-tests.json](entry-contract-tests.json) / [log](entry-contract-tests.log) |
| ideate-tests | 4/4 suites；15 passed，0 failed，0 pending | [ideate-tests.json](ideate-tests.json) / [log](ideate-tests.log) |
| lfg-state-tests | 命令exit 0；数量与实际覆盖见日志/对应笔记 | [lfg-state-tests.json](lfg-state-tests.json) / [log](lfg-state-tests.log) |
| optimize-tests | 4/4 suites；120 passed，0 failed，0 pending | [optimize-tests.json](optimize-tests.json) / [log](optimize-tests.log) |
| plan-tests | 5/5 suites；55 passed，0 failed，0 pending | [plan-tests.json](plan-tests.json) / [log](plan-tests.log) |
| polish-tests | 4/4 suites；19 passed，0 failed，0 pending | [polish-tests.json](polish-tests.json) / [log](polish-tests.log) |
| pov-tests | 5/5 suites；63 passed，0 failed，0 pending | [pov-tests.json](pov-tests.json) / [log](pov-tests.log) |
| pr-feedback-helper-tests | 命令exit 0；数量与实际覆盖见日志/对应笔记 | [pr-feedback-helper-tests.json](pr-feedback-helper-tests.json) / [log](pr-feedback-helper-tests.log) |
| prd-tests | 9/9 suites；100 passed，0 failed，0 pending | [prd-tests.json](prd-tests.json) / [log](prd-tests.log) |
| promote-contract-tests | 命令exit 0；数量与实际覆盖见日志/对应笔记 | [promote-contract-tests.json](promote-contract-tests.json) / [log](promote-contract-tests.log) |
| prototype-tests | 2/2 suites；8 passed，0 failed，0 pending | [prototype-tests.json](prototype-tests.json) / [log](prototype-tests.log) |
| refresh-contract-tests | 命令exit 0；数量与实际覆盖见日志/对应笔记 | [refresh-contract-tests.json](refresh-contract-tests.json) / [log](refresh-contract-tests.log) |
| riffrec-tests | 3/3 suites；19 passed，0 failed，0 pending | [riffrec-tests.json](riffrec-tests.json) / [log](riffrec-tests.log) |
| runtime-tests | 4/4 suites；33 passed，0 failed，0 pending | [runtime-tests.json](runtime-tests.json) / [log](runtime-tests.log) |
| strategy-pulse-contract-tests | 命令exit 0；数量与实际覆盖见日志/对应笔记 | [strategy-pulse-contract-tests.json](strategy-pulse-contract-tests.json) / [log](strategy-pulse-contract-tests.log) |
| sweep-tests | 2/2 suites；6 passed，0 failed，5 pending | [sweep-tests.json](sweep-tests.json) / [log](sweep-tests.log) |
| targeted-tests | 命令exit 0；数量与实际覆盖见日志/对应笔记 | [targeted-tests.json](targeted-tests.json) / [log](targeted-tests.log) |
| task-pack-tests | 3/3 suites；33 passed，0 failed，0 pending | [task-pack-tests.json](task-pack-tests.json) / [log](task-pack-tests.log) |
| work-tests | 8/8 suites；90 passed，0 failed，0 pending | [work-tests.json](work-tests.json) / [log](work-tests.log) |
| xcode-contract-tests | 命令exit 0；数量与实际覆盖见日志/对应笔记 | [xcode-contract-tests.json](xcode-contract-tests.json) / [log](xcode-contract-tests.log) |
