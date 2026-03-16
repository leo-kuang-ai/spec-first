---
title: First Runtime-First 代码实施任务清单
date: 2026-03-16
author: Codex
status: proposal
version: 1.0
parent: ./2026-03-16-first-runtime-first-开发执行任务文档.md
---

# First Runtime-First 代码实施任务清单

> 目标：将 `first` 的 runtime-first 重构落到具体代码文件、实现任务、测试任务和验收动作，供工程开发直接执行。

---

## 一、实施原则

1. 先改 contract，再改 renderer，再改治理链，再改 docs。
2. 每一组代码任务完成后，必须补对应测试，再进入下一组。
3. 不做 quick / deep 兼容，不保留 legacy 旁路逻辑。
4. 所有正式 docs 和 runtime assets 必须通过同一 registry 收口。

---

## 二、任务总览

| 模块 | 目标 | 主要文件 |
|------|------|----------|
| Runtime Types & Store | 建立新 runtime contract | `first-runtime-types.ts`, `first-runtime-store.ts` |
| Bootstrap | 生成新 assets | `first-bootstrap.ts` |
| Artifact Mapping | 建立正式 docs 总集合与映射 | `first-artifact-mapping.ts` |
| Doc Projection | 渲染基础/专题/条件文档 | `first-doc-projection.ts` |
| Governance & Change Detection | 打通 07/08 自动刷新闭环 | `first-governance.ts`, `first-change-detector.ts`, `first-context.ts`, `first-resume.ts` |
| CLI & Consumption | 对外口径与下游消费一致 | `first.ts`, `context-resolver.ts` |
| Tests | 锁住新 contract | runtime/projection/governance 相关测试文件 |

---

## 三、任务清单

### Task 1：重构 Runtime Types

**目标**

为 12 个基础 runtime assets 和 1 个条件型资产建立正式类型定义。

**文件**

- 修改：`src/core/skill-runtime/first-runtime-types.ts`

**实现内容**

1. 定义基础 runtime asset 的类型：
   - `summary`
   - `roleViews`
   - `stageViews`
   - `steering`
   - `conventions`
   - `criticalFlows`
   - `changeMap`
   - `entryGuide`
   - `rebootGuide`
   - `apiContracts`
   - `structureOverview`
   - `domainModel`
2. 定义条件型 `databaseSchema` 类型。
3. 定义条件型状态枚举：
   - `healthy`
   - `not_applicable`
   - `degraded`
4. 删除旧 quick / deep、legacy 相关类型语义。

**测试**

- 新增或修改相关类型测试/fixture 校验。

**完成标准**

1. 新 contract 可在编译期表达完整资产集合。
2. 不再存在旧资产数量和旧状态语义。

### Task 2：重构 Runtime Store

**目标**

让 runtime store 成为唯一资产注册中心。

**文件**

- 修改：`src/core/skill-runtime/first-runtime-store.ts`

**实现内容**

1. 注册基础 runtime assets 集合。
2. 注册条件型 runtime assets 集合。
3. 增加统一读取、写入、列举接口。
4. 明确 `index.json` 如何记录：
   - asset 名称
   - 状态
   - 健康度
   - 条件型适用性
5. 删除 `modules.json` 的单独注册或遗留处理。

**测试**

- store 读写测试
- 条件型状态序列化测试

**完成标准**

1. 所有正式 assets 都能在 store 层被识别。
2. 非正式文件不会被当成正式资产处理。

### Task 3：重构 Bootstrap

**目标**

让 bootstrap 真正生成新 contract 的资产集合。

**文件**

- 修改：`src/core/skill-runtime/first-bootstrap.ts`

**实现内容**

1. 接入新生成函数或生成步骤：
   - `api-contracts.json`
   - `structure-overview.json`
   - `domain-model.json`
2. 增加 `database-schema.json` 的条件生成判断。
3. 删除 `modules.json` 写入逻辑。
4. 确保 bootstrap 完成后写入完整 `index.json`。
5. 保持 `refreshFirstDocsFromRuntime()` 与新 contract 一致。

**测试**

- bootstrap 生成资产数量测试
- 条件型数据库项目与非数据库项目 fixture 测试

**完成标准**

1. bootstrap 输出与新 runtime registry 一致。
2. 非数据库项目不会生成错误的 `database-schema.json`。

### Task 4：重构 Artifact Mapping

**目标**

建立正式 docs 总集合和正式投影映射。

**文件**

- 修改：`src/core/skill-runtime/first-artifact-mapping.ts`

**实现内容**

1. 定义正式 docs 总集合常量：
   - `CANONICAL_PROJECTION_DOCS` 或等价正式总集合
   - `FORMAL_TOPIC_PROJECTION_DOCS`
   - `CONDITIONAL_PROJECTION_DOCS`
2. 扩展 `FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP` 覆盖：
   - 16 个基础 canonical docs
   - 5 个正式专题文档
   - 1 个条件型正式文档
3. 清理旧 deep 文档、ghost outputs 和 legacy 特判。
4. 调整文件变更映射，改为：
   - 文件 -> runtime assets
   - runtime assets -> docs

**测试**

- registry 完整性测试
- no ghost outputs 测试
- no unprojected docs 测试

**完成标准**

1. 所有正式 docs 都能回溯到 runtime 来源。
2. 不再存在旧文档名残留映射。

### Task 5：重构 Doc Projection

**目标**

补全基础、专题、条件型文档的 projection renderer。

**文件**

- 修改：`src/core/skill-runtime/first-doc-projection.ts`

**实现内容**

1. 为以下文档实现或重写 renderer：
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
   - `architecture.md`
   - `call-graph.md`
   - `external-deps.md`
   - `local-setup.md`
   - `development-guidelines.md`
   - `database-er.md`
2. 删除 legacy docs 特判逻辑。
3. 为专题文档实现局部降级：
   - 字段不足时显示“暂无足够证据”
   - 不得自由脑补
4. 为条件型文档实现状态判断：
   - `healthy` 时生成
   - `not_applicable` 时不生成
   - `degraded` 时不生成正式文档，只记录告警与降级原因

**测试**

- projection snapshot 测试
- 条件型文档生成/不生成测试
- 专题文档最低内容 contract 测试

候选测试文件：

- `tests/unit/first-doc-projection.test.ts`
- `tests/unit/first-artifact-mapping.test.ts`
- `tests/unit/skill-runtime.test.ts`

**完成标准**

1. 所有正式 docs 都能从 runtime 重建。
2. 条件型文档行为与状态语义一致。

### Task 6：重构 Governance

**目标**

让 07/08 收口链路按新 contract 自动维护认知资产。

**文件**

- 修改：`src/core/skill-runtime/first-governance.ts`

**实现内容**

1. 将治理刷新边界切到新 runtime registry。
2. 让治理日志记录：
   - `updatedRuntimeAssets`
   - `updatedBaseDocs`
   - `updatedTopicDocs`
   - `updatedConditionalDocs`
   - `conditionalStatuses`
3. 统一条件型状态语义：
   - `healthy`
   - `not_applicable`
   - `degraded`
4. 让 `06_wrap_up -> 07_release -> 08_done` 能刷新基础文档、专题文档、条件型文档。

**测试**

- governance refresh 测试
- wrap_up / done 自动刷新测试

候选测试文件：

- `tests/unit/first-governance.test.ts`
- `tests/integration/first-governance-e2e.test.ts`
- `tests/unit/first-runtime-observability.test.ts`

**完成标准**

1. 07/08 阶段后，治理日志与 index 可追踪完整刷新结果。
2. 新增文档不会被遗漏在治理闭环之外。

### Task 6A：重构治理日志 Schema 与写入点

**目标**

让 `project-cognition-updates.jsonl` 成为新治理 contract 的正式审计输出。

**文件**

- 修改：`src/core/skill-runtime/first-governance.ts`
- 修改：`src/core/skill-runtime/first-runtime-observability.ts`
- 可能修改：`src/core/skill-runtime/first-context.ts`

**实现内容**

1. 为治理日志新增字段：
   - `updatedRuntimeAssets`
   - `updatedBaseDocs`
   - `updatedTopicDocs`
   - `updatedConditionalDocs`
   - `conditionalStatuses`
2. 明确各写回模式下的日志填充规则。
3. 让条件型状态在日志中可追踪、可审计。
4. 保证旧日志字段与新字段在迁移期内可被测试识别。

**测试**

- governance log schema 测试
- end-to-end updates log 测试

候选测试文件：

- `tests/unit/first-runtime-observability.test.ts`
- `tests/unit/first-governance.test.ts`
- `tests/integration/first-governance-e2e.test.ts`

**完成标准**

1. `project-cognition-updates.jsonl` 能表达基础、专题、条件型文档的刷新结果。
2. 条件型状态变化可在日志中稳定回放与断言。

### Task 7：重构 Change Detection

**目标**

让增量更新与正式 contract 对齐。

**文件**

- 修改：`src/core/skill-runtime/first-change-detector.ts`
- 可能修改：`src/core/skill-runtime/first-context.ts`

**实现内容**

1. 从“文件 -> docs 名称”的旧式映射切换到“文件 -> runtime assets”。
2. 由 runtime asset 决定需要刷新的 docs。
3. 增加数据库 schema / migration / ORM config 的条件型资产检测。
4. 保证专题文档不再靠硬编码 docs 名称驱动。

**测试**

- changed files -> runtime assets 测试
- runtime assets -> docs 派生测试
- 条件型数据库变更测试

候选测试文件：

- `tests/unit/first-change-detector.test.ts`
- `tests/unit/first-artifact-mapping.test.ts`
- `tests/unit/first-context.test.ts`

**完成标准**

1. 增量刷新范围与正式 contract 一致。
2. 不再出现“检测到了文档名，但治理不认识它”的情况。

### Task 8：重构 Resume / Context

**目标**

让恢复提示和上下文注入与新 contract 一致。

**文件**

- 修改：`src/core/skill-runtime/first-resume.ts`
- 修改：`src/core/skill-runtime/context-resolver.ts`
- 可能修改：`src/core/skill-runtime/first-context.ts`

**实现内容**

1. 删除旧三资产 / 旧 12 文档口径。
2. 按消费方向注入 runtime slices：
   - `spec/design`
   - `task/plan/orchestrate`
   - `code/review/verify`
   - `onboarding`
3. 对条件型资产使用 optional/fallback 语义。
4. 确保恢复提示能覆盖：
   - 基础文档
   - 专题文档
   - 条件型状态

**测试**

- context resolver 注入测试
- resume 文案/结构测试

候选测试文件：

- `tests/unit/context-resolver.test.ts`
- `tests/unit/first-resume.test.ts`
- `tests/unit/first-context.test.ts`
- `tests/unit/first-context-stage-views.test.ts`

**完成标准**

1. 恢复提示和 context pack 不再引用旧 contract。
2. 下游 skill 可稳定消费新资产。

### Task 9：重构 CLI 与 Health

**目标**

让对外口径和内部检测完全一致。

**文件**

- 修改：`src/cli/commands/first.ts`
- 修改：相关 health check 代码

**实现内容**

1. 删除 quick / deep 相关 CLI 描述。
2. 更新 `first` help，改为单一标准模式。
3. 更新 health 检查范围：
   - 基础正式资产必须健康
   - 默认生成的正式专题文档必须健康
   - 条件型资产允许 `not_applicable`
4. health 结果应能识别：
   - 正式 docs 总集合
   - 条件型状态
   - degraded 状态

**测试**

- CLI help snapshot 测试
- health 状态矩阵测试

候选测试文件：

- `tests/unit/first-command.test.ts`
- `tests/unit/skill-runtime.test.ts`
- `tests/unit/first-runtime-repo-assets.test.ts`

**完成标准**

1. CLI 不再承诺旧模式和旧文档数。
2. health 规则与治理方案一致。

### Task 10：重构 Skill 文档与 References

**目标**

让文档层契约与代码实现目标一致。

**文件**

- 修改：`skills/spec-first/00-first/SKILL.md`
- 修改：`skills/spec-first/00-first/references/*.md`

**实现内容**

1. 删除 quick / deep。
2. 删除 Agent 直出 Markdown 真源叙述。
3. 明确 runtime-first 执行链：
   - 证据抽取
   - schema 固化
   - runtime 写入
   - docs projection
   - health / governance
4. 补齐专题文档、条件型文档和质量门禁说明。

**测试**

- 文档一致性人工审查
- no ghost outputs 检查

**完成标准**

1. Skill 文档与代码目标 contract 无冲突。
2. 对外说明不再误导实现边界。

---

## 四、推荐执行顺序

1. Task 1：Runtime Types
2. Task 2：Runtime Store
3. Task 3：Bootstrap
4. Task 4：Artifact Mapping
5. Task 5：Doc Projection
6. Task 6：Governance
7. Task 6A：治理日志 Schema 与写入点
8. Task 7：Change Detection
9. Task 8：Resume / Context
10. Task 9：CLI / Health
11. Task 10：Skill 文档与 References

说明：

1. Task 4 必须先于 Task 5，否则 renderer 没有正式 registry 可依赖。
2. Task 6 和 Task 6A 必须建立在 Task 1-5 完成后。
3. Task 7-9 必须建立在治理 contract 已收口后。
4. Skill 文档可与代码改造并行收口，但最终验收必须最后统一执行。

---

## 五、测试清单

### 5.1 必测项

1. runtime registry 完整性测试
2. projection registry 完整性测试
3. bootstrap 输出测试
4. projection snapshot 测试
5. no orphan runtime files 测试
6. no unprojected docs 测试
7. no ghost outputs 测试
8. 条件型状态矩阵测试
9. governance 自动刷新测试
10. governance log schema 测试
11. context resolver 注入测试
12. CLI help 与 health 测试

### 5.2 场景测试

1. 非数据库项目：
   - `database-schema.json` 不生成或状态为 `not_applicable`
   - `database-er.md` 不作为健康缺失
2. 数据库项目：
   - `database-schema.json` 生成
   - `database-er.md` 正常投影
3. 条件不足项目：
   - 专题文档可 `degraded`
   - 不得输出臆断内容
4. wrap_up / done 场景：
   - 触发 runtime 和 docs 刷新
   - 日志和 index 状态一致

---

## 六、验收输出

每个任务完成后，至少输出：

1. 修改的代码文件列表
2. 新增或修改的测试列表
3. 通过的验证命令
4. 尚未解决的问题或降级点

最终验收时，必须输出：

1. 正式 runtime assets 注册表
2. 正式 docs 总集合
3. 条件型状态定义
4. 测试通过证据
5. `06_wrap_up -> 07_release -> 08_done` 端到端验证结果

---

## 七、结论

这份任务清单的目的不是解释方案，而是让开发实施具备直接执行性：

> 先收口 runtime contract，再补 projection registry，再打通治理链，最后完成文档层和对外契约收口。

如果按这份任务清单推进，`first` 的 runtime-first 重构就可以从“方案阶段”进入“代码实施阶段”。
