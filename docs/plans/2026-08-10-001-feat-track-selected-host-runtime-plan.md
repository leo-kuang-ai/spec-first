---
title: Track Selected Host Runtime in User Repositories - Plan
type: feat
date: 2026-08-10
topic: track-selected-host-runtime
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan-bootstrap
execution: code
status: completed
plan_depth: standard
source_snapshot: git:4b2c9522
---

# Track Selected Host Runtime in User Repositories - Plan

## Goal Capsule

- **Objective:** 让用户执行 `spec-first init --<host>` 后，可以提交本次所选宿主生成的 skills、agents、commands 与 deterministic runtime，使团队 clone 后直接获得同一套 spec-first 工作流。
- **Recommended approach:** 直接从目标项目 managed `.gitignore` block 删除全部 generated host runtime patterns，不引入 selected-host Git 状态或 registry 分类字段。init 继续只生成所选宿主，`.gitignore` 只保留确定的 local-only、scratch 与 optional provider artifacts。
- **Authority:** 当前用户已确认 generated host runtime 默认 Git-visible；`src/cli/gitignore-policy.js`、`src/cli/commands/init-project-plan.js`、`src/cli/state.js` 与六宿主 lifecycle tests 约束实现方式。
- **Decision focus:** selected host 只控制本次生成、刷新和清理范围；init 不自动 `git add`、commit、`git rm --cached`，也不新增 `gitDisposition` 或第二套 manifest。
- **Verification focus:** fresh init 后所选 runtime 出现在 `git status`，未选宿主不生成；旧 managed block 升级后 host runtime 不再 ignored；local-only artifacts 继续 ignored；团队自定义 sibling 不被 reset、prune 或 clean 删除。
- **Largest risk / boundary:** 放开 Git visibility 后，已有 hard reset 与 namespace prune 的宽范围删除更容易影响团队资产，因此必须同时收紧到 managed state 与显式兼容清单的 exact ownership。
- **Stop conditions:** managed block 仍含 generated host runtime；init 仍产生 index mutation；未选择宿主被生成、刷新或删除；reset/prune/clean 仍按共享 root 或 `spec-*` 前缀删除；生成内容含绝对路径、凭证或非确定性字段。
- **Execution profile:** Standard。改动横跨 Git policy、init migration、index side effects、removal safety、六宿主 tests 与用户文档，但不新增 CLI 模式、registry 字段或 schema family。
- **Tail ownership:** `spec-work` 负责实现、审查、验证与 closeout；本计划不授权实现代码 mutation、runtime regeneration、commit、push 或 PR。

---

## Product Contract

### Summary

用户项目把 spec-first 作为团队 AI workflow 配置使用时，init 生成的 deterministic host runtime 是可审查、可提交的 delivery projection。selected host 只决定本次生成哪些 projection；spec-first 不再通过目标项目 `.gitignore` 隐藏任何 generated host runtime。

### Problem Frame

当前 init 把六宿主 generated runtime 写入目标项目 `.gitignore`，并对匹配路径执行 `git rm --cached`。这会隐藏团队需要复用的 skills、agents 和 commands，也会把 Git visibility、runtime ownership 与 index mutation 混为同一策略。所需修复可以直接落在现有 gitignore policy、init plan 和 managed state 上，无需新增宿主安装状态或 Git 分类 schema。

### Requirements

**Team-visible runtime**

- R1. 用户执行 `spec-first init --<host>` 后，本次生成的 skills、agents、commands、workflow mirrors、deterministic state、pointer、rule 与 spec-first-owned hook projection 不得被 spec-first managed `.gitignore` block 忽略。
- R2. init 只生成本次选择的宿主 runtime；单宿主选择不得额外生成其他宿主内容。
- R3. init 不得自动执行 `git add`、commit、`git rm --cached` 或其他 Git index mutation。
- R4. 同一次 init 显式选择多个宿主时，生成集合等于 selected host set；未选择宿主的已有文件不得被生成、刷新或删除。

**Local-only policy**

- R5. `.spec-first` local config、session、workspace/workflow runtime、audit/governance/app-audit artifacts 继续忽略。
- R6. 明确的 host scratch 或 local file 可以继续忽略，例如 `.claude/tasks/`、`.claude/worktrees/` 与 `.qoder/settings.local.json`；不得以整个 host root 或可能属于团队的配置目录作为 ignore 边界。
- R7. `.cursor/mcp.json`、`.kiro/settings/`、`opencode.json` 与 `opencode.jsonc` 等可能承载团队配置的文件不由 init 强制忽略，交由用户项目 policy 决定。
- R8. `.codegraph/`、`graphify-out/` 与 `.graphify/` 的 optional provider policy 保持现状，不与 host runtime policy 合并。

**Ownership and migration**

- R9. 升级旧 managed block 时，init 移除全部 generated host runtime patterns；已有 runtime 可能从 ignored 变为 visible，但 init 不修改文件或 staging 状态。
- R10. 现有 runtime-untrack module、operation、result、output 与 i18n contract 完整退役；`.gitignore` 对已 tracked local-only 文件不生效的 Git 语义由升级文档说明。
- R11. inventory runtime 删除必须来自 managed state exact entries；pointer、rule、hook 与 shared-file slice 使用现有 adapter exact path 和 managed-slice identity；legacy cleanup 只使用逐项证明安全的 compatibility list。任何删除都不得由 `spec-*` 前缀、共享 root 或整宿主目录推断。
- R12. `clean --<host>`、obsolete removal、drift repair 与 legacy reset 必须保留未登记的团队 skill、agent 和 command。

**Documentation and compatibility**

- R13. README、用户手册、CLI preview/apply 文案与 tests 必须统一表达“generated host runtime 默认 Git-visible，local-only artifacts 默认忽略，init 不修改 Git index”。
- R14. source-first 原则保持不变：用户仓库中的 runtime 是可提交 projection，durable fix 仍修改 spec-first source/generator，再通过 init 更新 projection。
- R15. spec-first 自身源码仓库继续通过 managed markers 外的 source-checkout-only rules 忽略本地 runtime mirrors；这些规则不得投射到用户项目。

### Key Flows

- F1. **Fresh team install:** 用户在 Git 项目运行 `init --codex` → 只生成 Codex runtime 与 managed state → `.gitignore` 只加入 local-only policy → `git status` 显示 Codex projection，其他宿主 runtime 不出现。
- F2. **Upgrade old ignore policy:** 已有项目含旧 managed block → 新版 init 替换 block → 所有 generated host runtime patterns 消失 → 已有 runtime 变为可 review/stage → init 不改 Git index。
- F3. **Refresh committed projection:** 团队升级 spec-first → init 按 selected host 重建 deterministic runtime → Git diff 展示 projection 更新 → 团队 review 并提交。
- F4. **Safe clean:** 用户运行 `clean --codex` → clean 读取 exact state entries → 删除 spec-first-owned Codex projection → Git 显示可审查 deletion diff → 未登记 sibling 保留。

### Acceptance Examples

- AE1. Given 一个新 Git repo，when `init --codex -y` 完成，then `.agents/skills/spec-plan/SKILL.md` 与 `.codex/spec-first/state.json` 不被 ignore，且 `.claude/skills/spec-plan/SKILL.md` 不存在。
- AE2. Given 旧 managed block 忽略全部 host runtime，when 新版 init 更新 block，then runtime entries 消失，已有 runtime 变为 Git-visible，且没有 `git rm --cached` operation。
- AE3. Given `.agents/skills/spec-company-policy/SKILL.md` 不在 managed state，when init refresh、drift repair 或 clean 运行，then 该目录字节保持不变。
- AE4. Given selected-host runtime 已被 Git 跟踪，when init 重跑，then index membership 保持不变，幂等生成不产生 diff。
- AE5. Given `.spec-first/config.local.yaml`、`.spec-first/sessions/run.json` 与 `.qoder/settings.local.json`，when init 完成，then 三者仍被 ignore。
- AE6. Given `.cursor/mcp.json`、`.kiro/settings/mcp.json` 或 `opencode.json`，when init 完成，then spec-first managed block 不负责忽略这些团队可配置文件。
- AE7. Given `init --claude --codex`，when init 完成，then只生成且暴露 Claude 与 Codex runtime。
- AE8. Given 旧项目已有未选择宿主 runtime，when `init --codex` 迁移 managed block，then旧 runtime 可以变为 visible，但内容不被写入或删除。
- AE9. Given committed selected-host runtime 被 clean，when clean 完成，then只有 state 登记资产显示为删除，团队自定义 sibling 继续存在。

### Success Criteria

- 六宿主 fresh init lifecycle 都证明 selected runtime Git-visible，unselected runtime 不生成。
- 旧 managed block 可以幂等迁移，新 block 不含 generated host runtime pattern。
- local-only、host scratch 与 optional provider patterns 继续按明确清单忽略。
- init 不再产生 `untrack_index` operation 或 runtime-untrack completion claim。
- reset、prune 与 clean 对未登记团队资产有负向回归覆盖。
- 同版本同输入的 init 立即重跑保持 runtime 字节与 Git status 稳定。

### Scope Boundaries

**In scope**

- 用户项目 generated host runtime Git visibility、旧 managed block migration、runtime-untrack retirement、managed removal safety、六宿主 tests、README、用户手册与 CHANGELOG。

**Out of scope**

- 自动 stage 或 commit；按 selected host 动态生成 `.gitignore`；新增 `gitDisposition`、checked-in/local 双模式、runtime manifest schema 或宿主安装状态；改变 provider artifact 默认策略；允许直接手改 projection 作为 durable fix；改变 host loader support claim。

---

## Planning Contract

### Architecture Posture

- **Git policy:** `extend` `src/cli/gitignore-policy.js`，删除 generated host runtime section，只保留确定的 local-only、scratch 与 optional provider entries。
- **Init lifecycle:** `extend` `src/cli/commands/init-project-plan.js`，移除 runtime-untrack composition，保留现有 managed block replacement。
- **Runtime ownership:** `reuse` `src/cli/state.js` 的 exact asset inventory，不新增 registry 字段或第二套 manifest。
- **Removal safety:** `extend` 当前 state-driven removal，删除共享 root 与 namespace-prefix 推断；legacy compatibility 只允许显式列举。

### Evidence and Limitations

- Current source snapshot: `git:4b2c9522`。当前 CLI source 未因本计划修改，工作树包含本计划与 CHANGELOG 的未提交变更。
- `src/cli/gitignore-policy.js` 当前把 generated host runtime、local-only state、host config 与 provider artifacts放在同一 managed policy，并从全部 patterns 派生 runtime-untrack pathspec。
- `src/cli/commands/init-project-plan.js` 当前把 gitignore update 与 runtime-untrack operations 合并到每个 project init write plan。
- `src/cli/state.js` 当前 state 已记录 commands、skills、workflowSkills、agents 与 agentSupportFiles；`planHardResetManagedAssets()` 与 `planCommandNamespacePrune()` 仍包含需要收紧的宽范围删除路径。
- `tests/integration/init-six-host-lifecycle.integration.test.js` 当前断言 generated runtime ignored 且 legacy runtime 被 untrack，是行为迁移的主要 integration owner。
- CodeGraph 只用于 advisory navigation；关键判断已回读 current source/tests。当前只更新计划，未运行实现测试、init、clean 或 generated runtime refresh。
- 未授权 subagent dispatch；本次 plan refinement 由主 agent inline 完成，不声明独立 reviewer coverage。

### Key Technical Decisions

- KTD1. **Generated host runtime 全部 Git-visible。** `(session-settled: user-approved — chosen over selected-host-specific ignore state: init already limits generation to the selected host set, so Git policy does not need to remember host selection.)` 目标项目 managed block 不再包含任何 generated host runtime pattern。
- KTD2. **不新增 Git 分类 schema。** `(session-settled: user-approved — chosen over adding gitDisposition to the platform registry: a local-only allowlist solves the current problem with less durable contract surface.)` Platform registry 继续拥有 host path/rewrite facts，managed state 继续拥有 removal inventory，gitignore policy 只拥有明确 ignore entries。
- KTD3. **Selected host 只控制 generation lifecycle。** 单选或多选只决定本次生成、刷新、检查和 clean 的宿主集合；旧 block migration 可以让其他既有 runtime 变为 visible，但不得修改其内容。
- KTD4. **完整退役自动 runtime untrack。** `(session-settled: user-approved — chosen over retaining local-only index cleanup: init must not mutate Git index, and tracked local files remain a documented user-owned migration decision.)` 删除 module、operation、result、output、i18n 与 tests，不替换为新的 untrack 子系统。
- KTD5. **Exact managed identity 是删除 ownership 地板。** Skills、agents、commands 与 support files 使用 managed state entries；pointer、rule、hook 与 shared-file slice 使用现有 adapter exact path 和 managed-slice identity；legacy cleanup 使用逐项兼容清单。未知 sibling 一律保留。
- KTD6. **迁移改变 visibility，不改变 staging。** init 更新旧 block 后输出用户可行动提示，说明 host runtime 现在可以 review/stage，也说明已经 tracked 的 local-only 文件需要用户自行检查。
- KTD7. **Source-first 与 checked-in projection 并存。** 用户仓库中的 runtime 是 versioned delivery artifact，durable owner 仍是 package source；doctor/init 继续把直接修改 projection 识别为 drift。

### Target Gitignore Boundary

| Category | Target policy | Examples |
| --- | --- | --- |
| Generated host runtime | 不写入 managed block | skills、agents、commands、workflow mirrors、state、pointer、rule、spec-first-owned hooks |
| spec-first local-only | Ignore | `.spec-first/*.local.yaml`、config、audits、workflows、workspace、sessions |
| Definite host scratch/local | Ignore exact paths | `.claude/tasks/`、`.claude/worktrees/`、`.qoder/settings.local.json` |
| Team-configurable host files | User policy | `.cursor/mcp.json`、`.kiro/settings/`、`opencode.json`、`opencode.jsonc` |
| Optional provider artifacts | Keep current policy | `.codegraph/`、`graphify-out/`、`.graphify/` |

### Compatibility and Migration

- 已有项目下一次 init 时自动替换 managed block，host runtime 从 ignored 转为 visible；CHANGELOG 与用户手册说明需要 review/stage。
- 已经 tracked 的 runtime 保持 tracked；已经 tracked 的 local-only 文件也保持 tracked，用户自行决定是否 `git rm --cached`。
- 旧 state 缺失或不可读时，不允许用 broad glob 删除 runtime；实现 fail closed 或只覆盖本次将写入的 exact files。
- `clean` 删除已提交 runtime 会产生 Git deletion diff，这是命令语义，不自动恢复或提交。
- `.gitignore` marker 的重复、缺失、逆序继续按当前 fail-closed 行为处理。
- spec-first 源码 checkout 把 runtime mirror rules 保留在 managed markers 外；target generator 永不复制该 source-checkout-only section。

### Sequencing

1. U1 收窄 target managed gitignore policy 并隔离 source-checkout rules。
2. U2 删除 runtime-untrack 及其输出合同。
3. U3 收紧 reset、prune 与 clean ownership。
4. U4 重写六宿主 lifecycle 与 migration integration coverage。
5. U5 同步用户文档与发布说明并执行完整验证。

### Risks and Mitigations

- **Host config 意外进入提交候选。** 只把确定的 local/scratch paths 留在 managed block；团队可配置文件交由用户 policy，文档提醒 review Git diff，generator 不得写入凭证或绝对路径。
- **旧未选择宿主 runtime 突然可见。** migration 提示说明 visibility 是全局 policy 变化，但 init 不修改这些文件。
- **Tracked local-only 文件继续留在 index。** 文档说明 `.gitignore` 不影响 tracked files，并提供人工检查方式；init 不替用户做 index mutation。
- **旧 removal path 删除团队文件。** U3 是发布前置条件，负向 sibling tests 未通过不得发布。
- **Committed projection diff 较大。** init 仍只生成 selected host，升级作为独立 projection refresh diff review。

---

## Implementation Units

### U1. 放开 generated host runtime

- **Goal:** 让 target managed block 不再忽略任何 generated host runtime，同时保留确定的 local-only policy。
- **Requirements:** R1-R9、R15、AE1、AE2、AE5、AE6、AE8。
- **Dependencies:** None。
- **Files:** `src/cli/gitignore-policy.js`、`.gitignore`、`tests/unit/gitignore-policy.test.js`、`docs/05-用户手册/12-gitignore参考.md`。
- **Approach:** 删除 generated runtime patterns；保留 local-only、scratch 与 provider sections；把本仓库 runtime mirror rules 放在 managed markers 外的 source-checkout-only section。不要从 platform registry 派生 target Git policy。
- **Test Scenarios:** fresh target block 不含 `.claude`、`.codex`、`.agents/skills`、`.cursor`、`.kiro`、`.qoder` 或 `.opencode` generated runtime pattern；local-only 与 exact scratch entries 继续 ignored；team-configurable files 不被 managed block 强制 ignore；旧 valid block 完整替换；重复/unmatched marker 继续拒绝；根仓库 source-checkout-only rules 仍覆盖六宿主 mirrors。
- **Verification:** generated block、根仓库 block 与用户手册 reference 各自满足目标边界，且 marker replacement 保持幂等。

### U2. 删除 runtime-untrack index mutation

- **Goal:** init 不再改变任何文件的 Git index membership。
- **Requirements:** R3、R9、R10、R13、AE2、AE4。
- **Dependencies:** U1。
- **Files:** `src/cli/commands/init-project-plan.js`、`src/cli/runtime-untrack.js`（删除）、`src/cli/state.js`、`src/cli/commands/init-result.js`、`src/cli/commands/init-output.js`、`src/cli/init-i18n.js`、`tests/unit/runtime-untrack.test.js`（删除）、`tests/unit/init-preview.test.js`、`tests/unit/init-apply-failure.test.js`。
- **Approach:** 从 project init plan 移除 untrack composition，删除 module、operation、result/output/i18n contract；preview 不再统计 destructive untrack。迁移文案只解释 visibility 与 tracked-file Git 语义。
- **Test Scenarios:** tracked runtime init 后仍由 `git ls-files` 返回；tracked local-only 文件 index membership 也保持不变；dry-run/apply 不包含 `runtime_untrack` 或 `untrack_index`；Git 不可用不再因 untrack 阻断 init；output 不宣称自动 untrack。
- **Verification:** production source 与用户文案不再包含 runtime-untrack consumer 或完成 claim，init operation plan 没有 Git index mutation。

### U3. 将 runtime 删除收紧到 exact ownership

- **Goal:** reset、prune、obsolete removal 与 clean 只处理 spec-first 明确拥有的 paths。
- **Requirements:** R11、R12、R14、AE3、AE9。
- **Dependencies:** None；必须在发布行为切换前完成。
- **Files:** `src/cli/state.js`、`src/cli/commands/init-project-plan.js`、`src/cli/commands/clean.js`、`tests/unit/managed-removal-ownership.test.js`、`tests/unit/opencode-adapter.test.js`、相关 adapter lifecycle tests。
- **Approach:** 移除 dedicated/shared root 的整目录删除；inventory assets 使用 previous/next state，pointer、rule、hook 与 shared-file slice 使用现有 exact managed identity，legacy cleanup 使用 explicit allowlist；state 缺失或不可读时 fail closed；empty parent 仅在实际为空时删除。
- **Test Scenarios:** state 登记资产可以 clean；未登记 `spec-company-*` skill/agent/command 保留；shared root sibling 保留；legacy/unreadable state 不触发 broad deletion；drift repair 只重建 exact managed paths；empty parent cleanup 不删除含用户文件的目录。
- **Verification:** 所有删除 operation 都能回溯到 state entry、exact managed-slice identity 或逐项兼容条目，负向 sibling tests 覆盖 init、drift repair 与 clean。

### U4. 重写六宿主 Git lifecycle integration

- **Goal:** 用真实 Git repo 验证 selected-host generation、runtime visibility、migration 与 index stability。
- **Requirements:** R1-R12、AE1-AE9。
- **Dependencies:** U1-U3。
- **Files:** `tests/integration/init-six-host-lifecycle.integration.test.js`、`tests/unit/init-workspace-contract.test.js`、必要的 host adapter tests。
- **Approach:** 将“generated runtime ignored/untracked”矩阵替换为“selected runtime visible、unselected runtime absent、local-only ignored、zero index mutation”矩阵；覆盖旧 block migration、未选择宿主旧 runtime、tracked preservation、team custom sibling、clean deletion diff 与 immediate re-init。
- **Test Scenarios:** 六个单宿主分别只生成自己的 runtime；双选只生成两个宿主；旧 block migration 让已有 runtime visible 而不改内容/index；local-only 与 scratch 继续 ignored；team-configurable files 不被 managed policy强制 ignore；clean 只产生 managed deletion；父 workspace 与 child repo 不串写。
- **Verification:** integration assertions 同时检查文件存在性、`git check-ignore`、`git ls-files`、内容 hash 与二次 init 幂等状态。

### U5. 同步用户契约与发布验证

- **Goal:** 让安装、协作、升级和 source-first 说明与简化后的默认一致。
- **Requirements:** R13-R15。
- **Dependencies:** U1-U4。
- **Files:** `README.md`、`README.en.md`、`README.zh-CN.md`、`docs/05-用户手册/01-快速开始.md`、`docs/05-用户手册/05-最佳实践.md`、`docs/05-用户手册/06-本地源码安装.md`、`docs/05-用户手册/08-三种开发模式.md`、`docs/05-用户手册/12-gitignore参考.md`、`CHANGELOG.md`、相关 docs contract tests。
- **Approach:** 解释 generated host runtime 是 checked-in delivery projection；selected host 只控制 generation scope；local-only 继续 ignored；旧 block migration 可能暴露已有其他宿主 runtime；tracked local-only 文件由用户自行检查。
- **Test Scenarios:** 三语言入口语义一致；reference block 与 generator byte-parity；无文本继续声称 generated host runtime 默认 ignore/untrack；安装示例不要求生成或提交所有宿主；升级说明不暗示 init 会修改 index。
- **Verification:** 文档 contract tests、typecheck、skill governance、package build 与主测试链路全部按 final tree 运行并记录真实结果。

---

## Verification Contract

| Gate | Command | Covers | Required signal |
| --- | --- | --- | --- |
| Git policy | `npx jest --runTestsByPath tests/unit/gitignore-policy.test.js tests/unit/init-preview.test.js tests/unit/init-apply-failure.test.js --runInBand` | U1-U2 | generated runtime visible、local-only ignored、无 index mutation |
| Ownership safety | `npx jest --runTestsByPath tests/unit/managed-removal-ownership.test.js tests/unit/opencode-adapter.test.js --runInBand` | U3 | 未登记 sibling 保留、exact managed assets 可清理 |
| Six-host lifecycle | `npx jest --runTestsByPath tests/integration/init-six-host-lifecycle.integration.test.js tests/unit/init-workspace-contract.test.js --runInBand` | U4 | selected generation、visibility、migration、tracked preservation、idempotency |
| Static quality | `npm run typecheck` | U1-U5 | CommonJS 与 scripts 语法检查通过 |
| Skill governance | `npm run lint:skill-entrypoints` | U5 | 入口治理未因文档调整漂移 |
| Package | `npm run build` | U5 | 发布包内容可生成 |
| Main regression | `npm test` | U1-U5 | unit、smoke、integration 主链路通过；若存在基线失败，逐项证明与本变更无关且不声称全绿 |

验证 claim 必须来自 final source tree。Git policy 单测证明 managed block 边界，六宿主 integration 证明实际 generation、visibility 与 index stability，ownership tests 证明团队 sibling 不被删除。实现若不修改 skill/agent prose，不要求 fresh-source eval。

---

## Definition of Done

- generated host skills、agents、commands、workflow mirrors、deterministic state、pointer、rule 与 spec-first-owned hooks 不再进入 target managed `.gitignore` block。
- init 只生成 selected host set，未选择宿主不被生成、刷新或删除。
- `.gitignore` managed block 只保留确定的 local-only、scratch 与 optional provider entries，不引入 registry Git classification。
- spec-first 根仓库通过 managed markers 外的 source-checkout-only rules 继续忽略六宿主 runtime mirrors。
- init 不执行 `git rm --cached`、不自动 stage、也不输出虚假的 untrack 完成信息。
- reset、prune、drift repair 与 clean 只能删除 exact owned assets，团队自定义 sibling 保留。
- 六宿主单选、多选、旧 block migration、未选择宿主旧 runtime、tracked preservation、local-only policy、clean 与 idempotency scenarios 都有 deterministic coverage。
- README、三语言入口、用户手册和 CHANGELOG 明确 checked-in projection、selected generation 与 source-first 的区别。
- 所有必需验证按 final tree 运行并记录真实结果；未运行或失败的 gate 明确披露。
- 未手改 generated runtime；未引入 `gitDisposition`、第二套 manifest、宿主选择状态机、local-only untrack 子系统或废弃代码。
