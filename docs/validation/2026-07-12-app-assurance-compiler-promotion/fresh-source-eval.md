# Fresh-Source Semantic Eval

状态：`not_run`。

原因：当前宿主没有可调用的 fresh generic subagent/dispatch primitive，且本次用户授权只要求继续执行方案，没有授权外部分发。根据 `docs/contracts/workflows/fresh-source-eval-checklist.md`，不得使用当前会话缓存的 typed skill、自评或确定性测试冒充 fresh-source semantic evidence。

未覆盖的语义 cases：

- cross-source journey mapping 与 same-name false mapping；
- inferred-only IR claim 与 mixed item authority；
- complete/truncated absence scope；
- Android/iOS intentional divergence；
- permission/lifecycle/duplicate-submit counterexamples；
- platform-specific verification kind/environment 选择；
- isolated challenge、prompt injection 与 restricted-data handling。

影响：semantic promotion 继续 blocked；这与 U8 `continue_trial`、`promotion_eligible:false` 和 `integration_authorized:false` 一致。确定性 Gate A/B/D 的通过不改变该结论。
