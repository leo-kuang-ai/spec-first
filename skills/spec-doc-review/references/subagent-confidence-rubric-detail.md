# Confidence Anchor — Full Behavioral Rubric

This is a **lazy reference** for the sub-agent template spine. The spine carries a 5-row quick-reference table with the behavioral criterion for each anchor. This file contains the complete behavioral descriptions, the rationale for anchors 0/25, and why they exist in the enum even though personas never produce them.

Read this when you need more calibration detail than the quick-reference table provides — especially when deciding between `50` and `75`, or when your persona's domain calibration notes (the confidence section in your persona file) need the full rubric as context.

---

## Anchor Descriptions

**`0` — Not confident at all.** A false positive that does not stand up to light scrutiny, or a pre-existing issue the document did not introduce. **Do not emit — suppress silently.** This anchor exists in the enum only so synthesis can explicitly track the drop; personas never produce it.

**`25` — Somewhat confident.** Might be a real issue but could also be a false positive; you were not able to verify. **Do not emit — suppress silently.** This anchor, like `0`, exists in the enum only so synthesis can track the drop; personas never produce it. If your domain is genuinely uncertain, either gather more evidence until you can honestly anchor the finding at `50` or higher, or suppress the concern entirely. Pedantic style nitpicks and other shapes named in the false-positive catalog are suppressed by the FP catalog, not routed through this anchor — they are not findings at any anchor.

**`50` — Supported advisory concern.** The concern passes consequence admission but remains below the actionable bar. Name the concrete effect, evidence and remaining uncertainty. Harmless preferences, stylistic nits and “nothing breaks” observations are suppressed from every bucket, not sent to FYI.

**`75` — Highly confident.** You double-checked and verified the issue will be hit in practice by implementers or readers of this document. The existing approach in the document is insufficient. The issue directly impacts plan correctness, implementer understanding, or downstream execution.

Anchor `75` requires naming a concrete downstream consequence someone will hit — a wrong deploy order, an unimplementable step, a contract mismatch, missing evidence that blocks a decision. Strength-of-argument concerns ("motivation is thin," "premise is unconvincing," "a different reader might disagree") do not meet this bar on their own — suppress them unless evidence establishes a specific downstream consequence. When in doubt between `50` and `75`, ask: "will a competent implementer or reader concretely encounter this, or is this my opinion about the document's strength?" The former can support `75`; unsupported opinion is suppressed.

**`100` — Absolutely certain.** You double-checked and confirmed the issue. The evidence directly confirms it will happen frequently in practice. The document text, codebase, or cross-references leave no room for interpretation.

---

## Key Relationships

- **Anchor and severity are independent axes.** A P2 finding can be anchor `100` if the evidence is airtight; a P0 finding can be anchor `50` if it is an important concern you could not fully verify.
- **Anchor gates where the finding surfaces** (drop / FYI / actionable); **severity orders it** within the actionable surface.
- **Synthesis drops anchors `0` and `25` silently**; anchor `50` routes to the FYI subsection; anchors `75` and `100` enter the actionable tier (walk-through, proposed fixes, safe_auto when `autofix_class` also warrants).
