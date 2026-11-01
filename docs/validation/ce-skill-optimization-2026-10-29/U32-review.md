# U32 Sweep final publication and media receipt consumption

Status: local mechanism verified. Real connector/media/host orchestration remains not-run.

## Owning changes

CE and local Sweep wrap-up sources both allowed the final state bookkeeping to occur after the commit/publication step. The local entrypoint now records and releases first, consumes each engine status, commits only the exact final paths under existing authority, and publishes only in shared topology. Acquisition still requires a published/read-back lease before source writes. A rejected acquisition never automatically rebases stale state over another writer.

`publish-final-state.py` is narrow publication glue: it does not write state, stage, commit, acquire/release leases or rebase. It checks exact lease/candidate identities, run-record values, all intervening committed paths, remote fetch/push endpoint agreement and current remote state; then uses a normal non-force push and exact-state readback. Repeated recovery of an already-published candidate performs no push. A newer remote writer or missing readback prevents cleanup claims. It suppresses ambient followTags, mirror and submodule-push behavior to keep the write scoped to the named branch. Caller authorization flags are assertions, not authenticated host enforcement.

`analyze-sweep-media.py` binds the existing analyzer to a private run/item packet and a hash-checked file snapshot. Sensitive media always stays no-transcribe; missing/mismatched ordinary-media scope also selects no-transcribe. The exact provider request/attempt/partial-coverage receipt returns to the worker and parent. An interrupted authorized call without a receipt records unknown egress. The wrapper cannot authenticate authorization provenance; the parent must verify the actual instruction. Unpacked directories remain local-only rather than inheriting a file grant. No changes were made to the canonical analyzer or its byte-identical Sweep copy in this unit.

The packet, media persona, run consumer and final summary now agree on scratch writes, source identity, scope, private receipt retention and partial/unknown status. Shared output excludes raw media, transcripts, authorization text and private absolute paths. Existing state engine remains the only state writer.

## Verification

- `U32-publication-red.log`: 9 failures before the new publisher existed; this is missing-entrypoint evidence, not a reproduced old runtime incident.
- `U32-publication-green.log`: 7 passed / 2 failed. One fixture omitted required counts; another inherited home Git hook configuration. Both fixture defects were fixed, with HOME and USERPROFILE isolated.
- `U32-publication-green-2.log`: 9 passed.
- `U32-media-red.log`: 8 failures before the media wrapper existed. Initial green attempt failed because macOS temporary paths were not canonicalized in the fixture; `U32-media-green-2.log` passed after fixing the fixture.
- `U32-combined-check.log`: 61 tests passed across real local-remote publication, media admission, both analyzer paths and state locking/import.
- `U32-final-check.log`: 80 tests passed after adding unavailable-readback recovery and history/endpoint cases.
- `U32-tag-red.log`: one targeted test demonstrated an actual unrelated annotated tag being pushed under ambient `push.followTags=true`.
- `U32-final-green.log`: 7 suites / 81 tests passed after constraining tag/mirror/submodule effects.
- `U32-entrypoints.log`: source entrypoint validation passed. `U32-typecheck.log`: 300 JavaScript files passed. Both new Python sources parsed successfully; analyzer copies matched and `git diff --check` passed.

The media integration uses the real analyzer entrypoint with a fake subprocess/provider recorder and controlled source preparation; no real ffmpeg, provider upload or transcript quality was evaluated. Local bare remotes prove Git behavior, not real service transport or actual conversation continuation. Parent summary fidelity and instruction compliance still need U29/U30. Scope flags and Python checks are not an OS sandbox; no runtime enforcement or independent review is claimed. All Git commits/pushes in these tests occurred only inside automatically removed local fixtures, not the project or a real remote.
