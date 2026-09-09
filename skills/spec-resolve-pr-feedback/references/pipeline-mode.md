# Pipeline mode

Read this reference for legacy `mode:pipeline` callers. `spec-lfg` uses `mode:pipeline-return`, whose reference owns the stricter local-only return. Keep the ordinary full or targeted evaluation and validation flow, with three unattended-run rules.

## 1. Never call the blocking-question tool

The caller is unattended. Never pause for a blocking question; return the structured `needs-human` residual so the outer workflow can surface it.

## 2. Preserve the complete decision

Return the exact typed residual defined in [evaluation-rubric.md](evaluation-rubric.md): `type`, every stable `sources` ID and kind, `decision_context.quoted_feedback`, `investigation`, `decision_reason`, `options` with tradeoffs, nullable `recommendation`, and every owned open-thread URL in `thread_urls`. Continue unrelated authorized work, then return the unresolved decision set without waiting for an answer. A non-empty set cannot return complete.

Only with existing reply authorization, put a condensed decision_context on each owned open thread. Leave every covered thread open; never resolve it or write a residual section into the PR body. Missing reply authority leaves the reply not-run and does not prevent returning the full payload. Posting an acknowledgment does not replace the caller-visible decision handoff.

## 3. Stop a demonstrated non-converging approach at the root

When the caller supplies a `trajectory` showing a rising unresolved trend or fresh threads across passes, check for a demonstrated shared root or treadmill. Raise one approach-level `needs-human` decision about that root and stop fixing repeated instances. Ordinary unrelated findings still proceed normally.
