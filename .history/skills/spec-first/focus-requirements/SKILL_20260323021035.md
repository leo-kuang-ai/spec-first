---
name: focus-requirements
version: 1.0.0
description: |
  Owner-scoped requirement narrowing for existing-project incremental demand.
  Read a large reviewed requirement plus the current workspace context, then
  narrow it into a focused PRD for the current owner or side. Produces one
  true-source requirement doc and two thin handoff summaries for downstream
  /plan-ceo-review and /plan-eng-review.
  Use when the user already has a reviewed demand document, knows the current
  owner boundary, and has prepared the relevant repos in the workspace.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Preamble (run first)

**语言**: 默认中文回复；技术术语和代码标识符保持英文原文。

```bash
_UPD=$(~/.claude/skills/spec-first/bin/spec-first-update-check 2>/dev/null || .claude/skills/spec-first/bin/spec-first-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.spec-first/sessions
touch ~/.spec-first/sessions/"$PPID"
_SESSIONS=$(find ~/.spec-first/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.spec-first/sessions -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=$(~/.claude/skills/spec-first/bin/spec-first-config get spec-first_contributor 2>/dev/null || true)
_PROACTIVE=$(~/.claude/skills/spec-first/bin/spec-first-config get proactive 2>/dev/null || echo "true")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
echo "PROACTIVE: $_PROACTIVE"
_LAKE_SEEN=$([ -f ~/.spec-first/.completeness-intro-seen ] && echo "yes" || echo "no")
echo "LAKE_INTRO: $_LAKE_SEEN"
_TEL=$(~/.claude/skills/spec-first/bin/spec-first-config get telemetry 2>/dev/null || true)
_TEL_PROMPTED=$([ -f ~/.spec-first/.telemetry-prompted ] && echo "yes" || echo "no")
_TEL_START=$(date +%s)
_SESSION_ID="$$-$(date +%s)"
echo "TELEMETRY: ${_TEL:-off}"
echo "TEL_PROMPTED: $_TEL_PROMPTED"
    mkdir -p ~/.spec-first/analytics
    echo '{"skill":"focus-requirements","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> ~/.spec-first/analytics/skill-usage.jsonl 2>/dev/null || true
    _PENDING=$(~/.claude/skills/spec-first/bin/spec-first-pending-check 2>/dev/null || true)
    [ -n "$_PENDING" ] && ~/.claude/skills/spec-first/bin/spec-first-telemetry-log --event-type skill_run --skill _pending_finalize --outcome unknown --session-id "$_SESSION_ID" 2>/dev/null || true
```

If `PROACTIVE` is `"false"`, do not proactively suggest spec-first skills — only invoke
them when the user explicitly asks. The user opted out of proactive suggestions.

If output shows `UPGRADE_AVAILABLE <old> <new>`: read `~/.claude/skills/spec-first/spec-first-upgrade/SKILL.md` and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise AskUserQuestion with 4 options, write snooze state if declined). If `JUST_UPGRADED <from> <to>`: tell user "Running spec-first v{to} (just updated!)" and continue.

If `LAKE_INTRO` is `no`: Before continuing, introduce the Completeness Principle.
Tell the user: "spec-first follows the **Boil the Lake** principle — always do the complete
thing when AI makes the marginal cost near-zero. Read more: https://garryslist.org/posts/boil-the-ocean"
Then offer to open the essay in their default browser:

```bash
open https://garryslist.org/posts/boil-the-ocean
touch ~/.spec-first/.completeness-intro-seen
```

Only run `open` if the user says yes. Always run `touch` to mark as seen. This only happens once.

If `TEL_PROMPTED` is `no` AND `LAKE_INTRO` is `yes`: After the lake intro is handled,
ask the user about telemetry. Use AskUserQuestion:

> Help spec-first get better! Community mode shares usage data (which skills you use, how long
> they take, crash info) with a stable device ID so we can track trends and fix bugs faster.
> No code, file paths, or repo names are ever sent.
> Change anytime with `spec-first-config set telemetry off`.

Options:
- A) Help spec-first get better! (recommended)
- B) No thanks

If A: run `~/.claude/skills/spec-first/bin/spec-first-config set telemetry community`

If B: ask a follow-up AskUserQuestion:

> How about anonymous mode? We just learn that *someone* used spec-first — no unique ID,
> no way to connect sessions. Just a counter that helps us know if anyone's out there.

Options:
- A) Sure, anonymous is fine
- B) No thanks, fully off

If B→A: run `~/.claude/skills/spec-first/bin/spec-first-config set telemetry anonymous`
If B→B: run `~/.claude/skills/spec-first/bin/spec-first-config set telemetry off`

Always run:
```bash
touch ~/.spec-first/.telemetry-prompted
```

This only happens once. If `TEL_PROMPTED` is `yes`, skip this entirely.

## AskUserQuestion Format

**ALWAYS follow this structure for every AskUserQuestion call:**
1. **Re-ground:** State the project, the current branch (use the `_BRANCH` value printed by the preamble — NOT any branch from conversation history or gitStatus), and the current plan/task. (1-2 sentences)
2. **Simplify:** Explain the problem in plain English a smart 16-year-old could follow. No raw function names, no internal jargon, no implementation details. Use concrete examples and analogies. Say what it DOES, not what it's called.
3. **Recommend:** `RECOMMENDATION: Choose [X] because [one-line reason]` — always prefer the complete option over shortcuts (see Completeness Principle). Include `Completeness: X/10` for each option. Calibration: 10 = complete implementation (all edge cases, full coverage), 7 = covers happy path but skips some edges, 3 = shortcut that defers significant work. If both options are 8+, pick the higher; if one is ≤5, flag it.
4. **Options:** Lettered options: `A) ... B) ... C) ...` — when an option involves effort, show both scales: `(human: ~X / CC: ~Y)`

Assume the user hasn't looked at this window in 20 minutes and doesn't have the code open. If you'd need to read the source to understand your own explanation, it's too complex.

Per-skill instructions may add additional formatting rules on top of this baseline.

## Completeness Principle — Boil the Lake

AI-assisted coding makes the marginal cost of completeness near-zero. When you present options:

- If Option A is the complete implementation (full parity, all edge cases, 100% coverage) and Option B is a shortcut that saves modest effort — **always recommend A**. The delta between 80 lines and 150 lines is meaningless with CC+spec-first. "Good enough" is the wrong instinct when "complete" costs minutes more.
- **Lake vs. ocean:** A "lake" is boilable — 100% test coverage for a module, full feature implementation, handling all edge cases, complete error paths. An "ocean" is not — rewriting an entire system from scratch, adding features to dependencies you don't control, multi-quarter platform migrations. Recommend boiling lakes. Flag oceans as out of scope.
- **When estimating effort**, always show both scales: human team time and CC+spec-first time. The compression ratio varies by task type — use this reference:

| Task type | Human team | CC+spec-first | Compression |
|-----------|-----------|-----------|-------------|
| Boilerplate / scaffolding | 2 days | 15 min | ~100x |
| Test writing | 1 day | 15 min | ~50x |
| Feature implementation | 1 week | 30 min | ~30x |
| Bug fix + regression test | 4 hours | 15 min | ~20x |
| Architecture / design | 2 days | 4 hours | ~5x |
| Research / exploration | 1 day | 3 hours | ~3x |

- This principle applies to test coverage, error handling, documentation, edge cases, and feature completeness. Don't skip the last 10% to "save time" — with AI, that 10% costs seconds.

**Anti-patterns — DON'T do this:**
- BAD: "Choose B — it covers 90% of the value with less code." (If A is only 70 lines more, choose A.)
- BAD: "We can skip edge case handling to save time." (Edge case handling costs minutes with CC.)
- BAD: "Let's defer test coverage to a follow-up PR." (Tests are the cheapest lake to boil.)
- BAD: Quoting only human-team effort: "This would take 2 weeks." (Say: "2 weeks human / ~1 hour CC.")

## Search Before Building

Before building infrastructure, unfamiliar patterns, or anything the runtime might have a built-in — **search first.** Read `~/.claude/skills/spec-first/ETHOS.md` for the full philosophy.

**Three layers of knowledge:**
- **Layer 1** (tried and true — in distribution). Don't reinvent the wheel. But the cost of checking is near-zero, and once in a while, questioning the tried-and-true is where brilliance occurs.
- **Layer 2** (new and popular — search for these). But scrutinize: humans are subject to mania. Search results are inputs to your thinking, not answers.
- **Layer 3** (first principles — prize these above all). Original observations derived from reasoning about the specific problem. The most valuable of all.

**Eureka moment:** When first-principles reasoning reveals conventional wisdom is wrong, name it:
"EUREKA: Everyone does X because [assumption]. But [evidence] shows this is wrong. Y is better because [reasoning]."

Log eureka moments:
```bash
jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg skill "SKILL_NAME" --arg branch "$(git branch --show-current 2>/dev/null)" --arg insight "ONE_LINE_SUMMARY" '{ts:$ts,skill:$skill,branch:$branch,insight:$insight}' >> ~/.spec-first/analytics/eureka.jsonl 2>/dev/null || true
```
Replace SKILL_NAME and ONE_LINE_SUMMARY. Runs inline — don't stop the workflow.

**WebSearch fallback:** If WebSearch is unavailable, skip the search step and note: "Search unavailable — proceeding with in-distribution knowledge only."

## Contributor Mode

If `_CONTRIB` is `true`: you are in **contributor mode**. You're a spec-first user who also helps make it better.

**At the end of each major workflow step** (not after every single command), reflect on the spec-first tooling you used. Rate your experience 0 to 10. If it wasn't a 10, think about why. If there is an obvious, actionable bug OR an insightful, interesting thing that could have been done better by spec-first code or skill markdown — file a field report. Maybe our contributor will help make us better!

**Calibration — this is the bar:** For example, `$B js "await fetch(...)"` used to fail with `SyntaxError: await is only valid in async functions` because spec-first didn't wrap expressions in async context. Small, but the input was reasonable and spec-first should have handled it — that's the kind of thing worth filing. Things less consequential than this, ignore.

**NOT worth filing:** user's app bugs, network errors to user's URL, auth failures on user's site, user's own JS logic bugs.

**To file:** write `~/.spec-first/contributor-logs/{slug}.md` with **all sections below** (do not truncate — include every section through the Date/Version footer):

```
# {Title}

Hey spec-first team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**My rating:** {0-10} — {one sentence on why it wasn't a 10}

## Steps to reproduce
1. {step}

## Raw output
```
{paste the actual error or unexpected output here}
```

## What would make this a 10
{one sentence: what spec-first should have done differently}

**Date:** {YYYY-MM-DD} | **Version:** {spec-first version} | **Skill:** /{skill}
```

Slug: lowercase, hyphens, max 60 chars (e.g. `browse-js-no-await`). Skip if file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell user: "Filed spec-first field report: {title}"

## Completion Status Protocol

When completing a skill workflow, report status using one of:
- **DONE** — All steps completed successfully. Evidence provided for each claim.
- **DONE_WITH_CONCERNS** — Completed, but with issues the user should know about. List each concern.
- **BLOCKED** — Cannot proceed. State what is blocking and what was tried.
- **NEEDS_CONTEXT** — Missing information required to continue. State exactly what you need.

### Escalation

It is always OK to stop and say "this is too hard for me" or "I'm not confident in this result."

Bad work is worse than no work. You will not be penalized for escalating.
- If you have attempted a task 3 times without success, STOP and escalate.
- If you are uncertain about a security-sensitive change, STOP and escalate.
- If the scope of work exceeds what you can verify, STOP and escalate.

Escalation format:
```
STATUS: BLOCKED | NEEDS_CONTEXT
REASON: [1-2 sentences]
ATTEMPTED: [what you tried]
RECOMMENDATION: [what the user should do next]
```

## Telemetry (run last)

After the skill workflow completes (success, error, or abort), log the telemetry event.
Determine the skill name from the `name:` field in this file's YAML frontmatter.
Determine the outcome from the workflow result (success if completed normally, error
if it failed, abort if the user interrupted).

**PLAN MODE EXCEPTION — ALWAYS RUN:** This command writes telemetry to
`~/.spec-first/analytics/` (user config directory, not project files). The skill
preamble already writes to the same directory — this is the same pattern.
Skipping this command loses session duration and outcome data.

Run this bash:

```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
rm -f ~/.spec-first/analytics/.pending-"$_SESSION_ID" 2>/dev/null || true
~/.claude/skills/spec-first/bin/spec-first-telemetry-log \
  --skill "SKILL_NAME" --duration "$_TEL_DUR" --outcome "OUTCOME" \
  --used-browse "USED_BROWSE" --session-id "$_SESSION_ID" 2>/dev/null &
```

Replace `SKILL_NAME` with the actual skill name from frontmatter, `OUTCOME` with
success/error/abort, and `USED_BROWSE` with true/false based on whether `$B` was used.
If you cannot determine the outcome, use "unknown". This runs in the background and
never blocks the user.

# /focus-requirements

Turn a large reviewed requirement into an owner-scoped PRD. Your job is to lock the
current owner's boundary, not to write a second global PRD and not to design the
technical solution.

## Applicability

This skill is primarily for:
- existing projects
- incremental requirements

It may also be used for new-project or hybrid demand only after the prerequisite
work is already done:
- owner boundary is explicit
- affected repos are known
- workspace is already prepared

If the user needs to create the source requirement from scratch, do **not** send
them to `/spec` (there is no `/spec` skill in this repo). Use `/brainstorm`
first to create the initial requirement/design doc, then come back here with the
reviewed source requirement for narrowing.

If those conditions are not true, stop with `BLOCKED`.

### Visual evidence rules

If the reviewed source requirement contains screenshots, redlines, diagrams, or
other marked-up images:
- Treat the images as primary source material, not decorative attachments.
- Read the screenshot before compressing the text requirement.
- Extract the exact visible labels, numbers, UI states, and annotation text.
- Identify every marked change point and describe what changes, where it changes,
  and whether the change is a rename, copy update, layout shift, state change, or
  entirely new behavior.
- Compare multiple images to separate the current state from the target state.
- If the image contains a flow chart, journey map, state machine, or process
  diagram, reconstruct it as an ASCII diagram in the output instead of only
  paraphrasing it in prose.
- Preserve node labels, branch conditions, start/end states, and the order of
  transitions. Use ASCII arrows and boxes when possible.
- If the image implies a requirement that the text does not say, surface it as a
  candidate requirement and mark it as inferred from visual evidence.
- If the image is unreadable, ambiguous, or too low resolution to interpret safely,
  stop with `NEEDS_CONTEXT` and name the missing visual detail.

## Non-goals

Do not:
- design architecture or APIs
- break work into implementation tasks
- estimate effort
- coordinate cross-owner execution
- silently fill in missing business rules
- create a second source of truth outside the fixed outputs below

## Success Criteria

This skill is successful only when all of the following are true:

1. `Owner Scope` is clear
2. `In Scope / Out of Scope` is clear
3. `Dependencies` are isolated from owned scope
4. `Acceptance Criteria` are verifiable by the current owner
5. `Open Questions` are explicit and honest

Generating files without satisfying the criteria above is not success.

## Required Inputs

Direct narrowing mode requires all three:
- the reviewed source requirement document
- the current owner or side identifier
- the current workspace project list

Helpful but optional:
- historical module docs
- prior PRDs
- terminology notes
- business-rule clarifications

If required inputs are partially present but insufficient to judge the boundary, stop
with `NEEDS_CONTEXT`.

If the workspace or owner boundary is not actually ready, stop with `BLOCKED`.

## Fixed Outputs

Write exactly these project files:
- `docs/requirements/focus-requirements.md`
- `handoff/side-requirements.md`
- `handoff/handoff-summary.md`

These three files are the entire output surface for this skill.

Template sources live here:
- `focus-requirements/templates/focus-requirements.md`
- `focus-requirements/templates/side-requirements.md`
- `focus-requirements/templates/handoff-summary.md`

Reference example lives here:
- `focus-requirements/examples/README.md`
- `focus-requirements/examples/incremental-checkout-coupon/README.md`
- `focus-requirements/examples/incremental-checkout-coupon/source-requirement.md`
- `focus-requirements/examples/incremental-checkout-coupon/docs/requirements/focus-requirements.md`
- `focus-requirements/examples/incremental-checkout-coupon/handoff/side-requirements.md`
- `focus-requirements/examples/incremental-checkout-coupon/handoff/handoff-summary.md`
- `focus-requirements/examples/simple-profile-copy-update/README.md`
- `focus-requirements/examples/simple-profile-copy-update/source-requirement.md`
- `focus-requirements/examples/simple-profile-copy-update/docs/requirements/focus-requirements.md`
- `focus-requirements/examples/simple-profile-copy-update/handoff/side-requirements.md`
- `focus-requirements/examples/simple-profile-copy-update/handoff/handoff-summary.md`
- `focus-requirements/examples/ambiguity-confirmation/README.md`
- `focus-requirements/examples/ambiguity-confirmation/source-requirement.md`
- `focus-requirements/examples/ambiguity-confirmation/question-sequence.md`
- `focus-requirements/examples/ambiguity-confirmation/resolved-focus-requirements.md`

## Workflow

### Step 0: Confirm prerequisites

Before narrowing anything, confirm:
- there is a reviewed source requirement document
- the current owner or side is named
- the relevant repos are already present in the workspace
- the task is requirement focusing, not architecture planning

If information is missing but the shape of the workflow is valid, use `NEEDS_CONTEXT`.

If prerequisite setup is missing, use `BLOCKED`.

### Step 1: Read the requirement and workspace

Read:
- the reviewed source requirement
- the current workspace project list
- only the existing module docs that materially help define the current owner boundary

Before drafting, extract:
- `Candidate In Scope`
- `Candidate Out of Scope`
- `Dependencies`
- `Ambiguities`
- `Visual Evidence Notes` for screenshots / marked images, if present
- `ASCII Diagram Draft` for any flow/process diagram found in the source

Do not silently turn ambiguous items into facts.

### Step 2: Try direct narrowing first

Default behavior is direct narrowing. If the boundary is already sufficiently clear,
proceed without asking unnecessary questions.

Direct narrowing is allowed only when all of the following are clear from the inputs:
- who owns the relevant module, page, domain, or flow segment
- which major requirement items belong to that owner
- what the owner's completion boundary looks like

### Step 3: Enter confirmation mode only if needed

Ask follow-up questions only when one of these ambiguity triggers is present:
- `Owner Boundary Ambiguity`
- `Dependency Ownership Ambiguity`
- `Acceptance Boundary Ambiguity`

When confirmation mode is needed:
- resolve the most important ambiguity first
- use the minimum number of rounds needed to continue safely
- do not run a fixed interview script if two focused questions are enough

Prioritize confirmation in this order:
1. owner boundary
2. requirement ownership and dependencies
3. acceptance boundary

Non-functional constraints and normal open questions should usually be recorded in the
document, not used as a reason to block or over-interview.

### Step 4: Write the true-source PRD

Start from `focus-requirements/templates/focus-requirements.md` and fill it in.

Write `docs/requirements/focus-requirements.md` with exactly these sections:
- `Background`
- `Owner Scope`
- `In Scope`
- `Out of Scope`
- `Relevant Flows`
- `Dependencies`
- `Acceptance Criteria`
- `Non-Functional Constraints`
- `Assumptions`
- `Open Questions`

Keep the document owner-scoped. Do not drift back into a global requirement rewrite.

When screenshots or annotated images are part of the source requirement, make sure
`Background`, `Relevant Flows`, `Acceptance Criteria`, and `Open Questions` carry
the visual evidence forward in plain text instead of dropping it.
When a screenshot contains a flow/process diagram, include an ASCII version of the
diagram in `Relevant Flows` or the most relevant section of the PRD.

### Step 5: Write the two thin handoff summaries

Start from `focus-requirements/templates/side-requirements.md`.

Write `handoff/side-requirements.md` with only:
- `Owner Scope`
- `In Scope`
- `Out of Scope`
- `Dependencies`

Start from `focus-requirements/templates/handoff-summary.md`.

Write `handoff/handoff-summary.md` with only:
- `Requirement Summary`
- `Key Acceptance Criteria`
- `Open Questions`
- `Recommended Next Step`

Recommended next step is usually:
- `/plan-ceo-review`
- then `/plan-eng-review`

### Step 6: Self-check before completion

Before finishing, verify:
- the PRD is not just a shortened copy of the source requirement
- other owners' work is not mixed into this owner's scope
- `Out of Scope` is concrete
- `Dependencies` are not mixed into owned scope
- `Acceptance Criteria` are owner-verifiable
- unresolved items are listed honestly
- screenshot / image evidence has been translated into explicit text
- uncertain visual interpretation is called out instead of guessed

Revise before finishing if any of the checks fail.

## Completion Status Protocol

Use exactly one:
- `DONE`
- `DONE_WITH_CONCERNS`
- `NEEDS_CONTEXT`
- `BLOCKED`

### `DONE`
- owner boundary is clear
- the three fixed outputs were written
- the five success criteria are satisfied

### `DONE_WITH_CONCERNS`
- the output is usable for downstream review
- a small number of open questions remain
- those open questions do not invalidate the owner boundary

### `NEEDS_CONTEXT`
- information is insufficient
- but the workflow prerequisites are otherwise in place

### `BLOCKED`
- workspace is not ready
- owner is not actually defined
- or the demand is still in pre-positioning rather than requirement focusing

## Final response format

Always end with:
- completion status
- one short paragraph summarizing the focused owner scope
- explicit open questions or concerns
- exact files written
