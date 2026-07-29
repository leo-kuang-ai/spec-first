# Context Governance Contract

本 contract 固化 `spec-first` 的默认上下文消费边界。它不是 Context Router 实现，也不是 workflow 状态机；它只定义普通 workflow 在读取 repo context 时必须遵守的最小 runtime exclusion policy。

它是 AI Coding Harness 的 Context Harness 边界之一；目录级 Harness map 见 `docs/contracts/ai-coding-harness.md`。

## Goals

- 默认不把 runtime / generated / audit artifacts 当作普通上下文。
- 保留 source-first、summary-first、path-backed evidence 的读取方式。
- 固化 cache-friendly prompt layout：稳定指令前置，动态请求、diff、tool summary 和临时 evidence 后置。
- 允许 runtime/setup/audit workflow 在明确任务范围内读取对应 artifacts。
- 在超出默认上下文预算时记录 reason，而不是静默读取全量目录。

## Non-Goals

- 不实现中心化 context router。
- 不替代 `spec-plan`、`spec-work`、`spec-code-review` 或 `spec-doc-review` 的语义判断。
- 不禁止读取明确用户指定的文件。
- 不把 `.gitignore` 当作 LLM context policy 的唯一来源。

## Default Exclusions

普通上下文读取默认排除：

| path | reason_code | 说明 |
| --- | --- | --- |
| `.spec-first/audits/**` | `runtime_audit_artifact_excluded` | skill/runtime 审计执行产物，体积大、可重建，不是 source truth |
| `.spec-first/governance/**` | `runtime_governance_artifact_excluded` | 本机 workflow 治理观测证据，如 rule-maturity shadow hits；普通 source context 不扫描，周期审计或显式治理复查按路径读取 |
| `.claude/**` | `generated_runtime_mirror_excluded` | Claude generated runtime mirror / host-local state |
| `.codex/**` | `generated_runtime_mirror_excluded` | Codex generated runtime mirror / host-local state |
| `.agents/skills/**` | `generated_runtime_mirror_excluded` | Codex-facing generated workflow runtime mirror |
| `.cursor/skills/**` | `generated_runtime_mirror_excluded` | Cursor generated workflow runtime mirror |
| `.cursor/spec-first/**` | `generated_runtime_mirror_excluded` | Cursor spec-first managed state/runtime facts |
| `.cursor/mcp.json` | `host_local_config_excluded` | Cursor project MCP config output；不是 source truth，普通 context 默认排除；`spec-first clean --cursor` 保留整文件，server entry 由 setup/uninstall 路径管理 |
| `.kiro/skills/**` | `generated_runtime_mirror_excluded` | Kiro generated workflow runtime mirror |
| `.kiro/agents/**` | `generated_runtime_mirror_excluded` | Kiro generated agent runtime mirror |
| `.kiro/spec-first/**` | `generated_runtime_mirror_excluded` | Kiro spec-first managed state/runtime facts |
| `.kiro/settings/**` | `generated_runtime_mirror_excluded` | Kiro spec-first managed MCP config surface; direct doctor/setup reads are allowed only in runtime tasks |
| `.qoder/commands/spec-*.md` | `generated_runtime_mirror_excluded` | Qoder generated workflow runtime file mirror |
| `.qoder/commands/spec/**` | `generated_runtime_mirror_excluded` | Qoder retired legacy command namespace；仅 runtime cleanup / drift repair 读取 |
| `.qoder/skills/**` | `generated_runtime_mirror_excluded` | Qoder generated project skill runtime mirror |
| `.qoder/agents/**` | `generated_runtime_mirror_excluded` | Qoder generated subagent runtime mirror |
| `.qoder/spec-first/**` | `generated_runtime_mirror_excluded` | Qoder spec-first managed state/runtime facts |
| `.qoder/hooks/session-start` | `managed_runtime_hook_excluded` | Qoder spec-first managed SessionStart hook script；settings entry remains degraded-by-design until authenticated event execution and shared-loader safety are verified |
| `.qoder/hooks/prd-prewrite-guard` | `managed_runtime_hook_excluded` | Qoder spec-first managed PreToolUse PRD guard script；settings entry remains degraded-by-design until authenticated event execution and shared-loader safety are verified |
| `.qoder/hooks/prd-readiness-guard` | `managed_runtime_hook_excluded` | Qoder spec-first managed Stop PRD readiness guard script；settings entry remains degraded-by-design until authenticated event execution and shared-loader safety are verified |
| `.qoder/settings.local.json` | `host_local_config_excluded` | Qoder local MCP config output；不是 source truth，普通 context 默认排除；`spec-first clean --qoder` 保留整文件，server entry 由 setup/uninstall 路径管理 |
| `.opencode/commands/spec/**` | `generated_runtime_mirror_excluded` | OpenCode generated workflow command runtime mirror |
| `.opencode/skills/**` | `generated_runtime_mirror_excluded` | OpenCode generated Agent Skills runtime mirror |
| `.opencode/spec-first/**` | `generated_runtime_mirror_excluded` | OpenCode spec-first managed state/runtime facts |
| `opencode.json` / `opencode.jsonc` | `host_local_config_excluded` | OpenCode project config 是 mixed-ownership host config，不是 spec-first source truth；普通 context 默认排除，runtime/setup task 可按精确路径读取，clean/uninstall 只删除仍匹配 expected value 的 managed entries |

`.kiro/specs/**` 是 Kiro-native advisory artifact，不属于 spec-first generated mirror。普通 workflow 只有在用户或上游 artifact 显式命名时才读取它；不得把 `.kiro/**` blanket 排除或 blanket 纳入 source context。

`.cursor/rules/**`、`.cursor/agents/**` 和未知 `.cursor/**` host-native/user-owned surface 不属于 spec-first generated mirror。普通 workflow 只有在用户或上游 artifact 显式命名时才读取它们；不得把 `.cursor/**` blanket 排除或 blanket 纳入 source context。

`.qoder/rules/**`、`.qoder/settings.json` 和未知 `.qoder/hooks/**` 是 Qoder-native/user-owned surface，不属于 spec-first generated mirror。普通 workflow 只有在用户或上游 artifact 显式命名时才读取它们；不得把 `.qoder/**` blanket 排除或 blanket 纳入 source context。例外是上表列出的三个 spec-first managed Qoder hook scripts：它们是 runtime hook outputs，默认上下文排除。

`.opencode/agents/**`、未被 spec-first 命名空间覆盖的 `.opencode/**` 与 `opencode.json` / `opencode.jsonc` 中的非 managed fields 是 OpenCode-native/user-owned surface。不得 blanket 删除、覆盖或提升为 spec-first source；只有用户、上游 artifact 或 runtime/setup task 显式命名时才读取。

普通 workflow 仍可读取 checked-in source truth，例如 `skills/`、`agents/`、`templates/`、`src/cli/`、`docs/contracts/`、`AGENTS.md`、`CLAUDE.md`、`README*` 和当前任务直接相关的源码、测试、计划或需求文档。

## Host Instruction Reuse Policy

`AGENTS.md`、`CLAUDE.md` 和项目角色文档是 host / project instruction layer。Claude 或 Codex 进入仓库时通常已经把适用的入口指令注入到当前会话；普通 workflow 的 context orientation 应优先使用这些已加载的 host/project instructions，而不是因为 prompt 提到 instruction files 就重新读取根 `AGENTS.md` / `CLAUDE.md`。

允许精确读取 instruction source 的场景是：

1. 用户明确点名某个 instruction 文件或具体路径。
2. 当前任务正在修改、审查、生成或诊断 instruction / runtime / setup / update / audit / source-runtime drift 行为。
3. 已加载指令缺失、明显 stale、与当前 source 冲突，或 workflow 需要核对 source-of-truth 以避免漂移。
4. 需要检查目录级 `AGENTS.md` / `CLAUDE.md` 是否管辖当前 changed files，而该目录级指令未出现在已加载 host context 中。
禁止把根 `AGENTS.md` / `CLAUDE.md` 当作每次 plan/work/debug/review 的普通必读上下文。若只是为了执行方向校准，使用已加载 instruction summary；若因上述例外读取 source 文件，在输出、Coverage 或 closeout 中说明读取原因即可。

## Runtime Artifact Policy

`.spec-first/workspace/**`、`.spec-first/app-audit/**`、`.spec-first/governance/**` 和 `.spec-first/workflows/**` 默认也不是普通 source context。下游 workflow 应优先读取该目录下的 canonical summary、validated contract 或明确路径，而不是扫描整棵 `.spec-first/**`。

`summary-first` 规则：

1. 先读取 summary、manifest、status、readiness facts 或用户指定路径。
2. 需要更深证据时，按具体 artifact path 精确读取。
3. 不把 raw logs、大 JSON、旧 audit snapshots 或 generated mirrors 广播给 reviewer / worker。
4. 如果因为预算或边界排除 context，应在输出或 coverage 中说明 excluded path 和 reason_code。

External-tool results and session summaries follow the same rule: pass only compact facts, source-read requirements, limitations, and precise artifact paths; do not broadcast raw MCP dumps or full external-tool output into ordinary prompt bundles.

## Changelog Consumption Policy

`CHANGELOG.md` remains mandatory for project source changes. This policy narrows how workflows consume and write changelog context; it does not weaken the source-change recording gate, user-visible marker rule, or developer author resolution from `~/.spec-first/.developer`.

Ordinary plan/work/debug/review context should read the changelog format guidance and the latest relevant dated window, not the full historical changelog. Release-history, regression archaeology, or user-explicit history questions may expand the window with a reason, but should still summarize path-backed evidence instead of copying long entry sequences into prompts.

New changelog entries should be compact breadcrumbs: one concise summary naming the source surface, user-visible impact when applicable, verification status or not-run reason, and a path to the plan/review/validation artifact when long reasoning is needed. Detailed design rationale belongs in requirements, plans, reviews, validation artifacts, or PR descriptions, not in the changelog entry body.

## Cache-Friendly Prompt Layout

高频 workflow 应把输入分成两个稳定层：

| layer | 内容 | 规则 |
| --- | --- | --- |
| stable instruction prefix | role contract、workflow contract summary、hard boundaries、reference index、source/runtime policy | 稳定排序、稳定措辞；不混入 git status、测试输出、MCP dump、raw log 或一次性诊断 |
| dynamic suffix | 当前 user request、diff summary、changed files、tool summary、artifact summary、context bundle、temporary evidence paths | 每轮按需生成；大输出使用 summary + path，full content 按 trigger 精确展开 |

`docs/contracts/context-bundle.md` 定义 `context-request.v1` / `context-bundle.v1` 的最小 envelope；`docs/contracts/artifact-summary.md` 定义 durable artifact 的 summary-first handoff。普通 workflow 应优先传递这些 compact facts，而不是复制 full artifact、full report 或 raw tool output。

## Allowed Exceptions

这些任务可在明确范围内读取对应 runtime artifacts：

| workflow / task | allowed scope |
| --- | --- |
| `spec-runtime-setup` / `spec-first update` CLI | runtime delivery、host setup、drift repair 所需的 host runtime paths |
| `spec-app-consistency-audit` | `.spec-first/app-audit/**` 的 run-scoped evidence |
| changelog author resolution | 读取全局 developer profile：`~/.spec-first/.developer`，只用于 `CHANGELOG.md` 作者字段，不纳入 broad context bundle |
| user-explicit path request | 只读取用户明确点名的文件或目录，并说明它是 runtime/generated/audit context |

例外不改变 source-of-truth：generated runtime mirrors 仍应通过 source 修改后运行 `spec-first init` 并选择目标宿主来修复，不能手改 mirror 作为 source fix。

## Workflow Consumption Rule

普通 plan/work/debug/review/compound/session context 收集应按以下顺序读取：

1. 用户请求、diff、changed files、计划/需求/task-pack summary。
2. source-of-truth files 和 nearby implementation/test slices。
3. validated summaries, review facts, or deterministic setup facts.
4. 精确路径的 full artifact 或 raw evidence，仅当用户要求、workflow 明确需要，或 summary 显示证据不足。

禁止把 `.spec-first/audits/**`、`.spec-first/governance/**`、`.claude/**`、`.codex/**`、`.agents/skills/**`、`.cursor/skills/**`、`.cursor/spec-first/**`、`.cursor/mcp.json`、`.kiro/skills/**`、`.kiro/agents/**`、`.kiro/spec-first/**`、`.kiro/settings/**`、`.qoder/commands/spec-*.md`、`.qoder/commands/spec/**`、`.qoder/skills/**`、`.qoder/agents/**`、`.qoder/spec-first/**`、`.qoder/hooks/session-start`、`.qoder/hooks/prd-prewrite-guard`、`.qoder/hooks/prd-readiness-guard`、`.qoder/settings.local.json` 纳入默认 `rg --files` / file-search / agent prompt bundle 的普通候选集。`.cursor/rules/**`、`.cursor/agents/**`、`.kiro/specs/**` 与 `.qoder/rules/**` 不在 generated mirror denylist 内；它们只在显式命名时作为 advisory input 消费。

内部 context helper 在匹配排除规则前必须先把输入路径规范化为 repo-relative canonical path；解析后位于当前 repo 外的路径，或 repo 内 symlink 解析后指向 repo 外的路径，必须以 `outside_repo_context_excluded` 排除，除非上游 workflow 明确使用了自己的外部路径合同。

## Failure Modes

| reason_code | behavior |
| --- | --- |
| `runtime_audit_artifact_excluded` | 返回 path/summary 指针，说明 audit artifact 不是普通 source context |
| `generated_runtime_mirror_excluded` | 指向 source-of-truth 或 update/init workflow |
| `host_local_config_excluded` | 由 setup/uninstall/doctor 等 runtime 任务按宿主配置合同读取或管理，普通 context 只保留 path/reason |
| `outside_repo_context_excluded` | 不纳入普通 repo context bundle；需要外部路径时由上游 workflow 使用显式合同 |
| `runtime_context_requested_by_non_runtime_workflow` | 只读取用户明确路径；否则排除并说明边界 |
| `summary_missing` | 读取最小可用 status/manifest，或要求用户确认是否展开 full artifact |
| `context_budget_exceeded` | 生成 compact summary + excluded_context，不 silent full-read |

## Validation Expectations

- Host bootstrap 应提示默认 runtime exclusion。
- 高频 public workflows 的 context orientation 应引用本 contract 或等价规则。
- Contract tests 应防止 `.spec-first/audits/**`、`.spec-first/governance/**` 和 generated mirrors 被重新描述为普通上下文。
