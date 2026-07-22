---
name: spec-brainstorm
description: 'Explore vague or ambitious ideas into a right-sized requirements-only unified plan. Use when the user wants to brainstorm, think through scope, decide what to build, or needs collaborative product framing before planning. Also use when the user must scope work in territory they say they do not know ("I know nothing about X but need to...") or asks for a blindspot pass — mapping the decision surface before questions begin. Not for executing already-specified work — direct implementation, debugging, or code review where no product scope is left to decide. Not for a decisive verdict on whether to adopt or switch to a specific external technology, library, or platform — brainstorming scopes what to build, not whether to commit to an outside option.'
argument-hint: "[feature idea or problem to explore] [output:html]"
---

# Brainstorm a Feature or Improvement

Note: Use the current date from the active host context. Use this when weighting external sources and dating artifacts.

Brainstorming helps answer **WHAT** to build through collaborative dialogue. It precedes `spec-plan`, which enriches the same unified plan artifact with **HOW** to build it.

The durable output of this workflow is a **requirements-only unified plan**. In other workflows this might be called a lightweight PRD or feature brief. In spec-first, keep the workflow name `brainstorm`, but write the first version of the plan artifact under `docs/plans/` with `artifact_readiness: requirements-only` so planning does not need to invent product behavior, scope boundaries, or success criteria.

This skill does not implement code. It explores, clarifies, and documents decisions for later planning or execution.

## Workflow Contract Summary

- **输入：** 尚未收敛的产品想法、问题、目标用户、约束，以及可回源的仓库或外部证据。
- **输出：** `artifact_readiness: requirements-only` 的统一计划，明确 Product Contract、范围边界、成功标准、未决问题与证据限制。
- **硬出口：** 关键产品决定未确认、目标仓库或文档 owner 不明确、证据不足以支撑声明，或请求已属于规划、实现、调试、审查时停止并交还 owning route。
- **权威：** 用户确认产品语义；LLM 负责探索与语义综合；脚本和 provider 只准备 advisory facts。该 workflow 不授权实现、commit 或 landing。
- **消费者：** `spec-plan`、`spec-doc-review`、产品 owner 与后续需求/规划审查者。

## Core Principles

1. **Assess scope first** - Match the amount of ceremony to the size and ambiguity of the work.
2. **Be a thinking partner** - Suggest alternatives, challenge assumptions, and explore what-ifs instead of only extracting requirements.
3. **Resolve product decisions here** - User-facing behavior, scope boundaries, and success criteria belong in this workflow. Detailed implementation belongs in planning.
4. **Keep implementation out of the Product Contract by default** - Do not include libraries, schemas, endpoints, file layouts, or code-level design unless the brainstorm itself is inherently about a technical or architectural change.
5. **Right-size the artifact** - Simple work gets a compact requirements-only unified plan or brief alignment. Larger work gets a fuller Product Contract. Do not add ceremony that does not help planning.
6. **Apply YAGNI to carrying cost, not coding effort** - Prefer the simplest approach that delivers meaningful value. Avoid speculative complexity and hypothetical future-proofing, but low-cost polish or delight is worth including when its ongoing cost is small and easy to maintain.
7. **Keep product confirmation singular** - The current conversation user is the only human product confirmer. Ask one highest-impact independent product question at a time; specialist material is evidence, not a second confirmation route.

## Interaction Rules

These rules apply to every brainstorm, including the universal (non-software) flow routed to `references/universal-brainstorming.md`.

1. **Ask one question at a time** - One question per turn, even when sub-questions feel related. Stacking several questions in a single message produces diluted answers; pick the single most useful one and ask it.
2. **Prefer single-select multiple choice** - Use single-select when choosing one direction, one priority, or one next step.
3. **Use multi-select rarely and intentionally** - Use it only for compatible sets such as goals, constraints, non-goals, or success criteria that can all coexist. If prioritization matters, follow up by asking which selected item is primary.
4. **Default to the platform's blocking question tool** - Use `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex. These tools include a free-text fallback, so well-chosen options scaffold the answer without confining it. This default holds for opening and elicitation questions too, not only narrowing. Fall back to numbered options in chat only when no blocking tool exists in the harness (including `ToolSearch` returning no match for it) or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.
5. **Use an open-ended question only when the question is genuinely open** - Drop the blocking tool when the answer is inherently narrative, when presented options would steer a diagnostic or introspective answer, or when you cannot write 3-4 genuinely distinct, plausibly-correct options without padding. The test: if you'd be straining to fill the option slots, the question is open — ask it open-ended. Rule 1 still applies: one question per turn.
6. **Open-ended questions earn their place only when they're specific enough to elicit a substantive answer** - Apply Rule 5 silently: just ask the question, never narrate the form choice. The question must give the user something concrete to anchor on. Good: *"What's the most concrete thing someone's already done about this — paid for it, built a workaround, quit a tool over it?"* — it names what counts as an answer. Too thin: *"What's your take?"* — nothing to bite into, and framings that imply a short answer ("briefly", yes/no) waste the open question the same way.

## Output Guidance

- **Prioritize decision-relevant detail** - Preserve the facts, tradeoffs, and caveats needed for the next decision; trim introductions, repetition, and optional background first.

## Dispatch Authorization Boundary

在派发 grounding scout、claim verifier、Slack researcher 或 repo profiler 前，记录两个彼此独立的 run-local 事实：

```yaml
worker_dispatch_authorization: authorized | missing
worker_dispatch_capability: available | missing
```

`workflow invocation does not authorize dispatch`。只有当前用户或可见 upstream handoff 明确请求 subagent、delegated work、persona 或 parallel work 时，`worker_dispatch_authorization` 才是 `authorized`；工具存在、权限设置、brainstorm tier、用户请求搜索某个来源或本 Skill 被调用，都不构成派发授权。缺授权时 inline 或 serial 执行并记录 `dispatch_authorization_missing`；已有授权但当前宿主没有 callable worker primitive 时 inline 或 serial 执行并记录 `subagent_capability_missing`。Inline fallback 可以保留同一 evidence budget，但不得声称 fresh-context、independent scout 或 multi-agent coverage。

## Model Tiers

Sub-agent dispatch is tiered by task shape, never hardcoded to a model name. When dispatching the Phase 1.1 grounding scout, the Phase 2.6 claim verifier, or the opt-in Slack researcher, read `references/model-tiers.md` for the tier definitions (extraction / generation / ceiling) and the degradation rule for platforms without per-agent model selection or with no subagent primitive at all.

## Feature Description

<feature_description> #$ARGUMENTS </feature_description>

**If the feature description above is empty, ask the user:** "What would you like to explore? Please describe the feature, problem, or improvement you're thinking about."

Do not proceed until you have a feature description from the user.

## Execution Flow

### Phase 0: Resume, Assess, and Route

#### 0.0 Resolve Output Mode

Determine `OUTPUT_FORMAT` before any other phase fires. Output mode is **exclusive** — the requirements-only unified plan is written as either markdown (`.md`) OR HTML (`.html`), never both. Precedence: in-prompt request > user-stated preference > config > default (`md`), with a hard pipeline-mode override.

**Read config.** The repo root is pre-resolved at skill load:
!`git rev-parse --show-toplevel`

If the line above is an absolute path, use it as `<repo-root>`. If it is empty, shows an error, or still shows a backtick command string (a harness that did not run the pre-resolution), resolve `<repo-root>` at runtime by running `git rev-parse --show-toplevel` with the shell tool. Then read `<repo-root>/.spec-first/config.local.yaml` with the native file-read tool. If the root cannot be resolved (not a git repo) or the file does not exist, fall through to the defaults below.

Resolution steps:

1. **In-prompt request.** Reason over the user's prompt for this run for a request about *this document's* output format, expressed either as the `output:` shorthand or in plain language ("make this a webpage", "I want this in HTML"). On an explicit format, match it case-insensitively to `md`/`html`, and ignore the `output:` shorthand token when reading the rest of the prompt as the feature description. Distinguish a request about the document's format from a format named as subject matter: "explore an HTML export feature" is the work, not a doc-format request — do not switch on it.
   - `output:` alone (no value) → no-op, fall through to step 2.
   - `output:<unknown>` (e.g., `output:pdf`) → drop the token, fall through to step 2, and remember to emit a one-line note above the post-generation menu after final resolution: `Ignored unknown output: value '<value>' — using <resolved_format> instead.` where `<resolved_format>` is the value `OUTPUT_FORMAT` actually resolved to after the remaining precedence steps. Do not hardcode `md` in the note — that misleads users when config has set HTML.
2. **User-stated preference.** If this prompt holds no format request, honor an output-format preference (markdown vs HTML) the user established earlier — earlier in this session, in your memory, or written into their active instructions — that is already in your context (match `md`/`html` case-insensitively). A remembered preference is more current than the rarely-edited config, so it **overrides** the config in step 3. Do not open or search instruction files to find it — act only on a preference already present in your context; if none is, fall through to the config.
3. **Config.** If steps 1-2 did not resolve and the config file read above has an **active (non-commented)** `brainstorm_output:` key whose value matches `md` or `html` (case-insensitive), use it. Missing, invalid, or commented values fall through silently. Critical: lines starting with `#` are YAML comments and must be ignored — the shipped config template includes commented examples like `# brainstorm_output: html` to document the option, and matching those as active settings would silently force HTML mode on every run without the user having opted in.
4. **Default.** Otherwise `OUTPUT_FORMAT=md`.
5. **Pipeline override.** When invoked from LFG or any `disable-model-invocation` context, force `OUTPUT_FORMAT=md` regardless of steps 1-4. Downstream consumers (`spec-plan`, `spec-work`) parse markdown reliably; HTML in pipeline runs is unnecessary friction.

**Token-parsing convention:** only literal-prefix flag tokens (`output:`, `mode:`, `delegate:` where applicable) are consumed and stripped. Other `<word>:<word>` tokens — including conventional commit prefixes like `feat:`, `fix:`, `chore:` that may appear inside a feature description — pass through verbatim.

**Resolve the format here; load the rendering reference at Phase 3, not now.** The format-rendering reference (`references/markdown-rendering.md` for `md`, `references/html-rendering.md` for `html`) is consumed only when the doc is composed — loading it during Phase 0 would carry 200+ lines through the entire dialogue. Phase 3 names the load. Section content is the same in either format; presentation differs.

The `output:` preference does NOT auto-propagate to `spec-plan` on handoff — spec-plan re-resolves its own `plan_output` config independently. Because both skills now operate on the same unified artifact, an explicit conversion by `spec-plan` must report the old path and new canonical path; pipeline mode may force markdown by writing the canonical markdown plan path and leaving any HTML sibling untouched as non-canonical for automated discovery.

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

**If non-software brainstorming is detected:** Read `references/universal-brainstorming.md` now and follow it — it replaces Phases 0.2–4 entirely. Scope assessment, exploration moves, convergence, and the wrap-up menu for this route live there, not in this main body; improvising them produces an unstructured chat with no synthesis and no handoff. The non-software route does **not** write `artifact_contract: spec-unified-plan/v1` or `artifact_readiness: requirements-only`; those fields are reserved for software Product Contracts that can later become implementation-ready code plans. The **Core Principles and Interaction Rules above still apply unchanged** — including one-question-per-turn and the default to the platform's blocking question tool — and are the only part of this file that survives the route.

#### 0.1c Route a Verdict Question to spec-pov

A brainstorm scopes **what to build** once a direction is chosen. Deciding **whether to adopt, switch to, or replace** a *specific named external candidate* (technology, library, pattern, platform, or architecture) judged against this project is a different job — a decisive, project-grounded verdict, which is `spec-pov`'s purpose.

**The verdict shape — all three hold:** a **named external candidate** (one outside thing, or a bounded set the user already named like "X vs Y vs Z" — not an open field for *you* to enumerate); a **whether-to-commit intent** (adopt / switch to / migrate / replace / is-it-time-for / revisit — not "how should we design or scope Y"); judged **against this project** (fit, migration cost, worth it here), not a neutral explainer. Open-ended design or scoping where *you'd* invent the options stays here. The whether-to-commit trigger separates the two: "help me **pick** between X, Y, Z" is a verdict; "I'm **mulling** X, Y, Z" stays here.

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

### Phase 1: Understand the Idea

#### 1.1 Existing Context Scan

Scan the repo before substantive brainstorming. Match depth to scope:

Classify each load-bearing gap in run-local reasoning as a **source fact**, **current-user decision**, **open exploration**, or **planning-owned HOW**. This is not a persistent gap table. Before asking a source-sensitive question, name the gap, record the source attempt and direct refs, identify the Product Contract write target, and state what load-bearing WHAT planning would otherwise invent. For a pure product preference with no useful source, record `source_attempt: not-applicable` and the reason instead of performing ceremonial lookup.

**Lightweight** — Search for the topic, check if something similar already exists, and move on.

**Standard and Deep** — Two passes:

*Constraint Check (inline)* — Source the agnostic orientation (STRATEGY summary, CONCEPTS vocabulary, conventions) from the shared repo-grounding profile cache instead of re-reading those files every run. Set `SKILL_DIR` to this skill's directory and run the helper (full protocol in `references/repo-profile-cache.md`):

```bash
SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
python3 "$SKILL_DIR/scripts/repo-profile-cache.py" get
```

On `HIT`, load the profile JSON and take the agnostic orientation from it — `conventions.strategy` for the STRATEGY summary, `vocabulary` for advisory CONCEPTS terms, and `conventions` (coding standards, testing, review process, instruction files) for workflow/product/scope constraints; do not re-read those files. On `MISS`, dispatch a generic subagent with `references/agents/repo-profiler.md` only when the Dispatch Authorization Boundary is satisfied; otherwise derive the profile inline and record the matching fallback reason. An authorized profiler writes its JSON to a file, then persist with `python3 "$SKILL_DIR/scripts/repo-profile-cache.py" put <file>` (re-set `SKILL_DIR` in that call — shell vars don't persist between Bash invocations), and use the same fields. On `NO-CACHE`, derive the orientation inline and skip the `put`. The cache is an optimization, never a correctness dependency: if it is unavailable, or any cached field is absent/null, fall back to reading the source inline — the project's active instructions and conventions already in your context for workflow, product, or scope constraints (no need to open or name specific instruction files); `STRATEGY.md` if it exists; and `CONCEPTS.md` at repo root if it exists as an advisory calibration source. Reuse established language when it fits, but surface conflicts and preserve the Product Contract-local meaning instead of letting a filename or age silently decide. If any source adds nothing, move on. This pass stays in the main conversation so the dialogue can apply the calibration semantically.

*Topic Scan (grounding scout)* — Create a scratch dir at `/tmp/spec-first/spec-brainstorm/<run-id>/` (short unique slug). Dispatch one extraction-tier sub-agent only when `worker_dispatch_authorization: authorized` and `worker_dispatch_capability: available`; otherwise run the same bounded scan inline or serially and record the matching fallback reason. Only an authorized background dispatch may proceed during the user's think-time without waiting. Scout prompt:

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

Follow the Interaction Rules above. Use the platform's blocking question tool when available.

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

### Phase 2: Explore Approaches

If multiple plausible directions remain, propose **2-3 concrete approaches** based on research and conversation. Otherwise state the recommended direction directly.

Use at least one non-obvious angle — inversion (what if we did the opposite?), constraint removal (what if X weren't a limitation?), or analogy from how another domain solves this. The first approaches that come to mind are usually variations on the same axis. Hold each approach to an anti-genericness test: if it would appear in a generic listicle for this problem category, sharpen it against the grounding dossier or drop it.

Present approaches first, then evaluate. Let the user see all options before hearing which one is recommended — leading with a recommendation before the user has seen alternatives anchors the conversation prematurely.

If approach differences are spatial, behavioral, or otherwise visual, present the smallest conversation-native comparison that preserves the decision: a table, numbered states, or ASCII wireframe. A sufficient current-user answer closes the same Product Contract target as any other product decision.

When useful, include one deliberately higher-upside alternative:
- Identify what adjacent addition or reframing would most increase usefulness, compounding value, or durability without disproportionate carrying cost. Present it as a challenger option alongside the baseline, not as the default. Omit it when the work is already obviously over-scoped or the baseline request is clearly the right move.

At product tier, alternatives should differ on *what* is built (product shape, actor set, positioning), not *how* it is built. Implementation-variant alternatives belong at feature tier.

For each approach, provide:
- Brief description (2-3 sentences)
- Pros and cons
- Key risks or unknowns
- When it's best suited

**Approach granularity: mechanism / product shape, not architecture.** Approach descriptions name mechanism-level distinctions ("pause as a rule property" vs "pause as an event filter" vs "pause as a separate entity") and product-relevant trade-offs (plan-tier coupling, complexity surface, migration difficulty). They do NOT name implementation specifics — column names, table names, file paths, service classes, JSON shapes, exact method names. Those are spec-plan's job. Bringing architecture forward at brainstorm time forces the user to make architectural decisions on spec-brainstorm's intentionally-shallow research, and the synthesis at Phase 2.5 then has to filter out the leak.

After presenting all approaches, state your recommendation and explain why. Prefer simpler solutions when added complexity creates real carrying cost, but do not reject low-cost, high-value polish just because it is not strictly necessary.

If one approach is clearly best and alternatives are not meaningful, skip the menu and state the recommendation directly.

If relevant, call out whether the choice is:
- Reuse an existing pattern
- Extend an existing capability
- Build something net new

### Phase 2.5: Synthesis Summary

Before synthesis for Standard or Deep behavioral work, complete the relevance-driven scenario pass in `references/product-pressure-test.md`. Keep only dimensions that materially change an Acceptance Example, Resolve Before Planning / Outstanding Question, explicit assumption, or Non-Goal.

**STOP. Before composing the synthesis, read `references/synthesis-summary.md`.** The two-stage shape (internal three-bucket draft → chat-time scoping synthesis), the four scoping synthesis sections with their keep tests, the per-bullet affirmability and detail tests, the tier-aware bullet budget with re-cut rule, anti-pattern guidance, soft-cut behavior, self-redirect support, and internal-draft routing into doc body sections all live there — none of them appear in this main body. Composing a synthesis without these rules loaded reliably produces malformed output: the full internal three-bucket draft pasted verbatim into chat, implementation detail leaking into the scoping synthesis, the proposal-pitch anti-pattern. The Path A / Path B routing below decides only *whether* a confirmation fires — it is not the synthesis spec.

Surface a scoping synthesis to the user before Phase 3 writes the requirements-only unified plan — the user's last opportunity to correct scope before the artifact lands. The scoping synthesis is shaped like what two product collaborators would confirm before writing a PRD, not like a comprehensive audit or a one-line preview.

Fires for **all tiers** including Lightweight. Skip Phase 2.5 entirely on the Phase 0.1b non-software (universal-brainstorming) route.

**Path A vs Path B** is decided by `references/synthesis-summary.md` from two signals: whether any blocking question fired, and the Phase 0.3 tier. Path A (announce-only, no confirmation) fires **solely** for Lightweight tier with no blocking questions; every other case — including a richly pre-loaded Standard/Deep opener that needed no dialogue — is Path B (full tier-aware scoping synthesis with an unconditional confirmation gate). Follow the reference's gate exactly; do not decide the path or compose the synthesis from memory.

#### 2.6 Claim Verification (inside the Path B confirmation wait)

When the upcoming Product Contract will assert checkable claims about the repo — absence claims ("no retry logic exists"), references to specific files, config, or dependencies, anything planning would build on — use one generation-tier verifier only when the Dispatch Authorization Boundary is satisfied. An authorized verifier may start when the Path B confirmation question goes up so it runs during the user's think-time. Without authorization or capability, verify the same claim list inline before Phase 3 and record the matching fallback reason; do not present that self-check as fresh-context verification. Pass a dispatched verifier the claim list (one line each), the grounding dossier path if one exists, and this instruction: verify each claim directly against the codebase — budget ~15 targeted reads — and return a per-claim verdict: **confirmed** (with `file:line`), **refuted** (with the contradicting evidence), or **unverifiable**. Do not block the confirmation question on an authorized verifier.

Consume the verdicts at Phase 3: correct refuted claims before writing, label unverifiable ones as explicit assumptions. Only a dispatched fresh-context verifier provides independent verification because it did not see the dialogue. Inline fallback is a bounded author self-check and must retain that coverage limitation.

Skip when Path A fires, when the doc will make no checkable claims, or on the non-software route. If the verifier dispatch fails, fall back to verifying the claims inline before the Phase 3 write — Phase 1.1's verify-before-claiming rule still holds either way.

### Phase 3: Capture the Requirements-Only Unified Plan

Write or update a requirements-only unified plan only when the conversation produced durable decisions worth preserving — see `references/brainstorm-sections.md` "Decide whether a doc is warranted at all" for the criteria and the bug-fix stress test. Skip document creation when the user only needs brief alignment and the decisions can flow downstream (spec-plan, commit message, docs/solutions/) without a brainstorm artifact in the middle.

When a doc is warranted, compose it using:

- `references/brainstorm-sections.md` — section contract (unified plan skeleton contract, Product Contract hard floor, include-when-material catalog, agency rules, ID conventions).
- The format-specific rendering reference for the `OUTPUT_FORMAT` resolved at Phase 0.0 — read `references/markdown-rendering.md` (md) or `references/html-rendering.md` (html) **now**, before composing. It defines how the format presents the sections and was deliberately deferred from Phase 0.0; composing without it produces format drift the section contract alone cannot prevent.

**Write tight.** A section being material is not license to pad it. Hold every kept section to the prose-economy discipline in `references/brainstorm-sections.md`: lead with the decision or outcome, one idea per sentence, a requirement is intent plus at most one qualifier, defer forks to Outstanding Questions rather than specifying both arms, resolve superseded text in place rather than stacking strata. Before declaring the doc written, run the named test there — could a reader find a contradiction in each section in one pass?

Write to `docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.<md|html>` — extension follows `OUTPUT_FORMAT`. Include `artifact_contract: spec-unified-plan/v1`, `artifact_readiness: requirements-only`, `product_contract_source: spec-brainstorm`, and `execution: code`. Only when `OUTPUT_FORMAT=md`, also include `status: active`; HTML output does not carry lifecycle metadata. Title is `<Name> - Plan` (matching the H1; no conventional-commit prefix). Keep the doc light and standalone-readable: a Goal Capsule (objective, product authority, open blockers) and the Product Contract. Do **not** emit a Goal Launch Block or Reader Index. See `references/brainstorm-sections.md` — which owns the artifact content rules, including repo-relative file paths inside the doc. When confirming in chat, report the written artifact with its absolute path so the reference is clickable.

If the run pauses, becomes headless, or approaches a context reset after any durable decision, write or update this artifact before stopping. Preserve confirmed decisions and assumptions plus load-bearing source refs, source snapshot or observed version, limitations, invalidation conditions, named blockers, and the next highest-impact question with its Product Contract write target. Never fabricate current-user closure or turn `status: active` into per-unit progress.

#### Project-level promotion candidates — after Product Contract-local closure

Never create or modify `CONCEPTS.md`, a project glossary, `CONTEXT.md`, `CONTEXT-MAP.md`, or ADR files in this workflow. Existing project language is an advisory calibration source; if it conflicts with the current release slice, expose the conflict and close the required meaning inside the Product Contract.

Only when a resolved term or decision clearly has cross-release reuse value, append a **project-level promotion candidate** to the Product Contract or closeout. Include target kind/path, proposed meaning, provenance, applicability scope, a real consumer, reuse rationale, invalidation condition, and the statement `not written by this workflow`. ADR candidates additionally require all three: hard to reverse, surprising without context, and a real tradeoff. If any qualification is missing, keep the result Product Contract-local. A later explicit knowledge-maintenance or document-editing request owns any mutation; do not auto-dispatch it.

### Phase 4: Handoff

Read `references/handoff.md` now — before presenting any options. The option set and its visibility conditions, the rendering-mode rule, the per-selection dispatch instructions (including what gets passed to `spec-plan`), and the closing summary formats all live there — none of them appear in this main body. An improvised menu silently breaks pipeline routing: options surface in states where they must be hidden, and downstream skills receive the wrong payload.
