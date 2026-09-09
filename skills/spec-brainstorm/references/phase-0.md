#### 0.1 Resume Existing Work When Appropriate

If the user references an existing brainstorm topic or document, or there is an obvious recent matching unified plan in `docs/plans/` with `artifact_contract: spec-unified-plan/v1`, `artifact_readiness: requirements-only`, and `product_contract_source: spec-brainstorm`:
- Read the document
- Confirm with the user before resuming: "Found an existing requirements-only plan for [topic]. Should I continue from this, or start fresh?"
- If resuming, summarize the current state briefly, continue from its existing decisions and outstanding questions, and update the existing document instead of creating a duplicate
- If the transcript or `/tmp` dossier is unavailable, recover from the durable artifact: re-read its source refs, snapshots, limitations, invalidation conditions, named blockers, and next highest-impact question. Re-check stale refs before relying on them; do not infer closure from missing scratch context.
- **Resume preserves the existing artifact's format, except pipeline mode.** Write back in whatever format the existing artifact uses — markdown if the existing file is `.md`, HTML if it is `.html`. Explicit `output:` arguments on this run override (e.g., resuming an `.html` doc with `output:md` switches the artifact to markdown). Pipeline mode (LFG, any `disable-model-invocation` context) always wins per Phase 0.0: even when resuming an existing `.html` brainstorm, pipeline runs force `OUTPUT_FORMAT=md` so downstream automation receives the markdown shape it expects. The resume rewrites the markdown file at the parallel path and the original `.html` is left in place untouched.

Historical `docs/brainstorms/*-requirements.{md,html}` files remain legacy inputs for `spec-plan`, but new `spec-brainstorm` outputs do not write there.

#### 0.1b Classify Task Domain

Before proceeding to Phase 0.2, classify whether this is a software task. The key question is: **does the task involve building, modifying, or architecting software?** -- not whether the task *mentions* software topics.

**Software** (continue to Phase 0.2) -- the task references code, repositories, APIs, databases, or asks to build/modify/debug/deploy software.

**Non-software brainstorming** (route to universal brainstorming) -- BOTH conditions must be true:
- None of the software signals above are present
- The task describes something the user wants to explore, decide, or think through in a non-software domain

**Neither** (respond directly, skip all brainstorming phases) -- the input is a quick-help request, error message, factual question, or single-step task that doesn't need a brainstorm.

**Verdict-shape carve-out — do not exit before the 0.1c gate.** A request weighing whether to **adopt / switch to / replace** a *named external technology, library, pattern, platform, or architecture* for this project is a **software** decision even when it only names the tool and asks the bare question ("should we adopt Biome here?"). Classify it as **Software** and continue so the 0.1c gate below can catch it — do **not** route it to *Neither* or *Non-software*, which would skip the gate and lose the exact verdict-shape prompts that gate is for.

**If non-software brainstorming is detected:** Read `references/universal-brainstorming.md` now and follow it — it replaces Phases 0.2–4 entirely. Scope assessment, exploration moves, convergence, and the wrap-up menu for this route live there, not in this main body; improvising them produces an unstructured chat with no synthesis and no handoff. The non-software route does **not** write `artifact_contract: spec-unified-plan/v1` or `artifact_readiness: requirements-only`; those fields are reserved for software Product Contracts that can later become implementation-ready code plans. The **Core Principles and Interaction Rules in `references/interaction-rules.md` still apply unchanged** — including one-question-per-turn and the default to the platform's blocking question tool — and are the only part of this file that survives the route.

#### 0.1c Route a Verdict Question to spec-pov

A brainstorm scopes **what to build** once a direction is chosen. Deciding **whether to adopt, switch to, or replace** a *specific named external candidate* (technology, library, pattern, platform, or architecture) judged against this project is a different job — a decisive, project-grounded verdict, which is `spec-pov`'s purpose.

**The verdict shape — all three hold:** a **named external candidate** (one outside thing, or a bounded set the user already named like "X vs Y vs Z" — not an open field for *you* to enumerate); a **whether-to-commit intent** (adopt / switch to / migrate / replace / is-it-time-for / revisit — not "how should we design or scope Y"); judged **against this project** (fit, migration cost, worth it here), not a neutral explainer. Open-ended design or scoping where *you'd* invent the options stays here. The whether-to-commit trigger separates the two: "help me **pick** between X, Y, Z" is a verdict; "I'm **mulling** X, Y, Z" stays here.

**When the shape matches, the only exits are the offer or the workflow — never the verdict itself.** Offer the `spec-pov` handoff, or on decline continue this workflow unchanged. Do **not** resolve the adopt/switch answer yourself inside spec-brainstorm — writing the decision rule, weighing fit against this project, or asking the two questions that produce the verdict is spec-pov's job in the wrong workflow, even when you are confident you could answer it. An out-of-scope request is routed, not adopted. This holds with or without visible project context: "project configuration or repository context is unavailable" is a reason the verdict needs spec-pov's project grounding — not a license to answer from general knowledge or degrade into plain Q&A.

When the shape matches — at intake, or whenever later dialogue (Phases 1.3–2) clarifies a request into it — read `references/verdict-routing.md` and follow it: offer the `spec-pov` handoff interactively (never silently switch), invoke `spec-pov` on accept, drop the offer and continue the normal workflow unchanged on decline. The reference owns the offer construction, field mapping, and what to pass to `spec-pov`.

#### 0.2 Assess Whether Brainstorming Is Needed

**Clear requirements indicators:**
- Specific acceptance criteria provided
- Referenced existing patterns to follow
- Described exact expected behavior
- Constrained, well-defined scope

**If requirements are already clear:**
Keep the interaction brief. Confirm understanding and present concise next-step options rather than forcing a long brainstorm. Only write a short requirements-only unified plan when a durable handoff to planning or later review would be valuable. Skip Phase 1.1 and 1.2 entirely — still classify tier in Phase 0.3, then go straight to Phase 1.3 or Phase 2.5 and follow `references/synthesis-summary.md`'s Path A / Path B gate exactly. Do not assume the synthesis is announce-only: a richly pre-loaded prompt classifies as Standard or Deep, which routes to Path B (full scoping synthesis + confirmation), not Path A — collapsing that gate is the defect `synthesis-summary.md` warns against.

#### 0.3 Assess Scope

Use the feature description plus a light repo scan to classify the work:
- **Lightweight** - small, well-bounded, low ambiguity
- **Standard** - normal feature or bounded refactor with some decisions to make
- **Deep** - cross-cutting, strategic, or highly ambiguous

If the scope is unclear, ask one targeted question to disambiguate and then proceed.

**Deep sub-mode: feature vs product.** For Deep scope, also classify whether the brainstorm must establish product shape or inherit it:

- **Deep — feature** (default): existing product shape anchors decisions. Primary actors, core outcome, positioning, and primary flows are already established in the product or repo. The brainstorm extends or refines within that shape.
- **Deep — product**: the brainstorm must establish product shape rather than inherit it. Primary actors, core outcome, positioning against adjacent products, or primary end-to-end flows are materially unresolved. Existing code lowers the odds of product-tier but does not by itself rule it out — a half-built tool with ambiguous shape is still product-tier.

Product-tier triggers additional Phase 1.2 questions and additional Product Contract sections. Feature-tier uses the current Deep behavior unchanged.

**Visual and spatial decisions stay conversation-native.** Ask about a layout, state, flow, diagram, or interaction with a comparison table, state sequence, ASCII wireframe, or read-only source screenshot. Keep one question at a time and use the normal current-user confirmation path. When the answer is sufficient, close the affected Requirement, Acceptance Example, or Scope blocker normally. When real interaction or application state is indispensable, keep a named blocker and future evidence need. Do not generate HTML, CSS, or JavaScript, start a browser helper, or create a second artifact.

**Unfamiliarity tripwire.** If the user signals they lack working knowledge of the domain or the territory the topic touches — "I know nothing about X", "never touched the auth modules", "I don't know what's possible / what I should be asking" — read `references/blindspot-pass.md` now. Loading here is readiness only; the reference owns when the offer fires (territory-scoped, before the first substantive question into the flagged territory), the map's shape, and how mapped decisions re-enter the dialogue.
