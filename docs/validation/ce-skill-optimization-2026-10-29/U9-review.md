# U9 PRD freshness and advisory keyword repair

Status: local mechanism verified; semantic PRD decisions remain owner judgments.

The checker now exposes separate PRD-content and input freshness facts. Input-only refresh requires the previous PRD hash to match; body changes, combined body/input changes and non-receipt metadata changes remain stale and cannot be re-signed. Check-only preserves bytes. A legitimate input-only refresh preserves the PRD hash and produces a receipt accepted by the downstream verifier.

WHAT vocabulary matches now increment possible_misclassified_how_pushdown_count as advisory evidence. The existing how_pushdown_touches_what blocker is retained for an explicit implementation-only / planning_would_invent_what=yes contradiction. Ready/closure and other explicit declaration conflicts still block. The readiness consumer documents the distinction and the refresh boundary.

Evidence: U9-red.log records three failing refresh cases before repair; U9-keyword-red.log records the vocabulary counterexample before its repair. U9-green.log records six suites / 76 tests passed, covering finalization, read-only validation, closeout, hooks, plan handoff and finding-schema consumers. One earlier suite invocation used a nonexistent handoff-test filename; the corrected run names the actual contracts suite. No host runtime, real design provider or model behavior was exercised.
