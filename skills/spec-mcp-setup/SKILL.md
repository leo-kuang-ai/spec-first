---
name: spec-mcp-setup
description: Install, configure, verify, and refresh required harness runtime readiness facts for spec-first workflows on Claude Code, Codex, Kiro, Qoder, or Cursor.
argument-hint: "[bare auto setup] [--check|--verify-only|--plan|--project-config] [--only codegraph,graphify] [--refresh] [--repo <path>] [--requirement-workspace <repo-relative-path>]"
---

# Runtime Setup

`spec-mcp-setup` is the current runnable entrypoint for the Runtime Setup workflow across supported hosts. The target user-facing alias remains `spec-runtime-setup` once the host alias contract is implemented; legacy host-specific setup spellings normalize to `spec-mcp-setup` and are not separate product surfaces. Runtime Setup prepares deterministic host/runtime facts for spec-first workflows. It installs or verifies required MCP servers and baseline helper tooling, diagnoses manual helpers such as `agent-browser`, writes setup-owned project facts, and reports concrete next actions. It does not provide code-understanding authority; downstream workflows use bounded direct source reads, `rg`, ast-grep, git diff, tests/logs, and user-provided evidence.

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

Canonical package source-of-truth 是 `skills/spec-mcp-setup/setup-registry.json`，由共置的 `setup-registry.schema.json` 校验，schema version 为 `setup-registry.v8`。Generated host 从已加载 skill 目录消费共置的 registry projection；该 projection 是 generated runtime，不是第二个 source。当前必需 baseline tool 包括 `sequential-thinking` 与 `context7`；可选 MCP/Provider entry 必须通过 `--only codegraph` 或 `--only graphify` 等方式显式选择。Bare Runtime Setup 只诊断可选 Provider readiness 并输出 next action，不构成 Provider first generation 的隐式同意。

Generated host runtime mirrors and host-local MCP config files are projections or outputs, not source. If setup prose or scripts change, update source first and use `spec-first init` only for runtime regeneration.

## Required Harness Runtime

`setup-registry.json` 负责必需 MCP definition、helper readiness 与 install safety、显式 Provider metadata、external dependency pin、host target、artifact contract 和 platform override。Loader 针对当前 host/platform 确定性展开 registry default，不判断 Provider readiness 或语义充分性。当前 helper 检查包括 `agent-browser` 与 ast-grep capability detection。`agent-browser` 等 manual helper 保持 report-only：setup 输出可复制的当前平台安装命令与 readiness facts，但不自动安装 browser helper。

所有可执行 setup 行为均由共置的 Node 入口及 `scripts/` 下的 module 负责。不得在 workflow prose 中重新实现 registry query、host config 写入、Provider 命令或 facts reconciliation。

## Loaded Skill 入口

从当前已加载的 `spec-mcp-setup/SKILL.md` 所在目录解析 `SKILL_DIR`。每次 runtime 调用都必须使用该目录中的共置 Node 入口：

```bash
node "$SKILL_DIR/scripts/setup.cjs" <mode-and-target-arguments>
```

绝不能从项目 cwd 或 source checkout 路径解析该命令。Generated command surface 使用其 companion support root 作为 `SKILL_DIR`。进入支持 mutation 的 mode 前，通过执行工具的 per-call environment overlay 传入 `MCP_SETUP_HOST=claude|codex|cursor|kiro|qoder`；只读诊断可以报告 advisory host candidate，但不能把它们转换为 write authority。

`scripts/check-health` 是带 Node shebang 的 compatibility shim，委托给 `setup.cjs --check`。Windows 直接调用 `node <loaded-skill-root>/scripts/setup.cjs --check`，不存在 platform-specific companion entry。

Optional provider readiness is reported through `provider_readiness[]` (`provider-readiness.v2`). Setup may populate lifecycle display bits such as `installed`, `configured`, `indexed`, `server_reachable`, and `query_verified`, plus setup-owned runtime metadata such as `native_interfaces`, `first_generation`, `steady_state`, and `usage_note`. `steady_state` may include hook readiness facts for provider-native refresh setup, such as Graphify `hook_installed`, `hook_verified`, and `hook_status`. Downstream decision health is still driven by `readiness_status`; lifecycle, first-generation, and hook fields explain boundaries and next actions, not semantic truth. The human status table may derive `readiness_scope` and `probe_status` from existing lifecycle bits to separate install/index readiness from real server/query probes; these display columns are not new machine schema fields. Provider self-reported `fresh` maps to `unknown`; provider self-reported `stale` may map to `stale` because it is conservative. `query_verified=true` is reserved for a real probe or explicit real-environment signal, not for package installation alone. A `false` or missing `server_reachable` / `query_verified` display value means the probe is not verified in this setup run unless a failure reason says otherwise; it must not be summarized as confirmed provider query availability.

## Project Preflight / Local Setup

Project-local setup has two separate surfaces:

1. Setup-owned facts: `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, and when applicable `.spec-first/workspace/scenario-fingerprint-setup.json`.
2. Local config bootstrap: `.spec-first/config.local.example.yaml`, optional `.spec-first/config.local.yaml`, and `.gitignore` coverage for `.spec-first/*.local.yaml`.

The readiness ledger and runtime capabilities include `generated_runtime_manifest.status` (`current`, `stale`, `missing`, or `unknown`) based only on `state.manifestVersion` versus the bundled manifest version; this is a deterministic freshness fact, not proof that generated prose is semantically correct. Scenario fingerprint wrapper failures are warn-and-continue: report `scenario_fingerprint_setup` status and keep the rest of setup actionable instead of blocking ordinary direct-evidence workflows.

Local config bootstrap is a first-class Runtime Setup capability, but it remains project-local and local-only. It checks and can explicitly refresh `.spec-first/config.local.example.yaml`, explicitly create `.spec-first/config.local.yaml`, and explicitly ensure `.spec-first/*.local.yaml` is ignored. It reports legacy project config signals for manual review, but it does not copy legacy files, translate old key names, or treat old defaults as spec-first truth.

## Three-Stage Setup Flow

即使内部 Node module 执行多项检查，Runtime Setup 仍应将面向用户的流程保持为三个阶段：

### Stage 1: Diagnose Target And Readiness

Resolve the project target first. In a parent workspace, stop before repo-local writes unless the user selected a child repo or intentionally chose all supported child repos. Then inspect:

- host runtime identity and write authority;
- required MCP/helper dependency readiness;
- generated runtime manifest freshness;
- project-local config status for `.spec-first/config.local.example.yaml`, `.spec-first/config.local.yaml`, and `.gitignore` coverage;
- legacy project config signals;
- optional provider readiness for selected providers.

This stage is read-only except for diagnostic facts written by verify-only paths that are already setup-owned. Missing optional provider/helper capabilities are not ordinary workflow blockers unless their registry entry marks them baseline-blocking or the user selected a workflow that needs them.

### Stage 2: Apply Authorized Setup Actions

Apply only actions authorized by the selected mode:

- project-local config actions: refresh example config, create local override, ensure ignore coverage, and optionally delete obsolete legacy markdown only after explicit approval;
- host config action：只能通过共置 Node 入口与显式 host authority 写入 MCP/runtime config；
- helper/provider actions: install or verify required baseline entries by default, and run bounded provider first-generation or refresh commands only for explicitly selected providers such as `--only codegraph`, `--only graphify`, or `--only codegraph,graphify`.

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

当前公开入口是 `spec-mcp-setup`；调用它的 host runtime surface 是权威 host evidence。Generated host-specific runtime surface 必须在调用支持 mutation 的 Node mode 前，通过 per-call environment 固定 `MCP_SETUP_HOST=<host>`。缺少显式 canonical `MCP_SETUP_HOST=claude|codex|cursor|kiro|qoder` 时，`setup.cjs` 必须 fail closed；不得根据 `PATH`、generated runtime 目录、旧 `.spec-first/config/*` facts 或其他平台的 host config 文件推断 mutation target。只读诊断可以展示 advisory host candidate，但这些 candidate 不具备 write authority。

在写入任何 host config 或刷新 setup-owned facts 前，workflow 必须让 `setup.cjs` 从显式 entrypoint host pin 解析 host authority 与 effective registry target。旧 setup facts 只能作为 drift comparison evidence：若其与当前 entrypoint host 不一致，应报告 host-marker drift，并为当前 host 刷新 setup-owned facts，不得把旧 host 当作当前 host。绝不能仅依据 prose 手动选择 `.kiro/settings/mcp.json`、`.qoder/settings.local.json`、`.cursor/mcp.json`、Codex TOML 或 Claude managed/user config。

不得使用 Write、Update、Edit 等 host file-edit 工具修改 `.spec-first/config/tool-facts.json`、`.spec-first/config/runtime-capabilities.json` 或 host MCP config 文件。只有 authority、target、containment、conflict 与 verification gate 全部通过后，`setup.cjs` 及其确定性的 host-config/facts module 才能执行这些写入。

## Workflow Modes

- `--check`: inspect current dependency/runtime status only; do not write setup facts, host config, or install tools.
- `--verify-only` / `--refresh-facts`: verify readiness and refresh setup-owned facts; do not install tools or edit host config.
- `--plan`: render install/config operations and safety results; do not write setup facts, host config, or install tools.
- `--project-config`：仅执行 project-local config bootstrap。按请求刷新 example，仅在显式 action 后创建 local override，按请求确保 `.spec-first/*.local.yaml` ignore coverage，并报告 legacy project config signal 而不迁移它们。该 mode 不安装 MCP server、不配置 host runtime，也不执行 helper/Provider first generation。
- Bare invocation (`spec-mcp-setup` in the current host): default diagnose path. Resolve the target, run the lightweight health/readiness checks, surface required MCP/helper readiness, generated runtime freshness, project-local config status, optional provider readiness, and exact next actions. Do not run CodeGraph/Graphify first-generation, sync/reindex, graph extract/update, hook install, or provider project-skill install from the bare path. Do not ask the user to run internal scripts directly; point to public follow-up commands such as `spec-mcp-setup --project-config`, `spec-mcp-setup --verify-only`, or `spec-mcp-setup --only graphify`.
- `--only <ids>`: headless/subset apply path. `--only codegraph`, `--only graphify`, or `--only codegraph,graphify` narrows provider selection and also does not require a confirmation prompt.
- `--refresh`: Graphify explicit incremental refresh path. Use with `--only graphify` when `.graphify/` already exists, or when a legacy `graphify-out/` artifact should be regenerated into provider-native `.graphify/`, and the user wants setup to run provider-native `graphify update .` (code-only, no LLM) instead of only verifying/installing provider readiness. This is not full semantic extraction; missing artifacts still use first-generation `graphify extract .` with `graphify update .` fallback.
- `--requirement-workspace <repo-relative-path>`: optional Graphify input-scope override. Omit it for normal project-workspace setup; default input scope is the resolved project workspace.
- `--user-scope`：Kiro/Qoder/Cursor 写入 user-level MCP config 的 opt-in。缺少该 flag 时，即使由 generated host skill/command 间接调用，setup 也只为 Kiro 写 workspace `.kiro/settings/mcp.json`、为 Qoder 写 local `.qoder/settings.local.json`，或为 Cursor 写 project `.cursor/mcp.json`。

Graphify setup 使用受控 Provider route，`--only graphify` 是公开 opt-in。缺少 `--requirement-workspace` 时，默认使用已解析的 project workspace，并将 Provider artifact 写入 provider-native project-root `.graphify/`；显式 override 若为绝对路径、越界、通过 symlink 越界或不存在，则跳过 first generation，并返回结构化 next action。被选中后，setup 安装 `setup-registry.json` 声明的 pinned Graphify dependency，从用户原始 `PATH` 或 Provider 标准 `$HOME/.local/bin/graphify` 路径解析 `graphify` CLI，并使用该命令执行当前 host 的 project skill 安装（如 `graphify install --project --platform codex`）、first-generation `graphify extract .`、code-only/incremental fallback `graphify update .`、query probe 与 hook install/status；只有 Graphify 输出 `Refusing to overwrite` 且带 force hint 后，才允许一次 bounded `graphify update . --force` 修复。npm install 或 upgrade 后，若原始 PATH 上的 `graphify` 是 stale symlink，且 setup 能从 Provider 标准或 npm global bin candidate 解析到 pinned executable，则先备份 stale symlink，再将其指向 pinned executable；普通文件、不可写路径与歧义情况保持 report-only。若 project-root `.graphify/graph.json` 或 `GRAPH_REPORT.md` 已存在且未提供 `--refresh`，显式 Graphify setup 将其视为 steady-state install check：验证或安装当前 host 的 Graphify project skill/instruction section，探测 query 可用性，验证或安装 hook refresh，报告 `graphify-refresh-recommended`，并跳过 graph regeneration。旧版 `graphify-out/graph.json` 或 `graphify-out/GRAPH_REPORT.md` 仅是 compatibility-only refresh-needed evidence，不得当作当前 `.graphify/` artifact contract。`--refresh` 是显式 incremental graph refresh 路径；默认 project-root scope 运行 provider-native `graphify update .`（重新提取 code file，不做 LLM semantic extraction），且同样只在 Provider 拒绝覆盖后执行 bounded `--force` 修复。Provider project install 写入 `AGENTS.md` 或 `CLAUDE.md` 后，setup 只 normalize Provider-owned `## graphify` instruction section，使其表达 resolved CLI、manual visibility 与 direct-source fallback；不得 vendor 或重写 Graphify skill 本身。所选 repo 是 spec-first 自身 source repo 时，setup 跳过该 instruction-section normalization，防止 Provider setup 重写 source-owned host entry doc。任一显式路径执行后，只要 `.graphify/graph.json` 或 `.graphify/GRAPH_REPORT.md` 存在，setup 就以 project-level `graphify hook install` 为目标，使 provider-native refresh 在 setup 后继续保持 code graph 可用；如果 git hook environment 看不到 resolved Graphify CLI 目录而导致 Provider-owned hook 失败，setup 可在验证 hook status 前向 Graphify 安装的 hook 文件加入带 marker 的 project-local PATH repair block。Setup 不编辑 shell profile、不覆盖非 symlink command file、不启动 `graphify watch`、不为普通重复 setup 执行完整 semantic extraction，也不安装可选 Graphify MCP server。`$graphify .` / `/graphify .` 是 setup 完成后的 Provider assistant UX；setup 内部 first generation 使用 CLI extract/update，因为当前 session 可能无法动态加载新安装的 skill。

CodeGraph setup 使用受控 MCP/Provider route。被选中后，setup 安装 `setup-registry.json` 声明的 pinned CodeGraph dependency，使用 `codegraph serve --mcp` 配置 host MCP，运行 `codegraph init`，并探测 `codegraph status`。若 status 报告 `Pending Changes` 或要求 `codegraph index -f`，setup 先执行一次 bounded `codegraph sync`，再运行 `codegraph status`；仍存在 pending change 或 sync 失败时，返回带 diagnostic 的 action-required。若 post-sync status 仍要求 `codegraph index -f`，setup 执行一次 bounded full reindex 并复查 status。Full reindex 失败时保留现有 `.codegraph/` artifact，报告 degraded/actionable readiness，不删除 index。这些一次性的 sync/reindex 分支属于 install-init repair，不代表 spec-first 接管 steady-state ownership。

## Default Diagnose Flow

For bare `spec-mcp-setup`, do this inside the skill:

1. Resolve the project target. In a parent workspace, stop before repo-local writes unless the user selected a child repo or intentionally chose all supported child repos.
2. Run the lightweight health/readiness check and render a compact Stage 1 diagnostic:
   - required MCP/runtime facts: read existing `.spec-first/config/tool-facts.json` and `.spec-first/config/runtime-capabilities.json` snapshots when present, surface `baseline_ready`, generated runtime manifest status, configured dependency facts, and point to `spec-mcp-setup --verify-only` when confirmed facts are missing or need refresh;
   - helper readiness: `agent-browser`, `ast-grep`, and required global helper skills;
   - project-local config: `.spec-first/config.local.example.yaml`, optional `.spec-first/config.local.yaml`, `.gitignore` coverage, and legacy project config signals;
   - optional providers: CodeGraph/Graphify readiness facts from existing setup-owned facts when present, otherwise `unknown/not-refreshed` advisory status with explicit setup commands only.
3. Summarize next actions instead of running provider setup:
   - `spec-mcp-setup --project-config` for project-local config repair;
   - `spec-first init --<host> -y` when generated runtime manifest is stale or missing;
   - `spec-mcp-setup --verify-only` when setup-owned facts should be refreshed;
   - `spec-mcp-setup --only graphify`, `spec-mcp-setup --only codegraph`, or `spec-mcp-setup --only codegraph,graphify` for explicit provider setup.
4. Do not run provider first-generation from this default flow. Do not execute `codegraph init`, `codegraph sync`, `codegraph index -f`, `graphify extract .`, `graphify update .`, `graphify hook install`, or provider project-skill installation unless the user selected an explicit provider/runtime mode.

## Explicit Provider Runtime Flow

Use this flow only for `--only codegraph`, `--only graphify`, `--only codegraph,graphify`, or Graphify `--refresh`:

1. 解析 loaded skill root，并运行 `node "$SKILL_DIR/scripts/setup.cjs" --plan --repo <resolved-project-root> --only <selected-providers>`。
2. Present a compact install-init preview block naming the selected provider writes, host-owned writes, provider artifacts, `.gitignore` policy, and explicit non-actions.
3. If the plan reports an unknown provider selection or unresolved target, stop with the blocked reason and next action instead of installing.
4. Otherwise, run the internal apply path with the same explicit `--only` selection plus any `--repo`/`--folder`/`--requirement-workspace` args already supplied, then run verification/fact refresh and render the final grouped status block. If CodeGraph/Graphify readiness is ready or degraded-but-usable and no setup blocker remains, the final next step should suggest running `spec-rule-miner` separately to mine project rules from source evidence.

## Workflow

1. Identify the current host from the generated host-specific runtime surface invoking the unified `spec-mcp-setup` entrypoint. The target renamed entrypoint is `spec-runtime-setup` once the alias contract lands.
2. If invoked from a parent workspace, select an explicit child repo or intentionally run setup for all supported child repos. Writes must stay within the selected target.
3. 运行共置 Node 入口，使其加载 `setup-registry.v8`、校验 schema，并展开 effective host/platform registry。
4. 让 `setup.cjs` 按所选 mode 诊断或安装必需的 package-backed MCP tool；只有显式 `--only` selection 才接纳可选 MCP/Provider entry；host config 只能通过 registry target 写入，并记录结构化 execution facts。
5. 让同一 Node 入口验证 baseline helper 与显式批准的 Provider。`agent-browser` 保持 diagnostic/manual-command only：收集 readiness facts 与安装指引，但不自动安装 CLI、browser runtime 或 global skill。已批准的 Provider first generation 与 project-local auto-refresh setup 只能通过静态 Provider module 与 bounded argv-array process runner 执行。若默认 project-root scope 中的 `graphify extract .` 失败，setup 可以先尝试 code-only `graphify update .`，再返回 failed readiness。若 Graphify 已安装但不在用户原始 `PATH` 中可见，报告 manual visibility action，不编辑 shell profile；对 Provider-owned git hook，setup 只能修复 project-local Graphify hook PATH block，使 hook verification 在不修改 global profile 的情况下成功。Bounded repair 后 Graphify hook install 仍失败时，报告带 `next_actions` 的 `readiness_status=degraded`，不得标记 hook refresh 已验证。
6. Run project-local config bootstrap where the selected mode authorizes it. Bare setup should at least report current example/local/gitignore/legacy status; explicit project-config actions may refresh the example, create the local override, and ensure ignore coverage. Do not auto-delete legacy project config or migrate legacy keys.
7. 使用 `setup.cjs --verify-only` 写入 readiness ledger、reconcile host pointer facts、写入 project setup facts，并渲染分组 status block。必须分别读取 `generated_runtime_manifest.status` 与 `baseline_ready`；`baseline_ready=true` 不能掩盖 stale generated runtime。状态为 `stale` 或 `missing` 时，使用符合 topology 的命令刷新 runtime：当前 repo 或 parent workspace runtime 使用 `spec-first init -y`，单个 child repo 使用 `spec-first init --repo <child> -y`，只有明确要批量刷新 child root 时才显式运行 `spec-first init --all-repos -y`；随后重新验证。若刚运行 `spec-first update` 后状态仍 stale，应将其视为 degraded refresh evidence，并展示相同 fallback 命令，不得报告 runtime freshness 为 ready。
8. Report the status exactly enough for the user to act: ready rows need no action; action-required rows name the missing dependency/config/target step; generated runtime manifest rows name the init refresh command when stale or missing.

## Output Shape

The final setup output should contain:

- `Execution result`: separate `Required MCP/helper dependencies` and `Generated runtime manifest` rows; report `baseline_ready` as dependency readiness and `generated_runtime_manifest.status` as generated runtime freshness.
- `MCP servers`: required baseline MCP tool dependency/host/project readiness, explicit opt-in MCP entries when selected or detected, and next action.
- `Helper tools`: helper install and readiness status.
- `Provider tools`: provider readiness status, derived `readiness_scope` / `probe_status`, and lifecycle display bits when present. Summaries must distinguish install/index readiness from server/query verification.
- `Host configured dependencies`: configured MCP/hooks/allowlist/setup/verification command facts.
- `Install safety`: helper install source, risk, review, and mirror provenance.
- `Project local config`: example config, local override, gitignore safety rule, legacy markdown config signal, and retired legacy local config status. Human labels and machine fields should be de-branded; active setup facts must use `.spec-first` local config paths and neutral legacy field names.
- `Project setup facts`: status for `tool-facts.json` and `runtime-capabilities.json`.
- `Verification profile`: current verification profile visibility placeholder; full profile execution is v1.13 scope.
- `Next steps`: either fix action-required rows, choose an explicit child repo, continue to the user-intent workflow, or suggest `spec-rule-miner` as a separate follow-up after CodeGraph/Graphify readiness is prepared. This suggestion is advisory; setup must not treat rule-miner output as setup readiness and must not call `spec-rule-miner` automatically.

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
- write Kiro MCP config to workspace `.kiro/settings/mcp.json` by default, and to `~/.kiro/settings/mcp.json` only after explicit user-scope opt-in;
- write Qoder MCP config to local `.qoder/settings.local.json` by default, and to `~/.qoder/settings.json` only after explicit user-scope opt-in;
- write Cursor MCP config to project `.cursor/mcp.json` by default, and to `~/.cursor/mcp.json` only after explicit user-scope opt-in;
- write project-local setup facts;
- refresh `.spec-first/config.local.example.yaml`, create `.spec-first/config.local.yaml`, and ensure `.spec-first/*.local.yaml` ignore coverage only through explicit project-local config bootstrap actions;
- report the legacy project markdown signal for manual review and the retired legacy local config status without migrating either;
- perform explicit provider-native first generation for approved providers when the target workspace is resolved, or verify Graphify install readiness without regenerating the graph when a project-root Graphify artifact already exists and no explicit `--refresh` was requested;
- perform bounded provider-native setup repair where deterministic and documented, such as incremental/code-only `graphify update .` after default project-root `graphify extract .` failure or explicit `--refresh`, one `graphify update . --force` after Graphify overwrite refusal plus force hint, one `codegraph sync` after pending/full-rebuild status, or one `codegraph index -f` after sync cannot clear the full-rebuild advisory;
- perform provider-native project-local auto-refresh setup for approved providers when available, such as Graphify `graphify hook install`, including bounded project-local PATH repair for Graphify-installed hook files when the resolved CLI is off the user's original `PATH`;
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
npm run test:mcp-setup
node --check "$SKILL_DIR/scripts/setup.cjs"
```

For cross-host changes, also run `npm run typecheck`, `npm run test:unit`, `npm run test:smoke`, and `spec-first init` after source validation.
