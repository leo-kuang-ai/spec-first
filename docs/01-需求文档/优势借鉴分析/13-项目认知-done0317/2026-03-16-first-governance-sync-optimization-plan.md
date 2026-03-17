---
title: First 归档收口同步更新优化方案
date: 2026-03-16
author: Codex
status: proposal
version: 1.0
parent: ./2026-03-16-first-runtime-first-global-design.md
---

# First 归档收口同步更新优化方案

> 目标：确保 `06_wrap_up -> 07_release -> 08_done` 在当前与未来实现中，能够自动更新 `first` 的正式 runtime assets、基础 canonical docs、正式专题文档以及条件型正式文档。

---

## 一、问题定义

当前 `07_release / 08_done` 的项目认知治理链已经存在，但它维护的是**旧的 canonical contract**：

1. Runtime 真源只覆盖当前 9 个资产。
2. Docs 自动刷新只覆盖当前 12 个 canonical projection docs。
3. 增量检测和映射规则仍混有旧专题文档名。
4. 正式专题文档与条件型文档尚未进入治理回写闭环。

这会导致一个结构性问题：

> 归档和结束阶段虽然会触发 first 的治理刷新，但刷新结果并不能覆盖新方案中定义的完整文档体系。

换言之，当前机制“有治理动作”，但“治理边界太旧”。

---

## 二、目标

本方案要解决的不是“是否自动更新”，而是“自动更新的覆盖范围与契约是否正确”。

优化后，`06_wrap_up -> 07_release -> 08_done` 必须满足：

1. 能自动写回新的正式 runtime assets。
2. 能自动刷新基础 canonical docs。
3. 能自动刷新正式专题文档。
4. 在满足条件时，能自动刷新条件型正式文档。
5. health、index、governance log、context resolver 使用同一份新 contract。

---

## 三、当前实现的主要缺口

### 3.1 Runtime Contract 仍停留在旧 9 资产模型

当前治理刷新依赖 `FIRST_RUNTIME_ARTIFACTS`，但该列表尚未扩展到新方案中的：

- `api-contracts.json`
- `structure-overview.json`
- `domain-model.json`
- `database-schema.json`（条件型）

结果：

- wrap_up / done 无法把这些资产纳入正式治理写回

### 3.2 Projection Contract 仅覆盖旧 12 文档

当前 `CANONICAL_PROJECTION_DOCS` 只覆盖基础文档，不覆盖：

- `architecture.md`
- `call-graph.md`
- `external-deps.md`
- `local-setup.md`
- `development-guidelines.md`
- `database-er.md`

结果：

- `refresh-docs-from-runtime` 不会自动刷新这些文档

### 3.3 增量检测与治理范围不一致

当前 artifact mapping 里已经出现很多专题文档名，但：

- 它们没有正式 runtime 来源
- 它们不在 projection registry 中
- 它们不在 health / index 闭环中

结果：

- 改动检测会“看到它们”
- 但治理刷新不一定“真正刷新它们”

### 3.4 条件型资产尚无正式治理位

`database-er.md` 已被新方案定义为条件型正式文档，但当前实现里没有：

- `database-schema.json` 的正式注册位
- 条件生成状态
- 条件型 docs 的刷新规则
- 不适用项目的 health 语义

结果：

- 数据库认知能力无法无歧义纳入 07/08 自动治理链

---

## 四、总体优化思路

应按“先扩 contract，再扩治理闭环”的思路同步优化。

核心原则：

1. **治理链不直接感知具体文档名**
   - 治理链应以 runtime assets 为中心
   - 文档是否刷新由 projection registry 决定

2. **正式专题文档也必须进入 projection contract**
   - 它们不能只是“可生成文档”
   - 必须是治理链可识别、可刷新、可记录的正式输出

3. **条件型文档必须有显式状态**
   - 不能简单用“文件是否存在”表达是否适用
   - 必须有统一的正式状态枚举，而不是各处各写一套

4. **07/08 阶段只负责触发治理，不负责特判每种文档**
   - 具体生成规则应下沉到 runtime / projection 层

---

## 五、优化方案

### 5.1 扩展 Runtime Contract

需要把以下资产正式纳入 runtime registry：

基础正式资产：

- `summary.json`
- `role-views.json`
- `stage-views.json`
- `steering.json`
- `conventions.json`
- `critical-flows.json`
- `change-map.json`
- `entry-guide.json`
- `reboot-guide.json`
- `api-contracts.json`
- `structure-overview.json`
- `domain-model.json`

条件型资产：

- `database-schema.json`

优化要求：

1. `FIRST_RUNTIME_ARTIFACTS` 升级为基础资产集合。
2. 增加 `FIRST_CONDITIONAL_RUNTIME_ARTIFACTS`。
3. `index.json` 能表达条件型资产状态：
   - `healthy`
   - `not_applicable`
   - `degraded`
4. `refresh-all` 与 `refresh-docs-from-runtime` 都能识别条件型资产。

### 5.2 扩展 Projection Contract

需要把文档投影分成三组：

基础 canonical docs：

- `README.md`
- `summary.md`
- `role-views.md`
- `stage-views.md`
- `steering.md`
- `conventions.md`
- `critical-flows.md`
- `change-map.md`
- `entry-guide.md`
- `reboot-guide.md`
- `common-playbooks.md`
- `known-risks-and-traps.md`
- `tech-stack.md`
- `api-docs.md`
- `codebase-overview.md`
- `domain-model.md`

正式专题文档：

- `architecture.md`
- `call-graph.md`
- `external-deps.md`
- `local-setup.md`
- `development-guidelines.md`

条件型正式文档：

- `database-er.md`

优化要求：

1. `FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP` 扩展为：
   - 基础投影
   - 专题投影
   - 条件型投影
2. 增加 `FORMAL_TOPIC_PROJECTION_DOCS`
3. 增加 `CONDITIONAL_PROJECTION_DOCS`
4. `CANONICAL_PROJECTION_DOCS` 应升级为“正式 docs 总集合”，而不是只覆盖基础 12 文档。

### 5.3 调整治理回写模型

当前治理分两种写回方式：

- `refresh-all`
- `refresh-docs-from-runtime`

建议升级为三层语义：

1. `refresh-runtime-and-docs`
   - 正式 runtime truth 发生变化时使用
   - 需要同步更新所有适用 docs

2. `refresh-docs-from-runtime`
   - runtime truth 未变，但 docs 漂移时使用

3. `refresh-conditional-docs`
   - 条件型资产适用状态改变时使用

说明：

- 也可以不新增第三个 mode，而是在现有 `refresh-all / refresh-docs-from-runtime` 内部加条件判断
- 但治理日志中必须能看出是否涉及条件型资产刷新

### 5.4 调整 07/08 触发条件

当前 `advance()` 在 `06_wrap_up` 和 `08_done` 会触发 cognition governance。

这部分机制可以保留，但要扩充其建议刷新逻辑：

1. 若变更涉及 runtime source files
   - 刷新基础正式资产
   - 刷新专题 docs
   - 刷新条件型 docs（若适用）

2. 若变更仅涉及 docs projection files
   - 刷新对应 docs
   - 保持 runtime truth 不变

3. 若变更涉及数据库 schema / migration / ORM config
   - 额外评估 `database-schema` 的适用性与刷新需求

### 5.5 调整变更检测与映射规则

当前 `first-artifact-mapping.ts` 中旧专题文档名已存在，但没有 contract 闭环。

建议改成两层映射：

1. **文件 -> runtime assets**
   - 正式识别受影响的真源资产

2. **runtime assets -> docs**
   - 由 projection registry 派生出需要刷新的 docs

这意味着：

- 不再让大量“文件 -> docs 名称”的硬编码映射主导治理
- docs 刷新范围通过 runtime asset 统一计算

### 5.6 为条件型文档引入适用性状态

以 `database-er.md` 为例，必须引入显式适用性机制：

建议正式状态：

- `healthy`
- `not_applicable`
- `degraded`

语义如下：

- `healthy`
  - 生成 `database-schema.json`
  - 投影 `database-er.md`

- `not_applicable`
  - 记录在 index 与 health 中
  - 不生成 `database-er.md`

- `degraded`
  - schema 证据不完整，但部分信息可用
  - 可选择生成弱化版文档或仅记录告警

这样可以避免：

- 非数据库项目被错误判定为缺失文档
- 数据库项目因部分证据缺失直接破坏整个治理闭环

### 5.7 调整健康检查语义

当前健康检查偏向“文件存在 + 状态 healthy”。

新方案要求：

1. 基础正式资产：必须健康
2. 正式专题文档：若配置为默认生成，则应健康
3. 条件型资产：允许 `not_applicable`
4. 条件型文档：仅在条件型资产为 `healthy` 时作为健康要求

也就是说：

- `database-er.md` 缺失不一定是错误
- 前提是 `database-schema` 被判定为 `not_applicable`

### 5.8 调整治理日志与审计输出

`project-cognition-updates.jsonl` 需要记录更细的治理信息。

建议补充字段：

- `updatedRuntimeAssets`
- `updatedBaseDocs`
- `updatedTopicDocs`
- `updatedConditionalDocs`
- `conditionalStatuses`

这样可以在 07/08 阶段后清楚回答：

- 更新了哪些正式真源
- 刷新了哪些专题文档
- 条件型能力是否适用

---

## 六、代码级同步优化清单

需要同步优化的核心文件如下：

### 6.1 Runtime Contract

- `src/core/skill-runtime/first-runtime-types.ts`
- `src/core/skill-runtime/first-runtime-store.ts`
- `src/core/skill-runtime/first-bootstrap.ts`

目标：

- 正式增加新 runtime assets
- 增加条件型资产状态表达

### 6.2 Projection Contract

- `src/core/skill-runtime/first-artifact-mapping.ts`
- `src/core/skill-runtime/first-doc-projection.ts`

目标：

- 正式纳入专题文档和条件型文档
- 从旧 12 文档模型升级到新完整文档模型

### 6.3 Governance / Advance

- `src/core/skill-runtime/first-governance.ts`
- `src/core/process-engine/advance.ts`

目标：

- 让 wrap_up / done 的治理链能识别并刷新完整新体系

### 6.4 Refresh / Context / Health

- `src/core/skill-runtime/first-context.ts`
- `src/cli/commands/first.ts`
- `src/core/skill-runtime/context-resolver.ts`
- `src/core/skill-runtime/first-change-detector.ts`

目标：

- 让 refresh、health、resume、context 注入都与新 contract 对齐

### 6.5 Tests

- `tests/unit/first-artifact-mapping.test.ts`
- `tests/unit/first-doc-projection.test.ts`
- `tests/unit/first-governance.test.ts`
- `tests/integration/first-governance-e2e.test.ts`
- `tests/unit/first-refresh.test.ts`
- `tests/unit/context-resolver.test.ts`

目标：

- 覆盖基础 docs、专题 docs、条件型 docs 的治理刷新闭环

---

## 七、推荐实施顺序

建议按以下顺序同步优化：

1. 先扩 `first-runtime-types/store/bootstrap`
2. 再扩 `first-artifact-mapping/doc-projection`
3. 再改 `first-context/change-detector/cli first`
4. 再改 `first-governance/advance`
5. 最后补 tests

原因：

- 不先扩 contract，治理链无法识别新资产
- 不先扩 projection，归档阶段无法刷新新文档
- 不先改 health/context，系统仍会以旧闭环运行

---

## 八、验收标准

本方案完成后，必须满足：

1. `06_wrap_up -> 07_release -> 08_done` 能刷新新 runtime assets。
2. `refresh-docs-from-runtime` 能刷新基础文档和正式专题文档。
3. 条件型文档在适用时自动生成，在不适用时不报错。
4. `index.json` 与 health check 能准确表达条件型状态。
5. `project-cognition-updates.jsonl` 能看出新文档体系的更新结果。

---

## 九、结论

当前实现不是“没有治理链”，而是“治理链覆盖范围仍停留在旧 contract”。

因此真正需要做的不是重写 07/08 流程，而是：

> **扩展 runtime contract、projection contract、条件型状态表达和治理刷新范围，让现有 wrap_up/done 自动收口机制能够覆盖新的完整文档体系。**
