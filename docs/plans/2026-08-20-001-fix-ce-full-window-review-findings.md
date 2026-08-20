---
title: "CE 全窗口同步 review findings 修复方案"
type: fix
status: completed
date: 2026-08-20
sequence: 001
topic: ce-full-window-review-findings
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: code-review-findings
execution: code
amends: docs/plans/2026-08-19-003-refactor-ce-post-3-20-full-window-sync-plan.md
review_run_id: ce-full-window-deep-review-20260820
---

# CE 全窗口同步 review findings 修复方案

## Goal Capsule

- **Objective:** 关闭 `ce-full-window-deep-review-20260820` 的 F-01 至 F-07，不把原 completed 计划静默改回 active，并保留 finding -> owner -> verification 的修复链。
- **Source boundary:** 只修改 spec-first canonical source、contracts、tests、adjudication/ledger 和 Changelog；不手改 generated runtime，不修改固定 CE Git objects。
- **Architecture posture:** U8 和 prototype 在现有 owner 内 extend；context facts 由各 workflow owner 本地 adapt；cross-model work 只 compose host-native primitive，不复制 CE runner；没有 authenticated serving producer 时 fail closed。
- **Claim ceiling:** local source/test closure 不证明 independent review、provider identity、runtime apply、field adoption、PR、CI 或 release。
- **Failure handling:** 任一 required check 失败时保持本计划 active，记录失败和限制，不发布完成声明，不生成 runtime mutation。

## Product Contract

### Requirements

- **R1:** U8 patch 必须绑定完整 target snapshot、ledger owner Unit 和合并后 record invariants。
- **R2:** prototype 必须拒绝 root 内目录 symlink 越界，并以跨平台 token-bound loopback lifecycle 代替 `ps`/直接 PID signal。
- **R3:** file-based provider receipt 必须明确为 unverified；没有 authenticated producer 时不发布 packet、不启动 peer、不计 independent coverage。
- **R4:** 33 个 package 的 action、test owner 和 test refs 必须与 owning Skill 场景一致；P30 对 CE cross-model work 给出显式融合/拒绝边界。
- **R5:** completed 原计划保持历史 marker，本修复通过独立 corrective plan 承载，不丢失 finding/U-ID trace。
- **R6:** CHANGELOG 只保留一个当前版本最终态 claim，不堆叠互相矛盾的过程快照。

### Non-goals

- 不实现宿主签名服务、中心 provider router 或新的通用 worker runtime。
- 不手工刷新 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` 或 `.opencode/`。
- 不授权 commit、push、PR、runtime apply 或外部 provider 调用。

## Implementation Units

### U1. U8 fail-closed ledger merge

- Owner: `scripts/check-ce-upstream-reconciliation.cjs`
- Findings: F-01
- Verification: `tests/unit/ce-upstream-reconciliation-v2.test.js`

### U2. Prototype containment and lifecycle

- Owner: `skills/spec-prototype`
- Findings: F-02、F-05
- Verification: `tests/unit/spec-prototype-contracts.test.js`、`tests/integration/spec-prototype-human-journey.integration.test.js`

### U3. Provider identity claim ceiling

- Owners: `docs/contracts/verification/provider-serving-receipt*`、code-review/doc-review/POV adapters
- Findings: F-03
- Verification: `tests/unit/spec-code-review-peer-runner.test.js`

### U4. Package and owner-local evidence reconciliation

- Owners: adjudication/ledger single writer plus affected workflow owners
- Findings: F-04
- Verification: v2 full-window verify-only、package contract comparison、owner-focused tests

### U5. Corrective lifecycle and release notes

- Owners: this corrective plan、`CHANGELOG.md`
- Findings: F-06、F-07
- Verification: plan/changelog contract tests、`git diff --check`

## Verification Contract

1. Run focused Jest suites for U1-U5.
2. Run v2 517-path full-window verify-only against fixed CE objects and current adjudication/patch artifacts.
3. Compare all 33 package action/test contracts as normalized sets; zero semantic mismatch is required.
4. Run `npm run typecheck` and `git diff --check`.
5. Run final report-only code review or record the explicit inline/manual fallback limitation when independent dispatch is unavailable.

## Definition of Done

- F-01 至 F-05 的 negative reproductions fail closed。
- F-04 的 4 个 action mismatch、28 个 test owner mismatch、30 个 test refs mismatch 均归零。
- 原 003 plan 保持 completed；本 corrective plan 提供完整修复 trace，并仅在 required verification/review closeout 后转 completed。
- CHANGELOG 不再同时声明未实施、部分完成和全部完成。
- 未授权的 runtime、commit 和 landing side effects 均为 not-run。

## Closeout Evidence

- F-01 至 F-07 已按 U1-U5 关闭；最终 inline report-only review 未发现新的 P1/P2 finding。由于 worker dispatch 未获授权，`independent_review: not_run`，不计 independent 或 cross-model coverage。
- `npm run typecheck`：212 files passed。
- focused Jest：5 suites、38 tests passed；`npm run test:eval-fixtures`：6 suites、80 tests passed。
- 全量 `npm run test:jest -- --runInBand`：188 suites、2092 tests passed，另有 1 suite / 2 tests 条件跳过。
- 根 Jest 只排除由 fixture 自己的 `node --test` 命令拥有的嵌套 eval repositories；fixture 文件和 eval contract 均保留。
- full-window adjudication/reconciliation 在最终 source snapshot 上重新绑定并通过 verify-only 后关闭；517 records、33 packages，normalized package diff 为 0。
- generated runtime apply、authenticated provider、field outcome、commit、push、PR 均为 `not-run`。
