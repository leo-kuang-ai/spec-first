# Follow-up routing

The chat POV is the deliverable. Any implementation, commit, or landing is outside this read-only contract. Before a handoff, require: the original prompt explicitly authorized the named downstream action, the result is non-stalemated, the action remains within inherited scope, and it is non-destructive and otherwise authorized. If any condition fails, offer one logical continuation and wait; the later user selection supplies fresh authority. Do not assume every result routes to a plan.

Compute the next step from the active subject shape and Handoff field:

- **External adoption:** Adopt with clear scope → `spec-plan`; Adopt with fuzzy scope → `spec-brainstorm`; Trial → a timeboxed `spec-work` spike; Hold / Reject / Not-our-problem → no handoff.
- **Document take:** actionable revisions → offer the document-owning workflow; no requested change or Blocked → no handoff.
- **Approach-set position:** a sufficiently defined choice → the owning planning or execution workflow; a choice needing scope → `spec-brainstorm`; an honest toss-up or Blocked result → no handoff.

For Tier 1 or Reject / Not-our-problem, use one prose line rather than a blocking menu. For Tier 2/3 with an actionable grade, the computed next step is the first blocking option, followed by an optional full write-up and Done. `spec-compound` may be offered as a prose nudge for a durable decision, never as the first option.

On a pre-authorized handoff or later user selection, invoke the owning workflow with the POV substance, conditions, and verified facts. A stalemate, scope expansion, destructive action, or insufficient authority returns to the user first. A full write-up reads `references/report.md`; a capture invokes `spec-compound` in the supported headless mode without changing its schema.

