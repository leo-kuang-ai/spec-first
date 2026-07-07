# Skill Prompt 设计与优化方法论 · 通用版（host / 项目中立）

> **这是什么：** 一套**不依赖任何具体项目/CLI**的 Agent Skill 设计与优化方法论。它只假设
> Agent Skills 标准本身：一个 skill = `SKILL.md`（frontmatter `name`+`description`）+ 可选
> `references/` 与 `scripts/`；**宿主拥有发现与路由**，正文与 references 支持渐进披露。
> 任何用 Claude Code / Codex / 兼容宿主的 skill 体系都可直接套用。
>
> **与 spec-first 专属版的关系：** 本文是**通用内核**。spec-first 项目的适配层（`spec-first
> init` runtime 投射、source/runtime mirror 纪律、`spec-*` 入口治理、与 `spec-skill-audit`
> rubric / 角色契约对齐、task-pack CLI handoff 等）见 `skill-prompt-设计与优化方法论-v2.md`。
> 落到你自己的项目时：**保留本文全部内核，把「项目适配层」（§8、§21）换成你项目的等价机制。**
>
> **覆盖三件事：** 第一部分（§0–§10）优化既有 skill；第二部分（§11–§22）从零设计 skill；
> 第三部分（§23–§26）决策模型透镜；§27 端到端样板。
>
> **阅读导引：** 新写 skill → 先读第二部分再回第一部分核对边界；精简既有 skill → 读第一部分；
> 想看「照着做一遍」→ 跳 §27。

---

## 术语锚点（先读）

| 术语 | 含义 |
|---|---|
| **两轴成本** | skill 的两条正交 token 成本轴：Activation index（frontmatter `description`，每次对话都付的常驻税）与 Active body（`SKILL.md` 正文 + references，触发后才付的条件税）。见 §1.1。 |
| **四类正文模型** | 正文分四类：L1 contract/gate（保留）、L1 behavioral anchor（压短不删）、L2（移 reference）、L3（删）。见 §1.2。`L1/L2/L3` **只**指正文层级；渐进披露的 metadata/body/resources 三级不用 L 编号，以免混淆。 |
| **behavioral anchor** | 抽象但会改变 agent 行为走向的原则/反模式短句（reproduce-first、scope adherence 等）；非 gate，但删除会增加走错路径概率，只能压短不能当叙事删。 |
| **STOP trigger 四件套** | 每次把内容移进 reference 必配的四要素：`trigger_condition` / `must_read` / `fallback_if_unread` / `eval_case`。见 §2 原则 2。 |
| **fresh eval** | 把**当前磁盘上的** skill 源注入一个全新实例来评估行为，不依赖当前会话已缓存的定义。行为等价的真相源。 |
| **确定性下沉** | 把可确定性判定的校验（hash/结构/路径）交给工具（脚本/CLI/linter），prompt 只消费其结构化输出（如 `--json` + `reason_code`），不用 prose 复述规则。见 §2 原则 3。 |
| **loader 探针** | 只读查明「本宿主如何加载 references（eager-inline / lazy / 字面文本）」的前置调查，决定哪些下沉真省 token。见 §8/§2 原则 8。 |
| **premise baseline** | 优化前用**已有**证据（历史运行日志/指标）建的一次性只读 before 快照，用于破解「无法自证价值」。见 §2 原则 7。 |
| **reason_code 注册表** | 项目内所有降级/阻断码的集中枚举，见 §7.1；新增码先登记再引用。 |

---

## 0. 一句话结论

> Skill prompt 优化不是「把 prompt 改短」，而是**按加载时机与成本重排信息层级、同时保全承重边界、并把不可逆编辑 gate 在证据上**。行数/token 下降是经济性**指标**，永远不是 completion **gate**。

一次优化若让 skill 更短却丢了边界、或用「行数下降」冒充「质量/token 收益」，那是退步而非优化。

---

## 1. 两个心智模型

### 1.1 两轴成本模型：Activation index vs Active body

| | Activation index（description 轴） | Active body（正文轴） |
|---|---|---|
| 载体 | frontmatter `description` | `SKILL.md` 正文 + references |
| 成本性质 | **无条件税**：每次对话都付（用于路由发现） | **条件税**：仅该 skill 被触发后才付 |
| 影响 | 对话一开始就占常驻上下文、影响路由命中 | 触发后挤压用户代码/上下文预算 |
| 优化手法 | description 路由器化（trigger + exclude + 定位），压缩把功能说明写进描述的 offender | 渐进披露（body → references）、确定性下沉、删冗余 |
| 归属边界 | 文本归你；**发现/路由/懒加载归宿主** | 全部归你 |

**教训：** 两轴触及的范围、影响面、验证方式都不同。塞进同一次优化会让收益无法分开报告、失败难归因。**正交维度应拆成独立单元/独立批次。**

### 1.2 四类正文判断模型

对正文每一段先分类再决定去留：

- **L1 contract/gate（spine，保留）：** workflow contract 摘要、热路径步骤骨架、Reference Trigger Map、**hard boundaries**（写删/验证/交接/不可逆动作纪律）。每次触发都必须在场。
- **L1 behavioral anchor（压短不删）：** 抽象但影响行为走向的原则句/反模式提醒（reproduce-first、scope adherence、evidence-first…）。非 gate，但删了会增加跳步、扩大 scope、过早执行、伪造验证的概率。
- **L2（移 reference）：** 只在特定 phase/mode/条件才需要的详细步骤、mode 矩阵、大输出模板。移动时**必须**配 STOP trigger 四件套。
- **L3（删）：** 背景叙事、通用建议、重复原则、过期细节、冗余例子。删后不得造成步骤/契约/边界缺失。

**判据：** L1 gate=「不在场就出错」；behavioral anchor=「删掉更容易走错方向」；L2=「多数运行用不到但需要时必须可达」；L3=「删了无行为损失」。分不清 L1/L2 默认留 spine；分不清 anchor/L3 先压短不删。

---

## 2. 九条可迁移原则

> **本节是本方法论的 single source of truth（SSOT）。** §5/§6/§7/§10/§22 都是它面向不同消费者的**派生视图**；冲突以本节为准。改规则先改这里，再更新派生视图。

### 原则 1 — 边界保全优先于体量下降
hard boundary（写删/验证/交接/不可逆动作纪律）是**承重墙**，只能移位置（进 reference 且有 STOP trigger），不能删、不能只藏进 reference 而 spine 无触发。behavioral anchor 只能压缩/合并/改写，不能当抽象原则直接删。行数预算是 advisory，不是 hard gate；真正的 completion gate 见 §7。

### 原则 2 — STOP trigger 是承重契约文本，不是普通指针
渐进披露的失败点是 **trigger failure**（模型不知道何时该读 reference），不是 reference 数量。每次 extraction 必须**四件套**齐全：

- `trigger_condition`：具体到可测试的触发时机（`STOP. Before X, read references/Y.md`）。
- `must_read`：强指令，非「if applicable」软措辞。
- `fallback_if_unread`：未读时的安全降级。
- `eval_case`：至少一个触发场景 + 一个不触发场景。

四件套**全填**的最小样例（勿只写字段名）：

```
trigger_condition: STOP. Before dispatching any reviewer, read references/mode-rules.md.
must_read:          dispatch 前必须读（非 "if applicable"）。
fallback_if_unread: 未读到 mode-rules 时按最保守模式处理，不产生副作用。
eval_case:          触发=「review this PR」应读；不触发=「解释这段代码」不应读。
```

**关键区分：** 静态测试只能证明「STOP 语句存在」；「模型是否真按触发读取」属行为保证，依赖 fresh eval。别把结构断言当行为保证。

### 原则 3 — 确定性下沉：消费工具输出，而不是用 prose 复述
若 prompt 用自然语言重述一段**工具已确定性执行**的逻辑（hash/结构/路径校验），这是把工具职责写回 prompt。正确做法：让 prompt 运行你的校验工具（`<validator> --json`），只在其「通过」信号为真时进入语义判断，失败按 `reason_code` 停止并交还结果。**工具强制确定性不变量、准备事实；LLM 判断这层地板之上的语义充分性。** 红线：不让工具裁决语义，不让 prompt 伪造确定性。

### 原则 4 — 收益可信度分级：confirmed / contingent / hypothesis
- **confirmed**（`wc -l` 行数、结构 delta）→ 直接作为经济性指标。
- **contingent**（activation-token 节省，取决于宿主是否惰性加载 references）→ 标 `contingent-on-loader-behavior`，**按宿主分别记录**，注明验证路径。
- **hypothesis**（质量/成功率改善）→ 标待验证、给采集路径、**不计入本轮验收**。

反模式：把 line-count delta 冒充 token 收益；把 contingent 写成 confirmed；用单一数字掩盖 per-host 差异。

### 原则 5 — 宿主 primitive 不重建
skill 发现、域索引、语义路由、懒加载、skill 联邦——都是**宿主拥有**的 primitive，正在商品化。你只拥有 description 文本、body、references（及可选的 runtime 投射）。**明确拒绝**自建这些能力；价值上移到宿主不拥有的层：证据/验证闭环、source 纪律、治理外显。

### 原则 6 — Gate 出口，不 gate 思考
- 不可逆动作（删/迁移 spine 承重文本、写删、声明完成）→ 必须有 confirmed evidence（fresh eval / read-only 复核）。无证据时**降级为可逆动作**（只新增 reference + trigger，原文保留），而不是放行。
- 可逆动作（新增 reference、加 trigger map）→ 自由进行。

缺自动强制能力时，verification/handoff gate 降级为**响亮约定**：显式声明「未强制及原因」，不静默放行、不伪造已强制。

### 原则 7 — 证据先行，警惕「自我封闭」
区分**已证实前提**（体量/重复/超上限，可复核 → confirmed）与**待验证前提**（膨胀→质量下降的因果链，常是推测 → hypothesis）。**自我封闭反模式**：把成功判据收窄到「无回归」、又把唯一能证伪价值的测量层 defer 掉——它无法证明自己值得做。破解：用已有证据建 premise baseline（零改动 before 快照），并给 deferred 验证一个 **committed trigger**（明确「什么条件下从 hypothesis 变 confirmed」）。

### 原则 8 — 只读探针前置
当收益依赖一个**尚未查明的事实**（如「本宿主如何加载 references」），把查明它的**只读探针前置**，而不是把收益全 gate 到流程末尾。探针 read-only、可并行、零副作用；它产出的 per-host 事实让下游 extraction 首轮就做出正确、可兑现收益的转换。

### 原则 9 — Source 纪律（若有 runtime 投射，则条件适用）
**若**你的 skill 从 source 编译/投射到 runtime mirror（多宿主生成目录），则：永远改 source，不手改 generated mirror；需要刷新用你项目的再生成命令；移动 references 时用再生成器能处理的路径形式；投射验证只观察生成结果，不手改 mirror 制造通过。**若**你的 skill 只有单一 source、无投射层，本原则退化为「就地编辑 + 版本控制」，无需 mirror 纪律。

---

## 3. 可复用作业流程（Playbook）

按序执行。每步都可因证据不足而**诚实降级**，但不得跳过或伪造。

**先问「该不该优化」（对活动本身用奥卡姆）：** 一个已单一职责、行数不大（<300 行为 advisory 经验参考，非硬阈值）、无跨 skill 重复、无治理债的 skill，不必为「更短」而动它。优化是还债，不是刷指标。

### Step 0 — 建立 baseline 与 Evidence Matrix
- **Body baseline：** `SKILL.md` 行数、references 清单、每个 reference 的 STOP trigger。
- **Index baseline：** `description` 字符/词/估算 token、是否有 exclude intent、与相邻 skill 的重叠词。
- baseline 无法完整建立时记 `baseline_degraded:<reason>`，不阻断，但 closeout 必须暴露。
- **候选项矩阵（Scenario × Skill × Evidence，planning 表非 schema）：** 逐候选记录 `skill / scenario / compression_candidate / classification（L1 gate|L1 anchor|L2|L3） / protected_behavior / trigger_condition / existing_eval_refs / missing_negative_cases / implementation_permission（blocked|candidate|ready）`。只有 `ready` 才进入不可逆删除或承重迁移。

### Step 1 — 内容分类
逐段打标签：L1 contract/gate 保留 / L1 behavioral anchor 压短保留 / L2 待迁移 / L3 待删 / Activation index。分不清 L1/L2 默认 L1；分不清 anchor/L3 先压短不删。

### Step 2 — 识别确定性下沉候选（原则 3）
找出「用 prose 复述工具已确定性执行的逻辑」的段落，标为工具-handoff 候选。确认工具已输出执行者真正需要的字段，否则不新增工具。

### Step 3 — 前置只读探针（原则 8，按需）
若收益依赖未查明的宿主/runtime 事实（loader 行为、投射面），先做只读探针产出 per-host 事实表，供 Step 4 决策。

### Step 4 — 执行重排
- L2 → `references/`，每个配 STOP trigger 四件套。
- L3 → 删除（确认无边界损失）。
- 确定性下沉候选 → 改为消费工具输出 + `reason_code`。
- **不可逆删除/迁移 spine 承重文本前，先满足原则 6 的证据 gate**；证据不足则只做可逆新增。

### Step 5 — 验证（静态形状 + 行为 + 投射）
- **静态测试：** prompt shape（trigger map 存在、每个 moved reference 被命名、无 stale eager include、无手改 mirror 指令）+（若有投射）path rewrite。脚本只证结构与覆盖。
- **行为验证：** fresh eval 或等价 read-only 复核，覆盖边界/不可逆动作 gate/交接/trigger precision。未跑记 `eval_not_run:<reason>`，且此时不得删 spine 承重文本。
- **投射验证（若有）：** 只经再生成命令观察，不手改 mirror。

### Step 5b — 证据分级（adequacy）与反例优先
按最高可证明等级声明收益：

| 等级 | 含义 | 允许声明 |
|---|---|---|
| L0 none | 无对应 case | 不足以改承重内容 |
| L1 structural | 只证结构（字段/trigger/path）存在 | 低风险 prose 调整；不能声明行为等价 |
| L2 semantic sample | fresh eval / 人工抽样检查过语义 | 中风险下沉；记录样本限制 |
| L3 before/after | 同一 case 改前后对比、覆盖 protected behavior | 声明该样本范围内未退化 |
| L4 production evidence | 真实运行/反馈闭环支持 | 才能声明质量/趋势改善 |

**Negative eval 优先于 happy path：** 精简最容易静默破坏的是误触发、漏触发、边界丢失、未读 reference——这些反例比正常路径更该先覆盖。

### Step 6 — 诚实 closeout
报告：exact line-count delta（confirmed）·按宿主的 context-room delta（contingent）·trigger/eval/static-test 结果·fresh eval / 投射 smoke 结果或 degraded reason·created references 清单 + 有意保留的 load-bearing text·before baseline 引用·成功判据（边界保留 + 无回归 + delta 记录）·deferred 项及 committed trigger·全部 reason_code。

---

## 4. Pilot 与 rollout 纪律

- **先做一个 evidence-ready 单点 pilot：** 只选矩阵中 `implementation_permission: ready` 的一个候选，跑通完整闭环；通过后再选第二个代表性 skill 验证可迁移，再考虑批量 rollout。
- **批量 rollout 是 outcome-gated：** 只有 pilot closeout 产出可信 outcome 后才推广；证据不足以 `rollout_blocked_pending_evidence` 收尾。
- **拆分要拆干净：** 正交维度拆到独立批次时，检查是否共享同一批文件写入权（同一 rubric、同一 eval glob）。若共享，显式约定文件归属 + 落地顺序 + 命名隔离，否则并行会互相覆盖。

---

## 5. 反模式清单

> 派生视图：§2 的「反面」快查，冲突以 §2 为准。

- ❌ 一次性机械压缩所有 skill（churn 最大化、regression 难归因）。
- ❌ 自动 LLM 压缩（省 token 但不能证明边界保全）。
- ❌ 为「优化」新增 schema/contract（优先扩展现有 owner）。
- ❌ 把行数/token 当 hard gate，为凑预算删 load-bearing text。
- ❌ 把 hard boundary 删除或只藏进 reference 而 spine 无 trigger。
- ❌ 把 line-count 冒充 token 收益；把 contingent 写成 confirmed。
- ❌ 混淆 index 与 body 两轴收益。
- ❌ 自建宿主级发现/路由/联邦。
- ❌ 只凭「reference 存在」判断成功（真失败点是 trigger failure）。
- ❌ 自我封闭 pilot（把唯一能证伪的测量 defer 掉且无 committed trigger）。
- ❌ 手改 generated mirror 作为修复/验证。
- ❌ 为凑 description 长度砍掉相邻 skill 的 exclude intent（误触发比漏触发更伤）。

---

## 6. 阻断条件

> 派生视图：§2 + §7 的硬性出口，冲突以 §2/§7 为准。

- 缺 baseline 且未记 degraded reason。
- reference 无 spine STOP trigger。
- hard boundary 被删或只藏入 reference。
- behavioral anchor 被当 L3 删且未用 eval/reviewer 证明不增加错误路径。
- 脚本试图裁决自然语言语义（路由/质量/finding 成立性）。
- 迁移/删除 spine 承重文本却缺 fresh eval（未跑时只允许可逆新增）。
- 手改 generated mirror 作为修复/验证。
- fresh/read-only eval 未执行且 closeout 未记 reason_code。

---

## 7. 指标 vs Gate

| 类别 | 项 | 用途 |
|---|---|---|
| 经济性指标（advisory） | line-count / context-room / description token delta | 记录、观察趋势；**永不**单独作为 gate |
| Gate · 可确定性强制 | STOP 语句存在、focused tests 通过、投射/path rewrite 通过、无手改 mirror | 脚本/CI 可判，不通过即 fail |
| Gate · reviewer/LLM 语义判定 | 边界（语义）保留、行为无回归、trigger precision、honest closeout | deterministic floor **之上**的语义判断；缺强制时降级为响亮约定（显式声明未强制及原因），不静默放行 |

一句话：**用指标证明「更省」，用 gate 证明「没坏」；机器能判的硬 fail，机器判不了的交 reviewer/LLM 并诚实降级。**

### 7.1 reason_code / status 注册表（示例，按项目补全）

集中枚举，各处引用即指此处；新增码先登记再引用。以下为通用示例，落项目时替换为你的实际码：

| code / tag | 类型 | 触发条件 | 处置 |
|---|---|---|---|
| `baseline_degraded:<reason>` | reason_code | baseline 无法完整建立 | 不阻断，closeout 暴露 |
| `eval_not_run:<reason>` | reason_code | 未跑 fresh/行为 eval | 只允许可逆新增，closeout 写明 |
| `loader_unverified:<host>` | reason_code | 某宿主 loader 行为无法只读证明 | 该宿主对应 entry 保持显式 |
| `rollout_blocked_pending_evidence` | reason_code | pilot 证据不足 | 不进入批量推广 |
| `contingent-on-loader-behavior` | status tag | 收益取决于宿主惰性加载 | 按宿主分别记录，未证不写 confirmed |

---

## 8. 项目适配层（落地时替换为你项目的等价机制）

本方法论的通用内核（§0–§7、第二/三部分）项目中立。以下几点**依赖你项目**，需替换填充：

- **确定性工具（原则 3）：** 你的校验 CLI/脚本/linter 及其 `--json` 输出契约（对应「`<validator> --json` + `reason_code`」）。
- **runtime 投射（原则 9）：** 你的 skill 是否 source→runtime 投射；若是，填你的再生成命令与 mirror 路径纪律；若否，忽略 mirror 相关条目。
- **fresh eval 手段：** 你如何把当前 source 注入全新实例复核（subagent / 独立会话 / 人工 read-only）。
- **质量/审查对齐：** 你项目已有的 skill 质量 rubric、审查方法、价值/风格基线（若有），本方法论是其「怎么改」的补充。
- **入口/命名治理：** 你的 skill 命名与公开入口规范、internal helper 是否暴露。

（spec-first 项目的这些适配已在 `skill-prompt-设计与优化方法论-v2.md` 填好，可作填充范例。）

---

## 9. 外部依据（advisory）

主依据：Anthropic 官方 [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)、[Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)、OpenAI Codex [Agent Skills](https://developers.openai.com/codex/skills) 与 [AGENTS.md 指南](https://developers.openai.com/codex/guides/agents-md)。仅作 advisory：

- 三级渐进披露（metadata 常驻预加载 / SKILL.md 触发时读 / resources 按需读；不用 L 编号以免与本文 Body-L1/L2/L3 混淆）是 Agent Skills 基础架构；正文建议 <500 行、references 一层深、>100 行 reference 带 TOC。
- description 是发现元数据：第三人称、含 what+when+触发词、≤1024 字符；name 建议动名词、≤64 字符、禁保留字。
- 设计纪律：先建 eval 再写正文；自由度匹配任务脆弱性；只加模型不知道的、术语一致、避免时效信息与过多选项；脚本 solve-don't-punt、无 voodoo constants、plan-validate-execute。
- 单体化（全塞进一个长 `SKILL.md`）是最常见失败；用 Author/User 双实例迭代、跨模型测试，而非主观「读起来更好」。

**刷新规则：** `last_verified: 2026-07-07`。宿主加载机制/description 限制/reference 读取行为变化时须重新核对，不把历史外部资料当作当前 runtime contract。（本章为改写摘要，已按许可要求改写。）

---

## 10. 速查（优化 TL;DR checklist）

> 派生视图：§0–§9 的快查；权威定义在对应章节。

- [ ] 先判断「该不该优化」——无真实债就不动
- [ ] 建 baseline（body 行数/references/triggers；index description token/exclude）+ Evidence Matrix（标 `implementation_permission`）
- [ ] 分类 L1 gate（留）/ anchor（压短）/ L2（迁 reference + STOP）/ L3（删）；index/body 分开
- [ ] prose 复述工具的段落 → 改消费工具 `--json` + reason_code
- [ ] 收益依赖未知事实 → 先做只读探针（per-host）
- [ ] 每个 moved reference 有 trigger 四件套（全填）
- [ ] hard boundary 全部留 spine（或有 STOP trigger 的 reference）；anchor 未被当叙事删
- [ ] 不可逆删除前有 fresh eval；否则只做可逆新增
- [ ] 静态 + 行为 eval 都覆盖（含 negative cases），标注 adequacy L0–L4
- [ ] 收益按 confirmed/contingent/hypothesis 分级、按宿主报告
- [ ] closeout 诚实：delta + degraded reason_code + deferred 项的 committed trigger
- [ ] 未自建宿主 primitive；（若有投射）未手改 mirror；已记录变更

---

# 第二部分 · 设计方法论：从零写好一个 skill

> 前十节讲「改好既有 skill」；本部分讲「从零设计」。二者互补：**设计决定上限，优化只是把设计欠的债还回来。** 一个 evaluation-driven、单一职责、信息架构清晰的 skill 从一开始就不需要大规模瘦身。本部分基于 Anthropic/Codex 官方 authoring best practices。

## 11. Evaluation-driven：先写 eval，再写正文
最强的一条设计纪律：**写大量正文之前先建 eval**，确保 skill 解决真实问题而非想象需求。
1. **识别 gap：** 让模型在**没有该 skill** 时跑代表性任务，记录失败与缺失上下文。
2. **建 3 个评测场景：** query + 输入 + expected_behavior 列表。
3. **测 baseline：** 记录无 skill 时的表现。
4. **写最小正文：** 只写足以补齐 gap、通过 eval 的内容。
5. **迭代：** 跑 eval、对照 baseline、精修。

eval 是 skill 有效性的**真相源**；设计期就把 eval fixtures 建起来，后续优化才有对照，避免「读起来更好」式主观判断。

## 12. 单一职责 + 紧扉边界（trigger / non-trigger）
- **一个 skill 只做一件事**；宁可拆成可串联的小 skill，不做万能大 skill。单体化是最常见失败。
- 设计期就想清 **should-trigger** 与 **should-not-trigger** 两组意图。**边界相邻的 skill 越多，exclude intent 越是必付的 token**——误触发比漏触发更伤。

## 13. Frontmatter 设计：name 与 description
frontmatter 是**唯一常驻**的部分（Activation index），每次对话都注入，是路由发现的全部依据。

| 字段 | 官方约束 | 写法要点 |
|---|---|---|
| `name` | ≤64 字符，仅小写字母/数字/连字符，禁保留字，禁 XML | 建议**动名词**（`processing-pdfs`）；避免 `helper`/`utils`/`tools` 空词 |
| `description` | ≤1024 字符，非空，禁 XML，**第三人称** | 必含 **what + when + 具体触发词**；第三人称（被注入 system prompt，「I can…」「You can…」破坏发现） |

**description 是路由器，不是说明书：** 收敛为「trigger + exclude + 一句定位」三段各自最短，功能说明/案例留给正文；不为凑长度砍掉相邻 skill 的 exclude intent。

## 14. 自由度设计（Degrees of freedom）
按任务的**脆弱性与可变性**匹配指令具体程度：

| 自由度 | 何时用 | 形式 |
|---|---|---|
| 高（多路都通） | 多解法有效、依赖上下文 | 文字化启发式步骤 |
| 中（有偏好路径） | 有推荐 pattern、允许变体 | 带参数的伪代码/模板 |
| 低（悬崖窄桥） | 操作脆弱、必须一致/按序 | 精确脚本，禁改命令/加 flag → **确定性下沉**（§2 原则 3） |

要点：把确定性操作交给低自由度脚本，把语义判断留给高自由度文字。

## 15. 正文信息架构（Progressive disclosure by design）
把 `SKILL.md` 当「目录页」，指向按需加载的详情：
- **正文 <500 行**（advisory）；接近就拆。
- **references 一层深**：全部从 `SKILL.md` 直链；深层嵌套会导致模型部分读取、信息不全。
- **>100 行 reference 带目录（TOC）**。
- **按 domain 组织** references，让某类任务只加载相关部分。
- **conditional details**：基础留正文，高级/条件外置（对应 L2 + STOP trigger）。

## 16. Workflow、feedback loop 与 checklist 模式
- **复杂任务拆成清晰有序步骤**；特别复杂的给一份可复制、逐项打勾的 **checklist**。
- **feedback loop**：`跑校验 → 修错 → 重跑`，通过才继续；校验器可以是脚本或供自检的 reference。

## 17. 三个高频正文模式
- **Template：** 给输出格式模板，严格度按需（严格用 `ALWAYS use this exact template`，灵活给「默认 + 可调」）。
- **Examples：** 输出质量依赖示例时，给**输入/输出对**，比纯描述更能传达风格与颗粒度。
- **Conditional workflow：** 用决策点分流；分支大时推到独立文件按任务读。

## 18. 内容卫生（Concise by design）
信条：**上下文窗口是公共品，默认模型已经很聪明。** 每段自问「模型真不知道吗？值它占的 token 吗？」
- 只加模型**没有**的上下文，不解释常识。
- **术语一致**：一个概念一个词。
- **不写时效性信息**：用可折叠「Old patterns / deprecated」承载历史。
- **不堆选项**：给一个默认 + 一个逃生出口。

## 19. 脚本设计（若 skill 含可执行代码）
- **Solve, don't punt：** 脚本自己处理错误，而非抛错让模型现场猜。
- **无 voodoo constants：** 每个配置值自解释（`REQUEST_TIMEOUT = 30 # 慢连接留余量`）。
- **优先 utility 脚本**供**执行**（省 token、可靠、一致），明确标「执行」还是「参考阅读」。
- **plan-validate-execute：** 高风险/批量操作先产结构化 plan → 校验 → 执行 → 验证（可验证中间产物）。

## 20. 迭代与观察（Author / User 双实例）
- **Author 实例**帮写/精修；**User 实例**（全新、加载该 skill）真实使用；观察行为带回作者侧。
- **观察四个信号**：意外探索路径（结构不直觉）、错过链接（指针不显眼）、过度依赖某文件（该内容也许该进正文）、从不访问某文件（多余或信号太弱）。
- **跨模型测试**：对强模型刚好的，可能对快模型不够。
- 观察须用 **fresh eval**（注入当前 source），不依赖同会话缓存定义。

## 21. 项目适配层锚点（指针）
设计期还需满足你项目的治理约束——这些**依赖项目**，见 **§8 项目适配层**：确定性工具契约、runtime 投射纪律（若有）、fresh eval 手段、质量/审查对齐、入口/命名治理。通用内核（§1–§7、§11–§20）不依赖它们。

## 22. 设计 checklist

> 派生视图：§11–§21 的快查，权威定义在对应章节。

**发现与边界**
- [ ] name 动名词、≤64、无保留字
- [ ] description 第三人称、≤1024、含 what+when+触发词、含相邻 skill 的 exclude intent
- [ ] 单一职责，should-trigger / should-not-trigger 清晰

**信息架构**
- [ ] 正文 <500 行；`SKILL.md` 是目录页
- [ ] references 一层深；>100 行带 TOC
- [ ] L1 gate（含 hard boundary）留正文；behavioral anchor 压短不删；L2 带 STOP trigger 外置；无 L3 冗余
- [ ] 自由度与任务脆弱性匹配

**内容质量**
- [ ] 只写模型不知道的；术语一致；无时效信息
- [ ] 不堆选项，给默认 + 逃生出口；示例是具体 input/output 对
- [ ] 复杂流程有有序步骤 + 可复制 checklist；质量关键处有 feedback loop

**脚本（如有）**
- [ ] solve don't punt；无 voodoo constants；utility 脚本标明执行/参考；plan-validate-execute

**验证与治理**
- [ ] ≥3 个 eval + baseline；覆盖 negative cases 并标 L0–L4 等级
- [ ] 跨模型测试；用 fresh eval 观察双实例行为
- [ ] 项目适配层（§8）约束满足；（若有投射）未手改 mirror；已记录变更

---

# 第三部分 · 决策模型透镜

> 只取能锐化 **skill prompt 设计/优化**这一元活动的模型；选哪些进来本身就是对模型集合用**奥卡姆 + 帕累托**，不堆砌。

## 23. 核心透镜

| 思维模型 | 对 skill 设计/优化的启发 | 对应本文 | 一句话 |
|---|---|---|---|
| **古德哈特定律** | 指标一旦变目标就不再是好指标——把行数/token 当 hard gate，人就删承重文本去凑数。这是「行数是 advisory 非 gate」的根本理由。 | §0、§7 | 度量用来观察，不用来考核 |
| **地图不是疆域** | source ≠ 运行行为；结构测试通过 ≠ 行为等价；line-count ≠ token 收益。结构正确都要用现实校准。 | §2 原则 2/4、§5b | 别把 prompt 当成模型真实行为 |
| **奥卡姆剃刀** | 最少机制覆盖真实需求：不新增 schema、不堆选项、不做防御性冗余；能复用现有 owner 就不造新的。 | §5、§18、§21 | 简单不是简陋，是没有多余假设 |
| **帕累托 80/20** | 20% 内容（spine + hard boundary）承载 80% 价值；先 pilot 最重的少数 skill，不做全量机械瘦身。 | §4、§1.2 | 先啃最重、最承重的 |
| **边际效用递减** | 压到某点后，继续压的边际收益 < 引入 trigger failure 的风险；压缩要有停止条件。 | §2 原则 1、§7 | 最短不等于最优 |
| **二阶思维** | 移进 reference 的二阶后果是 trigger failure → 静默回归；删 prose 的二阶后果是 degraded 时丢了「为什么」。所以 extraction 必配四件套。 | §2 原则 2、§6 | 问一句「然后呢？会静默坏吗？」 |
| **第一性原理** | 设计先问「这个 skill 不可再拆的职责是什么」，从底层重建而非继承膨胀；区分 gate/anchor/条件细节/可删叙事。 | §11、§12、§1.2 | 从零设计你会怎么写 |
| **公地悲剧** | 上下文窗口是**公共品**；每个 skill 过度占用 context 就是公地悲剧。两轴成本 + index 治理是给公共资源设边界。 | §1.1、§18 | 你的 token 在和所有人抢座位 |
| **创造性破坏 / 商品化** | 宿主 primitive（发现/路由/懒加载）正在商品化；不重建，被替代的能力评估退役。 | §2 原则 5 | 别造宿主即将免费给的轮子 |
| **蝴蝶效应** | 一个 STOP trigger 的歧义、一处被砍的 exclude intent，会在多 agent 协作里放大成误路由/漏读。 | §2 原则 2、§12 | 小歧义会被系统放大 |

## 24. 安全与取舍透镜（防翻车）

| 模型 | 用法 | 对应本文 |
|---|---|---|
| **逆向 Inversion** | 不问「怎么让瘦身更好」，问「这次瘦身会怎样**静默搞坏**它」——主动构造失败场景。 | §5b、§6 |
| **事前验尸 Pre-mortem** | 交付前假设「它已失败」：哪条 hard boundary 下沉后没人读？哪个宿主 loader 其实不惰性？倒推补 gate。 | §3 Step 6、§6 |
| **MECE** | reference 拆分要**不重叠不遗漏**：按 domain 组织、避免同 glob/同文件多批次共写。 | §15、§4 |
| **约束理论 ToC** | 找真瓶颈：约束往往不是行数，而是 **trigger 可靠性 / 宿主 loader 行为**；优化瓶颈比压行数更有效。 | §2 原则 8 |
| **信息价值 VoI** | 优先获取又便宜又高价值的信息：premise baseline、loader 探针都是零改动却改变下游决策的高 VoI 动作，理应前置。 | §2 原则 7/8 |
| **Cynefin / 自由度** | 清晰确定 → 低自由度脚本；复杂涌现 → 高自由度启发式 + 探针试错。 | §14 |
| **复利 / 临界点** | pilot 沉淀的可复用 test/eval pattern 在 rollout 复利；index 税随 skill 数增长会越阈值，治理不能等「危险了」才做。 | §4、§1.1 |
| **回归均值 / 大数定律** | 一次 fresh eval 通过 ≠ 行为稳定；别用单次好结果宣称等价，必要时多样本/跨模型复核。 | §5b、§20 |

## 25. 组合用法

**设计新 skill：** 第一性原理（不可再拆的职责）→ evaluation-driven（先写 eval）→ 奥卡姆（最少机制）→ 公地悲剧（写最短）→ Cynefin/自由度（脆弱操作低自由度）→ 二阶思维（边界/trigger 若失效下游如何）→ 逆向 + pre-mortem（假设已失败补 gate）。

**精简既有 skill：** 帕累托（先挑最重 offender）→ 地图≠疆域（先建 baseline）→ 约束理论 + 信息价值（前置探针攻真瓶颈）→ 二阶思维（trigger failure 风险）→ 边际效用递减（压到边际收益<风险就停）→ 古德哈特（行数只作指标）→ 逆向/pre-mortem（不可逆删除前 fresh eval 证等价）→ MECE（多批次共写切干净）。

## 26. 不引入的模型（保持克制）
对 **workflow 运行时**有价值、但对 **skill prompt 设计/优化**这一元活动不引入核心（对模型集合本身用奥卡姆）：
- **JTBD / RICE / Wardley / North Star / AARRR / 情景规划：** 产品需求与增长战略，属产品/roadmap 层。
- **社会认同：** 采纳信任信号，属发布/采纳层。
- **基准率 / 贝叶斯 / 竞争假设 ACH：** review/debug 的**运行时**证据推理，属那些 workflow。
- **六顶思考帽 / 艾森豪威尔 / OODA / RAPID：** 会议协作、时间管理、执行循环、权责，与 skill 文本设计正交。

判据：一个模型是否进本方法论，只看它是否直接锐化 **skill 的发现/边界/信息架构/自由度/收益分级/验证** 之一。

---

# §27 端到端样板：把方法走一遍长什么样

> **性质声明：** 以下是**代表性 composite 示例**，演示流程，**不是对任何真实 skill 的断言**。真实优化必须按 §3 Step 0 重新读源建 baseline。

## 27.1 场景
虚构执行型 skill `shipping-widgets`，`SKILL.md` 约 600 行：校验规则用 40 行 prose 复述、mode 矩阵与大输出模板常驻正文、混入「什么是 CI/CD」式背景叙事、description 128 词把功能说明写进去了。

## 27.2 Step 0 baseline（confirmed）
```
body: 600 行；references/ 已存在 1 个，但正文仍全量承载
index: description 128 词 / ~190 token；无 exclude intent；与相邻 skill 有 3 个重叠触发词
```

## 27.3 Step 1 分类（节选）
| 段落 | 分类 | 依据 |
|---|---|---|
| 校验规则 40 行 prose | 确定性下沉候选 | 工具已确定性执行（原则 3） |
| 写删/验证/交接边界 | L1 gate | 承重墙 |
| mode 矩阵、大输出模板 | L2 | 只在特定 mode 需要 |
| 「CI/CD 是什么」等 2 段 | L3 | 删了无行为损失 |

## 27.4 Step 2–4 重排（good vs bad）

**确定性下沉——40 行 prose 换成工具 handoff：**
```
STOP. When input is a task pack, run `<your-validator> validate <path> --json`
before creating tasks. Proceed only if it passes; else stop and route by reason_code.
Do not re-narrate the hash/structure rules here.
```

**STOP trigger good vs bad：**
| | 写法 | 问题 |
|---|---|---|
| ❌ bad | `更多细节见 references/mode-rules.md` | 无触发时机、软措辞 → trigger failure |
| ✅ good | `STOP. Before dispatching any reviewer, read references/mode-rules.md.`（+ fallback：未读按最保守模式；+ eval：dispatch 触发 / 解释代码不触发） | 四件套齐全、可测试 |

**description good vs bad：**
```
❌ bad（功能说明）: "This skill helps you ship widgets. It can validate, detect modes,
   produce output, handle branches, and much more. Use whenever ..."
✅ good（trigger+exclude+定位）: "Execute a validated widget-shipping task pack in-repo.
   Trigger on 'ship widgets'. Exclude planning and code review (route elsewhere)."
```

## 27.5 Step 3 loader 探针（contingent 收益前置）
只读查明：宿主 A eager-inline references（转 lazy 才省 token）；宿主 B 按字面文本处理（本就不占 activation）。据此决定哪些下沉转 lazy，且只对 eager-inline 宿主计 token 收益。

## 27.6 Step 5–6 验证与 closeout（诚实分级）
```
line-count: 600 → 190 行 spine + 3 references            [confirmed]
context-room: 宿主 A -~2.1k token/激活                   [contingent-on-loader-behavior，探针已证]
              宿主 B 无 activation 节省，仅可读性         [contingent]
质量/成功率改善                                          [hypothesis，待运行证据]
边界: 写删/验证/交接全部保留在 spine                      [gate ✓]
STOP trigger: 3 个 moved reference 各配四件套             [gate ✓]
fresh eval: 已跑，trigger precision/边界无回归            [gate ✓]
成功判据: 边界保留 + 无回归 + delta 记录 → 达成
```

## 27.7 演示了什么
- 帕累托：先动最重的校验 prose 与 mode 矩阵，不碰已健康部分。
- 确定性下沉：40 行 → 4 行 handoff。
- 二阶思维：每个下沉配四件套，防 trigger failure 静默回归。
- 收益分级 + 地图≠疆域：line-count 是 confirmed，token 收益标 contingent、按宿主报，质量归 hypothesis。
- gate 出口：fresh eval 通过才允许删 spine 承重文本。
