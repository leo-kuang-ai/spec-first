# Skill Prompt 优化方法论

> 定位：本文是**方法论基线**，不是 runtime behavior contract。它从两份实战技术方案
> （`docs/plans/2026-07-06-001-refactor-skill-prompt-slimming-plan.md` 与
> `docs/plans/2026-07-06-002-refactor-skill-activation-index-governance-plan.md`）
> 及其多轮 `spec-doc-review` 审查中，抽取出可复用于**任意 skill** 优化的通用思路。
>
> 规范优先级：与 `docs/10-prompt/系统性项目审查方法.md` 平级，冲突时让位于
> `docs/10-prompt/结构化项目角色契约.md`。审计**信号**的 owner 仍是
> `skills/spec-skill-audit/references/skill-authoring-quality.md`——本文是那些信号
> 背后的**优化 playbook**，二者互补：rubric 告诉你「哪里有问题」，本文告诉你「怎么改、
> 怎么验证、什么时候不该改」。

---

## 0. 一句话结论

> Skill prompt 优化不是「把 prompt 改短」，而是**按加载时机与成本重排信息层级、同时保全治理边界、并把不可逆编辑 gate 在证据上**。行数/token 下降是经济性**指标**，永远不是 completion **gate**。

如果一次优化让 skill 更短却丢了边界、或用「行数下降」冒充「质量/token 收益」，那是退步而非优化。

---

## 1. 优化前必须建立的两个心智模型

### 1.1 两轴成本模型：Activation index vs Active body

同一个 skill 有两条**正交**的 token 成本轴，优化手法与收益归属完全不同，**不可混为一谈**：

| | Activation index（L1） | Active body（L2/L3） |
|---|---|---|
| 载体 | frontmatter `description` | `SKILL.md` 正文 + references |
| 成本性质 | **无条件税**：每次对话都付（用于路由发现） | **条件税**：仅该 skill 被触发后才付 |
| 影响 | 对话一开始就占常驻上下文、影响路由命中 | 触发后挤压用户代码/plan/test 上下文 |
| 优化手法 | description 路由器化（trigger + exclude + 定位），压缩把功能说明写进描述的 offender | 渐进披露（body → references）、确定性下沉、删冗余 |
| 归属边界 | 文本归 spec-first；**L0/语义路由/懒加载归宿主** | 全部归 spec-first |

**教训（来自 002 拆分）：** 这两轴触及的 skill 集合、blast radius、验证方式都不同。把它们塞进同一次优化，会让 closeout 无法分开报告收益、失败难以归因。**正交维度应拆成独立计划/独立单元。**

### 1.2 三层正文模型：Body-L1 / L2 / L3

对 Active body 的每一段内容，先分类再决定去留：

- **Body-L1（spine，保留在主文件）：** workflow contract 摘要、热路径 phase skeleton、Reference Trigger Map、**hard boundaries**（mutation / verification / handoff / source-runtime 纪律）、CLI handoff。这是每次触发都必须在场的骨架。
- **Body-L2（条件细节，移入 `references/`）：** 只在特定 phase/mode/条件才需要的详细步骤、mode 矩阵、大型输出模板、dispatch 细节。移动时**必须**配确定性 STOP trigger。
- **Body-L3（删除）：** 背景叙事、通用建议、重复原则、过期实现细节、冗余例子。删除后不得造成 phase 步骤、artifact contract 或 safety boundary 缺失。

**判据：** L1 = 「不在场就会出错」；L2 = 「大多数运行用不到，但需要时必须可达」；L3 = 「删了没有任何行为损失」。分不清 L1/L2 时，默认保留在 spine（宁可重也不可丢边界）。

---

## 2. 九条可迁移原则

### 原则 1 — 边界保全优先于体量下降
`SKILL.md` 里的 hard boundary（source/runtime、mutation、verification、handoff、review gate）是**承重墙**，只能移动位置（进 reference 且有 STOP trigger），**不能删除、不能只藏进 reference 而在 spine 无触发**。行数预算（如 <500 行、<200 行）是 advisory budget，不是 hard gate；真正的 completion gate 是边界保留 + 行为无回归 + 可验证证据。

### 原则 2 — STOP trigger 是承重契约文本，不是普通指针
渐进披露的失败点是 **trigger failure**（模型不知道何时该读 reference），而不是 reference 数量。因此每一次 extraction 必须四件套齐全：

- `trigger_condition`：具体到可测试的触发时机（`STOP. Before X, read references/Y.md`）。
- `must_read`：这是强指令而非「if applicable」软措辞。
- `fallback_if_unread`：未读时的安全降级。
- `eval_case`：至少一个触发场景 + 一个不触发场景。

**关键区分：** 静态测试只能证明「STOP 语句存在于 spine」；「模型是否真的按触发读取」属行为保证，依赖 fresh-source eval。别把结构断言当行为保证。

### 原则 3 — 确定性下沉：消费脚本输出，而不是用 prose 复述脚本
如果 prompt 里用自然语言重新叙述一段**脚本已确定性执行**的逻辑（hash 比对、结构校验、路径格式），这是把脚本职责写回了 prompt。正确做法是**消费脚本输出**：

- 让 prompt 运行 `spec-first <cmd> --json`，只在 `deterministic_handoff: true` 时进入语义判断；失败按 `reason_code` 停止并交还 handoff envelope。
- 脚本强制确定性不变量、准备事实；LLM 判断这层地板**之上**的语义充分性。
- **红线：** 不让脚本裁决语义（task 质量、review finding 成立性）；不让 prompt 伪造确定性（假装跑过校验）。

这条同时省 token **并**兑现角色契约的 “scripts enforce invariants; LLM decides semantic adequacy above that floor”。

### 原则 4 — 收益可信度分级：confirmed / contingent / hypothesis
优化收益必须按证据强度分级，**不得越级报告**：

| 级别 | 例子 | 报告方式 |
|---|---|---|
| confirmed | `wc -l` 行数下降、结构 delta | 直接作为经济性指标 |
| contingent | activation-token 节省（取决于宿主是否惰性加载 references） | 标 `contingent-on-loader-behavior`，**按宿主分别记录**，注明验证路径 |
| hypothesis | not-run 率下降、review 质量提升 | 标为待验证，给出采集路径，**不计入本轮验收** |

**反模式：** 把 line-count delta 当 token 收益报告；把 contingent 收益写成 confirmed；用一个单一数字掩盖 per-host 差异。

### 原则 5 — 宿主 primitive 不重建
skill discovery、L0/域索引、语义向量路由、懒加载策略、skill 联邦——都是**宿主拥有**的 primitive，正在商品化。spec-first 只拥有 description 文本、body、references 和 runtime 投射。优化时**明确拒绝**自建这些能力（重建即反模式）。价值应上移到宿主不拥有的层：跨宿主证据/验证闭环、source/runtime 同源纪律、治理外显。

### 原则 6 — Gate 出口，不 gate 思考
把**不可逆动作**绑定到证据，**可逆动作**放行：

- 不可逆（删除/迁移 spine 承重文本、mutation、声明完成）→ 必须有 confirmed evidence（如 fresh-source eval / read-only 复核）。未跑证据时**降级为可逆动作**（只新增 reference + STOP trigger，原文保留），而不是放行。
- 可逆（新增 reference、加 trigger map）→ 自由进行。

缺 runtime 强制能力时，verification/handoff gate 降级为**响亮约定**：显式声明「未强制及原因」，不静默放行、不伪造已强制。

### 原则 7 — 证据先行，警惕「自我封闭」计划
优化前区分**已证实的前提**与**待验证的前提**：

- 维护性前提（1200+ 行单体、跨 skill 逐字重复、超出建议上限）通常 `wc -l` 可复核 → confirmed。
- 用户影响前提（膨胀→挤压 context→漏读→not-run 升高）常是推测因果链 → hypothesis。

**「自我封闭」反模式：** 一个计划把成功判据收窄到「无回归」、又把唯一能证伪其价值的测量层 defer 掉——它无法证明自己值得做。破解手法：用**已存在的证据**建一次性只读 before baseline（零改动），并给 deferred 的验证一个 **committed trigger**（明确「什么条件下从 aspirational 变 confirmed」），避免「机制就位≠使命兑现」。

### 原则 8 — 只读探针前置，让下游单元真正兑现收益
当某个收益依赖一个**尚未查明的事实**（如「宿主是否 eager-inline `@./references`」），把查明该事实的**只读探针前置**，而不是把收益全部 gate 到流程末尾的验证单元。探针 read-only、可与其它单元并行、零 mutation 风险；它产出的 per-host 事实让下游 extraction 单元在**首轮**就做出正确、可兑现收益的转换。

### 原则 9 — Source/runtime 同源纪律
永远改 source（`skills/`、`references/`），**不手改** generated runtime mirrors（`.claude/`、`.codex/`、`.agents/skills/` 等）。需要刷新 runtime 用 `spec-first init`。移动 references 时，路径写法必须是 runtime path-rewrite transform 能处理的形式；投射验证只通过 source 生成结果观察，不靠手改 mirror 制造通过。

---

## 3. 可复用作业流程（Playbook）

对任意待优化 skill，按此序执行。每步都可因证据不足而**诚实降级**，但不得跳过或伪造。

### Step 0 — 建立 baseline（区分两轴）
- **Body baseline：** `SKILL.md` 行数、主 prompt references 清单、每个 reference 的 STOP trigger。
- **Index baseline：** frontmatter `description` 的字符/词/估算 token、是否已有 exclude intent、与相邻 workflow 的重叠词。
- 若某 skill 有相邻误触发风险，记录相邻 workflow 的 expected/excluded route 意图。
- baseline 无法完整建立时记 `baseline_degraded:<reason>`，不阻断，但 closeout 必须暴露。

### Step 1 — 内容分类（L1/L2/L3 + index/body）
逐段打标签：Body-L1 保留 / Body-L2 待迁移 / Body-L3 待删除 / Activation-L1 索引。分不清时默认 L1。

### Step 2 — 识别确定性下沉候选（原则 3）
找出 prompt 中「用 prose 复述脚本已确定性执行的逻辑」的段落，标记为 CLI-handoff 候选。确认目标脚本已输出 executor 真正需要的字段，否则不新增 CLI。

### Step 3 — 前置只读探针（原则 8，按需）
若收益依赖未查明的宿主/runtime 事实（loader 行为、投射 surface），先做只读探针产出 per-host 事实表，供 Step 4 决策。

### Step 4 — 执行重排
- Body-L2 → `references/`，每个都配 STOP trigger 四件套（原则 2）。
- Body-L3 → 删除（确认无边界损失）。
- 确定性下沉候选 → 改为消费 CLI 输出 + `reason_code`。
- **不可逆删除/迁移 spine 承重文本前，先满足原则 6 的证据 gate**；证据不足则只做可逆新增。

### Step 5 — 验证（两类形状 + 行为）
- **静态测试：** source prompt shape（trigger map 存在、每个 moved reference 被命名、无 stale eager include、无手改 mirror 指令）+ runtime projection/path rewrite。脚本只证结构与覆盖。
- **行为验证：** fresh-source eval 或等价 read-only 复核，覆盖 source/runtime boundary、mutation gate、verification/handoff、trigger precision。未跑记 `fresh_source_eval_not_run:<reason>`，且此时不得删 spine 承重文本。
- **runtime 投射：** 只经 `spec-first init` 生成结果观察，不手改 mirror。

### Step 6 — 诚实 closeout（outcome bundle）
必须报告：exact line-count delta（confirmed）· **按宿主**的 context-room delta（contingent）· trigger/eval/static-test 结果 · fresh-source/runtime smoke 结果或 degraded reason · created references 清单 + 有意保留的 load-bearing text · before baseline 引用 · **明确成功判据**（边界保留 + 无回归 + delta 记录）· deferred 验证项及其 committed trigger · not-run/failed/degraded 的全部 reason_code。

---

## 4. Pilot 与 rollout 纪律

- **先 pilot 两个代表性 skill**（一个高频执行型 + 一个最重/reference-heavy 型），跑通可复用的 test pattern，再考虑 wave rollout。
- **wave-2 是 outcome-gated：** 只有 pilot closeout 产出可信 outcome bundle 后才创建推广计划；证据不足以 `wave2_blocked_pending_pilot_evidence` 收尾。
- **拆分要拆干净（避免"拆了一半"）：** 正交维度拆到独立计划时，检查是否共享同一批 source 文件的写入权（同一 rubric 文件、同一 eval glob）。若共享，必须显式约定**文件归属 + 落地顺序 + 命名隔离**（如 `examples*.json` vs `route-collision-*.json`），否则并行会互相覆盖。

---

## 5. 反模式清单（Anti-patterns）

- ❌ 一次性机械压缩所有 skill：churn 最大化、regression 难归因。
- ❌ 自动 LLM prompt compression：省 token 但不能证明 boundary preservation。
- ❌ 为「优化」新增 schema/contract：优先扩展现有 owner（audit rubric、workflow spine、CLI validator）。
- ❌ 把行数/token 预算当 hard gate，为凑预算删除 load-bearing text。
- ❌ 把 hard boundary 删除或只藏进 reference 而 spine 无 STOP trigger。
- ❌ 把 line-count delta 冒充 token 收益；把 contingent 收益写成 confirmed。
- ❌ 混淆 index 与 body 两轴的收益。
- ❌ 自建宿主级 L0 域索引/语义路由/skill 联邦。
- ❌ 只凭「reference 文件存在」判断成功（真正失败点是 trigger failure）。
- ❌ 自我封闭 pilot：把唯一能证伪价值的测量层 defer 掉且无 committed trigger。
- ❌ 手改 generated runtime mirror 作为修复或验证手段。
- ❌ 为凑 description 长度砍掉边界相邻 workflow 的 exclude intent（误触发比漏触发更伤）。

---

## 6. 阻断条件（Blocking conditions）

出现以下任一即不可验收，必须修复或显式降级说明：

- 缺 baseline 且未记 degraded reason。
- reference 没有主 spine STOP trigger。
- Body-L1 hard boundary 被删除或只藏入 reference。
- Jest/脚本试图裁决自然语言语义（路由、任务质量、finding 成立性）。
- 迁移/删除 spine 承重文本却缺 fresh-source eval（未跑时只允许可逆新增）。
- 手改 generated runtime mirror 作为修复/验证。
- fresh-source/read-only eval 未执行且 closeout 未记 reason_code。

---

## 7. 指标 vs Gate（关键区分）

| 类别 | 项 | 用途 |
|---|---|---|
| 经济性指标（advisory） | line-count delta、context-room delta、description token delta | 记录、观察趋势；**永不**单独作为 completion gate |
| Completion gate（硬） | 边界保留、STOP trigger 覆盖、deterministic floor handoff、focused tests 通过、fresh-source/runtime 验证、honest closeout | 不通过即不可 close |

一句话：**用指标证明「更省」，用 gate 证明「没坏」；只有 gate 决定能否收工。**

---

## 8. 与现有治理的对齐

- **审计信号 owner：** `skills/spec-skill-audit/references/skill-authoring-quality.md`。其 P1（trigger 误触发、entry/body 不符、越界 ownership、无 completion criterion、source/runtime 误导）与 P2（长 examples/rubric 未下沉、重复真相源、reference 无指针、缺 eval、tier 模糊）信号，正是本方法论要优化的对象。**审计发现问题 → 本 playbook 指导修复。**
- **审查方法：** `docs/10-prompt/系统性项目审查方法.md`（系统性审查），本文是其在 skill-prompt 维度的专项优化补充。
- **价值基线：** `docs/10-prompt/结构化项目角色契约.md`（Light contract + Explicit boundaries + Deterministic floor + LLM semantic judgment）。本文所有原则都是该契约在 skill-prompt 优化场景的具体化；冲突时以契约为准。
- **参考实现：** `skills/spec-plan` 是当前最佳的 spine + STOP-triggered references 本地范例（其 `spec-plan-contracts.test.js` 断言 runtime 投射与 drift）。注意：spec-plan 用的是**分散内联 STOP 触发**；集中式 `Reference Trigger Map` 是**新增结构**，需自带 contract test，不能声称是现成模式的直接复用。

---

## 9. 外部依据（advisory）

方向与业界公开最佳实践一致，仅作 advisory，不替代仓库 source/test/边界为准：

- 三级渐进披露（L1 metadata / L2 body / L3 resources）是 Anthropic Agent Skills 的基础架构，未激活 skill 时可带来显著 token 节省；`SKILL.md` 正文建议控制在数百行内、只放每次调用都需要的内容。
- 「description 用于发现、正文用于流程」；一个 skill 只做一件事、紧扉界定范围；引用文件只下沉一层；用 eval 对照 baseline 迭代而非主观判断「读起来更好」；单体化是最常见失败。

（本章为改写摘要，用于佐证方向；实现真相源仍以仓库 source、tests 和 source/runtime 边界为准。内容已按许可要求改写。）

---

## 10. 速查（TL;DR checklist）

优化任意 skill 时逐项过：

- [ ] 建 baseline（body 行数/references/triggers；index description token/exclude）
- [ ] 内容分类 L1（留）/ L2（迁 reference + STOP）/ L3（删）；index/body 分开
- [ ] 识别 prose 复述脚本的段落 → 改消费 CLI `--json` + reason_code
- [ ] 收益依赖未知事实 → 先做只读探针（per-host）
- [ ] 每个 moved reference 有 trigger_condition/must_read/fallback_if_unread/eval_case
- [ ] hard boundary 全部保留在 spine（或有 STOP trigger 的 reference）
- [ ] 不可逆删除前有 fresh-source eval；否则只做可逆新增
- [ ] 静态测试（prompt shape + runtime projection）+ 行为 eval 都覆盖
- [ ] 收益按 confirmed/contingent/hypothesis 分级、按宿主报告
- [ ] closeout 诚实：delta + degraded reason_code + deferred 项的 committed trigger
- [ ] 未自建宿主 primitive；未手改 generated mirror；已同步 CHANGELOG

---

# 第二部分 · 设计方法论：从零写好一个 skill

> 前十节讲「怎么改好一个既有 skill」（优化/精简）；本部分讲「怎么从零设计一个好 skill」。
> 二者互补：**设计决定上限，优化只是把设计欠的债还回来**。一个 evaluation-driven、
> 单一职责、信息架构清晰的 skill 从一开始就不需要大规模瘦身。
>
> 本部分融合 Anthropic 官方 Agent Skills authoring best practices
> （[platform.claude.com/docs/.../agent-skills/best-practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)）
> 与 spec-first 的治理叠加层。官方内容为改写摘要（已按许可要求改写），实现真相源仍以仓库
> source/tests/边界为准。

## 11. Evaluation-driven：先写 eval，再写正文

官方最强的一条设计纪律：**在写大量文档之前先建 eval**，确保 skill 解决真实问题而非想象中的需求。落地顺序：

1. **识别 gap：** 让模型在**没有该 skill** 的情况下跑几个代表性任务，记录具体失败与缺失的上下文。
2. **建 3 个评测场景：** 针对这些 gap 写 eval（query + 输入文件 + expected_behavior 列表）。
3. **测 baseline：** 记录无 skill 时的表现。
4. **写最小正文：** 只写足以补齐 gap、通过 eval 的内容——不多写。
5. **迭代：** 跑 eval、对照 baseline、精修。

对 spec-first 的意义：这与本文 §5 的 **fresh-source eval** 同源——eval 是 skill 有效性的**真相源**。设计期就把 eval fixtures（`skills/<skill>/evals/*.json`）建起来，后续优化才有对照，避免「读起来更好」式主观判断。

## 12. 单一职责 + 紧扉边界（trigger / non-trigger）

- **一个 skill 只做一件事**，范围收窄；宁可拆成可串联的小 skill，也不做万能大 skill。单体化是最常见的失败模式。
- 设计期就想清 **should-trigger** 与 **should-not-trigger** 两组意图。对 spec-first，相邻 workflow（`spec-plan`/`spec-work`/`spec-code-review`/`spec-doc-review`/`spec-compound`）边界紧邻，**exclude intent 是必付的 token**——误触发比漏触发更伤（见 §2 原则、002 计划）。

## 13. Frontmatter 设计：name 与 description

frontmatter 是**唯一常驻**的部分（Activation-L1），每次对话都注入，是路由发现的全部依据。官方硬约束 + spec-first 叠加：

| 字段 | 官方约束 | 写法要点 |
|---|---|---|
| `name` | ≤64 字符，仅小写字母/数字/连字符，禁 `anthropic`/`claude` 保留字，禁 XML | 建议**动名词**（`processing-pdfs`）；spec-first workflow 入口统一 `spec-*`；避免 `helper`/`utils`/`tools` 等空词 |
| `description` | ≤1024 字符，非空，禁 XML，**第三人称** | 必含 **what（能力）+ when（触发时机）+ 具体触发词**；第三人称（description 被注入 system prompt，「I can…」「You can…」会破坏发现） |

**spec-first 叠加：description 是路由器，不是说明书。** 收敛为「trigger + exclude + 一句定位」三段各自最短，把功能说明/案例留给正文。不要为凑长度砍掉相邻 workflow 的 exclude intent。（详见 002 计划的 Activation-L1 治理。）

## 14. 自由度设计（Degrees of freedom）

按任务的**脆弱性与可变性**匹配指令的具体程度——官方的「机器人走路」类比：

| 自由度 | 何时用 | 形式 | spec-first 映射 |
|---|---|---|---|
| 高（宽阔原野，多条路都通） | 多种解法有效、依赖上下文判断 | 文字化启发式步骤 | LLM-owned 语义判断（review 判断、任务拆分） |
| 中（有偏好路径） | 有推荐 pattern、允许变体 | 带参数的伪代码/脚本模板 | 模板 + 可调参数 |
| 低（悬崖窄桥，只有一条安全路） | 操作脆弱、必须一致、必须按序 | 精确脚本，禁止改命令/加 flag | **确定性下沉**：消费 `spec-first … --json` 的 handoff，不许 prose 重写（§2 原则 3） |

设计要点：**把确定性操作交给低自由度脚本，把语义判断留给高自由度文字**——这正是角色契约「scripts enforce invariants; LLM decides above the floor」的设计期体现。

## 15. 正文信息架构（Progressive disclosure by design）

官方把 `SKILL.md` 视为「目录页（table of contents）」，指向按需加载的详情。设计期就按此搭骨架：

- **正文控制在 <500 行**（官方建议上限，advisory）；接近上限就拆分。这天然对应本文 Body-L1 spine。
- **references 只下沉一层**（one-level-deep）：所有 reference 从 `SKILL.md` 直链。深层嵌套会导致模型 `head -100` 式部分读取、信息不全。
- **>100 行的 reference 文件加目录（TOC）**，保证部分预览时也能看到全貌。
- **按 domain 组织** references（`reference/finance.md`、`reference/sales.md`），让某类任务只加载相关部分。
- **conditional details**：基础内容留正文，高级/条件内容链接外置（对应 Body-L2 + STOP trigger）。

spec-first 叠加：references 是 source-owned，随 `spec-first init` 投射到 runtime mirror；路径用正斜杠、写成 path-rewrite transform 能处理的形式（§2 原则 9）。

## 16. Workflow、feedback loop 与 checklist 模式

- **复杂任务拆成清晰有序的步骤**；对特别复杂的流程，提供一份模型可复制进回复、逐项打勾的 **checklist**，防止跳过关键校验。
- **feedback loop 模式**：`跑校验 → 修错 → 重跑`，直到通过才继续。校验器可以是脚本，也可以是一份 reference（模型对照它自检）。这显著提升输出质量，且与 spec-first 的 verification gate 同构。

## 17. 三个高频正文模式

- **Template 模式：** 给输出格式模板，严格度按需——严格场景用 `ALWAYS use this exact template`，灵活场景给「合理默认 + 可自行调整」。
- **Examples 模式：** 当输出质量依赖示例时，给 **输入/输出对**（如 commit message 的 input→output），比纯描述更能传达风格与颗粒度。
- **Conditional workflow 模式：** 用决策点分流（`创建新内容 → 走 A；编辑既有 → 走 B`）；分支很大时把每支推到独立文件、让模型按任务读对应文件。

## 18. 内容卫生（Concise by design）

官方核心信条：**上下文窗口是公共品，默认模型已经很聪明**。设计每一段都要自问「模型真的不知道这个吗？这段值它占的 token 吗？」

- 只加模型**没有**的上下文，不解释常识（如「PDF 是什么」）。
- **术语一致**：一个概念一个词（始终「API endpoint」，不混用 URL/route/path）。
- **不写时效性信息**：不写「2025 年 8 月前用旧 API」；用可折叠的「Old patterns / deprecated」小节承载历史，不污染主线。
- **不堆选项**：不要罗列一堆并列方案；给一个默认 + 一个逃生出口（「扫描件 OCR 时改用 X」）。

## 19. 脚本设计（Advanced：带可执行代码的 skill）

若 skill 含脚本，官方四条设计纪律，与 spec-first deterministic floor 高度一致：

- **Solve, don't punt：** 脚本自己处理错误条件（文件不存在则创建默认、无权限则给替代），而不是抛错让模型现场猜。
- **无 voodoo constants：** 每个配置值都自解释（`REQUEST_TIMEOUT = 30 # 慢连接留余量`），不写来历不明的魔数（Ousterhout's law：你都不知道为什么是 47，模型怎么知道）。
- **优先提供 utility 脚本：** 确定性操作写成脚本供**执行**（省 token、更可靠、更一致），而不是让模型每次生成代码。明确标注是「执行」还是「作为参考阅读」。
- **plan-validate-execute（可验证中间产物）：** 高风险/批量/破坏性操作先产结构化 plan 文件 → 脚本校验 → 再执行 → 验证。错误早发现、可回滚、可机器验证——这正是 spec-first 的 task-pack `--json` handoff 与 review gate 的设计原型。

## 20. 迭代与观察（Author / User 双实例）

官方最有效的开发法是**让模型参与设计**：

- **Claude A（作者）** 帮你写/精修 skill；**Claude B（全新实例，加载该 skill）** 在真实任务中使用；观察 B 的行为，把发现带回 A。
- **观察四个信号**（对应本文 fresh-source eval 关注点）：意外的探索路径（结构不直觉）、错过的链接（指针不够显眼）、过度依赖某文件（该内容也许该进正文）、从不访问某文件（多余或信号太弱）。
- **跨模型测试**：与所有目标模型（Haiku/Sonnet/Opus）都测——对 Opus 刚好的，可能对 Haiku 不够。

spec-first 叠加：观察必须用 **fresh-source eval**（把当前磁盘 source 注入全新实例），不要依赖同会话已缓存的 skill 定义（见 `AGENTS.md` 的 agent/skill 变更验证纪律）。

## 21. spec-first 设计叠加层（超出通用最佳实践的部分）

通用最佳实践之外，spec-first 的 skill 设计还必须满足：

- **治理边界是承重墙：** source/runtime、mutation、verification、handoff、review-gate 纪律从设计期就要作为 Body-L1 固定项，而非事后补。
- **Source/runtime 同源：** 只设计 source（`skills/`）；runtime mirror 由 `spec-first init` 生成，绝不手写；reference 路径用 transform 可处理的形式。
- **宿主 primitive 不重建：** 设计发现/路由时，只拥有 description + 投射，不自建 L0 域索引/语义路由/skill 联邦。
- **两轴成本自觉：** 设计 description（Activation-L1 常驻税）与正文（Active body 条件税）时分开权衡，不把说明书塞进 description。
- **收益/证据分级：** 设计 eval 与 closeout 时，区分 confirmed / contingent / hypothesis，不越级声明。
- **入口治理：** 公开 workflow 用 `spec-*` 同名入口；internal helper 不暴露成用户入口（如 `git-worktree`）。

## 22. 设计 checklist（合并官方 + spec-first）

新写或大改一个 skill 前逐项过：

**发现与边界**
- [ ] name 用动名词、≤64 字符、无保留字；公开 workflow 用 `spec-*`
- [ ] description 第三人称、≤1024 字符、含 what+when+触发词
- [ ] description 含相邻 workflow 的 exclude intent（trigger + exclude + 定位）
- [ ] 单一职责，should-trigger / should-not-trigger 两组意图清晰

**信息架构**
- [ ] 正文 <500 行；`SKILL.md` 是目录页而非全量正文
- [ ] references 一层深、从 `SKILL.md` 直链；>100 行 reference 带 TOC
- [ ] Body-L1 spine（含治理 hard boundary）留正文；Body-L2 带 STOP trigger 外置；无 Body-L3 冗余
- [ ] 自由度与任务脆弱性匹配（确定性操作→低自由度脚本/CLI handoff）

**内容质量**
- [ ] 只写模型不知道的；术语一致；无时效性信息（历史进 old-patterns 折叠）
- [ ] 不堆选项，给默认 + 逃生出口；示例是具体 input/output 对
- [ ] 复杂流程有有序步骤 + 可复制 checklist；质量关键处有 feedback loop

**脚本（如有）**
- [ ] solve don't punt；无 voodoo constants；utility 脚本标明执行/参考
- [ ] 高风险操作用 plan-validate-execute + 可验证中间产物；正斜杠路径

**验证与治理**
- [ ] 先建 ≥3 个 eval（evaluation-driven），有 baseline
- [ ] 跨目标模型测试；用 fresh-source eval 观察 Author/User 双实例行为
- [ ] 治理边界、source/runtime、宿主 primitive、两轴成本、收益分级均已满足
- [ ] 未手改 generated mirror；已同步 CHANGELOG
