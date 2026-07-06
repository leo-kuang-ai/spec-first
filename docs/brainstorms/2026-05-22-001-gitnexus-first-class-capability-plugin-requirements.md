---
date: 2026-05-22
topic: gitnexus-first-class-capability-plugin
spec_id: 2026-05-22-001-gitnexus-first-class-capability-plugin
---

# GitNexus First-Class Capability Plugin 需求

## Summary

本需求将 GitNexus 从“graph readiness 产物来源”升级为 spec-first 的一等代码智能增强插件：保留 GitNexus 原生能力面，同时用轻量能力协议优先接入 `spec-plan`。首阶段让技术方案阶段默认获得代码图谱证据、影响面提示、复用候选和证据限制说明；`spec-work`、`spec-code-review`、`spec-debug` 后续可复用同一 evidence posture，但不作为 v1 硬验收面。

---

## Problem Frame

当前 GitNexus 集成已经能通过 setup/bootstrap 产出 readiness facts、workspace advisory facts 和 canonical graph artifacts，但用户在真实多仓 workspace 中遇到一个关键体验问题：workflow 更容易看到“是否 ready / 是否 dirty blocked / 生成了哪些 artifact”，却不容易自然使用 GitNexus 自带的代码理解能力。

这会把 GitNexus 压缩成一个 readiness compiler 的输入源，导致它的核心价值被稀释：执行流查询、符号上下文、影响面分析、API route 消费关系、shape check、多仓 group 查询和 Cypher 等能力没有成为 Plan 阶段的默认推理输入。结果是最关键的技术方案阶段仍可能靠局部读码和模型猜测做决定；一旦方案错了，后续 task、work、review 都会沿着错误方向执行。

目标不是让 GitNexus 替代源码阅读、测试或 LLM 架构判断，而是让它作为 spec-first 的代码智能增强层提供更好的证据输入。脚本继续负责 readiness、freshness、路径、schema 和 artifact facts；LLM workflow 负责判断哪些 GitNexus 证据与当前任务相关，并把限制写进计划。

---

## Actors

- A1. Developer: 在单仓或多仓 workspace 中使用 spec-first，希望技术方案基于真实代码结构、执行流和影响面，而不是靠猜测。
- A2. `spec-plan`: 技术方案生成者，是首个一等消费 GitNexus capability 的 workflow。
- A3. GitNexus capability plugin: 暴露 GitNexus 原生代码智能能力，并提供 freshness / availability / limitation evidence。
- A4. Generic Code Intelligence Plugin protocol: spec-first 内部的轻量能力协议，允许未来接入其他代码智能 provider，但不得压平 GitNexus 原生能力。
- A5. `spec-graph-bootstrap`: durable graph readiness compiler，负责 provider refresh、canonical facts 和 workspace advisory facts。
- A6. Downstream workflows: 后续 `spec-work`、`spec-code-review`、`spec-debug` 等消费者，可逐步复用同一能力协议。
- A7. `spec-mcp-setup`: required harness runtime setup，负责安装/配置 MCP、helper、provider projection 和 setup-owned capability facts。

---

## Key Flows

- F1. Plan lightweight intelligence probe
  - **Trigger:** Developer 进入 `spec-plan`，任务涉及代码、架构、API、跨模块、测试或多仓判断。
  - **Actors:** A1, A2, A3, A4
  - **Steps:** Plan 读取已有 readiness / freshness facts；探测 GitNexus capability 是否 query-ready 或可作为 session-local evidence；判断是否需要 deep dive；记录可用能力、capability status、evidence grade、freshness state、限制和候选目标。
  - **Outcome:** 每个有代码影响的技术方案都有最低成本的 GitNexus evidence posture，不再默认跳过图谱能力。
  - **Covered by:** R4, R5, R8

- F2. Conditional deep dive for high-risk plans
  - **Trigger:** 任务出现跨模块、跨仓、API surface、执行流、复用、影响面、测试选择或用户显式要求 graph evidence 的信号。
  - **Actors:** A2, A3, A4
  - **Steps:** Plan 按任务目标调用 GitNexus 原生能力，如 execution-flow search、symbol context、impact analysis、route/API impact、shape check、tool map、Cypher 或 workspace group query；再结合源码读取验证关键结论。
  - **Outcome:** 技术方案中的 implementation units 能说明图谱证据、影响面、可复用模式、需要补读的源码和测试建议。
  - **Covered by:** R6, R7, R9

- F3. Degraded but non-blocking planning
  - **Trigger:** GitNexus unavailable、stale、dirty-advisory、query-unverified 或当前 workspace 没有可用 group readiness。
  - **Actors:** A1, A2, A3, A5
  - **Steps:** Plan 继续执行；明确 capability status、evidence grade、freshness state 和 limitations；改用 direct source reads、ast-grep、code-review-graph 或 bounded per-repo fallback；对 graph-heavy 方案加高可见度 warning。
  - **Outcome:** Plan 不因 GitNexus 临时不可用而硬阻断，但不能把缺失图谱证据伪装成已验证事实。
  - **Covered by:** R10, R11, R12, R13

- F4. Durable refresh remains explicit
  - **Trigger:** Developer 运行 `spec-graph-bootstrap` 或 workflow 明确进入 graph readiness refresh。
  - **Actors:** A1, A3, A5
  - **Steps:** Bootstrap 继续负责编译 durable readiness、provider status、canonical artifacts 和 workspace advisory facts；普通 Plan 不静默刷新 provider，也不静默执行 group sync。
  - **Outcome:** GitNexus 能力增强不破坏现有 source/runtime/provider 边界，dirty-source-blocked 只表示 durable refresh 受限，不等同于 GitNexus query 完全不可用。
  - **Covered by:** R11, R13, R14, R15

- F5. Setup-owned capability projection
  - **Trigger:** Developer 运行 `spec-mcp-setup` 或 setup 在 repo / parent workspace 中刷新 required harness runtime。
  - **Actors:** A1, A3, A7
  - **Steps:** Setup 配置 GitNexus host MCP、warm provider package、写入 setup-owned provider/capability facts 和 handoff guidance；它不运行 GitNexus query/analyze/status，也不生成 Plan evidence。
  - **Outcome:** 下游 Plan 能知道 GitNexus 作为 live capability 可用或需要新会话/graph bootstrap，但 setup 不越界成为代码智能查询执行器。
  - **Covered by:** R21, R22, R23, R24, R25, R26

- F6. Multi-repo workspace planning evidence
  - **Trigger:** Developer 在包含多个独立 child Git repos 的 parent workspace 中请求技术方案、跨仓影响分析或只读代码理解。
  - **Actors:** A1, A2, A3, A5
  - **Steps:** Plan 先读取 parent workspace advisory facts 和 GitNexus registry / group live evidence；group-ready 时可用 group selector 做 read-only orientation；group-missing / group-sync-required 时降级到 bounded registry / per-repo fan-out；最终写入或测试前必须落到明确 target repo / per-child scope。
  - **Outcome:** Multi Repo Workspace 使用 GitNexus 的 per-repo index / global registry 主路径，并把 group mode 作为增强层而非硬前提。
  - **Covered by:** R27, R28, R29, R30, R31, R32

---

## Requirements

**Plugin Boundary**

- R1. GitNexus 必须作为 spec-first 的一等 capability enhancement plugin 集成，而不是只作为 `spec-graph-bootstrap` 的 readiness 输入或 artifact 生产者。
- R2. 集成必须保留 GitNexus 原生能力面，包括 execution-flow query、symbol context、impact analysis、route map、API impact、shape check、Cypher、tool map、repo registry 和 workspace group 能力；spec-first 可以路由和标注证据等级，但不得把这些能力压平成单一 ready / not-ready 字段。
- R3. spec-first 可以定义 Generic Code Intelligence Plugin protocol，但该 protocol 必须是轻量能力枚举和证据 envelope；它不得成为隐藏 GitNexus 原生命令、限制高级查询或把所有 provider 取最小公分母的抽象层。
- R4. GitNexus evidence 不拥有 semantic authority：它提供可追溯证据、候选关系和影响面信号；源码、测试、canonical facts 与 LLM 判断仍是最终方案依据。

**Plan-First Consumption**

- R5. `spec-plan` 必须成为第一阶段首个一等消费者：凡计划涉及代码实现、架构、API、跨模块、跨仓、数据流、执行流、测试或 review 风险，都应先做 lightweight GitNexus capability/readiness/context probe。
- R6. Lightweight probe 必须产出 plan 可消费的 evidence posture，至少表达：是否建议 deep dive、触发原因、可用 GitNexus capabilities、capability status、evidence grade、freshness state、candidate refs、limitations、fallback posture，以及这些字段来自哪些 existing contract/source fields。
- R7. 当出现 graph-heavy 信号时，Plan 必须执行 conditional deep dive；信号包括跨模块/跨仓风险、现有执行流可能存在、API surface 变更、共享符号或公共契约变更、复用候选不明、测试选择不明、影响面不确定或用户显式要求 GitNexus。
- R8. Deep dive 必须优先选择与任务匹配的 GitNexus 原生能力，而不是只读取 canonical readiness artifacts；例如 API 变更优先 route/API impact，符号重构优先 context/impact，复用探索优先 query/context，复杂结构问题可使用 Cypher。
- R9. Plan 输出必须保留现有 `spec-plan` 的 `## Graph Readiness` block 字段语义，并在其后增加 `Graph / GitNexus Evidence` 或等价相邻章节；不得把 readiness 字段改造成影响分析字段。GitNexus evidence 章节至少包含：`provider`、`native_tool_or_resource`、`repo_scope`、`capability_status`、`evidence_grade`、`freshness_state`、`source_contract_fields`、`source_reads_required`、`impact_on_plan`；说明 capabilities_used、关键发现、限制，以及这些证据如何影响方案信心。
- R10. Plan 的 implementation units 必须能引用图谱证据对工作拆分产生的影响：impacted surfaces、reuse references、risk hotspots、test candidates、unknowns 和 fallback reads。

**Freshness And Degraded Mode**

- R11. GitNexus unavailable、query-unverified、stale 或 dirty-advisory 时，Plan 默认继续，但必须强制披露 limitations；对于 graph-heavy 任务，必须提示方案信心下降并扩大 direct source reads / ast-grep / code-review-graph fallback。
- R12. dirty worktree 不应被解释为“必须全部提交后才能计划”。它只影响 durable provider refresh 和 source_revision 精确保证；已有 query-ready index 仍可作为 prior evidence 使用，但必须标注 stale 或 dirty-advisory，并用当前源码读取验证关键点。
- R13. 普通 workflow 不得静默运行 provider refresh、GitNexus group sync 或其他可能改变 durable provider state 的命令；这些动作必须通过 `spec-graph-bootstrap`、明确 user intent 或后续专门 workflow 执行。
- R14. Evidence envelope 必须区分三轴：`capability_status`（available/partial/unavailable/mutation-gated）、`evidence_grade`（primary/session-local/advisory/fallback）、`freshness_state`（fresh/stale/dirty-advisory/query-unverified）；避免把 provider 可用性、证据可信度、refresh eligibility、query usability 和 index 新鲜度混为一谈（见附录 A）。这些字段是 Plan 输出 envelope，不是新的 canonical readiness truth，必须从 `docs/contracts/graph-evidence-policy.md`、`docs/contracts/workspace-gitnexus-consumption.md`、setup projection、provider status 或 session-local live MCP evidence 派生。

**Evidence Contract Compatibility**

- R14a. `capability_status` 只表达当前 capability 是否可被本轮 workflow 使用；它不得替代 `workspace-gitnexus-consumption.md` 中的 `refresh_eligibility`、`index_snapshot`、`query_usability`，也不得覆盖 `spec-plan` 现有 `Graph Readiness.status`。
- R14b. `evidence_grade` 必须映射到 `graph-evidence-policy.md` 的证据等级（含 Plan 层别名）：`primary` 是 `confirmed` 的 Plan 别名，对应已验证 fresh compiled/provider evidence；`session-local` 对应当前会话 live MCP/CLI 结果；`advisory` 对应 stale/partial/definitions-only/pointer；`fallback` 是 Plan 专用 posture 标签，表示切换为 direct source reads、ast-grep、git diff 或 code-review-graph，对应 `advisory`/`stale` 降级后的行为结果，不是独立证据等级——当 fallback 来自直接源码或测试时，源码/测试事实本身仍可作为 `confirmed`/`primary` evidence。别名定义见 `docs/contracts/graph-evidence-policy.md`。
- R14c. `freshness_state` 必须从 `source_revision`、`worktree_dirty`、`worktree_status_hash`、provider fingerprint、`query_ready`、`last_indexed_commit`、workspace `index_snapshot` / `query_usability` 等既有字段推导。Plan 不得把这些推导结果写回 `.spec-first/graph/*`、`.spec-first/providers/*`、`.spec-first/impact/*` 或 `.spec-first/workspace/*`。

**Graph Bootstrap Relationship**

- R15. `spec-mcp-setup` 继续只负责 required harness runtime、MCP/helper/config/ledger readiness，不运行 provider analyze，不替 Plan 做语义判断。
- R16. `spec-graph-bootstrap` 继续只负责编译 durable provider readiness、canonical graph facts、raw/normalized provider pointers 和 workspace advisory facts；它不决定某个技术方案应该如何用 GitNexus 证据。
- R17. GitNexus plugin 必须能同时消费 durable bootstrap facts 和 session-local MCP evidence；durable facts 用于 freshness / readiness / provenance，session-local evidence 用于本轮 Plan 的具体代码智能查询。
- R18. canonical artifacts 仍然是下游 workflow 的标准入口，但不能成为唯一入口；当 GitNexus 原生能力可用时，Plan 应能越过 summary artifact 使用更精确的 native query，并在输出中说明证据来源。

**Downstream Adoption**

- R19. 第一阶段只要求 `spec-plan` 深度接入；`spec-work`、`spec-code-review`、`spec-debug` 后续逐步接入同一能力协议，不要求一次性全 workflow 改造。
- R20. Downstream workflows 消费 GitNexus evidence 时必须保持 source-first：图谱发现用于缩小读码范围、发现影响面和提升计划质量，不能替代直接读取目标源码、运行测试或人工确认高风险决策。

**Mutation Capability Boundary**

- R-MUT1. mutation-capable capability（`workspace_group_sync`、`symbol_rename`）默认不得由 Plan 自动执行；Work 或后续 maintenance workflow 只能在显式用户授权、preview 确认、target_repo / group scope 明确后执行。若 provider 原生支持 dry-run（如 rename dry-run），应使用 provider dry-run；若 provider 不支持 dry-run（如 group_sync 场景），spec-first 必须先用只读 `list_repos` / `group_list` / resources / workspace facts 生成 preview，再允许真实 mutation。
- R-MUT2. Plan 输出中如涉及 mutation-capable capability，必须标注为 "requires explicit user action"，不得作为 implementation unit 的自动步骤。
- R-MUT3. `mutation-gated` 表示 capability 可能可用但被显式授权边界拦住；它不是 `unavailable`。Plan 必须把这种状态写成后续 action / maintenance handoff，而不是把它当作 provider failure。

**Scope Authority**

- R-SCP1. scope authority 来自 requirements / plan / task pack / user instruction / git diff；GitNexus evidence 只能提出 impacted surfaces、risks、follow-up 候选，不得让 workflow 自动扩大实现范围。
- R-SCP2. GitNexus 发现额外影响面时，workflow 必须把它作为 "potential follow-up" 或 "risk disclosure" 呈现，不得静默扩大当前 implementation unit 的范围。

**MCP Setup Integration**

- R21. `spec-mcp-setup` 需要配合本方案补强 setup-owned GitNexus capability metadata，表达 GitNexus 作为 required host MCP / graph-provider 可向下游提供哪些原生能力；这些 metadata 只描述 capability availability，不包含任务级查询结果或语义结论。
- R22. GitNexus capability projection 至少应能表达 query、context、impact、route/API evidence、shape check、Cypher、tool map、repo registry 和 workspace group 等能力是否可由当前 host/runtime 暴露；具体字段、命名、schema 和 provider pin / live tool surface 校验方式由 planning 决定。
- R23. `spec-mcp-setup` 的 handoff 必须区分三件事：需要 durable readiness refresh 时运行 `spec-graph-bootstrap`；只需要 Plan 阶段 live GitNexus evidence 时新开会话后由 `spec-plan` 做 lightweight probe；dirty worktree 阻断 durable refresh 不等于 Plan 不能使用 prior/session-local evidence。
- R24. `spec-mcp-setup` 不得因为新增 capability metadata 而运行 `gitnexus analyze`、`gitnexus status`、`gitnexus query`、GitNexus group sync、provider repair 或任何任务级 deep dive；这些仍属于 `spec-graph-bootstrap`、用户显式意图或 downstream LLM workflow。
- R25. setup-owned fallback / degraded 文案不得恢复 Serena 语义；GitNexus 不可用时的默认降级证据应表述为 direct source reads、ast-grep、code-review-graph、prior GitNexus evidence 或 bounded per-repo fallback。
- R26. `spec-mcp-setup` 的调整应优先落在 `mcp-tools.json` registry、provider projection writer、runtime capability facts、setup skill prose 和 contract tests；不应把 setup 执行流改造成 provider capability router。

**Multi Repo Workspace Model**

- R27. Multi Repo Workspace 必须以 GitNexus 的 per-repo index + global registry + explicit repo scope 作为主路径；每个 child repo 独立拥有自己的 GitNexus index、canonical graph artifacts 和 freshness 状态。
- R28. Parent workspace 只能保存 discovery / advisory routing facts，不得拥有 child repo 的 canonical graph truth，也不得把 parent `.spec-first/workspace/*` summary 当作可替代 child `.spec-first/graph/*` / `.spec-first/providers/*` 的事实源。
- R29. GitNexus group mode 必须定义为 read-only orientation enhancement：`group-ready` 时可优先使用 group selector 帮助跨仓发现候选，但它不能替代 per-repo freshness、per-repo source verification 或写入前 repo scope。
- R30. `group-missing`、`group-sync-required`、`not-evaluated-no-mcp-input` 不得被视为 Multi Repo Workspace 失败；Plan 应降级到 bounded registry / per-repo fan-out，并把 group sync 作为显式 preview-first 后续动作。
- R31. Plan / Work / Review 在多仓 workspace 中做写入、测试、autofix、changelog 或 commit 前，必须把每个 implementation unit 落到明确 `target_repo` 或 per-child scope；GitNexus registry / group evidence 只帮助发现候选和影响面。
- R32. Multi Repo Workspace 的 GitNexus evidence 输出必须同时说明 registry evidence、group evidence、per-repo query usability、dirty/stale limitations 和直接源码验证要求，避免把 group availability 与整体 GitNexus readiness 混为一谈。

**Capability Catalog And Resource Surface**

- R33. Capability catalog 必须带 source tag 和 verification posture：checked-in 文档可以记录基线能力，但最终实现必须根据当前 GitNexus provider pin、setup projection 和当前 host 暴露的 MCP tool / resource surface 复核；不得把一次 session-local 工具清单当成永久事实。最低 source tags 包括 `checked-in-baseline`、`setup-projection`、`provider-pin`、`live-mcp-tool`、`live-mcp-resource`、`session-local-inference`、`user-decision`。
- R34. GitNexus plugin 的 capability surface 不限于 MCP tools，也应允许读取 GitNexus 暴露的 read-only MCP resources（如 repo context、schema、processes）作为 lightweight probe 或 deep dive 的证据来源；resources 与 tools 一样必须标注 provenance 和 freshness。
- R35. Capability catalog 的 checked-in baseline 只定义 capability 语义、候选 native tools/resources 和降级 posture；`spec-mcp-setup` 只能写 observed availability / projection facts，`spec-plan` 再执行 session-local probe 并决定是否使用某个 native capability。setup projection 不得成为第二个永久 capability registry。

---

## Acceptance Examples

- AE1. **Covers R5, R6, R9.** Given GitNexus query-ready and a developer asks for a technical plan, when `spec-plan` starts, then the plan includes a lightweight GitNexus evidence posture and states whether deep dive was triggered.
- AE2. **Covers R7, R8, R10.** Given a task changes a public API route, when Plan detects API surface risk, then it uses route/API impact capability where available and annotates implementation units with impacted consumers, source reads still required, and test candidates.
- AE3. **Covers R11, R12, R14.** Given a dirty worktree with prior GitNexus query-ready evidence, when Plan runs, then it does not require all changes to be committed; it labels GitNexus evidence as dirty-advisory or stale, validates critical claims with current source reads, and discloses lower confidence.
- AE4. **Covers R11, R20.** Given GitNexus is unavailable, when a graph-heavy Plan is requested, then planning continues with an explicit limitation section and fallback evidence from direct reads, ast-grep or code-review-graph rather than silently omitting impact analysis.
- AE5. **Covers R13, R17, R18.** Given a parent multi-repo workspace, when Plan needs read-only cross-repo context, then it may use existing workspace/group readiness and session-local GitNexus queries; it must not silently run group sync or refresh durable provider state.
- AE6. **Covers R1, R2, R3.** Given the integration is complete, when a user asks whether GitNexus capabilities were preserved, then spec-first documentation and Plan behavior show native GitNexus capabilities available as task-matched tools, not hidden behind a generic ready flag.
- AE7. **Covers R21, R22, R23.** Given `spec-mcp-setup` completes successfully, when a later Plan starts in a fresh session, then it can discover GitNexus native capability availability from setup-owned facts while still relying on Plan to decide which capability to use.
- AE8. **Covers R24, R25, R26.** Given setup is rerun in a dirty repo, when file changes are inspected, then setup has not run GitNexus query/analyze/status or group sync, has not restored Serena fallback wording, and has only updated setup-owned projection/readiness/capability facts.
- AE9. **Covers R27, R28, R29.** Given a parent workspace has multiple indexed child repos and GitNexus group is ready, when Plan needs cross-repo orientation, then it may use the group selector to find candidates but still records per-repo freshness and validates final conclusions against child source files.
- AE10. **Covers R30, R31, R32.** Given `group_list` returns no configured group but `list_repos` shows matching child repos, when Plan runs from the parent workspace, then it uses bounded registry / per-repo fan-out, does not treat group-missing as provider failure, and requires target_repo before any write-oriented work.
- AE11. **Covers R14, R14a, R14b, R14c, R33, R34.** Given provider docs, setup facts, compiled readiness and live MCP metadata disagree about available GitNexus tools or resources, when Plan builds its evidence posture, then it reports the source tag and verification posture, maps Plan envelope fields back to existing graph/workspace contracts, uses the current verified surface conservatively, and does not claim static catalog certainty.
- AE12. **Covers R-SCP1, R-SCP2, R-MUT1, R-MUT2, R-MUT3.** Given GitNexus impact evidence finds additional affected repos or symbols, when Plan or Work handles the result, then it records the risk or follow-up without expanding implementation scope automatically; if a mutation-capable capability is requested, Plan marks it `mutation-gated` / `requires explicit user action` rather than `unavailable` or an automatic implementation step.
- AE13. **Covers R8, R9, R34.** Given Plan needs lightweight GitNexus orientation and read-only MCP resources are exposed, when Plan probes GitNexus, then it may use resources such as repo context, schema, processes, group contracts or group status as evidence, records `native_tool_or_resource`, provenance and freshness, and still validates critical claims through source reads.
- AE14. **Covers R7, R8.** Given a route handler response changes, when Plan detects API surface risk, then it chooses `api_impact` before generic `query`, uses `route_map` for handler/consumer discovery, uses `shape_check` for response shape drift, and falls back to `query/context + source reads` only when the specialized capability is unavailable or not applicable.

---

## Success Criteria

- 技术方案阶段默认能说明 GitNexus 是否可用、用了哪些能力、证据限制是什么，以及这些证据如何改变方案。
- GitNexus 原生能力不丢失：Plan 能按任务选择 query/context/impact/route/API/shape/Cypher/workspace 等能力，而不是只读取 readiness summary。
- dirty worktree 不再被用户理解为“必须全部提交才能继续”；系统能区分 durable refresh blocked 与 query evidence usable-but-limited。
- GitNexus 不可用时 Plan 仍可继续，但必须显式降低信心并扩大 fallback evidence，而不是静默降级。
- 脚本与 LLM 边界保持清楚：setup/bootstrap 编译事实，Plan 做语义判断和方案取舍。
- `spec-mcp-setup` 能清楚表达 GitNexus live capability 是否已配置、是否需要新会话、是否建议 graph-bootstrap，但不会执行任务级 GitNexus 查询。
- 多仓计划能在 group-ready 和 group-missing 两种情况下都产出可执行方案：group-ready 作为增强，group-missing 走 registry / per-repo fallback，不把 group 当成硬依赖。
- Plan 输出能区分 capability status、evidence grade 和 freshness state，并能说明 GitNexus 证据是否来自 tool、resource、compiled readiness 还是 direct read fallback，同时映射回现有 graph/workspace evidence contracts。
- v1 只要求 `spec-plan` 与 setup capability metadata 达到硬验收；后续 `spec-work` 和 `spec-code-review` 能复用同一 capability evidence posture 属于 compatibility goal，不作为 v1 行为完成条件。

---

## Scope Boundaries

- 不把 GitNexus 变成 spec-first 内置 provider，也不 fork、代理或重实现 GitNexus。
- 不要求第一阶段实现所有 downstream workflows；首阶段以 `spec-plan` 为硬验收面。
- 不让普通 Plan 静默执行 provider analyze、group sync、install、host config 修改或 durable artifact refresh。
- 不删除现有 canonical graph artifacts；本需求是在其上增加一等 capability consumption，不替换 readiness compiler。
- 不把 Code Intelligence Plugin protocol 设计成复杂 provider 平台、状态机或规则引擎。
- 不让 GitNexus evidence 替代源码、测试、review 或 LLM 架构判断。
- 不要求用户为了生成计划而提交所有未提交变更；只有需要 durable refresh 精确对齐时才提示 clean/commit/stash 等操作。
- 不让 `spec-mcp-setup` 承担 Plan intelligence pass、GitNexus deep dive、group sync 或 provider query 证明。
- 不恢复 Serena MCP 或 Serena fallback 文案。
- 不把 GitNexus group mode 设为 Multi Repo Workspace 的必要前提；group mode 只是可用时的增强层。
- 不允许 parent workspace 写入或合成 child repo 的 canonical graph readiness truth。
- 不把 provider capability catalog 当作静态永久真相；provider pin、MCP tool surface 或 resources 变化时必须重新验证。
- 不允许 GitNexus evidence 自动扩大 scope；发现额外影响面时只能进入 risk、follow-up、planning update 或用户确认路径。

---

## Key Decisions

- **Hybrid model:** 采用 `GitNexus first-class plugin + Generic Code Intelligence Plugin protocol`，既避免 GitNexus-only wrapper 锁死，也避免泛化抽象压平 GitNexus 能力。
- **Plan-first rollout:** 优先增强 `spec-plan`，因为技术方案错误会级联污染后续 task、work 和 review。
- **Light probe + conditional deep dive:** 每个相关 Plan 都做低成本探测；只有 graph-heavy 或高风险信号才进入更深的 GitNexus 查询。
- **Degrade, do not hard block:** GitNexus 不可用时 Plan 继续，但必须强制披露 limitations、fallback evidence 和信心影响。
- **Refresh eligibility separated from query usability:** dirty-source-blocked 影响 durable refresh，不自动等于 GitNexus query 完全不可用。
- **Native capability preservation:** GitNexus 原生能力面是需求核心，不允许被 readiness artifact 或 generic protocol 吞掉。
- **Setup stays metadata-only:** `spec-mcp-setup` 只补 capability projection 与 handoff guidance，不执行 GitNexus 智能查询。
- **Registry/per-repo first:** Multi Repo Workspace 的 GitNexus 最佳实践以 global registry、显式 repo scope 和 per-repo freshness 为底座，group mode 是增强层。
- **Three-axis evidence envelope:** capability 可用性、证据等级和 freshness 分开表达，避免一个状态枚举承载过多含义。
- **Scope authority remains outside graph:** GitNexus evidence 影响风险和验证策略，不自动改变需求、计划或任务范围。

---

## Dependencies / Assumptions

- 现有 `.spec-first/graph/*`、`.spec-first/providers/gitnexus/*` 和 `.spec-first/workspace/*` facts 继续作为 durable readiness / freshness / provenance 证据来源。
- 当前 GitNexus MCP 能力集可通过 host runtime 暴露给 agent；具体可用性仍以 setup/bootstrap facts 与 session-local probe 为准。
- `spec-mcp-setup` 已经负责 GitNexus host MCP 配置和 setup-owned `.spec-first/config/*` facts；本需求只要求补强 capability metadata 和 handoff 语义。
- code-review-graph、ast-grep 和 direct source reads 是 GitNexus 不可用时的主要 fallback evidence，但它们不应伪装成等价替代。
- 多仓 workspace 写入仍需要明确 target repo / per-child scope；GitNexus registry / group query 只支持 read-only planning evidence，不能替代写入边界判断。
- GitNexus 多仓模型（source_tag: session-local live MCP surface + existing spec-first workspace contract + user decision）按 per-repo index、registry discovery、显式 repo scope、per-repo staleness 检查理解；planning 需要用当前 provider pin / docs / live MCP surface 复核后再把它升级为 confirmed implementation premise。spec-first 的 group mode 使用必须建立在这条主路径之上。
- 附录 A 的工具清单是当前会话可见 surface 的 session-local snapshot；planning 必须用当前 provider pin、setup projection 和 live MCP metadata / resources 复核后再固化实现。

---

## Outstanding Questions

### Deferred to Planning

- [Affects R3, R6, R14, R14a, R14b, R14c][Technical] 定义最小 Code Intelligence Plugin capability envelope，要求足够表达 GitNexus 原生能力、capability status、evidence grade、freshness state、limitations 和 source contract mapping，但不引入复杂 provider 平台。
- [Affects R5, R9][Technical] 决定 `spec-plan` 的最小 source 改动面和输出格式，确保每个技术方案在保留现有 `## Graph Readiness` block 的同时稳定呈现相邻 Graph / GitNexus Evidence。
- [Affects R7, R8][Technical] 设计 trigger matrix：哪些任务信号触发 GitNexus deep dive，哪些只需要 lightweight probe，以及 API/route/shape/tool 场景的 native capability 选择顺序。
- [Affects R11, R14][Technical] 统一 freshness / degraded vocabulary，并与已有 graph evidence policy、workspace readiness contract 和 bootstrap artifacts 对齐。
- [Affects R19][Technical] 决定 `spec-work`、`spec-code-review`、`spec-debug` 的后续接入顺序与最小消费规则。
- [Affects R21, R22, R23][Technical] 决定 `spec-mcp-setup` capability metadata 落点和最小 schema，避免与 graph readiness canonical artifacts 形成第二真相源。
- [Affects R24, R26][Technical] 为 setup 增加 contract tests，确保新增 metadata 不会触发 GitNexus query/analyze/status、group sync 或 downstream deep dive。
- [Affects R27, R32][Technical] 在 `spec-plan` 输出中定义 Multi Repo Workspace 的 evidence posture，区分 registry evidence、group evidence、per-repo query usability 和 target_repo scope。
- [Affects R1, R2, R33, R34, R35][Deferred to Planning] 复核当前 GitNexus MCP tool/resource surface 和 CLI/provider behavior：附录 A 包含一次 session-local probe 的快照，但 planning 必须以当前 provider pin、setup projection、live host MCP tool/resource surface 重新验证，不得把快照当作长期 contract。

---

## Next Steps

-> `spec-plan docs/brainstorms/2026-05-22-001-gitnexus-first-class-capability-plugin-requirements.md` 进行结构化实施规划。

**v1 实现优先级（planning 参考）：**

- **v1 P0 — Plan 核心接入**：R1-R14、R14a、R14b、R14c、R-MUT1、R-MUT2、R-MUT3、R-SCP1、R-SCP2
  `spec-plan` 深度接入 GitNexus capability，evidence 三轴模型，mutation/scope 防护栏
- **v1 P0 — Setup capability metadata**：R21-R26、R33-R35
  `spec-mcp-setup` 补强 capability projection，与 Plan 核心接入同优先级并行推进
- **v1 P1 — Multi Repo Workspace**：R27-R32
  多仓 evidence posture，group-ready / group-missing 两路径
- **v2+ — Downstream workflows**：R19 涉及的 `spec-work`、`spec-code-review`、`spec-debug`

---

## 附录 A：GitNexus MCP 工具映射表（session-local snapshot）

> **重要**：以下工具清单来自 2026-05-22 当前 Codex 会话可见的 GitNexus MCP tool surface，不是长期 contract。
> Planning 阶段必须以当前 provider pin（`mcp-tools.json`）、setup projection、live host MCP tool / resource surface 重新验证，
> 以实际暴露的工具名和 resources 为准。Capability 名是协议层抽象，不随 provider 版本漂移。

### GitNexus MCP 工具与资源清单（session-local snapshot，需 planning 复核）

**当前会话可见工具：** `list_repos`、`query`、`context`、`impact`、`detect_changes`、`rename`、`cypher`、`route_map`、`api_impact`、`shape_check`、`tool_map`、`group_list`、`group_sync`

**当前会话可见 read-only resources：** `gitnexus://repos`、`gitnexus://setup`、`gitnexus://repo/{name}/context`、`gitnexus://repo/{name}/clusters`、`gitnexus://repo/{name}/processes`、`gitnexus://repo/{name}/schema`、`gitnexus://repo/{name}/cluster/{clusterName}`、`gitnexus://repo/{name}/process/{processName}`、`gitnexus://group/{name}/contracts`、`gitnexus://group/{name}/status`

**当前会话未暴露但历史草案曾提及的工具：** `group_contracts`、`group_query`、`group_status`。这些不得作为 v1 tool contract，除非 planning 用当前 provider pin / live MCP metadata 重新验证其存在；其中 contracts/status 能力在当前 snapshot 中以 read-only resources 形式暴露。

> `workspace_group_query` 不是当前会话独立 tool；它通过 `query` / `impact` 等支持 group selector 的能力实现，例如 `repo="@<groupName>"`。

### Capability → GitNexus 工具映射

**通用 capability（跨 provider 可实现）：**

| Capability 名 | 语义 | GitNexus 工具 | capability_status 降级 | evidence_grade |
|---|---|---|---|---|
| `repo_query` | 自然语言查询，返回按执行流分组的符号/流程 | `query` | partial → fallback（bounded direct read） | primary / session-local / fallback |
| `symbol_context` | 360° symbol 视图：调用者、被调用者、参与的 process | `context` | partial → fallback | primary / session-local / fallback |
| `impact_analysis` | blast radius，1/2/3 hop，带置信度分数 | `impact` | partial → fallback（git diff + bounded read） | primary / session-local / fallback |
| `change_detection` | git diff → 受影响执行流映射 | `detect_changes` | unavailable → fallback（git diff） | primary / session-local / fallback |
| `execution_flow` | 追踪函数/请求执行路径（process 查询） | `query`（flow 语义） | partial → fallback（bounded direct read） | primary / session-local / fallback |

**专用工具 capability（已在 session-local snapshot 中确认存在，planning 复核 provider pin / live MCP surface 后可直接映射）：**

| Capability 名 | 语义 | GitNexus 实现方式（snapshot） | capability_status 降级 |
|---|---|---|---|
| `api_surface` | 模块/服务的 API 边界和对外接口 | `api_impact`（route handler 场景）或 `query` | fallback（bounded direct read） |
| `route_map` | 路由表、handler、consumer 映射 | `route_map` | fallback（bounded direct read） |
| `shape_check` | API route response shape 与 consumer property access 对齐 | `shape_check` | fallback（bounded direct read） |
| `tool_map` | MCP/RPC tool definitions、handlers 和 descriptions | `tool_map` | fallback（bounded direct read） |

**Read-only resource capability（适合 lightweight probe 或 deep dive 辅助）：**

| Capability 名 | 语义 | GitNexus resource（snapshot） | 典型用途 | evidence_grade |
|---|---|---|---|---|
| `workspace_registry_resource` | 所有 indexed repo 与 stats | `gitnexus://repos` | parent workspace orientation、repo selector 候选 | session-local / advisory |
| `repo_context_resource` | repo overview、staleness、available tools | `gitnexus://repo/{name}/context` | lightweight probe、确认 repo readiness/context | session-local / advisory |
| `repo_schema_resource` | Cypher schema / node / edge contract | `gitnexus://repo/{name}/schema` | Cypher deep dive 前置、避免臆造 schema | session-local / advisory |
| `repo_processes_resource` | repo execution flows 列表 | `gitnexus://repo/{name}/processes` | execution-flow orientation、deep dive target discovery | session-local / advisory |
| `repo_process_trace_resource` | 单个 process trace | `gitnexus://repo/{name}/process/{processName}` | 高风险方案验证执行路径 | session-local / advisory |
| `repo_cluster_resource` | functional area / module detail | `gitnexus://repo/{name}/cluster/{clusterName}` | module boundary / reuse candidate orientation | session-local / advisory |
| `workspace_group_contracts_resource` | group contract registry | `gitnexus://group/{name}/contracts` | cross-repo API/contract orientation | session-local / advisory |
| `workspace_group_status_resource` | group repo index / contract registry staleness | `gitnexus://group/{name}/status` | group readiness/staleness disclosure | session-local / advisory |

**GitNexus-only capability（无通用 fallback，仅多仓工作区模式）：**

| Capability 名 | 语义 | GitNexus tool/resource | mutation? | gated/unavailable 时行为 |
|---|---|---|---|---|
| `workspace_registry` | 列出所有已索引仓库 | `list_repos` | 否 | 降级到 per-repo 处理 |
| `workspace_group` | 列出已配置的仓库组 | `group_list` | 否 | 降级到 per-repo 处理 |
| `workspace_group_sync` | 把 child repos 注册为 group | `group_sync` | **是** | `mutation-gated`，需 preview-first 显式授权 |
| `workspace_group_query` | 跨组内所有仓库搜索执行流 | `query`（`repo="@<groupName>"` selector） | 否 | 降级到逐仓库 `query` fan-out |
| `workspace_group_contracts` | 查看 group contract registry | `gitnexus://group/{name}/contracts` | 否 | 无 resource 时降级到 per-repo source reads |
| `workspace_group_status` | 查看 group index / registry staleness | `gitnexus://group/{name}/status` | 否 | 无 resource 时披露 group staleness 未评价 |
| `cypher_query` | 直接执行 Cypher 图查询（高级/调试） | `cypher` | 否 | 返回 `unavailable`，无 fallback |
| `symbol_rename` | 多文件协调重命名，带置信度标签 | `rename` | **是** | `mutation-gated`，需 dry-run preview 和显式授权 |

> **待 planning 复核的 capability**：`workspace_group_contracts`、`workspace_group_status` 在当前 session-local snapshot 中以 read-only resources 暴露，不是工具；planning 必须用 provider pin / live MCP surface 复核 resource URI 与可用参数后再固化 implementation contract。

> **mutation-capable capability 约束**（对应正文 R-MUT1、R-MUT2、R-MUT3）：`workspace_group_sync` 和 `symbol_rename` 标注为 mutation，Plan 不得自动执行；Work / maintenance workflow 只能在显式用户授权、preview 确认、target_repo 或 group scope 明确后执行。`mutation-gated` 不等于 provider `unavailable`。

### API / Route / Shape / Tool Trigger Matrix

| Plan 信号 | 首选 GitNexus capability | fallback |
|---|---|---|
| route handler 或公开 API 行为变更 | `api_impact` | `route_map` + `query/context` + source reads |
| 需要找 route、handler、consumer 映射 | `route_map` | `query("route handlers / consumers")` + source reads |
| response shape / consumer property access 风险 | `shape_check` | `api_impact` + bounded source reads |
| MCP/RPC tool 定义、handler 或 description 变更 | `tool_map` | `query/context` + source reads |
| 框架不明、非 route API、tool 不存在或当前 provider 不支持 | `query` / `context` / resource probe | bounded source reads、ast-grep、code-review-graph |

### evidence 三轴模型（统一命名）

evidence 模型拆为三个独立轴，避免把 provider 可用性、证据可信度和 freshness 混为一谈：

**capability_status**（provider 可用性）

| 值 | 含义 |
|---|---|
| `available` | 当前 capability 可调用，且没有已知能力级阻断 |
| `partial` | capability 可调用但存在 definitions-only、stale、dirty 或低置信限制 |
| `unavailable` | provider 未加载、MCP 未响应、tool/resource 不存在，或该 capability 不适用于当前拓扑 |
| `mutation-gated` | capability 可能可用，但必须先经过 explicit approval / preview-first，不得由 Plan 或普通 workflow 自动执行 |

**evidence_grade**（证据可信度）

| 值 | 含义 |
|---|---|
| `primary` | durable bootstrap 已验证，fresh index，可作为主要证据 |
| `session-local` | live MCP 调用结果，不更新编译 readiness，会话内有效 |
| `advisory` | stale 或 partial 结果，需结合源码验证 |
| `fallback` | bounded direct source read、ast-grep、git diff 或 code-review-graph fallback |

**freshness_state**（index 新鲜度）

| 值 | 含义 |
|---|---|
| `fresh` | source_revision 匹配，durable bootstrap 已验证 |
| `stale` | source_revision 或 fingerprint 不匹配，index 过期 |
| `dirty-advisory` | worktree dirty，durable refresh 受限，既有 index 仍可只读使用 |
| `query-unverified` | graph_ready=true 但 query_ready=false（CLI query probe 失败） |

> `dirty-advisory` ≠ `unavailable`：dirty worktree 只影响 durable refresh，不等于 GitNexus query 完全不可用（对应 R12）。

### 与现有 evidence contract 的映射

| Plan envelope 字段 | 派生来源 | 不允许做的事 |
|---|---|---|
| `capability_status` | setup projection、live MCP tool/resource availability、provider applicability、mutation gate | 不替代 `Graph Readiness.status` 或 workspace `query_usability` |
| `evidence_grade` | `graph-evidence-policy.md` 的 confirmed/session-local/advisory/stale 语义 + fallback posture | 不把 fallback source read 降成低可信事实；源码/测试冲突时仍优先源码/测试 |
| `freshness_state` | provider `source_revision`、`worktree_dirty`、`worktree_status_hash`、`query_ready`、workspace `index_snapshot` / `query_usability` | 不写回 canonical readiness artifacts |
| `source_contract_fields` | `.spec-first/graph/*`、`.spec-first/providers/*`、`.spec-first/workspace/*`、setup projection、live MCP metadata/resource URI | 不引用不存在的 field，不把 session-local snapshot 固化为长期 contract |

---

## 附录 B：三种研发模式与 Capability 适用范围

| 模式 | 形态 | Capability 适用范围 |
|---|---|---|
| **单仓单项目** | 一个 repo，一个应用/SDK/CLI | 全部通用 capability；workspace_* 返回 `unavailable` |
| **单仓多模块** | 一个 `.git`，多个 packages/modules | 全部通用 capability；GitNexus 覆盖 repo 内多模块关系；workspace_* 返回 `unavailable`；不启用 group |
| **多仓工作区** | 父目录下多个独立 Git 工程 | 通用 capability 按 child repo 各自调用（需绑定 `target_repo`）；workspace_* capability 仅此模式有意义 |

关键约束：
- 单仓多模块**不等于**多仓工作区，不应启用 GitNexus group readiness（对应 R27）
- `workspace_group_sync` 是 provider-side mutation，必须 explicit、preview-first；plan/work/debug/review 不得静默调用（对应 R13、R30）
- `workspace_group_query` 底层是 `query` 工具加 `repo="@<groupName>"` selector，不是独立工具

**多仓工作区推荐流程：**

```
1. spec-mcp-setup / spec-mcp-setup
   → 各 child 写 .spec-first/config/*

2. spec-graph-bootstrap / spec-graph-bootstrap
   → 各 child 独立 analyze，写 .spec-first/graph/*

3. 可选：group_sync（显式 maintenance action，非任何 workflow 的隐式步骤）
   → 把 child repos 注册为 GitNexus group，必须 preview-first
   → preview：先用 list_repos / group_list / read-only resources 展示将同步的 group 与 repo 清单
   → execute：用户确认后才允许由后续 spec-first maintenance workflow 或明确授权路径调用真实 group_sync
   → 验证：group_list → group.status="group-ready"

4. 只读查询（或 spec-plan / spec-plan）
   → group-ready：query(repo="@<group>") 跨仓搜索（对应 R29）
   → group-missing：降级到逐 repo fan-out（对应 R30）

5. spec-plan / spec-plan
   → 每个 unit 带 target_repo（对应 R31）

6. spec-work / spec-work
   → 按 target_repo 隔离写入，验证 git status 变更属于 target_repo

7. spec-code-review / spec-code-review
   → 按 child repo 分组 diff + impact evidence
```
