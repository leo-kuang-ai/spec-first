---
title: Doctor Output UX - Plan
type: feat
date: 2026-07-29
topic: doctor-output-ux
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-brainstorm
execution: code
status: active
---

# Doctor Output UX - Plan

## Goal Capsule

- **Objective:** 让运行 `spec-first doctor` 的开发者在默认输出首屏判断是否可用、哪些宿主需要处理，以及如何处理。
- **Recommended approach:** 复用现有 `buildDoctorReport()` 作为唯一事实来源，在 human renderer 中派生总览、宿主状态和待处理项；`--verbose` 只扩展人类呈现，`--json` 继续直出原报告。
- **Product authority:** 当前用户。
- **Verification focus:** 以纯人类输出单测锁定状态/归因/修复边界，以 CLI smoke 锁定 `--verbose` 与 `--json` 的兼容性。
- **Largest boundary:** 不能把新的呈现层变成第二套诊断模型，也不能让人类输出变化影响 JSON 字段或退出码。
- **Open blockers:** 无；默认体验、告警语义、详细模式和安全修复边界均已确认。

---

## Product Contract

### Summary

为 `spec-first doctor` 提供渐进披露的人类可读输出。
默认模式显示简明总览与待处理项，`--verbose` 保留完整检查明细，机器消费的 `--json` 契约保持不变。

### Problem Frame

当前人类输出逐项打印公共检查和每个宿主的所有检查结果。
在多宿主项目中，重复的通过项会淹没整体可用性、受影响宿主和修复路径，迫使开发者从长清单中自行归纳结论。

### Key Decisions

- **渐进披露是默认体验。** 默认模式优先展示决策所需信息，完整诊断移入显式 `--verbose`，避免把高频健康检查变成长日志阅读任务。
- **`WARNING` 仍表示可用。** 无 `ERROR` 时总览必须说明“可用”；存在 `WARNING` 时使用“可用，但需关注”，不将非阻断项误导为不可用。
- **修复建议遵守安全边界。** 可安全执行的修复给出明确操作；涉及用户拥有内容、冲突或不确定风险的事项必须标为人工处理并解释原因。
- **人类与机器输出分离演进。** 本次只改变人类可读呈现，不改变 `--json` 的字段语义或退出语义。

### Requirements

**默认总览**

- R1. 未使用 `--verbose` 时，输出必须以整体可用性结论开头，并区分“可用”“可用，但需关注”和“不可用”。
- R2. 默认总览必须列出每个被检查宿主的状态，使开发者无需阅读完整检查项即可识别受影响宿主。
- R3. 默认模式只展开 `WARNING` 和 `ERROR` 的待处理项，不逐项输出正常检查的明细。

**处置与深度**

- R4. 每个待处理项必须给出下一步处置路径；无法安全自动修复时，必须说明需要人工处理及其原因。
- R5. `--verbose` 必须提供完整检查明细，供需要诊断依据的开发者继续查看。

**兼容性**

- R6. `--json` 的机器消费字段语义和 `doctor` 的退出语义保持不变。

### Acceptance Examples

- AE1. **Covers R1, R2, R3, R4.** 当检查没有 `ERROR` 但 Codex 存在警告时，默认输出先显示“可用，但需关注”，在宿主总览中标出 Codex，并在该告警下给出处置路径；正常检查明细不出现。
- AE2. **Covers R1, R2, R4.** 当任一宿主存在 `ERROR` 时，默认输出显示“不可用”，列出所有受影响宿主及对应处置路径。
- AE3. **Covers R1, R2, R3.** 当全部检查通过时，默认输出显示“可用”和各宿主正常状态，不输出完整的通过项清单。
- AE4. **Covers R5.** 当用户传入 `--verbose` 时，输出包含完整检查明细，使用户能够追溯默认总览省略的通过项。
- AE5. **Covers R6.** 当用户传入 `--json` 时，输出继续提供现有机器消费的报告字段，且同一检查结果维持既有退出语义。

### Success Criteria

- 开发者只阅读默认输出即可回答“是否可用、哪些宿主有问题、如何修复”三个问题。
- 详细诊断仍可通过 `--verbose` 获得，不要求开发者在简明模式与可追溯性之间取舍。

### Scope Boundaries

- 不改变检查项目、告警阈值、宿主检测范围或检查结果的事实含义。
- 不在 `doctor` 中自动运行修复、删除用户文件或处理所有权不明确的冲突。
- 不改变 `--json` 的输出结构、机器语义或既有退出语义。

### Dependencies / Assumptions

- `buildDoctorReport()` 的 `common_checks`、`platform_checks`、`warnings` 与 `has_error` 已足以派生总览，不新增第二个检查或持久化状态模型。
- 同时传入 `--json` 与 `--verbose` 时，`--json` 保持优先，仅输出既有 JSON 报告；这是机器消费兼容性优先于人类呈现偏好的选择。
- `doctor` 只展示用户下一步可执行的建议，不在检查过程中运行修复、删除文件或覆盖用户拥有的配置。缺失安全修复建议时，明确要求人工处理并解释边界。

### Sources / Research

- `src/cli/commands/doctor.js:28-103`：当前人类可读路径顺序打印公共检查与每个宿主的所有检查项，并在检查项含有修复建议时追加 `Fix` 行。
- `src/cli/commands/doctor.js:953-1068`：当前报告已包含安装、运行时资产、宿主就绪和工作流可运行性等汇总字段，以及按宿主组织的检查和 `--json` 输出。

**Source snapshot and limits:** 在 `git:5461c55e` 的当前工作树读取上述 source，读取时这两个文件未显示为本地修改。现有证据只覆盖源码与一次真实命令输出，不覆盖不同规模项目中的真实用户阅读效果；若 `doctor` 的报告模型、检查分类或人类输出入口变化，应重新验证本计划的呈现前提。

---

## Planning Contract

### Technical Approach

保留 `buildDoctorReport()` 作为检查事实、等级、宿主归属与 `fix` 的唯一生产者。新增的 human renderer 只读取报告并生成两种视图：默认视图先给总体结论、逐宿主状态和非通过项；详细视图在相同总览之后追加现有粒度的完整检查明细。这样检查语义、JSON 序列化和退出码仍由现有报告/执行路径拥有，呈现层不重新判断诊断事实。

| 调用方式 | 输出范围 | 兼容性规则 |
| --- | --- | --- |
| 默认 | 整体状态、每个宿主状态、`WARNING`/`ERROR` 待处理项及修复路径 | 隐藏 `PASS` 明细 |
| `--verbose` | 默认总览 + 所有公共与宿主检查明细 | 保留逐项诊断可追溯性 |
| `--json`（含与 `--verbose` 组合） | 现有 JSON 报告 | 字段、语义与退出码不变；忽略人类呈现模式 |

整体状态以现有 `has_error` 和检查等级派生：含 `ERROR` 为“不可用”；无 `ERROR` 且含 `WARNING` 为“可用，但需关注”；否则为“可用”。每个宿主按其 `platform_checks[platform]` 中最严重等级显示正常、需关注或有问题。公共检查问题以“通用环境”单独归因，不伪装为某一个宿主的问题。

### Interface Contracts

- **Evolution:** 增加 `spec-first doctor --verbose`，并将无 `--json` 的默认终端输出收敛为总览优先的中文呈现。
- **Canonical owner:** `src/cli/commands/doctor.js`；检查结果仍只由 `buildDoctorReport()` 和既有检查函数产生。
- **Consumers:** 终端中的开发者消费默认/详细呈现；脚本和 CI 消费既有 `--json` 报告。
- **Compatibility:** `--json` 的序列化字段、字段意义和 `ERROR`→退出码 `3` 的规则不变；未知参数仍返回用法错误；`--verbose` 与 `--json` 组合不改变 JSON 输出。
- **Source/runtime boundary:** 只改 `src/cli/commands/doctor.js`、测试和文档；不修改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/` 或 `.qoder/` 的生成 runtime。

### Presentation and Safety Rules

- 默认输出以一行结论开头，随后固定展示“宿主状态”和“待处理项”；没有待处理项时明确显示无需处置。
- 每一条 `WARNING`/`ERROR` 使用报告中的 `fix` 作为修复路径。若检查没有 `fix`，输出“需要人工处理”，并说明未提供可安全自动执行的修复，避免建议覆盖、删除或猜测用户拥有的配置。
- `--verbose` 复用既有公共检查与平台检查的顺序/信息，并在总览后用“详细检查”区块输出全部项；不会省略通过项。
- 无检测到宿主时，保持现有初始化引导，不将其改写为检查失败或自动执行 `init`。

### Reuse / Extend / Compose / New

- **Reuse:** `buildDoctorReport()`、现有 `check.level`/`fix` 字段、`printDoctorJson()` 和现有退出码路径。
- **Extend:** 参数解析与帮助文本增加 `--verbose`；人类输出入口委托给新的格式化 helper。
- **Compose:** human renderer 将公共检查、按宿主检查和等级归约组合成面向人类的视图。
- **New:** 不创建新 schema、诊断持久化、自动修复器或 runtime projection。

### Deferred to Follow-Up Work

- 不在本变更中增加颜色/TTY 检测、交互式修复、等级配置、筛选单个检查或新的 JSON schema 版本；这些能力没有当前用户需求，也会扩大稳定 CLI 契约。

---

## Implementation Units

### U1. 实现总览优先的人类诊断呈现

**Goal:** 将当前逐项直打的非 JSON 路径改为报告驱动的默认总览，并以 `--verbose` 保留完整诊断。

**Requirements:** R1、R2、R3、R4、R5、R6；AE1、AE2、AE3、AE4、AE5。

**Dependencies:** 无。

**Files:** `src/cli/commands/doctor.js`。

**Approach:** 扩展参数解析与帮助文案识别 `--verbose`。提炼可测试的 human-output formatter：从现有报告归约整体状态、每宿主状态、通用环境待处理项与宿主待处理项；默认仅渲染非通过项及其处置；详细模式在同一总览后追加完整明细。`runDoctor()` 在 `--json` 分支前保留 JSON 优先级，且继续使用 `report.has_error` 决定退出码。没有 `fix` 的事项生成明确的人工处理说明，而不猜测命令或执行变更。

**Patterns to follow:** `buildDoctorReport()` 的集中报告构造、`printDoctorJson()` 的序列化边界，以及当前检查项的 `level`/`message`/可选 `fix` 字段。

**Test scenarios:**

- Covers AE3. 全部检查通过时，默认输出首先说明“可用”，列出每个宿主正常状态，不泄露通过项明细。
- Covers AE1. 仅 Codex 有 `WARNING` 时，默认输出为“可用，但需关注”，问题归因到 Codex 并显示原始修复建议。
- Covers AE2. 宿主或公共检查有 `ERROR` 时，默认输出为“不可用”；公共问题标为通用环境，宿主问题归因到对应宿主。
- Covers AE2. 缺少 `fix` 的非通过项输出人工处理边界与原因，不生成危险或臆测的自动修复命令。
- Covers AE4. `--verbose` 总览后包含公共和宿主的 `PASS`/`WARNING`/`ERROR` 明细。
- Covers AE5. `--json --verbose` 仍只输出 JSON，且退出码与同一报告的 `--json` 一致。

**Verification:** 人类输出只派生自同一份报告；默认屏幕回答三个用户问题，详细模式可追溯所有检查，JSON/退出语义不受影响。

### U2. 锁定输出契约与 CLI 兼容性

**Goal:** 用聚焦单测和现有打包 smoke 覆盖新的人类输出、参数优先级与既有 JSON 合同。

**Requirements:** R1、R2、R3、R4、R5、R6；AE1、AE2、AE3、AE4、AE5。

**Dependencies:** U1。

**Files:** `tests/unit/doctor-output.test.js`（新增）、`tests/unit/doctor-runtime-assets.test.js`（必要时复用现有真实 `runDoctor()` 覆盖）、`tests/smoke/cli-smoke.test.js`。

**Approach:** 让新 formatter 接受构造的报告 fixture，以最小测试成本覆盖三个整体状态、公共/宿主归因、修复/人工处理边界和详细模式；用 `runDoctor()` 或打包 CLI 覆盖 `--verbose` 参数与 JSON 优先级。保留现有 runtime inventory 的 JSON 断言，不以 snapshot 锁死与本需求无关的诊断文本。

**Patterns to follow:** `tests/unit/doctor-runtime-assets.test.js` 对 `console.log`、临时项目和 `runDoctor()` 的隔离方式；`tests/smoke/cli-smoke.test.js` 对打包 CLI JSON 报告的端到端检查。

**Test scenarios:**

- 构造全通过、仅警告、含错误和无修复建议的报告，断言默认行集合及顺序。
- 断言详细模式含默认总览与被默认模式省略的通过检查。
- 断言 `--json --verbose` 可解析为既有报告对象，且不夹杂人类行。
- 在现有 consumer 打包 smoke 中运行一次非 JSON `doctor --<host> --verbose`，验证新 flag 被 CLI 接受并保留成功退出。

**Verification:** 新测试可独立证明人类输出规则；现有 JSON/runtime smoke 继续通过，避免把呈现变更误当成 runtime 检查语义变更。

### U3. 更新可发现的用户文档与发布记录

**Goal:** 让用户知道默认总览、`--verbose` 与 `--json` 分别何时使用，并将本次用户可见 CLI 变化记入 Changelog。

**Requirements:** R5、R6。

**Dependencies:** U1、U2。

**Files:** `README.md`、`README.zh-CN.md`、`docs/05-用户手册/04-常见问题.md`、`CHANGELOG.md`。

**Approach:** 在双语 README 的 doctor 入口用一句话说明默认总览、警告仍可用与 `--verbose`；在用户手册给出默认/详细/JSON 的职责边界和“doctor 不自动修复”的安全说明；按当前 Changelog 格式记录最终行为、兼容性和验证，不宣称修改 generated runtime。

**Test scenarios:**

- 文档明确 `--verbose` 用于完整诊断，`--json` 用于脚本/CI，二者的优先级不产生歧义。
- 文档不承诺 `doctor` 自动修复或修改用户配置。

**Verification:** 阅读 README/FAQ 可选择正确模式；Changelog 格式校验覆盖新增条目。

---

## Verification Contract

- 运行 `npx jest tests/unit/doctor-output.test.js tests/unit/doctor-runtime-assets.test.js --runInBand`，验证输出归约、JSON 兼容和既有 runtime inventory。
- 运行 `npm run typecheck`，确保 CLI 与新增测试语法有效。
- 运行 `npm run test:unit` 与 `npm run test:smoke`，验证完整单元层和打包 CLI 流程。
- 在当前仓库运行 `node bin/spec-first.js doctor --codex`、`node bin/spec-first.js doctor --codex --verbose`、`node bin/spec-first.js doctor --codex --json`；将真实环境诊断视为宿主事实，不把它当成所有 fixture 场景的替代。
- 运行 `git diff --check`；检查变更仅覆盖 U1–U3 的 canonical source、测试、文档、计划及 Changelog，未包含其他 dirty path。

---

## Definition of Done

- [ ] 默认 `doctor` 首屏给出“可用”“可用，但需关注”或“不可用”，并显示每个已检查宿主状态和仅有的待处理项。
- [ ] 每个非通过项都有现有安全修复建议，或明确的人工处理边界与原因；命令不会自动修复或写入项目。
- [ ] `--verbose` 给出总览和完整检查明细。
- [ ] `--json` 字段、机器语义和 `ERROR` 的退出码保持兼容，`--json --verbose` 仍为纯 JSON。
- [ ] U1–U3 的聚焦测试、typecheck、unit、smoke、真实 CLI 检查和 diff 检查已按适用性完成并记录结果。
- [ ] 未手改 generated runtime assets；用户文档和 Changelog 与最终行为一致。
