### Phase 1: Understand the Idea

#### 1.1 Existing Context Scan

Scan the repo before substantive brainstorming. Match depth to scope:

Classify each load-bearing gap in run-local reasoning as a **source fact**, **current-user decision**, **open exploration**, or **planning-owned HOW**. This is not a persistent gap table. Before asking a source-sensitive question, name the gap, record the source attempt and direct refs, identify the Product Contract write target, and state what load-bearing WHAT planning would otherwise invent. For a pure product preference with no useful source, record `source_attempt: not-applicable` and the reason instead of performing ceremonial lookup.

**Lightweight** — Search for the topic, check if something similar already exists, and move on.

**Standard and Deep** — Two passes:

*Constraint Check (inline)* — Derive a run-local orientation from the current target repo/worktree immediately before use. Confirm the current git root/ref/HEAD and dirty state when available, then read the active project instructions, `STRATEGY.md` as the shared project strategy document when present, and root `CONCEPTS.md` when present as advisory vocabulary. Never reuse an orientation from another run, branch, or worktree. Reuse established language when it fits, but surface conflicts and preserve the Product Contract-local meaning instead of letting a filename or age silently decide. If git or a source is unavailable, record the concrete degraded fact, use only the bounded current sources that can be read, and do not claim complete or fresh project grounding. This pass stays in the main conversation so the dialogue can apply the calibration semantically.

*Topic Scan (grounding scout)* — Create an owner-only run-local directory with `umask 077` plus `mktemp -d "${TMPDIR:-/tmp}/spec-first-brainstorm.XXXXXX"`; reject a symlink/non-directory result, set mode `0700`, and recheck it before atomic publication. This is ephemeral scratch, never the only durable handoff evidence. Dispatch one extraction-tier sub-agent only when `worker_dispatch_authorization: authorized` and `worker_dispatch_capability: available`; otherwise run the same bounded scan inline or serially and record the matching fallback reason. Only an authorized background dispatch may proceed during the user's think-time without waiting. Scout prompt:

> Gather grounding for a requirements brainstorm about **{topic}** in this repo. Search first with the native file-search and content-search tools, then read targeted sections — budget ~20 reads, preferring ranges over whole files. Find: whether something similar already exists, the most relevant existing artifacts (brainstorms, plans, specs, feature docs), adjacent examples of similar behavior, and the current state of anything the topic would touch (tables, routes, config, dependencies). Write a **grounding dossier** to `{scratch-dir}/grounding.md`: at most 150 lines of verbatim quotes and short code snippets, each with a `file:line` pointer. Extraction only — quote what the repo says; do not interpret or propose. If the topic has little footprint, write less rather than padding. Return only a gist: 3-5 lines summarizing what the dossier holds, plus its absolute path.

Carry only the gist in the dialogue. When the conversation needs specifics the gist can't answer — the user challenges a claim, an approach needs grounding — read the dossier on demand: it is a condensed, verified quote-sheet, always cheaper than re-scanning raw files. Downstream consumers (the Phase 2.6 verifier, the spec-plan handoff) receive the dossier path, not its contents. If the scout has not returned by the time Phase 2 needs it, wait for it then.

If the scan and scout surface nothing relevant, say so and continue. Two rules govern technical depth during the scan:

1. **Verify before claiming** — When the brainstorm touches checkable infrastructure (database tables, routes, config files, dependencies, model definitions), read the relevant source files to confirm what actually exists. Any claim that something is absent — a missing table, an endpoint that doesn't exist, a dependency not in the Gemfile, a config option with no current support — must be verified against the codebase first; if not verified, label it as an unverified assumption. This applies to every brainstorm regardless of topic.

2. **Defer design decisions to planning** — Implementation details like schemas, migration strategies, endpoint structure, or deployment topology belong in planning, not here — unless the brainstorm is itself about a technical or architectural decision, in which case those details are the subject of the brainstorm and should be explored.

**Slack context** (opt-in, Standard and Deep only) — never auto-dispatch. Route by condition:

- **Tools available + user asked**: Read `references/agents/slack-researcher.md`. If the Dispatch Authorization Boundary is satisfied, dispatch a generic subagent seeded with that local prompt plus a brief summary of the brainstorm topic alongside Phase 1.1 work; otherwise perform the bounded research inline and record the matching fallback reason. Do not dispatch a standalone agent by type/name. Incorporate findings into constraint and context awareness.
- **Tools available + user didn't ask**: Note in output: "Slack tools detected. Ask me to search Slack for organizational context at any point, or include it in your next prompt."
- **No tools + user asked**: Note in output: "Slack context was requested but no Slack tools are available. Install and authenticate the Slack plugin to enable organizational context search."

#### 1.2 Product Pressure Test

Before generating approaches, scan the user's opening for rigor gaps. This is agent-internal analysis, not a user-facing checklist: read the opening, note which gaps actually exist, and raise only those during Phase 1.3 — folded into the normal flow of dialogue, not fired as a pre-flight gauntlet. A fuzzy opening may earn three or four probes; a concrete, well-framed one may earn zero because no scope-appropriate gaps were found.

Read `references/product-pressure-test.md` for the per-tier lens catalog (Lightweight / Standard / Deep / Deep-product) and the synthesis questions the agent weighs in its own reasoning. Match depth to the Phase 0.3 scope. Phase 1.3 owns how each found gap fires as a probe.

#### 1.3 Collaborative Dialogue

Follow `references/interaction-rules.md`. Use the platform's blocking question tool when available.

**Blindspot gate — check it before probing flagged territory.** If the Phase 0.3 unfamiliarity tripwire fired, fire the blindspot offer from `references/blindspot-pass.md` before the first substantive question into the flagged territory (questions about the user's own problem, users, and evidence proceed normally — the gate is territory-scoped). The gate also arms mid-dialogue without a tripwire: when two consecutive answers show the user *cannot evaluate* the question's substance — not merely hasn't decided — read the reference and offer the pass then. Never silently switch into teaching; the offer is a blocking question.

**Guidelines:**
- Ask what the user is already thinking before offering your own ideas. This surfaces hidden context and prevents fixation on AI-generated framings.
- Start broad (problem, users, value) then narrow (constraints, exclusions, edge cases)
- **Rigor probes fire before Phase 2 and are open-ended, not menus.** Each scope-appropriate gap found in Phase 1.2 fires as a **separate** direct open-ended probe — one probe satisfies one gap, not multiple. Surface them progressively across the conversation — interleaving with narrowing moves is fine — as long as every gap found in Phase 1.2 has been probed before Phase 2. A menu would signal which kinds of evidence count and let the user pick rather than produce; an open probe forces real observation or surfaces real uncertainty. Each of Phase 1.2's "when present, ask..." lines is the probe; phrase it per Interaction Rule 6. **Attachment is the final rigor probe before Phase 2 when that gap is present — presence is judged from the opening per Phase 1.2, and narrowing having already produced a shape is not a reason to skip it; its job is to pressure-test the user's implicit framing before Phase 2 inherits it.** If a probe's answer reveals genuine uncertainty, record it as an explicit assumption in the Product Contract rather than skipping the probe.
- Clarify the problem frame, validate assumptions, and ask about success criteria
- Make requirements concrete enough that planning will not need to invent behavior
- Surface dependencies or prerequisites only when they materially affect scope
- Resolve product decisions here; leave technical implementation choices for planning
- Bring ideas, alternatives, and challenges instead of only interviewing

**Before exiting Phase 1.3: integration check.** Mentally combine what the user has said so far and surface any non-obvious consequences the dialogue hasn't probed. If user-stated X plus user-stated Y plus your-default-Z produces a downstream effect the user is unlikely to have tracked through one-question-at-a-time dialogue ("if mute lives on the rule AND we don't warn on delete, then rule-delete silently loses pause state"), probe it now while you're still in dialogue. One probe per genuine combination effect, asked open-ended, same discipline as rigor probes. Phase 2.5's call-outs are a safety net for residuals (silent agent inferences, pre-loaded contexts with no dialogue) — NOT a punt list for consequences you could have asked about now.

**Exit condition:** Exit Phase 1.3 when each of these holds, OR the user explicitly wants to proceed: the primary actor/user is identified or marked unknown; the desired outcome is stated; the in-scope and out-of-scope boundaries that matter are known; success criteria or acceptance signals are known or recorded as assumptions; every Phase 1.2 gap found has been probed or recorded as an assumption; and no integration-check question is pending.
