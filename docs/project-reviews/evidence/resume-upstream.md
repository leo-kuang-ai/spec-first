# 上游五项续审：独立源码核查

日期：2026-11-01。范围：S01、S02、S03、S04、S05。审查者为本轮新上下文 reviewer；继承了主审摘要，不称盲评，也不把多视角推演称为独立行为验证。未调用付费模型、外部服务或修改被审对象。本文以增量方式完成；“续审结论与覆盖补齐”之后为最终状态，前面的初步进度不代表仍待执行。

## 版本与阅读进度

源码基线 `049e52744`，本路终检 HEAD 为 `1aa272a606710407e69b22d0452a34cd9b0d1f8f`，`git diff 049e52744 -- skills/ src/cli/task-pack.js` 为空。当前dirty、84份完整/部分阅读记录、SHA-256与确定性计数见 [resume-upstream-reading.json](resume-upstream-reading.json)，完整与定向读取分别标记，排除文件不计入。通过 `/tmp/spec-review-reading/b04.txt`–`b15.txt` 原文分片读取，非摘要。分片之外补读 `spec-ideate/SKILL.md:1–29`、`spec-write-tasks/references/task-quality-guide.md` 尾部；分片引用只是本轮阅读方式，长期依据仍是下列仓库文件。

- S01：`skills/spec-ideate/SKILL.md`、一级 references 中 decomposition、divergent-ideation、grounding、ideation-sections、issue-intelligence、output-mode、post-ideation-workflow、scope-gates、universal-ideation、user-research-artifacts、web-research-cache 已完整读。worker prompts 未读：仅授权派发时触发，当前判断未依赖 worker 内部结论；markdown/html-rendering 未读：仅格式，本次已读 ideation-sections 的实质产物合同。未宣称真实运行效果。
- S02：`skills/spec-brainstorm/SKILL.md` 和一级 references 中 approaches、blindspot-pass、brainstorm-sections、dialogue、handoff、interaction-rules、model-tiers、output-mode、phase-0、plan-write、product-pressure-test、settled-decisions、synthesis-summary、universal-brainstorming、verdict-routing 已完整读。worker prompts 条件排除；rendering 纯展示依赖排除，实质字段和出口已由 brainstorm-sections 覆盖。
- S03：`SKILL.md`、design-source-evidence、domain-language-and-decision-ledger、evidence-and-topology、grill-with-docs-integration、large-input-checkpoint、prd-readiness-lens、product-analysis-lite、product-expert-lens 已完整读。关键 `prd-output-template.md` 被原分片按名称排除，**尚须补读**；assets 模板与 checker/finalizer 亦待读，因此暂不标静态完成。
- S05：`SKILL.md`、execution-handoff-contract、task-pack-schema、task-quality-guide 已完整读。validator 及真实 Work 消费者待补读，暂不标静态完成。
- S04：SKILL 已完整读；refs 正在读，组合输出曾截断，缺口将直接补读，不能计为完整覆盖。
- 共用：本次需求第 3.1–3.9、第4、第5.2–5.3、第6及第7.2已读；外部research记录和source scripts未完。

## S01 初步判断

面向尚未选择方向的产品/工程负责人，把代码现状或给定证据转为有依据、可比较且可拒绝的候选集合，消费者为用户与 brainstorm。非目标是需求定稿、计划和实施。独立能力基准是：范围正确、证据可追溯、候选真正有差异、选择理由与代价清楚、交接不把假设变事实。

源码已有实质方法：decomposition 将主题轴与生成视角区分；divergent-ideation:63–85要求每候选的依据和范围；post-ideation-workflow:9–17核验引用与直接依据，:107–117要求向 brainstorm 携带源快照、假设与一项被拒绝替代。grounding:121–123避免把 gist 当事实，写失败时返回完整内容而非只回路径。上述支持有界候选审查，不证明真实创新或研发收益。

初步设计结论：条件充分；前提是能取得相关源码/材料并按引用核对重要依据。完整能力映射、场景和3.9检查在本文件后续补齐。静态关注：即便 tactical 请求也保留六视角及固定生成覆盖（scope-gates:121–125），小范围探索的成本可能偏高；尚无基线，不建议直接删减或定为有损。

## S02 初步判断

面向有方向但WHAT仍未清晰的负责人，输出可供 planner 不再发明用户行为的 Product Contract；轻量无歧义请求可以只在对话中结束。现有 source-fact/user-decision 区分、接受例与负例、源事实复核、决定单一ownership、pause保存限制与下一问题等设计，支持其核心目标。

静态观察 UP-S02-01（P2，待场景验证）：synthesis-summary:45允许existing task authorization覆盖continuation，:260又允许authorized continuation，但:52要求Standard/Deep无条件confirmation，:220–226要求任何revision后再等explicit confirmation。这些局部绝对词在已授权“自主整理文档”且无新产品决策时可能重复等待；不是工具强制批准，不能据此宣称真实用户已审阅。建议只统一授权语义，保留有实质WHAT缺口的询问；用已授权丰富输入和修订请求对照验证是否能完成文档且不伪造批准。暂不建议去掉产品决策证据门禁。

## 续审结论与覆盖补齐

本节取代上面的进度性“待补读”状态，保留前文便于看清结论形成边界。五项核心定位合理；S01/S02/S04 的主要成本风险在通用方法与确认流程，S03 的主要风险在高密度 closure 指令的可理解性，S05 的主要价值在派生身份与真实消费者一致性。没有新增可据此确认的 P0/P1。下述静态场景均为源码推演，不算行为执行。

已补完 S03 `prd-output-template.md` 全文、`assets/templates/00-generic.md`、`50-cli-devtool.md`、`60-mixed.md` 全文、finalizer 全文与 reason-codes 全文；checker 按边界定向读 `isValidTraceRow` 至 `analyzeOutstandingQuestions`（652–818）、`computeFacts` 与 `gateReadyClaims`（1258–1428）、`buildReport`/CLI/export（1589–1692），**没有宣称通读 checker 1692 行**。`tests/unit/spec-prd-exit-safety.test.js` 全文已读，未运行。其他 App/Admin/Backend/H5、证券、large-index 模板未读：本轮只对 generic + CLI + Mixed 产物成立，不覆盖这些专门 surface 的问题充分性。glossary checker 未读，不对其算法作结论。

S04 除两份 renderer 外，全部一级语义引用已完整读：approach-altitude、deepening-workflow、final-review、frontend-engineering-lens、high-risk-plan-lens、intake、interface-and-evolution-lens、output-contracts、output-mode、plan-handoff、plan-sections、planning-evidence-boundaries、research、resume、settled-decisions、structure、synthesis-summary、universal-planning。分片 b28 的缺口已直接补读 final-review:1–48，b32–b34 完整补齐。renderers 未读，因此不评价 HTML 渲染质量或转换保真。worker prompts 条件排除，**不评价其专门能力与盲性**；caller 的 dispatch/inline fallback 边界已读。

S05 `src/cli/task-pack.js` 全部995行与 `skills/spec-work/references/work-intake-and-task-pack.md` 全文已读；其导入的 target-repo、secret-deny、Markdown parser 只识别调用边界，未递归通读，路径安全结论限于明确调用与消费者要求。`task-pack-command.test.js` 只检索测试名称，不算测试阅读或通过。

共用 `docs/methodology/结构化项目角色契约.md` 全文与 `docs/contracts/project-graph-consumption.md` 全文已读。五项 `evals/eval.yaml` 全文已读；Plan 的 `check-enrichment.sh`、Tasks 的 `rejects-remote.sh` 全文已读；其他 case/judge 未逐个读，不将清单数当评测覆盖。研究记录已读来源索引 R1–R30、3.1 与4–5节，本轮**复用2026-11-01有界调研记录，未重新访问外网**。该复用只能支持工程建议，不能当重新核验后的厂商最新承诺。

## 定位、独立能力基准与目标映射

以下基准先按消费者所需结果建立；源码只回答是否提供足够机制。所有“覆盖”均指设计覆盖，行为与真实结果另列。

### S01：有依据的方向探索

用户尚未选方向，痛点是候选同质化、凭空编造用户问题或把实现点子冒充价值。核心目标是让负责人能在真实约束下选择或拒绝方向；必要子目标是确认探索范围、生成差异化候选、说明证据及代价。输入可以是代码库、主题与指定资料；没有可用材料时应限制依据强度，不能编造研究。输出是候选及推荐理由/未决项，供用户和 brainstorm 消费。非目标：定稿产品需求、技术方案、实施或对外发布。失败表现：假引用、候选无差异、范围擅自扩大，或写失败后只返回不存在的路径。专业建议维持定位，不把“产出很多 ideas”当成功。

| 定位目标 | 必备能力与理由 | 合格产物 | 源码依据 | 判断/缺口 | 场景 |
|---|---|---|---|---|---|
| 从现状找有价值方向 | 还原当前痛点、约束和证据；否则候选不相关 | 问题、对象、来源与推断分开 | grounding、issue-intelligence | 覆盖；无真实用户证据不提升价值 claim | I-N/I-C |
| 提供真正不同的选择 | 在问题轴上发散并解释代价；避免同义改写 | 候选差异、适用条件、取舍与淘汰理由 | decomposition、divergent-ideation:63–85 | 条件覆盖；固定六视角的额外收益未验证 | I-N |
| 选择后可安全接续 | 保存选中项、相邻被拒绝项、假设及来源 | brainstorm 不必从零猜测 | post-ideation-workflow:9–17、107–117 | 覆盖；不证明消费者真实执行 | I-R |

### S02：收敛产品 WHAT

面向已有想法、但目标用户/行为或成功条件未定的负责人；核心目标是形成 planner 不必发明 WHAT 的需求。子目标是澄清关键歧义、用正反例表达行为、保留非目标与决策依据。输入是用户想法、相关源码和已定决定；源码可回答事实，不能独自决定产品应如何变化。输出可为轻量对话结论或 requirements-only unified plan，消费者是 spec-plan。失败是把内部方案塞进产品合同、默认值冒充用户决定、未闭合关键行为却宣称 ready。无现实产品验证时，需求一致不等于产品有效。

| 定位目标 | 必备能力与理由 | 合格产物 | 源码依据 | 判断/缺口 | 场景 |
|---|---|---|---|---|---|
| 消除实现关键歧义 | 识别行为、权限、状态和例外；不把问题全转给用户 | R/流程/验收/未知与来源相互可追溯 | dialogue、product-pressure-test、brainstorm-sections | 覆盖；默认确认循环仍有冲突 | B-N/B-C |
| 保持范围与决定 | 以实例压力检验并保存选择/反例，不重复已定项 | 产品 WHAT 与技术 HOW 分离 | approaches、settled-decisions、blindspot-pass | 覆盖；不等于盲评或多人验证 | B-C |
| 可靠交接与恢复 | 未完成时留下真实缺口及下一问题 | requirements-only 不可冒充可执行计划 | plan-write、handoff、synthesis-summary | 条件充分；UP-S02-01 | B-R |

### S03：已有系统的 PRD 级需求整形

面向处理既有业务增量的产品/工程 owner。痛点是多来源材料、旧实现与新要求混杂，planner 被迫补造范围、状态和权限。核心目标是获得有证据、可验收的增量需求；子目标包括 current/target delta、领域语义与冲突关闭、跨 surface 消费者、设计来源覆盖、可恢复 checkpoint。输入须有既有系统锚与变更意图；0–1机会探索移交 brainstorm，明确 bugfix 不强制写 PRD。输出是 `docs/brainstorms/` 下 PRD、checkpoint 或 validate 的只读报告；消费者为 plan，不直接 work。checker 只能保证声明与结构一致；真实 owner 回答及语义充分性仍由人/LLM负责。专业建议保留 brownfield 定位，减掉互相争夺 authority 的重复文案，不能靠模板数量代替需求质量。

| 定位目标 | 必备能力与理由 | 合格产物 | 源码依据 | 判断/缺口 | 场景 |
|---|---|---|---|---|---|
| 区分现状、期望及不变项 | 源事实不能自动成为新产品决定 | Change Delta、负向验收、source authority | evidence-and-topology、00-generic、prd-output-template | 覆盖；仅审 generic/CLI/Mixed | P-N |
| 关闭会迫使规划发明WHAT的缺口 | 对权限、状态、来源冲突有可核对决定 | OQ disposition 与 owner/source证据绑定 | domain-language-and-decision-ledger、design-source-evidence | 条件覆盖；UP-S03-01提示停止语义不一致 | P-C |
| 出口不虚构ready | 结构/来源哈希/真实语义分权；validate不写 | 真实finalizer receipt或non-ready checkpoint | finalize-prd-artifact、checker定向段、exit-safety tests | 设计覆盖；测试仅阅读，未执行；宿主Hook强制未在本路核实 | P-C/P-R |
| 长输入可恢复 | 原材料索引与稳定R/AE比有损摘要更可靠 | checkpoint携带开放分支和源ref | large-input-checkpoint、prd-output-template | 覆盖；超大真实材料的召回未验证 | P-R |

### S04：现有架构中的可执行方案

面向 WHAT 已足够明确、需要决定 HOW 的实施者。核心目标是把意图变为当前仓库适配、可验证的实施方案；子目标是 owner定位与复用取舍、依赖和迁移次序、风险及验证责任。输入为需求/PRD/既有计划或足够明确的任务；依赖缺失若改变产品行为不能静默降成假设。输出 unified plan/有界知识工作计划，消费者为 write-tasks、work和doc-review；它不执行产品代码、测试或部署。失败是可读但不可执行、重复造轮子、遗漏真实消费者、改写上游产品合同，或将测试计划当已验证结果。专业建议不缩小职责来迁就成本；优先统一授权与确认规则，保持 source/consumer/验证合同。

| 定位目标 | 必备能力与理由 | 合格产物 | 源码依据 | 判断/缺口 | 场景 |
|---|---|---|---|---|---|
| 方案适配现有系统 | 当前入口/调用链/owner/私有API确认；比较复用、扩展、组合、新建 | KTD列来源、候选与后果，落在真实owner | research:25、165–167；planning-evidence-boundaries | 条件覆盖；源码研究充分性仍需语义判断 | L-N/L-C |
| 可独立反馈的切片 | 真实依赖、兼容窗口、最早验证点，避免按层割裂 | 稳定U-ID、输入/行为/验证结果与依赖 | structure:43–114、interface-and-evolution-lens | 覆盖；不强推所有私有接口三阶段迁移 | L-N |
| 保留产品 authority | WHAT未闭合不发明；已有Product Contract字节保留 | requirements-only与implementation-ready清楚 | intake、output-contracts、synthesis-summary:354–369 | 覆盖；renderer保真未审，已有script judge可验字节 | L-C/L-R |
| 可验证而不过早执行 | 需求例子导出测试/集成/rollout验证，明确未执行 | Verification Contract与DoD有consumer | plan-sections、high-risk/frontend lenses | 覆盖；commands与不写机械脚本不冲突，structure:199明确允许验证命令 | L-N |

### S05：不制造第二计划的任务派生

面向复杂计划的执行owner，痛点是一次加载整份计划、并发冲突和任务丢失约束。核心目标是生成可消费的执行索引；子目标是完整映射source units、波次/文件边界、停止/审查/验收信号、来源新鲜度。输入必须是本地settled plan；小低风险计划可以skip，语义未定必须退回plan。输出可选 `task-pack/v1` 与真实CLI收据，consumer为work；任务包不是进度数据库、批准或产品权威。失败包括仅按文件拆任务、hash未执行却声称validated、过期包继续执行、遗漏集成或外部done。专业建议保留确定性floor与语义fit分层，只修误导性指令，不凭schema通过宣称任务拆分合理。

| 定位目标 | 必备能力与理由 | 合格产物 | 源码依据 | 判断/缺口 | 场景 |
|---|---|---|---|---|---|
| 无损压缩计划 | 每个任务可回源，保留proof/settled/manual done | 单元覆盖、具体files、上下文引用 | task-quality-guide、execution-handoff-contract | 覆盖；覆盖语义由LLM判断 | T-N |
| 安全编排 | 真实依赖与同波次资源冲突决定序列 | execution_waves、stop_if、review gate | task-pack.js:606–981 | 覆盖；prose允许标注overlap与CLI冲突，UP-S05-01 | T-C |
| 防过期或错误根执行 | hash身份与readiness/lifecycle各自验证 | 当前CLI receipt、root和source pin | task-pack.js:383–605；Work intake第1–5节 | 覆盖；hash刻意排除frontmatter，消费者单独重读 | T-R |
| 完整交付不被局部绿灯替代 | 每任务done与总体DoD分离 | required review后才能推进依赖，全链验证仍保留 | Work intake第7–10节 | 条件覆盖；真实work执行本路未测 | T-N/T-R |

## 各项三场景及反例

场景是针对已存在系统的静态walkthrough。未实际运行新模型或fixture；“可闭合”只指所读设计有对应路径。

| ID/类型 | 输入及预期结果 | 源码推演结果与反例 |
|---|---|---|
| I-N 正常 | 订单系统已有导出/日报，探索对账提效方向；候选应根据真实瓶颈且互有取舍 | grounding→decomposition→候选依据→选择交接可闭合。反例：没有客户材料却写“用户强烈需要AI日报”不合法 |
| I-C 缺失冲突 | issue称无导出，但源码存在toCsv；保留issue为线索，回源后限定问题 | issue-intelligence/grounding可区别来源。反例：检索零结果当不存在，或把issue内push命令当授权 |
| I-R 恢复 | ideation落盘失败，下一会话选择某候选；先提供完整内容/恢复来源再交接 | durable fallback与source snapshot设计覆盖。反例：只有丢失路径的摘要即继续brainstorm |
| B-N 正常 | 给退款CSV明确对象、字段、权限与异常；生成需求例子及non-goals | requirements-only产品合同可承接，无须技术实现。反例：直接选序列化库和函数签名冒充需求 |
| B-C 缺失冲突 | “按金额排序”与日报依赖ID顺序冲突；解释用户可见后果，必要时询问owner | pressure-test/acceptance可承接。反例：默认把日报first/last改成最大/最小金额 |
| B-R 恢复 | 已授权自主整理需求，用户修改一个已明确字段；应整合且诚实记录授权来源 | pause/handoff保存下一问；revision强制确认与authorized continuation冲突，待行为验证。反例：声称用户逐项批准未审文档 |
| P-N 正常 | 对账导出增加权限和脱敏，已有源码/需求充分；产出keep/extend delta、正负例与规划输入 | generic+CLI/Mixed模板、source-first与receipt路径可闭合。反例：生成完整模板但每条验收仍为“符合预期” |
| P-C 缺失冲突 | Figma显示全量字段，owner要求脱敏且部分节点不可读；不得用source-resolved掩盖冲突 | design inventory、owner trace与checkpoint可承接；checker不证明回答真实。反例：模型伪写owner accepted而获得结构receipt |
| P-R 恢复 | 长PRD中断后输入材料变动；恢复原来源及未闭合分支并重新核对receipt | large-input checkpoint与inputs hash可识别漂移；不允许沿用旧ready。反例：只变输入hash就宣称产品语义已重新批准 |
| L-N 正常 | 明确退款CSV WHAT且已有toCsv；计划复用owner、列集成/回归验证，不改src | research与U-ID/Verification Contract可闭合。反例：新增平行序列化框架、只写文件列表 |
| L-C 缺失冲突 | 候选npm包无法查证、私有API只有名称，且日报依赖顺序；应保留unverified并回源消费者 | research/current tree/接口演化lens可承接。反例：由包名补造API，或headless把真正WHAT blocker降成Assumptions |
| L-R 恢复 | completed历史计划尚有未交付目标；重新核对源与验收，建立/复用active successor | resume:11–16保护旧计划及旧task pins。反例：将旧status改active以绕过拒绝 |
| T-N 正常 | settled多单元导出计划，需要早期验证与最终集成；编译派生包，真实hash/validate后交work | schema/CLI/consumer合同可闭合。反例：新增done标准不在source plan中，或全部局部任务完成就跳过总体DoD |
| T-C 缺失冲突 | 两任务同波次改同一文件，或files指向generated runtime；应拒绝/串行/回owner | CLI明确拒绝；“mark overlap”不能解除硬拒。反例：把parallelizable:true当文件冲突豁免 |
| T-R 恢复 | hash仍相同但plan frontmatter改requirements-only或superseded；旧包不可执行 | Work单独重读readiness与lifecycle，hash不足以批准。反例：缓存receipt继续执行或重绑旧pins |

## 3.6责任映射与企业风险

主责与消费边界如下；无主责不等于可以遗漏上游约束。

| 环节 | S01 | S02 | S03 | S04 | S05 |
|---|---|---|---|---|---|
| 需求理解 | 探索方向，不确认需求 | 主责WHAT/例子 | 主责brownfield delta/OQ | 消费，真WHAT缺口退回 | 消费，不新造需求 |
| 需求切片/拆分 | 候选非任务 | 产品范围，不代拆任务 | Feature Slices非实施单元 | 主责U-ID/依赖/验证 | 主责派生task/wave |
| 现有系统理解 | 支撑idea依据 | 解释可见行为 | 区分current/target | 主责入口/owner/数据流/私有API | 核对declared files和真实依赖 |
| 技术方案 | 非目标 | HOW留plan | HOW留plan | 主责复用取舍/迁移/兼容 | 不得改变KTD |
| 编码集成、单测、自测 | 不实施 | 不实施 | 不实施 | 只定义验证责任，不跑产品测试 | 传递test_focus/done，不执行 |
| 审查修复 | 只处理候选依据问题 | 需求质量回路 | validate/refine分界 | plan审查/deepen，非代码修复 | doc-review与validation，非执行修复 |
| 完成总结 | 输出依据/限制 | ready状态/开放项 | receipt/语义/未知分层 | plan readiness与未验项 | actual validation/semantic fit分层 |
| 知识沉淀 | 不晋升知识 | 不晋升知识 | PRD-local closure；项目知识候选 | 消费learnings，不自动晋升 | 不晋升知识 |
| 多会话交接 | source/选项/假设 | pause与下一问 | checkpoint和原材料 | resume/successor新鲜度 | hash/readiness/lifecycle重验 |

补充风险逐项裁决：

- **隐式合同与非功能要求**：S02的场景压力与S03的current/delta、negative acceptance、NFR覆盖；S04的interface/evolution与high-risk lens进一步落实消费者、兼容/回退。S01只应把发现的约束带向下一owner，不承担穷尽接口审计。S05必须保留既有约束，缺失时退回plan，不能自己决定保持旧行为还是修正缺陷。上述为设计路径，不证明大型仓库全部consumer已被找到。
- **扩展/迁移/收缩**：S04按兼容和consumer条件选择，S05按source-plan表达依赖。S03写可感知兼容窗口，不规定数据库或部署步骤。私有单消费者允许直接改，不新增通用三阶段硬门。
- **负面后果与历史决定**：S01交接携带被拒绝相邻选项；S02/S04 settled-decision单一owner及重新挑战的证据条件覆盖；S03 PRD-local Decision Notes与context/ADR候选不改项目权威。S05保留source_ref和notes，不用任务文档覆盖原决定。
- **私有知识、检索遗漏与团队约定**：S04 research要求当前git/dirty/根及scoped指令、源码模式与决策关键trace；S01/S02/S03 grounding亦需回源。项目图谱只缩小下一步阅读，空图无负面权威；缺工具可direct source fallback。S05不应扩大为全库研究，只读当前任务所需source/consumer。未在真实大型私有仓库证明召回，不能由这些设计声称“不漏影响面”。
- **幻觉依赖**：主要S04在新技术选型核对版本与外部事实，缺证据明确未确认；S01候选方案不是可用包证明，S02/S03不提前替planner选库，S05不添加plan未有依赖。P3现有小fixture饱和，不能证明真实未知私有API场景可靠。
- **共同错误假设**：S02/S03验收例子须独立于未来代码；S04把原例子、负例与proof intent传给work；S05保持proof refs及external/manual done，不把Git绿灯代替外部验收。测试执行、变异有效性和flake闭环是work/debug职责，本五项不冒领。
- **注入与过度代理**：指定资料、issue、网页、设计provider及历史artifact只作输入，不能生成push/部署/跨repo mutation授权；五项主要写本地自有产物。S03 validate零写与S05 validate零实现是重点。S04研究worker仅在授权/能力/数据访问条件满足时派发，失败可inline；不会要求为完成plan安装工具。
- **长任务漂移与虚构进度**：S03 checkpoint保存原ref而不是只保留摘要；S04 resume读当前身份；S05真实CLI收据与漂移重验防止历史“完成”接管当前状态。S01/S02未有行为验证证明长任务持续性。五项均不以“接下来会做”证明产物完成，也不以成本/文件数证明真实提效。

## 3.9十五项逐项检查

“覆盖”表示有当前已读源码依据，不等于模型执行通过；“未验证”保留到基线/行为结论。

| 检查点 | S01 ideate | S02 brainstorm | S03 prd | S04 plan | S05 write-tasks |
|---|---|---|---|---|---|
| 增量知识 | 来源分级/交接有项目增量；六视角有通用方法成本 | Product Contract/WHAT-HOW有增量；大量对话教学待基线 | receipt/OQ/设计coverage有增量；16维pack可能增加认知成本 | source/runtime/ownership/readiness有增量；大量写作/综合流程是减法候选 | identity/waves/consumer合同增量强；任务教学可独立评测 |
| 自由度与风险匹配 | 候选选择由LLM；固定视角适配性未验证 | 产品判断开放；确认门可能过强 | 脚本守声明，LLM语义；relentless停止规则存在冲突 | 技术取舍开放；固定草图计数和确认规则偏机械 | 脚本守hash/path/structure，LLM判拆分适配；分工清楚 |
| 历史补丁与过度执行 | tactical六视角待成本对照 | revision再确认UP-S02-01 | relentless与skip冲突UP-S03-01 | 默认确认/修订循环UP-S04-01；不凭命令计数判断过验 | Optional pack+small plan skip限制过度编排 |
| 字面执行与过滤 | 推荐排序不能抹去证据不足标签 | 压缩call-outs不应删产品约束；主要写入完整合同 | gap triage声明只排序，但skip句冲突 | synthesis过滤的是展示细节，保留正文；非review漏报门 | context压缩仍须保留完整任务对象，不只execution_focus |
| 硬约束与验证区分 | 保留引用真实性与写失败fallback；视角可试验 | 保留requirements-only与WHAT blocker；确认仪式可统一 | 保留validate零写/receipt/owner真实性；不把脚本当语义 | 保留Product Contract、readiness与授权；“再想一次”不是硬门 | 保留实际CLI/漂移/路径边界；可去掉重复教学但须对照 |
| 指令优先级与冲突 | 未发现本路关键冲突 | authorized continuation与explicit revision confirm冲突 | canonical只排序与低价值skip冲突 | SKILL按实质缺口询问，refs有绝对措辞；skip路径确实存在 | schema不支持overlap marker但quality-guide允许，CLI硬拒 |
| 停止、询问与续跑 | 主题缺失可问；不可把选方向等同实施授权 | 合理WHAT问询；自主整理仍可能多停一轮 | 真owner缺口保checkpoint；默认持续grill需评测边界 | headless/confirm:auto可走；真正WHAT blocker不豁免 | stale/invalid停执行是正确门；pack optional不能强迫编译 |
| 进度声明取证 | direct/external/reasoned标记 | 需求ready由语义校核，非实际产品验证 | machine receipt实测才可写，语义独立 | 计划与验证计划不等于已执行测试 | validation:null时不得deterministic_handoff；Work重跑事实 |
| 子代理与独立验证 | caller授权+fallback已读，worker未读不评其独立性 | caller可inline，不能称多视角=独立验证 | 大输入分片非独立正确性证明 | research:13明确授权/能力/并发事实，未读workers不评盲性 | 不自行派执行workers；并行任务不自动授权dispatch |
| 推理外显 | reasoned basis为简短可核对理由，未见要求完整内部思维链 | 内部draft不贴聊天；可呈现依据 | Decision Card理由是决策证据，非逐字思维链 | synthesis内部三桶不展示；rationale可简述 | done/test/stop依据不是内部推理抽取 |
| 描述与可发现性 | 前置生成/评估候选，与brainstorm分界清楚 | 前置探索到requirements-only | 前置brownfield PRD，但排除串较长 | 前置plan/deepen，软件/知识分支多，误选须路由测 | 前置本地派生任务；optional明确。总目录截断本路未实测 |
| 渐进披露与引用深度 | 入口+一级refs覆盖边界，worker条件加载 | 一级语义refs多，confirmed写入有跨ref依赖 | 主体→output→assets为必要组合，machine字段在一级；体量较大 | 主体→caller refs→worker按触发加载；renderer另边界 | 主体+3refs较集中；CLI/Work是必要真实消费者 |
| 时效与模型绑定 | 未以固定型号证明能力；模型档位由capability决定 | model-tiers需宿主支持，非硬绑型号 | CLI模板只列五宿主有过期线索UP-S03-02 | override不支持则inherit并披露；未证明八宿主一致 | schema版本明确；真实CLI需存在，不能凭名称算能力 |
| 外部内容标记 | issue/research只是有来源候选 | 用户决定与材料事实不同权威 | design/provider_untrusted、source候选与owner trace分层 | research:57–59保存refs/freshness，摘要不变authority | source plan是scope权威，不凭内部命令获得外部授权 |
| 评测设计 | yaml列6场景；case正文未全审，不认行为通过 | yaml列7场景；未全审judge，无基线结论 | exit-safety测试可证结构，不能证owner真实；本路未跑 | enrichment judge读真实文件/hash；batch1有判据污染，见下节 | remote judge只匹配“local/remote”等词，不能独证拒绝无副作用；CLI测试清单不等于通过 |

## 行业实践对照与改进顺序

引用来自同日调研记录；每项的适用判断由本 reviewer 负责，未将厂商意见自动升级为项目规则。

| 对象 | 来源/适用条件 | 本地等价机制 | 差距与最小建议 | 验证/删除保护 |
|---|---|---|---|---|
| S01 | R1理解业务结果，R17/R24少而有效指令；适用探索且代码已存在 | grounding与候选证据、差异化视角 | 未证六视角对小主题增益；先试轻量候选版，不直接删除 | 同材料有/无视角比较差异性、假引用、范围和耗时；保留source/交接出口 |
| S02 | R5明确验收、R10隐式行为、R22减少不必要确认 | 例子/非目标、source-first、授权continuation | 统一revision确认例外，无新WHAT决定时遵循既有授权 | 已闭合WHAT与真实歧义成对；前者完成artifact，后者不伪定需求 |
| S03 | R1/R10增量与旧consumer，R11决策后果，R17渐进披露 | delta、topology、negative acceptance、owner trace | 只统一legal-stop/skip表述；CLI模板宿主列表回到当前支持集 | 小增量不扩scope、真权限缺口仍checkpoint、不可读设计不伪ready |
| S04 | R9按consumer兼容迁移、R11记录取舍、R22按授权行动 | evolution lens、KTD/settled、skip/headless | 先澄清授权规则和试验纯文档成本；不删source/consumer核查 | 更大私有API、多同名候选、真实WHAT已闭合场景；保持Product Contract字节与不改src |
| S05 | R5可执行有界任务、R9渐进迁移、R24行为评测 | hash、wave、proof intent、Work semantic fit | 删除“explicitly mark overlap”错误替代，保持串行；强化remote case副作用判据 | 同波次重叠必须CLI拒绝，换波次通过；远程输入不得发请求/写包/执行任务 |

不建议基于通用知识重复或行数立即批量删refs。删除候选原本防护的是候选同质化、漏需求、遗漏风险或任务含糊；本路没有证据证明无这些文本仍跨模型稳定。出口门禁（授权、来源、receipt、handoff）不参与“模型已会”的删除试验。

## 有界发现清单

| ID | 级别/状态 | 触发与源码证据 | 影响/最小修正 | 验收 |
|---|---|---|---|---|
| UP-S02-01 | P2待行为验证 | synthesis-summary:45/260允许已授权续跑，52及220–226对Standard/Deep与revision绝对确认 | 已授权且WHAT已闭合时可能额外停顿；明确既有授权例外，不捏造人工审阅 | 自主整理+明确小修订应产文档；真产品缺口仍问 |
| UP-S03-01 | P2待行为验证 | domain-language-and-decision-ledger:169说only expand scope/not current slice只排序非stop；199却要求skip | 同一低价值分支如何处理不一致，可能无谓grill；统一范围外分支的排除及可见记录规则 | scope外问题不无界扩张；load-bearing权限仍不能skip |
| UP-S03-02 | P3静态文案 | assets/templates/50-cli-devtool.md只列Claude/Codex/Cursor/Kiro/Qoder并写“五宿主” | 当前项目八宿主任务可能被模板诱导漏项；按实际目标/支持集列，不强制每PRD八端 | 新PRD实际涉及OpenCode/ZCode/Pi时不得漏；非目标host可排除 |
| UP-S04-01 | P2待更严格行为验证 | intake/final-review/synthesis要求确认，output-mode:30–35允许自然语言偏好skip；synthesis:163–169对revision又绝对等待 | 指令冲突的真实风险；不能称“完全没有自主通道”。统一授权解释到同一owner | WHAT充分+自主执行+revision应完成；WHAT阻塞/headless不伪ready |
| UP-S05-01 | P3静态文案 | task-quality-guide:148允许“explicitly mark overlap”，schema:135–136禁止；task-pack.js:957–979无marker豁免 | 可能生成永远校验不通过的包，执行端fail closed；删错误替代即可 | 同文件必须串行或重新拆边界，标注不能绕过CLI |

另有非finding成本候选：S04 final-review:28把图的存在按触发类别数量硬计数，而structure:60–68要求按表达价值选图且“不是directional sketches”；本路没有实际产物退化证据，不提升为问题。可在后续去冗余试验中检查是否多画重复图。structure:199明确允许Verification Contract写repo-specific命令，因此“不许机械脚本”与plan-sections要验证命令**不构成冲突**。

## S04已有行为证据的独立复核

先完成当前源码判断，再读 `batch1/results.md`、`expectations.md` 全文与 `runs/grades.jsonl` S04行。进一步直接解析 `/tmp/batch1/s04-glm/iteration-{1,2}/s04-p{1-reuse,2-implicit-consumer}/with_skill/outputs/agent/run/*.jsonl`：读取四次最终回复和工具调用名，**不是重新运行**。四份原始transcript SHA-256分别为：

- P1 iteration-1：`5c023abfdc52f366aadef3973c06f92f0f4628b632605c62ccbdaa25e424b63c`
- P2 iteration-1：`61f7f3efb713fe925e2006b3389b704fc6c77e56c1aa0d5dc33c0ce5720a498b`
- P1 iteration-2：`67c58c7ed8c153bbcda48242cef3bbb8a4a2ca0ed7e1d9bcca1183631d2a67a2`
- P2 iteration-2：`34cb4f2d5d6b2eaaafc068c5413925877641408749cf1d385a4b71df34da99e8`

确认事实：四次最终都等待确认，工具名序列没有Write/Edit；grades对应没有计划文件。**对原报告“全部为过度询问”的因果解释作收窄**：P1两次提出金额3.5/3.50和导出列范围；P2明确发现dailySummary依赖行顺序，提出保持语义/修改消费者。这些可能是实质产品或兼容决定，不能只因用户说“写计划”就断言所有询问多余。原fixture也未控制“WHAT全部已闭合且明确自主决策”，因此只能确认单轮未交付与规则诱因，不能由4/4推广“确认门导致S04整体有损”。需要补交叉条件场景才能裁决授权/问询成本。

基线裁决：S04小fixture的复用、consumer识别、不存在依赖场景多为饱和；P1/P2判据主要验证文件存在，P4问号匹配有缺陷。GLM观测到单轮产物缺失，是否有损须结合合理澄清成本；中转gpt组确定性判据未观察内容收益，不能当无价值证明。成本差异沿用batch1的token/时间记录，只对该provider、host、样本成立，未验证缓存计费口径。独立复核不是盲评；不复用盲评偏好当事实正确率。

## 分层完成状态与限制

| 项 | 设计充分性 | 本路行为证据 | 相对基线 | 真实结果 |
|---|---|---|---|---|
| S01 | 条件充分，核心refs已读；worker/渲染排除 | 三场景仅静态 | 未与基线对照：本路只读预算，不能评价增益 | 未验证产品/研发收益 |
| S02 | 条件充分，授权例外文案待统一 | 三场景仅静态 | 未与基线对照，同上 | 未验证需求返工率 |
| S03 | generic/CLI/Mixed条件充分；专门surface与checker全算法不在结论范围 | 三场景静态，exit-safety tests只读 | 本路未做新基线；不沿用其他eval声称通过 | 未验证真实大需求/宿主Hook |
| S04 | 条件充分；确认/图表表达有冲突线索 | 复核已有4次GLM停止证据；无新行为运行 | 已有有界对照，但不足判整体增益/损害；见上节 | 未验证企业time-to-trusted-change |
| S05 | 主体/refs/validator/Work consumer设计覆盖 | 三场景静态，未运行CLI场景 | 未与基线对照；可作为后续契约遵循型试点 | 未验证真实并发work与交付收益 |

本文件完成的是五项新上下文独立源码核查及有界复核，不是五项全部行为验收。源码/运行时未改；没有安装、图刷新、外发、付费模型、commit或push。主报告应保留这些证据层级及条件排除，不把静态完整字段换算为行为通过率。
