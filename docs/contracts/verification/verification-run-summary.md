# Verification Run Summary Contract

`verification-run-summary.v1` records structured verification results for a single workflow run. It is the shared per-check result surface consumed by `spec-work`, `spec-debug`, and `spec-code-review` closeout.

Callers select the owning scope with `verification-run-summary record --workflow spec-work|spec-debug|spec-code-review`. The selected workflow determines the repo-local root under `.spec-first/workflows/<workflow>/<workspace-slug>/<run-id>/`; it does not transfer artifact ownership between workflows. `spec-work` may later reference its own summary from a conditional `spec-work-run-artifact/v2`. `spec-debug` and `spec-code-review` return their summary ref and honest-closeout verdict only; they do not write that work artifact.

Canonical fields are defined by `docs/contracts/verification/verification-run-summary.schema.json`:

输入与输出不是同一形状。运行 `spec-first internal verification-run-summary record --help` 可读取当前输入字段、状态枚举和最小示例；`read --help` 提供回读参数。帮助只读且不要求目标仓库，示例默认为 `not-run`，必须以实际命令结果和日志替换后才能声明通过。输出的 `schema_version`、`generated_at` 由 writer 生成，不放入输入。

- `profile`: the profile source, active profile name, and source path.
- `checks[]`: `id`, `service`, `command`, `status`, `exit_code`, `ran`, `required_tools`, `missing_tools`, `log_path`, `reason_code`, and `redaction_status`.

Status boundaries:

- `passed`: `ran=true`, `exit_code=0`, and a repo-relative redacted log ref exists.
- `failed`: `ran=true`, non-zero `exit_code`, and a repo-relative redacted log ref exists.
- `not-run`: `ran=false`, `exit_code=null`, and a concrete `reason_code`.
- `degraded`: evidence exists but is not strong enough for verified closeout.

Red-line mappings:

- Dry-run or schedulable-but-not-executed checks must be `not-run` with `reason_code: "schedulable"`.
- `reason_code` 是具体原因字符串而非固定枚举。将帮助示例转为实测结果时，必须同步替换 `schedulable`（例如 `executed`），不能仅修改 `status`、`ran` 和退出码；帮助中也说明此约束。
- Missing required tools must be `not-run` with `reason_code: "missing_dependency"` and non-empty `missing_tools`.
- Helpers do not install tools, rerun commands, infer exit codes, or promote dry-runs to passed.

Trust boundary:

记录器依赖 workflow 如实转录命令结果，不等于进程级监督。当前 helper 以 64 KiB 分块扫描完整日志，匹配已知 secret 模式即拒绝，无论输入自报的 `redaction_status` 是什么；读取失败或跨块候选超过检查预算也拒绝，不静默截断为仅检查前 64 KiB。该检查不保证识别所有敏感内容，调用方仍须在记录前脱敏。

Workflow-specific limits:

- `spec-work` records final checks only after simplify/review followup mutation has stopped; a pre-fix green result is not final closeout evidence.
- `spec-debug` distinguishes the original reproducer, regression test, and broader checks, and reruns affected checks after tail edits.
- `spec-code-review` records only targeted commands the review itself actually executed. Persona findings, validator judgments, cross-model agreement, and quoted source facts are review evidence, not command results.
