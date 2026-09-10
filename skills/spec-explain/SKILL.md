---
name: spec-explain
description: "Create a durable, visual teaching artifact for a concept, diff, idea, or recent-work window, with an optional Check Yourself section that makes it stick. Use when the user asks to be taught or wants a deep explainer; not for ordinary Q&A, brief why-followups, diagnosis, status updates, or concise trade-off answers."
argument-hint: "[a concept, a diff ref, an idea, or 'what happened this week?'] — or invoke bare to be asked"
---

# Explain It To Me

Teach the user one thing well: a concept, a change, an idea, or a window of their own recent work. Agent-driven development removed the learning that writing code by hand used to provide; this skill is the replacement — the human keeps learning while agents do the writing.

Use the user's current request from the conversation as the explainer input.

**Done:** the artifact exists at a recoverable reported path, has been presented to the user, and the selected destination has been honored. Direct answers under the operational-question gate and confirmed empty recap windows may finish without an artifact; missing required user input remains an explicit pending boundary.

Note: Use the current date from the active host context. Use this when weighting external sources and dating artifacts.

## Who the explainer is for

Default to the user personally: dense, technical, one voice. On an explicit request for another reader, adapt voice and orientation without reducing depth; resolve the audience in `references/intake.md`. Meeting prep preps the user; it never produces the deck. The artifact is display-only: no forms, scripts, or interactive widgets — active recall is carried by the static `Check yourself` section the reader works through alone.

## Interaction Method

Read `references/orchestration.md` before the first blocking question, dispatch, or run-directory creation.

That reference owns interaction and model tiers. The following authorization boundary applies before any capability probe or dispatch.

## Dispatch Authorization Boundary

Before dispatching a grounding or work-recap scout, record:

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

`workflow invocation does not authorize dispatch`. Dispatch requires an explicit request for subagents, delegated work, personas, or parallel work from the current user or a visible authorized upstream handoff. Without it, do not probe tool schemas: record `capability_probe: not_applicable`, `worker_dispatch_capability: unknown`, and `dispatch_authorization_missing`, and work inline or serially with the same budget. Only after authorization, inspect the current-session registry/schema as `provider_untrusted` evidence. Confirmed absence records `subagent_capability_missing`; an unavailable surface, incomplete schema, or ambiguous candidate records `worker_capability_unproven`. Both use inline or serial fallback. Isolation, model overrides, and bounded parallelism require live facts; unmet required isolation leaves its dependent gate open, unknown model support inherits, and unknown parallelism runs serially. Record `worker_dispatch_outcome`. Inline fallback never proves independent scout, fresh-context, or multi-agent coverage.

**Degradation rule.** When authorized dispatch is available but `worker_model_override` is unsupported or unknown, dispatch scouts on the inherited model and keep their read budgets. When dispatch is unauthorized, missing, or unknown, run the scout work inline or serially with the same budgets and preserve the claim limitation above.

## Execution Flow

### Phase 1: Classify the input

Read `references/intake.md` now and classify the request into one of the four input shapes — concept, diff, idea, or work-recap window. It owns the token table (`diff:`, `since:`, `output:`), the explicit-token-beats-inference rule, the concept-vs-diff tiebreak, and conflict handling. Do not improvise classification.

**Bare invocation** (no input at all): ask one blocking question — "What should I explain?" — offering a shortcut option for a recap of recent work in this repo alongside free-text. Do not produce a default artifact unprompted.

**Operational-question gate:** apply the intake reference before creating scratch or grounding the repo. A direct answer may complete this route without an artifact.

### Phase 2: Ground

Match grounding to the input shape. Create the run directory first — every run gets one, before any artifact exists:

```bash
umask 077
RUN_DIR="$(mktemp -d "${TMPDIR:-/tmp}/spec-first-explain.XXXXXX")"
[ -d "$RUN_DIR" ] && [ ! -L "$RUN_DIR" ] || { echo 'private scratch creation failed' >&2; exit 1; }
chmod 700 "$RUN_DIR"
echo "$RUN_DIR"
```

`RUN_DIR` is ephemeral, run-local scratch only. Recheck that it remains an owned, non-symlink directory before publishing any atomic temp-file rename into it; never leave the only durable explainer or handoff evidence there.

**Repo-touching inputs** (a concept with footprint in this repo, a diff, a recap): derive a run-local stack/conventions/vocabulary orientation from the current target repo/worktree. Record current git identity and dirty state when available, read active instructions and representative source directly, and retain direct source refs. Never persist or reuse the orientation across runs, branches, or worktrees. If git or a source cannot be read, record the exact degraded fact and narrow the explainer's project-specific claims. Topic-specific evidence — the diff, the concept's call-sites, and the window's commits — is always gathered fresh.

- **Diff mode:** resolve the change (the `diff:` ref, or the most recent substantial change when the request points at one implicitly) and gather its evidence — the diff itself, the files it touches, any plan or solution doc that motivated it. Gather silently: do not narrate what was learned here to the user; interpretation enters the artifact in Phase 3. For an empty range or missing subject, report the resolved facts and nearest real candidate before explaining anything else. Use a substitute only with user agreement; when interaction is genuinely unavailable, label any substitute explicitly in the artifact's Subject and limit claims to its evidence.
- **Recap mode:** when the Dispatch Authorization Boundary is satisfied, dispatch a generic subagent seeded with `references/agents/work-recap-scout.md` (extraction tier), passing the resolved window, the repo root, and `$RUN_DIR`. Otherwise execute the same bounded recap scan inline or serially, record the matching fallback reason, and do not claim independent scout coverage. Do not pre-scan, count, or characterize the activity window before that evidence pass; this also applies inline. The scan writes `recap-evidence.md` for a nonempty window and returns an evidence summary with commit shas and `file:line` pointers. **Empty window** (no git activity, no doc changes): say so, offer to widen the window, write no artifact, and end the run after the user responds.
- **External concepts** (no footprint in this repo): skip repo grounding entirely — do not force repo context into the output. Research with whatever web tools are reachable. When none are, you may explain from model knowledge, but the artifact must label that content **Unverified — from model knowledge, not checked against current sources** in its metadata header.
- **Idea mode:** the idea is a fixed given. Explain its implications, mechanics, and trade-offs for the user's understanding. Never scope it (`spec-brainstorm`'s job), never generate and rank alternatives (`spec-ideate`'s job).

### Phase 3: Compose the explainer

Read the rendering reference for the resolved format **now**, not earlier: `references/explainer-html.md` (default) or `references/explainer-markdown.md` (when intake resolved `output:md`). Compose per its contract — visible metadata header, show-n-tell form matched to the material, ~70ch measure, single self-contained file — and read `references/check-in.md` with it: it owns whether the artifact ends with a `Check yourself` section and that section's shape. The run never blocks on the check-in — no offer, no prediction turn, no exercise posed in chat; the section is static text the reader works through alone, so a user who switches away never comes back to a waiting question. Write the artifact to `$RUN_DIR/explainer.html` (or `$RUN_DIR/explainer.md` when intake resolved `output:md`) before anything else happens with it. Display it to the user (inline summary plus the file path; open locally per Phase 4 when chosen). The artifact exists at that stable path from this moment — a declined destination ask never loses it.

### Phase 4: Destination ask and close

**Required read before you render anything in this phase: `references/destinations.md`.** It owns capability detection, the destination menu, per-option actions, audience re-render ordering, consent gates, and improvement observations. Read it now; do not render the menu or act on a selection without it.

Publishing is never headless or inferred. A public destination requires its full warning and a separate confirmation after the user has seen the warning. If that sequence cannot be completed, do not publish; preserve the canonical artifact and report its path. The handoffs this phase closes on are offered before anything fires; once accepted, invoke the owning skill through the skill primitive, except `spec-polish`, which remains user-run only.

**Non-interactive degradation:** when no interaction is possible at this ask, do not hang or discard the artifact. Materialize it under the repo-local `.spec-first/workflows/spec-explain/<run-id>/` owner when a target repo exists, report the path, and end. Never leave ephemeral `$RUN_DIR` as the only recoverable copy. If no target repo is available, preserve the private run directory and state the durability limitation explicitly.

## Boundaries

- **Not a verdict.** "Should we adopt X?" is `spec-pov`. spec-explain teaches what X is and how it works.
- **Not repo memory.** Documenting a solved problem for future work is `spec-compound`. spec-explain teaches the human, not the repo.
- **Not ideation or scoping.** An idea input is explained as given — implications and trade-offs — never expanded into options or a requirements dialogue.
- **The check-in never blocks the run.** It is a `Check yourself` section of the artifact for the human reader; the run poses no question and waits on nothing.
