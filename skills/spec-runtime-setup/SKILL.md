---
name: spec-runtime-setup
description: Install, configure, verify, and refresh required harness runtime readiness facts for spec-first workflows on Claude Code, Codex, Kiro, Qoder, or Cursor.
argument-hint: "[bare auto setup] [--check|--verify-only|--plan|--project-config] [--only codegraph,graphify] [--workspace-graph|--workspace-graph-status|--workspace-graph-clean] [--repos <a,b>] [--json] [--repair-host-config] [--refresh] [--repo <path>] [--requirement-workspace <repo-relative-path>]"
---

# Runtime Setup

`spec-runtime-setup` is the canonical runnable entrypoint for the Runtime Setup workflow across supported hosts (Claude/Qoder command spelling `runtime-setup`). Host-specific setup spellings are not separate products. Runtime Setup prepares deterministic host/runtime facts for spec-first workflows. It installs or verifies required MCP servers and baseline helper tooling, diagnoses manual helpers such as `agent-browser`, writes setup-owned project facts, and reports concrete next actions. It does not provide code-understanding authority; downstream workflows use bounded direct source reads, `rg`, ast-grep, git diff, tests/logs, and user-provided evidence.

## Contract Summary

| Field | Contract |
| --- | --- |
| When to use | Host runtime setup, MCP setup, helper-tool readiness, missing runtime assets, or project-local setup fact refresh. |
| When not to use | Ordinary planning, implementation, review, debugging, or code impact questions that can proceed from direct source evidence. |
| 输入 | 当前 host、repo target、已加载 skill 共置的 `setup-registry.json`、host config 状态、git/workspace target facts 与项目 instruction。 |
| Outputs | Readiness ledger v2, provider readiness v2 facts, generated runtime manifest freshness, setup scenario fingerprint, project-local config bootstrap status, optional project setup facts under `.spec-first/config/`, and a grouped status block. |
| Artifacts | `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, `.spec-first/config.local.example.yaml`, `.spec-first/config.local.yaml` when explicitly created, `.gitignore` local-config safety rule when explicitly ensured, and `.spec-first/workspace/scenario-fingerprint-setup.json` when applicable. |
| Failure modes | Missing dependencies, host config write failure, ambiguous parent workspace target, symlink escape, invalid registry schema, helper install failure, or unsupported host. |
| Downstream consumers | `using-spec-first`, plan/work/review/debug workflows, doctor/update guidance, and humans repairing setup. |

核心边界：Node module 准备确定性的 readiness facts；LLM workflow 决定如何使用这些事实。Setup 不得判断代码理解的语义充分性，也不得要求普通工作必须先依赖外部分析服务。CodeGraph/Graphify readiness 准备完成后，setup 可以建议将 `spec-rule-miner` 作为基于证据生成项目 AI coding rule 的后续步骤，但不得自行调用 rule mining、合成 rule 或写入 `docs/ai/project-rules.md`。

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Source Of Truth

Canonical package source-of-truth 是 `skills/spec-runtime-setup/setup-registry.json`，由共置的 `setup-registry.schema.json` 校验，schema version 为 `setup-registry.v8`。Generated host 从已加载 skill 目录消费共置的 registry projection；该 projection 是 generated runtime，不是第二个 source。当前完整 Runtime Setup 必备项包括 `sequential-thinking`、`context7`、ffmpeg、CodeGraph 与 Graphify；CodeGraph/Graphify first generation 和真实 query probe 属于标准 setup completion，而不是长期可跳过的 optional tail。`--only codegraph` / `--only graphify` 仅用于高级子集修复，不改变完整 setup 的必备定义。

Generated host runtime mirrors and host-local MCP config files are projections or outputs, not source. If setup prose or scripts change, update source first and use `spec-first init` only for runtime regeneration.

## Required Harness Runtime

`setup-registry.json` 负责必需 MCP definition、helper readiness 与 install safety、required Provider metadata、external dependency pin、host target、artifact contract 和 platform override。Loader 针对当前 host/platform 确定性展开 registry default，不判断 Provider readiness 或语义充分性。当前 helper 检查包括 ffmpeg、`agent-browser` 与 ast-grep capability detection；ffmpeg 是 setup completion 的 baseline-blocking helper，`agent-browser` 仍保持 report-only/non-blocking。

所有可执行 setup 行为均由共置的 Node 入口及 `scripts/` 下的 module 负责。不得在 workflow prose 中重新实现 registry query、host config 写入、Provider 命令或 facts reconciliation。

## Loaded Skill 入口

从当前已加载的 `spec-runtime-setup/SKILL.md` 所在目录解析 `SKILL_DIR`。每次 runtime 调用都必须使用该目录中的共置 Node 入口：

```bash
node "$SKILL_DIR/scripts/setup.cjs" <mode-and-target-arguments>
```

绝不能从项目 cwd 或 source checkout 路径解析该命令。Generated command surface 使用其 companion support root 作为 `SKILL_DIR`。进入支持 mutation 的 mode 前，通过执行工具的 per-call environment overlay 传入 `MCP_SETUP_HOST=claude|codex|cursor|kiro|qoder`；只读诊断可以报告 advisory host candidate，但不能把它们转换为 write authority。

`scripts/check-health` 是带 Node shebang 的 compatibility shim，委托给 `setup.cjs --check`。Windows 直接调用 `node <loaded-skill-root>/scripts/setup.cjs --check`，不存在 platform-specific companion entry。

Optional provider readiness is reported through `provider_readiness[]` (`provider-readiness.v2`). Setup may populate lifecycle display bits such as `installed`, `configured`, `indexed`, `server_reachable`, and `query_verified`, plus setup-owned runtime metadata such as `native_interfaces`, `first_generation`, `steady_state`, and `usage_note`. `steady_state` may include project-local hook readiness facts for optional provider refresh setup, such as Graphify `hook_installed`, `hook_verified`, `hook_status=blocked`, and `refresh_mode=manual-only`. Downstream decision health is still driven by `readiness_status`; lifecycle, first-generation, and hook fields explain boundaries and next actions, not semantic truth. Graphify hook blocked/failed/skipped 不得单独把 package、host integration、artifact integrity 与 query probe 的成功结果改写为 Provider `degraded`。The human status table may derive `readiness_scope` and `probe_status` from existing lifecycle bits to separate install/index readiness from real server/query probes; these display columns are not new machine schema fields. Provider self-reported `fresh` maps to `unknown`; provider self-reported `stale` may map to `stale` because it is conservative. `query_verified=true` is reserved for a real probe or explicit real-environment signal, not for package installation alone. A `false` or missing `server_reachable` / `query_verified` display value means the probe is not verified in this setup run unless a failure reason says otherwise; it must not be summarized as confirmed provider query availability.

## Project Preflight / Local Setup

Project-local setup has two separate surfaces:

1. Setup-owned facts: `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, and when applicable `.spec-first/workspace/scenario-fingerprint-setup.json`.
2. Local config bootstrap: `.spec-first/config.local.example.yaml`, local override state for `.spec-first/config.local.yaml`, and `.gitignore` coverage for `.spec-first/*.local.yaml`. Missing local override means `defaults-active`，不是“未处理的可选项”。

The readiness ledger and runtime capabilities include `generated_runtime_manifest.status` (`current`, `stale`, `missing`, or `unknown`) based only on `state.manifestVersion` versus the bundled manifest version; this is a deterministic freshness fact, not proof that generated prose is semantically correct. Scenario fingerprint wrapper failures are warn-and-continue: report `scenario_fingerprint_setup` status and keep the rest of setup actionable instead of blocking ordinary direct-evidence workflows.

Local config bootstrap is a first-class Runtime Setup capability, but it remains project-local and local-only. It checks and can explicitly refresh `.spec-first/config.local.example.yaml`, explicitly create `.spec-first/config.local.yaml`, and explicitly ensure `.spec-first/*.local.yaml` is ignored. It reports legacy project config signals for manual review, but it does not copy legacy files, translate old key names, or treat old defaults as spec-first truth.

## Three-Stage Setup Flow

即使内部 Node module 执行多项检查，Runtime Setup 仍应将面向用户的流程保持为三个阶段：

### Stage 1: Diagnose Target And Readiness

Resolve the project target first. In a non-Git parent workspace, default to all discovered supported child repos; `--repo <child>` is the explicit narrowing control. Continue only when discovery yields a bounded child set, and keep every repo-local write within its child target. Then inspect:

- host runtime identity and write authority;
- required MCP/helper dependency readiness;
- generated runtime manifest freshness;
- project-local config status for `.spec-first/config.local.example.yaml`, `.spec-first/config.local.yaml`, and `.gitignore` coverage;
- legacy project config signals;
- required CodeGraph/Graphify readiness；`--only` 时只执行选定子集，但不得把子集成功表述为完整 setup 完成。

This stage is read-only except for diagnostic facts written by verify-only paths that are already setup-owned. Missing required Provider/helper capability blocks Runtime Setup completion；它仍不阻止能够使用 direct source evidence 的普通 plan/work/review/debug workflow。

### Stage 2: Apply Authorized Setup Actions

Apply only actions authorized by the selected mode:

- project-local config actions: refresh example config, create local override, ensure ignore coverage, and optionally delete obsolete legacy markdown only after explicit approval;
- host config action：只能通过共置 Node 入口与显式 host authority 写入 MCP/runtime config；
- helper/provider actions: standard bare workflow 安装或验证 required baseline，并默认运行 CodeGraph/Graphify bounded first-generation/query verification；`--only codegraph`、`--only graphify` 或 `--only codegraph,graphify` 仅收窄为高级子集修复。

Project-local config actions never install providers or edit host config. Host/provider actions never migrate local config keys. Legacy project config is a manual-review signal unless the user chooses a documented cleanup action.

### Stage 3: Summarize Facts And Next Action

Render a grouped final status that separates:

- dependency/runtime readiness;
- generated runtime freshness;
- project-local config status;
- project setup facts;
- host configured dependencies;
- helper/provider readiness and install safety;
- next actions.

The summary must make skipped, declined, optional, degraded, and action-required rows visible. Do not collapse these boundaries into a single "setup complete" statement.

## Setup Posture And Project Conventions

Runtime Setup follows an `Explore -> Present -> Decide -> Write` posture:

1. **Explore** host, target repo, generated runtime manifest, existing setup facts, `.spec-first/config.local.yaml`, verification profile visibility, provider artifacts, and project instructions.
2. **Present** discovered facts, missing dependencies, local-only overrides, provider first-generation/refresh actions, generated runtime freshness, and explicit non-actions before applying setup changes.
3. **Decide** only where the runtime setup workflow has authority: install/verify helper tools, configure host MCP/runtime wiring, refresh setup-owned facts, or choose a documented degraded path. Team workflow conventions and semantic project decisions remain LLM/owner judgment in downstream workflows.
4. **Write** only setup-owned facts, supported local config examples, host runtime config through documented targets, and generated runtime refreshes through `spec-first init`. Do not write team-shared tracker policy, label vocabulary, external PR request-surface policy, issue acceptance decisions, or durable rejected-scope decisions from setup.

`.spec-first/config.local.yaml` is a local-only override file, not team-shared source of truth. Current active local config consumers are:

- `verification_profile_path`, read by the verification profile loader as a local execution preference;
- `feedback_sources` and `sweep_*`, read and written by `spec-sweep`;
- `pulse_*`, read and written by `spec-product-pulse`;
- `spec_promote_spiral_optout`, read and written by `spec-promote`;
- `work_delegate_*`, exposed for downstream execution workflows that support delegated work;
- `plan_skip_scoping_confirm`, exposed for downstream planning workflows that support persisted scoping-confirmation preference.

Document rendering keys `plan_output` and `brainstorm_output` are reserved future hints until implemented consumers and focused tests exist. `ideate_output` is active: `spec-ideate` reads an uncommented `md` or `html` value, while setup only exposes and protects the key and never invokes the workflow. Setup must not auto-delegate, skip scoping confirmation, or change host model/runtime behavior merely because a key exists. Missing local config is not a blocker; defaults remain advisory and must not be reported as repo truth.

If setup later reports project convention facts, they must be deterministic existence facts only, such as whether `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, or a project guidance index exists. Setup must not judge whether terminology is correct, an ADR applies, a proposed issue/PR should be accepted or rejected, an out-of-scope concept matches, or implementation satisfies a request.

## Host Authority And Write Safety

当前唯一公开入口是 `spec-runtime-setup`（Claude/Qoder 命令拼写 `runtime-setup`）；不提供 `spec-mcp-setup` / `mcp-setup` 兼容别名。调用它的 host runtime surface 是权威 host evidence。Generated host-specific runtime surface 必须在调用支持 mutation 的 Node mode 前，通过 per-call environment 固定 `MCP_SETUP_HOST=<host>`。缺少显式 canonical `MCP_SETUP_HOST=claude|codex|cursor|kiro|qoder` 时，`setup.cjs` 必须 fail closed；不得根据 `PATH`、generated runtime 目录、旧 `.spec-first/config/*` facts 或其他平台的 host config 文件推断 mutation target。只读诊断可以展示 advisory host candidate，但这些 candidate 不具备 write authority。

在写入任何 host config 或刷新 setup-owned facts 前，workflow 必须让 `setup.cjs` 从显式 entrypoint host pin 解析 host authority 与 effective registry target。旧 setup facts 只能作为 drift comparison evidence：若其与当前 entrypoint host 不一致，应报告 host-marker drift，并为当前 host 刷新 setup-owned facts，不得把旧 host 当作当前 host。绝不能仅依据 prose 手动选择 `.kiro/settings/mcp.json`、`.qoder/settings.local.json`、`.cursor/mcp.json`、Codex TOML 或 Claude managed/user config。

不得使用 Write、Update、Edit 等 host file-edit 工具修改 `.spec-first/config/tool-facts.json`、`.spec-first/config/runtime-capabilities.json` 或 host MCP config 文件。只有 authority、target、containment、conflict 与 verification gate 全部通过后，`setup.cjs` 及其确定性的 host-config/facts module 才能执行这些写入。

## Workflow Modes

- `--check`: inspect current dependency/runtime status only; do not write setup facts, host config, or install tools.
- `--verify-only` / `--refresh-facts`: verify readiness and refresh setup-owned facts; do not install tools or edit host config.
- `--plan`: render install/config operations and safety results; do not write setup facts, host config, or install tools.
- `--project-config`：仅执行 project-local config bootstrap。按请求刷新 example，仅在显式 action 后创建 local override，按请求确保 `.spec-first/*.local.yaml` ignore coverage，并报告 legacy project config signal 而不迁移它们。该 mode 不安装 MCP server、不配置 host runtime，也不执行 helper/Provider first generation。
- Bare invocation (`spec-runtime-setup` in the current host): default full setup workflow. Resolve target，运行默认 required-provider plan；无 blocker 时执行等价的 `--only codegraph,graphify` apply、验证 baseline/Provider/runtime/project status，并写 setup facts。Bare workflow invocation 本身已授权自动修复 selected target 中 registry 管理的 `host-config-conflict`，不需要二次确认；它不授权绕过 higher-precedence、unsafe path、unreadable config、symlink/path escape 或 literal secret gate。
- `--only <ids>`: advanced headless/subset repair path. `--only codegraph`, `--only graphify`, or `--only codegraph,graphify` narrows provider execution and does not require a confirmation prompt；子集结果必须标记为 partial scope，不能声称完整 setup ready。
- `--repair-host-config`：显式授权 setup 仅替换 registry 管理且已确认冲突的 MCP 条目；保留同一 host config 中的其他用户字段和 server，并执行事务回滚与 post-write verification。Bare full setup 由 workflow 自动携带该 flag 处理 selected-target managed drift；显式 subset/repair 调用则必须由用户提供。可单独用于 baseline host config repair，也可与 `--only ...` 组合，在修复后继续 Provider install-init。没有该 flag 时，显式 `--plan` 必须在 package/provider mutation 前报告 `host-config-conflict` 并阻断；高优先级 target 冲突、不可读配置、symlink/path escape 和 literal secret 不能通过该 flag 绕过。
- `--refresh`: Graphify 显式刷新路径。已有 `.graphify/` 时，与 `--only graphify` 一起使用；setup 调用官方 `graphify update <workspace>` 更新现有 code graph，并在更新后重新执行完整性与 query probe。它不创建 spec-first 顶层 staging/backup；若只有 legacy `graphify-out/` 而没有 current `.graphify/`，仍按首次生成路径建立 provider-native artifact。它是 `manual-only` steady state 的按需更新方式，不是修复项目外 `core.hooksPath` 的动作，也不代表完整 semantic extraction。普通 setup 或 `--verify-only` 返回 core-ready `readiness_status=unknown` 时，不得仅因 unknown 自动追加或执行 `--refresh`；unknown 表示缺少当轮 currentness evidence，不表示 query probe 失败或 required setup 未完成。
- `--requirement-workspace <repo-relative-path>`: optional Graphify input-scope override. Omit it for normal project-workspace setup; default input scope is the resolved project workspace.
- `--user-scope`：Kiro/Qoder/Cursor 写入 user-level MCP config 的 opt-in。缺少该 flag 时，即使由 generated host skill/command 间接调用，setup 也只为 Kiro 写 workspace `.kiro/settings/mcp.json`、为 Qoder 写 local `.qoder/settings.local.json`，或为 Cursor 写 project `.cursor/mcp.json`。

Graphify setup 使用受控 Provider route；标准 bare workflow 默认选择 Graphify，`--only graphify` 是高级子集修复入口。当前 pin 是 PyPI `graphifyy@0.9.17`，要求 Python `>=3.10`。Setup 只使用已安装的 uv（优先）或 pipx，将 release-reviewed direct wheel 安装到隔离 tool environment；uv 禁止 managed Python download，缺少兼容 Python 或 tool manager 时返回 action-required，不自动 bootstrap，也不回退 plain pip。Package readiness 同时验证 distribution identity、version、CLI version、absolute launcher 与 interpreter。显式 Graphify mutation setup 只有在 Python package/artifact/query/host 都 verified，且 Git 项目中的 project-local hook 也 verified（非 Git 项目不适用）时，才默认卸载已确认的全局 `@sentropic/graphify`，并只删除仍保持原 target 且解析到该 npm package 的旧 symlink。External/unsafe hook target 下不执行 incumbent cleanup；未知命令、普通文件和其他 symlink 一律不改。

Graphify Provider只接受PyPI `graphifyy` dependency。失败恢复使用固定wheel重装、contained artifact backup恢复与Python readiness复验。

缺少 `--requirement-workspace` 时使用已解析 project workspace，并以 `GRAPHIFY_OUT=.graphify` 维持唯一 current artifact。首次生成固定运行 `graphify extract . --code-only`，不探测 API key、不触发 semantic backend；支持代码文件非空但生成零节点时 fail closed。已有 `.graphify/` 且未提供 `--refresh` 时只验证 package、host integration、query，以及当前项目授权域内可用时的 optional hook，不修改 current graph。显式 `--refresh` 使用官方 `graphify update <workspace>` 在现有图上更新代码索引，复用 Provider 自带的 repo lock、临时 graph、shrink guard 与未变节点保留能力；spec-first 不再为日常刷新创建顶层 `.graphify.staging-*`、`.graphify.backup-*` 或 migration journal。旧版本遗留 journal 仅保留兼容恢复，不是新 refresh 的回滚机制。Apply/refresh 当轮有生成与 query 证据时可为 `fresh`；只读 verify 没有当轮 currentness 证据时为 `unknown`。`graphify-out/` 始终只是 legacy/foreign-default evidence。

Claude、Codex、Cursor、Kiro 使用 Python Provider 的真实 project install surface；setup 只在 recognized Provider-owned skill/reference/rule/steering 与 `## graphify` section 内规范化 `.graphify/`，并将 Claude/Codex host hook command绑定 verified launcher。Qoder 不调用不存在的 `--platform qoder`，由 spec-first-owned Qoder instruction提供 direct CLI/fallback adapter。Graphify Git hook 是 project-local optional auto-refresh：setup 先用 `git rev-parse --git-path hooks` 解析有效 hooks root，只有 lexical containment 与 no-follow symlink containment 均证明目标位于当前项目内时，才以进程级 `core.hooksPath` pin 运行 hook install/uninstall/status，并在命令后重新解析目标。项目外、共享 worktree/submodule metadata、resolve failure 或 symlink escape 下，不运行 hook 命令、不读取外部 hook 内容、不修改 local/global `core.hooksPath`、不复制或串联全局 hooks；返回 `blocked + manual-only`，但不阻断已经通过的 Graphify 核心 readiness。这里的 `manual-only` 只描述 spec-first 支持并验证的 project-local steady state；setup 不读取外部 hook，因此不得声称外部 hook 不存在、不会执行或“安装失败”，只能报告 `external_hook_execution=unverified`。Verified hook 仍要求 post-commit 与 post-checkout 各有唯一 Provider marker block、verified interpreter、唯一 `GRAPHIFY_OUT=.graphify` block和允许的 `_rebuild_code`命令；marker外用户内容保持不变，也不会被默认 smoke执行。Setup 不编辑 shell profile、不启动 watch、不安装 `graphifyy[mcp]`，也不把 Graphify candidate提升为 confirmed truth。

CodeGraph setup 使用受控 MCP/Provider route。被选中后，setup 安装 `setup-registry.json` 声明的 pinned CodeGraph dependency，使用 `codegraph serve --mcp` 配置 host MCP，运行 `codegraph init`，并探测 `codegraph status`。若 status 报告 `Pending Changes` 或要求 `codegraph index -f`，setup 先执行一次 bounded `codegraph sync`，再运行 `codegraph status`；仍存在 pending change 或 sync 失败时，返回带 diagnostic 的 action-required。若 post-sync status 仍要求 `codegraph index -f`，setup 执行一次 bounded full reindex 并复查 status。索引 ready 后必须运行 bounded `codegraph query __spec_first_readiness_probe__ --limit 1 --json` real query probe；只有命令真实成功才设置 `query_verified=true`，失败则报告 `codegraph-query-probe-failed` degraded readiness。Full reindex 或 query probe 失败时保留现有 `.codegraph/` artifact，报告 degraded/actionable readiness，不删除 index。这些一次性的 sync/reindex 分支属于 install-init repair，不代表 spec-first 接管 steady-state ownership。

## Default Full Setup Flow

For bare `spec-runtime-setup`, do this inside the skill:

1. Resolve the project target. In a non-Git parent workspace, default to all discovered supported child repos; use `--repo <child>` only to narrow the run. Every repo-local write remains contained in its child target.
2. Run the read-only check。若 example config missing/outdated 或 local-config ignore rule missing，先运行 `--project-config --refresh-example --ensure-gitignore`；`.spec-first/config.local.yaml` 缺失保持 `defaults-active`，不创建空 override。
3. Run `node "$SKILL_DIR/scripts/setup.cjs" --plan --repo <resolved-project-root>` for a single-repo target. For the default parent-workspace batch, preview every discovered child with its own `--repo <child>` target before the shared apply. Plan 默认选择 registry 中 `setup_required=true` 的 CodeGraph/Graphify，并同时预览 baseline MCP/helper、host config、Provider artifact、hook 与 facts writes。
4. If the plan reports an unresolved target, higher-precedence conflict, unsafe path, unreadable config, or unsupported install path, stop with the exact blocker. If it reports a selected-target `host-config-conflict`, show config path/key/drift fields。Bare workflow invocation 本身已授权自动修复 selected target 中 registry 管理的 `host-config-conflict`：自动携带 `--repair-host-config` 重新 preview 并继续 apply，不再请求用户二次确认。
5. Plan 无 blocker 后运行等价 apply：单仓使用 `node "$SKILL_DIR/scripts/setup.cjs" --only codegraph,graphify --repo <resolved-project-root>`；默认 parent-workspace batch 则从 parent 运行 `node "$SKILL_DIR/scripts/setup.cjs" --only codegraph,graphify`，由 resolver 对全部 discovered child 执行。两条路径都携带已授权的 repair/target/workspace flags。Bare workflow invocation 已授权标准 required setup，不再追加二次确认。
6. Apply 必须完成 ffmpeg/baseline helper、CodeGraph init/index/query、Graphify package/host integration/graph/query、host config、project status 和 facts verification。Graphify hook 只在有效目标位于项目内时作为 optional auto-refresh enhancement 安装并验证；blocked/skipped/failed 必须显式展示 steady-state limitation，但不得单独把 core-ready 完整 setup 改为 action-required。任一真正 required item 未 ready 时，完整 setup 返回 action-required；不得以 direct-source fallback 把 setup 本身报告为 complete。

## Subset / Repair Flow

Use `--only codegraph`, `--only graphify`, `--only codegraph,graphify`, or Graphify `--refresh` for advanced subset repair:

1. 运行带相同 selection 的 plan，再执行 apply；`--only` 自身就是该子集 mutation 的授权。
2. Host conflict 仍需独立 `--repair-host-config` 授权；higher-precedence、unsafe path、unreadable config 和 literal secret 永远 fail closed。
3. 子集成功只证明所选 scope ready。最终完整 setup readiness 仍以 `spec-runtime-setup --verify-only` 对全部 required items 的结果为准。

## Per-Requirement Workspace Graph (Multi-Repo)

从一个**非 Git 的需求文件夹**(多仓父目录,内含多个独立 clone 的子 Git 仓)运行 setup 时,先分清两条路径:

1. **子仓 provider/MCP setup**(各 child 的 CodeGraph/Graphify/host config):父目录无 target 参数时默认 all-repos；`--repo <child>` 收窄到单仓，`--all-repos` 可用于显式表达同一批处理范围。
2. **父目录双层图**(per-child CodeGraph + workspace Graphify merge):`--workspace-graph --repos a,b,...` 或 `.spec-first/workspace.yaml` manifest。  
   **不要**写 `--workspace-graph --all-repos`——`--all-repos` 只服务子仓 batch,不是 workspace-graph 的仓集确认。

### 从子仓开始时的轻量引导

这是一段静态引导，不会自动声明 workspace membership、CodeGraph 已安装，或 workspace graph 已构建：

- 问题只涉及当前子仓时，如 Provider 可用，以当前子仓作为 `projectPath` 使用 CodeGraph；结果只是导航候选，重要结论仍由源码、测试、diff 或日志确认。
- 问题跨多个子仓时，回到非 Git 的需求父工作区。仅当 workspace graph 状态和目标仓范围均已确认时才使用 Graphify；随后直接检查候选子仓。
- 不要假设 workspace graph 存在或仍然 current，不要从该引导推断成员关系，也不要把任一 Provider 输出当作语义证明。

本轮不向 child `AGENTS.md` / `CLAUDE.md` 注入独立受管 marker，也不提供对应的 clean 生命周期；父目录 routing block 仍由显式 workspace graph lifecycle 管理。

运行 `spec-runtime-setup --only codegraph,graphify --workspace-graph` 时,setup 会为该 workspace 建立两层代码图:

1. **每子仓战术图**:`codegraph init` 生成 `工程N/.codegraph/`;`.codegraph/` 写入该子仓 `.git/info/exclude`(经 `git rev-parse --git-path` 解析,正确处理 `.git`-as-file/worktree,并做 realpath+containment 校验)以保持子仓 `git status` 干净;CodeGraph MCP server 全局 install 一次,跨仓查询通过 `projectPath`。
2. **workspace 跨仓宏观图**:Graphify `extract --code-only` 每子仓子图 + `merge-graphs` 合并图,全部 out-of-tree 写到 `需求文件夹/.graphify/`(子仓物理零侵入)。单/零子仓分别产出 single-source / not-applicable。构建结果原子写入 `.graphify/workspace-graph-state.json`;status 只有在最近构建 complete、repo 集合与 source snapshot 未变化、子图/合并图/路由块均存在时才报告 ready。

Graphify 0.9.x 原生 child hook 只重建 child 默认 output,不能更新上述 out-of-tree 子图并重收敛 merged graph。因此当前 workspace 模式使用**显式刷新**:child source 变化后重新运行同一 `--workspace-graph --repos ...` 命令。不得把原生 hook install 表述成 workspace merged graph 的自动 freshness 保证。

仓集来源:`--repos <a,b>` 清单(确认)、`需求文件夹/.spec-first/workspace.yaml` manifest(确认),或自动发现(仅作候选,需确认后才建)。自动发现只扫描需求根的直接子目录；重复 alias 或嵌套仓根会返回 `workspace-targets-ambiguous` 并阻止 build/clean，必须先由 owner 消除歧义。

`workspace.yaml` 是为五宿主 projected runtime 保持零依赖的**严格 YAML 子集**，不是通用 YAML：支持顶层 `schema_version`、`repos`、`exclusions`，2 空格列表缩进、`repos` 下 4 空格的 `path`/可选 `alias`、普通或单/双引号字符串和行尾注释。禁止 tab、flow collection (`[]`/`{}`)、anchor/tag、block scalar、多行值及未声明字段；不符合时返回 `workspace-manifest-unparseable` 或 `workspace-manifest-schema-invalid`，不得猜测或静默忽略。可用格式：

```yaml
schema_version: workspace-manifest.v1
repos:
  - path: api # workspace-relative
  - path: 'web client'
    alias: web
exclusions:
  - vendor
```

相关 flag(同一 workspace-graph 域):

| Flag | 作用 |
| --- | --- |
| `--workspace-graph` | 一次性建双层图 + 写 state receipt + 注入五宿主入口路由块;source 变化后显式重跑刷新 |
| `--workspace-graph-status` | 只读汇总各 child/workspace 图状态、state/source freshness、default `projectPath` containment(advisory)、路由块是否已注入;不调用 provider 二进制 |
| `--workspace-graph-clean` | 幂等清理:删子仓 `.codegraph/`、只移除 spec-first managed exclude 块、清理旧版本可能安装的 Graphify hook、删 `需求/.graphify/`、剥离路由 managed block;不强制 kill CodeGraph daemon。`codegraph daemon` 是 provider 的交互式选择器，因此 clean 只回报需由用户在 provider 中完成的动作，不伪造已停止。宿主级等价入口:`spec-first clean --workspace-graph [--repos a,b] [--dry-run]`(不碰 host runtime mirror) |

Machine contract:

| operation status | mutation exit code | 含义 |
| --- | ---: | --- |
| `complete` | 0 | 请求的 mutation 全部完成 |
| `partial` / `failed` | 1 | 至少一个确定性步骤失败;读取 `reason_code` 与 per-repo 状态 |
| `needs-confirmation` | 2 | 自动发现仅是候选;用 JSON 中的 `pending_confirm[]` 生成 `--repos` 重试命令 |

`--json` 输出完整 envelope;自动化消费者必须同时读取 `status`、`reason_code`、`pending_confirm[]`、state/freshness 与 per-repo 字段,不能只检查文件存在或进程是否打印成功文本。显式 `--workspace-graph-status` 是只读诊断,即使对象 absent/partial 也可 exit 0,由 envelope 表达 readiness。

**边界(per-需求 隔离)**:每个需求文件夹自成一体,不复用其它需求的图,不写机器级 global graph;`projectPath` 解析限定当前 workspace 根内;discovery 与所有 Git-metadata 写入均 symlink-contained;图输出是 advisory candidate,结论回子仓源码确认。删除需求文件夹即清空其图(无机器级残留)。

从当前 Git repo(非父 workspace)运行 `--workspace-graph*` 会被跳过(该能力面向非 Git 多仓父目录)。

## Workflow

1. Identify the current host from the generated host-specific runtime surface invoking the unified `spec-runtime-setup` entrypoint.
2. If invoked from a non-Git parent workspace, resolve all discovered supported child repos by default; `--repo <child>` narrows the run. Writes must stay within each resolved child target.
3. 运行共置 Node 入口，使其加载 `setup-registry.v8`、校验 schema，并展开 effective host/platform registry。
4. 让 `setup.cjs` 按所选 mode 诊断或安装必需的 package-backed MCP tool；standard workflow 默认选择 registry required Provider，`--only` 只用于高级子集修复；host config 只能通过 registry target 写入，并记录结构化 execution facts。
5. 让同一 Node 入口验证 baseline helper 与 required Provider。`agent-browser` 保持 diagnostic/manual-command only；ffmpeg、CodeGraph 与 Graphify 核心能力必须进入完整 setup completion。Provider first generation 与 project-local auto-refresh setup 只能通过静态 Provider module 与 bounded argv-array process runner 执行。若默认 project-root scope 中的 `graphify extract .` 失败，setup 可以先尝试 code-only `graphify update .`，再返回 failed readiness。若 Graphify 已安装但不在用户原始 `PATH` 中可见，报告 manual visibility action，不编辑 shell profile。Graphify hook 仅在有效 hooks root 位于项目内时允许 bounded repair；blocked/failed hook 记录 `next_actions` 与 `manual-only` limitation，不得标记 hook refresh 已验证，也不得单独把已通过的核心 Provider readiness 改为 `degraded`。
6. Run project-local config bootstrap where the selected mode authorizes it. Bare setup reports example/local/gitignore/legacy status；missing local override 记为 `defaults-active`。Explicit project-config actions may refresh the example, create the local override, and ensure ignore coverage. Do not auto-delete legacy project config or migrate legacy keys.
7. 使用 `setup.cjs --verify-only` 写入 readiness ledger、reconcile host pointer facts、写入 project setup facts，并渲染分组 status block。必须分别读取 `generated_runtime_manifest.status` 与 `baseline_ready`；`baseline_ready=true` 不能掩盖 stale generated runtime。状态为 `stale` 或 `missing` 时，使用符合 topology 的命令刷新 runtime：当前 repo 或 parent workspace runtime 使用 `spec-first init -y`，单个 child repo 使用 `spec-first init --repo <child> -y`，只有明确要批量刷新 child root 时才显式运行 `spec-first init --all-repos -y`；随后重新验证。若刚运行 `spec-first update` 后状态仍 stale，应将其视为 degraded refresh evidence，并展示相同 fallback 命令，不得报告 runtime freshness 为 ready。
8. Report the status exactly enough for the user to act: ready rows need no action; action-required rows name the missing dependency/config/target step; generated runtime manifest rows name the init refresh command when stale or missing.

## Output Shape

The final setup output should contain:

- `Execution result`: separate `Required MCP/helper dependencies` and `Generated runtime manifest` rows; report `baseline_ready` as dependency readiness and `generated_runtime_manifest.status` as generated runtime freshness.
- `MCP servers`: required baseline MCP tool dependency/host/project readiness、CodeGraph host config readiness 和 next action；`--only` subset 必须显式标注 scope。
- `Helper tools`: helper install and readiness status.
- `Provider tools`: provider readiness status, derived `readiness_scope` / `probe_status`, and lifecycle display bits when present. Summaries must distinguish install/index readiness from server/query verification.
- `Host configured dependencies`: configured MCP/hooks/allowlist/setup/verification command facts.
- `Install safety`: helper install source, risk, review, and mirror provenance.
- `Project local config`: example config, local override, gitignore safety rule, legacy markdown config signal, and retired legacy local config status. Human labels and machine fields should be de-branded; active setup facts must use `.spec-first` local config paths and neutral legacy field names.
- `Project setup facts`: status for `tool-facts.json` and `runtime-capabilities.json`.
- `Verification profile`: current verification profile visibility placeholder; full profile execution is v1.13 scope.
- `Next steps`: either fix action-required rows, narrow to an explicit child repo when a single-repo retry is needed, continue to the user-intent workflow, or suggest `spec-rule-miner` as a separate follow-up after CodeGraph/Graphify readiness is prepared. This suggestion is advisory; setup must not treat rule-miner output as setup readiness and must not call `spec-rule-miner` automatically.

`tool-facts.json` records setup-owned tool and helper readiness:

```json
{
  "schema_version": "tool-facts.v2",
  "tools": {},
  "helper_tools": {},
  "items": [],
  "configured_dependencies": [],
  "schema_capabilities": [
    "items",
    "configured_dependencies",
    "tool-existence",
    "provider-readiness-generic"
  ],
  "source": {
    "repo_status": "git-repo"
  }
}
```

`runtime-capabilities.json` should record direct evidence posture instead of provider capabilities:

```json
{
  "schema_version": "runtime-capabilities.v1",
  "direct_evidence": {
    "bounded_source_reads": true,
    "ripgrep": true,
    "ast_grep": true,
    "git_diff": true,
    "tests_and_logs": true
  }
}
```

## Boundaries

Setup does:

- verify Node/npm/npx and required helper dependencies;
- 按 `setup-registry.json` 配置 warm package-backed MCP server；
- write host MCP config through managed/user host targets;
- replace only an authorized conflicting managed MCP entry through `--repair-host-config`; bare full setup supplies this authorization for selected-target registry-managed drift, while explicit subset/repair calls require the flag, unrelated host config is preserved, and higher-precedence or unsafe targets remain blocked;
- write Kiro MCP config to workspace `.kiro/settings/mcp.json` by default, and to `~/.kiro/settings/mcp.json` only after explicit user-scope opt-in;
- write Qoder MCP config to local `.qoder/settings.local.json` by default, and to `~/.qoder/settings.json` only after explicit user-scope opt-in;
- write Cursor MCP config to project `.cursor/mcp.json` by default, and to `~/.cursor/mcp.json` only after explicit user-scope opt-in;
- write project-local setup facts;
- refresh `.spec-first/config.local.example.yaml`, create `.spec-first/config.local.yaml`, and ensure `.spec-first/*.local.yaml` ignore coverage only through explicit project-local config bootstrap actions;
- report the legacy project markdown signal for manual review and the retired legacy local config status without migrating either;
- perform explicit provider-native first generation for approved providers when the target workspace is resolved, or verify Graphify install readiness without regenerating the graph when a project-root Graphify artifact already exists and no explicit `--refresh` was requested;
- perform bounded provider-native setup repair where deterministic and documented, such as Graphify provider-native `update` for explicit `--refresh`, one `codegraph sync` after pending/full-rebuild status, or one `codegraph index -f` after sync cannot clear the full-rebuild advisory;
- perform provider-native project-local auto-refresh setup only when the Git-native effective hooks root is contained by the current project, such as Graphify `graphify hook install`, followed by bounded marker-owned artifact/interpreter normalization and structural verification; otherwise report a non-mutating `blocked + manual-only` steady state;
- classify parent workspace target ambiguity and foreign residual indicators as advisory facts.

Setup does not:

- start watchers or long-running daemons;
- install the optional Graphify MCP server;
- run provider first generation from `--check`, `--plan`, `--verify-only`, or invalid explicit workspace override paths;
- treat provider indexes or query probes as semantic code evidence;
- treat setup facts as semantic code evidence;
- invoke `spec-rule-miner`, synthesize project rules, or write `docs/ai/project-rules.md`;
- treat `.spec-first/config.local.yaml` as team-shared workflow policy;
- silently copy or translate legacy project config into `.spec-first/config.local.yaml`;
- decide issue/PR category, state, scope, accept/reject status, or implementation truth;
- hand-edit generated runtime mirrors as source;
- block ordinary plan/work/review/debug when direct source evidence is sufficient.

## Verification

Focused setup changes should run the narrowest relevant checks:

```bash
node "$SKILL_DIR/scripts/setup.cjs" --check
node "$SKILL_DIR/scripts/setup.cjs" --plan
npm run test:runtime-setup
node --check "$SKILL_DIR/scripts/setup.cjs"
```

For cross-host changes, also run `npm run typecheck`, `npm run test:unit`, `npm run test:smoke`, and `spec-first init` after source validation.
