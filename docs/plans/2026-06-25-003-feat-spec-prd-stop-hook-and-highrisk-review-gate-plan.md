---
spec_id: spec-prd-stop-hook-and-highrisk-review-gate
title: "feat: spec-prd producer-local finalize gate 强制 PRD readiness"
type: feat
status: completed
date: 2026-06-25
plan_depth: deep
author: leokuang
target_repo: "."
referenced_reviews:
  - ref: docs/validation/spec-prd/fresh-source-eval-2026-06-25-relentless-grill.md
    role: origin
    scope: in
    addresses_findings: ["STRUCTURAL-GATE-SKIPPABLE"]
related_plans:
  - docs/plans/2026-06-25-002-fix-spec-prd-enforce-grill-and-design-gate-plan.md
---

# feat: spec-prd producer-local finalize gate 强制 PRD readiness

## Summary

002 已把 `spec-prd` 的质量闸内容做对了:checker 能检测 grill 痕迹、design 漏读、Requirement Analysis Gate closure、core section 锚点和 readiness 声明缺失;SKILL/readiness prose 也明确 Phase 4 必跑 checker。但三次 KAZ real-run 实证显示:prose 强制无效。模型读完输入后直接写 PRD、自盖 `status: ready-for-planning`、推荐进入 `spec-plan`,从未实际运行 checker;第三次即使带强 system-reminder("停手前必须自检是否满足 skill 要求")仍跳过 Figma 分析、requirements grill 和 Phase 4 checker。

根因是结构性的:被约束者和解释约束者是同一个模型。只要 "ready" 仍可由 LLM 直接写入并由 LLM 自己宣布完成,它就会把未执行的 gate 合理化为已满足。

本方案把强制边界收回到 **`spec-prd` producer skill 内部**。不修改 `spec-plan`,不要求下游 skill 理解 PRD 内部规则,也不把 `spec-doc-review` 变成强制依赖。`spec-prd` 自己负责不产出假的 ready artifact。

核心机制:

1. **producer-local finalize 脚本**:新增 `finalize-prd-artifact.js`,作为 `spec-prd` 唯一合法 ready 出口。LLM 可以写 draft/checkpoint PRD,但 `ready-for-planning`、`final-prd`、`can_enter_spec_plan: yes` 只能由 finalize 在 checker 通过后写入或确认。
2. **checker must-not-ready 子集硬化**:扩展 `check-prd-artifact.js` 的 deterministic facts/reason_codes,把 design-source、grill closure、Requirement Analysis Gate closure、write_mode、clarification_evidence、can_enter_spec_plan 和 readiness evasion 作为 producer-local blocking facts。
3. **Claude Stop hook 防绕过**:新增 `prd-readiness-guard` Stop hook,停手时扫描本会话改动的 PRD artifact。只要检测到自证 ready 或 must-not-ready finding,就 block 收尾并回灌 findings,要求回到 `spec-prd` 本地 finalize/修复路径。
4. **Codex 诚实降级**:Codex 当前没有已确认等价 Stop block primitive。本方案不把强制转嫁给 `spec-plan`,也不假装双宿主对等;Codex 侧通过 `spec-prd` closeout contract、finalize 脚本和 focused tests 提供 producer-local 可验证路径,并明确 `stop_hook_blocking=not_available` 的限制。

脚本只产 deterministic facts 和 producer-local readiness receipt;LLM 仍负责语义判断、如何补 Figma、如何继续 grill、是否降级为 checkpoint。强制的是出口,不是思考路径。

## Completion Evidence (2026-06-25)

本计划已完成并标记 `status: completed`。实现范围保持 producer-local,未修改 `spec-plan`,未把 `spec-doc-review` 变成强制 gate,未手改 generated runtime mirrors。

已落地:

- `skills/spec-prd/scripts/check-prd-artifact.js`:新增 ready receipt hash/freshness facts、`blocking_reason_codes`、`ready_receipt_absent` / `ready_receipt_stale` 检测,继续输出 input-side design-source facts。
- `skills/spec-prd/scripts/finalize-prd-artifact.js`:作为 `spec-prd` 唯一合法 ready receipt 写入路径;只有 `write_mode=final-prd`、`can_enter_spec_plan: yes` 且 producer blocking reasons 清空时才写 `status: ready-for-planning` 与 `readiness_verified_*`;frontmatter 自证 ready 但无有效 receipt 时 `--check-only` 必须 block。
- `templates/claude/hooks/prd-readiness-guard`:Claude Stop hook 扫描 changed/untracked `docs/brainstorms/*-requirements.md`,调用 runtime finalize `--check-only`,并把 block message 路由回 `spec-prd` producer-local repair/finalize。
- Stop hook 输入侧断链已修复:PRD artifact 必须持久化 `source_inputs:`;hook 兼容 `prd_input:` 别名,读取原始输入文件后传给 finalize/checker,确保 Figma/design source 只存在于输入文件、PRD 正文无设计字面时仍触发 `design_source_unaccounted`。
- `skills/spec-prd/SKILL.md`、`prd-readiness-lens.md`、`prd-output-template.md`、用户手册、README 中英文、`.gitignore`/gitignore policy 和 runtime projection tests 已同步。
- Codex 侧保持诚实降级:当前无确认等价 Stop block primitive,不借用 `spec-plan` 或 plan consumer gate 兜底。

验证:

- `npm run test:unit`(162 suites / 1392 tests passed)
- `node skills/spec-prd/scripts/run-evals.js --json`(94 cases passed)
- `npm run typecheck`(127 files checked)
- `npx jest tests/unit/prd-readiness-guard-hook.test.js tests/unit/spec-prd-contracts.test.js tests/unit/runtime-plan-contracts.test.js tests/unit/changelog-format.test.js --runInBand`(39 passed)
- `npx jest tests/unit/spec-prd-contracts.test.js tests/unit/spec-prd-finalize.test.js tests/unit/changelog-format.test.js tests/unit/gitignore-policy.test.js --runInBand`(44 passed)
- `node --check skills/spec-prd/scripts/check-prd-artifact.js`
- `node --check skills/spec-prd/scripts/finalize-prd-artifact.js`
- `node --check src/cli/claude-settings.js`
- `node --check src/cli/adapters/claude.js`
- `node --check src/cli/gitignore-policy.js`
- `bash -n templates/claude/hooks/prd-readiness-guard`
- `git diff --check`
- 临时 repo 手测:hook 对无 receipt 自证 ready PRD 返回 `decision:block`;hook 对 input-only Figma source + PRD 正文无设计字面返回 `design_source_unaccounted` block。

## Goals

- 让 `spec-prd` 无法在未跑 checker、未记录 design-source inventory、未闭合 grill、未声明 Requirement Analysis Gate closure 时产出 `ready-for-planning`。
- 把强制点放在 `spec-prd` producer 内部:checker/finalize/Stop hook 都属于 PRD producer 出口,不让 `spec-plan` 或其他 consumer skill 内置 PRD 专用逻辑。
- 保持 Light contract:不引入 phase 状态机、不新增第二套 PRD artifact topology、不把语义 readiness 脚本化。
- 保持 source/runtime 边界:修改 source templates/skills/scripts/tests;runtime mirror 由 `spec-first init` 投影,不手改 `.claude/`、`.codex/`、`.agents/skills/`。

## Non-Goals

- 不修改 `spec-plan` 入口,不让 `spec-plan` 拒收 PRD 或理解 `spec-prd` reason_codes。
- 不把 `spec-doc-review` 变成高风险 PRD 的强制 gate。独立评审可以作为 advisory next action,但不能成为 `spec-prd` ready 的跨 skill 硬依赖。
- 不自动触发 doc-review、subagent 或 persona reviewer。
- 不把 checker 变成语义裁判;checker 只判可确定的声明、结构、design-source accounting、grill/readiness receipt 是否存在且自洽。
- 不保证 Codex 与 Claude 在 host-level block 能力上强制对等;Codex 限制必须诚实记录。

## Direct Evidence

- target_repo: `.`
- 三次 KAZ real-run(仓外只读引用):
  - `~/xiaobu/hsglobal/2026-06-25-115631-*.txt`
  - `~/xiaobu/hsglobal/2026-06-25-172944-*.txt`
  - `~/xiaobu/hsglobal/2026-06-25-175926-*.txt`
- 第三次日志事实:
  - 进入 `spec-prd` 后读 7 个输入文件,只问 3 个 scoping 问题。
  - 第 50-61 行直接从"三个决策已确认"进入 `Write(docs/brainstorms/kaz-market-page-mvp-requirements.md)`。
  - 第 69 行 PRD frontmatter 直接写 `status: ready-for-planning`。
  - 第 106-117 行自称 readiness ready 并推荐 `spec-plan`。
  - 全日志无 `check-prd-artifact.js`、无 checker finding count、无 `design_source_inventory`。
- 对第三次产物补跑 checker 的 deterministic 结果:
  - 35 个 findings。
  - must-not-ready reason_codes 包括 `design_source_unaccounted`、`design_source_inventory_undeclared`、`design_sources_read_undeclared`、`design_sources_unread_undeclared`、`write_mode_undeclared`、`clarification_evidence_undeclared`、`can_enter_spec_plan_undeclared`、`preflight_sweep_closure_absent`。
- 现有 hook/runtime 基建:
  - Claude source templates: `templates/claude/hooks/session-start`、`templates/claude/hooks/spec-plan-guard`。
  - Claude settings injector: `src/cli/claude-settings.js`。
  - Codex source templates: `templates/codex/hooks/session-start`、`templates/codex/hooks/hooks.json`。
- checker source: `skills/spec-prd/scripts/check-prd-artifact.js` 已输出 `spec-prd-artifact-check.v1` facts/findings,可作为 finalize 的事实输入。

## Design Principles

| 原则 | 落地 |
|---|---|
| Gate the exits, not the thinking | 只卡 PRD ready/final/closeout 出口;不规定模型必须如何分析或问几轮 |
| Producer owns producer quality | `spec-prd` 自己 finalize 自己的 artifact;不改 `spec-plan` |
| Script facts, LLM judgment | checker/finalize 产出 facts/receipt;LLM 决定修复、降级或继续 grill |
| Source-first runtime projection | 改 `skills/`、`templates/`、`src/cli/`、tests;不手改 generated mirrors |
| Honest dual-host capability | Claude Stop hook 强 block;Codex 无等价 block 时标注 degraded,不虚构强制 |

## Key Technical Decisions

### KTD-1:ready 状态只能由 finalize 盖章

新增 `skills/spec-prd/scripts/finalize-prd-artifact.js`。它接收 PRD 路径和 input refs,调用 `check-prd-artifact.js`,按 producer-local blocking 子集计算 outcome,再写入或更新 PRD 的 `Readiness Self-Check`/frontmatter receipt。

LLM 初稿只能是 draft/checkpoint:

```yaml
status: draft
write_mode: checkpoint-prd
can_enter_spec_plan: no
```

finalize 通过后才能出现 confirmed ready:

```yaml
status: ready-for-planning
write_mode: final-prd
can_enter_spec_plan: yes
readiness_verified_by: check-prd-artifact.js
readiness_verified_at: 2026-06-25T...
readiness_checker_schema: spec-prd-artifact-check.v1
readiness_finding_count: 0
```

若 LLM 直接写 `ready-for-planning` 但没有有效 receipt,checker 报 `prd_readiness_declarations_evaded`;Stop hook 必须 block。

### KTD-2:blocking 子集只覆盖可确定出口事实

producer-local blocking reason_codes:

- `core_section_missing`
- `write_mode_undeclared`
- `clarification_evidence_undeclared`
- `clarification_trace_absent`
- `can_enter_spec_plan_undeclared`
- `preflight_sweep_closure_absent`
- `design_source_inventory_undeclared`
- `design_source_coverage_undeclared`
- `design_sources_read_undeclared`
- `design_sources_unread_undeclared`
- `design_source_unaccounted`
- `input_refs_unavailable`
- `prd_readiness_declarations_evaded`
- `ready_receipt_absent`
- `ready_receipt_stale`
- `finalize_required`

Advisory/non-blocking by default:

- `placeholder_or_todo_present`
- `requirement_without_acceptance_ref` / `uncovered_requirements`
- `feature_slice_missing_acceptance_trace`
- `input_scan_degraded`

理由:前者是出口不变量;后者可能是合法 trace gap 或 LLM-owned readiness lens 需要解释的内容。

### KTD-3:Figma/design 强制通过 inventory/read/unread accounting,不强依赖 provider

输入或 PRD refs 中出现 `figma.com`、`node-id`、`Figma` 或 design-source 文件时,checker 必须要求 PRD 记录:

```yaml
design_source_inventory:
design_source_coverage:
design_sources_read:
design_sources_unread:
```

如果没有 Figma tool/provider 或无法 fetch,仍必须写 `design_sources_unread` 与原因,并由 LLM 决定 readiness 降级。未声明就是 producer-local blocking finding。

这解决第三次 real-run 的具体失败:只抄 node id 到 traceability 表不等于 design analysis;缺 inventory/coverage/read/unread 时不能 final。

### KTD-4:grill 强制通过 closure 声明,不按轮数硬编码

不规定必须问几轮,也不规定问题树路径。强制的是:

```yaml
write_mode: ask-owner-first | checkpoint-prd | final-prd | route-out
clarification_evidence: asked-owner | source-proven-no-ask | headless-degraded-logged
preflight_sweep_closure: closed | degraded | blocked
can_enter_spec_plan: yes | no
```

若仍存在会改变 WHAT、acceptance、scope、data authority、fallback display、analytics acceptance 或 source-of-truth 的 OQ,只能:

```yaml
write_mode: checkpoint-prd
can_enter_spec_plan: no
```

如果 owner 明确 cap,记录 `owner_question_progress=owner-capped` 和 cap 证据;否则不能把未闭合 OQ 包装成 "ready with assumptions"。

### KTD-5:Stop hook 是 producer 出口保险,不是跨 skill consumer gate

Claude Stop hook 的职责:

1. 找出当前 worktree 中被修改/新增的 `docs/brainstorms/*-requirements.md`。
2. 对每个 PRD 运行 runtime-projected `finalize --check-only` 或 `check-prd-artifact.js`。
3. 若 PRD 自称 ready/final 但 receipt 缺失/陈旧,或存在 blocking reason_code,返回 hook block。
4. block reason 只指向 `spec-prd` 本地修复路径:补 design inventory、继续 grill、降级 checkpoint、或运行 finalize。

Stop hook 不推荐 `spec-plan`,不调用 `spec-doc-review`,不判断 PRD 语义质量。

### KTD-6:Codex 降级不借用 `spec-plan`

Codex 当前不设计 `spec-plan-guard` 兜底,因为这会破坏 skill 独立性。Codex 侧只做:

- 投影 `finalize-prd-artifact.js` 与 checker 到 `.agents/skills/spec-prd/`。
- 在 `spec-prd` source prose 中要求 closeout 必须包含 finalize receipt。
- 在 tests/evals 中覆盖 "Codex 无 Stop block 时必须显式 `stop_hook_blocking=not_available`"。

如果未来 Codex 提供 Stop-equivalent hook,再在 Codex runtime adapter 内对齐 producer-local Stop guard;仍不修改 `spec-plan`。

## Implementation Units

### U1. checker hardening: ready evasion + receipt freshness

**Files**: `skills/spec-prd/scripts/check-prd-artifact.js`, `tests/unit/spec-prd-contracts.test.js`

**Approach**:

- 解析 frontmatter 与 `Readiness Self-Check` 中的 readiness receipt。
- 若出现 `status: ready-for-planning`、`write_mode: final-prd` 或 `can_enter_spec_plan: yes`,但没有有效 receipt,报 `prd_readiness_declarations_evaded` / `ready_receipt_absent`。
- 若 receipt 引用的 checker schema/path/input hash 与当前 PRD/input 不一致,报 `ready_receipt_stale`。
- 保持现有 `--inputs` 行为;输入存在但未传入时继续报 `input_refs_unavailable`。
- 增加 `blocking_reasons` 派生 facts,供 finalize/Stop hook 直接消费。

**Verification**:

- fixture:LLM 自写 ready 无 receipt -> blocking。
- fixture:receipt stale -> blocking。
- fixture:valid receipt + no blocking findings -> no blocking reasons。
- `node --check skills/spec-prd/scripts/check-prd-artifact.js`
- `npx jest tests/unit/spec-prd-contracts.test.js --runInBand`

### U2. producer-local finalize script

**Files**: `skills/spec-prd/scripts/finalize-prd-artifact.js`, `tests/unit/spec-prd-finalize.test.js`(新或并入现有)

**Approach**:

- CLI:
  ```bash
  node skills/spec-prd/scripts/finalize-prd-artifact.js <prd-path> --inputs <input-path>[,<input-path>...] [--check-only]
  ```
- `--check-only`:只输出 JSON receipt/failures,不写文件;供 Stop hook 使用。
- 默认模式:仅当 `blocking_reasons=[]` 时写入 confirmed receipt 与 ready fields;否则写入/保持 checkpoint receipt,并确保 `status` 不是 `ready-for-planning`。
- 写入应使用 Markdown/frontmatter 结构化更新,避免 ad hoc string surgery;无法安全更新时 fail closed,输出 reason_code。

**Verification**:

- blocking PRD finalize -> exit non-zero 或 JSON `can_finalize:false`,不写 ready。
- clean PRD finalize -> 写入 receipt,`status: ready-for-planning`。
- `--check-only` 不改文件。
- `git diff --check`。

### U3. Claude Stop hook `prd-readiness-guard`

**Files**: `templates/claude/hooks/prd-readiness-guard`(新), `src/cli/claude-settings.js`, `src/cli/adapters/claude.js`, `tests/unit/claude-settings.test.js`, `tests/unit/runtime-plan-contracts.test.js`, `tests/unit/runtime-hook-permissions.test.js`

**Approach**:

- Source template hook 读取 Stop payload,以 `$CLAUDE_PROJECT_DIR` 为 repo root。
- 只扫描 changed/untracked `docs/brainstorms/*-requirements.md`;无 PRD 改动则放行。
- 对每个 PRD 调 runtime-projected finalize `--check-only`。
- 若有 blocking reason,输出 Claude Stop hook block JSON,包含:
  - PRD path
  - finding count
  - reason_codes
  - next action:回到 `spec-prd` producer-local finalize path
- 更新 `claude-settings.js` managed hook definitions,注入 `Stop` matcher。
- 更新 clean/init/doctor/runtime plan tests,确保 source 投影和 executable bits 正确。

**Verification**:

- hook fixture:无 PRD 改动 -> allow。
- hook fixture:PRD 自证 ready 无 receipt -> block。
- hook fixture:valid receipt -> allow。
- settings 契约断言 `hooks.Stop` 安装 managed matcher。
- `bash -n templates/claude/hooks/prd-readiness-guard`。

### U4. spec-prd prose/output template/readiness lens 对齐

**Files**: `skills/spec-prd/SKILL.md`, `skills/spec-prd/references/prd-readiness-lens.md`, `skills/spec-prd/references/prd-output-template.md`, `docs/05-用户手册/22-PRD需求文档质量增强流程.md`, `README.md`, `README.zh-CN.md`

**Approach**:

- SKILL Phase 4 改为:PRD artifact closeout 必须通过 producer-local finalize;LLM 不得直接写 confirmed ready fields。
- output template 增加 `Readiness Self-Check` receipt 字段说明和 localized heading anchor 示例。
- readiness lens 明确:checker facts 是 script-owned;finalize receipt 是 producer-owned出口证明;LLM readiness judgment 必须消费 receipt,不能替代 receipt。
- 用户手册说明:design-source 输入必须形成 inventory/coverage/read/unread;无法读设计时必须降级而非静默 ready。

**Verification**:

- `tests/unit/spec-prd-contracts.test.js` prose anchors。
- `node skills/spec-prd/scripts/run-evals.js --json`。

### U5. Codex honest degradation

**Files**: `src/cli/adapters/codex.js`, `templates/codex/hooks/hooks.json`(仅在存在可用 Stop-equivalent 时), `tests/unit/init-plan.test.js`, `tests/unit/runtime-plan-contracts.test.js`

**Approach**:

- 不新增 `spec-plan-guard` 或 plan consumer gate。
- 确保 finalize/checker scripts 被 source package/runtime projection 覆盖。
- 若 Codex project hook schema 只支持 SessionStart,文档和 tests 记录 `stop_hook_blocking=not_available`。
- 若实测支持 Stop-equivalent,按 U3 复用 producer-local guard;否则保持诚实降级。

**Verification**:

- Codex runtime package 包含 finalize/checker scripts。
- 无 `spec-plan` 兜底文本或 hook。
- contract test 覆盖 degradation wording。

### U6. Changelog, tests, fresh-source eval

**Files**: `CHANGELOG.md`, `docs/validation/spec-prd/`

**Approach**:

- CHANGELOG 记录 producer-local gate、Claude hard block、Codex degraded、未改 `spec-plan`。
- fresh-source eval 复核:
  - Figma/source input 不能只抄 node id 后 ready。
  - 一轮 scoping 后仍有 load-bearing OQ 时只能 checkpoint。
  - 未跑 finalize receipt 不能 ready。
  - Stop hook block message 是否把 agent 拉回 `spec-prd` 本地修复,而不是推荐 plan。

**Verification**:

- `npm run typecheck`
- `npm run test:unit`
- `node skills/spec-prd/scripts/run-evals.js --json`
- `npx jest tests/unit/changelog-format.test.js --runInBand`
- `git diff --check`

## Acceptance Criteria

- A PRD artifact cannot validly contain `status: ready-for-planning` without a current producer-local finalize receipt.
- A PRD with design refs but no `design_source_inventory`/coverage/read/unread is blocked before ready closeout.
- A PRD with unresolved load-bearing owner-owned WHAT/acceptance/scope OQ cannot be finalized as `final-prd`.
- Claude Stop hook blocks PRD ready closeout even if the model never voluntarily runs checker.
- Stop hook block message routes back to `spec-prd` local repair/finalize, not to `spec-plan`.
- `spec-plan` source remains untouched by this feature.
- Codex limitation is explicit; no false claim of hard Stop blocking unless the runtime actually supports it.

## Risks & Mitigations

| 风险 | 缓解 |
|---|---|
| finalize 写 Markdown/frontmatter 出错 | 使用结构化 frontmatter parser;无法安全更新时 fail closed;`--check-only` 供 hook 使用 |
| Stop hook 误伤普通会话 | 只对 changed/untracked `docs/brainstorms/*-requirements.md` 生效 |
| checker 被过度 coercive | 只 block 出口不变量;保留 trace gap/placeholder/coverage gap 的 LLM-owned 解释空间 |
| LLM 继续绕过 finalize | Claude Stop hook 拦截 ready/final 自证;Codex 诚实降级 |
| 跨 skill 耦合复发 | acceptance 明确 `spec-plan` 不改、doc-review 非强制依赖 |
| `ready_receipt_stale` hash 噪声 | receipt 只 hash PRD body + input refs;修改非语义字段需定义忽略规则 |

## Sequencing

1. **U1 checker hardening**:先让自证 ready 和 receipt 缺失可确定检测。
2. **U2 finalize script**:建立 producer-local 唯一 ready 出口。
3. **U3 Claude Stop hook**:把 "必须过 finalize/checker" 移出模型自觉。
4. **U4 prose/template/readiness 对齐**:让 workflow 文本消费新出口,不再允许 LLM 直写 ready。
5. **U5 Codex honest degradation**:记录能力边界,不引入 `spec-plan` 兜底。
6. **U6 validation/changelog/eval**:用真实 KAZ failure shape 回归。

每步运行最窄验证;U6 后跑 `npm run test:unit` 与 `npm run typecheck`。runtime 刷新由用户通过 `spec-first init` 控制。
