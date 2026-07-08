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
| Inputs | Current host, repo target, `skills/spec-mcp-setup/mcp-tools.json`, helper installer facts, host config state, git/workspace target facts, and project instructions. |
| Outputs | Readiness ledger v2, provider readiness v2 facts, generated runtime manifest freshness, setup scenario fingerprint, project-local config bootstrap status, optional project setup facts under `.spec-first/config/`, and a grouped status block. |
| Artifacts | `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, `.spec-first/config.local.example.yaml`, `.spec-first/config.local.yaml` when explicitly created, `.gitignore` local-config safety rule when explicitly ensured, and `.spec-first/workspace/scenario-fingerprint-setup.json` when applicable. |
| Failure modes | Missing dependencies, host config write failure, ambiguous parent workspace target, symlink escape, invalid registry schema, helper install failure, or unsupported host. |
| Downstream consumers | `using-spec-first`, plan/work/review/debug workflows, doctor/update guidance, and humans repairing setup. |

Core boundary: scripts prepare deterministic readiness facts; LLM workflows decide how to use those facts. Setup must not make semantic code-understanding judgments or require any external analysis service before ordinary work can continue. After CodeGraph/Graphify readiness is prepared, setup may recommend `spec-rule-miner` as a next step for evidence-backed project AI coding rules; it must not invoke rule mining, synthesize rules, or write `docs/ai/project-rules.md`.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Examples As Context

When editing or reviewing this workflow prompt, or when running fresh-source eval for setup posture drift, read `skills/spec-mcp-setup/evals/examples.json` as examples-as-context. These examples are not a deterministic router, runtime-readiness gate, or substitute for LLM judgment during ordinary setup runs.

## Source Of Truth

`skills/spec-mcp-setup/mcp-tools.json` is the current source directory for the machine registry of baseline MCP servers plus explicit opt-in MCP capability entries and centralized external dependency pins. Schema version is `7`. Current required baseline tools include `sequential-thinking` and `context7`; optional MCP entries must carry `opt_in.explicit_consent_required=true` and are admitted only through explicit `--only` selection. Bare Runtime Setup diagnoses optional provider readiness and prints next actions; it is not implicit consent for provider first generation. The directory name remains `spec-mcp-setup` during the entrypoint rename to avoid a broad source/runtime path migration in the same slice.

Generated runtime mirrors under `.claude/`, `.codex/`, `.cursor/skills/`, `.cursor/spec-first/`, `.kiro/`, `.qoder/`, and `.agents/skills/` are not source. `.cursor/mcp.json` is host-local config output, not source truth. If setup prose or scripts change, update source first and use `spec-first init` only for runtime regeneration.

## Required Harness Runtime

`mcp-tools.json` owns required baseline MCP server definitions, explicit opt-in MCP capability entries, and external dependency package/version pins under `external_dependencies`. `helper-tools.json` is the single source for helper tooling readiness, baseline blocking, install safety metadata, and shell/PowerShell runner requirements. `provider-tools.json` is the source for non-MCP provider helpers installed through `install-helpers.*`; provider entries reference centralized dependency pins instead of duplicating package versions. Helper tooling outside `mcp-tools.json` is verified by `install-helpers.*` and `check-health`, then recorded under `helper_tools` and `items[]` in setup facts; baseline-blocking helpers may be installed by setup repair paths, while manual helpers such as `agent-browser` only report install commands and readiness state.

Required helper tooling outside `mcp-tools.json` is tracked in `helper-tools.json`. Required helper tooling must not be added to `mcp-tools.json`. Current helper checks include `agent-browser` and ast-grep capability detection. Use `install-helpers.* --verify-only` for read-only verification, and use the install path only when setup explicitly needs repair. `agent-browser` follows the manual-command helper boundary: setup reports a copyable command such as `npx -y skills@latest add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y`, should display `NPM_CONFIG_REGISTRY`-compatible npm install guidance, and may include `agent-browser install --with-deps` for Linux, but it does not auto-install the browser helper.

Optional provider readiness is reported through `provider_readiness[]` (`provider-readiness.v2`). Setup may populate lifecycle display bits such as `installed`, `configured`, `indexed`, `server_reachable`, and `query_verified`, plus setup-owned runtime metadata such as `native_interfaces`, `first_generation`, `steady_state`, and `usage_note`. `steady_state` may include hook readiness facts for provider-native refresh setup, such as Graphify `hook_installed`, `hook_verified`, and `hook_status`. Downstream decision health is still driven by `readiness_status`; lifecycle, first-generation, and hook fields explain boundaries and next actions, not semantic truth. The human status table may derive `readiness_scope` and `probe_status` from existing lifecycle bits to separate install/index readiness from real server/query probes; these display columns are not new machine schema fields. Provider self-reported `fresh` maps to `unknown`; provider self-reported `stale` may map to `stale` because it is conservative. `query_verified=true` is reserved for a real probe or explicit real-environment signal, not for package installation alone. A `false` or missing `server_reachable` / `query_verified` display value means the probe is not verified in this setup run unless a failure reason says otherwise; it must not be summarized as confirmed provider query availability.

## Project Preflight / Local Setup

Project-local setup has two separate surfaces:

1. Setup-owned facts: `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, and when applicable `.spec-first/workspace/scenario-fingerprint-setup.json`.
2. Local config bootstrap: `.spec-first/config.local.example.yaml`, optional `.spec-first/config.local.yaml`, and `.gitignore` coverage for `.spec-first/*.local.yaml`.

The readiness ledger and runtime capabilities include `generated_runtime_manifest.status` (`current`, `stale`, `missing`, or `unknown`) based only on `state.manifestVersion` versus the bundled manifest version; this is a deterministic freshness fact, not proof that generated prose is semantically correct. Scenario fingerprint wrapper failures are warn-and-continue: report `scenario_fingerprint_setup` status and keep the rest of setup actionable instead of blocking ordinary direct-evidence workflows.

Local config bootstrap is a first-class Runtime Setup capability, but it remains project-local and local-only. It checks and can explicitly refresh `.spec-first/config.local.example.yaml`, explicitly create `.spec-first/config.local.yaml`, and explicitly ensure `.spec-first/*.local.yaml` is ignored. It reports legacy project config signals for manual review, but it does not copy legacy files, translate old key names, or treat old defaults as spec-first truth.

## Three-Stage Setup Flow

Runtime Setup should keep the user-facing flow split into three stages even when the internal scripts perform multiple checks:

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
- host config actions: write MCP/runtime config only through host-specific setup scripts and explicit host authority;
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

Document rendering keys (`plan_output`, `brainstorm_output`, `ideate_output`) are reserved future hints unless an implemented consumer and focused tests exist. Setup only exposes local config keys and keeps them protected; it must not auto-delegate, skip scoping confirmation, or change host model/runtime behavior merely because a key exists. Missing local config is not a blocker; defaults remain advisory and must not be reported as repo truth.

If setup later reports project convention facts, they must be deterministic existence facts only, such as whether `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, or a project guidance index exists. Setup must not judge whether terminology is correct, an ADR applies, a proposed issue/PR should be accepted or rejected, an out-of-scope concept matches, or implementation satisfies a request.

## Host Authority And Write Safety

The current public entrypoint is `spec-mcp-setup`; the host runtime surface that invoked it is authoritative host evidence. Generated host-specific runtime surfaces must pin `MCP_SETUP_HOST=<host>` before invoking setup mutation scripts. `install-mcp.*`, `configure-host.*`, and `uninstall-mcp.*` fail closed without an explicit canonical `MCP_SETUP_HOST=claude|codex|kiro|qoder|cursor`; they must not infer mutation targets from `PATH`, generated runtime directories, old `.spec-first/config/*` facts, or host config files from another platform. Read-only detection/report paths may surface advisory host candidates, but those candidates are not write authority.

Before any host config write or setup-owned facts refresh, the workflow must anchor the write target to a fresh `detect-host.*` JSON result driven by an explicit entrypoint host pin. Previous setup facts are drift comparison evidence only: if they disagree with the current entrypoint host, report a host-marker drift and refresh setup-owned facts for the current host instead of treating the previous host as current. Never manually choose `.kiro/settings/mcp.json`, `.qoder/settings.local.json`, `.cursor/mcp.json`, Codex TOML, or Claude managed/user config from prose alone.

Do not use host file-edit tools such as Write, Update, or Edit to modify `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, or host MCP config files. Setup-owned facts must be written only by `verify-tools.*` / `write-setup-facts.*`; host MCP config must be written only by `configure-host.*` / `install-mcp.*` after host detection.

## Workflow Modes

- `--check`: inspect current dependency/runtime status only; do not write setup facts, host config, or install tools.
- `--verify-only` / `--refresh-facts`: verify readiness and refresh setup-owned facts; do not install tools or edit host config.
- `--plan`: render install/config operations and safety results; do not write setup facts, host config, or install tools.
- `--project-config`: project-local config bootstrap only. Refresh the example when requested, create the local override only after explicit action, ensure `.spec-first/*.local.yaml` ignore coverage when requested, and report legacy project config signals without migrating them. This mode does not install MCP servers, configure host runtime, or run helper/provider first generation. If the current host has no public flag wired yet, run `bootstrap-project-config.*` through the documented setup path rather than asking users to edit files by hand.
- Bare invocation (`spec-mcp-setup` in the current host): default diagnose path. Resolve the target, run the lightweight health/readiness checks, surface required MCP/helper readiness, generated runtime freshness, project-local config status, optional provider readiness, and exact next actions. Do not run CodeGraph/Graphify first-generation, sync/reindex, graph extract/update, hook install, or provider project-skill install from the bare path. Do not ask the user to run internal scripts directly; point to public follow-up commands such as `spec-mcp-setup --project-config`, `spec-mcp-setup --verify-only`, or `spec-mcp-setup --only graphify`.
- `--only <ids>`: headless/subset apply path. `--only codegraph`, `--only graphify`, or `--only codegraph,graphify` narrows provider selection and also does not require a confirmation prompt.
- `--refresh`: Graphify explicit incremental refresh path. Use with `--only graphify` when `.graphify/` already exists, or when a legacy `graphify-out/` artifact should be regenerated into provider-native `.graphify/`, and the user wants setup to run provider-native `graphify update .` (code-only, no LLM) instead of only verifying/installing provider readiness. This is not full semantic extraction; missing artifacts still use first-generation `graphify extract .` with `graphify update .` fallback.
- `--requirement-workspace <repo-relative-path>`: optional Graphify input-scope override. Omit it for normal project-workspace setup; default input scope is the resolved project workspace.
- `--user-scope`: Kiro/Qoder/Cursor opt-in for writing user-level MCP config. Without this flag, `KIRO_USER_SCOPE=1`, `QODER_USER_SCOPE=1`, or `CURSOR_USER_SCOPE=1`, script-level setup writes only workspace `.kiro/settings/mcp.json` for Kiro, local `.qoder/settings.local.json` for Qoder, or project `.cursor/mcp.json` for Cursor, including when invoked indirectly from a generated host skill/command.

Graphify setup uses the controlled helper/provider route. Public setup does not ask users to set provider consent environment variables; `--only graphify` is the public opt-in, and the orchestration internally applies helper consent. Direct env consent remains only an advanced/CI escape hatch for invoking `install-helpers.*` directly. Missing `--requirement-workspace` defaults to the resolved project workspace and writes provider artifacts under provider-native project-root `.graphify/`; absolute, escaping, symlink-escaping, or nonexistent explicit overrides skip first generation with a structured next action. When selected, setup installs the pinned Graphify dependency declared in `mcp-tools.json`, resolves the `graphify` CLI from the user's original `PATH` or the provider-standard `$HOME/.local/bin/graphify` path, and uses that resolved command for current-host project skill install such as `graphify install --project --platform codex`, scriptable first-generation `graphify extract .`, code-only/incremental fallback `graphify update .`, a single bounded `graphify update . --force` repair only after Graphify emits `Refusing to overwrite` plus a force hint, query probe, and hook install/status. After npm install or upgrade, if `graphify` on the original PATH is a stale symlink and setup can resolve a pinned executable from the provider-standard/npm global bin candidates, setup backs up the stale symlink and repoints it to the pinned executable; ordinary files, non-writable paths, and ambiguous cases stay report-only. If project-root `.graphify/graph.json` or `GRAPH_REPORT.md` already exists and `--refresh` was not supplied, explicit Graphify setup treats that as a steady-state install check: verify or install the current-host Graphify project skill/instruction section, probe query usability, verify or install hook refresh, report `graphify-refresh-recommended`, and skip graph regeneration. Legacy `graphify-out/graph.json` or `graphify-out/GRAPH_REPORT.md` is compatibility-only refresh-needed evidence; it must not be treated as the current `.graphify/` artifact contract. `--refresh` is the explicit incremental graph refresh path; for the default project-root scope it runs provider-native `graphify update .` (re-extracts code files without LLM semantic extraction), with the same bounded `--force` repair only after provider overwrite refusal. After provider project install writes `AGENTS.md` or `CLAUDE.md`, setup normalizes only the provider-owned `## graphify` instruction section to the resolved CLI/manual-visibility/direct-source-fallback wording; it does not vendor or rewrite the Graphify skill itself. When the selected repository is spec-first's own source repository, setup skips this instruction-section normalization so provider setup cannot rewrite source-owned host entry docs. If `.graphify/graph.json` or `.graphify/GRAPH_REPORT.md` exists after either explicit path, setup targets project-level `graphify hook install` so provider-native refresh keeps the code graph usable after setup; when the provider-owned hook would otherwise fail because git hook environments cannot see the resolved Graphify CLI directory, setup may add a marked project-local PATH repair block to Graphify-installed hook files before verifying hook status. It does not edit shell profiles, overwrite non-symlink command files, start `graphify watch`, run full semantic extraction for ordinary repeat setup, or install the optional Graphify MCP server. `$graphify .` / `/graphify .` is the provider assistant UX after setup; setup-internal first generation uses CLI extraction/update because the current session may not dynamically load the newly installed skill.

CodeGraph setup uses the controlled MCP/provider route. When selected, setup installs the pinned CodeGraph dependency declared in `mcp-tools.json`, configures host MCP with `codegraph serve --mcp`, runs `codegraph init`, and probes `codegraph status`. If status reports `Pending Changes` or asks for `codegraph index -f`, setup runs one bounded `codegraph sync` and re-runs `codegraph status`; any remaining pending changes or sync failure is action-required with diagnostics. If the post-sync status still asks for `codegraph index -f`, setup runs one bounded full reindex and rechecks status. Full reindex failure preserves the existing `.codegraph/` artifact and reports degraded/actionable readiness instead of erasing the index. These one-time sync/reindex branches are install-init repair, not spec-first steady-state ownership.

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

1. Resolve the project target and render the provider plan with `setup-plan-renderer.cjs --mode guided-apply --repo-root <resolved-project-root> --only <selected-providers>`.
2. Present a compact install-init preview block naming the selected provider writes, host-owned writes, provider artifacts, `.gitignore` policy, and explicit non-actions.
3. If the plan reports an unknown provider selection or unresolved target, stop with the blocked reason and next action instead of installing.
4. Otherwise, run the internal apply path with the same explicit `--only` selection plus any `--repo`/`--folder`/`--requirement-workspace` args already supplied, then run verification/fact refresh and render the final grouped status block. If CodeGraph/Graphify readiness is ready or degraded-but-usable and no setup blocker remains, the final next step should suggest running `spec-rule-miner` separately to mine project rules from source evidence.

## Workflow

1. Identify the current host from the generated host-specific runtime surface invoking the unified `spec-mcp-setup` entrypoint. The target renamed entrypoint is `spec-runtime-setup` once the alias contract lands.
2. If invoked from a parent workspace, select an explicit child repo or intentionally run setup for all supported child repos. Writes must stay within the selected target.
3. Read `mcp-tools.json`, validate schema version, and verify every required baseline tool plus explicit opt-in MCP entry has deterministic install, host-config, detection, and summary metadata.
4. Run `detect-tools.*` or `install-mcp.*` as appropriate. Warm required package-backed MCP tools by default, admit optional MCP entries only through explicit `--only` selection, write host config only through documented host targets, and record structured status.
5. Run `install-helpers.*` for baseline helper verification/repair and explicitly approved non-MCP provider helpers. `agent-browser` remains diagnostic/manual-command only: collect readiness facts and install guidance, but do not auto-install the CLI, browser runtime, or global skill. `--only graphify` is enough public consent for Graphify; the script layer may translate that to helper env consent internally. Approved provider first generation and project-local auto-refresh setup may run only through controlled script cases or provider-native bounded CLI commands invoked through the resolved CLI path, then helper/provider readiness facts are collected. If `graphify extract .` fails in the default project-root scope, the script should try code-only `graphify update .` before returning failed readiness. If Graphify is installed but not visible on the user's original `PATH`, report the manual visibility action instead of editing shell profiles; for provider-owned git hooks, setup may repair only the project-local Graphify hook PATH block so hook verification can succeed without global profile edits. If Graphify hook install still fails after bounded repair, report `readiness_status=degraded` with `next_actions` instead of marking hook refresh verified.
6. Run project-local config bootstrap where the selected mode authorizes it. Bare setup should at least report current example/local/gitignore/legacy status; explicit project-config actions may refresh the example, create the local override, and ensure ignore coverage. Do not auto-delete legacy project config or migrate legacy keys.
7. Run `verify-tools.*` to write the readiness ledger, reconcile host pointer facts, write project setup facts, and render the grouped status block. Read `generated_runtime_manifest.status` separately from `baseline_ready`; `baseline_ready=true` must not hide stale generated runtime. If the status is `stale` or `missing`, refresh runtime with the topology-appropriate command (`spec-first init -y` for the current repo or parent workspace runtime, `spec-first init --repo <child> -y` for one child repo, or explicit `spec-first init --all-repos -y` only for intentional batch child-root refresh), then rerun verification. If `spec-first update` just ran and the status is still stale, treat that as degraded refresh evidence and surface the same fallback command instead of reporting runtime freshness as ready.
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
- warm package-backed MCP servers when configured by `mcp-tools.json`;
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
bash skills/spec-mcp-setup/scripts/check-health
bash -n skills/spec-mcp-setup/scripts/*.sh
npm run test:mcp-setup
node --check src/cli/commands/internal.js src/cli/helpers/scenario-fingerprint.js
```

For cross-host changes, also run `npm run typecheck`, `npm run test:unit`, `npm run test:smoke`, and `spec-first init` after source validation.
