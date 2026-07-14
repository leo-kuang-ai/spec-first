---
doc_role: review-report
authority: review-evidence
status: current
review_date: 2026-07-14
author: Codex
review_method: CodeGraph advisory orientation + current source reads + prompt asset size inventory + dispatch-path analysis + focused git history comparison
relates_to:
  - docs/10-prompt/结构化项目角色契约.md
  - skills/spec-doc-review/SKILL.md
  - skills/spec-code-review/SKILL.md
  - docs/plans/2026-07-14-001-refactor-spec-doc-review-token-optimization-plan.md
limitations: |
  1. 本报告未运行真实 Claude/Codex 端到端计费实验，token 数是基于当前 source 字符体积和 dispatch 拓扑的范围估算，不是宿主账单实测值。
  2. 当前宿主未提供历史 review run 的 input/output/cache token telemetry，无法按阶段还原既有用户运行。
  3. CodeGraph 仅作为 provider_untrusted 导航；关键结论均回源到当前 skills、references 和 git history。
  4. 本报告只分析 source-of-truth，不把 `.agents/skills/` 等 generated runtime mirror 当作修复面。
---

# spec-first 文档审查与代码审查 Token 消耗分析报告

## Executive Summary

结论先行：用户反馈成立。`spec-doc-review` 和 `spec-code-review` 的高 token 消耗主要不是最终回答过长，而是多 agent 编排、共享上下文重复消费、保守 roster 和二次验证形成的运行时乘数。

- `spec-doc-review` 会让主 agent 与 2–7 个 reviewer 重复消费同一文档，并在主会话中继续加载约 77–113 KB 的合成和交互规则。
- `spec-code-review` 的 full review 默认至少 6 个 reviewer；幸存 finding 还会触发逐 finding validator，通常最多 15 个，并可能增加 repo profiler、条件 reviewer 和跨模型 adversarial pass。
- Codex reviewer prompt 已自包含 persona、schema、scope 和 diff/document，但两个 skill 都未规定最小对话继承；若 `spawn_agent` 使用默认完整继承，完整会话和专用 reviewer prompt 会重复进入每个子 agent。
- skill 声明的 cheap/mid-tier 模型策略在 Codex dispatch primitive 不暴露模型选择时不能执行，所有 reviewer 会继承父模型。
- 项目当前没有 review run 级 token/cost manifest，无法回答一次具体运行的钱花在了哪个阶段。

这是结构性成本问题。优先级应是先降低 `spec-code-review` 的 validator、roster 和 diff 复制乘数，再压缩单份 prompt；仅缩短几段文案不足以解决问题。

## 1. 分析范围与证据等级

### Confirmed facts

本报告确认了以下当前 source 事实：

- `skills/spec-doc-review/SKILL.md`：248 行、约 21.1 KB。
- `skills/spec-code-review/SKILL.md`：837 行、约 98.4 KB。
- `spec-doc-review` 有 7 个 persona，persona prompt 合计约 50.0 KB。
- `spec-code-review` 有 16 个 persona/local prompt asset，合计约 101.8 KB。
- `spec-doc-review` 默认 2 个、最多 7 个 persona reviewer。
- `spec-code-review` full review 默认 6 个 reviewer；条件 reviewer 可继续增加。
- `spec-code-review` Stage 5b 按 surviving finding 派发 validator，通常上限 15，P0/P1 超限时可提高上限。
- 两个 skill 都没有 `fork_turns` 或等价的上下文隔离规则。
- 当前 source 没有记录 review run 实际 input/output/cache token 的通用 telemetry。

### Estimated facts

本文 token 范围采用英文 Markdown/JSON 常见的约 3–4 字符/token 粗估。中文、代码、模型 tokenizer、prompt caching 和工具结果都会改变实际值，因此估算只用于比较成本形状，不支持账单或节省比例的完成声明。

## 2. 当前静态资产规模

| 项目 | `spec-doc-review` | `spec-code-review` |
| --- | ---: | ---: |
| 主 `SKILL.md` | 21.1 KB / 248 行 | 98.4 KB / 837 行 |
| persona 数量 | 7 | 16 |
| persona 总文本 | 50.0 KB | 101.8 KB |
| subagent 模板 | 27.1 KB | 23.0 KB |
| findings schema | 5.0 KB | 9.1 KB |
| 最低默认 reviewer | 2 | 6 |
| 最大主要 reviewer | 7 | 视条件可超过 10 |
| 二次 validator | 无 | 每 finding 一个，通常最多 15 个 |
| 跨模型复核 | 无 | adversarial 条件下额外一次 |

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

## 10. 验证记录

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
