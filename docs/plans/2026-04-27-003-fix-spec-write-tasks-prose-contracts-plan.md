---
title: "fix: clarify spec-write-tasks skill contracts and prose consistency"
type: fix
status: active
date: 2026-04-27
spec_id: 2026-04-27-003-fix-spec-write-tasks-prose-contracts
---

# fix: clarify spec-write-tasks skill contracts and prose consistency

## Overview

`spec-write-tasks` skill 的功能正确、核心设计一致，但在以下 8 处存在术语微分歧、层级定义混淆或规则不完整，会在 edge case 执行时制造歧义：Orientation Evidence 层级不清、`stop_if` 缺乏路由分类、`draft` 术语跨文件不一致、wave 文件重叠"serialize"定义缺失、JSON/Markdown task_id 同步规则缺失、`semantic_posture` 定义模糊、plan 小幅变更 UX 摩擦、schema 版本迁移路径缺失。

本计划全部改动限于 skill prose 文件和对应契约测试。不修改 `src/cli/task-pack.js`（lint 逻辑已完备）、不新增 CLI 命令、不改变 task pack schema 的机器可读格式。

---

## Problem Frame

刚完成的 `spec-write-tasks` skill 审查（代码评审，非代码执行结果）发现了 8 处 prose 层面的不一致：

1. **§3.2** `orientation_evidence` 在 `task-quality-guide.md` 字段表中作为任务级字段存在，但在 `task-pack-schema.md` 的任务卡字段表（required + optional）中均未定义。`Orientation Evidence` 只被定义为文档级 Section（Body Structure 第 8 节），产生"是任务级字段还是文档级章节"的歧义。
2. **§3.5** `stop_if` 的所有 stop 信号都指向"return to `spec-plan` or user confirmation"，无法区分三种真实目的地：回 `spec-plan`、重跑 `spec-write-tasks`、用户确认。executor 无法做路由决策。
3. **§3.1** `draft` 术语在三处使用不同表达：SKILL.md 用 `draft-only`（分支名）、schema.md 用 `status: "draft"` + `mode: "transient"`、Final Decision Envelope 用 `task_pack_validity: draft`。`draft-only` 分支没有指向对应的 frontmatter 字段。
4. **§3.3** SKILL.md 和 schema.md 都说"如果文件重叠，serialize 或 mark explicitly"，但没有定义：serialize = 降到哪个 wave？mark explicitly = 写在哪个字段？
5. **§3.6** schema.md 说"JSON block 是 validators 的唯一机器可读源"，但 Lint Boundary 没有说明 JSON block 与人类可读 Task Cards Markdown 的 task_id 集合应当一致、以哪个为准。
6. **§3.7** Final Decision Envelope 中 `semantic_posture` 有四个值（`generated-this-run | reviewed-existing | unchecked-existing | not-applicable`），但没有定义各值对应的运行条件，导致 `next_action: spec-work-task-pack` 的许可条件不精确。
7. **§3.4**（低优先级）Regeneration Rules 说"任何 plan 变更都要重建"，但没有引导用户评估变更是否真正影响任务边界，造成不必要的重建摩擦。
8. **§4.2**（低优先级）schema.md 定义了 `schema_version: "task-pack/v1"` 但没有 v1→v2 迁移策略占位，会在 schema 演化时产生技术债。注：`schema_version` 字段位于 Task Pack Contract JSON block（不在 frontmatter），当前值为 `"task-pack/v1"`。

---

## Requirements Trace

- R1. 修复后，`orientation_evidence` 在 schema.md 和 quality-guide.md 中有一致的角色定义（Optional Task Fields 或纯文档级），不产生"既是任务字段又是文档章节"的歧义。
- R2. `stop_if` 在 quality-guide.md Stop Signal Rules 中有三类标签和路由目的地说明，executor 可据此判断下一步操作。
- R3. SKILL.md 的 `draft-only` 分支有指向 frontmatter 字段的 cross-reference（`status: "draft"`, `mode: "transient"`）。
- R4. SKILL.md 和 schema.md 在 wave 文件重叠语境中都给出了"serialize"和"mark explicitly"的具体含义。
- R5. schema.md Lint Boundary 明确说明 JSON block 是 task_id 集合的权威源，两者应当一致，validator 可检查。
- R6. SKILL.md Final Decision Envelope 有 `semantic_posture` 的值定义表，明确四个值对应的运行条件。
- R7. schema.md Regeneration Rules 提供 plan 小幅变更时的判断提示（非强制规则）。
- R8. schema.md 有 `schema_version` 迁移策略占位说明。

---

## Scope Boundaries

- 不修改 `src/cli/task-pack.js` 或其他 CLI 代码。
- 不改变 task pack 的机器可读 JSON 格式（schema_version 不变）。
- 不新增 CLI 命令或 flag。
- 不修改 `spec-work`、`spec-plan` 等其他 skill。
- 不为每个 `stop_if` 字段添加新的结构化字段（如 `stop_destination`），只在 quality guide 中添加文字分类指导。
- 不向现有 task pack 示例（`docs/tasks/`）添加任何字段（不破坏已生成的 task pack）。
- 在文档层面添加可选判断提示或说明（如 Regeneration Rules 的判断提示、质量指南的分类表）属于范围内；目标是改善 LLM 执行者的决策输入质量，不引入强制逻辑或新 CLI 命令。

---

## Context & Research

### Relevant Code and Patterns

- `skills/spec-write-tasks/SKILL.md`：主 skill 定义，包含 Task-Ready Check、Compilation Algorithm、Final Decision Envelope、Scope Backoff 等核心章节
- `skills/spec-write-tasks/references/task-pack-schema.md`：结构和字段合约，Body Structure、Task Cards、Optional Task Fields、Deterministic Lint、Regeneration Rules
- `skills/spec-write-tasks/references/task-quality-guide.md`：质量指南，Field Writing Guide 表包含 `orientation_evidence`；Stop Signal Rules；Bad Smells 表
- `tests/unit/spec-write-tasks-contracts.test.js`（173 行）：现有契约测试，覆盖 `orientation:`、`semantic_posture`、`draft-only`、`stop_if`、`orientation_evidence`
- `src/cli/task-pack.js`（711 行）：实现了 wave 文件重叠检查（L684-L701），不需要修改
- `docs/tasks/2026-04-27-001-feat-crg-artifact-quality-algorithms-tasks.md`：真实 task pack 示例，可作为参照

### Institutional Learnings

- 本项目的编辑原则：脚本做确定性工作，LLM 做语义决策；不把语义决策硬编码成规则引擎
- 改 skill prose 不需要重跑 `spec-first init`（脚本资产是从 skills/ 源码生成的，但 prose 本身是直接被 LLM 加载的 skill 定义）
- 契约测试 `spec-write-tasks-contracts.test.js` 用文本字符串断言 skill 内容，修改 prose 后需同步更新测试

---

## Key Technical Decisions

- **orientation_evidence 定性**：将其作为 Optional Task Fields 加入 schema.md，说明它是对文档级 Orientation Evidence Section 的任务粒度补充（可选）。quality-guide.md 的字段表保留该字段，但标注 optional。这是最小侵入性修复——不删除 quality guide 的指导内容，也不强制要求所有任务都填写。
- **stop_if 分类**：在 quality-guide.md 中新增三类标签（`ESCALATE_TO_PLAN`、`REBUILD_TASKS`、`CONFIRM_WITH_USER`），以注释形式出现在好/坏示例旁，不改变 `stop_if` 字段本身的类型（仍是字符串）。
- **serialize 定义**：在 SKILL.md 的 Scope Backoff 和 schema.md 的 Execution Waves 中统一定义：serialize = 把后序任务移到 `wave + 1`；mark explicitly = 在受影响任务的 `notes` 字段写明重叠原因和选择。
- **JSON/Markdown task_id 一致性**：只在文档层面（schema.md Lint Boundary）明确说明，不添加 Markdown 解析器。JSON block 是权威源；human-readable cards 应与 JSON 保持 task_id 集合一致，但若矛盾以 JSON 为准。
- **semantic_posture 定义**：在 SKILL.md Final Decision Envelope 正文中添加一个定义表，4 行，描述各值的触发条件。

---

## Open Questions

### Resolved During Planning

- **orientation_evidence 是否需要改为 required 字段**：不需要。加入 Optional Task Fields 已足够，让 executor 自行判断是否有任务粒度的 orientation 需要记录。
- **stop_if 是否需要新结构化字段**：不需要。纯文字分类指导已能解决路由决策问题，避免 schema 格式变更。
- **是否需要为 docs/tasks/ 中现有 task pack 补充 orientation_evidence 字段**：不需要。Optional 字段不要求回填。

### Deferred to Implementation

- 是否值得为 Markdown task cards 添加 task_id 一致性 lint 检查（需解析人类可读 Markdown）：本计划只加文档规则，代码实现留待后续专项。
- **stop_if 路由分类的覆盖面**：三类标签（ESCALATE_TO_PLAN / REBUILD_TASKS / CONFIRM_WITH_USER）仅在 quality-guide.md 的 Stop Signal Rules 章节添加分类表；若执行时发现 executor 在运行时读取 SKILL.md 的 Scope Backoff 列表而不查阅 quality-guide，则需同步在 SKILL.md 每条 stop_if 示例旁添加路由标签。
- **U3 cross-reference 与语境区分**：draft-only 分支新增对 frontmatter 字段（`status: "draft"`, `mode: "transient"`）的 cross-reference，与 Final Decision Envelope 的 `task_pack_validity: draft` 是不同语境，实现时需明确注明两者不需要字面统一，避免混淆。
- **R7 done_signal 可测试性**：R7 要求在 Regeneration Rules 添加非强制判断提示，但 U6 的文本断言如何覆盖该提示（提示内容可能无固定关键词）需在实现时确认；若无法写出有意义的断言，可在测试中用章节标题检查替代。
- **SKILL.md 多单元串行编辑的 review 检查点**：U2→U3→U4→U5 依次修改 SKILL.md 的不同章节，每个 unit 完成后应通过 diff 确认改动已保存且未覆盖前序内容，再进入下一个 unit；若使用自动化 executor，需明确此检查点策略。

---

## Implementation Units

- U1. **修复 orientation_evidence 层级歧义**

**Goal:** 在 schema.md 和 quality-guide.md 中统一 orientation_evidence 的角色定义。

**Requirements:** R1

**Dependencies:** 无

**Files:**
- Modify: `skills/spec-write-tasks/references/task-pack-schema.md`
- Modify: `skills/spec-write-tasks/references/task-quality-guide.md`

**Approach:**
- **前置步骤**：在修改前，搜索 `docs/tasks/` 中已生成的 task pack，统计含有任务级 `orientation_evidence` 字段的比例；若 >80% 的 task pack 包含该字段，需重新考虑是 optional 还是 recommended 定性后再进行修改。
- 在 schema.md 的 `### Optional Task Fields` 表中新增 `orientation_evidence` 行，说明：它是对文档级 `## Orientation Evidence` Section 的任务粒度补充，可选；记录该任务的 bounded source orientation provider、posture、evidence_refs、limitations。
- quality-guide.md 的 Field Writing Guide 表保留 `orientation_evidence` 行，在 Meaning 列加注"optional task field"以区分文档级 section。
- 确保两处描述一致：orientation_evidence 任务字段 ≠ 文档级 Orientation Evidence section；两者互补，不互斥。

**Patterns to follow:**
- schema.md Optional Task Fields 现有表格格式（notes、review_focus、handoff_owner）

**Test scenarios:**
- Happy path: 读取 schema.md，确认 Optional Task Fields 表中存在 `orientation_evidence` 及其说明
- Happy path: 读取 quality-guide.md，确认 Field Writing Guide 表中 `orientation_evidence` 行标注了 optional
- Edge case: 两处关于 orientation_evidence 的描述一致，不引入新的术语分歧

**Verification:**
- schema.md 和 quality-guide.md 中 `orientation_evidence` 的角色描述相互印证、无矛盾

---

- U2. **为 stop_if 添加三类路由分类**

**Goal:** 在 quality-guide.md Stop Signal Rules 中为 `stop_if` 值添加路由目的地分类，让 executor 能做路由决策。

**Requirements:** R2

**Dependencies:** 无（U1 和 U2 分别改动 quality-guide.md 的不同章节——U1 改 Field Writing Guide 表，U2 改 Stop Signal Rules——不存在文件级冲突，可与 U1 并行执行）

**Files:**
- Modify: `skills/spec-write-tasks/references/task-quality-guide.md`
- Modify: `skills/spec-write-tasks/SKILL.md`

**Approach:**
- 在 quality-guide.md Stop Signal Rules 章节的 Good stop signals 列表后加一个三类表格：

  | 类型 | 触发条件示例 | 推荐目的地 |
  |------|------------|---------|
  | 计划边界不清 | 需要新 public 接口/CLI 命令但 plan 未声明 | 返回 `spec-plan` |
  | 文件集或依赖链错误 | 任务的 files 覆盖不足以完成 done_signal | 重跑 `spec-write-tasks` |
  | 需要产品/架构决策 | 实现时发现方案 A/B 均可行但影响接口设计 | 用户确认 |

- 在 SKILL.md `## Scope Backoff` 的 common stop signals 列表末尾，加一行说明："stop signal 触发时，根据原因路由：缺计划 → `spec-plan`；任务切分错误 → 重跑 `spec-write-tasks`；需决策 → 用户确认。"

**Patterns to follow:**
- quality-guide.md 现有表格格式（Bad Smells 表）

**Test scenarios:**
- Happy path: 读取 quality-guide.md，Stop Signal Rules 中存在三类路由分类表格
- Happy path: 读取 SKILL.md，Scope Backoff 章节包含路由说明

**Verification:**
- executor 读取 stop_if 路由说明后，对三类触发场景有明确的下一步操作

---

- U3. **对齐 draft 术语跨文件引用**

**Goal:** 在 SKILL.md 的 `draft-only` 分支加 cross-reference，指向 schema.md 中对应的 frontmatter 字段。

**Requirements:** R3

**Dependencies:** U2（U2 和 U3 均修改 SKILL.md 的不同章节，须在 U2 完成 Scope Backoff 改动后，再处理 Task-Ready Check 改动，避免文件内容串行覆盖）

**Files:**
- Modify: `skills/spec-write-tasks/SKILL.md`

**Approach:**
- 在 SKILL.md `## Compilation Flow > ### Task-Ready Check` 的 `draft-only` 分支描述后，添加一行注释：`→ 写出 draft 时：status: "draft"，mode: "transient"（见 task-pack-schema.md frontmatter）`。
- 不修改 Final Decision Envelope 中的 `task_pack_validity: draft`，这是运行时状态值，与 frontmatter 字段是不同语境，不需要统一字面量。

**Patterns to follow:**
- SKILL.md 中其他 cross-reference 注释的行内格式

**Test scenarios:**
- Happy path: 读取 SKILL.md，Task-Ready Check 的 draft-only 分支包含 frontmatter cross-reference
- Edge case: cross-reference 内容与 schema.md frontmatter 字段一致

**Verification:**
- SKILL.md `draft-only` 分支可独立指导 executor 生成正确 frontmatter，无需查阅 schema.md

---

- U4. **明确 wave 文件重叠的 serialize 和 mark-explicitly 定义**

**Goal:** 在 SKILL.md 和 schema.md 中为 wave 文件重叠的两种处理方式给出操作定义。

**Requirements:** R4

**Dependencies:** U2, U3（U2、U3、U4 均修改 SKILL.md 的不同章节，须在 U2、U3 完成后处理 U4 的 Compilation Algorithm 改动；U1→U4 的 schema.md 依赖为误报：U1 改 Optional Task Fields，U4 改 Execution Waves，两者不同章节可并行，但 SKILL.md 部分须串行）

**Files:**
- Modify: `skills/spec-write-tasks/SKILL.md`
- Modify: `skills/spec-write-tasks/references/task-pack-schema.md`

**Approach:**
- 在 SKILL.md `### Compilation Algorithm` 第 5 步（波次分配）的说明后追加：
  `- Serialize：将后序任务移至 wave + 1；Mark explicitly：在该任务的 notes 字段注明重叠文件和序列化原因。`
- 在 schema.md `## Execution Waves` 章节的文件重叠说明后，同样追加相同定义（两处措辞保持一致）。
- 同一文件在 schema.md Lint Boundary 已有 `same-wave file overlap is absent or serialized` 检查说明，无需改动。

**Patterns to follow:**
- SKILL.md Compilation Algorithm 的列表格式
- schema.md Execution Waves 章节的散文风格

**Test scenarios:**
- Happy path: 读取 SKILL.md，Compilation Algorithm 第 5 步包含 serialize/mark-explicitly 定义
- Happy path: 读取 schema.md，Execution Waves 章节包含一致的定义
- Edge case: 两处定义措辞相同，不引入新分歧

**Verification:**
- 两处定义一致；执行时发现文件重叠的 executor 有明确操作路径

---

- U5. **补全 JSON/Markdown task_id 规则、semantic_posture 定义、schema 迁移占位**

**Goal:** 在 schema.md 和 SKILL.md 中补充三处小型但重要的规则说明：JSON 是 task_id 权威源；semantic_posture 值定义；schema 版本迁移占位。

**Requirements:** R5、R6、R7、R8

**Dependencies:** U1、U3、U4（schema.md 部分：须在 U1 的 Optional Task Fields 和 U4 的 Execution Waves 完成后，再写 U5 的 Deterministic Lint 和 Schema Version 章节；SKILL.md 部分：须在 U3 的 Task-Ready Check 改动完成后，再写 U5 的 Final Decision Envelope。注：U3 不修改 schema.md，U5 的 schema.md 改动无需等待 U3，但整体 U5 须等全部三者完成）

**Files:**
- Modify: `skills/spec-write-tasks/references/task-pack-schema.md`
- Modify: `skills/spec-write-tasks/SKILL.md`

**Approach:**

_R5 — JSON/Markdown task_id 同步（schema.md Deterministic Lint 章节末尾）：_
追加一条 lint 规则说明：`task_id` 集合在 Task Pack Contract JSON block 和人类可读 Task Cards 两处应当一致；若两者矛盾，以 JSON block 为准；建议 script 可检查两处 `task_id` 集合是否对齐。

_R6 — semantic_posture 定义（SKILL.md Final Decision Envelope 正文中）：_
在 decision envelope yaml 模板后，紧接着加一个 `semantic_posture` 定义块：

```
`semantic_posture` 值定义：

| 值 | 触发条件 |
|----|---------|
| `generated-this-run` | spec-write-tasks 在本次运行中生成了 task pack |
| `reviewed-existing` | 本次运行读取并语义审查了现有 task pack 的质量（不仅是结构验证） |
| `unchecked-existing` | 本次运行仅做结构/hash 验证，未检查任务分割语义 |
| `not-applicable` | 未生成、未验证 task pack（decision: skip 等） |
```

`next_action: spec-work-task-pack` 只在 `semantic_posture` 为 `generated-this-run` 或 `reviewed-existing` 时允许，与现有规则一致。

_R7 — plan 小幅变更 UX（schema.md Regeneration Rules 末尾）：_
追加一条判断提示（非强制规则）：当 plan 有小幅更改时，可先运行 `spec-first tasks hash <plan-path>` 检测 plan body 是否发生变化；若 hash 不变，无需重建；若 hash 变化，按现有硬性规则执行重建（hash 不匹配时必须拒绝执行并完整重建 task pack）。注意：`spec-first tasks validate` 只检验结构合规性，不判断 plan 变更是否影响任务文件集，不能用于决定是否跳过重建。

_R8 — schema 版本迁移占位（schema.md 末尾或 `## Deterministic Lint` 后）：_
新增一节 `## Schema Version and Migration`，内容：`schema_version` 字段位于 Task Pack Contract JSON block（不在 frontmatter），当前值为 `"task-pack/v1"`；若 schema 升级为 v2，旧版 task pack 的处理策略（拒绝、降级执行、迁移）应在新版本的 `task-pack-schema.md` 中明确；`validateTaskPackContract` 在 `schema_version` 不匹配时已发出 error，旧版 task pack 必须重建后才能执行。

**Patterns to follow:**
- SKILL.md Final Decision Envelope 中的 yaml 和表格格式
- schema.md Deterministic Lint 章节的散文列表风格

**Test scenarios:**
- Happy path: 读取 schema.md Deterministic Lint，找到 task_id 集合一致性规则说明
- Happy path: 读取 SKILL.md，Final Decision Envelope 区域包含 semantic_posture 定义表
- Happy path: 读取 schema.md，存在 Schema Version and Migration 章节
- Edge case: semantic_posture 定义与 Final Decision Envelope yaml 模板中的值一一对应

**Verification:**
- executor 读取 SKILL.md 后，能根据本次运行的操作类型选取正确的 semantic_posture 值
- schema.md 的 Lint Boundary 说明是完整的（包含 task_id 一致性）

---

- U6. **更新契约测试覆盖新增规则**

**Goal:** 在 `spec-write-tasks-contracts.test.js` 中为 U1–U5 新增的文本规则添加断言，确保 prose 的稳定性。

**Requirements:** R1–R8

**Dependencies:** U1、U2、U3、U4、U5（所有 prose 变更需完成，才能写出精确的文本断言）

**Files:**
- Modify: `tests/unit/spec-write-tasks-contracts.test.js`

**Approach:**
- **前置步骤 A**：在写断言前，读取 U1–U5 实际提交后的 SKILL.md、task-pack-schema.md、task-quality-guide.md，确认各变更的实际措辞，以确保断言字符串精确匹配，而非依赖计划中的意图描述。
- **前置步骤 B**：读取 `tests/unit/spec-write-tasks-contracts.test.js` 当前内容，列出 Codex runtime sync 测试（`test('codex runtime sync...')`）实际检查的 prose 关键词，确认 U6 新增断言能覆盖关键词变化场景。
- 在 `test('task pack schema requires executable handoff metadata and quality structures', ...)` 中添加：
  - `expect(schema).toContain('orientation_evidence')` 断言 Optional Task Fields 有该字段
  - `expect(schema).toContain('task_id')` 并添加对 JSON/Markdown 一致性说明的关键词断言
  - `expect(schema).toContain('Schema Version and Migration')` 
- 在 `test('quality guide owns quality examples...')` 中添加：
  - `expect(guide).toContain('ESCALATE_TO_PLAN')` 或 stop 类型分类表格中的特征关键词
  - `expect(guide).toContain('optional task field')` 关于 orientation_evidence 的 optional 注记
- 在 `test('source skill preserves derived-task-pack boundaries...')` 中添加：
  - `expect(skill).toContain('status: "draft"')` 或 draft-only cross-reference 特征词
  - `expect(skill).toContain('semantic_posture')` 已有，追加 `expect(skill).toContain('generated-this-run')` 以确认定义表存在
  - `expect(skill).toContain('wave + 1')` 或 serialize 定义特征词
- 运行 `npm run test:unit` 验证所有断言通过，无 false positive。

**Patterns to follow:**
- `tests/unit/spec-write-tasks-contracts.test.js` 现有 `toContain` 断言模式
- 测试代码中的 `read(SKILL_PATH)` / `read(SCHEMA_PATH)` / `read(GUIDE_PATH)` 工具函数

**Test scenarios:**
- Happy path: `npm run test:unit` 包含 `spec-write-tasks-contracts` 的测试组全部通过
- Error path: 若 prose 中关键词缺失，断言失败并精确定位到哪条规则未实现

**Verification:**
- `npm run test:jest -- tests/unit/spec-write-tasks-contracts.test.js --runInBand` 零失败

---

## System-Wide Impact

- **Interaction graph:** skill prose 改动不影响 `src/cli/task-pack.js`、`spec-first tasks validate`、CRG hooks 的行为；仅影响 LLM 加载 skill 后的决策输出。
- **Error propagation:** 不涉及新错误路径。
- **State lifecycle risks:** 无持久化状态变化。
- **API surface parity:** `spec-work` 和 `spec-work-beta` 消费 task pack 的逻辑不受影响（它们依赖 JSON block，不依赖 prose 规则）。
- **Integration coverage:** 契约测试（U6）通过文本断言间接验证 LLM 行为预期；不需要 e2e 验证。
- **Unchanged invariants:** `src/cli/task-pack.js` 的 lint 逻辑、task pack JSON schema 的机器可读格式、`schema_version: "task-pack/v1"` 的值均不变。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| prose 修改后 spec-first init 生成 Codex 侧运行时资产时，可能因关键词变化导致 Codex 运行时合同测试失败 | U6 中 `npm run test:unit` 覆盖 Codex runtime sync 测试（`test('codex runtime sync...')`），可检测 |
| semantic_posture 定义表的措辞与 Final Decision Envelope yaml 不对齐 | U5 测试用断言同时检查 yaml 值和定义表关键词 |
| 多个 unit 都修改 SKILL.md，串行执行时前一个 unit 的改动未保存即被后序覆盖 | 依赖链已明确（U2 → U3，U3 → U5），执行时每个 unit 完成后需确认文件保存 |

---

## Sources & References

- 审查来源：本次对话中的 `spec-write-tasks` skill 代码评审结果（非外部文档）
- `skills/spec-write-tasks/SKILL.md`
- `skills/spec-write-tasks/references/task-pack-schema.md`
- `skills/spec-write-tasks/references/task-quality-guide.md`
- `tests/unit/spec-write-tasks-contracts.test.js`
- `src/cli/task-pack.js`（参照，不修改）
