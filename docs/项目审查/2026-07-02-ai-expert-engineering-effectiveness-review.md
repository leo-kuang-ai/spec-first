---
doc_role: review-report
authority: review-evidence
status: current
review_date: 2026-07-02
author: leokuang
review_method: source-backed review + Graphify advisory navigation + Codegraph source orientation + focused grep/nl evidence + external standards scan
relates_to:
  - docs/10-prompt/结构化项目角色契约.md
  - docs/10-prompt/系统性项目审查方法.md
  - docs/contracts/ai-coding-harness.md
  - docs/contracts/context-governance.md
  - docs/contracts/knowledge/knowledge-harness.md
  - docs/catalog/runtime-capabilities.md
  - docs/项目审查/2026-06-15-项目Review与优化方案.md
  - docs/项目审查/2026-06-30-spec-first-战略方向判断-弱模型主攻假设.md
limitations: |
  1. 本报告不跑真实 Claude/Codex 端到端 workflow，不声明真实用户交付周期已改善。
  2. Graphify 查询只作为 provider_untrusted 导航；关键结论均回源到当前 source、tests、contracts 或 README。
  3. 外部行业信息只作为 advisory 定位背景；未做完整竞品复审、GitHub 实时指标采集或用户访谈。
  4. 当前 worktree 已有用户/其他会话改动，本报告只新增 docs source、更新项目审查索引和 CHANGELOG，不修改 generated runtime mirrors。
---

# spec-first AI 专家与工程效能综合审查

## Executive Summary

结论先行：**spec-first 已经具备 AI coding harness 的核心能力骨架，尤其在任务建模、上下文治理、执行控制和知识进化上明显超过普通 prompt pack 或 agent collection；但它还没有充分证明自己真实改善了交付周期、质量、复用率和团队一致性。**

从顶尖 AI 系统视角看，spec-first 最强的地方不是“有很多 skill/agent”，而是它把 AI coding 拆成可治理的工程闭环：

```text
Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
```

当前 `README.md:16-18` 已把项目定位收敛为 `AI Coding Harness for Claude Code and Codex`，并明确“scripts enforce deterministic invariants and prepare facts; LLMs judge semantic adequacy”。`docs/contracts/ai-coding-harness.md:15-24` 又把 Context、Execution、Evidence、Evaluation、Governance、Knowledge 六层 harness 合同化。这个方向是对的，也符合 2026 年 AI coding 工具正在向 repository instructions、skills/rules、hooks、approval/sandbox、持久证据面收敛的趋势。

但是，从工程效能视角，当前最大问题仍是：**机制很多，真实 outcome 证据很薄。** `docs/catalog/runtime-capabilities.md:100-107` 明确说 AI dev benchmark fixtures 是 advisory，只验证 fixture contract 与 evidence visibility，不运行真实 agent/workflow，也不做语义评分。6 月 30 日战略报告也已指出公开采纳和真实使用摩擦数据不足，P0/P0' 应分别是“接通已有证据闭环”和“启动真实用户摩擦数据”。

本报告给出的阶段判断是：

| 判断项 | 当前等级 | 结论 |
| --- | --- | --- |
| AI harness 架构完整度 | 高 | 主链路、runtime catalog、source/runtime 边界、task-pack、closeout、knowledge contract 已成体系 |
| 任务建模能力 | 高 | `spec_id`、`source_plan_hash`、Task Pack Contract、`stop_if`、`review_gate` 形成可执行任务模型 |
| 上下文治理能力 | 高 | 默认排除 generated/runtime/audit，summary-first 与 bounded direct evidence 边界清楚 |
| 执行控制能力 | 中高 | `spec-work` 对 scope、feedback loop、task-pack intake、verification closeout 有明确 discipline；但跨宿主硬 gate 强度不均 |
| 评测反馈能力 | 中低 | 机制已就位，但多为 advisory / fixture-shape / contract-test；缺真实 workflow outcome 评分与用户效能指标 |
| 知识进化能力 | 中高 | `docs/solutions/`、recall-as-advisory、promotion boundary 成熟；但 promotion required fields 仍主要靠 prose/LLM 执行 |
| 工程效能可证明性 | 低到中 | README 已诚实说“mechanisms, not measured adoption-outcome claims”；缺交付周期、质量、复用率、团队一致性的纵向数据 |

## 审查证据

本次审查使用的 confirmed evidence：

- `package.json` 当前版本为 `1.12.0`，description 已收敛为 AI Coding Harness。
- 当前 source inventory：37 个 `skills/`、51 个 `agents/`、229 个测试文件、59 个 contracts 文件、27 个 `docs/solutions/` 文件、121 个项目审查文件。
- `docs/catalog/runtime-capabilities.md:21-29` 记录 37 bundled source skills、51 bundled source agents、20 个 workflow commands、2 个 standalone skills。
- `spec-first --help` 当前公开 CLI 包含 `doctor/init/update/clean/repair-worktree/tasks/session`。
- `.github/` 当前有 PR template 和 4 个 workflows，但没有 issue template / CODEOWNERS / CODE_OF_CONDUCT。
- `graphify-out/graph.json` 存在，但本次 Graphify query 返回偏窄，因此只作弱导航。
- Codegraph source orientation 命中 `honest-closeout`、`spec-work-run-artifact`、Codex runtime adapter 等关键实现面；具体结论已用 `nl`/`rg` 回源确认。

外部 advisory 背景：

- OpenAI Codex 官方文档公开支持 `AGENTS.md` 作为仓库指令面：`https://developers.openai.com/codex/guides/agents-md`
- Anthropic Claude Code 官方文档公开 hooks / skills 等 runtime primitive：`https://docs.anthropic.com/`
- GitHub Copilot 支持 repository custom instructions：`https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions`
- Cursor rules 是 project-level agent context surface：`https://docs.cursor.com/context/rules`
- Agent Skills 公开标准把 `SKILL.md` 作为 reusable skill surface：`https://agentskills.io/home`

这些外部信号只支持一个方向性判断：**standards-native / repo-native instructions 已成为跨宿主共同接口。** 它们不证明 spec-first 当前效能已经领先。

## 能力成熟度矩阵

评分口径：5 = 当前 source 有清晰机制、可验证合同、测试或运行证据，且能转化为用户 outcome；3 = 机制存在但主要依赖 LLM/prose 或 advisory artifacts；1 = 主要是愿景或手工约定。

| 能力 | 分数 | Confirmed evidence | 当前缺口 | 优先级 |
| --- | ---: | --- | --- | --- |
| 任务建模 | 4.5 | README 主链路 `Spec -> Plan -> Tasks`；`src/cli/task-pack.js:13-41` 定义任务字段；`src/cli/task-pack.js:427-510` 校验 `spec_id`、`source_plan`、`source_plan_hash`；`src/cli/task-pack.js:553-665` 校验 Task Pack Contract、waves、`review_gate`、`target_repo` | task pack 的语义充分性仍由 LLM/review 判断；任务包质量还缺真实项目 outcome 数据 | 保持，补 outcome eval |
| 上下文治理 | 4.5 | `docs/contracts/context-governance.md:22-36` 默认排除 runtime/generated/audit；`docs/contracts/context-governance.md:52-63` summary-first runtime artifact policy；`docs/contracts/ai-coding-harness.md:35-45` direct evidence lanes | 多仓、budget pressure、provider readiness 的真实端到端行为仍缺集成证据 | 保持，补多仓/降级演练 |
| 执行控制 | 4.0 | `skills/spec-work/SKILL.md:17-43` 定义 settled input、scope、failure modes；`skills/spec-work/SKILL.md:77-81` 要求最小 feedback loop；`skills/spec-work/SKILL.md:206-235` 把 task-pack intake、hash、`stop_if`、`review_gate` 纳入执行边界 | 部分硬 gate 受宿主能力影响；非原生/弱工具遵循模型可靠性仍是未证实风险 | P1 可靠性切片验证 |
| 评测反馈 | 2.5 | `src/cli/helpers/honest-closeout.js:177-239` 能把 unsupported/degraded claims 区分出来；`src/cli/helpers/spec-work-run-artifact.js:193-275` 能写 immutable run artifact；`scripts/run-ai-dev-quality-gate.js:88-102` 有 gate result；`docs/catalog/runtime-capabilities.md:100-107` 标注 benchmark fixtures advisory | 当前 quality gate 不跑真实 workflow，不做语义评分；honest closeout 是强机制但 outcome consumer 仍偏窄 | P0 |
| 知识进化 | 4.0 | `docs/contracts/knowledge/knowledge-harness.md:18-29` 六层 map；`docs/contracts/knowledge/knowledge-harness.md:48-62` recall-as-advisory 与 promotion boundary；`skills/spec-compound/SKILL.md` 要求 source-confirmed learning 与 frontmatter validation | promotion required fields 主要 prose/LLM-enforced，非 machine-validated；recall 命中率和复用率未量化 | P1 |
| 团队一致性/组织治理 | 3.5 | `docs/contracts/team-standards.md`、runtime catalog、source/runtime boundary、session advisory、review personas 形成治理面；README 对 artifact ownership 有清楚路径 | 缺企业采纳指南、issue template、CODEOWNERS、真实团队试点指标 | P1/P2 |

## 1. 任务建模能力

**判断：强。spec-first 已从“让 AI 写计划”升级到“把任务建成可验证的执行输入”。**

关键机制：

- `spec_id` 负责 requirements / plan / task pack 的链路身份。
- `source_plan_hash` 负责 task pack freshness。
- Task Pack Contract 把任务拆解从自由 Markdown 降为 schema-like JSON block。
- `source_unit`、`requirement_refs`、`context_refs`、`test_focus`、`done_signal`、`stop_if`、`review_gate`、`review_focus` 让任务具备可执行边界。
- `target_repo` 让父级多仓 workspace 的执行范围可显式化。

强点是 `src/cli/task-pack.js` 里脚本只做确定性校验：路径、hash、字段、waves、枚举、repo-relative scope。它没有试图判断“这个任务拆得好不好”，这符合角色契约的 deterministic floor 原则。

风险是：任务建模已经足够复杂，下一步不该继续加字段。更高价值的方向是回答两个问题：

1. 这些任务模型是否让实际 implementation 更少漏需求？
2. 使用 task pack 的工作是否比直接 plan-to-work 有更短 review time 或更少 rework？

建议的最小 metric：

| Metric | 采集方式 | 目标 |
| --- | --- | --- |
| task_pack_rework_rate | work closeout 记录 `stop_if`、scope expansion、task-pack stale/unchecked-existing 次数 | 下降 |
| requirement_trace_gap_rate | doc-review task-pack ID coverage finding 数 | 下降 |
| plan_to_work_rejection_rate | `spec-work` 因 hash/spec_id/scope 不通过退回次数 | 初期可上升，随后下降 |

## 2. 上下文治理能力

**判断：强。spec-first 对“给 AI 什么上下文”和“什么不应进入普通上下文”有成熟的治理边界。**

最重要的设计选择是：默认不把 `.claude/`、`.codex/`、`.agents/skills/`、`.spec-first/audits/**`、`.spec-first/governance/**` 当作普通 source context。`docs/contracts/context-governance.md:22-36` 已把 generated mirror、audit artifact、team standards source surface 分开；`docs/contracts/context-governance.md:99-108` 规定普通 workflow 先读用户请求、diff、changed files、summary，再精确展开 full artifact。

这使 spec-first 避免了 AI coding 常见的两个失败模式：

- 把 generated runtime mirror 当 source 修。
- 把 raw MCP / graph / audit dump 广播进 prompt，造成噪声和伪证据。

但这里仍有一个工程效能缺口：**context governance 是否减少了实际 token waste、减少了错误上下文导致的 rework，目前没有量化。** `docs/contracts/context-bundle.md` 和 `artifact-summary.v1` 是好机制，但缺少“启用前后”的对比数据。

建议的最小 metric：

| Metric | 采集方式 | 目标 |
| --- | --- | --- |
| summary_missing_count | plan/work/review closeout 汇总 | 下降 |
| full_artifact_read_reason_distribution | context bundle / closeout 记录 | 从“缺 summary”转为“精确证据需要” |
| generated_runtime_context_violation | lint/test/search 检查 workflow source 是否重新鼓励 broad scan generated mirrors | 保持 0 |

## 3. 执行控制能力

**判断：中高。`spec-work` 的执行 discipline 很强，但强度受宿主 primitive 和模型遵循能力影响。**

`spec-work` 的 source 明确了几个关键控制点：

- 只执行 settled plan / validated task pack / concrete request。
- WHAT/HOW 未定、repo scope 不清、task pack stale、scope expansion、generated runtime mirror source fix 都应停止。
- 行为变更前建立或尝试最小 feedback loop。
- 对 task pack 执行先验证 hash/spec_id/Task Pack Contract。
- 对 `review_gate: required` 的任务要求 diff-scoped report-only review 或显式 handoff。
- 对 durable evidence trigger 要调用 `verification-profile`、`verification-run-summary`、`honest-closeout` 和 run artifact producer。

这已经不是 prompt-level best practice，而是一个执行合同。但问题在于：**有些控制只能在 Claude hook、Codex approval/sandbox 或模型自觉之间降级。** 6 月 30 日战略报告指出，非原生/弱工具遵循模型可能绕过 plan/ask-user flow；这不是功能小 bug，而是 spec-first 价值兑现最依赖的一段链路。

建议的 P1 验证切片：

| 切片 | 成功条件 |
| --- | --- |
| Plan-to-write 阻塞可靠性 | 对 Claude 原生、Codex、至少 1 个非原生模型壳重复运行同一高风险 prompt，确认 plan 写入后未 silent write 非计划 source |
| Fallback 诚实性 | 当阻塞式工具不可用时，必须 loud fallback，并给出 copy-ready next action |
| Side-effect 观测 | 用 hook/sandbox/log 或最小 fixture 证明写文件前确实经过 gate，而不是只写在 SKILL.md |

## 4. 评测反馈能力

**判断：当前最薄。机制方向正确，但 outcome 证明不足。**

当前已有三类东西：

1. `verification-run-summary.v1`：记录实际 check status。
2. `honest-closeout.v1`：把 claim 与 evidence refs 对齐，不能 cherry-pick 只引用通过的子集。
3. AI dev quality gate / benchmark fixtures：把 benchmark fixture schema、artifact shape、advisory failures 记录下来。

这是非常好的“评测反馈地基”。但 `docs/catalog/runtime-capabilities.md:100-107` 已诚实说明，benchmark fixtures 不运行 agents/workflows，不做 semantic scoring，不是 release hard gate。也就是说，当前 Evaluation Harness 仍主要回答：

- artifact shape 是否对？
- fixture manifest 是否对？
- deterministic contract 是否被破坏？

它还不能回答：

- `$spec-work` 是否真的比普通 agent prompt 更快交付？
- review 是否真的减少逃逸缺陷？
- task pack 是否降低 rework？
- compound 是否提高下一次相似问题的解决速度？

这是 P0，因为如果评测反馈不接到真实 workflow outcome，spec-first 容易继续生产“看起来更治理”的 artifacts，却无法证明它改善了工程结果。

建议的 P0 交付：

| 交付 | 最小形态 | 不做 |
| --- | --- | --- |
| workflow-output semantic review fixture | 选 2 个 repo-like fixture，保存 baseline prompt output 与 spec-first-guided output 的人工/LLM review artifact | 不先做大 eval 平台 |
| delivery outcome ledger | 每次 dogfood run 记录 cycle time proxy、rework count、review finding count、verification status、learning reuse | 不追求自动化全覆盖 |
| quality-gate dashboard artifact | 把 deterministic checks + advisory semantic review + limitations 汇总成一份 repo-local Markdown/JSON | 不宣称 adoption ROI |

## 5. 知识进化能力

**判断：中高。知识闭环理念正确，source 边界清楚，但复用效果还缺数据。**

`docs/contracts/knowledge/knowledge-harness.md` 的成熟点在于它没有把 `docs/solutions/` 神化为“记忆真相源”。它明确：

- recall 命中是 advisory candidate。
- consumer 必须回源到 `source_refs` / `source_reads_required`。
- 新 promotion 必须有 `invalidation_condition` 和 `source_refs`。
- legacy solution 可 recall，但保持 `legacy_unstructured_advisory`。
- 不默认引入向量库、SQLite、外部 memory 平台。

这比“把经验丢进 memory”稳健得多。问题是 `knowledge-harness.md:60-62` 也明确 promotion required fields 是 prose / LLM-enforced，不是 machine-validated hard gate。`skills/spec-compound` 的 frontmatter validator 当前主要保证 YAML parser safety，不校验完整 schema required fields。

建议把知识进化的下一步从“更多知识文档”改成“证明知识被复用”：

| Metric | 采集方式 | 目标 |
| --- | --- | --- |
| recall_hit_confirmed_rate | review/work/debug closeout 记录 recall 命中是否回源 confirmed | 上升 |
| stale_learning_refresh_rate | `spec-compound-refresh` 更新/合并/退役次数 | 上升到稳定水平 |
| repeated_issue_time_to_resolution | 同类问题第二次解决时间或步骤数 | 下降 |
| new_solution_schema_completeness | `docs-solutions-frontmatter` 加强为检查新 promote required fields | 100% |

## 6. 工程效能视角

用户要求的五项工程效能判断如下。

| 维度 | 当前证据 | 判断 | 需要补的证据 |
| --- | --- | --- | --- |
| 交付周期 | workflow artifacts 和 task packs 能减少上下文丢失；README 首屏已有 first artifact 路径 | 机制支持缩短周期，但未证明 | dogfood run 的 lead time / rework count |
| 质量 | code-review/doc-review personas、task review gate、verification-run-summary、honest-closeout | 质量机制强，但语义缺陷逃逸率未量化 | review finding escape rate、post-merge bug rate |
| 复用率 | `docs/solutions/`、recall-as-advisory、compound-refresh | 知识复用路径存在，但 recall 命中率未量化 | confirmed recall usage / stale refresh rate |
| 团队一致性 | team standards、AGENTS/CLAUDE、runtime catalog、source/runtime discipline | 对单团队有强治理价值 | 多人/多会话协作试点数据 |
| 组织治理 | source/runtime/provider boundaries、artifact summary、evidence lanes、security/contributing/CI | 治理语言成熟，但企业采纳材料不足 | 团队采纳指南、治理审计样例、issue/CODEOWNERS 等 OSS 信号 |

工程效能的总判断：**spec-first 的机制大概率能改善复杂任务的质量和复用，但目前不能诚实声明已经改善交付周期或团队 ROI。** 对外表述必须继续采用 README 当前的诚实口径：这些是 current mechanisms，不是 measured adoption-outcome claims。

## Findings

### P0：Evaluation Harness 还没有闭到真实 workflow outcome

证据：

- `docs/contracts/ai-coding-harness.md:22` 把 Evaluation Harness 定义为记录系统是否真的变好。
- `docs/catalog/runtime-capabilities.md:100-107` 明确当前 AI dev benchmark fixtures 是 advisory，不运行 agents/workflows，不做 semantic scoring。
- `scripts/run-ai-dev-quality-gate.js:88-102` gate 只把非 advisory checks 作为 blocking；benchmark failures 进入 `advisory_failures`。

影响：项目能证明 contract shape 和 artifact visibility，但不能证明 spec-first-guided run 优于普通 AI run。

建议：先建立 2-4 个 dogfood benchmark run，产出人工/LLM review artifact 和 outcome ledger，再考虑自动化平台。

### P0'：真实用户摩擦数据不足，战略优先级仍容易停在“地图推理”

证据：

- 6 月 30 日战略报告 `docs/项目审查/2026-06-30-spec-first-战略方向判断-弱模型主攻假设.md:44-52` 已记录公开采纳证据薄。
- 同报告 `:177-187` 明确指出“地图不是疆域”，下一步要先取得真实用户摩擦数据。

影响：继续新增机制可能无法改善真实 adoption funnel。

建议：建立 P-friction 最小审计：安装、init、首个 workflow、首个 artifact、首个 review、首个 compound，各记录阻塞点和恢复动作。

### P1：证据闭环 strongest path 集中在 spec-work，debug/review/knowledge 的 outcome 消费还应继续收敛

证据：

- `src/cli/helpers/spec-work-run-artifact.js:16-19` 注释说明 run artifact producer 当前固定服务 `spec-work`。
- `skills/spec-debug/SKILL.md` 和 `skills/spec-code-review/SKILL.md` 已要求优先 surface `verification-run-summary.v1` 和 `honest-closeout.v1`，但 durable run artifact 生产路径没有同等外显。
- `src/cli/helpers/honest-closeout.js:177-239` 已支持 validation/review/impact/knowledge claim 判断。

影响：机制有，但各 workflow 的 closeout 证据形态可能不一致，外部 reviewer 不容易比较 Debug、Review、Work 的证据质量。

建议：不要马上扩 schema。先写一份 closeout-consumer matrix，列清 `spec-work`、`spec-debug`、`spec-code-review` 当前 producer/consumer/path/status，再决定是否复用 run artifact。

### P1：知识 promotion required fields 仍偏 prose gate

证据：

- `docs/contracts/knowledge/knowledge-harness.md:56-62` 要求新 promotion 有 `invalidation_condition` 和 `source_refs`，但说明这是 prose / LLM-enforced，validate-frontmatter 不校验这些 required fields。

影响：知识库增长后，legacy 与 structured learning 混杂会降低 recall 精度，也会让团队把 stale learning 当成规则。

建议：对“新 promote”增加最小 deterministic check，只校验字段存在和 repo-relative `source_refs`，不让脚本判断 learning 是否语义正确。

### P1：非原生/弱工具遵循模型可靠性是下一阶段战略假设，不是已验证能力

证据：

- 6 月 30 日战略报告 `:56-66`、`:89-101` 和 `:200-208` 已把该方向降级为高优先级验证型假设。
- 当前 spec-first 依赖 host workflow entry、blocking question、plan mode、hooks/sandbox 等 primitive；这些在不同宿主和代理模型下不等价。

影响：如果对外推广给非原生模型用户，却不能保证 no silent write / loud fallback，会损害最核心的“可治理”承诺。

建议：先做最小复现实验，不先重构全宿主策略。

### P2：OSS 和组织治理信号仍可低成本补齐

证据：

- `.github/` 当前有 `pull_request_template.md` 和 4 个 workflows。
- 未发现 `.github/ISSUE_TEMPLATE/**`、`CODEOWNERS`、`CODE_OF_CONDUCT.md`。

影响：企业/团队评估时，项目内部治理很强，但开源治理表面缺项。

建议：补 issue templates、CODEOWNERS、CODE_OF_CONDUCT，并把 README 的 trust model 链接到企业采纳/试点指南。

## 保留优势

以下能力不应被下一轮优化破坏：

1. **Light contract + explicit boundaries。** 不用强状态机替代 LLM 语义判断。
2. **Source/runtime 同源纪律。** 继续禁止手改 generated mirrors。
3. **Direct evidence 默认车道。** Graphify/CodeGraph 可导航，但不能拥有 scope/finding/root-cause authority。
4. **Advisory 诚实降级。** quality gate、benchmark fixtures、knowledge recall、provider facts 都应保留 evidence level。
5. **Tasks derived, plan authoritative。** 不让 task pack 反向扩展 plan scope。

## 90 天路线图

| 时间 | 目标 | 交付物 | 成功信号 |
| --- | --- | --- | --- |
| 0-30 天 | 证明 outcome，而不再增加机制 | 2-4 个 dogfood workflow-output semantic review fixtures；delivery outcome ledger；P-friction 表 | 能回答“哪一步节省/增加了时间，哪里导致 rework” |
| 31-60 天 | 收敛证据闭环 | closeout-consumer matrix；spec-work/debug/code-review evidence shape 对齐方案；new-solution required fields check | closeout 证据路径一致，unsupported/degraded claim 不靠人工记忆 |
| 61-90 天 | 验证弱工具遵循模型假设 | 最小 plan-to-write 阻塞实验；Claude/Codex/非原生模型对照；loud fallback 报告 | 能判断是否升格为主攻方向，或诚实标 degraded support |

## 不做什么

- 不继续堆 workflow/agent 数量来证明成熟度。
- 不把 advisory benchmark 升格成 release hard gate。
- 不让脚本判断需求是否充分、learning 是否真的可复用、review finding 是否成立。
- 不因外部工具热度而引入默认向量库/SQLite memory。
- 不为了“更自动化”牺牲 source/runtime、provider authority、artifact evidence level 边界。

## 推荐下一步

1. **先做 P0 dogfood outcome ledger。** 选一个真实小型改动和一个中型计划执行，把普通 agent prompt 与 spec-first-guided run 的 artifacts、rework、review findings、verification summary 对齐记录。
2. **给 quality gate 增加 semantic review artifact 输入。** 仍保持 advisory，但让每个 fixture 至少能被人类 reviewer 或 LLM judge 评分。
3. **补 `docs/solutions/` 新 promote deterministic field check。** 只查字段/路径，不查语义正确性。
4. **补 OSS 治理低成本项。** issue templates、CODEOWNERS、CODE_OF_CONDUCT。
5. **把弱工具遵循模型验证变成一个计划。** 不先做大重构，先复现 silent write / no-silent-write。

## 最终判断

spec-first 当前不是“缺能力”的项目，而是“能力强于证据”的项目。它已经有任务建模、上下文治理、执行控制和知识进化的工程骨架；评测反馈层也有雏形，但还停在 advisory 和 fixture-shape 证明。下一阶段最有价值的工作不是继续扩展 harness，而是把 harness 的价值变成可观察、可比较、可复盘的工程效能数据。

一句话：**spec-first 已经像一个 AI Coding Harness；现在需要证明这个 harness 真的让团队交付得更快、更稳、更一致。**
