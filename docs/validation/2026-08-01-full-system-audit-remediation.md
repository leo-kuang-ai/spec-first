---
artifact_type: full-system-audit-remediation-report
artifact_version: 1
created_at: 2026-08-01T18:52:14+08:00
updated_at: 2026-08-02T01:59:53+08:00
source_audit: docs/validation/2026-08-01-full-system-audit-report.md
source_head: b72a6234ba37ec7f3177cbf7ab7438f91b129070
status: completed
baseline_status: passed
verification_run_summary_ref: .spec-first/workflows/spec-debug/spec-first/20260802T015953-spec-plan-f005/verification-run-summary.json
honest_closeout_verdict: verified
honest_closeout_reason: all-claims-consistent
working_tree_fingerprint_ref: .spec-first/workflows/spec-debug/spec-first/20260801T190111-audit-remediation/working-tree-fingerprint.json
---

# 全链路系统审计整改报告

## 1. 结论

本轮按项目目标完成了所有当前 source 中可直接处理的 mandatory remediation，并恢复 deterministic baseline：原审计的 4 个 baseline owner suites 现为 82/82 PASS，`npm run test:mcp-setup` 与完整 `npm test` 均以 exit 0 结束。

2026-08-02 的续接修复已完成唯一 required follow-up F-005：当前 canonical `spec-plan` source 在真实 Codex Agent Engine、隔离 Git fixture 与增强后的确定性 script Judge 下完成 focused `iteration-9` 1/1 PASS 和 full `iteration-10` 3/3 PASS。Product Contract 完整 marker region 与 fixture baseline 做字节比较，planning-only case 未修改实现或运行测试，product-blocker case 保持 requirements-only artifact 原样并暴露 `can_enter_spec_plan: no` blocker。

该结果关闭本报告的 F-005 mandatory evidence gate，但 claim 只覆盖当前 Codex 登录态、当前 source 与三个 fixture；不外推其他宿主、模型、真实项目或 field outcome。C2–C4 继续是独立 evidence roadmap，不是本次 remediation completion gate。

## 2. 与项目目标的对应关系

| 项目目标 | Mandatory remediation | 本轮处置 |
| --- | --- | --- |
| Deterministic floor | 测试不能依赖不稳定的 host process-start probe；checked-in inventory 必须与 source 一致。 | F-002/F-003/F-004 已处理。 |
| Evidence over confidence | 阶段性报告不能继续冒充 canonical completion；历史 ledger 不能复用过期 source identity。 | F-006/F-007 已处理。 |
| Explicit boundaries | identity unknown 必须继续 fail closed，不能为让测试通过而偷走真实 writer lease。 | 保持 production 默认语义，只新增有界 deterministic test injection。 |
| Source-first | 修复 canonical `skills/`、tests 与 docs，不手改 generated runtime。 | 已遵守；未运行 `init`/`clean`。 |
| Bounded autonomy | planning-only/Product authority 风险必须由 fresh evidence 支撑，不能凭历史报告直接改 prompt。 | F-005 已由 iteration-9/10 的 current-source fresh evidence 关闭。 |
| Harness value 可验证 | C2–C4 需要真实宿主、真实任务和 comparator，不能由本轮 unit green 外推。 | 继续标为 not-run，不混入代码修复。 |

## 3. Mandatory / conditional / deferred 决策

| Finding / gap | 决策 | 理由 | 当前状态 |
| --- | --- | --- | --- |
| F-001 Runtime Setup 入口行数 | Mandatory baseline contract | 任何 checked-in contract failure 都阻断 green baseline。 | 当前树已由并发 source 演化降至 874 行；owner test PASS，本轮未重复重构。 |
| F-002 CE inventory drift | Mandatory | stale machine evidence 破坏 source/evidence 同源。 | Fixed；35 skills、559 files。 |
| F-003 Async refresh identity mismatch | Mandatory | 原测试受 host probe 影响，不能稳定支撑 deterministic claim。 | Fixed；显式注入 identity observer。 |
| F-004 Lifecycle lease identity mismatch | Mandatory | 与 F-003 共用 process identity 语义，必须同时确定化。 | Fixed；保持 unknown fail closed。 |
| F-005 `spec-plan` authority assurance | Mandatory evidence gate；conditional source fix | P1 后果高；先复验、闭合 causal chain，再以 canonical Skill prose/references 和 deterministic Judge 做最小修复。 | Fixed；focused 1/1 PASS，full 3/3 PASS。 |
| F-006 早期报告 unsupported claims | Mandatory governance | 直接消费者需要 machine-readable supersession。 | Fixed；四份报告均标 `status: superseded` 并增加 warning。 |
| F-007 External evidence ledger stale identity | Mandatory governance | 旧 owner/path 和历史 source identity 不能支持 current closure。 | Fixed；新增 freshness overlay，E01 标 stale owner/path。 |
| C2 真实宿主 loader | Deferred evidence | 需要 exact-version host journey 与单独外部授权。 | not-run。 |
| C3 真实任务 | Deferred evidence | 需要真实未解决任务、隔离 mutation scope 与 verifier。 | not-run。 |
| C4 增量价值 | Deferred experiment | 需要预注册 comparator 与同口径指标。 | not-run。 |

## 4. 执行计划与完成情况

1. 冻结 current repo、branch、HEAD、dirty overlap 和修复授权。
2. 复现审计中的 4 个 baseline failures，不从旧报告直接假定 current failure。
3. 对仍成立的 F-003/F-004 建立 RED-capable deterministic loop，闭合 causal chain 后最小修复。
4. 确认 F-001 current contract 状态，不重复实现已经存在的修复。
5. Source 稳定后，最后运行 canonical CE reconciliation refresh，防止 inventory 再次漂移。
6. 给四份旧报告增加 supersession，并刷新 external evidence ledger 的 current freshness 边界。
7. 运行聚焦、Runtime Setup、全量、typecheck、Skill lint、build 与 diff checks。

以上 1–7 均已完成。2026-08-02 的续接工作进一步完成 F-005 source 修复、focused/full fresh-source eval、inventory 刷新与最终验证；没有调用 subagent，直接使用 `skill-up` 的真实 Agent Engine 执行隔离 eval。

## 5. F-003/F-004 causal chain 与修复

### 5.1 Root cause

两个历史失败的 production 语义本身在 current source 上能够通过；不确定性来自测试边界：

1. 回归用例写入 live `process.pid` 和伪造的 process-start marker。
2. `processIdentityState()` 在 macOS/其他 POSIX 上调用真实 `ps`，Linux 上读取真实 `/proc`，Windows 上调用 PowerShell。
3. probe 成功时返回 `mismatched`，测试通过。
4. probe 因并发资源、权限或短时环境问题无法取得 marker 时返回 `unknown`。
5. Production 按安全 contract 把 live PID + unknown identity 视为仍可能是真实 writer，因此 status 返回 `in-flight`、lease acquisition 返回 busy。
6. 测试仍固定期待 mismatch/reclaim，于是 deterministic suite 受外部 host probe 成功与否影响。

不能把 unknown 改成 stale：这会在受限 `ps`/PowerShell 环境中偷走真实长任务的 lease，破坏 single-writer safety。

### 5.2 RED evidence

两个测试先改为传入 `processIdentity: () => 'mismatched'`，并把 persisted marker 设为 `null`。修改 production 前，额外 option 被忽略，观察到：

- Async status：expected `failed/workspace-async-refresh-abandoned`，actual `in-flight/null`。
- Lifecycle lease：expected acquired/reclaimed，actual `ok:false, acquired:false`。

定向命令实际为 2 suites / 2 tests failed。

### 5.3 Minimal fix

- `workspace-async-refresh.cjs` 的 stale predicate、`lockIsStale()` 与 `readAsyncRefreshStatus()` 接受默认指向真实 `processIdentityState` 的 optional observer。
- `workspace-graph-lifecycle-lease.cjs` 的 snapshot inspection 与 acquisition 接受相同 optional observer。
- Production callers 不传 observer，行为保持不变；只有 deterministic tests 显式注入 observed identity。
- Identity `unknown` 的 fail-closed 语义及注释保持不变。

修复后原两项定向用例 2/2 PASS，两个完整 owner suites 63/63 PASS。

## 6. F-001/F-002 baseline closeout

### F-001

审计 Phase 0 记录 `setup.cjs` 为 916 行，但 current tree 在本轮复现前已发生并发 source 演化。当前文件为 874 行，`mcp-setup-node-contracts` 通过。为避免重复抽取和干扰并发 dirty work，本轮没有再次重构该入口。

### F-002

在 Runtime Setup source 稳定后运行 canonical generator：

```bash
node scripts/check-ce-upstream-reconciliation.cjs \
  --refresh \
  --ce-repo /Users/kuang/xiaobu/compound-engineering-plugin
```

固定 CE commit objects 均存在；CE checkout 的 unrelated dirty files 未被读取为 source identity。刷新结果：

- canonical skills：35
- package files：559
- manifest SHA-256：`ff3c5f7b7ed427310f8e4d95b4a809e309021ec79ce161d5efd76a4a2baf2fc7`
- reconciliation owner suites：PASS

## 7. F-006/F-007 evidence governance

### F-006

以下四份旧报告保留历史原文，但 frontmatter 现统一包含 `status: superseded`、`evidence_status: advisory`、`superseded_by`，正文标题后增加 warning：

- `2026-08-01-phase-0-health-check.md`
- `2026-08-01-l0-infrastructure-audit.md`
- `2026-08-01-l1-deterministic-floor-audit.md`
- `2026-08-01-system-audit-executive-summary.md`

### F-007

External evidence ledger 增加 2026-08-01 freshness overlay：

- E01 保留历史 track/status vocabulary，但明确 `stale_reference_owner_removed`，不再引用已删除的 `skills/spec-proof/SKILL.md`。
- E02–E18 保留原 blocked/degraded ceiling，但 entry-local `source_identity` 明确为历史身份，不能作为 current closure receipt。
- 任何状态提升前必须重新冻结 current source、exact host/provider version、授权与 receipt。

Ledger contract 与 secret-shape checks：3/3 PASS。

## 8. Verification

| Check | Result | Scope |
| --- | --- | --- |
| F-003/F-004 RED probe | expected FAIL | 2 suites / 2 tests，证明 injection option 在修复前未生效。 |
| F-003/F-004 focused GREEN | PASS | 2/2 tests。 |
| Async refresh + lifecycle lease full suites | PASS | 2 suites / 63 tests。 |
| Four baseline owner suites | PASS | 4 suites / 82 tests。 |
| External evidence ledger | PASS | 1 suite / 3 tests。 |
| `npm run test:mcp-setup` | PASS | exit 0。 |
| `npm test` | PASS | unit 169 suites / 1927 tests；smoke 1 suite / 5 tests；integration 12 suites / 44 tests，另 1 suite / 2 tests 条件跳过；完整主测试链 exit 0。 |
| `npm run typecheck` | PASS | 208 files。 |
| `npm run lint:skill-entrypoints` | PASS | 315 files。 |
| `npm run build` | PASS | 743 files；package 2.1 MB；unpacked 7.2 MB；shasum `9bb4709d6de5b67e17f32b4eff87c97c0db88d97`。 |

本报告记录实际执行结果；没有从计划中的候选命令推断 PASS。

结构化 closeout：

- `verification_run_summary_ref`：`.spec-first/workflows/spec-debug/spec-first/20260801T190111-audit-remediation/verification-run-summary.json`
- `honest_closeout_verdict`：`verified`
- `overall_reason_code`：`all-claims-consistent`
- checks：11/11 `passed`，validation claim 引用了全部 checks，未选择性隐藏 failed/not-run 项。
- `working_tree_fingerprint_ref`：`.spec-first/workflows/spec-debug/spec-first/20260801T190111-audit-remediation/working-tree-fingerprint.json`

F-005 的独立 structured closeout：

- `verification_run_summary_ref`：`.spec-first/workflows/spec-debug/spec-first/20260802T015953-spec-plan-f005/verification-run-summary.json`
- `honest_closeout_verdict`：`verified`
- `overall_reason_code`：`all-claims-consistent`
- checks：7/7 `passed`，覆盖 full/focused fresh-source eval、26 项 contract regression、完整 `npm test`、typecheck/lint/build、inventory/eval-config 一致性和 scoped diff check。

原 2026-08-01 structured verdict 只证明当时列出的 baseline 与 evidence-governance checks；上述 2026-08-02 closeout 独立补证 F-005。两者都不覆盖 C2–C4。

## 9. Review 与 source/runtime 边界

- Simplify：跳过。实现修复低于 30 行级别，且两个 implementation files 均有大量 pre-existing dirty overlap；file-level simplify 可能改写不属于本轮的 hunks。
- Independent `spec-code-review`：未运行，原因是当前用户未授权 reviewer/subagent dispatch。
- Review fallback：对 fix-owned function signatures、call path、默认行为、unknown fail-closed、测试 RED/GREEN 和生成 inventory 做 targeted manual scan。
- Generated runtime：未编辑、未重建；未运行 `spec-first init` 或 `clean`。
- Commit/landing：未授权；所有变更保持未提交，未 push/PR。

## 10. F-005 closeout

### F-005 — `spec-plan` fresh-source assurance

F-005 已按“先复现、再修复、focused 后 full”的顺序关闭：

1. 历史 full run 复现 planning-only implementation mutation、Product Contract authority bypass 与 enrichment completion timeout。
2. 修复 metadata-first eligibility、Product-decision authority guard、requirements-only Product Contract read-only ownership、bounded degraded review，以及 inline specialist applicability/loading。
3. 不增加 900 秒 timeout，不削弱三个 script Judge，不恢复无真实 consumer 的 transaction helper。
4. focused `iteration-7` 首次通过后，进一步发现 enrichment Judge 只校验 required lines、未机械比较完整 marker region。
5. 为 `check-enrichment.sh` 增加 fixture baseline/current region `cmp`，contract test 先 RED 后 GREEN。
6. 增强 Judge 后 focused `iteration-9` 1/1 PASS；最终 full `iteration-10` 3/3 PASS，exit 0。
7. 三个最终 rollout 均未预载 `repo-research-analyst.md`、`learnings-researcher.md`、`deployment-verification-agent.md` 或 `architecture-strategist.md`。

当前 finding 状态：`closed-current-source-evidence`。限制：Codex current login/model only；headless doc review 为 degraded producer self-review，`independent_review: not_run`；未运行 cross-host、cross-model 或 field journey。

C2–C4 是之后的 evidence roadmap，不是当前 baseline bugfix 的 completion gate。本轮全量测试恢复不能被外推为真实宿主加载、真实任务结果或增量价值。

## 11. Debug Summary

**Problem**：全链路审计确认 deterministic baseline 与 evidence governance 同时失真：两项 PID identity 回归依赖真实 host probe，inventory 漂移，旧报告与 external ledger 又可能让消费者误用历史 completion/source identity。

**Root Cause**：`workspace-async-refresh.cjs` 的 stale/status 路径与 `workspace-graph-lifecycle-lease.cjs` 的 stale/acquire 路径直接调用真实 process identity probe；probe 返回 `unknown` 时 production 正确地 fail closed，但原测试仍固定期待 `mismatched`，从而把 host probe 可用性泄漏进 deterministic suite。对应 current source 位于 `workspace-async-refresh.cjs:116`、`:151`、`:442` 与 `workspace-graph-lifecycle-lease.cjs:258`、`:456`；测试 owner 位于 `mcp-setup-workspace-async-refresh.test.js:541` 和 `mcp-setup-workspace-lifecycle-lease.test.js:483`。Inventory 与报告问题则分别来自 checked-in snapshot 未在并发 source 稳定后重刷，以及历史 artifact 缺少 current supersession/freshness 边界。

**Target Repo / Scenario**：`/Users/kuang/xiaobu/spec-first`；branch `leo-2026-07-30-skill-update`；HEAD `b72a6234ba37ec7f3177cbf7ab7438f91b129070`；修复仅覆盖 current source、tests 与用户点名的 validation docs。工作树存在大量并发、pre-existing dirty overlap，因此 review/simplify 均限制在 fix-owned signatures、call path、tests 与报告字段。

**Recommended Tests**：保留两项 focused live-PID reuse tests；完整运行 async refresh + lifecycle owner suites；将入口行数、CE reconciliation、ledger contract 纳入 baseline owner 组合；再由 `test:mcp-setup` 与 `npm test` 覆盖消费者回归。

**Fix**：为两个 stale predicate 及其 public status/acquire owner 增加默认指向真实 observer 的 optional `processIdentity`；仅测试显式注入 `mismatched`。随后刷新 CE inventory，给四份旧报告增加 supersession，并给 external ledger 增加 freshness overlay。

**Prevention**：测试不再依赖本机 `ps`、`/proc` 或 PowerShell probe 的瞬时成功；production `unknown` 仍 fail closed；machine evidence 与历史报告均有 current identity/authority 边界。

**verification_run_summary_ref**：`.spec-first/workflows/spec-debug/spec-first/20260802T015953-spec-plan-f005/verification-run-summary.json`

**honest_closeout_verdict**：`verified / all-claims-consistent`

**claim_limitations**：F-005 仅由当前 Codex/fixture/current-source evidence 支撑；C2–C4 not-run；未运行 independent reviewer。

**Confidence**：High（仅针对本轮 baseline/evidence remediation）；system field-value claim 仍为 partial。

## 12. Post-Fix Quality

**Scope**：fix-owned functions/tests/docs only；targeted manual due to unrelated and overlapping branch work。

**Simplify**：skipped；实现改动很小，且两个 implementation files 存在大量 pre-existing overlap，自动简化可能改写并发 hunks。

**Review**：targeted manual；确认 production 默认 observer 未变、`unknown` 保持 fail closed、自定义 observer 只出现在两项 unit tests、未修改 generated runtime；未发现 actionable finding。Independent review 因缺 dispatch authorization 未运行。

**Residuals**：F-005 已关闭；C2–C4 是独立 evidence roadmap，不是本次修复残余。

**Re-verification**：F-005 focused eval 1/1、full eval 3/3、contract 2 suites / 26 tests；完整 `npm test` 为 unit 169 suites / 1927 tests、smoke 1 suite / 5 tests、integration 12 suites / 44 tests（另 1 suite / 2 tests 条件跳过）；typecheck、Skill lint、build、inventory/CE reconciliation 与 scoped diff check 均通过。

**verification_run_summary_ref**：`.spec-first/workflows/spec-debug/spec-first/20260802T015953-spec-plan-f005/verification-run-summary.json`

**honest_closeout_verdict**：`verified / all-claims-consistent`

**claim_limitations**：F-005 不外推到其他宿主/模型/真实项目；真实宿主 loader、真实任务结果与增量价值仍未验证；无 independent reviewer claim。

**Commit / Landing**：未授权且未执行 commit、push 或 PR；未运行 `spec-first init`/`clean`。
