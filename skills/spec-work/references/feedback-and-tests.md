# Feedback And Tests

This reference is the owner of the feedback loop for `spec-work`. It is responsible for the smallest loop, vertical slice, proof/characterization, test discovery, scenario completeness, system-wide check, and replacement evidence when verification cannot be executed. It does not determine the product scope, nor does it turn TDD into a ritual for all tasks.

## Owned

- Choose the smallest observable feedback loop for behavior/CLI/browser/docs-schema/manual-only.
- Determine proof-first, characterization-first, existing-test ownership, and replacement evidence.
- Complement applicable scenarios, verify real cross-layer links, failure/orphan/interface consistency.
- Specify the not-run reason, claim ceiling, and retry boundary.

## Not Owned

- Change acceptance, public contract, architecture owner, task scope, or source/runtime ownership.
- Turn TDD into a fixed ritual for all tasks, or let scripts decide whether semantic coverage is sufficient.
- Run shipping closeout, write work run artifact, authorize commit/landing.

## Trigger

- Before the first behavior-bearing mutation;
- When the current unit's `Execution note` specifies a proof-first, characterization-first, smoke/runtime, or other verification direction;
- task review, simplify, or fix alters the original validation coverage, requiring re-selection or rerun of loop;
- The task requires determining observable evidence sufficient to support the completion of a declaration at the time of assertion.

## Fallback

Pure copywriting, changelog-only, behavior-unchanged, and already has a clear diff-shape check: no need to load full details; perform the narrowest known check and maintain the claim ceiling.

## Smallest Feedback Loop

Before changing behavior, first establish or attempt to observe the smallest loop that can capture the current slice. Priority is not a fixed tool list, but rather "minimal, authentic, reproducible, and capable of proving current risks":

- existing failing test or minimum new failing test;
- characterization test / baseline capture;
- CLI invocation, HTTP/API call, browser interaction, or runnable example;
- trace replay, throwaway harness, property/fuzz loop;
- docs contract, schema validation, help/render check, generated catalog diff, link/path check;
- clear steps, observable signals, and limitations of manual-only surface.

If no available loop exists, record `feedback_loop_not_possible` along with the missing conditions. Continue to allow only the narrowest replacement evidence, and clearly specify what it covers and what it does not cover; do not rephrase "cannot run" as passed.

## Vertical Slices

When behaviors are independent, complete one vertical slice at a time: implement it, run focused checks, and record the documentation or handoff evidence it needs before starting the next slice.

Do not first write all tests, then all implementations, on multiple independent units. This will delay feedback and expand the scope of failure diagnosis. Only when sharing a contract/schema must be established beforehand, or when the dependency graph requires a horizontal foundation, should the common underlying layer be completed first, and feedback be established at the earliest runnable point.

Docs-only, config-only, and generated-catalog tasks use the docs/schema/help/render/diff-shape loop; do not forcibly invent behavior tests.

## Slice Selection

- Default to a vertical slice: implement and verify one independently observable behavior and collect its handoff evidence together.
- A contract-first approach is chosen only when multiple consumers share the same input/output/error contract, and early runnable feedback is not available until the contract is stabilized; after contract stabilization, immediate transition occurs to the consumer's vertical slice.
- When the scenario of maximum loss, maximum uncertainty, or the most difficult-to-rollback assumption determines the subsequent direction, choose risk-first: validate it with the minimal proof/characterization to falsify it, rather than starting with low-risk cleanup.
- Rollback-friendly: Minimize the surface of concurrent behavior and state changes, preserve reversible seam, and ensure that failures before entering the next slice do not leave orphans, duplicate effects, or unpredictable intermediate states.

These three options are semantic judgments, not file type or keyword classifications. Do not build a long-term, generic framework using a contract-first approach, nor equate risk-first with first implementing the most complex solution.

## Proof / Characterization Strategy

Test discovery determines where evidence should be placed:

| Current situation | Action |
| --- | --- |
| Existing test has failed due to target behavior failure | Directly use this red evidence without adding redundant tests. |
| Existing test covers contract but asserts old/incorrect results | Modify or enhance the test to first observe expected failures, then alter the production code. |
| Existing test involves excessive mocking or fails to traverse the real chain | Narrowing and restructured test seam, first prove that real risks are visible. |
| No test coverage for the target behavior | Add a minimum focused failing test or characterization test. |
| The current task is not suitable for automated testing | Record no-test exception, cause, replacement verification, and coverage limitation before mutation. |

During proof-first approach, testing and implementation cannot be completed in the same step; a failure corresponding to the target root/behavior must first be observed. In characterization-first approach, the baseline is "current behavior is observed," not "current behavior is correct."

Do not copy tests to prove discipline. When a test already has the correct owner, it should be updated or strengthened, rather than parallelly adding a similar assertion.

## Test Design Quality

Tests must fail when boundary behavior errors are declared, and remain valid when pure implementation replacements are applied; if the expected value is directly computed by the tested code, or if mock/fixture provides production-level results for validation, or if only internal intercalls are asserted, such cases are insufficient to prove boundary behavior. Prefer verification, storage, or outbound results via real entry points; when real entry points are active, no additional production export, flag, wrapper, or hook should be introduced for testing purposes. Narrow test cases with explicit seam contracts are still reported based on their actual coverage scope, and not all internal assertions are considered invalid.

- Tests should adhere to DAMP (descriptive and meaningful phrases): names, setup, and assertions should directly express behavior and business states, allowing minimal repetition for readability, and avoiding overly complex helper functions that obscure intent.
- Default verification of state over interaction: prioritize asserting observable return values, state transitions, persistence results, events, or errors observable to the caller. Only when the interaction itself constitutes the contract (e.g., the protocol must be invoked exactly once, the order of invocations is observable, or a specific sink is prohibited) should the number of calls or call order be considered the primary proof.
- The test double selection order is `real implementation -> high-fidelity fake -> stub -> mock`. The later you get, the more you need to explain why a more realistic seam is unavailable, and how this double still allows current risks to be observed.
- No observed RED means no TDD-history claim. In the final diff, the presence of both implementation and green testing only proves that the current test passes; only observing a failure matching the expected behavior in run-local evidence prior to a production change can establish a RED/TDD history.
- A fake/mock that bypasses serialization, middleware, callback, permission, retry, or error translation cannot serve as valid proof of end-to-end integration; a minimal, real-world object or integration check must be provided.

## Risk-Triggered Proof Strength

Only select the following proof when a stronger counterexample is required for named failure mode, invariant, or load-bearing acceptance; do not make them a fixed tier for all tasks:

- Clearly distinguish `source mutation` / `behavior-bearing mutation` from `mutation testing` / `mutant`. The former grants authorization for file or behavior modifications, while the latter injects controlled plausible faults to validate test sensitivity; bare `mutation` writing is not permitted.
- Mutation testing must be bound to a real canonical command identity or a reproducible bounded runner, and must record killed, survivor, error, and equivalent mutants. Survivor cannot be considered killed under silent conditions; equivalent mutants must provide semantic justification; runner errors, no tests collected, or mutants not actually injected cannot count as valid mutation evidence.
- Changed-line coverage indicates only that target lines were executed; it does not necessarily prove behavior. Coverage percentage cannot support behavior-verified claims in the absence of meaningful assertions, state results, error results, or real cross-layer proofs.
- Pre-existing baseline must separate existing failures from task-introduced failures. Allows honest recording of previous failures and zero-new-failure boundaries, but does not claim full green status, nor requires fixing unrelated failures.
- Anti-gaming / false-green verification requires constructing specific paths where "real behavior remains incorrect but the guard turns green", for example: vacuous assertions, excessive mocking, incorrect working directory, failure to execute a real mutant, or only checking proxy output. The validation mechanism can't verify the claim.
- Proof intent retains an unbound limitation when not linked to a real command/provider; synthetic checks are not generated. Records are marked as `not-run` or `missing_dependency` only when binding exists but the tool is missing.

## Test Discovery

Before modifying the implementation file:

1. Start with the test files and scenarios declared in the plan/task;
2. Search for existing tests corresponding to import/reference/naming;
3. Reverse-lookup by assertion target: search within the test directory for files touched in the current test (e.g., `rg -l "<touched-path>" tests/`), identifying repository contract tests that assert on these files via path or byte-level assertions—governance, byte-budget, ordering, and projection contracts typically do not import the target files, so import or naming-based searches may fail to detect them; test suites that match are included in the current check selection.
4. Find integration/contract/smoke tests on cross-layer links;
5. Should old tests be updated or deleted when confirming deletion or change of behavior?
6. Expand search only when current source is insufficient; do not conduct unbounded archaeology for the sake of completeness.

## Scenario Completeness

For feature-bearing units, supplement only with applicable categories, not by padding to meet scene quantity:

| Category | When is it applicable? | From where is it derived? |
| --- | --- | --- |
| happy path | All feature-bearing unit | Goal, Approach, Actual input/output contract. |
| edge/boundary | input, state, concurrency, pagination, ordering, or lifecycle boundaries | boundary values, empty/nil, repetition/concurrency, state transitions |
| error/failure | has validation, authorization, external calls, I/O, retry/fallback | invalid input, deny path, downstream failure, timeout, partial failure. |
| integration | Cross callback/middleware/service/provider/source-runtime seam | True end-to-end call chains, avoiding mocking all interacting layers. |

When plan scenarios are overly generalized, supplement them with source/contract information from the current unit; if such supplementation alters acceptance or the public contract, halt and return the plan/task owner—no new WHAT is to be invented during the work phase.

## System-Wide Check

Before unit closeout, respond with actual code:

- What callbacks, middlewares, observers, event handlers, or generated consumers are triggered during this behavior runtime?
- Tested whether a real interaction chain was followed, or only proved an isolated mock?
- Will failure/timeout/rollback leave behind orphaned DB rows, cache entries, files, locks, runtime artifacts, or cause duplicate retries?
- Are there any alternate interfaces (CLI/API/DSL/agent/chat/mobile/web) that require parity?
- Can multi-layer retry/rescue/fallback lead to double execution, missed errors, or altered error types?

When it is a leaf node and has no callback/state/parallel interface, this check can quickly determine "inapplicable". Do not add integration tests merely because a chapter exists.

## Verification By Surface

| Surface | Priority feedback | Complete the boundary declaration |
| --- | --- | --- |
| behavior/library | focused unit/contract + necessary integration | Only true execution and coverage of the target path can be considered passed. |
| CLI | commands, exit code, stdout/stderr contract, help/smoke | The command examples in the document do not imply that they have been executed. |
| browser/UI | runnable route, critical state, desktop/mobile, console/a11y signal | Without a browser, only code-level/bounded coverage can be declared. |
| docs/schema/config | parser/schema/render/help/link/diff-shape | No requirement for fake TDD, but requires observable artifact check. |
| manual-only/external | clear steps, observable signal, owner, limitation | Must not claim automated coverage. |

## Not-Run And Replacement Evidence

- dry-run / schedulable but not executed -> `not-run` + `schedulable`;
- missing tool -> `not-run` + `missing_dependency` + `missing_tools`;
- unavailable environment/data/credential -> record specific reason, do not use vague "environment issue";
- replacement evidence must specify proof surface, source/log/artifact reference, and limitations;
- If required verification cannot run and no adequate replacement evidence exists, the unit is incomplete. Missing optional evidence limits only the corresponding claim.

Fallback is the tightest known verification, not zero-knowledge verification. Returns a bounded conclusion when system-wide coverage cannot be verified, without claiming full coverage.

## Ownership Boundary

Scripts can record commands, exit code, paths, hash, schema results, and reason_code; the LLM determines which checks and scenarios are semantically sufficient, and whether replacement evidence is adequate to support the current claim. Do not let scripts replace test design, nor let natural language assertions pretend to be script facts.

## Preserve proof through cleanup

Before a simplify pass, carry the proof set in the existing verification evidence: originating unit/task, exact test paths (new, changed and used unchanged), test-only seams/fixtures they depend on, and the real command/log refs. Record the current file bytes or tool-computed hashes before cleanup and compare after it. Earlier RED/characterization observations remain historical evidence; do not recreate them from the final diff. Missing or stale bindings remain explicit limitations.

Pass each proof test as `proof-test:<path>` or in equivalent structured context, separately from the allowed mutation paths. Preserve the tests and their test-only seams throughout cleanup while permitting equivalent production refactors. If proof ownership is unclear, preserve every test added/changed by this work. If a test itself needs a legitimate repair, return to the implementation owner, explain the evidence change and rerun the original symptom; do not silently weaken it inside Simplify.

After cleanup/review mutations, the caller reruns the original reproducer, protected proof tests and all applicable final checks against the current tree. A callee's local green result does not replace final-tree reconciliation. External/manual done signals retain their original observed-state requirements; a Git diff cannot replace them.
