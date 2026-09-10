# Fix and Regression Test Contract

Read this before writing the Phase 2 recommendation or editing any file in Phase 3. The body keeps only the load-time condition; this reference carries the actionable test-first procedure.

**Test-first:**

1. Follow active project instructions and applicable subdirectory-scoped instructions. Inspect existing tests for the affected behavior before adding coverage. Use an existing failing test when it already captures the bug, update an existing test when it owns the contract but has the wrong expectation, narrowly strengthen an over-mocked test that should have caught the bug, or add a new minimal focused test only when no existing test is the right home.
2. The chosen regression test must fail on the current bug and pass once the corrected behavior lands; name it so the failure message explains the bug. This procedure applies to a confirmed defect. A test that fails because the change deliberately reverses its expectation is the divergent case and must be deferred rather than updated.
3. Verify the chosen test fails for the right reason — the root cause, not unrelated setup.
4. Implement one minimal change at a time: address the root cause and nothing else. Do not bundle drive-by refactors, formatting, or unrelated cleanup into a bug-fix change.
5. Verify the regression test passes, then re-run Phase 1's reproduction check against the original scenario (not only the minimized or test-shaped one) when that check can run here; when it cannot — the pipeline cannot-reproduce path — say so in the summary or structured return and let the caller's CI run on the pushed fix stand as that verification. Temporary debug instrumentation must all be gone before handoff; if you tagged your debug lines with one shared marker while investigating, verifying that is a single grep. Then run the broader suite for regressions.
6. Self-review every changed line for style violations, missed edge cases, adjacent regressions, and missing coverage. Do not run the broader polish/review/PR tail here; Phase 4 owns it after the debug summary.
7. Retain real command evidence for each check (`ran`, exit code, status, required/missing tools, reason code, and a bounded secret-stripped log). Planned commands, dry runs, or natural-language “passed” statements are not confirmed evidence.

If a fix fails, return to Phase 2, explicitly invalidate the current hypothesis with the evidence that ruled it out, and form a new hypothesis with its own grounding observation and prediction. Three failed fix attempts trigger smart escalation; do not retry variants of the same theory.

The entrypoint owns branch safety, pre-fix scope, and the final quality tail; do not repeat their decisions here. When the same root-cause pattern occurs in at least three other files or would be catastrophic in production, read `references/defense-in-depth.md` and choose applicable layers. For a production incident or a pattern in at least three locations, examine how it was introduced and escaped detection; carry any reusable finding to the handoff's learning decision.
