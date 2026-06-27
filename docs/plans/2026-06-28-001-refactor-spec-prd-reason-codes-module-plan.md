---
title: "refactor: 收敛 spec-prd reason-codes 分类法到独立模块"
type: refactor
status: completed
date: 2026-06-28
spec_id: 2026-06-28-001-refactor-spec-prd-reason-codes-module
---

# refactor: 收敛 spec-prd reason-codes 分类法到独立模块

## Summary

把散落在 `check-prd-artifact.js`（`BLOCKING_REASON_CODES` Set + `closureBlockerPresent` 内联 8 码数组）与 `finalize-prd-artifact.js`（`RECEIPT_ONLY_REASONS` + `CHECKPOINT_INPUT_SCAN_EXEMPT` 两个本地子集）的 readiness 阻断分类法，收敛到一个独立 `scripts/lib/reason-codes.js` 模块，配分类器函数与子集不变量测试。消除"什么是 blocker"语义横跨两模块的双归属与第 4 处内联数组的漂移风险，不改任何对外契约（码集合、facts key-set、finding 形状、closeout 语义、prose 全部不变，由既有 parity/freeze/contracts/finalize 闸锁）。

---

## Decision Brief

- **Recommended approach:** 抽 `scripts/lib/reason-codes.js` 作为 reason-code 分类法的单一真相源，导出 `BLOCKING_REASON_CODES` + 三个派生子集 + 三个分类器；check 与 finalize 改 import 并删除各自的本地重复定义。纯内部重构，行为不变。
- **Key decisions:** lib 成为 `BLOCKING_REASON_CODES` 真相源（从 check 迁出）；check re-export 保持现有消费者 `finalize.test.js` 不变；parity 测试改 import lib 直接锁真相源；`finalize_required` 保留在 BLOCKING Set 但 emit 归 finalize（lib 只管分类不管 emit）；`LEGAL_DISPOSITIONS` 等 disposition 词分类保留在 check（非 reason-code，不属本模块）。
- **Validation focus:** `closureBlockerPresent` 计算行为不变（同样 8 码）；finalize closeout 语义不变（receipt-only/checkpoint-exempt 过滤不变）；分类器对全 30 码真值表 + 子集 ⊆ BLOCKING 不变量。
- **Largest risks / boundaries:** 行为变更风险——closure-blocker 子集从内联数组改为派生分类器，若子集成员错配会静默改变 `preflight_closure_contradicted` 触发条件。由单元测试真值表 + contracts 端到端 33 测试 + finalize 23 测试护栏。

---

## Problem Frame

spec-prd readiness 契约的阻断语义当前横跨两个脚本模块：

- `skills/spec-prd/scripts/check-prd-artifact.js:33-65` 拥有 `BLOCKING_REASON_CODES` Set（30 码，可执行真相，已被 prose parity 闸与 finalize freeze 测试锁）。
- `check-prd-artifact.js:1057-1062` 内联硬编码 `closureBlockerPresent` 数组（8 码），这是第 4 处需手动同步的码列表——新增 closure blocker 码忘记同步此处会导致 `preflight_closure_contradicted` 静默失效。
- `skills/spec-prd/scripts/finalize-prd-artifact.js:11-21` 拥有 `RECEIPT_ONLY_REASONS`（2 码）+ `CHECKPOINT_INPUT_SCAN_EXEMPT`（2 码）两个本地子集，并在 `buildFinalizeReceipt` 重过滤 + 自加 `finalize_required`。

"什么是 blocker / receipt-only / checkpoint-exempt" 由 check 的 `BLOCKING` 与 finalize 的 receipt/closeout 重过滤两套策略、两个模块回答。读者要脑内合并两份分类法；finalize 重跑 `buildReport` 再重过滤，是 check 抽象泄漏的信号。上一轮 P0#1 已封死 prose↔code 边界漂移，本 plan 封死 code 内部跨模块分类法漂移。

---

## Requirements

- R1. `scripts/lib/reason-codes.js` 成为 reason-code 分类法单一真相源，导出 `BLOCKING_REASON_CODES` Set、`CLOSURE_BLOCKER_REASON_CODES`/`RECEIPT_ONLY_REASONS`/`CHECKPOINT_INPUT_SCAN_EXEMPT` 三个派生子集、`isClosureBlocker(code)`/`isReceiptOnly(code)`/`isCheckpointInputScanExempt(code)` 三个分类器。
- R2. `check-prd-artifact.js` 删除本地 `BLOCKING_REASON_CODES` 定义与 `:1057-1062` 内联数组，改 import lib；`closureBlockerPresent` 计算改用 `isClosureBlocker` 分类器，行为不变。
- R3. `finalize-prd-artifact.js` 删除本地 `RECEIPT_ONLY_REASONS`/`CHECKPOINT_INPUT_SCAN_EXEMPT` 定义，改 import lib；`buildFinalizeReceipt` 过滤行为不变。
- R4. `BLOCKING_REASON_CODES` 码集合不变（30 码），`finalize_required` 仍属 BLOCKING、emit 归 finalize 不变。
- R5. 新增分类器单元测试：全 30 码真值表 + 三个子集 ⊆ BLOCKING 不变量。
- R6. 既有闸全绿：parity 闸、contracts 33、finalize 23（含 freeze）、checker-unit 21、typecheck。

---

## Scope Boundaries

- 不改 `BLOCKING_REASON_CODES` 的码集合（已被 parity 闸 + finalize freeze 测试锁）。
- 不改 `facts` key-set（已被 freeze 测试锁）。
- 不改 finding 形状（字段各异，下游当前只读 `reason_code`，本 plan 不动）。
- 不改 finalize closeout 行为语义（checkpoint 豁免、receipt-only 语义、`should_block_closeout` 逻辑不变）。
- 不改 prose（SKILL.md / prd-readiness-lens.md 已被 parity 闸锁，不动）。
- `LEGAL_DISPOSITIONS` / `SOURCE_DISPOSITIONS` / `OWNER_DISPOSITIONS` / `WHAT_TOUCHING_KEYWORDS` 保留在 check（它们是 OQ 剃刀的 closure-disposition 词分类与误分类词表，不是 reason-code，不属本模块）。
- 不抽 `parseArgs` / `splitLines` / `parseFrontmatter` 共享解析 lib（P3 独立评估，避免 speculative 抽象）。

### Deferred to Follow-Up Work

- buildReport 拆分 + claimsReady 集中（P2，独立 plan）。
- 共享解析 lib（P3，建议延迟到 parseArgs 再次漂移时做）。
- finding schema freeze（P5，最低优先级文档记录）。

---

## Direct Evidence Readiness

- target_repo: spec-first（本仓）
- evidence_sources: direct source reads（check-prd-artifact.js 全 1177 行、finalize-prd-artifact.js 全 254 行、SKILL.md、prd-readiness-lens.md）、`node -e` 提取 BLOCKING Set、子集关系验证、jest
- source_refs: `skills/spec-prd/scripts/check-prd-artifact.js`、`skills/spec-prd/scripts/finalize-prd-artifact.js`、`skills/spec-prd/SKILL.md`、`skills/spec-prd/references/prd-readiness-lens.md`、`tests/unit/spec-prd-reason-code-parity.test.js`、`tests/unit/spec-prd-contracts.test.js`、`tests/unit/spec-prd-finalize.test.js`、`tests/unit/spec-prd-checker-unit.test.js`
- current_revision: a1a87324
- worktree_status: 含本轮 P0#1/P1 未提交改动（prose 补码 + 纯函数导出 + 2 新测试 + CHANGELOG）
- confidence: high（逐行读两脚本，已核实 30 码 / 8 码 closure 子集 / 2+2 finalize 子集，已验证三子集 ⊆ BLOCKING）
- limitations: 未跑 fresh-source eval（refactor 无 prose/行为变更，不需）；未 dispatch research agents（纯内部重构，codebase patterns 已完全掌握）

---

## Direct Evidence

- repo_scope: `skills/spec-prd/scripts/`
- source_reads_completed: check-prd-artifact.js（:33-65 BLOCKING Set、:1057-1062 内联 closure 数组、:1171-1188 module.exports）、finalize-prd-artifact.js（:11-21 两个本地子集、:113-184 buildFinalizeReceipt 重过滤、:250-254 module.exports）、SKILL.md:234、prd-readiness-lens.md:38、4 个测试文件 import 结构
- source_reads_required: 无新增
- commands_or_tools_used: `node -e` 提取 BLOCKING Set 与子集验证、`grep` 确认消费者
- impact_on_plan: 确认三子集均为 BLOCKING 真子集（可派生）；确认唯一直接 import 消费者是 finalize.test.js（多行解构，:9）；contracts 走 execFileSync 不直接 import
- key_findings: `finalize_required` 在 BLOCKING 但仅 finalize emit（lib 只管分类）；check 须 re-export BLOCKING_REASON_CODES 保持 finalize.test.js 不变；parity 测试改 import lib 锁真相源
- limitations: 无

---

## Context & Research

### Relevant Code and Patterns

- `skills/spec-prd/scripts/check-prd-artifact.js:33-65` — `BLOCKING_REASON_CODES` Set 真相源（将迁出）。
- `skills/spec-prd/scripts/check-prd-artifact.js:1057-1062` — `closureBlockerPresent` 内联 8 码数组（将消除）。
- `skills/spec-prd/scripts/finalize-prd-artifact.js:11-21` — `RECEIPT_ONLY_REASONS` / `CHECKPOINT_INPUT_SCAN_EXEMPT` 本地子集（将消除）。
- `tests/unit/spec-prd-finalize.test.js:435` — `freezes the exact BLOCKING_REASON_CODES set` freeze 测试（经 check re-export 锁 lib）。
- `tests/unit/spec-prd-reason-code-parity.test.js` — parity 闸（将改 import lib）。
- 仓内既有 lib 抽取先例：`src/cli/` 下按 commands/adapters/contracts/helpers 分模块的 CommonJS 惯例（2 空格、单引号、分号）。

### Institutional Learnings

- 上一轮 P0#1 经验：prose↔code 边界漂移用 parity 闸（missing 方向）封死最有效；本 plan 是同一范式应用到 code 内部跨模块分类法边界。
- `check-prd-artifact.js:157` 注释自述"多余参数静默丢弃"bug —— 三脚本 `parseArgs` 独立漂移的先例，佐证内联分类法重复定义的漂移风险是真实的，而非 speculative。

### External References

- 无（纯内部 Node.js CommonJS 重构）。

---

## Key Technical Decisions

- **lib 为 BLOCKING_REASON_CODES 单一真相源**：从 check 迁出，check 改 import 并 re-export，保持 `finalize.test.js:9` 等现有消费者 import 路径不变（降低 churn）。parity 测试改 import lib，直接锁真相源而非经 check 间接。
- **CLOSURE_BLOCKER 作为 BLOCKING 派生子集**：在 lib 定义为 `BLOCKING_REASON_CODES` 的明确 8 元素子集，而非独立 Set。消除 check:1057-1062 内联数组，改用 `isClosureBlocker(code)` 分类器。子集成员错配由单元测试真值表护栏。
- **finalize_required 保留归属**：仍在 BLOCKING Set（parity 闸已锁），emit 归 finalize 不变。它不是 closure-blocker 子集（是 ready-intent 缺失类），lib 只管"哪些码属于哪个分类"，不管"谁 emit"。
- **disposition 词分类不迁**：`LEGAL_DISPOSITIONS` / `SOURCE_DISPOSITIONS` / `OWNER_DISPOSITIONS` / `WHAT_TOUCHING_KEYWORDS` 是 OQ 剃刀的 closure-disposition 词分类与误分类词表，与 reason-code 是不同概念层，保留在 check，避免 lib 越界。
- **不抽共享解析 lib**：`parseArgs`/`splitLines`/`parseFrontmatter` 三脚本重复属 P3，本 plan 不做（对齐 CLAUDE.md "避免一次性抽象"，延迟到再次漂移）。

---

## Open Questions

### Resolved During Planning

- 分类法模块文件位置：`skills/spec-prd/scripts/lib/reason-codes.js`（与两脚本同目录树的 lib 子目录，CommonJS 相对路径 `./lib/reason-codes` 在 jest 与 node CLI 两种执行环境都可解析）。
- check 是否 re-export BLOCKING：是，保持 finalize.test.js 不变；parity 测试改 import lib 锁真相源。
- finalize_required 归属：保留在 BLOCKING，emit 归 finalize，不进 CLOSURE_BLOCKER 子集。

### Deferred to Implementation

- lib 内子集用 `new Set([...])` 显式列举还是从 BLOCKING 派生过滤：实现时定，单元测试锁定结果不变即可。

---

## Implementation Units

### U1. 创建 reason-codes 分类法模块 + 单元测试

**Goal:** 建立 reason-code 分类法单一真相源与分类器，配真值表单元测试。

**Requirements:** R1, R5

**Dependencies:** None

**Files:**
- Create: `skills/spec-prd/scripts/lib/reason-codes.js`
- Test: `tests/unit/spec-prd-reason-codes-unit.test.js`

**Approach:**
- 模块导出 `BLOCKING_REASON_CODES` Set（30 码，从 check 原样迁入）、`CLOSURE_BLOCKER_REASON_CODES`（8 码子集：open_oq_without_owner_closure / how_pushdown_touches_what / blocking_outstanding_question_present / planning_invention_question_present / unclosed_owner_question_present / owner_decision_trace_required_but_absent / design_unread_without_owner_acceptance / design_partial_coverage_unaccepted）、`RECEIPT_ONLY_REASONS`（2 码：ready_receipt_absent / ready_receipt_stale）、`CHECKPOINT_INPUT_SCAN_EXEMPT`（2 码：input_scan_degraded / input_refs_unavailable）。
- 分类器 `isClosureBlocker(code)` / `isReceiptOnly(code)` / `isCheckpointInputScanExempt(code)` 各自查对应子集。
- 顶部注释说明：lib 是 reason-code 分类法真相源，check/finalize 共同消费；lib 只管分类，不管 emit。

**Patterns to follow:**
- `src/cli/` CommonJS 惯例：`'use strict'`、2 空格、单引号、分号、`module.exports`。

**Test scenarios:**
- Happy path: `isClosureBlocker('open_oq_without_owner_closure')` 返回 true；`isReceiptOnly('ready_receipt_absent')` 返回 true；`isCheckpointInputScanExempt('input_scan_degraded')` 返回 true。
- Edge case: 三个分类器对不在任一子集的 BLOCKING 码（如 `core_section_missing` / `finalize_required` / `write_mode_undeclared`）返回 false。
- Edge case: 分类器对未知码（如 `'nonexistent_code'`）返回 false，不抛异常。
- 不变量: `CLOSURE_BLOCKER_REASON_CODES` / `RECEIPT_ONLY_REASONS` / `CHECKPOINT_INPUT_SCAN_EXEMPT` 三个子集的每个元素都在 `BLOCKING_REASON_CODES` 中（子集 ⊆ BLOCKING）。
- 不变量: `BLOCKING_REASON_CODES` 规模为 30（与 check 原 Set 一致，防迁移丢码）。
- 不变量: 三个子集两两不相交（同一码不属多个分类——receipt-only 码不是 closure-blocker，exempt 码不是 closure-blocker）。

**Verification:**
- `npx jest tests/unit/spec-prd-reason-codes-unit.test.js` 全绿。
- `npm run typecheck` 通过（含新 lib 文件）。
- lib 可被 `node -e "require('./skills/spec-prd/scripts/lib/reason-codes')"` 加载。

---

### U2. check-prd-artifact.js 接入 lib + parity 测试校准

**Goal:** check 改 import lib 的 BLOCKING 与分类器，消除本地定义与内联 closure 数组；parity 闸改锁 lib 真相源。

**Requirements:** R2, R6

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-prd/scripts/check-prd-artifact.js`
- Modify: `tests/unit/spec-prd-reason-code-parity.test.js`

**Approach:**
- 删除 check 顶部 `const BLOCKING_REASON_CODES = new Set([...])` 定义，改为 `const { BLOCKING_REASON_CODES, isClosureBlocker } = require('./lib/reason-codes');`。
- `module.exports` 保留 `BLOCKING_REASON_CODES`（re-export lib 的引用），保持 `tests/unit/spec-prd-finalize.test.js:9` 等现有消费者不变。
- `closureBlockerPresent` 计算（原 :1057-1062 内联 8 码 `.includes()` 数组）改为 `findings.some((f) => isClosureBlocker(f.reason_code))`，行为不变（同样 8 码）。
- `LEGAL_DISPOSITIONS` / `SOURCE_DISPOSITIONS` / `OWNER_DISPOSITIONS` / `WHAT_TOUCHING_KEYWORDS` / `OQ_HEADER_ALIASES` / `TRACE_HEADER_ALIASES` 保留在 check（非 reason-code，不迁）。
- parity 测试 `tests/unit/spec-prd-reason-code-parity.test.js` 改 `require('../../skills/spec-prd/scripts/lib/reason-codes')` 拿 `BLOCKING_REASON_CODES`，直接锁真相源。

**Patterns to follow:**
- check 既有 `require('./...')` 相对路径风格。

**Test scenarios:**
- Integration: parity 闸两测试仍绿（code Set 来源改为 lib 后，SKILL.md / lens.md prose 仍覆盖全 30 码）。
- Integration: `tests/unit/spec-prd-finalize.test.js` 的 freeze 测试（:435）仍锁 30 码（经 check re-export 锁 lib）。
- Integration: `tests/unit/spec-prd-contracts.test.js` 33 端到端测试全绿（`closureBlockerPresent` 行为不变，`preflight_closure_contradicted` 触发条件不变）。
- Integration: `tests/unit/spec-prd-checker-unit.test.js` 21 单测全绿。
- Edge case: 模拟从 lib 的 CLOSURE_BLOCKER 子集移除一码，确认 contracts 中 `preflight_closure_contradicted` 相关测试会感知（若该测试覆盖此路径）——否则记录为 testing_gap，不强行加测试。

**Verification:**
- `npx jest spec-prd` 全绿（parity 2 + checker-unit 21 + contracts 33 + finalize 23 + 新 reason-codes-unit）。
- `npm run typecheck` 通过。
- `node skills/spec-prd/scripts/check-prd-artifact.js --help` 仍正常（import 不破坏 CLI 入口）。

---

### U3. finalize-prd-artifact.js 接入 lib

**Goal:** finalize 删除本地两个子集定义，改 import lib；closeout 过滤行为不变。

**Requirements:** R3, R4, R6

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-prd/scripts/finalize-prd-artifact.js`

**Approach:**
- 删除 finalize :11-21 的 `RECEIPT_ONLY_REASONS` 与 `CHECKPOINT_INPUT_SCAN_EXEMPT` 本地定义，改为 `const { isReceiptOnly, isCheckpointInputScanExempt } = require('./lib/reason-codes');`。
- `buildFinalizeReceipt` 中 `RECEIPT_ONLY_REASONS.has(reasonCode)` 改为 `isReceiptOnly(reasonCode)`，`CHECKPOINT_INPUT_SCAN_EXEMPT.has(reasonCode)` 改为 `isCheckpointInputScanExempt(reasonCode)`，行为不变。
- `finalize_required` 仍在 finalize 的 `missingReadyIntentReasons` 中 emit（不改归属）；它不在 lib 的任何子集中（lib 只管分类，finalize 负责 emit）。
- `isValidCheckpoint` / `shouldBlockCloseout` / closeout 豁免逻辑全部保留不变。

**Patterns to follow:**
- finalize 既有 `require('./check-prd-artifact')` 相对路径风格。

**Test scenarios:**
- Integration: `tests/unit/spec-prd-finalize.test.js` 23 测试全绿（can_finalize / can_closeout / should_block_closeout / blocking_reason_codes / closeout_blocking_reason_codes 输出不变；checkpoint 豁免 receipt-only 与 input-scan-exempt 码的行为不变）。
- Integration: `tests/unit/spec-prd-contracts.test.js` 33 端到端测试全绿（finalize 经 check 间接消费 lib，端到端不变）。
- Edge case: 合法 checkpoint（write_mode=checkpoint-prd + can_enter_spec_plan=no + 不自称 ready）的 closeout 仍豁免 receipt-only 与 input-scan-exempt 码（`can_closeout=true`）。
- Edge case: ready 矛盾 PRD 仍被 `should_block_closeout=true` 阻断（receipt-only 码在非 checkpoint 路径仍阻断 closeout）。

**Verification:**
- `npx jest spec-prd` 全绿。
- `npm run typecheck` 通过。
- `node skills/spec-prd/scripts/finalize-prd-artifact.js --help` 仍正常。

---

## System-Wide Impact

- **Interaction graph:** check 与 finalize 共同 import 新 lib；lib 无外部依赖、无回调、无观察者。两脚本 CLI 入口（`--help`、子进程 execFileSync 调用）不变。
- **Error propagation:** lib 是纯数据 + 纯函数分类器，无错误路径；分类器对未知码返回 false 不抛异常。
- **State lifecycle risks:** 无（无持久化、无缓存、无 partial-write）。
- **API surface parity:** check 的 `module.exports` 仍导出 `BLOCKING_REASON_CODES`（re-export），对外消费者接口不变；finalize 的 `module.exports` 不变。
- **Unchanged invariants:** `BLOCKING_REASON_CODES` 30 码集合不变（parity 闸 + finalize freeze 锁）；`facts` key-set 不变（freeze 锁）；finding 形状不变；finalize closeout 语义不变；prose 不变（parity 闸锁）。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| CLOSURE_BLOCKER 子集从内联数组改为派生分类器，若子集成员错配会静默改变 `preflight_closure_contradicted` 触发条件 | U1 单元测试真值表（8 码 true / 其余 false）+ U2 contracts 33 端到端测试护栏 |
| finalize closeout 过滤行为变更（receipt-only / checkpoint-exempt 误过滤或漏过滤） | U3 finalize 23 测试护栏，覆盖合法 checkpoint 豁免与 ready 矛盾阻断两条路径 |
| check re-export lib 的 BLOCKING 与 finalize freeze 测试期望不一致 | freeze 测试经 check re-export 锁 lib 的同一 Set 引用，规模 30 不变 |
| `scripts/lib/` 相对路径在 jest 与 node CLI 两种执行环境解析不一致 | CommonJS `require('./lib/reason-codes')` 相对脚本文件目录解析，typecheck + 实际跑 `--help` 验证 |
| 迁移过程中 BLOCKING 码丢失 | U1 不变量测试锁定规模 30 + parity 闸锁定 prose 覆盖全 30 码（双闸交叉验证） |

---

## Documentation / Operational Notes

- 每个实现单元的 source 变更须同步更新根目录 `CHANGELOG.md`（refactor 条目，记录 source surface + 验证命令 + 未验证项）。
- `scripts/lib/` 是 source，非 generated runtime mirror，不需 `spec-first init`。
- 不更新 README（内部重构，无用户可见行为变化）；CHANGELOG 条目不带 `(user-visible)` 除非 reviewer 判定分类法收敛对维护者可见。

---

## Sources & References

- **Origin document:** 无（refactor plan，源自 spec-prd code review 工程加固分析，非 PRD-grade requirements）
- Related code: `skills/spec-prd/scripts/check-prd-artifact.js:33-65,1057-1062`、`skills/spec-prd/scripts/finalize-prd-artifact.js:11-21,113-184`
- Related tests: `tests/unit/spec-prd-reason-code-parity.test.js`、`tests/unit/spec-prd-finalize.test.js:435`、`tests/unit/spec-prd-contracts.test.js`
- 前序工作: P0#1 reason_code parity 闸（已落地）、P1 纯函数导出 + in-process 单测（已落地）