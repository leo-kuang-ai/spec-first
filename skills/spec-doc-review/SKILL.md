---
name: spec-doc-review
description: "Review requirements, plans, task packs, or Markdown planning artifacts for coherence, feasibility, scope, risk, and downstream readiness. Do not use for code diff/PR/branch implementation review, implementation execution, or PR merge-readiness code review. When reviewer dispatch is available and explicitly authorized for the current host, run bounded parallel reviewers; when dispatch is unavailable, unauthorized, explicitly disabled, or unsafe, fall back to a single-agent report-only review instead of bypassing host boundaries."
argument-hint: "[mode:headless] [path/to/document.md]"
---

# Document Review

Review requirements, plan, or task-pack documents through multi-persona analysis. When the host exposes a reviewer dispatch primitive and the current request explicitly authorizes subagents, parallel reviewers, delegated review, or an equivalent documented multi-agent phase, dispatch specialized reviewer agents with bounded parallelism, auto-apply `safe_auto` fixes, and route remaining findings through a four-option interaction (per-finding walk-through, Auto-resolve with best judgment, Append-to-Open-Questions, Report-only) for user decision. When reviewer dispatch is unavailable, unauthorized, explicitly disabled by the user, or unsafe for the current runtime, run the single-agent report-only fallback described in Phase 2 so the workflow still returns review findings without violating host boundaries.

## Workflow Contract Summary

### When To Use

Use to review requirements, plans, or task packs for coherence, feasibility, scope, risk, and downstream execution readiness.

### When Not To Use

Do not use for code diff review, implementing fixes as a work run, filing issues without an explicit route, or treating a task pack as an independent source plan.

### Inputs

A requirements, plan, or task-pack document path; optional `mode:headless`; repository instructions, source-document links, document frontmatter, and review persona context.

### Outputs

Persona-reviewed findings with severity, confidence-first anchor, recommended action, applied `safe_auto` fixes when allowed, structured headless output when requested, and a terminal `Review complete` signal.

### Artifacts

The reviewed document may be edited for accepted fixes or Open Questions append entries. No repo-local JSON run artifact is promised; headless callers consume the structured text envelope and any concrete document edits.

### Failure Modes

Missing headless document path, unreadable document, dispatch unavailable/disabled/unsafe, reviewer timeout/failure, Open Questions append failure, or no actionable findings. Fall back to single-agent report-only when dispatch is not safe and surface append failures through Retry/Fall back/Convert-to-Skip handling.

### Workflow

Detect mode and document type, select reviewer personas, dispatch with bounded parallelism or fall back, synthesize findings, apply allowed fixes, then route or return the final review envelope.

### Downstream Consumers

`spec-plan`, `spec-work`, task-pack validation/rebuild decisions, human document owners, code-review handoffs when document findings imply implementation risk, and `spec-compound` when accepted review findings become reusable knowledge.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Examples As Context

When editing or reviewing this workflow prompt, or when running fresh-source eval for review posture drift, read `skills/spec-doc-review/evals/examples.json` as examples-as-context. These examples are not a replacement for persona selection, reviewer findings, or semantic readiness judgment during ordinary document reviews.

## Runtime Context Exclusion

Follow `docs/contracts/context-governance.md`: ordinary Document Review context excludes `.spec-first/audits/**`, `.spec-first/governance/**`, and generated mirrors (`.claude/**`, `.codex/**`, `.agents/skills/**`, `.kiro/skills/**`, `.kiro/agents/**`, `.kiro/spec-first/**`, `.kiro/settings/**`, `.qoder/commands/spec/**`, `.qoder/skills/**`, `.qoder/agents/**`, `.qoder/spec-first/**`, `.qoder/settings.local.json`) by default. Do not include those paths in reviewer prompts, pre-facts targets, broad repo search, or section bundles unless the document or user request explicitly targets setup/update/runtime drift/audit/governance evidence; when excluded, surface the path or reason in Coverage instead of silently scanning it. Kiro-native `.kiro/specs/**` and Qoder-native `.qoder/rules/**` are advisory input only when explicitly named.

## Summary-First Section Bundles

Use `docs/contracts/context-bundle.md` and `docs/contracts/artifact-summary.md` as the handoff posture: reviewers should receive selected document sections, summaries, evidence paths, full-read triggers, and relevant direct source/test facts instead of an automatic full-document broadcast. Findings should map to the shared `review-finding.v1` minimum fields in `docs/contracts/workflows/review-finding.md`; workflow-specific fields may remain as extensions. Apply reviewer budgets and finding caps as context controls, never as permission to drop P0/P1 evidence silently.

Maintain a run-local context ledger for this workflow: paths read, reason, phase, and compact summary. Reuse loaded summaries within the same workflow run. Re-read only when exact wording is needed, the file changed, prior evidence is insufficient, or the user explicitly asks.

## Domain Language And Decision Ledger

When document findings depend on domain terminology, project-specific concepts, or ADR-like decisions, consume existing context before asking questions or raising gaps that repo/docs can answer: already-loaded project standards and host instructions, `docs/contracts/`, existing brainstorms/plans/solutions, and any repo-local glossary or ADR-like artifacts that actually exist. Team standards under `docs/standards/**` are consumed through `docs/contracts/team-standards.md`; doc-review may use only `category=architecture` or `category=design` rules whose workflow scope applies to planning/doc-review. Coding, testing and style standards do not become document-quality findings. Read `AGENTS.md` / `CLAUDE.md` source only under `docs/contracts/context-governance.md`'s Host Instruction Reuse Policy, not as a default domain-context step. Do not require a fixed `CONTEXT.md`, `docs/adr/`, or glossary directory. If those artifacts are absent, record the limitation in Coverage as advisory context rather than blocking document review.

For major document decisions or open questions, carry a lightweight decision note: `question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason` when unresolved. Use source tags such as `confirmed`, `advisory`, `session-local`, `stale`, or `user`. Recommend an ADR-like artifact only when the decision is hard to reverse, would be surprising without context, and reflects a real tradeoff; do not create the artifact from review unless an explicit workflow route chooses that work.

## Direct Evidence Boundary

Doc Review does not require external-tool readiness before reviewer dispatch. When a document makes codebase or current-state claims, use bounded direct reads, `rg`, ast-grep, package/test facts, logs, and user-provided artifacts to check those claims. If the document's impact claims cannot be confirmed from direct evidence within the review scope, record that limitation instead of claiming repository-wide coverage.

## Invocation Boundary

`spec-doc-review` is a workflow orchestrator, not an agent type. Do not invoke it through Agent/Task/subagent primitives. Use the current host's document-review entrypoint instead; nested workflow callers execute the workflow inline in the current orchestrator. This workflow may dispatch persona agents during Phase 2, but the workflow itself is not one of those agents.

## Interactive mode rules

- **Pre-load the platform question tool before any question fires.** In Claude Code, `AskUserQuestion` is a deferred tool — its schema is not available at session start. At the start of Interactive-mode work (before the routing question, per-finding walk-through questions, bulk-preview Proceed/Cancel, and Phase 5 terminal question), call `ToolSearch` with query `select:AskUserQuestion` to load the schema. Load it once, eagerly, at the top of the Interactive flow — do not wait for the first question site. On Codex this preload is not required.
- **The numbered-list fallback applies only when the harness genuinely lacks a blocking question tool** — `ToolSearch` returns no match, the tool call explicitly fails, or the runtime mode does not expose it (e.g., Codex edit modes where `request_user_input` is unavailable). A pending schema load is not a fallback trigger; call `ToolSearch` first per the pre-load rule. In genuine-fallback cases, present options as a numbered list and wait for the user's reply — never silently skip the question. Rendering a question as narrative text because the tool feels inconvenient, because the model is in report-formatting mode, or because the instruction was buried in a long skill is a bug. A question that calls for a user decision must either fire the tool or fall back loudly.

## Phase 0: Detect Mode

Check the workflow arguments for `mode:headless`. Arguments may contain a document path, `mode:headless`, or both. Tokens starting with `mode:` are flags, not file paths — strip them from the arguments and use the remaining token (if any) as the document path for Phase 1.

If `mode:headless` is present, set **headless mode** for the rest of the workflow.

**Headless mode** changes the interaction model, not the classification boundaries. spec-doc-review still applies the same judgment about which tier each finding belongs in. The only difference is how non-safe_auto findings are delivered:

- `safe_auto` fixes are applied silently (same as interactive)
- `gated_auto`, `manual`, and FYI findings are returned as structured text for the caller to handle — no blocking-question prompts, no interactive routing
- Phase 5 returns immediately with "Review complete" (no routing question, no terminal question)

The caller receives findings with their original classifications intact and decides what to do with them.

Callers invoke headless mode by including `mode:headless` in the workflow arguments, e.g.:

```
/spec:doc-review mode:headless docs/plans/my-plan.md
$spec-doc-review mode:headless docs/plans/my-plan.md
```

If `mode:headless` is not present, the workflow runs in its default interactive mode with the routing question, walk-through, and bulk-preview behaviors documented in `references/walkthrough.md` and `references/bulk-preview.md`.

## Phase 1: Get and Analyze Document

**If a document path is provided:** Read it, then proceed.

**If no document is specified (interactive mode):** Ask which document to review, or find the most recent in `docs/brainstorms/` or `docs/plans/` using a file-search/glob tool (e.g., Glob in Claude Code).

**If no document is specified (headless mode):** Output "Review failed: headless mode requires a document path. Re-invoke the spec-doc-review workflow with: `mode:headless <path>`." without dispatching agents.

### Classify Document Type

After reading, classify the document by **content shape first**, with path/frontmatter as supporting evidence:

- **requirements** -- focuses on what to build and why; typical signals include `## Requirements`, actors, key flows, acceptance examples, problem framing, or scope boundaries without implementation units
- **plan** -- focuses on how to build it; typical signals include `## Implementation Units`, `## Key Technical Decisions`, `## System-Wide Impact`, `## Risks & Dependencies`, or implementation file/test lists
- **task-pack** -- from frontmatter `type: task-pack`, `docs/tasks/`, or a `Task Pack Contract` block; focuses on whether a derived execution input remains faithful to its source plan and is safe for `spec-work`

Path is a hint, not the source of truth: a copied plan outside `docs/plans/` is still a plan, and a task-pack with valid frontmatter is still a task-pack even if its filename is unusual. Also extract the frontmatter `origin:` value when present. Store it as `Origin`; if missing, set `Origin: none`.

For task-pack review, verify that it is derived rather than a second plan:

- it points to exactly one repo-relative `source_plan`,
- it uses `Task Pack Contract` as the machine-readable source,
- it does not add scope, acceptance criteria, non-goals, public contracts, or implementation decisions absent from the source plan,
- `files`, `context_refs`, `test_focus`, `done_signal`, `risk_note`, and `stop_if` reduce execution context without turning into micro-implementation steps,
- dependency and wave claims are plausible from file ownership and shared surfaces,
- deterministic identity/freshness issues belong to `spec-first tasks validate --json`, while semantic task quality remains reviewer judgment.

Add a bounded requirements-to-tasks ID coverage pass when the task pack's `source_plan` can be read. Resolve `task-pack -> source_plan -> source plan frontmatter origin` and inspect only structured requirement IDs that affect implementation, such as R/F/AE identifiers. Check whether each applicable ID is referenced by task `requirement_refs`, `source_unit`, or a directly traceable source-plan unit. Missing IDs are coverage gap findings using the existing `references/findings-schema.json` shape (`P0`-`P3`, confidence anchors, evidence array); do not add a new finding schema or category.

Origin reachability is non-blocking:

- if the source plan has a readable origin with structured R/F/AE IDs, run the ID coverage pass and emit coverage gap findings for unreferenced IDs;
- if the origin is missing or points to an unreadable file, record a Coverage limitation and continue the task-pack review;
- if the origin exists but does not expose structured R/F/AE IDs, record a Coverage limitation and do not invent content parsing.

This is an ID-level traceability lens inside task-pack review. It does not require reviewing requirements, plan, and tasks as three mandatory documents, and it does not detect semantic drift where an ID remains referenced but its meaning narrowed. Freshness and identity remain owned by `source_plan_hash` and `spec-first tasks validate --json`; semantic drift remains reviewer judgment.

For plan documents with `Origin` set, do not routinely re-review the upstream WHAT/WHY. Review the plan's faithfulness, execution readiness, architectural choices, risk treatment, and whether it introduces new scope or strategic/architecture risks not present in the origin. Re-open WHAT/WHY only when the plan itself adds a new product claim, expands scope, or changes the origin's intent.

### Select Conditional Personas

Analyze the document content to determine which conditional personas to activate. Check for these signals:

### Scale-Aware Document Review Posture

Use the smallest reviewer posture that can still catch material risk. Low-risk docs-only edits, typo-level prose updates, and narrow task-pack metadata checks can use the minimum document-review set: `spec-coherence-reviewer`, `spec-maintainability-reviewer`, and `spec-scope-guardian-reviewer` when scope is relevant. High-risk workflow, contract, release, source/runtime boundary, external-tool evidence, security, or cross-module planning changes must use the full default document-review set plus applicable conditional personas. Record the selected posture (`minimum` or `full`) and the reason in Coverage.

This is progressive disclosure, not evidence suppression. A minimum set does not drop known P0/P1 risks; if the document is broad, sensitive, unclear, or has prior unresolved findings, use the full set. Do not create a separate reviewer facts pipeline for this posture; reuse existing document sections, summary-first bundles, and direct evidence summaries.

**product-lens** -- activate when the document makes challengeable claims about what to build and why, or when the proposed work carries strategic weight beyond the immediate problem. The system's users may be end users, developers, operators, maintainers, or any other audience -- the criteria are domain-agnostic. Check for either leg:

*Leg 1 — Premise claims:* The document stakes a position on what to build or why that a knowledgeable stakeholder could reasonably challenge -- not merely describing a task or restating known requirements:
- Problem framing where the stated need is non-obvious or debatable, not self-evident from existing context
- Solution selection where alternatives plausibly exist (implicit or explicit)
- Prioritization decisions that explicitly rank what gets built vs deferred
- Goal statements that predict specific user outcomes, not just restate constraints or describe deliverables

*Leg 2 — Strategic weight:* The proposed work could affect system trajectory, user perception, or competitive positioning, even if the premise is sound:
- Changes that shape how the system is perceived or what it becomes known for
- Complexity or simplicity bets that affect adoption, onboarding, or cognitive load
- Work that opens or closes future directions (path dependencies, architectural commitments)
- Opportunity cost implications -- building this means not building something else

**design-lens** -- activate when the document contains:
- UI/UX references, frontend components, or visual design language
- User flows, wireframes, screen/page/view mentions
- Interaction descriptions (forms, buttons, navigation, modals)
- References to responsive behavior or accessibility

**security-lens** -- activate when the document contains:
- Auth/authorization mentions, login flows, session management
- API endpoints exposed to external clients
- Data handling, PII, payments, tokens, credentials, encryption
- Third-party integrations with trust boundary implications

**scope-guardian** -- activate when the document contains:
- Multiple priority tiers (P0/P1/P2, must-have/should-have/nice-to-have)
- Large requirement count (>8 distinct requirements or implementation units)
- Stretch goals, nice-to-haves, or "future work" sections
- Scope boundary language that seems misaligned with stated goals
- Goals that don't clearly connect to requirements

**adversarial** -- activate when the document contains:
- More than 5 distinct requirements or implementation units
- Explicit architectural or scope decisions with stated rationale
- High-stakes domains (auth, payments, data migrations, external integrations)
- Proposals of new abstractions, frameworks, or significant architectural patterns

## Phase 1b: Direct Evidence Summary

Before announcing or dispatching personas, build a compact advisory `{codebase_facts}` block only when the document makes codebase, current-state, implementation, or migration claims that reviewers need to check. Use bounded direct reads, `rg`, ast-grep when useful, package/test facts, logs, and user-provided artifacts. Do not create temp provider artifacts or call hidden provider helpers.

The block is advisory evidence only. It improves reviewer navigation and reduces repeated reads, but it is not a hard gate, does not select personas, does not replace reviewer judgment, and does not prevent dispatch. If no codebase facts are needed or available, inject a legal empty block with `tier="not-needed"` or `tier="unavailable"` and record the reason in Coverage.

Never leave a literal `{codebase_facts}` placeholder in dispatched reviewer prompts; replace it with either the compact block or the legal empty block.

## Phase 2: Announce and Dispatch Personas

### Announce the Review Team

Tell the user which personas will review and why. For conditional personas, include the justification:

```
Reviewing with:
- spec-coherence-reviewer (always-on)
- spec-feasibility-reviewer (always-on)
- spec-scope-guardian-reviewer -- plan has 12 requirements across 3 priority levels
- spec-security-lens-reviewer -- plan adds API endpoints with auth flow
```

### Build Agent List

Always include:
- `spec-coherence-reviewer`
- `spec-feasibility-reviewer`

Add activated conditional personas:
- `spec-product-lens-reviewer`
- `spec-design-lens-reviewer`
- `spec-security-lens-reviewer`
- `spec-scope-guardian-reviewer`
- `spec-adversarial-document-reviewer`

### Dispatch Capability Gate

Before dispatching any reviewer, confirm the current host exposes a dispatch primitive, the current user request or parent workflow explicitly authorizes subagents / parallel reviewer work / delegated review for this phase, and the selected reviewers are part of this documented document-review phase. Dispatch capability and dispatch authorization are runtime boundaries, not reviewer-selection preferences.

Reviewers are analysis agents, not implementation workers. Dispatch is bounded to document-review personas with the current document scope, selected sections, pre-facts, and output contract. Do not create hidden implement/check agents from document review. Autofix is limited to this workflow's documented `safe_auto` document edits; report-only fallback, user-requested no-agents mode, unsafe runtime, or missing dispatch capability must not edit documents or generated runtime mirrors.

- A direct invocation of the current host's document-review workflow entrypoint authorizes the doc-review workflow itself; it does not automatically authorize host-level subagent tools whose contract requires explicit subagent, delegation, or parallel-agent wording.
- For Codex, a direct `$spec-doc-review` invocation alone is not an explicit `spawn_agent` authorization. Call `spawn_agent` only when the user explicitly requests subagents, parallel agents, delegated review, or persona reviewer dispatch, or when an upstream workflow delegates doc-review from an already authorized multi-agent context whose visible parent request or handoff evidence includes explicit subagent/delegation/parallel/persona wording.
- Default doc-review posture is multi-persona analysis when host capability and dispatch authorization are both present. A plain invocation on a gated host uses the single-agent report-only fallback without treating the review itself as failed.
- `mode:headless` is not a dispatch-disabling flag. It changes interaction/output behavior only; use normal bounded multi-persona dispatch when dispatch is otherwise safe and authorized.
- If the user explicitly requested subagents, parallel agents, delegated review, or persona reviewer dispatch and the host exposes a dispatch primitive, continue with normal bounded multi-persona dispatch.
- If an active workflow or parent orchestrator explicitly delegated this doc-review workflow from an authorized multi-agent context, continue with normal bounded multi-persona dispatch only when the visible parent request or handoff evidence carries explicit subagent/delegation/parallel/persona authorization.
- If the user explicitly requests report-only/no-agents mode, the host lacks a dispatch primitive, or the current runtime cannot call it, do not call `Agent`, `Task`, `spawn_agent`, or equivalent dispatch tools.
- Codex supports reviewer dispatch through `spawn_agent` only when the current request satisfies the runtime tool authorization contract. Do not call `spawn_agent` solely because a persona profile exists or because `$spec-doc-review` was invoked.
- If dispatch capability exists but explicit authorization is absent, record `dispatch_authorization_missing` and run the single-agent report-only fallback. This is a host boundary, not a reviewer failure; for multi-persona or subagent review in Codex, ask for `subagents`, `personas`, delegated review, or parallel agents in the request.

When dispatch is unavailable, explicitly disabled, or unsafe, set `single_agent_report_only_fallback: true` and run a read-only review in the current orchestrator:

- Treat the effective mode as report-only, even if no `mode:report-only` token was provided.
- Do not apply `safe_auto` fixes, append Open Questions, or edit the document.
- Use the selected persona list as an inline checklist, preserving the same classification boundaries where possible.
- Skip the routing question, walk-through, and bulk-preview flow.
- In Coverage, state `single-agent report-only fallback` and include at least one concrete reason code: `user_requested_report_only`, `user_requested_no_agents`, `dispatch_authorization_missing`, `dispatch_unavailable`, `runtime_dispatch_failed`, or `safety_boundary_not_met`.

### Dispatch

Dispatch agents using **bounded parallelism** with the platform's subagent primitive (e.g., `Agent` in Claude Code or `spawn_agent` in Codex). Omit the `mode` parameter so the user's configured permission settings apply. Respect the current harness's active-subagent limit: queue selected reviewers, dispatch only as many as the harness accepts, and fill freed slots as reviewers complete. Treat active-agent/thread/concurrency-limit spawn errors as backpressure, not reviewer failure: leave the reviewer queued and retry after a slot frees. Record a reviewer as failed only after a successful dispatch times out/fails, or when dispatch fails for a non-capacity reason.

**Codex `spawn_agent` parameter hygiene.** Codex reviewer prompts are self-contained: pass the persona, schema, document type, origin, document path, codebase facts, document content, and decision primer in the `message` or `items` payload instead of relying on inherited thread context. Dispatch one reviewer per `spawn_agent` call; do not bundle multiple document-review personas into one sub-agent prompt. For Codex reviewer personas, prefer the default sub-agent type and omit `agent_type`; these reviewers are specialized by the prompt, not by a generic explorer/worker role. If a specific runtime genuinely needs an `agent_type`, omit `fork_context` (or leave it false); do not combine `fork_context: true` with `agent_type`. If a Codex dispatch fails before the reviewer starts because of parameter incompatibility, correct the parameters once and retry through the bounded scheduler; record it as an orchestrator dispatch correction, not a reviewer failure.

Each agent receives the prompt built from the subagent template included below with these variables filled:

| Variable | Value |
|----------|-------|
| `{persona_file}` | Full content of the agent's markdown file |
| `{schema}` | Content of the findings schema included below |
| `{document_type}` | "requirements", "plan", or "task-pack" from Phase 1 classification |
| `{origin}` | Frontmatter `origin:` value when present, otherwise `none` |
| `{document_path}` | Path to the document |
| `{codebase_facts}` | Phase 1b `<codebase-facts>` block; fallback is a legal empty block, never an unreplaced placeholder |
| `{document_content}` | Selected document sections, compact summary, evidence snippets, and full-read trigger notes for this reviewer |
| `{decision_primer}` | Cumulative prior-round decisions in the current session, or an empty `<prior-decisions>` block on round 1. See "Decision primer" below. |

Pass each agent a summary-first section bundle by default, not the full document. Include the full document only when a `full_read_triggers` reason requires exact evidence, the document is already trivially small, or the selected persona must check a cross-document invariant that cannot be represented by selected sections plus summaries.

### Decision Primer

Before dispatch, read `references/decision-primer.md` and build `{decision_primer}` from that contract. The primer is the only cross-round memory for the current interactive invocation: round 1 sends the empty prior-decision block, while round 2+ summarizes prior Apply / Skip / Defer / Acknowledge decisions with evidence snippets so synthesis can suppress rejected re-raises and verify applied fixes. Do not persist the primer across sessions.

**Error handling:** If an agent fails or times out, proceed with findings from agents that completed. Note the failed agent in the Coverage section. Do not block the entire review on a single agent failure.

**Dispatch limit:** Even at maximum (7 agents), use bounded parallel dispatch. These are document reviewers with bounded scope reading a single document -- parallel is safe and fast when the host allows it. If the harness cap is lower than the selected team size, queue the remainder and launch them as active reviewers complete.

## Phases 3-5: Synthesis, Presentation, and Next Action

After all dispatched agents return, read `references/synthesis-and-presentation.md` for the synthesis pipeline (validate, anchor-based gate, dedup, cross-persona agreement promotion, resolve contradictions, auto-promotion, route by three tiers with FYI subsection), `safe_auto` fix application, headless-envelope output, and the handoff to the routing question.

For the four-option routing question and per-finding walk-through (interactive mode), read `references/walkthrough.md`. For the bulk-action preview used by Auto-resolve with best judgment, Append-to-Open-Questions, and walk-through `Auto-resolve with best judgment on the rest`, read `references/bulk-preview.md`. Do not load these files before agent dispatch completes.

### Learning Capture Recommendation

After synthesis and presentation, decide whether the current review produced a reusable lesson about document structure, architecture, contracts, handoff boundaries, or review heuristics. This recommendation is advisory only: it is not a finding, not residual actionable work, not a verdict input, not an autofix item, and not a review gate.

Use a three-tier judgment:

- **Skip silently** for mechanical copy edits, one-off wording fixes, or non-generalizable findings. If the lesson cannot be stated in one sentence, skip rather than offer.
- **Offer neutrally** when the lesson can be stated in one sentence — a repeated document-scope boundary, reusable contract clarification, handoff lesson, or source/runtime boundary finding worth remembering.
- **Lean into the offer** when the same lesson appears across 3+ findings, or reveals a wrong assumption about a shared contract, workflow, or scope boundary.

When offering, phrase it as the user's choice to run the current host's `spec-compound` entrypoint with a brief context hint. Include the candidate lesson, evidence path, suggested action, and how the user's choice should be recorded.

In headless and report-only paths, include at most one advisory line when learning-worthy evidence exists — never ask a question. Do not automatically run `spec-compound`, do not write `docs/solutions/`, and do not make learning capture a verdict input or gate in any path including headless and `safe_auto`.

---

## Included References

### Subagent Template

@./references/subagent-template.md

### Findings Schema

@./references/findings-schema.json
