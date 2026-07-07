# Skill Prompt 设计与优化方法论

> **定位：** 本文是**方法论基线**，不是 runtime behavior contract，也**不是 runtime-injected
> skill**——它是 human/agent **按需查阅**的参考文档。因此它引用的 `<500 行 / reference
> 一层深 / 渐进披露` 等预算，对本文自身只是**自律参考**，不作硬约束（本文用分层重复换可查性，
> 是有意的取舍，见 §7 边际效用递减）。
>
> 它从两份实战技术方案（body 瘦身计划 001 与 Activation-L1 索引治理计划 002，见文末
> 术语锚点）及其多轮 `spec-doc-review` 审查中抽取通用思路，融合 Anthropic 官方 Agent
> Skills authoring best practices 与 16 思维模型透镜，覆盖**三件事**：
>
> - **第一部分（§0–§10）· 优化/精简：** 怎么改好一个既有 skill。
> - **第二部分（§11–§22）· 设计：** 怎么从零写好一个 skill。
> - **第三部分（§23–§26）· 决策模型透镜：** 用精选思维模型锐化设计与优化决策。
> - **§27 端到端样板：** 把上面的方法走一遍长什么样（照做参考）。
>
> **阅读导引：** 新写 skill → 先读第二部分（§11 起）再回第一部分核对边界；精简既有 skill
> → 读第一部分；想看「照着做一遍」→ 直接跳 §27；需要更锋利的决策直觉 → 查第三部分。
>
> **适用范围（通用核心 vs spec-first 适配层）：** 通用核心可跨项目复用——两轴成本、四类正文模型、STOP trigger 四件套、收益分级、gate-vs-指标，以及第三部分决策模型透镜。但本文的 Playbook、reason_code、`spec-first init` / source-runtime 同源 / host-primitive 等**默认耦合 spec-first**，属**适配层**。跨项目套用时替换适配层、保留通用核心即可。
>
> **规范优先级：** 与 `docs/10-prompt/系统性项目审查方法.md` 平级，冲突时让位于
> `docs/10-prompt/结构化项目角色契约.md`。审计**信号**的 owner 仍是
> `skills/spec-skill-audit/references/skill-authoring-quality.md`——本文是那些信号
> 背后的**设计与优化 playbook**：rubric 告诉你「哪里有问题」，本文告诉你「怎么设计、
> 怎么改、怎么验证、什么时候不该改」。

---

## 术语锚点（先读，避免会错意）

本文用到的专有词与本项目实战编号，先在此一次性定义；正文出现即指此处，不再重复解释。

| 术语 | 含义 |
|---|---|
| **两轴成本** | 一个 skill 的两条正交 token 成本轴：Activation index（frontmatter description，常驻税）与 Active body（正文，条件税）。见 §1.1。 |
| **四类正文模型** | L1 contract/gate（保留）、L1 behavioral anchor（压短不删）、L2（移 reference）、L3（删）。见 §1.2。 |
| **behavioral anchor** | 抽象但会改变 agent 行为走向的原则/反模式短句（reproduce-first、scope adherence 等）；非 gate，但删除会增加走错路径概率，只能压短不能当叙事删。 |
| **Evidence Matrix** | Scenario × Skill × Evidence 轻量表，改文件前承载候选项与 `implementation_permission`（blocked/candidate/ready）。见 §3 Step 0。planning 表，非 schema。 |
| **eval adequacy L0–L4** | eval 充分性梯度：L0 无 / L1 结构 / L2 语义抽样 / L3 前后对照 / L4 生产证据；按最高可证明等级声明收益。见 §3 Step 5。 |
| **STOP trigger 四件套** | 每次把内容移进 reference 必配的四要素：`trigger_condition` / `must_read` / `fallback_if_unread` / `eval_case`。见 §2 原则 2。 |
| **fresh-source eval** | 把**当前磁盘上的** skill 源文件注入一个全新实例来评估行为，不依赖当前会话缓存的定义。行为等价的真相源。 |
| **deterministic floor / CLI handoff** | 确定性校验交给脚本，prompt 消费其 `--json` 输出（`deterministic_handoff` / `reason_code`），不用 prose 复述规则。见 §2 原则 3。 |
| **loader 探针** | 只读查明「某宿主是否 eager-inline `@./references`」的前置调查，决定哪些下沉真省 token。见 §8。 |
| **premise baseline** | 优化前用**已有** run evidence 建的一次性只读 before 快照，用于破解「无法自证价值」。见 §7。 |
| **计划 001 / 002** | 本方法论的实战来源：001 = body 瘦身 pilot（`docs/plans/2026-07-06-001-refactor-skill-prompt-slimming-plan.md`）；002 = 从 001 拆出的 Activation-L1 索引治理（`docs/plans/2026-07-06-002-refactor-skill-activation-index-governance-plan.md`）。文中引用它们只作**实例佐证**，不是读者必须先读的前置。 |
| **`spec-first init`** | 从 source 重新生成 host runtime mirror（`.claude/` `.codex/` `.agents/skills/` 等）的命令；runtime 只能这样刷新，不能手改。 |

---

## 0. 一句话结论

> Skill prompt 优化不是「把 prompt 改短」，而是**按加载时机与成本重排信息层级、同时保全治理边界、并把不可逆编辑 gate 在证据上**。行数/token 下降是经济性**指标**，永远不是 completion **gate**。

如果一次优化让 skill 更短却丢了边界、或用「行数下降」冒充「质量/token 收益」，那是退步而非优化。

---

## 1. 优化前必须建立的两个心智模型

### 1.1 两轴成本模型：Activation index vs Active body

同一个 skill 有两条**正交**的 token 成本轴，优化手法与收益归属完全不同，**不可混为一谈**：

| | Activation index（description 轴） | Active body（正文轴） |
|---|---|---|
| 载体 | frontmatter `description` | `SKILL.md` 正文 + references |
| 成本性质 | **无条件税**：每次对话都付（用于路由发现） | **条件税**：仅该 skill 被触发后才付 |
| 影响 | 对话一开始就占常驻上下文、影响路由命中 | 触发后挤压用户代码/plan/test 上下文 |
| 优化手法 | description 路由器化（trigger + exclude + 定位），压缩把功能说明写进描述的 offender | 渐进披露（body → references）、确定性下沉、删冗余 |
| 归属边界 | 文本归 spec-first；**L0/语义路由/懒加载归宿主** | 全部归 spec-first |

**教训：** 这两轴触及的 skill 集合、blast radius、验证方式都不同。把它们塞进同一次优化，会让 closeout 无法分开报告收益、失败难以归因。**正交维度应拆成独立计划/独立单元。**（这正是计划 001 把索引维度拆到 002 的原因。）

### 1.2 四类正文判断模型：Body-L1 contract/gate / behavioral anchor / L2 / L3

对 Active body 的每一段内容，先分类再决定去留：

- **Body-L1 contract/gate（spine，保留在主文件）：** workflow contract 摘要、热路径 phase skeleton、Reference Trigger Map、**hard boundaries**（mutation / verification / handoff / source-runtime 纪律）、CLI handoff。这是每次触发都必须在场的骨架。
- **Body-L1 behavioral anchor（压短但不删除）：** 看似抽象、但会改变 agent 行为走向的原则句或反模式提醒，例如 reproduce-first、scope adherence、evidence-first、protected code preservation。它不一定是 gate，但删除后会增加跳过证据、扩大 scope、过早执行或伪造验证的概率。
- **Body-L2（条件细节，移入 `references/`）：** 只在特定 phase/mode/条件才需要的详细步骤、mode 矩阵、大型输出模板、dispatch 细节。移动时**必须**配确定性 STOP trigger。
- **Body-L3（删除）：** 背景叙事、通用建议、重复原则、过期实现细节、冗余例子。删除后不得造成 phase 步骤、artifact contract 或 safety boundary 缺失。

**判据：** L1 contract/gate = 「不在场就会出错」；L1 behavioral anchor = 「删掉后更容易走错方向」；L2 = 「大多数运行用不到，但需要时必须可达」；L3 = 「删了没有任何行为损失」。分不清 L1/L2 时，默认保留在 spine（宁可重也不可丢边界）；分不清 behavioral anchor/L3 时，先压成短句而不是删除。

> **命名消歧（重要）：** 本文 `L1/L2/L3` **只**指本节的 **Active body 内部层级**。§1.1 的两轴（Activation index / Active body）与 §9 引的 Anthropic 三级（metadata / body / resources）**一律不用 L 编号**，以免与此冲突——历史上这三套曾都借用 L1/L2/L3，本文已统一避免。

---

## 2. 九条可迁移原则

> **本节是本文的 single source of truth（SSOT）。** §5 反模式、§6 阻断条件、§7 gate、§10 与 §22 checklist 都是这九条原则面向不同消费者的**派生视图**；措辞或范围冲突时**一律以本节为准**。新增/修改规则先改这里，再更新派生视图（变更按指针传播，避免多处漂移）。

### 原则 1 — 边界保全优先于体量下降
`SKILL.md` 里的 hard boundary（source/runtime、mutation、verification、handoff、review gate）是**承重墙**，只能移动位置（进 reference 且有 STOP trigger），**不能删除、不能只藏进 reference 而在 spine 无触发**。behavioral anchor 不是 hard gate，但它是防止 agent 走错路径的短锚点，只能压缩、合并或改写，不能按「抽象原则」直接删。行数预算（如 <500 行、<200 行）是 advisory budget，不是 hard gate；真正的 completion gate 见 §7。

### 原则 2 — STOP trigger 是承重契约文本，不是普通指针
渐进披露的失败点是 **trigger failure**（模型不知道何时该读 reference），而不是 reference 数量。因此每一次 extraction 必须**四件套**齐全：

- `trigger_condition`：具体到可测试的触发时机（`STOP. Before X, read references/Y.md`）。
- `must_read`：强指令，而非「if applicable」软措辞。
- `fallback_if_unread`：未读时的安全降级。
- `eval_case`：至少一个触发场景 + 一个不触发场景。

四件套**全填**的最小样例（就近示范，勿只写字段名）：

```
trigger_condition: STOP. Before dispatching any reviewer, read references/mode-rules.md.
must_read:         强指令（非 "if applicable"）——dispatch 前必须读。
fallback_if_unread: 未读到 mode-rules 时按 report-only 保守处理，不写 review artifact。
eval_case:         触发=「review this PR」应读 mode-rules；不触发=「解释这段代码」不应读。
```

**关键区分：** 静态测试只能证明「STOP 语句存在于 spine」；「模型是否真的按触发读取」属行为保证，依赖 fresh-source eval。别把结构断言当行为保证。

### 原则 3 — 确定性下沉：消费脚本输出，而不是用 prose 复述脚本
若 prompt 用自然语言重述一段**脚本已确定性执行**的逻辑（hash 比对、结构校验、路径格式），这是把脚本职责写回了 prompt。正确做法是**消费脚本输出**：

- 让 prompt 运行 `spec-first <cmd> --json`，只在 `deterministic_handoff: true` 时进入语义判断；失败按 `reason_code` 停止并交还 handoff envelope。
- 脚本强制确定性不变量、准备事实；LLM 判断这层地板**之上**的语义充分性。
- **红线：** 不让脚本裁决语义（task 质量、review finding 成立性）；不让 prompt 伪造确定性（假装跑过校验）。

这条同时省 token **并**兑现角色契约「scripts enforce invariants; LLM decides semantic adequacy above that floor」。

### 原则 4 — 收益可信度分级：confirmed / contingent / hypothesis
优化收益必须按证据强度分级，**不得越级报告**：

| 级别 | 例子 | 报告方式 |
|---|---|---|
| confirmed | `wc -l` 行数下降、结构 delta | 直接作为经济性指标 |
| contingent | activation-token 节省（取决于宿主是否惰性加载 references） | 标 `contingent-on-loader-behavior`，**按宿主分别记录**，注明验证路径 |
| hypothesis | not-run 率下降、review 质量提升 | 标为待验证，给出采集路径，**不计入本轮验收** |

**反模式：** 把 line-count delta 当 token 收益报告；把 contingent 收益写成 confirmed；用一个单一数字掩盖 per-host 差异。

### 原则 5 — 宿主 primitive 不重建
skill discovery、L0/域索引、语义向量路由、懒加载策略、skill 联邦——都是**宿主拥有**的 primitive，正在商品化。spec-first 只拥有 description 文本、body、references 和 runtime 投射。优化时**明确拒绝**自建这些能力。价值应上移到宿主不拥有的层：跨宿主证据/验证闭环、source/runtime 同源纪律、治理外显。

### 原则 6 — Gate 出口，不 gate 思考
把**不可逆动作**绑定到证据，**可逆动作**放行：

- 不可逆（删除/迁移 spine 承重文本、mutation、声明完成）→ 必须有 confirmed evidence（如 fresh-source eval / read-only 复核）。未跑证据时**降级为可逆动作**（只新增 reference + STOP trigger，原文保留），而不是放行。
- 可逆（新增 reference、加 trigger map）→ 自由进行。

缺 runtime 强制能力时，verification/handoff gate 降级为**响亮约定**：显式声明「未强制及原因」，不静默放行、不伪造已强制。

### 原则 7 — 证据先行，警惕「自我封闭」计划
优化前区分**已证实的前提**与**待验证的前提**：

- 维护性前提（1200+ 行单体、跨 skill 逐字重复、超出建议上限）通常 `wc -l` 可复核 → confirmed。
- 用户影响前提（膨胀→挤压 context→漏读→not-run 升高）常是推测因果链 → hypothesis。

**「自我封闭」反模式：** 一个计划把成功判据收窄到「无回归」、又把唯一能证伪其价值的测量层 defer 掉——它无法证明自己值得做。破解手法：用 premise baseline（已有证据、零改动）建 before 快照，并给 deferred 的验证一个 **committed trigger**（明确「什么条件下从 hypothesis 变 confirmed」），避免「机制就位≠使命兑现」。

### 原则 8 — 只读探针前置，让下游单元真正兑现收益
当某个收益依赖一个**尚未查明的事实**（如「宿主是否 eager-inline `@./references`」），把查明该事实的**只读探针前置**，而不是把收益全部 gate 到流程末尾的验证单元。探针 read-only、可与其它单元并行、零 mutation 风险；它产出的 per-host 事实让下游 extraction 单元在**首轮**就做出正确、可兑现收益的转换。

### 原则 9 — Source/runtime 同源纪律
永远改 source（`skills/`、`references/`），**不手改** generated runtime mirrors（`.claude/`、`.codex/`、`.agents/skills/` 等）。需要刷新 runtime 用 `spec-first init`。移动 references 时，路径写法必须是 runtime path-rewrite transform 能处理的形式；投射验证只通过 source 生成结果观察，不靠手改 mirror 制造通过。

---

## 3. 可复用作业流程（Playbook）

对任意待优化 skill，按此序执行。每步都可因证据不足而**诚实降级**，但不得跳过或伪造。

**先问一句「该不该优化」（对活动本身用奥卡姆）：** 一个已经单一职责、行数不大（<300 行为 advisory 经验参考，非硬阈值）、无跨 skill 重复、无治理债的 skill，不需要为了「更短」而动它。优化是为了还债，不是为了刷指标。确认存在真实债（体量/重复/漏边界/trigger 缺失）再进入下面的步骤。

### Step 0 — 建立 baseline 与 Evidence Matrix（区分两轴）
- **Body baseline：** `SKILL.md` 行数、主 prompt references 清单、每个 reference 的 STOP trigger。
- **Index baseline：** frontmatter `description` 的字符/词/估算 token、是否已有 exclude intent、与相邻 workflow 的重叠词。
- 若某 skill 有相邻误触发风险，记录相邻 workflow 的 expected/excluded route 意图。
- baseline 无法完整建立时记 `baseline_degraded:<reason>`，不阻断，但 closeout 必须暴露。

**候选项矩阵（Scenario × Skill × Evidence）——同属 Step 0，改文件前建立：** 用轻量矩阵承载候选项。它是 planning/evidence 表，**不是 schema、contract 或 checker 输入**；脚本不得根据它裁决语义充分性。

| 字段 | 说明 |
|---|---|
| `skill` | 目标 skill。 |
| `scenario` | 典型场景，如 greenfield / brownfield / bugfix / review / refactor / setup / knowledge / standards / multi-repo / release。 |
| `compression_candidate` | 待删、待下沉、待合并或待保留片段。 |
| `classification` | `L1 contract/gate` / `L1 behavioral_anchor` / `L2 reference` / `L3 delete`。 |
| `protected_behavior` | 不可退化的行为、边界或输出。 |
| `trigger_condition` | 若下沉，何时必须读 reference。 |
| `existing_eval_refs` | 当前 eval / test / fresh-source 证据。 |
| `missing_negative_cases` | 必补反例或 route-collision case。 |
| `source_runtime_boundary` | 是否影响 source/runtime 投射或 generated mirror 边界。 |
| `implementation_permission` | `blocked` / `candidate` / `ready`；只有 `ready` 才进入不可逆删除或承重迁移。 |

### Step 1 — 内容分类（四类 + index/body）
逐段打标签：Body-L1 contract/gate 保留 / Body-L1 behavioral anchor 压短保留 / Body-L2 待迁移 / Body-L3 待删除 / Activation-L1 索引。分不清 L1/L2 时默认 L1；分不清 behavioral anchor/L3 时先压短不删。

### Step 2 — 识别确定性下沉候选（原则 3）
找出「用 prose 复述脚本已确定性执行的逻辑」的段落，标记为 CLI-handoff 候选。确认目标脚本已输出 executor 真正需要的字段，否则不新增 CLI。

### Step 3 — 前置只读探针（原则 8，按需）
若收益依赖未查明的宿主/runtime 事实（loader 行为、投射 surface），先做只读探针产出 per-host 事实表，供 Step 4 决策。

### Step 4 — 执行重排
- Body-L2 → `references/`，每个都配 STOP trigger 四件套（原则 2）。
- Body-L3 → 删除（确认无边界损失）。
- 确定性下沉候选 → 改为消费 CLI 输出 + `reason_code`。
- **不可逆删除/迁移 spine 承重文本前，先满足原则 6 的证据 gate**；证据不足则只做可逆新增。

### Step 5 — 验证（静态形状 + 行为 + runtime 投射）
- **静态测试：** source prompt shape（trigger map 存在、每个 moved reference 被命名、无 stale eager include、无手改 mirror 指令）+ runtime projection/path rewrite。脚本只证结构与覆盖。
- **行为验证：** fresh-source eval 或等价 read-only 复核，覆盖 source/runtime boundary、mutation gate、verification/handoff、trigger precision。未跑记 `fresh_source_eval_not_run:<reason>`，且此时不得删 spine 承重文本。
- **runtime 投射：** 只经 `spec-first init` 生成结果观察，不手改 mirror。

### Step 5b — 证据分级（adequacy）与反例优先

Eval 需要报告**充分性等级**，而不是只报「有/没有」。按最高可证明等级声明收益：

| 等级 | 含义 | 允许声明 |
|---|---|---|
| L0 none | 没有对应 case | 不足以改承重内容 |
| L1 structural | 只证明字段/trigger/fixture/path 结构存在 | 可做低风险 prose 调整；不能声明行为等价 |
| L2 semantic sample | fresh-source eval 或人工 read-only 抽样检查过语义 | 可做中风险下沉；仍需记录样本限制 |
| L3 before/after | 同一 case 改前/改后对比，覆盖 protected behavior | 可声明该样本范围内未退化 |
| L4 production evidence | 真实 run / review / bug 反馈闭环支持 | 才能声明质量提升或趋势改善 |

**Negative eval 优先于 happy path：** prompt 精简最容易静默破坏的是误触发、漏触发、边界丢失、未读 reference 和 degraded closeout——这些反例比正常路径更该先覆盖。

### Step 6 — 诚实 closeout（outcome bundle）
必须报告：exact line-count delta（confirmed）· **按宿主**的 context-room delta（contingent）· trigger/eval/static-test 结果 · fresh-source/runtime smoke 结果或 degraded reason · created references 清单 + 有意保留的 load-bearing text · before baseline 引用 · **明确成功判据**（边界保留 + 无回归 + delta 记录）· deferred 验证项及其 committed trigger · not-run/failed/degraded 的全部 reason_code。

可复制 closeout 模板如下。它是 Markdown outcome bundle 格式，不是新 schema 或 checker；需要机器校验时复用现有 workflow/CLI owner：

```markdown
## Outcome Bundle

- baseline_ref: <source read / run evidence / premise baseline path>
- evidence_matrix:
  - scenario: <scenario>
    skill: <skill>
    candidate: <body/index/reference change>
    implementation_permission: ready|candidate|blocked
    existing_eval_refs: <paths or none>
    missing_negative_cases: <cases or none>
- changed_surfaces: <SKILL.md / references / eval fixtures / tests>
- line_count_delta: <before -> after> [confirmed]
- context_room_delta_by_host:
  - <host>: <delta or none> [confirmed|contingent|hypothesis, reason]
- verification:
  - static_tests: <command + result>
  - fresh_source_eval: <result or fresh_source_eval_not_run:<reason>>
  - negative_eval_cases: <covered cases, especially false trigger / missed trigger / degraded closeout>
  - eval_adequacy: L0|L1|L2|L3|L4
- boundary_result: <source/runtime, mutation, verification, handoff, review gate preserved?>
- references_created_or_kept: <paths + STOP trigger summary>
- success_gate: pass|failed|degraded, <reason_code>
- deferred_follow_up: <owner / trigger / re-evaluation condition>
```

---

## 4. Pilot 与 rollout 纪律

- **先做一个 evidence-ready 单点 pilot：** 只选 Evidence Matrix 中 `implementation_permission: ready` 的一个 compression candidate，完成「baseline → 分类 → reference/删除 → static tests → fresh-source eval → honest closeout」闭环。第一个通过后，再选第二个代表性 skill（一个高频执行型或一个最重/reference-heavy 型）验证可迁移性，再考虑 wave rollout。
- **wave-2 是 outcome-gated：** 只有 pilot closeout 产出可信 outcome bundle 后才创建推广计划；证据不足以 `wave2_blocked_pending_pilot_evidence` 收尾。
- **拆分要拆干净（避免"拆了一半"）：** 正交维度拆到独立计划时，检查是否共享同一批 source 文件的写入权（同一 rubric 文件、同一 eval glob）。若共享，必须显式约定**文件归属 + 落地顺序 + 命名隔离**（如 `examples*.json` vs `route-collision-*.json`），否则并行会互相覆盖。

---

## 5. 反模式清单（Anti-patterns）

> 派生视图：§2 九原则的「反面」快查；冲突以 §2 为准。

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

> 派生视图：§2 原则 + §7 gate 的硬性出口；冲突以 §2/§7 为准。

出现以下任一即不可验收，必须修复或显式降级说明：

- 缺 baseline 且未记 degraded reason。
- reference 没有主 spine STOP trigger。
- Body-L1 hard boundary 被删除或只藏入 reference。
- Body-L1 behavioral anchor 被当作 L3 删除，且未用 eval 或 reviewer 证明不会增加错误路径。
- Jest/脚本试图裁决自然语言语义（路由、任务质量、finding 成立性）。
- 迁移/删除 spine 承重文本却缺 fresh-source eval（未跑时只允许可逆新增）。
- 手改 generated runtime mirror 作为修复/验证。
- fresh-source/read-only eval 未执行且 closeout 未记 reason_code。

---

## 7. 指标 vs Gate（关键区分）

| 类别 | 项 | 用途 |
|---|---|---|
| 经济性指标（advisory） | line-count delta、context-room delta、description token delta | 记录、观察趋势；**永不**单独作为 completion gate |
| Completion gate · 可确定性强制 | STOP trigger 语句存在、focused tests 通过、runtime projection/path rewrite 通过、无手改 generated mirror | 脚本/CI 可判定，不通过即 fail |
| Completion gate · reviewer/LLM 语义判定 | 边界（语义上）保留、行为无回归、trigger precision、honest closeout | 属 deterministic floor **之上**的语义判断；缺 runtime 强制时降级为**响亮约定**（显式声明未强制及原因，见 §2 原则 6），不静默放行 |

一句话：**用指标证明「更省」，用 gate 证明「没坏」；只有 gate 决定能否收工。** gate 分两层：机器能判的（结构/测试）硬 fail，机器判不了的（语义/边界/诚实）交 reviewer/LLM，缺强制时降级为响亮约定而非跳过。

### 7.1 reason_code / status 注册表（集中枚举）

本节是本文专用 reason_code 与跨章节 status tag 的集中注册表；各章引用本文自有码时指向此处，closeout（§3 Step 6）用它对照勾选。它不是证据等级或所有运行状态的唯一来源：`confirmed` / `contingent` / `hypothesis`、`not-run` / `failed` / `degraded` 等口径见 §3、§7 与具体 workflow owner。**新增本文自有码先在此登记，再在正文引用。**

| code / tag | 类型 | 触发条件 | 处置 |
|---|---|---|---|
| `baseline_degraded:<reason>` | reason_code | Step 0 baseline 无法完整建立 | 不阻断，closeout 必须暴露 |
| `fresh_source_eval_not_run:<reason>` | reason_code | 未跑 fresh-source / read-only eval | 只允许可逆新增，不得删 spine 承重文本；closeout 写明原因 |
| `wave2_blocked_pending_pilot_evidence` | reason_code | pilot outcome bundle 证据不足 | 不创建 wave-2 推广计划 |
| `contingent-on-loader-behavior` | status tag | context-room 收益取决于宿主是否惰性加载 references | 按宿主分别记录，注明验证路径，未证不写成 confirmed |
| `deterministic_handoff` / `reason_code` | CLI-owned 字段 | `spec-first … --json` 的输出字段（非本文自有码） | 只消费、不复述其判定规则（§2 原则 3） |

> 说明：本表只登记**本文正文实际使用**的码；具体 workflow/计划可能有更多领域码（如 loader/route/description 相关），归各自 owner 文档，不在此强行统一。

---

## 8. 与现有治理的对齐

- **审计信号 owner：** `skills/spec-skill-audit/references/skill-authoring-quality.md`。其 P1（trigger 误触发、entry/body 不符、越界 ownership、无 completion criterion、source/runtime 误导）与 P2（长 examples/rubric 未下沉、重复真相源、reference 无指针、缺 eval、tier 模糊）信号，正是本方法论要优化的对象。**审计发现问题 → 本 playbook 指导修复。**
- **审查方法：** `docs/10-prompt/系统性项目审查方法.md`，本文是其在 skill-prompt 维度的专项优化补充。
- **价值基线：** `docs/10-prompt/结构化项目角色契约.md`（Light contract + Explicit boundaries + Deterministic floor + LLM semantic judgment）。本文所有原则都是该契约在 skill-prompt 场景的具体化；冲突时以契约为准。
- **参考实现：** `skills/spec-plan` 是当前最佳的 spine + STOP-triggered references 本地范例（其 `spec-plan-contracts.test.js` 断言 runtime 投射与 drift）。注意：spec-plan 用的是**分散内联 STOP 触发**；集中式 `Reference Trigger Map` 是**新增结构**，需自带 contract test，不能声称是现成模式的直接复用。

---

## 9. 外部依据（advisory）

主依据：Anthropic 官方 [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)、[Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)、OpenAI Codex [Agent Skills](https://developers.openai.com/codex/skills) 与 [AGENTS.md 指南](https://developers.openai.com/codex/guides/agents-md)。方向与业界公开实践一致，仅作 advisory，不替代仓库 source/test/边界为准：

- 三级渐进披露（metadata 常驻预加载 / SKILL.md 触发时读 / resources 按需读；为避免与本文 Body-L1/L2/L3 混淆，此处不用 L 编号）是 Agent Skills 的基础架构；`SKILL.md` 正文建议 <500 行、references 一层深、>100 行 reference 带 TOC。
- description 是发现元数据：第三人称、含 what+when+触发词、≤1024 字符；name 建议动名词、≤64 字符、禁保留字。
- Codex Skills 的初始发现面以 name / description / path 为主，选中后再读完整 `SKILL.md`；这支持「description-first + spine + references + eval」的四层结构。
- Codex 的 `AGENTS.md` 是项目级 layered guidance；常驻上下文应保留 repo 结构、测试命令、敏感边界和 hard stop 条件，不塞入模型可从代码/README 获取的实现细节。
- 设计纪律：先建 eval 再写正文；自由度匹配任务脆弱性；只加模型不知道的、术语一致、避免时效信息与过多选项；脚本 solve-don't-punt、无 voodoo constants、plan-validate-execute。
- 单体化（全塞进一个长 `SKILL.md`）是最常见失败；用 Author/User 双实例迭代、跨模型测试，而非主观「读起来更好」。

**外部依据刷新规则：** 本章 `last_verified: 2026-07-07`。当宿主 skill 加载机制、description 限制、reference 读取行为、AGENTS.md 层级规则或 runtime 投射规则变化时，必须重新核对本章；不能把历史外部资料当作当前 runtime contract。

（本章为改写摘要，每处均为转述而非原文照搬；实现真相源仍以仓库 source、tests 和 source/runtime 边界为准。内容已按许可要求改写。）

---

## 10. 速查（优化 TL;DR checklist）

> 派生视图：§0–§9 的快查清单；每项权威定义在对应章节，冲突以正文为准。

优化任意 skill 时逐项过：

- [ ] 先判断「该不该优化」——无真实债就不动
- [ ] 建 baseline（body 行数/references/triggers；index description token/exclude）
- [ ] 建 Scenario × Skill × Evidence Matrix，标出 `implementation_permission`
- [ ] 内容分类 L1 contract/gate（留）/ L1 behavioral anchor（压短保留）/ L2（迁 reference + STOP）/ L3（删）；index/body 分开
- [ ] 识别 prose 复述脚本的段落 → 改消费 CLI `--json` + reason_code
- [ ] 收益依赖未知事实 → 先做只读探针（per-host）
- [ ] 每个 moved reference 有 trigger 四件套
- [ ] hard boundary 全部保留在 spine（或有 STOP trigger 的 reference）；behavioral anchor 未被当叙事删除
- [ ] 不可逆删除前有 fresh-source eval；否则只做可逆新增
- [ ] 静态测试 + 行为 eval 都覆盖（含 negative cases），并标注 eval adequacy L0–L4 等级
- [ ] 收益按 confirmed/contingent/hypothesis 分级、按宿主报告
- [ ] closeout 诚实：delta + degraded reason_code + deferred 项的 committed trigger
- [ ] 未自建宿主 primitive；未手改 generated mirror；已同步 CHANGELOG

---

# 第二部分 · 设计方法论：从零写好一个 skill

> 前十节讲「怎么改好一个既有 skill」；本部分讲「怎么从零设计」。二者互补：
> **设计决定上限，优化只是把设计欠的债还回来。** 一个 evaluation-driven、单一职责、
> 信息架构清晰的 skill 从一开始就不需要大规模瘦身。
>
> 本部分融合 Anthropic 官方 authoring best practices（§9 已给链接）与 spec-first 治理叠加层。

## 11. Evaluation-driven：先写 eval，再写正文

官方最强的一条设计纪律：**在写大量文档之前先建 eval**，确保 skill 解决真实问题而非想象需求。落地顺序：

1. **识别 gap：** 让模型在**没有该 skill** 的情况下跑代表性任务，记录具体失败与缺失上下文。
2. **建 3 个评测场景：** 针对 gap 写 eval（query + 输入文件 + expected_behavior 列表）。
3. **测 baseline：** 记录无 skill 时的表现。
4. **写最小正文：** 只写足以补齐 gap、通过 eval 的内容——不多写。
5. **迭代：** 跑 eval、对照 baseline、精修。

对 spec-first 的意义：这与 §5 的 fresh-source eval 同源——eval 是 skill 有效性的**真相源**。设计期就把 `skills/<skill>/evals/*.json` 建起来，后续优化才有对照，避免「读起来更好」式主观判断。

## 12. 单一职责 + 紧扉边界（trigger / non-trigger）

- **一个 skill 只做一件事**，范围收窄；宁可拆成可串联的小 skill，也不做万能大 skill。单体化是最常见失败。
- 设计期就想清 **should-trigger** 与 **should-not-trigger** 两组意图。对 spec-first，相邻 workflow（`spec-plan`/`spec-work`/`spec-code-review`/`spec-doc-review`/`spec-compound`）边界紧邻，**exclude intent 是必付的 token**——误触发比漏触发更伤。

## 13. Frontmatter 设计：name 与 description

frontmatter 是**唯一常驻**的部分（Activation index），每次对话都注入，是路由发现的全部依据。官方硬约束 + spec-first 叠加：

| 字段 | 官方约束 | 写法要点 |
|---|---|---|
| `name` | ≤64 字符，仅小写字母/数字/连字符，禁 `anthropic`/`claude`，禁 XML | 建议**动名词**（`processing-pdfs`）；公开 workflow 入口统一 `spec-*`；避免 `helper`/`utils`/`tools` 空词 |
| `description` | ≤1024 字符，非空，禁 XML，**第三人称** | 必含 **what + when + 具体触发词**；第三人称（被注入 system prompt，「I can…」「You can…」破坏发现） |

**spec-first 叠加：description 是路由器，不是说明书。** 收敛为「trigger + exclude + 一句定位」三段各自最短，功能说明/案例留给正文。不要为凑长度砍掉相邻 workflow 的 exclude intent。

## 14. 自由度设计（Degrees of freedom）

按任务的**脆弱性与可变性**匹配指令具体程度——官方「机器人走路」类比：

| 自由度 | 何时用 | 形式 | spec-first 映射 |
|---|---|---|---|
| 高（宽阔原野，多条路都通） | 多解法有效、依赖上下文 | 文字化启发式步骤 | LLM-owned 语义判断 |
| 中（有偏好路径） | 有推荐 pattern、允许变体 | 带参数的伪代码/模板 | 模板 + 可调参数 |
| 低（悬崖窄桥，一条安全路） | 操作脆弱、必须一致/按序 | 精确脚本，禁改命令/加 flag | **确定性下沉**：消费 CLI handoff（§2 原则 3） |

设计要点：把确定性操作交给低自由度脚本，把语义判断留给高自由度文字——角色契约「scripts enforce invariants; LLM decides above the floor」的设计期体现。

## 15. 正文信息架构（Progressive disclosure by design）

官方把 `SKILL.md` 视为「目录页」，指向按需加载的详情。设计期就按此搭骨架：

- **正文 <500 行**（官方建议上限，advisory）；接近上限就拆。对应本文 Body-L1 spine。
- **references 只下沉一层**：所有 reference 从 `SKILL.md` 直链。深层嵌套会导致模型 `head -100` 式部分读取、信息不全。
- **>100 行 reference 加目录（TOC）**，保证部分预览也能看到全貌。
- **按 domain 组织** references，让某类任务只加载相关部分。
- **conditional details**：基础留正文，高级/条件外置（对应 Body-L2 + STOP trigger）。

spec-first 叠加：references 是 source-owned，随 `spec-first init` 投射到 runtime mirror；路径用正斜杠、写成 path-rewrite transform 能处理的形式（§2 原则 9）。

## 16. Workflow、feedback loop 与 checklist 模式

- **复杂任务拆成清晰有序步骤**；特别复杂的流程给一份可复制进回复、逐项打勾的 **checklist**，防跳过关键校验。
- **feedback loop 模式**：`跑校验 → 修错 → 重跑`，通过才继续。校验器可以是脚本或一份供自检的 reference。与 spec-first 的 verification gate 同构。

## 17. 三个高频正文模式

- **Template 模式：** 给输出格式模板，严格度按需——严格用 `ALWAYS use this exact template`，灵活给「合理默认 + 可自行调整」。
- **Examples 模式：** 当输出质量依赖示例时，给 **输入/输出对**，比纯描述更能传达风格与颗粒度。
- **Conditional workflow 模式：** 用决策点分流；分支很大时推到独立文件按任务读。

## 18. 内容卫生（Concise by design）

官方信条：**上下文窗口是公共品，默认模型已经很聪明。** 每段自问「模型真的不知道吗？值它占的 token 吗？」

- 只加模型**没有**的上下文，不解释常识。
- **术语一致**：一个概念一个词。
- **不写时效性信息**：用可折叠「Old patterns / deprecated」小节承载历史，不污染主线。
- **不堆选项**：给一个默认 + 一个逃生出口。

## 19. 脚本设计（Advanced：带可执行代码）

若 skill 含脚本，官方四条纪律与 spec-first deterministic floor 一致：

- **Solve, don't punt：** 脚本自己处理错误条件，而非抛错让模型现场猜。
- **无 voodoo constants：** 每个配置值自解释（`REQUEST_TIMEOUT = 30 # 慢连接留余量`），不写魔数。
- **优先 utility 脚本：** 确定性操作写脚本供**执行**（省 token、可靠、一致），明确标注「执行」还是「参考阅读」。
- **plan-validate-execute：** 高风险/批量操作先产结构化 plan → 脚本校验 → 执行 → 验证。这正是 task-pack `--json` handoff 与 review gate 的设计原型。

## 20. 迭代与观察（Author / User 双实例）

官方最有效的开发法是**让模型参与设计**：

- **Author 实例**帮你写/精修；**User 实例**（全新、加载该 skill）在真实任务中使用；观察行为带回作者侧。
- **观察四个信号**（对应 fresh-source eval 关注点）：意外探索路径（结构不直觉）、错过链接（指针不显眼）、过度依赖某文件（该内容也许该进正文）、从不访问某文件（多余或信号太弱）。
- **跨模型测试**：对强模型刚好的，可能对快模型不够。

spec-first 叠加：观察必须用 fresh-source eval（注入当前磁盘 source），不依赖同会话缓存的定义（见 `AGENTS.md` 的 agent/skill 变更验证纪律）。

## 21. spec-first 设计叠加层（指针，不重述）

通用最佳实践之外，spec-first 设计还必须满足以下——**均已在第一部分展开，此处只列设计期锚点，不重复论证**：

- **治理边界是承重墙**：从设计期就把 hard boundary 作为 Body-L1 固定项 → 见 §1.2、§2 原则 1。
- **Source/runtime 同源**：只设计 source，runtime 由 `spec-first init` 生成 → 见 §2 原则 9。
- **宿主 primitive 不重建**：只拥有 description + 投射 → 见 §2 原则 5。
- **两轴成本自觉**：description 与正文分开权衡 → 见 §1.1。
- **收益/证据分级**：eval 与 closeout 区分 confirmed/contingent/hypothesis → 见 §2 原则 4。
- **入口治理**：公开 workflow 用 `spec-*`；internal helper 不暴露为用户入口（如 `git-worktree`）。

## 22. 设计 checklist（合并官方 + spec-first）

> 派生视图：§11–§21 的快查清单；权威定义在对应章节，冲突以正文为准。

新写或大改一个 skill 前逐项过：

**发现与边界**
- [ ] name 动名词、≤64 字符、无保留字；公开 workflow 用 `spec-*`
- [ ] description 第三人称、≤1024 字符、含 what+when+触发词
- [ ] description 含相邻 workflow 的 exclude intent
- [ ] 单一职责，should-trigger / should-not-trigger 两组意图清晰

**信息架构**
- [ ] 正文 <500 行；`SKILL.md` 是目录页而非全量正文
- [ ] references 一层深、从 `SKILL.md` 直链；>100 行 reference 带 TOC
- [ ] Body-L1 contract/gate（含 hard boundary）留正文；behavioral anchor 压短但不删除；Body-L2 带 STOP trigger 外置；无 Body-L3 冗余
- [ ] 自由度与任务脆弱性匹配（确定性操作→低自由度脚本/CLI handoff）

**内容质量**
- [ ] 只写模型不知道的；术语一致；无时效性信息
- [ ] 不堆选项，给默认 + 逃生出口；示例是具体 input/output 对
- [ ] 复杂流程有有序步骤 + 可复制 checklist；质量关键处有 feedback loop

**脚本（如有）**
- [ ] solve don't punt；无 voodoo constants；utility 脚本标明执行/参考
- [ ] 高风险操作用 plan-validate-execute + 可验证中间产物；正斜杠路径

**验证与治理**
- [ ] 先建 ≥3 个 eval，有 baseline
- [ ] eval 覆盖 negative cases，并标注 L0–L4 充分性等级
- [ ] 跨目标模型测试；用 fresh-source eval 观察双实例行为
- [ ] 治理边界、source/runtime、宿主 primitive、两轴成本、收益分级均满足
- [ ] 未手改 generated mirror；已同步 CHANGELOG

---

# 第三部分 · 决策模型透镜：用思维模型锐化 skill 设计与优化

> 来源：`docs/11-业界调研/16个思维模型方法论学习记录.md` 及其应用方案
> `docs/11-业界调研/spec-first-skills-优化方案-基于16个思维模型.md`。
>
> **重要区分：** 那份应用方案把思维模型映射到 **workflow 运行时行为**（给 `spec-prd`
> 加字段等）；本部分只取其中能锐化 **skill prompt 本身的设计与优化**（元活动）的模型。
> 选哪些模型进来，本身就是对模型集合应用**奥卡姆 + 帕累托**——只引入直接强化本文
> §1–§22 决策的少数关键模型，不堆砌。

## 23. 核心透镜（直接映射本文原则/单元）

| 思维模型 | 对 skill 设计/优化的具体启发 | 对应本文 | 一句话 |
|---|---|---|---|
| **古德哈特定律** | 「当指标变成目标，它就不再是好指标」——把行数/token 当 hard gate，人就会删承重文本去凑数。这是**行数是 advisory、不是 gate** 的根本理由。 | §0、§7 | 度量用来观察，不用来考核 |
| **地图不是疆域** | source ≠ runtime 行为；contract test 通过 ≠ 行为等价；line-count delta ≠ token 收益。所有「结构正确」都要用现实校准。 | §2 原则 2/4/9、§5 行为验证 | 别把 prompt 当成模型真实行为 |
| **奥卡姆剃刀** | 优化=最少机制覆盖真实需求：不新增 schema/contract、不堆并列选项、不做防御性冗余；能复用现有 owner 就不造新的。 | §5 反模式、§18、§21 | 简单不是简陋，是没有多余假设 |
| **帕累托 80/20** | 20% 内容（spine + hard boundary）承载 80% 价值；先 pilot 最重的少数 skill，而不是全量机械瘦身。 | §4 pilot 纪律、§1.2 | 先啃最重的、最承重的 |
| **边际效用递减** | 瘦身到某点后，继续压的边际收益 < 引入 trigger failure 的风险；压缩要有停止条件。 | §2 原则 1、§7、§18 | 最短不等于最优 |
| **二阶思维** | 把内容移进 reference 的二阶后果是 trigger failure → 静默 behavioral regression；删 prose 的二阶后果是 degraded 模式丢了「为什么」。所以 extraction 必配 trigger 四件套。 | §2 原则 2、§6 阻断条件 | 问一句「然后呢？会不会静默坏掉？」 |
| **第一性原理** | 设计先问「这个 skill 不可再拆的职责是什么」，从底层重建而非继承膨胀；区分 hard boundary、behavioral anchor、条件细节与可删叙事。 | §11、§12、§1.2 四类正文 | 从零设计你会怎么写 |
| **公地悲剧** | 上下文窗口是**公共品**（Anthropic 原话）；每个 skill 过度占用 context 就是公地悲剧。两轴成本 + Activation index 治理正是给公共资源设边界。 | §1.1、§18 | 你的 token 在和所有人抢座位 |
| **创造性破坏 / 商品化** | 宿主 primitive（发现/路由/懒加载）正在商品化；不重建，被替代的能力评估退役。 | §2 原则 5、§21 | 别造宿主即将免费给的轮子 |
| **蝴蝶效应** | 一个 STOP trigger 的歧义、一处被砍掉的 exclude intent，会在多 agent 协作里放大成误路由/漏读。 | §2 原则 2、§12 | 小歧义会被系统放大 |

## 24. 安全与取舍透镜（优化期防翻车）

| 模型 | 用法 | 对应本文 |
|---|---|---|
| **逆向思维 Inversion** | 不问「怎么让这次瘦身更好」，而问「这次瘦身会怎样**静默搞坏**这个 skill」——主动构造失败场景（trigger 不触发、边界被藏、eager include 误转 lazy）。 | §5 行为验证、§6 |
| **事前验尸 Pre-mortem** | 交付前先假设「它已经失败了」：哪条 hard boundary 被下沉后没人读到？哪个宿主 loader 其实不惰性？倒推补 gate。 | §3 Step 6、§6 |
| **MECE** | reference 拆分要**不重叠不遗漏**：按 domain 组织、避免同 glob/同文件多计划共写（拆分「拆了一半」正是 MECE 违规）。 | §15、§4 拆分纪律 |
| **约束理论 ToC** | 找真正的瓶颈：skill 的约束往往不是行数，而是 **trigger 可靠性 / 宿主 loader 行为**；优化瓶颈（前置 loader 探针）比压行数更有效。 | §8 只读探针前置 |
| **信息价值 VoI** | 优先获取**又便宜又高价值**的信息：premise baseline、loader 探针都是零改动却能改变下游决策的高 VoI 动作，理应前置。 | §7、§8 |
| **Cynefin / 自由度** | 按情境定自由度：清晰确定 → 低自由度脚本 + CLI handoff；复杂涌现 → 高自由度启发式 + 探针试错。 | §14 |
| **复利效应 / 临界点** | pilot 沉淀的可复用 test/eval pattern 会在 rollout 复利；Activation index 税随 skill 数增长会越过阈值——索引治理不能等「危险了」才做。 | §4、§1.1 |
| **回归均值 / 大数定律** | 一次 fresh-source eval 通过 ≠ 行为稳定；别用单次好结果宣称等价，必要时多样本/跨模型复核。 | §5、§20 |

## 25. 组合用法（设计链 vs 精简链）

**设计一个新 skill（从零）：**
```
第一性原理（不可再拆的职责是什么）
→ evaluation-driven（先写 eval 证明真需求，§11）
→ 奥卡姆（最少机制：单一职责、不新增 schema）
→ 公地悲剧（description/正文都在抢公共 context，写最短）
→ Cynefin/自由度（脆弱操作低自由度→CLI，语义判断高自由度→文字）
→ 二阶思维（这条边界/trigger 若失效，下游会怎样）
→ 逆向 + pre-mortem（交付前假设它已失败，补 gate）
```

**精简一个既有 skill：**
```
帕累托（先挑最重 offender、锁定承重 20%）
→ 地图不是疆域（先建 baseline，别信「读起来更短就是更好」）
→ 约束理论 + 信息价值（前置 loader 探针，攻真正瓶颈而非行数）
→ 二阶思维（每次 extraction 的 trigger failure 风险）
→ 边际效用递减（压到边际收益<风险就停）
→ 古德哈特（行数只作指标，不作 gate）
→ 逆向/pre-mortem（不可逆删除前用 fresh-source eval 证等价）
→ MECE（多计划共写同一文件/glob 时切干净）
```

## 26. 不引入的模型（保持克制）

以下模型对 **workflow 运行时**有价值，但对 **skill prompt 设计/优化**这一元活动**不引入核心**，避免撑肿（对模型集合本身用奥卡姆）：

- **JTBD / RICE / Wardley / North Star / AARRR / 情景规划：** 产品需求与增长战略，属 `spec-prd`/`spec-ideate`/roadmap 的运行时判断。
- **社会认同：** 采纳信任信号，属 `spec-release-notes`/采纳层。
- **基准率 / 贝叶斯 / 竞争假设 ACH：** review/debug 的**运行时**证据推理，已由 `spec-code-review`/`spec-debug` 承载。
- **六顶思考帽 / 艾森豪威尔矩阵 / OODA / RAPID：** 会议协作、时间管理、执行循环、权责，与 skill 文本设计正交。

判据（沿用外部 16 模型方案 `docs/11-业界调研/spec-first-skills-优化方案-基于16个思维模型.md` §9.4 的集成原则）：一个模型是否进本方法论，只看它是否直接锐化 **skill 的发现/边界/信息架构/自由度/收益分级/验证** 之一；只强化运行时 workflow 行为的，留在那些 workflow 的 owner 文档里。

---

# §27 端到端样板：把方法走一遍长什么样

> **性质声明（诚实优先）：** 以下是一个**代表性 composite 示例**，用于演示流程，**不是对任何
> 真实 skill 当前内容的断言**。真实优化必须按 §3 Step 0 重新读源建 baseline。

## 27.1 场景

一个虚构的执行型 skill `shipping-widgets`，`SKILL.md` 约 600 行，症状：task-pack 校验规则用 40 行 prose 复述、mode 矩阵与大输出模板常驻正文、混入大量「什么是 CI/CD」式背景叙事、frontmatter description 128 词把功能说明写进去了。

## 27.2 Step 0 baseline（confirmed 事实）

```
body: SKILL.md 600 行；references/ 已存在 1 个（shipping-flow.md），但正文仍全量承载
index: description 128 词 / ~190 token；无 exclude intent；与相邻 `spec-work` 有 3 个重叠触发词
```

Evidence Matrix（示例，真实执行必须读当前 source/eval 后重建）：

| scenario | skill surface | candidate | existing_eval_refs | missing_negative_cases | implementation_permission |
|---|---|---|---|---|---|
| task-pack intake | Active body | task-pack 校验 prose → CLI handoff + reference | `evals/task-pack-intake.json`、`tests/task-pack-contract.test.js` | none | ready |
| reviewer dispatch | Active body | mode 矩阵 → `references/mode-rules.md` | `evals/dispatch-happy-path.json` | bare prompt 不应触发 dispatch；reference 未读时的 conservative fallback | candidate |
| route discovery | Activation index | description 128 词 → trigger/exclude/定位 | none | 与 `spec-work` 的 route-collision negative；unresolved WHAT 不应触发 | blocked |

## 27.3 Step 1 分类（节选）

| 段落 | 分类 | 依据 |
|---|---|---|
| task-pack hash/结构校验 40 行 prose | 确定性下沉候选 | 脚本已确定性执行（原则 3） |
| mutation/verification/handoff 边界 | Body-L1 | 承重墙，不在场就出错 |
| "Do not expand beyond the validated task pack; verify before declaring done." | Body-L1 behavioral anchor | 非 hard gate，但删除后更容易扩大 scope 或伪造完成；压短保留 |
| mode 矩阵、大输出模板 | Body-L2 | 只在特定 mode 需要 |
| 「CI/CD 是什么」「为什么要测试」2 段 | Body-L3 | 删了无行为损失 |

## 27.4 Step 2–4 重排（good vs bad 对照）

**确定性下沉——把 40 行 prose 换成 CLI handoff：**

```markdown
STOP. When the input is a task pack, run `spec-first tasks validate <path> --json`
and read references/task-pack-intake.md before creating execution tasks.
Proceed only if `deterministic_handoff: true`; otherwise stop with the handoff
envelope and route by `reason_code`. Do not re-narrate hash/structure rules here.
```

**STOP trigger 写法——good vs bad：**

| | 写法 | 问题 |
|---|---|---|
| ❌ bad | `更多细节见 references/mode-rules.md` | 无触发时机、软措辞，模型不知何时读 → trigger failure |
| ✅ good | `STOP. Before dispatching any reviewer, read references/mode-rules.md.`（配 fallback：未读则按 report-only 保守处理；配 eval：一个 dispatch 场景 + 一个 bare-prompt 不触发场景） | 四件套齐全、可测试 |

**Body-L1 behavioral anchor——压短但不删除：**

```markdown
Before:
"While executing a shipping task pack, it is very important that you avoid drifting
into adjacent work. You should always remember the validated task pack is the
boundary, and you should not declare work complete unless the verification evidence
has actually been observed."

After:
"Stay inside the validated task-pack boundary; declare completion only from observed
verification evidence."
```

**description——good vs bad：**

```
❌ bad（128 词，功能说明）:
"This skill helps you ship widgets. It can validate task packs, run mode detection,
 produce headless output, handle branch setup, and much more. Use it whenever ..."

✅ good（trigger + exclude + 定位）:
"Execute a validated widget-shipping task pack in-repo. Trigger on 'ship widgets',
 'run the shipping pack'. Exclude planning, code review, and unresolved WHAT
 (route to spec-plan / spec-code-review)."
```

## 27.5 Step 3 loader 探针（contingent 收益的前置）

只读查明：Claude eager-inline `@./references`（转 lazy 才省 token）；某 CLI 宿主按字面文本处理（本就不占 activation 预算）。据此决定哪些 `@./` entry 转 lazy，且只对 eager-inline 宿主计 token 收益。

## 27.6 Step 5–6 验证与 closeout（诚实分级）

```
line-count: 600 → 190 行 spine + 3 references            [confirmed]
context-room: Claude 惰性宿主 -~2.1k token/激活          [contingent-on-loader-behavior，探针已证]
                其它宿主 无 activation 节省，仅可读性     [contingent]
not-run 率改善                                            [hypothesis，待 stats 计划采集]
Evidence Matrix: 只实施 implementation_permission=ready 的 task-pack candidate；dispatch candidate 延后补 negative eval；description blocked 不动
边界: mutation/verification/handoff 全部保留在 spine      [gate ✓]
STOP trigger: 3 个 moved reference 各配四件套             [gate ✓]
fresh-source eval: 已跑，trigger precision/边界无回归      [gate ✓]
negative eval: false dispatch、missed reference trigger、degraded closeout 均覆盖
eval_adequacy: L3 before/after（同一 case 改前/改后对比，覆盖 protected behavior）
成功判据: 边界保留 + 无回归 + delta 记录 → 达成
```

## 27.7 这个样板演示了什么

- 帕累托：先动最重的 task-pack prose 与 mode 矩阵，不碰已经健康的部分。
- 确定性下沉：40 行 → 4 行 CLI handoff，省 token 且兑现 deterministic floor。
- 二阶思维：每个下沉都配 STOP 四件套，防 trigger failure 静默回归。
- 收益分级 + 地图≠疆域：line-count 是 confirmed，token 收益标 contingent、按宿主报，not-run 归 hypothesis。
- gate 出口：fresh-source eval 通过才允许删 spine 承重文本。
