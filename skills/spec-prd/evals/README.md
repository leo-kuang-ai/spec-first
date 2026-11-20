# PRD Maintainer Evals

This directory is source-only maintainer evidence and is intentionally excluded from generated host runtime packages.

- `examples.json` contains the source-owned examples-as-context fixture.
- `run-evals.js` validates deterministic fixture structure, coverage buckets, and reason-code facts; `--run-dir` also derives an exact schedule from frozen cases and cross-validates materialization receipt, attempted/completed sessions, five types of isolation deny facts, retained-evidence provenance/hash, and committed holdout bindings to attempt/candidate/source/authority/expiry; `--require-run-audit` additionally enforces an enclosing audit manifest, file-by-file hash, and artifact type.
- `evaluation-governance.md` records maturity, evidence labels, review cadence, and promotion boundaries.
- Freeze Gate A three-arm, case role, material effect, complexity, session/order, isolation, retention, and no-go/inconclusive contracts in `contract-reset-protocol.md` and `contract-reset-cases.json`.
- `contract-reset-candidate.patch` is an eval-only candidate; it is applied only within the isolated materialized tree and is not the default source/runtime patch.
- `run-contract-reset-arm.js` is the sole owner of source materialization, fresh experiment-arm sessions, and active hard-isolation probing; the macOS probe launches a minimal `/usr/bin/perl` errno helper via `/usr/bin/sandbox-exec`, exposing only the system runtime libraries, dyld shared-cache namespace, the current ARM namespace, and probe output; any of the five required read operations must trigger a genuine `EPERM`/`EACCES`; no model invocation occurs if any primitive/helper/deny fact cannot be proven.
- `prepare-contract-reset-evidence.js` deterministically generates arm-neutral blind packets, private retained evidence, and hashes; it rejects symlink ancestors, invalid UTF-8, quoted credentials, unbound arm/session/tree/model-visible provenance, and out-of-bounds/overlapping raw cleanup targets. The enclosing run audit preserves, relative to the original run path, the retained manifest, sanitized Product Contract, blind packet, event log, and grading notes for each completed session, and annotates each file with a hash/artifact type.

Run the deterministic fixture check from the repository source checkout:

```bash
node skills/spec-prd/evals/run-evals.js --json
```

Verify the original frozen run directory before export (strictly read-only):

```bash
node skills/spec-prd/evals/run-evals.js --run-dir <run-dir> --json
```

When verifying a transferable durable run-audit bundle, the enclosing manifest must be validated concurrently.

```bash
node skills/spec-prd/evals/run-evals.js --run-dir <durable-audit-dir> --require-run-audit --json
```

The semantic product-quality/materiality conclusion for Gate A is determined by an independent reviewer and owner; the runner may only confirm deterministic flooring and shall not treat fixture or structural items as outcome evidence.
