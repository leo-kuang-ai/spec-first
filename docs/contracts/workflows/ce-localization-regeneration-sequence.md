# CE Localization Regeneration Sequence

Runbook contract for regenerating the CE localization source-bound chain after canonical source edits. Derived from 2026-08-30 incidents where out-of-order edits invalidated a freshly closed chain twice in one session.

## When to run

Any change to files under **canonical source roots** dirties the deterministic snapshot and stales the chain: `skills/**`, `tests/**`, `scripts/**`, `src/**`, `templates/**`, root `CLAUDE.md`/`AGENTS.md`/`README*`/`CHANGELOG.md`/`package.json`, `docs/**` (canonical but see exclusions below). The closeout topology test (`tests/unit/ce-localization-closeout-contracts.test.js`) goes red until the chain is re-run.

**Not** sensitive: everything under `docs/validation/**` (explicitly excluded by `scope_contract.excluded_run_outputs`, including the chain's own artifacts) — writing adjudication/delta/closeout files never re-stales the chain.

## Hard ordering rule

> Finish ALL canonical-root edits (code, tests, docs, CHANGELOG) BEFORE step 1. Any canonical edit after the chain closes re-stales it. A README one-liner after closeout = full re-run.

## Sequence

1. `node scripts/check-ce-localization-review.cjs --refresh` — regenerates inventory/coverage with the current dirty manifest.
2. `node scripts/check-ce-upstream-reconciliation.cjs --refresh --prepare-adjudication --ce-repo <compound-engineering-plugin checkout> --base 5c7cb347d0686663743b87cd7227246ba24f7fa7 --head 956087b3e1dd7ccc03df32cee9e7c044dfbe75cf` — regenerates the adjudication **input** (both steps 1–2 must run; their snapshots only agree when both are fresh).
3. LLM adjudication stamp: `target_source_snapshot` must byte-equal `skill-inventory.json`'s `source_snapshot`, `input_artifact_sha256 = sha256(JSON.stringify(input, null, 2) + '\n')`. Policy (`assertCurrentUpstreamBinding`) forbids pure script rebinding — the 517 record decisions must carry a fresh-source verification pass (existence of local refs/owners/tests; upstream refs via `git cat-file` at the pinned head — note the dual-repo semantics of `source_refs`); re-stamping verified decisions is the accepted carry-over, record the method in `review_context`.
4. Review delta: rebuild `reviewed_paths` to exactly the current lane gaps (`collectReviewGaps(openai, deterministic)` + anthropic; schema requires per-path dual-lens verdicts, sha256/bytes/lines) and rebind `source_binding` (6 values from the same deterministic build). `execution_context` is schema-frozen to the inline constant set — disclose the actual review method in `limitations`.
5. `node scripts/generate-ce-localization-closeout.cjs --review-delta docs/validation/ce-localization/review/deltas/<delta>.json`.
6. Verify: `npx jest tests/unit/ce-localization-closeout-contracts.test.js tests/unit/ce-localization-review-contracts.test.js` (16/16), then the freeze number in `ce-localization-review-contracts.test.js` must match `package_path_count` (update whenever tracked file count changes).

## Commit cadence implication

Committing the chain artifacts moves HEAD and re-stales the chain for the next session (working-tree green, committed-state red is the established cadence). Keep chain artifacts working-tree-dirty; they ride the next owner batch commit, and the chain is re-run after it.
