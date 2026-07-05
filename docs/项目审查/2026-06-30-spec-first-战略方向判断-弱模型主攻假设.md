# spec-first 战略方向判断报告:从能力审查到弱模型主攻假设

> 类型:项目审查 / 战略方向判断(decision-support)
> 日期:2026-06-30(§9 思维模型透视、§10 联网复核同日追加)
> 作者:leokuang
> 状态:advisory —— 结论链可信度分级见 §7;验证型拍板项见 §6,待 owner 决策
> 边界:docs-only 判断报告,不是 plan、不是 contract、不改任何 source/runtime 行为

---

## 0. 这份报告在解决什么

一句话:**spec-first 这个项目,接下来到底该往哪使劲?**

本报告是一次多轮探讨的收口。讨论从一个具体小问题(升级流程)出发,逐步撞到并聚焦为一个战略方向判断。报告把分散的发现收敛成单一根因,并明确指出当前唯一卡在 owner 侧的待决问题。

它**不**重新论证细节 finding(那些在过程审查里已详),只固化判断链与结论,供下次直接从"拍板"继续,不必重走全程。

---

## 1. 结论先行(TL;DR)

1. **当前形态不适合在国内大规模推广**,原因是结构性的「双重错配」(§4),且真实采纳证据极薄(§3)。
2. 但 spec-first **不缺精密机制,缺的是"让机制产生可见价值的最后一公里"和"校准方向的真实证据"**(§2)。多维审查全部指向同一失败模式——角色契约 v2.0 自己警告的「能力强但不可见、不可试、不可评估」。
3. 所有看似分散的发现(证据闭环没接线、非原生模型绕过 gate、国内双重错配)收敛到**同一个高价值风险面**:**spec-first 为 Claude 原生工具调用、阻塞式提问和长 workflow 指令遵循设计;但真实/潜在用户(尤其国内)可能在用非原生/弱工具遵循模型,而它最依赖"模型遵循 workflow 与工具边界"的价值在这类场景下打折最狠**(§5)。
4. 因此待决问题应从"直接立为唯一主攻方向"校准为:**要不要把「非原生/弱工具遵循模型也能可靠走完工程闭环」立为下一阶段高优先级验证型战略假设**。P0 证据闭环接线与 P0' 真实用户摩擦数据应先行或并行,不能被该假设挤掉(§6、§10)。

---

## 2. 能力维度:机制就位,但价值未兑现(接线问题)

多个独立维度的只读源码审查,指向同一模式:**项目重金造好的差异化机制,大量停在"造好但没接通、没消费者、没证据证明有用"。**

代表性证据(均有文件级核实):

- **证据闭环未接线**:`src/cli/helpers/honest-closeout.js` 实现了完整的 claim→evidence 校验与防 cherry-pick 聚合(`evaluateValidationClaim` 强制 `passed` 断言反映 run summary 全量聚合,line 213-224),但在 `skills/` 中只出现在 reference 文档与 SKILL 描述里,**缺少明确的执行期 wire-up 证据**。`verification-run-summary` schema 支持 `spec-work`/`spec-debug`/`spec-code-review` 三个 workflow,但 `spec-work-run-artifact.js` 源码注释自认 producer 当前只服务 `spec-work`。
- **claim 类型半空置**:`CLAIM_TYPES` 定义 4 种(`validation`/`impact_surface`/`review`/`knowledge_promotion`),但只有 `validation` 有非平凡评估路径与活跃消费;`knowledge_promotion` 等缺活跃 producer/consumer。
- **复杂度债**:`skills/spec-code-review/SKILL.md` 达 1141 行(约为 `spec-work` 的 2 倍);多个 reference 文件(如 `evaluation-governance.md`)跨 skill 重复多份。

**注意**:此节结论基于 grep + 源码精读,落地前应对具体 wire-up 做精确二次确认(见 §7 可信度分级)。"没接线"指缺少明确执行期调用证据,不等于"代码错误"——机制本身实现质量高。

---

## 3. 采纳维度:真实采纳证据极薄

零成本公开信号(Phase 0,已实测):

- **npm**:last-month 约 2238 次下载、last-week 约 461(`api.npmjs.org`,2026-06-30 实测)。
- **GitHub**:50 stars、7 forks(2026-06-30 23:28 联网复核;原始 49 stars 为早先快照)。
- **关键信号——外部参与度低**:所有 PR(#1–#19)均为维护者本人(sunrain520/leokuang);issues 中**唯一的非维护者 issue 是 #20**(ajiao7240,国产模型相关),且已 CLOSED + "fixed"。

诚实含义:**有早期外部关注,但深度采纳的公开证据薄**。公开信号能回答"有没有人看",回答不了"真实用户卡在哪"——后者需 Phase 1(真接触用户)才能得到,本报告未做。

---

## 4. 市场维度:国内的「双重错配」

**错配 1 — 宿主错配(结构性,最难解)**:spec-first 绑定 Claude Code / Codex,二者在国内官方不可用。国内使用只能走"CLI + 中转 API/代理"的灰色路径,不稳定、有成本、有合规风险。地基本身国内进不来。

**错配 2 — 非原生模型/工具遵循错配(体验层,已有单例实证)**:为绕开错配 1,国内真实用法可能是"Claude Code CLI 壳 + Kimi/GLM/DeepSeek 等模型"。但 spec-first 的精密 workflow/gate 依赖 Claude 原生工具调用、阻塞式提问与长 workflow 指令遵循。**issue #20 即此场景的实证**:Kimi 2.6 未可靠调用 `EnterPlanMode`/`AskUserQuestion`,直接改代码,绕过 `spec-plan` 的"等用户确认"。

**重要校准**:"弱模型"不应泛化为"国产模型整体 coding 能力弱"。联网 benchmark 可见部分国产/中国系模型在代码编辑任务上并不弱(见 §10);本报告真正关心的是**当前宿主壳中的工具调用、阻塞交互、长指令遵循和 workflow boundary 可靠性**。这比泛称"国产模型弱"更准确,也更可验证。

**叠加放大**:国内用户被迫同时承受"宿主不稳定"与"非原生模型工具/边界遵循不稳定"两重痛,而 spec-first 的核心价值恰恰最依赖模型遵循 workflow 去调 CLI 与阻塞工具——这类场景下价值打折最狠。

**反而有利的点**:① spec-first 有强中文 DNA(中文文档/commit/issue + 完整 `lang zh` 双语),不是翻译工具;② #20 证明国内已有真实尝试,需求是真的;③ 国内确有细分买家——重工程质量/可问责的团队(大厂、受监管行业、交付型外包)。

---

## 5. 根因收敛:一切指向同一件事

前述三个维度看似分散,实为同一根因的不同切面:

> **spec-first 为 Claude 原生工具调用、阻塞式提问和长 workflow 指令遵循设计;但它的真实/潜在用户(尤其国内)可能在用非原生/弱工具遵循模型;它最依赖"模型遵循 workflow 与工具边界"的价值,在这类场景下打折最狠。**

串起来的证据:
- **#20**:Kimi 2.6 经 Claude Code CLI 壳未可靠进入 plan/ask-user flow,直接改代码(非原生模型工具/阻塞交互错配的直接单例实证)。
- **能力审查 P1**:弱模型绕过软 gate(`spec-plan-guard` 在非 Claude plan mode 下仅 best-effort 提醒,自身明确声明无硬写保护),Codex 端无等价兜底。
- **国内市场**:宿主官方可用性受限,非原生模型/中转壳可能是现实选择。

**关键转折**:非原生/弱工具遵循模型现实既是障碍,也可能是机会。若 spec-first 把**"非原生模型也能可靠走完工程闭环"**做成可验证能力(用确定性 hook/gate 兜底工具调用与边界遵循,而非靠模型自觉),它对国内/弱模型市场的价值会变得**独特**:

> **"用非原生/国产模型,也能有可问责的工程闭环。"**

这是国内多数 AI coding 工具(偏"更顺的生成")没有的差异化。模型越不擅长工具/边界遵循,"确定性兜底 + 证据闭环"的价值反而越大。但这仍是**验证型战略假设**,不能跳过真实用户摩擦数据。

---

## 6. 待决问题(从主攻拍板校准为验证型假设)

**spec-first 该不该把「非原生/弱工具遵循模型也能可靠走完工程闭环」立为下一阶段高优先级验证型战略假设?**

- **若是** → 不是立即大规模重构,而是先做一个低摩擦 P1 切片验证:复现 #20,选择 Kimi/DeepSeek/GLM 等 2-3 类非原生模型,检查 `spec-plan` 是否能做到"计划写入后必须阻塞确认、无 silent write、失败时 loud fallback";成功后再决定是否升格为主攻方向。
- **若否** → 继续把 Claude/Codex 原生强模型用户作为主路径,但必须诚实声明非原生模型/国产模型场景是 degraded support,不要把国内推广叙事建立在未验证的可靠性上。

**这个判断依赖两个只有一线 owner/真实用户能校准的事实**:

1. 国内开发者排斥的究竟是**流程的重**,还是**宿主/模型的不可得**?
2. 非原生模型失败主要发生在**工具调用/阻塞交互/长 workflow 注意力**,还是普通代码能力不足?

两个事实的优先级直接决定主攻路径,本报告无法替代真实用户接触与复现实验。

---

## 7. 结论可信度分级(诚实边界)

| 结论 | 可信度 | 依据 |
|---|---|---|
| Claude / OpenAI 官方服务在中国大陆可用性受限 | 高 | 官方 supported countries / unsupported countries 文档;中国大陆未在支持列表中,访问受限地区服务存在封禁风险 |
| 非原生模型在 Claude Code 壳中存在工具/阻塞交互可靠性缺口 | 高(单例) | #20 实证 + `spec-plan-guard`/`spec-plan` 源码 gate 性质 |
| 国产模型整体 coding 能力弱 | 低/不应作为结论 | Aider 等 benchmark 显示部分国产/中国系模型代码编辑能力有竞争力;本报告只讨论 workflow/tool-following 可靠性 |
| npm/GitHub 公开采纳信号(数值) | 高(点时刻) | 2026-06-30 联网复核:npm last-month 2238,last-week 461;GitHub 50★/7 forks |
| 证据闭环"缺执行期 wire-up" | 中 | grep + 源码精读;落地前需精确二次确认具体调用路径 |
| "P-friction 等方向被搁置" | 中 | CHANGELOG 归纳;可能有未记录进展 |
| 国内开发文化/细分市场规模/国产宿主标准趋同速度 | 低-中 | 基于训练知识的推断,非一线观察,owner 体感更准 |
| 采纳整体判断 | 受限 | 仅 50★ + 1 个非维护者 issue 的薄数据;更准需 Phase 1 真接触用户 |

---

## 8. 与既有方向的关系(非新增,只是收敛)

- 本报告**不**新增 workflow/CLI/runtime/source-of-truth 表面,是判断沉淀。
- 它与既有审查一致:角色契约 v2.0 一等目标(可采纳性/外部可验证性/表达可信度)、业界调研 README "三个急需增强点"、`docs/06-待办事项` P-friction 优先级。
- 它**修正**了过程中一个候选方向的优先级:多会话并发安全(`docs/brainstorms/2026-06-30-003-multi-session-concurrency-safety-requirements.md`)无真实摩擦证据,应 gated 在采纳证据/P-friction 之后,不应先于本报告的根因优先做。
- 下一步若 owner 拍板"验证非原生/弱工具遵循模型可靠性假设",再进 `spec-plan` 或 `spec-brainstorm` 转成有边界的实验方案;本报告止于方向判断。

---

## 9. 思维模型透视(2026-06-30 追加)

> 方法:以 `docs/11-业界调研/16个思维模型方法论学习记录.md` 的模型为透镜,叠加到本报告 §2-§5 已查实的项目真相上。不逐一复述模型(该文档已有 skill 映射表),只看一件事——**哪些互相独立的模型指向同一结论**。多个独立模型收敛之处,才是高置信提升点;这本身是该文档 §6「组合使用」的用法。

### 9.1 收敛 A:多模型同指「停止新增,开始兑现」(最强信号)

四个互相独立的模型从不同角度指向同一动作:

- **第一性原理**:spec-first 最底层事实是"可验证的工程闭环"。但该价值被**兑现链**门控(用户真跑→模型真遵循→证据真触发),**不是功能数量门控**。
- **帕累托法则**:贡献 80% 价值的 20% 是「证据闭环接线 + 非原生模型可靠性验证」;当前 37 个 source skill / 51 个 agent profile 已足够形成长尾复杂度。
- **边际效用递减**:继续加 skill/agent/contract 边际收益已转负——`spec-code-review/SKILL.md` 已 1141 行(spec-work 约 2 倍);`honest-closeout` 4 个 claim type 中仅 `validation` 走 `verification-run-summary` 聚合强路径,其他 claim type 主要是路径/文件存在性验证。再加=增协调成本而非能力。
- **奥卡姆剃刀**:重复 reference、半空置 claim type、超长 SKILL 应剪。

**收敛结论**:下一阶段主线动作不是"建",是"**接通 + 收敛 + 证明已有的**"。四模型独立佐证,本报告最硬判断。

### 9.2 收敛 B:多模型同指「地图跑赢疆域,无资格排优先级」(最尖锐)

- **地图不是疆域**:项目疯狂产地图(当前 `docs/plans/` 约 222 个文件 + 契约 + 角色契约),疆域(真实使用)极薄。
- **大数定律**:所有采纳判断基于 n≈1(唯一非维护者 issue #20)+ 50 stars,样本不足以支撑任何方向结论。
- **社会认同**:0 外部 PR、1 外部 issue,无真实口碑资产——而角色契约把可采纳性列为一等目标。
- **回归均值**:下载量单日尖峰(548)是噪音,不能据此重估能力。

**收敛结论**:当前最大约束不是"做哪个功能",而是"**没有疆域数据,任何优先级都是地图上猜**"。直接呼应一直未启动的 P-friction。

### 9.3 收敛 C:「公地悲剧」在本轮被亲身验证

- **公地悲剧**:多会话共用工作树、CHANGELOG 顶部抢写、memory 索引共享——本轮工作中反复被冲掉(文档/索引/CHANGELOG 多次),是"只靠自觉不够,必须有机制"的实证。
- **蝴蝶效应**:一个未暂存小编辑丢失→整段工作链丢失。
- **二阶思维警告**:机制不能过度。

**收敛结论**:并发安全是真问题(亲历佐证),但 §8 已判其 gated 在采纳证据后——收敛 B 的疆域数据应先于它。

### 9.4 收敛 D:「创造性破坏 + 能力圈」——别重建即将免费的能力

- **创造性破坏**:宿主原语(subagent、plan mode、hooks、MCP)正商品化,会吃掉 harness 层。
- **能力圈**:spec-first 真实能力圈=证据/验证/source-runtime 纪律;隔离(worktree)、GUI 编排在圈外。

**收敛结论**:价值须上移到宿主不拥有的层(跨宿主证据/知识闭环、standards-native)。防御性持续约束,非单点任务。

### 9.5 模型透视下的提升点优先级(对 §1-§6 的细化,非新主张)

| 优先级 | 提升点 | 模型收敛依据 | 与本报告关系 |
|---|---|---|---|
| **P0** | 证据闭环接线 + 主动减负(剪重复 reference/空置 claim type/超长 SKILL) | 收敛 A(第一性/帕累托/边际递减/奥卡姆) | 兑现 §2 已造未接线的机制 |
| **P0'** | 启动 P-friction + 接触真实用户(#20 报告者、fork/star) | 收敛 B(地图≠疆域/大数定律/社会认同) | 取得 §3 缺失的疆域数据,与 P0 并行 |
| **P1** | 非原生/弱工具遵循模型可靠性验证(兜底 + Codex 补齐 + 诚实硬/软边界) | §5 高价值风险面 + **二阶思维红线** | §6 验证型战略假设的实现;**形态须是"确定性兜底+低摩擦",非"更多强制"**——非原生模型用户已承双重错配,再加 gate 摩擦会致弃用 |
| **P2(gated)** | 并发安全(brainstorm 003)、behavior-delta、新能力 | 收敛 B/C | 全部等 P0' 疆域数据校准 |

### 9.6 临界点判断与第一步

**临界点效应**问:spec-first 处在突破前平台期,还是方向错了?

诚实答案:**大数定律下,n≈1 的数据不足以回答**。故模型链给出的第一步不是任何功能:

> **先取得疆域数据(P-friction + 真实用户接触),否则"非原生模型可靠性是否该升格为主攻""并发安全做不做""临界点还有多远"全部无法判断。** 兑现已造的(P0)可立即并行(纯接线、零新增、高置信);P1 可做低摩擦验证切片,但校准方向的钥匙在疆域,不在又一份地图。

### 9.7 一个反身观察(地图不是疆域,照向本工作流自身)

把"地图不是疆域"转向本轮工作:连续分析/调研/出报告,产出 brainstorm + 战略报告 + 思维模型透视——**三份地图,零疆域接触**。这非批评,是模型提示的项目级系统倾向:**spec-first 及围绕它的工作有强造图偏好,最缺的恰是"真用、真接触用户"的疆域校准**。最严谨的下一步可能不是再产文档,而是去碰一次真实疆域(如:给 #20 报告者的具体问题、P-friction 最小审计设计)。

### 9.8 本节可信度

- "多模型收敛"是分析框架,收敛增强置信,但每个模型应用均带作者判断,非客观真理。
- 与 §7 一致:"证据闭环未接线""P-friction 未启动"为中等置信(grep+CHANGELOG 归纳),落地前需精确二次确认;采纳判断受 n≈1 限制——这恰是收敛 B 的论点而非反驳。

---

## 10. 联网深度审查后的当前校准(2026-06-30)

本节是对 §1-§9 的复核修订依据,不是新 plan。

### 10.1 当前判断

**方向合理,但应降级为"高优先级验证型战略假设",不宜直接拍板为唯一主攻方向。**

更高置信的立即动作仍是:

1. **P0:接通已有证据闭环 + 减负**。这是当前机制存量已经造好、收益最高、外部依赖最少的兑现动作。
2. **P0':启动 P-friction + 接触真实用户**。没有真实摩擦数据,任何战略优先级都会继续停在地图推理。
3. **P1:非原生/弱工具遵循模型可靠性验证切片**。用一个最小、可复现、低摩擦实验判断它能否升格为主攻方向。

### 10.2 联网与本地复核事实

- **npm 公开下载**:2026-06-30 复核 `https://api.npmjs.org/downloads/point/last-month/spec-first` = 2238;`last-week` = 461。与 §3 主体一致。
- **GitHub 公开信号**:2026-06-30 复核 `https://api.github.com/repos/sunrain520/spec-first` = 50 stars、7 forks、0 open issues;PR #1-#19 均为 owner;非维护者 issue 仍只有 #20。
- **#20 具体问题**:issue 标题为"国产模型走spec work flow失效";报告者使用 Kimi 2.6 跑 `spec-plan` 时未完整进入 workflow,直接修改代码,并明确怀疑 `EnterPlanMode`、`AskUserQuestion`、长 SKILL 注意力和工具调用能力差异。
- **官方可用性**:Anthropic / OpenAI supported countries 文档均未把中国大陆列为支持地区;OpenAI unsupported countries 文档说明从不支持地区访问可能导致账号被封或访问受限。故"国内官方可用性受限"判断成立,但具体合规/网络可达性不能由本报告替代法律或商务判断。
- **模型能力反向校准**:Aider leaderboard 等公开 coding benchmark 显示 DeepSeek、Kimi 等模型在代码编辑任务有竞争力。因此本报告不再把"国产模型整体弱"作为前提,只讨论非原生宿主壳中的工具调用、阻塞交互、长 workflow 遵循可靠性。
- **本地源码复核**:`spec-plan-guard` 在非 Claude native Plan Mode 下明确只是 best-effort attention reminder,无 hard write protection;`skills/spec-plan/SKILL.md` 也声明非 Plan Mode 的保护依赖模型合作。
- **本地计数复核**:当前 source skill 为 37 个(`skills/*/SKILL.md`),agent profile 为 51 个(`agents/*.agent.md`),`docs/plans/` 当前约 222 个文件。此前 §9 的 52 agents / 182 plans 属快照漂移,已在本节修正。

### 10.3 建议的最小实验形态

若 owner 接受 §6 的验证型假设,下一步不要先做大方案,而应先定义一个可证伪切片:

- **对象**:`spec-plan` / `spec-plan` 的"计划写入后必须阻塞确认"路径。
- **模型样本**:Kimi 2.6 或后继版本 + DeepSeek/GLM 中至少一个;Claude 原生模型作为对照。
- **成功条件**:每个模型重复 3-5 次,不得 silent write 非计划 source;若阻塞提问工具不可用或未被调用,必须 loud fallback 并停止在用户确认前。
- **摩擦条件**:新增 gate 不得把本来能完成的 Claude/Codex 原生路径显著变慢;非原生模型失败时给出可理解、可恢复的 next action。
- **升格条件**:若 #20 可稳定复现且该切片能显著降低 silent write,再把"非原生模型可靠性"升为主攻方向;否则只作为 degraded-mode 诚实声明与局部 hardening。

### 10.4 最贴近业界做法的落地形态

业界处理同类 Plan/approval boundary 问题的共同方向不是继续加重 prompt,而是把"规划态"和"写入态"做成宿主或工具层可执行边界:

- **Cursor Plan Mode** 的产品语义是先研究、生成计划、等待用户满意后再 build;但社区 bug 报告也说明仅有模式语义不够,agent 仍可能不等批准就开始编辑。
- **Codex** 把风险下沉到 sandbox + approval policy: sandbox 定义技术边界,approval policy 决定什么时候必须停下来问用户。这个形态比"模型记得问"更接近可执行边界。
- **Claude Code hooks** 提供 `PreToolUse` 等 deterministic control,可在 `Write`/`Edit`/`MultiEdit` 前按路径和状态阻断。官方 hooks reference/guide 的价值就在于让动作自动发生,不依赖 LLM 自己选择。
- **OpenCode/Cursor 等同类 issue** 暴露的教训是:全局 allow、模糊 approval、或 plan mode 状态漂移都可能压过"只规划"语义;因此 plan mode 应优先于普通写权限,模糊状态应 fail closed。

映射到 spec-first,最贴近业界且符合角色契约的做法是:

1. **把 `spec-plan` 视为 planning state,不是 prompt 建议**。进入该状态后,默认只允许研究、提问、写/更新计划 artifact。
2. **用写入前 barrier 兜底**。在用户明确 handoff 到 `spec-work` / `spec-work` 前,阻断 `Write`/`Edit`/`MultiEdit` 对非计划 source 的修改;允许范围先收窄到 `docs/plans/**` 及当前 plan artifact,不要一开始泛化到所有 workflow。
3. **复用 native Plan Mode,但不依赖它唯一成立**。Claude native Plan Mode 存在时优先使用;非 native / Codex / 第三方模型场景下,必须显式标注 hard/soft protection 边界。
4. **阻塞确认必须 fail closed**。`AskUserQuestion` / `request_user_input` / `ExitPlanMode` 若失败、返回空答案、状态模糊或工具不可用,合法出口是 loud fallback + 停止等待用户,不是继续实现。
5. **测试要覆盖失败路径**。最小切片的测试重点不是"模型是否听话",而是"未确认前写源码会不会被确定性拦住";模型工具调用可靠性只作为复现实验和 degraded-mode 证据。

参考来源:Claude Code hooks reference/guide(`https://code.claude.com/docs/en/hooks`),OpenAI Codex sandbox/approvals/permissions(`https://developers.openai.com/codex/concepts/sandboxing`,`https://developers.openai.com/codex/agent-approvals-security`,`https://developers.openai.com/codex/permissions`),Cursor Plan Mode 与相关 bug 报告(`https://cursor.com/blog/plan-mode`,`https://forum.cursor.com/t/plan-mode-is-not-respected-by-the-agent/151802`),OpenCode Plan Mode permission bug(`https://github.com/anomalyco/opencode/issues/28130`)。
