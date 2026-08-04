# Measurement-Only Calibration

Use this mode to measure a frozen baseline/candidate pair. It is not an
authoring, mutation, integration, or promotion workflow.

## Admission

Require all inputs before the first run:

- immutable `baseline_identity` and `candidate_identity` with source refs or
  content hashes;
- one repeatable `task_or_corpus_identity` and deterministic selection seed;
- one measurement harness identity and command;
- at least two baseline-vs-baseline A/A repetitions;
- a pre-registered primary metric, direction, aggregation method, noise rule,
  acceptance threshold, broken-run policy, and stop budget.

Missing identity or harness evidence returns `measurement-admission-incomplete`.
Do not infer a threshold after observing A/A or A/B results.

Write the approved fields to a private run-local JSON file and validate them
before invoking the harness:

```bash
node scripts/measurement-admission.cjs admit --input <measurement-admission-input.json>
```

Persist the returned `normalized_admission` and `admission_sha256`. Every attempt
must carry that digest. The validator accepts immutable arm identities as full
Git commit SHAs or SHA-256 content identities; corpus, harness, and environment
identities must be SHA-256 content identities. A rejected admission is terminal
for that proposed run and creates no synthetic measurement result.

## Sequence

1. Run A/A with the frozen baseline on both arms. Preserve every raw result and
   classify broken runs before aggregation.
2. Compute the A/A noise floor using the pre-registered aggregation and noise
   rule. If noise exceeds the pre-registered ceiling, stop with
   `noise-floor-too-high`; do not run or interpret A/B.
   Before A/B, run `node scripts/measurement-admission.cjs allow-ab --input
   <aa-gate-input.json>`. Only `ab_allowed: true` authorizes the measurement
   sequence to continue; this is measurement sequencing authority, not mutation,
   promotion, commit, or landing authority.
3. Run A/B with identical corpus selection, seed, harness, environment facts,
   and budgets. A changed arm identity invalidates the comparison.
4. Compare the aggregated delta with both the observed noise floor and the
   pre-registered acceptance threshold. Report regression, inconclusive, or
   threshold-clearing improvement as measurement results, not promotion
   decisions.

## Broken-Run Taxonomy

Classify each attempt as exactly one of:

- `completed`: valid measurement payload and exit status;
- `harness-error`: command crash or malformed output;
- `timeout`: pre-registered deadline exceeded;
- `environment-drift`: runtime, dependency, seed, corpus, or source identity
  changed;
- `gate-failed`: the output is valid but a pre-registered degenerate gate failed;
- `not-run`: an admission or dependency requirement prevented execution.

Broken runs never receive a synthetic score and never count as candidate
regressions or wins. Retry only under the pre-registered retry budget.

## Measurement Artifact

Write one artifact under
`.spec-first/workflows/spec-optimize/<spec-name>/measurement-calibration.yaml`
containing identities, preregistration, A/A attempts, computed noise floor,
A/B attempts, broken-run counts, aggregate delta, result classification,
limitations, evidence refs, the normalized admission, and `admission_sha256`.
Write and read it back before reporting.

Allowed recommendations are `stop`, `defer`, `collect-more-evidence`, or
`eligible-for-owner-evaluation`. The artifact never edits a Skill, invokes a
promotion workflow, or claims that a candidate should ship.
