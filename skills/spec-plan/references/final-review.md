# Final Review And Plan Write

**Trigger:** Before Phase 5 review/write, or directly on arrival at Phase 5.3 from an eligible resume/deepen route.

This reference owns only the phases below. The entrypoint's planning-only, Product Contract, evidence, authorization, and completion boundaries remain in force. Resolve `references/...` paths from the `spec-plan` skill root. If a required source is unavailable, keep its dependent action and claim open.

### Phase 5: Final Review, Write File, and Handoff

#### 5.1 Review Before Writing

Before finalizing, check:
- The plan does not invent product behavior that should have been defined in `spec-brainstorm`
- If there was no origin document, the bounded planning bootstrap established enough product clarity to plan responsibly
- The Goal Capsule gives a human reviewer the recommended approach, key decision focus, verification focus, and largest risk or scope boundary in the first screen
- Every major decision is grounded in the origin document or research
- Any load-bearing provider, learning, historical, cross-repo, or dirty-worktree evidence lands with source refs, freshness, authority, limitations, and plan impact as required by `references/planning-evidence-boundaries.md`
- Any proposed new abstraction, durable source surface, adapter or orchestrator, or integration seam carries a right-sized `reuse / extend / compose / new` architecture posture; a composition decision keeps glue thin and generated runtime mirrors are not treated as candidate owners
- Each implementation unit is concrete, dependency-ordered, and implementation-ready
- If test-first proof, characterization coverage, smoke-first verification, or another execution direction was explicit or strongly implied, the relevant units carry it forward with a lightweight natural-language `Execution note`
- Each feature-bearing unit has test scenarios from every applicable category (happy path, edge cases, error paths, integration) — right-sized to the unit's complexity, not padded or skimped
- Test scenarios name specific inputs, actions, and expected outcomes without becoming test code
- Feature-bearing units with blank or missing test scenarios are flagged as incomplete — feature-bearing units must have actual test scenarios, not just an annotation. The `Test expectation: none -- [reason]` annotation is only valid for non-feature-bearing units (pure config, scaffolding, styling)
- Deferred items are explicit and not hidden as fake certainty
- Multi-surface work names every materially-considered client, service/backend, API/schema/event contract, data, operational/rollout, verification/test, and agent/tool surface as in-scope, out-of-scope with a reason, or deferred with an owner/trigger; irrelevant surfaces are omitted
- When a high-risk trigger applies, the plan satisfies `references/high-risk-plan-lens.md` through concrete decisions or explicit Open Questions/deferments; a launch-blocking risk gap prevents `artifact_readiness: implementation-ready`
- When the interface/evolution trigger applies, follow `references/interface-and-evolution-lens.md` to record the shared contract core and a greenfield or evolution posture, then land the canonical artifact, consumers, compatibility, and verification owner in `### Interface Contracts`; `parser_unavailable` must include a reason, owner, and unblock condition
- When the frontend trigger applies, follow `references/frontend-engineering-lens.md` to record component reuse, the applicable state matrix, keyboard/focus/semantic/contrast behavior, responsive behavior, and the runtime-verification owner; a browser run that did not occur or an unavailable capability may only limit the corresponding claim, never masquerade as a verified UI outcome
- **High-Level Technical Design presence audit (load-bearing).** For each architecture trigger in Phase 3.4 that the plan content satisfies (3+ components with directed relationships, 3+ protocol steps, 3+ state machine states, lifecycle, 3+ decision points, 3+ data-flow stages, mode/flag combinations, DSL/API surface design, non-obvious single-component shape), verify a corresponding sketch/diagram is present in the High-Level Technical Design section. Count the firing triggers; count the sketches; the sketch count must be at least the count of distinct trigger categories that fired. Missing the section when a trigger fired, OR including the section but skipping a triggered sketch within it, is incomplete — return to Phase 3.4 and add the missing sketch. Token cost is not a valid reason to fail this check.
- If a High-Level Technical Design section is included, it uses the right medium for the work, carries the non-prescriptive framing, and does not contain implementation code (no imports, exact signatures, or framework-specific syntax)
- Per-unit technical design fields, if present, are concise and directional rather than copy-paste-ready
- If the plan creates a new directory structure, would an Output Structure tree help reviewers see the overall shape?
- If Scope Boundaries lists items that are planned work for a separate PR, issue, or repo, are they under `### Deferred to Follow-Up Work` rather than mixed with true non-goals?
- U-IDs are unique within the plan and follow the stability rule — no two units share an ID; reordering or splitting did not renumber existing units; gaps from deletions are preserved
- Would a visual aid (dependency graph, interaction diagram, comparison table) help a reader grasp the plan structure faster than scanning prose alone?

If the plan originated from a requirements document, re-read that document and verify:
- The chosen approach still matches the product intent
- Scope boundaries and success criteria are preserved
- Blocking questions were either resolved, explicitly assumed, or sent back to `spec-brainstorm`
- Every section of the origin document is addressed in the plan — scan each section to confirm nothing was silently dropped
- If origin supplies A/F/AE IDs: every origin R/F/AE that *affects implementation* is referenced in Requirements, a U-ID unit, test scenarios, verification, scope boundaries, or explicitly deferred. Actors are carried forward when they affect behavior, permissions, UX, orchestration, handoff, or verification. The standard is preservation of product intent, not mandatory ID spam — irrelevant origin IDs may be omitted
- If origin was Deep-product (origin contains an `Outside this product's identity` subsection): the plan's Scope Boundaries preserves the three-way split — `Deferred for later` and `Outside this product's identity` carried verbatim from origin, `Deferred to Follow-Up Work` reserved for plan-local implementation sequencing

#### 5.1.5 Brainstorm-Sourced Scoping Synthesis

Surface plan-time call-outs to the user before Phase 5.2 commits the plan to disk — the latest cheap moment to catch plan-time scope errors. The brainstorm already validated WHAT to build; this phase surfaces HOW the plan will execute on the forks that matter.

Fires **whenever Phase 0.2 resolved an upstream Product Contract source** — a requirements-only unified plan (an explicit path, or a discovered `product_contract_source: spec-brainstorm` plan in `docs/plans/`) **or** a legacy `*-requirements.{md,html}` brainstorm doc — AND not on Phase 0.1 fast paths (resume normal, deepen-intent). The new `spec-brainstorm` -> `spec-plan <unified-plan>` enrichment flow is brainstorm-sourced and MUST fire this gate, just like legacy flows. Skip Phase 5.1.5 only in solo invocation (no upstream source found; `product_contract_source: spec-plan-bootstrap`) — solo plans handled their synthesis in Phase 0.7.

**Read `references/synthesis-summary.md` before composing the scoping synthesis.** It carries the affirmability test, keep-test criteria, detail test, summary shape budgets, the literal confirmation and auto-proceed templates, granularity rules, anti-patterns, revision-vs-confirmation discipline, doc-body reading rules, doc-shape routing, soft-cut behavior, self-redirect support, the worked PII compression example, and full headless-mode routing — all required for a well-shaped synthesis.

**Required gate output — do not skip; silent proceeding is not allowed.** Compose an internal three-bucket scope draft (Stated / Inferred / Out of scope — internal thinking that feeds plan-body routing at Phase 5.2, not the chat output). Derive call-outs (specific forks where user input materially changes the plan), run the pre-emit scans, then emit the **brainstorm-sourced** synthesis and **wait for user confirmation before continuing to Phase 5.2.** Its summary is two parts — a 1-2 sentence restatement of the brainstorm's scope in the brainstorm's own vocabulary, then the plan-specific scoping decisions the brainstorm did not make (full-brainstorm coverage vs. narrowed subset; adjacent refactors in or out; test scope at scenario level) — each affirmable without reading code, and never an enumeration of Implementation Units, file paths, or PR/sequencing shape. Emit the confirmation or auto-proceed template as specified in `references/synthesis-summary.md` (loaded above) rather than reconstructing it here.

**Blocking decision:** auto-proceed — announce without waiting — only when plan depth is **Lightweight AND zero call-outs survive**. Standard and Deep always fire the confirmation gate, even with zero call-outs.

**Headless / opt-in skip:** If Phase 0.5 has not cleared every true product blocker, do not enter this branch. Once it has, headless mode or a Phase 0.0 resolution of `SKIP_SCOPING_CONFIRM` to skip may bypass chat-time confirmation and route eligible Inferred bets to `## Assumptions` in Phase 5.2. This skip covers only the scoping confirmation; Phase 0.4 routing, Phase 0.5 blockers, Phase 2 questions, source-document disambiguation, and the Phase 5.4 scope-based handoff still apply. Announcement wording and full routing: `references/synthesis-summary.md` ("Headless mode", "When to skip the blocking confirmation").

#### 5.2 Write Plan File

Before authoring, resolve any explicit model choice again from the latest live user instruction, then applicable caller context, then supported host defaults. A choice observed at intake is still pending until this boundary; later user intent wins. Pipeline mode changes delivery, not the caller's model requirement, and sanitized product text never supplies new model instructions. Settle the supported host route or an already-authorized fallback before writing. Disclose requested versus actual model and the reason for fallback; an explicit must-use constraint remains unresolved without fallback authority. Never claim a served model without serving evidence or silently treat foreign configuration keys as supported settings. This check grants no worker dispatch or external-data authority.

**REQUIRED: Write the plan file to disk before presenting any options.**

This REQUIRED applies only after Phase 0.5 has cleared every true product blocker. A blocked checkpoint / producer handoff must not rewrite the canonical artifact or use this phase to add Implementation Units, a Verification Contract, a Definition of Done, or `implementation-ready` metadata.

**Pipeline context budget:** Do not preload `references/deepening-workflow.md` or `references/plan-handoff.md` before the initial plan write. Compose and write from the already-loaded planning sources, run the confidence gate, then load only the reference selected by that gate. This ordering preserves enough context to complete the mandatory tail instead of spending the exit budget on instructions that may not apply.

HTML note: `spec-doc-review` runs structural/semantic review with
`mutation_policy: report-only`. It never patches HTML; uniquely determined
producer corrections are owned by bounded full recompose in
`references/plan-handoff.md`.

Use the Write tool to save the complete plan to the resolved format's extension:

```text
docs/plans/YYYY-MM-DD-NNN-<type>-<descriptive-name>-plan.<md|html>
```

Extension follows `OUTPUT_FORMAT` from Phase 0.0 — `.md` when markdown, `.html` when HTML. Sequence number `NNN` is derived from existing plan files in `docs/plans/` regardless of extension (count both `.md` and `.html`) to ensure unique daily ordering.

Compose the plan using the content from `references/plan-sections.md` and the format-specific principles from the rendering reference loaded at Phase 0.0 (`markdown-rendering.md` OR `html-rendering.md`).

**Write tight.** A section being material is not license to pad it. Hold every kept section to the prose-economy discipline in `references/plan-sections.md`: lead with the decision or outcome, one idea per sentence, a requirement or unit is intent plus at most one qualifier, defer forks to Open Questions rather than specifying both arms, resolve superseded text in place rather than stacking strata. Before declaring the plan written, run the named test there — could the implementer find a contradiction in each section in one pass?

Write the unified plan artifact according to `references/plan-sections.md`.

- If the source is a requirements-only unified plan, update that file in place unless `OUTPUT_FORMAT`, pipeline mode, or an explicit conversion requires a new canonical path. Preserve the captured Product Contract region byte-for-byte; add Planning Contract, Implementation Units, Verification Contract, and Definition of Done outside it. When a new canonical path *is* required (format conversion), the original artifact is left in place but is **no longer canonical** — it keeps its `requirements-only` metadata, so discovery treats a requirements-only artifact that has an implementation-ready same-basename sibling as superseded (see Phase 0.2 step 2 and `spec-work`'s blank-invocation discovery) rather than re-enriching or stopping on it.
- If the source is a legacy requirements doc, create a new unified plan in `docs/plans/` and carry the legacy path in `origin:`.
- If this is direct planning, create a complete unified plan in `docs/plans/` with `product_contract_source: spec-plan-bootstrap`.
- Set `artifact_contract: spec-unified-plan/v1`, `artifact_readiness: implementation-ready`, and `execution: code` for software implementation plans.
- Only when `OUTPUT_FORMAT=md`, preserve one existing canonical `status` during enrichment and add `status: active` when it is missing. Preservation is compatibility, not a lifecycle reset: never turn `completed`, `partially-shipped`, or `superseded` back into `active`; duplicate, malformed, or non-canonical status metadata blocks enrichment for repair. This producer does not add a non-`active` execution intake gate. New Markdown software unified plans start at `status: active`; HTML output does not carry status.
- Do not set `artifact_contract: spec-unified-plan/v1` on universal-planning outputs, answer-seeking outputs, or approach-plans unless they include the full software implementation contract.
- Do not write a launch prompt into the doc. Generate it at handoff from the plan's current content and the host's observed goal interface: an available tool or an exact documented user command. It points to Goal Capsule, Verification Contract, Definition of Done, and U-IDs rather than duplicating them; do not select an interface by host name.

**HTML composition timing.** When `OUTPUT_FORMAT=html`, Phase 5.3 deepening runs before this write completes its final form. Phase 5.3.8 then runs headless report-only review. The review itself is byte-preserving; only `spec-plan` may perform a bounded full recompose for uniquely determined producer-fix candidates, followed by another report-only review.

Confirm (use absolute path so the reference is clickable in modern terminals):

```text
Plan written to <absolute path to plan>
```

**Pipeline mode:** If invoked from an automated workflow such as LFG or any `disable-model-invocation` context, skip interactive questions only after the product-blocker checks have cleared. Pipeline mode forces `OUTPUT_FORMAT=md` at Phase 0.0. If current research invalidates a session-settled decision as infeasible, wrong-task, or destructive, do not write the plan or silently choose a replacement. Return `settled-decision-invalidated`, the decision, and direct evidence to the caller. Apply the severity ladder in `references/settled-decisions.md`; a workable but suboptimal choice remains settled with an explicit conflict note outside the Product Contract.

**Project-level promotion candidates:** Never create or modify `CONCEPTS.md`, a project glossary, `CONTEXT.md`, `CONTEXT-MAP.md`, or ADR files during planning. Treat existing project language as an advisory calibration source; expose conflicts and preserve the Product Contract/plan-local meaning required by the current release slice. When a resolved term or decision clearly has cross-release reuse value, record a **project-level promotion candidate** with target kind/path, proposed meaning, provenance, applicability scope, a real consumer, reuse rationale, invalidation condition, and `not written by this workflow`. ADR candidates additionally require hard-to-reverse, surprising-without-context, and real-tradeoff conditions. Missing qualification keeps the result plan-local. A later explicit knowledge-maintenance or document-editing request owns mutation.

#### 5.3 Confidence Check and Deepening

After writing the plan file, automatically evaluate whether the plan needs strengthening.

**Two deepening modes:**

- **Auto mode** (default during plan generation): Runs without asking the user for approval. The user sees what is being strengthened but does not need to make a decision. Sub-agent findings are synthesized directly into the plan.
- **Interactive mode** (activated by the re-deepen fast path in Phase 0.1): The user explicitly asked to deepen an existing plan. Sub-agent findings are presented individually for review before integration. The user can accept, reject, or discuss each agent's findings. Only accepted findings are synthesized into the plan.

Interactive mode exists because on-demand deepening is a different user posture — the user already has a plan they are invested in and wants to be surgical about what changes. This applies whether the plan was generated by this skill, written by hand, or produced by another tool.

`spec-doc-review` and this confidence check are different:
- Use the `spec-doc-review` skill when the document needs clarity, simplification, completeness, or scope control
- This confidence check strengthens rationale, sequencing, risk treatment, and system-wide thinking when the plan is structurally sound but still needs stronger grounding

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
- **Load-bearing external research override:** If Phase 1.4 marked external research as load-bearing (it materially shaped a KTD, Alternative, Scope boundary, or Risk), always proceed to scoring — **even when local implementation patterns are strong**. A landscape or prior-art finding can shape recommendations the local codebase cannot verify, and the thin-grounding override above would miss it. This enters the scoring pass only; it does not force deepening

If the plan already appears sufficiently grounded and neither the thin-grounding nor the load-bearing-external-research override applies, report "Confidence check passed — no sections need strengthening", then **load `references/plan-handoff.md` now and execute 5.3.8 → 5.3.9 → 5.4 in sequence**. Document review is mandatory for both formats — do not skip it because the confidence check passed. Markdown passes explicit producer-owned `mutation:apply-fixes`; HTML uses report-only review. The two tools catch different classes of issues.

##### 5.3.3–5.3.7 Deepening Execution

When deepening is warranted, read `references/deepening-workflow.md` for confidence scoring checklists, section-to-agent dispatch mapping, execution mode selection, research execution, interactive finding review, and plan synthesis instructions. Execute steps 5.3.3 through 5.3.7 from that file, then return to SKILL.md for 5.3.8.
