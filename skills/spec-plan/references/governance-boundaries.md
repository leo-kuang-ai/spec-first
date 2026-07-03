# Governance Boundaries

Use this reference before broad context gathering, domain interpretation, upstream artifact intake, or optional capability consumption during `spec-plan`.

## Context Orientation Anchor

Orient from the current user request or requirement, existing plans or task packs, already-loaded host/project instructions, `docs/contracts/`, existing brainstorms/plans/solutions, package manifests and command registries, nearby implementation files, nearby tests, direct source evidence, and git diff or changed files when applicable. Treat `AGENTS.md`, `CLAUDE.md`, and project role docs as host instruction sources that are normally already loaded by the current session, not automatic re-read targets for every planning run. Written project standards from loaded host instructions, directory-scoped equivalents, or precisely read source files may define hard project context when they apply to the planned files. Team standards under `docs/standards/**` use `docs/contracts/team-standards.md`: read the contract and `docs/standards/index.md` first, then only matched rule files; only `trust=confirmed,lifecycle_state=active` and scope-matched rules can be hard context. Planning handoffs that use standards should record matched/excluded/uncertainty/fallback/limitations and rule IDs when a rule materially changes the plan. Docs and prior plans remain advisory unless the current source plan or user request promotes them to scope authority. Read instruction source only when `docs/contracts/context-governance.md`'s Host Instruction Reuse Policy allows it. External tools may prioritize inspection, but they do not define scope authority. The LLM still chooses the candidate change surface from explicit repo context and source-plan constraints.

Use this intake order for context economy: first read the request/requirements summary and contract metadata, then deterministic inventory or readiness facts, then current phase/task refs, then focused source-of-truth sections, and only then deeper references. Do not create a hidden reviewer facts pipeline; use bounded direct reads, `rg`, ast-grep, git diff, tests/logs, and user evidence.

When sessions, learnings, standards, or prior plans expose provenance-backed rejected/out-of-scope rationale relevant to the current scope, consume those replay refs as advisory boundary evidence before re-opening the same option. Record the source, rationale, and freshness/confidence; do not turn rejected rationale into active workflow state or a permanent blocker.

## Domain Language And Decision Ledger

When planning involves domain terminology, project-specific concepts, architectural options, or ADR-like choices, consume existing context before asking questions that repo/docs can answer: already-loaded project standards and host instructions, `docs/contracts/`, existing brainstorms/plans/solutions, and any repo-local glossary or ADR-like artifacts that actually exist. If `CONCEPTS.md` exists, treat it as repo-local advisory vocabulary for naming consistency only: it is not a PRD, ADR, workflow contract, source-of-truth override, or setup requirement. Read `AGENTS.md` / `CLAUDE.md` source only under the Host Instruction Reuse Policy, not as a default domain-context step. Do not require a fixed `CONTEXT.md`, `CONCEPTS.md`, `docs/adr/`, or glossary directory. If those artifacts are absent, record the gap as advisory context and continue with bounded source evidence.

For major planning decisions, carry a lightweight decision note in the plan or handoff: `question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason` when unresolved. Use source tags such as `confirmed`, `advisory`, `session-local`, `stale`, or `user`. Suggest creating an ADR-like artifact only when the decision is hard to reverse, would be surprising without context, and reflects a real tradeoff.

## Runtime Context Exclusion

Follow `docs/contracts/context-governance.md`: ordinary Planning context excludes `.spec-first/audits/**`, `.spec-first/governance/**`, and generated mirrors (`.claude/**`, `.codex/**`, `.agents/skills/**`, `.kiro/skills/**`, `.kiro/agents/**`, `.kiro/spec-first/**`, `.kiro/settings/**`) by default. Do not use those paths as planning source, broad repo context, or research input unless the plan explicitly targets setup/update/runtime drift/audit/governance evidence or the user names a precise runtime path; when excluded, carry the path or reason as a limitation instead of silently scanning it. Kiro-native `.kiro/specs/**` is advisory input only when explicitly named.

## Cache-Friendly Context Layout

Keep role boundaries, plan quality bar, setup/readiness limits, and reference load conditions in the stable instruction prefix. Put the current request, requirement summary, repo evidence, tool summaries, project-guidance facts, `artifact-summary.v1`, and `context-bundle.v1` from `docs/contracts/context-bundle.md` in the dynamic suffix. Plan handoff should summarize goal, scope, non-goals, implementation units, verification, and open questions before asking downstream work to read the full plan.

Maintain a run-local context ledger for this workflow: paths read, reason, phase, and compact summary. Reuse loaded summaries within the same workflow run. Re-read only when exact wording is needed, the file changed, prior evidence is insufficient, or the user explicitly asks.

## Summary-First Handoff

When consuming upstream plan, brainstorm, PRD, review, work, or compound artifacts, read an `artifact-summary.v1` summary and precise artifact path first. Open the full artifact only when `full_artifact_read_triggers` apply: the summary is missing requirement/task/finding/evidence detail needed for planning, exact prose or line references are required, or 互依赖任务 need concrete implementation details rather than only upstream conclusions. If no usable summary exists, record `summary_missing` and read the smallest explicit source path needed. If full content is opened, record `full_artifact_read_reason` with the matched trigger.

When producing a plan handoff, provide an `artifact-summary.v1`-style summary with goal, scope, non-goals, implementation units, validation focus, open questions, evidence paths, and recommended next action. If handing off a `context-bundle.v1`, keep context budget accounting in the existing `related_paths`, `evidence_paths`, `excluded_context`, `budget`, and `budget_used` fields; do not introduce a second included/omitted schema.

## Recall Trust Boundary

Institutional learnings from `docs/solutions/` are recall advisory candidate evidence. Treat a matching learning as a pointer to inspect, not as confirmed truth. Use its `source_refs` or upstream `source_reads_required` to return to current source/test/doc evidence, deterministic checks, or human reviewer confirmation before promoting a planning conclusion to confirmed. Do not rely on model self-evaluation; 不依赖模型自评.

## Capability-Class Evidence Boundary

Follows `docs/contracts/project-graph-consumption.md`. When setup/runtime facts expose optional `capability-class` candidates such as `code-graph` or `project-graph`, treat them as advisory planning inputs through their native MCP or CLI surface, not as source-of-truth. Check `readiness_status`, lifecycle display bits, and freshness before using the candidates; a provider self-report of freshness is not confirmed evidence. A `stale` graph still serves exploration-tier orientation when you annotate that it lags HEAD, but conclusion-tier planning claims must be re-grounded regardless. When the capability is missing, when readiness facts are unavailable or self-reported as `unknown`/`unverified`, on call failure, or when disabled/unsafe, continue with bounded direct source reads, `rg`, ast-grep, tests/logs, and user evidence. Record any used candidate as `provider_untrusted`; never-block planning on its availability, and keep setup-side `lifecycle.fallback_used` separate from consumption-side fallback notes.
