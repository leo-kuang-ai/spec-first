---
name: spec-strategy
description: "Create or update STRATEGY.md. Use when starting a product, changing direction or roadmap, or when spec-ideate, spec-brainstorm, or spec-plan need upstream product grounding."
argument-hint: "[optional: section to revisit, e.g. 'metrics' or 'approach']"
---

# Product Strategy

Note: Use the current date from the active host context. Use this when weighting external sources and dating artifacts.

`spec-strategy` writes and maintains its owned sections in the shared `STRATEGY.md` project document - a short, durable anchor document that captures what the product is, who it serves, how it succeeds, and where the team is investing. It lives at the repo root as a canonical, well-known file (peer of `README.md`). Downstream skills (`spec-ideate`, `spec-brainstorm`, `spec-plan`) read it as grounding when it exists.

The document is short and structured on purpose. Good answers to a handful of sharp questions produce a better strategy than any amount of prose. This skill asks those questions, pushes back on weak answers, and writes the doc.

## Boundaries

- Strategy is an anchor, not a plan; features, schedules, and implementation plans belong to their owning workflows.
- The repository grounds questions but never fills in the user's answers.
- Update only the target section's content. Before editing an existing file, read `references/update-run.md`: maintain local template headings and order in a solely-owned file; preserve shape and order in a multi-writer file. Do not edit `author-approved` sections or documents the user does not own; report conflicts or reference them in a separately authorized file.
- Keep the document short and leave room for future changes.

## Interaction Method

Default to the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

Ask one question at a time. Prefer free-form responses for the substantive sections (problem, approach, persona); reserve single-select for routing decisions (which section to revisit). Each option label must be self-contained.

## Grounding

Before Phase 0 and before building the repo model, read `references/grounding.md`. It owns source selection, the distinction between recent activity and product intent, the empty-repository path, and the grounded summary before the first question.

## Focus Hint

Arguments from the user or upstream caller are optional focus hints naming a section or scope. Map `positioning`/`approach` to Our approach, `users`/`who it's for` to Who it's for, and `boundaries` to Not working on by meaning; the hint itself does not rename the document. Without a focus, file state determines the route.

## Core Principles

1. **Anchor, not plan.** Strategy is what the product is and why. Features belong in `spec-brainstorm`; schedules belong in the issue tracker. Do not let either creep into the doc. When declining such creep, name the destination explicitly (`spec-brainstorm` for features, the issue tracker for schedules) — a bare refusal or a generic "put it elsewhere" leaves the owner without a route.
2. **Rigor in the questions, not the headings.** The section headers are plain English. The interview questions enforce strategy discipline.
3. **Short is a feature.** The template is constrained. Adding sections costs more than it looks like. Push back on expansion.
4. **Durable across runs.** This skill is rerunnable. On a second run it updates in place, preserves what is working, and only challenges sections that look stale or weak.

## Execution Flow

### Phase 0: Route by File State

Read `STRATEGY.md` using the native file-read tool.

- **File does not exist** -> First run. Apply the grounding reference's legacy sibling fold/link path before Phase 1.
- **File exists and argument names a specific section** -> Targeted update. Go to Phase 2.
- **File exists, no argument** -> Phase 2. The update reference selects the target section after the drift summary.

Announce the path in one line: "Strategy doc not found - let's write it." or "Found existing strategy - let's review and update."

### Phase 1: First-Run Interview

Read `references/interview.md`. This load is non-optional - the pushback rules, anti-pattern examples, and quality bar for each section live there. Improvising from memory produces a passive transcription instead of a strategy doc.

Interview in this order; the final document follows the local template's section order:

1. Target problem
2. Our approach
3. Who it's for
4. Key metrics
5. Tracks
6. Stress test (an interview check, not a new document section)
7. Not working on (required in a new house-format document)
8. Milestones (optional)
9. Marketing (optional)

For each section, ask the opening question, apply the pushback rules, and capture the final answer in the user's own language. Do not skip the pushback step - it is the core of the skill. Two rounds of pushback per section maximum; capture what the user has given after that and note the section is worth revisiting on the next run.

Once the first five sections, stress test, and Not working on have answers, read `references/strategy-template.md`, draft with its headings and order, and show the draft with one edit opportunity. When current explicit authorization covers writing the draft, proceed without turning optional feedback into a waiting gate. After two rounds, record unresolved answers as given and suggest revisiting them; do not invent answers or block the whole interview.

### Phase 2: Update Run

Before the summary, drift check, or questions, read `references/update-run.md`. It owns document shape, author protection, drift candidates, target selection, and date updates; do not edit an existing file without reading it. `references/interview.md` still supplies the selected section's questions and two-round pushback cap.

### Phase 3: Downstream Handoff

After writing, note in one line where the file lives and that `spec-ideate`, `spec-brainstorm`, and `spec-plan` will pick it up as grounding on their next run.

If no downstream skill has run yet on this repo, suggest `spec-ideate` or `spec-brainstorm` skills as a next step.

## What This Skill Does Not Do

- Does not update the issue tracker or reconcile in-flight work. Strategy is the doc; execution lives elsewhere.
- Does not prioritize the backlog. Prioritization is a separate workflow.
- Does not write product requirements or implementation plans - those are `spec-brainstorm` and `spec-plan`.
- Does not compute metric values. It records which metrics matter and where they live, not what they read today.

## Learn More

The "Target problem / Our approach / Tracks" structure is informed by Richard Rumelt's *Good Strategy Bad Strategy* - specifically his kernel of diagnosis, guiding policy, and coherent action. The interview questions in `references/interview.md` are designed to push past the patterns he calls "bad strategy": fluff, goals dressed up as strategy, and feature lists in place of a guiding choice. The book is the recommended follow-up reading if the distinction between a slogan and a strategy is not yet sharp.
