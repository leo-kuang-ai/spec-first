# 基于 16 个思维模型的 Spec-First Skills 优化方案

- 分析时间：2026-07-02
- 参考方法论：`docs/11-业界调研/16个思维模型方法论学习记录.md`
- 覆盖 skills：37 个（全部 SKILL.md）
- 核心工作流分析深度：spec-plan / spec-code-review / spec-work / spec-prd / spec-optimize / spec-compound / spec-debug / spec-skill-audit / spec-write-skill / spec-team-standards-governance / using-spec-first

---

## 执行摘要：结论先行

基于对 16 个思维模型与当前 spec-first 全部 skills 的深度比对，识别出以下**5 个最高价值优化方向**：

| 优化方向 | 对应模型 | 影响 skill | 预期收益 |
|---|---|---|---|
| **O1 · 需求歧义放大路径可视化** | 蝴蝶效应 | spec-prd / spec-plan | 减少因早期 OQ 未关闭导致的 plan 返工 |
| **O2 · 置信度分级决策框架** | 概率思维 + 回归均值 | spec-code-review / spec-debug | 减少「大概成立」的低质量 finding |
| **O3 · 知识复利追踪机制** | 复利效应 + 大数定律 | spec-compound / spec-compound-refresh | 把一次解决方案变成可度量的知识资产 |
| **O4 · 二阶影响强制推演检查** | 二阶思维 | spec-plan / spec-work / spec-mcp-setup | 防止「一阶正确、二阶损害」决策 |
| **O5 · 关键少数高杠杆聚焦** | 帕累托法则 | spec-code-review / spec-plan / spec-team-standards-governance | 把有限 review 资源投向最高风险 20% |

---

## 一、分析方法与边界说明

### 1.1 分析视角

本优化方案不是对 skill 的全面重写，而是基于以下问题的定向分析：

> 每个思维模型揭示了当前 skill 在哪个环节存在**认知盲区**或**系统性弱点**？可以用最小机制改动实现最大行为改善？

### 1.2 分析约束

按 CLAUDE.md 核心哲学执行：
- **Light contract**：优化建议必须轻量、可维护，不增加不必要的仪式
- **Scripts enforce deterministic invariants; LLM decides semantic adequacy**：脚本类优化针对确定性场景，语义优化留给 LLM 判断
- **80/20 原则**：优先用最小机制解决高频、高价值、真实研发问题

### 1.3 方案结构

- **第二章**：按 16 个思维模型分组，每个模型给出 1-3 个具体 skill 优化点
- **第三章**：按核心 skill 维度汇总优化方案（综合视图）
- **第四章**：优先级矩阵与落地路径

### 1.4 阅读与执行优先级说明

本文件是持续修订的研究方案，不是一次性定稿。**第二至六章与附录 A-F 属于初版分析**，其中关于「零风险删除」「P0 立即落地」「新增 schema/gate」的措辞已被后续 §G 对抗性审查与 §H 修订方案校正；执行时以 **§H.14 / §H.15、以及本节的降级说明**为准。

执行口径：
- 「P0」表示候选优先级，不表示已证明收益或无需验证；进入实施前必须补最小 eval / fresh-source 基线或历史失败证据。
- 「零风险」统一降级为「低风险候选」；仍需 `git diff --check`、聚焦 contract/unit test，涉及 skill prose 行为时还需 fresh-source eval 或等价复核。
- 新字段、新 checker、新 schema 只有在现有 surface 无法满足明确 consumer 需求时才进入实施；否则先复用现有字段、Reviewer column、Structured Promotion Gate 或 advisory report。
- 阈值类建议（如 80 分 readiness、15+ high-value solution）只作为 aspirational/advisory 启发，不进入 deterministic floor，不作为 gate 或完成声明。

---

## 二、16 个思维模型 → Skills 优化深度分析

### 第1组：因果与系统类

---

#### 模型 1：蝴蝶效应

**核心洞察**：小的初始偏差（spec 歧义、plan 假设漏洞、review 放行的低质量 finding）会沿 workflow 链路被放大。

**当前 skill 现状**：
- `spec-prd` 已有「relentless grilling」机制，但缺少对「每个 OQ 的下游放大路径」的可视化
- `spec-plan` 的 assumptions 章节是文字列表，没有追踪「假设→失效场景→影响 U-ID 范围」的链路
- `spec-code-review` 的 finding 放行逻辑有置信度门控，但缺少「这个 finding 如果不修会影响哪些下游」的系统评估

**具体优化建议**：

**[OPT-1.1] spec-prd：OQ 下游放大风险评分**

在每个 Outstanding Question 的 `closure_disposition` 字段旁，增加一个轻量标注：

```
amplification_risk: low | medium | high
affected_plan_units_estimate: 0 | 1-3 | 3+
```

- `high` = 如果未关闭，planning 会有 3+ 个 U-ID 需要「发明行为」
- 现有 `blocks_planning` 字段是二值的，amplification_risk 提供更细粒度的优先级信号
- 对应 `check-prd-artifact.js` 可在 `high + open` 时升高 reason_code 严重性

**[OPT-1.2] spec-plan：假设链路追踪**

在 `## Assumptions` 章节内，给每个假设增加一列：

```
| Assumption | Failure Scenario | Affected U-IDs | Detection Trigger |
```

- 现有假设列表是平铺文字，缺少「这个假设如果错了，哪些实现单元要返工」的链路
- 这样 spec-work 在执行中发现假设失效时，可以立即定位受影响的 U-IDs 而不是重读整个计划

**[OPT-1.3] using-spec-first：路由错误的早期识别**

路由时增加一个轻量「路由影响评估」：

```
route: /spec:work
reason: plan exists, scope clear
second_order_cost_if_wrong: 如果实际上 WHAT 还不清楚，进 work 后发现会触发 back-to-plan 返工
```

不强制阻断，但让用户更清楚「选错路由的成本是多少」。

---

#### 模型 2：复利效应

**核心洞察**：可沉淀的规范、测试、知识会随时间积累产生指数级收益；但如果无法度量「被使用了多少次」，复利无从感知。

**当前 skill 现状**：
- `spec-compound` 生成的 `docs/solutions/` 文档是静态知识，无使用频率追踪
- `spec-compound-refresh` 有刷新机制，但刷新触发缺少数据驱动依据
- `spec-plan` 在 Phase 1 会检索 `docs/solutions/` 但没有记录「哪个方案被引用了」

**具体优化建议**：

**[OPT-2.1] spec-compound：knowledge reuse tracking 字段**

在 `docs/solutions/` 的 YAML frontmatter 中增加：

```yaml
reuse_count: 0        # 每次 spec-plan/spec-work/spec-debug 引用时 +1
last_referenced: null # 最近一次被引用的日期
high_value: false     # 引用次数超过阈值时设为 true
```

当 spec-plan/spec-work 引用某个 solution 时，`spec-first internal` 命令更新这个计数。这为 `spec-compound-refresh` 提供数据驱动的刷新优先级。

**[OPT-2.2] spec-compound-refresh：基于使用频率的刷新优先级**

现有刷新范围是「全量扫描或用户指定」，缺少自动优先级排序。

优化：在刷新报告开头增加「高价值知识清单」：
```
High-value solutions (referenced 3+ times, check first):
- docs/solutions/xxx.md (reused: 5, last: 2026-06-15)
```

高频引用 + 时间较早 = 优先刷新，避免团队最常用的知识反而是最陈旧的。

---

#### 模型 3：创造性破坏

**核心洞察**：新工具、新能力会替代旧流程。spec-first 本身就是在「破坏」传统手写 prompt 习惯；skills 内部也需要定期审视哪些环节可以被更好的机制替代。

**当前 skill 现状**：
- `spec-skill-audit` 有质量审计维度，但缺少「这个 skill 是否已被宿主能力商品化」的判断
- `spec-write-skill` 的资格判断（`do-not-create-skill`）已部分覆盖「是否值得做成 skill」，但缺少「当前 skill 是否该退役」的逆向视角

**具体优化建议**：

**[OPT-3.1] spec-skill-audit：商品化风险评估**

在 skill 审计报告中增加一个维度：

```
commoditization_risk: low | medium | high
reason: "宿主平台 plan mode / task tracking 原生支持了这个 skill 的核心行为"
recommendation: monitor | evaluate-for-sunset | archive
```

这对应 CLAUDE.md 中的「宿主 primitive 正在商品化，新增能力前先问是否在重建宿主即将免费提供的能力」原则。

**[OPT-3.2] spec-write-skill：强制问「替代了什么」**

在资格判断步骤增加一个必答问题：

```
replacement_analysis:
  replaces_existing_skill: null | <skill-name>
  replaces_llm_behavior: null | <description>
  net_efficiency_gain: <one-line justification>
```

这防止 skill 库持续膨胀而没有对应的退役路径。

---

#### 模型 4：公地悲剧

**核心洞察**：共享资源（context budget、CLAUDE.md/AGENTS.md、docs/solutions/ 知识库）如果缺少治理机制，会被过度消耗或污染。

**当前 skill 现状**：
- Context governance 合约（`docs/contracts/context-governance.md`）存在，但各 workflow 对上下文预算的使用缺少明确的「预算申报」机制
- `docs/solutions/` 是共享知识库，但缺少「写入质量门控」防止低质量文档稀释信号密度

**具体优化建议**：

**[OPT-4.1] spec-compound：复用 Structured Promotion Gate 的知识质量检查**

当前 `skills/spec-compound/SKILL.md` 已有 `Structured Promotion Gate`，规定只有 source-confirmed、verified learning 才能进入 durable `docs/solutions/`。因此这里不新增第二套 `knowledge_quality_gate` schema；应把下列检查作为现有 gate 的可读 checklist / eval 观察点：

```
structured_promotion_gate_check:
  has_reproducible_trigger: true/false
  has_source_evidence: true/false
  not_duplicate: true/false
  generalizable_lesson: true/false  # 不是仅此一次的特殊案例
```

只有所有条件 `true` 才支持写入 `confirmed` 类型文档；否则沿用现有 Structured Promotion Gate 的降级路径，作为 `legacy_unstructured_advisory` / advisory candidate 或建议放弃。这防止「公地」（共享知识库）被低质量内容过度填充，同时避免制造第二个 promotion source-of-truth。

---

### 第2组：本质与概率类

---

#### 模型 5：第一性原理

**核心洞察**：把复杂问题拆到最基本事实再重建，而不是在惯例和假设上打补丁。

**当前 skill 现状**：
- `spec-prd` 的 grilling 流程从复杂材料出发，但没有显式的「底层事实清单」步骤——最终的 PRD WHAT 可能建立在一堆「industry convention」而非第一性事实上
- `spec-plan` 的问题框架（Problem Frame）部分要求描述问题，但没有强制区分「事实」与「假设继承的惯例」
- `spec-work` 的「Follow Existing Patterns」原则有时会强化路径依赖，而不是鼓励从底层约束重新推导

**具体优化建议**：

**[OPT-5.1] spec-prd：底层事实锚点声明**

在 `Current System Snapshot` 章节之前，要求显式声明：

```
first_principles_anchor:
  irreducible_facts:        # 不可再拆分的系统事实
    - "用户每次只能属于一个 org"
    - "支付状态变化必须幂等"
  inherited_conventions:    # 目前沿用但可质疑的惯例
    - "使用 REST 而非 GraphQL（历史决策，非最优原则）"
```

这让 reviewer 和 LLM 都能看清哪些 WHAT 是真正的约束，哪些是可以被创造性破坏的惯例。

**[OPT-5.2] spec-plan：决策依据标注**

在每个 `Key Technical Decision` 中增加 `evidence_type` 字段：

```
evidence_type: first-principles | pattern-inheritance | empirical | convention
```

- `first-principles`：从底层约束直接推导
- `pattern-inheritance`：沿用既有代码模式（需在 Patterns to Follow 中给出具体引用）
- `empirical`：基于已验证实验结果
- `convention`：行业惯例，缺乏项目内部证据

这样 reviewer 能快速识别哪些决策需要更深的质疑。

---

#### 模型 6：奥卡姆剃刀

**核心洞察**：假设最少、结构最简单的解释/方案往往更可靠；复杂度是成本，需要明确被需要的理由。

**当前 skill 现状**：
- `spec-plan` 有「Right-size the artifact」原则，但在复杂场景下容易产生过度拆分（太多 U-IDs、太多 risks、太多 optional 章节）
- `spec-code-review` 的 18+ persona 系统在 low-risk diff 上有 scale-aware preflight，但最小 reviewer set 的选择标准仍偏保守
- `spec-work` 的 `Minimality + Architecture Fit Preflight` 是好的，但执行层容易因「顺手加一个 helper」而悄悄扩大 scope

**具体优化建议**：

**[OPT-6.1] spec-plan：实现单元复杂度自检**

在 Phase 5.1「Review Before Writing」增加一个明确的简洁性检查：

```
simplicity_self_check:
  - 是否有 2 个以上 U-ID 可以合并而不损失清晰度？
  - 是否有 section 只是为了显得完整而非传递信息？
  - 假设列表的每一条，是否真的影响实现？
```

这是一个 attention prompt，不是 gate；但明确写出来比依赖 LLM 自觉要有效。

**[OPT-6.2] spec-code-review：最小 reviewer set 条件放宽**

现有 6 个最小集触发条件（changed_file_count ≤ 2, untracked = 0, sensitive = false, no prior comments, no plan, tiny diff）偏严苛。

优化：增加一个「minimal intent review」类别：当 diff 是单一行为修复（bug fix to a single function, typo, string change）且有对应 test，允许仅用 `spec-correctness-reviewer + spec-testing-reviewer` 两个 persona。

**[OPT-6.3] spec-work：scope creep 早期警告**

在 Task Execution Loop 中，每完成一个任务，自动检查：

```
scope_creep_check:
  files_outside_plan: []   # 超出 plan Files: 列表的修改
  new_abstractions: []     # 不在 plan 中的新抽象/接口/helper
  action: flag | continue | stop
```

这是对现有 Anti-Rationalization Red Flag「相邻代码顺手改了」的结构化强化。

---

#### 模型 7：概率思维

**核心洞察**：现实充满不确定性，好决策不追求绝对正确，而是在概率意义上提高胜率。Finding 有置信度，假设有概率，方案有风险——都需要以概率分布而非非黑即白来表达。

**当前 skill 现状**：
- `spec-code-review` 已有 0/25/50/75/100 confidence anchors，是很好的概率化基础，但 `why_it_matters` 和 `evidence` 字段填写质量参差不齐
- `spec-debug` 的根因链路中有「causal chain」要求，但「链路中不确定环节」的概率估算没有标准格式
- `spec-plan` 的 Risk Analysis 是定性文字，缺乏概率量化（哪怕是 low/medium/high 的三档）

**具体优化建议**：

**[OPT-7.1] spec-code-review：finding 频率历史**

在 `spec-learnings-researcher` persona 的任务描述中，增加：「不只搜索 similar solutions，还要搜索 similar *findings*——这类 bug 在这个 codebase 里出现过几次？」

这让 finding 的 confidence 有历史频率做支撑，而不只靠 reviewer 直觉。

**[OPT-7.2] spec-debug：假设置信度标注**

在 Hypothesis/Probe 步骤增加标准格式：

```
hypothesis:
  statement: "X 模块的 null pointer 是 root cause"
  confidence: 0-100
  evidence_for: ["stacktrace line 42 指向 X.foo()"]
  evidence_against: []
  prediction: "如果是 X 的问题，Y test 也应该失败"
  prediction_verified: null
```

Prediction → verified 是现有 spec-debug 原则（形成 prediction，而非只是「看着像」），加上结构化格式后，Bayesian updating 可以在多个 probe 后明确展示置信度变化。

**[OPT-7.3] spec-plan：风险概率评估**

在 Risk Analysis 中，每条 risk 增加：

```
| Risk | Probability | Impact | Mitigation |
| 外部 API 变更 | medium | high | pin version + integration test |
```

三档概率（low/medium/high）+ 三档影响（low/medium/high）= 9 格矩阵，帮助 spec-work 在执行时优先处理 high×high 的 risk。

---

#### 模型 8：回归均值

**核心洞察**：单次异常结果（特别好或特别差）不代表系统能力真正改变；需要足够样本才能判断趋势。

**当前 skill 现状**：
- `spec-optimize` 的实验框架是好的，但「单次实验成功」后倾向于直接集成，缺少「回归均值检验」步骤
- `spec-debug` 的修复验证通常是「fix + rerun same test」，但没有要求跨 N 次运行验证稳定性（尤其是 flaky tests）
- `spec-compound` 写入时缺少「这个 solution 在几个不同场景下被验证了？」的要求

**具体优化建议**：

**[OPT-8.1] spec-optimize：实验稳定性检验**

在「Select winners」步骤，明确要求：

```
stability_check:
  runs_required: 3           # 实验结果必须在 N 次运行中稳定
  variance_threshold: 10%    # 超过此方差即认为结果不稳定
  verdict: stable | unstable | borderline
```

防止一次「运气好的运行」直接晋升为 winner。

**[OPT-8.2] spec-compound：跨场景验证声明**

在 solution doc frontmatter 增加：

```yaml
verified_in_scenarios: 1   # 被验证的不同场景数量
confidence: single-case | multi-case | pattern
```

`single-case` 的 solution 在被 spec-plan/spec-work 引用时，应标注「仅在一个场景验证，请注意回归均值风险」。

---

### 第3组：边界与规律类

---

#### 模型 9：能力圈

**核心洞察**：清楚知道自己擅长什么、不擅长什么，只在理解范围内做高质量决策。对 LLM 和 workflow 同样适用：每个 skill/persona 都有它真正能可靠判断的范围。

**当前 skill 现状**：
- `spec-code-review` 的 reviewer personas 有明确的职责描述，但缺少「这个 persona 不能可靠发现什么」的显式声明
- `spec-work` 作为执行 workflow 处理从 trivial 到 large 的所有任务，复杂度边界依赖 LLM 自判，缺少明确的「能力上限」声明
- `using-spec-first` 的路由逻辑已经比较精准，但对「WHAT 还不清楚时，LLM 不应独立决定 HOW」这条能力圈边界没有足够强调

**具体优化建议**：

**[OPT-9.1] spec-code-review：Reviewer 能力边界声明**

为每个核心 reviewer persona 增加一个 `blind_spots` 字段：

```
spec-correctness-reviewer:
  blind_spots:
    - "无法可靠发现跨服务的分布式竞态条件（需要 spec-reliability-reviewer）"
    - "无法发现仅在真实 DB 查询计划下出现的 N+1（需要集成测试证据）"
```

这让 synthesis 阶段能说「此类 finding 超出了当前 reviewer 能力圈，建议 X 验证」而不是隐式放行。

**[OPT-9.2] spec-work：任务复杂度上限触发**

在 Phase 0 的复杂度评估中，增加一个「能力圈警告」：

```
complexity_ceiling:
  triggers:
    - "涉及 auth/payment/data-migration 且没有 spec-plan 产生的方案"
    - "超过 15 个文件且没有 task-pack"
    - "跨越 2 个以上 service/module 边界且 WHAT 未经 spec-prd 确认"
  action: "强烈建议先经过 spec-plan 或 spec-write-tasks，而不是直接执行"
```

这不是硬阻断，而是把「我知道我不知道什么」显式化。

---

#### 模型 10：帕累托法则

**核心洞察**：约 80% 的结果来自 20% 的关键原因。在 spec-first 场景中，20% 的高风险变更贡献了 80% 的线上问题；20% 的高价值知识贡献了 80% 的 plan/work 收益。

**当前 skill 现状**：
- `spec-code-review` 的 reviewer 选择已有 scale-aware preflight，但「哪类 reviewer 在历史上发现了最多 P0/P1」没有追踪，导致难以持续优化 reviewer 配置
- `spec-plan` 的风险识别是全量扫描所有可能，没有显式的「关键少数高杠杆 risks」优先级
- `spec-team-standards-governance` 有大量 candidate standards，但缺少「哪 20% 的标准防止了 80% 的 code review finding」的数据

**具体优化建议**：

**[OPT-10.1] spec-code-review：Reviewer 有效性追踪**

在 `spec-compound` 写入 code-review 相关 solution 时，增加 tag：

```yaml
finding_source_reviewer: spec-adversarial-reviewer
finding_severity: P1
```

积累足够样本后，`spec-skill-audit` 可以用这些数据回答「哪些 reviewer 在这个 codebase 历史上找到了最多高价值 finding」，从而优化未来的 reviewer 优先级。

**[OPT-10.2] spec-plan：High-Leverage Risks 优先展示**

在 `Risk Analysis` 章节开头，增加一个「Top-3 关键风险」摘要：

```
## Risk Analysis

### 🔴 Top-3 关键风险（优先缓解）
1. [risk] [probability: high] [impact: high] → [mitigation]
2. ...

### 其余风险
（完整列表）
```

把 Pareto 思维嵌入 plan 结构，让 spec-work 和 reviewer 的注意力首先集中在真正关键的少数风险上。

**[OPT-10.3] spec-team-standards-governance：高价值标准标记**

在 `docs/standards/index.md` 中，为每个 active standard 增加：

```yaml
finding_prevention_count: 0    # 在 code review 中被这条标准识别的 finding 数量
high_impact: false             # 防止了 3+ P0/P1 finding 时标记为 true
```

这样 `spec-code-review` 的 `spec-project-standards-reviewer` 可以优先检查 `high_impact: true` 的标准，而不是平等扫描所有规则。

---

#### 模型 11：边际效用递减

**核心洞察**：对同一事项持续增加投入，新增收益会逐渐下降甚至为负。在 spec-first 中：更多 agent、更深的 grilling、更多 review round 不一定带来更好的结果。

**当前 skill 现状**：
- `spec-prd` 的「relentless grilling」在哲学上正确，但没有显式的「收益递减识别」：当同一个 branch 已经 grill 了 5 轮且没有新信息产生时，继续 grill 的边际价值接近零
- `spec-plan` 的 confidence-first deepening（Phase 5.3）可以多轮运行，但没有明确的「停止条件」（除了 agent judgment）
- `spec-optimize` 的 experiment loop 有 budget limit，但没有「同类实验的收益递减检测」

**具体优化建议**：

**[OPT-11.1] spec-prd：Grill 收益递减识别**

在 Pre-Write Closure Gate 增加一个「信息增量检查」：

```
grill_diminishing_returns:
  last_3_questions_new_info: low | medium | high
  recommendation:
    - low: "考虑提出 owner-cap 建议，后续问题价值递减"
    - medium: "继续 grill 但优先切换到其他 branch"
    - high: "继续当前 branch"
```

这与「relentless grilling」不矛盾：不是说停止问问题，而是识别何时该切换 branch 或提出 soft-cap。

**[OPT-11.2] spec-plan：Deepening 停止条件**

在 Phase 5.3.2「Gate: Decide Whether to Deepen」增加：

```
deepening_diminishing_returns:
  condition: "如果前一轮 deepening 只产生了措辞改善而没有新的 risk/assumption/evidence，视为边际收益递减"
  action: "跳过 deepening，直接进入 doc review"
```

避免无限深化一个「已经足够好」的计划。

**[OPT-11.3] spec-optimize：同类实验频率检测**

在 experiment loop 中，当同类策略（相同的 modification_type）连续 3 次实验都没有超过 baseline 5% 的改善时：

```
convergence_signal:
  same_strategy_attempts: 3
  improvement_threshold: 5%
  recommendation: "切换实验策略，当前方向可能已达局部最优"
```

---

#### 模型 12：大数定律

**核心洞察**：样本越大，数据越可靠。在 spec-first 中，单次 review finding、单次实验结果、单次 debug 假设都有噪声——需要足够样本才能支持结论。

**当前 skill 现状**：
- `spec-optimize` 的 baseline 通常是单次运行结果，统计可靠性不足
- `spec-code-review` 的 finding 置信度是 per-reviewer 判断，缺少「多 reviewer 同意」作为信号增强
- `spec-compound-refresh` 决定刷新/删除一个 solution 主要靠时间推断（stale），缺乏使用频率数据

**具体优化建议**：

**[OPT-12.1] spec-optimize：最小 baseline 样本要求**

在 Validate spec 阶段，要求：

```yaml
baseline:
  min_runs: 3          # baseline 必须是 N 次运行的统计结果
  metric_type: mean | p95 | p50
  variance_reported: true
```

单次 baseline 的结果不能作为实验比较基准，必须是多次运行的统计量。

**[OPT-12.2] spec-code-review：跨 reviewer 共识信号**

在 Stage 5 synthesis 中，为 finding 增加一个 `consensus` 字段：

```json
{
  "consensus": "single-reviewer | multi-reviewer-agree | multi-reviewer-disagree",
  "reviewer_count": 2
}
```

`multi-reviewer-agree` 的 finding 在 merge report 中可以升高 confidence；`multi-reviewer-disagree` 的 finding 应在报告中显式标注「存在分歧，建议人工判断」。

---

### 第4组：长期与人性类

---

#### 模型 13：二阶思维

**核心洞察**：不只看直接结果，还要推演后续连锁反应和长期影响。许多「一阶正确」的决策会产生「二阶损害」。

**当前 skill 现状**：
- `spec-plan` 有 Risk Analysis，但通常是一阶风险（这个方案自身的问题），而不是二阶风险（如果这个方案被 100 个 agent 遵循，会产生什么系统性影响？）
- `spec-mcp-setup` 在 setup 新工具时，没有要求考虑「新工具被所有工作流使用后对 context budget 的二阶影响」
- `spec-team-standards-governance` 在 promote 新标准时，没有要求推演「如果所有 code review 都强制执行这条标准，会产生什么行为变化？」

**具体优化建议**：

**[OPT-13.1] spec-plan：二阶影响检查**

在 Phase 3.2「Stakeholder and Impact Awareness」增加一个二阶影响问题列表：

```
second_order_thinking:
  questions:
    - "如果10个并行 agent 都执行这个 plan，会有哪些竞态/冲突？"
    - "这个方案被成功执行后，下一个最可能出现的技术债是什么？"
    - "这个方案改变了哪些现有行为激励？（例如：让某个操作更方便，可能导致其他操作被忽视）"
  required_for: Standard | Deep plans
```

**[OPT-13.2] spec-team-standards-governance：标准二阶影响评估**

在 `promote` 模式增加：

```
second_order_impact:
  developer_behavior_change: "全员遵守后，开发者行为会如何改变？"
  maintenance_cost: "维护这条标准的长期成本？"
  unintended_consequences: "哪些场景会因这条标准产生不必要的摩擦？"
```

防止「好标准 → 过度执行 → 规则泛滥 → 合规成本超过收益」的二阶陷阱。

---

#### 模型 14：社会认同

**核心洞察**：人们会参考他人行为和真实评价来做决策。对工具和 workflow 的采纳同样适用：真实使用案例、可验证数据、他人背书，比功能列表更有说服力。

**当前 skill 现状**：
- `spec-compound` 生成的 solutions 只有技术内容，没有「这个方案在哪些场景下被成功应用」的背书信息
- `spec-release-notes` 主要是功能列表，缺少「真实用户反馈」和「可量化的效率改善」的社会认同信号
- `spec-skill-audit` 的报告有质量评分，但缺少「这个 skill 实际被用了多少次，平均执行效果如何」的使用数据背书

**具体优化建议**：

**[OPT-14.1] spec-compound：应用背书字段**

在 solution frontmatter 增加：

```yaml
applied_in:
  - context: "feat/user-auth PR review"
    outcome: "提前发现了 session fixation 漏洞"
    date: 2026-06-15
```

这让 spec-plan/spec-work 引用 solution 时能看到「这个方案在真实场景中有效」的社会认同证据，而不只是技术描述。

**[OPT-14.2] spec-release-notes：效率收益量化**

在 release notes 模板中，为用户可见变更增加一个可选的「实测效果」字段：

```markdown
## 亮点
- spec-prd 新增 OQ 放大风险评分
  **实测效果**：在3个 PRD 评审中，提前发现2个会导致plan返工的歧义点
```

这比「新增字段 X」更有说服力，符合社会认同对「真实结果证据」的需求。

---

#### 模型 15：地图不是疆域

**核心洞察**：我们对世界的认知（文档、计划、spec）不等于真实系统行为。需要持续用现实来校准认知地图。

**当前 skill 现状**：
- `spec-plan` 有「地图不是疆域」的隐含意识（Assumptions、Deferred to Implementation 章节），但没有显式的「计划地图 vs 执行现实」校准步骤
- `spec-work` 在执行中发现 plan 失效时，通过 stop + return to spec-plan 处理，但缺少一个轻量的「实时校准日志」让当前 context 可见
- `spec-app-consistency-audit` 正是专门解决「spec 地图与代码疆域不一致」的 skill，但它的触发时机（通常在发现 drift 后）比理想情况晚

**具体优化建议**：

**[OPT-15.1] spec-work：执行时地图校准日志**

在 Phase 2 Task Execution Loop 中，每完成一个 U-ID，记录一个简短的校准条目：

```
map_vs_territory_log:
  - unit: U2
    plan_said: "预计修改 3 个文件"
    reality: "实际修改了 5 个文件，发现 helpers/ 中有共享函数"
    drift: minor | significant | plan-invalidating
    action: continue | return-to-plan | stop
```

`plan-invalidating` 漂移必须触发 return-to-plan，而不是由 LLM 自行扩大 scope。

**[OPT-15.2] spec-plan + spec-prd：「地图失效条件」显式声明**

在 Assumptions 章节增加：

```
map_invalidation_triggers:
  - "如果用户表不支持软删除，U3 需要完全重新设计"
  - "如果 third-party API 无法返回 X 字段，验收标准 AC-4 需要重议"
```

这让 spec-work 执行时知道「哪些发现会让这张地图失效」，而不是在发现失效后才手忙脚乱。

---

#### 模型 16：临界点效应

**核心洞察**：当系统积累达到某个关键阈值时，会出现质变。spec-first 中存在多个临界点：工具就绪度、知识密度、标准覆盖率——突破临界点前是平台期，突破后是质变。

**当前 skill 现状**：
- `spec-mcp-setup` 有 readiness 检测，但没有「整体工具就绪度」的临界点指标（例如：当几个关键工具都 ready 后，AI coding 效率会有非线性提升）
- `spec-compound` 积累的 solutions 数量越多，plan/work 引用质量越高，但缺少「知识库临界点」的度量指标
- `spec-team-standards-governance` 的标准覆盖率有一个临界点（高于某个百分比后，review 质量会显著提升），但这个阈值没有被识别和追踪

**具体优化建议**：

**[OPT-16.1] spec-mcp-setup：工具就绪度综合评分（advisory）**

在 setup 报告中增加一个「工具就绪指数」可作为 advisory 指标，用于解释 degraded mode 和 next action，不进入 deterministic floor，也不作为 workflow gate：

```
readiness_index:
  critical_tools_ready: 3/5    # 关键工具就绪率
  optional_tools_ready: 2/4    # 可选工具就绪率
  overall_score: 65/100
  tipping_point_threshold: 80  # aspirational heuristic；不是 gate，不证明工作流已高效
  current_phase: "积累期（距临界点还差约2个关键工具）"
```

**[OPT-16.2] spec-compound：知识库成熟度指标**

在 spec-compound-refresh 报告中增加：

```
knowledge_corpus_health:
  total_solutions: 42
  high_value_count: 8         # reuse_count >= 3 的 solutions
  coverage_areas: ["auth", "perf", "data-migration", ...]
  tipping_point_estimate: "advisory hypothesis：当高价值 solution 达到 15+ 时，plan 的 Direct Evidence 引用质量可能提升；需历史样本验证"
```

---

## 三、按 Skill 维度汇总的优化方案

本章从 workflow 视角整合前文 16 个模型的建议，避免每个模型单点落地造成碎片化。

### 3.1 `using-spec-first`：入口路由优化

**当前优势**：
- 路由边界清晰，不默认 brainstorm
- 区分 direct lightweight task 与 substantial workflow
- source/runtime boundary 表达成熟

**建议优化**：

| 优化编号 | 优化点 | 方法论来源 | 落地方式 |
|---|---|---|---|
| U-1 | 路由错误成本提示 | 蝴蝶效应 / 二阶思维 | 在推荐 workflow 时附带「如果路由错了，最大返工点是什么」 |
| U-2 | 商品化能力提醒 | 创造性破坏 | 当用户请求新增 public workflow 时，提示是否在重建 host primitive |
| U-3 | 目标 repo 写入边界强化 | 能力圈 / 公地悲剧 | parent workspace 场景下，把 target_repo 缺失作为更显眼的 blocking reason |

**优先级**：P2。入口治理已经成熟，优化以提示质量为主，不应大改。

---

### 3.2 `spec-prd`：需求澄清优化

**当前优势**：
- 对 WHAT/HOW 边界、owner question、checker/finalize 的纪律非常强
- 已有 observed failure blacklist，对直接写 PRD、fake headless、owner answer laundering 等高风险行为有明确约束

**建议优化**：

| 优化编号 | 优化点 | 方法论来源 | 预期收益 |
|---|---|---|---|
| P-1 | OQ 放大风险评分 | 蝴蝶效应 | 优先关闭会导致 plan 大面积返工的问题 |
| P-2 | First Principles Anchor | 第一性原理 | 区分不可变底层事实与历史惯例 |
| P-3 | Grill 收益递减识别 | 边际效用递减 | 在 relentless grilling 与效率之间取得平衡 |
| P-4 | 地图失效条件 | 地图不是疆域 | 让 spec-work 知道哪些发现会使 PRD/plan 失效 |

**建议最小 patch**：只先做 P-1 + P-4，避免 spec-prd 继续膨胀。

---

### 3.3 `spec-plan`：计划质量优化

**当前优势**：
- planning-only boundary 强
- 输出结构完整，兼顾 Direct Evidence、Implementation Units、handoff
- 已有 reuse-analysis、enterprise-plan-review、doc-review handoff

**建议优化**：

| 优化编号 | 优化点 | 方法论来源 | 预期收益 |
|---|---|---|---|
| PL-1 | 假设链路追踪（Assumption → Failure → U-ID） | 蝴蝶效应 | 降低执行中发现假设失效的定位成本 |
| PL-2 | Key Decision evidence_type | 第一性原理 | 区分事实推导、模式继承、经验与惯例 |
| PL-3 | Top-3 High-Leverage Risks | 帕累托法则 | 让执行和 review 聚焦关键少数风险 |
| PL-4 | 二阶影响检查 | 二阶思维 | 防止一阶收益掩盖长期副作用 |
| PL-5 | 地图失效条件 | 地图不是疆域 | 与 spec-work 的 map_vs_territory_log 对接 |

**建议最小 patch**：PL-1 + PL-3 + PL-5。PL-2/PL-4 可作为 Deep plan extension，不默认进入轻量计划。

---

### 3.4 `spec-work`：执行闭环优化

**当前优势**：
- plan/task scope boundary 强
- feedback loop 和 verification 纪律明确
- source/runtime boundary、task-pack validation、review gate 都较成熟

**建议优化**：

| 优化编号 | 优化点 | 方法论来源 | 预期收益 |
|---|---|---|---|
| W-1 | scope_creep_check | 奥卡姆剃刀 | 提前发现超出 plan 的顺手改动 |
| W-2 | map_vs_territory_log | 地图不是疆域 | 执行中持续校准 plan 与真实代码 |
| W-3 | complexity_ceiling | 能力圈 | 避免直接执行超出 work 能力圈的模糊大任务 |
| W-4 | 二阶影响回看 | 二阶思维 | 在 closeout 中记录执行后的潜在长期影响 |

**建议最小 patch**：W-1 + W-2。它们都可以复用现有 task loop 和 closeout，不需要新 artifact schema。

---

### 3.5 `spec-code-review`：审查质量优化

**当前优势**：
- 已有多 persona、scale-aware reviewer preflight、confidence anchors、autofix class、Diff Boundary Review
- 这是最适合吸收概率思维、帕累托法则、大数定律的 workflow

**建议优化**：

| 优化编号 | 优化点 | 方法论来源 | 预期收益 |
|---|---|---|---|
| CR-1 | 复核现有 Reviewer column + cross-reviewer agreement 是否足够 | 大数定律 | 先复用已有共识表达，只有 consumer 证明不足时再加 schema 字段 |
| CR-2 | finding 历史频率 | 概率思维 | 用 codebase 历史支撑置信度 |
| CR-3 | reviewer blind_spots | 能力圈 | 避免 persona 过度自信 |
| CR-4 | reviewer 有效性追踪 | 帕累托法则 | 优化 reviewer 资源配置 |
| CR-5 | minimal intent review | 奥卡姆剃刀 | 降低低风险 review 的过度 fan-out |

**建议最小 patch**：CR-1 + CR-3。CR-1 的第一步不是新增字段，而是评估 `spec-code-review` 现有 Reviewer column 与 cross-reviewer promotion 是否已满足 report/headless consumer；schema 字段延后到 P2，并以 consumer-proven gap 为前置。CR-2/CR-4 需要跨 run 数据，适合后续和 spec-compound 数据结构一起做。

---

### 3.6 `spec-debug`：根因分析优化

**当前优势**：
- Investigate before fixing
- causal chain + prediction discipline 非常契合科学调试

**建议优化**：

| 优化编号 | 优化点 | 方法论来源 | 预期收益 |
|---|---|---|---|
| D-1 | hypothesis confidence tracking | 概率思维 / Bayesian updating | 让假设变化透明 |
| D-2 | flake/rerun stability check | 回归均值 | 避免单次测试通过误判修复成功 |
| D-3 | competing hypotheses table | Analysis of Competing Hypotheses | 对复杂 bug 防止单一路径锁定 |

**建议最小 patch**：D-1。D-2 只在 flaky/performance regression 场景触发。

---

### 3.7 `spec-optimize`：实验可靠性优化

**当前优势**：
- 已是 metric-driven iterative loop
- 与概率思维、大数定律、回归均值天然契合

**建议优化**：

| 优化编号 | 优化点 | 方法论来源 | 预期收益 |
|---|---|---|---|
| O-1 | baseline min_runs | 大数定律 | 防止单次 baseline 噪声 |
| O-2 | stability_check | 回归均值 | 防止单次 winner 偶然成功 |
| O-3 | diminishing_returns detection | 边际效用递减 | 避免同类实验无效消耗 |
| O-4 | tipping point tracking | 临界点效应 | 判断是否接近质变阈值 |

**建议最小 patch**：O-1 + O-2。这两个直接提高实验可信度。

---

### 3.8 `spec-compound` / `spec-compound-refresh`：知识复利优化

**当前优势**：
- 已有 docs/solutions/ 结构化知识沉淀
- refresh workflow 已覆盖 stale / overlapping / inaccurate / consolidate

**建议优化**：

| 优化编号 | 优化点 | 方法论来源 | 预期收益 |
|---|---|---|---|
| K-1 | reuse_count / last_referenced | 复利效应 / 大数定律 | 知识价值可度量 |
| K-2 | Structured Promotion Gate 强化 | 公地悲剧 | 复用现有 promotion gate 防止知识库污染 |
| K-3 | verified_in_scenarios | 回归均值 | 标注单案例 vs 多案例可信度 |
| K-4 | applied_in 背书字段 | 社会认同 | 用真实成功案例增强采纳信任 |
| K-5 | corpus health / tipping point | 临界点效应 | 识别知识库成熟阶段 |

**建议最小 patch**：K-1 + K-2。K-2 必须并入现有 `Structured Promotion Gate`，不新增并行 gate 或 schema。K-3/K-4/K-5 可随后按数据积累成熟度推进。

---

### 3.9 `spec-skill-audit` / `spec-write-skill`：skill 治理优化

**当前优势**：
- 明确把 skill 当作 engineering protocol，而不只是 prompt
- source/runtime boundary 强
- spec-write-skill 已有 quality tiers 与 qualification 判断

**建议优化**：

| 优化编号 | 优化点 | 方法论来源 | 预期收益 |
|---|---|---|---|
| S-1 | commoditization_risk | 创造性破坏 | 识别被 host primitive 替代的 skill |
| S-2 | replacement_analysis | 创造性破坏 / 奥卡姆剃刀 | 新建 skill 前先证明净收益 |
| S-3 | blind_spots / failure modes 强化 | 能力圈 | skill 能力边界更清晰 |
| S-4 | diminishing returns on skill length | 边际效用递减 | 防止 SKILL.md 越写越长、可执行性下降 |

**建议最小 patch**：S-1 + S-2。它们直接服务「不要把 spec-first 变成 prompt collection」的项目边界。

---

## 四、优先级矩阵与落地路线图

### 4.1 优先级判定标准

| 维度 | 说明 |
|---|---|
| 用户价值 | 是否减少真实研发返工、误判、低质量输出 |
| 改动成本 | 是否只改 skill prose / references，还是需要脚本/schema/test |
| 风险 | 是否会增加 workflow 仪式感或破坏现有 contract |
| 复用性 | 是否跨多个 workflow 受益 |
| 可验证性 | 是否能写 eval/test 验证 |

---

### 4.2 P0 候选：建议先补证据后落地（高收益、低成本）

| 编号 | 名称 | 涉及 skill | 改动类型 | 理由 |
|---|---|---|---|---|
| P0-1 | OQ 放大风险评分 | spec-prd | prose + eval first；checker optional | 先用历史 OQ 返工样本或 eval 证明收益，再考虑 checker |
| P0-2 | 假设链路追踪 | spec-plan | template/prose + fresh-source eval | 帮 spec-work 快速定位假设失效影响，但需验证不会仪式化填表 |
| P0-3 | scope_creep_check | spec-work | prose/checklist + focused eval | 成本低，防止常见执行漂移；进入实施前需确认与既有 stop_if / scope boundary 不重复 |
| P0-4 | reviewer agreement 表达复核 | spec-code-review | reuse-first；schema 延后 | 现有 Reviewer column + cross-reviewer promotion 已存在，先评估 consumer gap |
| P0-5 | Structured Promotion Gate 强化 | spec-compound | 复用现有 gate | 防止 docs/solutions 公地污染，不能新增第二套 `knowledge_quality_gate` |

### 4.3 P1 候选：第二阶段复核后落地（高价值、中等成本）

| 编号 | 名称 | 涉及 skill | 改动类型 | 理由 |
|---|---|---|---|---|
| P1-1 | Top-3 High-Leverage Risks | spec-plan | template/prose | 帕累托聚焦，改动小 |
| P1-2 | map_vs_territory_log | spec-work | closeout/prose | 执行校准价值高 |
| P1-3 | baseline min_runs + stability_check | spec-optimize | 待 eval；schema 延后 | `spec-optimize` 未经 §G/§H 复核，需先证明单次样本误判是当前高频问题 |
| P1-4 | hypothesis confidence tracking | spec-debug | prose/template | 强化科学调试 |
| P1-5 | commoditization_risk | spec-skill-audit | prose/report format | 守住非 prompt collection 边界 |

### 4.4 P2：数据成熟后落地（需要跨 run 数据）

| 编号 | 名称 | 涉及 skill | 前置条件 |
|---|---|---|---|
| P2-1 | reuse_count / last_referenced | spec-compound + plan/work/debug | 需要 internal command 或 frontmatter update 机制 |
| P2-2 | reviewer 有效性追踪 | spec-code-review + compound | 需要 finding→reviewer→solution 链路数据 |
| P2-3 | standards high_impact | team-standards-governance + code-review | 需要标准命中与 finding 数据 |
| P2-4 | readiness / corpus tipping point | mcp-setup + compound-refresh | 需要足够历史样本 |

---

## 五、最小可维护实施顺序

### Phase 1：证据基线与 H 章修订落地（0.5-1 天）

目标：先证明要改的问题真实存在，并把执行口径对齐 §H 修订版；不先动 schema/checker。

1. 建立最小 targeted regression eval / fresh-source baseline：每个将被修改的 surface 至少补 2-4 个覆盖被下沉 trigger、hard gate、output contract 的回归样本；已有 examples 不重复铺量。
2. 对照 §H.14 / §H.15，先修正会误导执行的旧措辞和旧优先级。
3. 复核现有能力：`spec-code-review` 的 Reviewer column + cross-reviewer agreement、`spec-compound` 的 Structured Promotion Gate、`spec-work` 的 stop_if / scope boundary 是否已覆盖需求。
4. 只有确认存在缺口后，才进入单个 Progressive Disclosure 试点，不同时展开多个 workflow。

**验证**：
- docs-only 修订：`git diff --check`
- 触及 skill prose：针对 changed skills 做 fresh-source eval
- 触及测试 fixture：`npm run test:unit` 或聚焦 contract tests

### Phase 2：单个 Progressive Disclosure 试点（1-2 天）

目标：只选择一个已由 Phase 1 证明需要修改的候选点，完成「主干最小合同 + 触发式 reference + 等价 eval」闭环；其余候选继续留在 backlog。

候选试点优先级：
1. `spec-code-review`：headless output template 下沉。
2. `spec-plan`：High-Level Technical Design 决策表下沉。
3. `using-spec-first`：Artifact Boundaries 压缩。

暂不在同一开发包中处理 `spec-prd` OQ amplification、`spec-work` scope creep attention prompt、`spec-compound` gate prose；这些属于 workflow 质量增强线，需要单独 eval 和历史失败样本。

**验证**：
- `npm run lint:skill-entrypoints`
- fresh-source eval 或等价 fresh read-only reviewer
- 聚焦 contract tests（若已有 anchor）

### Reference 下沉的主干保留契约

任何 `reference` 化都必须先写清以下 5 项，缺一不可：

| 项 | 要求 |
|---|---|
| `trigger` | 主干保留何时加载 reference 的条件，不能只写「详见 reference」。 |
| `summary` | 主干保留 1-3 行语义摘要，让模型不加载 reference 也知道安全默认行为。 |
| `must_stay_inline` | 明列不可下沉的 hard gate、activation gate、source/runtime boundary、phase-local reminder。 |
| `fallback_when_unread` | reference 未加载或触发条件不明时，主干应采取的保守行为。 |
| `equivalence_eval` | 至少 2-4 个样本证明下沉前后触发、输出字段、STOP 条件不退化。 |

Progressive Disclosure 的目标不是把细节藏起来，而是让默认层保留足够 signpost；细节只有在对应输入路径触发时才展开。

### Phase 3：schema/checker 优化（consumer-proven 后）

目标：只有当现有 prose/report surface 不能满足明确 consumer 时，才把字段纳入 deterministic floor。

1. `spec-code-review`：仅当 Reviewer column + cross-reviewer promotion 不能满足 report/headless consumer 时，才考虑新增 `consensus` 字段。
2. `spec-optimize`：`baseline.min_runs` / `stability_check` 需先有 metric/eval 证明单次样本误判是高频问题。
3. `spec-prd`：checker 只校验结构存在和值域，不判断 OQ 语义上是否真的 high amplification。
4. 对应更新 schema、contract tests 和 downstream fixtures。

**验证**：
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:integration`（涉及 workflow contract 时）

### Phase 4：跨 run 数据闭环（1-2 周）

目标：让复利、帕累托、大数定律从理念变成可度量系统。

1. 增加 `spec-first internal knowledge-reuse record`
2. spec-plan/spec-work/spec-debug 引用 docs/solutions 时记录 reuse_count
3. spec-compound-refresh 根据 reuse_count 排序刷新优先级
4. code-review finding 关联 reviewer / standard / solution
5. team-standards-governance 输出 high-impact standards 报告

**验证**：
- 新 internal command unit tests
- frontmatter migration/backfill test
- compound-refresh report fixture test

---

## 六、风险与反模式

### 6.1 主要风险

| 风险 | 说明 | 缓解 |
|---|---|---|
| 过度字段化 | 每个思维模型都加字段会让 skill 更重 | P0 也先走 eval/reuse-first；schema 只有 consumer-proven 后进入 |
| LLM 仪式化填写 | 新字段可能变成模板填空而非真实判断 | 只要求影响后续 workflow 的字段，不做无用 metadata |
| 脚本越权语义判断 | checker 不应判断语义充分性 | 脚本只检查字段存在/合法值，LLM 判断内容质量 |
| knowledge counter 污染 | reuse_count 可能被机械引用刷高 | 只在引用影响决策时记录，非所有搜索命中都计数 |
| reviewer fan-out 反弹 | 把 agreement 字段化后可能诱导更多 reviewer | 先复用现有 Reviewer column；若未来新增字段，也只能表达既有 reviewer 结果，不强制增加 reviewer |

### 6.2 反模式清单

- 不要把 16 个模型变成每个 workflow 必填清单
- 不要新增一个 `mental-models` public workflow；这会把方法论从 embedded judgment 变成外部仪式
- 不要让脚本判断「这个 OQ 语义上是否真的 high amplification」；脚本只能读取 LLM 声明和结构合法性
- 不要把 reuse_count 当作知识正确性的证明；它只是使用频率，不是 truth
- 不要因为社会认同而制造虚假背书；只记录真实应用与可验证结果

---

## 七、推荐首个实施切片

如果只做一个小而高价值的实施切片，建议选择：

### `Progressive Disclosure Reference Extraction Pilot`

**目标**：选择一个已被源码复核支持的下沉点，验证「主干最小合同 + 触发式 reference + targeted eval」是否能减少 skill 主干负担且不降低行为质量。

**执行前置条件**：

1. 从 H.14 P0 中只选一个试点，不跨 workflow 打包。
2. 为该试点补 2-4 个 targeted regression eval，覆盖 trigger、must-stay-inline、output contract。
3. 写清主干保留契约：`trigger`、`summary`、`must_stay_inline`、`fallback_when_unread`、`equivalence_eval`。
4. schema/checker/counter 延后到 consumer-proven。

**首选试点**：

| 顺位 | 试点 | 为什么适合先做 | 必须保留 inline |
|---|---|---|---|
| 1 | `spec-code-review` headless output template 下沉 | 输出模板体量大、路径明确、可用字段完整性 eval 验证 | detail enrichment、formatting rules、terminal signal、P0/P1 visibility |
| 2 | `spec-plan` HTD 决策表下沉 | 属于按需展开的设计细节，H 章已要求保留 L221 framing | 何时考虑 HTD、L221 framing、return-to-plan / source boundary |
| 3 | `using-spec-first` Artifact Boundaries 压缩 | 边界语义清晰，收益小但风险较低 | 不生成 pseudo-plan/task/review artifact 的核心规则 |

**不包含**：
- 不新增 public workflow
- 不新增 agent
- 不先做 cross-run counter
- 不先新增 reviewer consensus schema 字段
- 不新增第二套 knowledge promotion gate
- 不同时修改 PRD / plan / work / compound 多个 workflow
- 不改 generated runtime mirrors
- 不做大规模 schema migration

**为什么这是候选首切片**：
- 符合 Progressive Disclosure：默认层只保留触发条件、安全摘要和 hard boundary，细节按需加载。
- 影响面单一，能用 targeted eval 证明下沉前后行为等价。
- 与项目核心哲学一致：Light contract + Explicit boundaries + Deterministic floor。

---

## 八、最终结论

这 16 个思维模型对 spec-first 的最大价值，不是把每个模型做成一个新的 checklist，而是把它们嵌入现有 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 链路中的关键判断点：

- **蝴蝶效应**提醒我们：早期需求歧义会在 plan/work/review 中放大，所以要标记 OQ 放大风险。
- **复利效应**提醒我们：知识沉淀必须可追踪使用，否则无法形成真实复利。
- **第一性原理 + 奥卡姆剃刀**提醒我们：不要让 workflow 在惯例和复杂度上越堆越重。
- **概率思维 + 大数定律 + 回归均值**提醒我们：review finding、debug root cause、optimize winner 都不能建立在单次直觉或单次样本上。
- **能力圈 + 帕累托法则 + 边际效用递减**提醒我们：skill/persona/agent 都有边界，资源应投向关键少数，而不是无限 fan-out。
- **二阶思维 + 地图不是疆域 + 临界点效应**提醒我们：计划不是现实，规则会改变行为，系统能力需要跨越临界点才会质变。

因此，推荐的优化策略是：

> **不新增方法论 workflow，而是在现有高频 workflow 的最关键决策点植入轻量方法论字段和注意力提示；先选一个 Progressive Disclosure 试点并补 targeted regression eval，再做单点 reference 下沉，最后按 consumer-proven gap 推进 schema 与跨 run 指标。**

---

# 附录：各 Skill Prompt 精炼深度审查报告

> 本附录是对「方法论结合 skill 优化」落地到 prompt 精炼的逐 skill 深度执行结果。
> 审查框架：**A类（可删）** 、**B类（移入 reference）** 、**C类（合并）**，不动：hard gate、workflow contract、Interaction Method、Anti-Rationalization Red Flags。
>
> **状态说明**：附录 A-F 为初版 prompt 精炼分析，已被 §G/§H 的源码对抗性审查部分修正。A-F 中的「全部删除」「零风险」「整体减少 31%」只能作为历史分析脉络，不能作为实施依据；执行以 §H.14 / §H.15 的修订版和当前 source 复核为准。

---

## 审查汇总：精炼潜力总览（历史初版，不作为当前目标）

> 本表保留用于追溯初版乐观估算。当前默认阅读路径应优先看 §H.14 / §H.15；不要把 31% 当作开发目标或成功标准。

| Skill | 当前行数 | 精炼后估计 | 减少量 | 减少% |
|---|---|---|---|---|
| spec-code-review | 1241 | ~830 | ~411 | **33%** |
| spec-compound-refresh | 717 | ~460 | ~257 | **36%** |
| spec-compound | 646 | ~500 | ~146 | **22%** |
| spec-work | 579 | ~360 | ~219 | **38%** |
| spec-optimize | 737 | ~610 | ~127 | **17%** |
| spec-plan | 460 | ~295 | ~165 | **36%** |
| spec-debug | 402 | ~255 | ~147 | **37%** |
| spec-doc-review | 312 | ~195 | ~117 | **37%** |
| using-spec-first | 235 | ~165 | ~70 | **30%** |
| **合计** | **5329** | **~3670** | **~1659** | **~31%** |

**跨 skill 规律：**
- A类冗余集中在「结尾的原则/哲学章节」和「执行流程内嵌的 LLM 已知惯例」
- B类冗余集中在「完整 shell/JS 实现」和「单一路径触发的详细规则」
- C类冗余最常见于 AskUserQuestion 加载提醒、source/runtime 边界声明在同一文件多处重复

---

---

## 官方最佳实践参考基线

本节汇总 Anthropic / OpenAI Codex 官方文档对 prompt / skill 设计的核心建议，作为后续 skill 精炼的判断基准。

### Anthropic 官方 Prompt Engineering 原则（对 skill 精炼的直接启发）

| 原则 | 对 skill 精炼的含义 |
|---|---|
| **明确 > 冗余** | 「把要求展示给一个没有背景的同事看；如果他会困惑，Claude 也会」。重复表达同一约束不能提升遵守率，只会增加噪音 |
| **上下文窗口效率** | 模型对出现在开头和末尾的内容保留最强，中间长段容易丢失。关键 hard gate 必须在显眼位置 |
| **矛盾指令是危险的** | 「Be concise」+ 「always provide detailed explanations」会让模型随机选择。多处重复同一约束可能产生互相矛盾的子句 |
| **示例 > 长描述** | 用少量具体 example 替代大段解释性 prose，模型对 example 的对齐效果通常更好 |
| **结构化 > 线性散文** | 使用 XML 标签、markdown 标题使 skill 可扫描；散文式长段对模型的"注意力分配"效率低 |
| **避免 aspirational prose** | 「理想情况下...」「应该尽量...」类语句不产生行为约束，只浪费 token |

### OpenAI AGENTS.md / Codex 官方指导原则

| 原则 | 对 skill 精炼的含义 |
|---|---|
| **AGENTS.md = project-level system prompt** | 每次 session 都会全量加载，因此 brevity 直接影响效率；不必要的内容是每次启动的固定成本 |
| **层级化：根 → 子目录（更具体 = 更高优先级）** | spec-first 的 Front Controller + Triggered References 模式与此完全对应：主干只放路由判断，细节放 references |
| **不属于 AGENTS.md 的内容**：功能如何实现的文档（那是 README）、模型可以从代码中自行发现的实现细节 | 直接对应 A 类可删内容：LLM 已知的编程惯例、执行级 shell/JS 实现细节 |
| **属于 AGENTS.md 的内容**：repo 结构、编码规范、测试命令、不应改动的敏感文件、hard stop 条件 | 直接对应「必须保留」：hard gate、source/runtime 边界、workflow contract |
| **优先级：重要指令放在顶部** | hard gate 和 workflow contract 应在 skill 开头，不应被大量背景叙事埋在中间 |

### 关键推论：三条 skill 精炼判断标准

```
判断1：这段内容是否表达了一个当前 LLM（Opus/Sonnet）在没有这段指令时会错误执行的行为？
  → 否 → A类，可删

判断2：这段内容是否只在特定输入路径（低频）下才会被读取？
  → 是 → B类，移入 reference（按需触发加载）

判断3：这段约束是否已在其他位置表达过？
  → 是 → C类，合并保留最权威一处
```

---

## A.1 spec-code-review（1241行 → ~830行，减少33%）

### 承重内容（不可动）
Argument Parsing 模式表、Mode Detection 四模式定义及 rules、P0-P3 Severity Scale、reviewer 三张选择表、Stage 3 scale-aware minimum-set 判断、Stage 4 dispatch capability gate、Stage 5 confidence anchors + cross-reviewer promotion、Quality Gates 七条、Diff Boundary Review 字段与 verdict rules、After Review 路由策略。

### Top-3 最大可精炼块

| 排名 | 位置 | 类型 | 行数 | 建议 |
|---|---|---|---|---|
| 1 | Stage 1 shell 脚本（L319-463） | B | ~144 | 三路径 bash 实现整块移入 `references/stage1-scope-resolution.md`，主干保留5行：STOP 条件 + 输出字段摘要 |
| 2 | Headless output format（L951-1057） | B | ~107 | 静态字段枚举模板移入 `references/headless-output-template.md`，与已有 `review-output-template.md` 对称处理 |
| 3 | Stage 5步骤6a/6b/6c + Stage 5b（L831-913） | B | ~83 | finding_type derive规则+action mapping表移入 `references/findings-synthesis.md`；Stage 5b 整体移入 `references/stage5b-validation.md` |

### 其余可精炼区域

| 行号范围 | 类型 | 建议 |
|---|---|---|
| L11-44 | C | Workflow Contract Summary 7小节展开叙述压缩为3-5行要点 |
| L75-83 | A | Anti-Rationalization Red Flags 表→1行 inline 注意事项或移入 reference |
| L89-99 | C | Cache-Friendly Context Layout + Résumé-First Handoff 合并为一个节 |
| L184-215 | C | Autofix/Report-only/Headless 三处「never commit/push/PR」重复，提取为共享规则 |
| L493-521 | B | Stage 2b plan discovery + 2c boundary source discovery 移入 `references/stage2-plan-boundary-discovery.md` |
| L614-639 | B | Graph-assisted impact candidates 字段枚举移入 `references/graph-impact-coverage.md` |
| L1097-1127 | B | After Review interactive 四选项详细说明移入 `references/after-review-interactive.md` |

---

## A.2 spec-compound-refresh（717行 → ~460行，减少36%）

### 承重内容（不可动）
Workflow Contract Summary、Mode Detection、Structured Promotion Gate、Replace subagent one-at-a-time、auto-delete三条件、inbound-link check、Phase 0-5 主流程、五类 outcome（Keep/Update/Consolidate/Replace/Delete）定义。

### 可精炼区域

| 行号范围 | 类型 | 内容摘要 | 建议 |
|---|---|---|---|
| L85-97 | A/C | Interaction Principles 与 Phase 3 Question Style 重复 | 删除独立节，保留 autofix skip 提示 |
| L107-113 | A | "Why this order" 解释 | 删除，LLM 可从流程顺序推断 |
| L198-216 | B | Broad Scope Triage：inventory→clustering→spot-check→recommend | 移入 `references/phase0-triage.md` |
| L269-326 | B | Phase 1.75 Document-Set Analysis 五小节 | 移入 `references/document-set-analysis.md`，主干一行触发 |
| L469-531 | B | Interactive Question Style 三套模板 | 移入 `references/interaction-templates.md` |
| L338-343 | A | subagent 工具使用通用提醒 | 删除或压缩为一句 |

### 核心判断
这是典型的 B 类 overweight：主干把大量「具体怎么问、怎么聚类、怎么做 document-set analysis」都内联了。按照 Codex/AGENTS.md 的「项目指令放关键约束，操作细节放文档」原则，应把模板和流程细节下推，只保留触发条件与 hard boundaries。

---

## A.3 spec-compound（646行 → ~500行，减少22%）

### 承重内容（不可动）
Workflow Contract Summary、Execution Strategy、critical_requirement 块、Phase 0.5–2 操作步骤、overlap check 表、Structured Promotion Gate、frontmatter 验证命令、Discoverability Check、Success/Alternate Output 格式。

### 可精炼区域

| 行号范围 | 类型 | 内容摘要 | 建议 |
|---|---|---|---|
| L14 | A | "Why compound?" 品牌叙事 | 删除 |
| L100-104 | B | Distilled Replay References 低频规则 | 移入 reference |
| L145-161 | C | memory scan 步骤重复表达 | 压缩为4-5行 |
| L222-238 | B | Related Docs Finder grep-first 7步策略 | 移入 subagent prompt模板 |
| L319-363 | B | Selective Refresh Check 8+4规则 | 压缩为5行决策表，详细示例入 reference |
| L474-480 | A | What It Captures 与 Phase 2 重复 | 删除 |
| L497-524 | C | solution category 枚举与 schema 重复 | 改为引用 `references/yaml-schema.md` |
| L590-607 | A | Compounding Philosophy | 删除 |
| L619-643 | C | Applicable Specialized Agents 与 Phase 3 重复 | 删除 |

### 核心判断
spec-compound 的问题不是 workflow 不清晰，而是结尾堆了太多「解释为什么 compound 重要」和「agent 列表复述」。这类内容不属于每次 session 必加载的 skill spine。按 Anthropic「明确行动约束优先」原则，应删除哲学叙事，保留 artifact contract 与 validation gate。

---

## A.4 spec-work（579行 → ~360行，减少38%）

### 承重内容（不可动）
Workflow Contract Summary、Scenario Capability overrides、Phase 1 task-pack identity/freshness validation、Parallel Safety Check 的判断入口、Host capability matrix 的约束本身、Run Artifact Boundary、User-Facing Handoff Contract、Anti-Rationalization Red Flags、Runtime Context Exclusion。

### 可精炼区域

| 行号范围 | 类型 | 内容摘要 | 建议 |
|---|---|---|---|
| L536-579 | A | Key Principles + Common Pitfalls 44行 | 完整删除；与 Phase 2 执行逻辑重复 |
| L483-495 | A | Follow Existing Patterns 通用惯例 | 删除 |
| L491-497 | A | Test Continuously 与 Task Loop 重复 | 删除 |
| L516-524 | A/B | Figma Design Sync 极低频触发 | 压缩为 Phase 2 一句 inline 注释 |
| L330-390 | B | Parallel Safety Check + Host capability matrix 61行 | 移入 `references/execution-strategy.md`，主干保留触发和 stop condition |
| L210-234 | B | task-pack semantic_posture / dispatch_authorization 细节 | 移入 `references/task-pack-validation.md` |
| L422-445 | B | System-Wide Test Check 五问题表 | 移入 `references/test-strategy.md` |

### 核心判断
`spec-work` 是最适合用奥卡姆剃刀瘦身的 skill。结尾 Key Principles / Common Pitfalls 全部是 LLM 已知工程常识，并且前文已有具体执行循环，因此它们不仅不增加执行质量，反而稀释 hard gate 的注意力。

---

## A.5 spec-optimize（737行 → ~610行，减少17%）

### 承重内容（不可动）
Workflow Contract Summary、Interaction Method、Admission And Budget Gate、Persistence Discipline、Runtime Context Exclusion、Phase 0.1-0.5、Phase 1全流程、Phase 2 Hypothesis Generation、Phase 3 Loop、Stopping Criteria、Phase 4 Wrap-Up。

### 可精炼区域

| 行号范围 | 类型 | 内容摘要 | 建议 |
|---|---|---|---|
| L78-90 | A | Quick Start 6条 advisory | 删除，Admission Gate 已覆盖 |
| L217-237 | B | hard/judge 类型教育解释 | 移入 `references/usage-guide.md` |
| L239-292 | B | Sampling wizard + Rubric wizard | 移入 usage guide 或 example specs |
| L459-462 | B | Hypothesis 类别枚举 | 移入 schema yaml 注释 |
| L578-586 | A | Why immediately + Karpathy 引用 | 删除 |
| L661-674 | C | Cross-Cutting Concerns 展开 | 合并为5行表格 |

### 核心判断
`spec-optimize` 的整体承重比例高，不能像 spec-work 那样大幅删除。主要精炼对象是首次创建 optimization spec 时的 wizard 教学内容；这类内容不该在每次 optimize loop 中加载。

---

## A.6 spec-plan（460行 → ~295行，减少36%）

### 承重内容（不可动）
Plan-Only Safety Contract（5条 hard gate）、Workflow Contract Summary、Interaction Method（AskUserQuestion 加载时机及 fallback）、Phase 0-5 workflow 骨架与 STOP 指令、U-ID 稳定性规则、Phase 5.1 pre-write 审查清单、Post-generation handoff menu、Plan Quality Bar。

### 可精炼区域

| 行号范围 | 类型 | 内容摘要 | 建议 |
|---|---|---|---|
| L96-108 | **A** | Core Principles 8条（全是 best practice，Phase 3-5 已覆盖）| 完整删除 |
| L199-254 | B/A | High-Level Technical Design 细则 55行 | 压缩为3句核心规则，细节移入 `references/plan-sections.md` |
| L273-305 | B | Plan Depth Guidance + Optional Extensions | 移入 `references/plan-sections.md`，主干仅保留三级名称和单元数范围 |
| L413-435 | B | Classify Plan Depth + deepening gate 23行 | 移入 `references/deepening-workflow.md`，主干1行 STOP 指针 |
| L109-120 vs L336-358 | C | Plan Quality Bar 与 Phase 5.1 review checklist 高度重叠 | Phase 5.1 保留详细清单，Plan Quality Bar 精炼为3-4条不重复标准 |
| L24/79/445 | C | AskUserQuestion 加载提醒三处重复 | 保留 Interaction Method 一处权威定义 |

### 核心判断
spec-plan 的「Core Principles 8条」是此次审查发现的最典型 A 类案例：每条原则都在 Phase 3-5 中有具体的操作化步骤对应，独立的 principles section 只是给 LLM 提供了阅读时的冗余信息，不能提升执行质量。

---

## A.7 spec-debug（402行 → ~255行，减少37%）

### 承重内容（不可动）
Workflow Contract Summary、Anti-Rationalization Red Flags 表、feedback_loop_not_possible 二元判断、Causal chain gate（有 gap 不得进 Phase 3）、Phase 3 workspace/branch check、Debug Summary 结构化模板、source/runtime 边界排除。

### 可精炼区域

| 行号范围 | 类型 | 内容摘要 | 建议 |
|---|---|---|---|
| L63-68 | A | Core Principles 4条（与 Phase 2/3 重复）| 删除独立 section，保留 Phase 内的 inline reminder |
| L128-158 | B | Feedback loop 9种方式 + readiness checklist | 9种方式属通用知识，移入 `references/feedback-loop.md` |
| L165-192 | B | Issue tracker fetch 细节 + 三种特殊 repro 路径 | 低频输入路径，移入 `references/investigation-techniques.md` |
| L194-222 | A | 环境理智检查6项 + 代码追踪方法 | 通用调试常识，压缩为2行原则 |
| L239/308 | C | "Reminder: investigate before fixing"、"one change at a time" 各两处 | 各保留一处 |
| L394-402 | C | Learning capture 三层判断与 spec-doc-review 逐字相同 | 提取为跨 skill 共享 reference |

### 核心判断
spec-debug 最大冗余是通用调试方法论内容（Core Principles、环境检查、代码追踪）——这些是 Claude Opus 的既有能力，无需在 skill 中显式教授。L394-402 的 Learning Capture 三层判断与 spec-doc-review 几乎逐字相同，是明确的跨 skill 重复，应提取为共享 reference，统一维护。

---

## A.8 spec-doc-review（312行 → ~195行，减少37%）

### 承重内容（不可动）
Workflow Contract Summary、Dispatch Capability Gate（区分「能力」与「授权」的硬边界）、single-agent fallback 触发条件、Phase 0 headless mode 检测、source/runtime context 排除、Phase 2 AskUserQuestion 预加载规则。

### 可精炼区域

| 行号范围 | 类型 | 内容摘要 | 建议 |
|---|---|---|---|
| L58-62 | C | Résumé-First + context ledger 与 context-bundle.md 重复 | 保留一句引用原则 |
| L116-141 | B | task-pack ID coverage pass 规则（约25行）| 移入 `references/task-pack-review.md` |
| L155-167 | A | product-lens 两条 leg 14个 bullet | 每个 persona 保留1-2个关键 trigger signal |
| L196-200 | B | codebase_facts 构建细节 | 保留「必须替换 placeholder」硬约束，其余入 reference |
| L255-257 | B | Codex spawn_agent 参数细节 | 已有 reference，主干删除 |
| L288-300 | A | Learning Capture 三层判断（与 spec-debug 相同）| 改为引用共享 reference |

### 核心判断
product-lens 14条 bullet 是「aspirational heuristic」的典型——LLM 在实践中本就会判断是否激活 product lens，不需要14条帮助提醒。Dispatch Capability Gate 区分「能力」与「授权」是这个 skill 最核心的承重内容，现有表达精准，不应精简。

---

## A.9 using-spec-first（235行 → ~165行，减少30%）

### 承重内容（不可动）
Contract Summary 表格、Route Map 完整表、Routing Priority 8级优先序、External Issue/PR 路由规则、Decision Output Contract、Source Of Truth 边界声明、Exit Condition。

### 可精炼区域

| 行号范围 | 类型 | 内容摘要 | 建议 |
|---|---|---|---|
| L8-14 | A/C | preamble 中双宿主安装细节与 CLAUDE.md managed block 重复 | 压缩为2行 |
| L38-48 | C | Reference Files 9条说明 | 压缩：保留文件名，说明合并为一句原则 |
| L66-74 | B | Multi-Session Awareness bash 细节（已有 reference）| 主干保留「active_count≥2 时输出一行 advisory」 |
| L181-206 | B | Codex dispatch + startup reminder 细节 | 已有 reference，主干2行 |
| L210-215 | C | Injection Behavior 与 Source Of Truth 高度重叠 | 合并 |
| L217-231 | C | Hard Rules + Routing Red Flags + Artifact Boundaries 三节指向同一 reference | 合并为一个 section |

### 核心判断
`using-spec-first` 精炼后可使 Route Map 和 Routing Priority 从占全文约25% 升至约35%，即「路由密度」更高。当前 Codex 特定逻辑（startup reminder、spawn_agent 参数）占据了约20行，全部已有 reference 兜底，可缩减到2行指针。

---

## B. 跨 Skill 共性问题

以下问题在多个 skill 中重复出现，建议统一治理：

| 共性问题 | 出现 skill | 建议 |
|---|---|---|
| **Learning Capture 三层判断** 几乎逐字重复 | spec-debug + spec-doc-review | 提取为 `docs/contracts/workflows/learning-capture.md` 共享 reference，两处各引用 |
| **AskUserQuestion 加载提醒** 在同一文件多次重复 | spec-plan（3次）、spec-code-review | 每个 skill 只保留 Interaction Method 章节一处权威定义 |
| **「never commit/push/PR」** mode 约束散落多处 | spec-code-review autofix/report-only/headless 各一次 | 提取为 mode-invariant 规则，各 mode rules 仅声明 delta |
| **Core Principles 章节** 重复 Phase 流程中的操作化步骤 | spec-plan（8条）、spec-debug（4条）、spec-work（7条） | 初版主张为全部删除；§G/§H 已修正为保留定义节点和承重原则，只压缩经源码复核的重复子句 |
| **Brand/Philosophy 叙事** 无操作含义 | spec-compound（Why compound）、spec-optimize（Karpathy 引用）| 初版主张为全部删除；未被 §G/§H 复核的 skill 只保留为待验证估计 |
| **通用工具使用提醒**（use dedicated file tools, not shell cat）| spec-compound-refresh subagent 指令中、其他 skill | 统一删除，这是 harness level 规则，不应重复在每个 skill 中 |

---

## C. Prompt 精炼实施路线图

### Phase 1：低风险 A 类候选（1-2 天，需聚焦验证）

下列内容是初版候选，不再视为「零风险直接删除」。进入实施前需按 §G/§H 复核源码承重语义，至少执行 diff-check；涉及 skill 行为的 prose 变化还需 fresh-source eval 或等价复核。

| Skill | 删除内容 | 估计行数 |
|---|---|---|
| spec-work | Key Principles + Common Pitfalls（L536-579）| 44 行 |
| spec-plan | Core Principles（L96-108） | 13 行 |
| spec-debug | Core Principles（L63-68）| 6 行 |
| spec-compound | Why compound + Philosophy + Agent 列表（L14、L590-607、L619-643）| 43 行 |
| spec-optimize | Quick Start advisory + Karpathy 引用 | 19 行 |
| spec-doc-review | product-lens 14 bullet 压缩为2行 | ~12 行 |
| using-spec-first | Injection Behavior + Artifact Boundaries 重复（可合并）| ~15 行 |
| **小计** | | **~152 行** |

验证命令：`npm run lint:skill-entrypoints`，对修改的 skill 做 `fresh-source eval`。

### Phase 2：C 类合并（2-3 天，改 prose，无新 reference）

| Skill | 合并点 | 估计收益 |
|---|---|---|
| spec-plan | AskUserQuestion 提醒从3处→1处 | 约20行 |
| spec-code-review | never commit/push/PR 从3处→共享1行 | 约15行 |
| spec-code-review | Cache-Friendly Context + Résumé-First 合并 | 约10行 |
| spec-debug + spec-doc-review | Learning Capture 三层提取为共享 reference | 约18行 |
| using-spec-first | Hard Rules + Routing Red Flags + Artifact Boundaries 三节合并 | 约20行 |
| **小计** | | **~83 行** |

验证：`npm run test:unit`（关注 skill contract tests）。

### Phase 3：B 类下沉 reference（1-2 周，需创建 reference 文件）

按 ROI 排序的 B 类迁移：

| 优先级 | Skill | 迁移目标 | 估计收益 |
|---|---|---|---|
| P0 | spec-code-review | Stage 1 shell 脚本 → `references/stage1-scope-resolution.md` | ~144 行 |
| P0 | spec-code-review | Headless output template → `references/headless-output-template.md` | ~107 行 |
| P1 | spec-compound-refresh | Document-Set Analysis → `references/document-set-analysis.md` | ~58 行 |
| P1 | spec-compound-refresh | Interactive Question Style → `references/interaction-templates.md` | ~63 行 |
| P1 | spec-work | Parallel Safety Check + Host matrix → `references/execution-strategy.md` | ~61 行 |
| P2 | spec-plan | Plan Depth Guidance → `references/plan-sections.md`（已存在）| ~33 行 |
| P2 | spec-debug | Feedback loop 细节 → `references/feedback-loop.md` | ~30 行 |
| P2 | spec-optimize | Sampling/Rubric wizard → `references/usage-guide.md`（已存在）| ~54 行 |
| **小计** | | **~550 行** |

验证：每个迁移后，做对应 skill 的 fresh-source eval 确认行为无退化。

---

## D. 执行优先级矩阵

```
               高收益
                  │
spec-work A类     │ spec-code-review B类（Stage 1 + Headless）
spec-plan A类     │ spec-compound-refresh B类
spec-debug A类    │
                  │
低成本 ──────────┼──────────────────── 高成本
                  │
using-spec-first  │ spec-code-review C类（合并）
C类合并           │ spec-work B类（matrix）
                  │
                低收益
```

**建议执行顺序**：
1. 右上象限优先：spec-code-review Stage 1 + Headless template（最大单块，风险适中）
2. 左上象限次之：spec-work / spec-plan / spec-debug 的 A 类候选（低风险但需验证）
3. 右上其余 B 类：compound-refresh、spec-work matrix
4. 左下 C 类合并：维护负担相对低，可与 Phase 1 同步完成

---

## E. 精炼注意事项与风险

### 不能动的 red lines

- 任何包含 `🔴 STOP` 或 `REQUIRED:` 的段落
- 所有 hard gate（「Handoff is blocking」「Question tools are mandatory」等）
- source/runtime boundary 声明
- Anti-Rationalization Red Flags 表格
- Workflow Contract Summary（可压缩格式，不可删内容）
- 所有 Interaction Method 规则

### 主要风险点

| 风险 | 级别 | 缓解方式 |
|---|---|---|
| 删除 Core Principles 后 LLM 在某些边缘 case 表现退化 | 低（原则已在 Phase 步骤中）| fresh-source eval 专项覆盖 |
| B 类迁移后 reference 未被正确触发 | 中（需 STOP 指针精确）| 每次迁移验证 `@./references/xxx.md` 格式 |
| 跨 skill 的共享 reference 被其中一个 skill 改坏 | 中 | 建立 contract test 锁定共享 reference 的关键段落 |
| Phase 3 迁移期间两份内容并存（旧 SKILL.md + 新 reference）| 低 | 每次迁移是原子操作，完成后立即删旧内容 |

---

## F. 附录：精炼总结

### 三类内容的识别规律（基于此次全量审查）

**A 类（可删）的典型模式：**
- 章节名含 "Principles"、"Philosophy"、"Why X" 的叙事段落
- 结尾的 "Common Mistakes"、"Key Principles" 之类总结章节
- 在 Phase 步骤中已操作化的高层原则的独立声明
- aspirational 语气词："should"、"ideally"、"aim to"

**B 类（移入 reference）的典型模式：**
- 完整 shell / JS 代码块（实现细节非路由判断）
- 触发条件只在某一类输入下成立的详细流程（"if input is task-pack, then..."）
- 格式模板（output template、question template）
- 7 步以上的详细操作 SOP

**C 类（合并）的典型模式：**
- 同一短语/约束出现 2+ 次（"never commit/push/PR"、"AskUserQuestion preload"）
- 两个 section 的"when to use"完全相同
- 末尾"Agent Applicability"、"Downstream Consumers"与正文 Phase 中已列举的信息重复

**必须保留的识别模式：**
- 🔴 STOP 或 REQUIRED: 前缀
- 任何包含具体 tool 调用时机规则（AskUserQuestion 何时预加载，ToolSearch 何时调用）
- source/runtime generated mirror 边界声明
- exit condition（什么情况 skill 直接终止）
- Anti-Rationalization Red Flags（LLM 最容易犯的错误类型）

---

## G. 对抗性审查修订：以源码事实校正精炼方案

> 本节是对前述精炼附录的 adversarial review 结果。审查要求：逐条回到 `skills/*/SKILL.md` 实际源码行号核实，不接受抽查式判断，不允许仅凭「看起来像冗余」删除承重规则。

### G.1 结论：前版精炼方案需要降级的主张

| 原主张 | 对抗性结论 | 修订后口径 |
|---|---|---|
| `spec-code-review` L319-463 Stage 1 shell 脚本可整块下沉 | ❌ 有误 | 只能抽出 PR remote 解析 shell 子块；Trivial-PR inline judgment、STOP 条件、mode checkout 禁止必须留主干 |
| `spec-code-review` L831-913 Stage 5 6a/6b/6c + Stage 5b 可下沉 | ❌ 有误 | 这些是 synthesis 核心算法与 hard gate，必须留主干；最多下沉解释性段落 |
| `spec-work` L536-579 Key Principles + Common Pitfalls 可完整删除 | ⚠️ 部分成立 | 大部分可删，但 L579「不要把 plan 重切成人类时间阶段」有独立约束，必须保留 |
| `spec-work` L483-495 Follow Existing Patterns 可删除 | ❌ 有误 | L488 含 Host Instruction Reuse Policy、team standards、hard/advisory 信任分类，必须保留或迁入 Phase 2 主循环 |
| `spec-plan` L96-108 Core Principles 可完整删除 | ❌ 有误 | P2/P6/P7/P8 含独立规则，不能完整删除；只能合并已覆盖项 |
| `spec-doc-review` product-lens 14 bullets 可压缩到1-2条 | ❌ 有误 | 实际是8条 trigger criteria，不是14条；它们是 persona activation gate，不是 aspirational prose |
| `spec-debug` Core Principles 可完整删除 | ❌ 有误 | L63 明确说明这些原则 govern every phase，Phase 2/3 的 reminder 是回调指针，不是替代定义 |
| `using-spec-first` Injection Behavior 可整体合并到 Source Of Truth | ⚠️ 部分成立 | L210-L211 行为禁止与路由指引独有，必须保留；只可删重复 source-of-truth 指针 |

### G.2 具体源码事实核实

#### G.2.1 `spec-code-review` Stage 1 不是纯 shell 实现

前版说：L319-463 是「纯粹执行实现」，可整块移入 `references/stage1-scope-resolution.md`。

源码事实反驳：该区间含多处 LLM 必须即时可见的路由与 hard gate：

- L338：禁止 `base:` 与 PR/branch target 组合，冲突时 stop with error。
- L342：`mode:report-only` / `mode:headless` 下禁止 shared checkout 切换。
- L344-L355：Trivial-PR judgment 明确要求 **conservative inline orchestrator judgment**，且禁止 Agent/Task/spawn_agent，因为 Stage 4 前尚未建立 reviewer dispatch authorization。
- L365 / L419：worktree 非 clean 时停止 checkout。
- L405 / L433 / L453：base ref 无法解析时必须 stop，不得 fallback 到 `git diff HEAD`。
- L463：untracked files 如需纳入 review 必须 stop 并要求用户先 `git add`。

**修订建议：**
- 可抽出：PR mode 中 L384-L403 的 remote fallback shell 实现。
- 必须保留：Trivial-PR 判断、mode checkout 禁止、base 解析失败 stop、untracked stop、dirty worktree stop。
- 主干摘要不能只有 5 行，必须完整列出 STOP 条件与 inline judgment 边界。

#### G.2.2 `spec-code-review` Stage 5 是合成算法核心，不是 reference 细节

前版说：L831-913 的 6a/6b/6c + Stage 5b 可下沉。

源码事实反驳：

- L835：高置信 `scope_creep` / `unauthorized_file_change` finding 必须留在 primary findings，不得降级到 residual/advisory。这是 governance hard gate。
- L838-L845：`autofix_class × suggested_fix -> recommended action` 映射表是 synthesis 即时查表逻辑。
- L849：tie-break 规则 `Skip > Defer > Apply > Acknowledge` 保证 rerun 稳定性。
- L857-L858：不同 mode 下 same issue 的可见性策略不同。
- L879-L889：Stage 5b when-to-run 表是路由决策表。
- L900：超过 15 findings 时只跳过 validator，不丢弃 finding。
- L909：P0/P1 unvalidated findings must remain visible。

**修订建议：**
- 不下沉 6a/6b/6c 和 Stage 5b 路由表。
- 只能下沉解释性 prose，例如「why per-finding validation」一类背景说明。

#### G.2.3 `spec-work` 的 Follow Existing Patterns 含项目治理规则

前版说：L483-L495 是通用编程惯例，可删除。

源码事实反驳：L488 包含三类 spec-first 特有治理语义：

1. `docs/contracts/team-standards.md` 的 confirmed team standards 选择路径。
2. Host Instruction Reuse Policy：限制何时读取 `AGENTS.md` / `CLAUDE.md` source。
3. hard context vs advisory 的 artifact 信任分类：written standards 是 hard context，prior plans/learnings/candidates/external-tool facts 是 advisory。

**修订建议：**
- L485-L487 / L489 可压缩。
- L488 必须保留，或迁入 Phase 2 `Follow Existing Patterns` 的核心指令中，不能删除。

#### G.2.4 `spec-work` Common Pitfalls 不能整段删除

前版说：L536-L579 可完整删除。

源码事实反驳：L579 的 `Re-scoping the plan into human-time phases` 是独有约束：不得按人类工时将 plan 拆成「本 session 子集」，agent 执行速度与 context 压力应由 subagent dispatch / plan 减 scope 解决，而不是临时重切计划。

**修订建议：**
- L536-L568 大部分 principles 可删或压缩。
- L570-L578 大部分 pitfalls 可删。
- L579 必须移入 Anti-Rationalization Red Flags 或 Phase 0 oversized intake，而不能删除。

#### G.2.5 `spec-plan` Core Principles 不能完整删除

前版说：L96-L108 八条 Core Principles 可完整删除。

源码事实核实：

| 原则 | 对抗性结论 |
|---|---|
| P1 Use requirements as source of truth | Phase 5.1 部分覆盖，但「build from rather than re-inventing」的定性仍有价值，可合并 |
| P2 Decisions, not code | Phase 4.3 覆盖一部分，但 pseudo-code / DSL grammar 的许可边界与 framing nuance 需保留 |
| P3 Research before structuring | Phase 0/1 已覆盖，可删 |
| P4 Right-size the artifact | Phase 4.1 已覆盖，可删 |
| P5 Separate planning from execution discovery | Phase 3.6 / 5.1 覆盖，可删 |
| P6 Keep the plan portable | Phase 3-5 无对应；必须保留 |
| P7 Carry execution posture lightly | Phase 5.1 只检查 execution note，未覆盖「不要变成 choreography」；须保留 |
| P8 Honor user-named resources | Phase 3-5 无对应，且含 `command -v` / fetch / read 前置发现规则；必须保留 |

**修订建议：**
- 不要完整删除 Core Principles。
- 可把 P3/P4/P5 合并到 Phase 0/4；P2/P6/P7/P8 必须保留或迁入对应 Phase。

#### G.2.6 `spec-plan` High-Level Technical Design 可下沉，但不能压成 3 句

前版说：L199-L254 可压成 3 句。

源码事实：

- L203-L213 是 work type → best overview form 的决策表，含非显然映射，如 `Mode/flag combinations -> Decision matrix`、`DSL/API surface -> Pseudo-code grammar`。
- L221 是必须嵌入计划的 framing 文本："This illustrates the intended approach... not implementation specification..."。

**修订建议：**
- 可将决策表和 skip 条件移到 reference。
- 主干至少保留：何时考虑 + L221 framing 原文 + reference 指针。目标应为约 10 行，不是 3 句。

#### G.2.7 `spec-debug` Core Principles 是定义节点，不是冗余

前版说：L63-L68 可删。

源码事实：L63 明确说 `These principles govern every phase. They are repeated at decision points because they matter most when the pressure to skip them is highest.`

Phase 2/3 的 `Reminder` 是对 Core Principles 的回调：
- L239：investigate before fixing。
- L257：prediction wrong but fix appears to work means symptom, not root cause。
- L308：one change at a time。

**修订建议：**保留 Core Principles；可略缩解释性细节，但不能删除全节。

#### G.2.8 `spec-doc-review` product-lens bullet 是触发条件，不是 aspirational

前版说：14 个 bullet 可压缩。

源码事实：实际是 8 个 bullet，分为两条 leg：
- Leg 1：challengeable premise claims。
- Leg 2：strategic weight。

这些 bullet 是 OR 关系的 activation gate，用来判断是否启用 `spec-product-lens-reviewer`。压到 1-2 条会降低 persona 触发召回率。

**修订建议：**不裁减；可加一行总原则，但保留 8 个 trigger examples。

#### G.2.9 `using-spec-first` Artifact Boundaries 可压缩但不可删除

前版说：L225-L231 已被 Contract Summary 覆盖，可删除。

源码事实：重复项确实存在：
- L226 与 Contract Summary L23 重复。
- L229 与 L28 重复。

但独有内容包括：
- L227：正面定义 only decides entry routing or gives next-step recommendation。
- L231：selected workflow owns artifacts, validation evidence, final judgment。
- L231：禁止 pseudo-plan / pseudo-task / pseudo-review artifacts。

**修订建议：**压缩到 2-3 行，不删除。

### G.3 修订后的 Prompt 精炼优先级

对抗性审查后，原先「约31%整体减少」应降级为更保守估计：

| Skill | 原估计减少 | 修订后估计减少 | 降级原因 |
|---|---:|---:|---|
| spec-code-review | 33% | **12-18%** | Stage 1/Stage 5 含大量 hard gate，不能整块下沉 |
| spec-work | 38% | **18-24%** | Follow Existing Patterns 与 Re-scoping pitfall 含独立治理规则 |
| spec-plan | 36% | **18-25%** | Core Principles 中 4 条 load-bearing，HTD framing 文本须保留 |
| spec-debug | 37% | **15-22%** | Core Principles 是定义节点，不能删 |
| spec-doc-review | 37% | **18-25%** | product-lens triggers 不可裁 |
| using-spec-first | 30% | **15-20%** | Injection Behavior / Artifact Boundary 均有独有行为边界 |
| spec-compound / refresh / optimize | 暂未复核 | 暂保留原估计但标记需源码核验 | 尚需逐行对抗复核 |

### G.4 修订后优先执行清单

**P0：仍然安全的精炼**

1. `spec-work`：将 L579 re-scoping pitfall 移入 Anti-Rationalization Red Flags，删除其余重复 Key Principles / Pitfalls。
2. `spec-plan`：删除或合并 P3/P4/P5，但保留 P2/P6/P7/P8。
3. `spec-code-review`：抽出 L384-L403 的 PR remote fallback shell 子块，而不是抽出整个 Stage 1。
4. `spec-code-review`：headless output code block 可移入 reference，但保留 detail enrichment / formatting rules / terminal signal。
5. `using-spec-first`：合并重复 source-of-truth 句子，但保留 Injection Behavior 的 L210-L211。

**P1：需要更多测试的精炼**

1. `spec-plan`：High-Level Technical Design decision table 下沉，但保留 L221 framing 原文。
2. `spec-work`：Parallel Safety Check 可拆 reference，但主干保留 host isolation matrix 的核心 stop 条件。
3. `spec-doc-review`：product-lens 只做格式压缩，不减少 trigger 覆盖。

**P2：暂缓**

1. `spec-code-review` Stage 5 合成算法瘦身：暂缓，风险高。
2. `spec-debug` Core Principles 删除：取消。
3. `spec-plan` Core Principles 全删：取消。

### G.5 对抗性审查后的总判断（第一版修订汇总已在 G.1-G.4）

---

## H. 对抗性审查后：13 个问题的最佳优化方案

本章是对每个审查问题深度思考后的修订方案，比 G 章更具体，可直接作为执行参考。

---

### H.1 spec-code-review：Stage 1 shell 脚本（原主张❌）

**问题**：144 行 Stage 1 被错误归类为「纯 shell 实现」。实际含 7 处 STOP gate + 1 处禁止 dispatch 的 inline orchestrator judgment。

**最佳方案（外科手术式）**：

```
可以抽出（约 20 行）：
  L384-L403 PR mode 的 multi-fallback remote bash 实现
  → 新建 references/stage1-pr-base-resolution.md 或 scripts/pr-base-resolve.sh

必须 inline 保留：
  L338 base: 冲突 STOP
  L342 mode checkout 禁止
  L344-L355 Trivial-PR conservative inline judgment（禁止 dispatch，必须 inline）
  L365/419 dirty worktree STOP
  L405/433/453 base ref 解析失败 STOP
  L463 untracked ask-stop
```

**实际收益**：约 20 行（不是 144 行）。接受这个结果——Stage 1 的详细程度是有价值的，它是 review scope 正确性的第一道防线。

---

### H.2 spec-code-review：Stage 5 合成算法（原主张❌）

**问题**：6a/6b/6c + Stage 5b 被误判为「实现细节」。实际它们是 synthesis 核心算法：anti-reroute、recommended action、mode-aware demotion、P0/P1 可见性都在这里。

**最佳方案**：

| 内容 | 处理 |
|---|---|
| L835 anti-reroute hard gate | 保留 inline |
| L838-L845 recommended action 映射表 | 保留 inline |
| L849 tie-break 规则 | 保留 inline |
| L857-L858 mode 可见性策略 | 保留 inline |
| L879-L889 Stage 5b when-to-run 表 | 保留 inline |
| L900 over-budget 不丢 finding | 保留 inline |
| L909 P0/P1 must remain visible | 保留 inline |
| Stage 5b steps 1-6 执行细节 | 可移入 `references/stage5b-validation.md` |
| "why per-finding validation" 背景解释 | 可移入 reference |

**实际收益**：约 40-45 行，而非 83 行。Stage 5 是 review 的核心算法，不应追求大幅压缩。

---

### H.3 spec-code-review：Headless output template（原主张⚠️）

**问题**：L951-L1057 既有纯模板，也有机器可读合约，不能整块下沉。

**最佳方案**：

```
移入 reference：
  L955-L1041 headless 输出格式模板 code block（约87行）
  → references/headless-output-template.md

主干保留：
  L1043-L1047 detail enrichment 算法（line_bucket ±3、normalize(title) tie-break）
  L1049-L1057 formatting rules
    - [needs-verification] 标记条件
    - pre_existing section 规则
    - degraded envelope
    - "Review complete" terminal signal
```

**原因**：`Review complete` 是 programmatic caller 的完成检测信号，必须在 headless 执行路径中稳定可见。

**实际收益**：约 85 行。

---

### H.4 spec-code-review：Workflow Contract Summary（原主张⚠️）

**问题**：压成 3-5 行会丢失 When Not To Use 中两个非显然 guard。

**必须保留的 guard**：
- 不得把 optional external-tool startup failure 当作 reviewer failure。
- 不得在没有 explicit routing decision 时 filed tracker tickets。
- Failure Modes 中的 fallback：safe 时 single-agent report-only；headless/programmatic caller 输出 documented failure envelope。

**最佳方案**：从约 34 行压缩到 15 行左右，而不是 3-5 行。Inputs/Outputs/Downstream Consumers 可压缩；When Not To Use 和 Failure Modes 的关键行为边界完整保留。

---

### H.5 spec-work：Key Principles + Common Pitfalls（原主张⚠️）

**问题**：大多数内容确实是通用原则，但 L579 `Re-scoping the plan into human-time phases` 是独有 agent-speed 约束。

**最佳方案**：

```
删除：
  L536-L568 Key Principles（通用/已在 Phase 2 操作化）
  L570-L578 普通 pitfalls（analysis paralysis / testing at end 等）

迁移：
  L579 的核心约束 → Anti-Rationalization Red Flags 表新增一行
```

建议新增 red flag：

| 红旗念头 | 停下来做什么 |
|---|---|
| 「这个计划太大，本 session 只做前几个 unit」 | 如果计划过大，回到 `spec-plan` 减 scope 或用 subagent/task-pack 处理 context 压力；agent 按 agent 速度执行，不按人类时间片重切 plan。 |

**实际收益**：约 42 行，同时把独有约束放到更显眼的位置。

---

### H.6 spec-work：Follow Existing Patterns（原主张❌）

**问题**：L488 被误判为通用惯例。实际包含 spec-first 特有治理规则：`docs/contracts/team-standards.md`、Host Instruction Reuse Policy、hard/advisory 信任分类。

**最佳方案**：迁移关键句，不删除。

```
可删/压缩：
  L485-L487 / L489 的通用 naming / reuse / grep 提示

必须保留或迁入 Phase 2：
  L488 的 team standards + Host Instruction Reuse Policy + hard/advisory 规则
```

**最佳位置**：Phase 2 Task Execution Loop 中「遵循项目规范 / Follow Existing Patterns」的执行点，而不是结尾独立原则节。

**实际收益**：约 5-6 行，主要收益是结构清晰而非行数减少。

---

### H.7 spec-plan：Core Principles（原主张❌）

**问题**：8 条被说成「全在 Phase 3-5 有操作化步骤」。经逐条核实：P2/P6/P7/P8 在 Phase 步骤中无覆盖。

**最佳方案（精确识别，保留独有）**：

| 原则 | 处理 |
|---|---|
| P1 Use requirements as source of truth | 合并入 Phase 0 一行引导语 |
| P2 Decisions not code（含 pseudo-code 许可边界）| 保留，压缩至 2 行：「不写实现代码；pseudo-code/DSL grammar 允许但必须 frame 为 directional」|
| P3 Research before structuring | 删除（Phase 0/1 覆盖）|
| P4 Right-size the artifact | 删除（Phase 4.1 覆盖）|
| P5 Separate planning from execution | 删除（Phase 3.6/5.1 覆盖）|
| P6 Keep the plan portable | 保留 1 行：「不嵌入工具特定执行指令」|
| P7 Carry execution posture lightly | 保留 1 行：「execution posture 是信号，不是 step-by-step choreography」|
| P8 Honor user-named resources | 保留 2 行（含 command -v/fetch/read 前置发现规则）|

**实际收益**：从 13 行压缩到约 8 行。

---

### H.8 spec-plan：High-Level Technical Design（原主张⚠️）

**问题**：「压成 3 句」过于激进；L221 framing 文本是必须逐字嵌入计划的 verbatim 内容。

**最佳方案**：

```
移入 references/visual-communication.md（已存在）：
  L203-L213 work type → medium 决策表（~11 行）
  L214-L219 when to skip（~6 行）
  L222-L223 medium 选择指导（~2 行）

主干保留约 8 行：
  1 行：何时需要高层设计图
  3 行：L221 framing 原文（verbatim，不可压缩）
  1 行：reference 指针
  1 行：sketches 简洁原则
  2 行：when to skip 核心两条
```

**目标**：55 行 → 约 8 行，减少 47 行。比「3 句」务实，比「移入 reference」安全。

---

### H.9 spec-plan：AskUserQuestion 三处重复（原主张⚠️）

**问题**：L24/L79/L445 被说成「三处全重复」。L445 上下文不同（特定执行节点的条件提醒）。

**最佳方案**：

```
L79（Interaction Method）→ 保留完整权威定义
L445（Phase 5.3.8）→ 保留（不同执行节点，条件性触发）
L24（Plan-Only Safety Contract）→ 压缩为 1 行引用：
  "Pre-load AskUserQuestion via ToolSearch before any question fires;
   see Interaction Method."
```

**实际收益**：约 4-5 行，同时消除 L24/L79 未来漂移的风险。

---

### H.10 spec-debug：Core Principles（原主张❌）

**问题**：L63-L68 被当作 Phase 2/3 的重复可删。源码 L63 明确说明这是**定义节点**，Phase 2/3 的 Reminder 是**有意回调指针**。

**最佳方案**：不删，只轻度压缩。

```
保留整节（约 9 行）
可以做的小优化：
  原则 2 的第二句「When the chain is obvious... chain explanation itself is sufficient」
  可从 3 行压为 1 行

目标：9 行 → 约 7 行
```

**精炼目标重定向**：spec-debug 的大量节省来自 L128-L222 的通用调试方法论内容（约 60-70 行可移 reference），不来自 Core Principles。

---

### H.11 spec-debug + spec-doc-review：Learning Capture 平行结构（原主张⚠️）

**问题**：「逐字相同」不成立；两处是领域适配的平行实例化。

**最佳方案**：**不强制提取**，记录设计意图。

当前两处是：
- spec-debug：framework return type / shared dependency/framework/convention
- spec-doc-review：document-scope boundary / shared contract/workflow/scope boundary

这是有意的领域适配实例化。两处共存的维护成本可接受。

**如果未来第3、4个 skill 也使用同框架**，再提取为：
- `docs/contracts/workflows/learning-capture-framework.md`（三层结构+判断标准）
- 各 skill 只保留自己的 domain-specific trigger examples

**对优化方案的修订**：移除「逐字相同」的错误表述，记录为「平行实例化，当前维护成本可接受，超过3个skill时建议提取」。

---

### H.12 spec-doc-review：product-lens trigger criteria（原主张❌）

**问题**：两处错误——数量（14→实为8），性质（aspirational→activation gate trigger criteria，OR 关系）。

**最佳方案**：不裁减 bullet，改善可扫描性。

```
当前：两条 Leg + 8 个 OR 关系 bullet（全部触发条件）

改善方案（+2 行）：
  Leg 1 前加 1 行 summary：
    "Any challengeable 'what to build' or 'why' claim not obvious from existing context"
  Leg 2 前加 1 行 summary：
    "Any work with system-trajectory implications (perception, adoption, future directions)"
  8 个具体 bullet 保留，降格为 examples
```

**效果**：快速扫描时读 summary 即可决定是否激活；精确判断时读具体 bullet。原触发召回率不变。

---

### H.13 using-spec-first：Artifact Boundaries（原主张⚠️）

**问题**：部分重复可删，但 L227/L231 含独有内容不能全删。

**最佳方案**：压缩为 3 行，删重复保独有。

```
删除：
  L226（与 Contract Summary L23 完全重复）
  L229（与 L28 重复）

保留（3 行）：
  "It only decides entry routing or gives a next-step recommendation."
  "The selected workflow owns its artifacts, validation evidence, and final judgment."
  "Do not create pseudo-plan, pseudo-task, or pseudo-review artifacts."
```

**实际收益**：约 4-5 行，section 从 7 行压缩到 3 行。

---

## H.14 最终执行优先级（修订版）

整合 13 个问题的分析，加入深度调研补充，修订后的执行优先级如下：

### ⚠️ 前置条件：先补目标 surface 的回归 Eval（比实际下沉更优先）

**实测数据**（2026-07-02）：核心 workflow skill 已有不同程度的 eval / examples 覆盖，但覆盖并不等于能验证本次下沉点：

| Skill | examples 数量 | 风险 |
|---|---|---|
| spec-prd | 111 | 覆盖很强，但与 prompt 精炼下沉点不一定直接对应 |
| spec-plan | 19 | 有基础覆盖；HTD 下沉仍需 targeted regression |
| spec-compound | 10 | 有 promotion boundary 覆盖；不进入 H.14 执行优先级 |
| spec-code-review | 9 | 有 Phase A / review boundary 覆盖；headless template 下沉仍需字段完整性 eval |
| spec-debug | 6 | 有基础边界覆盖；feedback loop 下沉需另补样本 |
| spec-work | 6 | 有基础覆盖；scope / runtime boundary 压缩需另补样本 |
| using-spec-first | 6 | 有 routing 覆盖；Artifact Boundaries 压缩需另补样本 |
| spec-compound-refresh | 4 | 仅适合 refresh boundary；不进入 H.14 执行优先级 |
| spec-optimize | 4 | 覆盖较少；先不进入 prompt 精炼执行优先级 |

因此，问题不是“核心 skill eval 为空”，而是**现有 eval 未必覆盖将被下沉的具体 trigger、hard gate、output contract**。

**建议**：不要为每个 skill 机械补 10-15 个 examples；改为每个待修改 surface 先补 2-4 个 targeted regression eval。验证精炼前后行为一致，才进入后续 P0 步骤。

### P0：低风险候选，验证后做

这些动作相对低风险，但不是零风险。执行前至少需要 `git diff --check`、相关 skill 的 fresh-source eval 或等价 fresh read-only review；headless template 与 HTD 下沉还必须验证 reference 触发条件和主干引用是否足够清晰。

| Action | Skill | 实际节省 |
|---|---|---|
| headless output template code block 移入 reference | spec-code-review | ~85 行 |
| Key Principles + Pitfalls 删除 + L579 迁入 Red Flags | spec-work | ~42 行 |
| High-Level Technical Design 决策表移入 reference（保留 L221 framing） | spec-plan | ~47 行 |
| Core Principles 精确保留 P2/P6/P7/P8 删 P3/P4/P5 | spec-plan | ~5 行 |
| AskUserQuestion L24 压缩为 1 行引用 | spec-plan | ~4 行 |
| Core Principles 压缩为 7 行 | spec-debug | ~2 行 |
| Artifact Boundaries 压缩为 3 行 | using-spec-first | ~4 行 |
| **小计** | | **~189 行** |

### P1：中等风险，需要测试

| Action | Skill | 实际节省 |
|---|---|---|
| Stage 1 PR remote fallback bash 抽取 | spec-code-review | ~20 行 |
| Stage 5b steps 1-6 移入 reference | spec-code-review | ~40 行 |
| Feedback loop 9步 + issue tracker 细节移入 reference | spec-debug | ~60 行 |
| Follow Existing Patterns L488 迁入 Phase 2，其余删除 | spec-work | ~6 行 |
| L488 迁移后，Follow Existing Patterns section header 删除 | spec-work | ~1 行 |
| **小计** | | **~127 行** |

### P2：需要数据支持，暂缓

| Action | 理由 |
|---|---|
| spec-doc-review product-lens 改善 | 改善可扫描性，不减少 trigger 覆盖，+2 行而非节省 |
| Learning Capture 提取共享框架 | 等第3个 skill 使用时再做 |
| Stage 5 6a/6b/6c 压缩 | 核心算法，风险高 |

---

## H.15 总计修订后的精炼估计

### 研究依据

| 研究 | 结论 | 对本方案的含义 |
|---|---|---|
| Liu et al. *Lost in the Middle* (TACL 2024) | LLM 对长上下文中间部分信息利用率显著下降 | 长 skill 中间的关键 hard gate 可能未被充分关注 |
| *Same Task, More Tokens* (arXiv 2402.14848) | 更多 token 在达到技术上限前已开始降低推理质量 | spec-code-review 的 1241 行可能主动损害质量 |
| *AGENTIF* (arXiv 2505.16944) | 长 agent instruction 下LLM adherence 下降，多竞争性约束更甚 | 多处重复约束可能产生干扰而非加强 |
| OpenAI AGENTS.md 官方最佳实践 | 建议 < 150 行 / < 500 tokens | spec-code-review：超推荐上限约 **62×**；spec-work：约 **28×** |

**重要限制**：研究证据支持精炼方向，但现有 eval 不一定覆盖本次 reference 下沉点，无法直接实证验证精炼前后的质量变化。H.15 的百分比是基于源码分析的保守估计，不是经过 targeted eval 验证的质量提升数据。

| Skill | 修订前估计减少 | 修订后估计减少 | 说明 |
|---|---|---|---|
| spec-code-review | 33% | **17%** | Stage 1/5 hard gate保留；headless template可下沉 |
| spec-work | 38% | **20%** | L488保留；L579迁移；大部分Pitfalls可删 |
| spec-plan | 36% | **22%** | HTD下沉；P3/P4/P5删；P2/P6/P7/P8保留 |
| spec-debug | 37% | **20%** | Core Principles保留；通用调试方法论可下沉 |
| spec-doc-review | 37% | **22%** | product-lens不裁；其余B类可下沉 |
| using-spec-first | 30% | **20%** | Artifact Boundaries压缩；Injection保留核心 |
| spec-compound | 22% | 待验证 | §G/§H 未复核该 skill，保留为待验证估计，不进入执行优先级 |
| spec-compound-refresh | 36% | 待验证 | §G/§H 未复核该 skill，保留为待验证估计，不进入执行优先级 |
| spec-optimize | 17% | 待验证 | §G/§H 未复核该 skill，保留为待验证估计，不进入执行优先级 |
| **整体加权平均** | **31%** | **~22%（含待验证项）** | 已复核项从乐观降为保守；未复核项不得当作执行依据 |





前版方案的问题不是方向错误，而是**把「看起来重复」误判为「可删」**。源码事实显示，spec-first 的很多重复是有意的 defense-in-depth：

- 顶层定义 + phase-local reminder 是为了在压力点重新激活约束。
- 同一边界在 contract summary 和 phase 中重复，是为了防止长 prompt 中段遗忘。
- 某些 bullets 看似启发式，实际是 persona activation gate。
- 某些 shell 段落中夹着 LLM 语义判断和 STOP 规则，不能作为纯实现细节整块下沉。

因此，修订后的精炼原则应改为：

> **只有当一段内容既不是 hard gate / activation gate / phase-local reminder / source-runtime boundary，也没有当前源码独有约束时，才可删除。否则只能压缩或迁移，并且主干必须保留等价触发条件。**

---

## I. 深度调研结论：方案开发价值与正确顺序

### I.1 最终结论

方案方向值得继续，但**当前不应直接开发多 workflow prompt 精炼包或新增机制**。原因不是方向错，而是现有 eval 覆盖并不直接证明具体下沉点的行为等价；必须先为目标 surface 补 targeted regression eval。

正确顺序应是：

```text
1. 选择一个 Progressive Disclosure 试点
   ↓
2. 为该 surface 补 targeted regression eval
   ↓
3. 执行已被源码事实证明的低风险下沉
   ↓
4. 用相同 eval 对比精炼前后行为
   ↓
5. 再决定是否复制到下一个 skill 或开发方法论驱动的新能力
```

### I.2 哪些内容值得开发

| 方向 | 是否值得 | 前置条件 | 理由 |
|---|---|---|---|
| 目标 surface 回归 eval | ✅ 最优先 | 选定一个试点 | 已有 examples 不等于覆盖本次下沉点；需要精确防退化 |
| P0 低风险精炼 | ✅ 值得 | 每个修改 surface 2-4 个 targeted eval | 研究支持长prompt精炼，但必须防退化 |
| OQ 放大风险评分 | ✅ 值得 | spec-prd eval + 至少2个历史返工案例 | 直接减少需求歧义向 plan/work 放大 |
| Knowledge reuse tracking | ✅ 值得 | 先定义「引用影响决策」的计数规则 | 能让 knowledge compounding 可度量 |
| Reviewer agreement 表达 | ⚠️ 复用优先 | 证明现有 Reviewer column + cross-reviewer promotion 不足 | 多 reviewer 一致性已有机制，先不新增 schema |
| 激进 prompt 精炼 | ❌ 不值得 | 无 | 对抗性审查已证明多处会误删 hard/activation gate |
| 大量新增字段/schema | ⚠️ 暂缓 | 明确 consumer + eval 证明现有字段不足 | 避免让脚本越权语义判断 |

### I.3 能否提升 skill 执行质量

**理论上能，实证上还不能声明。**

- 理论支持：长 prompt 会带来 lost-in-the-middle、instruction adherence 降低、约束冲突等问题。
- 源码支持：多个核心 skill 超长（spec-code-review 1241 行），且含大量 reference 可下沉候选。
- 反证约束：对抗性审查证明许多「看似重复」其实是 defense-in-depth；删错会退化。
- 实证缺口：已有 eval 不等于覆盖具体下沉点，无法直接量化某个 reference 化改动是否保持等价。

因此，当前应使用更谨慎措辞：

> **该方案有提升执行质量的合理机制假设，但第一步必须为目标下沉 surface 建立 targeted regression eval；在没有对应 eval 前，不能声称任何精炼或新增能力已经提升质量。**

### I.4 推荐下一步

**推荐先做一个小型可验证切片：`Progressive Disclosure Reference Extraction Pilot`**

范围：

1. 从以下候选中选一个，不跨 workflow 打包：
   - `spec-code-review` headless output template 下沉
   - `spec-plan` HTD 决策表下沉
   - `using-spec-first` Artifact Boundaries 压缩
2. 为选定 surface 增加 2-4 个案例：
   - 正常触发 reference 的输入
   - reference 未加载或触发条件不明时的保守 fallback
   - must-stay-inline hard gate / activation gate 不丢
   - 输出字段或 terminal signal 不退化
3. 完成一次 source 改动后，用同一组案例做 regression check。

验收：
- 每个案例明确输入、预期行为、必须出现/不得出现的 output anchor。
- 主干保留契约包含 `trigger`、`summary`、`must_stay_inline`、`fallback_when_unread`、`equivalence_eval`。
- 精炼前先跑一遍作为 baseline，精炼后用相同 examples 做 regression check。

---

## J. Progressive Disclosure 方法论审查

> Progressive Disclosure（渐进披露）：LLM 只在需要时看到需要的内容。将 skill 内容分为 L1/L2/L3 三层是 prompt 精炼的结构性框架，补充了前版 A/B/C 分析的两个盲点：①L3 不应移入 reference，应完全消除；②移入 reference 的 L2 内容必须搭配标准 STOP 触发，prose 条件不够可靠。

### J.1 三层内容模型

| 层次 | 内容类型 | 存储 | 触发时机 |
|---|---|---|---|
| **L1 Spine** | workflow contract、hard gate、routing 规则、interaction method、Anti-Rationalization Red Flags | SKILL.md | 全量加载 |
| **L2 Reference** | 特定路径 SOP、决策表、模板、边缘场景规则 | `references/xxx.md` | Spine 中 **STOP 标记**显式触发 |
| **L3 消除** | 背景叙事、设计理念、哲学说明、LLM 已知通用常识 | 不应存在 | — |

**关键约束**：L3 **完全删除**，不是移入 reference。reference 是 L2 的归宿。

### J.2 spec-code-review PD 审查

**合格 L1**：Mode Detection 表、Severity Scale、Reviewer 选择表、Stage STOP 条件、Anti-Rationalization Red Flags、hard gate。

| 位置 | 误判层次 | 问题 | 建议 |
|---|---|---|---|
| L59-67 Context Orientation Anchor 后半部分 | L2 嵌 L1 | Host Instruction Reuse Policy 细节只在边界模糊时需要 | 前3行留 L1；后半入 reference，主干1行 STOP 触发 |
| L63-67 Domain Language & Decision Ledger | L2 嵌 L1 | 仅 domain 术语歧义时触发 | 整段移入 reference |
| L69-73 Feedback Loop Review Boundary | L2 嵌 L1 | 仅 behavior-bearing diff 触发 | 移入 reference，STOP 触发条件：`diff contains behavior-bearing code` |
| 无集中 Reference Trigger Map | **PD 结构缺失** | L2 触发散落各 Stage，可发现性差 | 参照 spec-prd 新增 `## Reference Trigger Map` 章节 |

### J.3 spec-plan PD 审查

**合格 L1**：Plan-Only Safety Contract、Interaction Method、Phase 骨架、L71/73/75 三个 STOP 触发（项目内标杆）。

| 位置 | 误判层次 | 问题 | 建议 |
|---|---|---|---|
| L95-104 Core Principles 8条 | **L3 嵌 L1** | 设计理念解释；PD 框架要求 L3 完全删除，不应移入 reference | 完全删除；有操作价值的 P6/P8 提炼为 Quality Bar 的 warning 行 |
| L63-65 Scenario Capability | L2 嵌 L1 | 只在理解 capability 边界时需要 | 移入 reference |

**正向评估**：spec-plan 的 L71-75 三个 STOP 触发是项目内最佳 PD 样板，应推广至其他 skill。

### J.4 spec-work & spec-debug PD 审查

#### spec-work

| 位置 | 误判层次 | 问题 | 建议 |
|---|---|---|---|
| L536-568 Key Principles | **L3 嵌 L1** | 设计理念，完全删除 | 删除 |
| L570-578 Common Pitfalls（前7条）| **L3 嵌 L1** | 通用警示语，无 spec-work 特有操作语义 | 删除 |
| L330-390 Parallel Safety Check | L2 **缺 STOP** | 触发条件是散落 prose，不是 STOP 标记 | 改为：`**STOP. Before parallel dispatch, read references/execution-strategy.md.**` |
| L422-445 System-Wide Test Check | L2 **缺 STOP** | 同上 | Phase 2 task loop 加标准 STOP |
| L516-524 Figma Design Sync | L2 **缺 STOP** | `"(if applicable)"` 不是 STOP | 改为1行：`**STOP. For UI/Figma work, use spec-figma-design-sync iteratively.**` |

#### spec-debug

| 位置 | 误判层次 | 问题 | 建议 |
|---|---|---|---|
| L128-158 Feedback loop 9种方式 | L2 **缺 STOP** | 执行细节，无 STOP 触发 | `**STOP. For feedback loop design, read references/feedback-loop.md.**` |
| L165-192 Issue tracker + 特殊 repro | L2 **缺 STOP** | 仅特定 input type 触发 | `**STOP. For issue tracker inputs or special repro scenarios, read references/investigation-techniques.md.**` |
| L194-222 环境检查 + 代码追踪 | L3/L2 混合 | 通用调试常识（L3）+ spec-first 工具列表（L2）| L3 部分删除；L2 工具列表移入 reference |

### J.5 跨 skill 共性 PD 问题

| 模式 | 出现 skill | 影响 |
|---|---|---|
| **L3 理念叙事嵌入 L1**（Core Principles / Key Principles / Why X）| spec-plan、spec-work、spec-debug | 每次加载占 context，但从不直接驱动行为 |
| **L2 用 prose 触发而非 STOP**（feedback loop / safety check / repro 路径）| spec-work、spec-debug、spec-code-review | LLM 在长 context 中可能略过 prose 条件；STOP 标记更可靠 |
| **缺集中 Reference Trigger Map** | spec-code-review、spec-work、spec-debug | L2 触发散落，可发现性差 |

**PD 标杆**：`spec-prd` 的 Front Controller + `## Reference Trigger Map` + 标准 STOP 标记组合是当前项目最成熟实现，其他 skill 应向此靠拢。

### J.6 PD 对前版方案的两条修订

**修订1：L3 的正确处置**

前版方案说「Core Principles 等可移入 reference」——错误。L3（理念叙事）不应存在于 reference 中，应**完全删除**。检查标准：删除后是否有 Phase 步骤缺失具体操作依据？若无缺失，即为 L3。

**修订2：STOP 触发格式必须标准化**

前版方案说「把 X 移入 references/Y.md」——只说了目的地，没说触发格式。每次 B 类「移入 reference」操作必须同时完成：

```
① 内容迁移到 references/xxx.md
② spine 原位置替换为：
   **STOP. When [specific deterministic condition], read references/xxx.md.**
```

触发条件必须是确定性的（如 `when diff touches auth`），不能是 prose 条件（如 `if applicable` / `when needed`）。

### J.7 PD 视角下的精炼执行清单（新增）

下表补充前版 H.14 P0/P1 表格，增加 L3 消除 和 STOP 触发标准化两列：

| Skill | 操作 | PD 层次 | STOP 触发 | 预期节省 |
|---|---|---|---|---|
| spec-plan | Core Principles L3 消除（P3/P4/P5 删除） | L3 | 无（直接删除）| ~5行 |
| spec-work | Key Principles + Pitfalls L3 消除 | L3 | 无（直接删除）| ~42行 |
| spec-work | Parallel Safety Check 移入 reference | L2 | `STOP. Before parallel dispatch, read references/execution-strategy.md.` | ~61行 |
| spec-debug | 环境检查通用常识 L3 消除 | L3 | 无（直接删除）| ~15行 |
| spec-debug | Feedback loop 细节 + issue tracker 移入 reference | L2 | `STOP. For feedback loop / issue tracker inputs, read references/investigation-techniques.md.` | ~60行 |
| spec-code-review | Headless output template 移入 reference | L2 | `STOP. For headless output format, read references/headless-output-template.md.` | ~85行 |
| spec-code-review | 新增 Reference Trigger Map 章节 | L1 | —（结构改善）| +0行，但提升 L2 可发现性 |











