# PRD Maintainer Evals

This directory is source-only maintainer evidence and is intentionally excluded from generated host runtime packages.

- `examples.json` contains the source-owned examples-as-context fixture.
- `run-evals.js` validates deterministic fixture structure, coverage buckets, and reason-code facts；`--run-dir` 还会从 frozen cases 推导精确 schedule，并交叉校验 materialization receipt、attempted/completed sessions、五类 isolation deny facts、retained-evidence provenance/hash，以及 committed holdout 对 attempt/candidate/source/authority/expiry 的绑定；`--require-run-audit` 额外强制 enclosing audit manifest、逐文件 hash 与 artifact type。
- `evaluation-governance.md` records maturity, evidence labels, review cadence, and promotion boundaries.
- `contract-reset-protocol.md` 与 `contract-reset-cases.json` 冻结 Gate A 三臂、case role、material-effect、complexity、session/order、isolation、retention 和 no-go/inconclusive 合同。
- `contract-reset-candidate.patch` 是 eval-only candidate；它只在隔离 materialized tree 中应用，不是默认 source/runtime patch。
- `run-contract-reset-arm.js` 是 source materialization、fresh arm session 与 active hard-isolation probe 的唯一 owner；硬隔离不可证明时不调用模型。
- `prepare-contract-reset-evidence.js` 确定性生成 arm-neutral blind packet、private retained evidence 与 hashes；它拒绝 symlink ancestor、非法 UTF-8、quoted credential、未绑定 arm/session/tree/model-visible provenance 和越界/重叠 raw cleanup target。Enclosing run audit 会按原 run-relative path 保留每个 completed session 的 retained manifest、sanitized Product Contract、blind packet、event log 与 grading notes，并逐文件标注 hash/artifact type。

Run the deterministic fixture check from the repository source checkout:

```bash
node skills/spec-prd/evals/run-evals.js --json
```

验证 producer 尚未导出的原始冻结 run directory（严格只读）：

```bash
node skills/spec-prd/evals/run-evals.js --run-dir <run-dir> --json
```

验证可交接的 durable run-audit bundle 时必须同时校验 enclosing manifest：

```bash
node skills/spec-prd/evals/run-evals.js --run-dir <durable-audit-dir> --require-run-audit --json
```

Gate A 的语义 product-quality/materiality 结论由独立 reviewer 与 owner 裁决；runner 只确认确定性地板，不能把 fixture 或结构通过写成 outcome evidence。
