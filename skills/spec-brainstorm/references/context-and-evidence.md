# Context And Evidence

Use this reference before repo scans, source claims, domain naming decisions, decision-ledger entries, Slack context, project-graph use, or external-tool evidence.

## Domain Language And Decision Ledger

When the idea involves domain terminology, team-specific concepts, or ADR-like choices, consume existing context before asking questions that repo/docs can answer: already-loaded project standards and host instructions, `docs/contracts/`, existing brainstorms/plans/solutions, and any repo-local glossary or ADR-like artifacts that actually exist.

If `CONCEPTS.md` exists, treat it as repo-local advisory vocabulary for naming consistency only: it is not a PRD, ADR, workflow contract, source-of-truth override, or setup requirement. Read `AGENTS.md` / `CLAUDE.md` source only under `docs/contracts/context-governance.md`'s Host Instruction Reuse Policy, not as a default domain-context step. Do not require a fixed `CONTEXT.md`, `CONCEPTS.md`, `docs/adr/`, or glossary directory. If those artifacts are absent, record the gap as advisory context and continue with the best available evidence.

For major open decisions, carry a lightweight decision note: `question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason` when unresolved. Use source tags such as `confirmed`, `advisory`, `session-local`, `stale`, or `user`. Suggest creating an ADR-like artifact only when the decision is hard to reverse, would be surprising without context, and reflects a real tradeoff.

## Existing Context Scan

Scan the repo before substantive brainstorming. Match depth to scope:

- Lightweight: search for the topic, check if something similar already exists, and move on.
- Standard and Deep: run a Constraint Check and Topic Scan.

Constraint Check: For Standard and Deep scopes, first resolve the question-agnostic project profile through the local cache protocol in `references/repo-profile-cache.md`. Invoke `scripts/repo-profile-cache.py` via the `SKILL_DIR` anchor from this skill directory. On `HIT`, use `conventions.strategy`, `vocabulary`, and `conventions` as agnostic orientation and do not re-read those root context files. On `MISS`, derive the profile with `references/agents/repo-profiler.md`, persist it with `put`, then use the same fields. On `NO-CACHE` or helper failure, derive the orientation inline and skip persistence. The cache is an optimization, never a correctness dependency.

Use already-loaded host/project instructions first for workflow, product, or scope constraints that affect the brainstorm. Read `AGENTS.md` / `CLAUDE.md` source only when `docs/contracts/context-governance.md`'s Host Instruction Reuse Policy allows it, such as a user-named path, missing/stale loaded context, source/runtime governance work, or a directory-scoped instruction file that may govern the topic. If a source read is needed, record the reason briefly; if loaded instructions add nothing, move on. When the topic plausibly has prior art in `docs/solutions/`, scan it for prior problem framing and decision rationale, not implementation steps; this evidence must not let implementation details back-drive user-facing requirements.

Topic Scan: search for relevant terms. Read the most relevant existing artifact if one exists, such as a brainstorm, plan, spec, skill, feature doc, or adjacent example. If nothing obvious appears after a short scan, say so and continue.

## Source Claims

Verify before claiming. When the brainstorm touches checkable infrastructure such as database tables, routes, config files, dependencies, or model definitions, read the relevant source files to confirm what actually exists. Any claim that something is absent, such as a missing table, endpoint, dependency, or config option, must be verified against the codebase first; otherwise label it as an unverified assumption.

Defer design decisions to planning. Implementation details like schemas, migration strategies, endpoint structure, deployment topology, column names, file layouts, and service classes belong in planning unless the brainstorm is itself about a technical or architectural decision.

## Optional Claim Verification Helper

Use this only for checkable source claims that may enter a requirements document: absence or presence of files, routes, configs, dependencies, schema facts, source-backed constraints, or existing behavior. It is optional/degraded evidence support, not a hard phase.

For each bounded claim, end with one of these outcomes:

- `confirmed` - direct source/docs/test/log evidence supports the claim; write it normally with source refs when useful.
- `refuted` - evidence contradicts the claim; correct the requirement, scope boundary, or assumption before writing.
- `unverifiable` - the repo lacks enough evidence; record a planning research question or user decision.
- `unverified assumption` - the claim remains plausible but unchecked; label it under `Assumptions`, not as a confirmed requirement.

If dispatch is explicitly authorized and available, a fresh read-only helper may verify a short claim list. If dispatch is not authorized, unavailable, fails, or would require provider-specific behavior, verify inline with targeted reads or use `unverified assumption`. Never block brainstorm on helper availability. Do not require a dossier, model-tier choice, hidden background dispatch, or provider-specific contract.

## External-Tool Context

Use only lightweight read-only evidence as session-local pointers. Confirm important claims with direct source reads before writing them into requirements. Do not route mutation, refresh, broad impact, or maintenance operations through brainstorm by default. External-tool evidence must not expand product scope or let implementation details back-drive user-facing requirements.

Capability-class candidates such as code-graph or project-graph follow `docs/contracts/project-graph-consumption.md`. Check `readiness_status` before use; the WHAT must come from user dialogue and source confirmation, never the candidate. Record used candidates as `provider_untrusted`, never block on availability, keep setup-side `lifecycle.fallback_used` separate, and fall back to direct source reads on missing, `unknown`, `unverified`, failure, or disabled providers.

Slack context is opt-in for Standard and Deep only. If tools are available and the user asked, read `references/agents/slack-researcher.md` and dispatch a generic subagent seeded with that prompt plus a brief topic summary. Do not dispatch a standalone agent by type/name. If tools are available and the user did not ask, mention that the user can ask for Slack search later. If the user asked but tools are unavailable, state that Slack context needs plugin setup.
