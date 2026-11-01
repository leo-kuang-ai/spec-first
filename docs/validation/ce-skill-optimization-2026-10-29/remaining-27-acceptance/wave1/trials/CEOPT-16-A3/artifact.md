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

Enable operators to recover from temporary network failures without rerunning an entire order import manually.

Extend the existing caller-owned importer with bounded, sequential retries. Preserve the supplied Product Contract and the fixture decision to avoid background scheduling.

This is a planning checkpoint, not an executable implementation handoff. The supplied fixture does not establish the client’s error classification or replay-safety contract. Those missing contracts affect which requests can safely be repeated. Implementation-ready promotion remains blocked until the client owner supplies that evidence.

The target is the supplied `order-import-enrichment-fixture`. All source paths below are relative to that fixture root. This Markdown is returned in chat for the parent to save; no file was written or changed.

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

Product Contract unchanged (byte-preserved upstream source slice)

The marked region above is reproduced from the supplied source. A deterministic comparison of the parent-saved response has not been performed.

### Key Technical Decisions

- KTD1. **Extend the current importer.** `src/order-importer.js` owns the public import operation and currently delegates directly to `client.send(rows)`. Add retry coordination there rather than introducing a second importer, queue, scheduler, or reusable retry framework. The client remains authoritative for transport behavior and error meaning. Governs R1–R3.

- KTD2. **Carry forward caller-owned execution.** Preserve KD-1 from `research-return.md`: synchronous import was chosen over a background queue because persistent scheduling is outside this change. This is an attributed synthetic fixture-owner decision, not a new project-owner approval or a live user-settlement annotation. The existing test awaits an asynchronous client; “synchronous import” therefore means completion within the caller’s operation, not blocking JavaScript or prohibiting promises. Governs R1, F1, and the preserved scope boundaries.

- KTD3. **Count retries separately from attempts.** Interpret R1 as one initial attempt plus at most three retries, for a maximum of four calls. Stop immediately on success. AE1 exercises success on the third call and is consistent with this bound; it does not reduce the maximum to three total attempts.

- KTD4. **Preserve terminal values.** Forward the original rows without rewriting them. Return the successful client result without adding fields. Propagate a terminal client error without wrapping it or changing its message, code, or other output-relevant properties. Do not emit retry progress to standard output or standard error. These choices support R3 but cannot prove CLI compatibility without the CLI consumer.

- KTD5. **Classify before repeating.** Validation failures take precedence over any transient classification and terminate immediately. Unknown errors also terminate rather than being treated as temporary by default. The specific client error codes or discriminants remain unresolved; no supplied source supports inventing an allowlist or a new `retryable` property.

- KTD6. **Keep attempts sequential and local.** An attempt must settle before another begins. Retry counters belong to each import invocation, with no shared mutable budget. A bounded retry count does not establish a timeout or latency guarantee; no timer, backoff schedule, cancellation API, or deadline is confirmed by the supplied material.

### Interface Contracts

The existing interface is the CommonJS export in `src/order-importer.js`. The supplied consumer is `tests/order-importer.test.js`; the CLI named by R3 is not supplied.

The current function passes rows to the provided client and returns its result directly. That supports synchronous return values, synchronous throws, and promises by delegation. The single existing test establishes only an awaited asynchronous happy path. An implementation must not silently make all calls asynchronous without confirming that this is compatible with actual consumers.

The planned change is intended to preserve the exported entry point, input representation, success value, and terminal error representation. Compatibility remains unverified at the client and CLI boundaries. `tests/order-importer.test.js` is the existing executable contract location; no separate schema or interface framework is warranted.

### Evidence and Research Reconciliation

C-1 in `research-return.md` is confirmed by direct source inspection:

- `src/order-importer.js` contains one direct `client.send(rows)` call and no retry loop.
- `tests/order-importer.test.js` contains one test that checks successful row forwarding.
- `package.json` uses Node’s built-in test runner.

C-1 therefore changes the required work in two ways: the importer needs retry coordination, and verification must cover failure classification, exhaustion, and terminal outcomes. The forwarding test alone cannot establish R1, R2, or R3.

The research return attributes its observations to parent source inspection. No independent research worker or external research was used. This run independently read the supplied source but did not execute it.

The source identity is the supplied fixture as read on 2026-10-30. Git revision, dirty state, real client implementation, deployed behavior, and CLI implementation were not established within the authorized read scope. These limits prevent claims of production safety or full CLI compatibility.

### Blocking Questions and Recovery Evidence

| ID | Missing evidence | Why it matters | Owner and unblock condition |
|---|---|---|---|
| B1 | Client error classification | R1 and R2 require a reliable distinction between transient network errors and validation failures. | Client owner supplies the error contract and representative errors, including validation precedence and unknown-error behavior. |
| B2 | Replay safety after ambiguous failure | A request may commit orders before its response is lost; repeating it can duplicate imports. | Client/service owner demonstrates deduplication, idempotent import behavior, or a reliable pre-commit failure boundary for every retried error class. |
| B3 | Real consumer compatibility | The fixture does not establish CLI output or whether synchronous return/throw behavior is consumed. | Importer/CLI owner supplies the consumer and compatibility baseline, or explicitly bounds the deliverable to the synthetic fixture. |

B1 and B2 are load-bearing architecture and safety gaps. They are not resolved by marking assumptions as accepted. B3 prevents a complete R3 acceptance claim.

The minimal recovery path is a caller-supplied client contract covering B1–B2 plus the consumer evidence for B3. If replay safety requires changing product scope, the Product Contract owner must resolve that change through the owning requirements workflow. The preserved Product Contract must not be edited by the planner.

### Implementation Scope Boundaries

The prospective source change belongs in `src/order-importer.js`, with behavioral coverage in `tests/order-importer.test.js`. Preserve the existing CommonJS and `node:test` conventions.

Do not introduce persistent scheduling, an alternative transport, new CLI fields, a generic retry subsystem, or a second source of error-classification truth. Do not add idempotency infrastructure merely to make this plan appear unblocked.

Implementation Units and an execution handoff are intentionally withheld while the load-bearing contracts remain unresolved.

---

## Proposed Verification Evidence

These are acceptance evidence requirements for completing the plan and subsequent implementation. They are not executed tests or an implementation authorization.

| Proof intent | Required scenario and observable result | Trace |
|---|---|---|
| Initial success | A successful first call returns the client result unchanged and makes exactly one call. | R3 |
| Transient recovery | Two client-confirmed temporary failures followed by success produce exactly three calls and return the successful result. | R1, F1, AE1 |
| Retry ceiling | Four consecutive eligible temporary failures stop after four total calls and propagate the fourth error unchanged. No fifth call occurs. | R1, R3 |
| Last permitted success | Three eligible temporary failures followed by success return successfully on the fourth call. | R1 |
| Validation failure | A client validation failure terminates after one call and preserves the original error. | R2, AE2 |
| Mixed failure sequence | An eligible transient failure followed by a validation failure stops after the second call. | R1, R2 |
| Unknown failure | An unclassified error is propagated after one call. | KTD5 |
| Validation precedence | An error carrying conflicting classification signals is not retried when it represents validation failure. | R2, KTD5 |
| Per-call isolation | Concurrent imports maintain separate budgets; no invocation has overlapping attempts. | KTD6 |
| Argument preservation | Every attempt receives the original rows, including an empty array; the importer introduces no new validation policy. | KTD4 |
| Return and throw compatibility | Characterize and preserve supported synchronous return, synchronous throw, and asynchronous rejection behavior against actual consumers. | R3, B3 |
| CLI compatibility | Compare success and terminal-failure output fields, messages, exit behavior, and streams against the actual CLI baseline. Retries add no output. | R3, B3 |
| Replay safety | Simulate a committed request whose response is lost and demonstrate no duplicate orders, or prove that such failures cannot enter the retry class. | B2 |

The fixture’s declared verification entry is `npm test`, which invokes `node --test tests/*.test.js`. It was not run.

Mock-based importer tests can establish orchestration and error propagation. They cannot establish real service deduplication or CLI output compatibility. Those claims require source-bound integration evidence from the respective owners.

Before claiming completion, reconcile every required proof intent with an actual result or an explicit unresolved limitation. A green fixture test suite alone cannot close B2 or B3.

---

## Review and Delivery Status

The confidence check identified missing client classification, replay-safety, and consumer contracts. The draft retains `artifact_readiness: requirements-only`; it does not claim implementation readiness.

A bounded producer self-review checked requirement preservation, retry-count interpretation, KD-1 provenance, C-1 reconciliation, source ownership, and verification coverage. Independent document review was not run because this trial prohibits delegation and downstream model invocation.

- Review source: `producer-self-review`
- Review status: `degraded`
- Mutation policy: `report-only`
- Independent review: `not_run`
- Reason code: `spec_doc_review_capability_unavailable`
- Filesystem fixes applied: `0`
- Independent-review finding counts: unknown
- Tests, builds, external requests, and runtime probes: not run
- Canonical source artifact: unchanged
- Parent-saved artifact path: not yet supplied

This response completes the permitted read-only planning assessment. The requested actionable implementation-ready plan remains incomplete pending B1–B3.

---

## Sources

- `docs/plans/2026-07-31-001-feat-order-import-plan.md` — supplied requirements-only plan and preserved Product Contract.
- `src/order-importer.js` — current import boundary.
- `tests/order-importer.test.js` — existing forwarding coverage.
- `package.json` — declared test command.
- `research-return.md` — attributed C-1 observation and synthetic KD-1 decision.
- `AGENTS.md` — fixture source boundaries and coding conventions.
