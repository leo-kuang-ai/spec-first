# Publish Approved Candidates

Publishes the approved learning into `docs/solutions/` only after candidate validation and the semantic promotion decision succeed. This reference follows `references/assembly.md` and any selected `references/enhancement.md` checks.

### Phase 2.47: Promotion Decision & Per-Target Atomic Publication

The orchestrator now makes the semantic promotion decision; scripts do not make it. Choose `promote` only when the problem is demonstrably resolved, the cited evidence is relevant to the claims, contradictions with current source are resolved in favor of source, and the invalidation condition describes a concrete re-check trigger. A transcript assertion such as “fixed” or “tests passed” is not outcome evidence. A separate reviewer is useful for high-risk material when dispatch is authorized, but is not a universal prerequisite for ordinary low-risk promotion; record whether semantic validation was independent or inline.

- On `skip`, leave every final durable path unchanged, best-effort remove the private candidates, and emit `Documentation skipped` with the failed semantic or evidence condition.
- On `promote`, first recompute the recorded existence/SHA-256 of every final target. If any target drifted, stop and rebuild/review the affected candidates against the new source; do not overwrite it. Prepare and validate every same-directory temporary file before the first rename. Publish an approved `CONCEPTS.md` candidate first and the primary learning last; each target replacement is atomic, but a multi-target run is not an all-or-nothing filesystem transaction. If a later rename fails after an earlier target was published, report the exact partial publication, keep the run incomplete, and do not emit `Documentation complete` or attempt an unverified overwrite.

The final `docs/solutions/**` path remains untouched until this phase. This is the durable `candidate -> review -> promote` boundary; scratch artifacts are not durable knowledge and are never returned as a successful deliverable.
