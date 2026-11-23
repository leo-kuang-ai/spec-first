# Trigger Eval Maintainer Guide

This directory contains maintainer evidence and is not projected to runtime. `trigger-cases.json` is the sole source of route cases; do not duplicate a second set of cases.

- `evidence_scope: structural-only` indicates that fixture/contract does not equate to model behavior improvement.
- `node skills/spec-write-skill/evals/export-trigger-evals.cjs --format skill-creator` can output the shape of `evals.json` for `skill-creator`.
- `node skills/spec-write-skill/evals/export-trigger-evals.cjs --format yao` can output the three-bucket shape of the Yao trigger evaluator.
- Export addresses only schema portability and does not generate semantic, baseline, or field evidence.

`mirror-patch-refused.yaml` tests the decision after explicit invocation, not whether the Skill triggers naturally. The source and mirror fixtures start as separate files with identical bytes. When changing that baseline, update both files and verify the digest pinned in the judge. The judge checks the refusal decision, source path, refresh command, final file digests, and runner trace separately. Recognized read-only calls can be graded automatically; unknown calls need manual review. A correct reply without a trace returns a nonzero exit code. Even a pass does not establish the absence of all side effects.
- When adding a new case, concurrently verify `expected_trigger`, `expected_effect`, `expected_layer_result`, `reason_code`, `forbidden_signals`, and `source_refs`, and run `npm run test:eval-fixtures`.

## Promotion Protocol

Promotion is not a fixture pass. The executor must separately record:

1. retrospective native creator Gate 0；
2. Fresh host route result of `route_queries`;
3. The fresh-source output of all behavior cases in the canonical case set;
4. fixed pre-candidate regression；
5. matched native/candidate-ablation output review and fixed `old-full` regression;
6. In the canonical case set, all fresh host route results, default loading of Markdown bytes, tokens, duration, redaction, and final gate calculation.

New promotion bundle root uses `spec-write-skill.promotion-evidence/v2`'s `manifest.json`; validator continues to support previously released v1 bundles, with v1 fixed at 8 behavior cases and retaining the original gate semantics, without using new rules to reverse-engineer historical evidence. Three assembly groups are fixed as:

- `native`: a `common_guardrails` + a `native_creator`;
- `candidate-ablation`：a `common_guardrails` + one to multiple `portable_core` slices;
- `candidate-full`：Loads only one complete candidate source, and no longer injects common guardrails.

In v2, each behavior case in `case_set` must be double-run with at least two distinct `repeat` numbers using `candidate-full`, and each declared arm must have at least one run. The `old-full` arm uses the single-file `baseline_full` assembly to inherit pre-candidate regression; it does not substitute for the full coverage of `candidate-full` or for native/candidate-ablation comparisons. The Manifest's `coverage` must explicitly list all behavior cases and route queries from the bound `case_set`, and must identify the corresponding comparison/regression cases; the v2 case set may grow with the canonical fixture, but must retain at least 8 behavior cases and between 12–16 route queries with a floor of deterministic quality. For each behavior run, store the prompt, output, machine check, and blind reviewer artifacts as relative paths with SHA-256 hashes; reviewer artifacts must declare `blind=true` and `independent=true`. For each route run, store the prompt, output, and machine check. All runs must record model, host, route high-risk misroute, redaction status, input/output/total tokens, duration, and verdict; the verdict in machine/reviewer artifacts must match that in the Manifest, and route high-risk misroute must be carried in the machine-check artifact and must align with the case declaration. Reviewers do not receive intended fixes.

Manifest must also: cite the original evidence from Gate 0, and explicitly resolve the semantic decision of "whether the candidate provides additional benefit" as `pass|fail|not_run`; measure the actual Markdown byte count of the default context artifact; derive the input token delta from the run tokens of native/candidate-ablation; record a visible quality or safety benefit justification if the delta exceeds 20%. `not_run` is a structurally valid but non-promotion result and must not enter U4.

`gate_calculation` only counts behavior machine/reviewer failure and fresh route failure from `candidate-full` as candidate hard failures; failures from native, `candidate-ablation`, and `old-full` are evaluated individually and do not directly block the gate. They must be consolidated by the two hash-bearing semantic conclusions: `comparative_verdicts.matched_ablation` and `comparative_verdicts.old_regression`; if either one reports `fail|not_run`, the final gate is deemed failed or not run.

Verification command:

```bash
node skills/spec-write-skill/evals/validate-promotion-evidence.cjs \
  docs/validation/<date>-spec-write-skill-promotion \
  --json
```

Manifest missing fields, artifact hash drift, relative path escape, symlink, ARM re-injection, missing fixed old ARM or complete route/behavior coverage, duplication (repeat), missing dual-run, non-blind-reviewed reviewer, untested context/token countermetric, artifact/manifest verdict drift or gate calculation inconsistency all result in exit 1. When host dispatch is unauthorized or unavailable, semantic runs record `not_run`; structural-only fixtures from this directory must not be used, and U4 promotion must not be initiated.

The CLI returns exit 0 only when the bundle structure is valid and the final `result=pass`; if the structure is valid but the semantic result is `fail|not_run`, it still returns exit 1. The `candidate_source` must have the same hash as the `candidate-full` assembly content, and the `baseline_source` must have the same hash as the `old-full` assembly content, to prevent the declared promotion source from diverging from the actual evaluation source.
