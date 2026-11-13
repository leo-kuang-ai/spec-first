# U15 proof preservation across cleanup

Status: mechanism verified. Review source: producer-self-review. Fresh-source model behavior and independent review remain not-run.

CE source comparison confirmed the useful integration: its Simplify proof-test context protects tests and their test-only seams while permitting equivalent production refactors. Its Work, Debug and LFG callers explicitly pass the proof set. Spec-first retains its separate mutation/commit/landing authority, dirty-work protection and final-tree verification; no CE automatic shipping or worker policy was imported.

| Producer or consumer | Implemented contract |
| --- | --- |
| Work phase-boundary and shipping callers | Pass proof-test paths, unit/task origin, test-only seams, actual command/log refs and current byte identity through existing verification evidence. |
| Work return-to-caller | Retains the proof context for the outer owner; missing or stale identity remains a limitation. |
| Debug standalone and pipeline return | Carries original reproducer and regression/characterization evidence. Pipeline mode still returns without its own simplify or shipping tail. |
| LFG | Consumes Work verification_evidence or Debug verification.checks, protects proofs during cleanup and reruns the symptom/proofs before full final-tree verification. |
| Simplify | Strips proof-test tokens from scope, snapshots current proof identity, preserves exact tests and test-only seams, reports mismatches/limitations and permits behavior-preserving production refactors. |
| Write-tasks and Work intake | Preserve refs/protection intent in existing context_refs, notes, risk_note, test_focus and done_signal fields. Work consumes full contract.tasks, not the lossy execution_focus projection. External done signals and settled structural decisions retain their original meaning. |

No new task schema, central controller or runtime enforcement claim was added. Proof selection and source-binding adequacy remain semantic judgments. The source contract requires actual tool facts for bytes, commands and results; prose alone does not enforce that every model obeys it. A legitimate test defect returns to the implementation owner for evidence reconciliation rather than becoming a cleanup exception.

## Verification

- U15-green.log: 6 suites / 114 tests passed. Real isolated CLI validation preserves full task context and rejects source-plan drift. Simplify calibration runs actual HTTP proof and demonstrates that removing a proof test or test-only seam can leave the runner green while the byte-preservation judge correctly fails. Renames fail; a production parsing-helper refactor remains accepted.
- The guarded Simplify fixture now has an executable proof test and a test-only HTTP seam. The existing eval builder emits its self-contained seam and binds fixture bytes in the judges. The revised English case asks for fresh proof before cleanup and reruns afterward.
- U15-eval-validate.log: Simplify's four cases validated. This did not run a model.
- U15-entrypoints.log: skill-entrypoint lint passed. U15-typecheck.log records the JavaScript syntax check.
- Eval bundle drift check and git diff whitespace checks passed.

There is no RED-before-change/model-history claim for this prose integration. The tests calibrate deterministic fixture preservation and task transport, not LLM handoff fidelity, semantic sufficiency or real development benefit. Those remain U29/U30 obligations. No commit, push, runtime regeneration or external operation occurred.
