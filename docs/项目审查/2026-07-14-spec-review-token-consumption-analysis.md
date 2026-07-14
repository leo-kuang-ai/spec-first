---
doc_role: review-report
authority: review-evidence
status: current
review_date: 2026-07-14
author: Codex
review_method: CodeGraph advisory orientation + current source reads + prompt asset size inventory + dispatch-path analysis + focused git history comparison + industry methodology survey (Agent Skills progressive disclosure, workflow skill design, multi-agent isolation, context management, algorithmic prompt compression) + post-implementation gap review of 001/002 landed source
relates_to:
  - docs/10-prompt/结构化项目角色契约.md
  - skills/spec-doc-review/SKILL.md
  - skills/spec-code-review/SKILL.md
  - docs/plans/2026-07-14-001-refactor-spec-doc-review-token-optimization-plan.md
  - docs/项目审查/2026-07-06-skill-prompt-精简优化方案.md
limitations: |
  1. 本报告未运行真实 Claude/Codex 端到端计费实验，token 数是基于当前 source 字符体积和 dispatch 拓扑的范围估算，不是宿主账单实测值。
  2. 当前宿主未提供历史 review run 的 input/output/cache token telemetry，无法按阶段还原既有用户运行。
  3. CodeGraph 仅作为 provider_untrusted 导航；关键结论均回源到当前 skills、references 和 git history。
  4. 本报告只分析 source-of-truth，不把 `.agents/skills/` 等 generated runtime mirror 当作修复面。
  5. §12 业界方法论调研基于公开文档与工程实践摘要，用于对照本项目杠杆；不构成对外部产品能力的保证，也不把外部案例的节省比例当作本仓库 confirmed outcome。
  6. 轨 1/2 的「已落地」仅指 source 与结构测试；语义 FSE 与 headless 行为对照在 §14 标为 open，不得当作质量/默认行为 confirmed。
---

# spec-first 文档审查与代码审查 Token 消耗分析报告

## Executive Summary

结论先行：用户反馈成立。`spec-doc-review` 和 `spec-code-review` 的高 token 消耗主要不是最终回答过长，而是多 agent 编排、共享上下文重复消费、保守 roster 和二次验证形成的运行时乘数。

- `spec-doc-review` 会让主 agent 与 2–7 个 reviewer 重复消费同一文档，并在主会话中继续加载约 77–113 KB 的合成和交互规则。
- `spec-code-review` 的 full review 默认至少 6 个 reviewer；幸存 finding 还会触发逐 finding validator，通常最多 15 个，并可能增加 repo profiler、条件 reviewer 和跨模型 adversarial pass。
- Codex reviewer prompt 已自包含 persona、schema、scope 和 diff/document；`spec-doc-review` 已声明最小继承意图（行为未验证），`spec-code-review` 仍无等价规则。若宿主默认完整继承，完整会话仍可能重复进入每个子 agent。
- skill 声明的 cheap/mid-tier 模型策略在 Codex dispatch primitive 不暴露模型选择时不能执行，所有 reviewer 会继承父模型。
- 项目当前没有 review run 级 token/cost manifest，无法回答一次具体运行的钱花在了哪个阶段。

这是结构性成本问题。优先级应是先降低 `spec-code-review` 的 validator、roster 和 diff 复制乘数，再压缩单份 prompt；仅缩短几段文案不足以解决问题。

业界侧，Agent Skills 的 progressive disclosure、workflow skill 结构纪律、多 agent 上下文隔离、上下文编辑/memory、prompt caching 与算法式 prompt compression，与本报告的固定项 / 乘数 / 辅助杠杆划分一致；详见 §12。适合本仓库的**可组合方法栈**见 §13（ProgressiveDisclosure × TopologyBudget × DeterministicFloor × MeasurementPareto + 可选 HostAccelerators）。外部案例中的节省比例仅作方向参考，不得直接当作本仓库验收数字。

**实施进度（2026-07-14 收口口径）：** 轨 1 progressive disclosure（U1–U4）结构已落地，hot_instruction@N=5 代理口径 **−48.4%**（见 baseline）；轨 2 的 doc-review 侧 roster/cost-shape/isolation/anti-waste **文案已落地**（002），语义 FSE 与 headless 对照 **未关**。主剩余 ROI 已从「再压 doc-review spine」转移到 **关质量闸 + 验证 N 降幅 + code-review 乘数**。详见 §14。

## 1. 分析范围与证据等级

### Confirmed facts

本报告确认了以下当前 source 事实（**2026-07-14 轨 1/2 后复测**）：

- `skills/spec-doc-review/SKILL.md`：257 行、约 20.8 KB（相对轨 1 前 248 行略增：纳入 roster/cost-shape/isolation 合同；热路径仍靠 STOP + lazy refs）。
- `skills/spec-code-review/SKILL.md`：837 行、约 98.8 KB（本轮未改）。
- `spec-doc-review` 有 7 个 persona，persona prompt 合计约 50.2 KB。
- `spec-code-review` 有 16 个 persona/local prompt asset，合计约 102.2 KB。
- `spec-doc-review` **默认 profile=`standard`（≤3：always-on 2 + 至多 1 条件）**；`roster:lite`=2；`roster:full` 最多 7。
- `spec-code-review` full review 默认 6 个 reviewer；条件 reviewer 可继续增加；lite 路径仍依赖 Stage 3c 命中。
- `spec-code-review` Stage 5b 按 surviving finding 派发 validator，通常上限 15，P0/P1 超限时可提高上限。
- `spec-doc-review` 已声明 **最小上下文隔离意图**（`fork_turns` / min inheritance / `degraded_inherited`）与 **Anti-waste 切片规则**；行为语义 **尚未** headless/FSE 确认。`spec-code-review` 仍无等价隔离合同。
- 当前 source 没有记录 review run 实际 input/output/cache token 的通用 telemetry；doc-review 有 **advisory `cost-shape:` 一行**（非账单）。

### Estimated facts

本文 token 范围采用英文 Markdown/JSON 常见的约 3–4 字符/token 粗估。中文、代码、模型 tokenizer、prompt caching 和工具结果都会改变实际值，因此估算只用于比较成本形状，不支持账单或节省比例的完成声明。

## 2. 当前静态资产规模

| 项目 | `spec-doc-review` | `spec-code-review` |
| --- | ---: | ---: |
| 主 `SKILL.md` | 20.8 KB / 257 行 | 98.8 KB / 837 行 |
| persona 数量 | 7 | 16 |
| persona 总文本 | 50.2 KB | 102.2 KB |
| subagent 模板 | 14.2 KB / 132 行（spine） | ~23 KB（未压 spine） |
| findings schema | 5.0 KB | 9.1 KB |
| 默认 profile reviewer | **≤3（standard）** | full 路径 6 always-on |
| 最大主要 reviewer | 7（`roster:full`） | 视条件可超过 10 |
| 二次 validator | 无 | 每 finding 一个，通常最多 15 个 |
| 跨模型复核 | 无 | adversarial 条件下额外一次 |
| 成本可见性 | advisory `cost-shape:` | 无等价一行 |

文件总量不是直接账单；真正决定消耗的是哪些内容会被多少个 agent 重复读取。

## 3. `spec-doc-review` 成本分析

### 3.1 文档与公共 contract 被重复注入

默认始终运行：

- `coherence-reviewer`
- `feasibility-reviewer`

并可能增加 product、design、security、scope 和 adversarial 五个条件 persona，最大团队为 7 个。

每个 reviewer 接收：

- 约 27.1 KB 的公共 subagent 模板；
- 约 5.0 KB 的 findings schema；
- 约 4.6–10.5 KB 的 persona prompt；
- 文档内容或统一 artifact 的 reviewer-specific section slice；
- 多轮审查时累积的 decision primer。

对于 legacy requirements/plan，当前 contract 要求向每个 reviewer 传完整文档。因此一份文档的 aggregate 消费近似为：

```text
主 agent 读取文档
+ N ×（公共模板 + schema + persona + 完整文档）
+ 主 agent 合并、修复和交互规则
```

一份 30 KB legacy 文档在 7 persona 模式下，仅文档正文就可能被主 agent 和 reviewer 合计消费约 8 次。

### 3.2 主 agent 后处理规则过重

persona 返回后，主 agent 还需要按路径加载：

| Reference | 当前体积 |
| --- | ---: |
| `synthesis-and-presentation.md` | 45.2 KB |
| `walkthrough.md` | 26.4 KB |
| `bulk-preview.md` | 9.7 KB |
| `review-output-template.md` | 11.0 KB |

其中 synthesis 单文件约为主 skill 的两倍，承载 schema 校验、anchor gate、去重、agreement promotion、矛盾处理、auto-promotion、修复路由、交互 handoff 和多轮抑制。即使只运行两个 reviewer，主 agent 仍可能消费约 77–113 KB 的静态 orchestration 文本。

### 3.3 多轮 decision primer 持续增长

第二轮开始，每个 reviewer 都会收到累计的 Applied/Skipped/Deferred/Acknowledged 决策和 evidence snippet。该机制有助于抑制重复 finding，但成本随轮数和历史 finding 数增长，并再次乘以 reviewer 数量。

### 3.4 粗略 aggregate token 区间

| 场景 | 粗略 aggregate input tokens |
| --- | ---: |
| 默认 2 reviewer、小文档 | 约 5–10 万 |
| 30 KB 文档、2 reviewer | 约 7–10 万 |
| 30 KB 文档、7 reviewer | 约 15–21 万 |

这些估算未计入宿主 system prompt、AGENTS.md、完整对话继承、工具输出和模型生成输出。

## 4. `spec-code-review` 成本分析

### 4.1 full roster 默认至少 6 个 reviewer

完整审查默认包括：

- correctness
- testing
- maintainability
- project-standards
- agent-native
- learnings

安全、性能、API、数据迁移、可靠性、adversarial、历史评论、前端竞态和 Swift/iOS 等 reviewer 会按 diff 继续增加。`learnings-researcher` 单个 prompt 约 16.5 KB，`agent-native-reviewer` 约 9.4 KB；四个结构化 always-on reviewer 还会分别携带公共 subagent template、diff-scope 和 schema。

### 4.2 lite 路径在真实 PR 中难以命中

lite roster 要求同时满足：

- executable add/delete 行数为 1–39；
- `UNCOUNTED_FILES` 为 0；
- 没有 migration、frontend、API、Swift 信号；
- 没有 auth、payment、数据 mutation、外部 API、并发、后台任务等内容风险；
- 没有任何 conditional persona 被选中。

Markdown、JSON schema、Shell、CI/config、lockfile 和未知扩展名都会成为 uncounted file，强制回到 full roster。这对以 `SKILL.md`、references、schema 和脚本为核心产品面的 spec-first 尤其不利：很小的 prose/schema 变更也常常触发至少 6 个 reviewer。

修改一行通常表现为一行删除加一行新增，`<40` add/delete 阈值实际约等于少于 20 个普通修改行。

### 4.3 传 diff 路径不等于减少总 token

大 diff 会被写入临时文件并向 reviewer 传路径，避免在 dispatch prompt 中重复内联。但 reviewer 随后仍需读取该文件，完整 diff 仍进入每个 reviewer 的模型上下文。

aggregate 成本仍近似为：

```text
主 agent × 完整 diff
+ reviewer 数量 × 完整 diff
+ validator 数量 × 完整 diff
+ 可选跨模型 reviewer × 完整 diff
```

路径 staging 降低的是传输和父 prompt 体积，不会自动降低所有模型合计消费。

### 4.4 per-finding validator 是最大乘数

只要 Stage 5 后至少一个 finding 幸存，Stage 5b 就会按 finding 派发独立 validator。validator 会再次获得 finding、完整 diff，并读取 cited file、caller、guard、middleware、framework default 或 git blame。

独立验证能降低误报，但当前粒度让第二轮成本与 finding 数近似线性增长。许多 finding 在进入 validator 前已经经历 persona evidence、cross-reviewer corroboration、fast pass、quote-the-line gate 和 confidence gate；继续对所有 surviving finding 做完整独立代码调查，边际收益没有运行数据支持。

### 4.5 reviewer 生成完整与 compact 两份表示

结构化 persona 被要求把完整 JSON 写入 run artifact，同时向主 agent 返回 compact JSON。两份表示存在字段重复。更低成本的边界是只生成一次完整 artifact，由确定性脚本做 schema 校验和 merge-tier 字段抽取；脚本只处理结构，不替代 LLM 的 finding 判断。

### 4.6 Codex 上下文继承可能形成隐藏乘数

两个 skill 都没有规定 `fork_turns` 或等价的 context isolation。专用 reviewer prompt 已包含 persona、schema、scope、intent 和 diff/document；如果 Codex 子 agent 再默认继承完整对话，它还可能重复携带：

- system/developer instructions；
- 仓库 `AGENTS.md`；
- 当前会话历史；
- 主 agent 已加载的 skill/reference 内容；
- 用户之前的长输入和工具输出。

这部分静态资产统计不可见，却可能是长会话中最大的额外成本之一，也会降低 leaf reviewer 的信噪比。

### 4.7 模型分层在 Codex 上可能退化

skill 希望 correctness/security/adversarial 继承 session model，其余 persona 使用 mid-tier。但当 Codex dispatch primitive 不暴露模型或 custom-agent selector 时，当前 contract 会退化为全部继承父模型。用户在高能力模型会话中运行 review 时，所有子 agent 都可能使用同一高成本模型。

### 4.8 粗略 aggregate token 区间

假设 full roster 6 个 reviewer、40 KB diff、5 个 finding 进入 validator：

| 阶段 | 粗略估算 |
| --- | ---: |
| 主编排 + 6 reviewer 静态 prompt | 约 8–10 万 token |
| diff 被主 agent 和 6 reviewer 消费 | 约 7–9 万 token |
| 5 个 validator | 约 6–8 万 token |
| 合计 | 约 20–27 万 token |

15 个 validator 时可能达到约 32–42 万；条件 reviewer、跨模型复核、repo profiler、完整会话继承和输出 token 尚未包含在内。

## 5. 根因优先级

### P0：运行乘数

1. `spec-code-review` per-finding validator 波次。
2. diff/document 被主 agent、reviewer 和 validator 重复消费。
3. Codex 子 agent 未明确隔离历史上下文。
4. Codex 无模型选择时，cheap/mid-tier 设计退化为父模型继承。
5. full roster 是常态，lite 路径对 mixed diff 和 prose/config 变更基本失效。

### P1：单份 prompt 体积

1. `spec-code-review/SKILL.md` 接近 100 KB，并在主编排早期加载。
2. `spec-doc-review` synthesis reference 达 45 KB。
3. 公共 subagent contract 在每个 reviewer 中重复。
4. persona 与公共模板间存在重复的 false-positive、classification 和 output 说明。

### P2：缺少成本治理

1. 没有 run 级 reviewer/validator/model/token manifest。
2. 用户执行前看不到 agent 数和模型退化状态。
3. 没有 standard profile 的 validator 预算和总 dispatch 停止条件。

## 6. 优化建议

### 6.1 第一阶段：止血

#### A. Codex dispatch 使用最小上下文继承

reviewer prompt 自包含时优先使用 `fork_turns: "none"` 或宿主等价能力；确需会话语义时，只传主 agent 生成的 2–3 行 intent summary，不继承完整历史。

#### B. validator 改为风险驱动

- P0/P1 必须独立验证。
- reviewer 冲突、anchor 75、运行时行为或跨文件推理 finding 进入 validator。
- 机械、anchor 100、可由 direct evidence 确认的 P2/P3 不派 validator。
- standard profile 默认 validator 预算建议 3–5 个。
- `depth:full` 才恢复当前全量验证。

#### C. 重构默认 code-review roster

- 默认：correctness + project-standards + 一个按 diff 选择的专业 reviewer。
- testing：行为或测试契约变化时启用。
- maintainability：复杂度、重复、公共边界或较大 diff 时启用。
- agent-native：skill/agent/workflow/harness 变更时启用。
- learnings：存在相关 durable learning 候选或历史高风险模式时启用。

#### D. 修复 lite gate 的文件类型逻辑

一个 Markdown、JSON 或配置文件不应自动触发所有 reviewer。纯 skill prose 变更应选 standards、agent-native 和必要的语义 reviewer；普通 runtime testing/reliability persona 不应仅因 lite gate fail closed 而自动运行。

### 6.2 第二阶段：减少重复上下文

#### A. reviewer-specific diff slicing

- correctness/adversarial 可以获取全 diff。
- security 获取 trust-boundary 相关文件和调用链。
- testing 获取行为变更、测试和接口切片。
- standards 获取 changed files 和适用规范路径。
- validator 只获取 cited hunk、必要 caller 和 scope facts。

脚本负责生成文件/hunk 索引和可回源路径；LLM 决定某 reviewer 需要哪些切片，保持 deterministic floor 与 semantic judgment 边界。

#### B. doc-review 按文档类型选择 roster

- requirements：coherence + product/adversarial 条件 lens。
- plan：coherence + feasibility。
- 小文档默认最多 2–3 个 reviewer。
- 当前 7 persona 深审改为明确的 full/deep opt-in。

#### C. 压缩公共 leaf contract

将 23–27 KB 公共模板收敛为最小 leaf contract，只保留 scope、persona、evidence bar、false-positive floor、output schema 和 read-only boundary。培训性示例、重复解释和 synthesis-owned 规则不应进入每个 reviewer。

#### D. 取消双份 finding 生成

reviewer 只写完整 artifact并返回 artifact path 和短状态；确定性脚本负责 schema validation 和字段抽取，不做 finding 语义裁决。

### 6.3 第三阶段：建立成本闭环

每次 review 应生成 run manifest：

```json
{
  "profile": "standard",
  "reviewer_count": 3,
  "validator_count": 2,
  "model_tiering": "degraded_inherited",
  "orchestrator_prompt_bytes": 22000,
  "shared_context_bytes": 41000,
  "reviewer_context_bytes": {},
  "diff_bytes": 38000,
  "document_bytes": 0,
  "actual_usage_available": false
}
```

宿主暴露 usage 时记录实际 `input_tokens`、`cached_input_tokens` 和 `output_tokens`；不暴露时记录 bytes、agent 数和明确的估算状态。

执行前应向用户显示一行成本形状：

```text
预计运行：3 个 reviewer，最多 2 个 validator；当前宿主不支持模型降级，子 agent 将继承父模型。
```

## 7. 建议的目标 Profile

| Profile | Doc review | Code review |
| --- | --- | --- |
| `lite` | 单 reviewer，必要时增加一个专业 lens | inline pass + correctness/standards |
| `standard` 默认 | 2 个类型相关 reviewer，条件增加至 3 | 2–4 个 reviewer，validator 预算 3 |
| `full` 显式 opt-in | 当前多 persona 深审 | 当前完整 roster、跨模型和完整验证 |

优化目标应先作为待测假设：

- `doc-review` 默认 aggregate token 目标降低 40%–65%。
- `code-review` standard 路径目标降低 50%–75%。
- `depth:full` 保留当前质量上限。
- 每次运行都能解释派发原因、实际模型层级和成本分布。

只有 paired before/after run、相同 fixture/diff、相同模型和 finding quality judge 证明这些目标成立后，才能把目标升级为 confirmed outcome。

## 8. 历史判断

最近的 CE source 迁移没有扩大两个主 skill：

- `spec-code-review/SKILL.md` 从约 134 KB 降至约 99 KB，下降约 26%。
- `spec-doc-review/SKILL.md` 从约 31 KB 降至约 20 KB，下降约 36%。

因此当前反馈不应简单归因为最近迁移造成文本回归。迁移完成了局部瘦身，但没有改变多 agent、重复上下文、保守 roster 和二次验证的运行乘数。

## 9. 最小可维护落地顺序

1. 增加 run manifest 和执行前 cost-shape 输出，建立基线。
2. 为 Codex reviewer dispatch 加最小上下文继承合同。
3. 收紧 validator 触发条件与 standard 预算。
4. 将 code-review 默认 roster 改为风险/文件类型驱动。
5. 实施 reviewer-specific diff/document slicing。
6. 压缩主 skill、subagent template 和 synthesis 热路径。
7. 用相同 fixture 做 paired quality/cost eval，再决定是否进一步合并 persona 或调整 full profile。

## 10. 进一步优化思考

### 10.1 用成本方程定位真正的优化杠杆

一次 review 的 aggregate token 可以近似拆成：

```text
T_total
= T_orchestrator
+ Σ(T_reviewer_static + T_reviewer_context + T_reviewer_output)
+ Σ(T_validator_static + T_validator_context + T_validator_output)
+ T_peer_model
```

因此优化有四类杠杆：

1. **缩小固定项**：压缩主 skill、模板、schema 和 persona。
2. **减少 fan-out**：减少默认 reviewer、validator 和外部 peer 数量。
3. **缩小共享动态上下文**：避免每个 agent 读取完整 diff/document/history。
4. **提前停止**：证据已经充分或风险很低时，不继续派发下一轮。

当前 `spec-doc-review` 优化计划主要降低第一类固定项，方向正确，但它解决的是加法成本。`spec-code-review` 的主要问题在第二至第四类乘法成本；如果 roster、完整 diff 复制和逐 finding validator 不变，即使每份 prompt 缩短 40%，大 review 仍会很贵。

优化顺序应优先看：

```text
减少一次 dispatch > 少传一份完整上下文 > 压缩单份 prompt > 缩短最终报告
```

最终报告通常只生成一次，优先压缩它的收益远低于避免 6–15 次重复读取。

### 10.2 引入语义风险预算分配器，而不是固定 roster

主 agent 在派发前生成一个 run-scoped `review_budget`：

```json
{
  "profile": "standard",
  "risk_class": "medium",
  "selected_reviewers": ["correctness", "project-standards", "security"],
  "reviewer_reasons": {},
  "full_context_reviewers": ["correctness"],
  "max_validators": 3,
  "max_rounds": 1,
  "escalation_conditions": [
    "P0_or_P1_candidate",
    "cross_reviewer_conflict",
    "cross_file_runtime_claim"
  ]
}
```

职责边界应保持清楚：

- scripts/tools 只准备可机械确认的 facts：diff bytes、文件列表、路径类型、变更行数、artifact readiness、适用 standards 路径、source hash。
- LLM 根据 intent、风险、歧义和影响面决定 reviewer、上下文切片和验证预算。
- profile 和预算约束 dispatch 出口，不用硬编码规则代替语义 reviewer 选择。

预算分配器的价值不是精准预测 token，而是让一次 review 在开始前拥有可观察、可解释的资源边界。

### 10.3 从“全员并行”改成级联审查

建议的 standard pipeline：

```text
Stage A  deterministic pre-facts
   -> Stage B  one primary semantic reviewer
      -> Stage C  risk-triggered specialists
         -> Stage D  claim-critical validation
```

具体含义：

1. Stage A 生成范围、文件、diff 索引和风险候选，不做 finding 判断。
2. Stage B 由 correctness 或 coherence 做一次全局主审，识别真实问题面和未决风险。
3. Stage C 只对主审无法充分覆盖的风险面派发 security、migration、product、adversarial 等 specialist。
4. Stage D 只验证将被外部化为高严重度或高影响 claim 的 finding。

当前流程是先假设多个 reviewer 都有必要，再依靠 synthesis 去重。级联模式把“是否需要 specialist”推迟到已有初步 evidence 后决定，可减少大量最终返回空 findings 的 agent。

风险是主审可能漏掉 specialist trigger，因此必须保留：

- deterministic high-risk surface 候选；
- P0 类安全/迁移/权限边界的直接 specialist trigger；
- `depth:full` 显式绕过级联，运行完整 roster。

### 10.4 建立 run-scoped evidence ledger，避免重复调查

每次 review 可生成一个只在当前 run 有效的 evidence ledger：

```json
{
  "head_sha": "...",
  "diff_hash": "...",
  "items": [
    {
      "evidence_id": "E-01",
      "source_ref": "src/a.js:42",
      "source_hash": "...",
      "quote": "...",
      "observed_by": ["correctness"],
      "claim_scope": ["F-03"]
    }
  ]
}
```

后续 specialist 和 validator 优先消费 evidence ID、引用行和必要邻域，不重新读取整份 diff。只有 evidence 不足以支持语义判断时，才扩大读取范围。

该 ledger 只能表示已观察事实，不能把 reviewer 结论升级成 confirmed truth。失效条件至少包括：

- `HEAD` 或 reviewed remote head 改变；
- diff hash 改变；
- cited file 内容 hash 改变；
- finding 的 claim scope 发生实质变化。

这能复用事实准备成本，同时不破坏“独立 validator 必须重新判断结论”的证据边界。

### 10.5 validator 采用严重度分层与有限批处理

完全取消 validator 会提高误报风险；保持逐 finding 全量 validator 又过于昂贵。可采用中间方案：

| Finding 类型 | 建议验证方式 |
| --- | --- |
| P0/P1、安全、权限、迁移、跨服务 contract | 每 finding 独立 validator |
| reviewer 冲突或 anchor 75 | 独立 validator，提供最小 evidence bundle |
| 同文件、同 root cause 的 P2/P3 | 按文件或 triage group 批量 validator |
| anchor 100 的机械事实 | orchestrator 直接回源验证 |
| advisory / residual risk | 不派 validator |

批量 validator 仍必须独立于原 reviewer，但可以一次验证同一文件或同一 root cause 下的多个低风险 finding，减少重复文件读取。批处理不适用于 P0/P1，因为关键 claim 需要独立、聚焦、可单独失败的验证结果。

### 10.6 输出预算也应有边界

除 input 外，persona 输出也会显著消耗 token。建议为 standard profile 设置：

- 每个 reviewer 默认最多返回 5 个 primary findings；
- evidence 默认 1–3 条，更多内容写入 artifact 或按需读取；
- `why_it_matters` 保持 2–4 句；
- residual risks/testing gaps 使用紧凑条目；
- finding 为零时只返回最小 coverage 状态。

不能使用简单的“最多 5 个问题”硬截断所有输出。P0/P1 不受普通上限限制；超过预算的低严重度候选应返回 overflow count 和主题摘要，使 orchestrator 能决定是否升级到 full profile。

### 10.7 稳定前缀和 prompt caching 只能作为辅助优化

可以把高复用的静态 contract 放在稳定前缀，动态 intent/diff/document 放在尾部，以提高支持 prompt caching 的宿主命中概率。但必须诚实区分：

- caching 可能降低 billed input 或 latency；
- caching 不减少模型需要处理的语义上下文；
- 不同 agent、模型或宿主之间未必共享 cache；
- cache miss 不得改变 review 正确性。

因此稳定前缀是宿主优化，不应成为跨宿主 workflow contract，也不能替代减少 fan-out 和上下文切片。

### 10.8 独立性应按 claim 使用，不应按角色数量计算

多 persona 的价值来自不同 failure model，而不是 agent 数量本身。需要避免两个相反的误区：

- 为省 token 把所有 lens 合并进一个 agent，却继续声称存在 cross-reviewer corroboration；
- 为获得“独立性”机械派发多个高度重叠 reviewer，最终只产生重复 finding。

建议把独立性限定在需要提升 claim 信任度的地方：

- 普通 P2/P3 finding 可以由一个主 reviewer 产生。
- 高影响 finding 才要求独立 specialist 或 validator。
- 只有不同 agent 独立读取 source 后形成的同一 finding，才参与 agreement promotion。
- 主 agent fast pass、共享 evidence ledger 和同一 agent 的多 lens 不计为独立 corroboration。

### 10.9 Profile 应是成本/质量合同，而不是语气选项

建议三个 profile 明确约束执行预算：

| 维度 | `lite` | `standard` | `full` |
| --- | ---: | ---: | ---: |
| primary reviewer | 1 | 1 | 当前完整 always-on |
| specialist | 0–1 | 0–3 | 全部适用角色 |
| validator | 仅 P0/P1 | 最多 3，P0/P1 例外 | 当前完整规则 |
| context | 强切片 | reviewer-specific | 可使用完整上下文 |
| rounds | 1 | 1，必要时升级 | 按当前 contract |
| cross-model | 无 | 仅高风险显式触发 | 当前规则 |

默认 profile 可由 LLM 根据风险推断，但运行前必须显示选择结果、agent 数、validator 上限和模型分层是否 degraded。用户可以显式要求 `depth:full`，不应为普通低风险 review 强制询问。

### 10.10 用 Pareto 评测，而不是只测 token 降幅

优化验收至少同时测量：

- aggregate input tokens；
- uncached input tokens（宿主可用时）；
- output tokens；
- reviewer/validator/tool call 数；
- wall-clock time；
- P0/P1 保留率；
- 已知 planted issue 检出率；
- false-positive rate；
- surviving actionable finding 数；
- 每个 surviving actionable finding 的 token 成本；
- reviewer disagreement 和 validator rejection 比例。

推荐最小实验矩阵：

| Arm | 目的 |
| --- | --- |
| A：当前基线 | 建立现状 |
| B：只做 prompt 分层/压缩 | 测量加法项收益 |
| C：上下文隔离 + slicing | 测量重复上下文收益 |
| D：风险 roster + validator budget | 测量乘法项收益 |
| E：B+C+D | 验证组合 Pareto 前沿 |

每个 arm 使用相同模型、相同 fixture/diff、相同宿主和相同 source snapshot。至少覆盖小型低风险、中型 mixed diff、高风险 auth/migration 三类 code review，以及短 requirements、长 implementation-ready plan 两类 doc review。模型输出存在方差时重复 3 次或使用等价的 paired fresh-source runs。

Go 条件不应只是“token 降低 50%”，而应是：在 P0/P1 和 planted issue 保留率不退化、false-positive 不显著上升的前提下，aggregate uncached token 或单位有效 finding 成本显著降低。

### 10.11 需要避免的伪优化

- **只把大文件拆成 references，但每次运行仍全部读取。** 文件结构变轻，aggregate token 不变。
- **只把 diff 写入临时路径。** 降低内联体积，但每个 agent 读取全 diff 后总消费不变。
- **只声明使用便宜模型。** 宿主不支持 model override 时不会兑现。
- **合并 reviewer 后继续计算 cross-reviewer promotion。** 这会伪造独立证据。
- **用脚本关键词直接决定语义 reviewer。** scripts 可以准备 risk candidates，最终选择仍属于 LLM judgment。
- **使用全局硬 token 截断。** 可能把 P0/P1 evidence 或验证结果截掉，应按严重度和阶段分配预算。
- **把历史 finding/evidence cache 当 confirmed truth。** 任何 source/diff freshness 变化都必须失效或回源。
- **优先压缩最终报告。** 它只生成一次，通常不是主要乘数。

### 10.12 对当前优化工作的建议边界

当前 `docs/plans/2026-07-14-001-refactor-spec-doc-review-token-optimization-plan.md` 正在推进 prompt spine、惰性 reference 和 synthesis 冷热分离。这是可独立验证的 doc-review 固定项优化，不建议在实施中途扩展成 code-review 或完整成本治理重构。

建议边界：

1. 当前计划先完成 doc-review prompt 分层并取得 paired baseline。
2. 在其 measurement artifact 中增加 reviewer 数、document bytes 和 aggregate 估算，避免只报主 prompt token。
3. 另起一个窄的 code-review multiplier reduction plan，优先处理 context isolation、roster 和 validator。
4. run manifest 可作为两个 review skill 共用的最小 contract，但先以 advisory measurement 落地，不先建设复杂中心化成本引擎。
5. 只有真实 paired evidence 证明收益后，才把新的 standard profile 或预算阈值升级为默认行为。

## 11. 验证记录

已执行：

- CodeGraph 对两个 review skill 的入口、引用、agent 和调用路径做 advisory orientation。
- 回源读取当前 `skills/spec-doc-review/**`、`skills/spec-code-review/**` 关键 source。
- 统计主 skill、reference、persona、schema 和 template 的行数/字符数。
- 检查默认 roster、lite gate、dispatch、validator、跨模型和 artifact 路径。
- 检查当前 source 是否存在 token telemetry 与 Codex context isolation 规则。
- 对比最近 CE 迁移前后的主 skill 文件体积。

未执行：

- 真实 Claude/Codex 计费运行。
- paired before/after token benchmark。
- finding quality regression eval。
- 任何 skill、CLI、schema、tests 或 generated runtime 修改。

补充执行（2026-07-14 二次补充）：

- 调研 Agent Skills progressive disclosure、workflow skill 设计纪律、多 agent 上下文隔离、上下文管理、prompt caching 与算法式 prompt compression 的公开方法论。
- 将业界方法映射到本报告 §5/§6/§10 的固定项、乘数与辅助杠杆，写入 §12；未修改 skill source 或 runtime。
- 基于角色契约与 in-flight 计划边界，推导适合 spec-first 的组合方法栈，写入 §13；仍为方法论选型，非实施完成声明。



### 11.x 2026-07-14 轨 1 收口（结构 + 基线）

- 结构实施：`ea17e970`（progressive disclosure U1–U4）。
- 签字基线：`docs/项目审查/2026-07-14-spec-doc-review-token-baseline.md`
  - hot_instruction N=5：~50407 → ~26010（**−48.4%**，chars/4 代理）
  - aggregate_no_doc：~66872 → ~42475（**−36.5%**）
- Deterministic FSE floor：PASS。语义 FSE：仍 open。
- 001 plan 状态：`artifact_readiness: verification-pending`。
- **未**将 hot_instruction 降幅表述为端到端计费账单降幅。

### 11.y 2026-07-14 轨 2 文案落地（doc-review TopologyBudget 子集）

- Plan：`docs/plans/2026-07-14-002-refactor-spec-doc-review-roster-cost-shape-plan.md`
- Source：`skills/spec-doc-review/SKILL.md` 增加
  - `roster:lite|standard|full`（默认 **standard ≤3**；`depth:*` 别名）
  - 条件 persona 优先级：security > adversarial > design > product > scope
  - dispatch 前 **advisory `cost-shape:`** 一行
  - 最小上下文隔离意图 + `degraded_inherited`
  - unified 默认切片 + **Anti-waste**（编排读全文一次，leaf 勿重复塞全文）
- 结构契约：`tests/unit/spec-doc-review-contracts.test.js` **30 passed**（含 002 四条）
- **未**完成：语义 FSE；`standard` vs `full` headless 对照；`spec-first init` 投射；端到端计费
- 标签：`structure+token baseline: confirmed; roster/cost-shape: source-landed, behavior unverified; quality: FSE pending`

### 11.z 2026-07-14 业界方法复核（补充）

- 复核 [Agent Skills](https://agentskills.io/) 三阶段 progressive disclosure（Discovery → Activation → Execution）与 [Anthropic 工程文](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) 的「filesystem + code execution 使 skill 上下文可近乎无界」论点。
- 复核「**code-as-tool** 优先于 token 生成做确定性工作」——与本仓库 DeterministicFloor 一致。
- 结论不变：对 review skill，**D 轴（拓扑/乘数）仍主导账单**；B/C 固定项优化已在 doc-review 拿到 ~一半 hot_instruction 收益，继续压 spine 的边际 ROI 低。
- 组合方法栈见 §13；实施后剩余工作见 §14。

## 12. 业界 skill prompt 压缩方法论调研

本节回答：业界如何压缩 skill / agent 的 prompt 与运行时上下文，以及这些方法如何映射到本报告已识别的杠杆。重点是**可迁移的机制**，不是外部产品的营销数字。

### 12.1 调研范围与证据边界

| 类别 | 覆盖 | 不覆盖 |
| --- | --- | --- |
| Skill 包结构 | Agent Skills 开放标准、Anthropic Skills 工程文、Trail of Bits workflow skill 设计 | 宿主私有未公开实现细节 |
| 多 agent 拓扑 | 子 agent 隔离、级联/批处理、共享 evidence 而非共享全文 | 特定框架版本的 API 兼容矩阵 |
| 运行时上下文 | context editing、memory tool、prompt caching | 各云厂商计费细则 |
| 算法压缩 | LLMLingua 类 prompt compression 研究路线 | 在本仓库内直接落地压缩模型 |

证据等级：

- **Confirmed mechanism**：公开标准/文档明确描述的加载阶段与结构约束。
- **Advisory practice**：工程社区反复出现、但效果依赖宿主与任务的经验规则。
- **Research-only**：学术/研究压缩管线；对 skill 作者通常是间接启发，不适合直接替代 contract 设计。

### 12.2 方法论总览：压缩什么、不压缩什么

业界可归纳为六条正交轴。任意“压缩 skill prompt”方案应先声明自己落在哪几条轴上，否则容易把“主文件变短”误当成“运行账单下降”。

| 轴 | 目标 | 典型手段 | 主要降低 | 对本仓库的贴合度 |
| --- | --- | --- | --- | --- |
| A. 发现层 / Index | 未激活 skill 的常驻税 | 短 `name`+`description`，description 只做路由 | 会话启动固定税 | 高：description 预算与 route audit |
| B. 激活层 / Body | 每次调用必读体积 | SKILL.md 只保留原则、路由、热路径、链接 | 主 agent 固定项 | 高：当前 doc-review 计划主战场 |
| C. 披露层 / References | 条件知识不提前注入 | `references/`、`workflows/` 一跳按需读 | 条件阶段固定项 | 高：已有 progressive disclosure 机制 |
| D. 拓扑层 / Fan-out | 重复 agent × 重复上下文 | 最小继承、切片、roster 预算、级联、批处理 | **乘数** | 最高：review 成本主因 |
| E. 运行时层 / Context hygiene | 长会话膨胀 | stale tool 清理、memory 外置、稳定前缀 caching | 长程会话与 billed cache | 中：宿主能力，不宜做成跨宿主 contract |
| F. 算法层 / Compression | 已进入窗口的文本体积 | LLMLingua 等压缩器 | 动态上下文体积 | 低–中：可研究，不优先改 skill source |

本报告 §5 的根因排序（P0 乘数 → P1 单份体积 → P2 成本治理）与业界共识一致：**先治 D，再治 B/C，A 单独审计，E/F 只作辅助。**

### 12.3 Progressive Disclosure（Agent Skills 标准）

[Agent Skills](https://agentskills.io/) 与 [Anthropic 工程文 *Equipping agents for the real world with agent skills*](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) 把 skill 加载定义为三阶段 progressive disclosure：

1. **Discovery**：启动时只预加载每个 skill 的 `name` + `description`。
2. **Activation**：任务匹配后，才把完整 `SKILL.md` 读入上下文。
3. **Execution**：按需再读 `references/`、脚本与其他资源；互斥或低频上下文应拆文件，避免同次激活全量装载。

关键设计原则：

- **技能包可以很大，但窗口只装当前需要的一层。** 文件系统 + 代码执行让 skill 内容“有效无界”，前提是 agent 不会每次都把附录读完。
- **互斥路径拆分。** 若两条 reference 几乎不会同次使用，应分文件；合并成一个大 reference 会抵消 progressive disclosure。
- **脚本既可执行也可作文档。** 确定性步骤优先 `run script`，不要把实现细节 prose 化后整段塞进 prompt。
- **从 Claude 的视角迭代。** 观察真实轨迹里是否过度依赖某些 reference，再决定下沉/上提。

对 review skill 的直接含义：

- 主 `SKILL.md` 应只保留 orchestration 热路径；synthesis 细则、示例库、深审规则下沉到惰性 reference。
- persona / leaf template 属于 Execution 层资产：只有被选中的 reviewer 才应加载对应 persona，而不是主 agent 预读全部 16 个 persona。
- **拆文件本身不是优化。** 若 contract 仍要求“每次运行读取全部 references”，只完成了轴 B 的假象，未完成轴 C。

这与 `docs/项目审查/2026-07-06-skill-prompt-精简优化方案.md` 中的 L1 Metadata / L2 Body / L3 References 分层一致；本报告额外强调：review 场景下还存在 **L4 Dispatch payload**（diff/document/history），其重复注入往往大于 L2/L3。

### 12.4 Description-as-Router 与 Index Token Tax

[Trail of Bits *Designing Workflow Skills*](https://trailofbits.com/skills/designing-workflow-skills/) 强调：

- **`description` 是唯一控制“是否激活”的字段**；body 里的 When to Use / When NOT 只在激活后约束行为。
- description 应写触发条件与排除条件，**不要把 workflow 步骤摘要塞进 description**（其 AP-20）。
- 坏 description 的代价是误触发或漏触发：误触发会把整份 L2 body 强行装进无关会话。

业界实践把这视为与 body 压缩正交的另一条税：

| 税种 | 何时支付 | 优化目标 |
| --- | --- | --- |
| Index tax | 每个会话启动，对所有已安装 skill | 压缩 description，保留 trigger/exclude 精度 |
| Body tax | skill 被激活后 | progressive disclosure + 热冷分离 |
| Fan-out tax | 每个子 agent / 每轮验证 | 隔离、切片、预算 |

可操作规则（advisory）：

1. description 用“触发意图 + 排除意图 + 一句话定位”，不为功能说明书。
2. 压缩 description 前必须有 route audit / collision 样例，否则会用漏触发换 token。
3. exclude intent 往往值得保留：误激活一整条重型 workflow，比多几十词 description 更贵。

spec-first 已有 description/route 相关工作（见 2026-07-06 方案）；本 review token 报告的主问题仍是 fan-out，但 **code-review / doc-review 的 description 过长或过宽会放大无关会话的 body tax**。

### 12.5 Workflow skill 结构纪律（行数、一跳、批处理）

Trail of Bits 与 Anthropic 共同收敛的结构纪律：

| 规则 | 机制含义 | 反模式 |
| --- | --- | --- |
| SKILL.md 控制在约 500 行 / 正文只放每次必用内容 | 限制 L2 body 上限 | 单体百科全书式 SKILL.md |
| references 一跳可达，禁止 A→B→C 链 | 降低“为找到规则而连环读文件” | reference 再指向 reference |
| 阶段编号 + 进入/退出条件 | 减少散文顺序歧义导致的重试 token | 无序散文“然后…接着…” |
| 指令具体度匹配任务脆弱度 | 脆弱步骤低自由度，判断步骤高自由度 | 对探索任务过度处方，或对迁移任务过度放权 |
| 10,000-file / 批处理测试 | 防止 N×M 工具调用与 per-item 子 agent | 每 finding 一 agent、每文件一 spawn（ToB AP-18/AP-19） |

对 `spec-code-review` 的映射尤其直接：

- Stage 5b “每 finding 一个 validator、通常最多 15”在业界属于 **unbounded fan-out 风险形态**；即使有上限，仍应按严重度批处理或预算化。
- 公共 23–27 KB leaf template 属于“每个 leaf 都重复的低信息密度合同”，应收敛为最小 contract（scope / evidence bar / schema / boundary），培训性 prose 不应进入每个 leaf。

### 12.6 多 agent 拓扑与上下文隔离

多 agent 系统的 token 账单几乎总是：

```text
T ≈ (orchestrator) + N_agents × (static_prompt + dynamic_context + output) + N_validators × (...)
```

业界在“如何降低 N 与 dynamic_context”上有较稳定的模式：

#### 12.6.1 最小上下文继承（context isolation）

- 子 agent 默认**不继承**父会话全文；只接收自包含任务包（目标、范围、schema、必要切片）。
- 需要会话语义时，传 **2–5 行 intent summary**，而不是完整 transcript。
- 这与本报告 §6.1A / §4.6 的 `fork_turns: "none"` 建议同构。

#### 12.6.2 角色分工 vs 角色堆叠

- 独立 agent 的价值来自 **不同 failure model / 不同证据路径**，不是角色数量。
- 高度重叠的 persona 并行，只会复制同一动态上下文。
- 高影响 claim 才值得独立 specialist 或 validator；普通 P2/P3 可由主 reviewer 承担。

#### 12.6.3 级联（cascade）优于全员并行

常见生产形态：

1. 便宜/窄 scope 的 triage 或 single primary pass；
2. 仅对可疑区域或高风险 claim 升级 specialist；
3. 仅对幸存高严重度 finding 做验证。

对应本报告 §10.3。级联用“提前停止”换“全量并行 completeness”，适合 standard profile。

#### 12.6.4 批处理 validator / map-reduce

- map：按文件簇、claim 簇或风险簇切分；
- reduce：主 agent 做 schema 校验后的合成，而不是再派一倍 agent 复读全文。
- **禁止**在合并 lens 后仍声称 cross-reviewer corroboration（见 §10.8）。

#### 12.6.5 共享 evidence ledger，不共享全文

- 把已确认的 source_ref / quote / 调查结论写成 run-scoped ledger；
- 后续 agent 引用 evidence_id，而不是重新 cat 同一大 diff。
- 这是 blackboard / shared memory 的轻量版，且必须带 freshness 与失效条件。

### 12.7 运行时上下文工程：editing、memory、caching

2025–2026 业界把“上下文工程”提升为与模型选择同级的产品能力。与 skill 压缩相关的三件套：

#### 12.7.1 Context editing（清理过期工具结果）

[Anthropic context management](https://www.anthropic.com/news/context-management) 描述：在接近窗口上限时自动清理过期 tool 调用/结果，同时保留对话结构。其内部评测宣称 context editing 可带来显著任务完成与 token 下降（公开材料给出约 29% 性能改进、100-turn 场景约 84% token 下降等数字）。

对本仓库：

- 有助于**长程 orchestrator 会话**，对“每个 reviewer 一上来就吃满静态 prompt + 全 diff”的 fan-out 帮助有限。
- 依赖宿主能力；不能写进跨 Claude/Codex 的 skill contract 作为唯一策略。

#### 12.7.2 Memory tool / 外置状态

把中间结论、架构笔记、调试洞察放到窗口外的文件/memory，需要时再读。与 §10.4 evidence ledger 同构：

- durable / run-scoped 状态外置；
- 窗口内只保留当前决策需要的摘要；
- 失效条件必须显式（source hash / diff hash / skill version）。

#### 12.7.3 Prompt caching（稳定前缀）

OpenAI / Anthropic 等均提供 prompt caching 或等价前缀复用：

- **稳定、高复用前缀**（系统提示、公共 leaf contract、schema）放前；
- **动态 intent / diff / document** 放后；
- 可能降低 billed input 与 latency，**不减少模型语义工作量**；
- 不同 agent 实例、模型或宿主之间未必共享 cache。

这与 §10.7 一致：caching 是宿主辅助优化，不能替代减少 fan-out。

### 12.8 算法式 Prompt Compression（研究路线）

以 Microsoft 等提出的 **LLMLingua / LongLLMLingua** 为代表，思路是：在把长 prompt 送入目标模型前，用较小模型或信息量估计**删除低信息 token**，尽量保持任务表现。

适用边界：

| 更适合 | 不适合作为第一刀 |
| --- | --- |
| 已组装的超长检索上下文、日志、历史对话 | 正在维护的 skill contract / schema / evidence bar |
| 可接受有损压缩的动态材料 | 需要精确引用的 finding anchor、法律/安全硬约束 |
| 有离线评测集可回归 | 没有 quality judge 就宣称“压了 50% 更省” |

对 spec-first 的建议：

1. **不要**对 SKILL.md、findings schema、gate 规则做黑盒有损压缩；这会破坏 Light contract 与可审查性。
2. **可以**在未来把压缩管线视为 optional provider：仅压缩 diff 切片外的辅助检索材料，并记录 `compression: advisory/lossy`。
3. 当前 ROI 低于：上下文隔离、roster 预算、validator 批处理、leaf contract 收敛。

### 12.9 Code-as-Tool：把确定性工作移出 token 路径

Anthropic Skills 文明确区分：

- **LLM 生成 token 来排序/解析** 往往比跑一段脚本更贵且更不稳；
- skill 可捆绑脚本，让 agent **执行而不把脚本与大数据读进窗口**。

映射到 review harness：

| 应由脚本/确定性层做 | 应保留给 LLM |
| --- | --- |
| schema validate、字段抽取、bytes/agent 计数 | finding 是否成立、roster 语义选择 |
| diff 索引、文件列表、hunk 定位 | 某 reviewer 需要哪些切片 |
| compact 视图生成、manifest 聚合 | severity 与产品风险判断 |
| cache key / source hash / freshness | 是否升级 full profile |

这与项目角色契约一致：**scripts enforce deterministic floor；LLM judges semantic adequacy。** 取消 reviewer 双份 finding 表示（§6.2D）正是该原则的应用。

### 12.10 与本报告杠杆的映射矩阵

| 业界方法 | 对应轴 | 映射到本报告 | 建议优先级 |
| --- | --- | --- | --- |
| Progressive disclosure（L1/L2/L3） | A/B/C | §6.2C leaf 收敛、doc-review spine、惰性 reference | P1（固定项） |
| Description-as-router + route audit | A | 降低误激活 body tax；不替代 review 乘数治理 | P2（并行小项） |
| ≤500 行 / 一跳 reference / 批处理 | B/D | code-review 主文件与 validator 预算 | P0–P1 |
| 最小上下文继承 | D | §6.1A fork isolation | **P0** |
| 级联审查 + 风险预算 | D | §10.2/§10.3、standard profile | **P0** |
| Evidence ledger / memory 外置 | D/E | §10.4 | P1 |
| Context editing | E | 长会话 orchestrator 辅助 | 宿主可选 |
| Prompt caching 稳定前缀 | E | §10.7 | 宿主可选 |
| 模型分层 / 便宜模型 triage | D | §4.7；Codex 可能 degraded | P1（宿主能力门控） |
| LLMLingua 类有损压缩 | F | 仅动态辅助材料，不做 contract 压缩 | 研究/后置 |
| Code-as-tool / 确定性抽取 | B/D | §6.2D、manifest、schema validate | P1 |

### 12.11 对 spec-first 的可采纳结论

综合业界方法与本仓库约束，建议采纳顺序如下（与 §9 一致，并补齐方法来源）：

1. **先做拓扑压缩（业界 D 轴）**
   Codex 最小继承、validator 预算与批处理、风险驱动 roster、提前停止。这是与外部多 agent 系统最一致、也最匹配当前账单形状的一刀。

2. **再做 skill 包 progressive disclosure（业界 A/B/C 轴）**
   主 spine 热路径 + 惰性 reference + 最小 leaf contract；persona 按选中加载。当前 doc-review 计划应继续，但 measurement 必须含 aggregate（reviewer 数 × 上下文），不能只报主文件行数。

3. **把确定性工作移出 prompt（业界 code-as-tool）**
   schema、compact 投影、run manifest、diff 索引由脚本完成。

4. **宿主能力当加速器，不当合同**
   caching、context editing、model override 写入 degraded/optional 说明；宿主不支持时显式声明，不伪造已执行。

5. **明确不做或后置**
   - 不对 contract/schema 做有损算法压缩；
   - 不重建第二套 skill discovery 路由引擎；
   - 不把“文件拆小但全读”或“diff 落盘但全员读全量”当成完成；
   - 不在无 quality Pareto 的情况下，用外部文章的 80%–98% 节省数字做验收。

### 12.12 参考文献（公开来源）

| 来源 | 类型 | 主要可迁移点 |
| --- | --- | --- |
| [Agent Skills 开放标准](https://agentskills.io/) | 标准 | Discovery / Activation / Execution 三阶段 |
| [Anthropic: Equipping agents for the real world with agent skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) | 工程文 | progressive disclosure、互斥 reference 拆分、code-as-tool |
| [Trail of Bits: Designing Workflow Skills](https://trailofbits.com/skills/designing-workflow-skills/) | 工程规范 | description 路由、≤500 行、一跳 reference、批处理子 agent、指令自由度匹配 |
| [Anthropic: Context management](https://www.anthropic.com/news/context-management) | 产品能力 | context editing、memory tool、长程会话 token 治理 |
| LLMLingua / LongLLMLingua（Microsoft Research 等） | 研究 | 有损 prompt compression；适合动态上下文，不适合替换 skill contract |
| 本仓库 `docs/项目审查/2026-07-06-skill-prompt-精简优化方案.md` | 内部 | L1/L2/L3 分层、description token tax、与 progressive disclosure 的落地差距 |

### 12.13 一句话收束

业界压缩 skill prompt 的成熟做法，本质上不是“把 Markdown 写短”，而是：

```text
只让该加载的层级进入窗口（progressive disclosure）
× 只派该派的 agent 并只给该给的切片（topology + isolation）
× 能确定性做的不做生成式（code-as-tool）
+ 宿主缓存/清理能力作为加速器（caching / context editing）
```

这与本报告从第一天就给出的结论同构：**先降乘数，再压固定项；用 Pareto 质量评测，而不是只报主 prompt 行数。**

### 12.14 适合 spec-first 的组合方法：七层上下文治理模型

结合 Agent Skills progressive disclosure、context engineering、routing、code-as-tool、prompt caching 和本仓库的 source/evidence 边界，建议把 review skill 的 prompt 优化固化为七层组合方法：

```text
L0  Metadata Routing
L1  Contract Spine
L2  Risk-Based Activation
L3  Just-in-Time References
L4  Reviewer-Specific Context Slicing
L5  Evidence And History Compaction
L6  Cache-Friendly Runtime Layout
L7  Paired Quality/Cost Evaluation
```

| 层级 | 目标 | spec-first 落地方式 | 主要优化对象 |
| --- | --- | --- | --- |
| **L0 Metadata Routing** | 未激活时只支付最小 discovery tax | `name`/`description` 只表达“做什么、何时进入”，用 trigger eval 防误激活 | 全局常驻 token、误路由成本 |
| **L1 Contract Spine** | 激活后只加载会改变决策的承重合同 | `SKILL.md` 保留 goals、boundaries、热路径、STOP/exit、source/runtime、evidence 与 mutation 规则 | 主 orchestrator 固定项 |
| **L2 Risk-Based Activation** | 只派当前任务真正需要的 agent | LLM 基于 deterministic pre-facts 生成 roster、validator、round 和 model-tier budget；`depth:full` 显式恢复完整深审 | reviewer/validator fan-out 乘数 |
| **L3 Just-in-Time References** | 低频、互斥、条件知识不提前进入窗口 | reference 一跳可达；只在对应阶段/信号触发时读；scripts 直接执行，不把实现 prose 全量注入 | 条件固定项 |
| **L4 Reviewer-Specific Context Slicing** | 避免所有 reviewer 消费完整 document/diff | 工具准备 file/hunk/section index；LLM 为 persona 选择最小切片；只有 correctness/adversarial 等必要角色读取全局上下文 | 动态上下文乘数 |
| **L5 Evidence And History Compaction** | 复用事实而不复用未经验证的结论 | run-scoped evidence ledger、decision fingerprint、source/diff hash、artifact path、tool-result clearing；变更即失效并回源 | 多轮历史、重复调查、返回体积 |
| **L6 Cache-Friendly Runtime Layout** | 利用宿主缓存降低 billed input 与 latency | 稳定 contract/schema/persona 前置，动态 intent/diff/document 后置；记录 cache hit/degraded，不把缓存当正确性依赖 | 宿主计费与延迟辅助项 |
| **L7 Paired Quality/Cost Evaluation** | 防止“token 下降但 finding 质量下降” | 同模型、同 source snapshot、同 fixture/diff 做 before/after；同时测 uncached token、P0/P1 保留率、误报率和单位有效 finding 成本 | 默认行为 promotion gate |

#### 对 `spec-doc-review` 的组合

```text
L0 精确识别 requirements/plan critique
→ L1 当前 spine/冷热分离
→ L2 requirements 与 plan 使用不同默认 roster
→ L3 persona 细节与冷 synthesis 按信号加载
→ L4 legacy 文档也按 reviewer 目标切片
→ L5 decision primer 改为 fingerprint/evidence ledger
→ L6 稳定 schema/leaf contract 前置
→ L7 短 requirements + 长 unified plan paired eval
```

当前已实施的 spine/reference 重构主要覆盖 L1/L3；下一步最大收益来自 L2、L4 和 L5，而不是继续无限拆小 Markdown 文件。

#### 对 `spec-code-review` 的组合

```text
L0 区分普通 review、deep review 与 machine handoff
→ L1 缩短近 100 KB 主 skill，只保留 stage spine
→ L2 默认 primary reviewer + 风险 specialist，validator 有预算
→ L3 remote scope、cross-model、migration 等条件协议惰性加载
→ L4 persona-specific diff/hunk/call-path bundle
→ L5 evidence ledger + validator 最小证据包 + artifact 单一表示
→ L6 公共 schema/persona 稳定前缀
→ L7 small / mixed / auth-migration 三档 paired eval
```

`spec-code-review` 应先做 L2/L4/L5，因为当前主要成本是 `agent 数 × 完整 diff × validator 数`；只做 L1/L3 会改善但不足以改变大 review 的账单形状。

#### 推荐实施顺序

| Wave | 建议动作 | 原因 |
| --- | --- | --- |
| Wave 0 | 建立 aggregate baseline/run manifest（L7 的 measurement floor） | 没有分阶段数据就无法确认哪类优化真实生效 |
| Wave 1 | 完成 doc-review L1/L3，并测量实际加载 reference | 当前工作已在进行，先独立收口，不扩大 scope |
| Wave 2 | code-review L2：risk roster、validator budget、提前停止 | 直接降低最大乘数 |
| Wave 3 | 两个 skill 的 L4/L5：切片、evidence ledger、历史压缩 | 降低每个 agent 的动态上下文与重复调查 |
| Wave 4 | L1 继续瘦身、L6 cache-friendly layout | 在乘数受控后继续降低固定成本与账单 |
| Wave 5 | 用 L7 paired evidence 决定 standard profile 是否 promotion | 只有质量/成本 Pareto 改善才改变默认行为 |

#### 组合方法的成功标准

该方法不是追求最短 prompt，而是提高：

```text
decision sufficiency per token
= 能支持正确 reviewer/判断/验证决策的高信号上下文
  ÷ aggregate uncached token
```

成功必须同时满足：

1. aggregate uncached input 或单位有效 finding 成本下降；
2. P0/P1、关键 requirement 和 planted issue 保留率不退化；
3. false-positive、validator rejection 或用户决策负担不显著上升；
4. 无宿主能力时能够 loud degradation，而不是伪造 model tier/cache/context isolation 已执行；
5. 所有优化保持 source-first、可回源 evidence 和 scripts/LLM authority 边界。

## 13. 适合 spec-first 的组合方法

本节在 §12 六轴方法论之上做**项目特化选型**：不是“业界方法全开”，而是在 Light contract、多宿主 degraded、脚本地板 / LLM 语义判断、角色独立性、以及当前 in-flight 计划边界下，选出可组合、可验证、可维护的一包。

### 13.1 选型约束（决定能组合什么）

| 约束 | 含义 | 对方法组合的影响 |
| --- | --- | --- |
| Light contract | 只保留改变决策的 durable invariants；追求 decision sufficiency per token | 禁止把百科式 prose 当合同；允许高自由度判断步骤 |
| Explicit boundaries | source / runtime / host / artifact 边界清晰 | caching、model override、context editing 只能是 host-optional，不能伪造成跨宿主硬能力 |
| Scripts floor / LLM judgment | 确定性校验与事实准备归脚本；语义充分性归 LLM | 优先 code-as-tool；禁止脚本做 roster 语义裁决；禁止 LLM 伪造 usage |
| Gate the exits | 硬 gate 只守 mutation / verification claim / source-runtime / handoff / knowledge | 不把“token 预算”做成僵死状态机；profile 与预算是合同，不是推理锁 |
| 多宿主无 feature parity | Claude / Codex / Cursor / Kiro / Qoder 能力不等价 | 组合必须以 **semantic fidelity + degraded 标注** 工作，而不是假设 Codex 有 Claude 的 model routing |
| 角色独立性有语义价值 | cross-reviewer corroboration 依赖独立 agent | 不能为省 token 合并 lens 后仍声称独立印证 |
| 已验证样板 | `spec-plan` 的 spine + 惰性 reference + contract test | B/C 轴优先复用已有模式，不发明第二套 progressive disclosure |
| In-flight 边界 | doc-review 计划明确不做角色合并 / schema 改 / 全量对抗收紧 | 组合落地必须**分轨**：固定项轨 vs 乘数轨，互不绑架 |

### 13.2 推荐组合（一句话公式）

```text
SpecFirstTokenStack =
    ProgressiveDisclosure(A/B/C)          // 包结构：该加载才加载
  × TopologyBudget(D)                     // 运行拓扑：该派才派、该给才给
  × DeterministicFloor                    // 脚本地板：schema/manifest/index/compact
  × MeasurementPareto                     // 验收：aggregate cost × finding quality
  + HostAccelerators(optional, degraded)  // cache / model tier / context edit
  − Forbidden                             // 有损压 contract、假独立、重建 discovery
```

这不是六个并列 feature，而是**乘积关系**：

- 只做 progressive disclosure → 主文件变短，review 账单可能几乎不动（fan-out 仍在）。
- 只做 topology → 省乘数，但 leaf 仍 23–27 KB 时单位 agent 仍然贵。
- 没有 measurement → 无法区分“真省”与“假拆分”，也不能守 quality floor。
- 没有 deterministic floor → 双份 finding、手写 compact、伪 usage 会吞掉收益。

### 13.3 组合内各模块：职责、机制、不做边界

#### 模块 1：Progressive Disclosure（A/B/C）— 固定项压缩的标准件

| 层 | 拥有方 | 机制 | 成功判据 |
| --- | --- | --- | --- |
| A Index | skill frontmatter | description = trigger + exclude + 定位；route audit 护召回 | 误触发下降且 index tokens 可控 |
| B Body | `SKILL.md` spine | 原则 / 阶段 / STOP 锚点 / 链接；约 ≤500 行纪律 | 每次激活必读体积下降 |
| C References | `references/` 一跳 | 冷路径、示例、深审规则按需；**禁止 reference 链** | 未触发路径不进入窗口 |
| L4 Dispatch payload | orchestrator 组装 | persona / schema / leaf / 文档或 diff 切片按选中加载 | 主 agent 不预读全部 persona |

**适合 skill 类型：** 全部；单 agent workflow（plan/work/debug）以本模块为主收益。

**spec-first 特化：**

- 直接复用 `spec-plan` 已验证模式；doc-review 当前 plan 就是本模块落地。
- **不自建 L0 skill discovery**（宿主已有）；`using-spec-first` 保持语义地图，不是第二路由真源。
- 拆文件必须配套“默认不读”合同；否则只完成目录整洁。

#### 模块 2：TopologyBudget（D）— review 场景的主收益

| 子机制 | 作用 | 硬约束 |
| --- | --- | --- |
| 最小上下文继承 | 子 agent 不继承父全文；自包含任务包 | reviewer prompt 已自包含时默认 `fork_turns: none` 或等价 |
| Profile 合同 | `lite` / `standard` / `full` 绑定 agent 数、validator 预算、上下文策略 | 默认 standard；full 显式 opt-in；运行前显示 cost-shape |
| 风险驱动 roster | always-on 最小化 + 条件 specialist | 脚本可产出 risk candidates；**最终 roster 仍 LLM 判断** |
| 级联升级 | primary → 可疑区 specialist → 高严重度 validate | 证据充分即停；禁止为 completeness 默认全开 |
| Validator 批处理/预算 | 按严重度与冲突触发；standard 上限（如 3–5） | P0/P1 可例外；禁止默认 per-finding 无预算 fan-out |
| 切片上下文 | reviewer-specific diff/document slice | 路径可回源；禁止“落盘全读”伪优化 |
| Claim 级独立性 | 高影响 claim 才要求独立印证 | 合并 multi-lens 后不得计 cross-reviewer agreement |

**适合 skill 类型：** `spec-doc-review`、`spec-code-review` 及任何 multi-agent fan-out skill。

**spec-first 特化：**

- 这是与角色契约最对齐的一刀：不锁推理，只锁**出口预算与副作用规模**。
- 保护“独立角色”语义：省 token 靠**少派与少给**，不靠**假合并**。
- Codex 无 model override 时，模型分层必须 `degraded_inherited`，不得假装已用 cheap reviewer。

#### 模块 3：DeterministicFloor — 把可确定工作移出生成路径

| 脚本/确定性层 | LLM 层 |
| --- | --- |
| findings schema validate、字段抽取 | finding 是否成立、severity |
| run manifest（bytes、agent 数、profile、degraded 标记） | roster 语义选择、是否升级 full |
| diff/document 索引与 hunk 定位 | 某角色需要哪些 slice |
| compact 投影、hash/freshness | 合成裁决、用户交互 |

**适合：** 全仓库 harness 模式，不限 review。

**spec-first 特化：** 与“scripts enforce floor / LLM judges adequacy”同构；取消双份 finding 表示、用 artifact path + 短状态返回，属于本模块而不是“文案压缩”。

#### 模块 4：MeasurementPareto — 组合能否上默认的唯一闸门

最小测量面（与 §10.10 对齐）：

- **成本：** aggregate input（及 uncached，若宿主可得）、output、agent/tool 数、wall-clock（可选）
- **质量：** P0/P1 保留率、planted issue 检出、false-positive、单位有效 finding 成本
- **结构：** profile、roster、validator 数、model_tiering 状态、context isolation 是否生效

实验臂建议保持正交，避免一次改太多无法归因：

| Arm | 打开的模块 | 目的 |
| --- | --- | --- |
| A 基线 | 无 | 现状 |
| B | 仅 ProgressiveDisclosure | 固定项收益 |
| C | 仅 Topology 隔离+切片 | 重复上下文收益 |
| D | 仅 Topology roster+validator 预算 | 乘数收益 |
| E | B+C+D + Floor + Measure | 目标组合前沿 |

**Go 条件：** 质量不退化前提下，aggregate（优先 uncached）或单位有效 finding 成本显著下降；**不是**“主 SKILL.md 行数 −40%”。

#### 模块 5：HostAccelerators — 加速器，不是真源

| 能力 | 何时启用 | 写入 skill 的方式 |
| --- | --- | --- |
| 稳定前缀 + prompt caching | 宿主支持且 leaf contract 已稳定 | “宜把静态合同置前”；不承诺命中 |
| model tiering | 宿主暴露 model/effort 选择 | 策略表 + `degraded` 回退 |
| context editing / memory | 长程 orchestrator 会话 | 可选 hygiene；不替代切片与预算 |

### 13.4 明确不进入组合（或后置）的方法

| 方法 | 处置 | 原因 |
| --- | --- | --- |
| LLMLingua 等有损压 contract/schema | **不做**（可后置于动态检索料） | 破坏可审查合同与 evidence 精确性 |
| 重建全局 skill discovery / 第二路由引擎 | **不做** | 宿主能力；违反“不重建商品化 primitive” |
| 合并 persona 仍算 cross-reviewer agreement | **禁止** | 伪造独立性，污染 knowledge/verification 出口 |
| 全局硬 token 截断 | **禁止作为默认** | 可能截掉 P0 evidence；与 gate-the-exits 冲突 |
| 只拆文件 / 只落盘 diff | **伪优化** | 不改变 aggregate |
| 中心化成本引擎 / 刚性状态机 path | **不做** | 违反系统边界；measurement 用轻量 manifest 即可 |
| 一次改完所有 skill 的 description | **后置小轨** | 需 route audit；且不解决 review fan-out |

### 13.5 按 skill 类别的组合配方

不是每个 skill 都吃同一副药。

| Skill 类别 | 主导模块 | 次要模块 | 典型目标 |
| --- | --- | --- | --- |
| 单 agent 编排（`spec-plan` / `spec-work` / `spec-debug`） | ProgressiveDisclosure | DeterministicFloor、Index hygiene | 降 body tax；阶段冷热分离 |
| 多 agent 审查（doc/code review） | **TopologyBudget** | ProgressiveDisclosure（leaf/spine）、Floor、Measure | 降 fan-out × 共享上下文 |
| 入口治理（`using-spec-first`） | 保持薄路由地图 | 不扩成执行手册 | 降误路由导致的整包 body 误加载 |
| 全库 index | Description-as-router + route audit | 不碰 L0 宿主 discovery | 降会话启动常驻税 |
| 生成/验证脚本链 | DeterministicFloor | 少量 LLM 判断点 | 把检查移出 token 路径 |

### 13.6 分轨落地顺序（与当前工作对齐）

```text
轨 0  Measurement floor
      doc-review: cost-shape 一行 [source landed / behavior unverified]
      code-review: 仍缺等价一行
      │
      ├─轨 1  ProgressiveDisclosure（doc-review）
      │       U1–U4 结构 done @ ea17e970；baseline −48.4% hot_instruction
      │       关闭闸：语义 FSE open → 001 = verification-pending
      │       推广 code-review spine/leaf：后置，勿抢乘数主战场
      │
      └─轨 2  TopologyBudget
              doc-review 子集: roster/isolation/slice/anti-waste [source landed]
              code-review 主战场（另起窄 plan，未开工）:
                isolation → validator budget → risk roster → slicing
              │
              └─轨 3  HostAccelerators + Index hygiene       [并行小项 / degraded]
```

规则（**实施后修订**）：

1. **轨 1 结构已完成；不要再为“行数更好看”改 spine 硬约束。** 001 剩余只关 FSE，禁止继续压 template/SKILL 行数目标。
2. **轨 2 doc-review 文案已落地，下一步是行为验证，不是再写第三版 roster 文案。** code-review 乘数另起窄 plan，第一刀 isolation + validator。
3. **任一轨升默认行为前必须过 MeasurementPareto。** 假设降幅保持 aspirational，直到 paired evidence（含 headless standard vs full）。
4. **Index hygiene（A）可并行**，但单独成小单元，带 route audit；不阻塞 FSE / code-review 乘数。
5. **归因隔离：** 001 的 hot_instruction 收益与 002 的 N 降幅分开报告；禁止合并成「一次优化 −X% 账单」。

### 13.7 推荐“默认组合配置”草案（待测，非 confirmed）

面向用户的默认体验（standard profile）建议锁定为：

| 维度 | `spec-doc-review` standard | `spec-code-review` standard |
| --- | --- | --- |
| Progressive disclosure | spine + 惰性 synthesis/persona detail | spine + 最小 leaf + 按需 persona |
| Primary reviewers | 2 个类型相关（如 coherence+feasibility） | correctness + standards + ≤1–2 specialist |
| Validator | 无（doc） | 预算 3；P0/P1 与冲突优先 |
| Context | 文档可切片时切片；legacy 全量需标注代价 | reviewer-specific diff slice；validator 仅 cited hunk |
| Isolation | 子 agent 最小继承 | 同左 |
| Full profile | 显式 `depth:full` | 显式 `depth:full`（含跨模型等） |
| Host accelerators | 能用则用，不能用则 degraded 声明 | 同左 |

该表原为 **待测合同草案**。截至 2026-07-14：

- `spec-doc-review` 行：**source 已按此方向落地**（默认 standard ≤3 + cost-shape + isolation 意图），但 **行为/质量未验证**（headless 对照 + FSE pending）。
- `spec-code-review` 行：**仍为草案**，未改 source。

在语义验证通过前，不得把 standard 默认写成 confirmed user outcome。

### 13.8 决策树：遇到具体优化请求时怎么选组合

```text
这次要优化的是什么？
│
├─ “主 SKILL.md 太长 / 合成规则太长”
│     → 模块 1 ProgressiveDisclosure（+ 模块 3 抽确定性）
│
├─ “一次 review 很贵 / 子 agent 很多 / validator 爆炸”
│     → 模块 2 TopologyBudget 为主（+ 模块 4 测量）
│
├─ “所有会话都变慢 / 装了很多 skill”
│     → 模块 1 的 A 轴（description/route audit），不是压 review body
│
├─ “长对话后期质量掉 / 工具结果堆满”
│     → 模块 5 context editing/memory（宿主可选）+ 外置 evidence ledger
│
└─ “想上压缩模型 / 自动删 token”
      → 默认拒绝作用于 contract；仅评估动态检索料，且要有 quality 回归
```

### 13.9 组合成功的反脆弱检查清单

落地任一 PR / plan 前自问：

1. 改的是 **固定项、乘数、还是测量**？能否单独归因？
2. 是否引入了“拆文件但仍全读”或“落盘但仍全读”？
3. 角色独立性语义是否仍诚实？
4. 宿主缺能力时是否有 **loud degraded**，而非静默当成功？
5. 脚本是否越权做了语义 roster/finding 裁决？
6. 验收是否同时看 **aggregate cost 与 finding quality**？
7. 是否把 in-flight 的 doc-review 固定项计划绑架进了 code-review 乘数重构？

任一项为否，组合未闭合。

### 13.10 结论

适合 spec-first 的不是“某一个压缩技巧”，而是一个**有所有权边界的乘积栈**：

- **结构层**用业界 Agent Skills progressive disclosure（已部分落地，继续推广）；
- **运行层**用 topology budget（review 的真正主菜，尚需窄 plan）；
- **地板层**用确定性脚本与轻量 manifest（符合角色契约）；
- **宿主层**只作加速器；
- **禁止层**明确拒绝有损 contract 压缩、假独立、第二 discovery。

若只能记一条：

> **单 agent skill 先披露（B/C），多 agent skill 先拓扑（D）；两者都要用测量守质量，都要把确定性工作踢出 prompt。**


## 14. 实施后审查：第一性原理 + 80/20 剩余工作

本节回答：轨 1 结构 + 轨 2 doc-review 文案**已经开发完成后**，还该不该继续改、改哪里、按什么顺序。它不是新方法论，而是把 §5/§10/§12/§13 的杠杆**对着当前磁盘状态**再筛一遍。

### 14.1 第一性原理（成本从哪来）

一次 review 的 aggregate 近似：

```text
T ≈ T_orchestrator(skill+synth+history)
  + N × (T_leaf_static + T_doc_or_diff_slice + T_parent_inherit + T_output)
  + V × (T_validator_static + T_cited_hunk)     # code-review only
  + T_peer_model                                 # code-review optional
```

| 因子 | 当前 doc-review 状态 | 当前 code-review 状态 | 杠杆类型 |
| --- | --- | --- | --- |
| 固定指令体积 | 已压：hot_instruction@N=5 **−48.4%** | SKILL 仍 ~99 KB，未做 spine | 固定项 B/C |
| N（reviewer 数） | 默认 ≤3 已写入；**行为未验证** | 默认 full ≥6；lite 难命中 | **乘数 D** |
| 文档/diff 复制 | Anti-waste + unified 切片已写；**未验证** | 多 reviewer 仍易吃全量/大 diff | **乘数 D** |
| 父上下文继承 | 意图已写；宿主缺能力则 degraded | **无合同** | **乘数 D** |
| V（validator） | 无 | 通常 ≤15，**最大账单项** | **乘数 D** |
| 测量 | cost-shape 一行 + baseline JSON | **无** | 治理 P2 |
| 质量闸 | 结构 30 tests + det-floor PASS；**语义 FSE open** | 无本轮对照 | 验收 |

**第一性原理结论：** 再压 doc-review 文案行数，不能显著改变 `N × (doc + inherit)`；code-review 的 `N × diff + V × validator` 仍是仓库级最大未动刀口。

### 14.2 80/20：已吃掉的 20% 努力 / 剩余 80% 收益

| 已完成（~20% 努力，doc-review 固定项侧） | 证据 |
| --- | --- |
| Progressive disclosure U1–U4 | `ea17e970`；baseline |
| 结构契约守护 | 30 unit tests passed |
| Roster budget + cost-shape 文案 | SKILL.md 002 |
| Isolation / anti-waste 意图 | SKILL.md 002 |

| 未完成（~80% 剩余用户可感知 ROI） | 为什么是 80 |
| --- | --- |
| **语义 FSE 关 001** | 没有它，−48% 只是体积代理，不能升默认宣称 |
| **standard vs full 行为对照** | 没有它，N≤3 可能是死文案 |
| **code-review validator 预算 + isolation** | 单次 run 常比 doc-review 更贵一个数量级 |
| **code-review roster 右化** | lite 难命中 → 默认 6 常驻 |
| **可选：schema×N 瘦身 / primer 上限** | 仅在 N 与 isolation 之后，边际收益次之 |

### 14.3 明确停止做的事（反伪优化）

1. **不要**再把 `subagent-template` / `SKILL.md` 往「~80/~160 行」硬压——已降为 aspirational；硬约束优先。
2. **不要**合并角色或改 finding schema 来「省 token」——独立性是质量信号，不是装饰。
3. **不要**对 contract/schema/safety 做 LLMLingua 类有损压缩。
4. **不要**把 chars/4 或 hot_instruction 降幅写成端到端账单。
5. **不要**在 001 FSE 未关前继续改 spine，导致归因污染。
6. **不要**把手改 `.claude/` / `.agents/skills/` 当修复面；需要 runtime 用 `spec-first init`。
7. **不要**把 code-review 乘数重构塞进 doc-review 002 的尾巴。

### 14.4 适合 spec-first 的方法组合（当前应采用的配方）

与 §13 一致，实施后的**执行配方**收紧为：

```text
现在（本周可关闭）
  ProgressiveDisclosure(doc-review) ──已结构完成──→ MeasurementPareto(语义 FSE)
  TopologyBudget(doc-review: N+isolation+slice) ──已文案──→ 行为对照(standard vs full)

下一刀（另起 plan）
  TopologyBudget(code-review): isolation → validator cap → roster right-size
  + cost-shape 一行（与 doc-review 同形，advisory）

并行小项
  Index hygiene / description route audit（不阻塞上两项）
  HostAccelerators（caching/editing）仅 degraded 声明，不写入跨宿主硬依赖

后置
  U5 primer 上限、schema×N 字段瘦身、算法压缩、第二 discovery
```

一句话：**关闸 → 验证 N → 砍 code-review 乘数；其余全部后置。**

### 14.5 方案内容审查（相对最新 source）

| 方案点 | 状态 | 审查意见 |
| --- | --- | --- |
| Spine + STOP + lazy refs | **结构 done** | 正确复用 spec-plan 模式；勿再迭代行数 |
| hot_instruction −48.4% | **代理 confirmed** | 可对外讲指令热路径；不可讲账单 |
| aggregate_no_doc −36.5% | **代理 confirmed** | persona/schema×N 未动属预期 |
| roster standard ≤3 | **source done** | 默认正确；需 escape hatch 与 priority 的 FSE/headless 证据 |
| cost-shape | **source done** | advisory 正确；勿升级为硬 gate |
| isolation | **意图 done** | 缺宿主 primitive 时必须 loud `degraded_inherited`；需真实 spawn 抽检 |
| Anti-waste 切片 | **source done** | 最大风险是「拆了仍全读」；headless 时查 leaf prompt |
| 语义 FSE | **open** | **001 唯一关闭闸** |
| code-review 侧 | **未开工** | 仍是 P0 乘数主战场 |

### 14.6 接下来要继续处理的事情（有序列表）

> 按依赖排序；完成前一项再开下一项。括号内是产出物 / 完成判据。

1. **（可选）提交当前 dirty source**
   - 范围：`skills/spec-doc-review/**`、contracts tests、001/002 plans、baseline、本分析报告、CHANGELOG、companion 方法论文档。
   - 禁止提交 generated runtime；需要时另跑 `spec-first init`。
   - 判据：`git status` 干净或仅剩有意 untracked。

2. **跑语义最小 FSE，关闭 001**
   - 协议：`.spec-first/audits/fse-doc-review-optimization/STATUS.md`
   - 最小集：coherence × 1 fixture × 3 before/after；可选 synthesis smoke 一次。
   - 产出：`after/run-*/**/findings.json` + scoring；勾选 001 DoD / 改 `artifact_readiness`。
   - 失败则回填 confidence/why_it_matters detail，**不**继续压 spine。

3. **002 行为验证：同一文档 `roster:standard` vs `roster:full` headless**
   - 核对：cost-shape 的 `N`、`skipped_conditional`、`isolation`、`slices`；finding 覆盖差是否可解释。
   - 产出：短笔记写入 002 plan 或 baseline §7 实测（非 chars 粗算）。
   - 通过后才可把「默认 standard 省 token」从 aspirational 升为有行为证据的 claim（仍非计费账单）。

4. **用户侧投射 runtime**
   - `spec-first init`（或等价 host init），确保宿主读到 001+002 source。
   - 判据：doctor 无 drift；**禁止**手改 `.agents/skills` 等 mirror。

5. **另起窄 plan：`spec-code-review` 乘数治理（003 建议）**
   - 范围仅：
     a. 子 agent 最小继承 / `degraded_inherited`
     b. validator 预算（如默认 3，P0/P1 优先；批处理可选）
     c. cost-shape 一行（与 doc-review 同形）
     d. 可选：always-on roster 右化（不碰 finding schema）
   - 明确 non-goals：本 plan 不做大段 progressive disclosure 文案搬家（可列为 004）。
   - 验收：paired 代理体积或 headless N/V 对照 + 质量抽样。

6. **（后置）doc-review 边际项**
   - U5 decision primer 上限（需多轮膨胀数据）。
   - schema×N：leaf 只带 compact schema / 脚本抽 full（DeterministicFloor）。
   - walkthrough/bulk-preview 再确认「dispatch 前绝不加载」。

7. **（后置 / 并行小项）全库 Index hygiene**
   - description 路由审计；未激活 skill 的常驻税。
   - 不阻塞 2–5。

8. **（明确不做 / research-only）**
   - 有损 prompt compression 作用在 contract。
   - 中心化成本引擎 / 硬状态机 roster。
   - 用缓存命中率替代正确性。

### 14.7 本轮对用户问题的直接回答

| 问题 | 回答 |
| --- | --- |
| 业界有哪些压缩 skill prompt 的方法？ | 六轴：Index / Body / References / Topology / Runtime hygiene / Algorithmic compression；详 §12。 |
| 适合 spec-first 的组合？ | ProgressiveDisclosure × TopologyBudget × DeterministicFloor × MeasurementPareto + 可选 HostAccelerators；禁有损 contract 压缩；详 §13 + companion 方法论。 |
| 最新方案审到哪？ | doc-review 轨1结构 done + 轨2文案 done；质量闸与行为验证 open；code-review 未动。 |
| 还有什么要优化？ | **先关 FSE 与 standard 行为验证，再砍 code-review 的 isolation+validator**；停止压 spine 行数。 |
| 下一步清单？ | 见 §14.6 第 1–5 项（提交 → FSE → headless 对照 → init → code-review 窄 plan）。 |
