## Code Review Results

**Scope:** HEAD (`9f04885`) -> working tree, 4 files: `lib/amount.cjs`, `lib/http.cjs`, `lib/ledger.cjs`, `lib/receipt.cjs`. Untracked `.claude/**` (skill assets) excluded.
**Intent (README 合同, inferred):** 为 HTTP 适配器增加顺序批量收款入口、拆出金额转换函数便于复用；前提是保持 README 合同：入口到 provider 均为整数分；去重以租户+请求号共同标识，不同租户可复用请求号；仅 provider 成功才记 captured，失败后同一请求允许重试；单入口保持兼容；显示格式化整理允许。
**Mode:** interactive (`mutation_policy: report-only`, `commit_authorization: missing`)
**Reviewers:** inline-fallback -- 本次调用未授权 multi-agent dispatch，为单模型有界审查；无独立 persona / validator / 跨模型覆盖。

### P0 -- Critical

| # | File | Issue | Reviewer | Confidence |
|---|------|-------|----------|------------|
| 1 | `lib/amount.cjs:4` | providerAmount returns cents/100: provider is sent fractional dollars and every receipt shows 1/100 of the charge | inline-fallback | 100 |
| 2 | `lib/ledger.cjs:7` | Idempotency key drops tenantId: different tenants sharing a requestId get the first tenant's receipt and are never charged | inline-fallback | 100 |

- **#1** -- 违反 README「金额从入口到 provider 均为整数分」。工作树实测：1250 分请求 -> provider 收到 `amountCents: 12.5`（浮点、单位错 100 倍）；`receipt.chargedCents` 变成 12.5，`formatReceipt`（`lib/receipt.cjs:3`，仍按分再除 100）显示 `captured: 0.13`，应为 `captured: 12.50`。触发条件：任意一笔 capture，100% 命中。影响：每笔收款金额错误 + 收据显示错误。「拆出转换函数便于复用」的目标不需要改单位，函数在 HEAD 已拆出。修复：`return amountCents;`（保留校验）。
- **#2** -- 违反 README「重试去重以租户和请求号共同标识」「不同租户可以使用相同请求号」。键从 `JSON.stringify([tenantId, requestId])` 改为裸 `requestId`。实测：tenantA/tenantB 用同一 requestId，provider 仅对 A 收款一次，B 的 2000 分请求从未收款却拿到 A 的缓存收据（金额还叠加 #1 的单位错误）。触发条件：两个租户使用相同 requestId（合同明确支持的场景）。影响：静默漏收 + 跨租户收据串用。修复：恢复组合键。

### P1 -- High

| # | File | Issue | Reviewer | Confidence |
|---|------|-------|----------|------------|
| 3 | `lib/ledger.cjs:11` | Receipt cached as captured before provider.charge resolves: a failed charge is permanently recorded as captured and can never be retried | inline-fallback | 100 |

- **#3** -- 违反 README「只有 provider 成功才能记为 captured，失败后同一请求允许重试」。`receipts.set` 移到 `await provider.charge` 之前：charge 抛错时错误虽传给调用方，但假 `captured` 收据已入缓存。实测：provider 失败一次后，同一请求重试直接返回 `{status:'captured'}`，provider 不再被调用，永久无法重试。批量入口放大该问题：批量中段失败后重试整批，失败项会以 captured "成功" 返回（该项从未成功收款）。修复：把 set 移到 charge 成功之后；若还要抑制并发重复，用 in-flight 标记而非提前缓存收据。

### Actionable Findings

| # | File | Issue | Route | Notes |
|---|------|-------|-------|-------|
| 1 | `lib/amount.cjs:4` | 单位回归：provider 收到 cents/100，收据显示 1/100 | `gated_auto -> downstream-resolver` | `suggested_fix` present -- 恢复返回原值 |
| 2 | `lib/ledger.cjs:7` | 去重键丢失 tenantId，跨租户串单 | `gated_auto -> downstream-resolver` | `suggested_fix` present -- 恢复组合键 |
| 3 | `lib/ledger.cjs:11` | 失败先缓存 captured，无法重试 | `gated_auto -> downstream-resolver` | `suggested_fix` present -- set 移到 charge 后 |

### Coverage

- Dispatch: 未授权 multi-agent dispatch -> `dispatch_reason_code: dispatch_authorization_missing`，单模型有界审查（status: degraded）；无独立 validator / 跨模型复核，上述结论均由直接执行证据支持，但缺第二双眼睛。
- Verification evidence: `status: degraded`, `run_summary_ref: null`, `closeout_verdict: not-run`, `reason_code: spec-first-cli-unavailable`。实际执行的命令（证据仅保留在 repo 外 run artifact 目录）：`npm test` -> 2 pass / 0 fail（同时说明现有测试覆盖不到三处合同回归）；4 个定向探针（units / cross-tenant / failure-retry / batch-partial）全部证实上述发现，输出见 `logs/verification.log`。
- 符合项核对（结合合同与实际消费者）：`lib/http.cjs:4-9` 批量入口符合变更目标（`lib/http.cjs:6` 顺序执行、每项走同一 ledger、单入口分支保持兼容；实测批量按序收款、中段失败整批抛错且已成功项留在 ledger 幂等缓存）；`lib/receipt.cjs` 为纯显示重构，README 明确允许。此两处无 finding。
- Residual risks: 按 #3 修复（成功后再 set）会回到 HEAD 之前即存在的并发同 key 双重收款窗口；in-flight 标记可同时闭合两者，需设计决策。
- Testing gaps: 现有 `test/smoke.test.cjs` 在三处合同回归全部在场时仍然全绿：缺跨租户同 requestId 用例、provider 失败重试用例、对 `receipt.chargedCents` 的端到端单位断言，以及批量入口的任何测试（顺序、逐项结果、部分失败语义）。
- Excluded: untracked `.claude/**`（审查技能自身资产，不属于被审改动）。未发现 plan 文件（无 `docs/plans/`），意图取自 README 合同段。
- Mutation gate: 审查前后被审 4 文件字节一致（`diff_sha256` 相同），未做任何修改、提交或推送。

---

> **Verdict:** Not ready
>
> **Reasoning:** 2 个 P0 均为对 README 明示合同的破坏且在正常使用路径 100% 触发（每笔金额错 100 倍；跨租户静默漏收+串单），外加 1 个 P1 使失败请求永久无法重试。变更目标中真正被要求的部分（批量入口、函数拆分、显示整理）本身实现正确。
>
> **Fix order:** #1 恢复整数分 -> #2 恢复组合键 -> #3 set 移到 charge 成功后；随后补上 Testing gaps 中列出的用例再合入。
