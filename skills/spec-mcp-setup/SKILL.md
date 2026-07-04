---
name: spec-mcp-setup
description: Install, configure, verify, and refresh required harness runtime readiness facts for spec-first workflows on Claude Code, Codex, Kiro, Qoder, or Cursor.
argument-hint: "[bare auto setup] [--check|--verify-only|--plan] [--only codegraph,graphify] [--refresh] [--repo <path>] [--requirement-workspace <repo-relative-path>]"
---

# Runtime Setup

`spec-mcp-setup` is the current runnable entrypoint for the Runtime Setup workflow. The target user-facing name is `spec-runtime-setup` (`/spec:runtime-setup` on Claude Code, `$spec-runtime-setup` on Codex, a generated Kiro Agent Skill entry once Kiro aliases are verified, a Qoder project command/Skill once Qoder aliases are verified, and a generated Cursor Agent Skill while Cursor remains generated-runtime preview); `/spec:mcp-setup`, `$spec-mcp-setup`, Kiro generated Agent Skill `spec-mcp-setup`, Qoder generated `/spec:mcp-setup` command / Skill `spec-mcp-setup`, and Cursor generated Agent Skill `spec-mcp-setup` remain compatibility names until the host alias contract is implemented. Runtime Setup prepares deterministic host/runtime facts for spec-first workflows. It installs or verifies required MCP servers and helper tooling, writes setup-owned project facts, and reports concrete next actions. It does not provide code-understanding authority; downstream workflows use bounded direct source reads, `rg`, ast-grep, git diff, tests/logs, and user-provided evidence.

## Contract Summary

| Field | Contract |
| --- | --- |
| When to use | Host runtime setup, MCP setup, helper-tool readiness, missing runtime assets, or project-local setup fact refresh. |
| When not to use | Ordinary planning, implementation, review, debugging, or code impact questions that can proceed from direct source evidence. |
| Inputs | Current host, repo target, `skills/spec-mcp-setup/mcp-tools.json`, helper installer facts, host config state, git/workspace target facts, and project instructions. |
| Outputs | Readiness ledger v2, provider readiness v2 facts, generated runtime manifest freshness, setup scenario fingerprint, optional project setup facts under `.spec-first/config/`, and a grouped status block. |
| Artifacts | `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, and `.spec-first/workspace/scenario-fingerprint-setup.json` when applicable. |
| Failure modes | Missing dependencies, host config write failure, ambiguous parent workspace target, symlink escape, invalid registry schema, helper install failure, or unsupported host. |
| Downstream consumers | `using-spec-first`, plan/work/review/debug workflows, doctor/update guidance, and humans repairing setup. |

Core boundary: scripts prepare deterministic readiness facts; LLM workflows decide how to use those facts. Setup must not make semantic code-understanding judgments or require any external analysis service before ordinary work can continue.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Examples As Context

When editing or reviewing this workflow prompt, or when running fresh-source eval for setup posture drift, read `skills/spec-mcp-setup/evals/examples.json` as examples-as-context. These examples are not a deterministic router, runtime-readiness gate, or substitute for LLM judgment during ordinary setup runs.

## Source Of Truth

`skills/spec-mcp-setup/mcp-tools.json` is the current source directory for the machine registry of baseline MCP servers plus explicit opt-in MCP capability entries and centralized external dependency pins. Schema version is `7`. Current required baseline tools include `sequential-thinking` and `context7`; optional MCP entries must carry `opt_in.explicit_consent_required=true` and are admitted only through the bare Runtime Setup default provider pack or explicit `--only` selection. The directory name remains `spec-mcp-setup` during the entrypoint rename to avoid a broad source/runtime path migration in the same slice.

Generated runtime mirrors under `.claude/`, `.codex/`, `.cursor/skills/`, `.cursor/spec-first/`, `.kiro/`, `.qoder/`, and `.agents/skills/` are not source. `.cursor/mcp.json` is host-local config output, not source truth. If setup prose or scripts change, update source first and use `spec-first init` only for runtime regeneration.

## Required Harness Runtime

`mcp-tools.json` owns required baseline MCP server definitions, explicit opt-in MCP capability entries, and external dependency package/version pins under `external_dependencies`. `helper-tools.json` is the single source for helper tooling readiness, baseline blocking, install safety metadata, and shell/PowerShell runner requirements. `provider-tools.json` is the source for non-MCP provider helpers installed through `install-helpers.*`; provider entries reference centralized dependency pins instead of duplicating package versions. Required helper tooling outside `mcp-tools.json` is installed and verified by `install-helpers.*` and `check-health`, then recorded under `helper_tools` and `items[]` in setup facts.

Required helper tooling must not be added to `mcp-tools.json`. Current helper checks include `agent-browser` and ast-grep capability detection. Use `install-helpers.* --verify-only` for read-only verification, and use the install path only when setup explicitly needs repair. The agent-browser repair path may run `npx -y skills@latest add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y`, should respect `NPM_CONFIG_REGISTRY`, and may run `agent-browser install --with-deps` when browser automation support is required.

Optional provider readiness is reported through `provider_readiness[]` (`provider-readiness.v2`). Setup may populate lifecycle display bits such as `installed`, `configured`, `indexed`, `server_reachable`, and `query_verified`, plus setup-owned runtime metadata such as `native_interfaces`, `first_generation`, `steady_state`, and `usage_note`. `steady_state` may include hook readiness facts for provider-native refresh setup, such as Graphify `hook_installed`, `hook_verified`, and `hook_status`. Downstream decision health is still driven by `readiness_status`; lifecycle, first-generation, and hook fields explain boundaries and next actions, not semantic truth. Provider self-reported `fresh` maps to `unknown`; provider self-reported `stale` may map to `stale` because it is conservative. `query_verified=true` is reserved for a real probe or explicit real-environment signal, not for package installation alone.

## Project Preflight / Local Setup

Project-local setup writes `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, and when applicable `.spec-first/workspace/scenario-fingerprint-setup.json`. The readiness ledger and runtime capabilities include `generated_runtime_manifest.status` (`current`, `stale`, `missing`, or `unknown`) based only on `state.manifestVersion` versus the bundled manifest version; this is a deterministic freshness fact, not proof that generated prose is semantically correct. Scenario fingerprint wrapper failures are warn-and-continue: report `scenario_fingerprint_setup` status and keep the rest of setup actionable instead of blocking ordinary direct-evidence workflows.

## Setup Posture And Project Conventions

Runtime Setup follows an `Explore -> Present -> Decide -> Write` posture:

1. **Explore** host, target repo, generated runtime manifest, existing setup facts, `.spec-first/config.local.yaml`, verification profile visibility, provider artifacts, and project instructions.
2. **Present** discovered facts, missing dependencies, local-only overrides, provider first-generation/refresh actions, generated runtime freshness, and explicit non-actions before applying setup changes.
3. **Decide** only where the runtime setup workflow has authority: install/verify helper tools, configure host MCP/runtime wiring, refresh setup-owned facts, or choose a documented degraded path. Team workflow conventions and semantic project decisions remain LLM/owner judgment in downstream workflows.
4. **Write** only setup-owned facts, supported local config examples, host runtime config through documented targets, and generated runtime refreshes through `spec-first init`. Do not write team-shared tracker policy, label vocabulary, external PR request-surface policy, issue acceptance decisions, or durable rejected-scope decisions from setup.

`.spec-first/config.local.yaml` is a local-only override file, not team-shared source of truth. The current supported consumer key is `verification_profile_path`, read by the verification profile loader as a local execution preference. Document output/provider keys in the template are reserved future hints unless an implemented consumer and focused tests exist. Missing local config is not a blocker; defaults remain advisory and must not be reported as repo truth.

If setup later reports project convention facts, they must be deterministic existence facts only, such as whether `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, or a team standards index exists. Setup must not judge whether terminology is correct, an ADR applies, a proposed issue/PR should be accepted or rejected, an out-of-scope concept matches, or implementation satisfies a request.

## Host Authority And Write Safety

The current public entrypoint is authoritative host evidence: `/spec:mcp-setup` or `/spec:runtime-setup` means Claude Code, `$spec-mcp-setup` or `$spec-runtime-setup` means Codex, the generated Kiro Agent Skill means Kiro, the generated Qoder project command or Skill means Qoder, and the generated Cursor Agent Skill means Cursor. Generated host-specific runtime surfaces must pin `MCP_SETUP_HOST=<host>` before invoking setup mutation scripts. `install-mcp.*`, `configure-host.*`, and `uninstall-mcp.*` fail closed without an explicit canonical `MCP_SETUP_HOST=claude|codex|kiro|qoder|cursor`; they must not infer mutation targets from `PATH`, generated runtime directories, old `.spec-first/config/*` facts, or host config files from another platform. Read-only detection/report paths may surface advisory host candidates, but those candidates are not write authority.

Before any host config write or setup-owned facts refresh, the workflow must anchor the write target to a fresh `detect-host.*` JSON result driven by an explicit entrypoint host pin. Previous setup facts are drift comparison evidence only: if they disagree with the current entrypoint host, report a host-marker drift and refresh setup-owned facts for the current host instead of treating the previous host as current. Never manually choose `.kiro/settings/mcp.json`, `.qoder/settings.local.json`, `.cursor/mcp.json`, Codex TOML, or Claude managed/user config from prose alone.

Do not use host file-edit tools such as Write, Update, or Edit to modify `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, or host MCP config files. Setup-owned facts must be written only by `verify-tools.*` / `write-setup-facts.*`; host MCP config must be written only by `configure-host.*` / `install-mcp.*` after host detection.

## Workflow Modes

- `--check`: inspect current dependency/runtime status only; do not write setup facts, host config, or install tools.
- `--verify-only` / `--refresh-facts`: verify readiness and refresh setup-owned facts; do not install tools or edit host config.
- `--plan`: render install/config operations and safety results; do not write setup facts, host config, or install tools.
- Bare invocation (`/spec:mcp-setup` on Claude, `$spec-mcp-setup` on Codex, the Kiro `spec-mcp-setup` Agent Skill, or the Qoder `/spec:mcp-setup` project command / Skill): primary automatic setup path. Show the current CodeGraph/Graphify provider pack, project/provider runtime writes, host config writes, first-generation commands, refresh hooks, and explicit non-actions, then run install-init and verification to completion without an extra confirmation prompt. Treat the bare workflow invocation as explicit opt-in for the default provider pack. Do not ask the user to run internal scripts directly.
- `--only <ids>`: headless/subset apply path. `--only codegraph`, `--only graphify`, or `--only codegraph,graphify` narrows provider selection and also does not require a confirmation prompt.
- `--refresh`: Graphify explicit incremental refresh path. Use with `--only graphify` when `graphify-out/` already exists and the user wants setup to run provider-native `graphify update .` (code-only, no LLM) instead of only verifying/installing provider readiness. This is not full semantic extraction; missing artifacts still use first-generation `graphify extract .`.
- `--requirement-workspace <repo-relative-path>`: optional Graphify input-scope override. Omit it for normal project-workspace setup; default input scope is the resolved project workspace.
- `--user-scope`: Kiro/Qoder/Cursor opt-in for writing user-level MCP config. Without this flag, `KIRO_USER_SCOPE=1`, `QODER_USER_SCOPE=1`, or `CURSOR_USER_SCOPE=1`, script-level setup writes only workspace `.kiro/settings/mcp.json` for Kiro, local `.qoder/settings.local.json` for Qoder, or project `.cursor/mcp.json` for Cursor, including when invoked indirectly from a generated host skill/command.

Graphify setup uses the controlled helper/provider route. Public setup does not ask users to set provider consent environment variables; bare setup or `--only graphify` is the public opt-in, and the orchestration internally applies helper consent. Direct env consent remains only an advanced/CI escape hatch for invoking `install-helpers.*` directly. Missing `--requirement-workspace` defaults to the resolved project workspace and writes provider artifacts under project-root `graphify-out/`; absolute, escaping, symlink-escaping, or nonexistent explicit overrides skip first generation with a structured next action. When selected, setup installs the pinned Graphify dependency declared in `mcp-tools.json`, resolves the `graphify` CLI from the user's original `PATH` or the provider-standard `$HOME/.local/bin/graphify` path, and uses that resolved command for current-host project skill install such as `graphify install --project --platform codex`, scriptable first-generation `graphify extract .`, code-only/incremental fallback `graphify update .`, a single bounded `graphify update . --force` repair only after Graphify emits `Refusing to overwrite` plus a force hint, query probe, and hook install/status. If project-root `graphify-out/graph.json` or `GRAPH_REPORT.md` already exists and `--refresh` was not supplied, setup treats that as a steady-state install check: verify or install the current-host Graphify project skill/instruction section, probe query usability, verify or install hook refresh, report `graphify-refresh-recommended`, and skip graph regeneration. `--refresh` is the explicit incremental graph refresh path; for the default project-root scope it runs provider-native `graphify update .` (re-extracts code files without LLM semantic extraction), with the same bounded `--force` repair only after provider overwrite refusal. After provider project install writes `AGENTS.md` or `CLAUDE.md`, setup normalizes only the provider-owned `## graphify` instruction section to the resolved CLI/manual-visibility/direct-source-fallback wording; it does not vendor or rewrite the Graphify skill itself. If the CLI is only available from a provider-standard path, setup may still complete with that absolute command while readiness reports the manual PATH visibility gap. If `graphify-out/graph.json` or `GRAPH_REPORT.md` exists after either path, setup targets project-level `graphify hook install` so provider-native refresh keeps the code graph usable after setup; when the provider-owned hook would otherwise fail because git hook environments cannot see the resolved Graphify CLI directory, setup may add a marked project-local PATH repair block to Graphify-installed hook files before verifying hook status. It does not edit shell profiles, create global symlinks, start `graphify watch`, run full semantic extraction for ordinary repeat setup, or install the optional Graphify MCP server. `$graphify .` / `/graphify .` is the provider assistant UX after setup; setup-internal first generation uses CLI extraction/update because the current session may not dynamically load the newly installed skill.

CodeGraph setup uses the controlled MCP/provider route. When selected, setup installs the pinned CodeGraph dependency declared in `mcp-tools.json`, configures host MCP with `codegraph serve --mcp`, runs `codegraph init`, and probes `codegraph status`. If status reports `Pending Changes` or asks for `codegraph index -f`, setup runs one bounded `codegraph sync` and re-runs `codegraph status`; any remaining pending changes or sync failure is action-required with diagnostics. If the post-sync status still asks for `codegraph index -f`, setup runs one bounded full reindex and rechecks status. Full reindex failure preserves the existing `.codegraph/` artifact and reports degraded/actionable readiness instead of erasing the index. These one-time sync/reindex branches are install-init repair, not spec-first steady-state ownership.

## Bare Setup Flow

For bare `$spec-mcp-setup`, do this inside the skill:

1. Resolve the project target and render the provider plan with `setup-plan-renderer.cjs --mode guided-apply --repo-root <resolved-project-root>`.
2. Present a compact install-init preview block naming:
   - selected optional providers: `codegraph`, `graphify`;
   - CodeGraph install/init: pinned dependency install from `mcp-tools.json`, `codegraph init`, `codegraph status`, one bounded `codegraph sync` if status reports `Pending Changes` or `codegraph index -f`, one bounded `codegraph index -f` only if the full-rebuild advisory remains after sync, `.codegraph/codegraph.db`, and host MCP command `codegraph serve --mcp`;
   - Graphify install/init: pinned dependency install from `mcp-tools.json` or supported fallback, resolved Graphify CLI command visibility (`PATH` or provider-standard `$HOME/.local/bin/graphify`), `graphify install --project --platform <current-host>` when the current-host project skill is missing, existing `graphify-out/` steady-state install checks, `graphify extract .` for first generation, explicit `--refresh` using incremental/code-only `graphify update .` for existing project-root graphs, one bounded `graphify update . --force` only after provider overwrite refusal, project-root `graphify-out/`, and `graphify hook install/status`;
   - provider/project writes: `.codegraph/`, `graphify-out/`, `.git/hooks/`, `.codex/skills/graphify/`, `.kiro/skills/graphify/`, `.qoder/skills/graphify/`, `.codex/hooks.json`, `AGENTS.md`, `.claude/skills/graphify/`, `CLAUDE.md`, and `.graphify_version` when the selected host/provider writes them;
  - host-owned writes: Claude/Codex/Kiro/Qoder/Cursor MCP config for CodeGraph when selected; Kiro user-level config requires explicit `--user-scope`/`KIRO_USER_SCOPE=1`, otherwise workspace `.kiro/settings/mcp.json` is the only Kiro write target; Qoder user-level config requires explicit `--user-scope`/`QODER_USER_SCOPE=1`, otherwise `.qoder/settings.local.json` is the only Qoder write target; Cursor user-level config requires explicit `--user-scope`/`CURSOR_USER_SCOPE=1`, otherwise `.cursor/mcp.json` is the only Cursor write target;
   - `.gitignore` policy: `spec-first init`'s managed block ignores `.codegraph/` and the whole `graphify-out/` provider artifact directory; setup does not auto-add, auto-commit, or promote Graphify output to source truth;
   - non-actions: no `graphify watch`/long-running daemon, no optional Graphify MCP server install, no generated artifact promotion to `docs/` or source truth.
3. If the plan reports an unknown provider selection or unresolved target, stop with the blocked reason and next action instead of installing.
4. Otherwise, run the internal apply path with `--only codegraph,graphify` plus any `--repo`/`--folder`/`--requirement-workspace` args already supplied, then run verification/fact refresh and render the final grouped status block.

## Workflow

1. Identify the current host: current runnable entrypoints are `/spec:mcp-setup` on Claude Code, `$spec-mcp-setup` on Codex, the `spec-mcp-setup` Kiro Agent Skill, Qoder project command `/spec:mcp-setup` / Skill `spec-mcp-setup`, and Cursor Agent Skill `spec-mcp-setup`. The target renamed entrypoints are `/spec:runtime-setup`, `$spec-runtime-setup`, and the Kiro/Qoder/Cursor runtime-setup aliases once the alias contract lands.
2. If invoked from a parent workspace, select an explicit child repo or intentionally run setup for all supported child repos. Writes must stay within the selected target.
3. Read `mcp-tools.json`, validate schema version, and verify every required baseline tool plus explicit opt-in MCP entry has deterministic install, host-config, detection, and summary metadata.
4. Run `detect-tools.*` or `install-mcp.*` as appropriate. Warm required package-backed MCP tools, admit optional MCP entries only through the documented default provider pack or explicit `--only` selection, write host config only through documented host targets, and record structured status.
5. Run `install-helpers.*` for required helper tooling and explicitly approved non-MCP provider helpers. Bare setup or `--only graphify` is enough public consent for Graphify; the script layer may translate that to helper env consent internally. Approved provider first generation and project-local auto-refresh setup may run only through controlled script cases or provider-native bounded CLI commands invoked through the resolved CLI path, then helper/provider readiness facts are collected. If `graphify extract .` fails in the default project-root scope, the script should try code-only `graphify update .` before returning failed readiness. If Graphify is installed but not visible on the user's original `PATH`, report the manual visibility action instead of editing shell profiles; for provider-owned git hooks, setup may repair only the project-local Graphify hook PATH block so hook verification can succeed without global profile edits. If Graphify hook install still fails after bounded repair, report `readiness_status=degraded` with `next_actions` instead of marking hook refresh verified.
6. Run `verify-tools.*` to write the readiness ledger, reconcile host pointer facts, write project setup facts, and render the grouped status block. Read `generated_runtime_manifest.status` separately from `baseline_ready`; `baseline_ready=true` must not hide stale generated runtime. If the status is `stale` or `missing`, refresh runtime with the topology-appropriate command (`spec-first init -y` for the current repo, `spec-first init --all-repos -y` from a parent workspace, or `spec-first init --repo <child> -y` for one child repo), then rerun verification. If `spec-first update` just ran and the status is still stale, treat that as degraded refresh evidence and surface the same fallback command instead of reporting runtime freshness as ready.
7. Report the status exactly enough for the user to act: ready rows need no action; action-required rows name the missing dependency/config/target step; generated runtime manifest rows name the init refresh command when stale or missing.

## Output Shape

The final setup output should contain:

- `Execution result`: separate `Required MCP/helper dependencies` and `Generated runtime manifest` rows; report `baseline_ready` as dependency readiness and `generated_runtime_manifest.status` as generated runtime freshness.
- `MCP servers`: required baseline MCP tool dependency/host/project readiness, explicit opt-in MCP entries when selected or detected, and next action.
- `Helper tools`: helper install and readiness status.
- `Provider tools`: provider readiness status and lifecycle display bits when present.
- `Host configured dependencies`: configured MCP/hooks/allowlist/setup/verification command facts.
- `Install safety`: helper install source, risk, review, and mirror provenance.
- `Project setup facts`: status for `tool-facts.json` and `runtime-capabilities.json`.
- `Verification profile`: current verification profile visibility placeholder; full profile execution is v1.13 scope.
- `Next steps`: either fix action-required rows, choose an explicit child repo, or continue to the user-intent workflow.

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
- treat `.spec-first/config.local.yaml` as team-shared workflow policy;
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
