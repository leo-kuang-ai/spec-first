---
title: Safe Order Import Retries - Plan
type: feat
date: 2026-07-31
artifact_contract: spec-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: spec-brainstorm
execution: code
status: active
---

# Safe Order Import Retries - Plan

## Goal Capsule

Enable operators to recover from transient order-import failures without manually restarting the batch.

Extend the existing importer with bounded, caller-owned retries. Preserve validation failure behavior and the CLI output contract. Carry forward the fixture owner’s decision to keep import execution in the caller’s lifecycle rather than introduce a background queue.

**Readiness:** This enriched planning checkpoint is not implementation-ready. The supplied fixture establishes where retries belong, but does not establish the client’s error classification, whether retrying an ambiguous failure can duplicate orders, or the CLI boundary needed to verify R3. These are concrete evidence gaps, not evidence that the settled approach is infeasible.

**Delivery:** Complete Markdown draft returned in chat for the parent to save. No filesystem mutation, implementation, tests, external requests, or delegation occurred.

**Target:** The supplied `order-import-enrichment-fixture`. All paths below are relative to that fixture root.

---

<!-- PRODUCT_CONTRACT_START -->
## Product Contract

### Problem Frame

批量订单导入在一次临时网络错误后整体失败，运营人员只能手工重跑整批任务。

### Requirements

- **R1:** 临时网络错误最多重试 3 次。
- **R2:** 校验错误必须立即失败，不得重试。
- **R3:** 保持现有 CLI 成功与失败输出兼容。

### Actors

- **A1:** 运行批量导入的运营人员。

### Key Flows

- **F1:** 运营人员提交有效订单；首次请求遇到临时网络错误；系统重试并成功返回。

### Acceptance Examples

- **AE1:** 给定前两次请求返回临时网络错误，第三次成功时，导入成功且总调用次数为 3。
- **AE2:** 给定输入校验失败时，导入立即失败且只调用一次。

### Scope Boundaries

- 不引入持久化队列或后台任务系统。
- 不改变 CLI 输出字段。
<!-- PRODUCT_CONTRACT_END -->

---

## Planning Contract

Product Contract unchanged (byte-preserved upstream source slice).

The delimited Product Contract above is reproduced from the supplied source without intentional changes. No saved-artifact byte comparison has been executed; persistence and verification of the saved slice remain with the parent.

### Summary

The smallest suitable change is a focused extension of `src/order-importer.js`, supported by behavioral coverage in `tests/order-importer.test.js`. Preserve `importOrders` as the owner of import orchestration and `client.send` as the owner of transport and downstream behavior.

The request is a requirements-only enrichment, not an implementation-ready plan deepening. Planning findings below remain outside the Product Contract. Implementation Units and an execution handoff are withheld while the blocking contract questions remain unresolved.

### Key Technical Decisions

- **KTD1 — Keep retries within the caller-owned import operation.** Carry forward KD-1 from `research-return.md`: a background queue was rejected because persistent scheduling is outside this small retry change. This is a supplied synthetic fixture-owner decision, not a new user decision or independent approval obtained during this trial. “Synchronous import” means no detached background job; the existing test already awaits an asynchronous client result. The source does not justify replacing asynchronous I/O with blocking I/O.

- **KTD2 — Extend the current owner.** Architecture posture: `extend`. Add retry control to `src/order-importer.js`; use the existing CommonJS export and Node test structure. A separate retry service, queue, wrapper framework, or durable retry-state store would introduce unnecessary ownership for this scope.

- **KTD3 — Interpret R1 as three retries after the initial attempt.** The maximum is four total calls. AE1 remains three total calls because its third attempt succeeds. Count the retry budget locally for each import invocation; stop immediately after success or a terminal failure.

- **KTD4 — Preserve observable outcomes.** Return the successful client result without adding a result envelope. Propagate the terminal error without replacing its message, code, or identity. Do not add importer logging that could change CLI output. Preserving these values is necessary for R3 but does not prove CLI compatibility.

- **KTD5 — Classify from a real error contract.** Retry only failures positively identified as temporary network failures by the client’s authoritative contract. Validation errors take precedence and terminate immediately. Unrecognized failures must not become retryable through message matching or a broad catch-all. The supplied source does not establish error codes, classes, or flags; choosing their concrete representation remains blocked on B1.

- **KTD6 — Establish replay safety before enabling retries.** A network error can occur after the remote service accepts an order. Reusing the same rows does not itself prevent duplicate writes. Use an existing idempotency guarantee or a documented failure category that guarantees no commit occurred. Do not invent a new server-side deduplication system inside this importer. B2 owns the missing evidence.

### Interface Contracts

The existing interface is the CommonJS `importOrders` export in `src/order-importer.js`. The directly observed consumer is `tests/order-importer.test.js`; a CLI consumer is required by R3 but is not supplied.

The intended change evolves failure handling without changing input rows, successful result values, terminal error content, or CLI fields. Keep calls sequential and preserve the client receiver when invoking `send`.

The current implementation directly returns `client.send(rows)`. It therefore permits synchronous return values, synchronous throws, and promise returns according to the injected client. The supplied test only exercises an asynchronous client. B1 must establish the supported consumer contract before an implementation silently converts all outcomes to promises.

`tests/order-importer.test.js` will own importer-level executable coverage. A CLI compatibility test needs the actual CLI source and its baseline; its path cannot be named from the supplied fixture.

### Evidence and Research Reconciliation

- `src/order-importer.js` contains a single forwarding call and no retry loop. Direct inspection confirms concern C-1.
- `tests/order-importer.test.js` checks that a successful asynchronous client returns the supplied rows. It does not cover transient failures, validation failures, retry exhaustion, replay safety, or CLI output.
- `research-return.md` attributes its findings to the parent’s source inspection. No independent research worker or external research was used, and that return reports no test execution.
- KD-1 is compatible with the observed source. C-1 identifies missing behavior within the settled approach; it does not invalidate that approach.
- `package.json` declares `npm test` as `node --test tests/*.test.js`. This identifies an available verification command, not a successful test result.
- `AGENTS.md` establishes CommonJS, Node tests, and planning-only ownership of `docs/plans/`. The current trial further prohibits all writes.
- Git identity, dirty state, client implementation, downstream service behavior, and CLI source were not inspected. Conclusions apply to the supplied fixture contents only.
- Delegation was prohibited: `dispatch_authorization_missing`. No worker capability discovery or worker invocation occurred. External research was prohibited and did not run.

### Implementation Scope Boundaries

Keep the existing importer and test ownership. Do not introduce persistence, background execution, new CLI fields, or unrelated input validation.

Do not treat mocked retries as evidence of production replay safety. Do not add an error-code allowlist, retry delay schedule, or idempotency parameter under the claim that it already exists in this repository.

Backoff timing and local helper names are technical details that can be finalized after the client contract is available. A backoff delay must not be presented as a solution to duplicate writes.

---

## Resolve Before Implementation

### B1. Client Error and Invocation Contract — Blocking

**Gap:** No supplied source defines how temporary network errors differ from validation errors, or whether supported consumers require synchronous return/throw behavior.

**Owner:** Fixture/client contract owner, mediated by the parent.

**Required evidence:** The supported `client.send` return contract and representative temporary-network, validation, and permanent failure shapes. Establish whether the client already retries internally so the importer budget does not accidentally multiply transport attempts.

**Unblock condition:** A concrete, source-backed classification rule and compatibility decision can be stated without inventing a new external contract.

### B2. Safe Replay Boundary — Blocking

**Gap:** The fixture does not establish whether a failed request can have committed orders before its response is lost.

**Owner:** Client/service contract owner.

**Required evidence:** Existing idempotency behavior or a reliable distinction between pre-commit failures and ambiguous outcomes. If neither exists, the Product Contract owner must decide the permitted behavior and scope.

**Unblock condition:** Retrying the intended error category has a defined duplicate-write safety basis. Changing product behavior requires an upstream Product Contract update; this planner cannot silently rewrite the preserved region.

### B3. CLI Compatibility Evidence — Blocking for R3

**Gap:** No CLI implementation, output baseline, or CLI test is supplied.

**Owner:** CLI owner or parent supplying the relevant fixture evidence.

**Required evidence:** The actual CLI call site, successful and failing output expectations, exit behavior, and test location.

**Unblock condition:** A verification target can demonstrate R3 directly. Importer return-value tests alone cannot close this requirement.

These blockers preserve the current readiness. No questions are issued during this read-only trial.

---

## Verification Design

The following are verification intents for the completed plan, not executed results or an implementation handoff.

| Intent | Requirement | Required evidence | Current state |
|---|---|---|---|
| Successful forwarding remains compatible | R3 | Existing importer test plus result and input identity assertions | Not run |
| Two transient failures followed by success | R1, F1, AE1 | Three calls, sequential execution, original rows each time, successful result preserved | Not run; error shape depends on B1 |
| Retry boundary is exact | R1 | Success on call four is accepted; four transient failures stop after call four with no fifth call | Not run |
| Validation fails immediately | R2, AE2 | First-attempt validation failure makes one call and preserves the error | Not run; error shape depends on B1 |
| Validation after a transient failure stops retries | R1, R2 | Transient failure followed by validation failure makes exactly two calls | Not run |
| Permanent or unknown failure is terminal | R2 and failure compatibility | No retry and unchanged terminal error | Not run |
| Invocation state is isolated | R1 | Concurrent imports have independent retry budgets and no overlapping sends within either import | Not run |
| Client invocation semantics are preserved | R3 | Supported return/throw behavior and receiver-sensitive client behavior remain compatible | Blocked on B1 |
| Replay does not duplicate accepted orders | Safe retry boundary | Client/service-level evidence for response-loss or equivalent ambiguous outcomes | Blocked on B2 |
| CLI success and failure remain compatible | R3 | Actual stdout, stderr, output fields, and exit behavior checked against baseline | Blocked on B3 |

Use `tests/order-importer.test.js` for importer scenarios. Preserve the existing forwarding case. Add characterization coverage before changing the currently untested failure paths. Empty rows should continue to reach the client unchanged; this feature does not authorize new importer validation.

After implementation is separately authorized and blockers are resolved, `npm test` is the supplied fixture’s test command. Record the actual exit result and the source revision or equivalent identity. Neither a command declaration nor a future test specification is proof of execution.

The Product Contract is **inherited** from the supplied requirements artifact. This trial provides no independent product-owner confirmation. The largest unproven risk is duplicate order creation after an ambiguous transport failure.

Before claiming full completion, reconcile every required verification intent against actual evidence. Any unresolved required intent must remain an explicit limitation and prevent the corresponding completion claim.

---

## Recovery and Completion Boundary

The parent can retain this complete draft as a planning checkpoint while leaving the canonical input unchanged.

Once B1–B3 are resolved, finish the Planning Contract, add dependency-ordered Implementation Units with concrete implementation and test paths, and add the executable Verification Contract and Definition of Done. Promote readiness only when those sections are complete and no load-bearing blocker remains.

The eventual implementation completion criteria must include the retry boundary, immediate validation failure, outcome compatibility, direct CLI proof, replay safety, and removal of abandoned experimental changes. No commit, publication, or implementation authorization is implied by this draft.

---

## Review and Limitations

One bounded producer self-review checked requirement preservation, decision attribution, research reconciliation, source ownership, verification coverage, and readiness honesty. It identified the missing client, replay-safety, and CLI evidence as unresolved blockers.

- `review_source: producer-self-review`
- `review_status: degraded`
- `reason_code: spec_doc_review_capability_unavailable`
- `independent_review: not_run`
- `mutation_policy: report-only`
- `fixes_applied: 0`
- Independent reviewer findings and coverage: unknown.

Independent review was not invoked because the trial prohibits delegation and downstream invocation. No saved file, deterministic byte comparison, implementation test, build, or runtime verification was produced. This is an enriched checkpoint, not a completed implementation-ready plan or an A/B acceptance judgment.

---

## Sources

- `docs/plans/2026-07-31-001-feat-order-import-plan.md`
- `src/order-importer.js`
- `tests/order-importer.test.js`
- `research-return.md`
- `package.json`
- `AGENTS.md`
