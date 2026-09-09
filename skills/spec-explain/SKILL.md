---
name: spec-explain
description: "Create a durable, visual teaching artifact for a concept, diff, idea, or recent-work window, with an optional check-in that makes it stick. Use when the user asks to be taught or wants a deep explainer; not for ordinary Q&A, brief why-followups, diagnosis, status updates, or concise trade-off answers."
argument-hint: "[a concept, a diff ref, an idea, or 'what happened this week?'] — or invoke bare to be asked"
---

# Explain It To Me

Teach the user one thing well: a concept, a change, an idea, or a window of their own recent work. Agent-driven development removed the learning that writing code by hand used to provide; this skill is the replacement — the human keeps learning while agents do the writing.

Use the user's current request from the conversation as the explainer input.

Note: Use the current date from the active host context. Use this when weighting external sources and dating artifacts.

## Who the explainer is for

The user personally — dense, technical, one voice, no audience adaptation. Meeting prep preps the user; it never produces the deck. The artifact is display-only: no embedded quizzes, forms, or widgets — the doing happens in the session, where answers can be checked.

## Interaction Method

Read `references/orchestration.md` before the first blocking question, dispatch, or run-directory creation.



When you must ask the user a question, use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. In the fallback, stop and wait for the user's reply. Never silently skip the question. Ask one question at a time.

## Model Tiers

Dispatch is tiered by task shape, never hardcoded to a model name:

- **Extraction tier** — the work-recap scout and current-repo grounding scout: search-and-quote work. Request the cheapest capable tier only when `worker_model_override: supported`; otherwise inherit.
- **Ceiling tier** — the explainer composition, the check-in reasoning, and the corrections. These run in the main conversation on the orchestrator's model; nothing is dispatched for them.

## Dispatch Authorization Boundary

在派发 repo profiler 或 work-recap scout 前，记录：

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

`workflow invocation does not authorize dispatch`。只有当前用户或可见 upstream handoff 明确请求 subagent、delegated work、persona 或 parallel work 时才可派发。缺授权时不得探测 tool schema，固定为 `capability_probe: not_applicable` + `worker_dispatch_capability: unknown`，以同一预算 inline 或 serial 执行并记录 `dispatch_authorization_missing`。只有授权后才把 current-session registry/schema 作为 `provider_untrusted` evidence 检查：确认缺失时记录 `subagent_capability_missing`；surface 不可用、schema 不完整或候选不唯一时记录 `worker_capability_unproven`，均 inline 或 serial。隔离、模型覆盖和有界并发只取 live facts；required isolation 未满足时保持依赖 gate 打开，model unknown 时继承，parallelism unknown 时串行。记录 `worker_dispatch_outcome`。Inline fallback 不得声称 independent scout、fresh-context 或 multi-agent coverage。

**Degradation rule.** When authorized dispatch is available but `worker_model_override` is unsupported or unknown, dispatch scouts on the inherited model and keep their read budgets. When dispatch is unauthorized, missing, or unknown, run the scout work inline or serially with the same budgets and preserve the claim limitation above.

## Execution Flow

### Phase 1: Classify the input

Read `references/intake.md` now and classify the request into one of the four input shapes — concept, diff, idea, or work-recap window. It owns the token table (`diff:`, `since:`, `output:`), the explicit-token-beats-inference rule, the concept-vs-diff tiebreak, and conflict handling. Do not improvise classification.

**Bare invocation** (no input at all): ask one blocking question — "What should I explain?" — offering a shortcut option for a recap of recent work in this repo alongside free-text. Do not produce a default artifact unprompted.

**Operational-question gate.** When an inferred concept request is really an
ordinary question about current behavior, configuration, status, or diagnosis,
answer it directly in chat. Do not create a run directory or teaching artifact.
Offer a durable visual explainer only when a substantial underlying concept is
present and the user plausibly wants to learn it. Explicit teaching language,
or a `diff:`/`since:` token, enters the full flow directly.

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

- **Diff mode:** resolve the change (the `diff:` ref, or the most recent substantial change when the request points at one implicitly) and gather its evidence — the diff itself, the files it touches, any plan or solution doc that motivated it. Gather silently: nothing learned here is narrated to the user until Phase 3's ordering rule is satisfied.
- **Recap mode:** when the Dispatch Authorization Boundary is satisfied, dispatch a generic subagent seeded with `references/agents/work-recap-scout.md` (extraction tier), passing the resolved window, the repo root, and `$RUN_DIR`. Otherwise execute the same bounded recap scan inline or serially, record the matching fallback reason, and do not claim independent scout coverage. The scan returns an evidence summary with commit shas and `file:line` pointers. **Empty window** (no git activity, no doc changes): say so, offer to widen the window, write no artifact, and end the run after the user responds.
- **External concepts** (no footprint in this repo): skip repo grounding entirely — do not force repo context into the output. Research with whatever web tools are reachable. When none are, you may explain from model knowledge, but the artifact must label that content **Unverified — from model knowledge, not checked against current sources** in its metadata header.
- **Idea mode:** the idea is a fixed given. Explain its implications, mechanics, and trade-offs for the user's understanding. Never scope it (`spec-brainstorm`'s job), never generate and rank alternatives (`spec-ideate`'s job).

### Phase 3: Check-in gate — before anything is revealed

Judge whether the material warrants a check-in (a routine recap does not; a gnarly diff or a hard concept does), then offer it with the blocking question tool. The user can always decline, and declining is never re-litigated. Read `references/check-in.md` for the warrant test, the prediction protocol, and exercise design.

**Diff mode with check-in accepted — hard ordering rule.** No interpretive content — explanation, annotation, diagram, or surfaced opportunity — may be shown before the user's prediction turn ends. Show only the raw change reference (the diff or its stat summary), ask for the prediction ("What do you think this change does, and why was it made?"), and **end the turn there**. When no blocking tool exists, ask in chat and stop — never print the reveal in the same message as the prediction prompt. Compose the explainer only after the prediction lands; the reveal names the gaps between the prediction and what the change actually does.

### Phase 4: Compose the explainer

Read the rendering reference for the resolved format **now**, not earlier: `references/explainer-html.md` (default) or `references/explainer-markdown.md` (when intake resolved `output:md`). Compose per its contract — visible metadata header, show-n-tell form matched to the material, ~70ch measure, single self-contained file — and write the artifact to `$RUN_DIR/explainer.html` (or `$RUN_DIR/explainer.md` when intake resolved `output:md`) before anything else happens with it. Display it to the user (inline summary plus the file path; open locally per Phase 6 when chosen). The artifact exists at that stable path from this moment — a declined destination ask never loses it.

### Phase 5: Exercises (when warranted)

For concepts, ideas, and dense recaps where the check-in was accepted: pose the exercises from `references/check-in.md` in chat, one at a time, using the blocking question tool where its option shape fits and free chat where the answer is narrative. Check each answer, correct it, and name the gap it exposed. Do not put exercises inside the artifact.

### Phase 6: Destination ask and close

**Required read before you render anything in this phase: `references/destinations.md`.** It owns capability detection, the destination menu, per-option actions, audience re-render ordering, consent gates, and improvement observations. Read it now; do not render the menu or act on a selection without it.

Publishing is never headless or inferred. A public destination requires its full warning and a separate confirmation after the user has seen the warning. If that sequence cannot be completed, do not publish; preserve the canonical artifact and report its path. The handoffs this phase closes on are offered before anything fires; once accepted, invoke the owning skill through the skill primitive, except `spec-polish`, which remains user-run only.

**Non-interactive degradation:** when no interaction is possible at this ask, do not hang or discard the artifact. Materialize it under the repo-local `.spec-first/workflows/spec-explain/<run-id>/` owner when a target repo exists, report the path, and end. Never leave ephemeral `$RUN_DIR` as the only recoverable copy. If no target repo is available, preserve the private run directory and state the durability limitation explicitly.

## Boundaries

- **Not a verdict.** "Should we adopt X?" is `spec-pov`. spec-explain teaches what X is and how it works.
- **Not repo memory.** Documenting a solved problem for future work is `spec-compound`. spec-explain teaches the human, not the repo.
- **Not ideation or scoping.** An idea input is explained as given — implications and trade-offs — never expanded into options or a requirements dialogue.
- **The check-in is never headless.** It exists to exercise the human; automating the answers deletes the product.
