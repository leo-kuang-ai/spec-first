---
name: spec-plan
description: "Create a structured HOW plan when the user has a clear goal, requirements document, brainstorm/PRD handoff, feature, bug, or project; also deepen an existing plan when asked to strengthen the plan as a whole. Prefer spec-brainstorm for unresolved WHAT/product exploration, spec-debug for failing tests, stack traces, reproducible regressions, or root-cause investigation, spec-work for implementation or tests, spec-doc-review for independent plan review, and spec-write-tasks for task-pack compilation. Do not use for generated runtime mirror fixes."
---

# Create Technical Plan

## Purpose

Turn a clear goal, requirements artifact, bug, project, or existing plan into an evidence-grounded HOW plan or structured planning answer while preserving planning-only boundaries and explicit handoff before execution.

Use the current host/session date when dating plans and searching for recent documentation. If the date is unavailable, read it with a deterministic command; do not hard-code calendar years in this source file.

`spec-brainstorm` defines **WHAT** to build. `spec-plan` defines **HOW** to build it. `spec-work` executes the plan. A prior brainstorm is useful context but never required — `spec-plan` works from any input: a requirements doc, a bug report, a feature idea, or a rough description.

**When directly invoked, always plan.** Never classify a direct invocation as "not a planning task" and abandon the workflow. If the input is unclear, ask clarifying questions or use the planning bootstrap (Phase 0.4) to establish enough context — but always stay in the planning workflow.

For software and plan-seeking tasks, this workflow produces a durable implementation or structured plan. For non-software answer-seeking tasks routed through `references/universal-planning.md`, it uses planning as the working scaffold and answers in chat without writing a plan file by default. It does **not** implement code, run tests, or learn from execution-time results. If the answer depends on changing code and seeing what happens, that belongs in `spec-work`, not here.

## Plan-Only Safety Contract

- **Planning only until handoff.** Before the post-plan handoff choice, research, decide, and write or update only the plan artifact. Do not call implementation tools, modify code/config/runtime source, run implementation workflows, or claim implementation has started.
- **Handoff is blocking.** After the plan is written and reviewed, present the handoff menu and wait for the user's explicit selection. Do not continue into `spec-work`, task compilation, issue creation, or code edits without that selection.
- **Question tools are mandatory when available.** In Claude Code interactive planning, preload `AskUserQuestion` at the start of the interactive flow by calling `ToolSearch` with query `select:AskUserQuestion` before any question fires. On Codex, use `request_user_input` when available.
- **Fallback must be loud.** A numbered-list text fallback is allowed only when the harness genuinely lacks a blocking question tool, `ToolSearch` returns no match, the tool call explicitly fails, or the runtime mode does not expose the tool. A pending schema load, tool inconvenience, report-formatting mode, or this instruction being buried in a long skill is not a fallback trigger. In fallback, present numbered options and wait for the user's reply.
- **Safety posture is explicit.** This workflow-level discipline and any `spec-plan` attention guard are best-effort attention hardening. Hard write protection outside the model's cooperation comes from Claude native Plan Mode; do not claim non-Plan Mode has hard write protection.

## Workflow Contract Summary

### When To Use

Use when the desired outcome is clear enough to plan, when a requirements document is ready for implementation planning, or when an existing plan needs a deepening pass.

### When Not To Use

Do not use to implement code, run tests as proof, investigate failing tests, stack traces, reproducible regressions, or root causes that belong in `spec-debug`, review a finished document without planning changes, resolve unclear product framing that belongs in `spec-brainstorm`, generate task-pack state, or rewrite generated runtime assets.

### Inputs

A feature/request description, requirements document path, existing plan path to deepen, bug report, rough task description, or non-software planning prompt; optional project standards, package/test context, setup/runtime facts, and nearby source evidence as planning context.

### Outputs

A durable plan document or in-place plan deepening with goals, non-goals, requirements, implementation units, file/test references, sequencing, risks, assumptions, and post-plan handoff options; for non-software answer-seeking tasks, an evidence-grounded chat answer with no plan artifact by default.

### Artifacts

Plan files under the appropriate docs location, reused source-document links, optional doc-review findings or plan-handoff outputs, and no execution-run artifact. Non-software answer-seeking tasks create no durable artifact unless the user asks to save the result.

### Failure Modes

Empty or ambiguous input requires a blocking clarification or planning bootstrap; missing/unreadable source documents are surfaced instead of silently ignored; setup/runtime facts stay advisory; implementation-dependent questions are deferred to `spec-work`.

### Workflow

Resolve source and scope, gather required repo/research context, structure the plan, run confidence/doc-review checks when required, then present the appropriate plan handoff.

### Downstream Consumers

`spec-write-tasks`, `spec-work`, `spec-doc-review`, issue creation, Proof/HITL review paths, and human implementation reviewers.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Examples As Context

When editing or reviewing this workflow prompt, or when running fresh-source eval for planning posture drift, read `skills/spec-plan/evals/examples.json` as examples-as-context. These examples are not a deterministic router, state machine, semantic readiness gate, or substitute for LLM judgment during ordinary planning runs.

**STOP. Before broad context gathering, domain interpretation, upstream artifact intake, or optional capability consumption, read `skills/spec-plan/references/governance-boundaries.md`.** This runtime-copied reference carries the planning governance boundaries for context orientation, decision ledgers, runtime mirror exclusion, summary-first handoff, recall trust, and optional capability evidence. Do not duplicate those boundaries in this spine.

**STOP. Before proposing a new file, reference, agent, skill, script, helper, template, workflow, schema, artifact contract, source-of-truth entry, or source/runtime projection surface, read `skills/spec-plan/references/reuse-analysis.md`.** Use it as a lightweight Decision Lens for `reuse / extend / new` choices; do not duplicate its ownership table or non-goals in this spine.

**STOP. When a plan hits enterprise high-risk triggers such as money, permissions, migrations, high QPS, async events, state machines, scheduled jobs, rollout, privacy, or data/ML consistency, read `skills/spec-plan/references/enterprise-plan-review.md`.** Use it as a conditional readiness lens; do not inline its trigger matrix in this spine.

## Interaction Method

When asking the user a question, use the platform's blocking question tool: `AskUserQuestion` in Claude Code or `request_user_input` in Codex. In Claude Code interactive planning, `AskUserQuestion` is a deferred tool; call `ToolSearch` with query `select:AskUserQuestion` once at the start of the interactive flow, before the first clarification, scope-confirmation, doc-review routing, or final handoff question. Do not wait until the first question site to load the schema.

Fall back to numbered options in chat only when the harness genuinely lacks a blocking question tool, `ToolSearch` returns no match, the tool call explicitly fails, or the runtime mode does not expose the tool (e.g., Codex edit modes where `request_user_input` is unavailable). A pending schema load is not a fallback trigger; call `ToolSearch` first. Rendering a question as narrative text because the tool feels inconvenient, because the model is in report-formatting mode, or because the instruction was buried in a long skill is a bug. A user decision must either fire the blocking question tool or fall back loudly, then wait for the user's reply.

Ask one question at a time. Prefer a concise single-select choice when natural options exist.

## Feature Description

<feature_description> #$ARGUMENTS </feature_description>

**If the feature description above is empty, ask the user:** "What would you like to plan? Describe the task, goal, or project you have in mind." Then wait for their response before continuing.

If the input is present but unclear or underspecified, do not abandon — ask one or two clarifying questions, or proceed to Phase 0.4's planning bootstrap to establish enough context. The goal is always to help the user plan, never to exit the workflow.

Plan document path rules live in `skills/spec-plan/references/plan-sections.md` and rendering checks live in `skills/spec-plan/references/markdown-rendering.md`. Plan contents use repo-relative paths; chat confirmations may use absolute paths for clickable terminal output.

## Core Principles

1. **Use requirements as the source of truth** - If `spec-brainstorm` produced a requirements document, planning should build from it rather than re-inventing behavior.
2. **Decisions, not code** - Capture approach, boundaries, files, dependencies, risks, and test scenarios. Do not pre-write implementation code or shell command choreography. Pseudo-code sketches or DSL grammars that communicate high-level technical design are welcome when they help a reviewer validate direction — but they must be explicitly framed as directional guidance, not implementation specification.
3. **Research before structuring** - Explore the codebase, institutional learnings, and external guidance when warranted before finalizing the plan.
4. **Right-size the artifact** - Small work gets a compact plan. Large work gets more structure. The philosophy stays the same at every depth.
5. **Separate planning from execution discovery** - Resolve planning-time questions here. Explicitly defer execution-time unknowns to implementation.
6. **Keep the plan portable** - The plan should work as a living document, review artifact, or issue body without embedding tool-specific executor instructions.
7. **Carry execution posture lightly when it matters** - If the request, origin document, or repo context clearly implies test-first, characterization-first, or another non-default execution posture, reflect that in the plan as a lightweight signal. Do not turn the plan into step-by-step execution choreography.
8. **Honor user-named resources** - When the user names a specific resource — a CLI, MCP server, URL, file, doc link, or prior artifact — treat it as authoritative input, not a suggestion. Discover it if unknown (`command -v`, fetch, read) before assuming it's unavailable. Use it in place of generic alternatives. If it fails or doesn't exist, say so explicitly rather than silently substituting.

## Plan Quality Bar

Every plan should contain:
- A clear problem frame and scope boundary
- Concrete requirements traceability back to the request or origin document
- Repo-relative file paths for the work being proposed (never absolute paths — see Planning Rules)
- Explicit test file paths for feature-bearing implementation units
- Decisions with rationale, not just tasks
- Existing patterns or code references to follow
- A `reuse / extend / new` decision when the plan proposes a new source surface
- Enterprise / High-Risk Readiness when enterprise triggers apply (see `skills/spec-plan/references/enterprise-plan-review.md`)
- Enumerated test scenarios for each feature-bearing unit, specific enough that an implementer knows exactly what to test without inventing coverage themselves
- Clear dependencies and sequencing

A plan is ready when an implementer can start confidently without needing the plan to write the code for them.

## Workflow

### Phase 0: Resume, Source, and Scope

**STOP. Before Phase 0 source/scope handling or Phase 1 research, read `skills/spec-plan/references/planning-flow.md`.** That reference owns resume/deepen detection, software vs universal planning routing, upstream requirements intake, PRD handoff entropy, direct-entry bootstrap, outstanding-question classification, planning-depth assessment, solo-mode scope synthesis, local research, Direct Evidence Readiness, execution-posture signals, external research, and flow analysis.

Use Phase 0 to decide whether this run is a new plan, plan edit, deepening pass, universal-planning answer, or route-out suggestion. Direct invocation still stays in planning: when input is unclear, clarify or bootstrap rather than exiting. For PRD-grade origins, preserve `spec_id`, R/F/AE trace, Feature Slices, source/evidence pointers, and split-summary metadata, but route unresolved WHAT gaps back to PRD refine or inline PRD feedback instead of inventing product behavior.

Use Phase 0.6 to classify plan depth from source evidence and optional `task-governance-signals`; helper output is advisory, and the LLM still decides. Use Phase 0.7 for solo-mode scope synthesis when the `planning-flow.md` guards fire.

### Phase 1: Gather Context

Follow `planning-flow.md` for local research, Direct Evidence Readiness, execution-posture detection, external research decisions, reclassification, and flow analysis.

Research agents are read-only. Dispatch them only when host capability exists and dispatch authorization is present for this run. In Codex, a public `spec-plan` invocation authorizes the workflow itself; it does not by itself authorize `spawn_agent`. If the user did not explicitly request subagents, delegation, parallel research, or research-agent dispatch, use the inline fallback and record `dispatch_authorization_missing`. If dispatch is unavailable, explicitly disabled, unauthorized, or fails for a non-capacity reason, run the same research sequentially in the current agent by reading the corresponding agent profile and applying it inline as an explicit fallback. Plan generation must still complete when research dispatch is unavailable.

Planning may recommend later worker delegation, but it must not dispatch implementation workers or create a hidden implement/check lifecycle. A worker is suitable only when the scope is clear, the write set can be bounded, verification commands are known, no product/architecture blocker remains, and no sensitive/security-critical ambiguity is unresolved. If any condition is missing, keep the task local to `spec-work`, return to planning, or require a smaller task pack slice. Review autofix and mutation are off unless a documented workflow mode or explicit user choice authorizes them.

For software implementation, architecture, API/routes, cross-module, or test strategy plans, collect bounded direct evidence and include `## Direct Evidence` in the generated plan. Use this block to disclose what was actually read or verified. Do not claim repository-wide impact coverage from a narrow search. Do not add hidden pre-facts or external-tool evidence envelopes.

### Phase 2: Resolve Planning Questions

Build a planning question list from:
- Deferred questions in the origin document
- Gaps discovered in repo or external research
- Technical decisions required to produce a useful plan

For each question, decide whether it should be:
- **Resolved during planning** - the answer is knowable from repo context, documentation, or user choice
- **Deferred to implementation** - the answer depends on code changes, runtime behavior, or execution-time discovery

Ask the user only when the answer materially affects architecture, scope, sequencing, or risk and cannot be responsibly inferred. Use the platform's blocking question tool when available (see Interaction Method).

**Do not** run tests, build the app, or probe runtime behavior in this phase. The goal is a strong plan, not partial execution.

### Phase 3: Structure the Plan

#### 3.1 Title and File Naming

- Draft a clear, searchable title using conventional format such as `feat: Add user authentication` or `fix: Prevent checkout double-submit`
- Determine the plan type: `feat`, `fix`, or `refactor`
- Build the filename following the repository convention: `docs/plans/YYYY-MM-DD-NNN-<type>-<descriptive-name>-plan.md`
  - Create `docs/plans/` if it does not exist
  - Check existing files for today's date to determine the next sequence number (zero-padded to 3 digits, starting at 001)
  - Keep the descriptive name concise (3-5 words) and kebab-cased
  - Examples: `2026-01-15-001-feat-user-authentication-flow-plan.md`, `2026-02-03-002-fix-checkout-race-condition-plan.md`
  - Avoid: missing sequence numbers, vague names like "new-feature", invalid characters (colons, spaces)
- Set the plan frontmatter `spec_id`:
  - If the plan has an origin requirements document with `spec_id`, inherit that value exactly, even though the plan filename also contains `<type>`.
  - If the origin requirements document is legacy and lacks `spec_id`, generate a plan-local `spec_id` from the plan filename sequence and slug, and state in the Problem Frame or Context & Research that origin identity was not inherited.
  - If there is no origin document, generate a new `spec_id` from the plan filename sequence and slug.
  - Before minting a new `spec_id`, scan `docs/brainstorms/`, `docs/plans/`, and `docs/tasks/` frontmatter. If the same `spec_id` already exists and `origin` / `source_plan` links do not prove it belongs to the same spec chain, increment the local sequence or ask the user to confirm.
  - Preserve `spec_id` across ordinary edits, plan deepening, task-pack rebuilds, and work/review handoffs. For alternative implementation plans, independent delivery chains, or abandon-and-replace work from the same origin, decide whether to inherit or create a new spec chain and record the reason in the plan.
- If the plan's origin is a review or audit report, include `referenced_reviews` entries in frontmatter for any in-scope findings. For `role: origin` and `scope: in`, set `addresses_findings: ["FINDING-ID"]` for findings this plan handles, or `deferred_findings: ["FINDING-ID"]` plus a follow-up note for findings this plan explicitly defers. This is a weak traceability convention, not proof that every finding is covered.

#### 3.2 Stakeholder and Impact Awareness

For **Standard** or **Deep** plans, briefly consider who is affected by this change — end users, developers, operations, other teams — and how that should shape the plan. For cross-cutting work, note affected parties in the System-Wide Impact section.

#### 3.3 Break Work into Implementation Units

Break the work into logical implementation units. Each unit should represent one meaningful change that an implementer could typically land as an atomic commit.

Good units are:
- Focused on one component, behavior, or integration seam
- Usually touching a small cluster of related files
- Ordered by dependency
- Concrete enough for execution without pre-writing code

Avoid:
- 2-5 minute micro-steps
- Units that span multiple unrelated concerns
- Units that are so vague an implementer still has to invent the plan

Each unit carries a stable plan-local **U-ID** assigned in Phase 3.5 (`U1`, `U2`, …). U-IDs survive reordering, splitting, and deletion: new units take the next unused number, gaps are fine, and existing IDs are never renumbered. This lets `spec-work` reference units unambiguously across plan edits.

#### 3.4 High-Level Technical Design (Optional)

Before detailing implementation units, decide whether an overview would help a reviewer validate the intended approach. This section communicates the *shape* of the solution — how pieces fit together — without dictating implementation.

**When to include it:**

| Work involves... | Best overview form |
|---|---|
| DSL or API surface design | Pseudo-code grammar or contract sketch |
| Multi-component integration | Mermaid sequence or component diagram |
| Data pipeline or transformation | Data flow sketch |
| State-heavy lifecycle | State diagram |
| Complex branching logic | Flowchart |
| Mode/flag combinations or multi-input behavior | Decision matrix (inputs -> outcomes) |
| Single-component with non-obvious shape | Pseudo-code sketch |

**When to skip it:**
- Well-patterned work where prose and file paths tell the whole story
- Straightforward CRUD or convention-following changes
- Lightweight plans where the approach is obvious

Choose the medium that fits the work. Do not default to pseudo-code when a diagram communicates better, and vice versa.

Frame every sketch with: *"This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce."*

Keep sketches concise — enough to validate direction, not enough to copy-paste into production.

#### 3.4b Output Structure (Optional)

For greenfield plans that create a new directory structure (new plugin, service, package, or module), include an `## Output Structure` section with a file tree showing the expected layout. This gives reviewers the overall shape before diving into per-unit details.

**When to include it:**
- The plan creates 3+ new files in a new directory hierarchy
- The directory layout itself is a meaningful design decision

**When to skip it:**
- The plan only modifies existing files
- The plan creates 1-2 files in an existing directory — the per-unit file lists are sufficient

The tree is a scope declaration showing the expected output shape. It is not a constraint — the implementer may adjust the structure if implementation reveals a better layout. The per-unit `**Files:**` sections remain authoritative for what each unit creates or modifies.

#### 3.5 Define Each Implementation Unit

Each unit's heading carries a stable U-ID prefix matching the format used for R/A/F/AE in requirements docs: `### U1. [Name]`. The U-ID is plain text in the heading and the unit name is not bolded. Number sequentially within the plan starting at U1. Do not prefix units with `- [ ]` / `- [x]` checkbox markers; the plan is a decision artifact, and execution progress is derived from git by `spec-work` rather than stored in the plan body. When reading, editing, or deepening older plans, continue to recognize legacy `- U1. **[Name]**` list-item units as valid anchors.

**Stability rule.** Once assigned, a U-ID is never renumbered. Reordering units leaves their IDs in place (e.g., U1, U3, U5 in their new order is correct; renumbering to U1, U2, U3 is not). Splitting a unit keeps the original U-ID on the original concept and assigns the next unused number to the new unit. Deletion leaves a gap; gaps are fine. This rule matters most during deepening (Phase 5.3), which is the most likely accidental-renumber vector.

Implementation unit field contract lives in `skills/spec-plan/references/plan-sections.md`; the concrete markdown skeleton lives in `skills/spec-plan/references/plan-template.md`. Do not duplicate or reconstruct the field list here. In the generated plan, each feature-bearing unit still needs enough file, pattern, test-scenario, and verification detail for `spec-work` to execute without inventing coverage.

Every feature-bearing unit should include the test file path in `**Files:**`.

Use `Execution note` sparingly. Good uses include:
- `Execution note: Start with a failing integration test for the request/response contract.`
- `Execution note: Add characterization coverage before modifying this legacy parser.`
- `Execution note: Implement new domain behavior test-first.`

Do not expand units into literal `RED/GREEN/REFACTOR` substeps.

#### 3.6 Keep Planning-Time and Implementation-Time Unknowns Separate

If something is important but not knowable yet, record it explicitly under deferred implementation notes rather than pretending to resolve it in the plan.

Examples:
- Exact method or helper names
- Final SQL or query details after touching real code
- Runtime behavior that depends on seeing actual test failures
- Refactors that may become unnecessary once implementation starts

### Phase 4: Write the Plan

**NEVER CODE during this skill.** Research, decide, and write the plan — do not start implementation.

Use one planning philosophy across all depths. Change the amount of detail, not the boundary between planning and execution.

#### 4.1 Plan Depth Guidance

**Lightweight**
- Keep the plan compact
- Usually 2-4 implementation units
- Omit optional sections that add little value; use `## Summary` alone when a separate Decision Brief would only repeat it

**Standard**
- Use the full core template, omitting optional sections (including High-Level Technical Design) that add no value for this particular work
- Usually 3-6 implementation units
- Include risks, deferred questions, and system-wide impact when relevant
- Include `## Decision Brief` when the first human pass needs recommended approach, key decisions, validation focus, or largest risks before dense evidence and implementation detail

**Deep**
- Use the full core template plus optional analysis sections where warranted
- Usually 4-8 implementation units
- Group units into phases when that improves clarity
- Include alternatives considered, documentation impacts, and deeper risk treatment when warranted
- Include `## Decision Brief` near the top unless the plan is unusually narrow and `## Summary` already carries the first-pass orientation

#### 4.1b Optional Deep Plan Extensions

For sufficiently large, risky, or cross-cutting work, add the sections that genuinely help:
- **Alternative Approaches Considered**
- **Success Metrics**
- **Dependencies / Prerequisites**
- **Risk Analysis & Mitigation**
- **Phased Delivery**
- **Documentation Plan**
- **Operational / Rollout Notes**
- **Future Considerations** only when they materially affect current design

Do not add these as boilerplate. Include them only when they improve execution quality or stakeholder alignment.

**Alternatives Considered — what to vary.** When this section is included, alternatives must differ on *how* the work is built: architecture, sequencing, boundaries, integration pattern, rollout strategy. Tiny implementation variants (which hash function, which serialization format) belong in Key Technical Decisions, not Alternatives. Product-shape alternatives (different actors, different core outcome, different positioning) belong in `spec-brainstorm`, not here — surface them back upstream rather than re-litigating product questions during planning.

#### 4.2 Core Plan Template

Read `skills/spec-plan/references/plan-sections.md` before writing the plan. That file defines the format-independent content contract: which sections earn their place, which metadata fields are stable, and which downstream consumers rely on markdown as the canonical artifact.

Read `skills/spec-plan/references/markdown-rendering.md` before writing the canonical markdown plan. Markdown remains the source artifact for `spec-work`, `spec-write-tasks`, `spec-doc-review`, and plan deepening. If a future run explicitly produces an HTML companion, read `skills/spec-plan/references/html-rendering.md` and treat that file as an optional sidecar only; do not replace the markdown plan without focused downstream consumer tests.

Read `skills/spec-plan/references/plan-template.md` before writing the plan. That file is the source of truth for the core plan skeleton, optional Deep extensions, current heading names, and the implementation-unit heading format. Do not reconstruct the template from memory and do not inline the full template in this skill.

Use `### U1. [Name]` heading-style implementation units for new plans. Continue to read legacy `- U1. **[Name]**` list-item units when editing or deepening older plans; do not rewrite old unit anchors unless the user asked for a format cleanup.

#### 4.3 Planning Rules

- **Horizontal rules (`---`) between top-level sections** in Standard and Deep plans, mirroring the `spec-brainstorm` requirements doc convention. Improves scannability of dense plans where many H2 sections sit close together. Omit for Lightweight plans where the whole doc fits on a single screen.
- Apply the path, metadata, ID, and content rules from `plan-sections.md` and the post-write markdown audit from `markdown-rendering.md`
- Prefer path plus class/component/pattern references over brittle line numbers
- Do not include implementation code — no imports, exact method signatures, or framework-specific syntax
- Pseudo-code sketches and DSL grammars are allowed in the High-Level Technical Design section and per-unit technical design fields when they communicate design direction. Frame them explicitly as directional guidance, not implementation specification
- Mermaid diagrams are encouraged when they clarify relationships or flows that prose alone would make hard to follow — ERDs for data model changes, sequence diagrams for multi-service interactions, state diagrams for lifecycle transitions, flowcharts for complex branching logic
- Do not include git commands, commit messages, or exact test command recipes
- Do not expand implementation units into micro-step `RED/GREEN/REFACTOR` instructions
- Do not pretend an execution-time question is settled just to make the plan look complete

#### 4.4 Visual Communication in Plan Documents

When the plan contains 4+ implementation units with non-linear dependencies, 3+ interacting surfaces in System-Wide Impact, 3+ behavioral modes/variants in Summary or Problem Frame, or 3+ interacting decisions in Key Technical Decisions or alternatives in Alternative Approaches, read `references/visual-communication.md` for diagram and table guidance. Legacy plans may still use `Overview`; treat it as the old Summary slot. This covers plan-structure visuals (dependency graphs, interaction diagrams, comparison tables) — not solution-design diagrams, which are covered in Section 3.4.

### Phase 5: Final Review, Write File, and Handoff

#### 5.1 Review Before Writing

Before finalizing, check:
- The plan does not invent product behavior that should have been defined in `spec-brainstorm`
- If there was no origin document, the bounded planning bootstrap established enough product clarity to plan responsibly
- Every major decision is grounded in the origin document or research
- Each implementation unit is concrete, dependency-ordered, and implementation-ready
- If test-first or characterization-first posture was explicit or strongly implied, the relevant units carry it forward with a lightweight `Execution note`
- Each feature-bearing unit has test scenarios from every applicable category (happy path, edge cases, error paths, integration) — right-sized to the unit's complexity, not padded or skimped
- Test scenarios name specific inputs, actions, and expected outcomes without becoming test code
- Feature-bearing units with blank or missing test scenarios are flagged as incomplete — feature-bearing units must have actual test scenarios, not just an annotation. The `Test expectation: none -- [reason]` annotation is only valid for non-feature-bearing units (pure config, scaffolding, styling)
- Deferred items are explicit and not hidden as fake certainty
- `spec_id` is present for software plans, is inherited from origin requirements when available, and is not changed during deepening or ordinary plan edits
- If the origin requirements document lacks `spec_id`, the plan explicitly says it uses a plan-local `spec_id` and that origin identity was not inherited
- If this plan is an alternative, independent delivery chain, or replacement for another plan from the same origin, the plan states why it inherits the existing `spec_id` or starts a new spec chain
- If a High-Level Technical Design section is included, it uses the right medium for the work, carries the non-prescriptive framing, and does not contain implementation code (no imports, exact signatures, or framework-specific syntax)
- Per-unit technical design fields, if present, are concise and directional rather than copy-paste-ready
- If the plan creates a new directory structure, would an Output Structure tree help reviewers see the overall shape?
- If Scope Boundaries lists items that are planned work for a separate PR, issue, or repo, are they under `### Deferred to Follow-Up Work` rather than mixed with true non-goals?
- U-IDs are unique within the plan and follow the stability rule — no two units share an ID; reordering or splitting did not renumber existing units; gaps from deletions are preserved
- Would a visual aid (dependency graph, interaction diagram, comparison table) help a reader grasp the plan structure faster than scanning prose alone?
- For Standard or Deep plans, does the first human pass (`## Summary` plus material `## Decision Brief`) answer what is being built, why this approach, what validates it, and what could go wrong without replacing Direct Evidence or Implementation Units?

If the plan originated from a requirements document, re-read that document and verify:
- The chosen approach still matches the product intent
- Scope boundaries and success criteria are preserved
- Blocking questions were either resolved, explicitly assumed, or sent back to `spec-brainstorm`
- Every section of the origin document is addressed in the plan — scan each section to confirm nothing was silently dropped
- If origin supplies A/F/AE IDs: every origin R/F/AE that *affects implementation* is referenced in Requirements, a U-ID unit, test scenarios, verification, scope boundaries, or explicitly deferred. Actors are carried forward when they affect behavior, permissions, UX, orchestration, handoff, or verification. The standard is preservation of product intent, not mandatory ID spam — irrelevant origin IDs may be omitted
- If origin was Deep-product (origin contains an `Outside this product's identity` subsection): the plan's Scope Boundaries preserves the three-way split — `Deferred for later` and `Outside this product's identity` carried verbatim from origin, `Deferred to Follow-Up Work` reserved for plan-local implementation sequencing

#### 5.1.5 Brainstorm-Sourced Scope Summary

**STOP. Before composing the synthesis, read `references/synthesis-summary.md`.** The discipline rules, prose-summary requirement, three-bucket structure, anti-pattern guidance, soft-cut behavior, self-redirect support, brainstorm-sourced content focus, doc-body reading rules, and routing into plan sections all live there.

Surface the agent's plan-time decisions to the user before Phase 5.2 commits the plan to disk. The upstream brainstorm validated WHAT to build; this phase surfaces HOW the plan will execute it, including patterns extended, files or modules touched, test scope, and deliberate exclusions.

Fires only when the plan was sourced from an upstream brainstorm requirements doc and the run is not on a Phase 0.1 fast path. Skip it in solo invocation because solo plans use Phase 0.7.

In headless mode, compose the synthesis but do not ask for confirmation. Proceed to Phase 5.2 and route inferred bets to `## Assumptions` instead of Key Technical Decisions.

#### 5.2 Write Plan File

**REQUIRED: Write the plan file to disk before presenting any options.**

Use the current host's file-write mechanism to save the complete plan to:

```text
docs/plans/YYYY-MM-DD-NNN-<type>-<descriptive-name>-plan.md
```

Confirm using an absolute path so the reference is clickable in modern terminals:

```text
Plan written to <absolute path to plan>
```

**Pipeline mode:** If invoked from an automated workflow such as LFG or any `disable-model-invocation` context, skip interactive questions. Make the needed choices automatically and proceed to writing the plan.

#### 5.3 Confidence-first Check and Deepening

After writing the plan file, automatically evaluate whether the plan needs strengthening.

**Two deepening modes:**

- **Auto mode** (default during plan generation): Runs without asking the user for approval. The user sees what is being strengthened but does not need to make a decision. Sub-agent findings are synthesized directly into the plan.
- **Interactive mode** (activated by the re-deepen fast path in Phase 0.1): The user explicitly asked to deepen an existing plan. Sub-agent findings are presented individually for review before integration. The user can accept, reject, or discuss each agent's findings. Only accepted findings are synthesized into the plan.

Interactive mode exists because on-demand deepening is a different user posture — the user already has a plan they are invested in and wants to be surgical about what changes. This applies whether the plan was generated by this skill, written by hand, or produced by another tool.

`spec-doc-review` and this confidence-first check are different:
- Use the `spec-doc-review` workflow when the document needs clarity, simplification, completeness, or scope control
- This confidence-first check strengthens rationale, sequencing, risk treatment, and system-wide thinking when the plan is structurally sound but still needs stronger grounding

**Pipeline mode:** This phase always runs in auto mode in pipeline/disable-model-invocation contexts. No user interaction needed.

##### 5.3.1 Classify Plan Depth and Topic Risk

Determine the plan depth from the document:
- **Lightweight** - small, bounded, low ambiguity, usually 2-4 implementation units
- **Standard** - moderate complexity, some technical decisions, usually 3-6 units
- **Deep** - cross-cutting, high-risk, or strategically important work, usually 4-8 units or phased delivery

Build a risk profile. Treat these as high-risk signals:
- Authentication, authorization, or security-sensitive behavior
- Payments, billing, or financial flows
- Data migrations, backfills, or persistent data changes
- External APIs or third-party integrations
- Privacy, compliance, or user data handling
- Cross-interface parity or multi-surface behavior
- Significant rollout, monitoring, or operational concerns

##### 5.3.2 Gate: Decide Whether to Deepen

- **Lightweight** plans usually do not need deepening unless they are high-risk
- **Standard** plans often benefit when one or more important sections still look thin
- **Deep** or high-risk plans often benefit from a targeted second pass
- **Thin local grounding override:** If Phase 1.2 triggered external research because local patterns were thin (fewer than 3 direct examples or adjacent-domain match), always proceed to scoring regardless of how grounded the plan appears. When the plan was built on unfamiliar territory, claims about system behavior are more likely to be assumptions than verified facts. The scoring pass is cheap — if the plan is genuinely solid, scoring finds nothing and exits quickly

If the plan already appears sufficiently grounded and the thin-grounding override does not apply, report "Confidence-first check passed — no sections need strengthening", then **load `references/plan-handoff.md` now and execute 5.3.8 → 5.3.9 → 5.4 in sequence**. Document review is mandatory — do not skip it because the confidence-first check passed. The two tools catch different classes of issues.

##### 5.3.3–5.3.7 Deepening Execution

When deepening is warranted, read `references/deepening-workflow.md` for confidence-first scoring checklists, section-to-agent dispatch mapping, execution mode selection, research execution, interactive finding review, and plan synthesis instructions. Execute steps 5.3.3 through 5.3.7 from that file, then return here for 5.3.8.

##### 5.3.8–5.4 Document Review, Final Checks, and Post-Generation Options

**STOP. Load `references/plan-handoff.md` now before continuing.** It contains the full instructions for 5.3.8 (document review), 5.3.9 (final checks and cleanup), and 5.4 (post-generation handoff, including the Proof HITL flow, post-HITL re-review, and Issue Creation branching). This load is non-optional: without it, agents can render the menu, capture a selection, and stop without firing the routed action. Document review is mandatory — do not skip it even if the confidence-first check already ran.

After document review and final checks, present this menu using the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded) or `request_user_input` in Codex. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

**Question:** "Plan ready at `<absolute path to plan>`. What would you like to do next?"

**Options:**
1. **Start work** (recommended) - Begin implementing this plan in the current session using the current host's work entrypoint
2. **Compile task pack with `spec-write-tasks`** - Recommended when source plan structure shows high execution complexity: many implementation units, declared `Files`, dependency chains, cross-module surfaces, broad verification spread, or `plan_depth: deep`; this reduces single-run context load, broad review scope, and coupled rollback cost
3. **Create Issue** - Create a tracked issue from this plan in your configured issue tracker (GitHub or Linear)
4. **Open in Proof (web app) — review and comment to iterate with the agent** - Open the doc in Every's Proof editor, iterate with the agent via comments, or copy a link to share with others
5. **Done for now** - Pause; the plan file is saved and can be resumed later

Routing each selection, contextual surfacing of residual spec-doc-review findings, and the post-HITL resync logic all live in `references/plan-handoff.md` — follow it for every branch. Act on the user's selection; do not only tell the user which command to run.

**Completion check:** This skill is not complete until the post-generation menu above has been presented, the user has selected an action, and the routed action has executed or been explicitly declined. Presenting the menu and stopping at the selection is not completion.

**Pipeline mode exception:** In LFG or any `disable-model-invocation` context, skip the interactive menu and return control to the caller after the plan file is written, confidence-first check has run, and `spec-doc-review` has run in headless mode (per `references/plan-handoff.md`).
