# Provider Readiness Contract

`provider-readiness.v2` describes mechanical provider readiness and setup-owned runtime tooling metadata. It is an advisory setup fact, not workflow truth and not confirmed context.

Canonical fields are defined by `docs/contracts/provider-readiness.schema.json`:

- `readiness_status`: `fresh` / `stale` / `degraded` / `not-run` / `unknown`.
- `lifecycle`: independent boolean lifecycle flags.
- `repo_aligned`, `capabilities`, `limitations`, `source_read_required`, `fallback`, `next_actions`.
- `native_interfaces`, `first_generation`, `steady_state`, `usage_note`: provider-native interface and lifecycle ownership facts used as the canonical machine surface for Runtime Setup consumers. `steady_state` may also carry hook readiness facts (`hook_installed`, `hook_verified`, `hook_status`, `hook_skipped_reason`) for provider-owned refresh setup such as Graphify hooks.

Do not write semantic trust fields such as `advisory`, `evidence_candidate`, or `confirmed_context` into this contract. Workflows may promote provider output only after direct source/test/log/contract/user evidence.

## Producer And Consumer Rules

- `readiness_status` is the only provider readiness field that enters setup decision health. Lifecycle fields are display/passthrough bits that explain where setup stopped; they do not by themselves decide workflow health.
- `lifecycle.configured` must describe durable current-host runtime artifacts, not process-local helper success. For Graphify, a Codex run is configured only when the current Codex project skill runtime exists (for example `.codex/skills/graphify/SKILL.md` or the Codex-compatible `.agents/skills/graphify/SKILL.md`), and a Claude run is configured only when `.claude/skills/graphify/SKILL.md` exists. A helper env flag may describe the current process, but must not make later `--verify-only`, `doctor`, or workflow facts look configured after those files are missing or belong to another host.
- Provider self-reported `fresh` is not trusted as deterministic freshness. Producers must map it to `unknown` unless spec-first has direct source/test/log/probe evidence.
- Provider self-reported `stale` may map to `stale`: it is conservative, keeps the existing stale warning path alive, and still requires fallback/source confirmation.
- `repo_aligned` and `limitations` explain advisory context, but they are not the decision-path substitute for stale readiness.
- Setup-side `lifecycle.fallback_used` is not the same thing as a workflow using fallback. Consumption-side fallback is recorded with `provider_untrusted` or the workflow handoff, and ordinary plan/work/review/debug must remain able to proceed from direct evidence.
- `first_generation` and `steady_state` explain ownership boundaries: Runtime Setup may install/configure/perform explicit first generation and enable bounded project-local provider refresh setup such as CodeGraph Auto-Sync via `codegraph serve --mcp` or Graphify `graphify hook install`, while provider-native tools own steady-state refresh/use. These fields do not authorize downstream workflows to run provider generation or infer confirmed evidence. When `steady_state.hook_default=true` appears on an optional provider, read it as “installed only after explicit provider-pack confirmation or `--only` selection,” not as silent baseline mutation. Hook fields are mechanical setup facts only: `hook_status=verified` means setup ran the provider's hook status probe successfully; it still does not make provider graph output confirmed source truth.
- Graphify may report `first_generation.status=completed` with `first_generation.next_action=graphify-code-only-fallback-used`. This means `graphify extract .` failed but provider-native `graphify update .` produced a usable code graph; docs/images/papers semantic extraction may still require `$graphify --update` or an API-key-backed `graphify extract` rerun.
- Provider installation detection may use provider-standard command paths such as `~/.local/bin/graphify` in addition to current `PATH`. If a command is found outside `PATH`, readiness may set `lifecycle.installed=true` and include a PATH next action; downstream manual shell examples should still prefer the visible command path or instruct the user to add that directory to `PATH`.
- `lifecycle.artifact_exists=true` is not enough to imply runtime usability. A project may have provider-native `.graphify/graph.json` while `lifecycle.configured=false` or while the CLI is not manually visible; consumers must keep using direct source evidence and surface the setup repair action instead of treating the graph artifact as a complete install. Legacy `graphify-out/graph.json` is compatibility-only refresh-needed evidence and must not be treated as the current Graphify artifact contract.
