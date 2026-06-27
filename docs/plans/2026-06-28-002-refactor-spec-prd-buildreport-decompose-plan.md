---
title: "refactor: 拆分 buildReport God 函数并集中 claimsReady 策略"
type: refactor
status: completed
date: 2026-06-28
spec_id: 2026-06-28-002-refactor-spec-prd-buildreport-decompose
---

# refactor: 拆分 buildReport God 函数并集中 claimsReady 策略

##    Résumé

把 `check-prd-artifact.js` 的 `buildReport`（260 行、53 个局部变量、20 处 `claimsReady` 引用）拆为三个分阶段纯函数 `parseStructure / computeFacts / deriveFindings`，并把 15 处散布的 `if (claimsReady && X && !Y)` 策略集中到单一 `gateReadyClaims(facts, structure)` 函数。每个阶段独立可测，单元测试覆盖不再依赖整份 PRD fixture。行为不变，既有 parity/freeze/contracts/finalize 护栏全程锁住不变量。

---

## Decision Brief

- **Recommended approach:** 三阶段拆分（parse → facts → findings），claimsReady 集中为 `gateReadyClaims`，阶段间通过参数传递而非闭包隐式共享。`analyzeOutstandingQuestions` 保持不动（已属独立函数）。新增阶段导出供 unit test 直接调用。
- **Key decisions:** `claimsReady` 从 `computeFacts` 结果中读取（作为 `facts.ready_claim_present`，已在现有 facts 中），不引入新字段；`gateReadyClaims` 接受 `{facts, structure}` 返回 finding 数组；`parseStructure` 聚合现有纯解析调用但不改其签名。
- **Validation focus:** contracts 33 端到端测试（行为不变量）+ facts key-set freeze（字段不增减）+ parity 闸（BLOCKING 码不变）。`gateReadyClaims` 新增单元测试（全 `claimsReady` 路径的真值表）。
- **Largest risks / boundaries:** 拆分过程中意外引入引用漏洞（如某处 `claimsReady` 未迁移，变成永远 false 或永远 true）。通过 contracts 端到端 + checker-unit 的 OQ 路径测试护栏。

---

## Problem Frame

`buildReport`（:848-1107，260 行，53 个局部变量）违反 SRP：
- I/O（input 扫描）、纯解析（heading/frontmatter/sections）、facts 计算（布尔派生）、policy（何时 push 哪个 finding）全混在一个函数。
- `claimsReady`（:916-918）是整个 policy 层的主闸，从定义到末尾被引用 20 次，散布在 15 个独立 `if` 块中。
- 圈复杂度极高 → 路径组合不可穷举 → contracts 测试 156KB 仍靠整份 PRD fixture 驱动所有路径，无法针对单一条件做最小化测试。

上一轮已从 buildReport 中抽取 `analyzeOutstandingQuestions`（:492-609），已抽 `lib/reason-codes.js`，已导出纯函数。本 plan 进一步拆分 buildReport 本体。

---

## Requirements

- R1. 把 `buildReport` 拆为三个分阶段纯函数：`parseStructure(target, text)` / `computeFacts(structure, inputs, options)` / `deriveFindings(facts, structure)`，`buildReport` 降级为编排调用三者的薄外壳，保持公开接口不变（同名导出、同参数签名、同返回形状）。
- R2. `gateReadyClaims(facts, structure)` 集中所有 `claimsReady` 相关 finding，由 `deriveFindings` 调用；消除 `buildReport` 原 15 处 `if (claimsReady && X && !Y)` 散布。
- R3. 新导出三个阶段函数供单元测试直接调用（在现有 `module.exports` 增列，零行为变更）。
- R4. `buildReport` 的对外接口不变：同名、同参数（`target, text, options`）、同返回形状（`{schema_version, target, status, facts, findings}`）。
- R5. `facts` key-set 不变（freeze 测试护栏），finding 形状不变，`BLOCKING_REASON_CODES` 不变（parity 闸护栏），`lib/reason-codes.js` 不变。
- R6. 既有闸全绿：parity 2 + checker-unit 21 + reason-codes-unit 12 + contracts 33 + finalize 23 + hook 21 + claude-settings 31。
- R7. 新增 `gateReadyClaims` 单元测试（直接调用，无需 PRD fixture）。

---

## Scope Boundaries

- 不改 `analyzeOutstandingQuestions`（已属独立函数，本 plan 不动）。
- 不改 `looksLikeCheckableRef` / `traceRowBindsOq` 等已导出纯函数（P1 已完成）。
- 不改 `lib/reason-codes.js`（P0#2+P4 已完成）。
- 不抽共享解析 lib（P3 已评估延迟）。
- 不改 finding 形状（P5 已文档化延迟）。
- 不改 `finalize-prd-artifact.js`（其编排逻辑独立，调用 `buildReport` 只消费结果）。

### Deferred to Follow-Up Work

- `analyzeOutstandingQuestions` 内部进一步拆分：未来需要时做，本 plan 边界止于 buildReport。
- finding 细节字段 schema freeze：等下游消费者有需求时触发（已记录 `docs/solutions/architecture-patterns/spec-prd-finding-schema-freeze-deferred-2026-06-28.md`）。

---

## Completion Criteria

- `buildReport` 函数体降至 20 行以下（只含编排 + 一次 return）。
- `gateReadyClaims` 有独立单元测试，直接传 `{facts, structure}` 构造体，不需要整份 PRD fixture。
- 全部护栏绿（R6）。

---

## Direct Evidence Readiness

- target_repo: spec-first（本仓）
- evidence_sources: direct source reads（check-prd-artifact.js 全文）、grep 提取 claimsReady 引用数 / buildReport 局部变量数
- source_refs: `skills/spec-prd/scripts/check-prd-artifact.js:848-1107`
- current_revision: a1a87324（含 P0#1/P1/P0#2+P4 本轮未提交改动）
- worktree_status: 本轮改动未提交
- confidence: high（已完整读 buildReport 并精确量化）
- limitations: `gateReadyClaims` 单元测试的边界条件（which conditions trigger which finding）需在实现时逐一确认；contracts 端到端是护栏，不是等价性证明。

---

## Direct Evidence

- repo_scope: `skills/spec-prd/scripts/check-prd-artifact.js`
- source_reads_completed: buildReport(:848-1107), claimsReady 定义(:916-918) + 20 处引用, parseHeadings/parseFrontmatter/sectionRange 等纯解析调用位置, analyzeOutstandingQuestions(:492-609)
- key_findings:
  - buildReport 260 行，53 个局部变量；可分为三组：① 纯解析（lines/headings/frontmatter/sections）~15个变量 ② facts 计算（布尔派生、hash、counts）~25个变量 ③ policy（findings push 条件）~13个变量
  - `claimsReady = frontmatter.fields.status === 'ready-for-planning' || writeModeIsFinalPrd || canEnterSpecPlanValue === 'yes'`（:916-918），同时等于 `facts.ready_claim_present`（:1073）——可从 computeFacts 结果中读取，无需重算
  - `needsReadinessDeclarations`（:912）在 findings policy 中也被大量引用（6 处）——与 claimsReady 同属 policy 派生布尔，均可下放到 gateReadyClaims
  - `preflightSweepClosureValue`（:905）在 findings policy 中被 4 处引用——需要在 structure 或 facts 中传递
- limitations: gateReadyClaims 内部子条件数量需实现时数准

---

## Context & Research

### Relevant Code and Patterns

- `skills/spec-prd/scripts/check-prd-artifact.js:848-1107` — buildReport 现状
- `skills/spec-prd/scripts/check-prd-artifact.js:492-609` — analyzeOutstandingQuestions 先例（已独立，本拆分参考其结构）
- `skills/spec-prd/scripts/lib/reason-codes.js` — 已抽分类法 lib（本 plan 消费，不修改）
- `tests/unit/spec-prd-checker-unit.test.js` — in-process 单测先例（gateReadyClaims 单测跟随此模式）
- `tests/unit/spec-prd-finalize.test.js:430` — facts key-set freeze（不变量护栏）

### Institutional Learnings

- P0#2+P4 经验：每次抽取前先用等价性验证（对全 N 元素逐一比对新旧行为），然后靠端到端护栏兜底。`gateReadyClaims` 迁移后需同样验证 15 个 if 块全部迁移、无残留。
- P1 经验：导出纯函数零行为变更；新增 module.exports 列项是最安全的 API 扩展。

---

## Key Technical Decisions

- **三阶段划分**：`parseStructure`（纯文本→结构体：lines/headings/frontmatter/sections）→ `computeFacts`（结构体+inputs→facts，含 claimsReady/needsReadinessDeclarations 等布尔）→ `deriveFindings`（facts+structure→findings）。`gateReadyClaims` 是 `deriveFindings` 的内聚子段，由其调用。
- **claimsReady 来源**：不新增 facts 字段——`claimsReady` 已等价于 `facts.ready_claim_present`（:1073），`computeFacts` 返回时设置此字段，`gateReadyClaims` 直接读 `facts.ready_claim_present`。`needsReadinessDeclarations` 和 `preflightSweepClosureValue` 也放入 facts（已在 `facts.preflight_sweep_closure`，:1071）。
- **buildReport 薄外壳**：`buildReport` 编排三阶段 + 合并 `oqAnalysis.reasonCodes`（来自 `analyzeOutstandingQuestions`）+ 计算 `blockingReasons` + return。目标函数体 ≤20 行。
- **阶段函数导出**：`parseStructure / computeFacts / deriveFindings / gateReadyClaims` 加入 `module.exports`（与现有 7 个纯函数同模式）。

---

## Open Questions

### Resolved During Planning

- gateReadyClaims 是否需要新字段：不需要，所有需要的布尔已在 computeFacts 的 facts 输出里（ready_claim_present / preflight_sweep_closure / write_mode 等）。
- analyzeOutstandingQuestions 是否迁入某阶段：保持独立函数，由 deriveFindings 调用（不改其签名）。

### Deferred to Implementation

- `gateReadyClaims` 内部有多少个 if 条件需要迁移：实现时逐行清点 buildReport 中所有 `if (claimsReady && ...)` 和 `if (needsReadinessDeclarations && ...)` 块，确保 15 个全部迁移。
- 是否需要 `needsReadinessDeclarations` 也进入 gateReadyClaims：大概率是，但实现时确认。

---

## Output Structure

    skills/spec-prd/scripts/
    └── check-prd-artifact.js   (修改：三阶段拆分，module.exports 增列)
    tests/unit/
    └── spec-prd-checker-unit.test.js  (修改：增加 gateReadyClaims 单测)

---

## Implementation Units

### U1. 抽取 `parseStructure` + `computeFacts` 两个阶段函数

**Goal:** 把 buildReport 的纯解析部分（:848-~900）与 facts 计算部分（:900-~970）拆为两个独立纯函数，保持 buildReport 正确调用两者。

**Requirements:** R1, R5

**Dependencies:** None（不改 lib/reason-codes，不改现有导出纯函数）

**Files:**
- Modify: `skills/spec-prd/scripts/check-prd-artifact.js`

**Approach:**
- `parseStructure(target, text)` 返回 `{lines, frontmatter, headings, normalizedTarget, prdHash, featureSliceGaps, priorities, assumptionRowCount, ...sections}`（所有纯文本→结构体的派生）。
- `computeFacts(structure, inputs, options)` 接受 parseStructure 结果 + inputs 数组 + projectRoot，返回 facts 对象（与现有 buildReport facts 完全相同）。facts 中已含 `ready_claim_present` / `preflight_sweep_closure` 等 policy 所需布尔。
- buildReport 调用：`const structure = parseStructure(target, text); const facts = computeFacts(structure, options.inputs || [], options);`，然后继续 findings 构建。

**Test scenarios:**
- 不变量: 直接调用 `parseStructure` 后 `computeFacts` 组合的输出 facts，与原 `buildReport` 的 `facts` 字段完全相等（对同一 fixture 比较 JSON.stringify）。
- Integration: contracts 33 端到端全绿（buildReport 行为不变）。
- Integration: finalize 23 测试全绿（finalize 只消费 buildReport 结果，行为不变）。

**Verification:**
- `npx jest spec-prd` 全绿（含 contracts + finalize + parity + checker-unit + reason-codes-unit）。

---

### U2. 抽取 `gateReadyClaims` + 完成 `deriveFindings`

**Goal:** 把 buildReport 中所有 `if (claimsReady && X)` / `if (needsReadinessDeclarations && X)` / `if (preflightSweepClosureValue === X && claimsReady)` policy 块迁移到 `gateReadyClaims`；`deriveFindings` 包含所有 findings 生成逻辑，调用 `gateReadyClaims`；buildReport 降为薄外壳。

**Requirements:** R2, R1, R4

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-prd/scripts/check-prd-artifact.js`

**Approach:**
- `deriveFindings(facts, structure)` 调用：结构性检查（frontmatter/section/path/placeholder）→ 输入扫描 findings → `gateReadyClaims(facts, structure)` → OQ 分析（`analyzeOutstandingQuestions`）→ design 相关 → checkpoint 矛盾 → closure blocker（`isClosureBlocker`）。
- `gateReadyClaims(facts, structure)` 读 `facts.ready_claim_present` / `facts.preflight_sweep_closure` / `facts.write_mode` / `facts.clarification_evidence` / `facts.can_enter_spec_plan` / `facts.ready_receipt_present` / `facts.ready_receipt_current` 等 facts 布尔，不重算 claimsReady。
- buildReport 薄外壳：调用三阶段，合并 oqAnalysis reasonCodes，计算 blockingReasons，return。

**Execution note:** 实现前先 grep 清点 buildReport 中所有 `claimsReady` / `needsReadinessDeclarations` 引用，确认 15 个全部迁移后再提交。

**Test scenarios:**
- Integration: contracts 33 端到端全绿。
- Integration: hook 测试（prewrite/readiness）全绿。
- Edge case: `claimsReady=false` 时，gateReadyClaims 返回空数组（不产生任何 ready-claim violations）。
- Edge case: `claimsReady=true` + preflight_sweep_closure=blocked → `preflight_sweep_closure_blocked` finding 出现。
- Edge case: checkpoint_prd + claimsReady=true → `checkpoint_claims_ready` finding 出现。

**Verification:**
- buildReport 函数体 ≤20 行。
- `grep -c "claimsReady\|needsReadinessDeclarations" buildReport 实体` = 0（全迁移到 gateReadyClaims 或 computeFacts）。

---

### U3. 导出新阶段函数 + gateReadyClaims 单元测试

**Goal:** 导出新函数，加 gateReadyClaims 单元测试（直接传构造体，无需 PRD fixture）。

**Requirements:** R3, R7, R6

**Dependencies:** U2

**Files:**
- Modify: `skills/spec-prd/scripts/check-prd-artifact.js`（module.exports 增列）
- Modify: `tests/unit/spec-prd-checker-unit.test.js`（新增 gateReadyClaims describe）

**Approach:**
- `module.exports` 增列：`parseStructure / computeFacts / deriveFindings / gateReadyClaims`。
- `gateReadyClaims` 单测：构造 minimal facts 对象（直接 `{ready_claim_present: true, write_mode: 'final-prd', ...}`），断言指定 finding 出现/不出现。覆盖：claimsReady=false 空结果；claimsReady+preflight_blocked；claimsReady+checkpoint；claimsReady+receipt_absent；claimsReady+receipt_stale。

**Test scenarios:**
- Happy path: `claimsReady=false` → `gateReadyClaims` 返回 `[]`
- Happy path: `claimsReady=true` + `ready_receipt_present=true` + `ready_receipt_current=true` + 无其他 gap → 返回 `[]`
- Edge case: `ready_receipt_present=false` → `ready_receipt_absent` finding
- Edge case: `preflight_sweep_closure='blocked'` + `claimsReady=true` → `preflight_sweep_closure_blocked`
- Edge case: `write_mode='checkpoint-prd'` + `claimsReady=true` → `checkpoint_claims_ready`

**Verification:**
- `npx jest spec-prd tests/unit/prd-readiness-guard-hook.test.js tests/unit/prd-prewrite-guard-hook.test.js tests/unit/claude-settings.test.js` 全绿。
- `npm run typecheck` 通过。

---

## System-Wide Impact

- **Interaction graph:** `finalize-prd-artifact.js` 调用 `buildReport` 仅消费结果，接口不变；hook 模板通过 subprocess 调用 finalize，无影响。
- **Unchanged invariants:** `buildReport` 公开接口（名称/参数/返回形状）不变；`facts` key-set 不变（freeze 测试锁）；`BLOCKING_REASON_CODES` 不变（parity 闸锁）；finding 形状不变；lib/reason-codes.js 不变。
- **Integration coverage:** contracts 33 端到端 + finalize 23 + hook 21 + claude-settings 31 提供行为等价护栏。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| claimsReady 引用遗漏迁移（某处变成永远 false/true） | U2 执行前 grep 清点全部引用，U2 完成后 grep 验证 buildReport 实体零引用；contracts 端到端作第二道护栏 |
| computeFacts 字段遗漏（某个 facts 字段未迁移） | U1 完成后对同一 fixture 做 `JSON.stringify(facts)` 等价验证；facts freeze 测试作第三道护栏 |
| deriveFindings 调用顺序与原 buildReport 不一致（导致 findings 数组顺序变化） | contracts 测试检查特定 reason_code 存在性（非 order-sensitive），顺序变化通常不触发 fail；若有 order-sensitive 断言需提前识别 |
| parseStructure 把不纯的 I/O（input 扫描）纳入 → 阶段不再纯函数 | input 扫描（`scanInputDesignRefs`）归入 computeFacts，不进 parseStructure；parseStructure 只接受 `target` 和 `text` 两个字符串参数，是纯函数 |

---

## Documentation / Operational Notes

- 每个 U 完成须同步 CHANGELOG（refactor 条目，无 user-visible 标注，记录 source surface + 验证命令）。
- `scripts/lib/` 不需要 `spec-first init`（source，非 generated runtime mirror）。
- 不需要更新 README（内部重构，无用户可见行为变化）。

---

## Sources & References

- **Origin document:** 无（refactor plan，源自 spec-prd code review 工程加固分析）
- Related code: `skills/spec-prd/scripts/check-prd-artifact.js:848-1107`（buildReport）、`:492-609`（analyzeOutstandingQuestions）
- Related plans: `docs/plans/2026-06-28-001-refactor-spec-prd-reason-codes-module-plan.md`（P0#2+P4，已完成，本 plan 基于其结果）
- Related tests: `tests/unit/spec-prd-contracts.test.js`、`tests/unit/spec-prd-finalize.test.js`、`tests/unit/spec-prd-checker-unit.test.js`
