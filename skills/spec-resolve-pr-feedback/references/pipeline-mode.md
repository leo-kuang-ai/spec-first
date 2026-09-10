# Pipeline mode

Read this reference for legacy `mode:pipeline` callers. `spec-lfg` uses `mode:pipeline-return`, whose reference owns the stricter local-only return. Keep the ordinary full or targeted evaluation and validation flow, with three unattended-run rules.

## 1. Never call the blocking-question tool

The caller is unattended. Never pause for a blocking question; return the structured `needs-human` residual so the outer workflow can surface it.

## 2. Preserve the complete decision

Return the exact typed residual defined in [evaluation-rubric.md](evaluation-rubric.md): `type`, every stable `sources` ID and kind, `decision_context.quoted_feedback`, `investigation`, `decision_reason`, `options` with tradeoffs, nullable `recommendation`, and every owned open-thread URL in `thread_urls`. Continue unrelated authorized work, then return the unresolved decision set without waiting for an answer. A non-empty set cannot return complete.

Only with existing reply authorization, put a condensed decision_context on each owned open thread: the concern, investigation, reason a decision is needed, options/tradeoffs, and recommendation when present. Reply to carry this analysis, never merely to announce that the thread remains open. Leave every covered thread open; never resolve it or write a residual section of your own into the PR body. Ticking an existing `## Residual Review Findings` checklist bullet that a committed fix closed (same file and concern) is not writing a section: tick `- [ ]` to `- [x]` only — never add, reorder, or create that section; it is the author's record. Missing reply authority leaves the reply not-run and does not prevent returning the full payload. Posting an acknowledgment does not replace the caller-visible decision handoff.

## 3. Stop a demonstrated non-converging approach at the root

When the caller supplies a `trajectory` (`unresolved_trend`, `new_threads_this_tick`) showing a rising unresolved trend or fresh threads across passes, check for a demonstrated shared root or treadmill. Raise one approach-level `needs-human` decision about that root and stop fixing repeated instances. A single batch or reviewer identity alone proves neither pattern; ordinary unrelated findings still proceed normally. Preserve every source ID and owned thread URL in the shared decision, and continue independent authorized fixes.
