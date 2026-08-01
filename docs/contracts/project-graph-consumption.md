# Project Graph Consumption Contract

`project-graph-consumption.v1` defines how workflows consume project-graph and code-graph capability-class providers as candidate evidence. It is an advisory consumption contract, not a provider readiness contract, not a workflow state machine, and not a confirmed evidence source.

This contract belongs to the Evidence Harness map in `docs/contracts/ai-coding-harness.md`. It closes the provider-consumption gap between setup-owned readiness facts and workflow-owned semantic judgment without adding a second evidence schema.

## Goals

- Give workflows one source of truth for project-graph consumption boundaries.
- Preserve candidate-only usage: project-graph output can orient investigation, but it cannot prove findings, scope, root cause, affected tests, or merge readiness.
- Keep provider readiness mechanical and workflow conclusions source-grounded.
- Reuse existing evidence fields instead of adding a graph-specific schema.

## Non-Goals

- Do not make project-graph output confirmed evidence.
- Do not make project-graph a deterministic TIA, coverage, affected-test, dependency, or ownership provider.
- Do not require workflows to run project-graph before direct source reads.
- Do not run mutation, generation, refresh, or repair operations through this consumption contract.
- Do not read full project-graph artifacts as context; never cat graph.json.

## Capability Vocabulary

Use provider-neutral capability classes in workflow prose:

- `project-graph`: strategic repository map candidates for broad orientation, relationship paths, and concept explanation.
- `code-graph`: tactical code-structure candidates such as call graph, impact, ownership, and affected-test hints.

`rg` and ast-grep are stateless baseline source-location tools, not readiness-lifecycle providers. Naming them in contracts or workflow skills is allowed because provider-neutral constraints are aimed at lifecycle providers, not baseline source search tools.

Provider-specific commands may appear only in an appendix or setup-owned implementation docs. Workflow SKILL prose should refer to capability classes and native surfaces, not provider command names.

## Consumption Gradient

Use project-graph output only to shrink the next read:

1. Broad orientation query: identify candidate areas, documents, or concepts to inspect.
2. Relationship path: inspect a candidate relationship between two named areas.
3. Concept explanation: get a scoped concept map before returning to source.

The output stays candidate-only. A useful candidate can change where you look first, but it cannot become the answer.

## Trigger Shape

Default project-graph use is appropriate for architecture relationships, cross-file relationships, impact analysis, broad codebase navigation, and questions about how one project area connects to another.

Default project-graph use is not appropriate for simple factual Q&A, current conversation or current-context summaries, user-provided single-document summarization/editing, or already-scoped file reads. In those cases, answer directly, use bounded source reads, or use baseline search tools first. A workflow may still use project-graph later if the request expands into architecture or impact analysis.

## Readiness Gate

Availability is anchored in setup-facts, not artifact presence:

1. Read the setup-facts artifact that carries `provider_readiness[]`.
2. Confirm the artifact has trustworthy top-level freshness metadata, including `generated_at`. If setup facts are missing, stale, missing `generated_at`, or otherwise freshness-untrusted, record project-graph availability as unknown and fall back to bounded direct source reads, `rg`, and ast-grep.
3. Consume the single provider entry whose capability class you intend to use. Do not transfer readiness from another provider.
4. Interpret `readiness_status` at the provider-entry level:
   - `fresh`: exploration-tier orientation may use the provider; conclusion-tier claims still require source/test/log/doc confirmation.
   - `stale`: exploration-tier orientation may use the provider when you annotate that the graph lags HEAD; it must not directly support conclusion-tier claims, which must be re-grounded regardless.
   - `unknown` / `unverified`: do not use the provider as a readiness-backed candidate source; use bounded direct reads, `rg`, and ast-grep.
   - `degraded` / `not-run`: use only when the degradation still leaves a clearly bounded read-only native surface; otherwise fall back.

Fallback triggers are: provider missing, setup-facts freshness untrusted, readiness facts missing, readiness self-reported as `unknown`/`unverified`, provider call failure, explicit disablement, or unsafe context. Fallback is never-blocking for ordinary workflows.

## Trust Tiers

Exploration-tier navigation may use project-graph candidates directly to decide where to inspect next.

Conclusion-tier consumption must be confirmed from source, tests, logs, docs, contracts, or user confirmation before it appears in a plan claim, review finding, root-cause conclusion, implementation basis, or shipping claim.

## Relay Chain

This relay is a trust-elevation direction, not a call-priority order. Trust rises from project-graph (advisory orientation - "where to look first") through code-graph / `rg` / ast-grep (tactical locating - "where exactly, connected to what") to source / tests / logs / docs (confirmed truth - "is it actually so"); the funnel narrows scope as trust rises. Any workflow may start directly at a lower layer - reading source first is always valid, and skipping project-graph is not a violation; whether to issue a project-graph query is an LLM judgment based on readiness facts and task shape. The one hard rule is no skip-layer elevation: a project-graph candidate must not enter a conclusion-tier claim without lower-layer confirmation.

When code-graph derived relationship facts, such as call edges, impact surfaces, ownership candidates, or affected-test candidates, enter conclusion-tier claims, they also require confirmation. Verbatim source snippets returned through a native code-graph interface count as bounded direct reads when the workflow records file and line references; they do not require ceremonial re-reading.

## Recording Rules

Do not add schema fields or graph-specific evidence enums.

- Advisory project-graph or code-graph use, including queries run and candidates accepted or rejected, is summarized in `provider_untrusted.summaries[]` for work-run artifacts.
- Confirmed evidence is recorded in existing direct evidence fields such as `direct_evidence_used.source_refs`, `direct_evidence_used.checks_or_logs`, and `direct_evidence_used.limitations`.
- Review outputs record confirmed coverage in their existing `Direct evidence:` lines and may name provider candidates only as untrusted coverage context.
- Cross-workflow handoff reuses `evidence_summaries[]`.
- Setup-side `lifecycle.fallback_used` remains separate from consumption-side fallback notes.

## Project-Graph Limitations

Project-graph is an advisory candidate provider. It does not unlock deterministic TIA, coverage, dependency graph, ownership, affected-test, or review-impact claims as confirmed facts. Those claims need direct evidence even when project-graph output looks plausible.

## Per-Requirement Multi-Repo Workspace Graphs

When the cwd is a **non-Git multi-repo requirement parent** (several independently cloned child Git repos under one requirement folder), setup may build a two-layer graph:

- **code-graph (tactical):** per-child CodeGraph index under each child's `.codegraph/`, queried with `projectPath` set to that child.
- **project-graph (macro):** one workspace Graphify merged graph at `<requirement>/graphify-out/merged-graph.json` (out-of-tree, code-only).

Consumption rules for this shape:

1. **Same candidate-only contract.** Child CodeGraph hits and the merged Graphify graph are both `provider_untrusted` advisory orientation. Empty, partial, stale, or unmapped results have **no negative authority** — "no edge found" never means "no edge exists."
2. **`projectPath` containment is advisory, not a hard MCP gate.** Spec-first may validate that a requested `projectPath` resolves inside the current requirement workspace (facts, doctor, routing text). The global CodeGraph MCP server is provider-owned; this containment check does **not** hard-block queries at the server. Cross-requirement `projectPath` should still be rejected or warned by consumers that implement the advisory check.
3. **Parent root 没有默认 projectPath。** CodeGraph server root 没有 workspace index；只有 cwd 位于某个 confirmed child 内时，status 才提供 enclosing-child hint。父目录查询必须显式选择 child `projectPath`，跨仓问题使用 merged Graphify graph。
4. **Per-requirement isolation.** Graphs are not reused across requirement folders. Deleting the requirement folder removes its managed graph assets (no machine-global residue from this feature). Cross-requirement conclusions still re-ground in the target child sources.
5. **Ready 需要 state receipt。** Build 原子写 `graphify-out/workspace-graph-state.json`；当前 `workspace-graph-state.v3` 记录 operation、confirmed repos、source snapshot、merged artifact path/size/mtime/SHA-256、repo/merge `promotion_cleanup_pending` 与独立 cleanup reason，以及可为 null 的 `refresh_hook`。异步模式的 `refresh_hook` 必须是 `workspace-child-hook-contract.v2`，包含 canonical managed-block SHA-256、绝对 Node/async/setup/CodeGraph/Graphify 路径、runtime host 和 bundled version。Status 保留主要 build reason，并把 cleanup pending 作为正交事实与 limitation 暴露；只有在最近 operation complete、无 cleanup pending、repo 集合和 source snapshot 未变、每个 child 的 `.codegraph/codegraph.db` 是 contained/stable/non-symlink/non-empty 普通文件、Graphify subgraph/merged graph 通过任意大小完整 JSON 语法校验，且所选 host family 的 routing core contract 齐备时才报告 ready；Provider 零退出、目录非空、首尾括号或最终 symlink 均不能维持 ready。Kiro/Qoder 的降级注记是附加说明，不会令部分宿主投射误判 stale。旧 v1/v2 state、v1 hook receipt、缺少 `refresh_hook` 的 state、state 缺失/失败或 source 已变化时必须降为 partial + stale/unknown；升级不自动猜测旧 hook identity，需显式重跑 workspace build。
6. **Refresh 为 commit-time 异步 + 显式兜底。** CodeGraph 1.5.0 的 MCP watcher 只覆盖 server 默认项目；`projectPath` 打开的其他 workspace child 不会各自启动 watcher。build 时先由现有 Provider resolver 验证 absolute CodeGraph 与 Graphify launcher；只有两个 launcher、当前 host、bundled version 完整且 hooks root 位于 child 内时，才安装固化这些上下文的 spec-first 自有 commit hook。Status 不使用 marker 猜测 identity，而是依据 state receipt 重建 canonical block digest，同时校验 `post-commit` / `post-checkout` 两个块内容、POSIX 执行位、记录的 Node/async/setup/CodeGraph/Graphify 文件可读/可执行性与当前 bundled version。子仓 commit 后**后台异步**触发 refresh-only workspace 重建，commit 立即返回；该内部 setup 必须同时具有 marker、两个 pinned launcher 与有效继承 credential，在 lifecycle lease 内对全部 confirmed child 执行 bounded `codegraph sync <repo>`，再执行 Graphify re-extract + merge，禁止 CodeGraph install/init、managed exclude、routing injection 与 hook re-install。event lease（`graphify-out/workspace-async-refresh.lock` + pending）负责 trigger single-flight、coalesce 与 release handoff；writer lifecycle lease（`.spec-first/workspace-graph-lifecycle.lock`）串行化后台 build、显式 build、clean 和 status writer。async wrapper 持 lifecycle lease，setup child 只能校验继承 token；显式 build/clean busy 时在任何 managed mutation 前失败。clean 删除 state 后，已启动但尚未执行的旧 trigger/worker必须停止。可恢复的 provider partial（CodeGraph sync、Graphify extract/merge、build 时 source 漂移或 status receipt 清理失败）允许下一次 Git 事件重试；owner 确认、路由写入或 runtime/hook contract 类 partial 不得由 refresh-only 静默抹除。失败落盘 `workspace-async-refresh-status.json`，每次写入独立 `attempt_id`；成功 build 只以 snapshot + 原子 rename 清除启动时观察到的同一 generation，不得删除并发新 receipt。dead/malformed async lock 报 stale failure，不得伪装 in-flight。有效 runtime context 或 hooks root 不可安全确认时**绝不安装 PATH-dependent/external hook**，workspace freshness 降级为显式刷新。消费侧**只读**；仍需即时刷新、非 Git 变化或 hook 不可用时重跑 `--workspace-graph --repos ...`。Watcher、hook marker、派发成功和历史 receipt 都不提升 workspace freshness。
7. **Setup / clean surfaces。** Build/status 使用 `spec-runtime-setup --only codegraph,graphify --workspace-graph` / `--workspace-graph-status`。Workspace build 属于 provider mutation，selected child 的当前 host runtime projection 缺失或过期时必须在任何 provider/artifact 写入前阻断。Refresh-only 不覆盖上一份 completed state；async/lifecycle facts 单独表达 in-flight，最终结果再原子发布，确保刷新期间的新 Git 事件仍可进入 event coalesce。Clean 使用 `spec-runtime-setup --workspace-graph-clean` 或 `spec-first clean --workspace-graph`，只修改显式、manifest 或 state receipt 确认的 child；discovery-only 返回 needs-confirmation。Clean 必须先独占 lifecycle lease，busy 时以 `workspace-graph-lifecycle-busy` 零 mutation 返回；活 PID 但进程身份 marker 无法确认时保持 busy，不按年龄抢占。持锁后重新读取 state/targets，再清理 child、routing、workspace current `graphify-out/` 与 legacy `.graphify/`；malformed managed hook 必须 fail closed，前置清理失败时两个 root 都保留供重试。Successor 在释放 canonical lease 前回收无 canonical ownership 的 quarantine residue，避免一次 release I/O 故障永久污染 readiness。自动发现只读取直接子目录；duplicate alias 或 nested repo roots 返回 `workspace-targets-ambiguous`，build/clean 不得据此 mutation。非 Git多仓父目录上的 `spec-first doctor` 分开显示 child projection、managed runtime facts、optional workspace graph 与 unmanaged external MCP：前两项才可构成 managed readiness；graph 仍为 advisory，external MCP 固定为 not-evaluated，均不替代源码、测试或日志结论。

## Validation Expectations

- Contract tests should pin the candidate-only rule, the readiness-status mapping, the never-cat graph artifact rule, the fallback trigger set, the recording fields, and the relay-chain no skip-layer elevation rule.
- Workflow tests should assert that each consuming workflow references this contract and keeps provider-specific command names out of workflow SKILL prose.
- Setup tests should keep readiness facts mechanical: exit status, output presence, provider lifecycle bits, and advisory next actions only.

## Appendix: Provider-Specific Examples

When a project-graph provider is available through Graphify, query with domain terms instead of the tool name itself. For example, prefer a broad architecture question about "workflow evidence boundary" over a self-referential query about "graphify". Use `graphify query`, `graphify path`, or `graphify explain` only as bounded read-only navigation, then return to source.
