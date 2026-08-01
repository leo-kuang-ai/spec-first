# spec-plan maintainer eval fixtures

These files protect route boundaries and plan-output quality while `spec-plan` evolves.

- `eval.yaml` 只安装真实 `spec-plan`，三个隔离 Git fixture 使用 script Judge
  校验 requirements-only 原地深化、planning-only mutation boundary 与产品 blocker fail-closed。
- They are maintainer-only source evidence, not runtime instructions, a deterministic router, provider telemetry, or proof that model behavior improved.
- `examples.json` covers positive triggers, near-neighbors, safety, authorization, and failure/degraded paths. Degraded cases carry facts, authorization, fallback, forbidden behavior, reason code, remaining work, and claim ceiling.
- `output-quality-cases.json` records file-backed baseline risks, expected plan qualities, objective assertions, missing semantic/field evidence, and the protected `reuse / extend / compose / new` posture matrix.
- `consumer-replay-cases.json` maps paired Markdown/HTML requirements-only and implementation-ready fixtures to `spec-plan`, `spec-work`, and thin goal-handoff expectations, plus an authorization-aware fresh-source replay protocol. The fixtures under `fixtures/consumer-replay/` are controlled eval inputs, not user templates.
- Source refs stay repo-relative and must never point at generated runtime mirrors.
- A fixture pass is structural-only. Fresh-source samples or real host invocations are required before claiming semantic or field outcomes.
