---
name: spec-debug
description: 'Systematically find root causes and fix bugs. Use when debugging errors, investigating test failures, reproducing bugs from issue trackers (GitHub, Linear, Jira), or when stuck on a problem after failed fix attempts. Also use when the user says ''debug this'', ''why is this failing'', ''fix this bug'', ''trace this error'', ''why is this slow'', or reports a ''performance regression'', or pastes stack traces, error messages, or issue references.'
argument-hint: "[issue reference, error message, test path, or description of broken behavior]"
---

# Debug and Fix

Find root causes, then fix them. This skill investigates bugs systematically — tracing the full causal chain before proposing a fix — and optionally implements the fix with test-first discipline.

<bug_description> #$ARGUMENTS </bug_description>

## Workflow Contract Summary

### When To Use

Use for failing tests, runtime errors, broken behavior, regressions, stack traces, issue references, or repeated failed fix attempts where root cause must be established before changing code.

### When Not To Use

Do not use for planned feature implementation, requirements/plan review, setup/update/runtime drift repair, or obvious non-bug enhancements that belong in `spec-work` or `spec-plan`.

### Inputs

Bug description, issue or error evidence, reproduction path, repo instructions, package/test commands, nearby source/tests, logs, and direct/external-tool evidence as advisory debugging context.

### Outputs

Root-cause explanation, hypothesis/probe evidence, fix when authorized, verification results, residual risks, and a structured handoff or PR-ready summary.

### Artifacts

Tests, traces, logs, issue summaries, code changes, and final debug summary. Generated runtime mirrors are not source unless the bug explicitly targets setup/update/runtime drift.

### Failure Modes

Unreproducible bug, missing environment or credentials, ambiguous target repo, unavailable external-tool evidence for broad impact claims, contradicted hypothesis, unsafe branch state, or failed validation.

### Workflow

Triage the symptom, reproduce or record a not-possible reason, trace the causal path, test hypotheses, apply one scoped fix at a time, rerun the feedback loop, then hand off.

### Downstream Consumers

`spec-work` for larger fixes, `spec-code-review`, PR preparation, issue trackers, and `spec-compound` when the lesson is reusable.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` with high-risk overrides because this workflow can establish root cause and apply fixes.

Overrides: high-risk

- `foreign-residual-workspace` -> `blocked-action-required`: stop before root-cause claims or fixes that rely on stale local artifacts until `spec-first clean --workspace-orphans` preview and `spec-first init` refresh local state, or the user explicitly accepts degraded evidence.
- optional external-tool evidence unavailable -> `fallback-only`: use reproduction, logs, tests, and bounded source reads; do not claim causal links or blast radius that direct evidence did not confirm.
- `non-git-build-workspace` coverage gaps -> `partial`: debug covered git roots normally, and inspect uncovered build modules directly before concluding they are unaffected.

## Examples As Context

When editing or reviewing this workflow prompt, or when running fresh-source eval for debug posture drift, read `skills/spec-debug/evals/examples.json` as examples-as-context. These examples are not a deterministic router, state machine, semantic readiness gate, or substitute for LLM judgment during ordinary debugging runs.

## Core Principles

These principles govern every phase. They are repeated at decision points because they matter most when the pressure to skip them is highest.

1. **Investigate before fixing.** Do not propose a fix until you can explain the full causal chain from trigger to symptom with no gaps. "Somehow X leads to Y" is a gap.
2. **Predictions for uncertain links.** When the causal chain has uncertain or non-obvious links, form a prediction — something in a different code path or scenario that must also be true. If the prediction is wrong but a fix "works," you found a symptom, not the cause. When the chain is obvious (missing import, clear null reference), the chain explanation itself is sufficient.
3. **One change at a time.** Test one hypothesis, change one thing. If you're changing multiple things to "see if it helps," stop — that is shotgun debugging.
4. **When stuck, diagnose why — don't just try harder.**

## Anti-Rationalization Red Flags

| 红旗念头 | 停下来做什么 |
| --- | --- |
| 「我看出 bug 了,跳过复现」 | 先建立最小复现或按二分路径索取捕获证据。没有 red-capable 命令且无捕获证据时,stop 并说明,向用户索取环境/产物/埋点许可;在获得之一前**不得提交 root-cause-confirmed 声明、不得关闭 causal chain gate**(可形成 working hypothesis,但不得声明 confirmed);不要假装有环。 |
| 「root cause 很明显」 | 用源码、日志、测试或运行值补齐 causal chain;不把直觉当 evidence。 |
| 「修完了,手测一下就行」 | 复跑同一个反馈回路并留下 confirmed evidence;不能只写 freeform「tests passed」。 |

这是注意力提醒,不是 gate,也不替代 LLM 判断;最终是否停下、如何处理仍由你按当前证据决定。

## Context Orientation Anchor

Orient debugging from the reported symptom, reproduction path, already-loaded host/project instructions, package manifests and command registries, nearby implementation files, nearby tests, recent diffs, and runtime logs. Treat `AGENTS.md`, `CLAUDE.md`, and project role docs as host instruction sources that are normally already loaded by the current session, not automatic re-read targets for every debug run. Read those source instruction files only when `docs/contracts/context-governance.md`'s Host Instruction Reuse Policy allows it, such as a user-named path, missing/stale loaded context, source/runtime governance work, or a directory-scoped instruction file that may govern changed files. In a parent workspace containing multiple independent Git repos, use bounded direct reads only after the symptom, user request, or plan makes the candidate repo scope clear. Before Phase 3 writes, the bug must have a single explicit `target_repo` or per-fix repo scope; do not let cwd or broad workspace discovery choose a sibling repo for edits.

By default, include `docs/solutions/` recall as an orientation source: directly scan `docs/solutions/` frontmatter (the corpus is small, so a single flat scan surfaces candidates cheaply — do not spawn a recall subagent for this). Skip recall only when the bug already qualifies for the Trivial-bug fast-path (single-file typo, missing import, null dereference, off-by-one) where the bug is its own only lesson. This default-on, skip-on-fast-path shape anchors the decision on the precise fast-path carve-out rather than a fuzzy up-front guess about whether a symptom is "the kind that has prior art" — judge candidate relevance after recall returns, not before. Recalled hits follow the Recall Trust Boundary below — advisory diagnostic pointers, not root-cause proof. Dispatching `spec-learnings-researcher` instead of a direct scan is an upgrade reserved for when the corpus grows enough that flat frontmatter scanning loses precision (the same `knowledge-harness` OQ-2 signal that gates other recall-acceleration), not the default mechanism here.

## Domain Language And Decision Ledger

When symptoms involve domain terminology, policy names, workflow-specific concepts, or ADR-like tradeoffs, consume existing context before asking questions that repo/docs can answer: already-loaded project standards and host instructions, `docs/contracts/`, existing plans/solutions, and any repo-local glossary or ADR-like artifacts that actually exist. Team standards under `docs/standards/**` are consumed through `docs/contracts/team-standards.md`: read the contract and index first, load only matched rule files, and treat confirmed/scope-matched rules as expected invariants rather than root-cause proof. Debug root cause still requires reproduction, source, test, log or runtime evidence. Read `AGENTS.md` / `CLAUDE.md` source only under the Host Instruction Reuse Policy, not as a default domain-context step. Do not require a fixed `CONTEXT.md`, `docs/adr/`, or glossary directory. If those artifacts are absent, treat the gap as advisory and continue with direct reproduction/source evidence.

For major debugging decisions, carry a lightweight decision note: `question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason` when unresolved. Use source tags such as `confirmed`, `advisory`, `session-local`, `stale`, or `user`. Suggest creating an ADR-like artifact only when the fix direction is hard to reverse, would be surprising without context, and reflects a real tradeoff.

## Recall Trust Boundary

Past learnings from `docs/solutions/` are recall advisory candidate evidence. Treat a match as a diagnostic pointer, not as root-cause proof. Use its `source_refs` or upstream `source_reads_required` to return to current source/test/doc evidence, reproduction output, deterministic checks, logs, or human reviewer confirmation before promoting a causal link to confirmed. Do not rely on model self-evaluation; 不依赖模型自评.

## Runtime Context Exclusion

Follow `docs/contracts/context-governance.md`: ordinary Debug context excludes `.spec-first/audits/**`, `.spec-first/governance/**`, and generated mirrors (`.claude/**`, `.codex/**`, `.agents/skills/**`) by default. Runtime logs are task evidence only when they directly reproduce the symptom or the user points to them; do not scan audit snapshots, governance observations, or generated mirrors as source context unless debugging setup/update/runtime drift/audit/governance behavior.

Maintain a run-local context ledger for this workflow: paths read, reason, phase, and compact summary. Reuse loaded summaries within the same workflow run. Re-read only when exact wording is needed, the file changed, prior evidence is insufficient, or the user explicitly asks.

## Direct Debug Evidence Boundary

Debug does not require external-tool readiness before investigation. Use reproduction, direct source reads, `rg`, ast-grep, git diff, focused tests, runtime probes, logs, and user-provided artifacts to build and close the causal chain. If a blast-radius or related-test claim cannot be confirmed from direct evidence, record it as residual risk instead of treating it as root-cause proof.

## Capability-Class Evidence Boundary

Follows `docs/contracts/project-graph-consumption.md`. When setup/runtime facts expose optional `capability-class` candidates such as `code-graph` or `project-graph`, use them only as advisory debugging inputs through their native MCP or CLI surface. Check `readiness_status`, lifecycle display bits, and freshness before using candidate call paths, impact surfaces, or related tests; provider self-reported freshness is not root-cause evidence. A `stale` graph still serves exploration-tier orientation when you annotate that it lags HEAD, but a root-cause conclusion must be re-grounded regardless. When the capability is missing, when readiness facts are unavailable or self-reported as `unknown`/`unverified`, on call failure, or when disabled/unsafe, continue with reproduction, direct source reads, `rg`, ast-grep, focused tests, probes, and logs. Record any used candidate as `provider_untrusted`; never-block debugging on its availability, and keep setup-side `lifecycle.fallback_used` separate from consumption-side fallback notes.

## Execution Flow

| Phase | Name | Purpose |
|-------|------|---------|
| 0 | Triage | Parse input, fetch issue if referenced, proceed to investigation |
| 1 | Investigate | Reproduce the bug, trace the code path |
| 2 | Root Cause | Form hypotheses with predictions for uncertain links, test them, **causal chain gate**, smart escalation |
| 3 | Fix | Only if user chose to fix. Test-first fix with workspace safety checks |
| 4 | Handoff | Structured summary, then prompt the user for the next action |

All phases self-size — a simple bug flows through them in seconds, a complex bug spends more time in each naturally. No complexity classification, no phase skipping.

**Trivial-bug fast-path:** When investigation proves the full causal chain is a narrow, directly observable defect — a single-file typo, missing import, explicit null dereference, or off-by-one — compress Phase 1 and Phase 2 into the smallest evidence pass needed to explain it. Fast-path does not skip Phase 2: still present the root cause, proposed fix, tests, and the **Fix it now** / **Diagnosis only** choice gate. If the user chooses to fix, Phase 3 still starts with the **Workspace and branch check**.

**Negative boundary:** Do not use the fast-path for multi-file causal chains, architecture regressions, state races, permission or environment failures, flaky behavior, or any issue whose invalid state cannot be directly located. Non-trivial bugs still require the full investigation path.

## Feedback Loop And Hypothesis Ledger

Before declaring root cause or proposing a fix, establish or attempt the smallest feedback loop that can observe the symptom. Try these reproducers in roughly this order until you have one that goes red on the bug:

1. **Failing test** at whatever seam reaches the bug — unit, integration, e2e.
2. **Curl / HTTP script** against a running dev server.
3. **CLI invocation** with a fixture input, diffing stdout against a known-good snapshot.
4. **Headless browser script** (Playwright / Puppeteer) — drives the UI, asserts on DOM/console/network.
5. **Replay a captured trace** — save a real network request / payload / event log to disk; replay it through the code path in isolation.
6. **Throwaway harness** — spin up a minimal subset of the system (one service, mocked deps) exercising the bug code path with a single function call.
7. **Property / fuzz loop** — if the bug is "sometimes wrong output", run 1000 random inputs and look for the failure mode.
8. **Bisection harness** — if the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so you can `git bisect run` it.
9. **Differential loop** — run the same input through old-version vs new-version (or two configs) and diff outputs.
10. **HITL bash script** — last resort. If a human must click, this is a **human-operated** script: the user runs `scripts/hitl-loop.template.sh`, follows the prompts, and the captured `KEY=VALUE` output is read back to you afterward. It is not an unattended command you launch — `read` blocks on a TTY and an agent tool call with closed stdin exits immediately under `set -e`. If no operator is present, treat as `feedback_loop_not_possible` with `reason=hitl_no_operator`.

If no loop can be created in the current environment, split on whether you have any captured evidence of the symptom:

- **No loop AND no captured evidence** (no trace, error payload, screen recording, or core dump) → **stop and say so explicitly**. List what you tried, then ask the user for (a) access to whatever environment reproduces it, (b) a captured artifact (HAR file, log dump, core dump, screen recording with timestamps), or (c) permission to add temporary production instrumentation. **Before obtaining one of these, do not submit a root-cause-confirmed claim and do not close the causal chain gate** (you may form a working hypothesis, but you must not declare the causal chain confirmed). This militant force lands on the verifiable artifact constraint (no confirmed-claim), not on a thought-level "do not generate hypotheses" ban — keeping it compatible with "LLM decides" while preventing the direct-to-hypothesis shortcut. **AFK fallback:** if the user is absent and no blocking-question response is available, do not block indefinitely — mirror Phase 2's AFK pattern: record `feedback_loop_not_possible` with `reason=no_loop_no_evidence`, mark the causal chain `degraded`/`advisory` only, state the residual risk, and end the run with the best working hypothesis clearly labeled unconfirmed. Do not promote the hypothesis to confirmed.
- **No loop BUT captured evidence exists** → record `feedback_loop_not_possible` with the exact missing condition and continue with bounded evidence; do not pretend a loop exists. Do not promote unconfirmed causal links to confirmed.

### Feedback loop readiness checklist

Name **one command** — a script path, a test invocation, a curl — that you have **already run at least once** (paste the invocation and its output). It must be:

- [ ] **Red-capable** — drives the actual bug code path and asserts the **user's exact symptom**, so it can go red on this bug and green once fixed. Not "runs without erroring" — it must be able to catch this specific bug.
- [ ] **Deterministic** — same verdict every run (for flaky bugs: a pinned, high reproduction rate per the Intermittent reframe).
- [ ] **Fast** — seconds, not minutes.
- [ ] **Agent-runnable** — you can run it unattended. The HITL bash script (`scripts/hitl-loop.template.sh`) is the human-operated last resort for bugs that inherently need a human to click through a repro; it is not itself unattended — you read its captured output afterward, and if no operator is present you fall back to `feedback_loop_not_possible`.

If you catch yourself reading code to build a theory before a red-capable command exists, **stop — jumping straight to a hypothesis is the failure this skill prevents.** Treat the loop as a product: once you have one, tighten it along three axes (faster / sharper / more deterministic) — see `references/investigation-techniques.md` → Intermittent Bug Techniques for the framing (single source for the three-axes tagline). A 30-second flaky loop is barely better than none; a 2-second deterministic one is a debugging superpower.

Maintain a lightweight hypothesis ledger for non-obvious bugs: `hypothesis`, `prediction`, `evidence_for`, `evidence_against`, `probe_result`, and `final_root_cause`. The ledger is working evidence, not a durable schema. Evidence must come from reproduction, source reads, tests, logs, runtime values, diffs, or user-provided artifacts before it can close a causal-chain link. After a fix, rerun the same feedback loop or state why it cannot be rerun before handoff.

---

### Phase 0: Triage

Parse the input and reach a clear problem statement.

**If the input references an issue tracker**, fetch it:
- GitHub (`#123`, `org/repo#123`, github.com URL): Parse the issue reference from `<bug_description>` and fetch with `gh issue view <number> --json title,body,comments,labels`. For URLs, pass the URL directly to `gh`.
- Other trackers (Linear URL/ID, Jira URL/key, any tracker URL): Attempt to fetch using available MCP tools or by fetching the URL content. If the fetch fails — auth, missing tool, non-public page — ask the user to paste the relevant issue content. Ensure the fetch includes the full comment thread, not just the opening description.

Read the full conversation — the original description AND every comment, with particular attention to the latest ones. Comments frequently contain updated reproduction steps, narrowed scope, prior failed attempts, additional stack traces, or a pivot to a different suspected root cause; treating the opening post as the whole picture often sends the investigation in the wrong direction. Extract reported symptoms, expected behavior, reproduction steps, and environment details from the combined thread. Then proceed to Phase 1.

**Everything else** (stack traces, test paths, error messages, descriptions of broken behavior): Proceed directly to Phase 1.

**Questions:**
- Do not ask questions by default — investigate first (read code, run tests, trace errors)
- Only ask when a genuine ambiguity blocks investigation and cannot be resolved by reading code or running tests
- When asking, ask one specific question

**Prior-attempt awareness:** If the user indicates prior failed attempts ("I've been trying", "keeps failing", "stuck"), ask what they have already tried before investigating. This avoids repeating failed approaches and is one of the few cases where asking first is the right call.

---

### Phase 1: Investigate

#### 1.1 Reproduce the bug

Confirm the bug exists and understand its behavior. Treat reproduction as a claim verification gate: if the reporter's steps do not reproduce or lack enough detail to attempt, that is a strong `needs-info` signal — surface it before investing in deep tracing of a possibly-mis-described bug. Run the test, trigger the error, follow reported reproduction steps — whatever matches the input.

- **Performance regression (symptom is regressing slowness, not an error/crash):** take the perf branch — establish a baseline measurement before investigating, because logging instrumentation that works for correctness bugs is usually the wrong tool here. See `references/perf-regression.md` (measure first, fix second; statistical timing, bisection). Distinguish from `spec-optimize` (optimizing a measurable outcome) — this is diagnosing *why* a regression happened, not running optimization experiments.
- **Browser bugs:** Prefer `agent-browser` if installed. Otherwise use whatever works — MCP browser tools, direct URL testing, screenshot capture, etc.
- **Manual setup required:** If reproduction needs specific conditions the agent cannot create alone (data states, user roles, external services, environment config), document the exact setup steps and drive the user through them with `scripts/hitl-loop.template.sh` so the loop stays structured — captured `KEY=VALUE` output feeds back to you. Clear step-by-step instructions save significant time even when the process is fully manual.
- **Does not reproduce after 2-3 attempts:** Read `references/investigation-techniques.md` for intermittent-bug techniques (goal: raise the reproduction rate, not wait for a clean repro).
- **Cannot reproduce at all in this environment:** Document what was tried and what conditions appear to be missing; apply the `feedback_loop_not_possible` binary split from the Feedback Loop section.

#### 1.2 Verify environment sanity

Before deep code tracing, confirm the environment is what you think it is:

- Correct branch checked out; no unintended uncommitted changes
- Dependencies installed and up to date (`bun install`, `npm install`, `bundle install`, etc.) — stale `node_modules`/`vendor` is a frequent false lead
- Expected interpreter or runtime version (check `.tool-versions`, `.nvmrc`, `Gemfile`, etc. against what's actually active)
- Required env vars present and non-empty
- No stale build artifacts (`dist/`, `.next/`, compiled binaries from an earlier branch)
- Dependent local services (database, cache, queue) running at expected versions *when the bug plausibly involves them*

#### 1.3 Trace the code path

Read the relevant source files. Follow the execution path from entry point to where the error manifests. Trace backward through the call chain:

- Start at the error
- Ask "where did this value come from?" and "who called this?"
- Keep going upstream until finding the point where valid state first became invalid
- Do not stop at the first function that looks wrong — the root cause is where bad state originates, not where it is first observed

As you trace:
- Check recent changes in files you are reading: `git log --oneline -10 -- [file]`
- If the bug looks like a regression ("it worked before"), use `git bisect` (see `references/investigation-techniques.md`)
- Check the project's observability tools for additional evidence:
  - Error trackers (Sentry, AppSignal, Datadog, BetterStack, Bugsnag)
  - Application logs
  - Browser console output
  - Database state
- Each project has different systems available; use whatever gives a more complete picture

#### 1.4 Trivial-bug fast-path check

After tracing, decide whether the defect qualifies for the fast-path:

- It is confined to one obvious location.
- The observed value or error directly identifies the bad line.
- The causal chain can be stated without uncertain links.
- A focused test or existing failing test can prove the correction.

If all are true, proceed to Phase 2 with a concise root cause. If any are false, continue the normal investigation path.

---

### Phase 2: Root Cause

*Reminder: investigate before fixing. Do not propose a fix until you can explain the full causal chain from trigger to symptom with no gaps.*

Read `references/anti-patterns.md` before forming hypotheses.

**Assumption audit (before hypothesis formation):** List the concrete "this must be true" beliefs your understanding depends on — the framework behaves as expected here, this function returns what its name implies, the config loads before this runs, the caller passes a non-null value, the database is in the state the test implies. For each, mark *verified* (you read the code, checked state, or ran it) or *assumed*. Assumptions are the most common source of stuck debugging. Many "wrong hypotheses" are actually correct hypotheses tested against a wrong assumption.

**Form hypotheses** ranked by likelihood. For each, state:
- What is wrong and where (file:line)
- **Concrete observation**: the runtime value, log line, instrumented boundary, working comparison, or specific code reference that grounds the hypothesis
- The causal chain: how the trigger leads to the observed symptom, step by step
- **For uncertain links in the chain**: a prediction — something in a different code path or scenario that must also be true if this link is correct

When the causal chain is obvious and has no uncertain links (missing import, clear type error, explicit null dereference), the chain explanation itself is the gate — no prediction required. Predictions are a tool for testing uncertain links, not a ritual for every hypothesis.

Before forming a new hypothesis, review what has already been ruled out and why.

**Causal chain gate:** Do not proceed to Phase 3 until you can explain the full causal chain — from the original trigger through every step to the observed symptom — with no gaps. The user can explicitly authorize proceeding with the best-available hypothesis if investigation is stuck.

*Reminder: if a prediction was wrong but the fix appears to work, you found a symptom. The real cause is still active.*

#### Present findings

Once the root cause is confirmed, present:
- The root cause (causal chain summary with file:line references)
- The proposed fix and which files would change
- Which tests to add or modify to prevent recurrence (specific test file, test case description, what the assertion should verify)
- Whether existing tests should have caught this and why they did not

Then offer next steps.

Use the platform's blocking question tool (`AskUserQuestion` in Claude Code or `request_user_input` in Codex). In Claude Code, call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded — a pending schema load is not a reason to fall back. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes). Never silently skip the question.

Options to offer:

1. **Fix it now** — proceed to Phase 3
2. **Diagnosis only — I'll take it from here** — skip the fix, proceed to Phase 4's summary, and end the skill
3. **Rethink the design** (current host's brainstorm entrypoint) — only when the root cause reveals a design problem (see below)

Do not assume the user wants action right now. The test recommendations are part of the diagnosis regardless of which path is chosen.

**When to suggest brainstorm:** Only when investigation reveals the bug cannot be properly fixed within the current design — the design itself needs to change. Concrete signals observable during debugging:

- **The root cause is a wrong responsibility or interface**, not wrong logic. The module should not be doing this at all, or the boundary between components is in the wrong place. (Observable: the fix requires moving responsibility between modules, not correcting code within one.)
- **The requirements are wrong or incomplete.** The system behaves as designed, but the design does not match what users actually need. The "bug" is really a product gap. (Observable: the code is doing exactly what it was written to do — the spec is the problem.)
- **Every fix is a workaround.** You can patch the symptom, but cannot articulate a clean fix because the surrounding code was built on an assumption that no longer holds. (Observable: you keep wanting to add special cases or flags rather than a direct correction.)

Do not suggest brainstorm for bugs that are large but have a clear fix — size alone does not make something a design problem.

#### Smart escalation

If 2-3 hypotheses are exhausted without confirmation, diagnose why:

| Pattern | Diagnosis | Next move |
|---------|-----------|-----------|
| Hypotheses point to different subsystems | Architecture/design problem, not a localized bug | Present findings, suggest the current host's brainstorm entrypoint |
| Evidence contradicts itself | Wrong mental model of the code | Step back, re-read the code path without assumptions |
| Works locally, fails in CI/prod | Environment problem | Focus on env differences, config, dependencies, timing |
| Fix works but prediction was wrong | Symptom fix, not root cause | The real cause is still active — keep investigating |

**Parallel investigation option:** When hypotheses are evidence-bottlenecked across clearly independent subsystems, dispatch read-only sub-agents in parallel, each with an explicit hypothesis and structured evidence-return format. No code edits by sub-agents, and skip this when hypotheses depend on each other's outcomes. If the platform does not support parallel sub-agent dispatch, run the same hypothesis probes sequentially in ranked-likelihood order instead — the parallelism is a latency optimization, not a correctness requirement.

**Pre-test hypothesis re-ranking (folded into this escalation moment, not a separate interrupt):** when 3+ competing hypotheses have each survived one prediction probe without confirmation, surface the ranked list to the user as part of presenting the diagnosis — their domain knowledge can re-rank instantly ("we just deployed a change to #3") or rule out an already-exhausted hypothesis. This is a cheap checkpoint riding on an escalation you were already doing, not a new question point. Do not present it for single-hypothesis or obviously-clear bugs; do not block if the user is AFK — proceed with your own ranking. The trigger is "already at smart escalation with a scattered hypothesis set," not a fresh "3+ hypotheses" threshold.

Present the diagnosis to the user before proceeding.

---

### Phase 3: Fix

*Reminder: one change at a time. If you are changing multiple things, stop.*

If the user chose "Diagnosis only" at the end of Phase 2, skip this phase and go straight to Phase 4 for the summary — the skill's job was the diagnosis. If they chose "Rethink the design", control has transferred to the current host's brainstorm entrypoint and this skill ends.

**Workspace and branch check:** Before editing files:

- Check for uncommitted changes (`git status`). If the user has unstaged work in files that need modification, confirm before editing — do not overwrite in-progress changes.
- If the current branch is the default branch, ask whether to create a feature branch first using the platform's blocking question tool (see Phase 2 for the per-platform names). To detect the default branch, compare against `main`, `master`, or the value of `git rev-parse --abbrev-ref origin/HEAD` with its `origin/` prefix stripped (the raw output is `origin/<name>`, so an unstripped comparison will never match the local branch name). Default to creating one; derive a name from the bug and run `git checkout -b <name>`. On any other branch, proceed.

**Test-first:**
1. Read the nearby or project-level testing convention before adding a reproduction test; match the existing test style, fixture pattern, and command shape
2. **Judge the correct seam before writing the failing test** — does the seam exercise the bug's real call pattern at the real call site? Apply "lock what you can, flag what you can't":
   - **Correct seam exists** → write the failing test there, proceed normally.
   - **Only a shallow seam exists** (single-caller test, but the bug needs a multi-caller chain) → **still write** the failing test, but annotate in the test comment / PR that "this test does not cover the full call chain; it locks only this layer," and flag the architecture gap to Phase 4 as a `blocking advisory` (not ordinary advisory). The PR body must state "this PR locks only the shallow layer; architecture gap X remains, tracked at [issue link]" so the shallow test's apparent-coverage signal cannot swallow the architecture flag. Do not skip the test because the seam is shallow.
   - **No seam that can fail-for-the-right-reason exists at all** → record "no correct seam = architecture finding," do not write a fake test, flag to Phase 4. This is the only case where you skip the regression test entirely.
   Obvious single-point bugs still go through the fast-path failing test; the correct-seam judgment only bites on non-obvious multi-caller-chain bugs.
3. Write a failing test that captures the bug (or use the existing failing test) at the chosen seam
4. Verify it fails for the right reason — the root cause, not unrelated setup
5. Implement the minimal fix — address the root cause and nothing else
6. Verify the test passes
7. Self-review every changed line against the root cause; remove only debris introduced by this fix and do not refactor unrelated code; clean up any tagged debug logs you added this run (grep the unique prefix you used, per `references/investigation-techniques.md`)
8. Run the broader test suite for regressions

**Review scope:** For non-trivial fixes, run the host's lightweight code review or the current host's code-review entrypoint when the touched surface is sensitive, broad, or user-facing. Do not invoke a full review ritual for an obvious mechanical fix after the focused test and self-review have covered it.

**3 failed fix attempts = smart escalation.** Diagnose using the same table from Phase 2. If fixes keep failing, the root cause identification was likely wrong. Return to Phase 2.

**Failed fix evidence reset:** When a fix attempt fails, record the invalidated evidence before forming the next hypothesis: which prediction failed, which observed value/log/test contradicted the hypothesis, and what assumption is now ruled out. Do not stack another fix attempt on top of a contradicted hypothesis.

**Conditional defense-in-depth** (trigger: grep for the root-cause pattern found it in 3+ other files, OR the bug would have been catastrophic if it reached production): Read `references/defense-in-depth.md` for the four-layer model (entry validation, invariant check, environment guard, diagnostic breadcrumb) and choose which layers apply. Skip when the root cause is a one-off error with no realistic recurrence path.

**Conditional post-mortem** (trigger: the bug was in production, OR the pattern appears in 3+ locations):
Analyze how this was introduced and what allowed it to survive. Note any systemic gap or repeated pattern found; it informs Phase 4's decision on whether to offer learning capture.

---

### Phase 4: Handoff

**Structured summary** — always write this first:

```
## Debug Summary
**Problem**: [What was broken]
**Root Cause**: [Full causal chain, with file:line references]
**Recommended Tests**: [Tests to add/modify to prevent recurrence, with specific file and assertion guidance]
**Direct evidence**:
- claims_validated_by: [Which reproduction/source/log/test facts confirmed the causal chain, or "none"]
- claims_remaining_advisory: [Which suspected links were not independently confirmed, or "none"]
**Fix**: [What was changed — or "diagnosis only" if Phase 3 was skipped]
**Prevention**: [Test coverage added; defense-in-depth if applicable]
**Confidence**: [High/Medium/Low]
```

When validation was run, prefer a structured `verification-run-summary.v1` ref in the summary or attached handoff evidence instead of a freeform "tests passed" claim. Use `honest-closeout.v1` only as the verdict helper for structured claims; if no structured claim or evidence exists, mark the closeout as `degraded` rather than upgrading confidence.

**Cleanup checklist (closing hygiene, separate from the Debug Summary above).** The Debug Summary is the external handoff conclusion (Problem/Root Cause/Fix/Confidence/verification-run-summary); this checklist is the internal closing-hygiene pass — verify before declaring done:

- [ ] All tagged debug logs from this run (unique prefix, e.g. `[DEBUG-a4f2]`) removed — `grep` the prefix and confirm zero hits.
- [ ] Throwaway prototypes / harnesses deleted or moved to a clearly-marked debug location.
- [ ] The hypothesis that turned out correct is stated in the commit / PR message, so the next debugger learns.
- [ ] A correct-seam gap (if any) is flagged in the Debug Summary's `claims_remaining_advisory` or Prevention section; when a shallow-layer test exists, the architecture gap is marked **blocking advisory** with a PR-body note and a tracking issue link (per Phase 3 correct-seam), not ordinary advisory.

The original-repro-no-longer-reproduces and regression-test-passing signals live in the Debug Summary's `verification-run-summary` — do not duplicate them here.

**If Phase 3 was skipped** (user chose "Diagnosis only" in Phase 2), stop after the summary — the user already told you they were taking it from here. Do not prompt.

**If Phase 3 ran**, the next move depends on whether this skill created the branch in Phase 3.

#### Skill-owned branch: default to commit-and-PR without prompting

When Phase 3 created the branch, default to finishing the bugfix by committing and opening a PR.

1. **Check contextual overrides first.** Look at the user's original prompt, loaded memories, and already-loaded repo instructions for explicit preferences that conflict with automatic commit-and-PR, such as "always review before pushing", "open PRs as drafts", or "do not open PRs from skills". Read `AGENTS.md` / `CLAUDE.md` source only if the loaded instruction context is missing, stale, or the override itself is being verified. If any apply, honor them by switching to the pre-existing-branch menu below or skipping the PR step, whichever matches the instruction.
2. **Briefly preview what will happen**: what will be committed, on which branch, and that a PR will be opened. This preview lets the user interrupt; it is not a blocking question.
3. **Run `git-commit-push-pr`.** When the entry came from an issue tracker, include the appropriate close syntax in the place that tracker parses, such as `Fixes #N` in GitHub PR descriptions or the relevant Jira/Linear close syntax. Surface the resulting PR URL.

#### Pre-existing branch: ask the user

If this skill did not create the branch, prompt the user for the next action via the platform's blocking question tool (`AskUserQuestion` in Claude Code or `request_user_input` in Codex). In Claude Code, call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded — a pending schema load is not a reason to fall back. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes). Never end the phase without collecting a response.

Options:

1. **Commit and open a PR (`git-commit-push-pr`)** — default for most cases
2. **Commit the fix** — local commit only
3. **Stop here** — user takes it from there

#### After a PR is open: consider offering learning capture

Most bugs are localized mechanical fixes where the only lesson is the bug itself. Compounding those clutters `docs/solutions/` without adding value. Decide which path applies:

- **Skip silently** when the fix is mechanical and there is no generalizable insight. Default to this when in doubt.
- **Offer neutrally** when the lesson can be stated in one sentence, such as a surprising framework return type or a non-obvious diagnostic path worth recording. If you cannot articulate the lesson, skip rather than offer.
- **Lean into the offer** when the pattern appears in 3+ locations or the root cause reveals a wrong assumption about a shared dependency, framework, or convention that other code is likely to repeat.

When offering, use the same blocking question tool described above. If the user accepts, run `spec-compound`, then commit the resulting learning doc to the same branch and push so the open PR picks up the new commit.
