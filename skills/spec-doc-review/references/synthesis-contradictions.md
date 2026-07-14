# 3.5 Resolve Contradictions

This is a **cold-path reference** for the synthesis pipeline. Load only when, after 3.4 cross-persona promotion, the finding set still contains entries with opposing recommended actions from different personas (these were intentionally kept separate in 3.3 dedup — findings with opposing actions are not merged).

---

When personas disagree on the same section:

- Create a combined finding presenting both perspectives
- Set `autofix_class: manual` (contradictions are by definition judgment calls)
- Set `finding_type: error` (contradictions are about conflicting things the document says, not things it omits)
- Frame as a tradeoff, not a verdict

Specific conflict patterns:

- Coherence says "keep for consistency" + scope-guardian says "cut for simplicity" → combined finding, let user decide
- Feasibility says "this is impossible" + product-lens says "this is essential" → P1 finding framed as a tradeoff
- Multiple personas flag the same issue (no disagreement) → handled in 3.3 merge, not here

After contradiction resolution, the combined finding enters 3.5b for recommended_action tie-breaking. The personas that contributed opposing views should be noted in the combined finding's Reviewer column.
