---
title: "spec-write-tasks 决断式拆分推荐 + plan→tasks→review 跨文档审查 任务包"
type: "task-pack"
status: "derived"
date: "2026-06-07"
spec_id: "tasks-split-chain-review"
source_plan: "docs/plans/2026-06-07-001-feat-tasks-split-and-chain-review-plan.md"
source_plan_hash: "sha256:7f3f868298ab5760aa9007d694e1d75410a126b618912d88a0ffed4c81717f07"
generated_by: "spec-write-tasks"
mode: "derived"
target_repo: "spec-first"
source_sections:
  - "Goals"
  - "Non-Goals"
  - "Key Technical Decisions"
  - "Implementation Units"
  - "Sequencing"
---

# Task Pack: spec-write-tasks 决断式拆分推荐 + 跨文档审查

## Overview

把 source plan 的 6 个实现单元编译为 5 个文件不重叠的执行任务。关键编译决策:plan 的 U1 与 U3 都修改 `skills/spec-write-tasks/SKILL.md`,同 wave 文件重叠会被确定性校验拒绝,故合并为单个 task(T001),作为对 spec-write-tasks skill 的一次内聚 prose 改动闭环。其余单元按文件边界切为不重叠任务,可比 plan 原 wave 划分有更高并行度。

全部任务为 source-of-truth prose/contract 改动 + 测试,零新脚本/schema/入口,决断式推荐而非自动执行。

## Source Summary

- **Source plan:** `docs/plans/2026-06-07-001-feat-tasks-split-and-chain-review-plan.md`
- **Task-ready branch:** `compile`(scope/Non-Goals 清晰、G/NG/KTD 可追踪、单元有具体 files、test scenarios 可执行、有 spec_id)。
- **Consumed sections:** Goals、Non-Goals、Key Technical Decisions、Implementation Units、Sequencing、Risks。
- **Scope boundaries shaping split:** NG1(不自动 invoke doc-review)、NG2(不建三向 diff 引擎)、NG3(不新增入口)、NG4(不造复杂度脚本)、NG6(覆盖盘点不升级为强制三文档输入)直接约束各 task 的 `stop_if`。
- **Implementation-time unknowns:** findings-schema 是否需新字段(确认走现有 schema,仅执行期发现确需才升级);templates 是否 inline handoff prose(执行期确认,多为 thin launcher);README 是否更新(A3)。

## Traceability Matrix

| Source Unit | Goal / Decision | Task(s) | Validation |
| --- | --- | --- | --- |
| U1 + U3 | G1, G3, NG1, NG4, NG5(KTD1/KTD3 为决策依据,见 context_refs) | T001 | fresh-source eval(决断推荐/NG1/plan-结构主判据,在 T005 执行)+ evals + lint |
| U2 | G2, KTD2 | T002 | spec-plan/spec-work contract 测试 + 正向最小检查 + lint |
| U4 | G4, KTD4, NG2, NG6 | T003 | spec-doc-review-contracts 测试 + fresh-source eval(ID 覆盖/limitation 分支,在 T005 执行)|
| U5 | G5, KTD5 | T004 | contract consumer 段内容准确 + host-agnostic 措辞审查 |
| U6 | G1, G2, G3, G4, G5 | T005 | `npm test` 全链路 + lint + 正向最小检查可区分 + fresh-source eval 汇总 + 双宿主 init/doctor + CHANGELOG |

每个 Goal 至少被一个 task 覆盖(G1-G4 的可机器执行验证层在 T005);Non-Goals 作为 `stop_if` 边界,不产生独立 task。语义强度(决断 vs 中性)的判定集中在 T005 的 fresh-source eval。

## Task Graph

- **T001、T003** 各自从 plan 独立可实现,文件不重叠(spec-write-tasks/* vs spec-doc-review/*)→ Wave 1 并行。
- **T002** 真实依赖 T001:其复杂度措辞必须与 T001 已落地判据逐字一致,需 T001 冻结后才可校验 → Wave 2。
- **T004** 记录/对齐 T001-T003 建立的消费姿态与双宿主措辞 → 真实依赖 T001、T002、T003 → Wave 3。
- **T005** 测试并验证全部改动、跑 eval 与双宿主 init/doctor、CHANGELOG/README → 依赖 T001-T004 → Wave 4。

## Execution Waves

- **Wave 1(并行):** T001、T003
- **Wave 2:** T002(dep T001,需 T001 判据冻结以校验措辞一致)
- **Wave 3:** T004(dep T001-T003)
- **Wave 4:** T005(dep T001-T004,集中执行 eval + 双宿主 init/doctor)

> **相对 plan 的 wave 调整说明:** plan Sequencing 设想 U1/U4 并行;task pack 因 U1+U3 共改 SKILL.md 合并为 T001,并把 T002 的"措辞与 T001 一致"视为真实输出依赖(故 T002 移至 Wave 2 而非与 T001 并行),把 plan 中较晚的契约/双宿主对齐(U5)与验证(U6)落到 Wave 3/4。文件不重叠已逐任务核对(见 Validation Notes),无同 wave 共享文件。

## Task Pack Contract

```json
{
  "schema_version": "task-pack/v1",
  "execution_waves": [
    { "wave": 1, "tasks": ["T001", "T003"] },
    { "wave": 2, "tasks": ["T002"] },
    { "wave": 3, "tasks": ["T004"] },
    { "wave": 4, "tasks": ["T005"] }
  ],
  "tasks": [
    {
      "task_id": "T001",
      "source_unit": "U1",
      "requirement_refs": ["G1", "G3", "NG1", "NG4", "NG5"],
      "goal": "在 spec-write-tasks SKILL 中把拆分判据改为以 source plan 自身结构为主、task-governance-signals 为可选交叉校验,并把高风险包的 review handoff 决断为 next_action: review-task-pack(NG1 加固:需人类决策、自治宿主须 surface 不自动 dispatch)。",
      "dependencies": [],
      "files": [
        "skills/spec-write-tasks/SKILL.md",
        "skills/spec-write-tasks/references/task-quality-guide.md",
        "skills/spec-write-tasks/evals/boundary-cases.json"
      ],
      "context_refs": [
        "docs/plans/2026-06-07-001-feat-tasks-split-and-chain-review-plan.md#U1-spec-write-tasks-决断式拆分推荐消费-task-governance-signals",
        "docs/plans/2026-06-07-001-feat-tasks-split-and-chain-review-plan.md#U3-tasksdoc-review-决断式推荐-handoff复用-next_action-review-task-pack",
        "skills/spec-write-tasks/SKILL.md#Task-Ready-Check",
        "skills/spec-write-tasks/SKILL.md#Final-Decision-Envelope",
        "docs/contracts/governance/task-governance-signals.md"
      ],
      "entry_hint": "从 SKILL 的 Task-Ready Check 段与 Final Decision Envelope/Handoff 段入手;plan KTD1/KTD3 是判据来源。",
      "test_focus": "决断式推荐措辞(plan 结构为主判据、helper 为可选交叉校验且无 --input 时不据其判低风险)、review_gate=required 包推荐 review-task-pack、NG1 no-auto-chain 措辞。",
      "done_signal": "SKILL prose 体现 plan-结构主判据 + helper 可选交叉校验 + 高风险包 review handoff + 自治宿主须 surface;task-quality-guide.md 的 Task-ready Source Plan 段含 advisory 信号说明;boundary-cases.json 含高风险包推荐 review 用例;lint 通过。语义强度(决断 vs 中性)的判定延迟到 T005 的 fresh-source eval,本任务 done 不含语义强度证明。",
      "parallelizable": true,
      "risk_note": "误把 task-governance-signals 重述为强制门禁或主判据会复活 silent-lightweight bug 与多真相源。",
      "review_gate": "required",
      "review_focus": "决断 vs 中性措辞是否落地、NG1 是否在 prose 层成立(不依赖宿主暂停)、plan-结构主判据 vs helper 可选的边界、未把 advisory 当 confirmed。",
      "stop_if": "需要新增复杂度评分脚本/schema、新增 workflow 入口,或让 spec-write-tasks 自动调用 doc-review。",
      "wave": 1
    },
    {
      "task_id": "T002",
      "source_unit": "U2",
      "requirement_refs": ["G2", "KTD2"],
      "goal": "把 spec-plan 的 task-pack handoff 菜单与 spec-work 的 pre-work suitability check 文案从中性 offer 升级为基于 plan 复杂度证据的决断式推荐,保留用户确认,且复杂度措辞与 T001 已落地判据逐字一致。",
      "dependencies": ["T001"],
      "files": [
        "skills/spec-plan/references/plan-handoff.md",
        "skills/spec-plan/SKILL.md",
        "skills/spec-work/SKILL.md"
      ],
      "context_refs": [
        "docs/plans/2026-06-07-001-feat-tasks-split-and-chain-review-plan.md#U2-spec-plan-spec-work-handoff-文案升级为决断式推荐",
        "skills/spec-plan/references/plan-handoff.md",
        "skills/spec-work/SKILL.md"
      ],
      "entry_hint": "plan-handoff.md Option 2(行 42/51);spec-plan/SKILL.md 的 Phase 5.4 Question/Options 菜单块(约行 752-761,含全部 5 个 option)是 plan-handoff.md 的 inline 副本需整块同步;spec-work pre-work suitability check 行 204-207。",
      "test_focus": "handoff 仍 user-confirmed、未出现 auto-run/auto-chain 措辞;文案体现复杂度理由 + 代价 Y;SKILL.md 整个菜单块与 plan-handoff.md 一致;复杂度判据措辞与 T001 一致。",
      "done_signal": "三处文案为决断式推荐且保留用户选择;spec-plan/SKILL.md Phase 5.4 菜单块与 plan-handoff.md 同步;复杂度判据措辞与 T001 落地版本一致;contract 测试与 lint 通过。",
      "parallelizable": false,
      "risk_note": "只改 plan-handoff.md 而漏改 SKILL.md 的 inline 菜单副本会造成不同加载路径文案漂移;与 T001 判据措辞不一致会让两条入口给出不同复杂度标准。",
      "review_gate": "required",
      "review_focus": "inline 菜单整块是否同步、是否保持 user-confirmed(无 auto-chain)、复杂度理由与 T001 落地判据逐字一致。",
      "stop_if": "需要把 handoff 改成自动执行/自动串联,或引入新的菜单选项/入口。",
      "wave": 2
    },
    {
      "task_id": "T003",
      "source_unit": "U4",
      "requirement_refs": ["G4", "KTD4", "NG2", "NG6"],
      "goal": "在 spec-doc-review 的 task-pack 审查路径补一个 bounded ID 级 requirements↔tasks 覆盖盘点:未被引用的 R/F/AE 作为覆盖 gap finding(走现有 findings-schema.json),origin 不可达按决策树记 limitation,不升级为强制三文档输入。",
      "dependencies": [],
      "files": [
        "skills/spec-doc-review/SKILL.md",
        "skills/spec-doc-review/references/subagent-template.md"
      ],
      "context_refs": [
        "docs/plans/2026-06-07-001-feat-tasks-split-and-chain-review-plan.md#U4-spec-doc-review-task-pack-审查补-requirementstasks-覆盖盘点",
        "skills/spec-doc-review/SKILL.md#Classify-Document-Type",
        "skills/spec-doc-review/references/findings-schema.json",
        "docs/contracts/workflows/review-finding.md"
      ],
      "entry_hint": "SKILL Phase 1 task-pack 分类段(行 120-131)旁补覆盖盘点;finding 走 references/findings-schema.json(P0-P3)。",
      "test_focus": "ID 级覆盖 gap finding 产出、origin 不可达三分支 limitation、finding 走现有 findings-schema(非新 schema)、不强制三文档输入。",
      "done_signal": "task-pack 审查含 ID 覆盖盘点;origin 可达性决策树三分支明确;spec-doc-review-contracts 断言 bounded lens + findings-schema 落地;lint 通过。",
      "parallelizable": true,
      "risk_note": "把覆盖盘点写成需求/计划/任务三文档并排重审或语义 diff,会违反 NG2/NG6 并膨胀为状态机。",
      "review_gate": "required",
      "review_focus": "ID 级覆盖边界(不碰语义漂移)、finding 落在 findings-schema.json、origin 不可达不阻断、未升级强制三文档输入。",
      "stop_if": "需要新增 finding 类别/新 schema、需要把 requirements/plan 变成 task-pack review 的强制输入,或需要做语义级三向 diff。",
      "wave": 1
    },
    {
      "task_id": "T004",
      "source_unit": "U5",
      "requirement_refs": ["G5", "KTD5"],
      "goal": "在 task-governance-signals 合同新增 consumers 段记录 spec-write-tasks(可选交叉校验、collection_status 降级规则),并审查全部改动 prose 的双宿主入口措辞确保 host-agnostic。",
      "dependencies": ["T001", "T002", "T003"],
      "files": [
        "docs/contracts/governance/task-governance-signals.md"
      ],
      "context_refs": [
        "docs/plans/2026-06-07-001-feat-tasks-split-and-chain-review-plan.md#U5-Contracts-与双宿主对齐",
        "docs/contracts/governance/task-governance-signals.md",
        "skills/using-spec-first/SKILL.md"
      ],
      "entry_hint": "task-governance-signals.md 当前无 consumers 段需新增;执行者须 grep templates/claude/commands/spec/{plan,work,doc-review}.md 确认是否 inline 了被改 handoff prose——确认无则跳过,有则纳入本任务文件边界(多为 thin launcher)。",
      "test_focus": "consumer 段含 spec-write-tasks 与降级规则;改动 prose 的 spec-* 与 spec-* 措辞并列/占位化(可 grep 验证);template 是否 inline handoff prose 已确认。",
      "done_signal": "contract consumers 段落地且内容准确(spec-write-tasks 列为可选交叉校验非主判据 + collection_status 降级规则);改动 prose 双宿主措辞审查通过;template inline 情况已 grep 确认。双宿主 init+doctor 验证由 T005 在全部 source 改动落地后统一执行。",
      "parallelizable": false,
      "risk_note": "手改 runtime mirror 而非经 spec-first init 重生成会破坏 source/runtime 边界;在 T001-T003 未落地时跑 init+doctor 会验证到旧 skill 状态,故移至 T005。",
      "review_gate": "required",
      "review_focus": "consumer 段准确(可选交叉校验非主判据)、host-agnostic 措辞、不手改 runtime mirror。",
      "stop_if": "templates 改动超出同步既有 handoff prose 的范围,或需要修改 task-governance-signals 脚本/ schema 行为。",
      "wave": 3
    },
    {
      "task_id": "T005",
      "source_unit": "U6",
      "requirement_refs": ["G1", "G2", "G3", "G4", "G5"],
      "goal": "补齐 G1-G4 的 contract/unit 测试(含常跑正向最小检查)、执行 fresh-source eval(降级时诚实记录)、跑双宿主 init+doctor 对齐、同步 CHANGELOG 与用户可见时的 README。",
      "dependencies": ["T001", "T002", "T003", "T004"],
      "files": [
        "tests/unit/spec-doc-review-contracts.test.js",
        "tests/unit/spec-plan-contracts.test.js",
        "tests/unit/spec-work-contracts.test.js",
        "tests/unit/spec-write-tasks-contracts.test.js",
        "tests/unit/task-pack-command.test.js",
        "CHANGELOG.md",
        "README.md",
        "README.zh-CN.md"
      ],
      "context_refs": [
        "docs/plans/2026-06-07-001-feat-tasks-split-and-chain-review-plan.md#U6-测试fresh-source-eval-与文档changelog",
        "docs/contracts/workflows/fresh-source-eval-checklist.md",
        "tests/unit/spec-doc-review-contracts.test.js"
      ],
      "entry_hint": "本任务承载 G1-G4 的可机器执行验证层(T001-T004 prose 改动的 contract 断言);正向最小检查 = 推荐文案含理由 + 单一 named next action;README 仅当评审确认 handoff 行为用户可见时才改(plan A3),否则只改 CHANGELOG;CHANGELOG 用全局 developer profile 作者。",
      "test_focus": "npm test 全链路、正向最小检查能区分决断/中性、fresh-source eval 三语义 unit、双宿主 init+doctor、CHANGELOG 含本次变更。",
      "done_signal": "`npm test` 通过;`npm run lint:skill-entrypoints` 通过;正向最小检查在决断 fixture 通过且在至少一个中性 fixture 失败(证明可区分,否则标记该检查非承重并依赖 eval);fresh-source eval 三语义 unit(U1/U3/U4)通过,或显式标记 G5 部分满足 + 记录未执行原因 + 人工核对结论(部分满足不得记为 done);`spec-first init` 后 `doctor --claude` 与 `--codex` 无 drift;CHANGELOG 记录(用户可见项加 (user-visible))。",
      "parallelizable": false,
      "risk_note": "把 fresh-source eval 的'记录未执行'误当作 G5 通过会高估验证完整性;正向最小检查若只断言'存在'而不证明'可区分'等于没测语义强度。",
      "review_gate": "required",
      "review_focus": "正向最小检查是否真能区分决断/中性(有中性负向 fixture)、fresh-source eval 降级是否诚实标注部分满足、README 是否按 A3 条件处理。",
      "stop_if": "测试需要断言 prose 语义强度但只能字符串匹配时,停下说明限制而非伪装通过。",
      "wave": 4
    }
  ]
}
```

## Task Cards

### T001 — spec-write-tasks 决断式拆分推荐 + review handoff(合并 U1+U3)
- source_unit: U1(并入 U3;requirement_refs G1/G3/NG1/NG4/NG5,KTD1/KTD3 为决策依据见 context_refs)
- goal: 见 Contract;以 plan 结构为主判据、helper 可选交叉校验,高风险包决断 review-task-pack + NG1 加固。
- files: `skills/spec-write-tasks/SKILL.md`、`skills/spec-write-tasks/references/task-quality-guide.md`、`skills/spec-write-tasks/evals/boundary-cases.json`
- 合并理由: U1 与 U3 都改同一 `SKILL.md`,同 wave 文件重叠被校验拒绝;两者都是 spec-write-tasks skill 的内聚 prose 改动,合并为一个闭环更自然。done_signal 分两半:(U1)plan-结构主判据 + helper 可选;(U3)高风险包 review handoff + 自治宿主须 surface;各自可独立检查。
- 语义强度(决断 vs 中性)判定延迟到 T005 fresh-source eval,本任务 done 不含语义强度证明。
- review_gate: required — review_focus: 决断 vs 中性、NG1 prose 成立、主判据边界。
- stop_if: 需新脚本/schema/入口,或 spec-write-tasks 自动调用 doc-review。
- wave: 1

### T002 — spec-plan / spec-work handoff 决断式文案(U2)
- files: `skills/spec-plan/references/plan-handoff.md`、`skills/spec-plan/SKILL.md`、`skills/spec-work/SKILL.md`
- 关键: spec-plan/SKILL.md Phase 5.4 菜单块(约 752-761,含全部 5 option)是 plan-handoff.md 菜单 inline 副本,必须整块同步;复杂度措辞与 T001 落地判据逐字一致。
- review_gate: required — review_focus: inline 整块同步、user-confirmed、与 T001 判据逐字一致。
- dep: T001(需其判据冻结以校验一致) — wave: 2

### T003 — spec-doc-review ID 级覆盖盘点(U4)
- files: `skills/spec-doc-review/SKILL.md`、`skills/spec-doc-review/references/subagent-template.md`
- 关键: finding 走现有 `references/findings-schema.json`(P0-P3);origin 不可达三分支决策树;不升级强制三文档。
- review_gate: required — review_focus: ID 级边界、findings-schema 落地、不碰语义漂移。
- wave: 1

### T004 — Contracts 与双宿主对齐(U5)
- files: `docs/contracts/governance/task-governance-signals.md`
- 关键: 新增 consumers 段(当前无);执行者须 grep templates 确认是否 inline handoff prose;runtime mirror 不作为 task 文件/side-effect;双宿主 init+doctor 验证移至 T005(在全部 source 落地后)。
- review_gate: required — review_focus: consumer 段准确、host-agnostic、不手改 mirror。
- dep: T001-T003 — wave: 3

### T005 — 测试 / fresh-source eval / 双宿主 / docs / CHANGELOG(U6)
- requirement_refs: G1-G5(承载 G1-G4 的可机器执行验证层)
- files: `tests/unit/spec-doc-review-contracts.test.js`、`tests/unit/spec-plan-contracts.test.js`、`tests/unit/spec-work-contracts.test.js`、`tests/unit/spec-write-tasks-contracts.test.js`、`tests/unit/task-pack-command.test.js`、`CHANGELOG.md`、`README.md`(仅 A3 用户可见时)、`README.zh-CN.md`(同)
- 关键: 正向最小检查须证明可区分(决断 fixture 过 + 中性 fixture 挂);fresh-source eval 三语义 unit 通过或显式标记 G5 部分满足(部分满足 ≠ done);双宿主 `spec-first init` + `doctor --claude/--codex` 无 drift。
- review_gate: required — review_focus: 正向检查可区分性、eval 降级诚实标注部分满足、README 按 A3 条件处理。
- dep: T001-T004 — wave: 4

## Orientation Evidence

- provider: direct-repo-reads
- posture: bounded
- evidence_refs:
  - `skills/spec-write-tasks/SKILL.md`(decision envelope 行 268-295,next_action 行 292)
  - `skills/spec-plan/references/plan-handoff.md`(Option 2 行 42/51)、`skills/spec-plan/SKILL.md`(行 748-757 inline 菜单)
  - `skills/spec-work/SKILL.md`(suitability check 行 204-207)
  - `skills/spec-doc-review/SKILL.md`(task-pack 分类 行 120-131)、`references/findings-schema.json`(P0-P3)
  - `docs/contracts/governance/task-governance-signals.md`(无 consumers 段)、`docs/contracts/workflows/review-finding.md`(blocking/high/... handoff 层)
  - `templates/claude/commands/spec/{plan,work,doc-review}.md`(存在,无 write-tasks)
- limitations: findings-schema 是否需新字段、templates 是否 inline handoff prose 留执行期确认;均已在对应任务 `stop_if` 标注。orientation 仅用于校准任务文件边界,不扩展 plan 范围。

## Validation Notes

- 派生自单一 source plan `docs/plans/2026-06-07-001-feat-tasks-split-and-chain-review-plan.md`。
- `source_plan_hash` 由 `spec-first tasks hash <plan>` 产出:`sha256:7f3f868298ab5760aa9007d694e1d75410a126b618912d88a0ffed4c81717f07`。
- 文件重叠核对:T001/T002/T003/T004/T005 的 `files` 两两不相交(T001=spec-write-tasks 资产、T002=spec-plan+spec-work、T003=spec-doc-review、T004=contract、T005=tests+docs),无同 wave 共享文件。
- 当 `source_plan_hash` 与当前 plan body 不符,或 `spec_id` 与 plan 不符(`tasks-split-chain-review`),必须拒绝 handoff 并从 plan 重建。
- 最能证明拆分有用的验证:T001 的 fresh-source eval(决断措辞 + NG1)、T003 的 ID 覆盖 gap finding、T005 的 `npm test` 全链路。

## Regeneration Rules

- 当 plan、scope、实现单元、files、verification 变化,或本 task pack 经手改后,必须重建。
- 若 `source_plan_hash` 不符,拒绝执行并重建。
- 若 `spec_id` 与当前 source plan 不符,作为 wrong-chain 拒绝并从 plan 重建。
- 执行触发任一 `stop_if` 时,返回 `spec-plan` 或重跑 `spec-write-tasks`,不在原地扩范围。
