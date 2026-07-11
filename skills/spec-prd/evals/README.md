# PRD Maintainer Evals

This directory is source-only maintainer evidence and is intentionally excluded from generated host runtime packages.

- `examples.json` contains the source-owned examples-as-context fixture.
- `run-evals.js` validates deterministic fixture structure, coverage buckets, and reason-code facts.
- `evaluation-governance.md` records maturity, evidence labels, review cadence, and promotion boundaries.

Run the deterministic fixture check from the repository source checkout:

```bash
node skills/spec-prd/evals/run-evals.js --json
```
