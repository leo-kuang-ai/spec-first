# App Consistency Audit Maintainer Evals

This directory is source-only maintainer evidence and is intentionally excluded from generated host runtime packages.

- `examples.json` covers trigger, near-neighbor boundary, failure, and expected-output cases as examples-as-context.
- `recorded-output-fixtures.json` records minimal no-raw-issues, degraded-mode, and code-review handoff shapes; it is not provider-backed model evidence.
- `evaluation-governance.md` records owner, review cadence, evidence labels, and the promotion boundary.
- `run-pilot.cjs` 将已经产生的三臂输出按 hash 绑定为 promotion bundle；它不执行或评分语义工作。
- `validate-pilot-evidence.cjs` 在样本、盲审、采用、成本、权限或完整性证据缺失时 fail closed。

```bash
node skills/spec-app-consistency-audit/evals/run-pilot.cjs \
  --bundle docs/validation/<date>-app-assurance-compiler-promotion \
  --spec docs/validation/<date>-app-assurance-compiler-promotion/pilot-spec.json

node skills/spec-app-consistency-audit/evals/validate-pilot-evidence.cjs \
  --bundle docs/validation/<date>-app-assurance-compiler-promotion
```
