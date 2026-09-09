# Planning Intake

**Trigger:** Before Phase 0.2 source discovery through Phase 0.7 scoping synthesis.

This reference owns only the phases below. The entrypoint's planning-only, Product Contract, evidence, authorization, and completion boundaries remain in force. Resolve `references/...` paths from the `spec-plan` skill root. If a required source is unavailable, keep its dependent action and claim open.

## Core Principles

1. **Use the Product Contract as the source of truth** - If `spec-brainstorm` produced a requirements-only unified plan, planning should enrich it in place rather than re-inventing behavior or creating a second artifact.
2. **Decisions, not code** - Capture approach, boundaries, files, dependencies, risks, and test scenarios. Do not pre-write implementation code or shell command choreography. Pseudo-code sketches or DSL grammars that communicate high-level technical design are welcome when they help a reviewer validate direction — but they must be explicitly framed as directional guidance, not implementation specification.
3. **Research before structuring** - Explore the codebase, institutional learnings, and external guidance when warranted before finalizing the plan.
4. **Right-size the artifact** - Small work gets a compact plan. Large work gets more structure. The philosophy stays the same at every depth.
5. **Separate planning from execution discovery** - Resolve planning-time questions here. Explicitly defer execution-time unknowns to implementation.
6. **Keep the plan portable** - The plan should work as a living document, review artifact, or issue body without embedding tool-specific executor instructions.
7. **Carry execution direction lightly when it matters** - If the request, origin document, or repo context clearly implies test-first proof, characterization coverage, smoke-first verification, or another non-default execution direction, reflect that in the plan as a lightweight natural-language signal. Do not encode it as a finite enum or turn the plan into step-by-step execution choreography.
8. **Honor user-named resources** - When the user names a specific resource — a CLI, MCP server, URL, file, doc link, or prior artifact — treat it as authoritative input, not a suggestion. Discover it if unknown (`command -v`, fetch, read) before assuming it's unavailable. Use it in place of generic alternatives. If it fails or doesn't exist, say so explicitly rather than silently substituting.
9. **Inventory before invention** - Before proposing a new abstraction, durable source surface, adapter or wrapper, orchestrator, or integration pipeline, inspect existing capabilities, owners, and extension points. Prefer reuse, focused extension, or composition through thin glue; introduce a new boundary only when existing owners cannot absorb the change without mixing concerns, duplicating truth, or creating a misleading abstraction.

## Plan Quality Bar

Every plan should contain:
- A clear problem frame and scope boundary
- A first-screen Goal Capsule that names the objective, recommended approach, decision focus, verification focus, and largest risk or boundary
- Concrete requirements traceability back to the request or origin document
- Repo-relative file paths for the work being proposed (never absolute paths — see Planning Rules)
- Explicit test file paths for feature-bearing implementation units
- Decisions with rationale, not just tasks
- Existing patterns or code references to follow
- Evidence provenance and limitations when source, provider, history, or cross-repo facts materially shape the plan
- A `reuse / extend / compose / new` architecture posture when the plan proposes a new abstraction, durable source surface, adapter or orchestrator, or integration seam
- Conditional coverage of every materially-considered client, service/backend, API/schema/event contract, data, operational/rollout, verification/test, and agent/tool surface on multi-surface work
- Concrete invariant, failure, rollback, compatibility, and verification decisions when a high-risk lens applies
- Enumerated test scenarios for each feature-bearing unit, specific enough that an implementer knows exactly what to test without inventing coverage themselves
- Clear dependencies and sequencing

A plan is ready when an implementer can start confidently without needing the plan to write the code for them.

#### 0.2 Find Upstream Product Contract

Before asking planning questions, resolve the upstream product source in this order:

Discovery recognizes exactly two durable origin shapes: a `spec-brainstorm` requirements-only unified plan (`product_contract_source: spec-brainstorm`) and a legacy `docs/brainstorms/*-requirements.{md,html}` document. A current `spec-prd` artifact is consumed as the legacy shape when its existing artifact/readiness/Handoff fields are present. Do not add a future `product_contract_source: spec-prd` unified origin without a separately approved producer-migration plan. Explicit implementation-ready resume/deepen and direct bootstrap remain independent fast paths.

1. **Explicit path from the user.** If it points to a unified plan with `artifact_contract: spec-unified-plan/v1` and `artifact_readiness: requirements-only`, this run enriches that same file in place. If it is already `artifact_readiness: implementation-ready`, treat it as a resume/deepening target. If it is a legacy `docs/brainstorms/*-requirements.{md,html}` file, use it as a legacy origin and write a new unified plan in `docs/plans/`.
2. **Recent requirements-only unified plans.** Search `docs/plans/*.{md,html}` for visible/frontmatter metadata containing `artifact_contract: spec-unified-plan/v1`, `artifact_readiness: requirements-only`, and `product_contract_source: spec-brainstorm`. **Skip a superseded sibling:** if a requirements-only candidate has a same-basename file in the other format (`<basename>.md` / `<basename>.html`) that is already `implementation-ready`, a format conversion superseded it — the implementation-ready sibling is canonical; do not re-enrich the stale requirements-only copy.
3. **Legacy requirements docs.** Search `docs/brainstorms/` for files matching `*-requirements.md` or `*-requirements.html`. These remain readable historical inputs; do not migrate or rewrite them.

**Relevance criteria:** A Product Contract source is relevant if:
- The topic semantically matches the feature description
- It appears to cover the same user problem or scope

Creation within the last 30 days only raises a candidate's discovery and ordering priority. Age is never required for relevance or freshness: an older source that still matches the topic and user problem remains eligible, while a recent source is not automatically relevant or current. Before relying on an origin, inspect its durable source refs, snapshots/versions, limitations, and invalidation conditions. Re-read changed source refs and record the resulting limitation; absence of a recent timestamp does not invalidate a still-current source, and recency does not confirm truth.

If multiple source documents match, ask which one to use using the platform's blocking question tool when available (see Interaction Method). Otherwise, present numbered options in chat and wait for the user's reply before proceeding.

#### 0.3 Use the Product Contract as Primary Input

If a relevant requirements-only unified plan exists:
1. Read metadata, Goal Capsule, Product Contract, Resolve Before Planning / Open Questions, Sources, source refs, snapshots/versions, limitations, and invalidation conditions (scan headings to locate them; don't read long appendices unless referenced).
2. Announce that `spec-plan` will enrich that same file to `artifact_readiness: implementation-ready`.
3. For this workflow, treat the existing Product Contract region as read-only. Before planning, capture its exact source bytes: when present, include `<!-- PRODUCT_CONTRACT_START -->` through `<!-- PRODUCT_CONTRACT_END -->`; otherwise capture `## Product Contract` through the next top-level heading. Requirements-only enrichment must publish that region byte-for-byte unchanged. Do not add, delete, reorder, reformat, renumber, or normalize anything inside it, including Summary, Requirements, IDs, examples, or Scope Boundaries.
   - Immediately after `## Planning Contract`, outside the captured region, record `Product Contract unchanged (byte-preserved upstream source slice)`. This keeps the WHAT/HOW boundary visible without rewriting WHAT and preserves the established machine-readable phrase consumed by enrichment checks.
   - If planning discovers a conflict, desired clarification, missing product boundary, or other requested product change, record the issue outside the region and return the requested product change to the owning producer. A load-bearing product change blocks implementation-ready promotion until that owner updates the Product Contract; current-user status, `confirm:auto`, headless mode, or planning judgment does not transfer source ownership to `spec-plan`.
4. Leave every existing Product Contract section in place and reference its stable R/A/F/AE IDs from Planning Contract and Implementation Units rather than restating or normalizing them.
5. Use the Product Contract as the primary input to planning and research.
6. Do not create a duplicate plan unless an explicit `output:` conversion or pipeline override requires a new canonical path; when conversion happens, report old path and new canonical path.

If a relevant legacy requirements document exists:
1. Read it thoroughly
2. Announce that it will serve as the origin document for planning
3. Carry forward all of the following:
   - Problem frame
   - Actors (A-IDs), Key Flows (F-IDs), and Acceptance Examples (AE-IDs) when present — preserve these as constraints that implementation units must honor
   - Requirements and success criteria
   - Scope boundaries (including "Deferred for later" and "Outside this product's identity" subsections when present)
   - Key decisions and rationale
   - Dependencies or assumptions
   - Outstanding questions, preserving whether they are blocking or deferred
4. Use the source document as the primary input to planning and research
5. Reference important carried-forward decisions in the plan with `(see origin: <source-path>)`
6. Do not silently omit source content — if the origin document discussed it, the plan must address it even if briefly. Before finalizing, scan each section of the origin document to verify nothing was dropped.
7. Inspect current PRD compatibility fields when present, including `checkpoint-prd`, `can_enter_spec_plan: no`, readiness/write status, and Handoff Context Slice. Producer receipt remains an optional read-only diagnostic, never a consumer hard gate.

If no relevant Product Contract source exists, planning may proceed from the user's request directly and will create a complete unified plan with `product_contract_source: spec-plan-bootstrap`.

#### 0.4 Planning Bootstrap (No Requirements Doc or Unclear Input)

If no relevant requirements document exists, or the input needs more structure:
- Assess whether the request is already clear enough for direct technical planning — if so, continue to Phase 0.5
- If the ambiguity is mainly product framing, user behavior, or scope definition, recommend `spec-brainstorm` as a suggestion — but always offer to continue planning here as well
- If the user signals they lack working knowledge of the problem domain itself, recommend `spec-brainstorm` — its blindspot pass maps the territory's decision surface before requirements are extracted — but honor their choice to continue here; Phase 2's unfamiliar-territory scaffolding then applies
- If the user wants to continue here (or was already explicit about wanting a plan), run the planning bootstrap below

The planning bootstrap should establish:
- Problem frame
- Intended behavior
- Scope boundaries and obvious non-goals
- Success criteria
- Blocking questions or assumptions

Keep this bootstrap brief. It exists to preserve direct-entry convenience, not to replace a full brainstorm.

For every load-bearing WHAT used by direct bootstrap, preserve its authority explicitly. A behavior, scope boundary, success criterion, compatibility choice, priority, or risk decision not directly stated by the current user or confirmed by current source must be recorded as a **planning-time assumption**, never presented as producer-confirmed fact. If that unconfirmed WHAT would materially change behavior, scope, or success criteria, return it to the current user as a product decision or keep it as a named blocker; bounded bootstrap is not permission to decide it silently.

If the bootstrap uncovers major unresolved product questions:
- Recommend `spec-brainstorm` again
- If the user still wants to continue, require explicit assumptions before proceeding

If the bootstrap reveals that a different workflow would serve the user better:

- **Bug-shaped prompt** (user describes broken behavior — "fix the bug where X", error message, regression, "doesn't work"). Surface `spec-debug` as a route-out option alongside continuing with `spec-plan` whenever the bug surface is reachable (in cwd OR named repo found at another local path). Stay in `spec-plan` silently when the named code can't be found anywhere local — paper-planning is the only useful output for unreachable surfaces.

  **When the bug is at another local path (not cwd):**
  - Announce the target explicitly **before** any cross-repo investigation: which path will be read AND where plan outputs will land (default: target repo's `docs/plans/`, not cwd's).
  - Default: proceed from the target repo for both investigation and plan-write. The user can interrupt to redirect (switch context, paper-plan, abandon, etc.). No location menu — the announcement makes the cross-repo nature visible, and the user can speak up if they want something unusual.
  - **After** announcing and proceeding, fire the standard spec-debug routing menu (continue with `spec-plan` vs switch to `spec-debug`) — same shape as the in-cwd case. Cross-repo location and spec-debug skill routing are orthogonal decisions; do not merge them into a single question.

  Reading code at another path is fine in principle — that's just file access. The harm to avoid is silent operation on the wrong repo, especially writing the plan doc somewhere it won't be discovered (a busyblock plan landing in `cli-printing-press/docs/plans/` is a discoverability disaster). The announcement requirement makes the target visible; defaulting to the target repo for both investigation and outputs respects the user's stated intent (they named that repo); the orthogonal spec-debug menu keeps the skill-choice question clean.

  The accessibility classification is conservative and may under-suggest in monorepos, dependency bugs, or after renames. Users can always invoke `/spec-debug` manually.

  **Headless mode**: skip the spec-debug suggestion menu entirely; default to continuing with `/spec-plan` (the user's explicit invocation). There is no synchronous user to resolve a route-out choice, and auto-routing to spec-debug would change the skill mid-flight without authorization.

- **Clear task ready to execute** (known root cause, obvious fix, no architectural decisions) — suggest `spec-work` as a faster alternative alongside continuing with planning. The user decides.

#### 0.5 Classify Outstanding Questions Before Planning

If the origin document contains `Resolve Before Planning` or similar blocking questions:
- Review each one before proceeding
- Reclassify it into planning-owned work **only if** it is actually a technical, architectural, or research question
- Keep it as a blocker if it would change product behavior, scope, or success criteria

Treat `checkpoint-prd`, `can_enter_spec_plan: no`, and any load-bearing PRD Outstanding Question as the same user-control signal. Do not silently ignore, downgrade, or convert one merely because the document is old or otherwise readable.

**Product-decision authority guard:** A task instruction from the current user does not automatically grant Product Contract decision authority. Option 2 is available only when the current user has authority over the relevant WHAT, personally provides or confirms the concrete product decision, and has not disclaimed that authority. "Decide it yourself," "don't ask," `confirm:auto`, headless mode, pipeline / `disable-model-invocation`, and the mere fact that someone is the current user do not create or transfer WHAT decision authority. If the user explicitly states that they are not the Product Owner, lack authority to decide, or can only execute, do not ask them a product question they cannot answer; option 2 is unavailable. Keep the artifact unchanged, surface the blocker, and return to the owning producer. For direct bootstrap with no producer, return a blocked checkpoint that names the required Product Owner or caller.

Headless and pipeline modes must fail closed on a true product blocker: do not silently choose product behavior, route the blocker into Assumptions, promote readiness, or generate an implementation handoff. An automated caller may only return the blocked checkpoint to the owning producer or an owner with product-decision authority.

If true product blockers remain:
- Surface them clearly
- For an upstream-sourced run, return to the upstream producer by default (`spec-brainstorm` for a brainstorm Product Contract, `spec-prd` for a legacy PRD checkpoint). For direct bootstrap, direct bootstrap returns to the current user because no producer artifact owns the gap. If that user explicitly disclaims product-decision authority, emit the blocked checkpoint described above instead.
- Only when the current user passes the Product-decision authority guard above, use the platform's blocking question tool (see Interaction Method) to ask whether to:
  1. Return to the owning producer to resolve them
  2. Convert each blocker into an explicit assumption or decision and continue
- Do not continue planning while true blockers remain unresolved

When an authorized current user chooses option 2 and provides or confirms the concrete product decision, record the original blocker, explicit assumption or decision, consequence, and accepted risk in the plan. This preserves user control without laundering the blocker into producer-confirmed WHAT.

#### 0.6 Assess Plan Depth

Classify the work into one of these plan depths:

- **Lightweight** - small, well-bounded, low ambiguity
- **Standard** - normal feature or bounded refactor with some technical decisions to document
- **Deep** - cross-cutting, strategic, high-risk, or highly ambiguous implementation work

When the request, Product Contract, or source evidence hits a high-risk domain, read `references/high-risk-plan-lens.md` before finalizing depth. Its trigger matrix is a semantic readiness lens, not a script-owned classifier: it may raise a plan toward Standard/Deep, require explicit decisions, or expose a blocking question, but the LLM still decides applicability and adequacy.

When the request, Product Contract, or source evidence adds or evolves a durable interface (public API, CLI contract, event/schema, shared type, or cross-module protocol), read `references/interface-and-evolution-lens.md`. It owns the greenfield/evolution branches, `### Interface Contracts` landing, canonical artifact, and parser/test boundaries; private-helper refactors and implementation-drift review do not trigger this planning owner.

When the request or source evidence changes a user-visible page, form, navigation path, component behavior, async state, responsive layout, or accessibility contract, read `references/frontend-engineering-lens.md`. It owns plan-time component/state/a11y/responsive/runtime-verification decisions. Backend-only, type-only, fixture-only, and token-value-only changes that do not affect contrast, focus, layout, responsive behavior, motion, or state expression do not trigger it; neither does visual polish without structural behavior change. Polish, browser, race, and diff review retain their respective owners.

If depth is unclear, ask one targeted question and then continue.

#### 0.7 Solo-Mode Scoping Synthesis

When this gate applies, re-read `references/output-mode.md` and resolve any pending `SKIP_SCOPING_CONFIRM` configuration/default before deciding confirmation behavior. Earlier prompt/context choices remain authoritative; no unrelated route probes configuration for this unused gate.

Surface call-outs to the user — the specific forks in scope or approach where user input materially changes the plan — so scope can be corrected **before Phase 1 research is spent**. Sub-agent dispatch (repo-research-analyst, learnings-researcher, etc.) is the expensive next step this phase guards against wasted effort on.

Fires **only in solo invocation** — when Phase 0.2 found no upstream Product Contract source (no requirements-only unified plan and no legacy `*-requirements` doc; `product_contract_source: spec-plan-bootstrap`) AND Phase 0.4 stayed in spec-plan (did not route to spec-debug, spec-work, or universal-planning) AND Phase 0.5 cleared (no unresolved blockers) AND not on Phase 0.1 fast paths (resume normal, deepen-intent). Each guard is an explicit conditional. Skip Phase 0.7 entirely when any guard fails — upstream-sourced invocations (unified-plan enrichment or legacy brainstorm) defer to Phase 5.1.5 instead.

**Read `references/synthesis-summary.md` before composing the scoping synthesis.** It carries the affirmability test, keep-test criteria, detail test, summary shape budgets, the literal confirmation and auto-proceed templates, granularity rules, anti-patterns, revision-vs-confirmation discipline, doc-shape routing, soft-cut behavior, self-redirect support, the worked PII compression example, and full headless-mode routing — all required for a well-shaped synthesis.

**Required gate output — do not skip; silent proceeding is not allowed.** Compose an internal three-bucket scope draft (Stated / Inferred / Out of scope — internal thinking that feeds plan-body routing at Phase 5.2, not the chat output). Derive call-outs (specific forks where user input materially changes the plan), run the pre-emit scans, then emit the **solo-variant** synthesis and **wait for user confirmation before continuing to Phase 1.** The summary is a scope claim — what the plan will target, what it will not, at affirm-or-redirect level — never an enumeration of Implementation Units, file paths, or PR/sequencing shape (plan-write owns those, and they are not knowable yet). Emit the confirmation or auto-proceed template as specified in `references/synthesis-summary.md` (loaded above) rather than reconstructing it here.

**Blocking decision:** auto-proceed — announce without waiting — only when plan depth is **Lightweight AND zero call-outs survive**. Standard and Deep always fire the confirmation gate, even with zero call-outs.

**Headless / opt-in skip:** If Phase 0.5 has not cleared every true product blocker, do not enter this branch. Once it has, headless mode or a Phase 0.0 resolution of `SKIP_SCOPING_CONFIRM` to skip may bypass chat-time confirmation and route eligible Inferred bets to `## Assumptions` in Phase 5.2. This skip covers only the scoping confirmation; Phase 0.4 routing, Phase 0.5 blockers, Phase 2 questions, source-document disambiguation, and the Phase 5.4 scope-based handoff still apply. Announcement wording and full routing: `references/synthesis-summary.md` ("Headless mode", "When to skip the blocking confirmation").
