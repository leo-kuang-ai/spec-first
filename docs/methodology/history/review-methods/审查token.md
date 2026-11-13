
# spec-first Token / Context 成本专项审查 Prompt

你是 spec-first 开源项目的核心维护者、Harness 架构师、Context Engineering 专家、Token 成本审计专家。

当前用户反馈：
spec-first 在真实使用过程中非常消耗 token。

你的任务不是简单压缩 Markdown，也不是粗暴删内容。
你的任务是对 spec-first 当前所有 skill、agent、workflow、context 读取、工具调用、产物 handoff、review 多专家调度进行一轮完整的 Token / Context 成本专项审查，找出：

1. 哪些 skill 节点最消耗 token；
2. 哪些 agent 最容易放大 token；
3. 哪些上下文是必要的；
4. 哪些上下文是重复、陈旧、无效、噪音；
5. 哪些地方需要压缩；
6. 哪些地方应该改成 progressive disclosure；
7. 哪些地方应该抽成 reference 文件按需读取；
8. 哪些地方应该使用 context bundle，而不是直接读全量文档；
9. 哪些地方应该做 tool result clearing / artifact summary；
10. 哪些地方应该建立 context budget；
11. 如何在不牺牲 spec-first Harness 质量的前提下降低 token 成本。

最终目标：
把 spec-first 从“高 token 消耗的 skill/workflow 集合”
升级为“context-budgeted, evidence-governed, repo-local AI coding Harness”。

---

## 0. 最高原则

你必须始终坚持：

1. spec-first 不是 prompt collection。
2. spec-first 不是越详细越好。
3. spec-first 是 AI coding Harness。
4. Harness 的价值是给 AI 正确上下文，而不是更多上下文。
5. Skill 不是把所有知识塞进 SKILL.md。
6. Agent 不是每次都全量调用。
7. Context 不是越大越强。
8. Token 成本不是单点问题，而是 workflow、handoff、tool results、multi-agent、history accumulation 的系统问题。
9. Scripts prepare, LLM decides.
10. Artifacts persist, context is routed.
11. Evidence should be referenced, not duplicated.
12. Review should be selective, not all-agent fanout.
13. Compound should summarize confirmed knowledge, not duplicate entire reports.
14. Progressive disclosure 优先于全量注入。
15. Context Bundle 优先于全仓读取。

---

## 1. 审查范围

请全量读取并审查以下内容。

### 1.1 核心源文件

- skills/**/SKILL.md
- skills/**/README.md
- skills/**/contract.yaml
- skills/**/scripts/**
- agents/**/*.md
- agents/**/*.yaml
- templates/**
- CLAUDE.md
- AGENTS.md
- README.md
- README.zh-CN.md
- docs/**
- src/cli/**
- package.json
- CHANGELOG.md

### 1.2 runtime / generated assets

这些目录不是 source of truth，但需要检查是否存在上下文重复、注入膨胀、source/runtime 边界混乱：

- .claude/**
- .codex/**
- .agents/skills/**
- .spec-first/**

注意：
不要把 runtime mirror 当成 source。
如果发现 source/runtime 内容重复导致 context 膨胀，标记为 P0。

### 1.3 重点审查对象

重点关注：

- spec-brainstorm
- spec-doc-review
- spec-plan
- spec-write-tasks
- spec-work
- spec-debug
- spec-optimize
- spec-polish
- spec-code-review
- spec-app-consistency-audit
- spec-compound
- spec-compound-refresh
- spec-sessions
- retired-skill-review
- spec-mcp-setup
- spec-graph-bootstrap
- 所有 reviewer agents
- 所有 expert agents
- 所有 report writer / evidence auditor / synthesis 类 agents

---

## 2. 本轮审查要回答的核心问题

请围绕以下问题展开：

1. 当前哪个 skill 的 SKILL.md 最大？
2. 当前哪个 skill 的执行流程最容易加载大量上下文？
3. 当前哪个 skill 最容易触发多 agent fanout？
4. 当前哪个 agent 的职责过宽，导致每次都需要大量输入？
5. 哪些 skill 默认要求“全面理解项目”？
6. 哪些 skill 默认读取全仓、全 docs、全 diff、全历史？
7. 哪些 skill 把上游产物全文复制到下游，而不是引用路径/摘要？
8. 哪些 review 报告过长，但下游只需要 findings？
9. 哪些 compound 内容重复沉淀，造成长期上下文污染？
10. 哪些 MCP/tool 调用结果被原样塞进上下文？
11. 哪些脚本输出过长，缺少 summary mode / json compact mode？
12. 哪些 agent 输出自由散文，无法被压缩和结构化消费？
13. 哪些地方应该引入 context-request / context-bundle？
14. 哪些地方应该引入 token budget？
15. 哪些地方应该引入 progressive disclosure？
16. 哪些地方应该拆分为 core instructions + references？
17. 哪些地方应该做 artifact summary，而不是全文传递？
18. 哪些地方应该只传 evidence id / file path / anchor，而不是重复正文？
19. 哪些地方会因为 multi-agent synthesis 放大 token？
20. 如何将 token 成本降低 30% / 50% / 70%，分别需要做什么？

---

## 3. 输出目录和文件

请将本轮审查结果输出到：

docs/10-prompt/context-token-audit/

如果目录不存在，请创建。

必须生成以下文件：

1. docs/10-prompt/context-token-audit/00-token-audit-summary.md
2. docs/10-prompt/context-token-audit/01-skill-token-inventory.md
3. docs/10-prompt/context-token-audit/02-agent-token-inventory.md
4. docs/10-prompt/context-token-audit/03-context-loading-map.md
5. docs/10-prompt/context-token-audit/04-token-hotspot-report.md
6. docs/10-prompt/context-token-audit/05-context-bloat-risk-report.md
7. docs/10-prompt/context-token-audit/06-compression-strategy.md
8. docs/10-prompt/context-token-audit/07-progressive-disclosure-plan.md
9. docs/10-prompt/context-token-audit/08-context-router-design.md
10. docs/10-prompt/context-token-audit/09-skill-agent-rewrite-plan.md
11. docs/10-prompt/context-token-audit/10-token-budget-policy.md
12. docs/10-prompt/context-token-audit/11-final-recommendations.md

任何新增、删除、修改文件，都必须更新根目录 CHANGELOG.md。
如果未更新 CHANGELOG.md，本次审查视为不合格。

---

## 4. Phase 1：Token 资产盘点

先对所有 skill / agent / docs / templates 做 token 成本盘点。

### 4.1 统计每个 SKILL.md

对每个 skill 统计：

- file path
- line count
- approximate token count
- section count
- examples count
- embedded long text count
- references count
- scripts count
- whether has progressive disclosure
- whether has context policy
- whether has token budget
- whether has compact output mode
- whether has artifact reference mode

输出表格到：

01-skill-token-inventory.md

字段：

- skill_id
- path
- lines
- estimated_tokens
- size_level: small / medium / large / huge
- likely_loaded_frequency: high / medium / low
- context_cost_risk: high / medium / low
- primary_cost_reason
- optimization_candidate
- priority

size_level 建议：

- small: < 1,500 tokens
- medium: 1,500–4,000 tokens
- large: 4,000–8,000 tokens
- huge: > 8,000 tokens

如果项目已有更合理标准，可以说明并采用。

---

## 5. Phase 2：Agent Token 盘点

对每个 agent 统计：

- file path
- line count
- approximate token count
- role breadth
- trigger breadth
- expected input size
- output format
- whether outputs structured findings
- whether outputs long prose
- whether invoked by multiple skills
- whether often called in batch
- whether overlaps with other agents

输出到：

02-agent-token-inventory.md

字段：

- agent_id
- path
- lines
- estimated_tokens
- role_scope: narrow / medium / broad / too_broad
- likely_invocation_frequency
- expected_context_size
- output_length_risk
- fanout_risk
- overlap_risk
- token_cost_risk
- optimization_candidate
- priority

重点识别：

1. 职责过宽的 agent；
2. 每次都要读大量上下文的 agent；
3. 输出散文太长的 agent；
4. 多个 agent 重复审同一问题；
5. 被多个 skill 调用但没有统一输出格式的 agent；
6. 应该降级为 lens 的 agent；
7. 应该合并的 agent。

---

## 6. Phase 3：Context Loading Map

构建当前 spec-first 的上下文加载地图。

请按 workflow 节点画出：

- 用户输入
- skill instructions
- agent instructions
- repo docs
- graph facts
- diff
- source files
- test results
- previous artifacts
- standards
- compound
- MCP/tool results
- final report

对每个阶段判断：

1. 读取了什么；
2. 是否必须读取；
3. 是否可以只读取摘要；
4. 是否可以只引用路径；
5. 是否可以延迟读取；
6. 是否可以按需读取；
7. 是否可以由脚本预处理；
8. 是否可以通过 context bundle 替代；
9. 是否存在重复传递；
10. 是否存在过期上下文。

输出到：

03-context-loading-map.md

必须覆盖以下链路：

```text
mcp-setup
→ graph-bootstrap
→ brainstorm
→ doc-review
→ plan
→ write-tasks
→ work/debug/optimize/polish
→ code-review/app-consistency-audit
→ compound/compound-refresh
→ sessions
→ skill-review
````

---

## 7. Phase 4：Token Hotspot 审查

识别 token 消耗热点。

至少输出 Top 20 token hotspots。

每个 hotspot 必须包含：

* hotspot_id
* location
* type
* description
* why_it_costs_tokens
* estimated_impact
* affected_workflows
* current_behavior
* recommended_change
* expected_saving
* risk
* priority

hotspot type 可选：

* huge_skill_md
* huge_agent_md
* duplicate_instructions
* all_repo_context
* all_docs_context
* all_agents_fanout
* long_tool_result
* repeated_artifact_copy
* verbose_review_report
* verbose_compound_notes
* no_summary_mode
* no_context_budget
* no_progressive_disclosure
* runtime_mirror_duplication
* source_runtime_boundary_confusion
* unstructured_agent_output
* repeated_examples_in_skill
* long_embedded_reference
* no_reference_file_split
* no_context_bundle

输出到：

04-token-hotspot-report.md

---

## 8. Phase 5：Context Bloat Risk 审查

识别上下文膨胀风险。

重点检查：

1. 是否存在“全面阅读项目”“完整理解仓库”“读取所有相关文件”等模糊指令。
2. 是否存在默认全仓扫描。
3. 是否存在默认加载所有 docs。
4. 是否存在默认加载所有 agents。
5. 是否存在 code-review 默认调用所有 reviewers。
6. 是否存在 app-consistency-audit 默认调用所有专家。
7. 是否存在 compound 默认读取所有历史。
8. 是否存在 sessions 默认恢复所有历史。
9. 是否存在 skill-review 默认读取所有文件但不分层。
10. 是否存在 graph-bootstrap 输出过大 JSON 后直接喂给 LLM。
11. 是否存在 tool results 原样进入 LLM 上下文。
12. 是否存在 scripts 输出 verbose logs 而无 compact JSON。
13. 是否存在 Markdown 报告被下游全文重复读取。
14. 是否存在 source 和 runtime mirror 两份内容都进入上下文。

输出：

05-context-bloat-risk-report.md

必须给出：

* high risk list
* medium risk list
* low risk list
* quick win fixes
* structural fixes
* must-not-do list

---

## 9. Phase 6：压缩策略设计

设计 spec-first 的上下文压缩策略。

必须分层设计：

### 9.1 Instruction Compression

针对 SKILL.md / agent.md：

* 保留 core instructions；
* 把长案例移到 references；
* 把重复原则提到共享 governance doc；
* 把 host-specific 内容放到 templates；
* 把 detailed checklists 放到 on-demand references；
* 每个 skill 增加 “minimal mode / full mode”；
* 每个 agent 增加 compact output format。

### 9.2 Artifact Compression

针对 plan / task / review / compound：

* 上游 artifact 下游默认只读 summary + path；
* full artifact 只在需要时读取；
* 每个 artifact 生成 machine-readable summary；
* evidence 用 id / path / anchor 引用，不重复正文；
* review report 分为 findings.json + synthesis.md；
* compound 分为 delta + index，不重复历史全文。

### 9.3 Tool Result Compression

针对脚本 / MCP / graph / search：

* 默认输出 compact JSON；
* verbose logs 写入文件，不进入 LLM；
* tool result clearing；
* 大结果先过滤、排序、截断；
* graph facts 输出 top relevant facts；
* provider 输出 readiness summary，而非全部日志；
* test output 输出 failed tests summary，完整日志写路径。

### 9.4 Workflow Compression

针对多阶段 handoff：

* handoff packet 只保留下游必需字段；
* 不在每阶段复制完整需求；
* 不在每阶段复制完整 plan；
* task-pack 只引用 source requirement id；
* review 只引用 task id / diff / context bundle；
* compound 只沉淀 confirmed delta。

### 9.5 Multi-agent Compression

针对多 expert review：

* selective dispatch；
* 不默认调用所有 agent；
* 每个 agent 只拿自己需要的 context slice；
* agent 输出 finding JSON，不输出长篇报告；
* synthesis 读取 structured findings，不读全部 agent 长文；
* agent confidence low 时只输出 unknown / escalation，不继续扩写。

输出：

06-compression-strategy.md

必须包含：

* immediate compression
* medium-term compression
* architecture-level compression
* expected token saving
* quality risk
* acceptance criteria

---

## 10. Phase 7：Progressive Disclosure 方案

为 spec-first 设计 progressive disclosure。

必须回答：

1. skill metadata 应该包含什么；
2. SKILL.md 首屏应该多短；
3. 哪些内容应拆到 references；
4. 哪些 examples 应按需加载；
5. 哪些 checklists 应按需加载；
6. agent profile 是否也要 progressive disclosure；
7. code-review reviewer 是否按需加载；
8. app-audit experts 是否按需加载；
9. compound history 是否按需加载；
10. standards 是否按需加载；
11. graph facts 是否按需加载。

建议输出结构：

```text
skill/
  SKILL.md                 # core instructions only
  contract.yaml            # machine-readable contract
  references/
    checklist.md           # on-demand
    examples.md            # on-demand
    edge-cases.md          # on-demand
  scripts/
    collect-context.js
    summarize-artifact.js
```

每个核心 skill 给出改造建议：

* spec-brainstorm
* spec-plan
* spec-write-tasks
* spec-work
* spec-code-review
* spec-app-consistency-audit
* spec-compound
* retired-skill-review
* spec-graph-bootstrap
* spec-mcp-setup

输出：

07-progressive-disclosure-plan.md

---

## 11. Phase 8：Context Router 设计

设计 spec-first 的 Context Router MVP。

目标：
让 skill 不再自己到处读上下文，而是先发 context-request，再获得 context-bundle。

### 11.1 Context Request

建议 schema：

```json
{
  "schema_version": "spec-first.context-request.v1",
  "stage": "code-review",
  "intent": "review_diff_for_regression_risk",
  "spec_id": "...",
  "task_ids": [],
  "changed_files": [],
  "needs": [
    "requirements",
    "plan_summary",
    "task_pack",
    "diff",
    "direct_dependencies",
    "callers",
    "tests",
    "standards",
    "compound_failures"
  ],
  "budget": {
    "max_files": 20,
    "max_tokens": 60000,
    "prefer_symbols": true,
    "allow_full_file": false
  }
}
```

### 11.2 Context Bundle

建议 schema：

```json
{
  "schema_version": "spec-first.context-bundle.v1",
  "request_id": "...",
  "providers_used": [],
  "included_context": [],
  "excluded_context": [],
  "summaries": [],
  "evidence_refs": [],
  "tool_results": [],
  "budget_used": {
    "estimated_tokens": 0,
    "files": 0
  },
  "confidence": "medium"
}
```

### 11.3 Provider Priority

设计 provider 分层：

```text
1. direct artifacts: task-pack, evidence-packet, review-findings
2. git diff / changed files
3. graph readiness / graph facts
4. code-review-graph impact
5. Serena symbol lookup
6. ast-grep structural search
7. ripgrep fallback
8. standards / repo-profile / glue-map
9. compound index
10. full file fallback
```

### 11.4 Context Bundle 原则

必须保证：

* 默认给摘要；
* 必要时给片段；
* 最后才给全文；
* 所有 included context 必须有 reason；
* 所有 excluded context 可以记录 reason；
* provider degraded 必须显式说明；
* 超预算必须降级；
* 不得默认全仓读取。

输出：

08-context-router-design.md

---

## 12. Phase 9：Skill / Agent 重写计划

根据审查结果，输出具体重写计划。

必须按 P0/P1/P2 分类。

### P0：立即修

典型 P0：

* huge SKILL.md 导致每次加载大量 token；
* skill 默认读取全仓；
* code-review 默认调用所有 agents；
* app-consistency-audit 默认调用所有专家；
* compound 默认读取所有历史；
* sessions 恢复全量历史；
* scripts 输出 verbose logs 给 LLM；
* graph facts 过大且不摘要；
* agent 输出长篇散文；
* source/runtime mirror 重复进入上下文；
* 缺少 context budget；
* 缺少 progressive disclosure。

### P1：重要优化

典型 P1：

* examples 拆到 references；
* checklists 拆到 references；
* 引入 compact mode；
* agent 输出 JSON finding；
* review synthesis 只读取 structured findings；
* compound-delta 替代全文总结；
* standards-preview 摘要化；
* task-pack 引用 requirement id；
* plan 生成 decision summary。

### P2：长期优化

典型 P2：

* context router；
* artifact index；
* compound index；
* run-state compaction；
* token usage telemetry；
* skill metadata linter；
* context budget CI check；
* auto context summary script。

输出：

09-skill-agent-rewrite-plan.md

每个任务包含：

* id
* title
* target files
* current token problem
* proposed change
* expected token saving
* quality risk
* acceptance criteria
* priority
* changelog_required

---

## 13. Phase 10：Token Budget Policy

制定 spec-first 的 token budget policy。

必须覆盖：

### 13.1 Skill MD budget

建议：

* core SKILL.md 控制在可快速加载范围；
* 长 checklist 放 references；
* 长 examples 放 references；
* 重复原则抽到共享 governance；
* host-specific 内容不放核心 skill。

请根据项目实际情况提出具体阈值。

### 13.2 Agent MD budget

建议：

* agent role 聚焦；
* required inputs 简洁；
* output format 结构化；
* 禁止长篇方法论；
* 禁止复制 skill workflow。

### 13.3 Artifact budget

建议：

* 每个 artifact 必须有 summary；
* 下游默认读取 summary；
* full artifact 按需读取；
* evidence 用引用，不复制全文。

### 13.4 Review budget

建议：

* selective reviewer dispatch；
* max reviewer count by change type；
* max finding count per reviewer；
* finding 必须结构化；
* synthesis 不读取长文。

### 13.5 Tool result budget

建议：

* logs 默认写文件；
* LLM 只看 summary；
* test output 只看 failure summary；
* graph query 只看 top relevant；
* provider status 只看 readiness summary。

### 13.6 Session budget

建议：

* run-state 常驻；
* raw history 不常驻；
* decision-log 摘要化；
* context snapshot 可裁剪；
* resume instruction 必须 compact。

输出：

10-token-budget-policy.md

---

## 14. Phase 11：最终建议

输出最终建议：

11-final-recommendations.md

必须包含：

1. 总体结论；
2. 当前 token 消耗的根因；
3. Top 10 token hotspots；
4. Top 10 quick wins；
5. Top 10 structural fixes；
6. 哪些 skill 最耗 token；
7. 哪些 agent 最耗 token；
8. 哪些 workflow 最容易上下文膨胀；
9. 是否需要压缩；
10. 应该压缩什么；
11. 不应该压缩什么；
12. 是否需要 Context Router；
13. 是否需要 progressive disclosure；
14. 是否需要 selective reviewer dispatch；
15. 是否需要 tool result clearing；
16. 是否需要 artifact summary；
17. 是否需要 token budget policy；
18. 预期 token 降低比例；
19. 对质量的风险；
20. 下一轮实施顺序。

---

## 15. 审查判断标准

请使用以下成熟度等级判断当前项目。

### C0：No Context Governance

* skill 随意读上下文；
* agent 随意输出长文；
* 无 token budget；
* 无压缩策略。

### C1：Manual Context Discipline

* 文档里提醒节省 token；
* 但没有统一机制。

### C2：Artifact Summary

* 关键 artifact 有 summary；
* 下游可以不读全文。

### C3：Progressive Disclosure

* skill / agent / references 按需加载；
* 默认只加载核心指令。

### C4：Context Router

* skill 通过 context-request 获取 context-bundle；
* 有 provider fallback 和 budget。

### C5：Evidence-aware Context

* context 与 evidence packet 绑定；
* claim、task、review finding 都引用 evidence。

### C6：Token-optimized Harness

* 有 token budget；
* 有 tool result clearing；
* 有 selective agent dispatch；
* 有 artifact compaction；
* 有 session compaction；
* 有可持续治理。

请判断当前 spec-first 处于 C 几，并给出目标等级。

---

## 16. 不允许的优化方式

不要为了省 token 牺牲 Harness 质量。

禁止：

1. 直接删除 evidence 要求；
2. 直接删除 safety rules；
3. 直接删除 CHANGELOG 规则；
4. 直接删除 degraded mode；
5. 直接删除 review checklist；
6. 让 AI 少读必要代码事实；
7. 把 review 从 structured finding 降级成泛泛点评；
8. 把 compound 从 confirmed knowledge 降级成聊天总结；
9. 为省 token 取消 graph readiness；
10. 为省 token 让 agent 凭经验猜。

正确方式是：

1. 拆分；
2. 摘要；
3. 引用；
4. 按需加载；
5. 结构化；
6. 去重复；
7. 选择性调度；
8. 工具结果清理；
9. artifact summary；
10. context router。

---

## 17. 最终回复摘要

完成审查后，在最终回复中输出：

1. 本次审查覆盖 skill 数量；
2. 覆盖 agent 数量；
3. 当前 Context Governance 成熟度；
4. 最大 token 消耗来源；
5. Top 5 高 token skill；
6. Top 5 高 token agent；
7. Top 5 上下文膨胀 workflow；
8. 预计 quick wins 可节省多少 token；
9. 预计结构性改造可节省多少 token；
10. 第一批建议修改文件；
11. 是否已更新 CHANGELOG；
12. 下一步最小实施方案。

最终结论必须围绕：

spec-first 的问题不是“prompt 太长”这么简单，
而是缺少系统化 Context Governance。

目标不是让 skill 变短，
而是让每个 workflow 节点只加载自己当前阶段真正需要的最小充分上下文。
