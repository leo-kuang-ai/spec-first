---
title: "fix: clarify spec-write-tasks skill contracts and prose consistency"
type: "task-pack"
status: "derived"
date: "2026-04-27"
spec_id: "2026-04-27-003-fix-spec-write-tasks-prose-contracts"
source_plan: "docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md"
source_plan_hash: "sha256:ab768e4d9fc6f30a0a667c0326b7bb86fbc84d0c1ec1eb7fffffcb0a2d526e26"
generated_by: "spec-write-tasks"
mode: "derived"
source_sections:
  - "Requirements Trace"
  - "Scope Boundaries"
  - "Implementation Units"
  - "Open Questions"
---

# fix: clarify spec-write-tasks skill contracts and prose consistency — Task Pack

## Overview

本任务包将 `docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md` 压缩为 6 个执行切片，修复 `spec-write-tasks` skill 三个 prose 文件中的 8 处不一致（orientation_evidence 层级、stop_if 路由分类、draft 术语跨文件引用、wave 文件重叠操作定义、JSON/Markdown task_id 同步规则、semantic_posture 定义、Regeneration Rules UX 提示、schema 版本迁移占位）以及对应的契约测试。

全部改动限于 skill prose 文件和测试文件，无 CLI 代码变更。

---

## Source Summary

- **Source plan:** `docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md`
- **Task-ready branch:** compile
- **Consumed source sections:** Requirements Trace (R1–R8)、Scope Boundaries、Implementation Units (U1–U6)、Open Questions / Deferred to Implementation
- **Key scope boundaries that shaped splitting:**
  - 仅修改 prose 文件：SKILL.md、task-pack-schema.md、task-quality-guide.md、contracts test
  - 不修改 src/cli/task-pack.js 或 JSON schema 格式
  - 可选文档指南（如 Regeneration Rules 提示）在范围内，强制逻辑不在范围
- **Implementation-time unknowns:**
  - stop_if 标签在运行时能否被 executor 正确路由（仅加 quality-guide.md 注释是否足够）
  - R7 done_signal 的文本断言可测试性（非强制提示无固定关键词）

---

## Traceability Matrix

| Source | Requirement | Task(s) | Validation |
|--------|-------------|---------|-----------|
| U1 | R1 — orientation_evidence 角色一致 | T001 | schema.md + quality-guide.md 中描述一致，Optional Task Fields 包含该字段 |
| U2 | R2 — stop_if 三类路由说明 | T002 | quality-guide.md Stop Signal Rules 有分类表；SKILL.md Scope Backoff 有路由说明 |
| U3 | R3 — draft-only 分支有 frontmatter 引用 | T003 | SKILL.md Task-Ready Check 的 draft-only 分支含 frontmatter cross-reference |
| U4 | R4 — serialize/mark-explicitly 操作定义 | T004 | SKILL.md 和 schema.md 中均有一致的 wave+1 / notes 字段说明 |
| U5 | R5 — JSON/Markdown task_id 同步规则 | T005 | schema.md Lint Boundary 包含 task_id 集合一致性规则 |
| U5 | R6 — semantic_posture 值定义表 | T005 | SKILL.md Final Decision Envelope 有四值定义表 |
| U5 | R7 — Regeneration Rules 判断提示 | T005 | schema.md Regeneration Rules 包含 spec-first tasks hash 判断提示 |
| U5 | R8 — schema_version 迁移占位 | T005 | schema.md 有 Schema Version and Migration 章节 |
| U6 | R1–R8 | T006 | npm run test:jest -- tests/unit/spec-write-tasks-contracts.test.js 零失败 |

---

## Task Graph

```
T002 ──► T001 ──────────────────────────────────────► T005 ──► T006
  │         (Wave 2, quality-guide overlap serialized)  ▲
  └──► T003 ──► T004 ─────────────────────────────────┘
```

- T002 无依赖，Wave 1（单独；与 T001 共享 quality-guide.md，必须先于 T001 完成）
- T001、T003 Wave 2 并行（T001 无逻辑依赖但因 quality-guide.md 重叠序列化到 Wave 2；T003 依赖 T002 的 SKILL.md 改动）
- T004 依赖 T002、T003（SKILL.md 串行）
- T005 依赖 T001（schema.md）、T003（SKILL.md）、T004（两者）
- T006 依赖所有 prose 任务

---

## Execution Waves

| Wave | Tasks | Files | Parallelizable |
|------|-------|-------|---------------|
| 1 | T002 | quality-guide.md（Stop Signal Rules）+ SKILL.md（Scope Backoff） | 单任务 |
| 2 | T001, T003 | T001: schema.md（Optional Task Fields）+ quality-guide.md（Field Writing Guide）；T003: SKILL.md（Task-Ready Check） | ✅ T001‖T003（无文件重叠；T001 不改 SKILL.md，T003 不改 schema.md/quality-guide.md）；T001 在 Wave 2 是因为与 T002 共享 quality-guide.md，已序列化 |
| 3 | T004 | SKILL.md（Compilation Algorithm）+ schema.md（Execution Waves） | 串行（T002、T003 完成后） |
| 4 | T005 | schema.md（Deterministic Lint + Regeneration Rules + Schema Version）+ SKILL.md（Final Decision Envelope） | 串行（T001、T003、T004 完成后） |
| 5 | T006 | tests/unit/spec-write-tasks-contracts.test.js | 串行（全部 prose 完成后） |

---

## Task Pack Contract

```json
{
  "schema_version": "task-pack/v1",
  "execution_waves": [
    { "wave": 1, "tasks": ["T002"] },
    { "wave": 2, "tasks": ["T001", "T003"] },
    { "wave": 3, "tasks": ["T004"] },
    { "wave": 4, "tasks": ["T005"] },
    { "wave": 5, "tasks": ["T006"] }
  ],
  "tasks": [
    {
      "task_id": "T001",
      "source_unit": "U1",
      "requirement_refs": ["R1"],
      "goal": "在 schema.md 和 quality-guide.md 中统一 orientation_evidence 的角色定义，消除文档级 Section 与任务级字段的歧义。",
      "dependencies": [],
      "files": [
        "skills/spec-write-tasks/references/task-pack-schema.md",
        "skills/spec-write-tasks/references/task-quality-guide.md"
      ],
      "test_focus": "schema.md Optional Task Fields 包含 orientation_evidence；quality-guide.md 字段表标注 optional。",
      "done_signal": "schema.md 和 quality-guide.md 中 orientation_evidence 描述一致：两者均说明为可选任务字段、补充文档级 Orientation Evidence Section，且 Optional Task Fields 表包含该字段。",
      "wave": 2,
      "stop_if": "需要将 orientation_evidence 改为 required 字段或删除质量指南中的相关说明——这超出 R1 的范围，需返回 spec-plan 确认。"
    },
    {
      "task_id": "T002",
      "source_unit": "U2",
      "requirement_refs": ["R2"],
      "goal": "在 quality-guide.md Stop Signal Rules 中添加三类路由分类表，并在 SKILL.md Scope Backoff 末尾添加路由说明。",
      "dependencies": [],
      "files": [
        "skills/spec-write-tasks/references/task-quality-guide.md",
        "skills/spec-write-tasks/SKILL.md"
      ],
      "test_focus": "quality-guide.md Stop Signal Rules 包含三类路由分类表（三行：返回 spec-plan / 重跑 spec-write-tasks / 用户确认）；SKILL.md Scope Backoff 包含路由说明。",
      "done_signal": "quality-guide.md 的 Good stop signals 后有三类路由表格；SKILL.md Scope Backoff 末尾有一行路由说明。",
      "wave": 1,
      "stop_if": "需要在 SKILL.md 的每条 stop_if 示例旁共置分类标签（超出仅改 quality-guide.md 的范围），需返回 spec-plan 确认是否扩展。"
    },
    {
      "task_id": "T003",
      "source_unit": "U3",
      "requirement_refs": ["R3"],
      "goal": "在 SKILL.md 的 draft-only 分支描述后添加 frontmatter 字段 cross-reference，指向 task-pack-schema.md 的 status: \"draft\" 和 mode: \"transient\"。",
      "dependencies": ["T002"],
      "files": [
        "skills/spec-write-tasks/SKILL.md"
      ],
      "test_focus": "SKILL.md Task-Ready Check 的 draft-only 分支包含指向 frontmatter 字段的 cross-reference。",
      "done_signal": "SKILL.md draft-only 分支有一行注释：指向 status: \"draft\"、mode: \"transient\" 并引用 task-pack-schema.md frontmatter，且明确说明与 task_pack_validity: draft 是不同语境。",
      "wave": 2,
      "stop_if": "需要同时修改 Final Decision Envelope 中的 task_pack_validity 值或统一字面量——Key Technical Decisions 明确说不需要，超出 R3 范围。"
    },
    {
      "task_id": "T004",
      "source_unit": "U4",
      "requirement_refs": ["R4"],
      "goal": "在 SKILL.md Compilation Algorithm 第 5 步和 schema.md Execution Waves 章节中添加 serialize 与 mark-explicitly 的操作定义。",
      "dependencies": ["T002", "T003"],
      "files": [
        "skills/spec-write-tasks/SKILL.md",
        "skills/spec-write-tasks/references/task-pack-schema.md"
      ],
      "test_focus": "SKILL.md 和 schema.md 两处均包含 serialize = wave+1 和 mark-explicitly = notes 字段的操作定义，且措辞一致。",
      "done_signal": "SKILL.md Compilation Algorithm 第 5 步后有 serialize/mark-explicitly 定义；schema.md Execution Waves 有相同定义；两处措辞对齐。",
      "wave": 3,
      "stop_if": "需要在 task-pack-schema.md 的 Lint Boundary 中添加对应的脚本检查规则（超出 R4 prose 范围）——留待后续专项。"
    },
    {
      "task_id": "T005",
      "source_unit": "U5",
      "requirement_refs": ["R5", "R6", "R7", "R8"],
      "goal": "在 schema.md 和 SKILL.md 中补全四处规则：JSON/Markdown task_id 同步规则（R5）、semantic_posture 定义表（R6）、Regeneration Rules 判断提示（R7）、schema 版本迁移占位（R8）。",
      "dependencies": ["T001", "T003", "T004"],
      "files": [
        "skills/spec-write-tasks/references/task-pack-schema.md",
        "skills/spec-write-tasks/SKILL.md"
      ],
      "test_focus": "schema.md Deterministic Lint 包含 task_id 集合一致性规则；SKILL.md Final Decision Envelope 有四值 semantic_posture 定义表；schema.md Regeneration Rules 有 spec-first tasks hash 判断提示；schema.md 有 Schema Version and Migration 章节。",
      "done_signal": "四项内容全部出现：(1) schema.md Lint Boundary 有 task_id 集合一致性规则说明；(2) SKILL.md Final Decision Envelope 有 semantic_posture 值定义表（四行）；(3) schema.md Regeneration Rules 有 tasks hash 判断提示且不包含违规的「更新 frontmatter hash」路径；(4) schema.md 有 Schema Version and Migration 章节含 schema_version 字段位置说明。",
      "wave": 4,
      "stop_if": "需要修改 spec-work 或 spec-plan 的 semantic_posture 引用，或需要为 Markdown task cards 添加 task_id lint 代码实现——两者超出本计划范围。"
    },
    {
      "task_id": "T006",
      "source_unit": "U6",
      "requirement_refs": ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"],
      "goal": "在 spec-write-tasks-contracts.test.js 中为 T001–T005 新增的 prose 规则添加文本断言，确保 prose 稳定性。",
      "dependencies": ["T001", "T002", "T003", "T004", "T005"],
      "files": [
        "tests/unit/spec-write-tasks-contracts.test.js"
      ],
      "test_focus": "npm run test:jest -- tests/unit/spec-write-tasks-contracts.test.js --runInBand 零失败；新增断言覆盖 T001–T005 各引入的关键文本。",
      "done_signal": "npm run test:jest -- tests/unit/spec-write-tasks-contracts.test.js --runInBand 通过，新增断言验证：orientation_evidence 在 Optional Task Fields、stop_if 路由分类表关键词、draft-only cross-reference、serialize/wave+1 定义、semantic_posture 定义表关键词、Schema Version and Migration 章节。",
      "wave": 5,
      "stop_if": "需要修改 src/cli/task-pack.js（例如添加 Markdown task_id lint 代码）而非仅更新 prose 断言——超出本计划范围，需返回 spec-plan。"
    }
  ]
}
```

---

## Task Cards

### T001 — 统一 orientation_evidence 层级定义

- **source_unit:** U1
- **requirement_refs:** R1
- **goal:** 在 schema.md Optional Task Fields 和 quality-guide.md Field Writing Guide 中统一 orientation_evidence 角色定义
- **dependencies:** []
- **files:**
  - Modify: `skills/spec-write-tasks/references/task-pack-schema.md`
  - Modify: `skills/spec-write-tasks/references/task-quality-guide.md`
- **context_refs:**
  - `docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md#U1`
  - `skills/spec-write-tasks/references/task-pack-schema.md#Optional-Task-Fields`
  - `skills/spec-write-tasks/references/task-quality-guide.md#Field-Writing-Guide`
- **entry_hint:** 从 task-pack-schema.md 的 Optional Task Fields 表（notes、review_focus、handoff_owner 行）开始，仿照现有 optional 字段格式新增 orientation_evidence 行
- **test_focus:** schema.md Optional Task Fields 包含 orientation_evidence；quality-guide.md 字段表标注 optional，描述与 schema.md 一致
- **done_signal:** 读取两个文件后确认：schema.md Optional Task Fields 有 orientation_evidence 行（说明为文档级 Orientation Evidence 的任务粒度补充）；quality-guide.md 字段表的 orientation_evidence 行注明 optional task field
- **parallelizable:** true（可与 T003 并行，Wave 2；T001 不改 SKILL.md，T003 不改 schema.md/quality-guide.md）
- **risk_note:** orientation_evidence 的 optional 定性需先核查 docs/tasks/ 实际使用率（已在计划 U1 Approach 列为前置步骤）
- **stop_if:** 需要将字段改为 required 或删除质量指南中的相关指导（超出 R1 范围，需返回 spec-plan 确认）
- **wave:** 2
- **notes:** T001 被序列化到 Wave 2（而非 Wave 1）因与 T002 共享 quality-guide.md；T001 无逻辑依赖 T002，序列化仅为避免文件级冲突。

---

### T002 — 添加 stop_if 三类路由分类

- **source_unit:** U2
- **requirement_refs:** R2
- **goal:** 在 quality-guide.md Stop Signal Rules 添加三类路由表，并在 SKILL.md Scope Backoff 添加路由说明
- **dependencies:** []
- **files:**
  - Modify: `skills/spec-write-tasks/references/task-quality-guide.md`
  - Modify: `skills/spec-write-tasks/SKILL.md`
- **context_refs:**
  - `docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md#U2`
  - `skills/spec-write-tasks/references/task-quality-guide.md#Stop-Signal-Rules`
  - `skills/spec-write-tasks/SKILL.md#Scope-Backoff`
- **entry_hint:** 从 quality-guide.md 的 Good stop signals 列表末尾开始，添加三行路由分类表（类型 / 触发条件 / 推荐目的地）；再打开 SKILL.md 找到 Scope Backoff 章节，在 common stop signals 列表末尾加一行路由说明
- **test_focus:** quality-guide.md Stop Signal Rules 有三类路由分类；SKILL.md Scope Backoff 有路由说明
- **done_signal:** quality-guide.md Good stop signals 后紧接三行路由分类表格（三类：缺计划→spec-plan、切分错误→重跑 spec-write-tasks、需决策→用户确认）；SKILL.md Scope Backoff 末尾有一行路由说明
- **parallelizable:** false（Wave 1 单独执行；T001 因共享 quality-guide.md 被推迟到 Wave 2）
- **risk_note:** 三类标签是 prose 分类，不约束 SKILL.md Scope Backoff 列表本身的文本（该列表由 Deferred 项追踪）
- **stop_if:** 需要在 SKILL.md Scope Backoff 每条 stop_if 示例旁共置标签（超出 R2 范围），需返回 spec-plan 确认
- **wave:** 1

---

### T003 — draft-only 分支添加 frontmatter cross-reference

- **source_unit:** U3
- **requirement_refs:** R3
- **goal:** 在 SKILL.md Task-Ready Check 的 draft-only 分支后添加一行 frontmatter 字段 cross-reference
- **dependencies:** [T002]
- **files:**
  - Modify: `skills/spec-write-tasks/SKILL.md`
- **context_refs:**
  - `docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md#U3`
  - `skills/spec-write-tasks/SKILL.md#Task-Ready-Check`
  - `skills/spec-write-tasks/references/task-pack-schema.md#Frontmatter`
- **entry_hint:** 搜索 SKILL.md 中的 `draft-only` 关键词，找到 Task-Ready Check 四分支描述，在 draft-only 那一行后添加 cross-reference 注释
- **test_focus:** SKILL.md Task-Ready Check draft-only 分支包含 frontmatter 字段引用（status: "draft"，mode: "transient"）和 schema.md 链接
- **done_signal:** SKILL.md draft-only 分支有行内注释明确 frontmatter 字段名称（status: "draft"，mode: "transient"），并注明与 task_pack_validity: draft 是不同语境
- **parallelizable:** false（需在 T002 的 SKILL.md 改动完成后串行执行）
- **risk_note:** 注释必须明确区分两个"draft"语境，避免引入新的混淆
- **stop_if:** 需要修改 Final Decision Envelope 中的 task_pack_validity 字面值，或统一不同语境的"draft"措辞（Key Technical Decisions 明确不需要，超出 R3 范围）
- **wave:** 2

---

### T004 — 定义 wave 文件重叠的 serialize 和 mark-explicitly 操作

- **source_unit:** U4
- **requirement_refs:** R4
- **goal:** 在 SKILL.md Compilation Algorithm 第 5 步和 schema.md Execution Waves 中添加 serialize/mark-explicitly 操作定义
- **dependencies:** [T002, T003]
- **files:**
  - Modify: `skills/spec-write-tasks/SKILL.md`
  - Modify: `skills/spec-write-tasks/references/task-pack-schema.md`
- **context_refs:**
  - `docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md#U4`
  - `skills/spec-write-tasks/SKILL.md#Compilation-Algorithm`
  - `skills/spec-write-tasks/references/task-pack-schema.md#Execution-Waves`
- **entry_hint:** 搜索 SKILL.md 中"Assign waves"和 schema.md 中"Execution Waves"，在各自的文件重叠说明后追加操作定义
- **test_focus:** 两处均包含"wave + 1"和"notes 字段"关键词，措辞一致
- **done_signal:** SKILL.md Compilation Algorithm 第 5 步有"serialize = 后序任务移至 wave + 1；mark explicitly = 在 notes 字段注明重叠原因"；schema.md Execution Waves 有相同定义
- **parallelizable:** false（需 T002、T003 完成 SKILL.md 相关章节后再修改 Compilation Algorithm）
- **risk_note:** 两处措辞需完全对齐，否则契约测试 T006 无法用单一关键词断言
- **stop_if:** 需要在 Lint Boundary 添加脚本级 wave+1 强制检查（超出 prose 范围，留待后续专项）
- **wave:** 3

---

### T005 — 补全 JSON/Markdown 同步规则、semantic_posture 定义、schema 迁移占位

- **source_unit:** U5
- **requirement_refs:** R5, R6, R7, R8
- **goal:** 在 schema.md 和 SKILL.md 中补充四处规则：task_id 一致性（R5）、semantic_posture 定义表（R6）、Regeneration Rules 判断提示（R7）、schema 迁移占位（R8）
- **dependencies:** [T001, T003, T004]
- **files:**
  - Modify: `skills/spec-write-tasks/references/task-pack-schema.md`
  - Modify: `skills/spec-write-tasks/SKILL.md`
- **context_refs:**
  - `docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md#U5`
  - `skills/spec-write-tasks/SKILL.md#Final-Decision-Envelope`
  - `skills/spec-write-tasks/references/task-pack-schema.md#Deterministic-Lint`
  - `skills/spec-write-tasks/references/task-pack-schema.md#Regeneration-Rules`
  - `src/cli/commands/tasks.js`（参照：tasks hash 命令的行为；不修改）
- **entry_hint:** 按 R5→R6→R7→R8 顺序依次处理，每项改动一个小区域：先在 schema.md Deterministic Lint 末尾加 task_id 一致性规则；再在 SKILL.md Final Decision Envelope yaml 模板后加定义表；再在 schema.md Regeneration Rules 末尾加 tasks hash 提示；最后在 schema.md 末尾新增 Schema Version and Migration 章节
- **test_focus:** 四项关键词均存在：task_id 一致性规则（schema.md）、generated-this-run（SKILL.md 定义表）、spec-first tasks hash（schema.md R7 提示）、Schema Version and Migration（schema.md R8）
- **done_signal:** schema.md Deterministic Lint 有 task_id 集合一致性规则；SKILL.md Final Decision Envelope 有 4 行 semantic_posture 定义表；schema.md Regeneration Rules 有正确的 tasks hash 提示（不含 tasks validate 路径）；schema.md 有 Schema Version and Migration 章节（含 schema_version 字段位置说明）
- **parallelizable:** false（需 T001、T003、T004 各自完成 schema.md 和 SKILL.md 前置章节后再执行）
- **risk_note:** semantic_posture 定义表的措辞必须与 Final Decision Envelope yaml 模板中的值字面对应，否则 T006 的 semantic_posture 测试失败；R7 提示严禁包含"更新 frontmatter hash"路径（违反 schema 硬规则）
- **stop_if:** 需要修改 spec-work/spec-plan 的 semantic_posture 引用，或需要为 Markdown task cards 添加 task_id lint 代码（两者超出本计划范围，需返回 spec-plan）
- **wave:** 4
- **notes:** T005 捆绑四个独立的小改动；若某个子改动（如 R6）与现有 prose 有争议，可先提交 R5/R7/R8 三项，单独处理 R6，以避免整个 T005 需要重开。

---

### T006 — 更新契约测试覆盖新增规则

- **source_unit:** U6
- **requirement_refs:** R1, R2, R3, R4, R5, R6, R7, R8
- **goal:** 在 spec-write-tasks-contracts.test.js 中为 T001–T005 引入的 prose 规则添加文本断言
- **dependencies:** ["T001", "T002", "T003", "T004", "T005"]
- **files:**
  - Modify: `tests/unit/spec-write-tasks-contracts.test.js`
- **context_refs:**
  - `docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md#U6`
  - `tests/unit/spec-write-tasks-contracts.test.js`（173 行，现有断言模式）
  - `skills/spec-write-tasks/SKILL.md`（已提交的最新版本）
  - `skills/spec-write-tasks/references/task-pack-schema.md`（已提交的最新版本）
  - `skills/spec-write-tasks/references/task-quality-guide.md`（已提交的最新版本）
- **entry_hint:** 先读取已提交的三个 prose 文件，提取各改动引入的实际字符串（不依赖计划中的意图描述）；再读取 spec-write-tasks-contracts.test.js 的 Codex runtime sync 测试找出已检查的关键词；最后仿照现有 toContain 断言格式逐一添加
- **test_focus:** npm run test:jest -- tests/unit/spec-write-tasks-contracts.test.js --runInBand 零失败
- **done_signal:** spec-write-tasks-contracts.test.js 新增断言覆盖（至少）：orientation_evidence 在 Optional Task Fields、stop_if 路由分类关键词、draft-only frontmatter cross-reference 关键词、wave + 1 定义关键词、generated-this-run（semantic_posture 定义）、Schema Version and Migration 章节标题；npm test 无回归
- **parallelizable:** false（必须等全部 prose 完成）
- **risk_note:** 断言字符串必须从已提交文件中提取，而非从计划意图推断；若 prose 在执行时使用了不同措辞，计划中的字符串示例将失效
- **stop_if:** 测试需要修改 src/cli/ 下的代码或添加新测试 fixture（超出范围，需返回 spec-plan）
- **wave:** 5

---

## Orientation Evidence

- **provider:** direct-repo-reads
- **posture:** bounded
- **evidence_refs:**
  - `skills/spec-write-tasks/SKILL.md`（306 行，已在本会话中完整读取）
  - `skills/spec-write-tasks/references/task-pack-schema.md`（312 行，已读取）
  - `skills/spec-write-tasks/references/task-quality-guide.md`（233 行，已读取）
  - `tests/unit/spec-write-tasks-contracts.test.js`（173 行，已读取，用于确认 T006 任务边界和现有断言模式）
  - `src/cli/task-pack.js`（711 行，已读取 L660–L701，确认 same-wave file overlap 检查已实现，无需 T004 添加代码）
  - CRG before-plan hook（已运行，确认 src/cli/task-pack.js 为高风险节点，但本计划不修改它）
- **limitations:**
  - CRG 图状态为 degraded（高 unresolved edge rate），但本计划的文件集已通过直接读取确认，CRG 未提供额外的任务边界信息
  - docs/tasks/ 中现有 task pack 的 orientation_evidence 使用率未在 source orientation 阶段系统核查（已在 T001 Approach 列为前置步骤）

---

## Validation Notes

- **Source plan:** `docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md`
- **Hash verification:** `spec-first tasks hash docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md` → `sha256:ab768e4d9fc6f30a0a667c0326b7bb86fbc84d0c1ec1eb7fffffcb0a2d526e26`
- **When to reject this task pack:** 如果 source plan 的 prose 内容被修改（hash 变化），拒绝此任务包并重建。如果执行前发现 spec_id 不匹配（wrong-chain），停止并重建。
- **Validation tasks that best prove the split is useful:** T006（契约测试通过）+ T001/T002 各自的 verification（schema/quality-guide 内容一致性）。

---

## Regeneration Rules

当以下任一发生时重建任务包：

- source plan（`docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md`）内容变更
- 计划的 Scope Boundaries、Requirements Trace 或 Implementation Units 变更
- 文件集、验证方式、任务语义经过手动编辑后发生实质改变

验证 hash：`spec-first tasks hash docs/plans/2026-04-27-003-fix-spec-write-tasks-prose-contracts-plan.md`。若结果不是 `sha256:ab768e4d9fc6f30a0a667c0326b7bb86fbc84d0c1ec1eb7fffffcb0a2d526e26`，必须拒绝执行此任务包并重建。
