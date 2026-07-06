# Spec-First Skills 优化方案 50 轮深度审查报告

- 审查对象：`docs/11-业界调研/spec-first-skills-优化方案-基于16个思维模型.md`
- 审查方式：追加式轮次审查，不修改审查对象原文
- 当前进度：30 / 50
- 首轮写入时间：2026-07-02 23:23 CST
- 审查对象初始 SHA-256：`b628f1d919d0d6e4aa5b9716b8fd6d1984daca46cc7cce9998568baea03223fb`
- workflow posture：`$spec-doc-review` 语义适用；当前 Codex 请求未显式授权 subagents/personas/parallel reviewer dispatch，因此采用 single-agent report-only fallback，reason_code=`dispatch_authorization_missing`

## 审查基线

本报告把原方案视为 advisory research input，而不是已可直接实施的 plan。审查结论遵守本仓库角色契约：

- scripts/tools 准备确定性事实，例如文件行数、eval fixture 数量、hash、测试结果。
- LLM 负责语义判断，例如哪些压缩会损害 hard gate、哪些字段应等待 consumer-proven gap。
- generated runtime mirrors 不是 source，不作为本轮审查依据。
- graphify / web / 外部论文只做导航或行业参考，关键结论必须回到当前 source 或明确标注为外部启发。

当前事实快照：

| 项 | 当前事实 |
|---|---:|
| source skills 数量 | 37 |
| `spec-code-review/SKILL.md` | 1241 行 |
| `spec-plan/SKILL.md` | 460 行 |
| `spec-debug/SKILL.md` | 402 行 |
| `spec-prd/SKILL.md` | 293 行 |
| `spec-work/SKILL.md` | 579 行 |
| `spec-compound/SKILL.md` | 646 行 |
| `spec-compound-refresh/SKILL.md` | 717 行 |
| `spec-optimize/SKILL.md` | 737 行 |
| `spec-doc-review/SKILL.md` | 312 行 |
| `using-spec-first/SKILL.md` | 235 行 |

当前 eval fixture 数量：

| Skill | examples 数量 |
|---|---:|
| spec-prd | 111 |
| spec-plan | 19 |
| spec-compound | 10 |
| spec-code-review | 9 |
| spec-debug | 6 |
| spec-work | 6 |
| using-spec-first | 6 |
| spec-compound-refresh | 4 |
| spec-optimize | 4 |

## 轮次审查

### 第 001 轮：当前事实已经超过原文档的 eval 基线描述

审查镜头：事实新鲜度。

证据：

- 原方案 §H.14 写明 `spec-code-review`、`spec-prd`、`spec-plan`、`spec-debug`、`spec-compound`、`spec-compound-refresh`、`spec-optimize` examples 数量均为 0。
- 当前 source 实测：`spec-prd=111`、`spec-plan=19`、`spec-code-review=9`、`spec-compound=10`、`spec-debug=6`、`spec-compound-refresh=4`、`spec-optimize=4`。

判断：

原方案“先建 eval 基线”的方向仍然正确，但“核心 workflow skill examples 均为空”已经不是当前事实。继续沿用该表会把真实问题从“有没有 eval”误导成“没有 eval”，从而错过更关键的问题：现有 eval 是否覆盖待精炼的高风险行为、是否可做 before/after regression、是否有 objective assertions。

落地含义：

- 下一步不应粗暴新增每个 skill 10-15 个 examples，而应先做 `eval adequacy audit`。
- P0 从“补空白 eval”改为“为待压缩片段补定向退化测试”。
- 对 `spec-prd` 这种已有 111 个 examples 的 skill，优先检查质量和覆盖，而不是继续堆数量。

### 第 002 轮：语义压缩的第一性原理不是少 token，而是保留决策充分性

审查镜头：业界方法论与第一性原理。

外部参考：

- Anthropic context engineering 强调上下文应按需进入，而不是把所有信息一次性塞给 agent：https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- OpenAI Codex skills 文档强调用 `SKILL.md` 声明触发、步骤、可选 references/scripts/assets，并通过渐进披露组织能力：https://developers.openai.com/codex/skills
- LLMLingua / LongLLMLingua 代表研究界的 prompt compression 路线，核心目标是保留任务相关信息而压缩低信息 token：https://www.microsoft.com/en-us/research/project/llmlingua/longllmlingua/

判断：

对 spec-first 而言，黑盒压缩不是主路。skill prose 承载的是 workflow contract、dispatch boundary、source/runtime boundary、failure mode、output contract。压缩目标应该是“同等或更好的模型决策”，而不是“更短”。如果压掉 phase-local reminder 后模型更容易在压力点越界，即使 token 更少，也是质量倒退。

落地含义：

给每段 skill prose 标一个语义类别：

| 类别 | 处理 |
|---|---|
| hard gate / source-runtime boundary / dispatch boundary | 主干保留，放显眼位置 |
| phase-local reminder | 可压缩，但必须保留在对应压力点 |
| mode table / condition table | 表格化或合并 |
| long template / shell detail / walkthrough | 移入 reference，主干保留触发条件 |
| repeated philosophy / generic engineering advice | 删除或由 AGENTS.md 承担 |

### 第 003 轮：原方案的“prompt 精炼”需要改名为“语义保真压缩”

审查镜头：命名是否塑造正确执行行为。

证据：

- 原方案多处使用“精炼”“减少行数”“节省行数”表达收益。
- §G/§H 已经证明许多看似可删的内容实际是 hard gate、activation gate 或 defense-in-depth。

判断：

“精炼”容易让执行者追求删行数，尤其会误删 prompt 中看似重复但在长上下文中负责重新激活约束的内容。更准确的执行概念应是“语义保真压缩”：只有在保留触发、边界、输出、失败处理和验证信号后，才允许减少 token。

落地含义：

后续计划文档中应避免把“减少 22%”作为核心目标。更合适的目标是：

- hot path 指令更短。
- hard gate 更靠前、更显眼。
- 长模板 reference 化。
- before/after eval 无行为退化。
- 不新增 schema，除非 consumer 证明现有 surface 不足。

### 第 004 轮：原方案已识别 defense-in-depth，但还缺压缩后的等价性判据

审查镜头：verification gate。

证据：

- 原方案 §H 已把“看似重复但可能是 defense-in-depth”纳入修订原则。
- `docs/contracts/workflows/fresh-source-eval-checklist.md` 要求 skill/agent prose 变化不能用当前会话缓存定义验证，需 fresh-source eval 或明确 not_run。

判断：

方案现在知道“不能乱删”，但还没有为每类压缩定义“等价性判据”。例如把 headless output template 下沉到 reference 后，等价性不是“链接存在”，而是模型在 headless mode 下仍能输出同样字段、同样 stop 条件、同样 no-interaction 行为。

落地含义：

每个压缩动作应配一条退化断言：

| 压缩动作 | 必须证明 |
|---|---|
| template 下沉 | 主干触发条件足够让模型按需打开 reference |
| shell 细节下沉 | LLM 语义判断和 STOP 规则仍在主干或对应 phase 在场 |
| Core Principles 压缩 | 删除内容不承担定义节点、边界提醒或反模式拦截 |
| learning capture 合并 | 不改变 offer/skip/report-only/headless 的行为边界 |

### 第 005 轮：eval 数量不是质量，下一步应审查 eval 与压缩候选的映射

审查镜头：Evaluation Harness。

证据：

- 当前 `spec-prd` 已有 111 个 examples，但原方案仍按“空白”处理。
- `spec-code-review` 仅 9 个 examples，而它是 1241 行最高压缩收益与最高退化风险并存的 skill。
- `spec-optimize` 和 `spec-compound-refresh` 各 4 个 examples，却在原方案中有较多未来能力建议。

判断：

eval 的目标不是证明 skill 很强，而是保护将要改变的行为。对 prompt 压缩来说，最小有效 eval 是“覆盖本次压缩影响面”的行为锁，而不是大而全的样例库。

落地含义：

实施前应建立 `compression-candidate -> eval case` 映射表：

| 候选 | 所需 eval |
|---|---|
| `spec-code-review` headless template 下沉 | headless mode、report-only、no diff、untracked artifact、P0/P1 visibility |
| `spec-plan` HTD 下沉 | greenfield/brownfield、tool choreography rejected、pseudo-code allowed |
| `spec-work` pitfalls 压缩 | scope creep、unauthorized file、protected code、source/runtime boundary |
| `using-spec-first` artifact boundary 压缩 | no pseudo artifact、no hidden workflow、runtime mirror exclusion |

### 第 006 轮：Knowledge reuse tracking 应计“影响决策”，不计“被引用”

审查镜头：Goodhart 风险与知识复利。

证据：

- 原方案提出 `reuse_count`、`last_referenced`、`high_value`。
- 角色契约要求 advisory facts 不能当 confirmed truth，知识晋升必须 verified、可复用、带 invalidation condition。

判断：

简单引用计数会被 prompt 或自动检索放大污染。一个 solution 被搜索命中 20 次，不代表它影响了 20 次正确决策。更可靠的计数单位应是“被 workflow 明确采纳为决策依据，并在 closeout 或 plan 中留下 source_refs / decision note”。

落地含义：

如果推进 knowledge reuse，应采用更保守字段：

```yaml
decision_reuse_count: 0
last_decision_reuse: null
reuse_evidence_refs: []
```

计数触发条件：

- workflow 明确写入 decision note。
- 引用有当前 source/test/log 或 human review 佐证。
- 不能由普通检索命中自动加一。

### 第 007 轮：OQ 放大风险适合作为 planner attention，不适合作为早期 deterministic checker

审查镜头：scripts vs LLM 边界。

证据：

- 原方案提出 `amplification_risk` 和 `affected_plan_units_estimate`。
- 角色契约明确 scripts enforce deterministic invariants，LLM decides semantic adequacy above that floor。

判断：

OQ 放大风险是高价值想法，但早期不应进入 checker severity。它判断的是“一个未决问题会让 plan 发明多少行为”，属于语义充分性，不是 deterministic invariant。若脚本把 `high + open` 自动升严重性，很容易把合理 deferred 的 owner decision 误判成阻断。

落地含义：

第一阶段只放到 PRD / plan prompt 的 attention 表：

| OQ | why unresolved | likely downstream invention | affected units | planning stance |
|---|---|---|---|---|

只有积累足够历史样本后，才能考虑 checker 仅校验字段存在，不判断风险高低。

### 第 008 轮：Reviewer consensus 先复用现有 synthesis，不急着加 schema

审查镜头：consumer-proven schema。

证据：

- 原方案已在 §1.4 和 §3.5 修订为先复用 Reviewer column + cross-reviewer agreement。
- `docs/contracts/workflows/review-finding.md` 说明 shared finding envelope 不是替代 `spec-code-review` reviewer JSON schema。

判断：

reviewer consensus 是有价值的置信度信号，但 schema 化过早会扩大 contract 面。真正需要证明的是：当前 report/headless consumer 是否无法表达“多 reviewer 独立同意同一 finding”或“高风险 disagreement”。如果现有 synthesis 能表达，字段就不是 P0。

落地含义：

先做报告层规范：

- 在 synthesis 中显式写 `agreement: single | multi | disputed`。
- 不改 reviewer JSON schema。
- 只有当 headless consumer 或 downstream workflow 需要机器读该字段时，才进入 schema vNext。

### 第 009 轮：语义压缩应优先压“中段噪音”，不是压“顶部 contract”

审查镜头：长上下文注意力分布。

外部参考：

- Lost in the Middle 研究指出模型对长上下文中间信息利用更差：https://aclanthology.org/2024.tacl-1.9/
- Same Task, More Tokens 讨论更多 token 不必然提升任务表现，甚至会降低效率和质量：https://arxiv.org/abs/2402.14848

判断：

spec-first skill 的顶部 contract summary、when-to-use、when-not-to-use、dispatch boundary 是高频决策入口，不应为了压缩比例优先动。更应该处理的是中段长模板、重复 walkthrough、低频 failure elaboration、长表格说明。

落地含义：

推荐压缩顺序：

1. 中段低频模板 reference 化。
2. 重复 mode invariant 合并。
3. phase-local reminder 缩短但保留。
4. 顶部 contract 只做术语一致性修剪，不做结构性压缩。

### 第 010 轮：当前最小可交付不应是改 skill，而是“压缩候选审计矩阵”

审查镜头：当下要解决的问题与未来路线。

证据：

- 原方案已从“直接精炼”收敛为“先 eval / fresh-source 基线”。
- 当前事实显示 eval 已不完全为空，真正缺口变成“eval 是否覆盖压缩候选”。

判断：

马上改 skill 会过早触碰高风险 prompt surface。更负责任的下一步，是输出一个压缩候选审计矩阵，把每个候选片段映射到语义类别、风险、所需 eval、是否需要 reference、是否涉及 source/runtime 或 dispatch 边界。

落地含义：

下一批审查应从第 011 轮开始，围绕以下问题展开：

- `spec-code-review` 1241 行中哪些片段属于 low-frequency template。
- 每个待下沉 reference 的主干触发句是否足够。
- `spec-plan` / `spec-work` / `spec-debug` 的 Core Principles 哪些是定义节点，哪些是重复提醒。
- `spec-compound` / `spec-compound-refresh` / `spec-optimize` 未经 §G/§H 复核的估计是否成立。

### 第 011 轮：Progressive Disclosure 是结构方法，不是“把内容拆到别处”

审查镜头：Progressive Disclosure 方法论。

外部参考：

- OpenAI Codex skills 采用 `SKILL.md` 作为入口，并允许 references、scripts、assets 等按需加载，形成“入口轻、细节延迟展开”的结构：https://developers.openai.com/codex/skills
- Anthropic context engineering 强调 agent 应获得恰好足够的上下文，并通过工具与记忆按需取回细节：https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- 交互设计中的 Progressive Disclosure 原则强调先暴露完成当前任务所需的信息，逐步展开高级或低频信息；该原则迁移到 agent prompt 时，目标是降低认知负载与冲突指令，而不是隐藏必要约束。

判断：

原方案已经走向 reference 化，但还缺一个关键区分：Progressive Disclosure 不是“把长段落移入 reference”本身，而是“让模型在正确时刻看到正确粒度的信息”。如果主干触发条件不清，reference 再完整也等于不可达；如果主干只剩口号，模型不知道何时展开，行为会退化。

落地含义：

每个下沉 reference 必须有四件事：

| 要素 | 说明 |
|---|---|
| `trigger` | 什么情境必须打开它 |
| `summary` | 不打开时主干仍保留的最低行为约束 |
| `must_read_when` | 哪些风险场景不能只靠 summary |
| `equivalence_eval` | 证明下沉前后行为等价的 eval 或 fresh-source review 问题 |

### 第 012 轮：spec-first 的披露层级应是“入口合同 → 压力点提醒 → reference → script”

审查镜头：信息架构。

证据：

- 当前多个 skill 已采用 `Examples As Context`、`Reference Files`、`Runtime Context Exclusion`、`Decision Primer` 等分层结构。
- `skills/using-spec-first/SKILL.md` 已明确 detailed boundaries 放在 `references/`，主面保留 route map 与 runtime-safe stubs。
- `skills/spec-doc-review/SKILL.md` 把 walkthrough、bulk-preview、synthesis 细节延迟到 Phase 3-5 后才读取。

判断：

spec-first 已经具备 Progressive Disclosure 的雏形，但缺统一命名和验证纪律。主干应该承担“入口合同”和“压力点提醒”；reference 承担低频细节；script 承担确定性事实与格式校验；eval 承担语义保真回归。把这四层混在一起，才是目前 prompt 变长的根因之一。

落地含义：

建议用以下披露层级审查每个 skill：

```text
L0 Frontmatter / When-to-use：触发与排除
L1 Contract Summary：输入、输出、artifact、failure mode
L2 Stable Phase Skeleton：每个 phase 的不可丢行为
L3 Phase-local Reminder：压力点约束，短句保留
L4 Triggered Reference：低频模板、长表、walkthrough、示例
L5 Script / Schema：确定性校验和事实生成
L6 Eval Fixture：行为保真证明
```

压缩优先级不是从 L0 往下删，而是优先把 L4 从 L2/L3 中剥离；L0-L3 只能压缩表达，不能丢失行为。

### 第 013 轮：Progressive Disclosure 的主要失败模式是“不可发现”和“过度延迟”

审查镜头：风险与反模式。

证据：

- 原方案 §G/§H 已证明一些被误判为可下沉的内容实际包含 hard gate、activation gate 或 phase-local reminder。
- `docs/contracts/context-governance.md` 要求 summary-first，但 full content 必须按 trigger 精确展开；这说明 summary 不能替代所有细节。

判断：

Progressive Disclosure 会带来新的质量风险：信息虽然存在，但模型不打开；reference 触发句太弱；主干 summary 不足以维持最低安全行为；下沉后 freshness 漂移；读 reference 的成本导致模型在压力下跳过。对 skill 来说，这些风险比普通文档更严重，因为 skill 是执行合同，不是说明书。

落地含义：

每个 reference 化候选都应回答：

- 如果模型不打开 reference，最坏会发生什么？
- 主干是否仍阻止 dangerous / wrong-route / source-runtime violation？
- 是否有 `must_read_when` 明确触发？
- reference 名称是否按任务语义命名，而不是按内部实现命名？
- 是否有测试或 fresh-source eval 覆盖“应该打开却没打开”的 case？

反模式清单：

| 反模式 | 后果 |
|---|---|
| `See reference for details` 没有触发条件 | 细节不可发现 |
| 把 STOP / hard gate 下沉 | 压力点失去刹车 |
| 把 persona activation criteria 下沉过深 | reviewer 选择退化 |
| 把 script 命令长段留在主干 | 主干噪音变大，遮蔽语义边界 |
| reference 与主干术语不同步 | 多真相源 |

### 第 014 轮：按研发场景定义披露策略，而不是一套结构套所有 skill

审查镜头：研发场景适配。

判断：

Progressive Disclosure 在不同 workflow 的最佳形态不同。需求、计划、执行、审查、调试、知识沉淀的风险位置不一样，不能用同一套“主干多少行、reference 多少行”的机械规则衡量。

场景映射：

| 场景 | 主干必须保留 | 可延迟披露 |
|---|---|---|
| PR/code review | severity/confidence、diff boundary、P0/P1 visibility、dispatch boundary | headless output template、remote fetch fallback、walkthrough UI |
| planning | source/runtime boundary、ask-user fallback、HLD 选择原则、non-goals | medium-specific design tables、示例输出、deepening playbook |
| implementation | scope authority、existing-pattern precedence、protected code、verification closeout | long pitfalls catalog、handoff artifact details |
| debug | reproduce-first、hypothesis ledger、one-change-at-a-time、claim evidence | feedback loop examples、tool-specific diagnostics |
| PRD | OQ closure、owner decision fidelity、planning blocker | interview examples、acceptance examples catalog |
| compound/knowledge | Structured Promotion Gate、source evidence、invalidation condition | category schema details、overlap examples |
| setup/runtime | source/runtime distinction、degraded mode、reason_code | provider-specific installation details |

落地含义：

下一轮压缩候选矩阵需要新增一列 `disclosure_strategy`：

```yaml
disclosure_strategy:
  mainline_keep: hard_gate | activation_gate | phase_reminder | contract_summary
  reference_candidate: template | example | provider_detail | walkthrough | long_table
  must_read_when:
    - "<trigger>"
  fallback_if_not_read: safe | degraded | unsafe
```

这会把“压缩多少”转成“在什么研发场景下，哪些信息必须何时出现”，更符合 spec-first 的 workflow harness 定位。

### 第 015 轮：`spec-code-review` 不是缺 reference，而是缺候选级披露矩阵

审查镜头：高风险 skill 的压缩入口。

证据：

- `skills/spec-code-review/SKILL.md` 当前 1241 行。
- 已有 references：`bulk-preview.md`、`diff-scope.md`、`findings-schema.json`、`persona-catalog.md`、`review-output-template.md`、`subagent-template.md`、`tracker-defer.md`、`validator-template.md`、`walkthrough.md`。
- 主干仍内联保留 `Stage 1: Determine scope`、`Stage 5: Merge findings`、`Stage 5b: Validation pass`、`Headless output format`、`Mode-Driven Post-Review Flow` 等长段。

判断：

`spec-code-review` 的问题不是没有 Progressive Disclosure，而是披露边界尚未按候选片段精确标注。它已经有足够 reference 承载能力，但还需要判断哪些主干段落是“压力点必须在场”，哪些只是“低频模板”。原方案 §H 对 Stage 1/5 已做过一次纠偏，下一步不能再以整段行数为单位下沉，必须以语义子块为单位。

落地含义：

建议建立 `spec-code-review` 候选矩阵：

| 候选 | 初判层级 | 风险 | 必需 eval |
|---|---|---|---|
| Headless output format | L4 template | 中 | headless structured output 字段完整性 |
| Stage 1 PR remote fallback bash | L4 provider detail | 中 | no remote / PR branch / local diff 三路径 |
| Stage 5 sort/label rules | L3 pressure reminder | 高 | P0/P1 visibility + stable numbering |
| Stage 5b validator flow | L2/L3 gate | 高 | validator reject/confirm 双路径 |
| Tracker defer routing | L4 walkthrough | 中 | option C availability / fallback label |

本轮结论：`spec-code-review` 应先写候选矩阵，不应立即移动 Stage 5 或 Stage 5b。

### 第 016 轮：`spec-plan` 的 reference 化成熟，但 HLD 仍需“主干 framing + reference table”双层结构

审查镜头：planning 场景的披露结构。

证据：

- `skills/spec-plan/SKILL.md` 当前 460 行。
- 已有 references：`planning-flow.md`、`plan-sections.md`、`plan-template.md`、`enterprise-plan-review.md`、`reuse-analysis.md`、`governance-boundaries.md`、`deepening-workflow.md` 等。
- 当前主干仍内联 `3.4 High-Level Technical Design (Optional)` 与 `3.4b Output Structure (Optional)`。
- contract tests 已覆盖 runtime projection 中 plan reference 的存在与路径，例如 `tests/unit/spec-plan-contracts.test.js` 和 `tests/unit/spec-plan-enterprise-contracts.test.js` 检查相关 reference 被投射到 Claude/Codex runtime。

判断：

`spec-plan` 是最适合 Progressive Disclosure 的 skill：计划质量依赖按场景展开，而不是单一长模板。HLD 不能压成一句“按需设计”，因为 greenfield/brownfield/enterprise/API/数据迁移等场景需要不同结构；但长表也不宜留在主干。最佳结构是主干保留 HLD 的目的、触发条件、非目标和停止规则，把具体选择表放 reference。

落地含义：

HLD 的披露策略应是：

```yaml
mainline_keep:
  - when HLD is needed
  - when HLD must not be invented
  - how to separate planning unknowns vs implementation unknowns
reference_candidate:
  - design surface matrix
  - output structure examples
must_read_when:
  - high-risk architecture decision
  - cross-module or source/runtime boundary impact
  - enterprise / privacy / data / ML consistency trigger
fallback_if_not_read: degraded
```

本轮结论：`spec-plan` 的 HLD 下沉是 P0/P1 候选，但前提是主干保留 framing 原文级约束，并用 eval 覆盖高风险计划场景。

### 第 017 轮：`spec-work` 的披露短板在执行末端，而不是执行入口

审查镜头：implementation workflow 的长尾风险。

证据：

- `skills/spec-work/SKILL.md` 当前 579 行。
- references 只有 `shipping-workflow.md` 与 `tracker-defer.md`。
- 主干 `Phase 3-4` 已要求执行完成后读取 `references/shipping-workflow.md`，但 `Key Principles` 与 `Common Pitfalls` 仍在主干末端。
- 原方案 §G/§H 已指出 `Follow Existing Patterns` 中包含 Host Instruction Reuse Policy、team standards、hard/advisory 信任分类等承重约束，不能直接删除。

判断：

`spec-work` 的执行入口必须强，因为它直接写代码；但执行末端的 shipping、review、handoff、pitfalls 更适合 Progressive Disclosure。问题不在“主干太长”本身，而在末端原则/陷阱与 phase 行为混杂。尤其 `Common Pitfalls` 的作用像反模式索引，应转成 phase-local reminder + reference，而不是留作长列表。

落地含义：

推荐结构：

| 内容 | 处理 |
|---|---|
| source authority、plan/task scope、standards hard/advisory | 主干保留 |
| protected code、architecture mismatch | 主干保留在 Phase 2 压力点 |
| long pitfalls catalog | 移入 `references/execution-pitfalls.md` |
| shipping/review/closeout | 已在 `shipping-workflow.md`，需确认 must-read trigger 足够硬 |
| tracker defer | 保持 reference |

本轮结论：`spec-work` 的压缩候选是“末端反模式 catalog reference 化”，不是削弱 Phase 0-2 的执行纪律。

### 第 018 轮：`spec-debug` 应保留核心调试纪律，把技术清单外置为 investigation playbooks

审查镜头：debug 场景的行为保真。

证据：

- `skills/spec-debug/SKILL.md` 当前 402 行。
- references 包括 `anti-patterns.md`、`defense-in-depth.md`、`investigation-techniques.md`、`perf-regression.md`。
- 主干保留 `Core Principles`、`Feedback Loop And Hypothesis Ledger`、`Phase 1: Investigate`、`Phase 2: Root Cause` 等。

判断：

debug 的主干必须保留“复现优先、假设 ledger、一次只改一个变量、证据确认根因”这些纪律，因为它们防止模型直接猜修。可外置的是技术清单，例如性能回归排查、defense-in-depth 解释、具体 investigation techniques。原方案若只看行数，会低估 `Core Principles` 的防误修价值。

落地含义：

`spec-debug` 的披露策略：

```yaml
mainline_keep:
  - reproduce before root cause
  - hypothesis ledger
  - prediction vs observation
  - one change at a time
reference_candidate:
  - investigation technique catalog
  - perf regression playbook
  - anti-pattern examples
must_read_when:
  - performance regression
  - security / defense-in-depth suspicious code
  - repeated failed fixes
fallback_if_not_read: unsafe for complex bugs
```

本轮结论：`spec-debug` 只能压缩方法论解释，不能压缩调试纪律本身。

### 第 019 轮：`spec-compound` / `spec-compound-refresh` 已有 on-demand 支撑，但知识治理字段不能被压到不可见

审查镜头：Knowledge Harness。

证据：

- `spec-compound` 已声明 support files “read on-demand at the step that needs them”，并把 `schema.yaml`、`yaml-schema.md`、`domain-model-capture.md`、`concepts-vocabulary.md` 拆入 references。
- `spec-compound-refresh` 同样声明 support files on-demand，并有 `per-action-flows.md`、schema/yaml references。
- 两者主干都包含 Structured Promotion Gate 或维护动作分类，这是知识晋升/刷新边界的核心。

判断：

这两个 skill 的 Progressive Disclosure 方向已经正确：schema 与 category mapping 外置，promotion gate 留在主干。未来压缩时最大风险是把 knowledge promotion gate、invalidation condition、source_refs、legacy advisory 边界压到 reference，导致模型在写入 `docs/solutions/` 时看不到晋升约束。

落地含义：

知识类 skill 的压缩规则：

| 内容 | 处理 |
|---|---|
| Structured Promotion Gate | 主干保留 |
| `source_refs` / `invalidation_condition` 要求 | 主干保留摘要，schema 保留细节 |
| category mapping | reference |
| action-specific refresh flows | reference |
| 哲学叙事 / Auto-Invoke / long examples | 候选压缩 |

本轮结论：`spec-compound*` 的下一步不是证明能省多少行，而是确认 promotion gate 在所有模式下都可见。

### 第 020 轮：`spec-optimize` 的披露核心是 checkpoint 与用户批准 gate，不是实验模板

审查镜头：optimization workflow。

证据：

- `skills/spec-optimize/SKILL.md` 当前 737 行。
- references 包括 `optimize-spec-schema.yaml`、`experiment-log-schema.yaml`、`experiment-prompt-template.md`、`judge-prompt-template.md`、`usage-guide.md` 和 example specs。
- 主干内联 `Admission And Budget Gate`、`Persistence Discipline`、`Mandatory Disk Checkpoints`、baseline approval gate、Phase 3 loop 与 cleanup。

判断：

`spec-optimize` 本质上是高副作用 workflow：会创建分支/工作区、运行实验、写 checkpoint。可压缩的是模板和示例，不可弱化的是预算 admission、baseline approval、append-only experiment log、checkpoint、cleanup 禁删规则。原方案把 `spec-optimize` 标为未复核是正确的，因为它的风险与普通 prompt 精炼不同：压缩错了可能造成实验状态丢失或错误比较。

落地含义：

`spec-optimize` 披露策略：

| 内容 | 处理 |
|---|---|
| admission/budget gate | 主干保留 |
| baseline approval | 主干保留 |
| checkpoint table | 主干保留或极短表格保留 |
| experiment/judge prompt template | reference |
| example specs | reference |
| cleanup 禁删条件 | 主干末端保留 |

本轮结论：`spec-optimize` 的压缩必须以 state safety 为第一约束，不能用普通 token 经济学优先级评估。

### 第 021 轮：Eval-driven 改进的第一性原理是“先定义会退化什么”

审查镜头：Evaluation Harness。

外部参考：

- OpenAI Evals 指南强调用 eval 衡量模型系统在目标任务上的表现，并用样例、grader、rubric 驱动迭代：https://platform.openai.com/docs/guides/evals
- Anthropic 的 agent 工程文章强调先从真实工作流和可观察结果出发，再迭代 agent 结构，而不是先堆复杂框架：https://www.anthropic.com/engineering/building-effective-agents

证据：

- `docs/contracts/ai-coding-harness.md` 将 Evaluation Harness 定义为“记录系统是否真的变好，而不是只看使用次数”。
- `docs/contracts/workflows/eval-fixture-contract.md` 明确 eval fixtures 是轻量结构合同，不是 semantic judge。

判断：

当前原方案说“先建 Eval 基线”是对的，但还不够具体。对于 prompt 压缩，eval 的目标不是给 skill 打总分，而是保护会被压缩动作影响的行为。换句话说，先问“删/迁/压这段可能让模型在哪个场景退化”，再写对应 eval。

落地含义：

每个压缩候选必须先填写：

```yaml
degradation_hypothesis:
  candidate: "<section or sub-block>"
  possible_regression: "<what model may stop doing>"
  scenario: "<workflow scenario>"
  observable_signal: "<what output/action shows regression>"
  minimum_eval: "<case id or missing>"
```

没有 `possible_regression` 的候选，不应进入 P0；它只是节省 token 的愿望，不是工程改进。

### 第 022 轮：现有 eval contract 只证明结构覆盖，不证明语义质量

审查镜头：eval 证据强度。

证据：

- `eval-fixture-contract.md` 写明 `coverage_tags` 是 declared structural coverage，不证明 semantic quality。
- 当前仓库有大量 eval 文件，但类型不一：`examples.json`、`routing-cases.json`、`output-quality-cases.json`、`boundary-cases.json`、`trigger-cases.json` 等。
- 原方案第 001 轮已校正：部分 skill eval 数量并非 0。

判断：

“有 eval”与“有足够 eval 保护压缩”是两回事。结构 eval 能证明 case 存在、字段合法、覆盖标签声明；不能证明一个压缩后的 skill 在真实模型执行时还会做对。语义质量仍需 fresh-source eval、人类抽样或模型 judge 复核，但这些都应是 advisory semantic practice，不应伪装成 CI 硬 gate。

落地含义：

为每个候选标注 eval 证据层级：

| 层级 | 含义 | 是否足够开改 |
|---|---|---|
| L0 none | 无对应 case | 不足 |
| L1 structural | 有 coverage tag / expected outcome | 可做低风险 prose 压缩，但不能声明质量提升 |
| L2 semantic sample | fresh-source eval 或人工抽样看过 case 含义 | 可做中风险压缩 |
| L3 before/after | 同一 case 压缩前后输出对比 | 才能声明行为未退化 |
| L4 production evidence | 真实 run / review / bug 反馈闭环 | 才能声明质量提升 |

### 第 023 轮：压缩前必须保存 baseline，不然无法做 before/after

审查镜头：实验设计。

证据：

- `fresh-source-eval-checklist.md` 要求检查当前磁盘 source，而不是 runtime mirror 或当前会话缓存定义。
- `spec-optimize` 的设计把 baseline、experiment log、checkpoint 作为实验安全边界。

判断：

prompt 压缩本质上也是一次优化实验。没有 baseline，就只能做“改后看起来合理”的主观审查。对于高风险 skill，应先冻结压缩前的关键行为样本，记录 source hash、候选 section、eval case、expected signal，然后再改。

落地含义：

建议新增一个轻量压缩实验记录格式，先作为 review report 内表格，不急着 schema 化：

| 字段 | 说明 |
|---|---|
| candidate_id | 压缩候选 |
| source_hash_before | 改前 skill 或 report hash |
| protected_behavior | 被保护行为 |
| baseline_cases | 相关 eval/fresh-source case |
| regression_signal | 退化信号 |
| post_change_result | 改后结果 |

本轮只建议把它写入审查/计划，不建议新增 CLI 或 JSON schema。

### 第 024 轮：Eval Adequacy Audit 应先于 Eval Expansion

审查镜头：避免堆样例。

证据：

- `spec-prd` 当前已有 111 个 examples，但原方案仍建议“补 10-15 个”。
- `spec-code-review` 只有 9 个 examples，而其压缩风险主要集中在 headless、Stage 5、Stage 5b、scope boundary 等具体区域。

判断：

下一步不是给每个核心 skill 平均新增样例，而是做 Eval Adequacy Audit：现有样例是否覆盖即将变化的候选；样例是否有 forbidden signals；是否有 source refs；是否能暴露压缩退化。数量多的 skill 可能仍缺关键 case，数量少的 skill 也可能刚好覆盖当前候选。

落地含义：

建议审计表：

| Skill | candidate | existing_eval | gap | action |
|---|---|---|---|---|
| spec-code-review | headless template 下沉 | unknown | 需查 headless output 字段 | add focused case |
| spec-plan | HLD reference 化 | partial | 需高风险 architecture case | add focused case |
| spec-work | pitfalls 外置 | likely missing | 需 scope creep/protected code case | add focused case |
| spec-debug | playbook 外置 | partial | 需 repeated failed fix case | add focused case |

### 第 025 轮：negative eval 比 happy path 更能保护 skill 质量

审查镜头：失败样本。

证据：

- `eval-fixture-contract.md` 支持 `boundary`、`failure`、`forbidden_signals[]`。
- skill 退化通常表现为“做了不该做的事”：把 advisory 当 confirmed、把 generated runtime 当 source、绕过 dispatch authorization、把 semantic risk 脚本化。

判断：

压缩后的最危险退化不是少输出一点解释，而是丢掉边界。negative eval 应成为压缩保护的主力。尤其 `using-spec-first`、`spec-code-review`、`spec-work`、`spec-compound` 的 hard boundary 都应该有 forbidden signal。

落地含义：

压缩候选至少配一个 negative signal：

```json
{
  "coverage_tags": ["boundary", "failure"],
  "forbidden_signals": [
    "treats generated runtime mirror as source",
    "dispatches subagents without explicit authorization",
    "demotes high-confidence P0/P1 finding to residual",
    "promotes advisory learning without source_refs"
  ]
}
```

本轮结论：如果某候选无法写出 negative eval，它的风险模型还不清楚。

### 第 026 轮：fresh-source eval 是语义复核，不是普通测试替代品

审查镜头：验证边界。

证据：

- `fresh-source-eval-checklist.md` 明确不能通过调用当前会话 typed skill 验证改后行为，因为它可能仍用缓存定义。
- checklist 也明确不要求 PR 在 CI 中通过模型 judge。

判断：

fresh-source eval 的价值是独立读当前 source，检查 trigger precision、source/runtime boundary、host entrypoints、internal-only boundary、deterministic vs semantic boundary。它不替代 Jest，也不应成为伪自动硬门。对于本目标，fresh-source eval 最适合用在“改 skill prose / reference 后”的语义保真复核。

落地含义：

每个压缩包 closeout 应声明：

```yaml
fresh_source_eval:
  status: passed | concerns | not_run
  not_run_reason: "<required when not_run>"
  source_paths:
    - skills/<skill>/SKILL.md
    - skills/<skill>/references/<ref>.md
  behavior_under_review:
    - trigger_precision
    - source_runtime_boundary
    - progressive_disclosure_trigger
    - protected_behavior
```

本轮结论：没有 fresh-source eval 时可以继续小步推进，但不能声称语义质量已验证。

### 第 027 轮：skill 执行质量指标应绑定 workflow 节点，而非通用“准确率”

审查镜头：指标设计。

证据：

- `ai-coding-harness.md` 的核心链路是 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge`。
- 不同 workflow 的质量失败形态不同：PRD 失败是 planning invention，plan 失败是 implementation ambiguity，work 失败是 scope drift，review 失败是 false positive/false negative，compound 失败是污染知识库。

判断：

不能用一套“skill 准确率”衡量所有 skill。每个 workflow 应有节点特定质量指标。否则优化会变成为了一个抽象数字而牺牲真实研发收益。

落地含义：

建议指标映射：

| 节点 | 质量指标 |
|---|---|
| Spec / PRD | OQ 是否阻止 planning invention；owner decision fidelity |
| Plan | implementation units 是否可执行；assumption failure 是否可定位 |
| Work | scope adherence；protected code preservation；verification honesty |
| Review | P0/P1 visibility；evidence anchor quality；false positive suppression |
| Debug | reproduced-before-fix；root cause evidence；one-change discipline |
| Knowledge | source-confirmed promotion；invalidation condition；decision reuse |

本轮结论：后续任何“提升 skill 执行质量”的声明都必须指定 workflow 节点和指标。

### 第 028 轮：模型 judge 可用，但不能成为唯一证据

审查镜头：LLM-as-judge 边界。

外部参考：

- OpenAI Evals 支持用 graders/rubrics 评估输出，但评估设计仍需样例与人工校准：https://platform.openai.com/docs/guides/evals

判断：

模型 judge 对 prompt 压缩很有用，尤其能快速比较 before/after 输出是否保留边界。但它天然属于 semantic judgment，不能替代 deterministic facts。更不能让 judge 直接决定 schema/gate 是否通过。最安全的用法是：judge 生成 concerns，人工/owner 或 orchestrator 再结合 source/test/log 判定。

落地含义：

建议模型 judge 只回答窄问题：

- 是否仍遵守 source/runtime boundary？
- 是否仍在该场景触发正确 workflow？
- 是否遗漏必须可见的 hard gate？
- 是否新增了越权行为？

禁止 judge 直接输出：

- “该 skill 已整体优化成功”
- “可以删除某 hard gate”
- “这个 schema 应成为 blocking gate”

### 第 029 轮：真实 run 反馈应成为未来 Evaluation Harness 的高价值输入

审查镜头：从样例到生产反馈。

证据：

- 当前 eval fixtures 多为人工构造或 examples-as-context。
- 目标要求“为 spec-first 发展负责”，不仅要改 prompt，还要判断真实研发场景适应性。

判断：

长期看，最有价值的 eval 不是 synthetic examples，而是真实失败和真实成功的抽样：某次 review 漏掉 P1、某次 plan 导致 implementation 返工、某次 debug 误认 root cause、某次 compound 污染知识库。当前方案还缺“如何把真实 run 反馈转成 eval candidate”的路径。

落地含义：

建议建立轻量流程：

```text
real workflow issue
  -> classify workflow node
  -> extract minimal input/output
  -> redact sensitive content
  -> attach source_refs or historical/advisory authority
  -> add as eval candidate
  -> only after source/current anchor exists, promote to release-readiness eval
```

本轮结论：未来 eval 增长应优先来自真实 workflow feedback，而不是凭空造 case。

### 第 030 轮：下一阶段的可交付应是 Eval Adequacy Matrix，而不是 Skill Eval Baseline Pack

审查镜头：阶段性路线校正。

证据：

- 原方案 §I.4 推荐 `Skill Eval Baseline Pack`。
- 当前事实显示 eval 并非全空，且不同 skill 的 eval 数量与风险分布差异很大。
- 第 021-029 轮已建立“候选退化假设 -> eval 证据层级 -> before/after -> fresh-source eval”的闭环。

判断：

`Skill Eval Baseline Pack` 这个名字仍然像“批量补样例”。更准确的下一阶段可交付应是 `Eval Adequacy Matrix for Semantic Compression`。它不是改 skill，而是为每个压缩候选确认是否有足够 eval/fresh-source evidence 支撑。

落地含义：

下一阶段文档应包含：

| 列 | 说明 |
|---|---|
| skill | 目标 skill |
| compression_candidate | 候选片段 |
| protected_behavior | 不可退化行为 |
| existing_eval_refs | 现有 eval |
| missing_negative_cases | 缺失反例 |
| fresh_source_eval_question | fresh-source 复核问题 |
| implementation_permission | blocked / candidate / ready |

本轮结论：当前最小可维护路线从“补 eval baseline”升级为“先做 eval adequacy，再补定向 case，再做语义保真压缩”。

## 当前总判断

原方案方向正确，但当前执行入口应再次收窄：

```text
不是：直接按 H.14 改 skill 或新增字段
而是：先做 compression-candidate audit matrix
然后：补候选定向 eval
再后：做少量语义保真压缩
最后：用 fresh-source eval + focused tests 验证行为不退化
```

补充 Progressive Disclosure 后，当前结论进一步收敛为：

```text
先定义披露层级和触发条件
再做 compression-candidate audit matrix
再为每个候选补 must_read_when + equivalence_eval
最后才做 source-first 的少量 skill prose / reference 调整
```

追加第 015-020 轮后，当前候选矩阵方向进一步明确：

```text
code-review：先矩阵，不动 Stage 5/5b
plan：HLD 双层披露，保留 framing
work：压末端 pitfalls，不削弱执行纪律
debug：保留调试纪律，外置技术 playbook
compound：promotion gate 必须主干可见
optimize：state safety / checkpoint / approval gate 优先于 token 节省
```

追加第 021-030 轮后，执行路线进一步更新：

```text
不是 Skill Eval Baseline Pack
而是 Eval Adequacy Matrix for Semantic Compression
先定义 protected_behavior 和 degradation_hypothesis
再查 existing_eval_refs 与 missing_negative_cases
再补 before/after 和 fresh-source eval
最后才允许压缩候选进入 implementation
```

本报告的第 001 至 030 轮完成后，目标仍未完成。剩余 20 轮应继续覆盖：

- 9 个核心 skill 的逐项压缩候选复核。
- 研发场景适应性：greenfield、brownfield、bugfix、PR review、refactor、runtime setup、knowledge capture、team standards。
- 业界方法论映射：progressive disclosure、context engineering、prompt compression、eval-driven development、agent memory、workflow governance。
- 当前问题与未来问题分层：近期是 eval adequacy 和语义保真压缩，未来是跨 run 数据闭环与知识复利度量。

## 第 031-050 轮追加审查：场景适配、业界方法论与最终收口

本段基于当前 worktree 复核：原方案文档当前 SHA-256 为 `a118fc1fc06ce31a4d025450217f1b14b1539e0085fa88580e24b8af74a4e776`。该值已不同于前序报告记录，说明原方案存在并发 docs(research) 写入。本报告继续遵守用户约束：只追加独立审查报告，不修改原方案文档。

### 第 031 轮：研发场景适配矩阵应成为压缩前置条件

审查镜头：场景优先，而不是全局同构压缩。

证据：

- 原方案 §J 已把 Progressive Disclosure 定义为 L1/L2/L3 三层，并提出若干 L3 删除建议。
- `docs/contracts/workflows/scenario-capability-matrix.md` 明确 `clean-single-repo`、`dirty-single-repo`、`multi-repo-workspace`、`foreign-residual-workspace` 等场景只有 capability posture 差异，不应被压成统一流程。
- `skills/using-spec-first/SKILL.md` 的 route map 要求 substantial work 才进入 workflow，轻量事实问答可直接回答。

判断：

同一个 skill 片段在不同研发场景中的价值不同。某段文字在 greenfield 小功能里可能是 L3 噪音，在 brownfield 多仓迁移里却可能是防止越权扩 scope 的 behavioral anchor。Progressive Disclosure 的正确单位不是“段落是否抽象”，而是“在某个场景下是否改变决策或防错”。

落地含义：

压缩候选矩阵应新增场景列：

| 场景 | 压缩策略 | 保护行为 |
|---|---|---|
| greenfield | 压缩背景说明，保留目标/边界/验收 | 不过早引入架构复杂度 |
| brownfield | 保留 source-read、scope、current-state 纪律 | 不凭想象写 WHAT/HOW |
| bugfix | 保留复现、假设、根因链 | 不直接改代码掩盖根因 |
| PR review | 保留 diff scope、evidence、coverage | 不把 advisory 当 finding |
| refactor | 保留 blast-radius 和 behavior-preservation | 不做无证据大迁移 |
| runtime setup | 保留 source/runtime 边界和 readiness facts | 不把 setup facts 当语义真相 |
| knowledge capture | 保留 source-confirmed promotion gate | 不沉淀未验证记忆 |

本轮结论：`Scenario x Skill x Compression Candidate` 应先于任何实际删减。

### 第 032 轮：greenfield 场景需要压复杂度，brownfield 场景需要保留证据纪律

审查镜头：新项目与既有系统的 context 需求完全不同。

证据：

- `spec-prd` 当前主干强调 `Requirement Analysis Gate`、`Product Expert Lens`、`Current-State Evidence` 和 readiness finalize。
- `spec-plan` 当前主干在 5.3.8/5.4 通过 `plan-handoff.md` 保证 plan 后不自动执行。
- Anthropic Context Engineering 把问题从“写好 prompt”扩展为“每次推理时给模型什么状态最能产生目标行为”：https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

判断：

greenfield 最容易过度设计，brownfield 最容易幻觉当前系统。两者的压缩方向相反：greenfield 应减少 enterprise checklist 和不必要的现状考古；brownfield 应保留 current-state evidence、source authority、existing pattern 和 handoff discipline。若用一套“减少行数”指标压缩 `spec-prd` / `spec-plan`，会把 brownfield 的安全边界也误删。

落地含义：

建议给 `spec-prd` / `spec-plan` 的压缩候选增加两个 protected behavior：

- `greenfield_simplicity`: 不因通用治理 prose 引入不必要的 artifact/schema。
- `brownfield_grounding`: 不允许计划或 PRD 编造当前系统行为。

本轮结论：压缩不是“越短越好”，而是 greenfield 降低启动负担，brownfield 增强证据密度。

### 第 033 轮：bugfix 场景的第一性原理是因果闭环，不是快速行动

审查镜头：`spec-debug` 的不可压缩核心。

证据：

- `skills/spec-debug/SKILL.md` 当前主干包括 `Core Principles`、`Feedback Loop And Hypothesis Ledger`、`Root Cause`、`Conditional defense-in-depth` 和 closing hygiene。
- 第 018 轮已判断 `spec-debug` 可把技术清单外置为 playbook，但不能删除核心调试纪律。

判断：

debug 场景的价值不在“信息完整”，而在防止 agent 采用最短路径：看到错误、猜原因、直接改。这里的语义压缩必须保护三个动作：复现、形成带预测的假设、用证据闭合 causal chain。`spec-debug` 的 `Core Principles` 是否为 L3，不能按“是否是理念句”判定，而要看它是否阻止了这些常见失败。

落地含义：

`spec-debug` 压缩候选应拆成两类：

| 候选 | 可压缩性 | 判据 |
|---|---|---|
| 环境检查/issue tracker 技术路径 | 高 | 可通过 STOP 触发 reference |
| 复现/假设/根因链纪律 | 低 | 删除后会增加 shotgun fix 风险 |

本轮结论：bugfix 场景下，`root-cause discipline` 是 L1 spine，不应被归入可删除 L3。

### 第 034 轮：PR review 场景的压缩边界是 synthesis，不是 reviewer 数量

审查镜头：`spec-code-review` 的质量瓶颈。

证据：

- `skills/spec-code-review/SKILL.md` 当前 Stage 5 合并 findings，Stage 5b 在 headless/autofix 等外部化模式下验证幸存 findings，Coverage 记录 suppressed、demotion、test gaps、direct evidence 等。
- `spec-code-review` 已有 Progressive Disclosure boundary：小 diff 可用 minimum reviewer，高风险 workflow/contract/source-runtime/security/cross-module diff 用 full core。
- Anthropic Building Effective Agents 推荐从简单可组合 workflow 开始，而不是过早堆复杂框架：https://www.anthropic.com/engineering/building-effective-agents

判断：

PR review 的质量不由“派几个 reviewer”单独决定，而由 preflight scope、reviewer return schema、Stage 5 synthesis、Coverage、验证/降级说明共同决定。压缩 reviewer list 或 persona prose 可能省 token，但若破坏 synthesis 规则，风险更大。

落地含义：

`spec-code-review` 的 P0 压缩不应再碰 Stage 5/5b。更安全的路线是：

1. 把 headless output template 和 tracker defer 细节移入 reference。
2. 保留 Stage 5/5b 的合并、confidence gate、coverage 字段。
3. 给每个 reference extraction 增加 eval：同一 finding 在压缩前后仍被 primary surfaced 或正确进入 residual/test_gaps。

本轮结论：PR review 压缩的目标是减少入口噪音，不是缩短审查判断链。

### 第 035 轮：refactor / migration 场景需要“行为等价性”而不是“结构整洁”

审查镜头：重构类任务最容易被语义压缩误导。

证据：

- `spec-work` 的 parallel safety 与 system-wide test check 是执行期的关键安全步骤。
- `spec-code-review` 的 Graph-Assisted Impact Review 明确只是 advisory lens，结论仍要回到 direct source/test/log evidence。
- `docs/contracts/ai-coding-harness.md` 区分 source-read、verification、handoff-summary、external-tool、capability-candidate evidence lanes。

判断：

重构和迁移任务里，最危险的不是“少读了一段说明”，而是把结构变化误认为行为等价。Progressive Disclosure 可以把迁移 SOP 下沉，但 spine 必须持续提醒：重构完成的证据不是“代码更干净”，而是原行为、公共 contract、测试、运行入口、用户可见输出未退化。

落地含义：

建议 `spec-work` / `spec-code-review` 的压缩矩阵新增：

- `equivalence_claim_required`: 任何 refactor/migration closeout 都要说明保持了哪些行为。
- `changed_contract_surface`: 若触及 CLI、template、workflow、schema、source/runtime projection，自动提升为 high-risk review posture。
- `graph_evidence_status`: graph/codegraph 只能导航，不替代 source/test/log。

本轮结论：refactor 场景的压缩必须保护 behavior-preservation，不保护这一点的“简洁”会降低 skill 执行质量。

### 第 036 轮：runtime setup 场景的关键是“readiness facts 不是语义真相”

审查镜头：`spec-mcp-setup` 与 downstream workflow 的边界。

证据：

- `skills/spec-mcp-setup/SKILL.md` 明确 Runtime Setup 准备 deterministic host/runtime facts，不提供 code-understanding authority。
- 同文件强调 `baseline_ready=true` 不能隐藏 stale generated runtime，generated runtime mirrors 不是 source。
- Scenario Capability Matrix 把 setup/fingerprint facts 定义为 advisory，不是 hard gate 或 workflow state。

判断：

业界 context engineering 和 tool use 方法论容易把“有工具/有索引/有 setup facts”误解成“可以相信工具结论”。spec-first 的差异化优势恰好是把 readiness、provider、runtime、source truth 分开。压缩 `spec-mcp-setup` 时，不能把这些边界压成一句“检查工具是否可用”。

落地含义：

`spec-mcp-setup` 的 L1 spine 必须保留：

- setup 写入范围：setup-owned facts、本地 config、host config、`spec-first init` 投影。
- 非目标：不判断代码语义、不阻塞普通 direct source evidence 工作。
- generated runtime freshness 与 dependency readiness 分开报告。

本轮结论：runtime setup 的压缩红线是 source/runtime/provider 三重边界。

### 第 037 轮：knowledge capture 场景的压缩目标不是更短，而是防止污染知识库

审查镜头：`spec-compound` / `spec-compound-refresh`。

证据：

- `skills/spec-compound/SKILL.md` 要求新 promoted solution 包含 `invalidation_condition` 和 `source_refs`，且只有 source-confirmed、verified learning 可进入 durable docs。
- `skills/spec-compound-refresh/SKILL.md` 区分 Update、Replace、Consolidate、Stale、Delete，并强调 raw external-tool output 不进入刷新后的 learning docs。
- 角色契约把 knowledge promotion gate 列为五类硬 gate 之一。

判断：

知识沉淀的失败不是“忘记沉淀”，而是“沉淀了错误、过时、未验证或重复的知识”。这里的压缩必须保护 promotion gate、overlap assessment、invalidation condition。`Why compound` 这类叙事可压，但 source-confirmed promotion 不能下沉到 agent 可能不读的 reference 深处。

落地含义：

建议把 `spec-compound*` 压缩分成：

| 保留在 spine | 可下沉/压缩 |
|---|---|
| source-confirmed、verified、`source_refs`、`invalidation_condition` | 示例模板、长 overlap 解释、轻量模式完整输出样例 |
| 不促成 mandatory completion gate | 背景叙事 |
| refresh 的 replace/consolidate/stale/delete 决策入口 | 详细 per-action flow |

本轮结论：知识复利来自可信知识密度，不来自更多文档数量。

### 第 038 轮：team standards 场景要求 authority 分层，不能用“社会认同”式压缩

审查镜头：团队规范与候选规则的消费边界。

证据：

- `docs/contracts/team-standards.md` 明确只有 `trust=confirmed,lifecycle_state=active` 且 scope 命中的规则可成为 hard project context。
- `spec-team-standards-governance` 是 standalone source-maintenance method，不是公开 `$spec-*` workflow，也不允许把 observed/suggested/imported/conflict/confirmed-draft 当 hard context。
- 第 006 轮已指出 knowledge reuse 应计“影响决策”，不是引用次数。

判断：

团队规范最容易出现“大家都这么做”的社会认同陷阱。压缩后若只留下“遵循团队规范”，会丢失 trust/lifecycle/scope/authority 分层，导致候选、历史经验、provider 输出被误当硬规则。这里的第一性原理是 authority，不是共识。

落地含义：

skill 压缩候选必须保留一行可执行选择规则：

```text
Only confirmed + active + scope-matched standards can hard-constrain work/review; candidates remain advisory.
```

同时 eval 应覆盖反例：用户要求“按团队规范改”，但唯一命中的只是 `docs/standards/candidates/**`，workflow 应输出 advisory limitation，而不是 hard enforce。

本轮结论：standards-native 是 spec-first 的未来方向，但必须建立在 authority 分层上。

### 第 039 轮：multi-repo / dirty workspace 场景要求 target_repo 显式化

审查镜头：父级 workspace 与并发脏工作树。

证据：

- AGENTS.md 要求父级多仓 workspace 写入、修复、测试、review autofix 或 commit 前必须有明确 `target_repo` / per-child scope。
- `using-spec-first` 允许只读 codebase 问题做 bounded direct reads，但写入类工作必须明确 target repo。
- Scenario Capability Matrix 对 multi-repo、dirty、foreign residual 分别给出 bounded/partial/blocked-action-required 姿态。

判断：

这种场景下，过度压缩入口治理会直接导致错误仓库写入、错误测试范围、错误 diff review。Progressive Disclosure 不能把 target_repo 规则藏到少数 reference，因为它是 mutation gate 的前置条件。

落地含义：

`using-spec-first` / `spec-work` / `spec-code-review` 的压缩红线：

- multi-repo 写入前 target repo 必须 L1 可见。
- dirty paths 是 advisory evidence，但在 commit/PR/review closeout 前必须披露。
- foreign residual 不是普通 dirty，涉及可信 artifact 边界，不能静默继续。

本轮结论：多仓和并发场景下，scope 是安全属性，不是可读性细节。

### 第 040 轮：release / CI 场景需要 honest closeout，而不是“测试跑了”

审查镜头：完成声明的证据质量。

证据：

- `spec-code-review` 要求 targeted validation 通过 `verification-run-summary.v1` 或 `honest-closeout.v1` 表达，不把“tests passed”写成宽泛完成证明。
- 角色契约把 verification gate 定义为声明完成 / 测试通过 / 修复时必须有 confirmed evidence。
- OpenAI Evals 当前文档强调 eval 用于测试输出是否符合指定标准，并且需要数据集、测试准则和结果分析：https://platform.openai.com/docs/guides/evals

判断：

release/CI 场景中的压缩风险是把复杂证据链变成一句“已验证”。这会让 downstream consumer 无法判断验证覆盖了什么、没覆盖什么、是否只是窄测试。压缩 closeout prose 时，应压叙事，不压 evidence fields。

落地含义：

所有 workflow 的 final response / artifact 压缩应保留：

- 执行过的命令和 exit outcome。
- 覆盖范围与未覆盖范围。
- 与变更风险对应的验证充分性判断。
- generated runtime 是否刷新 / 是否未涉及。

本轮结论：release readiness 不是绿色日志，而是可复核的证据-声明匹配。

### 第 041 轮：OpenAI Codex Skills 的 Progressive Disclosure 给了明确工程约束

审查镜头：官方 skill 机制与 spec-first 的一致性。

外部参考：

- OpenAI Codex Skills 文档说明 skill 初始只暴露 name、description、path；选中后再读取完整 `SKILL.md`，并对初始 skill 列表设置上下文预算：https://developers.openai.com/codex/skills
- OpenAI AGENTS.md 文档说明 Codex 启动时读取 layered project guidance：https://developers.openai.com/codex/guides/agents-md

判断：

官方做法证明 Progressive Disclosure 不是“把长文档拆走”，而是有两层 contract：初始可发现性和选中后的完整指令。对 spec-first 来说，`description` 是 trigger contract，`SKILL.md` 是 spine，`references/` 是 conditional detail。压缩若只关注 `SKILL.md` 行数，而忽略 description 截断后的可发现性，会优化错对象。

落地含义：

建议每个 skill 压缩候选同步检查：

| Surface | 审查问题 |
|---|---|
| `description` | 截短后是否仍有触发词、负向边界、近邻排除 |
| `SKILL.md` spine | 是否保留 workflow contract、hard gate、STOP trigger |
| `references/` | 是否只有 L2 可触发细节，而非垃圾桶 |
| `evals/examples.json` | 是否覆盖 trigger/boundary/failure |

本轮结论：Codex 官方方法论支持“description-first + spine + references + eval”的四层压缩结构。

### 第 042 轮：Anthropic Effective Agents 支持 spec-first 的 workflow-first，而不是 agent-first

审查镜头：是否应该新增更多 agent/persona 来提升质量。

外部参考：

- Anthropic Building Effective Agents 建议从简单 building blocks 和可组合 workflow 开始，再逐步增加复杂度：https://www.anthropic.com/engineering/building-effective-agents

判断：

原方案中若把“提升 skill 执行质量”理解为增加更多 persona、checker、schema 或 agent，就偏离了当前 spec-first 的最小可维护路线。Anthropic 的经验更支持 spec-first 当前哲学：workflow harness、direct evidence、轻 contract、清晰 boundaries。复杂 reviewer/persona 只有在具体场景证明能降低漏判或返工时才值得加。

落地含义：

未来 enhancement 的排序应是：

1. 先修 spine / reference / eval。
2. 再验证是否仍有高频失败。
3. 只有失败模式不能由现有 workflow 吸收时，才新增 agent/persona/schema。

本轮结论：workflow-first 是压缩后的保真锚点，agent 扩张不是默认答案。

### 第 043 轮：Context Engineering 的度量单位应是“决策充分性 / token”

审查镜头：第一性原理重述。

外部参考：

- Anthropic Context Engineering 把问题定义为优化有限 context window 中 token 的效用，而不是只写更好的 prompt：https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- `Lost in the Middle` 研究显示长上下文中信息位置会影响检索表现：https://arxiv.org/abs/2307.03172
- `Same Task, More Tokens` 研究显示输入长度增加可能让推理表现下降：https://arxiv.org/abs/2402.14848

判断：

spec-first 的语义压缩指标不应是“减少 token 数”，而应是：

```text
decision_sufficiency_per_token
  = 保留正确 routing / gate / evidence / handoff / verification 决策的能力
    / 进入上下文的 token 成本
```

这能解释为什么某些短句必须保留：它们直接改变决策。也能解释为什么某些长模板可下沉：只有特定分支需要。

落地含义：

压缩评审可以为每个候选加三个问题：

- 删除后，哪个决策可能变差？
- 下沉后，agent 何时会可靠触发读取？
- token 节省是否大于 trigger miss 的风险？

本轮结论：第一性原理不是“更精炼”，而是提高单位 token 的决策充分性。

### 第 044 轮：Prompt compression 研究可借鉴，但不能直接套到 skill prose

审查镜头：LLMLingua 类方法与 workflow skill 的差异。

外部参考：

- LLMLingua 提供 coarse-to-fine prompt compression，并强调在压缩比下保持语义完整性：https://arxiv.org/abs/2310.05736

判断：

LLMLingua 一类研究证明“语义保真压缩”可行，但它主要解决推理输入压缩，不自动解决 workflow contract 的可执行性。spec-first skill prose 不是一次性 prompt，而是 host 入口、路由、source/runtime 边界、tool 调用、artifact handoff 的组合。对它做压缩不能只看相似度或回答质量，还要看是否保留 state transition 的安全约束。

落地含义：

可借鉴 LLMLingua 的两点：

- `budget_controller`: 每个 skill 设定 spine token budget。
- `semantic_integrity`: 压缩前定义 protected behavior。

不可照搬：

- 自动删 token 后直接上线。
- 用一个模型分数证明 workflow 保真。

本轮结论：prompt compression 是启发，不是 spec-first skill 优化的实施机制。

### 第 045 轮：Progressive Disclosure 的失败模式是“触发失败”，不是“reference 太多”

审查镜头：对 §J 的关键校正。

证据：

- `spec-prd` 通过 `Reference Trigger Map` 和多个明确触发引用来组织 L2。
- `spec-plan` 在主干有多个 `STOP. Before... read references/...`，已形成较清晰触发。
- NN/g 对 Progressive Disclosure 的经典定义强调先展示少数关键选项，再按需暴露高级选项：https://www.nngroup.com/articles/progressive-disclosure/

判断：

Progressive Disclosure 的工程风险不是 reference 数量，而是 agent 在需要时不会读。`reference/` 只有在 trigger 可发现、条件具体、必须读取、回读后继续执行时才有价值。原方案 §J 目前强调 L3 删除和 STOP 标准化是对的，但还缺 trigger failure 的评估。

落地含义：

每个 reference extraction 应配套：

| 字段 | 说明 |
|---|---|
| `trigger_condition` | 具体、可判定、尽量绑定文件/模式/场景 |
| `must_read` | true/false，是否为继续执行前置 |
| `fallback_if_unread` | 未读时必须保守降级或停止 |
| `eval_case` | 触发场景中是否真的读取/遵守 |

本轮结论：PD 质量由触发可靠性决定，不由拆文件数量决定。

### 第 046 轮：L3 删除原则需要补“behavioral anchor”例外

审查镜头：原方案 §J 中“Core Principles 是 L3 应完全删除”的风险。

证据：

- `spec-debug` 的 `Core Principles` 包含复现、根因、单变量修复等调试纪律。
- `spec-plan` 的 Core Principles 中部分内容可能是通用理念，但 P6/P8 这类 quality bar 可能影响计划输出。
- 角色契约强调 gate the exits, not the thinking；不能把 LLM 语义判断压成机械分类。

判断：

“L3 完全删除”作为原则正确，但“Core Principles = L3”不总是成立。某些原则句虽然抽象，却是 behavioral anchor：它不提供细节步骤，但阻止 agent 走错误路径。若删除后 agent 更容易跳过证据、扩大 scope、过早执行或伪造验证，它就不是 L3。

落地含义：

建议把三层模型修订为四类判断：

| 类别 | 处置 |
|---|---|
| L1 contract/gate | 必留 spine |
| L1 behavioral anchor | 可压成短句，但不能删除 |
| L2 conditional procedure | 下沉 reference + STOP |
| L3 narrative/common knowledge | 删除 |

本轮结论：需要新增 `behavioral_anchor` 保护类，避免 PD 方法论过度应用。

### 第 047 轮：subagent / persona 并行是能力，不是质量保证

审查镜头：多 agent 审查边界。

证据：

- `spec-doc-review` 当前 Codex 直接 invocation 不自动授权 `spawn_agent`，缺少 explicit subagent/delegation/parallel/persona wording 时走 single-agent report-only fallback。
- `spec-code-review` 同样要求 dispatch safe/available/authorized，并在 fallback 中记录 Coverage。
- Anthropic Effective Agents 把 parallelization 视为一种 workflow pattern，而不是所有任务默认模式。

判断：

未来若优化 skill 执行质量，不能把“更多 persona 并行”当作通用解。并行只在任务可分解、证据独立、合成规则可靠、授权明确时提升质量。否则会增加成本、矛盾 finding、合成负担和幻觉来源。

落地含义：

压缩后应保留 dispatch boundary：

- workflow entrypoint 授权 workflow，不自动授权 host-level subagents。
- report-only fallback 不是失败，是边界正确。
- 并行 reviewer 的收益要通过漏判率/重复 finding/合成冲突衡量。

本轮结论：并行是可选执行策略，质量来自 bounded scope + synthesis + evidence。

### 第 048 轮：工具与 provider 应按“证据 lane”披露，不按供应商能力披露

审查镜头：MCP / Graphify / CodeGraph / browser 等工具上下文。

证据：

- `docs/contracts/ai-coding-harness.md` 明确 external-tool evidence 未经 source/test/log/schema/contract 或用户确认前都是 advisory。
- `spec-code-review` 对 Graph-Assisted Impact Review 标注 `provider_untrusted`，结论要回到 source/test/log。
- `spec-mcp-setup` 只准备 readiness facts，不提供代码理解 authority。

判断：

业界 agent 工具化趋势会诱导 prompt 中堆很多 provider 能力说明。对于 spec-first，这些内容应被压缩为 evidence lane：source-read、verification、handoff-summary、external-tool、capability-candidate。这样 agent 知道工具输出的权威级别，而不是记住供应商细节。

落地含义：

建议把跨 skill 工具说明收敛为统一短语：

```text
External/provider outputs are navigation or advisory facts until confirmed by source/test/log/contract evidence.
```

具体 provider 使用步骤放入 setup 或对应 workflow reference。

本轮结论：工具披露的第一性原理是 authority level，不是工具清单完整度。

### 第 049 轮：未来问题是跨 run 数据闭环，不是一次性 prompt 瘦身

审查镜头：长期演化责任。

证据：

- 角色契约把 Evaluation Harness、Evidence Harness、Knowledge Harness 与 Context Harness 并列。
- 当前 eval fixture 数量分布不均：`spec-prd=111`、`spec-plan=19`、`spec-code-review=9`、`spec-compound=10`、`spec-work=6`、`spec-debug=6`、`spec-doc-review=6`、`spec-optimize=4`。
- OpenAI Evals 文档当前提示该平台有 deprecation timeline，因此 spec-first 不应把核心质量闭环绑定到某个外部 eval 产品 API。

判断：

眼下问题是 prompt/spine/reference 的语义保真压缩；未来问题是把真实 workflow run 的成功、失败、返工、漏判、知识复用转成 eval candidates 和 quality metrics。否则 prompt 会在一次性审查后继续膨胀。

落地含义：

建议未来 backlog 从三条线推进：

1. `compression_candidate_audit`: 静态候选矩阵。
2. `targeted_regression_eval`: 每个候选 2-4 个场景化 eval。
3. `real_run_feedback_to_eval`: 从真实失败/成功抽样转成可复核 case。

本轮结论：一次压缩解决体积，跨 run eval 闭环解决长期质量。

### 第 050 轮：最终收口应是 Scenario x Skill x Evidence 的实施矩阵

审查镜头：50 轮后的可交付定义。

判断：

原方案总体方向正确，但目前不能直接进入大规模 skill 改写。正确下一步不是“按 §J 删除所有 L3”，也不是“给每个 skill 建更多 reference”，而是先把 50 轮审查结论固化为一个可执行矩阵。这个矩阵既服务当前问题，也为未来演化留出证据闭环。

建议最终矩阵字段：

| 字段 | 说明 |
|---|---|
| `skill` | 目标 skill |
| `scenario` | greenfield / brownfield / bugfix / review / refactor / setup / knowledge / standards / multi-repo / release |
| `compression_candidate` | 待删、待下沉、待合并或待保留片段 |
| `classification` | L1 contract / L1 behavioral_anchor / L2 reference / L3 delete |
| `protected_behavior` | 不可退化行为 |
| `trigger_condition` | 若下沉，何时必须读 |
| `existing_eval_refs` | 当前 eval / test / fresh-source 证据 |
| `missing_negative_cases` | 必补反例 |
| `source_runtime_boundary` | 是否影响 source/runtime 投影 |
| `implementation_permission` | blocked / candidate / ready |

最终路线：

```text
Phase A：生成 Scenario x Skill x Evidence Matrix
Phase B：为 ready/candidate 项补 targeted regression eval
Phase C：选择 1 个低风险 skill 做 Progressive Disclosure pilot
Phase D：fresh-source eval + focused tests + changelog
Phase E：复盘真实 run，再决定是否扩大到其他 skill
```

本轮结论：50 轮审查完成后的最小可维护交付，不是立即改 skill，而是把压缩权利交给证据矩阵。

## 50 轮总收口判断

经过第 001-050 轮审查，最终判断如下：

```text
业界确实存在“精炼压缩语义”的成熟方向：
Context Engineering + Progressive Disclosure + Prompt Compression + Eval-driven Development。

但 spec-first 的第一性原理不是少 token：
而是以更少上下文保留更多决策充分性、证据纪律、边界清晰度和可验证闭环。
```

对原方案的最终校正：

- §J 的 Progressive Disclosure 方向正确，但“Core Principles = L3”需要逐项复核，新增 `behavioral_anchor` 保护类。
- H.14/I 中的执行顺序应继续维持：先 eval adequacy，再 targeted regression eval，再小规模 reference extraction pilot。
- 压缩候选必须按研发场景判断，不能只按文本类型判断。
- `reference` 不是垃圾桶；每个 reference 必须有 `trigger_condition`、`must_read`、`fallback_if_unread` 和 eval。
- 真实提升 skill 执行质量的证据不是行数下降，而是 trigger precision、boundary adherence、finding quality、debug root-cause accuracy、plan/work handoff fidelity、knowledge reuse decision impact 等 workflow-node-specific 指标。

推荐下一步唯一实施切片：

```text
交付 `Eval Adequacy Matrix for Semantic Compression`
范围先限于：spec-plan / spec-work / spec-debug / spec-code-review
每个 skill 只选 1-2 个候选
每个候选先补 protected_behavior + missing_negative_cases
满足 evidence 后再进入 Progressive Disclosure Reference Extraction Pilot
```

本报告第 001-050 轮已完成用户要求的 50 轮深度调研、审查、思考与分析。后续若进入代码/skill 修改，应另走 `$spec-plan` 或 `$spec-work`，并严格遵守 source-first、CHANGELOG、fresh-source eval 和 generated runtime mirror 不手改边界。
