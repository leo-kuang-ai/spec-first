# Verification Run Summary Contract

`verification-run-summary.v1` records structured verification results for a single workflow run. It is the shared per-check result surface consumed by `spec-work`, `spec-debug`, and `spec-code-review` closeout.

Callers select the owning scope with `verification-run-summary record --workflow spec-work|spec-debug|spec-code-review`. The selected workflow determines the repo-local root under `.spec-first/workflows/<workflow>/<workspace-slug>/<run-id>/`; it does not transfer artifact ownership between workflows. `spec-work` may later reference its own summary from a conditional `spec-work-run-artifact/v2`. `spec-debug` and `spec-code-review` return their summary ref and honest-closeout verdict only; they do not write that work artifact.

Canonical fields are defined by `docs/contracts/verification/verification-run-summary.schema.json`:

- `profile`: the profile source, active profile name, and source path.
- `checks[]`: `id`, `service`, `command`, `status`, `exit_code`, `ran`, `required_tools`, `missing_tools`, `log_path`, `reason_code`, and `redaction_status`.

Status boundaries:

- `passed`: `ran=true`, `exit_code=0`, and a repo-relative redacted log ref exists.
- `failed`: `ran=true`, non-zero `exit_code`, and a repo-relative redacted log ref exists.
- `not-run`: `ran=false`, `exit_code=null`, and a concrete `reason_code`.
- `degraded`: evidence exists but is not strong enough for verified closeout.

Red-line mappings:

- Dry-run or schedulable-but-not-executed checks must be `not-run` with `reason_code: "schedulable"`.
- Missing required tools must be `not-run` with `reason_code: "missing_dependency"` and non-empty `missing_tools`.
- Helpers do not install tools, rerun commands, infer exit codes, or promote dry-runs to passed.

Trust boundary:

The capture helper is a thin recorder. Its trust level is "workflow step transcribed the real command result"; it is weaker than process-level supervision. The helper scans bounded log content (first 64 KB) for obvious secret-like text and rejects the record when it matches, regardless of the check's self-reported `redaction_status` — a `redacted` claim is verified, not trusted. Because the scan is bounded, callers remain responsible for writing redacted logs before recording the summary; the helper does not deep-scan full large logs.

Workflow-specific limits:

- `spec-work` records final checks only after simplify/review followup mutation has stopped; a pre-fix green result is not final closeout evidence.
- `spec-debug` distinguishes the original reproducer, regression test, and broader checks, and reruns affected checks after tail edits.
- `spec-code-review` records only targeted commands the review itself actually executed. Persona findings, validator judgments, cross-model agreement, and quoted source facts are review evidence, not command results.
