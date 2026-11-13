---
title: Next Top 3 Runtime Truth Hardening Plan
created: 2026-04-19
status: superseded
owner: engineering
origin: 2026-04-19 dry-run / doctor runnability / asset contract 收口后的下一阶段优先级复盘
scope: doctor evidence 真源统一、runtime 内容级健康检查、init/clean 完整 operation planner
---

# Next Top 3 Runtime Truth Hardening Plan

## 1. 结论

在上一轮完成 `init/clean --dry-run`、高风险 asset anchor guard、`doctor --json` 三态 runnability 之后，接下来最高优先级的 3 个问题是：

1. 统一 `doctor` 的 verification evidence 真源，收紧 `verified` 语义。
2. 把 runtime asset 健康检查从“存在性”升级到“内容级 contract”。
3. 把 `init/clean --dry-run` 从“删除面精确 + 写入面摘要”推进到“完整共享 operation planner”。

这三件事的共同目标不是再加一层流程，而是继续减少“看起来健康 / 实际不可信”的假信号。

## 2. 代码事实基线

### 2.1 `doctor` 目前的 evidence 读取已经出现双真源

当前仓库里已经有 verification evidence 真源：

- `src/context-routing/verification-evidence.js`
- `docs/contracts/verifiers/verification-evidence.schema.json`
- `tests/unit/verification-evidence.test.js`

其 contract 语义是：

- evidence 从 workflow artifact 路径读取
- 经过 schema 过滤和 stage/gate relevance 过滤
- 输出 machine-readable `evidence_items`

但 `src/cli/commands/doctor.js` 现在没有复用这套 contract，而是直接读取：

```text
.spec-first/runtime/verification-evidence.json
```

并只做最小合法性判断。

结论：

- `doctor` 的 `verified` 与 Stage-0/verification 控制面不是同一份真源。
- 当前已经存在 evidence 语义分叉风险。

### 2.2 runtime asset health 仍以存在性检查为主

`src/cli/plugin.js` 当前的 `inspectInstalledAssets()` 只返回：

- `entries`
- `missing`

细分到 `inspectCommands()` / `inspectSkills()` / `inspectAgents()` / `inspectAgentSupportFiles()` 也都只是检查目标路径是否存在。

`src/cli/commands/doctor.js` 的 `runtime_asset_health` 正是建立在这些检查之上。

虽然少数 runtime contract 已有内容级守卫：

- Claude SessionStart hook 漂移检查
- Claude canonical agent reference / unresolved Task agent refs 检查

但大多数 runtime 资产仍然是：

```text
文件在 = 视为健康
```

结论：

- 用户项目 runtime 发生内容漂移时，doctor 仍可能给出 `pass`。
- 这是 install 型 CLI 当前最重要的误报面之一。

### 2.3 `init/clean --dry-run` 仍不是完整 planner

上一轮已经把 destructive side 收口到 `src/cli/state.js`：

- `planManagedAssetRemoval()`
- `planObsoleteManagedAssetRemoval()`
- `planCommandNamespacePrune()`
- `planEmptyManagedRootCleanup()`
- `applyOperationPlan()`

但写入侧仍然不是 planner：

- `src/cli/commands/init.js` 的 `buildInitWriteSummary()` 仍是汇总级 summary
- `src/cli/plugin.js` 的 `syncBundledAssets()` / `syncCommands()` / `syncSkills()` / `syncAgents()` 仍直接写盘
- `clean.js` 对 `CLAUDE.md` / `.claude/settings.json` 的处理仍是 preview 描述 + runtime 函数执行，不是共享 operation

结论：

- 现在的 dry-run 已经有用，但还不等于 preview/apply 完整同构。
- 后续如果写入链继续演化，preview 可信度会再次下降。

## 3. 优先级判断理由

### P0-1. `doctor` evidence 真源统一

这是第一优先级，因为它直接影响 `verified` 的真实性。

如果 `doctor` 和 Stage-0/verification consumption 看的是两份不同 evidence：

- 同一个仓库可能同时被判断为“verified”和“无证据”
- LLM 拿到的 verification 输入会自相矛盾
- 系统边界会从“轻 contract”退化成“多份 contract 并存”

这是比“功能还不够多”更严重的问题。

### P0-2. runtime health 从存在性提升到内容级 contract

这是第二优先级，因为当前 `doctor` 最大的盲点仍在 runtime drift。

source/mirror 现在已经有高风险 anchor guard，但用户真正依赖的是 runtime 安装产物。
如果 runtime 只检查存在性，就会出现：

- source 正确
- docs mirror 正确
- runtime 已漂移
- doctor 仍然报健康

这会直接破坏 CLI 诊断的可信度。

### P0-3. `init/clean` 完整 operation planner

这是第三优先级，因为当前设计已经足够安全，但还不够“完全可信”。

现在：

- 删除面基本已共享 planner
- 写入面仍是高层 summary
- 部分 update/remove 仍是 preview 与 apply 分离实现

这还没有到必须立刻返工的程度，但已经是下一个明显边界缺口。

## 4. 目标与非目标

## 4.1 目标

1. `doctor` 的 `verified` / `simulated` / `not_verified` 统一建立在现有 verification evidence contract 之上。
2. runtime health 对高价值 runtime surfaces 引入内容级 contract 检查。
3. `init/clean` 的 preview 与 apply 共享更完整的 operation graph。

## 4.2 非目标

1. 不把 doctor 变成 workflow orchestrator。
2. 不引入更复杂的状态机。
3. 不要求所有 runtime 资产都 byte-equal 检查。
4. 不把所有 write path 一次性重构成通用事务系统。

## 5. 实施单元

## Unit 1: 统一 `doctor` verification evidence 真源

### 涉及文件

- `src/cli/commands/doctor.js`
- `src/context-routing/verification-evidence.js`
- `docs/contracts/verifiers/verification-evidence.schema.json`
- `tests/unit/doctor-json-contract.test.js`

### 设计

1. `doctor` 不再读取自定义 `.spec-first/runtime/verification-evidence.json` 私有路径。
2. 改为复用现有 verification evidence loader 或抽公共 helper。
3. `workflow_runnability_basis` 至少补齐：
   - `evidence_source`
   - `evidence_present`
   - `evidence_schema_valid`
   - `evidence_freshness`
   - `fallback_reason`
4. `verified` 必须要求：
   - evidence 来源明确
   - schema 合法
   - evidence 未过期

### Done Signals

1. `doctor` 与 Stage-0/verification consumption 不再各读一套 evidence。
2. `verified` 的判定来源可追溯。
3. `doctor-json-contract` 测试能覆盖无证据 / 过期证据 / 合法证据。

## Unit 2: runtime asset health 升级为内容级 contract

### 涉及文件

- `src/cli/plugin.js`
- `src/cli/commands/doctor.js`
- `tests/unit/skills-governance-contracts.test.js`
- 新增 `tests/unit/runtime-asset-integrity.test.js`

### 设计

先只覆盖高价值 surface，不追求全量字节级检查：

1. commands
   - command wrapper 关键 skill path
   - 标题/入口关键锚点
2. workflow skills
   - Stage-0 / verification / route contract 关键锚点
3. runtime transformed assets
   - Claude bare agent rewrite
   - Codex path rewrite

实现方式优先：

- normalized contract fingerprint
或
- anchor-based integrity inspection

不建议直接做全量 byte-equal，因为宿主 transform 本来就会产生预期差异。

### Done Signals

1. runtime drift 不再只靠“文件在不在”判定。
2. `doctor` 的 `runtime_asset_health` 能因为关键内容漂移而降级。
3. 测试能指出具体 surface 漂移，而不是泛化 fail。

## Unit 3: `init/clean` 完整 operation planner

### 涉及文件

- `src/cli/state.js`
- `src/cli/plugin.js`
- `src/cli/commands/init.js`
- `src/cli/commands/clean.js`
- `tests/unit/init-dry-run.test.js`
- `tests/unit/clean-dry-run.test.js`

### 设计

把当前“删除面 planner + 写入面 summary”推进为“更多 operation 类型共享 planner”。

建议新增或收敛的 operation kinds：

- `write_file`
- `update_file`
- `remove_file`
- `remove_dir`
- `ensure_dir`
- `chmod_file`

优先把这些写入链纳入 planner：

1. `syncCommands()`
2. `syncSkills()`
3. `syncAgents()`
4. `adapter.syncRuntimeFiles()`
5. `writeInstructionBootstrap()`
6. `writeLangPolicy()`
7. `writeDeveloperFile()`
8. `writeState()`

本轮不要求真正做原子事务，但要求：

- preview 能精确到 file-level 主要写入面
- apply 尽量消费同一 plan 数据结构

### Done Signals

1. `init --dry-run` 不再只给 summary，而能给高价值 file-level write plan。
2. `clean --dry-run` 的 update/remove 语义与 apply 更接近。
3. preview/apply 漂移风险继续下降。

## 6. 风险

### 风险 1：把 doctor 做成第二个 verification engine

缓解：

- doctor 只消费已有 evidence contract
- 不自己定义第二套 verifier 语义

### 风险 2：runtime content guard 过严

缓解：

- 只守关键 contract anchors
- 不守普通文案和示例 prose

### 风险 3：operation planner 过度抽象

缓解：

- 只覆盖已经存在明确边界的写入链
- 不强行做泛化事务框架

## 7. 推荐执行顺序

1. Unit 1: `doctor` evidence 真源统一
2. Unit 2: runtime 内容级健康检查
3. Unit 3: 完整 operation planner

原因：

- Unit 1 直接修复当前最危险的双真源。
- Unit 2 直接提升 doctor 的真实性。
- Unit 3 在前两者稳定后再推进，避免边界一边改一边漂。

## 8. 自审

这份 plan 与当前代码事实一致：

- evidence 双真源问题已在 `doctor.js` 与 `verification-evidence.js` 并存中出现。
- runtime 健康检查目前确实主要是 presence-only。
- dry-run 当前确实仍是 destructive exact / write summary 的混合状态。

这份 plan 也没有偏离仓库原则：

- 没有新增状态机
- 没有把 CLI 变成强编排器
- 仍然在做“更真实、更稳定、更可追溯的决策输入”
