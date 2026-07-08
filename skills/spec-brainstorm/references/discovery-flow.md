# Discovery Flow

Use this reference for Phase 0 and Phase 1: resume, domain classification, scope sizing, product pressure test, and collaborative dialogue.

## Core Principles

These govern every brainstorm, software and non-software:

1. **Assess scope first** - match the amount of ceremony to the size and ambiguity of the work.
2. **Be a thinking partner** - suggest alternatives, challenge assumptions, and explore what-ifs instead of only extracting requirements.
3. **Resolve product decisions here** - user-facing behavior, scope boundaries, and success criteria belong in this workflow; detailed implementation belongs in planning.
4. **Keep implementation out of the requirements doc by default** - no libraries, schemas, endpoints, file layouts, or code-level design unless the brainstorm is itself about a technical or architectural change.
5. **Right-size the artifact** - simple work gets a compact requirements document or brief alignment; larger work gets a fuller document. Do not add ceremony that does not help planning.
6. **Apply YAGNI to carrying cost, not coding effort** - prefer the simplest approach that delivers meaningful value; avoid speculative complexity, but low-cost polish worth keeping when its ongoing cost is small.

## Phase 0: Resume, Assess, And Route

Resume existing work when the user references an existing brainstorm topic or document, or there is an obvious recent matching `*-requirements.md` file under `docs/brainstorms/`. Read it, confirm whether to continue or start fresh, and update the existing document when resuming.

Classify whether this is a software task before continuing. Software tasks reference code, repositories, APIs, databases, or ask to build, modify, debug, deploy, or architect software. Non-software brainstorming uses `references/universal-brainstorming.md` and skips the software-specific phases. Quick-help requests, error messages, factual questions, or single-step tasks that do not need brainstorming should be answered directly.

Assess whether brainstorming is needed. If requirements are already clear, keep the interaction brief: confirm understanding, present concise next-step options, and write a short document only when durable handoff is useful. Skip Phase 1.1 and 1.2, then use Phase 2.5 announce-mode or Phase 3 as appropriate.

Run the Multi-Scope Split Check before detailed product probes when the opening appears to bundle several independent outcomes. Signals include multiple actor journeys, multiple separately valuable capabilities, product work mixed with platform/governance work, or a likely requirements set too large for one safe `spec-plan` handoff. This is LLM-owned scope triage, not task decomposition.

If the check fires, pause detailed questioning. Name 2-4 candidate sub-scopes by user outcome or scope boundary, not implementation module. Recommend the smallest, highest-value slice that can produce an independently plannable requirements document. Ask the user to pick that slice, narrow differently, or explicitly keep the broader scope. Continue the brainstorm only for the selected slice; carry sibling scopes as out of scope or future follow-up. Do not build a roadmap, implementation module split, or plan waves.

Assess scope from the feature description plus a light repo scan:

- Lightweight: small, bounded, low ambiguity.
- Standard: normal feature or bounded refactor with some decisions.
- Deep: cross-cutting, strategic, or highly ambiguous.

For Deep scope, classify feature-tier vs product-tier. Deep-feature inherits product shape. Deep-product must establish product shape: primary actors, core outcome, positioning, or end-to-end flows are materially unresolved.

If the feature is inherently visual or spatial -- drawing/canvas tools, annotation behavior, visual editors, UI layout or navigation, interaction states, charts, diagrams, animation, maps, timelines, or spatial flows -- read `references/visual-probes.md` before the first shape, behavior, state, layout, flow, or diagram decision. The reference owns the text-vs-visual offer, helper invocation, and display-only feedback contract.

## Phase 1.2 Product Pressure Test

Before generating approaches, scan the user's opening for rigor gaps. This is agent-internal analysis, not a user-facing checklist. Raise only gaps that actually exist during Phase 1.3, folded into normal dialogue.

Lightweight:

- Is this solving the real user problem?
- Are we duplicating something already covered?
- Is there a better framing with near-zero extra cost?

Standard gaps:

- Evidence gap: the opening asserts want or need without observable evidence. When present, ask for the most concrete thing someone has already done about this. For engineering evolution of an existing product or system, this gap is N/A by default because the product's existence already answers whether anyone wants it; raise it only when the change's own value is doubtful.
- Specificity gap: the beneficiary is too abstract. Ask for a specific person or narrow segment and what changes for them when this ships.
- Counterfactual gap: the opening hides what users do today or what changes if nothing ships. Ask for the current workaround and cost. Same N/A-by-default rule for engineering-evolution brainstorms: the relevant counterfactual is current technical behavior, not market behavior.
- Attachment gap: the opening treats a solution shape as the thing being built. Ask what smallest version still delivers real value and what is excluded.

Also weigh whether a nearby framing creates more user value without more carrying cost, and what the single highest-leverage move is now: the request as framed, a reframing, one adjacent addition, a simplification, or doing nothing.

Deep adds: is this a local patch, or does it move the broader system toward where it wants to be?

Deep-product adds durability and identity pressure: how the idea fares under plausible near-term shifts, what adjacent product we could accidentally build instead, and what would have to be true for the product thesis to fail.

## Phase 1.3 Collaborative Dialogue

Follow `references/interaction-rules.md`. Ask what the user is already thinking before offering your own ideas. Start broad, then narrow. Bring alternatives and challenges instead of only interviewing.

Rigor probes fire before Phase 2 and are prose, not menus. Narrowing is legitimate, but Phase 1 cannot end with un-probed rigor gaps. Each scope-appropriate gap from Phase 1.2 fires as a separate direct prose probe. Surface probes progressively; each probe satisfies one gap, not multiple. For engineering-evolution work, evidence and counterfactual are N/A by default, so mandatory probes usually converge on specificity and attachment.

Examples:

- Evidence: "What's the most concrete thing someone's already done about this - paid, built a workaround, quit a tool over it?"
- Specificity: "Can you name a team you've actually watched hit this, or are you reasoning?"
- Counterfactual: "What do teams do today when this breaks - who reconciles?"
- Attachment: "Before we move to shapes or approaches, what's the smallest version that would still prove the bet right, and what's excluded?"
- Durability: "Under the most plausible near-term shifts, how does this bet hold?"

When the attachment gap is present, attachment is the final rigor probe before Phase 2. Fire it regardless of whether a specific shape has already emerged through narrowing; its job is to pressure-test the user's implicit framing of the product before Phase 2 inherits it.

If the answer reveals genuine uncertainty, record it as an explicit assumption in the requirements document rather than skipping the probe.

Before Phase 2, Standard and Deep brainstorms do an internal material-branch check from `references/interaction-rules.md`. Ask only when an unresolved parent branch would force `spec-plan` to invent WHAT, success, non-goals, or handoff context. Technical HOW or implementation-time unknowns can be deferred to planning with an explicit note.
