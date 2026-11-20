# Runtime Setup Maintainer Evals

This directory is source-only maintainer evidence and is intentionally excluded from generated host runtime packages.

- `examples.json` provides examples-as-context for editing, reviewing, or fresh-source evaluation of setup posture.
- These examples are not a deterministic router, runtime-readiness gate, or substitute for LLM judgment during ordinary setup runs.

- In `eval.yaml`, use `--check` for `check-readonly` to verify that fixed files and host configuration sentinels, as well as setup facts, have not been modified; `--verify-only` allows writing of setup-owned facts but cannot pretend to enforce strict read-only behavior. Local positive and negative calibration for Judge is available in `tests/unit/runtime-setup-eval-judge.test.js`; models not running, user-level configurations/installations/transient side effects are outside the scope of this validation.
- `bare-invocation-fail-closed-on-unverified-surface` requires the engine to exit with code `2` and include `blocked`, `reason_code`, and `host-invocation-surface-unverified` in the final output; the Judge also verifies that setup facts, readiness ledger, host config, and symlink sentinel are not present. This case only proves surface-level security denial on a non-actual host and does not prove successful installation on an actual host, provider availability, or on-site benefit.

## Evidence Boundaries for Semantic Boundary Cases

The `semantic-question-not-setup` script only checks mechanical boundaries. exit 0 indicates `mechanical-boundary-only: semantic-review-required`, and this alone cannot be considered a pass for the semantic use case as a whole. Independent review should examine the complete response and trajectory to determine whether the setup responsibilities are correctly described and appropriate ownership is assigned, whether architectural analysis is performed without authorization, and whether skill loading or model generation parameters are treated as authorization. The semantic conclusion must be documented by the reviewer and should not be replaced with keywords.

The runner must provide the `EVAL_TRANSCRIPT_PATH`, containing a standard event array, for example:

```json
[{"role":"tool_call","tool_call":{"name":"Read","arguments":{"file_path":"SKILL.md"}}},{"role":"assistant","content":"职责说明及移交"}]
```

Missing, empty, or unknown format trajectories are not accepted. Only explicitly listed read tools and target Skill loads are permitted; shell, write, dispatch, and unknown tools are conservatively rejected and require manual verification—automatic rejection cannot be attributed to product behavior failure. Scripts do not parse any shell commands and do not guarantee that the runner has fully recorded all events. File hashes and configuration sentinels only cover fixed fixtures; they do not prove global zero side effects, true host security, or true model behavior.
