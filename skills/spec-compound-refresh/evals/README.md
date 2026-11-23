# What the refresh evaluations verify

`eval.yaml` lists four cases. In `non-solutions-scope-gated`, the ledger fixture presents a choice: the entire answer must be `outside-refresh-scope`. This checks only the scope choice, not unprompted routing or whether the worktree stayed unchanged.

The other three cases use an isolated `publication-safety` repository. `prepare-eval.cjs` establishes the original file contents, HEAD, and index; preparing that baseline does not authorize a task commit. The judges compare the final files and Git state with the reported JSON:

- `publication-preserve`: Keep the originals unchanged. The report must recommend retaining the old document and identify both its unique section and the catalog that depends on it.
- `publication-partial`: Distinguish the successor published before the run from this run's empty change and deletion lists. Catalog repair and removal of the old document are still pending.
- `publication-recover`: The successor must retain the offline guidance verbatim and both independent recheck conditions. The catalog must link to the new anchor without losing its manual entry, and the old document must be recoverable from the baseline. Either condition alone is insufficient.

Edit `scripts/evals/knowledge-publication-checks.cjs` and regenerate the three packaged judges with `scripts/evals/build-outcome-judges.cjs`. `tests/unit/knowledge-publication-judges.test.js` calibrates the judges against correct and damaged final states. `fixtures/publication-counterexamples.json` describes the case design; it is neither a fault log nor the mounted fixture. Calibration does not establish the order of model actions, atomicity across files, or the quality of arbitrary knowledge records.
