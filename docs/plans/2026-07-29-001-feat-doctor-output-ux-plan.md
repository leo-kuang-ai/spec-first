---
title: Doctor Output UX - Plan
type: feat
date: 2026-07-29
topic: doctor-output-ux
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-brainstorm
execution: code
status: completed
completed_at: 2026-08-02
revalidated_at: 2026-09-09
source_snapshot: d2f7679e
claim_status: closed
claim_closed_at: 2026-08-02
claim_evidence: 4c7a2cce implementation, focused doctor-output/runtime-assets tests, packaged CLI smoke, README/FAQ/CHANGELOG updates
claim_known_limitation: field usability was not independently measured; later host and JSON projection additions are recorded as current contract, not part of the original implementation snapshot; full unit remains affected by an unrelated stale CE localization snapshot
---

# Doctor Output UX - Plan

> **完成说明（2026-08-02；2026-09-09 重验）：** U1–U3 的原始交付已由 `4c7a2cce` 落地：默认总览、`--verbose`、JSON 优先级、处置分层、测试和用户文档均已有实现。后续宿主扩展与 `runtime_status_projections`/`selection_mode` 等 additive JSON 字段属于当前兼容基线；本计划不再作为待执行任务。重验已补齐错误退出、无宿主矩阵、安全处置和 verbose 证据维度覆盖。当前仍保留 field usability 未独立测量，以及完整 unit 中与本变更无关的 CE localization snapshot stale 限制。

## Goal Capsule

- **Objective:** 让运行 `spec-first doctor` 的开发者在默认输出首屏判断是否可用、哪些宿主需要处理，以及如何处理。
- **Recommended approach:** 复用现有 `buildDoctorReport()` 及其 `runtime_status_projections` 作为唯一事实来源，在 human renderer 中派生总览、宿主状态和按 disposition 分层的处置项；`--verbose` 只扩展人类呈现，`--json` 继续直出当前报告。
- **Product authority:** 当前用户。
- **Verification focus:** 以纯人类输出单测锁定状态、disposition、归因和修复边界，以 CLI smoke 锁定 `--verbose`、`--json`、错误退出码和无宿主分支的兼容性。
- **Largest boundary:** 不能把新的呈现层变成第二套诊断模型，也不能让人类输出变化影响 JSON 字段或退出码。
- **Open blockers:** 无实现阻塞；field usability 未独立测量，完整 unit 仍有与本变更无关的 CE localization snapshot stale 失败。

---

## Product Contract

### Summary

为 `spec-first doctor` 提供渐进披露的人类可读输出。
默认模式显示简明总览与按 disposition 分层的处置项，`--verbose` 保留完整检查明细，机器消费的当前 `--json` 契约保持兼容。

### Problem Frame

当前人类输出逐项打印公共检查和每个宿主的所有检查结果。
在多宿主项目中，重复的通过项会淹没整体可用性、受影响宿主和修复路径，迫使开发者从长清单中自行归纳结论。

### Key Decisions

- **渐进披露是默认体验。** 默认模式优先展示决策所需信息，完整诊断移入显式 `--verbose`，避免把高频健康检查变成长日志阅读任务。
- **`WARNING` 是机器等级，不直接等于用户处置。** `action_required` 才进入“需处理”；`optional`、`known_limitation`、`degraded`、`not_run` 分别进入对应区块，不把非阻断或证据限制误导为必修故障。存在 `ERROR` 时为“不可用”；只有 action-required warning 时为“可用，但需处理”；其余 warning 仍为“可用”但保留显式说明。
- **修复建议遵守安全边界。** `fix` 只是 producer 提供的用户下一步建议，不是自动执行授权或安全证明；只有 producer 明确设置 `fixSafety: "safe"` 时 renderer 才使用“修复”，缺省或其他值均使用“需要人工处理”。renderer 再按 disposition 使用“按需操作”“验证建议”或“下一步”；涉及用户拥有内容、冲突、覆盖、删除或不确定风险的事项必须由 producer 转为非强制处置并解释原因。
- **人类与机器输出分离演进。** 人类呈现可渐进演进；当前 JSON 已包含 `selection_mode`、`runtime_status_projections` 等 additive 字段，字段语义与退出语义不得回退或删除。

### Requirements

**默认总览**

- R1. 未使用 `--verbose` 时，输出必须以整体可用性结论开头，并区分“可用”“可用，但需处理”和“不可用”；optional/known-limitation/degraded/not-run 不得默认升级为“需处理”。
- R2. 默认总览必须列出每个被检查宿主的状态，使开发者无需阅读完整检查项即可识别受影响宿主。
- R3. 默认模式只展开非通过项，并按 `action_required`、`optional`、`known_limitation`、`degraded`、`not_run` 分区；不逐项输出正常检查的明细。

**处置与深度**

- R4. 每个 action-required 项必须给出下一步处置路径；optional、known-limitation、degraded、not-run 必须给出对应的按需操作、验证建议、降级说明或未执行说明。无法安全自动修复时，必须说明需要人工处理及其原因。
- R5. `--verbose` 必须提供完整检查明细，供需要诊断依据的开发者继续查看。

**兼容性**

- R6. 当前 `--json` 的字段语义和 `doctor` 的退出语义保持兼容；既有 additive 字段不得删除，`--json --verbose` 仍为纯 JSON。

- R7. “可用”只表示 doctor 管理的 CLI、runtime asset 和 host readiness 没有阻断性错误；`workflow_runnability` 与 `decision_input_health` 是独立证据维度，必须在 JSON/详细诊断中保持可见，不得被“可用”表述升级为 workflow 已验证。

- R8. 无宿主时必须明确 default、`--verbose`、`--json` 的输出和退出码；保留初始化引导时，它是下一步提示，不得静默替代已定义的报告契约。

### Acceptance Examples

- AE1. **Covers R1, R2, R3, R4.** 当 Codex 存在 action-required warning 且没有 `ERROR` 时，默认输出先显示“可用，但需处理”，在宿主总览中标出 Codex，并给出处置路径；正常检查明细不出现。
- AE2. **Covers R1, R2, R4.** 当任一宿主存在 `ERROR` 时，默认输出显示“不可用”，列出所有受影响宿主及对应处置路径。
- AE3. **Covers R1, R2, R3.** 当全部检查通过时，默认输出显示“可用”和各宿主正常状态，不输出完整的通过项清单。
- AE4. **Covers R5.** 当用户传入 `--verbose` 时，输出包含完整检查明细，使用户能够追溯默认总览省略的通过项。
- AE5. **Covers R6.** 当用户传入 `--json` 时，输出继续提供现有机器消费的报告字段，且同一检查结果维持既有退出语义。
- AE6. **Covers R3, R4, R7.** 当自动探测到非当前宿主的 optional CLI 缺失、known limitation 或 degraded evidence 时，默认输出分别进入“按需配置”“已知限制”或“降级状态”，整体仍可用且不生成误导性的强制修复。
- AE7. **Covers R8.** 无宿主时 default 保留初始化引导；`--verbose` 不伪造宿主明细；`--json` 返回当前空宿主报告并使用明确、稳定的退出码。
- AE8. **Covers R6.** 构造 `ERROR` 报告时，`--json` 与 `--json --verbose` 均返回 `3`、stdout 可解析且不夹杂人类输出；未知参数仍返回 `2`。

### Success Criteria

- 开发者只阅读默认输出即可回答“是否可用、哪些宿主有问题、如何修复”三个问题。
- 详细诊断仍可通过 `--verbose` 获得，不要求开发者在简明模式与可追溯性之间取舍。
- “可用”只描述 doctor 管理的 CLI、runtime asset 和 host readiness 没有阻断性错误；不等同于 workflow 已完成真实验证。

### Scope Boundaries

- 不改变检查项目、告警阈值、宿主检测范围或检查结果的事实含义。
- 不在 `doctor` 中自动运行修复、删除用户文件或处理所有权不明确的冲突。
- 不删除当前 `--json` 的字段、projection 或机器语义；允许在后续版本中以 additive 方式扩展，但必须保留 consumer 兼容性和退出语义。

### Dependencies / Assumptions

- `buildDoctorReport()` 的 `common_checks`、`platform_checks`、`warnings`、`has_error`、`selection_mode`、`host_support` 与 `runtime_status_projections` 共同构成当前事实；human renderer 不新增检查或持久化状态模型。
- `workflow_runnability` 与 `decision_input_health` 不被折叠成“workflow 已验证”；它们作为独立证据维度在 JSON/详细诊断中保留，并由各自的 basis/fallback reason 解释。
- 同时传入 `--json` 与 `--verbose` 时，`--json` 保持优先，仅输出当前 JSON 报告；这是机器消费兼容性优先于人类呈现偏好的选择。
- `doctor` 只展示用户下一步可执行的建议，不在检查过程中运行修复、删除文件或覆盖用户拥有的配置。处置安全边界由检查 producer 的 disposition、`fixSafety` 和说明负责；缺失或不确定时明确要求人工处理。

### Sources / Research

- `src/cli/commands/doctor.js:30-323`：当前参数、人类 formatter、disposition 投影、安全处置、证据维度、按需/限制/降级/未执行区块和详细检查输出。
- `src/cli/commands/doctor.js:1169-1305`：当前报告、`selection_mode`、`host_support`、`runtime_status_projections` 与 JSON 序列化边界。
- `docs/contracts/verification/runtime-status-projection.schema.json:1-42`：runtime projection 的 schema 与 disposition 枚举。

**Source snapshot and limits:** 原始计划基线为 `git:5461c55e`；已在 `d2f7679e` 重验。当前宿主集合已扩展到 ZCode/Pi，JSON 已有 additive projection 字段。证据覆盖源码、相关测试、Changelog 和既有 CLI smoke，不覆盖不同规模项目中的真实用户阅读效果；报告模型、检查分类或宿主集合变化时仍需更新本计划或继任计划。

---

## Planning Contract

### Technical Approach

保留 `buildDoctorReport()` 作为检查事实、等级、宿主归属、disposition、`fixSafety` 与安全处置标记的唯一生产者。human renderer 只读取报告并生成两种视图：默认视图先给总体结论、逐宿主状态和按 disposition 分区的非通过项；详细视图在相同总览之后追加证据维度与现有粒度的完整检查明细。`workflow_runnability` 与 `decision_input_health` 作为独立证据维度保留，不被“可用”升级为 workflow 已验证；呈现层不重新判断诊断事实。

| 调用方式 | 输出范围 | 兼容性规则 |
| --- | --- | --- |
| 默认 | 整体状态、每个宿主状态、按 disposition 分区的非通过项及处置路径 | 隐藏 `PASS` 明细 |
| `--verbose` | 默认总览 + 所有公共与宿主检查明细 | 保留逐项诊断可追溯性 |
| `--json`（含与 `--verbose` 组合） | 当前 JSON 报告，包括 additive projection 字段 | 不删除既有字段；语义与退出码兼容；忽略人类呈现模式 |

整体状态以现有 `has_error` 与 disposition 派生：含 `ERROR` 为“不可用”；无 `ERROR` 但存在 `action_required` warning 为“可用，但需处理”；只有 optional、known-limitation、degraded 或 not-run 时仍为“可用”，但必须在对应区块显式说明。每个宿主按其检查的最严重 disposition、host support 和显式/自动选择模式显示正常、需处理、未安装、预览/受限、未执行或有问题。公共检查问题以“通用环境”单独归因，不伪装为某一个宿主的问题。

### Interface Contracts

- **Evolution:** 增加 `spec-first doctor --verbose`，并将无 `--json` 的默认终端输出收敛为总览优先的中文呈现。
- **Canonical owner:** `src/cli/commands/doctor.js`；检查结果仍只由 `buildDoctorReport()` 和既有检查函数产生。
- **Consumers:** 终端中的开发者消费默认/详细呈现；脚本和 CI 消费既有 `--json` 报告。
- **Compatibility:** 当前 `--json` 的序列化字段、字段意义和 `ERROR`→退出码 `3` 的规则保持兼容；`runtime_status_projections`、`selection_mode` 和 checks 中的 disposition 属于当前 additive contract，不得删除；未知参数仍返回用法错误；`--verbose` 与 `--json` 组合不改变 JSON 输出。
- **Source/runtime boundary:** 只改 `src/cli/commands/doctor.js`、测试和文档；不修改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/` 或 `.qoder/` 的生成 runtime。

### Presentation and Safety Rules

- 默认输出以一行结论开头，随后固定展示“宿主状态”和 disposition 区块：`需要处理`、`按需配置`、`已知限制`、`降级状态`、`未执行`；没有需要处理项时明确显示无需处置。
- 每一条 action-required 项只有在报告 producer 明确声明安全时才使用“修复”；否则输出“需要人工处理”及原因。optional 使用“按需操作”，known-limitation 使用“验证建议”或“不需手工修改”，degraded/not-run 使用“下一步”或证据限制说明。
- `--verbose` 复用既有公共检查与平台检查的顺序/信息，并在总览后用“详细检查”区块输出全部项；不会省略通过项。
- 无检测到宿主时，default 保留初始化引导并明确退出码；`--verbose` 不伪造宿主明细；`--json` 返回当前空宿主报告。该分支仍应保留公共环境检查事实和 JSON 兼容性，不自动执行 `init`。

### Reuse / Extend / Compose / New

- **Reuse:** `buildDoctorReport()`、`check.level`/`disposition`/`runtimeStatus`/`fix`/`fixSafety` 字段、`buildRuntimeStatusProjection()`、`printDoctorJson()` 和现有退出码路径。
- **Extend:** 参数解析、人类输出入口和 disposition/fix safety 投影；`--verbose` 继续只改变人类呈现。
- **Compose:** human renderer 将公共检查、按宿主检查、host support、disposition 和证据维度组合成面向人类的视图。
- **New:** 不创建第二个诊断模型、持久化状态或自动修复器；runtime projection/schema 已是当前既有 contract，本计划只保护其兼容性。

### Deferred to Follow-Up Work

- 不在本变更中增加颜色/TTY 检测、交互式修复、等级配置、筛选单个检查或新的 JSON schema 版本；这些能力没有当前用户需求，也会扩大稳定 CLI 契约。

---

## Implementation Units

### U1. 实现总览优先的人类诊断呈现

**Goal:** 将当前逐项直打的非 JSON 路径改为报告驱动的默认总览，并以 `--verbose` 保留完整诊断。

**Status:** completed in `4c7a2cce`; current source revalidated at `d2f7679e`.

**Requirements:** R1–R8；AE1–AE8。

**Dependencies:** 无。

**Files:** `src/cli/commands/doctor.js`。

**Approach:** 已由 `formatDoctorHumanReport()`、`buildRuntimeStatusProjection()` 和 `runDoctor()` 落地：从同一份报告归约整体状态、每宿主状态、disposition 区块与通用环境处置；默认仅渲染非通过项，详细模式在总览后追加证据维度和完整明细。`--json` 保持优先，继续沿用报告退出语义；fix 只是 producer 提供的用户下一步建议，renderer 不执行变更，只有 `fixSafety: "safe"` 才标为“修复”，安全未知或无 fix 时转人工处理。

**Patterns to follow:** `buildDoctorReport()` 的集中报告构造、`printDoctorJson()` 的序列化边界，以及当前检查项的 `level`/`message`/可选 `fix`/`fixSafety` 字段。

**Test scenarios:**

- Covers AE3. 全部检查通过时，默认输出首先说明“可用”，列出每个宿主正常状态，不泄露通过项明细。
- Covers AE1. 仅 Codex 有 action-required `WARNING` 时，默认输出为“可用，但需处理”，问题归因到 Codex 并显示 producer 声明安全的修复建议。
- Covers AE2. 宿主或公共检查有 `ERROR` 时，默认输出为“不可用”；公共问题标为通用环境，宿主问题归因到对应宿主。
- Covers AE2. 缺少 `fix` 或缺省 `fixSafety` 的非通过项输出人工处理边界与原因，不生成危险或臆测的自动修复命令。
- Covers AE4. `--verbose` 总览后包含公共和宿主的 `PASS`/`WARNING`/`ERROR` 明细。
- Covers AE5. `--json --verbose` 仍只输出 JSON，且退出码与同一报告的 `--json` 一致。
- Covers AE6. optional、known-limitation、degraded、not-run 不被渲染为强制修复。
- Covers AE7. 无宿主分支保留初始化引导，不伪造宿主明细。

**Verification:** 人类输出只派生自同一份报告；默认屏幕回答三个用户问题，详细模式可追溯所有检查及 workflow/decision 证据维度，JSON 字段与退出语义保持兼容；缺省 `fixSafety` 的建议进入人工处理边界。

### U2. 锁定输出契约与 CLI 兼容性

**Goal:** 用聚焦单测和现有打包 smoke 覆盖新的人类输出、参数优先级与既有 JSON 合同。

**Status:** completed and revalidated at `d2f7679e`.

**Requirements:** R1–R8；AE1–AE8。

**Dependencies:** U1。

**Files:** `tests/unit/doctor-output.test.js`、`tests/unit/doctor-runtime-assets.test.js`、`tests/unit/doctor-platform-cli.test.js`、`tests/smoke/cli-smoke.test.js`。

**Approach:** 让新 formatter 接受构造的报告 fixture，以最小测试成本覆盖三个整体状态、公共/宿主归因、修复/人工处理边界和详细模式；用 `runDoctor()` 或打包 CLI 覆盖 `--verbose` 参数与 JSON 优先级。保留现有 runtime inventory 的 JSON 断言，不以 snapshot 锁死与本需求无关的诊断文本。

**Patterns to follow:** `tests/unit/doctor-runtime-assets.test.js` 对 `console.log`、临时项目和 `runDoctor()` 的隔离方式；`tests/smoke/cli-smoke.test.js` 对打包 CLI JSON 报告的端到端检查。

**Test scenarios:**

- 构造全通过、仅警告、含错误和无修复建议的报告，断言默认行集合及顺序。
- 断言详细模式含默认总览与被默认模式省略的通过检查。
- 断言 `--json --verbose` 可解析为既有报告对象，且不夹杂人类行。
- 在现有 consumer 打包 smoke 中运行一次非 JSON `doctor --<host> --verbose`，验证新 flag 被 CLI 接受并保留成功退出。
- 构造 `ERROR` 结果，断言 `--json` 与 `--json --verbose` 均返回 `3` 且 stdout 为纯 JSON；未知参数返回 `2`。
- 在无宿主临时项目中分别断言 default、`--verbose` 和 `--json` 的初始化引导、公共检查、空宿主报告和退出码。
- 断言 verbose 显示 `decision_input_health`、`workflow_runnability` 及其 fallback reason；缺省 `fixSafety` 的 action-required 建议显示人工处理边界。

**Verification:** 新测试可独立证明人类输出规则；现有 JSON/runtime smoke 继续通过，避免把呈现变更误当成 runtime 检查语义变更。

### U3. 更新可发现的用户文档与发布记录

**Goal:** 让用户知道默认总览、`--verbose` 与 `--json` 分别何时使用，并将本次用户可见 CLI 变化记入 Changelog。

**Status:** completed in `4c7a2cce`; current docs revalidated and aligned with disposition output.

**Requirements:** R5–R7。

**Dependencies:** U1、U2。

**Files:** `README.md`、`README.zh-CN.md`、`docs/05-用户手册/04-常见问题.md`、`CHANGELOG.md`。

**Approach:** 在双语 README 的 doctor 入口用一句话说明默认总览、警告仍可用与 `--verbose`；在用户手册给出默认/详细/JSON 的职责边界和“doctor 不自动修复”的安全说明；按当前 Changelog 格式记录最终行为、兼容性和验证，不宣称修改 generated runtime。

**Test scenarios:**

- 文档明确 `--verbose` 用于完整诊断，`--json` 用于脚本/CI，二者的优先级不产生歧义。
- 文档不承诺 `doctor` 自动修复或修改用户配置。
- 文档明确 `WARNING` 的 machine level 与 disposition 的用户处置不是同一概念，并说明 `workflow_runnability` 不等同于已完成真实验证。

**Verification:** 阅读 README/FAQ 可选择正确模式；Changelog 格式校验覆盖新增条目。

---

## Verification Contract

- 运行 `npx jest tests/unit/doctor-output.test.js tests/unit/doctor-runtime-assets.test.js tests/unit/doctor-platform-cli.test.js --runInBand`，验证 disposition、无宿主、JSON/error 退出和既有 runtime inventory。
- 运行 `npm run typecheck`，确保 CLI 与新增测试语法有效。
- 运行 `npm run test:unit` 与 `npm run test:smoke`，验证完整单元层和打包 CLI 流程。
- 在当前仓库运行 `node bin/spec-first.js doctor --codex`、`node bin/spec-first.js doctor --codex --verbose`、`node bin/spec-first.js doctor --codex --json`，并在空临时项目运行 default/`--verbose`/`--json`；将真实环境诊断视为宿主事实，不把它当成所有 fixture 场景的替代。
- 运行 `git diff --check`；检查变更仅覆盖 U1–U3 的 canonical source、测试、文档、计划及 Changelog，未包含其他 dirty path。

---

## Definition of Done

- [x] 默认 `doctor` 首屏给出“可用”“可用，但需处理”或“不可用”，并按 disposition 显示每个已检查宿主状态和处置项。
- [x] 每个非通过项都有 producer 提供的安全处置建议，或明确的人工处理/已知限制边界；命令不会自动修复或写入项目。
- [x] `--verbose` 给出总览和完整检查明细；无宿主时保留初始化引导，不伪造宿主明细。
- [x] 当前 `--json` 字段、projection、机器语义和 `ERROR` 的退出码保持兼容，`--json --verbose` 仍为纯 JSON。
- [x] U1–U3 的实现、聚焦测试、typecheck、smoke、真实 CLI 检查和 diff 检查已按适用性完成并记录；负向退出/无宿主回归已补入 U2。
- [x] 未手改 generated runtime assets；用户文档和 Changelog 与最终行为一致。

**Completion evidence:** `4c7a2cce` 原始实现，`d2f7679e` 当前 source snapshot；focused doctor tests `24/24`、`npm run typecheck` `257` files、`npm run test:smoke` `5/5`、真实仓库与空临时项目的 doctor 三模式检查均通过；`CHANGELOG.md` v1.15.3 doctor 条目。完整 unit 为 `2506 passed, 1 failed`，唯一失败是与本变更无关的 CE localization snapshot stale；field usability 仍为 `not_run`。
