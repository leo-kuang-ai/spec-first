# Conditional Routing Boundaries

Read this file only when the selected route touches runtime maintenance, existing scenario fingerprints, worker dispatch, the Codex startup reminder, handoff/context reset, knowledge promotion, ordinary-context exclusions, or any write, test, autofix, or commit in a parent multi-repo workspace. Apply only the matching section.

## Runtime Maintenance

- Source of truth lives in `skills/`, `templates/`, `src/cli/`, `docs/`, and other checked-in source surfaces. Managed assets under `.claude/`, `.codex/`, `.agents/skills/`, `.cursor/`, `.kiro/`, and `.qoder/` are generated runtime, not source fixes.
- Use `spec-runtime-setup` for MCP/helper/host readiness. Use `spec-first doctor --<host>` to inspect installation health and `spec-first update` to upgrade spec-first or refresh installed guidance.
- Use `spec-first init` only for an explicit initialization/regeneration request or confirmed runtime drift. Use `spec-first clean --<host>` only for explicit managed-runtime removal.
- Preview state-changing maintenance when supported. A routing match alone never authorizes `init`, `clean`, `update`, or deletion.
- The `skills/using-spec-first/` source skill package is the routing-policy source of truth. Managed instruction blocks and host runtime copies are entry anchors or generated projections.

## Scenario Fingerprints

- Existing scenario fingerprints are advisory context, not gates, approvals, or source-scope authority. Never generate one merely to choose a route.
- For foreign residuals, recommend preview-first inspection. When first-time setup facts are missing and the user asks about readiness, route to `spec-runtime-setup`.
- Dirty-source or git-alignment facts disclose blind spots; confirm important conclusions from current source, tests, logs, or owner evidence.

## Worker Dispatch

- Routing to a workflow authorizes only that workflow. Dispatch requires the user or a visible upstream handoff to explicitly request delegated workers, personas, or parallel work. Permission settings, tool visibility, schema presence, workflow mode, and invocation do not grant dispatch authorization.
- Resolve authorization before capability. When authorization is missing, do not inspect a worker discovery surface: set `capability_probe=not_applicable`, `worker_dispatch_capability=unknown`, use the workflow's inline/serial fallback, and record `dispatch_authorization_missing`.
- When authorization exists, inspect only the active current-session tool registry/schema as bounded `provider_untrusted` quoted evidence. The schema may prove availability-to-attempt and invocation shape; it does not prove permission, capacity, isolation, model behavior, successful execution, or absence of mutation.
- Apply the semantic contract in `docs/contracts/workflows/worker-dispatch-capability.md`. Unknown or unavailable facts fail closed for dependent claims; `supportsAgents` and other static projection facts are not session capability.

## Codex Startup Reminder

- A top-level Codex orchestrator may best-effort run `spec-first startup-reminder --codex` before entering a public workflow. Failure, empty output, or malformed local state must not block routing. Bounded subagents, leaf reviewers, and workers do not run it.

## Parent Multi-Repo Scope

- Bounded read-only orientation may inspect likely child repos and state the target assumption.
- Any write, test, autofix, or commit requires an explicit `target_repo` or per-child scope before mutation.

## Handoff And Knowledge Promotion

- Do not mark a context-reset or cross-workflow handoff complete without a summary, source refs, freshness, and limitations.
- Promote knowledge as confirmed only when it is verified, reusable, scoped, and carries an invalidation condition; otherwise retain it as advisory.

## Ordinary Context Exclusions

- Exclude `.spec-first/audits/**`, `.spec-first/governance/**`, and generated mirrors from ordinary task context by default.
- Read `docs/contracts/context-governance.md` when the task concerns setup, audit/governance health, runtime drift, or another explicit exception.
- Advisory facts cannot support “complete” or “passed” claims; confirmed source, diff, tests, logs, or owner evidence must carry completion.
