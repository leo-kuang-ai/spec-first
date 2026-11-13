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
node "<loaded-skill-dir>/scripts/measurement-admission.cjs" admit --input <measurement-admission-input.json>
```

Persist the returned `normalized_admission` and `admission_sha256`. Every attempt
must carry that digest. The validator accepts immutable arm identities as full
Git commit SHAs or SHA-256 content identities; corpus, harness, and environment
identities must be SHA-256 content identities. A rejected admission is terminal
for that proposed run and creates no synthetic measurement result.

Admission v2 requires `schema_version: spec-optimize-measurement-admission/v2`
and `noise_rule: range-v1`. This rule computes `max(score) - min(score)` across
every completed A/A observation, in the metric's units; it is a conservative
observed spread, not a confidence interval. Set the noise ceiling in those same
units before running. Old v1 admissions cannot authorize A/B: retain their logs,
create a fresh v2 admission and rerun A/A; do not relabel historical evidence.

Every completed A/A attempt has a distinct `run_id`, `result_ref` (relative to
the gate input file, or absolute), and `result_sha256` (`sha256:<hex>`). Preserve
the actual harness output and exit status, and write a result record containing:

```json
{
  "schema_version": "spec-optimize-measurement-result/v1",
  "run_id": "aa-1",
  "admission_sha256": "sha256:<normalized-admission-digest>",
  "source_identity": "<frozen-baseline-identity>",
  "status": "completed",
  "exit_code": 0,
  "score": 0.42
}
```

Each record must come from a separate actual measurement launch. Hash the saved
bytes and retain the raw command/log provenance; never copy a result to inflate
the sample count. The validator checks file integrity, distinct run/file identity,
baseline/admission binding, successful exit and score agreement. Files must be
regular, non-symlink files of at most 1 MiB. These checks cannot authenticate a
caller-created record or prove process independence: the owner must inspect the
launch/log evidence. `evidence_scope: file-integrity-and-arithmetic-only` makes
that limit explicit. Broken attempts remain in the ledger without scores.

## Sequence

1. Run A/A with the frozen baseline on both arms. Preserve every raw result and
   classify broken runs before aggregation.
2. Let the validator compute the A/A noise floor from the result records using
   the pre-registered noise rule. A supplied `observed_noise_floor` is descriptive
   and never substitutes for that computation. If noise exceeds the ceiling, stop with
   `noise-floor-too-high`; do not run or interpret A/B.
   Before A/B, run `node "<loaded-skill-dir>/scripts/measurement-admission.cjs" allow-ab --input
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
