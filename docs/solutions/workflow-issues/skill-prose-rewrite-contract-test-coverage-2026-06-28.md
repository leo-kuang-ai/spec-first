---
title: "Skill-prose rewrite: contract tests green ≠ new behavior tested"
date: 2026-06-28
category: docs/solutions/workflow-issues
module: spec-debug skill prose + contract tests
problem_type: workflow_issue
component: testing_framework
severity: medium
applies_when:
  - "Rewriting a skill SKILL.md section that an existing contract test pins via specific substrings"
  - "Strengthening/discipline-hardening a workflow skill's prose while preserving anchor phrases a test expects"
  - "Adding load-bearing new behaviors to a skill section whose contract suite only locks old substrings"
domain: skill-prose contract-test coverage for workflow skill rewrites
pattern: contract-tests-green-does-not-imply-new-behavior-tested
rejected_alternatives:
  - "Keep the contract suite frozen on old substrings and rely on review — rejected: review catches it once, but the suite gives ongoing false-green confidence a future edit silently weakens new behavior"
  - "Rewrite the section and drop the preserved old substrings — rejected: breaks existing contract tests and loses the anchor the suite intentionally locks"
applicable_versions:
  - "spec-first 1.12.x (skill prose + spec-debug-contracts.test.js pattern)"
invalidation_condition: "If spec-debug SKILL.md's Feedback Loop section is restructured so the preserved substrings move again, the new-behavior assertions added in this lesson must be re-anchored; if skill-prose contract tests evolve to assert semantic behavior (fresh-source eval) rather than substrings, the substring-pinning pattern this lesson describes becomes less load-bearing."
source_refs:
  - "skills/spec-debug/SKILL.md"
  - "tests/unit/spec-debug-contracts.test.js"
  - "docs/plans/2026-06-27-002-feat-spec-debug-discipline-borrow-from-diagnosing-bugs-plan.md"
  - "docs/solutions/architecture-patterns/rebar-structure-skill-simplification-pattern-2026-06-04.md"
tags: [contract-tests, skill-prose, false-confidence, substring-pinning, coverage-gap, spec-debug]
---

# Skill-prose rewrite: contract tests green ≠ new behavior tested

## Context

When the 002 spec-debug plan rewrote the "Feedback Loop And Hypothesis Ledger" section to strengthen feedback-loop discipline (10-item ordered menu, `feedback_loop_not_possible` binary split, 4-item readiness checklist, militant "must-not-declare-confirmed" artifact constraint), the implementer *deliberately preserved* the exact substrings an existing contract test (`tests/unit/spec-debug-contracts.test.js`) pinned — e.g. the flat-list sentence, `record feedback_loop_not_possible with the exact missing condition`, `do not pretend a loop exists`. The test suite stayed green (22 passed).

But the rewrite added **nine new load-bearing behaviors** with **zero new contract assertions**. A `spec-code-review` testing-reviewer pass surfaced this: every existing assertion targeted a pre-002 substring the diff had intentionally preserved, so the suite was *structurally incapable* of catching a regression in any new behavior. "Tests pass" read as validation; it was actually decoupled from the new prose.

This is the inverse of the `rebar-structure` learning (`docs/solutions/architecture-patterns/rebar-structure-skill-simplification-pattern-2026-06-04.md`), which established that contract tests bind *local substrings*, not *core semantic capability*. Here that property bit the other way: a rewrite that preserves anchors while adding behavior gets false-green confidence, because the suite only ever witnessed the preserved tail.

## Guidance

When rewriting a contract-tested skill section to strengthen/add behavior:

1. **Inventory the new behaviors before touching the test.** List each load-bearing new behavior the rewrite introduces (the militant constraint, the ordered menu, the binary split, the checklist, the routing pointer, the folded checkpoint, etc.).
2. **Pin each new behavior with its own substring assertion** — not by hoping an inherited assertion transitively covers it. Add a focused test that reads the section and asserts the new behavior's load-bearing substring is present.
3. **Do not delete the preserved-anchor assertions.** They still lock the parts you intentionally kept; the new assertions are additive.
4. **Relax assertions that freeze a now-stale summary.** If the rewrite expanded a summary into a menu (e.g. a 6-item flat list became a 10-item menu), the test pinning the old flat list now freezes a *misleading* summary that will silently diverge from the menu. Replace the enumerated-substring assertion with one pinning the menu's stable cue, and optionally trim the stale summary in the skill itself so there is no double-source.
5. **Add a dead-link guard for new file pointers.** If the prose now `references/` or `scripts/` paths to new files, add a test that resolves every backtick path and asserts `fs.existsSync` — the suite has no other way to catch a renamed/deleted target.

The diff that closed this gap: `spec-debug-contracts.test.js` went from 11 → 17 tests, pinning the nine new behaviors + a description-frontmatter trigger guard + a dead-link guard, and relaxing the stale flat-list assertion.

## Why This Matters

A green contract suite on a rewrite that preserved anchors is *worse* than no test, because it reads as validation. A future edit that silently weakens the militant "must-not-declare-confirmed" constraint, drops the readiness checklist, or removes the perf-branch pointer would pass the inherited suite unchanged — the regression is invisible to automation, and only a fresh review would catch it (once, not ongoing). The cost of the gap is borne by everyone who later trusts the green bar.

The root cause is structural, not careless: contract tests for skill prose bind *substrings* (cheap, non-brittle), so a rewrite that keeps those substrings while changing everything around them leaves the suite witnessing only the kept tail. The fix is to make the suite witness the new head too, every time new behavior lands.

## When to Apply

- You are rewriting a skill `SKILL.md` section that an existing contract test pins via specific substrings, AND the rewrite adds new load-bearing behavior (not just rewording).
- You are doing a "discipline-strengthening" or "borrow-from-external-skill" pass on a workflow skill whose contract suite is already green.
- A review finding says "tests pass but new behavior is untested" — this is the remediation pattern.
- The rewrite expands a summary/list into a longer enumerated structure (menu, checklist, binary split) — the old summary is now stale and a frozen assertion on it creates a divergence trap.

## Examples

Before (the false-green state) — `spec-debug-contracts.test.js` asserted:

```js
expect(text).toContain('a failing test, CLI invocation, HTTP/browser script, trace replay, '
  + 'throwaway harness, property/fuzz loop');   // pre-rewrite flat list
// rewrite added: ordered menu (10 items incl. bisection/differential/HITL),
// binary split, readiness checklist, militant confirmed-claim ban — none asserted
```

After (real coverage) — additive new tests pin the new behaviors + relax the stale summary:

```js
// New behavior assertions (additive — old ones kept)
expect(text).toContain('Try these reproducers in roughly this order until you have one that goes red on the bug');
expect(text).toContain('Bisection harness');
expect(text).toContain('No loop AND no captured evidence');
expect(text).toContain('No loop BUT captured evidence exists');
expect(text).toContain('Red-capable');
expect(text).toContain('do not submit a root-cause-confirmed claim and do not close the causal chain gate');
expect(text).toContain('lock what you can, flag what you can');
expect(text).toContain('Cleanup checklist (closing hygiene');
expect(text).toContain('Pre-test hypothesis re-ranking (folded into this escalation moment');
expect(text).toContain('references/perf-regression.md');
expect(text).toContain('scripts/hitl-loop.template.sh');

// Description frontmatter trigger-surface guard (frontmatter not parsed by lint)
const close = lines.indexOf('---', 1);
const frontmatter = lines.slice(0, close).join('\n');
expect(frontmatter).toContain('why is this slow');
expect(frontmatter).toContain('performance regression');

// Dead-link guard for new file pointers
const refs = [];
const refRe = /`((?:references|scripts)\/[^`]+)`/g;
let m; while ((m = refRe.exec(text)) !== null) refs.push(m[1]);
for (const ref of refs) {
  expect(fs.existsSync(path.join(skillDir, ref))).toBe(true);
}
```

Skill-side companion fix — the stale flat-list summary was trimmed so it no longer diverges from the 10-item menu:

```
- Before: "...the smallest feedback loop that can observe the symptom — a failing test, CLI
  invocation, HTTP/browser script, trace replay, throwaway harness, property/fuzz loop, or
  another concrete reproducer. Try them in roughly this order..."
- After:  "...the smallest feedback loop that can observe the symptom. Try these reproducers
  in roughly this order until you have one that goes red on the bug:"  (menu follows)
```

## Related

- `docs/solutions/architecture-patterns/rebar-structure-skill-simplification-pattern-2026-06-04.md` — establishes that contract tests bind local substrings, not core semantic capability, and that fresh-source eval must not claim unrun verification as passed. This lesson is the coverage-side complement: when you *add* behavior, the substring-binding property means the suite only sees what you preserved.
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md` — source-first discipline; the contract-test additions here live in source (`tests/unit/`), not generated runtime mirrors.
- `docs/plans/2026-06-27-002-feat-spec-debug-discipline-borrow-from-diagnosing-bugs-plan.md` — the spec-debug 002 plan whose code-review surfaced this gap and closed it (tests 11→17).
