# Runtime Setup Maintainer Evals

This directory is source-only maintainer evidence and is intentionally excluded from generated host runtime packages.

- `examples.json` provides examples-as-context for editing, reviewing, or fresh-source evaluation of setup posture.
- These examples are not a deterministic router, runtime-readiness gate, or substitute for LLM judgment during ordinary setup runs.

- `eval.yaml` 中 `check-readonly` 使用 `--check`，校验固定文件与 host 配置哨兵、setup facts 未产生；`--verify-only` 允许写 setup-owned facts，不能冒充严格只读。Judge 的本地正反校准见 `tests/unit/runtime-setup-eval-judge.test.js`；未运行模型、用户级配置/安装/瞬时副作用不在该判据覆盖范围。
- `bare-invocation-fail-closed-on-unverified-surface` 要求引擎以退出码 `2` 返回，并在最终输出同时给出 `blocked`、`reason_code` 与 `host-invocation-surface-unverified`；Judge 还检查 setup facts、readiness ledger、host config 及符号链接哨兵均未产生。该 case 只证明非真实宿主表面上的安全拒绝，不证明真实宿主上的成功安装、Provider 可用性或现场收益。
