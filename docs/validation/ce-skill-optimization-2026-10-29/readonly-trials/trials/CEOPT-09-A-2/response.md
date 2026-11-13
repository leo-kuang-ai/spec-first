**The plan needs one security correction before implementation: its export query omits tenant isolation.** The two prior exposure notes describe the same defect.

```text
delivery_mode: headless
mutation_policy: report-only
mutation_reason: caller-requested-report-only
review_status: complete
task_pack_outcome: not-applicable
fixes_applied: 0
producer_fix_candidates: 0
proposed_fixes_count: 1
decisions_count: 0
fyi_count: 0
p0_p1_actionable_count: 1
```

**[P1] Proposed implementation, step 3 — Exports may expose another tenant’s tickets**

- **Recommendation: Apply** the correction before implementation.
- **Consequence if unchanged:** A support manager may download tickets belonging to another tenant.
- **Change:** Pass the authenticated request’s tenant identifier into the export query. Add a regression test with closed tickets from two tenants in the same month; assert that the download contains only the requesting tenant’s records.
- **Basis:** The settled contract says “Include only their tenant’s closed tickets,” but step 3 passes only date bounds. The document’s “Current source facts” identifies `req.tenantId` as the available tenant identifier and states that the existing query accepts a tenant argument.
- **Concrete correction:** Call the existing ticket query with the tenant identifier plus the existing inclusive UTC start and exclusive UTC end bounds.
- **Attribution:** Security lens, corroborated by inline coherence review; confidence 100 in the documented omission, not in a demonstrated runtime leak.

Prior notes reconciled:

| Note | Disposition |
|---|---|
| R-1 — missing tenant argument | Retain as the single P1 finding above. |
| R-2 — other accounts exposed | Merge into R-1; same cause and correction. |
| R-3 — global timezone preference page | Reject as scope expansion. The contract already fixes UTC calendar months. |
| D-17 — server-local midnight | Keep withdrawn. It is not an open decision or implementation option. |

Coverage: coherence, feasibility, and security lenses completed inline. Coherence supports the merged finding; feasibility adds no separate actionable finding based on the supplied document.

Limitations: No independent persona execution occurred because delegation was prohibited. No independent-agreement confidence promotion was used. The document’s source claims were not verified against code, and no tests were run. No files were changed or created.

Review complete
