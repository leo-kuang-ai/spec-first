# `suggested_fix` — Advanced Rules

This is a **lazy reference** for the sub-agent template spine. The spine carries the core rules (one committed recommendation, no alternative menus, strawman safeguard, autofix_class tier definitions). This file contains the advanced classification patterns, the single/multi-facet/composite taxonomy, full worked examples, and detailed strawman analysis rules.

Read this when your finding requires a fix shape that is more complex than a single straightforward action — especially when the fix touches multiple facets or when you need to classify between `safe_auto` and `gated_auto` based on fix scope.

---

## Committed Recommendation — No Menus of Alternatives

`suggested_fix` commits to one recommendation — no menus of alternatives. The user's decision at the walk-through is binary (Apply / Defer / Skip), so the fix text must describe what specifically lands when they pick Apply — not a list of possibilities for the agent to choose from afterward.

The committed recommendation can be:

- **A single action** — `Drop the Advisory tier from the enum.`
- **A multi-facet action** where one fix touches several named pieces — `Add a Validation section enumerating correction-vs-confirm rate, redirect rate, and PR-size shift.`
- **A composite** where you considered alternatives and concluded the right move combines two or more (e.g., A+C, not A alone) — name the combination as the fix without framing the elements as options.

What's not allowed is an alternative menu that punts the choice to Apply time: `(a)/(b)/(c)` lists, "either X or Y", "consider A, B, or C", "add A or, alternatively, B."

The test: at Apply time, would the agent still need to pick which sub-option to implement? If yes, rewrite as the committed choice (single, multi-facet, or composite). If the alternatives are genuinely independent and each worth taking on its own, emit N findings instead.

**Negative example to avoid:** `Add a Validation section that (a) confirms the mechanism works, (b) flags ritualization, and (c) gates Phase B` — leaves the user guessing whether Apply will write all three, pick one, or paraphrase. If the persona's actual recommendation is "do (a) and (c) together," the fix should say so directly.

---

## Strawman-Aware Classification (Full Rules)

When listing alternatives to the primary fix, count only alternatives a competent implementer would genuinely weigh. A "do nothing / accept the defect" option is NOT a real alternative — it is the failure state the finding describes. The same applies to framings like "document in release notes," "accept drift," or "defer to later" when they sidestep the actual problem rather than solving it. If the only alternatives to the primary fix are strawmen (the problem persists under them), the finding is `safe_auto` or `gated_auto`, not `manual`.

**Positive example:** "Cache key collision causes stale reads. Fix: include user-id in the cache key. Alternative: never cache this data." → The alternative (disable caching) is a legitimate design choice with real tradeoffs — `manual`.

**Negative example:** "Silent read-side failure on renamed config files. Fix: read new name, fall back to old with deprecation warning. Alternative: accept drift and document in release notes." → The alternative does not solve the problem; users on mid-flight runs still hit the failure. Treat as `gated_auto` with the concrete fix.

**Strawman safeguard on `safe_auto`.** If you classify a finding as `safe_auto` via strawman-dismissal of alternatives, name the dismissed alternatives explicitly in `why_it_matters` so synthesis and the reader can see the reasoning. When ANY non-strawman alternative exists (even if you judge it weak), downgrade to `gated_auto` — silent auto-apply is reserved for findings with genuinely one option.

---

## Classify by What's Written, Not by the Minimum Fix

Ask: *"What's the smallest fix that addresses this issue?"* If your `suggested_fix` is larger — adds inferred claims, opportunistic refactors, or asserts things the document doesn't establish — those additions are part of what the user has to evaluate, so the higher tier applies.

Two responses:
- **Trim** the fix back to the minimum to keep `safe_auto` (and emit the trimmed-out content as a separate finding if it carries its own evidence at anchor 50+), or
- **Gate** at `gated_auto` so the user can see and confirm the inferred scope.

Trim when the additions are weak or speculative; gate when they're substantively right but the document doesn't compel them.

**Example:** a finding flags that Phase B doesn't surface a U6→U7 sequencing dependency declared on U7. The minimum fix — `Add a Phase B note that U7 follows U6` — is `safe_auto` (purely mechanical, the dependency is on the page, just not in this section). Appending `and U4, U5, U8 can proceed in parallel` goes beyond the minimum because the document doesn't establish those units as independent — that's a persona inference. Trim the parallelism claim to recover `safe_auto`, or emit the bundled fix at `gated_auto`.
