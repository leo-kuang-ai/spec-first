所有必读材料已读完，交叉验证完成。以下为评审报告。

---

# spec-plan 评审（R1）

**证据层声明**：本轮为静态 fresh-source 审查，全部裁决基于 `structure_contract` 层（SKILL.md 123 行 + references 20 文件全读 + 消费者接口级核对 + 合同测试/eval 清点）。`behavior_quality` / `runtime_cost` / `field_outcome` 未运行，不据此下行为结论。审查对象 Git HEAD 5b59293b，工作区 clean。

**流程缺口先行登记**：任务书指定的消费者清单 `reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-plan.consumers.txt` **不存在**（`reviews/runs/` 目录整体未创建）。我改为按 SKILL.md:31 声明的消费者自行核对：`spec-work`（input-triage）、`spec-write-tasks`、`spec-doc-review`、`spec-lfg`、CLI `src/cli/commands/plans.js`、`tests/unit/spec-plan-contracts.test.js`。此为审查运行缺口，非被审对象缺陷。

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-plan/SKILL.md:17；evals/cases/{always-plan-unclear-input,product-blocker-prevents-readiness,planning-only-rejects-implementation}.yaml；references/structure.md:88 | 重指导均有可指认失败模式并被 eval case 钉住（always-plan、blocker fail-closed、U-ID 防重编号明显是事故疤痕），未发现可无风险删除的过时约束 |
| D02 | pass | references/planning-evidence-boundaries.md:43-85（reuse/extend/compose/new + thin-glue 边界）；references/high-risk-plan-lens.md:7-21（触发矩阵）；references/interface-and-evolution-lens.md:50-57；planning-evidence-boundaries.md:24-26（新依赖注册表核实） | 大量真领域知识（组合决策、演进分支、证据信任级），脚本只备事实、LLM 持语义判断的分工在多处显式声明 |
| D03 | pass | tests/unit/spec-plan-contracts.test.js:62-87（字节保留标记+短语确定性钉住）；SKILL.md:38（诚实承认 prose 级强制）；references/plan-handoff.md:20（降级 envelope 明示 `review_source: producer-self-review`） | 必需验证明确且失败可见；未发现把语义判断冒充机械判定或把 prose 约定伪装工具强制之处 |
| D04 | pass | references/intake.md:61-64（字节保留）；skills/spec-work/references/input-triage.md:42-48（消费 `artifact_readiness`/`execution`/`status`/U-ID，与 plan-sections 字段一一对应）；skills/spec-write-tasks/SKILL.md:36,67（hash+`status: active` 消费）；references/intake.md:45 ↔ input-triage.md:48（superseded-sibling 双侧一致） | 生产者-消费者字段合同闭环经双侧源码核对；唯一缺口为 P3 级 html→md 孪生边缘（见 Findings F3） |
| D05 | pass | 见 Findings F1/F4/F5/F6（4 条 P3：悬空引用×3、双重 argument-hint、单问vs多问张力、门文本双份维护） | 指令总体清晰可定位、无系统性矛盾；P3 级可审计性缺口不构成维度失败 |
| D06 | pass | references/research.md:13-15（dispatch 授权阶梯 + `model_override_unsupported` 披露）；references/plan-handoff.md:20,61（降级 envelope；"tool shape alone is not a reason to stop"）；references/deepening-workflow.md:198（inline fallback 完成规划） | 能力缺失路径诚实降级且带 reason_code；能力假设中立，不绑特定模型/宿主（行为层未测，见声明） |
| D07 | pass | CHANGELOG.md:544,548,190,21（带日期的归因-修订-消费者测试链）；evals/eval.yaml:13-23（9 case 含 r2-* 回归案例）；references/settled-decisions.md:3（shared 源+同步脚本+回归测试，副本 diff 确认 IDENTICAL） | 按失败证据演化的链条可追溯；知识消费（docs/solutions/ 经 learnings-researcher，research.md:27）与失效条件（final-review.md:111）在位 |
| D08 | pass | SKILL.md:66-68（phase-gated 全读）；references/output-mode.md:11（point-of-use 配置）；references/final-review.md:70（pipeline 预算：初始写前禁预载 deepening/plan-handoff）；references/plan-sections.md:97-118（wayfinding 先建图）；references/research.md:11（worker prompt 仅正触发才读） | 按需加载纪律是全 skill 最强的一面；代价为 terminal-owner 强制重读（SKILL.md:68）——防上下文压缩的自觉权衡，非缺陷 |
| B01 | fail | SKILL.md:3（description 把 `runtime-maintenance` 与四个真实 skill 名并列）；`ls skills/` 无 runtime-maintenance（仅 spec-runtime-setup）；skills/using-spec-first/references/public-route-map.md:38（它是路由标签非入口） | description 的"Prefer X"列表面向宿主路由与用户选型，指向不可调用名称（P2，见 Findings F1） |
| B02 | pass | templates/claude/commands/spec/plan.md（metadata-only，正文由 SKILL.md 投射）；references/plan-sections.md:24-64（字段合同与消费者逐项对上）；references/settled-decisions.md:9-15（推断/已定区分级） | 入口/reference/template/consumer 一致；设计推断标注为推断 |
| B03 | pass | SKILL.md:33-38（planning-only 边界+内嵌指令不构成授权）；references/research.md:13（dispatch 授权模型）；references/plan-handoff.md:82（沉默/取消/超时不授新权）、102-103（review 不继承写权）、112（密钥不打印） | 授权边界完整且不重复索取（output-mode.md:30 自然语言授权等价 confirm:auto） |
| B04 | pass | references/planning-evidence-boundaries.md:20,81（runtime 镜像排除出规划上下文、永不做候选 owner）；src/cli/commands/plans.js:230（诚实披露 "Degraded boundary: HTML plans are not scanned"） | 真相源清楚；降级边界响亮披露而非掩盖 |
| B05 | pass | SKILL.md:68（blocked envelope 含 recovery_path）；references/research.md:3（失败单次纠正+容量排队+不重复未决工作）；references/structure.md:34（独占建路径+后缀重试）；references/plan-handoff.md:22（HTML recompose 上限 2 轮） | 失败/恢复/重试上限/中断恢复覆盖系统化；唯一窄边缘为 F3（P3） |
| B06 | pass | SKILL.md:116-121（最终应答核查清单）；references/plan-handoff.md:67-69（如实报告 review 状态，禁止把自审说成独立审查，degraded 不进 clean 文案分支） | 交付核查与诚实披露义务成文且被合同测试钉住（spec-plan-contracts.test.js:225 completion 契约） |
| X01 | pass | references/structure.md:148-162（Deep 档+分相）；references/plan-sections.md:219-226（~10+ 单元 Unit Index）；planning-evidence-boundaries.md:30（跨仓写 owner 分离）；references/resume.md:11-16（中断经后继计划恢复） | 适用（规划是分解 owner）：渐进细化、依赖排序、恢复路径齐备，且用宿主能力而非自造编排 |
| X02 | pass | references/interface-and-evolution-lens.md:50-57（additive/breaking 分类、零使用证据、兼容窗口）、60-69（Interface Contracts 落地表）；references/final-review.md:111（ADR 晋升候选三条件+不由本 workflow 写） | 适用：接口兼容/版本/迁移/回退由专责 lens 承载，未要求新 schema |
| X03 | pass | references/high-risk-plan-lens.md:23-31（required landing + launch-blocking 风险压低 readiness）、42-52（required-proof reconciliation）；references/plan-sections.md:227-242（VC 双闭合义务+盲区行+`release:validate`） | 适用：风险-验证对账与测试策略在位；实际部署正确地留在授权与执行侧 |
| X04 | pass | references/plan-handoff.md:5（`context_facts_adapter/v1` 带 source_identity/freshness/limitations，跨 4 个 skill 模式一致）；references/resume.md:11-16（历史续跑核验+出处）；references/final-review.md:111（知识晋升候选带失效条件） | 适用：交接 envelope、决策保留（settled-decisions 溯源）、知识消费与失效条件齐备 |

## Findings

**F1（P2 · B01）description 将路由标签 `runtime-maintenance` 混入可调用 skill 名列表**
- 位置：skills/spec-plan/SKILL.md:3；佐证 skills/using-spec-first/references/public-route-map.md:38、`ls skills/`（无该入口，实际为 spec-runtime-setup）。
- 后果：description 是宿主 skill 选择与用户选型的第一 surface。当用户带着「规划修复 .claude/ 镜像漂移」类请求进入时，四个兄弟条目（spec-brainstorm/spec-debug/spec-work/spec-doc-review）都可直接调用，唯独 `runtime-maintenance` 解析不到入口——路由降级为语义猜测。route-map 已明确它是「selected route/handoff label」，但 description 的列表语境没有给出这层限定。
- 最小修复：改为 `spec-runtime-setup for generated runtime mirrors`，或写明 `the runtime-maintenance route (spec-runtime-setup + spec-first init)`。一行改动，无回归面（spec-write-skill/SKILL.md:31 同名引用语境是路由标签，用法正确，不需动）。

**F2（P3 · D05）`Interaction Rule 5(a) in SKILL.md` 悬空引用 ×3**
- 位置：references/synthesis-summary.md:274、326、418；SKILL.md:48-52 的 Interaction Method 无编号规则。
- 后果：三条行为规范的依据指针指向不存在的编号，维护者无法回源核对；疑似旧版编号规则重构后的残留。
- 最小修复：统一改为 "per SKILL.md Interaction Method"，或在 Interaction Method 恢复最小编号。

**F3（P3 · B05/D04 边缘）pipeline 模式续跑 implementation-ready HTML 计划可产生无标记的双 implementation-ready 孪生**
- 位置：references/resume.md:43（.md 平行路径重写、.html 原样保留）；两侧 supersession 规则只在陈旧副本为 requirements-only 时触发（references/intake.md:45；skills/spec-work/references/input-triage.md:48）。
- 后果：该窄路径（disable-model-invocation 上下文显式续跑 .html 实现就绪计划）之后，`docs/plans/` 存在同 basename 的两个 implementation-ready 文件且无任何 supersession 标记；spec-work 空白发现只按新旧隐式消歧，人类读者可能读到陈旧 .html。常见 pipeline 流（requirements-only .html → 强制 md）已被双侧规则完整覆盖，此边缘专指 implementation-ready 源。
- 最小修复：resume.md:43 加一子句——pipeline 重写后在该 .html 可见头部标记 superseded-by `<md 路径>`，或明文记录孪生优先级（md 为 canonical）。

**F4（P3 · D05）「一次一问」默认与 universal-planning「至多 3 问+多选」无豁免声明**
- 位置：SKILL.md:52 vs references/universal-planning.md:99-108（Step 1b）。
- 后果：非软件分支的执行者同时读到两条强度相近的指令，解释空间取决于加载顺序。
- 最小修复：universal-planning Step 1b 加一句「本分支是对默认一次一问规则的有界例外」。

**F5（P3 · B02/D05）双 argument-hint 漂移**
- 位置：skills/spec-plan/SKILL.md:4（含 deepen、`output:html` 的完整 hint）vs templates/claude/commands/spec/plan.md argument-hint（仅 "[requirements doc path or topic]"）。
- 后果：命令面与 skill 面展示的调用形状不同；命令用户不知道可以传计划路径深化或 output:html。
- 最小修复：对齐模板 hint（模板是 metadata-only，改动零行为风险）。

**F6（P3 · D05 维护性）范围确认门的关键段落双份维护且无同步标记**
- 位置：references/intake.md:177-179 与 references/final-review.md:56-58（阻塞判断+headless 跳过两段近乎逐字重复）。
- 后果：安全相关门文本在两处独立演化，无 shared source、无同步脚本、无测试钉住（对照 settled-decisions.md:3 的同步机制），漂移风险真实存在。
- 最小修复：仿 settled-decisions 加 "mirror of …keep in sync" 标记，或提取 shared reference 并入同步脚本。

**保持现状成立的判断（对 core/08 合同基线的对账说明）**：core/08-skill-contract-protocol.md 为 spec-plan 拟议的 YAML 输出合同（tech_stack 具体 config、acceptance_conditions ≥ FR 数、boundary_handling 数量相等）及 Python 自动协议检查**均未实现**——但其 Phase 1 清单自身未勾选，且 REVIEW-EXECUTION-WORKFLOW.md 第 2 节明示「拟议 YAML、数量阈值、自动重试不是默认现行合同」。现行合同以统一计划 R/A/F/AE/U-ID 追溯 + 字节保留 Product Contract + 5.1 origin 重读 + cross-set reconciliation（final-review.md:36）+ eval script judge 服务同一语义目标（防信息丢失/重复），并符合「计数不能代替语义完整性」的项目哲学。记录为合同基线分歧已解释，不计 finding。

## 主责深挖面发现（D01-D05 + D08）

- **D01**：逐条审视最重的几处指导（plan-handoff Issue Creation 四步、goal 工具三能力分查、approach-altitude 双信号门）均锚定可指认的多宿主失败类（惰性加载 connector、Codex 2-3 选项上限等具体细节是经验证据而非泛化最佳实践）；未发现「为不存在的问题设防」的机制。删除任何一条均需对照其 eval case 或消费者测试——受保护面成立。
- **D02**：领域知识密度是同类 skill 中最高的（组合姿态判定、演进分支、高风险触发矩阵、证据信任三级 transcribed/provider-confirmed/source-bound 的区分在 planning 类 skill 里罕见且精确）；职责分工声明（如 high-risk-plan-lens.md:3 "scripts may verify paths...the LLM judges"）不是口号，与实际机制一致。
- **D03**：确定性地板真实存在（合同测试 17 case、eval script judge、CLI plans.js 生命周期审计、独占建路径），prose 门（confidence check、doc review、cross-set reconciliation）全部诚实标注为 workflow-level 约定；唯一提醒——final-review.md:36 将 cross-set reconciliation 标注为 "(mechanical, producer-owned)" 但执行者仍是 LLM，措辞可再精确为「机械程序、由 producer 执行」（不改变实质，不单列 finding）。
- **D04**：双侧核对是本轮最扎实的结论——plan-sections.md 定义的每个下游依赖字段（artifact_readiness/execution/status/U-ID/VC/DoD/`Product Contract unchanged` 短语）都在消费者源码中找到精确消费点，且 superseded-sibling 规则双侧同步。F3 是唯一缝隙。
- **D05**：123 行入口 + 分相加载使规则可定位性良好；实际问题全部是 P3 级指针/副本维护类（F2/F4/F5/F6），无一条规则与其另一条规则正面冲突。
- **D08**：按需加载纪律（point-of-use config、pipeline 预算、wayfinding、worker prompt 正触发加载、summary-first intake）使 3.7k 行语料的实际常驻成本远低于其规模；强制重读 terminal owner 是对抗上下文压缩的有意成本，方向正确。真正的效率残余风险在 F6 的重复文本——它同时是维护成本与轻微的重复加载成本。

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| references/agents/ 16 个中 14 个未全文（仅读 web-researcher.md、repo-research-analyst.md 头部） | 设计上为 dispatch-only worker 种子（research.md:11 明示非 inline 依赖）；调用合同在 research.md/deepening-workflow.md 已全读 | 这 14 个 worker prompt 的内容质量与内部一致性未评估；dispatched 研究质量不在本轮结论内 |
| evals/cases/ 9 个中 8 个未读（读 product-blocker-prevents-readiness.yaml） | 抽样验证 judge 机制已足够支撑结构层结论 | 其余 case 判据质量未逐项核验 |
| evals/fixtures/{repos,scripts,consumer-replay}/** | 生成 eval 输入，静态审查不运行 | fixture 与当前源码匹配度未核验（运行时属 behavior 层） |
| 消费者只做接口级核对：spec-work/references/input-triage.md 仅读相关段、spec-write-tasks / spec-doc-review / spec-lfg SKILL.md 为 grep 级、src/cli/commands/plans.js 仅读 130-230 行 | 消费者清单文件缺失后按声明消费者做字段合同核对，聚焦接口而非内部行为 | 消费者的内部行为质量（非接口）未覆盖；plans.js 其余部分未审 |
| templates/claude/commands/spec/plan.md 之外的宿主投射（.codex/.qoder 等） | 模板为 metadata-only 已验证投射机制 | 其他宿主 hint 措辞差异未逐一核对 |

## 结论一句话

spec-plan 是一条合同纪律严明、按需加载、消费者字段闭环被确定性测试钉住的主链路 Skill：18 项裁决 17 pass + B01 一项 fail（description 指向不可调用的 `runtime-maintenance` 名称，P2，一行可修），另有 5 条 P3 级可审计性/窄边缘缺口（悬空引用、html→md 孪生、单问张力、双 hint、门文本双份维护），无 P0/P1；全部结论限于 structure_contract 层，行为与收益未验证。
