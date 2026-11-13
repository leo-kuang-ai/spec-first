# Conditional Test Value Lens

Use inside the existing code-quality review when substantive tests are in scope or the caller requests test-quality assessment. Report findings before any authorized cleanup; this lens grants no edit authority or new default reviewer. The entrypoint's proof-test and test-only-seam protection takes precedence.

A test has value when it can fail for a credible regression, observable behavior or an independent contract while surviving equivalent implementation changes. Inspect the complete test, covered code, relevant callers and overlapping tests. Run it before recommending removal. A failing or unavailable test is a possible defect or limitation, not a deletion candidate.

Look for expected values computed by the code under test, fixtures supplying the intended production result, negative cases stopped by the wrong guard, vacuous assertions, and internal call checks unrelated to a real protocol. Prefer repair at the owning behavioral boundary. Interaction assertions are valid when the interaction itself is a contract.

Do not delete the only coverage of public APIs, security, config/schema, storage/migration, release/package or other independent contracts. Static source/byte/path checks can protect real contracts. Slowness or resemblance to implementation alone proves no redundancy. Name the stronger remaining test and the exact failure it still detects before suggesting deletion or merging; when a test asserts nothing, show that failure explicitly. Preserve uncertainty rather than claiming no coverage is lost.

Caller-owned cleanup assesses only tests added/changed in the authorized scope. Protected proof tests and the seams they call are not cleanup candidates, even when imperfect: return a needed repair to the implementation owner for evidence reconciliation. Read dependency source/types when equivalence depends on them. Keep source-inspection checks that catch meaningful consumer changes and survive irrelevant identifier renames. Do not add tests just to replace comments or increase a count.

Return location, demonstrated issue, proposed action, protected-proof status, surviving coverage, related seam and actual verification/limitations. Distinguish a recommendation from an applied change. No repository-wide compatibility or test pruning follows from this lens.
