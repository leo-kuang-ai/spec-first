# Runtime Setup Maintainer Evals

This directory is source-only maintainer evidence and is intentionally excluded from generated host runtime packages.

- `examples.json` provides examples-as-context for editing, reviewing, or fresh-source evaluation of setup posture.
- These examples are not a deterministic router, runtime-readiness gate, or substitute for LLM judgment during ordinary setup runs.

- In `eval.yaml`, use `--check` for `check-readonly` to verify that fixed files and host configuration sentinels, as well as setup facts, have not been modified; `--verify-only` allows writing of setup-owned facts but cannot pretend to enforce strict read-only behavior. Local positive and negative calibration for Judge is available in `tests/unit/runtime-setup-eval-judge.test.js`; models not running, user-level configurations/installations/transient side effects are outside the scope of this validation.
- `check-readonly` requires a direct `--check --json` call from the fixture, a tool result with the same call ID, and a diagnostic for that project root. A summary or unchanged files alone are insufficient. Use read tools for path discovery; other Bash command forms need separate review.
- `bare-invocation-fail-closed-on-unverified-surface` checks the denial in the tool result, the final response, and fixed sentinels. Exit code `2` belongs to the setup CLI, not the session. When the runner omits the tool exit code, do not claim it was observed. This case does not verify an installation or rule out side effects beyond the sentinels.

## Evidence Boundaries for Semantic Boundary Cases

The `semantic-question-not-setup` script only checks mechanical boundaries. exit 0 indicates `mechanical-boundary-only: semantic-review-required`, and this alone cannot be considered a pass for the semantic use case as a whole. Independent review should examine the complete response and trajectory to determine whether the setup responsibilities are correctly described and appropriate ownership is assigned, whether architectural analysis is performed without authorization, and whether skill loading or model generation parameters are treated as authorization. The semantic conclusion must be documented by the reviewer and should not be replaced with keywords.

The runner must provide the `EVAL_TRANSCRIPT_PATH`, containing a standard event array, for example:

```json
[{"role":"tool_call","tool_call":{"name":"Read","arguments":{"file_path":"SKILL.md"}}},{"role":"assistant","content":"Runtime Setup checks tool readiness. Route the architecture question to code review."}]
```

The semantic case requires a nonempty normalized trace. It permits the listed read tools, loading the target skill without arguments, and a limited set of Bash command forms. It does not authorize shell commands. Unsupported traces, writes, or dispatches need separate review. Fixed sentinels cannot detect transient writes, changes elsewhere, or events the runner omitted.
