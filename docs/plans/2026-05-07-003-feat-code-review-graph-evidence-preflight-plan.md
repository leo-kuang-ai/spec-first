---
title: feat: 为 spec-code-review 增加 code-review-graph evidence preflight
type: feat
status: completed
date: 2026-05-07
spec_id: 2026-05-07-003-code-review-graph-evidence-preflight
target_repo: spec-first
origin: "微信文章：Code Review Graph 完整安装与最佳实践指南；用户请求：是否应在 code-review skill 默认调用 code-review-graph"
---

# feat: 为 spec-code-review 增加 code-review-graph evidence preflight

## 概览

本计划把 `code-review-graph` 在 `spec-code-review` 中的使用从“可选 fallback 证据来源”升级为“默认 review evidence preflight”。目标是吸收 `Code Review Graph 完整安装与最佳实践指南` 中关于 `get_minimal_context`、`detect_changes`、`get_impact_radius`、`get_review_context` 和 related tests 的最佳实践，同时保持 spec-first 的核心边界：`code-review-graph` 是 tool/provider，不是 agent；脚本和 provider 准备事实，reviewer personas 和 synthesis 负责语义判断。

本计划同时引入一个新的条件触发 reviewer：`spec-graph-impact-reviewer`。它不是 `code-review-graph` 的包装 agent，而是消费 `<graph-review-context>` 的“图谱影响面审查专家”，专门判断当前 diff 的调用者、执行流、影响半径和相关测试是否被漏审。

当前项目已经把 `code-review-graph` 建模为 `impact_context` provider，默认通过 `spec-graph-bootstrap` 编译 `.spec-first/graph/*` 与 `.spec-first/impact/*` readiness artifacts。缺口在于 `spec-code-review` 只在 Context Orientation 里提到 `code-review-graph`，尚未把变更影响、最小上下文、风险信号和相关测试建议变成 reviewer context 的稳定输入。

本计划同时补充一套无侵入刷新机制：刷新判断发生在 skill / workflow 节点流转边界，用户每次 Edit / Write / Bash 后不自动刷新。默认动作是 `check-only` freshness preflight；只有用户显式运行 `spec-graph-bootstrap`，或未来显式 opt-in `graph:refresh`，才写 durable graph artifacts。

## 目标

- 在 `spec-code-review` 中新增默认的 `Graph / Impact Evidence Preflight` 阶段。
- 默认读取 `.spec-first/graph/graph-facts.json` 与 `.spec-first/impact/bootstrap-impact-capabilities.json`。
- 在 artifact fresh 且 provider query-ready 时，把 `code-review-graph` 作为 primary impact evidence。
- 在 live `code-review-graph` MCP 可用时，执行有界只读查询：先 minimal，再按风险升级。
- 将 CRG evidence 注入 reviewer context，并在影响面信号足够强时条件触发 `spec-graph-impact-reviewer`。
- 在 review 输出 Coverage / Limitations 中说明 graph evidence 的 freshness、support level、fallback 和未覆盖风险。
- 保持 `report-only` 只读、`headless` 可控、`autofix` 不越权。
- 定义 workflow-level graph freshness preflight，默认不侵入用户操作流。
- 适配单仓单项目、单仓多模块、多仓 workspace 三种研发拓扑。
- 明确 durable refresh 仍由 `spec-graph-bootstrap` 负责，live probe 只作为 session-local evidence。

## 非目标

- 不把 `code-review-graph` 包装成 reviewer agent。
- 不把 `spec-graph-impact-reviewer` 做成 provider adapter、graph builder 或 CRG prompt wrapper。
- 不新增 `/review-delta`、`/review-pr` 或与 `spec-code-review` 并行的 review 入口。
- 不默认安装或启用 `code-review-graph serve` host MCP。
- 不在 `spec-code-review` 默认运行 `code-review-graph build`、`update` 或 `build_or_update_graph`。
- 不做用户操作级 `PostToolUse` 自动刷新，不在每次 Edit / Write / Bash 后刷新 GitNexus 或 code-review-graph。
- 不让普通 `spec-plan`、`spec-work`、`spec-debug` 静默运行 full graph refresh。
- 不让 CRG risk score 直接决定 finding 严重级别、autofix route 或 merge gate。
- 不手改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirrors。
- 不把 `.spec-first/impact/*` 做成任务状态机或 review 结论存储。

## 图谱就绪状态

- target_repo: `spec-first`
- status: `stale`
- source_revision: `052c94ba77ef4a5a5de9f98f2fb065a1e11e4c5d`
- current_revision: `052c94ba77ef4a5a5de9f98f2fb065a1e11e4c5d`
- stale: true
- primary_providers: `gitnexus`, `code-review-graph`
- degraded_providers: none in compiled provider status
- fallback_capabilities: `serena`, `ast-grep`, bounded direct repo reads
- runtime_mcp_evidence: 本次 docs-only planning change 未使用 live MCP 证据
- confidence: medium
- limitations: compiled graph facts 显示 `impact_context=true`，但当前 dirty worktree hash 与 compiled `worktree_status_hash` 不一致；实施时必须把 compiled graph artifacts 视为 stale，直到 `spec-graph-bootstrap` 刷新，或当前会话收集到 session-local live evidence。

## 文章解读

文章把 `code-review-graph` 定位为 code review context engine，而不是普通 review prompt。对 spec-first 有价值的模式是：

- graph construction 和 provider readiness 保持在 review judgment layer 之外；
- 先用 minimal context 控制 token 成本；
- 在形成 review claim 前，对当前 diff 执行 `detect_changes`；
- 只有风险或不确定性足够高时，才升级到 broader impact、affected flows、callers 或 tests；
- 让 AI reviewer 消费 graph facts 作为证据，而不是把 graph facts 当作最终判断。

逐个读取 `code-review-graph/skills` 和 `code_review_graph/prompts.py` 后，可借鉴内容应拆成两层：

| 来源 | 可借鉴点 | spec-first 落点 |
| --- | --- | --- |
| `review-changes` | `detect_changes -> get_affected_flows -> tests_for -> get_impact_radius` 的 review evidence 顺序 | U2 的 CRG evidence ladder；U3b 的 graph-impact reviewer 问题清单 |
| `review-delta` | changed nodes + 2-hop neighbors，只发送 changed + impacted context | `<graph-review-context>` 的 bounded context scope |
| `review-pr` | base-aware diff、PR 级 impact radius、high-risk callers、missing tests | `base:<ref>` review 场景和 PR/branch review 的影响面校准 |
| `prompts.py` | minimal-first、最多少量 tool calls、只对 high-risk items 升级 | mode-sensitive bounded live probe 与 reviewer 触发条件 |
| `pre_merge_check` prompt | risk score + affected flows + tests_for + dead code 检查 | 作为 pre-merge evidence recipe，不作为独立 merge gate |

这些能力不直接形成 `spec-code-review` 的入口，也不直接输出最终 review 结论。它们用于准备 evidence，并由 `spec-graph-impact-reviewer` 解释影响面，由 synthesis 合并、校准和裁决。

不应直接照搬到 spec-first 的部分：

- Claude-only 的 `/build-graph`、`/review-delta`、`/review-pr` 入口；
- 每次 write 后自动修改 graph state 的默认 `PostToolUse` hooks；
- 把 always-on live MCP server 当作 baseline requirement；
- 与 `spec-code-review` 竞争入口的 CRG prompts。

## 关键决策

- D1. 增加 preflight stage，并允许新增条件触发的 graph-impact reviewer。`code-review-graph` 仍然是 provider/tool；orchestrator 收集它的 evidence；`spec-graph-impact-reviewer` 只消费 evidence 并做语义审查。
- D2. 默认先读取 compiled artifacts。`spec-code-review` 在可选 live MCP probe 前读取 canonical graph readiness 和 impact capability artifacts。
- D3. Live MCP evidence 是 session-local。成功的 live CRG 调用不会更新 `.spec-first/graph/*`、`.spec-first/impact/*` 或 `query_ready`。
- D4. Review 阶段默认不修改 graph state。Review 可以报告 stale graph facts 并建议 `spec-graph-bootstrap`，但不在 `report-only` 或普通 review preflight 中运行 build/update。
- D5. 使用 evidence ladder：先 minimal context，必要时才升级 impact/radius。
- D6. 把 evidence 作为独立 block 传给 reviewers。Reviewer personas 可以使用、质疑或用 direct reads 补证据。
- D7. Synthesis 负责 severity 和 routing。CRG risk score 是输入，不是最终 finding。
- D8. Refresh hook 位于 workflow 节点边界，不位于用户操作边界。它是 preflight，不是后台 daemon。
- D9. 默认 refresh policy 是 `check-only`。Full durable refresh 仍然通过 `spec-graph-bootstrap` 显式执行。
- D10. Refresh granularity 跟随 selected Git repo root。Monorepo modules 是 evidence focus，不是独立 artifact owner；parent workspace summaries 只作 advisory。
- D11. 未来如果引入自动 refresh，必须 opt-in、mode-sensitive，并且在 `report-only` 中禁用。
- D12. `spec-graph-impact-reviewer` 是默认评估、条件派发，不是 always-on。`spec-code-review` 默认运行 graph evidence preflight，并默认判断是否需要该 reviewer；只有 graph evidence 显示 medium/high risk、多 callers、多 affected flows、related tests gaps、public/shared symbol change、inheritance/implementation 影响或 rename/move 风险时才进入 reviewer team。

## 刷新机制设计

刷新机制应设计为 workflow-level preflight：

```text
GraphRefreshPreflight
  1. 只读 freshness check
  2. 分类 graph state
  3. 决定 evidence mode：compiled artifact | live probe | fallback | refresh recommendation
  4. 仅在 workflow/mode 允许时支持显式 refresh
  5. 将 graph_evidence_status 传入当前 workflow context
```

它不应成为 host-level hook：

```text
用户 Edit / Write / Bash
  -> 不自动刷新 GitNexus
  -> 不自动刷新 code-review-graph
  -> 不静默写入 .spec-first/*
```

默认行为：

```text
进入 workflow
  -> 检查 freshness
  -> fresh 时消费 artifacts
  -> 有用且可用时执行 live probe
  -> stale/degraded/unavailable 时 fallback
  -> durable readiness 重要时建议 spec-graph-bootstrap
```

### 刷新层级

| 层级 | 名称 | 默认执行 | 写 durable artifacts | 负责方 |
| --- | --- | ---: | ---: | --- |
| L0 | Freshness Check | 是 | 否 | graph-aware workflows |
| L1 | Session-local Live Probe | 有用且可用时 | 否 | 当前 LLM session |
| L2 | Review Evidence Preflight | `spec-code-review` 默认执行 | 默认否 | `spec-code-review` orchestrator |
| L3 | Full Graph Bootstrap Refresh | 显式执行 | 是 | `spec-graph-bootstrap` |

L0/L1/L2 是 evidence collection。L3 是 canonical graph readiness refresh。

### 状态词表

本节是 `spec-code-review` 的 consumer-facing preflight vocabulary，不是新的 graph governance source of truth。Canonical vocabulary、compiled/live/fallback 合并语义、freshness comparison 和 provider ownership 由 `docs/contracts/graph-evidence-policy.md`（见 `2026-05-07-002-feat-gitnexus-evidence-governance-plan.md`）定义。若该 policy 尚未完成 002 U1 gap closure（尤其是 `readiness_status` / `evidence_class` / `scope_requirement` 分层、`worktree_status_hash` 和 contract tests），先完成 002 U1；本计划不得新增并列的 `graph-refresh-preflight` policy 来覆盖或重定义 002。

所有 downstream workflows 使用同一套 policy 派生状态词表：

- `fresh`: compiled graph facts 与当前 repo snapshot 匹配。
- `stale`: artifact 存在，但 revision 或 dirty fingerprint 不匹配。
- `dirty-uncertain`: worktree 为 dirty，且 fingerprint comparison 不可用或不匹配。
- `degraded-fallback`: provider 失败或仅部分可用，但 fallback evidence 存在。
- `setup-ready-bootstrap-required`: setup 已 ready，但 graph-bootstrap 尚未产出 query-ready artifacts。
- `unavailable`: required artifacts 缺失。
- `blocked`: provider command 或环境被阻塞，并带有具体 `reason_code`。

Downstream workflows 应把这些状态当作 evidence context，而不是自动 stop/go 状态机。`fresh` / `dirty-uncertain` / `setup-ready-bootstrap-required` 是 review/preflight 层的 display labels，必须映射回 002 policy 中的 `readiness_status`（如 `primary`、`stale`、`setup-not-ready`、`degraded-fallback`、`unavailable`、`blocked`），不能成为第二套 contract enum。

### 刷新决策矩阵

| 状态 | `spec-plan` / `spec-work` / `spec-debug` | `spec-code-review` interactive | `spec-code-review` report-only/headless |
| --- | --- | --- | --- |
| `fresh` | 使用 compiled artifacts | 使用 compiled artifacts + CRG preflight | 只读使用 compiled artifacts |
| `stale` | 披露 limitation，使用 live probe 或 direct reads | 收集 read-only CRG evidence；需要高置信时建议 `spec-graph-bootstrap` | 不刷新；携带 limitation |
| `dirty-uncertain` | 只作 advisory，用 direct reads 验证 | CRG 聚焦当前 diff；GitNexus 只作历史指针 | 不刷新；携带 limitation |
| `degraded-fallback` | 使用 Serena / ast-grep / direct reads | 在 reviewer context 中标记 degraded | 在 Coverage 中标记 degraded |
| `setup-ready-bootstrap-required` | 建议 `spec-graph-bootstrap` | 建议 `spec-graph-bootstrap`；review 可继续则继续 | 不刷新；报告 limitation |
| `unavailable` | 继续 direct reads | 无 graph evidence 时继续 review | 无 graph evidence 时继续 report-only |
| `blocked` | 报告 `reason_code` 并 fallback | 报告 `reason_code` 并 fallback | 报告 `reason_code` 并 fallback |

## 拓扑适配

Refresh 和 evidence ownership 必须跟随 Git repo 边界，不能跟随偶然的 shell cwd。

### 单仓单项目

形态：

```text
repo-a/
  .git/
  .spec-first/
```

规则：

- `.spec-first/config/*`、`.spec-first/graph/*`、`.spec-first/impact/*` 和 `.spec-first/providers/*` 属于 repo root。
- `spec-graph-bootstrap` 刷新该 repo 的 durable graph readiness。
- Downstream workflows 读取该 repo 的 graph facts 并分类 freshness。

### 单仓多模块

形态：

```text
repo-a/
  .git/
  backend/
  frontend/
  mobile/
  .spec-first/
```

规则：

- Canonical graph artifacts 仍然属于 repo root。
- 不创建 `backend/.spec-first` 或 `frontend/.spec-first` 作为 readiness truth。
- Preflight 可以从 changed files 记录 `module_scope`，但 freshness 仍按 repo-level 判断。
- GitNexus 可提供跨 module global knowledge；CRG 可把 review evidence 聚焦到 changed module/files。

### 多仓 workspace

形态：

```text
workspace/
  order-service/.git/
  payment-service/.git/
  web-app/.git/
  .spec-first/workspace/
```

规则：

- 每个 child repo 拥有自己的 `.spec-first/config/*`、`.spec-first/graph/*`、`.spec-first/impact/*` 和 `.spec-first/providers/*`。
- Parent workspace 的 `.spec-first/workspace/*` 只作 advisory。
- 只读 orientation 可以使用 workspace graph target summaries 查找 candidate child repos。
- 任何 write、test、changelog、autofix 或 commit 路径都必须有 explicit `target_repo` 或 per-child scope。
- `spec-code-review` 按 child repo 分组 changed files，并为每个 child repo 创建一个 graph-review-context。
- 默认不刷新所有 child repos；只有显式 maintenance 请求才使用 `spec-graph-bootstrap --all-repos`。

统一原则：

```text
refresh granularity follows Git repo root;
evidence focus follows workflow scope;
semantic target choice belongs to user/LLM;
workspace summaries are advisory, not canonical truth.
```

## 推荐 review 流程

```text
spec-code-review
  Stage 1: 确定 diff scope
  Stage 1.5: Graph / Impact Evidence Preflight
    - 读取 graph-facts.json
    - 读取 bootstrap-impact-capabilities.json
    - 比较 source_revision 和 worktree_status_hash
    - 按 policy appendix 分类 graph evidence display label: fresh | stale | dirty-uncertain | degraded-fallback | setup-ready-bootstrap-required | unavailable | blocked
    - 如果 live CRG MCP 可用且当前 mode 允许 read-only probe:
        get_minimal_context
        detect_changes(detail_level=minimal)
        仅在必要时升级到 get_impact_radius / get_review_context
    - 创建 <graph-review-context>
  Stage 3/4: 选择并派发 reviewers
    - 将 <graph-review-context> 与 diff context 一起传入
    - 默认评估 spec-graph-impact-reviewer 是否需要派发
    - 如果 graph evidence 显示高影响面信号，条件触发 spec-graph-impact-reviewer
  Stage 5/6: 合并与报告
    - findings 仍然由 reviewers 负责
    - Coverage 说明 CRG evidence status 和 limitations
```

## 证据契约

`spec-code-review` 应生成一个 parent-owned evidence block，形态类似：

```xml
<graph-review-context>
provider: code-review-graph
artifact_status: <policy-derived display label mapped to policy readiness_status>
impact_radius_support: full | partial | none
review_support: full | partial | none
source_revision: <sha-or-null>
current_revision: <sha>
worktree_status_hash_match: true | false | unknown
live_mcp_evidence: unavailable | skipped | minimal | standard | failed
minimal_context: <bounded summary or omitted>
changed_symbols: <bounded list or omitted>
affected_flows: <bounded list or omitted>
related_tests: <bounded list or omitted>
risk_summary: <provider signal, not final severity>
graph_impact_reviewer_trigger: selected | not_selected | skipped
topology: single-repo | monorepo | multi-repo-child
module_scope: <bounded list or omitted>
limitations:
  - <limitation>
source_artifacts:
  - .spec-first/graph/graph-facts.json
  - .spec-first/impact/bootstrap-impact-capabilities.json
</graph-review-context>
```

这个 block 是 review-run evidence。除非未来 workflow 明确定义 durable artifact，否则它不是 canonical artifact。

## 模式矩阵

| Mode | CRG artifact read | Live CRG read-only probe | CRG build/update | 说明 |
| --- | ---: | ---: | ---: | --- |
| interactive | 是 | 可用且有用时 | 默认否 | stale 时可建议 `spec-graph-bootstrap`。 |
| report-only | 是 | 仅 read-only | 否 | 不得写 run artifacts 或 graph state。 |
| headless | 是 | 仅 bounded read-only | 否 | 在 structured output 中返回 limitations。 |
| autofix | 是 | 仅 bounded read-only | 否 | CRG evidence 可辅助 safe_auto routing，但不能授权 risky fixes。 |

可选 future flags 只能在默认 preflight 稳定后引入：

| Flag | 含义 | 约束 |
| --- | --- | --- |
| `graph:check-only` | 读取 artifacts 并分类 freshness | 默认行为 |
| `graph:live-only` | 允许 bounded live MCP probes，但不写 durable artifacts | 在 read-only 条件下适合 report-style flows |
| `graph:refresh` | review 前执行显式 refresh path | `report-only` 禁用；必须尊重 target repo 和 provider allowlists |
| `graph:skip` | 跳过 graph evidence preflight | 必须报告 Coverage limitation |

## 终审校准

终审结论：方案可进入实施，无 P0 / P1 阻断。最终架构口径如下：

```text
code-review-graph 仍是 impact_context provider
<graph-review-context> 是 review-run evidence
spec-graph-impact-reviewer 是默认评估、条件派发的影响面审查专家
spec-code-review synthesis 仍负责最终 severity / routing / verdict
```

该方案在全流程中的位置是：

```text
Codebase -> Graph -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
                                             ^       ^
                                             |       |
                                  CRG preflight   graph-impact reviewer
```

实施必须遵守以下门禁：

- 先实现 Graph / Impact Evidence Preflight，再实现 `spec-graph-impact-reviewer`。如果没有 parent-owned `<graph-review-context>`，不得先接入 reviewer。
- `spec-graph-impact-reviewer` 必须只读，frontmatter 不得包含 Write 权限；不得运行 `code-review-graph build`、`update` 或 `build_or_update_graph`。
- Reviewer selection 必须是默认评估、条件派发。不得因为 CRG 可用就每次派发 `spec-graph-impact-reviewer`。
- `spec-graph-impact-reviewer` 的 finding 必须经过二次验证：引用 diff、source、tests、bounded direct reads 或 `<graph-review-context>` 中的具体 evidence；不得只凭 CRG risk score 生成 finding。
- `stale`、`dirty-uncertain`、`degraded-fallback` 或 `unavailable` graph evidence 默认只能进入 Coverage limitation 或 `residual_risks`。除非 reviewer 用源码 / 测试 / direct reads 补足证据，否则不得制造高置信 finding。
- 任何新增 `graph:refresh` 行为必须晚于 U7 / U8，并保持 opt-in、mode-sensitive；`report-only` 中不得 refresh。
- 多仓 workspace 中，graph evidence focus 可以辅助 orientation，但 write、test、autofix、changelog 和 commit 仍必须有 explicit `target_repo` 或 per-child scope。

终审确认的主要收益：

- 减少“改动本身正确，但调用者 / downstream flow 被漏审”的 review 盲区。
- 让 related tests 建议从文件名猜测升级为 graph-backed evidence。
- 大 PR 可以优先审高影响文件和高风险 symbol，而不是平均读取所有文件。
- 保持 provider evidence、reviewer judgment 和 synthesis verdict 三层分离，避免把 graph risk score 当作自动 gate。

## 实施单元

**实施顺序校准（2026-05-10）：** 先完成 002 U1 policy gap closure，再执行本计划 U7。U7 的 policy appendix 是 U1/U2/U9 的前置 contract，不是后置文档整理。实施者必须先把 `Graph Evidence Preflight Appendix` 写入已分层的 `docs/contracts/graph-evidence-policy.md`，再修改 `skills/spec-code-review/SKILL.md` 定义 preflight stage；否则 `spec-code-review` 会先发明一套临时 enum，违背 002 policy single-source-of-truth。

### U1. 为 spec-code-review 增加图谱证据预检

文件：

- `skills/spec-code-review/SKILL.md`
- `tests/unit/spec-code-review-contracts.test.js`

变更：

- 在 diff scope detection 后、reviewer selection 前增加一个 stage。
- 定义 `.spec-first/graph/graph-facts.json` 和 `.spec-first/impact/bootstrap-impact-capabilities.json` 的 artifact reads。
- 要求使用 `source_revision`、`worktree_dirty` 和 `worktree_status_hash` 做 freshness comparison。
- 不在 `spec-code-review` 中定义新的 canonical enum；只引用 U7 policy appendix 的 display-label mapping。review/preflight 层可展示 `fresh`、`stale`、`dirty-uncertain`、`degraded-fallback`、`setup-ready-bootstrap-required`、`unavailable`、`blocked`，但必须映射回 002 policy 的 `readiness_status`（例如 `primary`、`stale`、`setup-not-ready`、`degraded-fallback`、`unavailable`、`blocked`）。
- 明确 stale artifacts 只能作为 historical readiness 引用，不能作为 current impact evidence。

测试：

- Contract test 断言 `spec-code-review` 提到两个 canonical artifacts。
- Contract test 断言 stale graph facts 不阻断 review。
- Contract test 断言 `spec-code-review` 引用 `docs/contracts/graph-evidence-policy.md` 的 `Graph Evidence Preflight Appendix`，且不把 `fresh | stale | degraded | unavailable` 写成第二套 canonical enum。
- Contract test 断言 live MCP evidence 是 session-local，不能更新 compiled readiness。
- Contract test 同步迁移当前负向断言：允许 `spec-code-review` 在 Coverage/Limitations 中建议 `spec-graph-bootstrap` 作为显式 durable refresh next action；仍禁止 `report-only` / ordinary preflight silent refresh，且禁止把 graph-bootstrap 当作 review 前自动执行步骤。

### U2. 定义 CRG 证据升级阶梯

文件：

- `skills/spec-code-review/SKILL.md`
- `tests/unit/spec-code-review-contracts.test.js`

变更：

- 增加默认 query order：
  - `get_minimal_context` 用于 compact review orientation；
  - `detect_changes(detail_level=minimal)` 用于 changed symbol / risk signal；
  - 只有风险、不确定性或 reviewer need 足够强时，才升级到 `get_impact_radius`、`get_review_context` 或 `query_graph(tests_for|callers_of)`。
- 将默认 live CRG calls 限制在 small bounded set。
- 明确 reviewers 有 concrete question 前，不做 broad graph exploration。

测试：

- Contract test 断言 minimal-first wording。
- Contract test 断言 escalation wording。
- Contract test 断言 CRG calls 有界且 read-only。

### U3. 将 graph-review-context 传给评审者

文件：

- `skills/spec-code-review/SKILL.md`
- `skills/spec-code-review/references/subagent-template.md`
- `tests/unit/spec-code-review-contracts.test.js`

变更：

- 将 `<graph-review-context>` 加入 shared review context bundle。
- 告诉 reviewers：CRG evidence 可以优先级化 inspection，但不定义 scope authority。
- 告诉 reviewers：创建 findings 前，高影响 CRG signals 必须用 diff、source、tests 或 direct reads 验证。
- 保持 persona JSON schema 不变，除非后续实施证明需要 dedicated evidence field。

测试：

- Contract test 断言 reviewer context 包含 graph-review-context。
- Contract test 断言 external tools 不替代 reviewer judgment。

### U3b. 新增 spec-graph-impact-reviewer 条件专家

文件：

- `agents/spec-graph-impact-reviewer.agent.md`
- `skills/spec-code-review/SKILL.md`
- `skills/spec-code-review/references/persona-catalog.md`
- `skills/spec-code-review/references/subagent-template.md`
- `tests/unit/spec-code-review-contracts.test.js`

变更：

- 新增 reviewer persona：`graph-impact`。
- 职责定义为“图谱影响面审查专家”，消费 `<graph-review-context>`，审查 callers、affected flows、impact radius、related tests 和 changed symbols 的 downstream 风险。
- 明确它不是 `code-review-graph` wrapper，不运行 build/update，不调用 CRG prompts，不刷新 graph state。
- 触发条件：
  - 默认每次 `spec-code-review` 都评估这些触发条件，但不默认派发该 reviewer；
  - `artifact_status=fresh` 或 live read-only CRG evidence 可用；
  - `risk_summary` 显示 medium/high；
  - changed symbols 有多个 callers/dependents；
  - `affected_flows` 非空，尤其是 user-facing 或 critical flows；
  - `related_tests` 显示 changed functions 缺少覆盖；
  - 改动涉及 public/shared symbol、exported API、inheritance/implementation relation、rename/move。
- 输出仍使用现有 findings schema：
  - `reviewer: "graph-impact"`；
  - findings 必须引用 diff/source/tests/direct reads 或 `<graph-review-context>` 中的具体 evidence；
  - 不允许只用 CRG risk score 作为 finding evidence；
  - stale/degraded graph evidence 只能进入 `residual_risks` 或 Coverage limitation，不能制造高置信 finding。

测试：

- Contract test 断言 persona catalog 包含 `graph-impact` 条件 reviewer。
- Contract test 断言 `spec-graph-impact-reviewer` 是 read-only agent，不包含 Write 权限。
- Contract test 断言 reviewer 禁止运行 graph build/update。
- Contract test 断言 CRG risk score 不得单独成为 finding。
- Contract test 断言 stale/degraded graph evidence 必须降级为 limitation 或 residual risk。

### U4. 更新综合判断与覆盖报告

文件：

- `skills/spec-code-review/SKILL.md`
- 可能涉及 `skills/spec-code-review/references/walkthrough.md`
- `tests/unit/spec-code-review-contracts.test.js`

变更：

- 增加 Coverage fields：
  - `code-review-graph: fresh | stale | dirty-uncertain | degraded-fallback | setup-ready-bootstrap-required | unavailable | blocked | skipped`（前 7 个是 policy-derived display labels，必须映射回 policy `readiness_status`；`skipped` 仅是 review coverage sentinel，表示本次未执行 graph preflight，不得写入 graph readiness enum）；
  - 是否使用 live CRG evidence；
  - impact support level；
  - related tests evidence status；
  - limitations 和 fallback source。
- 确保 findings 不只引用 CRG risk score 作为 evidence。
- 在 no-issue reviews 中仍报告 impact context 是否 unavailable 或 stale。

测试：

- Contract test 断言 coverage 说明 graph evidence limitations。
- Contract test 断言 CRG risk score 不会被单独当成 finding。
- Contract test 删除或重写现有“不出现 `spec-graph-bootstrap` / `spec-graph-bootstrap`”断言，改为断言该入口只出现在 explicit recommendation / next-action 语境中，不能出现在 automatic refresh 或 hard gate 语境中。

### U5. 保持 provider setup 与 bootstrap 边界稳定

文件：

- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-mcp-setup/mcp-tools.json`
- `skills/spec-graph-bootstrap/SKILL.md`
- `README.md`
- `README.zh-CN.md`

变更：

- 只有当当前 prose 对新的 downstream consumer behavior 产生误导时，才做文案更新。
- 保持 `code-review-graph.host_config_required=false`。
- 保持 optional live MCP server 是 explicit opt-in。
- 不把 `code-review-graph build/status` 移入 `spec-code-review`。

测试：

- 现有 `tests/unit/mcp-setup.sh`。
- 现有 `tests/unit/spec-graph-bootstrap.sh`。
- code-review plan 不应要求新的 setup 行为。

### U6. 文档化用户可见 Review 行为

文件：

- `docs/05-用户手册/04-workflows-artifacts-map.md`
- `docs/05-用户手册/13-代码图谱Provider作用域与差异化.md`
- 可能涉及 `docs/05-用户手册/02-核心概念.md`
- `tests/unit/user-manual-contracts.test.js`
- `CHANGELOG.md`

变更：

- 说明 `spec-code-review` 消费 graph readiness 和 impact capability artifacts。
- 明确 stale/degraded graph evidence 不阻断 review；它降低 confidence 并触发 fallback。
- 说明 CRG live MCP 是 optional enhancement，不是默认 install requirement。
- 在 preflight source 尚未落地前，用户手册必须使用 planned/recommended wording；不得把 `Graph / Impact Evidence Preflight` 或 `spec-graph-impact-reviewer` 写成当前默认行为。

测试：

- 如果 user manual contracts 覆盖 workflow artifact maps，更新 `tests/unit/user-manual-contracts.test.js`。
- `git diff --check`。

### U7. 扩展 002 graph evidence policy 的 preflight appendix

文件：

- `docs/contracts/graph-evidence-policy.md`
- `tests/unit/user-manual-contracts.test.js` 或新的 focused docs contract test

变更：

- **前置顺序**：本 unit 必须在 002 U1 policy gap closure 之后、003 U1/U2/U9 之前 land，或与 003 U1 同 PR 但在文档和测试上先建立 policy appendix。没有该 appendix 时，不得在 `spec-code-review` 中落地 preflight 状态词表。
- 在 002 policy 内追加 `Graph Evidence Preflight Appendix`，不新增并列 policy 文件。
- 定义 review/preflight display labels 到 002 `readiness_status` 的映射：`fresh → primary`，`dirty-uncertain → stale with dirty limitation`，`setup-ready-bootstrap-required → setup-not-ready`，其余按 policy `readiness_status` enum 直通。
- 定义默认 policy：`check-only`。
- 定义 interactive、report-only、headless、autofix 的 mode-sensitive constraints。
- 定义 single repo、monorepo、multi-repo parent workspace 的 topology behavior。
- 声明 durable refresh 仍由 `spec-graph-bootstrap` 负责。

测试：

- Contract assertions 覆盖 appendix 存在、display-label mapping、`check-only` default 和 `session-local evidence` boundary。
- Contract test 断言仓库中不存在新的 `docs/contracts/graph-refresh-preflight.md`，除非 002 policy 明确拆分并保留 single-source redirect。

### U8. 增加只读 freshness preflight projector

文件：

- Modify: `skills/spec-graph-bootstrap/scripts/resolve-workspace-graph-targets.sh`（如需抽取共享 classifier）
- Modify: `skills/spec-graph-bootstrap/scripts/resolve-workspace-graph-targets.ps1`（如需抽取共享 classifier）
- `skills/spec-graph-bootstrap/scripts/check-graph-freshness.sh`
- `skills/spec-graph-bootstrap/scripts/check-graph-freshness.ps1`
- `tests/unit/spec-graph-bootstrap.sh`
- 如果 PowerShell parity 在该处覆盖，则涉及 `tests/unit/mcp-setup-powershell-contracts.test.js`

变更：

- 不复制第二套 freshness classifier。当前 `resolve-workspace-graph-targets.{sh,ps1}` 已读取 `.spec-first/graph/graph-facts.json`、`.spec-first/impact/bootstrap-impact-capabilities.json`，并比较当前 `HEAD`、dirty status、`worktree_status_hash` 后输出 `primary` / `stale` / `dirty-uncertain` / `degraded-fallback` / `setup-ready-bootstrap-required` / `unavailable` 等状态；U8 必须复用该分类逻辑，或把它抽成 resolver 与 checker 共同调用的共享 helper。
- `check-graph-freshness.{sh,ps1}` 只能是 single-repo / review-preflight 视角的薄 projector：调用或复用 resolver classification，再把选定 repo 的结果投影为 `graph-evidence-preflight.v1`。
- 输出 `graph-evidence-preflight.v1` JSON；字段 contract 必须由 U7 policy appendix 定义。若新增独立 JSON schema，只能作为派生 validator，必须带 `$schema` / `$id`，并引用 policy appendix，不得重新定义 status 语义。
- 不运行 provider build/status/query commands。
- 不写 `.spec-first/*`。

测试：

- Fresh repo fixture 返回 `fresh`。
- Dirty hash mismatch 返回 `stale` 或 `dirty-uncertain`。
- Missing artifacts 返回 `unavailable`。
- Parent workspace fixture 返回 child candidates as advisory 或要求 target repo。
- Contract test 断言 checker 与 `resolve-workspace-graph-targets` 在同一 fixture 上的 readiness/display-label mapping 一致，防止 Bash/PowerShell/checker/resolver 四处漂移。

### U9. 将 preflight 接入 graph-aware workflows

文件：

- `skills/spec-plan/SKILL.md`
- `skills/spec-work/SKILL.md`
- `skills/spec-debug/SKILL.md`
- `skills/spec-code-review/SKILL.md`
- `skills/spec-work-beta/SKILL.md`
- 相关 `tests/unit/*-contracts.test.js`

变更：

- 在 plan/work/debug 中保持短描述：graph-aware orientation 前运行或消费 graph freshness preflight。
- 不让 preflight 扩大 scope。
- 保留 stale/degraded/unavailable facts 的现有 fallback 行为。
- 在 `spec-code-review` 中，用 preflight output 作为 `<graph-review-context>` 的基础。
- `spec-code-review` 可以建议 `spec-graph-bootstrap` 作为 explicit next action，但不得在 ordinary review、report-only 或 headless preflight 中自动运行 durable refresh。

测试：

- Contract tests 断言 `check-only` default 和 no silent refresh。
- Contract tests 断言 `report-only` remains read-only。
- Contract tests 断言 `spec-graph-bootstrap` / `spec-graph-bootstrap` 只允许出现在 recommendation 语境，不允许出现在 automatic execution 语境。

### U10. 支持三种拓扑且不新增 runtime roots

文件：

- `skills/spec-graph-bootstrap/scripts/check-graph-freshness.sh`
- `skills/spec-graph-bootstrap/scripts/check-graph-freshness.ps1`
- `docs/05-用户手册/08-三种开发模式.md`
- `docs/05-用户手册/13-代码图谱Provider作用域与差异化.md`
- `tests/unit/spec-graph-bootstrap.sh`

变更：

- Single repo：分类当前 repo artifacts。
- Monorepo：分类 repo root artifacts，并可从 changed files 报告 `module_scope`。
- Multi-repo parent：读取 advisory workspace summaries 和/或 child repo artifacts，但不做 semantic write target 选择。
- 任何 write-capable workflow 在使用 child repo artifacts 做 mutation decisions 前，必须有 explicit `target_repo`。

测试：

- Single repo fixture。
- Monorepo fixture，changed files 覆盖多个 modules。
- Multi-repo parent fixture，两个 child repos freshness states 不同。

### U11. Preflight 稳定后再加入 opt-in refresh policy

文件：

- `skills/spec-code-review/SKILL.md`
- 可能涉及 `skills/spec-graph-bootstrap/SKILL.md`
- 如果引入 flag，则增加 argument parsing contract tests

变更：

- 只有 U1-U10 稳定后，才考虑 `graph:refresh`、`graph:live-only`、`graph:skip`。
- 如引入 `graph:refresh`，必须路由到既有 graph-bootstrap refresh path 或明确安全的 provider allowlist path。
- 在 `mode:report-only` 中禁用 `graph:refresh`。
- 多仓 workspace 中要求 explicit target repo。
- Refresh failures 只降级 review evidence；它们本身不构成 findings。

测试：

- `mode:report-only graph:refresh` 被拒绝，或降级为 read-only 并给出 clear limitation。
- Multi-repo `graph:refresh` 缺少 `target_repo` 时以 scope error 停止。
- `graph:skip` 产生 Coverage limitation。

## 验证计划

实施时的聚焦验证：

- `npx jest tests/unit/spec-code-review-contracts.test.js --runInBand`
- user manual docs 变化时运行 `npx jest tests/unit/user-manual-contracts.test.js --runInBand`
- 只有 provider setup prose/contracts 变化时运行 `bash tests/unit/mcp-setup.sh`
- 只有 bootstrap provider contract 变化时运行 `bash tests/unit/spec-graph-bootstrap.sh`
- U8 新增 freshness projector 时运行 `bash -n skills/spec-graph-bootstrap/scripts/check-graph-freshness.sh` 和 `bash -n skills/spec-graph-bootstrap/scripts/resolve-workspace-graph-targets.sh`，并通过 `bash tests/unit/spec-graph-bootstrap.sh` 覆盖 fresh / stale / unavailable / parent-workspace fixtures，以及 checker/resolver 同 fixture 映射一致性。
- U8 触及 PowerShell projector 或 resolver 时运行对应 PowerShell parse/parity 验证（例如 `tests/unit/mcp-setup-powershell-contracts.test.js` 中的 checker/resolver contract，或等价 focused test）；如果当前环境缺少 `pwsh`，必须在 Coverage 中记录未运行原因，不能声称 PowerShell parity 通过。
- `npm run typecheck`
- `git diff --check`

运行时验证：

- 不通过编辑 generated runtime mirrors 验证。
- 如果 source changes 改变 installed runtime skill content，应在 source tests 通过后通过 `spec-first init --codex` / `spec-first init --claude` 重新生成。
- 如果 skill prose semantics 需要高于 contract tests 的行为信心，使用 fresh-source eval。

## 风险与缓解

- 风险：CRG evidence 被误认为最终 review judgment。
  - 缓解：明确它只是 evidence；synthesis 负责 severity、routing 和 findings。
- 风险：review 变慢或 token-heavy。
  - 缓解：minimal-first ladder 和 bounded escalation。
- 风险：stale graph facts 造成 false confidence。
  - 缓解：强制 freshness classification 和 Coverage limitations。
- 风险：report-only 意外修改 graph state。
  - 缓解：只读取 artifact 和 live read-only probes；不运行 build/update。
- 风险：新增 graph-impact reviewer 与 correctness/testing/api-contract/adversarial reviewer 重复。
  - 缓解：明确它只审查 graph-derived impact questions：callers、flows、blast radius、related tests、downstream symbol usage；单点逻辑、测试质量、API contract 和 failure scenario 仍归原 reviewer。
- 风险：graph-impact reviewer 被误解为 CRG provider adapter。
  - 缓解：agent 不运行 build/update，不刷新 graph state，不调用 CRG prompts；它只消费 parent-owned `<graph-review-context>` 并做语义判断。
- 风险：双宿主行为向 Claude-only hooks 漂移。
  - 缓解：保持 live MCP optional，避免 Claude-specific `/review-delta` entrypoints。

## 成功标准

- `spec-code-review` 有明确命名的 Graph / Impact Evidence Preflight stage。
- 方案保持 `code-review-graph` 是 `impact_context` provider，而不是 agent。
- `spec-code-review` 有条件触发的 `spec-graph-impact-reviewer`，用于解释 graph evidence 的调用者、执行流、影响半径和相关测试风险。
- Reviewer context 在可用时包含 graph evidence，在不可用时包含 limitations。
- Review 输出报告 CRG coverage/freshness，同时不阻断无关 review work。
- `report-only` 保持 read-only。
- 不直接编辑 generated runtime mirrors。
- 聚焦 contract tests 锁定新行为。

## 交接

推荐下一步 workflow：

- `spec-work`：按本计划实施 `spec-code-review` source 和 contract-test changes。

实施者应先完成 002 U1 policy gap closure；随后执行本计划 U7，建立 shared policy appendix；再执行 U1 和 U2，把 preflight stage 与 CRG evidence ladder 作为 policy consumer 落到 `spec-code-review`；再通过 U3 把 evidence 串入 reviewer context，通过 U3b 新增 `spec-graph-impact-reviewer` 作为条件消费者，最后通过 U4 把 reporting 和 Coverage 收口。U5 默认应保持 no-op，除非实施时发现当前 setup/bootstrap docs 会误导新的 downstream behavior。

在加入任何 opt-in refresh behavior 前，必须先完成 002 U1 gap closure，并实现 003 U7 和 U8。项目应先获得共享的 policy appendix 与复用现有 classifier 的 read-only freshness projector，再允许任何 workflow 做 refresh decisions。这样可以保持当前 workflow structure 不被侵入，同时让 graph evidence freshness 显式化。
