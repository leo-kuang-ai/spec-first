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

## Project Intelligence Delivery Boundaries

The full semantic contract lives in this document. `using-spec-first` may load a conditional summary when the task shape warrants project intelligence; it does not create a second owner or a mandatory call sequence. High-authority consumers may carry a short local claim ceiling so direct invocation remains safe, but they must not copy this contract's readiness tables or provider commands.

Root instructions and SessionStart hooks are entry pointers and drift diagnostics only. They must not inject the full relay contract, provider commands, readiness snapshots, or a `project-graph -> code-graph -> source` workflow. Provider-native, PreToolUse, and Git hooks may report mechanical readiness, refresh, safety, or guard facts only; hook success never proves a relationship, finding, root cause, plan claim, knowledge promotion, or completion claim.

## Negative Authority And Direct Source Validity

An empty, partial, stale, unmapped, failed, or unavailable graph result has no negative authority: it cannot prove that a call, owner, dependency, affected test, impact, or relationship does not exist. A workflow may begin with direct source, `rg`, ast-grep, or a verbatim current source snippet returned by a native code-graph surface when file and line references are available. Derived graph relationships still require direct confirmation before entering a conclusion-tier claim.

## Readiness Gate

Availability is anchored in setup-facts, not artifact presence:

1. Read the setup-facts artifact that carries `provider_readiness[]`.
2. Confirm the artifact has trustworthy top-level freshness metadata, including `generated_at`. If setup facts are missing, stale, missing `generated_at`, or otherwise freshness-untrusted, record project-graph availability as unknown and fall back to bounded direct source reads, `rg`, and ast-grep.
3. 若 entry 的 `readiness_scope=installation`，本次只证明安装/接线，图可用性仍为 unknown；使用 direct-source fallback，不能由安装成功推断图 currentness。Consume the single provider entry whose capability class you intend to use. Do not transfer readiness from another provider.
4. Interpret `readiness_status` at the provider-entry level:
   - `fresh`: exploration-tier orientation may use the provider; conclusion-tier claims still require source/test/log/doc confirmation.
   - `stale`: exploration-tier orientation may use the provider when you annotate that the graph lags HEAD; it must not directly support conclusion-tier claims, which must be re-grounded regardless.
   - `unknown` / `unverified`: do not use the provider as a readiness-backed candidate source; use bounded direct reads, `rg`, and ast-grep.
   - `degraded` / `not-run`: use only when the degradation still leaves a clearly bounded read-only native surface; otherwise fall back.

Fallback triggers are: provider missing, setup-facts freshness untrusted, readiness facts missing, readiness self-reported as `unknown`/`unverified`, provider call failure, explicit disablement, or unsafe context. Fallback is never-blocking for ordinary workflows.

## Target And Artifact Boundary

Runtime Setup resolves an execution root, artifact root, and runtime projection root before invoking a provider. An explicit `--repo` target must be the exact Git repository root; a nested path that resolves to an ancestor Git root is invalid and must fail closed instead of silently broadening the run. An explicit `--folder` target is the exact logical project directory and does not require Git. For a folder target, CodeGraph `.codegraph/`, Graphify `graphify-out/`, setup facts, and Provider execution remain rooted in that folder.

Generated host runtime is a separate ownership surface. A folder nested inside a Git repository reuses the enclosing Git root as `runtime_projection_root`, preventing duplicate parent/child `.agents/skills`; a standalone non-Git folder uses itself. If that projection is missing or stale, remediation is data rather than shell source: `next_action_command` carries absolute `cwd`, `command`, and `args`; `next_action_headless_command` adds `-y -u <name> --lang <zh|en>`. Consumers must spawn that argv in the supplied cwd and must not concatenate `cd`, paths, or arguments into a shell command. Git health is reported as an additional fact and never broadens or rejects a valid folder target. `--requirement-workspace` is a Graphify input-scope override relative to the execution root; it does not move CodeGraph, setup facts, or the Provider artifact root. Plans must expose absolute execution, runtime projection, input-scope, and artifact paths so consumers do not infer ownership from cwd or Git ancestry.

CodeGraph indexing and Graphify first generation/query/explicit refresh are supported in non-Git folders. Only Git-event automation is topology-dependent: Graphify commit hooks and Git HEAD baselines are `not-applicable` and steady-state refresh is `manual-only` for `target_kind=non-git-folder`, even when Git can discover an enclosing parent repository. A parent hook cannot certify refresh ownership for a nested folder artifact. A non-Git parent containing multiple independent child repositories may still use the separate workspace-graph contract below; that batch topology does not replace single-folder support.

Graphify scope completion is provenance-bound. Setup-owned generation or explicit refresh writes `graphify-out/spec-first-graph-scope.json` through contained, no-follow, atomic replacement and binds it to the current `graph.json` SHA-256. `first_generation.requirement_workspace_path` reports the receipt-verified scope, while optional `first_generation.scope_provenance` separately records requested scope, verified scope, receipt ref, status, and reason code. A missing, invalid, hash-mismatched, or differently scoped receipt leaves the graph available only as an advisory candidate and must not relabel the current request as `completed`. Missing legacy provenance remains `readiness_status=unknown`; mismatch or invalid provenance is `degraded` and blocks selected setup completion until explicit refresh writes a matching receipt.

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
6. **Refresh 为 commit-time 异步 + 显式兜底。** CodeGraph 1.6.0 的 MCP watcher 只覆盖 server 默认项目；`projectPath` 打开的其他 workspace child 不会各自启动 watcher。build 时先由现有 Provider resolver 验证 absolute CodeGraph 与 Graphify launcher；只有两个 launcher、当前 host、bundled version 完整且 hooks root 位于 child 内时，才安装固化这些上下文的 spec-first 自有 commit hook。Status 不使用 marker 猜测 identity，而是依据 state receipt 重建 canonical block digest，同时校验 `post-commit` / `post-checkout` 两个块内容、POSIX 执行位、记录的 Node/async/setup/CodeGraph/Graphify 文件可读/可执行性与当前 bundled version。子仓 commit 后**后台异步**触发 refresh-only workspace 重建，commit 立即返回；该内部 setup 必须同时具有 marker、两个 pinned launcher 与有效继承 credential，在 lifecycle lease 内对全部 confirmed child 执行 bounded `codegraph sync <repo>`，再执行 Graphify re-extract + merge，禁止 CodeGraph install/init、managed exclude、routing injection 与 hook re-install。event lease（`graphify-out/workspace-async-refresh.lock` + pending）负责 trigger single-flight、coalesce 与 release handoff；writer lifecycle lease（`.spec-first/workspace-graph-lifecycle.lock`）串行化后台 build、显式 build、clean 和 status writer。async wrapper 持 lifecycle lease，setup child 只能校验继承 token；显式 build/clean busy 时在任何 managed mutation 前失败。clean 删除 state 后，已启动但尚未执行的旧 trigger/worker必须停止。可恢复的 provider partial（CodeGraph sync、Graphify extract/merge、build 时 source 漂移或 status receipt 清理失败）允许下一次 Git 事件重试；owner 确认、路由写入或 runtime/hook contract 类 partial 不得由 refresh-only 静默抹除。失败落盘 `workspace-async-refresh-status.json`，每次写入独立 `attempt_id`；成功 build 只以 snapshot + 原子 rename 清除启动时观察到的同一 generation，不得删除并发新 receipt。dead/malformed async lock 报 stale failure，不得伪装 in-flight。有效 runtime context 或 hooks root 不可安全确认时**绝不安装 PATH-dependent/external hook**，workspace freshness 降级为显式刷新。消费侧**只读**；仍需即时刷新、非 Git 变化或 hook 不可用时重跑 `--workspace-graph --repos ...`。Watcher、hook marker、派发成功和历史 receipt 都不提升 workspace freshness。
7. **Setup / clean surfaces。** Build/status 使用 `spec-runtime-setup --only codegraph,graphify --workspace-graph` / `--workspace-graph-status`。Workspace build 属于 provider mutation，selected child 的当前 host runtime projection 缺失或过期时必须在任何 provider/artifact 写入前阻断。Refresh-only 不覆盖上一份 completed state；async/lifecycle facts 单独表达 in-flight，最终结果再原子发布，确保刷新期间的新 Git 事件仍可进入 event coalesce。Clean 使用 `spec-runtime-setup --workspace-graph-clean` 或 `spec-first clean --workspace-graph`，只修改显式、manifest 或 state receipt 确认的 child；discovery-only 返回 needs-confirmation。Clean 必须先独占 lifecycle lease，busy 时以 `workspace-graph-lifecycle-busy` 零 mutation 返回；活 PID 但进程身份 marker 无法确认时保持 busy，不按年龄抢占。持锁后重新读取 state/targets，再清理 child、routing、workspace current `graphify-out/` 与 legacy `.graphify/`；malformed managed hook 必须 fail closed，前置清理失败时两个 root 都保留供重试。Successor 在释放 canonical lease 前回收无 canonical ownership 的 quarantine residue，避免一次 release I/O 故障永久污染 readiness。自动发现只读取直接子目录；duplicate alias 或 nested repo roots 返回 `workspace-targets-ambiguous`，build/clean 不得据此 mutation。非 Git多仓父目录上的 `spec-first doctor` 分开显示 child projection、managed runtime facts、optional workspace graph 与 unmanaged external MCP：前两项才可构成 managed readiness；graph 仍为 advisory，external MCP 固定为 not-evaluated，均不替代源码、测试或日志结论。

## Validation Expectations

- Contract tests should pin the candidate-only rule, the readiness-status mapping, the never-cat graph artifact rule, the fallback trigger set, the recording fields, and the relay-chain no skip-layer elevation rule.
- Workflow tests should assert that each consuming workflow references this contract and keeps provider-specific command names out of workflow SKILL prose.
- Setup tests should keep readiness facts mechanical: exit status, output presence, provider lifecycle bits, and advisory next actions only.

## Appendix: Provider-Specific Examples

When a project-graph provider is available through Graphify, query with domain terms instead of the tool name itself. For example, prefer a broad architecture question about "workflow evidence boundary" over a self-referential query about "graphify". Use `graphify query`, `graphify path`, or `graphify explain` only as bounded read-only navigation, then return to source.

### Setup facts 来源快照（增量合同）

`tool-facts.v2.source_snapshot` 当前携带 `setup-source-snapshot.v2`。旧 facts 保持可读；旧字段缺失或采集失败时，doctor 的当前身份校验返回 unknown/warn。当前 producer 与 doctor 共享 `source-snapshot.cjs`，从各自受信 source root 的 registry 原始字节生成 SHA-256，并绑定 target 绝对路径、Git HEAD（folder 无 HEAD）、当前 source 内容摘要、host、platform，以及 registry 指定的 host config/precedence guard 文件摘要。这里不哈希按需求改写的 effective registry，避免同一个 source 因调用 scope 不同而误判漂移。发布时还对照本次加载的 canonical source registry；执行期间变化记录 `registry-changed-during-setup`，旧 probe 不得借新快照获得 freshness。

- 当前 registry、HEAD、source 内容/类型、target、host/platform 或宿主配置发生可确认变化：`setup-facts-source-snapshot-mismatch` / stale，不等 TTL 到期。
- 任一关键身份缺失、配置或 source 路径不安全/不可读取、Git target 无 HEAD、内容采集超出预算：`setup-facts-source-snapshot-incomplete` / unknown。已知变化优先于其他维度缺失；TTL 过期仍为 stale。
- 快照只记录摘要，不保存配置内容。当前路径从受信 registry 推导，不能按历史 facts 的任意路径读取文件；只读解析不产生宿主写授权。
- 此快照尚未覆盖实际 Provider version 与图 receipt currentness；这些仍由 Provider scope/receipt 检查承担，U8 的统一联调尚未完成。doctor pass 只表示其已检查的决策输入，没有授权 graph query 或证明图的语义正确性。

v2 的 `source_kind` 为 `git`、`folder` 或 `unknown`；`source_content_sha256` 绑定相对路径、文件 mode 与实际字节摘要。Git 范围是当前 target 内的 tracked 和非 ignored untracked 文件，并精确纳入即使被 ignore 的 `.spec-first/config.local.yaml`；删除或缺失文件也参与摘要；嵌套 target 不读取 sibling。非 Git folder 递归采集 target 内文件，排除依赖目录 `node_modules`、`.venv`、`venv`、`__pycache__`，不把未解析的 `.gitignore` 当作已应用。两者均排除 `source-snapshot.cjs` 中明确列出的 generated roots：setup facts/runtime-capabilities、setup scenario fingerprint、cache/audits/governance、图产物与 host skill/spec-first mirror；用户 local config 仍参与摘要。该范围不证明 ignored source、外部依赖或 generated runtime 当前性。

读取限制为最多 20,000 个文件、单文件 32 MiB、合计 256 MiB、内容阶段约 3 秒（同步文件操作和 Git 命令超时可能使实际耗时略超预算）。symlink、hardlink、特殊文件、submodule 目录、无法读取、扫描期间变化或超限都产生 null 摘要与 `source-content-snapshot-unavailable`，consumer 不能把部分扫描提升为 fresh。采集前后核对目录清单与文件 metadata，但不宣称持有文件系统全局锁。v1 仍可解析；与 v2 当前快照比较时返回 unknown，不静默补齐旧证据。非 Git folder 在其声明的 bounded 范围内可以比较内容；检测到 `.git` 而无法获取 HEAD 时仍为 unknown。

`normalizeSetupFacts` 是纯转换入口；仅有时间戳的 freshness 不等于当前磁盘身份已核对。`computeDecisionInputHealth` 在选定 host 后采集当前快照并比较；其他 consumer 需要当前身份结论时应使用该入口，不能把旧投影的时间 freshness 升为现场执行通过。
