---
title: Graphify 命令可靠性分化与 mcp-setup 诚实暴露边界
date: 2026-06-12
last_updated: 2026-06-22
category: docs/solutions/tooling-decisions
module: spec-first
problem_type: tooling_decision
component: tooling
severity: medium
applies_when:
  - 评估 graphify(project-graph provider)在 spec-first 中的可用性、消费方式或 readiness 信号
  - 计划把 project-graph 候选用于 docs/方案文档导航或语义检索
  - 设计 mcp-setup 对 provider 能力的探测/暴露逻辑
tags: [graphify, project-graph, provider-consumption, mcp-setup, code-graph, recall]
domain: project-graph provider consumption
pattern: Graphify query is weak orientation; use explain/path for named graph navigation and confirm from source
rejected_alternatives:
  - "Treating query_verified=true as semantic recall confidence: query probe only proves CLI/artifact liveness."
  - "Fixing Graphify query inside spec-first setup: provider algorithm and indexing limits are upstream-owned."
applicable_versions:
  - "spec-first v1.10.0"
  - "graphifyy 0.8.36-0.8.39 observed"
invalidation_condition: "Graphify query gains ranked semantic retrieval over docs and representative project-graph diagnostic cases reliably recall source contracts without high-frequency or self-reference seed hijack."
source_refs:
  - "docs/validation/project-graph/2026-06-15-relay-diagnostic.md"
  - "docs/contracts/project-graph-consumption.md"
  - "docs/contracts/knowledge/knowledge-harness.md"
  - "skills/spec-mcp-setup/scripts/providers/graphify.cjs"
  - "skills/spec-mcp-setup/scripts/providers/common.cjs"
  - "tests/unit/mcp-setup-providers.test.js"
---

# Graphify 命令可靠性分化:query 弱定向、explain/path 可靠、脚本索引覆盖需实测

> 日期:2026-06-12
> 类型:solution(provider 能力画像 + 消费/setup 边界判断,供后续 plan/work/mcp-setup 检索,避免重复评估)
> 触发:评估"query/explain 不可用,能否在 mcp-setup 彻底解决",经只读运行时实测裁决
> 证据来源:graphify v0.8.36 与 v0.8.39 只读实测(query/explain/path/--help)+ graph.json 节点统计 + 源码读取(本仓库,HEAD `5cf92508`)

---

## Context

评估 graphify 作为 project-graph provider 在 spec-first 中的实用价值时,实测发现其三个查询命令的可靠性显著分化。此前的消费协议设计(`docs/plans/2026-06-11-002-feat-project-graph-consumption-protocol-plan.md`)假设三种消费意图(broad orientation query / relationship path / concept explain)大致等价可用,实测推翻了这一前提。

2026-06-15 relay diagnostic 再次确认该结论:14 个样本中,`query` 对 docs/plan/contract 定位多数 noisy/miss,而 `explain` 对已索引具名 Bash 符号可用。该诊断只把 Graphify/CodeGraph 结果当作 `provider_untrusted` 候选,最终判断来自 source docs/tests/helper source。

## Guidance

把 graphify 当作**代码结构导航工具**,而非语义/文档检索工具:

- **`path "A" "B"` 可靠**——图最短路径,直接吃图结构,不经种子选择。可信。
- **`explain "X"` 可靠**——精确节点 label 匹配(含括号别名容错,`loadPluginManifest` 与 `loadPluginManifest()` 等价命中)。仅当目标节点未被索引时失败。
- **`query "<question>"` 不可靠**——`--help` 自陈是 "BFS traversal of graph.json for a question":分词→匹配 label 选种子→BFS depth=2,**无 embedding、无相关性排序**。种子被高频词/同名代码符号/自指节点劫持,召回不可信。
- **docs/方案散文导航直接放弃**——用 `rg`/直读 source,不指望 graphify。

mcp-setup 对此**只做诚实暴露,不修 provider**:`query_verified` fact 仅证 CLI/artifact liveness(命令能跑),不证 query 召回可信;renderer 在 `query_verified=false` 的 advisory 里引导可靠用法(`explain`/`path`)。不在 setup 修 graphify 检索算法或 extractor,不加机械索引盲区检测(避免仓库特定知识泄漏 + 每次 verify 告警疲劳)。

## Why This Matters

- 避免后续 plan/work 反复重新评估"graphify 能不能用于检索/docs 导航"——答案已实测固定。
- 防止把 `query_verified=true` 误读为"query 召回可信",从而基于无语义 BFS 的劫持召回做结论。
- 锚定 mcp-setup 的角色边界:provider 内部缺陷(检索算法、文件类型覆盖)归 provider 上游,spec-first 只产诚实 readiness facts(Scripts prepare, LLM decides;不拥有 provider 生命周期)。
- 为挂起的 project-graph 消费协议提供前提判断:协议价值押在"图谱能给有用候选"上,而 docs 召回结构性失败 + query 不可靠,使协议本体应长期挂起直到召回可治或定位收窄到 `explain`/`path`。

## When to Apply

- 有人提议用 graphify `query` 做语义检索或 docs/方案导航 → 引用本文默认否决,改用 `explain`/`path` 或 `rg`/直读。
- 有人想在 mcp-setup 里"修好"query/explain 召回 → 引用本文:根因在 provider 内部,不在 setup 解决;份内事是诚实暴露。
- 重新评估 project-graph 消费协议(2026-06-11-002)是否解冻 → 先复跑召回验证(代表性 domain 查询能否召回关键 `docs/contracts/*.md` 散文),green 才解冻。

## Examples

实测证据(graphify v0.8.36,本仓库):

- **query 种子劫持**:`query "project graph consumption candidate evidence boundary"` → 种子 `['Trust', 'candidate()', 'candidate()']`(撞同名函数),召回全是 `spec-app-consistency-audit/scripts/` 工具函数,零召回 `provider-readiness.md`。`query "verify graphify artifact ... probe"` → 种子含 `graphify`,召回被 CLAUDE.md/AGENTS.md 的 graphify 小节**自指**占据。
- **explain 可靠**:`explain "loadPluginManifest"` 与 `explain "loadPluginManifest()"` 均命中 `src/cli/plugin.js:106` 节点(degree 16)。
- **path 可靠**:`path "init.js" "doctor.js"` → `init.js --imports--> loadPluginManifest() <--imports-- doctor.js`(准确 import 关系)。
- **关键 `.cjs` module 覆盖仍需实测**:v0.8.36 当时观察到 `graph.json` 中 `.cjs` 出现 **0** 次。2026-06-22 用 graphify v0.8.39 与当时的兼容图产物复核后,`.cjs` 已非全局 0 覆盖(`nodes_with_cjs=1`),因此不能再概括为 extractor 完全不处理 `.cjs`。当前 Runtime Setup 已收敛到 `scripts/setup.cjs`、`scripts/lib/*.cjs` 与 `scripts/providers/*.cjs`;这些关键 module 是否被完整索引仍须按当前 provider artifact 实测,涉及其行为的结论必须直读源码确认。

## Source Refs

- 计划:`docs/plans/2026-06-12-004-fix-graphify-readiness-honesty-plan.md`(本诊断的承载计划,含完整 Direct Evidence)
- 前置:`docs/plans/2026-06-12-002-fix-graphify-runtime-visibility-plan.md`(completed,让 graphify runtime-visible)
- 挂起:`docs/plans/2026-06-11-002-feat-project-graph-consumption-protocol-plan.md`(消费协议,等召回解冻)
- 源码:`skills/spec-mcp-setup/scripts/providers/graphify.cjs`、`skills/spec-mcp-setup/scripts/providers/common.cjs`、`tests/unit/mcp-setup-providers.test.js`
