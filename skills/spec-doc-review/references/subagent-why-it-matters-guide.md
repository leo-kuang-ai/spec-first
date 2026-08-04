# `why_it_matters` — Writing Guide

This is a **lazy reference** for the sub-agent template spine. The spine carries the core rules (observable consequence first, 2-4 sentences, anti-pattern warning). This file contains the full weak-vs-strong comparison example and detailed framing guidance.

Read this when you need to calibrate your `why_it_matters` framing — especially when transitioning from document-structure descriptions to observable-consequence-first writing.

---

## Observable Consequence First

The `why_it_matters` field is how the reader — a developer triaging findings, a reader returning to the doc months later, a downstream automated surface — understands the problem without re-reading the file. Treat it as the most important prose field in your output; every downstream surface (walk-through questions, bulk-action previews, Open Questions entries, headless output) depends on it being good.

### Core principles

1. **Lead with observable consequence.** Describe what goes wrong from the reader's or implementer's perspective — what breaks, what gets misread, what decision gets made wrong, what the downstream audience experiences. Do not lead with document structure ("Section X on line Y says...") or with quoted document text.
2. **Explain why the fix resolves the problem.** If you include a `suggested_fix`, the `why_it_matters` should make clear why that specific fix addresses the root cause. When a similar pattern exists elsewhere in the document or codebase, reference it so the recommendation is grounded in what the team has already chosen.
3. **Keep it tight.** Approximately 2-4 sentences. Longer framings are a regression — downstream surfaces have narrow display budgets, and verbose content gets truncated or skimmed.
4. **Always produce substantive content.** `why_it_matters` is required by the schema. Empty strings, nulls, and single-phrase entries are validation failures.

### Weak vs Strong — Illustrated

**WEAK (document-citation first; fails the observable-consequence rule):**

> Section "Classification Tiers" lists four tiers but Section "Synthesis" routes three. Reconcile.

**STRONG (observable consequence first, grounded fix reasoning):**

> Implementers will disagree on which tier a finding lands in, because the Classification Tiers section enumerates four values while the Synthesis routing only handles three. The document does not say which enumeration is authoritative. Suggest the Classification Tiers list is authoritative; drop the fourth value from the tier definition since Synthesis already lacks a route for it.

### What changed between the two

- Weak leads with section references and a bare directive ("Reconcile"). The reader doesn't know what breaks.
- Strong leads with the downstream consequence ("Implementers will disagree..."), then cites the document evidence, then proposes a grounded fix.
- Strong names *why* the fix is chosen ("Synthesis already lacks a route for it") rather than just saying "pick one."
