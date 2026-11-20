---
name: spec-runtime-setup
description: Install, configure, verify, and refresh required harness runtime readiness facts for spec-first workflows on Claude Code, Codex, Cursor, Kiro, Qoder, OpenCode, ZCode, or Pi.
argument-hint: "[bare baseline converge] [--installation-only] [--check|--verify-only|--plan|--project-config] [--only codegraph,graphify] [--workspace-graph|--workspace-graph-status|--workspace-graph-clean] [--repos <a,b>] [--json] [--repair-host-config] [--refresh] [--repo <git-root>|--folder <project-folder>] [--requirement-workspace <target-relative-path>]"
---

# Runtime Setup

`spec-runtime-setup` is the canonical runnable entrypoint for the Runtime Setup workflow across supported hosts (Claude/Qoder/OpenCode command name: `runtime-setup`, projected as `spec-runtime-setup.md`, public invocation: `/spec-runtime-setup`). Host-specific setup spellings are not separate products. Runtime Setup prepares deterministic host/runtime facts for spec-first workflows. It installs or verifies required MCP servers and baseline helper tooling, diagnoses manual helpers such as `agent-browser`, writes setup-owned project facts, and reports concrete next actions. It does not provide code-understanding authority; downstream workflows use bounded direct source reads, `rg`, ast-grep, git diff, tests/logs, and user-provided evidence.

## Contract Summary

| Field | Contract |
| --- | --- |
| When to use | Host runtime setup, MCP setup, helper-tool readiness, missing runtime assets, or project-local setup fact refresh. |
| When not to use | Ordinary planning, implementation, review, debugging, or code impact questions that can proceed from direct source evidence; route those through the `using-spec-first` entry map (`spec-plan` / `spec-work` / `spec-debug` / `spec-code-review`). |
| Input | Current host, repo target, loaded skill(s), combined `setup-registry.json`, host config status, git/workspace target facts, and project instruction. |
| Outputs | Readiness ledger v2, provider readiness v2 facts, generated runtime manifest freshness, setup scenario fingerprint, project-local config bootstrap status, optional project setup facts under `.spec-first/config/`, and a grouped status block. |
| Artifacts | `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, `.spec-first/config.local.example.yaml`, `.spec-first/config.local.yaml` when explicitly created, `.gitignore` local-config safety rule when explicitly ensured, and `.spec-first/workspace/scenario-fingerprint-setup.json` when applicable. |
| Failure modes | Missing dependencies, host config write failure, ambiguous parent workspace target, symlink escape, invalid registry schema, helper install failure, or unsupported host. |
| Downstream consumers | `using-spec-first`, plan/work/review/debug workflows, doctor/update guidance, and humans repairing setup. |

Core boundary: The Node module establishes deterministic readiness facts; the LLM workflow determines how to utilize these facts. Setup shall not require sufficient semantic understanding of code, nor shall it mandate that routine work depend on external analysis services.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Source Of Truth

The canonical package source-of-truth is `skills/spec-runtime-setup/setup-registry.json`, validated by the co-located `setup-registry.schema.json`, with schema version `setup-registry.v11`. The generated host consumes the registry projection from the already-loaded skill directory; this projection is the generated runtime, not a second source. The current complete Runtime Setup essentials include `sequential-thinking`, `context7`, CodeGraph, and Graphify; ffmpeg is included only upon explicit selection or video requirements; installation scope completion does not require the first generation of CodeGraph/Graphify or query; single-project bare and explicit graph capability use artifact scope (see the pattern matrix below). `--only codegraph` / `--only graphify` are intended for advanced subset repair and do not alter the essential definitions required for a complete setup.

Generated host runtime mirrors and host-local MCP config files are projections or outputs, not source. If setup prose or scripts change, update source first and use `spec-first init` only for runtime regeneration.

## Required Harness Runtime

`setup-registry.json` is responsible for mandatory MCP definition, helper readiness and install safety, required Provider metadata, external dependency pinning, host target, artifact contract, and platform override. Loader expands the registry default deterministically for the current host/platform, without assessing Provider readiness or semantic adequacy. Current helper checks include ffmpeg, `agent-browser`, and ast-grep capability detection; ffmpeg is only blocked when explicitly selected or when the `--workflow video` requirement is present, while `agent-browser` in unrequested states remains report-only and non-blocking. For `agent-browser`, `dependency_status: ready` indicates only that the CLI/runtime/global skill is fully installed, and does not imply `execution_readiness: ready`; the exact-origin capability gap must retain its canonical reason, `conformance_status`, `repair_scope`, and `next_action`.

All executable setup behaviors are handled by the pre-defined Node entry point and modules located in the `scripts/` directory. Do not reimplement registry query, host config writing, Provider commands, or facts reconciliation within workflow prose.

## Loaded Skill Entry

Parse `SKILL_DIR` from the current directory where `spec-runtime-setup/SKILL.md` is loaded. Each runtime invocation must use the pre-placed Node entry in this directory:

```bash
node "$SKILL_DIR/scripts/setup.cjs" <mode-and-target-arguments>
```

It is absolutely not allowed to resolve this command from the project cwd or source checkout path. The Generated command surface uses its companion support root as `SKILL_DIR`. Before entering mutation-enabled mode, pass `MCP_SETUP_HOST=<host>` via the tool's per-call environment overlay (see the canonical `MCP_SETUP_HOST` definition below for valid host enumerations); read-only diagnostics can report advisory host candidates, but cannot convert them into write authority.

`scripts/check-health` is a compatibility shim with a Node shebang, delegating to `setup.cjs --check`. Windows directly calls `node <loaded-skill-root>/scripts/setup.cjs --check`, with no platform-specific companion entry.

Optional provider readiness is reported through `provider_readiness[]` (`provider-readiness.v2`); its field inventory — lifecycle display bits, setup-owned metadata, Graphify `first_generation.scope_provenance` receipt rules, `steady_state` hook facts, and `readiness_scope`/`probe_status` display derivation — is owned by `references/provider-readiness.md` (repo canonical: `docs/contracts/provider-readiness.md`). Downstream decision health is still driven by `readiness_status`; lifecycle, first-generation, provenance, and hook fields explain boundaries and next actions, not semantic truth. Graphify hook blocked/failed/skipped: do not individually change the success results of package, host integration, artifact integrity, and query probe to Provider `degraded`. Provider self-reported `fresh` maps to `unknown`; provider self-reported `stale` may map to `stale` because it is conservative. `query_verified=true` is reserved for a real probe or explicit real-environment signal, not for package installation alone; a `false` or missing `server_reachable` / `query_verified` display value means the probe is not verified in this setup run unless a failure reason says otherwise — it must not be summarized as confirmed provider query availability.

## Project Preflight / Local Setup

Project-local setup has two separate surfaces:

1. Setup-owned facts: `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, and when applicable `.spec-first/workspace/scenario-fingerprint-setup.json`.
2. Local config bootstrap: `.spec-first/config.local.example.yaml`, local override state for `.spec-first/config.local.yaml`, and `.gitignore` coverage for `.spec-first/*.local.yaml`. Missing local override means `defaults-active`, not "unhandled option".

Local config bootstrap is a first-class Runtime Setup capability, but it remains project-local and local-only. It checks and can explicitly refresh `.spec-first/config.local.example.yaml`, explicitly create `.spec-first/config.local.yaml`, and explicitly ensure `.spec-first/*.local.yaml` is ignored. It reports legacy project config signals for manual review, but it does not copy legacy files, translate old key names, or treat old defaults as spec-first truth.

Before any project-local write, read `references/project-config.md`. Project-local config actions never install providers or edit host config; host/provider actions never migrate local config keys.

## Three-Stage Setup Flow

Even though the internal Node module performs multiple checks, the Runtime Setup should still maintain a user-facing three-stage process:

### Stage 1: Diagnose Target And Readiness

Resolve the project target first. `--repo <path>` selects an exact Git root; `--folder <path>` selects that exact logical project directory whether it is nested inside a Git worktree or has no Git boundary at all. Without a target flag, a pure non-Git directory with no child repos becomes the single folder target; the parent diagnostic is returned first for the non-Git parent directory if child repositories are detected. Parent directory bare / bare --all-repos / --check are all read-only diagnostics; batch installation uses `--installation-only --all-repos`, batch capability uses `--only codegraph,graphify --all-repos`. Provider artifacts and setup facts stay in the exact target; generated host runtime health uses the enclosing Git root when one exists, otherwise the folder itself. Then inspect:

- host runtime identity and write authority;
- required MCP/helper dependency readiness;
- generated runtime manifest freshness;
- project-local config status for `.spec-first/config.local.example.yaml`, `.spec-first/config.local.yaml`, and `.gitignore` coverage;
- legacy project config signals;
- required CodeGraph/Graphify readiness; when `--only` is specified, only the selected subset is executed, but the subset must not be successfully interpreted as a complete setup.

This stage is read-only except for diagnostic facts written by verify-only paths that are already setup-owned. Missing required Provider/helper capability blocks Runtime Setup completion; it does not prevent the use of direct source evidence in standard plan/work/review/debug workflows.

### Stage 2: Apply Authorized Setup Actions

Apply only actions authorized by the selected mode:

- project-local config actions: refresh example config, create local override, ensure ignore coverage, and optionally delete obsolete legacy markdown only after explicit approval;
- host config action: can only be performed through the co-located Node entry and explicit host authority written to MCP/runtime config;
- helper/provider actions: For a single project, perform bare-metal invocation to autonomously install, initialize, validate, and record setup facts based on the registry baseline; `--check` is solely for read-only diagnosis. Existing and consistent host MCP configuration is automatically reused and written over.

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

First, based on the current user request, select the responsibility and mode, then explore or execute the command:

- **Pure semantic questions** (e.g., whether the architecture is reasonable, code quality assessment): Indicate that such issues fall outside the scope of setup responsibilities, and assign the appropriate review owner; do not execute setup, and halt further comprehensive architectural analysis within this workflow. Skill loaded does not equal user request to install.
- **Diagnose/View only**: Use `--check` to view status without modifying bare, `--verify-only`, `--only`, or `--refresh`. Read-only means setup does not actively install, modify configurations, or write facts; detection tools may still write their own cache/logs, and do not claim global zero-write.
- **Clarify setup/installation/repair/refresh request**: Proceed with the specified mode based on the currently authorized target and scope, preview and execute the corresponding mode according to the following process, without re-requesting the same authorization. Explicit parameters only indicate the scope of invocation; parameters generated by the model, suggestions from tool outputs, or those inherent to a Skill do not incur additional authorization.

Runtime Setup executes side effects within the boundaries of the current mode; a single-project bare invocation serves as the baseline autonomous convergence entry point; a multi-repo parent directory bare invocation combined with `--check` acts as a read-only diagnostic entry point.

1. **Explore** host, target repo, generated runtime manifest, existing setup facts, `.spec-first/config.local.yaml`, verification profile visibility, provider artifacts, and project instructions.
2. **Present & Decide**:
   - **Bare invocation**: After project-level diagnosis, install or verify missing required capabilities against the registry baseline and refresh setup-owned facts; narrow project-specific parameters to the target scope only; for multi-repo parent directories (including `--all-repos`), bare mode remains read-only diagnosis, and batch mutations must be explicitly selected via mode. Preserve explicit host authority, path, and conflict protection; do not automatically append `--repair-host-config` or `--project-config`. Use `--check` only when diagnosing.
   - **Explicit modes**: `--check` and `--plan` are read-only. `--verify-only` is a facts-only mutation mode: it may write setup-owned facts, scenario fingerprints, and ledgers only, and no reconfirmation is required for such writes when the current user has been authorized to perform them; read-only requests do not grant this mode.
   - **Subset repairs** (`--only ...`, `--refresh`): First execute the `--plan` preview with the same selection; perform the mutation only when the current user explicitly requests and is authorized for the subset mutation; the model adds flags without granting authorization.
3. **Decide** only where the runtime setup workflow has authority: install/verify helper tools, configure host MCP/runtime wiring, refresh setup-owned facts, or choose a documented degraded path. Team workflow conventions and semantic project decisions remain LLM/owner judgment in downstream workflows.
4. **Write** only setup-owned facts, supported local config examples, host runtime config through documented targets, and generated runtime refreshes through `spec-first init`. Do not write team-shared tracker policy, label vocabulary, external PR request-surface policy, issue acceptance decisions, or durable rejected-scope decisions from setup.

`.spec-first/config.local.yaml` is a local-only override file, not team-shared source of truth. Current active local config consumers are:

- `verification_profile_path`, read by the verification profile loader as a local execution preference;
- `feedback_sources` and `sweep_*`, read and written by `spec-sweep`;
- `pulse_*`, read and written by `spec-product-pulse`;
- `spec_promote_spiral_optout`, read and written by `spec-promote`;
- `plan_skip_scoping_confirm`, exposed for downstream planning workflows that support persisted scoping-confirmation preference;
- `plan_output`, `brainstorm_output`, and `ideate_output` are respectively read by `spec-plan`, `spec-brainstorm`, and `spec-ideate`.

`plan_output`, `brainstorm_output`, and `ideate_output` are all active local rendering preferences. The consumer reads only the uncomments and valid `md` / `html` values; missing, invalid, or still commented values are respectively fallback to `spec-plan=md`, `spec-brainstorm=md`, `spec-ideate=html`. Pipeline override is still decided independently by each consumer. Runtime Setup exposes and protects only these keys, does not invoke the corresponding workflow, and does not elevate local rendering preferences to runtime authority. CE/local delegation key without a real reader does not enter the local config surface. Setup must not auto-delegate, skip scoping confirmation, or change host model/runtime behavior merely because a key exists. Missing local config is not a blocker; defaults remain advisory and must not be reported as repo truth.

If setup later reports project convention facts, they must be deterministic existence facts only, such as whether `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, or a project guidance index exists. Setup must not judge whether terminology is correct, an ADR applies, a proposed issue/PR should be accepted or rejected, an out-of-scope concept matches, or implementation satisfies a request.

## Host Authority And Write Safety

The only currently public entry point is `spec-runtime-setup` (Claude/Qoder/OpenCode command name: `runtime-setup`, projected as `spec-runtime-setup.md`, public invocation: `/spec-runtime-setup`); no `spec-mcp-setup` or `mcp-setup` alias compatibility is provided. The host runtime surface invoked by it is the authoritative host evidence. The generated host-specific runtime surface must set `MCP_SETUP_HOST=<host>` via the per-call environment prior to invoking a Node mode that supports mutation. When the explicit canonical `MCP_SETUP_HOST=claude|codex|cursor|kiro|opencode|qoder|zcode|pi` is missing, `setup.cjs` must fail closed; mutation target inference based on `PATH`, generated runtime directory, old `.spec-first/config/*` facts, or host config files from other platforms is not permitted. Read-only diagnosis can display advisory host candidates, but these candidates do not have write authority.

Before writing any host config or refreshing setup-owned facts, the workflow must allow `setup.cjs` to resolve the host authority and effective registry target from an explicitly specified entrypoint host pin. Old setup facts can serve only as evidence for drift comparison: if they differ from the current entrypoint host, a host-marker drift must be reported, and the setup-owned facts for the current host must be refreshed; the old host must not be considered the current host. Never select `.kiro/settings/mcp.json`, `.qoder/settings.local.json`, `.cursor/mcp.json`, Codex TOML, or Claude managed/user config from prose alone.

Do not use Write, Update, Edit, or other host file-editing tools to modify `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, or the host MCP configuration file. The `setup.cjs` and its deterministic host-config/facts module can only execute these writes after all of authority, target, containment, conflict, and verification gate checks have passed.

## Workflow Modes

- `--check`: inspect current dependency/runtime status only; do not write setup facts, host config, or install tools.
- `--verify-only` / `--refresh-facts`: verify readiness and refresh setup-owned facts. `--verify-only` is a facts-only mutation mode and may write setup-owned facts, scenario fingerprints, and ledgers only; it must not install providers, edit host config, bootstrap project config, or refresh generated runtime.
- `--plan`: render install/config operations and safety results; do not write setup facts, host config, or install tools.
- `--project-config`: Executes only the project-local config bootstrap. Refresh on request example: local override is created only after explicit action, ensure `.spec-first/*.local.yaml` ignores coverage, and report legacy project config signal without migrating them. This mode does not install the MCP server, does not configure the host runtime, and does not execute the helper/Provider first generation.
- Bare invocation (`spec-runtime-setup`): Single-project bare invocation converges the baseline declared in the registry—executes the action set specified by `--only codegraph,graphify`, including installation, host wiring, Provider mutation, and facts writing (converges baseline in a single project, not merely diagnostic; for parent directory across multiple repositories, bare invocation remains diagnostic; explicit batch mode is required to execute on child repositories). Explicit host authority required; existing security gate still rejects insecure paths, symlinks/secrets, and conflicts with higher-priority rules; `--repair-host-config` boundary remains unchanged; subset failures reported as partial, no claim of complete setup ready.
- `--only <ids>`: advanced headless/subset repair pathway. `--only codegraph`, `--only graphify`, or `--only codegraph,graphify` limits provider execution and bypasses the confirmation prompt; subset results must be labeled as partial scope and cannot claim a complete setup is ready.
- `--repair-host-config`: Explicitly authorizes setup to replace only MCP entries managed by the registry and confirmed to have conflicts; retains other user fields and server information within the same host config, and performs transaction rollback and post-write verification. This flag must correspond to a user-authorized selected-target repair; bare invocation shall not automatically append. Can be used independently for baseline host config repair, or combined with `--only ...`, and after repair, continue with Provider install-init. Without the flag, an explicit `--plan` must report `host-config-conflict` and block if detected before package/provider mutation; high-priority target conflicts, unreadable configurations, symlink/path escapes, and literal secrets cannot be bypassed via this flag.
- `--refresh`: Explicitly refreshes the path in Graphify. When `graphify-out/` already exists, use it in conjunction with `--only graphify`; the setup invokes the official `graphify update <workspace>` to update the existing code graph, then reperforms integrity and bare query probing after the update, and finally atomically writes a scope provenance receipt bound to the SHA-256 of the current `graph.json`. It does not create a spec-first top-level staging/backup; if only the legacy adapter directory `.graphify/` exists, a regular setup will first atomically migrate it to `graphify-out/`; failure is triggered if both artifact roots exist simultaneously. It is a on-demand update mechanism for `manual-only` steady state, not an action to fix the `core.hooksPath` outside of projects, and does not imply complete semantic extraction. When a regular setup or `--verify-only` returns core-ready with `readiness_status=unknown`, do not refresh automatically. Never append or run `--refresh` solely because the status is unknown; an unknown status indicates the absence of currentness evidence for the current round, not a failed query probe or an uncompleted required setup.
- `--requirement-workspace <target-relative-path>`: optional Graphify input-scope override. Omit it for normal project-workspace setup; default input scope is the resolved execution root. This flag narrows Graphify input only; it does not change the CodeGraph root, setup facts owner, or the Provider-native `graphify-out/` artifact owner.
- `--repo <path>` must resolve to the exact Git repository root. A nested path is invalid and fails closed instead of being promoted to an ancestor root; use `--folder` when the nested directory is the intended logical project.
- `--folder <path>` selects the exact logical project directory and does not require Git. CodeGraph writes `.codegraph/`, Graphify writes `graphify-out/`, and setup writes `.spec-first/config/` under that folder. If it is nested inside a Git repository, generated spec-first runtime readiness is checked at the enclosing Git root so setup does not request a duplicate child `.agents/skills`; a standalone non-Git folder uses itself as the runtime projection root. Missing/stale runtime returns a structured interactive action rooted at that projection plus a headless variant containing `-y -u <name> --lang <zh|en>`, emitted as structured `next_action_command={cwd,command,args}` plus `next_action_headless_command`, with `next_action` as explanation only and never an executable `cd ... && ...` compound string; the folder is never passed to Git-only `init --repo`. Git health remains an additional fact and never rewrites the folder target. Graphify commit hooks and Git HEAD baselines are skipped as `not-applicable` for `target_kind=non-git-folder`, including a nested folder whose parent is a Git repo, while first generation, query, explicit refresh, and CodeGraph indexing remain supported.
- `--user-scope`: Opt-in option to write user-level MCP config for Kiro/Qoder/Cursor/OpenCode/PiWithout this flag, even if indirectly invoked by a generated host skill/command, setup will only write to Kiro's workspace `.kiro/settings/mcp.json`, to Qoder's local directory `.qoder/settings.local.json`, to Cursor's project directory `.cursor/mcp.json`, to OpenCode's project `opencode.json`, or to Pi's project directory `.pi/mcp.json`. OpenCode user scope parses `${XDG_CONFIG_HOME}/opencode/opencode.json`; Pi user scope parses `$HOME/.pi/agent/mcp.json`; when either project or user scope exists, and a JSONC sibling is present, JSON mutation is blocked with the flag `host-config-jsonc-precedence-blocked`.
Pi's MCP consumption is enabled via the `pi-mcp-extension` (`pi install npm:pi-mcp-extension`): the setup-written `.pi/mcp.json` (with `mcpServers` container; stdio entry omits `transport`) takes effect only after the extension is installed; it remains inert if the extension is not installed. The `host-config-current` confirms that the configuration has been written and is properly formatted, but does not guarantee that the Pi session has loaded the tools.

OpenCode host config mutation treats the MCP entry and the `opencode-governed-assets-v1` permission policy as part of the same bounded transaction. Permission policy allows only exactly matched governed skill names from the current projected runtime state, prohibits wildcard/global allow, and retains `bash`, `edit`, `task`, `webfetch`, `websearch`, and similar dangerous tools in `ask` mode; fails closed/rollback in cases of conflicting user rules, unsafe last-match ordering, or post-write verification failure. Uninstall removes only the managed entries that exactly match the expected value, does not delete the entire `opencode.json` file, and does not override unrelated user fields.

Graphify setup uses a controlled Provider route; direct invocation converges installation, initialization, query, and facts based on the registry baseline; `--only graphify` enables explicit subset installation or repair of entry points. Current pin is PyPI `graphifyy@0.9.57`, requiring Python `>=3.10`. Setup uses only installed uv (preferred) or pipx, installing release-reviewed direct wheels into an isolated tool environment; uv prohibits managed Python downloads, returning action-required if compatible Python or tool manager is missing, without automatic bootstrap, and does not fall back to plain pip. Package readiness simultaneously verifies distribution identity, version, CLI version, absolute launcher, and interpreter. Explicit Graphify mutation setup only defaults to uninstalls the verified global `@sentropic/graphify` and removes only the old symlinks that still point to the original target and are resolvable to the npm package, provided that the Python package/artifact/query/host are all verified, and the project-local hook in the Git repository is also verified (this does not apply to non-Git repositories). No incumbent cleanup is performed for external/unsafe hook targets; unknown commands, regular files, and other symlinks are left unchanged.

The Graphify Provider only accepts the PyPI `graphifyy` dependency. Failure recovery uses fixed wheel reinstallation, contained artifact backup restoration, and Python readiness verification.

When `--requirement-workspace` is missing, use the resolved project workspace and directly employ the Provider's native default directory `graphify-out/` as the sole current artifact, without injecting `GRAPHIFY_OUT`. First generates fixed execution `graphify extract . --code-only`, without probing API key or triggering semantic backend; fails closed if code files are non-empty but generate zero nodes. Existing `graphify-out/` is present and no `--refresh` is provided; only verifies package, host integration, bare query, and optional hooks available within the current project's authorization domain, without modifying the current graph. Blocks when `graphify-out` exists but is not a non-symlinked real directory, using `graphify-artifact-root-unsafe` before any host/runtime mutation; migrates the atomic directory for legacy `.graphify/` without rebuilding the graph; blocks when both `.graphify/` and `graphify-out/` exist, using `graphify-artifact-root-conflict` to avoid dual sources of truth. Explicitly `--refresh` uses the official `graphify update <workspace>` to update the code index on an existing graph, reusing the provider's built-in repo lock, temporary graph, shrink guard, and unchanged node retention capabilities; spec-first no longer creates top-level `.graphify.staging-*`, `.graphify.backup-*`, or migration journal files for routine refreshes. The legacy journal from the old version retains compatibility for recovery only and is not a rollback mechanism for new refresh operations. The Graphify subprocess initiated by setup injects `GRAPHIFY_NO_BACKUP=1` only for unprotected artifacts, disabling daily snapshotting by the Provider to prevent daily image accumulation; when the `graphify-out/` directory matches the Provider's `backup_if_protected` homogeneity check—triggered by the presence of `.graphify_semantic_marker` or a non-default community label in `.graphify_labels.json` (failing the check is conservatively treated as protected)—no injection occurs, and the snapshot prior to curated/semantic graph coverage remains the sole rollback channel. This injection only overrides the processes called by setup, and commit-time hooks in background rebuilds within a Git environment remain unaffected. Apply/refresh: when generation evidence and query evidence are available in the current round, it can be `fresh`; when only read verify is performed and no currentness evidence is available in the current round, it is `unknown`.

Claude, Codex, Cursor, Kiro use the real project install surface with Python Provider; setup only normalizes `graphify-out/` within the `## graphify` section for recognized Provider-owned skills/references/rules/steering, and binds the Claude/Codex host hook commands to a verified launcher. Qoder does not invoke a non-existent `--platform qoder`; instead, it uses a direct CLI/fallback adapter provided by the spec-first-owned Qoder instruction. Graphify Git hook provides project-local, optional auto-refresh: setup first uses `git rev-parse --git-path hooks` to resolve the effective hooks root; only when both lexical containment and no-follow symlink containment confirm the target resides within the current project is the hook install/uninstall/status executed using a process-level `core.hooksPath` pin, and the target is re-resolved after command execution. Share worktree/submodule metadata, resolve failure or symlink escape cases; do not execute hook commands, do not read external hook content, do not modify local/global `core.hooksPath`, do not copy or concatenate global hooks; return `blocked + manual-only`, but do not block Graphify core readiness that has already passed. When effective hooks root is located outside the project (e.g., in a global `core.hooksPath`), the setup reads only the two regular files `post-commit` and `post-checkout`, detects the Provider marker, and re-generates the legacy root with the `GRAPHIFY_OUT=.graphify` override; it does not write, execute, or run `hook status`, nor does it modify `core.hooksPath` or chain global hooks. Report `hook_status=verified-external` + `refresh_mode=commit-hook-external-verified` only when the `post-commit` marker exists and neither file has a legacy override; return `blocked + manual-only` when the `post-checkout` marker is present, the marker is missing, or the file is unreadable; use `graphify-external-hook-legacy-artifact-override` to explicitly block when a legacy override is present. The `manual-only`/`verified-external` here only describes the spec-first, read-only, verifiable external commit-time posture, not project-owned `verified` (the `hook_installed`/`hook_verified` remain false). Must not claim that external hooks do not exist, will not be executed, or that "installation failed"; external execution is always unverified. Project-local verified hook still requires a unique Provider marker block, a verified interpreter, and the allowed `_rebuild_code` command for both post-commit and post-checkout; spec-first will remove the old injection of `GRAPHIFY_OUT=.graphify`, ensuring hooks use the Provider's native default directory. Marker external user content remains unchanged and will not be executed by default smoke. Setup does not edit the shell profile, does not start watch, does not install `graphifyy[mcp]`, and does not elevate a Graphify candidate to confirmed truth.

CodeGraph setup uses a controlled MCP/Provider route. After being selected, the setup installs the pinned CodeGraph dependency declared in `setup-registry.json`, configures the host MCP using `codegraph serve --mcp`, runs `codegraph init`, and probes the status with `codegraph status`. If the status reports `Pending Changes` or requires `codegraph index -f`, the setup first executes a bounded `codegraph sync`, then runs `codegraph status`; if pending changes still exist or the sync fails, returns an action-required message with diagnostic information. If the post-sync status still requires `codegraph index -f`, run a bounded full reindex during setup and then verify the status. After indexing ready, run a bounded `codegraph query __spec_first_readiness_probe__ --limit 1 --json` real query probe; set `query_verified=true` only if the command succeeds, otherwise report `codegraph-query-probe-failed` degraded readiness. Retain existing `.codegraph/` artifact when full reindex or query probe fails, report degraded/actionable readiness, and do not delete index. These one-time sync/reindex branches belong to install-init repair and do not signify spec-first taking ownership of steady-state management.

## Default Diagnostic Flow

1. First select responsibilities and patterns according to the request above; for pure semantic questions, return here and do not enter setup. Parse target: `--repo` must be the exact Git root; `--folder` must remain the exact logical folder. When there is no target, the existing resolver distinguishes between single-directory and multi-repo parent directories, and scope expansion is prohibited.
2. Execute only during diagnosis: `node "$SKILL_DIR/scripts/setup.cjs" --check`, preserve the caller's target flags; clearly specify that mutation requests must first enter step 4 (preview and execution). Single-project bare installation maintains semantic consistency, but is only usable for authorized setup requests; multi-repo parent directory bare remains for diagnostic purposes only. `--verify-only` will write setup-owned facts and cannot be used for read-only requests.
3. Display target, host advisory, configuration status, readiness, and next action. Missing local override indicates `defaults-active`. Conflicts are reported only with path/key/reason, without automatically appending `--repair-host-config`.
4. When a user requests installation or repair, use the same `--plan` preview with target and selection; retain the readiness scope as specified by the returned `next_action`: installation requires explicit `--installation-only`, artifacts require explicit `--only <selected_ids>`, while preserving target, requirement workspace, repair, and refresh. It is not sufficient to only delete `--plan` and then execute bare; authorized scopes can still continue in explicit mutation mode. Unauthorized new side effects require verification; preview success alone does not grant write permissions. For `action-required`/`degraded` outcomes, read the machine's `reason_code` and `next_action_command`, and perform only the bounded repairs permitted by the registry; after repair, the same actual probe must be rerun.
5. After explicit mutation, report the selected scope based on the validation result of the mode; do not claim a complete setup is ready when full validation is missing. A regular workflow can continue to use direct-source fallback.

## Installation and Graph Readiness

The following matrix provides a unified description of the default mode and readiness scope; explicitly `--installation-only` takes precedence to narrow the scope to installation.

| Invocation | Scope and Actions |
| --- | --- |
| Single project bare | artifact; complete baseline installation, wiring, graph initialization and validation and facts writing |
| Multi-repository parent directory bare / bare --all-repos / --check | parent diagnostic; read-only, no installation, no imaging |
| Single project --check | Read-only diagnosis, no installation, no configuration, no writing of facts |
| Normal --plan / --verify-only / --refresh-facts | installation; plan read-only, verify only verifies installation/wiring and writes facts |
| --installation-only (can be paired with --all-repos) | installation; installation, wiring and facts, not composition/query/hook |
| --only <graph-id> or --requirement-workspace | artifact; plan read-only preview, verify only validates existing artifacts and writes facts; explicit apply is required for installation/visualization |
| --only graphify --refresh | artifact; refreshes existing images, cannot replace initial composition |

`--installation-only` is an explicit installation/interconnection entry point; ordinary plan/verify defaults to installation when neither `--only` nor `--requirement-workspace` is specified. Can be combined with `--plan` for preview or `--verify-only` for validation. It does not build graphs, run queries, install refresh hook, nor migrate or overwrite the graph. Returns `execution_summary.scope=installation`, success still indicates partial scope, not complete artifact readiness.

Explicitly `--only codegraph,graphify` retains the first generation and query; `--plan --only <graph-id>` previews graph operations; `--verify-only --only <graph-id>` verifies existing graphs and writes facts without installation or graph construction. `--requirement-workspace` is an explicit Graphify input scope that preserves the advanced graph path; simultaneously, when `--installation-only` is specified, installation of the scope takes precedence. Graphify `--refresh` retains both the existing graph refresh and backup boundaries; returns `graphify-refresh-artifact-missing` when graph.json is missing and cannot degrade to initial graph construction. Scope of installation `provider_readiness[].readiness_scope=installation` is paired with installed/configured; artifact/query/currentness is not validated within this scope and cannot be used for navigation or semantic inference.

## On-demand blocking

Registry v11 uses `readiness_policy=always-required|workflow-required|advisory`. `--only <ids>` explicitly selects with priority, `--workflow <ids>` matches only the exact ID specified in `required_for`; no inference from natural language, file existence, or purpose description. Facts item's `demand` record includes blocking, demand_source, matched_rule, reason_code, and migration_warning. Retains the previous blocking semantics when policy is missing in v10 and prompts for migration. Missing tools not blocking unrelated scopes; explicit requests for actual capabilities still block the corresponding scope.

## Subset / Repair Flow

Use `--only codegraph`, `--only graphify`, `--only codegraph,graphify`, or Graphify `--refresh` for advanced subset repair:

1. Run the plan with the same selection; execute apply only when the current user has been granted authorization for that subset mutation, and the `--only` parameter itself does not grant authorization.
2. Host conflict still requires independent `--repair-host-config` authorization; higher-precedence, unsafe path, unreadable config, and literal secret values always fail closed.
3. Subset success proves only that the selected scope is ready. By default, `spec-runtime-setup --verify-only` only verifies the installation scope; graph capabilities must be validated using the same selection with `--verify-only --only codegraph,graphify` (or the actual subset selected), and cannot be inferred from a successful installation.

## Per-Requirement Workspace Graph (Multi-Repo)

When running setup from a **non-Git requirements folder** (a multi-repository parent directory containing multiple independent cloned child Git repositories), first distinguish between two paths:

1. **Child repository provider/MCP setup** (CodeGraph/Graphify/host configuration for each child): Explicit installation or graph mode defaults to all-repos when no target parameter is specified in the parent directory; bare/check returns only diagnostics for the parent directory, `--repo <child>` narrows to a single repository, and `--all-repos` can be used to explicitly define the same batch processing scope.
2. **Parent directory double-layer graph** (per-child CodeGraph + workspace Graphify merge): `--workspace-graph --repos a,b,...` or `.spec-first/workspace.yaml` manifest.
   **Do not** write `--workspace-graph --all-repos` — `--all-repos` serves only sub-repo batch processing; it is not applicable for workspace-graph repository set validation.

### Lightweight onboarding from child repository initiation

This is a static prompt and will not automatically declare workspace membership, CodeGraph is installed, or the workspace graph has been built:

- When the issue involves only the current sub-repository, if the Provider is available, use the current sub-repository as `projectPath` with CodeGraph; the results are only navigational suggestions, and significant conclusions still need to be verified through source code, tests, diffs, or logs.
- Issue: When issues span multiple sub-repositories, return to the non-Git parent work area. Use Graphify only when both the workspace graph state and the target repository scope are confirmed; thereafter, directly examine the candidate sub-repositories.
- Do not assume the workspace graph exists or remains current; do not infer member relationships from this guidance, and do not treat any Provider output as a semantic justification.

This round does not inject independent managed markers into child `AGENTS.md` / `CLAUDE.md`, nor does it provide the corresponding clean lifecycle; the parent directory's routing block is still managed by the explicit workspace graph lifecycle.

When first connecting to Requirement Workspace, run `spec-first init --all-repos` (or individually per repository: `spec-first init --repo <child>`) to bring the child projection of the host repository to current state, then run `spec-runtime-setup --only codegraph,graphify --workspace-graph`. After projection current, the workspace graph command will establish a two-layer code graph for this workspace:

1. **Per-subrepository tactical graph**: `codegraph init` generate `engineeringN/.codegraph/codegraph.db`; `.codegraph/` write into this subrepository `.git/info/exclude` (after `git rev-parse --git-path` parsing, correctly handle `.git`-as-file/worktree, and perform realpath+containment verification) to maintain subrepository `git status` cleanliness; CodeGraph MCP server installed globally once, cross-repository queries via `projectPath`. Build, refresh-only, and status operations consider only the canonical DB that is contained, stable, not a symlink, and not empty as an artifact ready; log files, lock files, or empty DBs within the directory do not constitute evidence of completion.
2. **workspace cross-repo macro view**: Graphify `extract --code-only` per sub-repo sub-view + `merge-graphs` merged view, all out-of-tree written to `requirement_folder/graphify-out/` (physical zero intrusion of sub-repo)Single/Zero repository respectively produces single-source / not applicable. All Graphify JSON must undergo complete streaming syntax validation of any size via no-follow stable descriptor before promotion/status, without substituting artifact integrity with non-empty, bracketed, or provider-zero exit conditions. Build result atomically written to `graphify-out/workspace-graph-state.json`; `workspace-graph-state.v3` retains source snapshot, merged artifact SHA-256, repo/merge artifact promotion cleanup pending, and optionally nullable `refresh_hook`. The async mode `workspace-child-hook-contract.v2` receipt includes the canonical managed-block SHA-256, absolute Node/async/setup/CodeGraph/Graphify path, runtime host, and bundled version. status retains the primary build reason and exposes "cleanup pending" as a separate limitation; it reports ready only when the most recent build is complete, there is no cleanup pending, the repository collection and source snapshot have not changed, both hook content/execution and runtime path/version match the receipt, and the CodeGraph/Graphify artifacts, non-symlink merged graph and routing blocks all exist. Old v1/v2 state, v1 hook receipt, or states missing `refresh_hook` are not automatically migrated; after upgrade, explicit re-run of workspace build is required to atomically replace the state and managed hooks.

The MCP watcher in CodeGraph 1.6.0 is only bound to the default project of the server; sub-repos opened via `projectPath` will not individually launch their own watchers. Graphify 0.9.x native child hook only rebuilds the child's default output and cannot update the out-of-tree subgraphs or re-converge the merged graph. Thus, the workspace mode employs a spec-first approach with its own managed `post-commit` / `post-checkout` hooks: an explicit build first verifies the absolute CodeGraph and Graphify launcher via the existing Provider resolver; only when both launchers, the current host, and the bundled version are fully intact are they committed to the hook; the managed block is placed after the shell shebang and before the user's main content, avoiding issues where existing `exit` / `exec` / `set -e` directives make refreshes unreachable; malformed blocks fail closed during both install and clean operations. Do not install PATH-dependent hook when context is incomplete and downgrade to explicit. Status reconstructs the canonical block digest based on receipt, checks the content of both hooks, POSIX execution bits, and availability of recorded runtime files against the current bundled version; when drift is detected, it uniformly sets the workspace status to partial, downgrades the effective refresh mode to explicit, and retains the per-child `workspace-child-hook-*` reason code. Git event detached triggers a refresh-only setup, which must simultaneously carry an internal marker, two pinned launchers, and valid lifecycle credentials; during the lifecycle lease, run bounded `codegraph sync <repo>` on all confirmed child repositories, then execute Graphify `extract` / `merge-graphs`; no further CodeGraph global install/init, managed exclude, routing injection, or hook installation is permitted. During refresh-only period, retain the previous completed state, express the in-flight state via async/lifecycle facts, and finally atomically publish the new state to avoid concurrent Git events being discarded by the active-state gate. `graphify-out/workspace-async-refresh.lock` is responsible only for event single-flight/coalesce/release handoff; `.spec-first/workspace-graph-lifecycle.lock` exclusively manages all background builds, explicit builds, clean operations, and status writing, and async setup children can perform only token validation inherited from the wrapper. When explicitly building or cleaning fails to acquire the lock, the system must return `workspace-graph-lifecycle-busy` prior to provider, graph, routing, hook, and state mutation operations; when a process is alive but the start marker cannot be confirmed, it remains in a busy state, without prioritizing by age; upon successor release, any quarantine residue that has lost canonical ownership will be cleaned. After cleaning and deleting the state, previous hooks/workers will revalidate their enablement upon receiving a trigger and acquiring a lifecycle lease, then stop. A recoverable provider partial enables retrying the next Git event; requires owner confirmation, or fails if route write fails or runtime/hook contract drift occurs, maintaining explicit remediation. status receipt with `attempt_id`: on success, only clear the generation observed at the start. Like other provider mutations, a workspace build must be blocked prior to mutation if the current host projection of the selected child is missing or expired. The hook cannot be safely installed, or if there are no Git changes or immediate refresh is required, rerun the same `--workspace-graph --repos ...` command. Do not describe watcher, hook marker, dispatch success, or the most recent success receipt as a guarantee of workspace freshness; the consumption side shall still rely on the source snapshot/status for determination.

The repository sources are the union of the manifest from `<requirements-folder>/.spec-first/workspace.yaml` and the `--repos <a,b>` specifications; the manifest is processed first, and when duplicate repositories are declared, the manifest's alias/entry is retained, while the CLI only adds additional confirmed repositories. Automatic discovery is only for candidate consideration and requires confirmation before creation. Automatic discovery scans only direct subdirectories of the root requirement; repeated alias or nested workspace roots will return `workspace-targets-ambiguous` and prevent build/clean operations, requiring the owner to resolve the ambiguity first.

`workspace.yaml` is a strictly limited YAML subset designed for zero-dependency usage with all supported host projected runtimes; it is not a general-purpose YAML: supports top-level `schema_version`, `repos`, and `exclusions`, two-space indentation for lists, four-space indentation under `repos` for `path`/optional `alias`, plain or single/double-quoted strings, and line-end comments. Prohibit tab, flow collection (`[]`/`{}`), anchor/tag, block scalar, multi-line values, and undeclared fields; return `workspace-manifest-unparseable` or `workspace-manifest-schema-invalid` if violated, without guessing or silently ignoring. Available formats:

```yaml
schema_version: workspace-manifest.v1
repos:
  - path: api # workspace-relative
  - path: 'web client'
    alias: web
exclusions:
  - vendor
```

Related flag (within the same workspace-graph domain):

| Flag | Functionality |
| --- | --- |
| `--workspace-graph` | After child projection current, perform a one-time double-layer graph construction + write state receipt + install contained child async refresh hook + inject supported host entry route block; explicitly re-run if hook is unavailable, non-Git change, or immediate refresh is required |
| `--workspace-graph-status` | Read-only aggregation of child/workspace graph states, state/source freshness, hook digest/runtime/version/executed flags, merged artifact containment/SHA-256, default `projectPath` containment (advisory), whether the routing block has been injected; no invocation of provider binary |
| `--workspace-graph-clean` | Idempotent cleanup: Acquire lifecycle lease exclusively; return failure with zero mutations during busy periods. Upon successful lock acquisition, delete the `.codegraph/` child workspace; remove only the spec-first managed exclude/hook block; delete the current `graphify-out/` and legacy `.graphify/` directories in the requirement parent directory; strip the routing managed block; if any child/routing cleanup fails, retain both workspace graph roots for retry, and do not forcibly kill the CodeGraph daemon. Host-level equivalent entry: `spec-first clean --workspace-graph [--repos a,b] [--dry-run]` (does not touch host runtime mirror) |

Machine contract:

| operation status | mutation exit code | Meaning |
| --- | ---: | --- |
| `complete` | 0 | All requested mutations have been completed |
| `partial` / `failed` | 1 | At least one deterministic step failed; read `reason_code` and per-repo status |
| `needs-confirmation` / `skipped` | 2 | `needs-confirmation`: Automatically identified as a candidate only; generate `--repos` retry commands using the `pending_confirm[]` in JSON; `skipped`: The object is not applicable and is skipped (e.g., when running workspace-graph from the current Git repo). The two are distinguished by the JSON `status` field; determination based solely on exit code is insufficient. |

`--json` outputs the complete envelope; automated consumers must simultaneously read `status`, `reason_code`, `pending_confirm[]`, state/freshness, and per-repo fields; they cannot rely solely on the existence of the file or the process printing a success message. The explicit `--workspace-graph-status` is a read-only diagnostic; it can exit with 0 even if the object is absent or partial, with readiness expressed by the envelope.

**Boundary (per-requirement isolation)**: Each requirement folder is isolated and self-contained, without reusing graphs from other requirements; no machine-level global graph is written. The `projectPath` resolution is restricted to within the current workspace root; discovery and all Git metadata writes are symlink-contained; graph outputs are advisory candidates, and final conclusions are confirmed by the source code in the corresponding sub-repository. Deleting the requirement folder clears its graphs (with no machine-level residue).

Running `--workspace-graph*` from the current Git repo (non-parent workspace) will be skipped (this feature is intended for non-Git monorepo parent directories).

## Workflow

1. Identify the current host from the generated host-specific runtime surface invoking the unified `spec-runtime-setup` entrypoint.
2. When called from a non-Git multi-repo parent directory, bare/check only diagnoses and displays candidate child repositories; full-repo batch execution occurs only with explicit installation or graph mode. `--repo <child>` narrows to a single repository; all writes are restricted to the corresponding child target.
3. Run the Node entrypoint to load `setup-registry.v11`, validate the schema, and expand the effective host/platform registry.
4. Have `setup.cjs` diagnose or install required package-backed MCP tools based on the selected mode; the standard workflow defaults to a registry-required Provider, while `--only` is used for advanced subset repairs; host configuration can be written only via registry target and records structured execution facts.
5. Have the same Node entry verify the baseline helper and required Provider. `agent-browser` retains diagnostic/manual-command-only functionality and retrieves capability facts via the sibling `spec-test-browser` canonical wrapper; when full installation is detected but exact-origin execution is blocked, it reports a degraded state rather than reinstallation, and does not impact baseline completion. For ffmpeg, CodeGraph, and Graphify, based on current demand and readiness scope, execute query or graph construction for individual projects in bare and explicit graph modes as per the matrix above; no such actions are performed within installation scope. The Provider first-generation and project-local auto-refresh setup can only be executed via a static Provider module and a bounded argv-array process runner. If `graphify extract .` fails in the default project-root scope, the setup can first attempt a code-only `graphify update .`, and then return failed readiness. If Graphify is installed but not visible in the user's original `PATH`, report a manual visibility action, without editing the shell profile. The Graphify hook allows bounded repair only when the valid hook root is located within the project; blocked/faulty hook records retain `next_actions` and `manual-only` restrictions, and neither the hook refresh verification nor the individual marking of core Provider readiness as `degraded` is permitted.
6. Run project-local config bootstrap where the selected mode authorizes it. Bare setup reports example/local/gitignore/legacy status; missing local override noted as `defaults-active`. Explicit project-config actions may refresh the example, create the local override, and ensure ignore coverage. Do not auto-delete legacy project config or migrate legacy keys.
7. Write readiness ledger, reconcile host pointer facts, and project setup facts only when the current mode has authorized fact writes; render the grouped status block. For check/plan operations, remain read-only and exit without automatically appending verify. For single-project bare invocations, use the bare baseline for convergence mutation; for multi-repo parent directory bare invocations, perform only diagnostics (as described above in Bare invocation). The `generated_runtime_manifest.status` and `baseline_ready` must be read separately; `baseline_ready=true` cannot mask a stale generated runtime. When the state is `stale` or `missing`, only the structured runtime init next action returned by setup is reported; execution of init requires separate runtime mutation authorization, and verify itself does not refresh runtime. After authorization, execute according to topology: for the current repo/folder/parent, use the action's built-in projection `cwd`; for a single child or all-repos, use the corresponding `argv` returned by workspace verify; interactive actions do not include `-y`, and headless actions must explicitly provide the developer name and language. Do not concatenate cwd/path into a shell compound command; verify again afterwards. If the state is still stale after just running `spec-first update`, it should be considered evidence of a degraded refresh, and the same fallback action should be displayed; runtime freshness should not be reported as ready.
8. Report the status exactly enough for the user to act: ready rows need no action; action-required rows name the missing dependency/config/target step; generated runtime manifest rows name the init refresh command when stale or missing.

## Output Shape

The final setup output should contain:

- `Execution result`: separate `Required MCP/helper dependencies` and `Generated runtime manifest` rows; report `baseline_ready` as dependency readiness and `generated_runtime_manifest.status` as generated runtime freshness.
- `MCP servers`: required baseline MCP tool dependency/host/project readiness, CodeGraph host config readiness, and next action; `--only` subset must explicitly specify scope.
- `Helper tools`: helper install and readiness status.
- `Provider tools`: provider readiness status, derived `readiness_scope` / `probe_status`, and lifecycle display bits when present. Summaries must distinguish install/index readiness from server/query verification.
- `Host configured dependencies`: configured MCP/hooks/allowlist/setup/verification command facts.
- `Install safety`: helper install source, risk, review, and mirror provenance.
- `Project local config`: example config, local override, gitignore safety rule, legacy markdown config signal, and retired legacy local config status. Human labels and machine fields should be de-branded; active setup facts must use `.spec-first` local config paths and neutral legacy field names.
- `Project setup facts`: status for `tool-facts.json` and `runtime-capabilities.json`.
- `Verification profile`: current verification profile visibility placeholder; full profile execution is v1.13 scope.
- `Next steps`: Process projects requiring operations; for retrying at the repository level, specify the target child repository; after environment readiness, return to the user's original task.

### Readiness Handoff

- Render the first-task handoff only when setup, every required dependency, and the generated runtime manifest are ready. Use at most three nonblank lines in the user's language. Give a localized, copy-ready equivalent of `Please handle this task based on the current project: <describe your requirement or problem>.`
- Do not display the above initial task template for action-required, degraded, failed, or other not-ready states; require users to rerun `spec-runtime-setup` after performing the next action in the report. Do not use `spec-first doctor` or additional `--verify-only` as the second verification in a normal ready path.
- Direct source evidence fallback remains available for downstream workflows to degrade execution when evidence is sufficient, but it does not alter the current complete setup state, nor does it permit the complete setup to be reported as ready.

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
- Configure a warm package-backed MCP server according to the `setup-registry.json` file;
- write host MCP config through managed/user host targets;
- Replace conflicting managed MCP entries only through authorized `--repair-host-config`; direct invocation does not grant repair privileges, retains irrelevant host config, and continues to block high-priority or insecure targets.
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
- Synthetic project rules or write to `docs/ai/project-rules.md`;
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
