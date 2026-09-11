# Ideation grounding

At each authorized native dispatch boundary, correct a pre-launch argument rejection once without changing scope or required capabilities. Capacity-limited work stays queued until a slot frees; repeated zero capacity uses the phase's bounded degraded path. Other launch failures use that same path and retain every required lens. Once an agent launches, collect its outcome before retrying; inline lenses are not independent agents.

### Phase 1: Mode-Aware Grounding

Apply SKILL.md Model Tiers and `references/scope-gates.md`'s resolved mode/scaling state. Before either grounding batch, classify every named file as directive or evidence using the routing test below. Evidence files bypass both the repo scan's directive input and elsewhere context synthesis. Read `references/user-research-artifacts.md` before preparing distillers; run them in the same authorized foreground batch, or serially under the same fallback. Await all selected roles before consolidation.

Before generating ideas, gather grounding. The dispatch set depends on the mode chosen in Phase 0.3. Web research runs only with `external_research_authorization: authorized`. When the user supplied a research artifact, the user-supplied research handling below still runs in all modes because the user named that input directly. Learnings runs in repo mode and elsewhere-software, and is **skipped by default in elsewhere-non-software** — the CWD repo's `docs/solutions/` almost always contains engineering patterns that do not transfer to naming, narrative, personal, or non-digital business topics.

**Surprise-me grounding depth.** When Phase 0.2 routed to surprise-me mode, Phase 1 must produce richer material than specified mode — Phase 2 sub-agents will discover their own subjects from what Phase 1 returns, so texture matters:

- **Repo mode surprise-me:** the codebase-scan sub-agent samples a few representative files per top-level area (not just reads the top-level layout + AGENTS.md), surfaces recent PR/commit activity as signal about what's actively being worked on, and — when issue intelligence runs — passes issue themes as first-class input rather than footnote. Keep the scan bounded: representative, not exhaustive.
- **Elsewhere mode surprise-me:** user-context synthesis extracts themes, recurring language, tensions, and omissions from whatever the user supplied, rather than just restating it. Web research broadens beyond narrow prior-art for a single subject toward the domain's landscape.
- Specified mode keeps the current shallower scan — the user's named subject anchors what's relevant, so broader exploration is unnecessary.

Generate a `<run-id>` once at the start of Phase 1 (8 hex chars). Reuse it for the V15 cache file (this phase) and the V17 checkpoints (Phases 2 and 4) so they share one per-run scratch directory.

**Resolve the private scratch directory.** Create an owner-only run-local directory under the host temp root and capture its absolute path. Do not use a shared fixed path or reuse another run's directory.

```bash
umask 077
SCRATCH_DIR="$(mktemp -d "${TMPDIR:-/tmp}/spec-first-ideate.XXXXXX")"
[ -d "$SCRATCH_DIR" ] && [ ! -L "$SCRATCH_DIR" ] || { echo 'private scratch creation failed' >&2; exit 1; }
chmod 700 "$SCRATCH_DIR"
echo "$SCRATCH_DIR"
```

Use the echoed absolute path as `<scratch-dir>` only for this run. Recheck that it remains an owned, non-symlink directory before atomic publication. Web research material may be reused only inside this run; no cache or checkpoint in scratch crosses invocation boundaries. Durable repo-backed checkpoints belong under `.spec-first/workflows/spec-ideate/`; outside a repo, return the complete deliverable inline unless the user selects a durable destination. Scratch must never be the only recoverable deliverable or handoff pointer.

With authorized dispatch, run grounding agents in bounded parallel in the **foreground**. Otherwise execute the same grounding roles serially inline; results are still required before Phase 2.

**Repo mode dispatch:**

**Resolve current project orientation first.** Derive the stack, top-level layout, conventions, and root instruction facts from the current target repo/worktree for this run. Record current git identity and dirty state when available, carry direct source refs, and never persist or reuse the orientation across runs, branches, or worktrees. If git or a source cannot be read, record the concrete degraded fact and continue with only the bounded readable evidence; do not claim complete or fresh repo grounding.

External research, issue-tracker access, and provider calls are opt-in evidence sources, not the default ideation route. Start from the current source and the user's Product Contract; use an external source only after recording authorization, provenance, freshness, and limitation. Provider output is advisory until its cited source is rechecked.

**Owner-local context facts adapter.** `spec-ideate` adapts only its current grounding dossier and final idea artifact as `context_facts_adapter/v1`: `owner: spec-ideate`, `source_identity`, `source_refs`, `freshness`, `artifact_type`, and `limitations`. Scripts may prepare hashes, paths, timestamps, and provider readiness; the LLM owns topic fit, grounding sufficiency, and idea judgment. Do not reuse the `spec-write-skill` package inspector or publish a shared workflow helper until another real owner demonstrates the same input/output and failure contract.

1. **Quick context scan** — dispatch a generic worker and request the cheapest capable tier only when `worker_model_override: supported`; otherwise inherit. Before dispatching, apply the routing test from "User-Supplied Research Artifacts" below to any root-level `*.md` file the focus hint names: research artifacts (evidence) take that subsection's distillation path, so list them on the prompt's research-artifacts line to keep the scan from duplicating them into `User-named references`. Dispatch with this prompt:

   > **Run-local orientation handling (read first):** if a current-tree orientation is supplied at the end of this prompt, its agnostic shape and source identity were established for this run; confirm the identity still matches before using it, then run the question-specific slice. If the identity changed or no orientation is supplied, derive the full shape from current sources as described below.
   >
   > Read the project's root agent-instruction file for this harness (e.g., `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, or `.cursor/rules`) and `README.md` when present, then discover the top-level directory layout using the native file-search/glob tool (e.g., `Glob` with pattern `*` or `*/*` in Claude Code). Also read `STRATEGY.md` as the shared project strategy document if it exists — it captures the product's target problem, approach, persona, metrics, and tracks.
   >
   > **Two paths for other root-level `*.md` files**, depending on whether the focus hint names them:
   >
   > - **User-named references** — if the focus hint names a specific root-level `*.md` file (e.g., focus is "ideate based on FEEDBACK.md", "use NOTES.md as input", "review the gaps in TODO.md"), fully read that file and include its content under a heading `User-named references`. Phase 2 treats these as *constraint*, so sub-agents need actual content, not a gist. Quote or summarize substantive sections; keep one-line gists for files that are mentioned but not the actual subject. Exception: skip this path for any file listed on the research-artifacts line below — a separate agent distills those; give each only a one-line gist under `Additional context`.
   > - **Additional context** — for any other root-level `*.md` files (not named in the focus), read briefly and include a one-line gist under a heading `Additional context`. Phase 2 treats these as *background*, so a gist is sufficient.
   >
   > Return a concise summary (under 40 lines, longer if user-named references include substantive content) covering:
   >
   > - project shape (language, framework, top-level directory layout)
   > - notable patterns or conventions
   > - obvious pain points or gaps
   > - likely leverage points for improvement
   > - Product strategy summary: prefer STRATEGY; read legacy `PRODUCT.md` / `VISION.md` only when `STRATEGY.md` is absent or lacks a needed meaning. Extract the target problem, approach, users, metrics, tracks, and boundaries by meaning. Preserve the approach and active tracks verbatim with their actual sources; require no exact headings and do not override explicit project authority.
   > - `User-named references` section (when the focus hint named root-level `*.md` files)
   > - `Additional context` section (when other root-level `*.md` files exist that the focus did not name)
   >
   > Keep the scan shallow otherwise — read only top-level documentation and directory structure. Do not analyze GitHub issues, templates, or contribution guidelines. Do not do deep code search.
   >
   > Focus hint: {focus_hint}
   >
   > Research artifacts (gist-only under `Additional context` — do not fully read; a separate agent distills these): {research_artifact_files, or "none"}
   >
   > Project profile (agnostic shape — treat as established, do not re-derive; when "none", derive the full shape): {project_profile, or "none — derive the full shape"}

2. **Learnings search** — read `references/agents/learnings-researcher.md` and dispatch a generic subagent seeded with that local prompt plus a brief summary of the ideation focus.

3. **Web research** (opt-in; run only with `external_research_authorization: authorized`, then apply the cache rules below).

4. **Issue intelligence** (conditional) — only when Phase 0.2 identified tracker intent and `external_research_authorization: authorized`, read `references/issue-intelligence.md` before starting. Run SCAN alongside the other authorized grounding roles; inspect unavailable/insufficient-signal outcomes before any scoping question; resolve scope; then run CLUSTER against the same saved scan and await its result. Carry coverage accounting into the summary. Without research authority, record `external_research_authorization_missing` and do not access the tracker. Worker dispatch remains separately gated.

**Elsewhere mode dispatch (skip the codebase scan; user-supplied context is the primary grounding):**

1. **User-context synthesis** — dispatch a general-purpose sub-agent (cheapest capable model) to read the user-supplied context from Phase 0.4 intake plus any rich-prompt material, and return a structured grounding summary that mirrors the codebase-context shape (project shape → topic shape; notable patterns → stated constraints; pain points → user-named pain points; leverage points → opportunity hooks the context implies). This keeps Phase 2 sub-agents agnostic to grounding source.

2. **Learnings search** *(elsewhere-software only; skipped by default in elsewhere-non-software)* — read `references/agents/learnings-researcher.md` and dispatch a generic subagent seeded with that local prompt plus the topic summary in case relevant institutional knowledge exists (skill-design patterns, prior solutions in similar shape). Skip for elsewhere-non-software: the CWD's `docs/solutions/` is unlikely to be topically relevant for non-digital topics, and running it risks polluting generation with unrelated engineering patterns.

3. **Web research** — same as repo mode (see subsection below).

Issue intelligence does not apply in elsewhere mode. Slack research is opt-in for both modes (see "Slack context" below).

#### Web Research (V5, V15)

Opt-in for both modes. Run only when `external_research_authorization: authorized`; otherwise omit the `web-researcher` local prompt and record `external_research_authorization_missing` in the consolidated grounding summary. Explicit skip phrases keep the fact missing and must never be overridden by mode, depth, cache availability, or provider readiness.

Reuse prior web research within a session via a sidecar cache — see `references/web-research-cache.md` for the cache file shape, reuse check, append behavior, and platform-degradation rules. Read it the first time the `web-researcher` local prompt would be dispatched in this run (and on every subsequent dispatch where the cache might apply).

When dispatching web research, read `references/agents/web-researcher.md` and seed a generic worker with that prompt. Pass the focus hint, a brief planning context summary (one or two sentences), and the mode. Do not pass codebase content — the prompt operates externally. Request the balanced mid-tier only when `worker_model_override: supported`; otherwise omit the override and inherit.

#### User-Supplied Research Artifacts

Applies in all modes whenever the prompt or intake names a file of *gathered evidence* — a social-listening or search-research report, survey export, analytics dump, interview notes — at any path, inside or outside the repo.

**Routing test (directive vs evidence).** A named file is *directive* when ideas that ignore or contradict it would be wrong (a spec, a TODO list, feedback the user wants addressed) — in repo mode that is the User-named references path, and it rides in `<constraints>` at dispatch. A file is *evidence* when it is signal about the world that ideas may draw on and cite. Research artifacts are evidence: they enter the evidence layer, never `<constraints>` — engagement-ranked chatter must inform ideas, not veto them.

**Repo-mode coordination.** Apply this routing test *before* dispatching the Phase 1 quick context scan: when a research artifact is a root-level `*.md` the focus hint names, list it on the scan prompt's research-artifacts line so the scan gists it under `Additional context` instead of fully reading it into `User-named references`. Each file takes exactly one path — distillation here, never both.

After classifying files, read `references/user-research-artifacts.md` before the grounding batch. That reference owns small-artifact inclusion, distiller payloads, dossiers, and provenance. Await every selected distiller before consolidation.

#### Consolidated Grounding Summary

Consolidate all dispatched results into a short grounding summary using these sections (omit any section that produced nothing). Phase 1.5 will append a `Topic axes` section to this same summary after consolidation completes:

- **Codebase context** *(repo mode)* — project shape, notable patterns, pain points, leverage points (project-defining files: AGENTS.md/CLAUDE.md/README.md/STRATEGY.md) OR **Topic context** *(elsewhere mode)* — topic shape, stated constraints, user-named pain points, opportunity hooks
- **User-named references** *(repo mode, when the focus hint named root-level `*.md` files)* — full content from directive files the user explicitly named in their prompt or focus (research artifacts route through `User-supplied research` instead). Phase 2 treats these as constraint
- **Additional context** *(repo mode, when other root-level markdown was discovered but not named)* — one-line gists per file. Phase 2 treats these as background, not direction
- **Past learnings** — relevant institutional knowledge from `docs/solutions/`
- **Issue intelligence** *(when present, repo mode only)* — theme summaries with titles, descriptions, counts, leverage, trends, and fetched/eligible/analyzed/excluded/unknown-remainder coverage; retain lower bounds and limitations.
- **External context** *(when web research ran)* — prior art, adjacent solutions, market signals, cross-domain analogies. Note "(reused from earlier dispatch)" when V15 reuse fired
- **User-supplied research** *(when the user provided research artifacts)* — dossier gists with paths, or inline content for small artifacts; kept distinct from External context so source provenance stays visible
- **Slack context** *(when present)* — organizational context

**Failure handling.** Grounding subagent failures follow "warn and proceed" — never block on grounding failure. If the web-research local prompt fails (network, tool unavailable), log a warning ("External research unavailable: {reason}. Proceeding with internal grounding only.") and continue. If elsewhere-mode intake produced no usable context, note in the grounding summary that context is thin so Phase 2 subagents can compensate with broader generation.

**Slack context** (opt-in, both modes) — never auto-dispatch. When the user asks for Slack context and Slack tools are available, read `references/agents/slack-researcher.md` and dispatch a generic subagent seeded with that local prompt plus the focus hint in parallel with other Phase 1 subagents. When tools are present but the user did not ask, mention availability in the grounding summary so they can opt in. When the user asked but no Slack tools are reachable, surface the install hint instead.
