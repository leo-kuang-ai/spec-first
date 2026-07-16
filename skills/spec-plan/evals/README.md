# spec-plan maintainer eval fixtures

These files protect route boundaries and plan-output quality while `spec-plan` evolves.

- They are maintainer-only source evidence, not runtime instructions, a deterministic router, provider telemetry, or proof that model behavior improved.
- `examples.json` covers positive triggers, near-neighbors, safety, authorization, and failure/degraded paths.
- `output-quality-cases.json` records file-backed baseline risks, expected plan qualities, objective assertions, and missing semantic/field evidence.
- Source refs stay repo-relative and must never point at generated runtime mirrors.
- A fixture pass is structural-only. Fresh-source samples or real host invocations are required before claiming semantic or field outcomes.
