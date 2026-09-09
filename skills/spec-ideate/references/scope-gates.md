# Ideation scope gates

### Phase 0: Resume and Scope

**Refine-vs-generate check (run before anything else in this phase).** If the user already holds one idea and asks to refine, converge, scope, or turn it into requirements, that is `spec-brainstorm`'s work, not ideation: stop and point the user to `spec-brainstorm`; do not run brainstorm-flavored questioning or requirement convergence inside this workflow. This workflow starts only when the user wants candidate directions generated and evaluated.

When the subject, mode, and format are already clear from the prompt, resolve this phase in one pass and move on — the gates below exist for ambiguity, not ceremony.

#### 0.0 Resolve Output Mode

Determine `OUTPUT_FORMAT` for the ideation artifact this run might persist. Output mode is **exclusive** — the ideation doc is written as either HTML (`.html`) OR markdown (`.md`), never both. Precedence: in-prompt request > user-stated preference > config > default (`html`), with a hard pipeline-mode override.

Unlike `spec-plan` and `spec-brainstorm` (which default to `md`), spec-ideate defaults to **`html`** — ideation artifacts are read mainly by humans weighing candidate directions, and a rich self-contained HTML file (with illustrative diagrams for the top candidates) makes the ideas easier to approach.

**Read config.** The repo root is pre-resolved at skill load:
!`git rev-parse --show-toplevel`

If the line above is an absolute path, use it as `<repo-root>`. If it is empty, shows an error, or still shows a backtick command string (a harness that did not run the pre-resolution), resolve `<repo-root>` at runtime by running `git rev-parse --show-toplevel` with the shell tool. Then read `<repo-root>/.spec-first/config.local.yaml` with the native file-read tool. If the root cannot be resolved (not a git repo) or the file does not exist, fall through to the defaults below.

Resolution steps:

1. **In-prompt request.** Reason over the user's prompt for this run for a request about *this document's* output format, expressed either as the `output:` shorthand or in plain language ("give me this as markdown", "I want a webpage"). On an explicit format, match it case-insensitively to `md`/`html`, and ignore the `output:` shorthand token when reading the rest of the prompt as the focus hint. Distinguish a request about the document's format from a format named as subject matter: "ideate on an HTML export feature" is the work, not a doc-format request — do not switch on it.
   - `output:` alone (no value) → no-op, fall through to step 2.
   - `output:<unknown>` (e.g., `output:pdf`) → drop the token, fall through to step 2, and remember to emit a one-line note above the post-ideation menu after final resolution: `Ignored unknown output: value '<value>' — using <resolved_format> instead.` where `<resolved_format>` is the value `OUTPUT_FORMAT` actually resolved to after the remaining precedence steps. Do not hardcode a format in the note — that misleads users when config or the default differs from what you assume.
2. **User-stated preference.** If this prompt holds no format request, honor an output-format preference (markdown vs HTML) the user established earlier — earlier in this session, in your memory, or written into their active instructions — that is already in your context (match `md`/`html` case-insensitively). A remembered preference is more current than the rarely-edited config, so it **overrides** the config in step 3. Do not open or search instruction files to find it — act only on a preference already present in your context; if none is, fall through to the config.
3. **Config.** If steps 1-2 did not resolve and the config file read above has an **active (non-commented)** `ideate_output:` key whose value matches `md` or `html` (case-insensitive), use it. Missing, invalid, or commented values fall through silently. Critical: lines starting with `#` are YAML comments and must be ignored — the shipped config template includes a commented example like `# ideate_output: md` to document the option, and matching that as an active setting would silently override the default on every run without the user having opted in.
4. **Default.** Otherwise `OUTPUT_FORMAT=html`.
5. **Pipeline override.** When invoked from any pipeline or `disable-model-invocation` context, force `OUTPUT_FORMAT=md` regardless of steps 1-4 — automated downstream consumers parse markdown reliably and HTML in pipeline runs is unnecessary friction.

**Token-parsing convention:** only literal-prefix flag tokens (`output:`, `mode:` where applicable) are consumed and stripped. Other `<word>:<word>` tokens — including conventional commit prefixes like `feat:`, `fix:`, `chore:` that may appear inside a focus hint — pass through verbatim.

**Defer loading the format-rendering reference.** The deliverable is written at Phase 4 (after generation), so `references/ideation-sections.md` and the format-rendering references (`markdown-rendering.md` / `html-rendering.md`) are only needed then — loading them at Phase 0.0 would carry them through the entire grounding and ideation dispatch for no benefit. Resolve `OUTPUT_FORMAT` now, but load the section contract and the matching rendering reference at write time (see `references/post-ideation-workflow.md` §4.1).

The `output:` preference does NOT auto-propagate to `spec-brainstorm` on handoff (Phase 5) — spec-brainstorm re-resolves its own `brainstorm_output` config independently. Asymmetric output (`ideation.html` + unified-plan markdown) is acceptable; users who want HTML for both set both keys in `.spec-first/config.local.yaml`.

#### 0.1 Check for Recent Ideation Work

Look in `docs/ideation/` for ideation documents (`*.md` or `*.html`) created within the last 30 days.

Treat a prior ideation doc as relevant when:

- the topic matches the requested focus
- the path or subsystem overlaps the requested focus
- the request is open-ended and there is an obvious recent open ideation doc
- the issue-grounded status matches: do not offer to resume a non-issue ideation when the current argument indicates issue-tracker intent, or vice versa — treat these as distinct topics

If a relevant doc exists, ask whether to:

1. continue from it
2. start fresh

If continuing:

- read the document
- summarize what has already been explored
- preserve the previous ideas and rejection summary
- update the existing file instead of creating a duplicate
- **write the update back in the existing file's format**, overriding the Phase 0.0 baseline: resuming a `.html` doc rewrites HTML, a `.md` doc rewrites markdown. Format precedence on resume is: explicit `output:` arg this run > resumed file's extension > config > default (`html`); a pipeline/`disable-model-invocation` run still forces `md` per Phase 0.0. An explicit `output:` arg that differs from the existing file switches the artifact's format (write the new-format file; leave the original in place).

#### 0.2 Subject-Identification Gate

Before classifying mode or dispatching any grounding, check whether the subject of ideation is identifiable. Every downstream agent — grounding and ideation — needs to know what it's working on. If the subject is ambiguous enough that reasonable sub-agents would diverge on what the topic even is (bare words like `improvements`, `ideas`, `birthday cakes`, `vacation destinations`), the output will be scattered.

**Questioning principles (apply in this phase and in 0.4):**

- Questions exist only to supply what sub-agents need to operate: an identifiable subject (this phase) and enough context for the agent to say something specific about it (0.4, elsewhere modes only). Nothing else.
- Never ask about solution direction, constraints, audience, tone, success criteria, or anything that characterizes the subject — those belong to `spec-brainstorm`.
- Always keep "Surprise me" (letting the agent decide the focus) as a real option, not a fallback for when the user can't name a subject. Ideation is allowed to be greenfield by design.
- Stop as soon as the subject is identifiable or the user has delegated to "Surprise me." More than 3 total questions across 0.2 and 0.4 is a smell that ideation is not the right workflow — consider suggesting `spec-brainstorm`.

**Detection — issue-tracker intent (repo mode only; subject-identifying).**

Issue-tracker intent requires an explicit reference to the tracker or to reports filed in it. Trigger only when the prompt uses phrases like `github issues`, `open issues`, `issue patterns`, `issue themes`, `what users are reporting`, or `bug reports` — the subject is "issues in the tracker." Proceed to 0.3 with issue-tracker intent flagged.

Do NOT trigger on arguments that merely mention bugs as a focus: `bug in auth`, `fix the login issue`, `the signup bug`, `top 3 bugs in authentication` — these are focus hints on regular ideation, not requests to analyze the issue tracker. A bare `bugs` with no tracker phrasing is handled by the vagueness check below, not here.

When combined (e.g., `top 3 issue themes in authentication`, `biggest bug reports about checkout`): detect issue-tracker intent first, volume override in 0.5, remainder is the focus hint. The focus narrows which issues matter; the volume override controls survivor count.

**Detection — subject identifiability.**

The test: would a reader, seeing only this prompt, know what subject the agent should ideate on? Vagueness is about what the words *refer to*, not phrase length: `browser sniff` is two words but plausibly names a feature (identifiable — proceed to 0.3); `quick wins` is two words but names only a quality (vague — ask the scope question). A prompt that refers to a catch-all quality, category, or placeholder (`improvements`, `bugs` alone, an empty prompt) is vague; one that names or plausibly names a specific feature, concept, document, flow, or topic is identifiable, in any domain.

**Being inside a repo does not settle vagueness.** `improvements` in any repo is still scattered across DX, reliability, features, docs, tests, architecture. The repo provides material for grounding *after* a subject is settled, not the subject itself. Do not silently interpret a vague prompt as "about this repo" and proceed.

**Genuine ambiguity (repo mode).** When real doubt remains on a short phrase, one cheap check settles it: Glob for the phrase in filenames, or Grep for it in README/docs. Any repo footprint → identifiable; none and still vague → ask. When in doubt otherwise, err toward asking — one question is trivial compared to dispatching a dozen agents on a scattered interpretation.

**The scope question.**

Ask via the platform's blocking question tool per Interaction Method above — never silently skip.

- **Stem:** "What should the agent ideate about?"
- **Options:**
  - "Specify a subject the agent should ideate on"
  - "Surprise me — let the agent decide what to focus on"
  - "Cancel — let me rephrase"

Routing:

- **Specify** → accept the user's follow-up as the subject. Re-apply the identifiability check once. If still ambiguous, ask once more with "Surprise me" still on the menu. Do not cascade toward specificity about *how* to solve — only about *what* the subject is.
- **Surprise me** → mark the run as **surprise-me mode**. The agent will discover subjects from Phase 1 material rather than carry a user-specified subject. This is a first-class mode — it changes how Phase 1 scans and how Phase 2 sub-agents operate (see those phases). **Dispatch routing for surprise-me is deterministic:** if CWD is inside a git repo, route to repo-grounded (the codebase supplies substance); otherwise route to elsewhere-software and require Phase 0.4 to collect at least one piece of substance (URL, description, draft, or paste) before dispatching — "surprise me" outside a repo is only viable once the user has supplied something to surprise them about. Skip Decision 1/2 in Phase 0.3: with no user subject there is no prompt content to weigh, and surprise-me never routes to elsewhere-non-software (no way to infer naming/narrative/personal intent without a subject). The user can correct by interrupting and re-invoking with a named subject.
- **Cancel** → exit cleanly. Narrate that the user can rephrase and re-invoke.

#### 0.3 Mode Classification

Classify the **subject of ideation** (settled in 0.2) into one of three modes for dispatch routing. A user inside any repo can ideate about something unrelated to that repo; a user in `/tmp` can ideate about code they hold in their head.

**Surprise-me short-circuit.** When Phase 0.2 routed to surprise-me mode, skip the two-decision classification below and use the deterministic rule stated in 0.2: repo-grounded when CWD is inside a git repo, elsewhere-software otherwise. The ambiguity-confirmation step at the end of this section also does not fire for surprise-me — there is no user subject to be ambiguous about. State the chosen mode in one sentence and proceed to 0.4.

For specified subjects, make two sequential binary decisions, enumerating negative signals at each:

**Decision 1 — repo-grounded vs elsewhere.** Weigh prompt content first, topic-repo coherence second, and CWD repo presence as supporting evidence only.

- Positive signals for **repo-grounded**: prompt references repo files, code, architecture, modules, tests, or workflows; topic is clearly bounded by the current codebase. Issue-tracker intent from 0.2 is always repo-grounded.
- Negative signals (push toward **elsewhere**): prompt names things absent from the repo (pricing, naming, narrative, business model, personal decisions, brand, content, market positioning); topic is creative, business, or personal with no code surface.

**Decision 2 (only fires if Decision 1 = elsewhere) — software vs non-software.** Classify by whether the *subject* of ideation is a software artifact or system, not by where the individual ideas will eventually land. If the topic concerns a product, app, SaaS, web/mobile UI, feature, page, or service, it is **elsewhere-software** — even when the ideas themselves are about copy, UX, CRO, pricing, onboarding, visual design, or positioning *for that software product*. **Elsewhere-non-software** is reserved for topics with no software surface at all: company or brand naming (independent of product), narrative and creative writing, personal decisions, non-digital business strategy, physical-product design.

Contrast pair: "Improve conversion on our sign-up page" → elsewhere-software (the subject is a page, even though the ideas may be copy or CRO); "Name my new coffee shop" → elsewhere-non-software (the subject is a brand with no software surface).

State the inferred approach in one sentence at the top, using plain language the user will recognize. Never print the internal taxonomy label (`repo-grounded`, `elsewhere-software`, `elsewhere-non-software`) to the user — those names are for routing only. Adapt the template below to the actual topic; pick a domain word from the topic itself (e.g., "landing page", "onboarding flow", "naming", "career decision") instead of a mode label.

- **Repo-grounded:** "Treating this as a topic in this codebase — about X."
- **Elsewhere-software:** "Treating this as a product/software topic outside this repo — about X."
- **Elsewhere-non-software:** "Treating this as a [naming | narrative | business | personal] topic — about X."

Do not prescribe correction phrases ("say X to switch"). State the inferred mode plainly and proceed. If the user disagrees, they will correct in their own words or interrupt to re-invoke — reclassify and re-run any affected routing when that happens.

**Active confirmation on mode ambiguity.** Only fire when mode classification is genuinely ambiguous *after* 0.2 settled the subject — e.g., "our docs" could mean repo docs (repo-grounded) or public marketing docs (elsewhere-software). Most subjects settled in 0.2 classify cleanly here. When ambiguous, ask one confirmation question via the blocking tool with two self-contained labels naming the two candidate interpretations in plain language (e.g., "Treat as repo docs in this codebase" vs "Treat as public marketing docs") — never leak internal mode names. Otherwise the one-sentence inferred-mode statement is sufficient; do not ask.

**Routing rule (non-software mode).** When Decision 2 = non-software, still run Phase 1 Elsewhere-mode grounding with user-context synthesis. Add web research only when `external_research_authorization: authorized`; missing authority removes the web-research role regardless of mode or depth. Learnings-researcher is skipped by default in this mode — the CWD's `docs/solutions/` rarely transfers to naming, narrative, personal, or non-digital business topics; see Phase 1 for the full rationale. Then load `references/universal-ideation.md` and follow it in place of Phase 2's software frame dispatch and the Phase 5 menu narrative. This load is non-optional — the file contains the domain-agnostic generation frames, critique rubric, and wrap-up menu that replace Phase 2 and the post-ideation menu for this mode, and none of those details live in this main body. Improvising from memory produces the wrong facilitation for non-software topics. Do not run the repo-specific codebase scan at any point. The deliverable is auto-written here too (per `references/post-ideation-workflow.md` Phase 4); the auto-written local file remains the intact record regardless of what the user does with it afterward.

#### 0.4 Context-Substance Gate (Elsewhere Modes Only)

Skip in repo mode — the repo provides the substance Phase 1 agents work from. In elsewhere modes (both software and non-software), Phase 1 agents depend on user-supplied context for substance. A bare prompt with no description, URL, or artifact leaves the user-context-synthesis agent with nothing to synthesize and weakens web research's relevance.

Apply the discrimination test: would swapping one piece of the user's stated context for a contrasting alternative materially change which ideas survive? If yes, context is load-bearing — proceed. If no, ask 1-3 narrowly chosen questions focused on **supplying substance, not characterizing the subject**:

- A URL or file to read
- A brief description of the current state
- A paste of an existing draft or brief

Build on what the user already provided rather than starting from a template. Default to free-form questions; use single-select only when the answer space is small and discrete. After each answer, re-apply the test before asking another. Stop on dismissive responses ("idk just go") — treat genuine "no context" answers as real answers and note context is thin in the summary so Phase 2 can compensate with broader generation.

**Surprise-me exception.** When the run is in surprise-me mode and routed to elsewhere-software (per 0.2's deterministic routing for no-repo CWDs), at least one piece of substance is required — there is no subject AND no repo, so Phase 1 and 2 agents would have nothing to discover subjects from. Dismissive responses are not acceptable here; if the user still has no context after one ask, tell them the run needs a URL, description, or paste to proceed and end cleanly so they can re-invoke with material.

When the user provides rich context up front (a paste, a brief, an existing draft, a URL), confirm understanding in one line and skip this step entirely.

If this step materially changes the topic (not just adds context but shifts the subject), re-run 0.2 and 0.3 against the refined scope before dispatching Phase 1 — classify on what's actually being ideated on, not the scope at first read.

#### 0.5 Interpret Focus and Volume

Infer two things from the argument and any intake so far:

- **Focus context** — concept, path, constraint, or open-ended
- **Volume override** — any hint that changes candidate or survivor counts

Default volume:

- each ideation frame yields about 6-8 ideas (~36-48 raw across the six frames in the default path, or ~24-32 across 4 frames in issue-tracker mode; roughly 25-30 survivors after dedupe in the default path and fewer in the 4-frame path)
- keep the top 5-7 survivors

Honor clear overrides such as:

- `top 3`
- `100 ideas`
- `raise the bar`

**Depth override.** `go deep` (or equivalent) opts into maximum depth deliberately: every ideation agent moves to the ceiling tier, the Phase 2 verification read budget doubles, and Phase 3 adds a second critic. The default is the mixed-tier fleet — users opt into top-tier cost explicitly rather than inheriting it from whichever model the conversation happens to run on.

**Tactical scope detection.** Parse the focus hint (and any intake answers from 0.2 specify path) for tactical signals: `polish`, `typo`, `typos`, `quick wins`, `small improvements`, `cleanup`, `small fixes`. When present, lower the Phase 2 ambition floor — the user has explicitly opted into tactical scope. Default otherwise is step-function (see Phase 2 meeting-test floor).

Use reasonable interpretation rather than formal parsing.

#### 0.6 Cost Transparency Notice

Before Phase 1, derive and record `external_research_authorization: authorized | missing`. It is `authorized` only when the current user or visible upstream handoff explicitly requests web/external/provider research or issue-tracker evidence for this run. General ideation, `go deep`, surprise-me mode, tool availability, and a prior run do not grant it. Missing or explicitly denied authority records `external_research_authorization_missing` and removes web research and issue intelligence without weakening current-source grounding. Every authorized external result carries provenance, freshness, and limitations and remains advisory until its cited source is rechecked.

Then surface the execution count and cost shape in one short line. When dispatch is authorized and capable, report the actual agent count using the calculation below. Otherwise report the number of role lenses that will run inline/serial and the applicable fallback reason; do not describe them as agents. Compute the count from the actual execution decision: 1 grounding-context role + 1 learnings role (skip in elsewhere-non-software) + an authorized web researcher + evidence roles (repo mode only, one per Phase 1.5 axis, max 5) + user-research distillers + the ideation fleet (5 roles default; 6 in surprise-me or `go deep`; 4 in issue-tracker mode) + 1 basis verifier. Add issue intelligence only when issue-tracker intent and external research authority are both present; add opt-in Slack roles when applicable. Phase 2 may add up to 2 recovery roles when axis coverage requires it.

Authorized-dispatch examples below assume `external_research_authorization: authorized`, with no skips or additional opt-ins. When external research authority is missing, omit web research from the role set and subtract it from the displayed count; dispatch authority never substitutes for research authority.

- **Repo mode, specified subject:** "Will dispatch ~12 agents by default, most on cheap tiers: codebase scan + learnings + up to 5 evidence scouts (cheap) + 5 ideation (3 mid-tier, 2 top-tier) + 1 basis verifier (mid-tier). With external research authorization, add the web researcher. Skip phrases: 'no external research', 'no slack'."
- **Repo mode, surprise-me:** "Will dispatch ~9 agents by default (surprise-me mode: deeper exploration per agent): codebase scan + learnings + 6 ideation (top-tier) + 1 basis verifier. With external research authorization, add the web researcher. Skip phrases: 'no external research', 'no slack'."
- **Repo mode, issue-tracker intent:** "Will dispatch ~12 agents by default: codebase scan + learnings + issue intelligence only when separately authorized + up to 5 evidence scouts + 4 ideation + 1 basis verifier. With external research authorization, add the web researcher. Skip phrases: 'no external research', 'no slack'." If issue intelligence returns insufficient signal (see Phase 1), ideation falls back to the default 5-agent fleet.
- **Elsewhere-software:** "Will dispatch ~8 agents by default: context synthesis + learnings + 5 ideation + 1 basis verifier. With external research authorization, add the web researcher. Skip phrases: 'no external research'."
- **Elsewhere-non-software:** "Will dispatch ~7 agents by default: context synthesis + 5 ideation + 1 basis verifier. With external research authorization, add the web researcher. Skip phrases: 'no external research'."

Inline fallback uses the same computed role count but says, for example: `Will run ~13 role lenses inline/serial (dispatch_authorization_missing); independent agent diversity and fresh-context verification are not available.`

The line is informational; users do not need to acknowledge it.



### Phase 1.5: Topic-Surface Decomposition

Before dispatching frame agents in Phase 2, decompose the topic into 3-5 orthogonal **axes** that name *what aspects of the subject to think about*. Phase 2 frames determine *how to think* (the lens); axes determine *what to think on* (the surface). Without an explicit axis list, parallel frames tend to converge on whichever interpretation of the subject is most salient at first read — other parts of the surface go unexamined regardless of how many frames run. Lens diversity alone does not produce surface coverage.

The axis analysis itself is a single orchestrator-side pass against the grounding summary already in context — no additional grounding read, no user-facing question. The evidence scouts below are the only dispatch in this phase.

**Axis criteria:**

- **3-5 axes.** Fewer than 3 means the topic is atomic — skip per the rule below. More than 5 fragments dispatch and produces thin coverage on each.
- **Orthogonal.** A single idea should naturally fall on one axis, not span multiple. Merge axes that overlap heavily.
- **Derived from grounding.** The grounding summary contains the substance the axes name; do not pick axes from a generic template (e.g., "discovery / engagement / retention" applied to every topic).
- **At the same level.** Don't mix "the entire pricing page" with "the $9.99 tier copy" in the same list.
- **Named in the topic's language.** "Send mechanics" beats "outbound flow optimization." Use words a reader of the topic would recognize, not meta-language about ideation.

**Worked examples (illustrative, not a template — derive from actual grounding):**

| Topic | Axes |
|---|---|
| Social sharing of crossfire and convergence pages | Send mechanics; discovery (receive side); arrival/dwell experience; compounding over time; actor types (first-party, expert, reader) |
| Improve our authentication system | Sign-in flow; session management; account recovery; permissions; identity providers |
| Dark mode for our app | Visual surfaces; toggle UX; system-preference detection; asset variants; edge cases (third-party content) |
| Cache invalidation in the data layer | Trigger surfaces; coordination across replicas; staleness tolerance per data class; observability of invalidation events |

**Skip condition.** Some subjects are atomic and resist meaningful decomposition — a single string output (a name, a tagline), a narrowly-scoped tactical fix ("the typo on line 47 of README"), or a topic where the candidate axes *are* the deliverable (e.g., "what surface should the API expose?"). When 3+ orthogonal axes that pass the criteria above cannot be generated, skip decomposition. Note `Decomposition skipped — atomic subject` in the grounding summary so the artifact records the choice.

**Surprise-me skip.** In surprise-me mode there is no settled subject to decompose — different frames will surface different subjects in Phase 2, and the cross-cutting synthesis step there serves the analogous coverage role. Skip Phase 1.5 in surprise-me mode and note `Decomposition skipped — surprise-me mode` in the grounding summary.

**Evidence scouts (repo mode, when axes exist).** Decomposition names what to look at; scouts gather what is actually there. The Phase 1 scan is an orientation gist — too thin for ideation agents to quote from — so dispatch one extraction-tier sub-agent per axis (max 5) in parallel. Pass each scout the absolute `<scratch-dir>` path from Phase 1 and a kebab-case slug for its axis, with this prompt:

> Gather evidence about **{axis}** in this repo, scoped to {focus/subject}. Search first with the native file-search and content-search tools, then read targeted sections — budget ~20 reads, preferring ranges over whole files. Write an **evidence dossier** to `{scratch-dir}/evidence-{axis-slug}.md`: at most 150 lines of verbatim quotes and short code snippets, each with a `file:line` pointer, covering pain points, workarounds, TODO/FIXME markers, surprising patterns, and leverage points on this axis. Extraction only — quote what the repo says; do not interpret, theme, or propose ideas. If the axis has little footprint, write less rather than padding. Return only a gist: 3-5 lines summarizing what the dossier holds, plus its absolute path and entry count.

Append the returned gists (with dossier paths) — not the dossier contents — to the consolidated grounding summary under `Evidence: <axis>`. The dossier files are the evidence layer Phase 2 agents read and cite from; keeping their bulk out of the orchestrator's context is the point of the file handoff, so do not read them into the main session. Skip scouts when decomposition was skipped (atomic subjects rarely need deep evidence — Phase 2 verification reads cover them), in surprise-me mode, and in elsewhere modes (no repo to scout; user-supplied context and web research are the grounding there).

Append the axis list (or skip-reason) to the consolidated grounding summary under a section labeled `Topic axes`. Phase 2 reads this section to thread axes into sub-agent prompts; Phase 3 uses it for axis-spread scoring; the Phase 4 artifact includes it under Grounding Context (per `references/ideation-sections.md`).
