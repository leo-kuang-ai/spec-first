# Strategy Source

Required read before setup questions and before every report assembly. Resolve the source from current repository files on every run; do not reuse a source choice from a prior run, config, or cache.

1. Read `STRATEGY.md` first. Only when absent, select the first existing file from `VISION.md`, then `PRODUCT.md`, in that order. An unreadable file is not an absent file: record the limitation instead of disguising a read failure as nonexistence.
2. Read measurable success metrics by meaning. `Key metrics` is the local template heading; other writers may use different headings. Do not infer metrics from unrelated prose. When STRATEGY has no metrics but explicitly defers them to a legacy sibling, follow that reference. Without such delegation, do not override current strategy using a legacy file. If neither the selected source nor its delegated source defines metrics, say that they are not yet on file.
3. Take the product name from YAML `name`, then the H1 with any trailing ` Strategy` removed. If neither exists, use the README or repository name as a candidate and confirm it during setup. A candidate is not a user-confirmed fact.
4. During setup, show the document actually read, the product name, and the metrics for correction. If all files are absent, report that no strategy seed exists, start configuration from scratch, and mention that `spec-strategy` can seed a later reconfigure. During an already configured report run, missing strategy files do not restart setup: retain configured metrics and source receipts, report the missing strategy seed, and continue.

These files provide seeds only. Pulse never rewrites strategy or legacy files. Apply the existing excluded, pending, and source-receipt rules to metrics; a missing source is not a measured zero.
