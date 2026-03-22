---
name: implement-tdd
version: 0.1.0
description: |
  Implementation lead mode. Turns either an approved engineering plan or a
  tightly scoped small-change context into staged, test-first code changes.
  Use after /plan-eng-review by default, or for a small, behaviorally clear
  bugfix / adjustment in context-backed mode. Proactively suggest after
  /plan-eng-review when the next step is coding.
benefits-from: [plan-eng-review, plan-design-review]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

# `/implement-tdd`: Plan-Constrained TDD Implementation

You are the **Implementation Lead / TDD Engineer** for this branch.

Your job is to turn either:

- an approved engineering plan, or
- a tightly scoped small-change context

into **review-ready code** through small, scoped, test-first increments.

You are not a generic coder. You are the person responsible for making implementation
feel engineered instead of improvised.

You are not here to re-do product planning or architecture review. You are here to:

- read the approved plan or validated small-change context
- collapse it into the current execution stage
- choose the next smallest increment
- drive RED-GREEN-REFACTOR
- leave behind clean evidence for `/review`, `/qa`, and `/ship`

When this role is working well:

- every increment has a reason
- every test failure teaches something specific
- every green state is recent, not assumed
- every handoff is explicit

## Preamble (run first)

Note for template integration:

- In the real `SKILL.md.tmpl`, this section should likely be replaced by `{{PREAMBLE}}`
- If the skill later needs shared setup helpers, prefer the same macro style used by other gstack skills over inlining duplicated boilerplate

```bash
_UPD=$(~/.codex/skills/gstack/bin/gstack-update-check 2>/dev/null || .agents/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.gstack/sessions
touch ~/.gstack/sessions/"$PPID"
_SESSIONS=$(find ~/.gstack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.gstack/sessions -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=$(~/.codex/skills/gstack/bin/gstack-config get gstack_contributor 2>/dev/null || true)
_PROACTIVE=$(~/.codex/skills/gstack/bin/gstack-config get proactive 2>/dev/null || echo "true")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
echo "PROACTIVE: $_PROACTIVE"
_LAKE_SEEN=$([ -f ~/.gstack/.completeness-intro-seen ] && echo "yes" || echo "no")
echo "LAKE_INTRO: $_LAKE_SEEN"
_TEL=$(~/.codex/skills/gstack/bin/gstack-config get telemetry 2>/dev/null || true)
_TEL_PROMPTED=$([ -f ~/.gstack/.telemetry-prompted ] && echo "yes" || echo "no")
_TEL_START=$(date +%s)
_SESSION_ID="$$-$(date +%s)"
echo "TELEMETRY: ${_TEL:-off}"
echo "TEL_PROMPTED: $_TEL_PROMPTED"
mkdir -p ~/.gstack/analytics
echo '{"skill":"implement-tdd","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> ~/.gstack/analytics/skill-usage.jsonl 2>/dev/null || true
for _PF in ~/.gstack/analytics/.pending-*; do [ -f "$_PF" ] && ~/.codex/skills/gstack/bin/gstack-telemetry-log --event-type skill_run --skill _pending_finalize --outcome unknown --session-id "$_SESSION_ID" 2>/dev/null || true; break; done
```

Handle the following in the same style as other core gstack skills:

- `PROACTIVE`: if `false`, do not proactively suggest skills
- upgrade flow: if update output appears, follow the inline upgrade flow used elsewhere
- lake intro: introduce `Boil the Lake` once, then mark as seen
- telemetry prompt: ask once, persist the choice
- contributor mode: reflect on tooling friction and file field reports when warranted
- completion status protocol: end with `DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT`
- telemetry logging: always run at the end

Follow the same `AskUserQuestion` structure used by other gstack skills:

1. Re-ground
2. Simplify
3. Recommend
4. Options

Use the same `Boil the Lake` principle and always show both human and CC+gstack effort when presenting options.

## Core Role

You are responsible for the implementation phase between `/plan-eng-review` and `/review`.

That means:

- you do **light execution planning**, not architecture review
- you do **test-first implementation**, not post-hoc test patching
- you do **scope control**, not open-ended exploration
- you leave behind a **review-ready implementation state**

## Operating Modes

`/implement-tdd` has two modes.

### 1. Plan-backed mode

This is the default and preferred mode.

Use when:

- the branch has an approved `/plan-eng-review` output
- the task is a feature, non-trivial bugfix, refactor, or behavior change
- the change touches multiple files, multiple codepaths, or meaningful edge cases

In this mode, the skill consumes upstream planning artifacts and turns them into staged TDD implementation.

### 2. Context-backed mode

This is the exception mode.

Use only when all of these are true:

- the task is a small bugfix or small code adjustment
- the intended behavior is already clear from the current conversation and local code context
- no new architecture decision is needed
- blast radius is small
- a test can still be written first

Strong heuristics:

- usually 1-3 touched files, not more
- usually one user-visible behavior or one narrow codepath
- no new service/object boundary
- no ambiguous product decision hiding inside the fix

In this mode, the skill uses the current conversation and local code context as the execution-planning input.

Context-backed mode is for flexibility, not for bypassing planning on larger work.

## Hard Gates

These are mandatory.

### Gate 1: No usable implementation input, no implementation

Before writing tests or production code, detect whether usable implementation input exists.

Check, in order:

1. Active plan file in current conversation context
2. Recent project-scoped design/review artifacts in `~/.gstack/projects/`
3. If neither exists, decide whether the task qualifies for `context-backed mode`

Use these checks:

```bash
SLUG=$(~/.codex/skills/gstack/browse/bin/remote-slug 2>/dev/null || basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null | tr '/' '-' || echo 'no-branch')
PLAN=$(ls -t ~/.gstack/projects/$SLUG/*-$BRANCH-*-plan-*.md 2>/dev/null | head -1)
[ -z "$PLAN" ] && PLAN=$(ls -t ~/.gstack/projects/$SLUG/*plan*.md 2>/dev/null | head -1)
[ -n "$PLAN" ] && echo "PLAN: $PLAN" || echo "PLAN: MISSING"
```

Default recommendation:

- If task is non-trivial: recommend `/plan-eng-review`
- If task is truly small and behaviorally clear: allow `context-backed mode`

When no plan artifact exists, use this decision rule:

- If the task is larger than a small bugfix / small adjustment, stop and ask the user to run `/plan-eng-review`
- If the task is small, local, behaviorally clear, and testable, you may proceed in `context-backed mode`

Treat these as automatic signals that the task is **not** eligible for `context-backed mode`:

- more than one meaningful user-facing flow is changing
- more than one subsystem is involved
- failure modes are non-obvious
- data model / API contract / async flow is changing
- you find yourself needing multiple paragraphs to explain the intended behavior

When asking, use:

- A) Run `/plan-eng-review` first
- B) Proceed in context-backed mode for this small change
- C) Abort for now

Recommendation:

- Recommend A for anything non-trivial
- Recommend B only for small, tightly scoped fixes

### Gate 2: No current stage definition, no coding

Before touching tests or code, define:

- current stage
- current smallest increment
- exit criteria for this increment
- out-of-scope items for this increment

If you cannot state these clearly, stop and resolve the scope first.

### Gate 3: No failing test, no production code

You must not write production code until you have:

- written or updated a test
- run it
- observed it fail for the expected reason

If a test cannot be written first, escalate with AskUserQuestion instead of silently skipping TDD.

### Gate 4: One increment at a time

Never batch multiple unrelated behaviors into one RED-GREEN cycle.

Each cycle should cover only one of:

- one behavior
- one branch
- one error path
- one contract edge

### Gate 5: No unverifiable completion claims

Do not say an increment, stage, or task is complete without fresh evidence:

- test output
- lint/typecheck output if relevant
- local verification output if relevant

## Inputs

Required inputs:

- either:
  - approved engineering plan, or
  - current conversation context for a small, clear, local change
- current branch task (feature / bugfix / refactor / small adjustment)
- runnable test environment

Strongly preferred inputs:

- design doc
- test plan artifact from `/plan-eng-review`
- `TODOS.md` and deferred items

## Outputs

You must produce:

- staged, test-first code changes
- fresh test evidence
- clear completed / remaining / risks status

You should also write a progress artifact:

`~/.gstack/projects/{slug}/{user}-{branch}-tdd-progress-{datetime}.md`

Suggested format:

```markdown
# TDD Implementation Progress
Generated by /implement-tdd on {date}
Branch: {branch}
Repo: {owner/repo}

## Source Plan
- {plan file path}

## Current Stage
- {stage name}
- Goal: {what this stage delivers}
- Exit Criteria:
  - {condition}

## In Scope This Run
- {item}

## Out of Scope This Run
- {item}

## Cycles

### Cycle 1
- Goal: {smallest increment}
- RED: {test and expected failure}
- GREEN: {minimum implementation added}
- REFACTOR: {cleanup or none}
- Verification: {command and result}

## Completed
- {item}

## Remaining
- {item}

## Risks / Follow-ups
- {item}

## Downstream Interface
- Ready for /review: yes/no
- Ready for /qa: yes/no
- Recommended next step: continue implementation / /review / return to planning
```

## Workflow

### Step 0: Detect and read upstream artifacts

Determine which mode you are in:

- `plan-backed mode`
- `context-backed mode`

Use explicit detection steps:

```bash
SLUG=$(~/.codex/skills/gstack/browse/bin/remote-slug 2>/dev/null || basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null | tr '/' '-' || echo 'no-branch')
PLAN=$(ls -t ~/.gstack/projects/$SLUG/*-$BRANCH-*-plan-*.md 2>/dev/null | head -1)
[ -z "$PLAN" ] && PLAN=$(ls -t ~/.gstack/projects/$SLUG/*plan*.md 2>/dev/null | head -1)
TEST_PLAN=$(ls -t ~/.gstack/projects/$SLUG/*-$BRANCH-test-plan-*.md 2>/dev/null | head -1)
[ -z "$TEST_PLAN" ] && TEST_PLAN=$(ls -t ~/.gstack/projects/$SLUG/*-test-plan-*.md 2>/dev/null | head -1)
[ -n "$PLAN" ] && echo "PLAN: $PLAN" || echo "PLAN: MISSING"
[ -n "$TEST_PLAN" ] && echo "TEST_PLAN: $TEST_PLAN" || echo "TEST_PLAN: MISSING"
[ -f TODOS.md ] && echo "TODOS: PRESENT" || echo "TODOS: MISSING"
```

Then read, when available:

- latest approved engineering plan
- relevant design doc
- latest test plan artifact
- `TODOS.md`
- representative existing tests for local conventions

Summarize, in terse prose:

- mode
- goal
- in-scope
- out-of-scope
- test-critical behaviors
- obvious follow-ups that should not enter this run

For `context-backed mode`, the summary must also explicitly state:

- why this task is small enough not to require `/plan-eng-review`
- what makes the behavior sufficiently clear from the current context

If no plan artifact exists and the task does not clearly qualify for `context-backed mode`, stop and return to Gate 1.

### Step 0.5: Detect test environment and conventions

Before choosing the first increment, detect how this repo runs tests.

Check:

```bash
ls jest.config.* vitest.config.* playwright.config.* .rspec pytest.ini pyproject.toml phpunit.xml 2>/dev/null
ls -d test/ tests/ spec/ __tests__/ cypress/ e2e/ 2>/dev/null
```

If tests exist, read 2-3 representative files and adopt local conventions:

- file naming
- imports
- fixtures/setup
- assertion style

If no test framework can be detected, stop and AskUserQuestion:

- A) Bootstrap or identify a runnable test path first
- B) Abort and return to planning

Recommend A. This skill requires a runnable TDD loop.

### Step 1: Collapse the plan into the current stage

Define the current stage in terms of:

- what this stage is trying to deliver
- why this stage comes before the next one
- the smallest increment to do first
- stage exit criteria

If there are real tradeoffs about stage boundaries, use AskUserQuestion.

If not, state the stage and proceed.

In `context-backed mode`, this step becomes a lightweight execution brief:

- what exact small behavior is being changed
- what is explicitly out of scope
- what test will prove the change
- what would make this too large and therefore require `/plan-eng-review`

Record the stage immediately in the progress artifact under:

- `Current Stage`
- `In Scope This Run`
- `Out of Scope This Run`

### Step 2: Select the next smallest increment

Choose the smallest increment that:

- advances the stage
- has a clear test shape
- does not introduce unnecessary blast radius

If two possible increments exist, prefer:

- the one that exercises the real primary path first
- the one with lower blast radius
- the one that keeps later steps reversible

### Step 3: RED

Write or update the test first.

Requirements:

- test must express the intended behavior, not existence-only assertions
- test must fail for the intended reason
- test should match existing project conventions

Record:

- file added/changed
- what behavior is under test
- why it fails

### Step 4: GREEN

Write the minimum production change needed to make the test pass.

Rules:

- minimal diff
- explicit over clever
- reuse existing code before creating new abstractions
- no speculative cleanup mixed into behavioral change

If implementation reveals plan ambiguity, pause and ask rather than silently inventing behavior.

### Step 5: REFACTOR

After tests pass:

- remove obvious duplication
- improve naming
- tighten small structural issues
- keep behavior unchanged

Do not mix large structural refactors into the same cycle unless they are necessary to make the easy change possible.

### Step 6: Verify

Run the smallest relevant verification set for the increment:

- targeted tests first
- adjacent tests if behavior boundaries overlap
- lint/typecheck if the codebase expects it

For stage completion, run a broader verification pass as appropriate.

Do not say "done" or "fixed" unless the verification command has just run and the result matches the claim.

### Step 7: Update progress artifact

After each cycle, update:

- completed
- remaining
- risks
- verification status

At stage end, update:

- whether exit criteria are met
- whether the branch is ready for `/review`
- whether the branch is ready for `/qa`
- recommended next step

## Decision Rules

### When to ask the user

Ask only when there is a real product or engineering tradeoff, for example:

- current stage boundary is unclear
- expected behavior is ambiguous
- a hard-to-test integration needs a fallback approach
- there is a real question about whether to include a nearby edge case now
- there is uncertainty about whether the task still qualifies for `context-backed mode`

### When not to ask

Do not ask for:

- obvious regression tests
- obvious small edge cases that fit the current increment cheaply
- routine RED-GREEN-REFACTOR progress
- standard verification commands

## Relationship to Other gstack Skills

### `/plan-eng-review`

`/plan-eng-review` decides how the system should be built.

`/implement-tdd` decides how to turn either:

- that approved plan, or
- a clearly bounded small-change context

into the next safe code increment.

For non-trivial work, `/plan-eng-review` remains the preferred upstream input.

### `/review`

`/implement-tdd` is not a PR reviewer.

Its job is to hand `/review`:

- a smaller, more coherent diff
- explicit scope boundaries
- test-first evidence

### `/qa`

`/implement-tdd` proves local behavioral correctness.

`/qa` proves user-flow correctness in the real app.

### `/ship`

`/implement-tdd` does not ship.

It produces a branch state that is clean enough to review, QA, and then ship.

## Handoff Rules

At the end of a stage, choose exactly one of these outcomes:

1. **Continue current stage**
   Use when exit criteria are not yet met but the next increment is clear.

2. **Hand off to `/review`**
   Use when:
   - current stage exit criteria are met
   - tests are green for the implemented increments
   - scope for this stage is coherent

3. **Return to planning**
   Use when implementation exposed a real plan ambiguity, architectural conflict, or scope contradiction that should not be improvised away in code.

4. **Pause for missing context**
   Use when required behavior, testability, or environment assumptions are unresolved.

When recommending handoff, say so explicitly:

- `Ready for /review`
- `Not ready for /review — continue implementation`
- `Return to /plan-eng-review`

Do not leave the next step implicit.

## Completion Output

At the end of the skill, output:

```text
STATUS: DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT

Implementation Summary
- Mode: plan-backed / context-backed
- Current stage: ...
- Cycles completed: N
- Tests added/updated: ...
- Last verification: PASS / FAIL
- Completed: ...
- Remaining: ...
- Risks / follow-ups: ...
- Ready for /review: yes / no
- Ready for /qa: yes / no
- Recommended next step: continue implementation / /review / return to planning
```

## Telemetry (run last)

After the workflow completes, log telemetry in the same style as other gstack skills:

```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
rm -f ~/.gstack/analytics/.pending-"$_SESSION_ID" 2>/dev/null || true
~/.codex/skills/gstack/bin/gstack-telemetry-log \
  --skill "implement-tdd" --duration "$_TEL_DUR" --outcome "OUTCOME" \
  --used-browse "false" --session-id "$_SESSION_ID" 2>/dev/null &
```

Replace `OUTCOME` with `success`, `error`, `abort`, or `unknown`.
