---
title: Safe Order Import Retries - Plan
type: feat
date: 2026-10-30
artifact_contract: spec-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: spec-brainstorm
execution: code
status: active
---

# Safe Order Import Retries - Plan

## Goal Capsule

Enable operators to recover from temporary network failures without manually restarting an entire order import.

The recommended approach is a bounded, caller-owned retry loop in the existing importer. Preserve the supplied decision to keep imports in the caller’s execution flow, without a background queue.

This is a mediated planning checkpoint, not an executable implementation handoff. The supplied fixture establishes the extension point but does not define the client’s error taxonomy, replay safety, or CLI boundary. Those gaps prevent an evidence-grounded claim of implementation readiness.

The original plan remains unchanged on disk. This response is the complete returned draft; the parent owns saving it.

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

## Planning Checkpoint

The Product Contract above is reproduced unchanged from the supplied source slice. No deterministic comparison against a saved response was performed.

### Evidence and Research Reconciliation

The target is the supplied `order-import-enrichment-fixture`. Paths below are relative to its root.

- `src/order-importer.js` exports `importOrders` and directly returns `client.send(rows)`. It contains no retry loop, classifier, output formatting, or persistent state.
- `tests/order-importer.test.js` contains one test using an asynchronous client stub. It checks that the result equals the supplied rows. It does not assert call count, retry behavior, error propagation, or CLI output.
- `package.json` declares CommonJS-compatible source and the test command `node --test tests/*.test.js`.
- `research-return.md` attributes C-1 to parent source inspection. Direct reads confirm its reported implementation and coverage gaps. Neither that inspection nor this run executed tests.
- KD-1 is a supplied synthetic fixture-owner decision. It is carried forward within that scope and is not represented as a newly obtained project-owner approval.

No independent research worker, external research, runtime receipt, Git revision, or dirty-worktree inspection supports this draft. Repository history and production behavior remain unverified.

### Carried Decisions and Bounded Technical Direction

KTD1. **Extend the existing importer.** The architecture posture is `extend`: `src/order-importer.js` already owns the call to `client.send`. A retry library, new service, or parallel orchestration layer has no demonstrated need. Governs R1–R3.

KTD2. **Keep retries in the caller’s import operation.** Carry forward KD-1 from `research-return.md`; a background queue was rejected because persistent scheduling is outside this change. “Synchronous import” means caller-owned completion here, not blocking JavaScript: the existing test uses an asynchronous `send`. The supplied evidence does not authorize silently changing synchronous return or throw behavior for other consumers. Governs R1 and R3.

KTD3. **Distinguish retries from total attempts.** Interpret R1 as one initial call plus at most three additional calls, giving a maximum of four attempts. AE1 describes success on the third total call and is consistent with that ceiling. Stop immediately after success or a non-retryable failure.

KTD4. **Preserve the underlying result and terminal error.** The proposed importer should return the successful client result without adding an output envelope and propagate the terminal failure without replacing its fields or message. This supports R3 but cannot establish CLI compatibility without the actual CLI consumer.

KTD5. **Keep retry state local to each invocation.** A counter belongs to the individual import call. Attempts are sequential, use the original rows and client, and stop before the next send once the operation has terminated. This avoids shared retry budgets and overlapping sends.

These directions do not settle the missing client contract below and do not authorize implementation.

### Blocking Contract Gaps

| Gap | Source evidence | Required resolution | Owner |
| --- | --- | --- | --- |
| Temporary versus validation failure | Neither source nor tests defines error types, codes, or classification precedence. | Supply the client’s error contract and representative temporary, validation, and unknown failures. Define validation precedence if classifications overlap. Do not infer retryability from message text. | Client contract owner |
| Replay safety | `send` is opaque; the fixture does not reveal whether an unsuccessful response can follow committed orders. | Establish that eligible failures occur before effects, or show existing server/client idempotency that makes replay safe. If neither holds, return the required behavior decision to the Product Contract owner. | Client/service owner; Product Contract owner for scope changes |
| CLI compatibility | No CLI formatter, invocation, or output receipt was supplied. | Supply the CLI boundary and baseline success/failure examples, including exit behavior and any reliance on synchronous throws or direct return values. | CLI owner |

The largest unproven risk is duplicate order creation following an ambiguous failure. This is not a finding that duplicates currently occur. It is an unresolved consequence of retrying an opaque operation.

Readiness stays `requirements-only`. No Implementation Units or implementation handoff are issued while these load-bearing decisions remain unresolved.

### Implementation Scope Boundaries

The eventual change should remain within the existing importer and its focused tests unless the named owners supply evidence requiring another boundary.

**Considered and not built:**

- A persistent queue or background scheduler: rejected by KD-1 and the Product Contract.
- A generalized retry framework: one small importer does not establish a reusable abstraction need.
- A new deduplication store: no evidence establishes its ownership or necessity. Resolve replay safety before proposing a mechanism.
- Backoff, jitter, new timeout policy, retry configuration, or additional output fields: neither the Product Contract nor source establishes these requirements. Existing client timing remains relevant evidence to obtain, not permission to add a scheduler.
- New logging or metrics infrastructure: not necessary to close the observed fixture gap and potentially incompatible with R3.

These are exclusions, not accepted follow-up commitments.

---

## Verification Requirements for Resuming Planning

The following specifies the evidence an implementation plan must require after the blocking contracts are supplied. It is not an execution authorization, and none of these checks ran.

### Importer Behavior

Use the existing `node:test` and `node:assert/strict` conventions in `tests/order-importer.test.js`.

| Scenario | Expected evidence | Trace |
| --- | --- | --- |
| First call succeeds | Exactly one call; original rows forwarded; successful result preserved. | R3, KTD4 |
| Two temporary failures followed by success | Exactly three calls; operation succeeds; no fourth call. | Covers F1 / AE1; R1 |
| Three temporary failures followed by success | Exactly four calls; final result returned. | R1, KTD3 |
| Every attempt fails temporarily | Exactly four calls; final client error propagated; no fifth call. | R1, KTD3–KTD4 |
| Validation failure on first call | Exactly one call; original validation failure propagated. | Covers AE2; R2 |
| Temporary failure followed by validation failure | Exactly two calls; validation stops further attempts. | R1–R2 |
| Unknown or permanent failure | No retry unless the supplied client contract explicitly identifies it as temporary. | R2–R3 |
| Concurrent import invocations | Separate attempt budgets and payloads; no shared state. | KTD5 |
| Client invocation semantics | Preserve `client` binding and the confirmed return/throw contract. | R3, KTD2 |
| Empty input | Preserve the client-owned behavior rather than inventing importer validation. | R3 |

Tests must use the actual resolved error taxonomy. A test-only invented property would prove only the stub convention.

The known repository command is `npm test`, which invokes `node --test tests/*.test.js`. A narrower command is `node --test tests/order-importer.test.js`. The eventual implementation owner must record command, exit code, result, and tested source identity.

### Integration and Compatibility

- **Required:** CLI success and terminal-failure comparisons against supplied baseline receipts, including output fields and exit behavior. Importer unit tests alone cannot close R3.
- **Required:** Evidence of replay safety for every eligible temporary-failure class. If effects may precede failure, verify the existing idempotency behavior using the actual client/service boundary.
- **Required:** Confirm that the importer and underlying client do not multiply retry budgets through independent retry loops.
- **Not applicable to this fixture:** Queue migration, durable scheduling, and background-worker rollout checks; those mechanisms are excluded.
- **Not run:** All tests, runtime probes, CLI comparisons, and service integration checks.

Before an implementation plan is promoted, reconcile each required proof with an owning source and an executable verification path. Before implementation is declared complete, reconcile each with its actual result or a stated unresolved limitation.

---

## Review and Delivery Status

A bounded producer self-review checked the supplied Product Contract, source evidence, research attribution, retry count interpretation, and readiness boundary.

- `review_source: producer-self-review`
- `review_status: degraded`
- `mutation_policy: report-only`
- `independent_review: not_run`
- `reason_code: spec_doc_review_capability_unavailable`
- Capability limitation: independent model invocation and delegation were prohibited for this trial.
- `fixes_applied: 0` filesystem changes.
- Independent reviewer counts and coverage: unknown.
- Confidence result: insufficient evidence for implementation-ready promotion.
- Known findings: the three blocking contract gaps above.
- Saved artifact: none created by this run.
- Cleanup: no temporary files were created.

The parent receives a planning checkpoint. The minimal recovery is to supply the client failure/replay contract and CLI compatibility evidence, then resume enrichment of `docs/plans/2026-07-31-001-feat-order-import-plan.md` without changing its Product Contract.
