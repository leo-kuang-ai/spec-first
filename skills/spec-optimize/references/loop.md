# Optimization loop

Run optimization as a bounded measurement loop: freeze identity and baseline, change one treatment, measure the agreed objective, and keep multi-objective wins only when the evidence supports them. Screen expensive runs before spending them and record `not-run` or `degraded` outcomes honestly.

## Retuning a prompt or skill corpus

When the mutable surface is a prompt or Skill corpus, treat the task as a
measurement problem before a wording problem. A static reading can identify
plausible cuts, but it cannot show that a cut improved the target behavior.
Require a repeatable harness, a selectable source checkout, and a registered
acceptance bar before editing the corpus. If one is missing, stop with the
missing prerequisite instead of presenting an audit as a retuning result.

Use historical runs as a baseline when available. Run an A/A noise-floor check
on identical source identities before interpreting A/B results, and keep
"followed the workflow" separate from "completed the task" in the recorded
metrics. Broken runs, timeouts, and harness errors are first-class outcomes;
they must not receive synthetic scores or inflate an apparent improvement.

Audit proposed reductions and their defenses in independent contexts when
dispatch is available. A cut with no provenance after a real search is a
candidate; a cited test, contract, or learning that protects the text removes
it from the cut list. Absence of evidence is a verification task when the
project's normal change bar requires a reproduced failure.

Apply changes in small passes with disjoint file ownership. Preserve field
names, enums, markers, and security guards that are consumed as data. Do not
edit tests merely to make a refactor green. A workflow whose product is to
stop and ask needs an unattended degradation path, not removal of its pause.

After each pass, read the failure location and classify the outcome before
choosing the next hypothesis. A failure that moves later identifies progress;
the same failure site means the hypothesis missed. Inspect phases the harness
cannot reach and report those limits, because a green run only certifies what
it exercised. Keep each pass separately attributable in the experiment log
and commit history.
