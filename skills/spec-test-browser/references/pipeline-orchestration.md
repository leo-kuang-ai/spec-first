# Pipeline-Mode Browser Orchestration

Read when `spec-lfg` or another automated caller invokes `spec-test-browser` with `mode:pipeline`. Unattended execution grants no project mutation, project-command, or browser-effect authority.

## Exact Origin And Caller-Owned Server

- Applicable browser verification requires one explicit exact loopback `target-origin:<origin>`. Missing input returns `not_run` / `target-origin-missing`; invalid input returns `not_run` / `target-origin-invalid`.
- Do not read runtime profiles, derive an origin from package scripts/cwd/env, scan ports, rewrite origins, or start servers. The caller-owned server remains caller-owned before and after testing; the wrapper never signals, stops, or cleans it up.
- Invoke `node "$SKILL_DIR/scripts/agent-browser-run-context.cjs" probe` first. The probe runs an independent controlled conformance producer for the current binary identity, without external receipts. Proceed only with `execution_readiness: ready`, `conformance_status: passed`, and `capabilities.exact_origin_confirmed: true`. Missing flags, help-only evidence, provider/caller claims, unbound identity, producer errors/timeouts/malformed output, failed positive controls, or any failed negative case return `not_supported` with zero navigation/interaction subprocesses. Static/provider evidence is not conformance; a capability probe is not this run's browser field outcome.

## Effect Gate And Browser Execution

- Do not pause for headed/headless selection, human verification, or a failure-handling prompt. Record human OAuth/email/payment/SMS flows as `Skip` with a limitation.
- Missing authority for deletion, publication, sending, purchases, permission changes, or other durable/external effects returns `not_run` / `browser-mutation-authorization-required` before writing the step. This includes effects triggered by `open` or keyboard actions. Effect classification is a workflow-level semantic gate; the wrapper does not infer business effects from action strings.
- Execute prepare/run/cleanup only through the unique wrapper. The first `open` supplies availability evidence; no page-context action precedes it or runs after its failure.
- Wrapper or browser-cleanup `not_supported`, `not_run`, `failed`, missing, or indeterminate outcomes block the applicable flow. Passed routes/steps cannot hide cleanup failure or convert the flow into `not_applicable`. Preserve unexecuted routes as Skip with reasons rather than dropping them.

## Claim Ceiling

Report target-origin provenance, wrapper probe/capability, every route/step result, `action_process_calls`, browser cleanup, private evidence refs, and limitations per `references/route-and-report.md`. A preflight stop still reports its blocker and how to clear it. Evidence supports only observations at the caller-authorized exact origin, not server branch identity or spec-first server startup/cleanup.
