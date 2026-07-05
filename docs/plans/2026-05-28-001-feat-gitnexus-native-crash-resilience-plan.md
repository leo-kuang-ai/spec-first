---
title: GitNexus native crash resilience for spec-graph-bootstrap
type: feat
status: superseded
date: 2026-05-28
superseded_at: 2026-05-28
superseded_by: pin-upgrade-gitnexus-1.6.6-rc.76
spec_id: 2026-05-28-001-gitnexus-native-crash-resilience
origin: /tmp/spec-first-incident-2026-05-28-gitnexus-native-crash-resilience.md
---

# GitNexus native crash resilience for spec-graph-bootstrap

> **STATUS: SUPERSEDED (2026-05-28)** — 上游 GitNexus PR #1833 (worker-pool race fix) 已并入 `1.6.6-rc.76`，且本仓库 pin 已升级至 `gitnexus@1.6.6-rc.76`（CHANGELOG v1.8.2 2026-05-28 11:25:00），plan 设计针对的 SIGABRT/Napi::Error 触发条件在当前 pin 下不再复现。本 plan 不执行，保留作为 incident replay 与 4-Harness 空洞分析的历史档案；如未来 1.6.6+ stable 上 race 复发，可直接复活本文件或拆分为更小的 contingency plan。详见下方 ## Supersedes Rationale。

## Supersedes Rationale

### 不执行的核心理由

1. **触发条件已消失**：plan 解决的是 GitNexus 1.6.5 worker-pool race；当前 pin `gitnexus@1.6.6-rc.76` 已含上游 PR #1833 修复。U1+U2+U3（约占 plan 63% 设计量）针对的失败模式在当前 pin 下不再发生；待 1.6.6 stable 切 pin 后这部分代码将完全是死代码。
2. **抽象层放错**：U1/U2/U3 把 `gitnexus-analyze-sigabrt` 等 provider-specific reason code 写进 bootstrap 通用调度器；正确位置是 provider adapter 声明 retry policy、bootstrap 通用层只读声明。当前写法等于把 GitNexus 这一版 bug 永久编码进 spec-first 状态机，未来新 provider 复用不了。
3. **U4 与 U1-U3 没有真正耦合**：U4 解决的是 workspace readiness 中间快照 stale（架构债），U1-U3 解决的是 provider crash 兜底（可靠性补丁），两者只是 incident 同时暴露，技术上不耦合。
4. **U4 自身撞上更深的契约债**：doc-review 发现 U4 在 `--write-artifact` durable 路径上会让 `query_usability_counts` 出现 `registry-present-query-unverified`，违反 `docs/contracts/workspace-gitnexus-consumption.md:46` 的 4-key 闭集约束。这是 `query_usability` 单 enum 承载多维度状态导致的设计债，不是 U4 本地能干净修掉的，应单独立 `query_usability` 正交化 contract v2 plan。

### 等待信号

- 等 `npm view gitnexus dist-tags.latest` 跳到 `1.6.6` stable（截至 2026-05-28 仍为 `1.6.5`，rc 通道已迭代到 `1.6.6-rc.78`）后，按 governance plan `2026-05-07-002` 流程把 pin 从 rc 通道回切到 stable。
- 切到 stable 后，本 plan 彻底不需要复活。

### 复活触发条件

仅当 **1.6.6+ stable 上 race 复发** 或 **新 GitNexus 版本引入等价 native crash 类失败** 时，复活本文件。复活时应同步重新评估：
- U1-U3 是否抽象到 provider adapter retry policy（不再写死 gitnexus）
- U4 是否拆分为独立的 `workspace-gitnexus-readiness` 实时聚合 plan，前置依赖 `query_usability` 正交化 contract v2

### 已沉淀价值

下列内容即使不执行 plan 也保留长期参考价值：
- Problem Frame 里 4 个 Harness 空洞分析（Evidence ×2 + Governance ×2）— 可作为未来类似 incident 的诊断模板
- Origin document 中 6/6 vs 4/6 race 对照实验 — 为 retry 设计提供经验值
- Key Technical Decisions 中关于 `failure_class=provider-crash-recovered` 与 `incremental_fallback_success_failure_info` 对齐的论证 — 未来设计 recovery 字段时可复用

---

## Summary

在不绕过上游 GitNexus race 的前提下，让 `spec-graph-bootstrap` 在面对 GitNexus 1.6.5/1.6.6-rc 系列 worker-pool race 暴露的 native abort（SIGABRT/Napi::Error）时具备可解释、可重试、可对齐的容错能力：扩展 `classify_provider_failure` 识别 SIGABRT/Napi 痕迹、按 crash 类失败做一次有限次自动 retry、在 raw log 极短时附加诊断快照、并新增一个 readiness aggregate 的实时聚合路径，让 workspace summary 与子仓 status 不再漂移。

---

## Problem Frame

`spec-graph-bootstrap --all-repos` 在 GitNexus 1.6.5（PR #1833 修复，1.6.6-rc.76 已含；origin document 中以 1.6.6-rc.75 做的对照实验同样适用）下对中等规模 child repo 高概率触发 worker idle timeout terminate native parser frames 导致的 process-fatal abort。该事件链在 spec-first 一侧暴露 4 个 Harness 空洞：

1. **Evidence Harness** — `bootstrap-providers` 把 stdout+stderr 合并到 raw log，native abort 时 stderr 仅 91 字节就 std::terminate；落到 `status.json` 的 raw log 没有可推理信息。
2. **Governance Harness** — `classify_provider_failure` 仅识别 exit_code=139 (SIGSEGV)；SIGABRT (134) 和 Python wrapper 转的 250 都退化为 `provider-command-failed`，next_action 不可执行。
3. **Governance Harness** — `provider-crash` 失败 0 重试。race 是概率事件（同仓 6 跑 race 2 次），单仓 retry 1 次实测 100% 消化；当前用户必须手动单仓 rerun。
4. **Evidence Harness** — `compile-workspace-gitnexus-readiness` 读取的是 `workspace-graph-targets.v1` 快照而非子仓 `status.json` 实时聚合，导致子仓修复完成后 workspace summary 仍显示 partial / unavailable，状态漂移。

详细 incident replay、上游 PR/issue 引用、6/6 vs 4/6 对照实验和 raw log 快照在 origin document 中保留（见下方 Sources）。

---

## Requirements

- R1. 用户跑 `spec-graph-bootstrap` 触发 GitNexus native crash 时，证据始终可见、不被 retry 静默吞掉：
  - 若 retry 全部失败：顶层 `failure_class=provider-crash`、`reason_code=gitnexus-analyze-sigabrt`、`recommended_action` 明确指向已知 race 与升级 pin 路径
  - 若 retry 后成功：顶层 `failure_class=provider-crash-recovered`、`reason_code=gitnexus-analyze-sigabrt-recovered`、`recommended_action` 仍提示"已自动 retry，建议升级 pin 减少未来 race"（参照现有 `incremental-fallback-recovered` 模式）
  - 每次 attempt 的分类结果同步写入 `command_results[].attempt_failure`，无论成功或失败，retry 历史完整可追
  - 所有 attempt 的 raw log 完整保留 — 用户无需翻 GitHub issue 即可定位真因
- R2. crash 类失败（且仅 crash 类）在 bootstrap 内自动 retry，默认 1 次，可通过 env 覆盖；retry 仍失败时把首次和重试的 raw log 全部保留到 `command_results[]`，并通过 `attempt_role` 标记 `primary` / `crash-retry-N`。
- R3. raw log < 200 字节时，bootstrap 在不重跑 provider command 的前提下追加一次诊断快照（node 版本、npx 版本、`gitnexus --version`、stderr 关键字片段）到 `command_results[].diagnostics_capture`，不污染原 raw log。
- R4. 用户在子仓修复 GitNexus 后，无需重新触发 child analyze 也能让 workspace summary / `gitnexus-readiness.json` 与子仓 `status.json` 对齐。
- R5. `provider-status.v1` 和 `command_results[]` 的 schema 扩展全部向后兼容，下游 consumer（spec-work、spec-debug、spec-code-review、spec-plan、`compile-workspace-gitnexus-readiness`、`graph-provider-consumption.md` 文档）继续可读旧 artifact，新枚举值在文档中明确登记。
- R6. 双宿主一致：Bash 和 PowerShell 实现产出相同 schema 与 reason_code，相同 stub crash provider 在两宿主下行为可断言。

---

## Scope Boundaries

- 不在 spec-first 端尝试 patch 或绕过 GitNexus 上游 race；retry/分类只是容错，不试图掩盖真因。
- 不自动升级 GitNexus pin；pin 升级仍走 `docs/plans/2026-05-07-002-feat-gitnexus-evidence-governance-plan.md` 治理流程。
- 不实现持续监控 race 频率（如 telemetry/上报）；该方向边际成本陡升，留给独立 plan。
- 不引入对其他 provider 的通用 crash retry；本 plan 只覆盖 gitnexus，避免过早抽象。下游若需要相同能力再单立 plan 抽公共骨架。
- 不修改 GitNexus 自身 npm 包内容；不写 `.gitnexus/`。
- 不重新设计 incremental→full fallback 路径，retry 是新维度，与 incremental fallback 解耦（见 U2 Approach）。
- 不在 `27-004 mixed-topology plan` Scope Boundaries 已声明的 advisory `provider_runtime_advisory.crash_frequency` 字段范围内做覆盖；该字段仍是 27-004 的产物，本 plan 不读不写它。

---

## Graph Readiness

- target_repo: spec-first
- status: stale
- source_revision: 16b0cf203a10ac223a3a0112ffa6eea96f48896c
- current_revision: 待 plan 执行时由 `spec-graph-bootstrap` 重新校验
- stale: true（worktree dirty + bootstrap-providers.{sh,ps1} 已在 graph-affecting 列表中）
- primary_providers: [gitnexus]
- degraded_providers: []
- fallback_capabilities: bounded direct repo reads + 已读源文件
- runtime_mcp_evidence: not-evaluated（本 plan 阶段未调用 live MCP）
- confidence: high — 核心证据来自直接读源文件（`bootstrap-providers.sh`、`compile-workspace-gitnexus-readiness.js`、`provider-status.v1` 实例、`tests/unit/spec-graph-bootstrap.sh`）和 origin document 中 6/6 vs 4/6 实测对照
- limitations: graph-facts.json 的 graph-affecting 列表已包含本 plan 即将修改的 `bootstrap-providers.{sh,ps1}`；执行前建议 `spec-graph-bootstrap` 重新刷新一遍，但本 plan 的设计不依赖图证据 — 所有断言均可由 LLM 直接读源验证

---

## Context & Research

### Relevant Code and Patterns

- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh:2111-2179` — `classify_provider_failure` 当前实现；新增 SIGABRT/Napi/SIGTERM 分支的延伸点。
- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh:2181-2244` — `append_command_result` / `append_bootstrap_command_result`；schema 已经预留 `attempt_role` 字段（U2 直接复用，无需扩 schema）。
- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh:2604-2643` — analyze 调用现场（incremental → full fallback 路径）；crash retry 应该挂在 full attempt 失败之后、`refresh_process_failed=true` 之前。
- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1:1932` — PowerShell 端的 `classify_provider_failure` 等价实现，需要同步。
- `skills/spec-graph-bootstrap/scripts/compile-workspace-gitnexus-readiness.sh` + `src/cli/helpers/compile-workspace-gitnexus-readiness.js` — 当前从 `workspace-graph-targets.v1` 快照计算 readiness；U4 在此扩 `--from-child-status` 模式。
- `tests/unit/spec-graph-bootstrap.sh:65-92, 1335, 1781-1783` — 已有的 `make_fake_bin` + `FAIL_GITNEXUS_ANALYZE_SIGSEGV` 模板；新 stub 直接套用这套范式（新增 `FAIL_GITNEXUS_ANALYZE_SIGABRT`、`FAIL_GITNEXUS_NAPI_FATAL`、`FLAKY_GITNEXUS_ANALYZE_FIRST_N`）。
- `docs/contracts/graph-provider-consumption.md:74` — `command_results[].refresh_mode` 与 `command_results[].attempt_role` 已被声明为下游可消费字段；本 plan 在文档侧补 `attempt_role` 的合法值集合（`primary` / `crash-retry-N`）。
- `.spec-first/providers/gitnexus/status.json:113-126` — 真实 `command_results[].attempt_role: primary` 实例，确认字段已经在产线生成。

### Institutional Learnings

- `docs/plans/2026-05-27-004-feat-mixed-topology-broken-worktree-optimization-plan.md:79` — 已显式排除"GitNexus 1.6.5 native crash 兜底"，本 plan 与之互补且不重叠。
- `docs/plans/2026-05-07-002-feat-gitnexus-evidence-governance-plan.md` — pin 升级治理；本 plan 治理"pin 升级前的容错"。
- `docs/plans/2026-05-09-001-fix-graph-bootstrap-gitnexus-repair-preflight-plan.md` — gitnexus repair preflight；可借鉴的失败分类设计经验。

### External References

- 上游 PR：[GitNexus#1833](https://github.com/abhigyanpatwari/GitNexus/pull/1833) (2026-05-26 merge) — worker idle timeout race 修复
- 上游 issue：[GitNexus#1848](https://github.com/abhigyanpatwari/GitNexus/issues/1848) (OPEN, 2026-05-27 仍在更新)、[#1665](https://github.com/abhigyanpatwari/GitNexus/issues/1665) (CLOSED) — 多平台多次复现
- 上游修复版本：1.6.6-rc.76（截至 2026-05-28 的最新版本，含 PR #1833 修复）；origin document 用 1.6.6-rc.75 做了 6/6 通过的对照实验，rc.76 在同一修复线上

---

## Key Technical Decisions

- **Retry 仅识别 `failure_class: provider-crash`**：通用 retry 会掩盖真正命令失败（配置错误、权限错误、网络错误）；只在 process-fatal 类失败上做有限次重试，避免误伤可执行下游修复路径。
- **Retry 计数与 base sleep 通过 env 覆盖**：默认 1 次重试 + 2 秒 base sleep；用 `GRAPH_BOOTSTRAP_PROVIDER_CRASH_RETRY` (整数) 与 `GRAPH_BOOTSTRAP_PROVIDER_CRASH_RETRY_BASE_SLEEP_SECONDS` 控制。两个 env 的默认值在脚本顶部以 readonly 常量声明，避免下游意外覆盖；负数与非数字 fallback 到默认。
- **`attempt_role` 复用现有 schema 字段**：当前 schema 已经支持 `primary` 值，扩枚举到 `crash-retry-1`、`crash-retry-2` 等，自然向后兼容；不引入并行字段。
- **Diagnostics capture 不污染 raw log**：raw log 是 provider stdout+stderr 的可信镜像；诊断信息走新字段 `command_results[].diagnostics_capture`（结构化 object），保持 raw log 的"原始输出"语义。
- **`diagnostics_capture` 仅在 raw log 字节数 < 阈值且 exit_code != 0 时触发**：避免成功路径上无意义的 cost；阈值（默认 200）可通过 `GRAPH_BOOTSTRAP_DIAGNOSTICS_CAPTURE_RAW_LOG_BYTES` 调整。
- **Crash retry 与 incremental→full fallback 解耦**：incremental fallback 已经是"业务路径上"的兜底（incremental 失败转 full），它不应当被视为 crash；retry 只挂在最终的 full 调用失败之后；如果 incremental 调用 crash，先按现有逻辑落到 full，full crash 再触发 crash retry。
- **Retry 成功路径仍写 `failure_class=provider-crash-recovered`（不静默吞 crash）**：参照已有 `incremental_fallback_success_failure_info` (`bootstrap-providers.sh:2391`) 模式 —— 那里 incremental 失败、full 兜底成功后顶层仍写 `failure_class=incremental-fallback-recovered` / `reason_code=incremental-refresh-failed-fallback-full`。本 plan 的 crash recovered 用同一形态：`reason_code=gitnexus-analyze-sigabrt-recovered`，`recommended_action` 仍提示升级 pin 以减少 race 频率。这样 R1 要求的"crash 解释证据始终可见"在成功路径上也成立。
- **每次 attempt 单独留分类证据 `command_results[].attempt_failure`**：每条 bootstrap entry 都附 `{failure_class, reason_code, exit_code, recommended_action}` 子对象（不附 `failed_phase`，由顶层语义承载），无论该 attempt 成功或失败。下游消费者可逐条审计 retry 历史；顶层 `failure_class` 仍由"最后一次 attempt 的 classify 结果 + recovered 语义"决定，单源真相不混乱。
- **`compile-workspace-gitnexus-readiness` 新增独立模式 `--from-child-status`**：作为现有 `script` / `skill-prose` 的同级 mode（详见 U4），输入是子仓 status 文件列表（由 caller 列出，避免 helper 自行扫描文件系统）；workspace-targets snapshot 仍是 fallback。同级 mode 的好处：与现有 mode 隔离，不影响 `workspace-graph-targets.v1` 快照消费链路。
- **新 mode 复用现有 `invocation_mode` + `generated_from` carrier，不引入 `runtime_mcp_evidence`**：现有 helper payload (`compile-workspace-gitnexus-readiness.js:114-129`) 已用 `invocation_mode` 区分 mode，用 `generated_from.{workspace_targets, registry_list, group_list}` 记录证据来源。新 mode 在 `invocation_mode` 加 `from-child-status` 取值、在 `generated_from` 加 `child_statuses[]` 子键即可，schema 字段集合不变。child status 是本地文件读取，不是 runtime MCP evidence，强行用 `runtime_mcp_evidence` 字段名会语义误导下游。
- **新 mode 严格遵循现有 `query_usability` promotion gate**（`workspace-gitnexus-consumption.md:65-70`）：缺失 / 不可读 / 非 `provider-status.v1` schema / `provider != gitnexus` 的 child status 一律归 `query_usability=unavailable`，不得归 `stale-advisory`。stale-advisory 必须满足"`last_indexed_commit != null`"或"当前 session live query proof 通过"两条之一；缺失 status 两条都不满足。这一边界让新 mode 与既有契约语义一致，下游消费者读到的 `query_usability` 值含义不发生漂移。
- **Git 行为信号识别 SIGABRT 跨平台 exit code**：macOS/Linux native abort 报 134（128+6），Python `subprocess` wrapper 的 npx 链路报 250（-6 转 unsigned 0xFA），共同表征同一信号；分类逻辑同时处理两个 exit code。
- **diagnostic 关键字白名单**：`libc++abi`、`Napi::Error`、`uncaught exception of type Napi`、`abort()` 任一命中即归入 `gitnexus-analyze-sigabrt`，不依赖 exit_code（防御不同 wrapper 把 SIGABRT 转成其他 code）。
- **Recommended action 文案显式提到 1.6.6+**：让 LLM/用户拿到 status.json 时不需要追溯 PR；reason_code 不写死版本号，文案承担版本提示职责，避免每次升级 pin 都改 reason_code 枚举。
- **Diagnostics capture 默认零网络/零 npm cache 副作用**：`provider_package_spec` 与 `provider_version_policy` 直接从 `bootstrap_fingerprint.provider.{configured_package_spec, bundled_package_spec, version_policy}` 读取（这是已有 deterministic fact，写在 status.json 里），不再发任何 `npx -y gitnexus@... --version` 调用。只有用户显式设 `GRAPH_BOOTSTRAP_DIAGNOSTICS_CAPTURE_PROBE_VERSION=1` 才允许 best-effort runtime probe，且强制走既有 `run_configured_command` 路径 + 5s timeout + `--prefer-offline`，避免诊断阶段反而引入 npm registry / lock contention 风险（origin doc 中 race 已经够多，诊断不应再加新故障面）。

---

## Open Questions

### Resolved During Planning

- 是否扩 `provider-status.v1` 到 `v2`？— 不需要。`failure_class`/`reason_code` 是开放枚举，新增值（含 `provider-crash-recovered`、`gitnexus-analyze-sigabrt-recovered`）是兼容扩展；`attempt_role` 字段已在 schema 中并已写入 production status.json；`command_results[].attempt_failure` 与 `command_results[].diagnostics_capture` 是新增**可选**子对象（旧消费者不读不报错）。文档侧（`docs/contracts/graph-provider-consumption.md`）补登记新枚举/子对象即可。
- 是否扩 `workspace-gitnexus-readiness.v1` 到 `v2`？— 不需要。新 mode 仅扩 `invocation_mode` 枚举值（新增 `from-child-status`）与 `generated_from` 子键（新增 `child_statuses[]`），顶层字段集合与 `script` / `skill-prose` mode 完全一致；不新增 `runtime_mcp_evidence` 等假字段。
- retry 应该在 `bootstrap` 阶段还是 `status` 阶段？— 仅 bootstrap 阶段。`status`/`query_probe` 是诊断阶段，不是 race 触发面；强行 retry 会延长失败 latency。
- retry 成功后顶层 `failure_class` 应该写 null 还是 recovered？— 写 `provider-crash-recovered`。这与现有 `incremental_fallback_success_failure_info` (`bootstrap-providers.sh:2391`) 模式一致：成功路径上仍记录"曾经失败 + 已恢复"作为可观测证据，下游可据此判断是否应升级 pin。R1 要求 crash 解释证据"始终可见"在 recovered 路径上同样成立。
- diagnostics_capture 是否应该跑 `npx -y gitnexus@... --version` 复现 race？— 不应该。一是该 query 命中同一 worker pool 路径会再次触发 race（origin doc 第 4 段实验证据）；二是 `npx -y` 会引入 npm registry / cache 副作用，与诊断阶段"零副作用"目标冲突。`provider_package_spec` 直接从 `bootstrap_fingerprint` 读取，已是 deterministic fact。可选 probe 由 `GRAPH_BOOTSTRAP_DIAGNOSTICS_CAPTURE_PROBE_VERSION=1` 显式打开，且强制走既有 `run_configured_command` + offline-preferred 路径。
- workspace readiness 缺失 child status 应该归哪一档 query_usability？— 严格归 `unavailable`。现有 promotion gate (`workspace-gitnexus-consumption.md:65-70`) 要求 `last_indexed_commit != null` 或当前 session live query proof 才能 promote 到 `stale-advisory`；缺失 status 两条都不满足。强行归 `stale-advisory` 会让下游消费者读到的语义漂移。
- workspace readiness 是否应该自动扫描所有子仓 status.json？— 不自动扫。helper 接受 caller 显式提供的子仓 status 路径列表，避免文件系统副作用、避免 graph-targets 之外的语义入侵。caller（脚本或 LLM 工作流）拥有"哪些子仓属于本次决策"的语义。

### Deferred to Implementation

- crash retry 之间是否需要 jitter？— 默认固定 sleep 即可；若 V3 集成测试显示 1 仓 retry 仍有概率连击 race，再追加 jitter（execution-time 信号驱动）。
- `diagnostics_capture` 的 stderr fragment 截取上界是多少？— 默认与 raw log 的 1024 字节同步，但实际值由实现时取舍 stub fixture 与真实 race 输出确定。
- PowerShell 端 `Start-Sleep -Seconds` 在 1.6.5 race 期间是否需要 `[GC]::Collect()` 类显式资源回收？— 优先简单 sleep；只有 V4 双宿主对照测试显示 Windows 上仍有概率连击 race 时再加。

---

## Implementation Units

### U1. classify_provider_failure 扩 SIGABRT / Napi / SIGTERM 识别（双宿主）

**Goal:** 让 `classify_provider_failure` 把 GitNexus native abort（SIGABRT 134/250、Napi 关键字、SIGTERM 143）识别为可执行的 `provider-crash` / `provider-terminated` 分类，next_action 文案明确指向已知 1.6.5 race 与升级 pin 路径。

**Requirements:** R1, R5, R6

**Dependencies:** None

**Files:**
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh` (`classify_provider_failure` 函数体，~2117 起)
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1` (`classify_provider_failure` 等价 PowerShell 函数，~1932 起)
- Test: `tests/unit/spec-graph-bootstrap.sh` (扩展 `make_fake_bin` 增加 SIGABRT/Napi/SIGTERM stub；新增分类断言)
- Test: `tests/unit/bootstrap-providers-powershell-contracts.test.js`（如已有 ps1 等价测试，沿用；否则在 .sh 测试里加 PowerShell 等价 case）

**Approach:**
- 复用现有 SIGSEGV 分支的 jq 输出结构，新增三个分支：
  - exit_code in {134, 250} 或 diagnostic 命中 `libc\+\+abi|Napi::Error|uncaught exception of type Napi|abort\(\)` 关键字白名单 → `failure_class=provider-crash`, `reason_code=gitnexus-analyze-sigabrt`
  - exit_code=143 (SIGTERM) → `failure_class=provider-terminated`, `reason_code=gitnexus-analyze-sigterm`
  - 关键字白名单优先于 exit_code 判断（防御 npx wrapper 把信号转码成不同 exit code）
- recommended_action 文案直接引用"已知 1.6.5 worker-pool race（PR #1833 在 1.6.6+ 修复），bootstrap 已自动 retry 一次（如适用），如 retry 仍失败请升级 pin 至 1.6.6+ 或单仓 rerun"
- PowerShell 端用 `-match` regex 与 `-in` 集合做等价匹配
- 不动 SIGSEGV / 124 / 网络 / lbug / 通用 fallback 分支顺序，新分支插在 SIGSEGV 之后、 124 之前

**Patterns to follow:**
- 现有 SIGSEGV 分支的 jq output shape（`failed_phase`, `failure_class`, `reason_code`, `exit_code`, `recommended_action` 五字段）
- `provider-storage-write-failed` 分支的 grep -Eiq 关键字匹配范式

**Test scenarios:**
- Happy path: stub 返回 exit_code=134 + 91 字节 stderr `libc++abi: terminating due to uncaught exception of type Napi::Error` → `failure_class=provider-crash`, `reason_code=gitnexus-analyze-sigabrt`, recommended_action 提及 "1.6.6"
- Edge case: stub 返回 exit_code=250 但 stderr 空 → 仍归 `gitnexus-analyze-sigabrt`（exit_code 已足够）
- Edge case: stub 返回 exit_code=1 但 stderr 含 `Napi::Error` → 归 `gitnexus-analyze-sigabrt`（关键字优先）
- Edge case: stub 返回 exit_code=143 + stderr 空 → `failure_class=provider-terminated`, `reason_code=gitnexus-analyze-sigterm`
- Edge case: 现有 SIGSEGV (139) 路径不变 → 回归 `gitnexus-analyze-sigsegv`，原断言全部通过
- Error path: 普通 exit_code=1 + 普通 stderr → 仍走 `provider-command-failed` 兜底（不被新分支误命中）
- Integration: PowerShell 与 Bash 在同一 stub 输入下产出相同 reason_code 与 recommended_action 子串

**Verification:**
- `tests/unit/spec-graph-bootstrap.sh` 全部既有断言通过 + 新增 5 个分类断言通过
- `bootstrap-providers-powershell-contracts.test.js`（或扩展的 ps1 case）通过
- `node -c` 语法检查 + `bash -n` 通过

---

### U2. crash 类失败有限次自动 retry（双宿主）

**Goal:** 在 full bootstrap attempt 失败且 `failure_class=provider-crash` 时，按 env 配置自动 retry N 次（默认 1 次），retry 之间 base sleep N 秒；保留所有 attempt 的 raw log 与 `command_results[]` 条目（含每条 `attempt_failure` 子对象），并通过 `attempt_role` 字段标记；retry 后成功时顶层仍写 `failure_class=provider-crash-recovered`，不静默吞 crash 证据。

**Requirements:** R1, R2, R5, R6

**Dependencies:** U1（依赖 `failure_class=provider-crash` 的可识别）

**Files:**
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`（在 ~2632-2643 full primary 执行块后插入 crash retry 循环；`incremental-fallback-full` 路径上的 fallback 调用同步处理；新增 `crash_recovered_failure_info` 辅助函数，命名对齐既有 `incremental_fallback_success_failure_info`；扩展 `append_bootstrap_command_result` 接受 `attempt_failure` 子对象）
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`（PowerShell 等价 retry 循环 + `crash_recovered_failure_info` 等价函数 + `attempt_failure` 写入）
- Test: `tests/unit/spec-graph-bootstrap.sh`（新增 stub `FLAKY_GITNEXUS_ANALYZE_FIRST_N=K`：前 K 次返回 SIGABRT，第 K+1 次返回 0；端到端验证 retry 行为；断言 recovered 路径顶层 `failure_class=provider-crash-recovered`）

**Approach:**
- 在脚本顶部以 readonly 常量声明默认值：`GRAPH_BOOTSTRAP_PROVIDER_CRASH_RETRY_DEFAULT=1`、`GRAPH_BOOTSTRAP_PROVIDER_CRASH_RETRY_BASE_SLEEP_SECONDS_DEFAULT=2`
- 用辅助函数 `resolve_crash_retry_config` 读 env override，做整数与非负校验，非法值 fallback 到默认
- 在 full attempt（无论是 primary 路径还是 incremental fallback 路径）的 RUN_EXIT_CODE != 0 后调用 `classify_provider_failure`；若 `failure_class=provider-crash` 且仍有 retry quota，sleep 后重跑相同 command；重跑前重置 raw log 路径到独立文件（`analyze.crash-retry-N.log`），避免覆盖前一次证据
- 每次 attempt 通过 `append_bootstrap_command_result` 单独写入 `command_results[]`，`attempt_role` 取值 `primary`（首次）或 `crash-retry-N`（N=1..M），并附 `attempt_failure` 子对象 `{failure_class, reason_code, exit_code, recommended_action}`（成功 attempt 全部为 null，但字段始终存在以保持 schema 稳定）
- retry 成功 → 走原有 `final_full_attempt_succeeded=true` 路径；新增 `crash_recovered_failure_info()` 辅助函数（命名对齐既有 `incremental_fallback_success_failure_info`），返回 `failure_class=provider-crash-recovered` / `reason_code=gitnexus-analyze-sigabrt-recovered` / `recommended_action="GitNexus native crash 已通过 retry 消化，建议升级 pin 至 1.6.6+ 减少未来 race。已知上游 race（PR #1833）。"`，赋给顶层 `failure_info`；status 仍为 `ready`
- retry 耗尽仍失败 → 走原有 `refresh_process_failed=true` 路径，顶层 `failure_info` 取最后一次 attempt 的分类（`failure_class=provider-crash`、`reason_code=gitnexus-analyze-sigabrt`）
- raw log 路径辅助：扩展 `provider_bootstrap_log_for_mode` 接受 attempt-suffix 参数，或在 caller 端拼接 `${bootstrap_log%.log}.crash-retry-${N}.log` — 实现时取更短一条
- PowerShell 端用 `for ($i=1; $i -le $retryCount; $i++)` 等价循环，sleep 用 `Start-Sleep -Seconds`

**Patterns to follow:**
- `incremental-fallback-full` 块（2613-2630）的 RUN_EXIT_CODE 检查 + 多次 `append_bootstrap_command_result` 调用
- `attempt_role` 已有的 `primary` / `fallback` 取值约定

**Test scenarios:**
- Happy path: stub 第 1 次 SIGABRT，第 2 次成功 → status=ready；`command_results[]` 包含两条 bootstrap entry，`attempt_role`=`primary`/`crash-retry-1`，第 1 条 `attempt_failure.failure_class=provider-crash`、`attempt_failure.reason_code=gitnexus-analyze-sigabrt`，第 2 条 `attempt_failure.failure_class=null`；顶层 `failure_class=provider-crash-recovered`、`reason_code=gitnexus-analyze-sigabrt-recovered`、`recommended_action` 提及 "1.6.6+"（**recovered 路径不静默吞 crash 证据**）
- Edge case: `GRAPH_BOOTSTRAP_PROVIDER_CRASH_RETRY=2`，stub 前 2 次 SIGABRT，第 3 次成功 → 三条 bootstrap entry，`attempt_role`=primary/crash-retry-1/crash-retry-2，前两条 `attempt_failure` 各带 sigabrt 分类、第三条 null；顶层 `failure_class=provider-crash-recovered`
- Edge case: `GRAPH_BOOTSTRAP_PROVIDER_CRASH_RETRY=0` → crash 立即 status=failed，零 retry，行为与现状等价；唯一一条 entry 的 `attempt_failure` 与顶层 `failure_class=provider-crash` 一致
- Edge case: `GRAPH_BOOTSTRAP_PROVIDER_CRASH_RETRY=abc`（非法）→ fallback 到默认 1 次
- Edge case: `GRAPH_BOOTSTRAP_PROVIDER_CRASH_RETRY=-1`（负数）→ fallback 到默认 1 次
- Error path: stub 始终 SIGABRT → retry 耗尽后 status=failed，`command_results[]` 包含 1+default_retry 条 bootstrap entry，每条 `attempt_failure` 都是 sigabrt；顶层 `failure_class=provider-crash`、`reason_code=gitnexus-analyze-sigabrt`（**非 recovered**），所有 raw log 文件落地
- Error path: stub 第 1 次 SIGABRT，第 2 次普通 exit=1（非 crash）→ `attempt_role=crash-retry-1`，retry 不再继续（非 crash 失败立即终止）；第 1 条 `attempt_failure` 是 sigabrt，第 2 条 `attempt_failure` 是 `provider-command-failed`；顶层 `failure_class=provider-command-failed`（最后一次 attempt 决定）
- Integration: incremental→full fallback 路径上，full attempt SIGABRT → retry 在 full attempt 上生效（不在 incremental 上），retry 成功后 `fallback_from_incremental=true` 与 `attempt_role=crash-retry-N` 同时存在；顶层 `failure_class=provider-crash-recovered`（不被 `incremental-fallback-recovered` 覆盖；两者同发生时 crash recovered 优先记录，因为它代表更后阶段的 retry 行为）
- Integration: PowerShell 与 Bash 同 stub 输入下产出 `command_results[]` 长度、`attempt_role` 序列、每条 `attempt_failure` 形态一致

**Verification:**
- 上述 8 个 scenario 端到端通过
- `command_results[].attempt_role` 与新增 `command_results[].attempt_failure` 字段顺序、取值集合与 `docs/contracts/graph-provider-consumption.md` 文档登记一致
- 顶层 `failure_class` / `reason_code` 在 recovered 与 unrecovered 两条路径上的取值都能用单一 jq 表达式断言（不依赖语义猜测）
- 成功路径下 `bootstrap_fingerprint` 仍正确（最后一次 attempt 的状态，不被中间失败 attempt 干扰）

---

### U3. raw log 极短时附加 diagnostics_capture（双宿主）

**Goal:** 当 bootstrap exit_code != 0 且 raw log 字节数低于阈值（默认 200B）时，附加一次只读诊断快照（node 版本、npx 版本、`gitnexus --version`、stderr 关键字命中标记）到 `command_results[].diagnostics_capture`，不重跑 provider analyze command，不污染原 raw log。

**Requirements:** R3, R5, R6

**Dependencies:** U1（关键字命中标记复用 U1 的关键字白名单）

**Files:**
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`（新增 `capture_provider_diagnostics` 辅助函数；在 `append_bootstrap_command_result` 调用现场判定阈值并调用 capture）
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`（PowerShell 等价 capture）
- Test: `tests/unit/spec-graph-bootstrap.sh`（新增 stub 模拟 91 字节 stderr crash；断言 `diagnostics_capture` 字段存在与字段集合）

**Approach:**
- `capture_provider_diagnostics()` 输入：provider 名、原 raw log 路径、关键字白名单结果、当前 bootstrap_fingerprint；输出：JSON object `{node_version, npx_version, provider_package_spec, provider_version_policy, raw_log_bytes, raw_log_keyword_hits[], probe_version_attempted, probe_version_result, captured_at}`
  - `node_version`: `node --version 2>/dev/null || echo "unknown"`（本地短命令，无网络）
  - `npx_version`: `npx --version 2>/dev/null || echo "unknown"`（本地短命令，无网络）
  - **`provider_package_spec`：默认从 `bootstrap_fingerprint.provider.configured_package_spec` / `bundled_package_spec` 直接读，零执行**（这是 deterministic fact，已经写在 status.json 里）
  - **`provider_version_policy`：从 `bootstrap_fingerprint.provider.version_policy` 直接读**（`pinned`/`bundled`/`floating`）
  - `raw_log_bytes`: `wc -c < "$raw_log"`
  - `raw_log_keyword_hits`: 数组，列出命中的关键字（`libc++abi`、`Napi::Error`、`abort()`、`SIGABRT`、`SIGSEGV`、`uncaught exception`）
  - `probe_version_attempted`: 默认 `false`；只有用户显式设 `GRAPH_BOOTSTRAP_DIAGNOSTICS_CAPTURE_PROBE_VERSION=1` 才置 `true`
  - `probe_version_result`: 默认 `null`；当 probe 启用时复用既有 `run_configured_command` 路径执行 best-effort `--version`，强制 5s timeout、`--prefer-offline`、失败 fallback 为 `{status: "timeout"|"error"|"unknown", message: "..."}`；不引入新的 `npx -y gitnexus@...` 调用，避免 npm registry 与 cache 副作用
- 触发条件：`exit_code != 0` 且 `raw_log_bytes < ${GRAPH_BOOTSTRAP_DIAGNOSTICS_CAPTURE_RAW_LOG_BYTES:-200}`；阈值通过 env 覆盖
- `append_bootstrap_command_result` 扩展可选 `diagnostics_capture` 参数；通过 `+ (if $diagnostics_capture != "" then {diagnostics_capture:$diagnostics_capture|fromjson} else {} end)` 合并到 entry
- 不写入 raw log 文件本身（保持 raw log 的"原始 stdout+stderr 镜像"语义）
- PowerShell 端用 `Get-Item ... | Select-Object Length`、`node --version`、`npx --version` 等价命令；fingerprint 字段同样从输入参数读取（不重新执行）；可选 probe 走相同 timeout 5s 兜底，但默认 `probe_version_attempted=false`

**Patterns to follow:**
- `append_command_result` 现有的 `+ (if $field != "" then {...} else {} end)` 可选字段合并范式
- `provider-storage-write-failed` 分支的 grep 关键字白名单语法
- `provider_configured_package_spec` (`bootstrap-providers.sh:1744`) 与 `bootstrap_fingerprint.provider.{configured_package_spec, bundled_package_spec, version_policy}` 已存在的 deterministic fact 结构 — capture 直接读这些 fact，不重新探测

**Test scenarios:**
- Happy path: stub crash + 91 字节 stderr → `diagnostics_capture.node_version` 非空，`raw_log_bytes=91`，`raw_log_keyword_hits` 包含 `libc++abi` 与 `Napi::Error`，`provider_package_spec` 等于 fingerprint 中的 `configured_package_spec`，`probe_version_attempted=false`，**全程零网络/npm 调用**
- Edge case: stub crash + raw log 500 字节（超阈值）→ 不附加 `diagnostics_capture` 字段
- Edge case: stub crash + raw log 199 字节（恰在阈值边界）→ 附加 `diagnostics_capture`
- Edge case: stub 成功 exit=0 + raw log 50 字节 → 不附加（成功路径不 capture）
- Edge case: `GRAPH_BOOTSTRAP_DIAGNOSTICS_CAPTURE_RAW_LOG_BYTES=0` → 永不 capture（开关）
- Edge case: `GRAPH_BOOTSTRAP_DIAGNOSTICS_CAPTURE_PROBE_VERSION=1` 显式启用 probe → `probe_version_attempted=true`，`probe_version_result` 是 `{status, message}` 对象；underlying 命令通过 `run_configured_command` 路径，不引入新的 `npx -y` 调用
- Error path: `node --version` 命令缺失 → `node_version=unknown`，capture 字段仍生成（不阻塞 status 写入）
- Error path: probe 启用且超时 5s → `probe_version_result={status:"timeout", message:"..."}`，capture 字段仍生成；其他字段不受影响
- Integration: U2 retry 路径上每次 crash attempt 都独立 capture（每条 `command_results[]` entry 各自带自己的 `diagnostics_capture`）；attempt 之间共享 fingerprint 字段（同一次 bootstrap 的 fingerprint 不变）

**Verification:**
- 9 个 scenario 端到端通过
- `provider-status.v1` schema 文档（`docs/contracts/graph-provider-consumption.md`）登记新字段及触发条件
- 默认路径下（`GRAPH_BOOTSTRAP_DIAGNOSTICS_CAPTURE_PROBE_VERSION` 未设）crash diagnostic capture 全程**零网络副作用、零 npm cache 写入**，可用 `strace`/`dtruss` 网络系统调用 0 命中或在测试中拦截 `npx`/`curl` 调用断言
- 真实 GitNexus 1.6.5 race 复现一次后，status.json 中 `diagnostics_capture.raw_log_keyword_hits` 应至少包含 `Napi::Error`，`provider_package_spec` 应等于 `gitnexus@1.6.6-rc.76`（pin 升级后的当前值）

---

### U4. workspace readiness 实时聚合模式（compile-workspace-gitnexus-readiness）

**Goal:** 给 `compile-workspace-gitnexus-readiness` 增加 `--from-child-status` 模式（与现有 `script` / `skill-prose` 同级），输入为 caller 显式提供的子仓 status.json 路径列表，输出与现有 `workspace-gitnexus-readiness.v1` 同 schema；让用户在子仓修复 GitNexus 后无需重跑 child analyze 也能让 workspace summary 与子仓 status 对齐。

**Requirements:** R4, R5

**Dependencies:** None（可与 U1-U3 并行；与 U2 retry 写入的子仓 status 路径形态兼容）

**Files:**
- Modify: `src/cli/helpers/compile-workspace-gitnexus-readiness.js`（增加 `from-child-status` mode 分支与 args parser）
- Modify: `skills/spec-graph-bootstrap/scripts/compile-workspace-gitnexus-readiness.sh`（薄 wrapper，无逻辑变化）
- Modify: `bin/spec-first.js` 或对应 internal command 注册点（如已有 `internal workspace-gitnexus-readiness` 子命令，扩 args；如无则新增 args 转发）
- Modify: `docs/contracts/workspace-gitnexus-consumption.md`（登记新 mode、入参、限制）
- Test: `tests/unit/workspace-gitnexus-readiness.test.js`（新增 mode 端到端 case）
- Test: `tests/unit/workspace-gitnexus-contracts.test.js`（schema 不变断言；新 mode 的 query_usability_counts 计算口径回归）

**Approach:**
- CLI 接受 `--mode from-child-status --child-status <repo:path/to/status.json> [--child-status ...]`，每条 entry 用 `repo:path` 形式显式声明子仓 id 与 status 文件路径，避免 helper 自行扫描
- 新 mode 与 `script` 互斥：从 child status 直接计算 `query_usability` / `freshness_state` / `query_usability_counts`，不读 `workspace-graph-targets.v1`；workspace-targets 仍通过 `--workspace-targets` 提供，仅用于 group/repo 元数据（topology、repo 列表对齐）
- **`query_usability` 严格遵循现有 promotion gate**（`docs/contracts/workspace-gitnexus-consumption.md:65-70`）：
  - child status 存在且可读且 `provider=gitnexus` 且 `last_indexed_commit != null` 且 `query_ready=true` → 按现有规则归 `fresh-primary` / `stale-advisory`
  - child status 存在但 `last_indexed_commit=null` 或 `query_ready=false` → 至多 `registry-present-query-unverified` 或 `definitions-pointer`，不得 `stale-advisory`
  - **child status 文件缺失 / 不可读 / 非 `provider-status.v1` schema / `provider != gitnexus` → `query_usability=unavailable`**，并在 child-level limitations 写入对应 reason（`child-status-missing` / `child-status-unreadable` / `invalid-child-status` / `unsupported-child-status-provider`）；不进 `stale-advisory`，不进 `setup-required`（该值是 refresh_eligibility 维度，不是 query_usability 维度）
  - 单子仓失败不拖崩整体：聚合层把这些 unavailable 子仓正常计入 `query_usability_counts.unavailable`
- **输出 schema 严格不变**（仍是 `workspace-gitnexus-readiness.v1`）：
  - 复用现有 `invocation_mode` 字段，新增取值 `from-child-status`（与现有 `script` / `skill-prose` 同级；下游 consumer 读 `invocation_mode` 即可识别）
  - 复用现有 `generated_from` 字段，新增子键 `child_statuses: ["repo:path", ...]` 列出本次输入的 child status 路径列表；与现有 `generated_from.workspace_targets` / `registry_list` / `group_list` 共存
  - **不引入 `runtime_mcp_evidence` 字段**（该字段在 helper 中不存在，仅 skill-prose 路径有 `runtime_mcp_overlay`）；child status 是本地文件读取，不是 runtime MCP evidence，名字本身就误导
  - 全局 schema 字段不增不减，仅枚举值与子键扩展
- 严格的 input 校验顺序与 reason_code：
  - `mode=from-child-status` 且未传任何 `--child-status` → `missing-required-option`
  - 同时传 `--child-status` 与 `--registry-list` 或 `--group-list` → `from-child-status-mode-mcp-input-forbidden`
  - `--write-artifact` 允许（与 `script` mode 一致），输出到 `.spec-first/workspace/gitnexus-readiness.json`
  - 单条 `--child-status` 的解析失败（路径不规范、`repo:` 前缀缺失）→ 立即报错 `invalid-child-status-arg`，不进入 helper 主路径
- `bootstrap-providers.sh --all-repos` 主路径不调用新 mode（避免循环：bootstrap 完成自然走 workspace-targets 链路）；新 mode 主要供"修复后单仓 rerun"或 LLM 主动重新对齐场景使用

**Patterns to follow:**
- 现有 `script` / `skill-prose` mode 的 args 校验互斥逻辑（`script-mode-mcp-input-forbidden`、`skill-prose-mode-cannot-persist` 等 reason_code 命名）
- `validateWorkspaceTargets` 与 `validateArtifactOutputPath` 的错误抛出 + reason_code 设计
- 现有 `payload` 结构 (`compile-workspace-gitnexus-readiness.js:114-129`) 中 `invocation_mode` 与 `generated_from` 的 carrier 形态

**Test scenarios:**
- Happy path: 6 个子仓 status 全部 `query_ready=true` 且 `last_indexed_commit != null` → `query_usability_counts.fresh-primary=6`，`group.status` 与现有逻辑一致，`invocation_mode='from-child-status'`，`generated_from.child_statuses` 包含 6 个路径
- Happy path: 4 个子仓 ready + 2 个子仓 status 文件缺失 → 4 ready，**2 个标 `query_usability=unavailable`**（不是 `stale-advisory`），child limitations 列出 `child-status-missing`，整体仍可写出 artifact
- Edge case: child status 存在但 `last_indexed_commit=null` → `query_usability=registry-present-query-unverified`（保持现有 promotion gate），不被新 mode 误判为 stale-advisory
- Edge case: `--child-status` 指向非 `provider-status.v1` 文件 → 该子仓 `query_usability=unavailable` + limitation `invalid-child-status`，其他子仓不受影响
- Edge case: `--child-status` 指向 `provider != gitnexus` 的 status → 该子仓 `query_usability=unavailable` + limitation `unsupported-child-status-provider`，其他子仓不受影响
- Edge case: 不传 `--child-status` 但 mode=from-child-status → 报错 `missing-required-option`
- Edge case: 同时传 `--mode from-child-status` 和 `--registry-list`/`--group-list` → 报错 `from-child-status-mode-mcp-input-forbidden`（互斥）
- Edge case: workspace-targets 列出 6 个子仓，但 caller 只提供 4 个 `--child-status` → 缺失的 2 个标 `query_usability=unavailable` + limitation `child-status-missing`，不静默丢弃
- Edge case: `--child-status` 字符串形如 `path/without/prefix.json`（缺 `repo:` 前缀）→ 立即报错 `invalid-child-status-arg`，不进入 helper 主路径
- Integration: `--write-artifact` 写入 `.spec-first/workspace/gitnexus-readiness.json`，schema 字段集合与 `script` mode 输出可 diff 对齐（仅 `invocation_mode` 与 `generated_from` 内部子键不同）
- Integration: 用同一组子仓在 `script` mode（读 workspace-targets 快照）与 `from-child-status` mode 下产出对比；当子仓真实 status 与 workspace-targets 快照一致时，两模式输出一致；不一致时新 mode 是更"实时"的（降级语义在文档中显式声明）
- Integration: 现有 `script` mode 与 `skill-prose` mode 测试全部回归通过（不引入 cross-mode regression）

**Verification:**
- 12 个 scenario 端到端通过
- `docs/contracts/workspace-gitnexus-consumption.md` 文档登记 `invocation_mode='from-child-status'` 取值、`generated_from.child_statuses` 子键、新增 `child-status-missing` / `child-status-unreadable` / `invalid-child-status` / `unsupported-child-status-provider` 四类 limitation reason、`from-child-status-mode-mcp-input-forbidden` 互斥 reason_code，并明确"缺失 child status 严格归 unavailable，不进 stale-advisory promotion gate"
- 不新增 `runtime_mcp_evidence` 字段（schema 真不变）；可用现有 contract test 断言：`workspace-gitnexus-readiness.v1` 顶层字段集合在三个 mode 下完全一致
- `npm run test:unit` 全绿（含新 mode 与现有 mode 的回归）

---

### U5. 文档与下游消费者契约同步

**Goal:** 把 U1-U4 引入的新 reason_code 枚举值、新 attempt_role 取值、`diagnostics_capture` 字段、`from-child-status` mode 与 env 配置同步到下游契约文档与 CHANGELOG，让 spec-work / spec-debug / spec-code-review / spec-plan 在读旧 artifact 的同时能正确解释新字段。

**Requirements:** R5, R6

**Dependencies:** U1, U2, U3, U4（文档需要稳定的字段名与触发条件）

**Files:**
- Modify: `docs/contracts/graph-provider-consumption.md`（登记 `failure_class=provider-crash`/`provider-crash-recovered`/`provider-terminated` 三个新枚举与对应 reason_code（`gitnexus-analyze-sigabrt`、`gitnexus-analyze-sigabrt-recovered`、`gitnexus-analyze-sigterm`），`attempt_role` 新取值 `crash-retry-N`，`command_results[].attempt_failure` 子对象字段，`command_results[].diagnostics_capture` 字段及触发条件）
- Modify: `docs/contracts/workspace-gitnexus-consumption.md`（登记 `invocation_mode='from-child-status'`、`generated_from.child_statuses[]` 子键、新增 `child-status-missing`/`child-status-unreadable`/`invalid-child-status`/`unsupported-child-status-provider` 四类 child-level limitation reason、`from-child-status-mode-mcp-input-forbidden` 互斥 reason_code，并明确"缺失 child status 严格归 unavailable，不进 stale-advisory promotion gate"，与 §65-70 现有 promotion gate 一致）
- Modify: `skills/spec-graph-bootstrap/SKILL.md`（如该文档列出 reason_code 集合，则同步；若仅作 prose 引用则补一条提示）
- Modify: `CHANGELOG.md`（新增条目，标 `(user-visible)`：`failure_class`/`reason_code` 新枚举对下游 LLM workflow 可见；作者从 `.claude/spec-first/.developer` 读取）
- Modify: `README.md` 与 `README.zh-CN.md`（如已存在 graph-bootstrap 故障容错说明则补 SIGABRT 路径；否则不动）

**Approach:**
- 先扫描每个文档，确认本 plan 覆盖到的字段与现状的差集
- 文档变更与代码变更**同 PR / 同 commit**（避免 source/runtime drift 造成下游 LLM 引用错误字段）
- CHANGELOG 条目使用仓库现行格式（参照 README.md 顶部或最近一条 entry）
- 如 `docs/05-用户手册/14-GitNexus-全流程执行分析.md` 中提到 race 兜底，则在该处补 cross-link
- 文档侧对 `failure_class` 与 `reason_code` 三种 crash 路径要明确语义层级：`provider-crash`（终态失败）/ `provider-crash-recovered`（retry 后成功，仍记录证据）/ `provider-terminated`（SIGTERM）；下游 LLM workflow 据此判断是否仍可信任顶层 `query_ready=true`（recovered 路径下仍可信，但建议追溯 `command_results[].attempt_failure` 评估升级 pin 的紧迫性）

**Patterns to follow:**
- `docs/contracts/graph-provider-consumption.md` 现有的"字段 + 用途 + 反模式"三栏表格风格
- `docs/contracts/workspace-gitnexus-consumption.md` 现有"Prior Query-Ready Promotion Gate"段落风格（§61-70），新 mode 的 child-status 校验段落与之并列叙述
- CHANGELOG.md 现有 `(user-visible)` 标记惯例

**Test scenarios:**
- Test expectation: none -- 纯文档变更，由 U1-U4 的代码 + 测试承担行为正确性；本 unit 的"测试"由 review 与下游消费者交叉验证（例如 spec-code-review 读 status.json 后能正确解释新枚举）

**Verification:**
- `docs/contracts/graph-provider-consumption.md` 登记三个新 `failure_class` 枚举、三个对应 `reason_code`、`attempt_role` 新取值集合（`primary`、`crash-retry-N`）、`command_results[].attempt_failure` 子对象、`diagnostics_capture` 字段及"零网络副作用"承诺
- `docs/contracts/workspace-gitnexus-consumption.md` 登记 `invocation_mode='from-child-status'` / `generated_from.child_statuses[]` / 四类 child-level limitation reason / `from-child-status-mode-mcp-input-forbidden` 互斥 reason_code，并显式声明"缺失 child status 严格归 unavailable，不进 stale-advisory"
- 新枚举与新字段在两份文档中的命名一致；不引入 `runtime_mcp_evidence` 字段（schema 真不变）
- CHANGELOG.md 含 `(user-visible)` 标记的新条目，作者字段对齐当前 host developer profile
- `npm run lint:skill-entrypoints` 通过（如 SKILL.md 有结构性变更）

---

## System-Wide Impact

- **Interaction graph:** `bootstrap-providers.{sh,ps1}` 的 `classify_provider_failure` 与 `append_bootstrap_command_result` 是 status.json 的唯一写入入口，本 plan 集中改这两处；下游 `spec-work`、`spec-debug`、`spec-code-review`、`spec-plan` 通过读 status.json 间接消费新字段；`compile-workspace-gitnexus-readiness` 是独立链路，U4 不与 U1-U3 直接耦合。
- **Error propagation:** crash retry 内的失败收敛到现有 `failure_info` 链路 —— 全部成功（无 crash）走 null；retry 后成功走新增 `crash_recovered_failure_info()` 输出 `provider-crash-recovered`；retry 耗尽走最后一次 attempt 的 sigabrt 分类。每次 attempt 的分类同步写入 `command_results[].attempt_failure`，不破坏 `refresh_process_failed` / `incremental-and-full-failed` 上层逻辑。`diagnostics_capture` 任何子步骤失败（fingerprint 字段缺失、可选 probe 超时）都 fallback 为 `unknown`/`{status:"timeout"}` 等结构化值，不阻塞 status.json 落盘。
- **State lifecycle risks:** retry 之间 sleep 期间不持久化中间状态；中断（Ctrl-C / SIGTERM）走现有 trap 路径，已落地的 attempt raw log 文件保留；新增的 `analyze.crash-retry-N.log` 与原 `analyze.log` 共存，删除策略同既有 raw log；可选 probe 走 `run_configured_command` 路径，trap 行为与既有命令一致。
- **API surface parity:** `provider-status.v1` 与 `workspace-gitnexus-readiness.v1` schema 不升版本号 —— 仅做开放枚举扩展（`failure_class` 新增 `provider-crash-recovered` / `provider-terminated`，对应 `reason_code`；`attempt_role` 新增 `crash-retry-N`；`invocation_mode` 新增 `from-child-status`）与可选子对象/子键添加（`command_results[].attempt_failure`、`command_results[].diagnostics_capture`、`generated_from.child_statuses[]`）；下游消费者继续可读旧 artifact，且新 artifact 的顶层字段集合与旧 artifact 完全一致。
- **Integration coverage:** mock unit test 不能完全证明 native crash 在真实 1.6.5 worker pool race 下的 retry 行为；用 origin document 中已实测过的 race 路径在 V3 集成测试场景中做端到端验证；可选 probe 路径建议在测试矩阵中拦截 `npx`/网络调用，断言默认配置零副作用。
- **Unchanged invariants:** `incremental → full` fallback 路径、`bootstrap_fingerprint` 计算、`query_probe` 链路、`host_instruction_normalization` 链路、`graph-bootstrap-result.v1` 上层 schema、`workspace-graph-targets.v1` schema、`provider-status.v1` 与 `workspace-gitnexus-readiness.v1` 的 schema_version 字段值、`workspace-gitnexus-consumption.md:65-70` 现有 `query_usability` promotion gate 均不变。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| crash retry 在 race 仍未规避时反而拉长失败 latency | 默认 retry=1，base sleep=2s；env 可调 0 关闭；retry 仅对 crash 类失败生效，命令失败/网络/权限路径无 retry |
| retry 成功后下游误以为"从未发生 crash" | 顶层 `failure_class=provider-crash-recovered` + `reason_code=gitnexus-analyze-sigabrt-recovered` 显式记录；每条 attempt 留 `attempt_failure` 子对象；recommended_action 仍提示升级 pin。下游可用 `failure_class is null` 区分"从未失败"与"retry 后恢复" |
| 诊断 capture 触发 npm registry / cache 副作用 | 默认 `provider_package_spec` 从 `bootstrap_fingerprint` 直接读，零执行；显式 `GRAPH_BOOTSTRAP_DIAGNOSTICS_CAPTURE_PROBE_VERSION=1` 才允许 best-effort probe，且强制走 `run_configured_command` + 5s timeout + `--prefer-offline`；不发新的 `npx -y gitnexus@...` 调用 |
| `from-child-status` mode 把缺失/异常 child status 误归 `stale-advisory`，违反现有 promotion gate | 严格遵循 `workspace-gitnexus-consumption.md:65-70` 现有 gate：缺失/不可读/异常 schema/非 gitnexus provider 一律归 `query_usability=unavailable`，并写明 child-level limitation；U4 测试矩阵显式断言不进 stale-advisory |
| `from-child-status` mode 引入新顶层字段破坏 schema 兼容性 | 不新增字段，仅扩 `invocation_mode` 枚举值与 `generated_from` 子键；contract test 断言三 mode 顶层字段集合一致 |
| `from-child-status` 与 `script` mode 边界情况下 group.status 不一致 | U4 测试矩阵覆盖一致性场景；文档显式声明：当子仓 status 与 workspace-targets 快照不一致时，新 mode 是更"实时"的、旧 mode 是更"快照"的，downstream 自行选择 |
| PowerShell 与 Bash 在 retry sleep / timeout 行为上有微差 | U1-U3 双宿主测试矩阵显式断言 reason_code、attempt_role 序列、`attempt_failure` 与 `diagnostics_capture` 字段集合一致 |
| 1.6.6+ 升级 pin 后本 plan 的 SIGABRT 识别可能"显得不再必要" | reason_code 不写死版本号，文案承担版本提示；保留分类是"未来上游可能再回归"的兜底；不会引入死代码 |
| stub 测试通不过等价于真实 race 不存在 | V3 在执行阶段补一次"在 1.6.5 真实 race 上跑 retry 是否消化 race"的实测，作为 release acceptance 而非阻塞 plan |

---

## Documentation / Operational Notes

- 本 plan 不涉及配置文件迁移、env 默认值变化（默认 retry=1 是新增能力，不会改变成功路径行为）；现有用户升级到本 plan 后无感，crash 场景下行为变好。
- CHANGELOG 必须含 `(user-visible)` 标记（参照 CLAUDE.md changelog 治理段）；reason_code 与 attempt_role 新枚举对下游 LLM workflow 可见。
- runbook：crash retry 频繁触发 → 给用户的 next_action 提示升级 GitNexus pin（U1 的 recommended_action 文案承担此职责）；运维侧无新增告警/监控。
- 如未来再扩 retry 到其他 provider，预期至少抽 `resolve_crash_retry_config` + `capture_provider_diagnostics` 为通用 helper；本 plan 不预先抽，避免过早抽象。
- 测试 stub 命名规范：新增 stub env 一律 `FAIL_GITNEXUS_*` 或 `FLAKY_GITNEXUS_*` 前缀，与既有 `FAIL_GITNEXUS_ANALYZE_SIGSEGV` 保持一致。

---

## Sources & References

- **Origin document:** `/tmp/spec-first-incident-2026-05-28-gitnexus-native-crash-resilience.md`
- 相邻 plan: `docs/plans/2026-05-27-004-feat-mixed-topology-broken-worktree-optimization-plan.md`（Scope Boundaries 显式排除本 plan 范围）
- 相邻 plan: `docs/plans/2026-05-07-002-feat-gitnexus-evidence-governance-plan.md`（pin 升级治理）
- 相邻 plan: `docs/plans/2026-05-09-001-fix-graph-bootstrap-gitnexus-repair-preflight-plan.md`（失败分类设计参考）
- 关键代码:
  - `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`
  - `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`
  - `src/cli/helpers/compile-workspace-gitnexus-readiness.js`
  - `tests/unit/spec-graph-bootstrap.sh`
- 现有契约文档:
  - `docs/contracts/graph-provider-consumption.md`
  - `docs/contracts/workspace-gitnexus-consumption.md`
- 上游修复:
  - PR https://github.com/abhigyanpatwari/GitNexus/pull/1833
  - Issue https://github.com/abhigyanpatwari/GitNexus/issues/1848
  - Issue https://github.com/abhigyanpatwari/GitNexus/issues/1665
- 角色契约: `docs/10-prompt/结构化项目角色契约.md`（"Light contract + Explicit boundaries + Let the LLM decide"）
