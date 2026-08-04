# 3.3b Same-Persona Premise Redundancy Collapse

This is a **cold-path reference** for the synthesis pipeline. Load only when any persona contributed 3 or more findings in the post-dedup set.

---

A single persona sometimes files multiple findings that share the same root premise expressed at different sections or wrapped in different framing (e.g., product-lens firing five variants of "motivation is weak" attached to Motivation, Unit 4b, Key Technical Decisions, and two other sections). Cross-persona dedup (3.3) does not catch this — it fingerprints on section+title, which differ even when the underlying concern is the same. Surfacing all N variants over-weights one persona's perspective relative to the other five and inflates the P2 Decisions tier with near-duplicate signal.

For each persona, cluster that persona's surviving findings by shared root premise. A cluster forms when 3 or more findings from the same persona share:

- The same `finding_type` (error or omission)
- Substantially overlapping `why_it_matters` phrasing (same key nouns/verbs signaling the same concern, e.g., "motivation", "justification", "premise unsupported", "scope creep")
- Fixes that would all be obviated by the same upstream decision (e.g., "add the triggering incident" would moot all five motivation-weakness findings)

For each cluster of size N ≥ 3:

- Keep the single finding with the strongest evidence (highest confidence anchor, or if tied, the one citing the most concrete document reference)
- Demote the remaining N-1 findings to FYI-subsection status (anchor `50`), regardless of their original anchor
- On the kept finding, note in the Reviewer column that the persona raised N-1 related variants (e.g., `product-lens (+4 related variants demoted to FYI)`)

This runs per-persona before 3.4 cross-persona boost. Cross-persona agreement across the *kept* finding still qualifies for the anchor-step promotion in 3.4; demoted variants do not participate in cross-persona promotion (they are observational only after collapse).

Do NOT collapse across personas at this step — different personas surfacing the same concern is exactly the independence signal the cross-persona boost rewards. Collapse applies within one persona's output only.
