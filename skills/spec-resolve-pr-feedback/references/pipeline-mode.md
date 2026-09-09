# Pipeline mode

Read this reference when the invocation carries `mode:pipeline` — set by an orchestrator such as `spec-babysit-pr` or `spec-lfg`. Keep the ordinary full or targeted evaluation and validation flow, with three unattended-run rules.

## 1. Never call the blocking-question tool

The caller is unattended. Never pause for a blocking question; return the structured `needs-human` residual so the outer workflow can surface it.

## 2. The open thread is the escalation ledger

When an item needs a human decision, put a condensed `decision_context` on its open thread as the reply and leave the thread open. Do not write a residual section into the PR body. Return the same item as a structured residual for the caller.

## 3. Stop a demonstrated non-converging approach at the root

When the caller supplies a `trajectory` showing a rising unresolved trend or fresh threads across passes, check for a demonstrated shared root or treadmill. Raise one approach-level `needs-human` decision about that root and stop fixing repeated instances. Ordinary unrelated findings still proceed normally.
